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
                  confidence REAL)''')

    conn.commit()
    conn.close()

init_db()

# -------------------------
# PROMPTS — one per bias type
# -------------------------

PROMPTS = {

    "political_framing": {
        "name": "Political Framing Bias",
        "prompt": """You are an expert media bias analyst. Your only task right now is to
analyze POLITICAL FRAMING BIAS. Do not comment on any other type of bias.

Political framing bias occurs when specific word choices or narrative structure
favor one political perspective over another — without necessarily stating
anything factually false.

EXAMPLES of political framing bias:
- "Tax relief" (implies taxes are a burden) vs "tax cuts" (neutral)
- "Pro-life" vs "anti-abortion" — the label itself takes a side
- "Illegal aliens" vs "undocumented immigrants" vs "migrants"
- Describing a protest as a "riot" vs a "demonstration"
- "Job creators" vs "the wealthy" when referring to the same group
- "Government spending" vs "public investment"
- Quoting one party's characterization of an event without challenge

SCORING GUIDE — read carefully before scoring:
1 = Fully neutral. No loaded political language anywhere.
2 = Mild. One or two loaded words but the overall framing is balanced.
3 = Moderate. A clear pattern of language that leans one direction.
4 = Strong. Consistent one-sided framing throughout the article.
5 = Extreme. The article reads as political messaging, not journalism.

Return ONLY the following JSON and nothing else:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<one sentence explaining the score, max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase copied from the article>",
      "explanation": "<why this phrase is politically framed>",
      "neutral_alternative": "<how a neutral journalist would write it>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}
"""
    },

    "political_direction": {
        "name": "Political Direction",
        "prompt": """You are an expert media bias analyst. Your only task is to determine
the POLITICAL DIRECTION of any bias found in this article.

You are NOT scoring how biased the article is — that is handled separately.
You are ONLY determining which direction the bias leans, if any.

The scale runs from -100 (Far Left) to +100 (Far Right), with 0 being Center.

LEFT-leaning signals (negative scores):
- Language that favors progressive, liberal, or left-wing positions
- Framing that portrays government intervention, social programs, or regulation positively
- Language sympathetic to labor, minorities, immigration, climate action
- Using terms like "undocumented immigrants", "reproductive rights", "gun safety"
- Critical framing of corporations, wealthy individuals, or conservative politicians

RIGHT-leaning signals (positive scores):
- Language that favors conservative, traditional, or right-wing positions
- Framing that portrays free markets, deregulation, or national security positively
- Language sympathetic to law enforcement, military, border control, religious values
- Using terms like "illegal aliens", "pro-life", "tax relief", "radical left"
- Critical framing of government programs, progressive politicians, or immigration

SCORING EXAMPLES:
- A BBC article on climate change with balanced sources: 0
- A Fox News op-ed using "radical left" and "illegal invasion": +75
- A Guardian article framing all conservatives as anti-science: -65
- A Reuters wire report with no clear lean: 0

If the article has NO political bias (score of 1 on the framing scale), return 0.

Return ONLY the following JSON and nothing else:
{{
  "direction_score": <integer from -100 to +100>,
  "direction_label": "<one of: Far Left, Left, Center-Left, Center, Center-Right, Right, Far Right>",
  "confidence": <integer 1-100>,
  "reasoning": "<one sentence explaining the direction, max 25 words>"
}}

Article Title: {title}
Article Text: {text}
"""
    },

    "sensationalism": {
        "name": "Sensationalism",
        "prompt": """You are an expert media bias analyst. Your only task right now is to
analyze SENSATIONALISM. Do not comment on any other type of bias.

Sensationalism occurs when language exaggerates, dramatizes, or uses emotional
triggers to provoke a reaction rather than inform the reader.

EXAMPLES of sensationalism:
- "Explosive revelations" instead of "new information"
- "Bombshell report" for a routine story
- "Crisis" applied to minor or routine problems
- Excessive adjectives: "shocking", "devastating", "terrifying", "jaw-dropping"
- Vague but alarming claims: "sources say it could be catastrophic"
- Prioritizing emotional drama over factual content
- Clickbait-style headlines that overstate what the article actually says

SCORING GUIDE — read carefully before scoring:
1 = No sensationalism. Measured, factual tone throughout.
2 = Mild. One or two dramatic words but the overall tone is restrained.
3 = Moderate. Regular use of emotional language to increase engagement.
4 = Strong. The article consistently prioritizes drama over factual accuracy.
5 = Extreme. Tabloid-level language. Facts are secondary to emotional impact.

Return ONLY the following JSON and nothing else:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<one sentence explaining the score, max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact phrase copied from the article>",
      "explanation": "<why this phrase is sensationalist>",
      "neutral_alternative": "<how a factual journalist would write it>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}
"""
    },

    "strengths": {
        "name": "Writing Strengths",
        "prompt": """You are an expert media bias analyst. Your only task right now is to
identify NEUTRAL, WELL-WRITTEN, or BALANCED phrases in this article.

You are NOT looking for bias. You are identifying phrases that demonstrate
good journalistic practice — neutral language, balanced framing, or factual
precision that avoids loaded or emotional language.

EXAMPLES of strong neutral writing:
- "The government announced a new policy" (factual, no editorial judgment)
- "Both parties expressed concern about the legislation" (balanced)
- "According to official figures released Tuesday" (precise sourcing)
- "Analysts disagree on the long-term impact" (acknowledges uncertainty)
- "The statement could not be independently verified" (journalistic transparency)

Return ONLY the following JSON and nothing else:
{{
  "strengths": [
    "<exact phrase from the article that demonstrates neutral or balanced writing>"
  ]
}}

Return between 2 and 5 phrases. Only include genuinely good examples — do not
pad the list with mediocre phrases just to reach 5.

Article Title: {title}
Article Text: {text}
"""
    },

    "source_bias": {
        "name": "Source Selection Bias",
        "prompt": """You are an expert media bias analyst. Your only task right now is to
analyze SOURCE SELECTION BIAS. Do not comment on any other type of bias.

Source selection bias occurs when an article selectively quotes or references
sources that support one perspective, while ignoring or minimizing opposing voices.

EXAMPLES of source selection bias:
- Only quoting experts or officials from one political party
- Giving significantly more word count to one side's arguments
- Using anonymous sources for criticism but named sources for defense (or vice versa)
- Quoting a fringe figure to represent a mainstream position
- Describing one side's sources as "experts" and the other's as "critics"
- Citing studies that support one view while ignoring contradicting research

SCORING GUIDE — read carefully before scoring:
1 = Fully balanced. Multiple perspectives represented fairly with credible sources.
2 = Mild imbalance. Slight lean in sourcing but opposing views are still present.
3 = Moderate. One perspective clearly dominates. Other views mentioned briefly.
4 = Strong. Only one perspective is sourced or validated with evidence.
5 = Extreme. Entirely one-sided sources. No credible opposing voices included.

Return ONLY the following JSON and nothing else:
{{
  "score": <integer 1-5>,
  "confidence": <integer 1-100>,
  "reasoning": "<one sentence explaining the score, max 25 words>",
  "evidence": [
    {{
      "phrase": "<exact quote or reference from the article>",
      "explanation": "<why this shows source bias>",
      "neutral_alternative": "<what balanced sourcing would look like here>"
    }}
  ]
}}

Article Title: {title}
Article Text: {text}
"""
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

        # FIX #2 + FIX #3: run direction + sensationalism by default
        requested_biases = data.get(
            "bias_types",
            ["political_framing", "political_direction", "sensationalism", "strengths"]
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
        primary    = results.get("political_framing", {})
        framing_score = primary.get("score", 1)
        evidence   = primary.get("evidence", [])

        # Direction result — try multiple field names the model might use
        direction  = results.get("political_direction", {})
        direction_score = (
            direction.get("direction_score")
            or direction.get("score")
            or direction.get("political_direction_score")
            or 0
        )
        # Clamp to valid range
        direction_score = max(-100, min(100, int(direction_score)))
        direction_label = direction.get("direction_label", direction_score_to_category(direction_score))

        # Sensationalism result
        sensationalism_score = (results.get("sensationalism", {}).get("score") or 0)

        # Strengths: list of well-written phrases from the dedicated prompt
        strengths_result = results.get("strengths", {})
        strengths = strengths_result.get("strengths", [])

        # Build highlighted article text
        highlighted = build_highlighted_text(text, evidence)

        # Map evidence to biasedPhrases shape
        biased_phrases = [
            {
                "phrase": e.get("phrase", ""),
                "reason": e.get("explanation", ""),
                "suggestedAlternative": e.get("neutral_alternative", "")
            }
            for e in evidence
        ]

        # Build detailedBiases for dashboard charts
        # Exclude political_direction from this list — it's directional not a presence score
        detailed_biases = [
            {
                "type": v.get("bias_type", ""),
                "presenceScore": round((v.get("score") or 0) / 5 * 100),
                "evidence": v.get("reasoning", ""),
                "confidence": v.get("confidence", 0),
                "phrases": v.get("evidence", [])
            }
            for k, v in results.items()
            if k != "political_direction" and v.get("score") is not None
        ]

        mapped_response = {
            "summary":             primary.get("reasoning", ""),
            "framingScore":        framing_score,
            "confidence":          primary.get("confidence", 0),

            # FIX #2: biasScore now carries the real -100 to +100 direction value
            "biasScore":           direction_score,

            # FIX #2: category now reflects actual left/right direction label
            "category":            direction_score_to_category(direction_score),

            "directionLabel":      direction_label,
            "directionConfidence": direction.get("confidence", 0),

            # FIX #3: sensationalism now populated
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
                     (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
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
            'framingScore', 'confidence'
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

    results = []
    for article in GROUND_TRUTH:
        try:
            ai = run_single_prompt("political_framing", article["title"], article["text"])
            human_score = article["human_scores"]["political_framing"]
            ai_score = ai.get("score") or 0
            diff = abs(human_score - ai_score)

            results.append({
                "id":            article["id"],
                "title":         article["title"],
                "source":        article.get("source", ""),
                "human_score":   human_score,
                "ai_score":      ai_score,
                "difference":    diff,
                "exact_match":   diff == 0,
                "within_1":      diff <= 1,
                "ai_confidence": ai.get("confidence", 0),
                "ai_reasoning":  ai.get("reasoning", ""),
                "ai_evidence":   ai.get("evidence", []),
                "human_notes":   article.get("human_notes", ""),
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