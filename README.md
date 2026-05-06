# VeriBias — Detecting and Visualising Biases in News Text Using LLMs

Bachelor's Thesis · University of Stavanger · 2026

**Authors:** Yosuf Al-Ani (yosani2003@gmail.com) · Sture Odin Troli (sturetroly1@gmail.com)

---

## Overview

VeriBias is a full-stack web application that detects and visualises political framing bias and cognitive bias in English-language news articles using large language models (LLMs). The system sends each article through eleven structured prompts — one per bias type — and returns phrase-level evidence, explanations, and neutral rewrite suggestions for every detected bias.

Two models are supported and can be compared side by side: **Google Gemini 2.5 Flash** and **Anthropic Claude Sonnet 4.6**. Both are queried with identical prompts at temperature = 0.0.

---

## Bias Types Detected

The system detects ten bias types, each with a dedicated prompt scored on a 1–5 scale:

| Bias Type | What it detects |
|---|---|
| Framing Bias | Loaded word choices or narrative structure favouring one political perspective |
| Negativity Bias | Disproportionate emphasis on negative outcomes |
| Confirmation Bias | Evidence architecture confirming a predetermined conclusion |
| Anchoring Bias | Opening claim that disproportionately shapes interpretation |
| Attribution Bias | Different explanatory standards for comparable groups |
| Selection Bias | Systematic inclusion or exclusion of sources and voices |
| Sensationalism | Emotionally charged language prioritising reaction over precision |
| False Balance | Treating unequally supported positions as equally credible |
| Omission Bias | Absence of material context that favours one interpretation |
| In-group/Out-group Bias | Asymmetric humanising language for comparable groups |

Political direction is scored separately on a −100 (Far Left) to +100 (Far Right) scale. A twelfth prompt identifies writing strengths.

For each detected bias, the system returns:
- A score (1–5) and confidence estimate (0–100%)
- A reasoning summary (max 45 words)
- Flagged phrases with explanations and neutral alternatives
- Inline highlighted HTML of the original article text

---

## Corpus and Evaluation Data

The full evaluation corpus, human annotations, and ground truth data are in `ground_truth.py` and `corpus_texts.json`. The corpus covers 50 news articles from eight outlets across eight politically charged topics plus neutral controls.

---

## System Architecture

**Backend:** Python / Flask — `app.py`
**Frontend:** React / TypeScript / Tailwind CSS
**Database:** SQLite (`veribias.db`)
**Models:** Google Gemini 2.5 Flash · Anthropic Claude Sonnet 4.6

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Run all prompts on an article |
| `/api/analysis` | POST | Save a completed analysis to SQLite |
| `/api/history` | GET | Return all saved analyses, newest first |
| `/api/analysis/<id>` | DELETE | Remove a single analysis |
| `/api/evaluate` | GET | Compare stored results against ground truth |
| `/api/evaluate/csv` | GET | Export evaluation results as CSV |
| `/api/stats` | GET | Aggregate statistics across all saved analyses |

---

## Setup and Running

### 1. Clone the repository

```bash
git clone https://github.com/yosufalani/Detecting-and-Visualizing-Biases-in-News-Text-using-LLMs.git
cd Detecting-and-Visualizing-Biases-in-News-Text-using-LLMs
```

### 2. Backend setup

```bash
python -m venv venv
source venv/bin/activate      # macOS / Linux
# venv\Scripts\activate       # Windows

pip install -r requirements.txt
```

Create a `.env` file in the root directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

Both keys are required to use both models. The system will run with only one key — just select the available model in the interface.

Start the backend:

```bash
python app.py
```

Backend runs at `http://localhost:5000`

### 3. Frontend setup

Open a new terminal in the same directory:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Running the batch evaluation

To re-run the full evaluation on all 50 articles:

```bash
python batch_analyze.py --fresh
```

The `--fresh` flag clears the database before running. Results are saved to `veribias.db` and can be retrieved via `/api/evaluate` or `/api/evaluate/csv`.

---

## Project Structure

```
├── app.py                  # Flask backend — prompts, API routes, evaluation
├── batch_analyze.py        # Batch runner for all 50 evaluation articles
├── ground_truth.py         # Human annotations and corpus metadata
├── corpus_texts.json       # Full text of all 50 evaluation articles
├── App.tsx                 # React app entry point
├── components/             # Frontend components
│   ├── ArticleAnalyzer.tsx
│   ├── ResultView.tsx
│   ├── HistoryList.tsx
│   ├── AboutView.tsx
│   └── StatsView.tsx
├── services/
│   └── apiService.ts       # Frontend API calls
├── types.ts                # TypeScript type definitions
└── requirements.txt        # Python dependencies
```

---
