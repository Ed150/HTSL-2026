# Academic GPS

Academic GPS is a hackathon MVP for academic and career discovery. A student describes interests in plain language, and the product returns graph-driven recommendations for professors, labs, alumni, courses, events, and next actions. It also renders a visual pathway map and turns the recommendations into a calendar-aware weekly plan.

## Hackathon pitch

- Turn vague academic curiosity into a clear pathway in seconds.
- Combine recommendations, graph visualization, and scheduling in one demo flow.
- Move beyond search by suggesting the next best action, not just the next person.
- Stay demoable without AWS or Google credentials through a strong local fallback mode.

## Architecture

```text
academic_gps/
  backend/
    app/
      api/
      core/
      services/
      data/
      output/
  frontend/
    src/
  cli/
```

Flow:

1. FastAPI accepts student interests, skills, and goals.
2. The recommendation engine ranks seed data using deterministic scoring.
3. Bedrock hooks provide intent parsing, match explanations, and summary narration.
4. The pathway engine creates an academic-to-career progression.
5. The graph builder exports an interactive pathway map.
6. The scheduler finds free windows from Google Calendar or demo calendar data.
7. React renders the landing page, dashboard, pathway map, and weekly planner.

## AWS services used

- Amazon Bedrock in [bedrock_client.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/services/bedrock_client.py)
- Amazon OpenSearch Service in [opensearch_client.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/services/opensearch_client.py)
- Amazon Neptune in [neptune_client.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/services/neptune_client.py)
- Amazon S3 in [s3_client.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/services/s3_client.py)

The current implementation defaults to local demo mode and enables AWS only through environment flags.

## Google Calendar flow

1. The planner asks for a weekly plan after recommendations are generated.
2. If Google OAuth is configured, the backend can read busy windows and create confirmed events.
3. If it is not configured, Academic GPS falls back to [sample_calendar.json](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/data/sample_calendar.json).
4. The scheduler prioritizes short high-impact actions and fits them into free slots.

## Setup

### Backend

```bash
cd academic_gps/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd academic_gps/frontend
npm install
npm run dev
```

### CLI

```bash
python main.py demo
```

## Environment variables

Use [`.env.example`](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/.env.example) as the starting point.

Important variables:

- `AWS_REGION`
- `ENABLE_BEDROCK`
- `BEDROCK_MODEL_ID`
- `ENABLE_OPENSEARCH`
- `OPENSEARCH_ENDPOINT`
- `ENABLE_NEPTUNE`
- `NEPTUNE_ENDPOINT`
- `ENABLE_S3`
- `S3_BUCKET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

## CLI commands

```bash
python academic_gps/cli/app.py ingest-data
python academic_gps/cli/app.py discover --interest "quantum computing and photonics" --goal "research career"
python academic_gps/cli/app.py map --interest "quantum computing and photonics"
python academic_gps/cli/app.py explain --interest "AI for healthcare"
python academic_gps/cli/app.py plan --interest "robotics" --goal "industry" --calendar-summary academic_gps/backend/app/data/sample_calendar.json
python academic_gps/cli/app.py demo
```

## API endpoints

- `GET /api/health`
- `GET /api/demo`
- `POST /api/discover`
- `POST /api/map`
- `POST /api/planner/suggest`
- `POST /api/planner/create-event`
- `GET /api/auth/google/status`

## Demo flow for judges

1. Open the web app.
2. Click `Load Demo Mode`.
3. Show grouped recommendations and the narrated pathway.
4. Open the graph view and highlight the pathway from interest to alumni outcome.
5. Click `Generate Weekly Plan` to show calendar-aware scheduling.

## Generated artifacts

- Demo calendar: [sample_calendar.json](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/data/sample_calendar.json)
- Seed dataset: [seed_data.json](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/data/seed_data.json)
- Visual map export: [academic_gps_pathway_map.html](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/academic_gps/backend/app/output/academic_gps_pathway_map.html)
