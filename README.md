<!-- ===================================================== -->
<!--                     BANNER IMAGE                     -->
<!-- ===================================================== -->

<p align="center">
  <img src="steam_review_project/banner2.png" alt="Steam Review Sentiment Analysis">
</p>

<h1 align="center">Steam Review Sentiment Analysis</h1>

<p align="center">
End-to-end Machine Learning platform for collecting, processing, and classifying Steam game reviews — featuring a NASA-style HUD dashboard with real-time webcam gesture control.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge">
  <img src="https://img.shields.io/badge/Scikit--Learn-ML-orange?style=for-the-badge">
  <img src="https://img.shields.io/badge/SVM-LinearSVC-red?style=for-the-badge">
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge">
  <img src="https://img.shields.io/badge/MediaPipe-Hand%20Tracking-yellow?style=for-the-badge">
</p>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [NLP Techniques](#nlp-techniques)
- [Interactive Web Dashboard](#interactive-web-dashboard)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage Pipeline](#usage-pipeline)
- [API Reference](#api-reference)
- [Experimental Results](#experimental-results)
- [Future Work](#future-work)
- [Author](#author)

---

## Overview

**Steam Review Sentiment Analysis** is a full-stack Machine Learning platform that automatically collects, cleans, labels, and classifies Steam game reviews into sentiment categories using a traditional **SVM (LinearSVC)** classifier.

Beyond the ML pipeline, the project ships with a production-style **FastAPI backend** and an interactive **NASA-inspired HUD dashboard**, complete with 3D particle rendering (React Three Fiber) and a touchless, webcam-driven **hand-gesture control system** built on **MediaPipe Hands**.

The project covers the full lifecycle of a data product:

- Automated data collection from the Steam Store & Reviews API
- Data cleaning, normalization, and currency conversion
- Advanced NLP preprocessing and feature engineering
- Multi-model benchmarking and SVM training
- Data leakage detection and validation
- Model explainability (keyword weights, PCA projection)
- A real-time, gesture-controlled web dashboard

---

## Problem Statement

Steam hosts millions of user-generated reviews containing valuable signals about gameplay quality, player satisfaction, and product sentiment. Manually reading and labeling this volume of text is not feasible at scale.

This project solves that problem by training a supervised classifier to automatically categorize each review into one of three sentiment classes:

| Label | Sentiment |
|:-----:|:---------|
| `-1` | Negative |
| `0` | Neutral |
| `1` | Positive |

---

## System Architecture

```text
Steam Store API / Reviews API
            │
            ▼
   Raw Data Collection  (crawl_raw_data.py, crawl_reviews_game.py)
            │
            ▼
   Data Cleaning & Normalization  (cleaner.py)
            │
            ▼
   Manual Labeling Workflow  (export_for_labeling.py → Excel → import_labeled_data.py)
            │
            ▼
   MySQL Data Warehouse  (steam_data_warehouse)
            │
            ▼
   Advanced NLP Preprocessing  (Negation Marking → POS Filtering → Lemmatization)
            │
            ▼
   TF-IDF Vectorization  (1–3 n-grams, 12,000 features)
            │
            ▼
   Model Benchmarking  (Logistic Regression · Naive Bayes · LinearSVC · Random Forest)
            │
            ▼
   Final Model: Linear SVM  (sentiment_model.pkl)
            │
            ▼
   Evaluation & Explainability  (Confusion Matrix · PCA · Keyword Weights)
            │
            ▼
   FastAPI Backend  (main.py)
            │
            ▼
   NASA-Style HUD Dashboard  (HTML/CSS/JS + React Three Fiber + MediaPipe Hands)
```

---

## Key Features

### Data Collection
- Steam Store search scraping via `BeautifulSoup` combined with the official `appdetails` API
- Cursor-based pagination against the Steam Reviews API with rate-limit-safe request throttling
- Automatic MySQL schema migrations (e.g. `image_url`, `price_display_raw`)

### Data Cleaning
- Removal of special characters (™, ®) and emoji from review text
- Standardized `YYYY-MM-DD` release dates
- USD/EUR → VND price normalization
- Deduplication by `review_id`

### Natural Language Processing
- Negation marking, POS filtering, and lemmatization (see [NLP Techniques](#nlp-techniques))
- Custom stop-word list tuned for gaming vocabulary (`game`, `play`, `hour`, `steam`)
- Proactive VADER-based label noise correction

### Machine Learning
- TF-IDF vectorization with 1–3 n-grams (12,000 features)
- Benchmarking across 4 algorithms with F1-macro scoring and training-time comparison
- SVM coefficient analysis to surface the most influential sentiment keywords
- Dedicated **data leakage detection module** comparing a leaky vs. a clean training scenario

### Evaluation & Explainability
- Precision / Recall / F1-Score classification reports
- Seaborn confusion matrix heatmaps
- PCA dimensionality reduction (12,000-D → 2D) for interactive scatter visualization
- Top-15 keyword weight charts per sentiment class

---

## NLP Techniques

### 1. Negation Marking
Negated phrases are merged into single semantic tokens via regex so the model doesn't confuse polarity:

```text
not good   → not_good
never fun  → never_fun
```

### 2. POS Filtering
Only sentiment-bearing word classes are retained — **adjectives, verbs, and adverbs**. Nouns (e.g. `game`, `character`) are dropped entirely to reduce feature noise.

### 3. Lemmatization
Words are reduced to their base form using NLTK's `WordNetLemmatizer`, shrinking vocabulary size and improving generalization:

```text
running → run
played  → play
```

### 4. Proactive VADER Label Correction
Manually labeled data was noisy, so VADER compound scores are used to auto-correct mislabeled rows:

```text
compound > 0.35   → Positive (1)
compound < -0.35  → Negative (-1)
otherwise         → Keep original human label
```

This single step raised SVM accuracy from **48.9% → 64.8%** across the full 10,000-row dataset.

---

## Interactive Web Dashboard

The FastAPI backend (`src/web/backend/main.py`) serves a NASA-style HUD frontend with the following capabilities:

- **Real-time telemetry UI** — bento-style panels, live review feed, and ranking boards
- **On-demand crawling** — enter any Steam AppID to crawl, store, and classify its reviews instantly
- **3D particle field** rendered with React Three Fiber, reactive to UI state
- **GSAP + ScrollTrigger** scrollytelling to transition between 3D analytical views
- **Touchless gesture control (MediaPipe Hands)**:
  - Index-finger tracking maps to an on-screen virtual cursor
  - Pinch (thumb + index) triggers drag-and-drop of floating review cards
  - Two-hand tracking controls zoom level and 3D scene tilt
- **CRT scanline / glitch aesthetic** with a neon-on-carbon visual theme

---

## Technology Stack

| Category | Technologies |
|---|---|
| Language | Python 3.10+ |
| Backend | FastAPI, Uvicorn |
| Machine Learning | Scikit-Learn (LinearSVC, Logistic Regression, Naive Bayes, Random Forest) |
| NLP | NLTK (VADER, WordNetLemmatizer, POS Tagger) |
| Database | MySQL, SQLAlchemy, PyMySQL |
| Data Processing | Pandas, NumPy, OpenPyXL |
| Visualization | Matplotlib, Seaborn, WordCloud |
| Frontend | HTML5, CSS3, JavaScript, Chart.js |
| 3D / Interaction | React Three Fiber, GSAP, ScrollTrigger, MediaPipe Hands |
| Serialization | Joblib |

---

## Project Structure

```text
steam_review_project/
│
├── data/
│   ├── raw/                            # Raw scraped Steam data (legacy JSON)
│   ├── processed/
│   │   ├── eda_charts/                 # EDA charts and JSON exports
│   │   ├── model_charts/               # Model comparison charts
│   │   └── labeling_batches/           # Excel batches for manual labeling
│   └── features/                       # TF-IDF matrices & vectorizer (.pkl)
│
├── models/                             # Packaged trained models (.pkl)
├── notebooks/                          # Exploratory Jupyter notebooks
│
├── src/
│   ├── data/
│   │   ├── crawl_raw_data.py           # Steam Store scraper
│   │   ├── crawl_reviews_game.py       # Steam Reviews API crawler
│   │   ├── cleaner.py                  # Game & review data cleaning
│   │   ├── export_for_labeling.py      # Export unlabeled batches to Excel
│   │   ├── import_labeled_data.py      # Import labeled Excel → MySQL
│   │   └── eda.py                      # Exploratory data analysis
│   │
│   ├── features/
│   │   └── build_features.py           # [Legacy] Static TF-IDF builder
│   │
│   ├── models/
│   │   ├── train_model.py              # NLP pipeline + model benchmarking + SVM training
│   │   ├── predict_model.py            # Console-based real-time prediction
│   │   ├── evaluate.py                 # Confusion matrix & classification report
│   │   ├── visualize_model.py          # Keyword weights + PCA visualization
│   │   └── detect_leakage.py           # Data leakage detection system
│   │
│   └── web/
│       ├── backend/
│       │   └── main.py                 # FastAPI server & REST endpoints
│       └── frontend/
│           ├── index.html              # HUD dashboard UI
│           ├── style.css               # Neon / CRT scanline theming
│           └── script.js               # Drag-and-drop, scrollytelling, MediaPipe Hands
│
├── utils/
│   ├── db_helper.py                    # MySQL connection & auto-migrations
│   ├── config.py                       # System configuration
│   └── logger.py                       # System logging
│
├── requirements.txt
├── run.py                              # Interactive CLI pipeline manager
├── run_pipeline_all.py                 # Full end-to-end automation script
└── run_all.bat                         # One-click Windows launcher
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/NguyenHongQuan2k6/steam_game_review.git
cd steam_game_review
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

Requires **Python 3.10+** and a running **MySQL** instance.

### Configure the Database

Edit connection settings (`USER`, `PASSWORD`, `HOST`, `PORT`) in:

```text
utils/db_helper.py
```

---

## Usage Pipeline

### Quick Start (One Command)

```bash
python run_pipeline_all.py
```

Runs the entire pipeline end-to-end and automatically launches the web dashboard in your browser.

### Interactive CLI Menu

```bash
python run.py
```

### Manual Step-by-Step Execution

| Step | Command | Description |
|---|---|---|
| Import labeled data | `python src/data/import_labeled_data.py` | Load labeled Excel batches into MySQL |
| Exploratory analysis | `python src/data/eda.py` | Generate charts & VADER-cleaned label distributions |
| Train models | `python src/models/train_model.py` | Benchmark 4 models, train & save final SVM |
| Evaluate | `python src/models/evaluate.py` | Precision / Recall / F1 + confusion matrix |
| Visualize | `python src/models/visualize_model.py` | Keyword weights + PCA scatter plot |
| Predict (CLI) | `python src/models/predict_model.py` | Real-time sentiment prediction in terminal |
| Launch dashboard | `python -m uvicorn src.web.backend.main:app --host 127.0.0.1 --port 8000 --reload` | Start the FastAPI + HUD web app |

Then open **`http://localhost:8000`** to access the interactive HUD dashboard.

---

## API Reference

| Endpoint | Method | Description |
|---|:---:|---|
| `/api/status` | GET | System health & model load status |
| `/api/predict` | POST | Single-review sentiment prediction |
| `/api/games` | GET | List tracked games with review counts |
| `/api/reviews` | GET | Batch-predicted reviews for a given game |
| `/api/crawl` | POST | Crawl a new AppID on demand and classify its reviews |
| `/api/coefficients` | GET | Top-15 SVM keyword weights per sentiment class |
| `/api/stats` | GET | Aggregate dataset statistics & sentiment distribution |
| `/api/pca-data` | GET | 2D PCA coordinates for the 3D visualization |

---

## Experimental Results

| Metric | Value |
|---|---|
| Dataset Size | 10,000+ reviews |
| Sentiment Classes | 3 (Negative / Neutral / Positive) |
| Final Model | LinearSVC (SVM) |
| Feature Space | TF-IDF, 1–3 n-grams, 12,000 features |
| Accuracy (post VADER correction) | **64.8%** |
| Accuracy (pre VADER correction) | 48.9% |
| Dominant Error Pattern | SITTING / STANDING-style confusion between adjacent sentiment boundaries |

---

## Future Work

- Deep Learning sequence models (LSTM, GRU)
- Transformer-based fine-tuning (BERT, RoBERTa)
- Persistent real-time analytics dashboard
- Public REST API deployment
- Docker containerization
- CI/CD pipeline integration

---

## Author

<div align="center">

### Hồng Quân Nguyễn

Artificial Intelligence & Machine Learning Student — FPT University, Da Nang

<br>

<a href="https://github.com/NguyenHongQuan2k6">
<img src="https://img.shields.io/badge/GitHub-NguyenHongQuan2k6-black?style=for-the-badge&logo=github">
</a>

<a href="mailto:hongquannguyen2k6@gmail.com">
<img src="https://img.shields.io/badge/Email-Contact-red?style=for-the-badge&logo=gmail">
</a>

</div>

---

<p align="center">
Developed for educational and research purposes.
</p>
