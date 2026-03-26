import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx
from openai import AuthenticationError

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


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


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

    def test_record_detail_and_delete_stay_scoped_to_current_user(self):
        owner_token, owner_record_ids = self._create_user_with_records("history-owner", 1)
        other_user_token, _ = self._create_user_with_records("history-viewer", 1)
        owner_record_id = owner_record_ids[0]

        response = self.client.get(
            f"/api/records/{owner_record_id}",
            headers=auth_headers(other_user_token),
        )
        self.assertEqual(response.status_code, 404)

        response = self.client.delete(
            f"/api/records/{owner_record_id}",
            headers=auth_headers(other_user_token),
        )
        self.assertEqual(response.status_code, 404)

        response = self.client.get(
            f"/api/records/{owner_record_id}",
            headers=auth_headers(owner_token),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], owner_record_id)

        response = self.client.delete(
            f"/api/records/{owner_record_id}",
            headers=auth_headers(owner_token),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Record deleted successfully")

        response = self.client.get(
            f"/api/records/{owner_record_id}",
            headers=auth_headers(owner_token),
        )
        self.assertEqual(response.status_code, 404)


class AuthAndOptimizeApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def setUp(self):
        with SessionLocal() as db:
            db.query(ResumeRecord).delete()
            db.query(User).delete()
            db.commit()

    def test_register_login_and_me_endpoints_work_together(self):
        response = self.client.post(
            "/api/auth/register",
            json={"username": "  demo-user  ", "password": "secret123"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["username"], "demo-user")

        response = self.client.post(
            "/api/auth/login",
            json={"username": "demo-user", "password": "secret123"},
        )
        self.assertEqual(response.status_code, 200)
        token = response.json()["access_token"]
        self.assertTrue(token)

        response = self.client.get("/api/auth/me", headers=auth_headers(token))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "demo-user")

    def test_optimize_endpoint_returns_result_and_persists_record(self):
        with SessionLocal() as db:
            user = crud.create_user(db, username="opt-user", password_hash=get_password_hash("secret123"))
            user_id = user.id
        token = create_access_token(subject="opt-user")

        with patch("app.api.routes.optimize_resume") as mock_optimize_resume:
            mock_optimize_resume.return_value = {
                "optimized_resume": "Tailored resume output",
                "match_analysis": "Strong keyword coverage",
                "suggestions": ["Lead with outcomes"],
                "result_source": "fallback",
                "fallback_reason": "request_exception",
            }

            response = self.client.post(
                "/api/optimize",
                headers=auth_headers(token),
                json={
                    "resume_text": "负责简历优化和投递支持",
                    "jd_text": "需要熟悉 ATS、简历优化和数据分析",
                    "style": "Professional",
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["optimized_resume"], "Tailored resume output")
        self.assertEqual(payload["match_analysis"], "Strong keyword coverage")
        self.assertEqual(payload["suggestions"], ["Lead with outcomes"])
        self.assertEqual(payload["result_source"], "fallback")
        self.assertEqual(payload["fallback_reason"], "request_exception")

        with SessionLocal() as db:
            records, total = crud.get_records_paginated(db, user_id=user_id, page=1, page_size=5)
            self.assertEqual(total, 1)
            self.assertEqual(records[0].original_resume, "负责简历优化和投递支持")
            self.assertEqual(records[0].jd_text, "需要熟悉 ATS、简历优化和数据分析")
            self.assertEqual(records[0].optimized_resume, "Tailored resume output")

    def test_optimize_endpoint_surfaces_provider_auth_failure_instead_of_mocking(self):
        with SessionLocal() as db:
            user = crud.create_user(db, username="provider-auth-user", password_hash=get_password_hash("secret123"))
            user_id = user.id
        token = create_access_token(subject="provider-auth-user")

        auth_error = AuthenticationError(
            "Authentication failed",
            response=httpx.Response(
                401,
                request=httpx.Request("POST", "https://api.deepseek.com/v1/chat/completions"),
            ),
            body={"error": {"message": "invalid api key"}},
        )

        mock_client = type(
            "MockClient",
            (),
            {
                "chat": type(
                    "MockChat",
                    (),
                    {
                        "completions": type(
                            "MockCompletions",
                            (),
                            {"create": staticmethod(lambda **_: (_ for _ in ()).throw(auth_error))},
                        )()
                    },
                )()
            },
        )()

        with patch.object(ai_service.settings, "openai_api_key", "test-key"):
            with patch.object(ai_service.settings, "openai_base_url", "https://api.deepseek.com/v1"):
                with patch.object(ai_service.settings, "openai_model", "deepseek-chat"):
                    with patch("app.services.ai_service.OpenAI", return_value=mock_client):
                        response = self.client.post(
                            "/api/optimize",
                            headers=auth_headers(token),
                            json={
                                "resume_text": "负责简历优化和投递支持",
                                "jd_text": "需要熟悉 ATS、简历优化和数据分析",
                                "style": "Professional",
                            },
                        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["detail"], "AI provider authentication failed")

        with SessionLocal() as db:
            records, total = crud.get_records_paginated(db, user_id=user_id, page=1, page_size=5)
            self.assertEqual(total, 0)
            self.assertEqual(records, [])


class AiServiceCompatibilityTests(unittest.TestCase):
    def test_build_prompt_requires_truthful_conditional_suggestions_for_missing_skills(self):
        prompt = ai_service._build_prompt(
            "清华大学，计算机相关专业。负责 Python 数据看板开发，与产品和运营协作，优化周报流程。",
            "岗位要求：熟悉 Python 和 SQL，有数据看板负责人经验，具备跨团队沟通能力。",
            "Professional",
        )

        self.assertIn(
            "For missing job-description skills, write conditional suggestions such as 'if you truly have this experience, add evidence; otherwise do not claim it'",
            prompt,
        )
        self.assertIn("Do not tell the user to add a skill, tool, or achievement unless it is truthful", prompt)

    def test_build_prompt_requires_resume_to_be_the_only_source_of_truth_for_optimized_resume(self):
        prompt = ai_service._build_prompt(
            "清华大学，计算机相关专业。负责 Python 数据看板开发，与产品和运营协作，优化周报流程。",
            "岗位要求：熟悉 Python 和 SQL，有数据看板负责人经验，具备跨团队沟通能力。",
            "Professional",
        )

        self.assertIn("Treat the resume as the only source of truth for optimized_resume", prompt)
        self.assertIn(
            "Never convert a job requirement into a candidate claim unless the resume already states it",
            prompt,
        )
        self.assertIn(
            "If SQL appears only in the job description and not in the resume, do not write SQL into optimized_resume",
            prompt,
        )
        self.assertIn("When evidence is limited, keep the wording conservative", prompt)

    def test_build_prompt_requires_source_grounded_resume_rewrite(self):
        prompt = ai_service._build_prompt(
            "清华大学，计算机相关专业。负责 Python 数据看板开发，与产品和运营协作，优化周报流程。",
            "岗位要求：熟悉 Python 和 SQL，有数据看板负责人经验，具备跨团队沟通能力。",
            "Professional",
        )

        self.assertIn("If a job-description keyword is not supported by the resume, do not include it in optimized_resume", prompt)
        self.assertIn(
            "Unsupported keywords should appear only as missing gaps in match_analysis or follow-up actions in suggestions",
            prompt,
        )
        self.assertIn("Do not turn a sparse resume into a generic profile summary", prompt)
        self.assertIn(
            "Keep the candidate's concrete education, responsibilities, collaboration context, and workflow details visible in optimized_resume",
            prompt,
        )

    def test_build_prompt_requires_language_matched_and_active_rewrite_guidance(self):
        prompt = ai_service._build_prompt(
            "清华大学，计算机相关专业。负责 Python 数据看板开发，与产品和运营协作，优化周报流程。",
            "岗位要求：熟悉 Python 和 SQL，有数据看板负责人经验，具备跨团队沟通能力。",
            "Professional",
        )

        self.assertIn(
            "If the resume and job description are primarily in Chinese, return optimized_resume, match_analysis, and suggestions in Chinese",
            prompt,
        )
        self.assertIn("Do not simply copy or lightly polish the original resume text", prompt)
        self.assertIn(
            "Rewrite and reorder the resume content to improve relevance, clarity, and emphasis while preserving facts",
            prompt,
        )
        self.assertIn("Keep match_analysis concise and easy to scan", prompt)
        self.assertIn("Write suggestions as brief, practical resume revision actions in the same language as the input", prompt)

    def test_build_prompt_requires_structured_analysis_and_prioritized_suggestions(self):
        # 生成 Prompt，用来检查分析和建议的输出格式是否被明确约束
        prompt = ai_service._build_prompt(
            "Built Python dashboards, improved reporting efficiency, and worked with product stakeholders.",
            "Need Python, SQL, dashboard ownership, stakeholder communication, and measurable business impact.",
            "Professional",
        )

        self.assertIn("In match_analysis, summarize the strongest alignment, the most important gaps, and an overall fit judgment", prompt)
        self.assertIn("Return 3 to 5 suggestions", prompt)
        self.assertIn("Order suggestions from highest priority to lowest priority", prompt)
        self.assertIn("Each suggestion should describe a concrete resume revision action", prompt)

    def test_build_prompt_requires_truthful_keyword_alignment(self):
        prompt = ai_service._build_prompt(
            "Built Python dashboards and collaborated with product stakeholders.",
            "Need Python, SQL, dashboard ownership, stakeholder communication, and measurable business impact.",
            "Professional",
        )

        self.assertIn("Mirror important job-description keywords only when they are supported by the resume", prompt)
        self.assertIn("Do not force unsupported keywords into the optimized resume", prompt)
        self.assertIn("Prefer ATS-friendly wording while staying truthful", prompt)

    def test_build_prompt_includes_style_specific_guidance(self):
        professional_prompt = ai_service._build_prompt(
            "Built backend APIs and internal tools.",
            "Need reliable engineering execution and stakeholder communication.",
            "Professional",
        )
        concise_prompt = ai_service._build_prompt(
            "Built backend APIs and internal tools.",
            "Need reliable engineering execution and stakeholder communication.",
            "Concise",
        )
        achievement_prompt = ai_service._build_prompt(
            "Built backend APIs and internal tools.",
            "Need reliable engineering execution and stakeholder communication.",
            "Achievement-Oriented",
        )

        self.assertIn("Use polished, professional, and balanced wording", professional_prompt)
        self.assertIn("Keep the rewrite concise and remove lower-priority details", concise_prompt)
        self.assertIn("Emphasize measurable outcomes, ownership, and business impact", achievement_prompt)

    def test_build_prompt_emphasizes_truthfulness_and_fact_preservation(self):
        prompt = ai_service._build_prompt(
            "Tsinghua University\nBuilt an internal dashboard and reduced review time by 30%.",
            "Need Python, dashboard experience, stakeholder communication, and measurable business impact.",
            "Professional",
        )

        self.assertIn("Do not invent or assume any experience, project, metric, title, technology, or result", prompt)
        self.assertIn("Preserve important facts from the original resume", prompt)
        self.assertIn("company names, project names, technologies, dates, and quantified outcomes", prompt)
        self.assertIn("missing evidence", prompt)
        self.assertIn("Return STRICT JSON only", prompt)

    def test_build_prompt_requires_gap_analysis_and_resume_focused_suggestions(self):
        prompt = ai_service._build_prompt(
            "Built analytics dashboards and improved stakeholder reporting rhythm.",
            "Need dashboard ownership, stakeholder communication, and measurable business impact.",
            "Professional",
        )

        self.assertIn("call out the strongest matched evidence and the most important gaps", prompt)
        self.assertIn("Base suggestions only on the provided resume and job description", prompt)
        self.assertIn("Do not give generic job-search advice", prompt)
        self.assertIn("Prioritize the highest-impact resume edits first", prompt)

    def test_build_grounded_rewrite_prompt_uses_extracted_facts_as_source_of_truth(self):
        extracted_facts = {
            "language": "Chinese",
            "source_facts": [
                "清华大学，计算机相关专业",
                "负责 Python 数据看板开发",
                "与产品和运营协作",
            ],
            "supported_requirements": ["Python", "跨团队沟通"],
            "unsupported_requirements": ["SQL", "量化业务成果"],
        }

        prompt = ai_service._build_grounded_rewrite_prompt(
            jd_text="岗位要求：熟悉 Python 和 SQL，具备跨团队沟通能力。",
            style="Professional",
            extracted_facts=extracted_facts,
        )

        self.assertIn("Use the grounded facts below as the only source of truth for optimized_resume", prompt)
        self.assertIn("Unsupported requirements may appear only in match_analysis and suggestions", prompt)
        self.assertIn("清华大学，计算机相关专业", prompt)
        self.assertIn("SQL", prompt)

    def test_build_grounded_rewrite_prompt_avoids_generic_english_profile_for_chinese_facts(self):
        extracted_facts = {
            "language": "Chinese",
            "source_facts": [
                "清华大学，计算机相关专业",
                "负责 Python 数据看板开发",
                "与产品和运营协作",
                "优化周报流程，提升汇报效率",
            ],
            "supported_requirements": ["Python", "跨团队沟通"],
            "unsupported_requirements": ["SQL"],
        }

        prompt = ai_service._build_grounded_rewrite_prompt(
            jd_text="岗位要求：熟悉 Python 和 SQL，具备跨团队沟通能力。",
            style="Professional",
            extracted_facts=extracted_facts,
        )

        self.assertIn(
            "Do not write an English profile summary or generic English section headings when the grounded facts are Chinese",
            prompt,
        )
        self.assertIn("Do not replace concrete grounded facts with generic capability claims", prompt)
        self.assertIn("Grounded facts that must stay visible in optimized_resume", prompt)

    def test_build_grounded_rewrite_prompt_requires_brief_chinese_resume_edit_suggestions(self):
        extracted_facts = {
            "language": "Chinese",
            "source_facts": [
                "娓呭崕澶у锛岃绠楁満鐩稿叧涓撲笟",
                "璐熻矗 Python 鏁版嵁鐪嬫澘寮€鍙?",
                "涓庝骇鍝佸拰杩愯惀鍗忎綔",
                "浼樺寲鍛ㄦ姤娴佺▼锛屾彁鍗囨眹鎶ユ晥鐜?",
            ],
            "supported_requirements": ["Python", "璺ㄥ洟闃熸矡閫?"],
            "unsupported_requirements": ["SQL"],
        }

        prompt = ai_service._build_grounded_rewrite_prompt(
            jd_text="宀椾綅瑕佹眰锛氱啛鎮?Python 鍜?SQL锛屽叿澶囪法鍥㈤槦娌熼€氳兘鍔涖€?",
            style="Professional",
            extracted_facts=extracted_facts,
        )

        self.assertIn(
            "When the grounded facts are Chinese, write each suggestion as one short Chinese resume-edit action",
            prompt,
        )
        self.assertIn("Avoid long consultant-style explanations or multi-sentence coaching paragraphs in suggestions", prompt)
        self.assertIn("Prefer direct actions such as clarify, quantify, move, foreground, or specify", prompt)

    def test_build_grounded_rewrite_prompt_treats_unsupported_requirements_only_as_gaps(self):
        extracted_facts = {
            "language": "Chinese",
            "source_facts": [
                "娓呭崕澶у锛岃绠楁満鐩稿叧涓撲笟",
                "璐熻矗 Python 鏁版嵁鐪嬫澘寮€鍙?",
            ],
            "supported_requirements": ["Python"],
            "unsupported_requirements": ["SQL", "鏁版嵁鐪嬫澘璐熻矗浜虹粡楠?"],
        }

        prompt = ai_service._build_grounded_rewrite_prompt(
            jd_text="宀椾綅瑕佹眰锛氱啛鎮?Python 鍜?SQL锛屾湁鏁版嵁鐪嬫澘璐熻矗浜虹粡楠屻€?",
            style="Professional",
            extracted_facts=extracted_facts,
        )

        self.assertIn("Only describe requirements in supported_requirements as matched evidence", prompt)
        self.assertIn("Treat every requirement in unsupported_requirements strictly as a gap", prompt)
        self.assertIn("Do not upgrade related experience into stronger ownership, leadership, or requirement coverage unless it is directly stated in grounded facts", prompt)

    def test_build_grounded_rewrite_prompt_avoids_invented_example_tools_in_suggestions(self):
        extracted_facts = {
            "language": "Chinese",
            "source_facts": [
                "娓呭崕澶у锛岃绠楁満鐩稿叧涓撲笟",
                "鍙備笌鍚庣鎺ュ彛寮€鍙戝拰鍐呴儴宸ュ叿缁存姢",
            ],
            "supported_requirements": ["Python"],
            "unsupported_requirements": ["SQL"],
        }

        prompt = ai_service._build_grounded_rewrite_prompt(
            jd_text="宀椾綅瑕佹眰锛氱啛鎮?Python 鍜?SQL锛屾湁鍚庣寮€鍙戠粡楠屻€?",
            style="Professional",
            extracted_facts=extracted_facts,
        )

        self.assertIn("Do not suggest specific tools, frameworks, metrics, or example achievements that are not present in grounded facts", prompt)
        self.assertIn("Use neutral placeholders such as 'if true, add the exact tool or metric you actually used'", prompt)

    def test_build_grounded_rewrite_prompt_explicitly_separates_supported_and_unsupported_requirements(self):
        extracted_facts = {
            "language": "Chinese",
            "source_facts": [
                "娓呭崕澶у锛岃绠楁満鐩稿叧涓撲笟",
                "璐熻矗 Python 鏁版嵁鐪嬫澘寮€鍙?",
            ],
            "supported_requirements": ["Python"],
            "unsupported_requirements": ["SQL", "鏁版嵁鐪嬫澘璐熻矗浜虹粡楠?"],
        }

        prompt = ai_service._build_grounded_rewrite_prompt(
            jd_text="宀椾綅瑕佹眰锛氱啛鎮?Python 鍜?SQL锛屾湁鏁版嵁鐪嬫澘璐熻矗浜虹粡楠屻€?",
            style="Professional",
            extracted_facts=extracted_facts,
        )

        self.assertIn("Supported requirements that may be described as matched", prompt)
        self.assertIn("Unsupported requirements that must remain gaps", prompt)
        self.assertIn("Do not describe unsupported requirements as partially matched, partially aligned, or indirectly satisfied", prompt)

    def test_optimize_resume_uses_two_stage_generation_with_extracted_facts(self):
        extraction_response = type(
            "Response",
            (),
            {
                "choices": [
                    type(
                        "Choice",
                        (),
                        {
                            "message": type(
                                "Message",
                                (),
                                {
                                    "content": (
                                        "{"
                                        '"language": "English", '
                                        '"source_facts": ["Built analytics workflows."], '
                                        '"supported_requirements": ["analytics"], '
                                        '"unsupported_requirements": ["dashboard ownership"]'
                                        "}"
                                    )
                                },
                            )()
                        },
                    )()
                ]
            },
        )()

        rewrite_response = type(
            "Response",
            (),
            {
                "choices": [
                    type(
                        "Choice",
                        (),
                        {
                            "message": type(
                                "Message",
                                (),
                                {
                                    "content": (
                                        "{"
                                        '"optimized_resume": "Tailored resume", '
                                        '"match_analysis": "Strong fit", '
                                        '"suggestions": ["Quantify impact"]'
                                        "}"
                                    )
                                },
                            )()
                        },
                    )()
                ]
            },
        )()

        with patch.object(ai_service.settings, "openai_api_key", "test-key"):
            with patch.object(ai_service.settings, "openai_base_url", "https://api.deepseek.com/v1"):
                with patch.object(ai_service.settings, "openai_model", "deepseek-chat"):
                    with patch("app.services.ai_service.OpenAI") as mock_openai:
                        mock_openai.return_value.chat.completions.create.side_effect = [
                            extraction_response,
                            rewrite_response,
                        ]

                        result = ai_service.optimize_resume(
                            "Built analytics workflows.",
                            "Need analytics and dashboard experience.",
                            "Professional",
                        )

        self.assertEqual(mock_openai.return_value.chat.completions.create.call_count, 2)
        first_prompt = mock_openai.return_value.chat.completions.create.call_args_list[0].kwargs["messages"][1]["content"]
        second_prompt = mock_openai.return_value.chat.completions.create.call_args_list[1].kwargs["messages"][1]["content"]
        self.assertIn("Extract grounded facts from the resume only", first_prompt)
        self.assertIn("Use the grounded facts below as the only source of truth for optimized_resume", second_prompt)
        self.assertIn("Built analytics workflows.", second_prompt)
        self.assertEqual(result["optimized_resume"], "Tailored resume")

    def test_optimize_resume_uses_low_temperature_for_grounded_rewrite(self):
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
                                                "{"
                                                '"optimized_resume": "Tailored resume", '
                                                '"match_analysis": "Strong fit", '
                                                '"suggestions": ["Quantify impact"]'
                                                "}"
                                            )
                                        },
                                    )()
                                },
                            )()
                        ]

                        ai_service.optimize_resume(
                            "Built analytics workflows.",
                            "Need analytics and dashboard experience.",
                            "Professional",
                        )

        self.assertEqual(
            mock_openai.return_value.chat.completions.create.call_args.kwargs["temperature"],
            0.2,
        )

    def test_optimize_resume_accepts_fenced_json_content(self):
        with patch.object(ai_service.settings, "openai_api_key", "test-key"):
            with patch.object(ai_service.settings, "openai_base_url", "https://api.deepseek.com/v1"):
                with patch.object(ai_service.settings, "openai_model", "deepseek-chat"):
                    with patch("app.services.ai_service.OpenAI") as mock_openai:
                        extraction_response = type(
                            "Response",
                            (),
                            {
                                "choices": [
                                    type(
                                        "Choice",
                                        (),
                                        {
                                            "message": type(
                                                "Message",
                                                (),
                                                {
                                                    "content": (
                                                        "{"
                                                        '"language": "English", '
                                                        '"source_facts": ["Built analytics workflows."], '
                                                        '"supported_requirements": ["analytics"], '
                                                        '"unsupported_requirements": []'
                                                        "}"
                                                    )
                                                },
                                            )()
                                        },
                                    )()
                                ]
                            },
                        )()
                        rewrite_response = type(
                            "Response",
                            (),
                            {
                                "choices": [
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
                            },
                        )()
                        mock_openai.return_value.chat.completions.create.side_effect = [
                            extraction_response,
                            rewrite_response,
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

    def test_optimize_resume_retries_once_when_grounded_rewrite_returns_invalid_json(self):
        with patch.object(ai_service.settings, "openai_api_key", "test-key"):
            with patch.object(ai_service.settings, "openai_base_url", "https://api.deepseek.com/v1"):
                with patch.object(ai_service.settings, "openai_model", "deepseek-chat"):
                    with patch("app.services.ai_service.OpenAI") as mock_openai:
                        extraction_response = type(
                            "Response",
                            (),
                            {
                                "choices": [
                                    type(
                                        "Choice",
                                        (),
                                        {
                                            "message": type(
                                                "Message",
                                                (),
                                                {
                                                    "content": (
                                                        "{"
                                                        '"language": "English", '
                                                        '"source_facts": ["Built analytics workflows."], '
                                                        '"supported_requirements": ["analytics"], '
                                                        '"unsupported_requirements": []'
                                                        "}"
                                                    )
                                                },
                                            )()
                                        },
                                    )()
                                ]
                            },
                        )()
                        invalid_rewrite_response = type(
                            "Response",
                            (),
                            {
                                "choices": [
                                    type(
                                        "Choice",
                                        (),
                                        {
                                            "message": type(
                                                "Message",
                                                (),
                                                {
                                                    "content": "This is not valid JSON.",
                                                },
                                            )()
                                        },
                                    )()
                                ]
                            },
                        )()
                        valid_rewrite_response = type(
                            "Response",
                            (),
                            {
                                "choices": [
                                    type(
                                        "Choice",
                                        (),
                                        {
                                            "message": type(
                                                "Message",
                                                (),
                                                {
                                                    "content": (
                                                        "{"
                                                        '"optimized_resume": "Tailored resume", '
                                                        '"match_analysis": "Strong fit", '
                                                        '"suggestions": ["Quantify impact"]'
                                                        "}"
                                                    )
                                                },
                                            )()
                                        },
                                    )()
                                ]
                            },
                        )()
                        mock_openai.return_value.chat.completions.create.side_effect = [
                            extraction_response,
                            invalid_rewrite_response,
                            valid_rewrite_response,
                        ]

                        result = ai_service.optimize_resume(
                            "Built analytics workflows.",
                            "Need analytics and dashboard experience.",
                            "Professional",
        )

        self.assertEqual(mock_openai.return_value.chat.completions.create.call_count, 3)
        self.assertEqual(result["result_source"], "ai")
        self.assertEqual(result.get("fallback_reason"), None)
        self.assertEqual(result["optimized_resume"], "Tailored resume")


class EvalSampleScoringTests(unittest.TestCase):
    def test_evaluate_case_output_accepts_english_action_word_consider(self):
        from app.services import eval_service

        case = {
            "id": "en_action_word_consider",
            "checks": {
                "language": "English",
                "must_keep": ["internal API"],
                "must_not_claim": ["SQL"],
                "should_flag_as_gap": ["SQL"],
            },
        }
        result = {
            "optimized_resume": "Built internal API tooling.",
            "match_analysis": "SQL is still a gap.",
            "suggestions": [
                "Add quantified metrics for workflow impact.",
                "Describe a specific debugging scenario.",
                "Consider reordering the API development example to the top.",
            ],
            "result_source": "ai",
        }

        evaluation = eval_service.evaluate_case_output(case, result)

        self.assertTrue(evaluation["checks"]["actionable_suggestions_ok"])

    def test_evaluate_case_output_accepts_chinese_action_word_jiang(self):
        # 导入评测模块
        from app.services import eval_service
        # 中文样例：第三条建议用了“将数据分析实习生作为标题”
        case = {
            "id": "cn_action_word_jiang",
            "checks": {
                "language": "Chinese",
                "must_keep": ["数据看板开发"],
                "must_not_claim": ["SQL"],
                "should_flag_as_gap": ["业务价值"],
            },
        }
        result = {
            "optimized_resume": "参与内部数据看板开发。",
            "match_analysis": "当前仍缺少业务价值说明。",
            "suggestions": [
                "补充具体职责。",
                "量化业务影响。",
                "将“数据分析实习生”作为主标题，公司名称和实习时间紧随其后。",
            ],
            "result_source": "ai",
        }
        
        evaluation = eval_service.evaluate_case_output(case, result)
        # 希望评测器把“将……作为……”这种中文修改动作也判为有效建议    
        self.assertTrue(evaluation["checks"]["actionable_suggestions_ok"])

    def test_evaluate_case_output_accepts_english_action_word_describe(self):
        # 导入评测模块
        from app.services import eval_service
        # 英文样例：第二条建议用了 describe
        case = {
            "id": "en_action_word_describe",
            "checks": {
                "language": "English",
                "must_keep": ["internal APIs"],
                "must_not_claim": ["SQL"],
                "should_flag_as_gap": ["SQL"],
            },
        }
        result = {
            "optimized_resume": "Built internal APIs and automation tools.",
            "match_analysis": "SQL is still a gap.",
            "suggestions": [
                "Add quantified metrics for workflow impact.",
                "Describe a specific incident investigation or troubleshooting process.",
                "Move the API development example closer to the top.",
            ],
            "result_source": "ai",
        }

        evaluation = eval_service.evaluate_case_output(case, result)
        # 希望评测器把 describe 也判成有效英文修改动作
        self.assertTrue(evaluation["checks"]["actionable_suggestions_ok"])

    #补一个失败测试
    def test_evaluate_case_output_accepts_chinese_action_word_zengjia(self):
        from app.services import eval_service

        case = {
            "id": "cn_action_word_zengjia",
            "checks": {
                "language": "Chinese",
                "must_keep": ["Python 数据看板开发"],
                "must_not_claim": ["SQL"],
                "should_flag_as_gap": ["量化成果"],
            },
        }
        result = {
            "optimized_resume": "负责Python数据看板开发。",
            "match_analysis": "当前仍缺少更多量化成果证据。",
            "suggestions": [
                "补充量化成果说明。",
                "增加协作频率和业务问题示例。",
                "前置最贴近岗位要求的经历。",
            ],
            "result_source": "ai",
        }

        evaluation = eval_service.evaluate_case_output(case, result)

        self.assertTrue(evaluation["checks"]["actionable_suggestions_ok"])



    def test_evaluate_case_output_normalizes_spacing_for_keep_and_gap_checks(self):
        from app.services import eval_service

        case = {
            "id": "cn_spacing_normalization",
            "checks": {
                "language": "Chinese",
                "must_keep": ["Python 数据看板开发", "缩短 30%"],
                "must_not_claim": ["SQL"],
                "should_flag_as_gap": ["量化成果"],
            },
        }
        result = {
            "optimized_resume": "负责Python数据看板开发，将周报整理时间缩短30%。",
            "match_analysis": "当前仍缺少更多量化成果证据。",
            "suggestions": ["补充更多量化成果", "明确项目职责", "前置核心经历"],
            "result_source": "ai",
        }

        evaluation = eval_service.evaluate_case_output(case, result)

        self.assertTrue(evaluation["checks"]["must_keep_ok"])
        self.assertTrue(evaluation["checks"]["gap_flagged_ok"])

    def test_evaluate_case_output_scores_grounded_chinese_result(self):
        from app.services import eval_service

        case = {
            "id": "cn_gap_sql",
            "checks": {
                "language": "Chinese",
                "must_keep": ["清华大学", "Python 数据看板开发"],
                "must_not_claim": ["SQL", "负责人经验"],
                "should_flag_as_gap": ["SQL", "量化成果"],
            },
        }
        result = {
            "optimized_resume": "教育背景\n清华大学，计算机相关专业\n\n工作经历\n- 负责 Python 数据看板开发，与产品和运营协作",
            "match_analysis": "优势：具备 Python 数据看板开发经验。缺口：缺少 SQL 和量化成果证据。",
            "suggestions": [
                "补充量化成果",
                "如属实补充 SQL 使用场景",
                "强化跨团队协作描述",
            ],
            "result_source": "ai",
        }

        evaluation = eval_service.evaluate_case_output(case, result)

        self.assertEqual(evaluation["score"], 5)
        self.assertTrue(evaluation["checks"]["language_ok"])
        self.assertTrue(evaluation["checks"]["must_keep_ok"])
        self.assertTrue(evaluation["checks"]["must_not_claim_ok"])
        self.assertTrue(evaluation["checks"]["gap_flagged_ok"])
        self.assertTrue(evaluation["checks"]["actionable_suggestions_ok"])

    def test_evaluate_case_output_flags_unsupported_claims_and_missing_gaps(self):
        from app.services import eval_service

        case = {
            "id": "cn_gap_sql",
            "checks": {
                "language": "Chinese",
                "must_keep": ["清华大学", "Python 数据看板开发"],
                "must_not_claim": ["SQL", "负责人经验"],
                "should_flag_as_gap": ["SQL", "量化成果"],
            },
        }
        result = {
            "optimized_resume": "Experienced engineer with SQL expertise and dashboard owner experience.",
            "match_analysis": "整体匹配度较高。",
            "suggestions": ["继续保持优势"],
            "result_source": "ai",
        }

        evaluation = eval_service.evaluate_case_output(case, result)

        self.assertFalse(evaluation["checks"]["language_ok"])
        self.assertFalse(evaluation["checks"]["must_keep_ok"])
        self.assertFalse(evaluation["checks"]["must_not_claim_ok"])
        self.assertFalse(evaluation["checks"]["gap_flagged_ok"])
        self.assertFalse(evaluation["checks"]["actionable_suggestions_ok"])


if __name__ == "__main__":
    unittest.main()
