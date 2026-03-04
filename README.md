# Detecting and Visualizing Biases in News Text using Large Language Models

## Overview

This project presents a full-stack application for detecting, analyzing, and visualizing political and linguistic biases in news articles using Large Language Models (LLMs).

The system performs structured bias auditing and presents results through interactive visualizations. It combines AI-powered analysis with frontend data visualization to make media bias more transparent and interpretable.

---

## Problem Statement

News media plays a central role in shaping public opinion. Articles may contain subtle or explicit bias through framing, omission, emotional amplification, or selective sourcing.

Traditional fact-checking focuses on truthfulness. This project instead focuses on:

> How can we systematically detect, measure, and visualize bias patterns in news articles using modern language models?

---

## System Architecture

### Frontend
- React (TypeScript)
- Vite
- TailwindCSS
- Interactive bias visualizations
- Animated political spectrum indicator
- Bias intensity matrix
- Expandable modal explanations
- Persistent local history display

### Backend
- Python
- Flask
- REST API
- SQLite database for analysis storage
- Structured prompt engineering

### AI Layer
- Large Language Model for structured bias evaluation
- Strict JSON output enforcement
- Multi-step evaluation rubric

---

## Bias Evaluation Framework

The model evaluates articles across 10 defined bias categories:

1. Framing  
2. Negativity  
3. Confirmation Bias  
4. Anchoring  
5. Attribution Bias  
6. Selection Bias  
7. Sensationalism  
8. False Balance  
9. Omission  
10. In-group / Out-group Bias  

For each category, the system assigns:
- A presence score (0–100)
- Direct quoted evidence from the article

Additionally, the system:
- Assigns a political alignment score
- Classifies the article (Far Left → Far Right)
- Extracts biased phrases
- Suggests neutral alternatives
- Generates highlighted bias annotations

---

## Features

- Structured LLM bias auditing
- Political spectrum visualization
- Bias intensity matrix
- Expandable modal bias explanations
- Extraction of biased phrasing
- Suggested neutral alternatives
- Persistent analysis history (SQLite)
- Strict JSON enforcement for reliable parsing
- Clean separation of frontend and backend

---

## Technology Stack

Frontend:
- React
- TypeScript
- Vite
- TailwindCSS

Backend:
- Python
- Flask
- SQLite

Other:
- REST API architecture
- Structured prompt engineering
- JSON schema enforcement

---

# Running the Application

This project consists of a backend (Flask + Python) and a frontend (React + Vite). Both must be running simultaneously.

---

## 1. Clone the Repository

```bash
git clone https://github.com/yosufalani/Detecting-and-Visualizing-Biases-in-News-Text-using-LLMs.git
cd Detecting-and-Visualizing-Biases-in-News-Text-using-LLMs
```

---

# Backend Setup (Flask)

## Create Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate     # macOS / Linux
# OR
venv\Scripts\activate        # Windows
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create a `.env` file in the root directory:

```
GEMINI_API_KEY=your_api_key_here
```

---

## Start Backend Server

```bash
python app.py
```

Backend runs at:

```
http://localhost:5000
```

---

# Frontend Setup (React + Vite)

Open a new terminal window in the same project folder.

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

# Application Flow

1. User submits a news article in the frontend.
2. The frontend sends the article to the Flask backend.
3. The backend sends structured instructions to the LLM.
4. The LLM returns structured JSON bias analysis.
5. The frontend visualizes the results.

---

# Production Build (Optional)

To create a production frontend build:

```bash
npm run build
```

You may serve the built files through Flask or deploy to a hosting platform.

---

# Research Contribution

This project demonstrates:

- How structured prompt engineering improves reliability in LLM outputs
- How bias can be operationalized into measurable categories
- How visualization enhances interpretability of AI-driven analysis
- The importance of enforcing JSON schemas in production systems

The system bridges AI-driven language analysis with interactive visualization design.

---

# Future Improvements

- Multi-article comparison
- Bias trend tracking over time
- Dataset-level bias aggregation
- Confidence scoring for evaluations
- Cloud deployment
- Benchmark evaluation against annotated datasets


