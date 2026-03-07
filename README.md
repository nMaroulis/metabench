# BenchIndex – Metacritic for LLMs

<div align="center">

**The definitive aggregator of LLM benchmark scores**

Aggregating results from MMLU, HumanEval, GSM8K, GPQA, and 10+ more benchmarks into a single **Overall Intelligence Score** per model.

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
- Python 3.13+ (or 3.11+)
- Node.js 18+
- npm

### 1. Clone & Setup Backend

```bash
git clone <repository-url>
cd benchindex

# Create virtual environment
python3.13 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

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
benchindex/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # DB models (Model, Benchmark, Score)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── normalization.py     # Score normalization + weighted scoring
│   ├── crud.py              # Database operations
│   ├── seed_data.py         # Sample data (15 LLMs, 12 benchmarks)
│   ├── api/routers.py       # All API route handlers
│   ├── scrapers/            # Future benchmark scrapers
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
2. Add new benchmark scrapers in `backend/scrapers/`
3. Submit community evaluations via the web form or API
4. Open a PR with your changes

## 📄 License

See [LICENSE](LICENSE) for details.
