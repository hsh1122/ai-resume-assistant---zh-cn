"""Service for resume optimization through an OpenAI-compatible API.

Defaults are set up for DeepSeek, while remaining compatible with other
OpenAI-compatible providers. If API config is missing or API call fails,
fallback to local mock result.
"""

import json
import logging
from typing import Any, Dict, Optional

from openai import OpenAI

from app.config import settings


logger = logging.getLogger(__name__)


def _log_ai_event(event: str, **details: Any) -> None:
    detail_text = ", ".join(f"{key}={value}" for key, value in details.items())
    message = f"AI optimize event: {event}"
    if detail_text:
        message = f"{message} | {detail_text}"
    if event.startswith("real_ai"):
        logger.info(message)
    else:
        logger.warning(message)


def _build_prompt(resume_text: str, jd_text: str, style: str) -> str:
    """Build clear prompt asking model to return strict JSON."""
    return f"""
You are an expert resume coach.

Task:
Given the original resume and a job description, generate:
1) optimized_resume: improved resume text
2) match_analysis: short analysis of fit between resume and JD
3) suggestions: list of concrete edit suggestions

Writing style requirement: {style}

Return STRICT JSON only (no markdown, no extra text), with this schema:
{{
  "optimized_resume": "string",
  "match_analysis": "string",
  "suggestions": ["string", "string"]
}}

Original Resume:
{resume_text}

Job Description:
{jd_text}
""".strip()


def _extract_json_content(content: str) -> str:
    """Normalize model output so fenced JSON can still be parsed."""
    normalized = content.strip()
    if not normalized.startswith("```"):
        return normalized

    lines = normalized.splitlines()
    if not lines:
        return normalized

    if lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]

    return "\n".join(lines).strip()


def _mock_optimize(resume_text: str, jd_text: str, style: str) -> Dict[str, Any]:
    """Return mock data so project still works without API config."""
    short_resume = resume_text[:400] + ("..." if len(resume_text) > 400 else "")
    short_jd = jd_text[:250] + ("..." if len(jd_text) > 250 else "")

    return {
        "optimized_resume": (
            f"[MOCK - {style}]\n"
            "Summary:\n"
            "Results-driven candidate with practical project delivery experience.\n\n"
            "Experience Highlights:\n"
            "- Built and shipped projects with clear user value.\n"
            "- Collaborated across product and engineering tasks.\n"
            "- Improved workflow efficiency through automation and documentation.\n\n"
            f"Original snippet:\n{short_resume}"
        ),
        "match_analysis": (
            "[MOCK] Baseline match appears medium-to-high. "
            "Your profile aligns on execution and project ownership, "
            f"but should better mirror JD keywords such as: {short_jd[:120]}"
        ),
        "suggestions": [
            "Add 3-5 quantified achievements (%, time saved, revenue impact).",
            "Mirror important JD keywords in your skills and project bullets.",
            "Rewrite bullet points in Action + Method + Result format.",
            "Move the strongest, most relevant project to the top.",
        ],
    }


def _mock_response(
    resume_text: str,
    jd_text: str,
    style: str,
    result_source: str,
    fallback_reason: Optional[str] = None,
) -> Dict[str, Any]:
    result = _mock_optimize(resume_text, jd_text, style)
    result["result_source"] = result_source
    if fallback_reason:
        result["fallback_reason"] = fallback_reason
    return result


def optimize_resume(resume_text: str, jd_text: str, style: str) -> Dict[str, Any]:
    """Call an OpenAI-compatible API; fallback to mock result if unavailable."""
    if not settings.openai_api_key:
        _log_ai_event(
            "mock_used_no_api_key",
            model=settings.openai_model,
            base_url=settings.openai_base_url,
        )
        return _mock_response(
            resume_text,
            jd_text,
            style,
            result_source="mock",
            fallback_reason="missing_api_key",
        )

    prompt = _build_prompt(resume_text, jd_text, style)
    _log_ai_event(
        "real_ai_request_started",
        model=settings.openai_model,
        base_url=settings.openai_base_url,
    )

    try:
        client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)

        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise assistant that outputs valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )

        content = response.choices[0].message.content if response.choices else ""
        if not content:
            _log_ai_event("fallback_used_empty_ai_response", model=settings.openai_model)
            return _mock_response(
                resume_text,
                jd_text,
                style,
                result_source="fallback",
                fallback_reason="empty_ai_response",
            )

        try:
            parsed = json.loads(_extract_json_content(content))
        except json.JSONDecodeError:
            logger.exception(
                "AI optimize event: fallback_used_invalid_json | model=%s, base_url=%s",
                settings.openai_model,
                settings.openai_base_url,
            )
            return _mock_response(
                resume_text,
                jd_text,
                style,
                result_source="fallback",
                fallback_reason="invalid_json_response",
            )

        optimized_resume = str(parsed.get("optimized_resume", "")).strip()
        match_analysis = str(parsed.get("match_analysis", "")).strip()
        suggestions = parsed.get("suggestions", [])

        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)]
        suggestions = [str(item).strip() for item in suggestions if str(item).strip()]

        if not optimized_resume or not match_analysis:
            _log_ai_event("fallback_used_incomplete_ai_payload", model=settings.openai_model)
            return _mock_response(
                resume_text,
                jd_text,
                style,
                result_source="fallback",
                fallback_reason="incomplete_ai_payload",
            )

        _log_ai_event("real_ai_result_returned", model=settings.openai_model)

        return {
            "optimized_resume": optimized_resume,
            "match_analysis": match_analysis,
            "suggestions": suggestions,
            "result_source": "ai",
        }

    except Exception:
        logger.exception(
            "AI optimize event: fallback_used_request_exception | model=%s, base_url=%s",
            settings.openai_model,
            settings.openai_base_url,
        )
        return _mock_response(
            resume_text,
            jd_text,
            style,
            result_source="fallback",
            fallback_reason="request_exception",
        )
