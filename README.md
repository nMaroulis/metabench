<h1 align="center">MetaBench</h1>


[![Python Version](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![ty](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ty/main/assets/badge/v0.json)](https://github.com/astral-sh/ty)

<div align="center">
  <img src="https://raw.githubusercontent.com/nMaroulis/metabench/main/frontend/public/logos/logo_bg.png" alt="MetaBench Logo" width="20%">
</div>
<div align="center">

### The Metacritic for LLMs

MetaBench aggregates **composite indexes** from well-known evaluation sites (e.g. Artificial Analysis, Chatbot Arena) alongside **raw benchmark scores** (MMLU-Pro, GPQA, LiveCodeBench, AIME, and 15+ more) to compute a single **Overall Intelligence Score** for every model, enabling fair, cross-source ranking on one unified leaderboard.

🌐 The original deployment can be found at  **[metabench.dev](https://metabench.dev)**

*Scoring methodology whitepaper - TBA.*

[View Leaderboard](#features) · [Compare Models](#features) · [API Docs](http://localhost:8080/docs)

</div>

---

## ✨ Features

- 🏆 **Unified Leaderboard** – Normalized 0-100 scores for fair cross-benchmark comparison
- 📊 **Interactive Charts** – Radar and bar charts for visual model comparison
- 🔍 **Deep Model Profiles** – Per-task breakdown, cost, latency, and confidence metrics
- ⚖️ **Side-by-Side Comparison** – Compare 2-5 models across all benchmarks
- 👥 **Community Submissions** – Contribute your evaluation results
- 📥 **Data Export** – Download full dataset as JSON or CSV
- 🌗 **Dark/Light Mode** – Beautiful UI with glassmorphism and smooth animations
- 🌐 **Multi-language support** – Filter benchmarks by evaluation language

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13, FastAPI, SQLAlchemy, SQLite |
| Frontend | React 18, Vite, TailwindCSS v3, Recharts |
| Icons | Lucide React |
| Fonts | Inter, Outfit, JetBrains Mono |

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- npm

### 1. Clone & Setup Backend

```bash
git clone <repository-url>
cd metabench

# Create virtual environment
python3.13 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 2. Start Backend

```bash
cd backend
uvicorn main:app --reload --port 8080
```

The API will be available at http://localhost:8080 with interactive docs at http://localhost:8080/docs.

> The database is automatically created and seeded with **15 models** and **12 benchmarks** on first startup.

### 3. Setup & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at http://localhost:5173.

### 4. (Optional) Docker

```bash
docker-compose up --build
```

## 🗄️ Database Population & Synchronization

MetaBench employs a rigorous system to acquire, enrich, and stay up to date with the latest AI model data, coordinated across three core components:

1. **Application Lifecycle (`backend/main.py`)**: 
   When the FastAPI application starts, it checks if the database exists. If the database is empty, it initializes the tables and triggers the initial data seed. If it already exists, it runs an update script to ensure the latest data is present. It also initializes an APScheduler background job that seamlessly pulls in new data every 6 hours (at 00:00, 06:00, 12:00, and 18:00).

2. **Initial Seeding (`backend/scripts/seed_data.py`)**: 
   The seeder handles the initial population of standard benchmarks and models. It fetches model data from the Artificial Analysis API. For every new model, it delegates heavy lifting to an LLM (such as OpenAI, Gemini, or Anthropic via `services/enrichment.py`) to search the web and extract intricate technical specifications (parameters, context window, architecture, etc.). It maps the benchmark scores, calculates a weighted overall intelligence score, and persists everything into the database.

3. **Incremental Updates (`backend/scripts/update_db.py`)**:
   To keep data fresh without significant overhead, MetaBench uses a fast three-way synchronization strategy:
   - **New Models**: Automatically discovered and fully enriched with technical specifications using the LLM pipeline.
   - **Existing Models**: Refreshed via a lightweight fast-path that updates pricing, throughput performance, and changing benchmark scores, completely bypassing the expensive LLM calls. 
   - **Stale Models**: Models present in the database but no longer returned by the upstream API are softly deactivated (`is_active=0`) to preserve historical benchmark performance without cluttering active leaderboards.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | List all models with metadata |
| GET | `/api/models/{name}` | Model detail with all scores |
| GET | `/api/benchmarks?model=NAME` | Per-task scores for a model |
| GET | `/api/compare?models=A,B,C` | Side-by-side comparison |
| GET | `/api/leaderboard?task=MMLU` | Filtered ranking |
| GET | `/api/export?format=json` | Export all data (json/csv) |
| POST | `/api/community/submit` | Submit community evaluation |
| GET | `/api/stats` | Platform statistics |

## 📁 Project Structure

```
metabench/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── requirements.txt     # Python dependencies
│   ├── db/database.py       # SQLAlchemy engine + session
│   ├── models.py            # DB models (Model, Benchmark, Score)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── crud/                # Database operations
│   ├── services/            # Business logic
│   │   ├── scoring.py       # Score normalization + weighted scoring
│   │   ├── enrichment.py    # LLM-based model metadata research
│   │   └── fetch_models.py  # Model data acquisition
│   ├── scripts/             # Maintenance & seeding
│   │   ├── seed_data.py     # Database seeding (LLMs + Benchmarks)
│   │   └── update_db.py     # Background update logic
│   ├── api/routers.py       # All API route handlers
│   ├── clients/             # External benchmark scrapers
│   └── tests/               # Unit tests
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, ModelCard, etc.
│   │   ├── pages/           # Landing, Leaderboard, Compare, etc.
│   │   ├── charts/          # Radar, Bar, Trend charts
│   │   ├── services/api.js  # API client
│   │   └── App.jsx          # Root component + routing
│   └── tailwind.config.js   # Custom design tokens
├── docker-compose.yml
└── README.md
```

## 🧪 Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

## 🤝 Contributing

1. Fork the repository
2. Add new benchmarks or indexes in `backend/clients/`
3. Submit community evaluations via the web form or API
4. Open a PR with your changes

## 📄 License

See [LICENSE](LICENSE) for details.
