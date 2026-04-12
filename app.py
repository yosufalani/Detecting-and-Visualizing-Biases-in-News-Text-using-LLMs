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

# Claude client — optional, only needed for Claude model selection
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
# PROMPTS — one per bias type
# -------------------------

PROMPTS = {

    "framing": {
        "name": "Framing Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze FRAMING BIAS.

Framing bias occurs when word choices or narrative structure favor one perspective
over another without stating anything factually false.

EXAMPLES:
- "Tax relief" vs "tax cuts" — the first implies taxes are a burden
- "Illegal aliens" vs "undocumented immigrants" vs "migrants"
- Describing a protest as a "riot" vs a "demonstration"
- "Job creators" vs "the wealthy" for the same group
- "Government spending" vs "public investment"

SCORING GUIDE:
1 = No framing bias. Fully neutral language throughout.
2 = Mild. One or two loaded words, overall balanced.
3 = Moderate. Clear pattern leaning one direction.
4 = Strong. Consistent one-sided framing throughout.
5 = Extreme. Reads as messaging, not journalism.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it is framing bias>",
      "neutral_alternative": "<neutral version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "political_direction": {
        "name": "Political Direction",
        "prompt": """You are an expert media bias analyst. Your only task is to determine
the POLITICAL DIRECTION of any bias found in this article.

You are NOT scoring how biased the article is. You are ONLY determining which
direction the bias leans, if any. Scale: -100 (Far Left) to +100 (Far Right).

LEFT signals: progressive framing, sympathetic to regulation/immigration/labor,
terms like "undocumented immigrants", "reproductive rights", "gun safety".

RIGHT signals: conservative framing, sympathetic to deregulation/border control/military,
terms like "illegal aliens", "pro-life", "tax relief", "radical left".

Return ONLY this JSON:
{{
  "direction_score": <integer -100 to +100>,
  "direction_label": "<Far Left | Left | Center-Left | Center | Center-Right | Right | Far Right>",
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>"
}}

Article Title: {title}
Article Text: {text}"""
    },

    "negativity": {
        "name": "Negativity Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze NEGATIVITY BIAS.

Negativity bias occurs when an article disproportionately focuses on negative
aspects, threats, failures, or bad outcomes — even when positive or neutral
information is equally relevant or available.

EXAMPLES:
- Covering only failures of a policy while ignoring successes
- Leading with worst-case scenarios without mentioning likely outcomes
- Using negative emotional language where neutral language would suffice
- Selecting statistics that emphasize decline over improvement
- Consistently framing ambiguous situations as threats or problems

SCORING GUIDE:
1 = Balanced. Positive, negative, and neutral information treated equally.
2 = Mild. Slight negative lean but broadly representative.
3 = Moderate. Negative framing dominates but some balance present.
4 = Strong. Consistently negative. Positive information minimized or omitted.
5 = Extreme. Entirely negative framing regardless of actual events.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it reflects negativity bias>",
      "neutral_alternative": "<more balanced version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "confirmation": {
        "name": "Confirmation Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze CONFIRMATION BIAS.

Confirmation bias in journalism occurs when an article selectively presents
information that confirms a pre-existing narrative or conclusion, while
downplaying or omitting contradicting evidence.

EXAMPLES:
- Presenting only evidence that supports a predetermined conclusion
- Treating confirming sources as authoritative and contradicting sources as fringe
- Framing ambiguous data as conclusive proof of one interpretation
- Ignoring studies or events that complicate the article's implied argument
- Structuring the article so the conclusion is assumed from the opening paragraph

SCORING GUIDE:
1 = No confirmation bias. Evidence presented openly regardless of direction.
2 = Mild. Slight tendency to favor one interpretation but contradictions acknowledged.
3 = Moderate. Clear narrative being confirmed. Contradictions minimized.
4 = Strong. Article is structured to prove a conclusion. Contradictions absent.
5 = Extreme. Only confirming evidence included. Reads as advocacy.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it reflects confirmation bias>",
      "neutral_alternative": "<more open-ended version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "anchoring": {
        "name": "Anchoring Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze ANCHORING BIAS.

Anchoring bias occurs when an article establishes an initial reference point
(a number, claim, or framing) that disproportionately influences how subsequent
information is interpreted by the reader.

EXAMPLES:
- Opening with an extreme statistic that makes moderate figures seem small
- Introducing the most dramatic claim first, making other claims seem minor by comparison
- Using a specific number as a baseline without justifying why that baseline was chosen
- Framing a policy cost as "only X" or "as much as X" to set an emotional anchor
- Establishing a villain or hero in the opening that colors the rest of the article

SCORING GUIDE:
1 = No anchoring. Information introduced in a neutral, contextualised order.
2 = Mild. One anchoring element but it does not strongly distort interpretation.
3 = Moderate. Anchoring clearly shapes how subsequent information reads.
4 = Strong. The anchor dominates and makes balanced interpretation difficult.
5 = Extreme. The entire article is structured around a manipulative anchor.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it functions as an anchor>",
      "neutral_alternative": "<more contextualised version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "attribution": {
        "name": "Attribution Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze ATTRIBUTION BIAS.

Attribution bias occurs when an article applies different standards of explanation
to different groups — attributing the same behavior to character flaws in one
group while excusing it as circumstance in another.

EXAMPLES:
- Explaining one politician's mistakes as personal failure while explaining
  another's as systemic pressure
- Attributing violence by one group to ideology while attributing the same
  behavior by another group to poverty or mental illness
- Describing protests by favored groups as "demonstrations" and by disfavored
  groups as "mobs"
- Using passive voice to downplay agency of favored actors ("mistakes were made")
  while using active voice to emphasize agency of disfavored actors

SCORING GUIDE:
1 = Consistent. Same standards of explanation applied to all groups.
2 = Mild. Slight inconsistency but not systematically applied.
3 = Moderate. Clear double standard visible across the article.
4 = Strong. Systematic different attribution applied throughout.
5 = Extreme. One group entirely absolved, another entirely blamed.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it reflects attribution bias>",
      "neutral_alternative": "<consistent version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "selection": {
        "name": "Selection Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze SELECTION BIAS.

Selection bias occurs when an article selectively quotes or references sources
that support one perspective while ignoring or minimizing opposing voices.

EXAMPLES:
- Only quoting experts from one political party
- Giving significantly more space to one side's arguments
- Using anonymous sources for criticism but named sources for defense
- Quoting a fringe figure to represent a mainstream position
- Describing one side's sources as "experts" and the other's as "critics"
- Citing only studies that support one view

SCORING GUIDE:
1 = Fully balanced. Multiple perspectives represented fairly.
2 = Mild imbalance. Slight lean but opposing views present.
3 = Moderate. One perspective clearly dominates.
4 = Strong. Only one perspective sourced or validated.
5 = Extreme. Entirely one-sided. No credible opposing voices.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why this shows selection bias>",
      "neutral_alternative": "<what balanced sourcing would look like>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "sensationalism": {
        "name": "Sensationalism",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze SENSATIONALISM.

Sensationalism occurs when language exaggerates or uses emotional triggers to
provoke reaction rather than inform.

EXAMPLES:
- "Explosive revelations" instead of "new information"
- "Bombshell report" for a routine story
- "Crisis" applied to minor problems
- Excessive adjectives: "shocking", "devastating", "terrifying"
- Vague alarming claims: "sources say it could be catastrophic"

SCORING GUIDE:
1 = No sensationalism. Measured, factual tone throughout.
2 = Mild. One or two dramatic words, overall restrained.
3 = Moderate. Regular emotional language to increase engagement.
4 = Strong. Consistently prioritizes drama over accuracy.
5 = Extreme. Tabloid-level. Facts secondary to emotional impact.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it is sensationalist>",
      "neutral_alternative": "<factual version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "false_balance": {
        "name": "False Balance",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze FALSE BALANCE.

False balance occurs when an article treats two positions as equally credible or
equally supported by evidence when they are not — giving fringe or minority views
the same weight as mainstream or well-evidenced positions.

EXAMPLES:
- Presenting a climate scientist and a climate denier as equally credible
- Giving equal space to a medical consensus and a discredited study
- Framing a 97%-3% scientific split as "scientists disagree"
- Inviting one expert and one conspiracy theorist as if they represent equal sides
- Using "both sides" framing when evidence strongly favors one position

SCORING GUIDE:
1 = No false balance. Weight given reflects actual evidence and expert consensus.
2 = Mild. Slight over-representation of minority view but not misleading.
3 = Moderate. Minority position clearly elevated beyond its evidential standing.
4 = Strong. Fringe view presented as equivalent to mainstream consensus.
5 = Extreme. Fringe view given more weight than the consensus position.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it reflects false balance>",
      "neutral_alternative": "<proportional version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "omission": {
        "name": "Omission Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze OMISSION BIAS.

Omission bias occurs when an article leaves out information that would materially
change the reader's understanding — not through false statements but through
selective incompleteness.

EXAMPLES:
- Reporting a crime statistic without the base rate that would contextualise it
- Covering a protest's violence without mentioning what triggered the protest
- Reporting a politician's statement without mentioning their contradictory
  statement from the previous week
- Describing a policy's costs without mentioning its benefits, or vice versa
- Omitting the outcome of a story that would undermine the article's framing

Note: Omission bias is harder to detect than commission bias. Score conservatively —
only flag cases where the missing information is clearly relevant and its absence
appears deliberate rather than due to space constraints.

SCORING GUIDE:
1 = Complete. All material context present or absence is clearly space-related.
2 = Mild. One minor omission but the article is broadly representative.
3 = Moderate. A relevant piece of context is missing that would change interpretation.
4 = Strong. Several key omissions that systematically favor one interpretation.
5 = Extreme. The article is misleading specifically through what it leaves out.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase or claim from article where context is missing>",
      "explanation": "<what is omitted and why it matters>",
      "neutral_alternative": "<how to write it with full context>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "ingroup_outgroup": {
        "name": "In-group/Out-group Bias",
        "prompt": """You are an expert media bias analyst. Your only task is to analyze IN-GROUP/OUT-GROUP BIAS.

In-group/out-group bias occurs when an article uses language that treats some
groups as normal, relatable, or deserving of empathy, while treating other groups
as foreign, threatening, or less deserving of sympathy.

EXAMPLES:
- Humanizing language for one group ("families", "workers", "community") and
  dehumanizing language for another ("illegals", "hordes", "mob")
- Describing in-group violence as isolated incidents and out-group violence as
  representative of the whole group
- Using first names or personal details for in-group individuals and
  demographic labels for out-group individuals
- "Us" vs "them" framing in reporting
- Describing out-group members' motives as sinister and in-group members' as
  understandable

SCORING GUIDE:
1 = Consistent. All groups described with equivalent humanity and complexity.
2 = Mild. Slight difference in language but not dehumanizing.
3 = Moderate. Clear pattern of warmer language for one group.
4 = Strong. Systematic humanization of one group and othering of another.
5 = Extreme. Dehumanizing language used for out-group throughout.

Return ONLY this JSON:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase from article>",
      "explanation": "<why it reflects in-group/out-group bias>",
      "neutral_alternative": "<consistent version>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}"""
    },

    "strengths": {
        "name": "Writing Strengths",
        "prompt": """You are an expert media bias analyst. Your only task is to identify
NEUTRAL, WELL-WRITTEN, or BALANCED phrases in this article.

You are NOT looking for bias. Find phrases that demonstrate good journalistic
practice — neutral language, balanced framing, or factual precision.

EXAMPLES:
- "The government announced a new policy" (factual, no editorial judgment)
- "Both parties expressed concern about the legislation" (balanced)
- "According to official figures released Tuesday" (precise sourcing)
- "Analysts disagree on the long-term impact" (acknowledges uncertainty)
- "The statement could not be independently verified" (transparency)

Return ONLY this JSON:
{{
  "strengths": [
    "<exact phrase from article demonstrating neutral or balanced writing>"
  ]
}}

Return 2 to 5 phrases. Only include genuinely good examples.

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
            max_tokens=1024,
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
                "response_mime_type": "application/json"
            }
        )
        raw = response.text.strip()

    try:
        result = json.loads(raw)
    except Exception:
        start = raw.find('{')
        end = raw.rfind('}') + 1
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
    Thresholds are intentionally wide — most articles are not extreme.
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
    Main analysis endpoint. Runs prompts sequentially — one per bias type.

    Now runs by default:
      1. political_framing  — intensity score 1-5
      2. political_direction — left/right score -100 to +100 (fixes the slider)
      3. sensationalism     — intensity score 1-5

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