# Project Notes

Last updated: 2026-03-24

## Purpose

This file is a lightweight handoff note for future Codex sessions.
Read it first when the conversation has become long, context feels compressed, or a new session starts.

## Current Product Scope

- Core flow: register/login -> paste resume and JD -> choose a mode -> optimize -> review results -> copy results -> reuse history.
- The app should feel like a small, stable workspace product, not a feature-heavy tool.
- Keep the focus on optimization quality, history reuse, and a clean dashboard flow.

## Confirmed Product Decisions

### Export

- `Markdown` export has been removed on purpose.
- `PDF` export has been removed on purpose.
- Do not reintroduce export features unless the user explicitly asks.
- Keep `copy all results` as the main outbound action.

### History Archive

- Desktop/wide layout only:
  - Remove the refresh action from saved history.
  - Keep the record count on one line.
  - Let the count use the remaining right-side space.
  - Make the search field wider than the mode field.
  - Keep the mode field narrow on desktop.
- Narrow/mobile layout is already considered correct.
- Do not change narrow/mobile history layout unless the user explicitly asks.

### Source Workspace

- The copy area should stay a compact quick-action card, not a large information panel.
- Desktop/wide layout:
  - The copy card should feel light and concise.
  - The operation center stays on the right.
  - The optimize CTA spans the full row below.
- Narrow/mobile layout:
  - Keep the stacked layout simple.
  - Do not optimize desktop spacing at the expense of mobile clarity.

### Testing And Cleanup

- Keep frontend automated tests in `frontend/src/*.test.jsx`.
- Keep backend automated tests in `backend/tests/`.
- Safe cleanup means temporary files, caches, build outputs, logs, and obviously broken local environments.
- Do not delete tracked tests as part of routine cleanup.

## Engineering Notes

- Frontend stack: React 18 + Vite + Tailwind CSS.
- Backend stack: FastAPI + SQLAlchemy + SQLite.
- AI layer: OpenAI-compatible backend client with mock fallback when no API key is configured.
- Invalid provider credentials should surface a visible auth/config error instead of silently returning mock output.

## Current Reality To Remember

- The codebase is the source of truth.
- Some repository docs may lag behind recent UI/product changes.
- If a future session sees conflicting notes in `README.md` versus the actual code, verify against the current implementation first.

## Recommended Next Priorities

1. Improve optimization prompt quality so key background information is preserved instead of over-compressed.
2. Make result sections easier to consume, especially the structure of match analysis and suggestions.
3. Add lightweight explanation of what each optimization mode tends to emphasize.
4. Avoid adding low-value output features before the core optimization quality feels strong.

## Quick Verification Commands

### Frontend

```powershell
cd D:\aiProject\ai-resume-assistant-zh-cn\frontend
npm run test
npm run build
```

### Backend

```powershell
cd D:\aiProject\ai-resume-assistant-zh-cn\backend
.venv\Scripts\python.exe -m unittest tests.test_history_api
```
