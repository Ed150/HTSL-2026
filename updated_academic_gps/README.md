# Academic GPS, Iteration 2

Academic GPS is a polished hackathon-quality path-building web app. Instead of a recommendation dashboard, the product centers on a branching visual pathway map where users grow an academic or career journey one bubble at a time.

## Concept summary

- Start with skills, interests, desired careers, desired opportunities, and skills to build.
- Enter a spatial map with one large active node and 3-5 nearby branching opportunity bubbles.
- Hover small bubbles to preview summary and skills gained.
- Click a bubble to make it the new active node and generate the next branch set.
- Backtrack by clicking visited nodes without losing alternate branches.
- Double-click nodes to open persistent detail tabs.
- Summarize a concrete path into steps, skills gained, and actionables.

## Architecture

```text
updated_academic_gps/
  frontend/
    src/
      components/
      pages/
      hooks/
      lib/
      types/
      data/
  backend/
    app/
      api/
      services/
      core/
      models/
      data/
```

## AWS usage

- Amazon Bedrock: theme selection adaptation, branch narration hooks, and end-of-path summaries in [bedrock_client.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/services/bedrock_client.py)
- Amazon OpenSearch Service: semantic related-term expansion hook in [opensearch_client.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/services/opensearch_client.py)
- Amazon S3: optional remote seed data loading in [s3_client.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/services/s3_client.py)

The app is structured so AWS adds value without blocking the local demo.

## Local fallback mode

If AWS is unavailable, the app still works using local seed templates in [seed_nodes.json](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/data/seed_nodes.json), local branching logic in [pathway_engine.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/core/pathway_engine.py), and the frontend demo profile in [demoProfile.ts](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/frontend/src/data/demoProfile.ts).

## Setup

### Backend

```bash
cd updated_academic_gps/backend
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8001
```

### Frontend

If PowerShell blocks `npm`, use `npm.cmd`.

```bash
cd updated_academic_gps/frontend
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5174`.

## Environment variables

Start from [.env.example](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/.env.example).

- `AWS_REGION`
- `ENABLE_BEDROCK`
- `BEDROCK_MODEL_ID`
- `ENABLE_OPENSEARCH`
- `OPENSEARCH_ENDPOINT`
- `OPENSEARCH_INDEX`
- `ENABLE_S3`
- `S3_BUCKET`
- `S3_BRANCH_DATA_KEY`
- `VITE_API_BASE_URL`

## Demo flow

1. Load the landing form and click `Load demo profile`.
2. Enter the pathway map and hover over nearby opportunity bubbles.
3. Click a branch to move the path forward.
4. Double-click a node to save its detail tab.
5. Zoom out, pan, and click a visited node to resume from an earlier choice point.
6. When a concrete destination appears, click `Summarize`.

## Key files

- Backend entry: [backend/app/main.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/main.py)
- Path engine: [backend/app/core/pathway_engine.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/core/pathway_engine.py)
- API routes: [backend/app/api/routes.py](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/backend/app/api/routes.py)
- Frontend app shell: [frontend/src/pages/App.tsx](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/frontend/src/pages/App.tsx)
- Branching canvas: [frontend/src/components/PathwayCanvas.tsx](/c:/Users/carin/Downloads/Carinthia%20Folder/CARINTHIA%20FOLDER/2025-2026%20school%20year/HTSL-2026/updated_academic_gps/frontend/src/components/PathwayCanvas.tsx)
