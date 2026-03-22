from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


# check_same_thread=False is required for SQLite with FastAPI.
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """Create tables and run lightweight SQLite migrations for MVP."""
    Base.metadata.create_all(bind=engine)

    if settings.database_url.startswith("sqlite"):
        with engine.begin() as conn:
            table_info = conn.execute(text("PRAGMA table_info(resume_records)")).fetchall()
            columns = [row[1] for row in table_info]
            if "user_id" not in columns:
                conn.execute(text("ALTER TABLE resume_records ADD COLUMN user_id INTEGER"))
            if "record_number" not in columns:
                conn.execute(text("ALTER TABLE resume_records ADD COLUMN record_number INTEGER"))

            records_missing_numbers = conn.execute(
                text(
                    """
                    SELECT id, user_id
                    FROM resume_records
                    WHERE record_number IS NULL
                    ORDER BY user_id, created_at, id
                    """
                )
            ).fetchall()

            current_numbers = {}
            for record_id, user_id in records_missing_numbers:
                if user_id is None:
                    continue

                next_number = current_numbers.get(user_id)
                if next_number is None:
                    max_number = conn.execute(
                        text(
                            """
                            SELECT MAX(record_number)
                            FROM resume_records
                            WHERE user_id = :user_id
                            """
                        ),
                        {"user_id": user_id},
                    ).scalar()
                    next_number = (max_number or 0) + 1

                conn.execute(
                    text(
                        """
                        UPDATE resume_records
                        SET record_number = :record_number
                        WHERE id = :record_id
                        """
                    ),
                    {"record_number": next_number, "record_id": record_id},
                )
                current_numbers[user_id] = next_number + 1


def get_db():
    """FastAPI dependency: provide one DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
