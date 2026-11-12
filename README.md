# BrewSpare

BrewSpare is a local-first brewery maintenance and spare-parts planning website. It connects machine condition, maintenance history, spare-part demand, supplier lead time, inventory carrying cost, and procurement timing into one decision-support workflow.

## Architecture

- Frontend: Next.js, React, and TypeScript
- Backend: FastAPI and SQLAlchemy
- Database: SQLite by default; PostgreSQL is supported through `DATABASE_URL`
- Analytics: deterministic demand forecasts, maintenance-risk logic, availability planning, and scenario analysis

## Quick start on Windows

### Backend

In PowerShell, from `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Backend: http://localhost:8000 · API docs: http://localhost:8000/docs

### Frontend

In a second PowerShell window, from `frontend`:

```powershell
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Website: http://localhost:3000

## Optional PostgreSQL

Set `DATABASE_URL`, for example:

```env
DATABASE_URL=postgresql+psycopg://brewspare:brewspare@localhost:5432/brewspare
```

Then run `python -m app.seed` from `backend`.

## Main demo journeys

1. Plant Command Center → select FL-01 Bottle Filler → review risk and required parts.
2. FL-01 → SP-010 Filler Valve Seal Kit → see future availability and procurement timing.
3. Procurement Planner → create a local planning record. No external purchase is placed.
4. Inventory → identify SP-015 as slow-moving or excess inventory.
5. Scenario Simulator → model supplier delay and production increase.

All plant, financial, maintenance, and sensor values are synthetic and intended for product demonstration only.
