# Detecting and Visualizing Biases in News Text using Large Language Models

## Overview

This project presents a full-stack application for detecting, analyzing, and visualizing political and linguistic biases in news articles using Large Language Models (LLMs).

The system combines natural language processing with structured bias evaluation to provide:

- Executive summaries
- Political alignment scoring
- Sensationalism analysis
- Tonality classification
- Extraction of biased phrases
- Bias intensity matrix across 10 bias categories
- Highlighted biased text
- Persistent analysis history

The goal of the project is to explore how LLMs can be used not only for text generation, but for structured critical media analysis and bias auditing.

---

## Problem Statement

News media plays a central role in shaping public opinion. However, articles may contain subtle or explicit forms of bias including framing effects, selective omission, emotional amplification, or ideological positioning.

Traditional fact-checking focuses on truthfulness. This project instead focuses on:

> How can we systematically detect and visualize bias patterns in news articles using modern language models?

---

## System Architecture

The system follows a full-stack architecture:

Frontend:
- React (TypeScript)
- TailwindCSS
- Interactive bias visualization components
- Animated political spectrum indicator
- Bias intensity matrix
- Modal-based detailed inspection

Backend:
- Flask (Python)
- REST API
- SQLite database
- Structured LLM prompt framework

AI Layer:
- Large Language Model used for structured bias evaluation
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
- Presence score (0–100)
- Quoted evidence from the article

Additionally, the system:
- Assigns political alignment score
- Classifies article category (Far Left → Far Right)
- Extracts biased phrases with suggested neutral alternatives
- Produces highlighted text output

---

## Features

- Structured LLM bias auditing
- Political spectrum visualization
- Bias intensity heat matrix
- Expandable modal bias explanations
- Persistent local history (SQLite)
- Fully interactive UI
- Clean separation of backend and frontend
- Strict JSON enforcement for reliable parsing

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


