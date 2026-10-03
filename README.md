# TravelOps

AI-powered travel operations platform: a mobile app for travel agents, ops and admins, backed by FastAPI services, a Groq LLM and Supabase. Built by Team Melt Down for Hack Fusion Hackathon 2026.

![React Native](https://img.shields.io/badge/React_Native-Expo_54-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Groq](https://img.shields.io/badge/LLM-Groq-purple)

## Features

- **Budget Smart Agent**: turns a customer budget into scored package recommendations with savings and AI insights.
- **Social Media Agent**: extracts destinations from YouTube/Instagram links for trend-based suggestions.
- **Rollback Engine**: saga-pattern compensation for failed multi-step bookings, with a dead-letter queue for manual resolution.
- **Role-based app**: Agent, Ops and Admin areas, plus credit-card offer recommendations.

## Architecture

```
Mobile app (Expo)
   ├── Supabase  : auth, data, RPC, realtime
   ├── AI Orchestrator (FastAPI :8000) ── Groq LLM ── Supabase
   └── Credit Cards service (FastAPI :8001)
```

| Path | Purpose |
|------|---------|
| `Frontend/` | Expo / React Native app (expo-router, NativeWind) |
| `Backend/ai_orchestrator/` | Budget, planner, simulation and social-media APIs |
| `Backend/credit_cards/` | Credit-card recommendation API |
| `Backend/database/`, `Backend/functions/` | Supabase SQL schemas, functions, sample data |

More detail in [ARCHITECTURE.md](ARCHITECTURE.md).

## Quick Start

**Prerequisites:** Node 18+, Python 3.10+, a [Supabase](https://supabase.com) project, a free [Groq API key](https://console.groq.com/keys), and Expo Go on your phone.

```bash
git clone https://github.com/Tejas-Santosh-Nalawade/Melt_Down.git
cd Melt_Down
```

**1. Database.** Run the SQL files from `Backend/database/schemas/` in the Supabase SQL editor (start with `complete-schema.sql`, then the rollback/lifecycle schemas, then `sample-data.sql`).

**2. Backends** (run in each of `Backend/ai_orchestrator` and `Backend/credit_cards`):

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # ai_orchestrator: set GROQ_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000   # use 8001 for credit_cards
```

**3. Mobile app:**

```bash
cd Frontend
npm install
cp .env.example .env             # Supabase URL/key + your computer's LAN IP
npx expo start                   # scan the QR code with Expo Go
```

Phone and computer must be on the same Wi-Fi; use the computer's IP, not `localhost`.

## Configuration

| Variable | Where | Description |
|----------|-------|-------------|
| `GROQ_API_KEY` | `Backend/ai_orchestrator/.env` | **Required.** Groq LLM key |
| `SUPABASE_URL`, `SUPABASE_KEY` | `Backend/ai_orchestrator/.env` | Supabase project |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` | `Frontend/.env` | Supabase project (anon key) |
| `EXPO_PUBLIC_API_URL` | `Frontend/.env` | Orchestrator URL, e.g. `http://192.168.1.10:8000` |
| `EXPO_PUBLIC_CREDIT_API_URL` | `Frontend/.env` | Credit-card service URL, port 8001 |

`.env` files are git-ignored. Never commit keys; copy from `.env.example`.

## API

Interactive docs at `http://localhost:8000/docs` and `http://localhost:8001/docs`.

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/budget/recommendations` | AI package recommendations for a budget |
| `POST /api/v1/plan` | Trip planning |
| `POST /api/v1/transactions/simulate` | Simulate a booking with failure and rollback |
| `GET /api/v1/llm/status` | LLM health |
| `POST /api/v1/recommendations` (:8001) | Credit-card recommendations |

## Build an Android APK

```bash
cd Frontend
npx eas build -p android --profile preview
```

## DPLC (Development & Product Life Cycle)

Deck: [Canva DPLC](https://www.canva.com/design/DAHApX7j9v4/A8maVIZLdyQIEfwvSY__sw/edit)

| Phase | Output | Where |
|-------|--------|-------|
| Plan | Problem, roles, scope | `TravelOps.pptx` |
| Design | Architecture, data model | [ARCHITECTURE.md](ARCHITECTURE.md), `Backend/database/` |
| Build | Schema, FastAPI agents, Expo app | `Backend/`, `Frontend/` |
| Test | API scripts, failure simulation, lint | `Backend/ai_orchestrator/test_*.py`, `npm run lint` |
| Deploy | Python host for APIs, EAS for the app | `Frontend/eas.json` |
| Monitor & iterate | DLQ and rollback dashboards, feedback | Ops area of the app |

## Further reading

- [Budget AI guide](Backend/ai_orchestrator/BUDGET_AI_GUIDE.md)
- [Simulation guide](Backend/ai_orchestrator/SIMULATION_DEMO_GUIDE.md)
- [Social media setup](Backend/ai_orchestrator/SOCIAL_MEDIA_SETUP.md)
- [Mobile quick start](Frontend/QUICK_START.md)

## Team

Team Melt Down: Tejas Santosh Nalawade and team. © 2026, all rights reserved.
