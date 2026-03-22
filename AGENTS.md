# AGENTS.md

## Purpose
- This repository is a small full-stack AI Resume Assistant.
- Frontend: React 18 + Vite + Tailwind CSS in `frontend/`.
- Backend: FastAPI + SQLAlchemy + SQLite in `backend/`.
- Auth: JWT-based login/register.
- AI layer: OpenAI-compatible client with a local mock fallback.

## Repository Layout
- `frontend/src/App.jsx` composes the main dashboard shell and coordinates top-level page state.
- `frontend/src/api.js` contains browser-side API wrappers.
- `frontend/src/main.jsx` is the React entrypoint.
- `frontend/src/index.css` holds Tailwind directives and a few global styles.
- `backend/app/main.py` wires FastAPI, CORS, routers, and DB init.
- `backend/app/api/` contains route handlers.
- `backend/app/services/` contains AI and auth service logic.
- `backend/app/crud.py` contains DB access helpers.
- `backend/app/models.py` and `backend/app/schemas.py` define DB and API models.
- `backend/app/config.py` loads environment variables with `pydantic-settings`.

## Agent Rules Sources
- No root `AGENTS.md` existed at the time this file was generated.
- No `.cursorrules` file was found.
- No `.cursor/rules/` directory was found.
- No `.github/copilot-instructions.md` file was found.
- If any of those files are added later, treat them as higher-priority instructions than this document.

## Setup Overview
- Backend setup is documented in `README.md`.
- Frontend setup is documented in `README.md`.
- Backend expects a virtualenv inside `backend/.venv`.
- Frontend uses npm with `frontend/package-lock.json` present.
- The backend can run without `OPENAI_API_KEY`; it falls back to mock output.

## Build, Run, Lint, And Test Commands

### Frontend
- Install deps: `npm install` (run in `frontend/`)
- Start dev server: `npm run dev`
- Production build: `npm run build`
- Preview production build: `npm run preview`
- There is currently no frontend lint script in `frontend/package.json`.
- Frontend test suite: `npm run test`
- Frontend single test file: `npm run test:one -- src/path/to/test-file.test.jsx`

### Backend
- Create venv: `python -m venv .venv` (run in `backend/`)
- Activate venv on Windows PowerShell: `.venv\Scripts\Activate.ps1`
- Install deps: `pip install -r requirements.txt`
- Run API locally: `uvicorn app.main:app --reload`
- There is currently no backend lint configuration file.
- Backend full test command: `.venv\Scripts\python.exe -m unittest tests.test_history_api`
- Backend single-test command: `.venv\Scripts\python.exe -m unittest tests.test_history_api`

### Full App Dev Workflow
- Start backend from `backend/` with `uvicorn app.main:app --reload`
- Start frontend from `frontend/` with `npm run dev`
- Backend default URL: `http://127.0.0.1:8000`
- Frontend default URL: `http://127.0.0.1:5173`

## Testing Reality Check
- Do not assume Jest, Vitest, Pytest, ESLint, Prettier, Ruff, Black, or MyPy are installed.
- Do not add commands to docs as if they already exist unless you also add the supporting config.
- If you introduce tests, also add a reproducible script for running the full suite.
- If you introduce tests, also add a reproducible command for running one test file.
- If you introduce linting, wire it into `package.json` or a tracked Python config file.

## Recommended Single-Test Patterns
- Frontend with Vitest uses: `npm run test:one -- src/path/to/test-file.test.jsx`
- Frontend single test name with Vitest would usually use: `npx vitest run src/path/to/test-file.test.jsx -t "test name"`
- Backend with Pytest would usually use: `pytest tests/path/test_file.py`
- Backend single Pytest test would usually use: `pytest tests/path/test_file.py::test_name`
- Current tracked backend test command uses unittest instead: `.venv\Scripts\python.exe -m unittest tests.test_history_api`

## Environment Variables
- Backend settings are loaded from `backend/.env`.
- Reference template: `backend/.env.example`.
- Current supported vars from `backend/app/config.py`:
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- Keep secrets out of commits and examples.

## Python Style Guidelines
- Follow existing FastAPI + SQLAlchemy patterns already used in `backend/app/`.
- Use 4-space indentation.
- Prefer module-level imports grouped as stdlib, third-party, then local app imports.
- Keep imports explicit; current code uses absolute app imports like `from app import crud`.
- Use `snake_case` for functions, variables, and module names.
- Use `PascalCase` for classes like Pydantic schemas and SQLAlchemy models.
- Keep route functions short and centered on request/response behavior.
- Push persistence details into `crud.py` rather than duplicating query logic in route modules.
- Push reusable business logic into `backend/app/services/`.
- Preserve existing docstring style: short triple-quoted sentence summaries where helpful.
- Use type hints when the code already does so or when they improve clarity.
- Prefer concrete built-ins when reasonable, but match existing usage such as `List[str]` in current files.
- Return plain dicts only for simple ad hoc responses; otherwise prefer Pydantic response models.

## Python Error Handling
- Raise `HTTPException` in route handlers for user-facing API errors.
- Use explicit status codes for auth and missing-resource cases.
- Keep auth failures consistent with `detail="Could not validate credentials"` when appropriate.
- Service-level fallback behavior is already used in `ai_service.py`; preserve that resilience unless requirements change.
- Avoid swallowing exceptions silently unless there is an intentional fallback path.
- If catching broad exceptions, do it near a fallback boundary and keep the fallback deterministic.

## Database Conventions
- SQLAlchemy models use `Mapped[...]` and `mapped_column(...)`.
- `datetime.utcnow` is the current timestamp convention in models.
- DB sessions are provided through FastAPI dependency injection via `get_db()`.
- Current code commits inside CRUD helpers after writes.
- Preserve user scoping on records; history operations must stay per-user.
- Keep SQLite compatibility in mind, especially `check_same_thread=False` handling.

## React / Frontend Style Guidelines
- Follow the current codebase style: plain JavaScript, not TypeScript.
- Use functional components and React hooks.
- Use `PascalCase` for components and `camelCase` for functions, helpers, and state setters.
- Keep shared constants near the top of the module.
- Use double quotes and semicolons, matching existing files.
- Use 2-space indentation in frontend files.
- Prefer small helper functions for formatting/export logic instead of deeply nested inline logic.
- Keep API calls in `frontend/src/api.js`, not inline inside JSX markup.
- Keep browser storage keys centralized as constants like `TOKEN_KEY`.
- Prefer derived values through `useMemo` only when they simplify render logic.
- Keep the UI responsive with Tailwind utility classes; current layouts rely on `sm:` and `md:` breakpoints.

## Frontend Error Handling
- API helper functions throw `Error` objects with human-readable messages.
- Components catch async failures and surface them through `error` state.
- Preserve the current session-expiration pattern handled by `handleAuthError(...)`.
- Clear stale status messages before starting new async actions when that improves UX.
- Prefer user-friendly fallback text such as `"Failed to load records"` over raw exception dumps.

## Formatting And File Hygiene
- Keep changes minimal and consistent with surrounding code.
- Do not reformat unrelated files.
- Do not introduce new tooling configs unless the task requires them.
- Keep comments sparse; many current files use only a few practical comments.
- Avoid large one-file expansions when a helper module would make logic clearer.

## Naming Conventions To Preserve
- Backend request/response payload fields use `snake_case` to match FastAPI schemas.
- Frontend internal function names use `camelCase`.
- Tailwind color tokens use semantic names like `brand` in `tailwind.config.js`.
- Constants use `UPPER_SNAKE_CASE`.
- User-facing text is concise and action-oriented.

## API Integration Notes
- Frontend reads `VITE_API_BASE_URL` from the Vite environment.
- Authenticated frontend requests send `Authorization: Bearer <token>`.
- Paginated record responses use `items`, `total`, `page`, `page_size`, and `total_pages`.
- Resume optimization expects `resume_text`, `jd_text`, and `style`.

## When Making Changes
- Check whether the change belongs in frontend, backend, or both.
- Preserve the mock AI fallback unless the task explicitly removes it.
- Preserve login/register/me routes and per-user record isolation.
- If splitting `frontend/src/App.jsx`, keep behavior unchanged and move logic into clearly named modules.
- If adding tests or linting, update this file with exact supported commands.

## Safe Defaults For Future Agents
- Assume there are no enforced linters or formatters unless you add them.
- Assume there is no existing automated test suite unless you add it.
- Validate behavior by running the frontend build and backend app where relevant.
- Prefer incremental improvements over broad architectural rewrites.
