# AI Resume Assistant

AI Resume Assistant is a small full-stack project for tailoring resumes to a target job description.
It combines a React dashboard, a FastAPI backend, JWT authentication, SQLite persistence, and an OpenAI-compatible AI layer with a local mock fallback.

Users can register, log in, paste a resume and job description, choose an optimization style, run a rewrite, review structured output, export results, and reopen previous runs from a personal history archive.

## Screenshots

### Dashboard Overview

![Dashboard overview](docs/images/dashboard-overview.png)

Full authenticated workspace with the source editor, result panels, and history archive in one screen.

### Feature Gallery

| Login / Register | Source Workspace |
| --- | --- |
| ![Login screen](docs/images/login-screen.png) | ![Source workspace](docs/images/source-workspace.png) |
| Auth gate with login and registration modes backed by JWT auth routes. | Resume and JD inputs, style selection, export actions, and the optimization trigger. |

| Results Review | History Archive |
| --- | --- |
| ![Results panel](docs/images/results-panel.png) | ![History archive](docs/images/history-archive.png) |
| Structured output with optimized resume text, match analysis, suggestions, and result source state. | Per-user saved runs with search, style filter, pagination, restore, and delete actions. |

## What The App Does

- Registers users and authenticates them with JWT-based login.
- Lets authenticated users submit `resume_text`, `jd_text`, and a selected optimization style.
- Returns three structured result blocks: optimized resume, match analysis, and suggestions.
- Supports three rewrite modes: Professional, Concise, and Achievement-Oriented.
- Stores optimization history per user in SQLite.
- Lets users search history, filter by style, reopen a saved run, and delete records.
- Supports copy-to-clipboard plus Markdown and PDF export from the frontend.
- Exposes FastAPI docs at `http://127.0.0.1:8000/docs`.

## Tech Stack

- Frontend: React 18, Vite 5, Tailwind CSS, jsPDF
- Backend: FastAPI, SQLAlchemy 2, SQLite, Pydantic Settings
- Auth: JWT via `python-jose` and password hashing via `passlib`
- AI: OpenAI Python SDK against an OpenAI-compatible base URL

## Product Flow

1. Register or log in.
2. Paste the current resume draft and target job description.
3. Choose an optimization mode.
4. Run the optimization request.
5. Review the generated resume package.
6. Export the result as Markdown or PDF if needed.
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
    \-- images/
```

### Key Files

- `frontend/src/App.jsx`: top-level app shell, auth gate, source workspace, results, and history layout
- `frontend/src/api.js`: browser-side API wrappers
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
- If the backend has no valid AI configuration, the UI still works because the service falls back to deterministic mock output.
