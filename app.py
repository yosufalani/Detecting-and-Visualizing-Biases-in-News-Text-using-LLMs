from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
from dotenv import load_dotenv
from google import genai
import sys

print("PYTHON PATH:", sys.executable)

# -------------------------
# LOAD ENV + GEMINI SETUP
# -------------------------

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=api_key)

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
                  detailedBiases TEXT)''')

    conn.commit()
    conn.close()

init_db()

# -------------------------
# API ROUTES
# -------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"})


@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        text = data.get("text")
        title = data.get("title", "")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        prompt = f"""
Evaluate POLITICAL FRAMING BIAS (1-5 scale).

1 = Neutral
2 = Mild
3 = Moderate
4 = Strong
5 = Extreme

Return JSON only:

{{
  "score": integer,
  "reasoning": string (max 30 words),
  "highlighted_phrases": [string],
  "confidence": integer
}}

Article Title: {title}
Article Text: {text}
"""

        response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config={
        "temperature": 0.0,
        "top_p": 0.0,
        "response_mime_type": "application/json"
    }
)
        raw = response.text.strip()

        # ---- Robust JSON Extraction ----
        try:
            result_json = json.loads(raw)
        except:
            start = raw.find('{')
            end = raw.rfind('}') + 1
            cleaned = raw[start:end]
            result_json = json.loads(cleaned)

        mapped_response = {
    "summary": result_json.get("reasoning", ""),
    "biasScore": 0,  # alignment neutral
    "framingScore": result_json.get("score", 1),
    "category": "Political Framing Bias",
    "sensationalismScore": 0,
    "tonality": "Neutral",
    "biasedPhrases": result_json.get("highlighted_phrases", []),
    "originalTextSnippet": text[:500],
    "detailedBiases": []
}

        return jsonify(mapped_response)

    except Exception as e:
        print("ANALYZE ERROR:", e)
        if 'response' in locals():
            print("RAW RESPONSE:", response.text)
        return jsonify({"error": str(e)}), 500


@app.route('/api/analysis', methods=['POST'])
def save_analysis():
    try:
        data = request.get_json()
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()

        c.execute('''INSERT INTO analysis VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (data['id'], data['timestamp'], data['title'], data['summary'],
                   data['biasScore'], data['category'], data['sensationalismScore'],
                   data['tonality'], json.dumps(data['biasedPhrases']),
                   data['originalTextSnippet'],
                   json.dumps(data.get('detailedBiases', []))))

        conn.commit()
        conn.close()

        return jsonify({"status": "success"}), 201

    except Exception as e:
        print("DB SAVE ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/analysis/<id>', methods=['DELETE'])
def delete_analysis(id):
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("DELETE FROM analysis WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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