# AI Resume Assistant

AI Resume Assistant is a small full-stack workspace for tailoring a resume to a target job description.
It combines a React dashboard, a FastAPI backend, JWT authentication, SQLite persistence, and an OpenAI-compatible AI layer with a deterministic mock fallback.

The current product focuses on one tight loop: log in, prepare source material, run an optimization, review the structured output, copy what you need, and reopen previous runs from your personal history archive.

The UI is localized to Chinese. The screenshots below show a fresh walkthrough using the sample account `hhh666`, source resume text `清华大学 计算机科学与技术`, and target role summary `腾讯游戏开发`.

## Screenshots

### Dashboard Overview

![Dashboard overview](docs/images/dashboard-overview.png)

Authenticated dashboard overview after one completed optimization, with the source workspace, results review, and history archive visible together.

### Feature Gallery

| Login / Register | Source Workspace |
| --- | --- |
| ![Login screen](docs/images/login-screen.png) | ![Source workspace](docs/images/source-workspace.png) |
| Registration-first auth gate with `hhh666` entered in the account form backed by JWT auth routes. | Source workspace populated with `清华大学 计算机科学与技术`, `腾讯游戏开发`, quick copy actions, mode selection, and the optimization trigger. |

| Results Review | History Archive |
| --- | --- |
| ![Results panel](docs/images/results-panel.png) | ![History archive](docs/images/history-archive.png) |
| Structured output with the optimized resume text, match analysis, suggestions, and section-level copy actions for the sample Tencent game development flow. | Per-user saved runs showing the newly created `hhh666` optimization record alongside search, style filter, pagination, restore, and delete actions. |

## What The App Does

- Registers users and authenticates them with JWT-based login.
- Lets authenticated users submit `resume_text`, `jd_text`, and a selected optimization style.
- Supports three rewrite modes: Professional, Concise, and Achievement-Oriented.
- Returns three structured result blocks: optimized resume, match analysis, and suggestions.
- Lets users copy the full result package from the source workspace.
- Lets users copy individual result sections from the review area.
- Stores optimization history per user in SQLite.
- Lets users search history, filter by style, reopen a saved run, and delete records.
- Exposes FastAPI docs at `http://127.0.0.1:8000/docs`.

## Tech Stack

- Frontend: React 18, Vite 5, Tailwind CSS
- Backend: FastAPI, SQLAlchemy 2, SQLite, Pydantic Settings
- Auth: JWT via `python-jose` and password hashing via `passlib`
- AI: OpenAI Python SDK against an OpenAI-compatible base URL
- Frontend testing: Vitest + Testing Library
- Backend testing: `unittest`

## Product Flow

1. Register or log in.
2. Paste the current resume draft and target job description.
3. Choose an optimization mode.
4. Run the optimization request.
5. Review the generated resume package.
6. Copy the combined result when needed.
7. Reopen or delete previous runs from the history archive.

## Repository Structure

```text
.
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   +-- hooks/
|   |   +-- utils/
|   |   +-- App.jsx
|   |   +-- api.js
|   |   \-- main.jsx
|   \-- package.json
+-- backend/
|   +-- app/
|   |   +-- api/
|   |   +-- services/
|   |   +-- config.py
|   |   +-- crud.py
|   |   +-- main.py
|   |   +-- models.py
|   |   \-- schemas.py
|   +-- tests/
|   \-- requirements.txt
\-- docs/
    +-- PROJECT_NOTES.md
    \-- images/
```

### Key Files

- `frontend/src/App.jsx`: top-level app shell, auth gate, source workspace, results, and history layout
- `frontend/src/api.js`: browser-side API wrappers
- `frontend/src/components/ResumeForm.jsx`: source inputs, quick copy card, mode controls, and optimization trigger
- `frontend/src/components/OptimizationResult.jsx`: structured results review with per-section copy
- `frontend/src/components/HistoryList.jsx`: history archive shell, saved record cards, and pagination controls
- `backend/app/main.py`: FastAPI app creation, CORS, router wiring, DB init
- `backend/app/api/auth_routes.py`: register, login, and current-user endpoints
- `backend/app/api/routes.py`: optimize, list records, get record, delete record
- `backend/app/services/ai_service.py`: OpenAI-compatible request flow plus deterministic mock/fallback behavior
- `backend/app/crud.py`: database helpers and history queries

## Local Development

### Backend

From `backend/`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env` and set at least:

```env
JWT_SECRET_KEY=change_me_to_a_real_local_secret
```

Then start the API:

```powershell
uvicorn app.main:app --reload
```

### Frontend

From `frontend/`:

```powershell
npm install
copy .env.example .env.local
```

Set the frontend API base URL if needed:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Then start the Vite dev server:

```powershell
npm run dev
```

### App URLs

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- FastAPI docs: `http://127.0.0.1:8000/docs`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Leave empty to use local mock output |
| `OPENAI_BASE_URL` | No | OpenAI-compatible provider base URL |
| `OPENAI_MODEL` | No | Model name used by the backend AI client |
| `DATABASE_URL` | No | Defaults to SQLite in `backend/` |
| `JWT_SECRET_KEY` | Yes | Backend startup fails if this is empty |
| `JWT_ALGORITHM` | No | Defaults to `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token lifetime in minutes |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated frontend origins |

### Frontend (`frontend/.env.local`, `.env.development`, or `.env.production`)

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Base URL for the FastAPI backend |

## AI Behavior

The backend uses an OpenAI-compatible client and is configured for DeepSeek-style endpoints in the example env files.

When `/api/optimize` runs, the response may include:

- `result_source=ai`: a live model response was returned
- `result_source=mock`: no API key was configured, so deterministic local output was used
- `result_source=fallback`: a live request was attempted but the backend fell back to local output

The backend may also include `fallback_reason` values such as:

- `missing_api_key`
- `request_exception`
- `invalid_json_response`
- `empty_ai_response`
- `incomplete_ai_payload`

If provider credentials are invalid, the API returns an explicit authentication/configuration error instead of silently returning mock output.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Resume Optimization And History

- `POST /api/optimize`
- `GET /api/records?page=1&page_size=5&keyword=&style=`
- `GET /api/records/{id}`
- `DELETE /api/records/{id}`

## Testing And Verification

### Frontend

Run all frontend tests:

```powershell
cd frontend
npm run test
```

Run one frontend test file:

```powershell
cd frontend
npm run test:one -- src/components/ResumeForm.test.jsx
```

Build the frontend:

```powershell
cd frontend
npm run build
```

### Backend

Run the current backend test module:

```powershell
cd backend
.venv\Scripts\python.exe -m unittest tests.test_history_api
```

## Notes

- This repo currently uses plain JavaScript on the frontend, not TypeScript.
- The app is a single-page dashboard with an auth gate rather than a multi-route frontend.
- SQLite is the tracked local database default.
- Export actions were intentionally removed; the current outbound path is copy-to-clipboard plus history reuse.
- `docs/PROJECT_NOTES.md` stores lightweight handoff notes for future sessions.
