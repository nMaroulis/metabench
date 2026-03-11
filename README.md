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

*Scoring methodology whitepaper — TBA.*

[View Leaderboard](#features) · [Compare Models](#features) · [API Docs](http://localhost:8000/docs)

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
pip install -r requirements.txt
```

### 2. Start Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000 with interactive docs at http://localhost:8000/docs.

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
│   ├── db/database.py       # SQLAlchemy engine + session
│   ├── models.py            # DB models (Model, Benchmark, Score)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── normalization.py     # Score normalization + weighted scoring
│   ├── crud/                # Database operations
│   ├── scripts/seed_data.py # Sample data (15 LLMs, 12 benchmarks)
│   ├── api/routers.py       # All API route handlers
│   ├── clients/             # Benchmark clients
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
├── requirements.txt
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
