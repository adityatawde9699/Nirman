# NIRMAN

**AI-Powered Industrial Approval & Compliance Orchestrator**  
From Business Idea to Compliant Operations — Faster, Simpler, Smarter.

Smart India Hackathon 2026 · **SIH26130**. This is a working demonstration, with no government connections or legally effective submissions.

## Run with PostgreSQL and Docker

```bash
cp .env.example .env
docker compose up --build
```

Open **http://localhost:3000**. FastAPI documentation is at **http://localhost:8000/docs**.

Compose starts PostgreSQL, seeds the database, starts FastAPI, and starts the Next.js frontend. Database and uploaded files persist in Docker volumes. No API key is required.

## Run locally

Requirements: Node.js 20.9+ (22 recommended) and Python 3.11+.

Terminal 1:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --env-file .env --host 0.0.0.0 --port 8000
```

The local default is SQLite so the demo starts without a database server. To use PostgreSQL locally, set `DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/nirman` in `backend/.env`. The same SQLAlchemy models and services support both databases.

Terminal 2:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

For a production frontend build, run `npm run build` and `npm start`. `API_URL` is the server-side proxy target and must be set before building; Docker builds it as `http://backend:8000`.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Entrepreneur | entrepreneur@nirman.demo | Not required |
| Government Officer | officer@nirman.demo | Not required |
| Administrator | admin@nirman.demo | Not required |

The profile menu allows immediate role switching without discarding project or application state. Registration creates an applicant account. Sessions are opaque backend tokens; restarting the backend requires signing in again. Run one backend worker for this demo.

## The judging journey

1. Launch the interactive demo and enter the applicant workspace.
2. Create a project: company, applicant, industry, investment, employees, location, and operational details. Use Manufacturing, Maharashtra, ₹15 Cr, 120 employees, and hazardous materials to match all 12 seeded approvals.
3. Discover approvals. Inspect the explanations and switch to the interactive dependency graph. The seeded critical path is **42 days**, calculated from dependency durations.
4. Open Documents. Upload a PDF or image with the category **Project Report** and run validation. Mock OCR uses 100 employees, producing an inconsistency against the 120-employee profile and a 92% demo consistency score.
5. Open Pollution Control Consent in Approvals and submit the demo application. The prototype accepts at least one uploaded document; the remaining checklist gaps remain visible in the risk assessment.
6. Switch to Government Officer. Open the new application in the workbench. Review the applicant, project, documents, explainable risk assessment and audit trail.
7. Request clarification, or schedule an inspection. Applicant notifications and application history update immediately.
8. Switch to Applicant. Upload the requested updated document and respond to the query, attaching a document from that project.
9. Switch to Officer. If an inspection was scheduled, complete it and enter a report in Inspections. The report field also accepts a `.txt` upload. Open the application and record an explicit human decision with a comment. Outstanding queries or incomplete inspections block approval.
10. Switch to Applicant. Track the decision. An approval creates its renewal record in Compliance. Explore the profile-matched scheme catalogue and regulatory assistant.
11. Switch to Admin to inspect rule toggles, departments, analytics and the recorded audit events.

Every regulatory assistant response includes **Source, Rule, and Explanation**. The sources and scheme benefits are clearly identified as demonstration content.

## What is real and what is simulated

**Working:** role checks on the API, applicant ownership boundaries, form validation, project persistence, rule matching, dependency timing, PDF/image upload storage, cross-profile validation, application submission, query responses, inspections, human decisions, notifications, generated renewals, scheme shortlisting, audit events, filters, exports, and calendar navigation.

**Simulated:** regulatory knowledge, scheme catalogue and eligibility estimates, OCR extraction, historical progress charts, compliance score, and sample reporting figures. Seeded project progress includes a demonstration status baseline; live application decisions override that baseline. No NSWS, government authentication, payment, official OCR, or legal submission integration is claimed.

Seed data contains **3 applicants, 5 projects, 12 approvals, 20 document records, 8 applications, 5 officers, 1 administrator, 5 departments, 10 compliance records, 5 schemes, and 20 initial audit events**. Seeded documents are fixture records; user uploads are actual stored files.

## Optional LLM

Set `OPENAI_API_KEY` and optionally `AI_MODEL` in the backend environment. The LLM only rephrases grounded demo facts. Rules and risk scoring stay deterministic, and API failure falls back to the deterministic response. The frontend never receives the key. No key is needed to judge the full workflow.

## Verification

```bash
cd backend
.venv/bin/python -m pytest -q
```

```bash
cd frontend
npm run typecheck
npm run build
npm run walkthrough
```

The walkthrough runs actual React screens with real FastAPI ASGI requests, using Happy DOM and an isolated in-memory database. It verifies interactions, not browser geometry, CSS rendering or the Next.js HTTP proxy. Its report is written to `output/playwright/dom-walkthrough.json`.

See [verification details](docs/verification.md), [architecture](docs/architecture.md), and [browser walkthrough](docs/browser-walkthrough.md).

### Restricted offline environment

During implementation, this workspace blocked downloads and network socket operations, including Chromium launch. Existing dependency caches were used. The frontend includes an opt-in `NIRMAN_OFFLINE_GRAPH=1` mode with a clearly labeled pan/zoom graph fallback and small UI primitive adapters. Normal installs use **React Flow, Radix Slot and class-variance-authority** directly.

With cached dependencies, the equivalent checks are:

```bash
cd frontend
npm run typecheck:offline
NIRMAN_OFFLINE_GRAPH=1 NEXT_TELEMETRY_DISABLED=1 node node_modules/next/dist/bin/next build --webpack
```

A live browser walkthrough and PostgreSQL container run still require an environment that permits sockets. They are not represented as completed checks.

## Project structure

```text
frontend/src/app/          Next.js route entry and responsive theme
frontend/src/components/  Applicant, officer, admin and public screens
frontend/src/components/ui/  shadcn/ui-pattern Button primitive
frontend/src/lib/          Typed API client and service interfaces
backend/app/              FastAPI routes, Pydantic input models, ORM and services
backend/tests/            Isolated journey and permission tests
scripts/                  Rendered UI walkthrough and ASGI bridge
compose.yaml              PostgreSQL + backend + frontend
```

The Button follows the [shadcn/ui](https://ui.shadcn.com/docs/components/button) composition pattern and uses NIRMAN’s theme. API implementation references: [Next.js App Router](https://nextjs.org/docs/app), [FastAPI file uploads](https://fastapi.tiangolo.com/tutorial/request-files/), and [OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).
