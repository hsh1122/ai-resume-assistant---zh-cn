import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


TEST_DB_DIR = Path(tempfile.mkdtemp(prefix="resume-assistant-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(TEST_DB_DIR / 'test.db').as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

from fastapi.testclient import TestClient

from app import crud
from app.database import SessionLocal, init_db
from app.main import app
from app.models import ResumeRecord, User
from app.services import ai_service
from app.services.auth_service import create_access_token, get_password_hash


class HistoryApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def setUp(self):
        with SessionLocal() as db:
            db.query(ResumeRecord).delete()
            db.query(User).delete()
            db.commit()

    def _create_user_and_token(self, username="history-user"):
        with SessionLocal() as db:
            user = crud.create_user(db, username=username, password_hash=get_password_hash("secret123"))
            crud.create_record(
                db=db,
                user_id=user.id,
                original_resume="Built search and automation systems for hiring teams.",
                jd_text="Need a product-minded engineer with analytics, automation, and dashboard skills.",
                style="Professional",
                optimized_resume="Optimized resume content focused on metrics, operations, and product impact.",
                match_analysis="Strong alignment on analytics, dashboards, and execution ownership.",
                suggestions=["Lead with quantified impact", "Mirror hiring-ops keywords"],
            )
            return create_access_token(subject=user.username)

    def _create_user_with_records(self, username, record_count):
        with SessionLocal() as db:
            user = crud.create_user(db, username=username, password_hash=get_password_hash("secret123"))
            record_ids = []
            for index in range(record_count):
                record = self._create_record_for_user(db, user.id, username, index + 1)
                record_ids.append(record.id)

            return create_access_token(subject=user.username), record_ids

    def _create_record_for_user(self, db, user_id, username, record_number):
        return crud.create_record(
            db=db,
            user_id=user_id,
            original_resume=f"Resume {record_number} for {username}",
            jd_text=f"JD {record_number} for {username}",
            style="Professional",
            optimized_resume=f"Optimized {record_number} for {username}",
            match_analysis=f"Analysis {record_number} for {username}",
            suggestions=[f"Suggestion {record_number} for {username}"],
        )

    def test_records_list_returns_summary_payload(self):
        token = self._create_user_and_token()

        response = self.client.get(
            "/api/records",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(len(payload["items"]), 1)

        item = payload["items"][0]
        self.assertIn("preview_text", item)
        self.assertIn("style", item)
        self.assertIn("created_at", item)
        self.assertNotIn("original_resume", item)
        self.assertNotIn("jd_text", item)
        self.assertNotIn("optimized_resume", item)
        self.assertNotIn("match_analysis", item)
        self.assertNotIn("suggestions", item)

    def test_records_list_returns_per_user_display_numbers_and_real_ids(self):
        user_one_token, user_one_record_ids = self._create_user_with_records("history-user-one", 1)
        user_two_token, user_two_record_ids = self._create_user_with_records("history-user-two", 1)
        with SessionLocal() as db:
            user_one = crud.get_user_by_username(db, "history-user-one")
            second_user_one_record = self._create_record_for_user(db, user_one.id, user_one.username, 2)
            user_one_record_ids.append(second_user_one_record.id)

        response = self.client.get(
            "/api/records?page=1&page_size=5",
            headers={"Authorization": f"Bearer {user_two_token}"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(len(payload["items"]), 1)

        item = payload["items"][0]
        self.assertEqual(item["id"], user_two_record_ids[0])
        self.assertEqual(item["display_number"], 1)

        response = self.client.get(
            "/api/records?page=1&page_size=5",
            headers={"Authorization": f"Bearer {user_one_token}"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 2)
        self.assertEqual([item["id"] for item in payload["items"]], list(reversed(user_one_record_ids)))
        self.assertEqual([item["display_number"] for item in payload["items"]], [2, 1])


class AiServiceCompatibilityTests(unittest.TestCase):
    def test_optimize_resume_accepts_fenced_json_content(self):
        with patch.object(ai_service.settings, "openai_api_key", "test-key"):
            with patch.object(ai_service.settings, "openai_base_url", "https://api.deepseek.com/v1"):
                with patch.object(ai_service.settings, "openai_model", "deepseek-chat"):
                    with patch("app.services.ai_service.OpenAI") as mock_openai:
                        mock_openai.return_value.chat.completions.create.return_value.choices = [
                            type(
                                "Choice",
                                (),
                                {
                                    "message": type(
                                        "Message",
                                        (),
                                        {
                                            "content": (
                                                "```json\n"
                                                "{\n"
                                                '  "optimized_resume": "Tailored resume",\n'
                                                '  "match_analysis": "Strong fit",\n'
                                                '  "suggestions": ["Quantify impact"]\n'
                                                "}\n"
                                                "```"
                                            )
                                        },
                                    )()
                                },
                            )()
                        ]

                        result = ai_service.optimize_resume(
                            "Built analytics workflows.",
                            "Need analytics and dashboard experience.",
                            "Professional",
                        )

        self.assertEqual(result["result_source"], "ai")
        self.assertEqual(result["optimized_resume"], "Tailored resume")
        self.assertEqual(result["match_analysis"], "Strong fit")
        self.assertEqual(result["suggestions"], ["Quantify impact"])


if __name__ == "__main__":
    unittest.main()
