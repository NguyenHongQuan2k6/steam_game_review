<!-- ===================================================== -->
<!--                     BANNER IMAGE                     -->
<!-- ===================================================== -->

<p align="center">
  <img src="steam_review_project/banner2.png" alt="Steam Review Sentiment Analysis">
</p>

<h1 align="center">Steam Review Sentiment Analysis</h1>


<p align="center">
  <b>End-to-End Machine Learning & NLP Platform for Collecting, Preprocessing, Benchmarking, and Classifying Steam Game Reviews — Featuring an Interactive 3D NASA-Style HUD Dashboard with Real-Time MediaPipe Hand Tracking Control.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Scikit--Learn-LinearSVC-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="Scikit-Learn">
  <img src="https://img.shields.io/badge/Three.js-React_Three_Fiber-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/MediaPipe-Hand_Tracking-FFC107?style=for-the-badge&logo=google&logoColor=black" alt="MediaPipe">
  <img src="https://img.shields.io/badge/MySQL-Data_Warehouse-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
</p>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [NLP Pipeline & Machine Learning](#nlp-pipeline--machine-learning)
  - [1. Negation Marking](#1-negation-marking)
  - [2. POS Tagging & Filtering](#2-pos-tagging--filtering)
  - [3. Word Lemmatization](#3-word-lemmatization)
  - [4. Proactive VADER Label Noise Correction](#4-proactive-vader-label-noise-correction)
  - [5. Feature Engineering & TF-IDF Vectorization](#5-feature-engineering--tf-idf-vectorization)
  - [6. Model Benchmarking](#6-model-benchmarking)
  - [7. Data Leakage Detection Module](#7-data-leakage-detection-module)
- [Interactive 3D Web Dashboard & Hand Tracking](#interactive-3d-web-dashboard--hand-tracking)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Installation & Prerequisites](#installation--prerequisites)
- [Execution & Usage Guide](#execution--usage-guide)
  - [Option A: One-Click Quick Start (Windows)](#option-a-one-click-quick-start-windows)
  - [Option B: Automated Python Pipeline Runner](#option-b-automated-python-pipeline-runner)
  - [Option C: Interactive CLI Pipeline Manager](#option-c-interactive-cli-pipeline-manager)
  - [Option D: Web Server Only Mode](#option-d-web-server-only-mode)
  - [Option E: Frontend Development Mode (Vite)](#option-e-frontend-development-mode-vite)
- [API Reference](#api-reference)
- [Experimental Results](#experimental-results)
- [Future Enhancements](#future-enhancements)
- [Author & License](#author--license)

---

## Overview

**Steam Review Sentiment Analysis** is a complete, production-grade Data Science & Machine Learning platform that collects, normalizes, labels, trains, evaluates, and serves sentiment analysis models for Steam video game reviews.

The platform bridges traditional NLP machine learning pipelines with modern interactive Web application engineering:
- **Data Engineering**: Scrapes Steam Store search pages & consumes Steam Reviews API with pagination and rate limiting into a MySQL data warehouse.
- **NLP & ML Core**: Performs negation marking, POS filtering, NLTK lemmatization, and proactive VADER label noise correction before training a **Linear Support Vector Classifier (LinearSVC)** across 12,000 TF-IDF features.
- **Model Integrity & Explainability**: Includes a dedicated **Data Leakage Detector** script and exports feature weights & 2D PCA scatter plots.
- **Interactive Web Interface**: A neon NASA-inspired 3D HUD Web App built with **React 19, TypeScript, Vite, Tailwind CSS v4, React Three Fiber (Three.js), and MediaPipe Hands gesture tracking** for touchless webcam control.

---

## Problem Statement

Steam hosts tens of millions of user reviews. Reading and analyzing player feedback manually across thousands of reviews for game development studios, publishers, or gamers is prohibitively slow and expensive.

This platform automates sentiment classification into three discrete target classes:

| Class Label | Sentiment Category | Description |
|:---:|:---:|:---|
| `-1` | **Negative** | Complaints about bugs, poor performance, high pricing, or bad gameplay. |
| `0` | **Neutral** | Mixed feelings, informational summaries, or objective observations. |
| `1` | **Positive** | High praise for gameplay mechanics, graphics, story, or sound design. |

---

## System Architecture

```text
               ┌─────────────────────────────────────────┐
               │    Steam Store API & Reviews API        │
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Raw Data Collection (crawl_raw_data.py, crawl_reviews)  │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Data Cleaning & Price Normalization (cleaner.py)       │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Labeling Workflow (Excel Import / Export & VADER Filter)│
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ MySQL Data Warehouse (steam_data_warehouse)              │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ NLP Pipeline: Negation → POS Filter → Lemmatization      │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ TF-IDF Vectorization (1-3 N-Grams, 12,000 Features)     │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Benchmark Models (Logistic Reg, Naive Bayes, LinearSVC) │
       │ & Data Leakage Detector (detect_leakage.py)            │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Saved Production Artifacts (sentiment_model.pkl)        │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ FastAPI Backend REST API (src/web/backend/main.py)      │
       └────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ React 19 + Three.js 3D HUD Dashboard + MediaPipe Hands │
       └─────────────────────────────────────────────────────────┘
```

---

## Key Features

- **Automated Data Scraping**: Scraping game catalog metadata with `BeautifulSoup` and crawling user reviews directly from Steam's API using cursor-based pagination.
- **Robust Data Normalization**: Cleaning foreign currency string formats (USD, EUR, VND), removing non-printable noise/emojis, standardizing dates (`YYYY-MM-DD`), and deduplicating records by `review_id`.
- **Domain-Specific NLP Preprocessing**:
  - Negation phrase binding (e.g. `not good` -> `not_good`).
  - POS tag filtering (keeps adjectives, verbs, adverbs; drops high-frequency noun noise like `game`, `play`).
  - NLTK `WordNetLemmatizer` vocabulary reduction.
- **Proactive VADER Noise Correction**: Re-evaluates ambiguous human labels using VADER compound polarity thresholds to fix mislabeled data, boosting model accuracy from **48.9% -> 64.8%**.
- **Multi-Model Benchmarking**: Automated comparison between LinearSVC, Logistic Regression, Multinomial Naive Bayes, and Random Forest models based on Accuracy, F1-Macro, Precision, Recall, and training speed.
- **Data Leakage Detector**: A standalone diagnostic tool (`detect_leakage.py`) comparing leaky vs. clean cross-validation train/test split scenarios.
- **Model Explainability & PCA Scatter**: Top-15 sentiment keyword coefficient extraction (`export_features.py`) and 12,000-D -> 2D PCA dimensionality reduction coordinates (`visualize_model.py`).
- **Interactive 3D Web HUD Dashboard**:
  - Modern React 19 + TypeScript + Vite + Tailwind CSS v4 frontend.
  - Interactive 3D particle background & scatter plots powered by **React Three Fiber / Three.js**.
  - **Touchless Webcam Gesture Control** with **MediaPipe Hands** (finger tracking pointer, pinch drag-and-drop, two-hand zoom/tilt).
  - FastAPI backend serving prediction endpoints, live app crawling, stats, and metadata with offline fallback support.

---

## NLP Pipeline & Machine Learning

### 1. Negation Marking
Negated expressions are combined into single tokens to preserve semantic sentiment context:
```text
not good   ──▶  not_good
never fun  ──▶  never_fun
```

### 2. POS Tagging & Filtering
Retains sentiment-heavy parts of speech (**Adjectives**, **Verbs**, and **Adverbs**) while filtering out generic domain nouns (e.g., `game`, `player`, `character`) that do not carry explicit sentiment.

### 3. Word Lemmatization
Standardizes words to their dictionary root using NLTK's `WordNetLemmatizer`:
```text
running, runs, ran  ──▶  run
played, playing     ──▶  play
```

### 4. Proactive VADER Label Noise Correction
Initial crowdsourced/manual dataset labeling contained subjective noise. We apply VADER compound sentiment scoring rules to correct obvious label mismatches:
- Compound Score > 0.35 => Positive (1)
- Compound Score < -0.35 => Negative (-1)
- Otherwise => Retain Human Label

> **Impact**: Raised overall SVM classification accuracy on the 10,000+ review benchmark dataset from **48.9%** to **64.8%**.

### 5. Feature Engineering & TF-IDF Vectorization
- N-gram Range: 1 to 3 words (`unigrams`, `bigrams`, `trigrams`)
- Max Features: 12,000 top TF-IDF tokens
- Sublinear TF scaling enabled

### 6. Model Benchmarking
The training pipeline (`train_model.py`) evaluates 4 primary algorithms:
1. **LinearSVC (Best Model)** — Highest F1-Macro score on high-dimensional sparse text vectors.
2. **Logistic Regression** — Baseline linear classifier.
3. **Multinomial Naive Bayes** — Fast probabilistic text baseline.
4. **Random Forest Classifier** — Non-linear tree ensemble benchmark.

### 7. Data Leakage Detection Module
The `src/models/detect_leakage.py` script validates that TF-IDF vectorization and lemmatization fit parameters are calculated **strictly on training splits** to prevent subtle test set data leakage.

---

## Interactive 3D Web Dashboard & Hand Tracking

The application features a responsive, futuristic NASA-inspired HUD interface serving real-time analytical panels:

- **Live Review Sentiment Classifier**: Enter custom review text or choose pre-loaded samples to inspect instant sentiment scores and confidence.
- **On-Demand Game Scraper & Classifier**: Input any Steam `AppID` (e.g. `730` for CS2, `1091500` for Cyberpunk 2077) to scrape, store, and classify live reviews from Steam on the fly.
- **Interactive PCA & Keyword Charts**: View top-15 positive, neutral, and negative feature weights rendered alongside interactive charts.
- **MediaPipe Hand Tracking Pointer & Gestures**:
  - **Point**: Move index finger to control screen cursor.
  - **Pinch**: Pinch index finger & thumb to select or drag floating review cards.
  - **Two-Hand Control**: Scale and tilt 3D canvas views.

---

## Technology Stack

| Component | Technologies & Frameworks |
|---|---|
| **Core Language** | Python 3.10+ |
| **Backend & API** | FastAPI, Uvicorn, Pydantic, Requests |
| **Machine Learning** | Scikit-Learn (LinearSVC, LogisticRegression, MultinomialNB, RandomForestClassifier) |
| **NLP Libraries** | NLTK (VADER, WordNetLemmatizer, POS Tagger) |
| **Database & Storage** | MySQL, SQLAlchemy, PyMySQL |
| **Data Processing** | Pandas, NumPy, OpenPyXL |
| **Data Visualization** | Matplotlib, Seaborn, WordCloud |
| **Frontend Framework** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Recharts |
| **3D & Animation** | Three.js, React Three Fiber (`@react-three/fiber`, `@react-three/drei`) |
| **Computer Vision** | MediaPipe Hands (Webcam Gesture Control) |
| **Artifact Storage** | Joblib (`.pkl` models and vectorizers) |

---

## Project Directory Structure

```text
steam_review_project/
│
├── data/
│   ├── raw/                            # Raw scraped Steam data JSON/CSVs
│   ├── processed/
│   │   ├── eda_charts/                 # EDA distribution plots & PCA JSON
│   │   ├── model_charts/               # Model benchmarking charts
│   │   └── labeling_batches/           # Excel files for manual labeling
│   └── features/                       # Saved TF-IDF vectorizer & feature matrices
│
├── models/                             # Packaged ML models (sentiment_model.pkl)
├── notebooks/                          # Jupyter Notebooks for EDA & experiments
│
├── src/
│   ├── data/
│   │   ├── crawl_raw_data.py           # Scraping game catalog from Steam Search
│   │   ├── crawl_reviews_game.py       # Crawling game reviews via Steam API
│   │   ├── cleaner.py                  # Normalizing text, prices, and dates
│   │   ├── export_for_labeling.py      # Exporting unlabeled batches to Excel
│   │   ├── import_labeled_data.py      # Importing labeled Excel reviews to MySQL
│   │   └── eda.py                      # Exploratory Data Analysis script
│   │
│   ├── models/
│   │   ├── train_model.py              # NLP pipeline, model benchmarking & LinearSVC training
│   │   ├── predict_model.py            # Console interactive prediction engine
│   │   ├── evaluate.py                 # Classification reports & confusion matrix
│   │   ├── visualize_model.py          # Top word weights & PCA 2D coordinates
│   │   ├── export_features.py          # Export feature names & IDF weights
│   │   └── detect_leakage.py           # Data leakage diagnostic system
│   │
│   └── web/
│       ├── backend/
│       │   └── main.py                 # FastAPI backend server & API routing
│       └── frontend_new/               # React 19 + Vite + Three.js 3D Web App
│           ├── src/                    # React components, pages, hooks, hand tracking
│           ├── public/                 # Static assets & model testers
│           ├── package.json            # Node.js dependencies
│           └── vite.config.ts          # Vite build config
│
├── utils/
│   ├── db_helper.py                    # MySQL connection manager & auto-migrations
│   ├── config.py                       # Global database & environment configuration
│   └── logger.py                       # Standard system logging helper
│
├── requirements.txt                    # Python dependencies
├── run.py                              # Interactive CLI pipeline manager
├── run_pipeline_all.py                 # Full automated Python pipeline & server runner
├── run_all.bat                         # One-click Windows runner (Builds React & launches server)
└── run_web_only.bat                    # One-click Windows runner (Web server only mode)
```

---

## Installation & Prerequisites

### Prerequisites
1. **Python**: Python 3.10 or higher installed and added to system PATH.
2. **Node.js**: Node.js 18+ (Required for compiling the React frontend).
3. **Database (Optional)**: MySQL server running locally or remotely (Fallback mode activates automatically if MySQL is unavailable).

### 1. Clone the Repository
```bash
git clone https://github.com/NguyenHongQuan2k6/steam_game_review.git
cd steam_game_review
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Install & Build React Frontend Dependencies
```bash
cd src/web/frontend_new
npm install
npm run build
cd ../../..
```

### 4. Database Setup (Optional)
Configure your MySQL credentials in `utils/config.py` or set environment variables:
```python
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = "your_password"
DB_NAME = "steam_data_warehouse"
```

---

## Execution & Usage Guide

### Option A: One-Click Quick Start (Windows)
Double-click or run `run_all.bat` from terminal:
```cmd
run_all.bat
```
*Automatically installs Python packages, builds the React frontend, runs pipeline checks, launches FastAPI on port 8000, and opens your browser to `http://localhost:8000/new/`.*

### Option B: Automated Python Pipeline Runner
Runs the full pipeline programmatically and starts the server:
```bash
python run_pipeline_all.py
```

### Option C: Interactive CLI Pipeline Manager
Launch an interactive menu to choose specific pipeline steps:
```bash
python run.py
```
Or execute specific flags directly:
```bash
# Run data cleaning
python run.py --clean

# Train models and benchmark
python run.py --train

# Evaluate best model
python run.py --evaluate

# Launch web server
python run.py --serve
```

### Option D: Web Server Only Mode
To bypass data crawling and model training and immediately start the FastAPI server:
```bash
run_web_only.bat
```
or via Python:
```bash
python run.py --serve
```
Then visit **`http://localhost:8000/new/`** in your browser.

### Option E: Frontend Development Mode (Vite)
If you want to modify the React frontend UI with hot module replacement (HMR):
```bash
cd src/web/frontend_new
npm install
npm run dev
```
Open **`http://localhost:5173`** for instant UI development.

---

## API Reference

The FastAPI backend (`src/web/backend/main.py`) exposes the following endpoints:

| Endpoint | Method | Description |
|---|:---:|---|
| `/api/status` | `GET` | System health check, database connectivity & AI model loaded status |
| `/api/predict` | `POST` | Predict sentiment class (`-1`, `0`, `1`) and confidence score for input review text |
| `/api/games` | `GET` | Fetch tracked games, review counts, prices, and cover artwork |
| `/api/reviews` | `GET` | Retrieve reviews and predicted sentiment labels for a specific game `app_id` |
| `/api/crawl` | `POST` | Crawl live Steam reviews for a requested `AppID` on demand and classify them |
| `/api/coefficients` | `GET` | Top-15 SVM keyword feature weights for Negative, Neutral, and Positive classes |
| `/api/stats` | `GET` | Aggregate dataset statistics, total games, total reviews, and sentiment proportions |
| `/api/pca-data` | `GET` | 2D PCA projected coordinates for interactive scatter plotting |

---

## Experimental Results

| Metric / Setting | Benchmark Value |
|---|---|
| **Total Dataset Size** | 10,000+ Cleaned & Labeled Steam Reviews |
| **Target Sentiment Classes** | 3 (`-1`: Negative, `0`: Neutral, `1`: Positive) |
| **Best Model** | **LinearSVC (Support Vector Machine)** |
| **Feature Extraction** | TF-IDF (1–3 n-grams, 12,000 max features) |
| **Accuracy (Post VADER Correction)** | **64.8%** |
| **Accuracy (Pre VADER Correction)** | 48.9% |
| **Key Performance Driver** | POS Tag filtering + VADER noise reduction |

---

## Future Enhancements

- **Deep Learning & Transformers**: Fine-tuning BERT/RoBERTa models (`DeBERTa-v3`, `SteamBERT`) for higher sentiment precision.
- **Docker Containerization**: Packaging FastAPI backend, React frontend, and MySQL into multi-stage Docker Compose files.
- **Continuous Integration (CI/CD)**: GitHub Actions workflow for automated testing and linting (`oxlint`, `pytest`).
- **Cloud Deployment**: Deploying backend to Google Cloud Run / AWS ECS and database to Managed Cloud SQL.

---

<div align="center">

Developed for research, educational, and portfolio purposes.  
*If you find this project helpful, please consider giving it a star on GitHub!*

</div>
