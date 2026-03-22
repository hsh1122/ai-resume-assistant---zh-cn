from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth_routes import router as auth_router
from app.api.routes import router as api_router
from app.config import settings
from app.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize DB at app startup instead of import time."""
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="AI Resume Assistant API", version="0.2.0", lifespan=lifespan)

    # Allow frontend local dev server to call backend.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def health_check():
        """Simple endpoint to verify backend is running."""
        return {"message": "AI Resume Assistant backend is running"}

    app.include_router(auth_router)
    app.include_router(api_router)
    return app


app = create_app()
