# Smart Health & Supply Chain Resilience

> AI-driven early warning and redistribution platform for Primary Health Centre (PHC) medicine stock-outs, built for **Build with AI: Code for Communities — Second Edition** (Hack2Skill), Track 3.

Predicts medicine shortages before they happen and recommends cross-district transfers to prevent them — using real Indian PHC data, Google Gemini for explainable and multilingual recommendations, and a simulated federated-learning architecture designed to scale across states without centralizing sensitive facility data.

---

## Problem

Public healthcare systems can struggle to maintain real-time visibility into medicine inventory, patient footfall, beds, and staff across their Primary Health Centre network. This leads to preventable stock-outs, inefficient resource allocation, and slow responses during health emergencies — one PHC may have surplus insulin while another, a short distance away, is about to run out.

## Solution

This platform shifts PHC resource management from **reactive** (wait for a shortage, then react) to **predictive** (forecast the shortage, act before it happens):

1. **Track** — real-time-style inventory, patient footfall, and bed/staff utilization per PHC
2. **Forecast** — predict medicine demand for the next 7–30 days using historical consumption and footfall trends
3. **Predict risk** — estimate stock-out probability per medicine, per facility
4. **Recommend** — when a shortage is predicted, find nearby facilities with surplus and rank feasible transfers by risk, distance, and delivery time
5. **Explain** — Google Gemini generates a plain-language explanation for every recommendation, in English and Hindi

---

## Features

- 📊 **Live dashboard** — national/state overview with PHC-level drill-down
- 🗺️ **Interactive map** — facilities color-coded by risk (normal / warning / critical)
- 📈 **Demand forecasting** — XGBoost/LightGBM model trained on historical consumption + footfall
- ⚠️ **Stock-out risk engine** — days-of-stock-remaining calculation with risk categorization
- 🔁 **Redistribution recommendations** — rule-based ranking of surplus-to-shortage transfers
- 🤖 **Gemini-powered explanations** — natural-language reasoning behind every recommendation
- 🌐 **Multilingual alerts** — English + Hindi, since PHC-level health workers aren't always English-first
- 🕸️ **Simulated federated learning** — models trained per-district on partitioned data with weight averaging, demonstrating a privacy-preserving architecture without centralizing raw facility data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Recharts, Leaflet |
| Backend | Node.js / Express |
| Database | PostgreSQL |
| AI / ML | Python, Pandas, NumPy, Scikit-learn, XGBoost / LightGBM |
| GenAI | Google Gemini API |
| Federated Learning | Simulated (data partitioning + weight averaging) |
| Deployment | Vercel (frontend) + Railway/Render (backend + DB) |

---

## Architecture

```
React Frontend
      ↓
Node.js / Express API
      ├── PostgreSQL
      └── Python AI Service
            ├── Demand Forecast (XGBoost/LightGBM)
            ├── Stock-Out Prediction
            ├── Redistribution Optimization
            ├── Federated Learning (simulated)
            └── Gemini (explanations + Hindi localization)
```

Each PHC is modeled as a node with its own local data (inventory, consumption, footfall). Forecasting models are trained per-district and aggregated centrally — demonstrating the architecture for privacy-preserving, scalable training without requiring raw data to leave its source.

---

## Dataset

- **Facility data**: 24 real, geolocated Primary Health Centres across 6 districts in Uttar Pradesh and Rajasthan, sourced from the [All India Health Centres Directory](https://www.data.gov.in/catalog/all-india-health-centres-directory) (geocoded facility data, originally compiled 2016 — facility *locations* don't change, so this remains accurate; only operational data below is time-sensitive)
- **Bed/staffing estimates**: calibrated against real state-wise aggregate counts from Rural Health Statistics (`data/RS_Session_265_AU_1714_B.csv`, `data/RS_Session_266_AU_911_C_to_D_iii.csv`), combined with IPHS norms (4–6 beds per PHC)
- **Operational data**: medicine stock, consumption, and patient footfall are **synthetic but realistic** — footfall drives consumption (not independent random values), stock depletes and refills on a simulated supplier lead time, and reorder cycles produce genuine stock-out risk patterns. Live PHC inventory data isn't publicly available, so this layer is generated; see the reasoning in `data/03_generate_timeseries.py`.
- Pipeline scripts (rerunnable, config at top of each file):
  - [`data/01_clean_phcs.py`](./data/01_clean_phcs.py) — cleans and samples the raw facility directory
  - [`data/02_medicines.py`](./data/02_medicines.py) — builds the medicine master list
  - [`data/03_generate_timeseries.py`](./data/03_generate_timeseries.py) — generates footfall, consumption, and inventory time series
- Loading into Postgres: [`db/load_data.py`](./db/load_data.py)

---

## Project Structure

```
health-resilience/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── charts/
│       ├── maps/
│       └── services/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
├── ai/
│   ├── forecasting/
│   ├── stockout/
│   ├── optimization/
│   ├── federated/       # simulated FL logic
│   └── gemini/           # explanation + translation calls
├── data/
│   ├── phcs.csv
│   ├── medicines.csv
│   ├── patient_visits.csv
│   ├── consumption.csv
│   ├── inventory.csv
│   ├── 01_clean_phcs.py
│   ├── 02_medicines.py
│   └── 03_generate_timeseries.py
├── db/
│   ├── schema.sql
│   └── load_data.py
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL
- A Google Gemini API key

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-org>/health-resilience.git
cd health-resilience

# Database — create it, then apply the schema and load the dataset
createdb health_resilience
psql health_resilience -f db/schema.sql
cd db && pip install -r ../ai/requirements.txt && cp .env.example .env  # add DATABASE_URL
python load_data.py
cd ..

# Backend
cd backend
npm install
cp .env.example .env   # add DATABASE_URL
npm run dev             # runs on http://localhost:5000

# AI service (separate terminal)
cd ai
pip install -r requirements.txt
cp .env.example .env   # add GEMINI_API_KEY
python -m uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run dev             # runs on http://localhost:5173
```

**Try it works**: once the backend and DB are up, `curl http://localhost:5000/api/phcs` should return your 24 seeded PHCs. Once the AI service is up, `curl -X POST http://localhost:8000/predictions/stockout -H "Content-Type: application/json" -d '{"phc_id":"PHC001","medicine_id":"MED004","current_stock":80,"avg_daily_consumption":25,"supplier_lead_time_days":7}'` should return a CRITICAL risk level.

### Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/health_resilience
GEMINI_API_KEY=your_gemini_api_key
AI_SERVICE_URL=http://localhost:8000
```

---

## API Overview

```
GET  /api/phcs                  # list all PHCs
GET  /api/phcs/:id               # PHC details
GET  /api/inventory/:phcId       # current stock levels
GET  /api/patients/:phcId        # footfall history
GET  /api/alerts                 # active stock-out alerts
GET  /api/forecasts/:phcId       # demand forecast
POST /api/predictions/stockout   # stock-out risk for a given medicine/PHC
GET  /api/recommendations        # ranked redistribution recommendations
POST /api/transfers              # approve a recommended transfer
```

---

## Demo

- 🎥 **Demo video**: [link]
- 🚀 **Live deployment**: [link]
- 📊 **Pitch deck**: [link]

---

## Team

- Shlok — [role]
- [Teammate] — [role]

---

## Roadmap / Future Work

- Real federated learning deployment (e.g. Flower) across live PHC nodes
- Differential privacy and secure aggregation
- Emergency-mode simulation for sudden demand spikes
- Bed and staff allocation prediction
- Role-based access control (Government Admin / District Admin / PHC Manager)
- Expansion beyond the current pilot states to full national coverage

---

## Acknowledgements

Built for **Build with AI: Code for Communities — Second Edition**, Track 3: Smart Health & Supply Chain Resilience (Hack2Skill).
