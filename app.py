from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
import time
from dotenv import load_dotenv
from google import genai
import sys

print("PYTHON PATH:", sys.executable)

# -------------------------
# LOAD ENV + GEMINI SETUP
# -------------------------

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
claude_api_key = os.getenv("CLAUDE_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=api_key)

# Claude client -- optional, only needed for Claude model selection
try:
    import anthropic
    claude_client = anthropic.Anthropic(api_key=claude_api_key) if claude_api_key else None
except ImportError:
    claude_client = None
    print("Warning: anthropic package not installed. Claude model unavailable.")

# -------------------------
# FLASK INIT
# -------------------------

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DB_NAME = 'veribias.db'

# -------------------------
# DATABASE INIT
# -------------------------

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS analysis
                 (id TEXT PRIMARY KEY,
                  timestamp INTEGER,
                  title TEXT,
                  summary TEXT,
                  biasScore REAL,
                  category TEXT,
                  sensationalismScore REAL,
                  tonality TEXT,
                  biasedPhrases TEXT,
                  originalTextSnippet TEXT,
                  detailedBiases TEXT,
                  highlightedText TEXT,
                  framingScore REAL,
                  confidence REAL,
                  fullText TEXT,
                  source TEXT)''')

    # Migrate existing DBs that don't have the new columns yet
    for col, coltype in [("fullText", "TEXT"), ("source", "TEXT")]:
        try:
            c.execute(f"ALTER TABLE analysis ADD COLUMN {col} {coltype}")
        except Exception:
            pass  # Column already exists

    conn.commit()
    conn.close()

init_db()

# -------------------------
# PROMPTS -- one per bias type
# -------------------------

PROMPTS = {

    "framing": {
        "name": "Framing Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect FRAMING BIAS.

DEFINITION: Framing bias is the use of word choices or narrative structure that favour one political perspective over another, without stating anything factually false. It operates through loaded language, not lies.

DO NOT flag: sensationalism, negativity, omissions, or source choices. Those are separate bias types. Only flag word-level or phrase-level framing choices here.

SIGNAL EXAMPLES:
- "tax relief" (implies taxes are a burden) vs neutral "tax cuts"
- "illegal aliens" vs neutral "undocumented migrants"
- "riot" vs neutral "protest" or "demonstration"
- "job creators" vs neutral "wealthy individuals" or "high earners"
- "pro-life" / "pro-choice" vs neutral "anti-abortion" / "pro-abortion-rights"
- "government handouts" vs neutral "welfare payments"

SCORING GUIDE:
1 = No framing. Neutral language used consistently throughout.
2 = Mild. One or two loaded words that lean one direction; overall language is balanced.
3 = Moderate. A clear pattern of loaded language favouring one side across multiple paragraphs.
4 = Strong. Loaded language is consistent and sustained throughout the article.
5 = Extreme. The article reads as political messaging. Neutral description is absent.

WORKED EXAMPLE -- score 4:
Article excerpt: "The radical left's open borders agenda has flooded American communities with illegal aliens, devastating local taxpayers and emboldening criminal networks."
Output:
{{
  "score": 4,
  "confidence": 91,
  "reasoning": "Three phrases in one sentence all carry strong right-wing framing: 'radical left', 'open borders agenda', and 'illegal aliens'. The pattern is consistent, not incidental.",
  "evidence": [
    {{
      "phrase": "radical left's open borders agenda",
      "explanation": "'Radical left' is a political attack label. 'Open borders agenda' misrepresents most immigration policy positions as extreme.",
      "neutral_alternative": "the Democratic Party's immigration proposals"
    }},
    {{
      "phrase": "illegal aliens",
      "explanation": "Legally loaded term. 'Undocumented migrants' or 'undocumented immigrants' is the neutral equivalent.",
      "neutral_alternative": "undocumented migrants"
    }}
  ]
}}

PHRASE INSTRUCTION: Return the SHORTEST phrase that contains the framing signal -- a word or short phrase, not a full sentence. If the signal is a single word, return that word in context (3-6 words around it).

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words explaining the pattern, not just repeating the score>",
  "evidence": [
    {{
      "phrase": "<shortest phrase containing the framing signal>",
      "explanation": "<why this specific phrase is framing bias>",
      "neutral_alternative": "<neutral replacement for this phrase only>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "political_direction": {
        "name": "Political Direction",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to determine the POLITICAL DIRECTION of any bias in this article.

You are NOT scoring how biased the article is. You are ONLY determining which direction the bias leans. Use the full -100 to +100 scale. Do not cluster near 0 unless the article is genuinely centrist.

SCALE ANCHORS:
-100 = Far Left: explicitly advocates socialist/progressive positions, uses movement language, treats right-wing views as illegitimate
-70  = Left: consistent progressive framing, sympathetic sourcing from left-aligned organisations, uses left-coded terminology throughout
-40  = Center-Left: mild but consistent left lean; mostly neutral but word choices and source selection favour progressive framing
0    = Center: genuinely balanced. Both sides framed with equal respect and skepticism.
+40  = Center-Right: mild but consistent right lean; mostly neutral but favours conservative framing and sources
+70  = Right: consistent conservative framing, sympathetic to right-aligned sources, uses right-coded terminology throughout
+100 = Far Right: explicitly advocates conservative/nationalist positions, treats left-wing views as illegitimate

LEFT SIGNALS: "undocumented immigrants", "reproductive rights", "gun safety", "climate crisis", "systemic racism", "communities of colour", quoting NGOs/unions/activists without challenge

RIGHT SIGNALS: "illegal aliens", "pro-life", "tax relief", "radical left", "open borders", "law and order", "hardworking taxpayers", quoting think tanks/law enforcement/business groups without challenge

WORKED EXAMPLE -- score +65:
Article about immigration uses "illegal aliens" three times, quotes only Border Patrol officials, describes migrants as "flooding" the country, and frames enforcement as "protecting American communities". Direction score: +65 (Right).

Return ONLY valid JSON with no markdown:
{{
  "direction_score": <integer -100 to +100>,
  "direction_label": "<Far Left | Left | Center-Left | Center | Center-Right | Right | Far Right>",
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: name the specific signals that determined the direction>"
}}

Article Title: {title}
Article Text: {text}"""
    },

    "negativity": {
        "name": "Negativity Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect NEGATIVITY BIAS.

DEFINITION: Negativity bias is the disproportionate emphasis on negative aspects, threats, failures, or worst-case outcomes -- even when positive or neutral information is equally available and relevant.

DO NOT flag: loaded political word choices (that is framing bias), sensationalist language (that is sensationalism). Only flag the disproportionate selection and emphasis of negative information here.

SIGNAL EXAMPLES:
- Reporting only policy failures while ignoring documented successes
- Opening with worst-case projections without mentioning the base-case or likely outcomes
- Selecting decline statistics when improvement statistics are equally valid
- Consistently describing ambiguous situations as threats or crises
- Ending every section with a negative consequence, even when positives are available

SCORING GUIDE:
1 = Balanced. Article includes negative, positive, and neutral information proportionately.
2 = Mild. Slight negative lean; mostly representative but positive information underweighted.
3 = Moderate. Negative information consistently dominates; positive context present but minimised.
4 = Strong. Article is almost entirely negative. Positive information absent or dismissed.
5 = Extreme. Every claim is framed negatively regardless of what the underlying facts support.

WORKED EXAMPLE -- score 3:
An economic article reports three consecutive quarters of job losses prominently, mentions record employment in one clause, then returns to housing cost increases, wage stagnation, and recession risk. The underlying data is mixed but the article reads as uniformly bleak.
Output: score 3, evidence phrase: "wages have stagnated even as costs surge", neutral_alternative: "wages have grown more slowly than costs in recent quarters".

PHRASE INSTRUCTION: Return the SHORTEST phrase that shows the negative framing -- the specific word or clause that tilts the sentence negative, not the full paragraph.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: explain the pattern of negative selection, not just individual words>",
  "evidence": [
    {{
      "phrase": "<shortest phrase showing the negative framing>",
      "explanation": "<why this reflects disproportionate negativity, not just accurate reporting>",
      "neutral_alternative": "<balanced version of this phrase>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "confirmation": {
        "name": "Confirmation Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect CONFIRMATION BIAS.

DEFINITION: Confirmation bias in journalism is the structural tendency to present evidence that confirms a predetermined conclusion while minimising, dismissing, or omitting contradicting evidence. It is about the architecture of the argument, not word choice.

DO NOT flag: loaded language (framing bias), source selection patterns (selection bias), or omissions of context (omission bias). Those are separate categories. Focus here on how the article handles evidence that confirms vs challenges its implied conclusion.

SIGNAL EXAMPLES:
- Quoting experts who confirm the narrative as authoritative; dismissing those who contradict it as "controversial" or "disputed"
- Treating ambiguous data as conclusive proof of one interpretation
- Presenting the conclusion in the opening paragraph, then assembling only supporting evidence
- Acknowledging a counterargument in one sentence, then spending four paragraphs rebutting it with confirming evidence
- Framing confirmatory studies as definitive while framing contradictory studies as preliminary

SCORING GUIDE:
1 = Open. Evidence presented regardless of direction; article tolerates uncertainty.
2 = Mild. Slight tendency to favour one interpretation; contradictions present but briefly treated.
3 = Moderate. Clear narrative being confirmed; contradictions acknowledged but consistently minimised.
4 = Strong. Article structured to prove a conclusion; contradictions absent or framed as fringe.
5 = Extreme. Only confirming evidence present. Reads as a brief for one side.

WORKED EXAMPLE -- score 4:
Article about vaccine safety: opens with three paragraphs on rare adverse events, quotes two scientists who share concerns, mentions "some studies show no link" in a single subordinate clause, then returns to more adverse event data. The clinical consensus is not mentioned.
Evidence phrase: "some studies show no link", explanation: "This single clause is the only acknowledgment of the clinical consensus; everything else confirms the adverse-event narrative."

PHRASE INSTRUCTION: The most useful evidence for confirmation bias is often the phrase where contradicting evidence IS acknowledged but immediately minimised -- find that phrase. If no contradicting evidence appears at all, note a phrase where it should have appeared.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: describe the structural pattern, not just individual phrases>",
  "evidence": [
    {{
      "phrase": "<phrase where contradicting evidence is minimised, or where it should appear>",
      "explanation": "<why this reflects selective evidence architecture>",
      "neutral_alternative": "<how a balanced treatment would handle this>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "anchoring": {
        "name": "Anchoring Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect ANCHORING BIAS.

DEFINITION: Anchoring bias occurs when an article establishes an initial reference point -- a number, claim, or characterisation -- that disproportionately shapes how the reader interprets everything that follows, regardless of whether that anchor is representative or justified.

DO NOT flag: sensationalist language (sensationalism), loaded word choices (framing), or missing context (omission). Only flag cases where the specific placement or framing of an opening claim functions as a distorting anchor.

SIGNAL EXAMPLES:
- Opening with the most extreme statistic available, making moderate figures seem small by comparison
- Establishing the article's subject as a villain or hero in the first sentence, colouring all subsequent information
- Introducing a large cost figure without immediately providing the relevant baseline or comparison
- Using "as many as X" or "at least X" to set a ceiling or floor that frames subsequent figures
- Framing an outcome as a catastrophe in the headline, then walking it back in paragraph 8

SCORING GUIDE:
1 = No anchoring. Information ordered neutrally; opening claims are proportionate and contextualised.
2 = Mild. One anchoring element that slightly colours interpretation but does not dominate.
3 = Moderate. The anchor clearly shapes how subsequent information reads; a different opening would change the article's feel significantly.
4 = Strong. The anchor is the organising principle of the article; balanced interpretation is difficult.
5 = Extreme. The anchor is manipulative. The rest of the article exists to reinforce it.

WORKED EXAMPLE -- score 3:
Article opens: "With over 50,000 deaths already attributed to the policy, analysts are now questioning..." The 50,000 figure is the highest estimate from one study; the median estimate is 12,000. Opening with the maximum anchors the reader before any context is provided.
Evidence phrase: "over 50,000 deaths already attributed", neutral_alternative: "estimates of deaths attributed to the policy range from 12,000 to 50,000 depending on methodology".

PHRASE INSTRUCTION: The anchor is almost always in the opening paragraph or headline. Return the specific claim or figure that functions as the anchor.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: explain what the anchor is and how it distorts interpretation of what follows>",
  "evidence": [
    {{
      "phrase": "<the specific anchoring claim or figure>",
      "explanation": "<why this functions as a distorting anchor>",
      "neutral_alternative": "<a contextualised version of this opening claim>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "attribution": {
        "name": "Attribution Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect ATTRIBUTION BIAS.

DEFINITION: Attribution bias occurs when an article applies different standards of explanation to comparable behaviour by different groups -- attributing the same action to character or ideology in one group while attributing it to circumstance or systemic factors in another.

DO NOT flag: general loaded language (framing bias) or in-group/out-group language (separate category). Only flag cases where the SAME TYPE OF BEHAVIOUR receives asymmetric causal explanation depending on who is doing it.

SIGNAL EXAMPLES:
- Politician A's policy failure explained as personal incompetence; Politician B's identical failure explained as systemic constraints
- Violence by Group X attributed to their ideology or culture; violence by Group Y attributed to poverty, mental illness, or provocation
- Protests by favoured group described as "demonstrations"; protests by disfavoured group described as "mobs" or "riots"
- Passive voice for in-group agency ("mistakes were made"); active voice for out-group agency ("they attacked")
- Quoting in-group members' intentions at face value; speculating about out-group members' hidden motives

SCORING GUIDE:
1 = Consistent. Same causal standards applied to all groups throughout.
2 = Mild. One instance of asymmetric attribution; may be incidental.
3 = Moderate. A clear double standard visible across two or more comparisons.
4 = Strong. Systematic asymmetry throughout the article -- one group's actions are always explained charitably, the other's are not.
5 = Extreme. The article consistently exculpates one group and pathologises the other.

WORKED EXAMPLE -- score 3:
Article covers two protests on the same day. Pro-government protesters are described as "concerned citizens who gathered peacefully to voice their views". Anti-government protesters are described as "agitators who disrupted the city". Same behaviour; opposite framing of character and intent.
Evidence phrase: "agitators who disrupted", neutral_alternative: "protesters who gathered in opposition".

PHRASE INSTRUCTION: Return the phrase that shows the asymmetric treatment -- ideally one that contrasts directly with how the comparable group is described elsewhere in the same article.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: identify the two groups and explain the asymmetry>",
  "evidence": [
    {{
      "phrase": "<phrase showing asymmetric attribution>",
      "explanation": "<what the asymmetry is and which comparable behaviour it contrasts with>",
      "neutral_alternative": "<consistent version applying the same standard>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "selection": {
        "name": "Selection Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect SELECTION BIAS.

DEFINITION: Selection bias is the pattern of which facts, sources, statistics, and voices are included in an article -- and which are systematically excluded. It shapes the narrative through presence and absence, not through word choice.

DO NOT flag: how sources are described (attribution bias), loaded language (framing bias), or what context is missing from individual claims (omission bias). Focus here on the overall pattern of who and what was chosen to appear in the article.

SIGNAL EXAMPLES:
- Quoting only sources from one side of a debate (e.g. only government officials, or only critics)
- Selecting statistics from one dataset when multiple datasets with different results are available
- Covering events that support one narrative while ignoring comparable events that contradict it
- Choosing which experts to quote -- and from which institutions
- Featuring personal stories that are emotionally representative of one position only

SCORING GUIDE:
1 = Balanced. Sources, statistics, and perspectives represent the full range of relevant views.
2 = Mild. Slight imbalance in sourcing; one perspective marginally over-represented.
3 = Moderate. Clear pattern: one side gets more voices, more credible sources, or more space.
4 = Strong. Article almost entirely sourced from one side. Opposing voices absent or tokenistic.
5 = Extreme. Entirely one-sided sourcing. No attempt to represent alternative perspectives.

WORKED EXAMPLE -- score 4:
Immigration article quotes five Border Patrol agents, two Republican senators, and one anonymous "administration official". No migrants, immigration lawyers, advocacy organisations, or Democratic voices are quoted. The sourcing pattern is not incidental -- it structures the entire article.
Evidence phrase: "[quotes Border Patrol agent X, Y, Z, senators A, B]", neutral_alternative: "include voices from affected communities and legal advocates alongside enforcement perspectives".

PHRASE INSTRUCTION: For selection bias, the evidence is often a sourcing pattern rather than a single phrase. Return the quote attribution or the description of sources used (e.g. "according to Border Patrol officials") that best illustrates the selection pattern.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: describe the overall sourcing pattern and what is systematically missing>",
  "evidence": [
    {{
      "phrase": "<quote attribution or source description that illustrates the selection pattern>",
      "explanation": "<why this sourcing choice reflects systematic selection bias>",
      "neutral_alternative": "<what balanced sourcing would include instead>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "sensationalism": {
        "name": "Sensationalism",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect SENSATIONALISM.

DEFINITION: Sensationalism is the use of dramatic, emotionally charged, or exaggerated language to provoke a strong reaction rather than to inform accurately. It is about tone and word choice, not political direction.

DO NOT flag: politically loaded language (framing bias) or negative information selection (negativity bias). Sensationalism can appear in politically neutral articles. Focus on language that prioritises emotional impact over factual precision.

SIGNAL EXAMPLES:
- "Bombshell", "explosive", "shocking", "devastating", "terrifying" -- dramatic adjectives where neutral ones would suffice
- "Crisis" applied to situations that are serious but not acute emergencies
- Vague alarming claims: "experts warn it could be catastrophic"
- Hyperbolic verbs: "slams", "torches", "destroys", "obliterates" for routine criticism
- Superlatives without basis: "the worst ever", "unprecedented" for common events
- Headlines that overstate what the article actually reports

SCORING GUIDE:
1 = No sensationalism. Measured, precise, factual tone throughout.
2 = Mild. One or two dramatic words; overall tone is restrained and informative.
3 = Moderate. Emotional language appears regularly and is not incidental to the reporting.
4 = Strong. Drama consistently prioritised over precision; the tone shapes how facts are received.
5 = Extreme. Tabloid-level. Emotional impact is the primary goal; factual precision is secondary.

WORKED EXAMPLE -- score 4:
Headline: "BOMBSHELL: Explosive new report DEVASTATES president in shocking corruption scandal"
Body uses: "explosive revelations", "damning evidence", "shocking allegations", "sources say it could bring down the administration".
None of these add factual content. The score is 4 because the pattern is consistent throughout, not just in the headline.
Evidence phrase: "explosive revelations", neutral_alternative: "new findings".

PHRASE INSTRUCTION: Return the single most egregious sensationalist phrase -- the word or short phrase that most clearly prioritises drama over factual content.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: describe the pattern of sensationalist language, noting whether it is incidental or systematic>",
  "evidence": [
    {{
      "phrase": "<the most sensationalist word or short phrase>",
      "explanation": "<why this specific word or phrase prioritises drama over factual precision>",
      "neutral_alternative": "<the factual, undramatic equivalent>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "false_balance": {
        "name": "False Balance",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect FALSE BALANCE.

DEFINITION: False balance occurs when an article presents two positions as equally credible or equally supported by evidence when they are not -- giving fringe, minority, or discredited views the same weight as mainstream, well-evidenced, or consensus positions.

DO NOT flag: cases where genuine disagreement exists between credible experts. Only flag cases where the article treats positions as equivalent when the evidence strongly favours one.

SIGNAL EXAMPLES:
- Presenting a climate scientist and a climate-change denier as equally credible
- "Scientists disagree" when 97% of relevant experts hold one position
- Giving a discredited study the same paragraph space as a meta-analysis of 50 studies
- Interviewing one credentialled expert and one conspiracy theorist as "both sides"
- "Some say X, others say Y" framing when X is the consensus and Y is a fringe position

SCORING GUIDE:
1 = Proportionate. Weight given to each position reflects actual evidence and expert consensus.
2 = Mild. Slight over-representation of minority view but not misleading to a careful reader.
3 = Moderate. Minority position elevated beyond its evidential standing in a way that could mislead.
4 = Strong. Fringe view presented as equivalent to mainstream consensus throughout.
5 = Extreme. Fringe view given more space or credibility than the consensus position.

WORKED EXAMPLE -- score 4:
Climate article: two paragraphs quoting an IPCC scientist on warming evidence, two paragraphs quoting a fossil fuel industry spokesperson questioning the models. The juxtaposition implies equivalent credibility. The article does not note that 97% of climate scientists share the first position.
Evidence phrase: "others question whether the models can be trusted", neutral_alternative: "a small number of researchers, some with fossil fuel industry funding, dispute the modelling assumptions".

PHRASE INSTRUCTION: Return the phrase that creates the false equivalence -- usually the "on the other hand" or "others say" construction that elevates the minority position.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: identify the two positions and explain why treating them as equivalent is misleading>",
  "evidence": [
    {{
      "phrase": "<the phrase that creates the false equivalence>",
      "explanation": "<why presenting these positions as equivalent misrepresents the actual evidence>",
      "neutral_alternative": "<proportionate framing that reflects the actual balance of evidence>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "omission": {
        "name": "Omission Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect OMISSION BIAS.

DEFINITION: Omission bias occurs when an article leaves out information that a well-informed reader would consider material -- information whose absence systematically favours one interpretation and whose presence would change how the article reads.

DO NOT flag: information that is merely interesting but non-material, or omissions that are clearly explained by space constraints. Only flag cases where the missing information is directly relevant to the article's central claim and its absence appears to serve a narrative purpose.

SIGNAL EXAMPLES:
- Reporting a statistic without the baseline that contextualises it ("crime rose 40%" without noting the prior year was historically low)
- Covering a protest's violence without mentioning the event that triggered the protest
- Reporting a politician's new statement without noting their directly contradictory statement from last month
- Describing a policy's costs without any mention of its intended or actual benefits
- Reporting an accusation without noting that the accused denied it or that no charges were filed

SCORING GUIDE:
1 = Complete. All material context present; any gaps are clearly space-related.
2 = Mild. One minor omission; the article is broadly representative without it.
3 = Moderate. A relevant piece of context is absent that would meaningfully change how the central claim reads.
4 = Strong. Multiple key omissions that together systematically favour one interpretation.
5 = Extreme. The article is actively misleading through what it leaves out.

WORKED EXAMPLE -- score 3:
Article reports "violent crime in the city rose 35% last year." It does not mention that the prior year had the lowest violent crime rate in 30 years, making a 35% increase return rates to near the historical average. The omitted baseline changes the story entirely.
Evidence phrase: "violent crime in the city rose 35% last year", neutral_alternative: "violent crime rose 35% last year, returning rates close to the historical average after a record low in the prior year".

PHRASE INSTRUCTION: Return the specific claim in the article where the material context is missing -- the sentence that would read differently if the omitted information were included.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: state what is omitted, why it is material, and how its absence shapes the interpretation>",
  "evidence": [
    {{
      "phrase": "<the claim where material context is missing>",
      "explanation": "<what specific information is omitted and why it matters>",
      "neutral_alternative": "<the same claim written with the omitted context included>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "ingroup_outgroup": {
        "name": "In-group/Out-group Bias",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to detect IN-GROUP/OUT-GROUP BIAS.

DEFINITION: In-group/out-group bias occurs when an article uses systematically different language to describe comparable groups -- humanising one group and othering, dehumanising, or threatening-ifying another. It operates through asymmetric language choices applied to comparable people or situations.

DO NOT flag: general political framing (framing bias) or asymmetric causal explanations (attribution bias). Focus specifically on language that treats comparable groups with different levels of humanity, complexity, or sympathy.

SIGNAL EXAMPLES:
- Humanising language for one group ("families", "workers", "communities", first names) vs dehumanising language for another ("illegals", "hordes", "swarms", demographic labels only)
- In-group violence described as isolated incidents; out-group violence described as characteristic of the whole group
- In-group individuals given personal backstory and motivations; out-group individuals described only by demographics or affiliation
- "Our" community, "our" values, "our" country -- pronoun choices that implicitly exclude
- Describing out-group members' actions as threats and in-group members' identical actions as legitimate

SCORING GUIDE:
1 = Consistent. All groups described with equivalent humanity, complexity, and neutrality.
2 = Mild. Slight language difference but not dehumanising; may be incidental.
3 = Moderate. Clear pattern of warmer, more humanising language for one group across the article.
4 = Strong. Systematic humanisation of one group and othering of another throughout.
5 = Extreme. Dehumanising or threatening language used consistently for the out-group.

WORKED EXAMPLE -- score 4:
Article about a border crossing: US Border Patrol agents are described individually by name, quoted discussing their families, and described as "protecting their communities". Migrants are referred to collectively as "the group", "the individuals", and "the illegal crossers" with no names, no personal details, and no direct quotes.
Evidence phrase: "the illegal crossers", neutral_alternative: "the migrants" or "the people crossing the border".

PHRASE INSTRUCTION: Return the phrase that most clearly demonstrates the asymmetric treatment -- ideally one that contrasts directly with how the comparable group is described elsewhere in the article.

Return ONLY valid JSON with no markdown:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 45 words: identify the two groups and describe the specific language asymmetry>",
  "evidence": [
    {{
      "phrase": "<phrase showing dehumanising or othering language>",
      "explanation": "<what language asymmetry this reflects and which group is treated differently>",
      "neutral_alternative": "<consistent version using equivalent language for both groups>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "strengths": {
        "name": "Writing Strengths",
        "prompt": """You are an expert media bias analyst. Your ONLY task is to identify NEUTRAL, WELL-WRITTEN, or BALANCED phrases in this article.

You are looking for phrases that demonstrate good journalistic practice -- neutral language, balanced framing, factual precision, transparent sourcing, or appropriate acknowledgment of uncertainty.

SIGNAL EXAMPLES:
- "The government announced a new policy" (factual, no editorial judgment)
- "Both parties expressed concern about the legislation" (balanced)
- "According to official figures released Tuesday" (precise sourcing)
- "Analysts disagree on the long-term impact" (honest uncertainty)
- "The statement could not be independently verified" (transparency)
- "The report, which has not been peer-reviewed, suggests..." (appropriate qualification)

Return 2 to 5 phrases. Only include genuinely good examples -- phrases that a journalism ethics textbook would cite as model practice. Do not include phrases that are merely neutral by default.

Return ONLY valid JSON with no markdown:
{{
  "strengths": [
    "<exact phrase from article demonstrating neutral or balanced writing>"
  ]
}}

Article Title: {title}
Article Text: {text}"""
    }
}

# -------------------------
# HELPERS
# -------------------------

def run_single_prompt(bias_key: str, title: str, text: str, model: str = "gemini") -> dict:
    """
    Run one bias-specific prompt against the selected LLM.
    model: "gemini" (default) or "claude"
    Temperature is fixed at 0 for reproducibility.
    """
    prompt = PROMPTS[bias_key]["prompt"].format(title=title, text=text)

    if model == "claude":
        if not claude_client:
            raise ValueError("Claude API key not configured. Add CLAUDE_API_KEY to .env")

        response = claude_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            temperature=0.0,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()

    else:
        # Default: Gemini
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.0,
                "top_p": 1.0,
                "max_output_tokens": 8192,
            }
        )
        raw = response.text.strip()
        print(f"[Gemini raw response for {bias_key}]: {raw[:300]}")

    # Strip markdown code fences if Gemini wrapped the JSON
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        result = json.loads(raw)
    except Exception:
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start == -1 or end == 0:
            # Truncated response — return safe fallback instead of crashing
            print(f"Truncated/unparseable response for {bias_key}: {raw[:100]}")
            return {
                "score": None,
                "confidence": 0,
                "reasoning": "Response was truncated. Try again.",
                "evidence": [],
                "bias_type": PROMPTS[bias_key]["name"],
                "bias_key": bias_key,
                "model_used": "Claude" if model == "claude" else "Gemini",
                "error": "truncated"
            }
        result = json.loads(raw[start:end])

    result["bias_type"] = PROMPTS[bias_key]["name"]
    result["bias_key"] = bias_key
    result["model_used"] = "Claude" if model == "claude" else "Gemini"
    return result


def build_highlighted_text(text: str, evidence: list) -> str:
    """
    Wraps flagged phrases in the original article text with <mark> tags.
    Only replaces the first occurrence of each phrase to avoid over-marking.
    """
    highlighted = text
    for item in evidence:
        phrase = item.get("phrase", "").strip()
        if phrase and phrase in highlighted:
            explanation = item.get("explanation", "").replace('"', "'")
            highlighted = highlighted.replace(
                phrase,
                f'<mark data-explanation="{explanation}">{phrase}</mark>',
                1
            )
    return highlighted


def direction_score_to_category(direction_score: int) -> str:
    """
    Maps a -100 to +100 direction score to a BiasCategory label.
    Thresholds are intentionally wide -- most articles are not extreme.
    """
    if direction_score <= -70:
        return "Far Left"
    elif direction_score <= -30:
        return "Left"
    elif direction_score <= 30:
        return "Center"
    elif direction_score <= 70:
        return "Right"
    else:
        return "Far Right"


# -------------------------
# API ROUTES
# -------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"})


@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    """
    Main analysis endpoint. Runs prompts sequentially -- one per bias type.

    Now runs by default:
      1. political_framing  -- intensity score 1-5
      2. political_direction -- left/right score -100 to +100 (fixes the slider)
      3. sensationalism     -- intensity score 1-5

    Request body:
    {
      "text": "...",
      "title": "...",
      "bias_types": ["political_framing", "political_direction", "sensationalism"]
    }
    """
    try:
        data = request.get_json()
        text = data.get("text", "").strip()
        title = data.get("title", "Untitled Article")
        model = data.get("model", "gemini")  # "gemini" or "claude"

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Run all bias prompts by default (10 total)
        requested_biases = data.get(
            "bias_types",
            ["framing", "political_direction", "negativity", "confirmation",
             "anchoring", "attribution", "selection", "sensationalism",
             "false_balance", "omission", "ingroup_outgroup", "strengths"]
        )

        valid_biases = [b for b in requested_biases if b in PROMPTS]
        if not valid_biases:
            return jsonify({"error": "No valid bias types requested"}), 400

        # Run each prompt one at a time
        results = {}
        for bias_key in valid_biases:
            try:
                print(f"Running prompt: {bias_key}")
                results[bias_key] = run_single_prompt(bias_key, title, text, model)
                time.sleep(0.5)
            except Exception as e:
                print(f"Error on {bias_key}: {e}")
                results[bias_key] = {
                    "score": None,
                    "confidence": 0,
                    "reasoning": "Analysis failed for this bias type.",
                    "evidence": [],
                    "bias_type": PROMPTS[bias_key]["name"],
                    "bias_key": bias_key,
                    "error": str(e)
                }

        # Primary framing result
        primary       = results.get("framing", {})
        framing_score = primary.get("score", 1)
        evidence      = primary.get("evidence", [])

        # Direction result
        direction    = results.get("political_direction", {})
        direction_score = (
            direction.get("direction_score")
            or direction.get("score")
            or direction.get("political_direction_score")
            or 0
        )
        direction_score = max(-100, min(100, int(direction_score)))
        direction_label = direction.get("direction_label", direction_score_to_category(direction_score))

        # Sensationalism
        sensationalism_score = (results.get("sensationalism", {}).get("score") or 0)

        # Strengths
        strengths = results.get("strengths", {}).get("strengths", [])

        # Build highlighted text from ALL detected bias evidence combined
        SKIP_KEYS = {"political_direction", "strengths"}
        all_evidence = []
        for k, v in results.items():
            if k not in SKIP_KEYS and (v.get("score") or 0) > 1:
                all_evidence.extend(v.get("evidence", []))

        highlighted = build_highlighted_text(text, all_evidence)

        # Biased phrases from framing prompt
        biased_phrases = [
            {
                "phrase": e.get("phrase", ""),
                "reason": e.get("explanation", ""),
                "suggestedAlternative": e.get("neutral_alternative", "")
            }
            for e in evidence
        ]

        # All detected biases with score > 1, excluding direction and strengths
        SKIP_KEYS = {"political_direction", "strengths"}
        detailed_biases = [
            {
                "type":         v.get("bias_type", ""),
                "key":          k,
                "score":        v.get("score", 0),
                "presenceScore": round((v.get("score") or 0) / 5 * 100),
                "reasoning":    v.get("reasoning", ""),
                "confidence":   v.get("confidence", 0),
                "evidence":     v.get("evidence", [])
            }
            for k, v in results.items()
            if k not in SKIP_KEYS
            and v.get("score") is not None
            and (v.get("score") or 0) > 1
        ]

        mapped_response = {
            "summary":             primary.get("reasoning", ""),
            "framingScore":        framing_score,
            "confidence":          primary.get("confidence", 0),
            "biasScore":           direction_score,
            "category":            direction_score_to_category(direction_score),
            "directionLabel":      direction_label,
            "directionConfidence": direction.get("confidence", 0),
            "sensationalismScore": sensationalism_score,
            "tonality":            "Neutral",
            "biasedPhrases":       biased_phrases,
            "detailedBiases":      detailed_biases,
            "originalTextSnippet": text[:500],
            "highlightedText":     highlighted,
            "strengths":           strengths,
            "modelUsed":           "Claude" if model == "claude" else "Gemini",
        }

        return jsonify(mapped_response)

    except Exception as e:
        print("ANALYZE ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/analysis', methods=['POST'])
def save_analysis():
    """Persist a completed analysis result to SQLite."""
    try:
        data = request.get_json()
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()

        c.execute('''INSERT OR REPLACE INTO analysis VALUES
                     (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (
                      data['id'],
                      data['timestamp'],
                      data['title'],
                      data.get('summary', ''),
                      data.get('biasScore', 0),
                      data.get('category', ''),
                      data.get('sensationalismScore', 0),
                      data.get('tonality', ''),
                      json.dumps(data.get('biasedPhrases', [])),
                      data.get('originalTextSnippet', ''),
                      json.dumps(data.get('detailedBiases', [])),
                      data.get('highlightedText', ''),
                      data.get('framingScore', 0),
                      data.get('confidence', 0),
                      data.get('fullText', ''),
                      data.get('source', ''),
                  ))

        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 201

    except Exception as e:
        print("DB SAVE ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """Return all saved analyses, newest first."""
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('SELECT * FROM analysis ORDER BY timestamp DESC')
        rows = c.fetchall()
        conn.close()

        columns = [
            'id', 'timestamp', 'title', 'summary', 'biasScore', 'category',
            'sensationalismScore', 'tonality', 'biasedPhrases',
            'originalTextSnippet', 'detailedBiases', 'highlightedText',
            'framingScore', 'confidence', 'fullText', 'source'
        ]

        results = []
        for row in rows:
            item = dict(zip(columns, row))
            item['biasedPhrases'] = json.loads(item['biasedPhrases'] or '[]')
            item['detailedBiases'] = json.loads(item['detailedBiases'] or '[]')
            results.append(item)

        return jsonify(results)

    except Exception as e:
        print("HISTORY ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/analysis/<id>', methods=['DELETE'])
def delete_analysis(id):
    """Delete a single analysis by ID."""
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("DELETE FROM analysis WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/evaluate', methods=['GET'])
def evaluate_ground_truth():
    """
    Run all ground truth articles through the political framing prompt
    and return a human vs AI comparison. Used for thesis evaluation (Chapter 4).
    """
    try:
        from ground_truth import GROUND_TRUTH
    except ImportError:
        return jsonify({
            "error": "ground_truth.py not found. Create it with your annotated articles."
        }), 404

    try:
        from ground_truth import GROUND_TRUTH, get_consensus_score
    except ImportError:
        return jsonify({
            "error": "ground_truth.py not found. Create it with your annotated articles."
        }), 404

    results = []
    for article in GROUND_TRUTH:
        # Skip articles with no text or no human score yet
        if not article.get("text", "").strip():
            continue
        human_score = get_consensus_score(article)
        if human_score is None:
            continue

        try:
            ai = run_single_prompt("framing", article["title"], article["text"])
            ai_score = ai.get("score") or 0
            diff = abs(human_score - ai_score)

            results.append({
                "id":            article["id"],
                "title":         article["title"],
                "source":        article.get("source", ""),
                "topic":         article.get("topic", ""),
                "human_score":   human_score,
                "ai_score":      ai_score,
                "difference":    diff,
                "exact_match":   diff == 0,
                "within_1":      diff <= 1,
                "ai_confidence": ai.get("confidence", 0),
                "ai_reasoning":  ai.get("reasoning", ""),
                "human_notes":   article["human_scores"]["political_framing"].get("notes", ""),
            })

            time.sleep(0.5)

        except Exception as e:
            print(f"Eval error on {article.get('id')}: {e}")
            results.append({
                "id":    article.get("id"),
                "title": article.get("title"),
                "error": str(e)
            })

    valid = [r for r in results if "error" not in r]
    if not valid:
        return jsonify({"error": "All evaluations failed", "details": results}), 500

    summary = {
        "total_articles":    len(valid),
        "exact_match_rate":  round(sum(r["exact_match"] for r in valid) / len(valid), 3),
        "within_1_rate":     round(sum(r["within_1"]    for r in valid) / len(valid), 3),
        "avg_difference":    round(sum(r["difference"]   for r in valid) / len(valid), 2),
        "avg_ai_confidence": round(sum(r["ai_confidence"] for r in valid) / len(valid), 1),
    }

    return jsonify({"summary": summary, "results": results})


# -------------------------
# FRONTEND ROUTES
# -------------------------

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


# -------------------------
# RUN SERVER
# -------------------------

if __name__ == '__main__':
    print("🚀 VeriBias Server running on http://localhost:5000")
    app.run(debug=True, port=5000)