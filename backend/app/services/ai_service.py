"""Service for resume optimization through an OpenAI-compatible API.

Defaults are set up for DeepSeek, while remaining compatible with other
OpenAI-compatible providers. If API config is missing or API call fails,
fallback to local mock result.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

from openai import AuthenticationError, OpenAI, PermissionDeniedError

from app.config import settings


logger = logging.getLogger(__name__)


class AIProviderAuthenticationFailure(Exception):
    """Raised when the configured AI provider credentials are rejected."""


class AIResponseError(Exception):
    """Raised when the AI response is empty or cannot be parsed."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


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
    style_guidance_map = {
        "Professional": "Use polished, professional, and balanced wording.",
        "Concise": "Keep the rewrite concise and remove lower-priority details.",
        "Achievement-Oriented": "Emphasize measurable outcomes, ownership, and business impact.",
    }
    style_guidance = style_guidance_map.get(style, "Use polished, professional, and balanced wording.")

    return f"""
You are an expert resume coach.

Task:
Given the original resume and a job description, generate:
1) optimized_resume: improved resume text
2) match_analysis: short analysis of fit between resume and JD
3) suggestions: list of concrete edit suggestions

Writing style requirement: {style}
Style-specific guidance: {style_guidance}

Important constraints:
- If the resume and job description are primarily in Chinese, return optimized_resume, match_analysis, and suggestions in Chinese.
- If the resume and job description are primarily in English, return optimized_resume, match_analysis, and suggestions in English.
- Treat the resume as the only source of truth for optimized_resume.
- Never convert a job requirement into a candidate claim unless the resume already states it.
- If SQL appears only in the job description and not in the resume, do not write SQL into optimized_resume.
- Do not invent or assume any experience, project, metric, title, technology, or result.
- Preserve important facts from the original resume.
- Do not simply copy or lightly polish the original resume text.
- Rewrite and reorder the resume content to improve relevance, clarity, and emphasis while preserving facts.
- Do not turn a sparse resume into a generic profile summary.
- When evidence is limited, keep the wording conservative.
- Keep the candidate's concrete education, responsibilities, collaboration context, and workflow details visible in optimized_resume.
- Prioritize retaining company names, project names, technologies, dates, and quantified outcomes.
- Reorganize or compress content only when it improves relevance to the JD without changing facts.
- In match_analysis, summarize the strongest alignment, the most important gaps, and an overall fit judgment.
- Explain what evidence from the resume supports the JD, point out any missing evidence, and call out the strongest matched evidence and the most important gaps.
- Keep match_analysis concise and easy to scan.
- Return 3 to 5 suggestions.
- Order suggestions from highest priority to lowest priority.
- Each suggestion should describe a concrete resume revision action.
- Suggestions must be concrete and actionable.
- Base suggestions only on the provided resume and job description.
- Do not give generic job-search advice.
- Prioritize the highest-impact resume edits first.
- Write suggestions as brief, practical resume revision actions in the same language as the input.
- For missing job-description skills, write conditional suggestions such as 'if you truly have this experience, add evidence; otherwise do not claim it'.
- Do not tell the user to add a skill, tool, or achievement unless it is truthful.
- Mirror important job-description keywords only when they are supported by the resume.
- If a job-description keyword is not supported by the resume, do not include it in optimized_resume.
- Unsupported keywords should appear only as missing gaps in match_analysis or follow-up actions in suggestions.
- Do not force unsupported keywords into the optimized resume.
- Prefer ATS-friendly wording while staying truthful.


Return STRICT JSON only (no markdown, no extra text), with this schema:
{{
  "optimized_resume": "string",
  "match_analysis": "string",
  "suggestions": ["string", "string", "string"]

}}

Original Resume:
{resume_text}

Job Description:
{jd_text}
""".strip()


def _build_fact_extraction_prompt(resume_text: str, jd_text: str) -> str:
    """Build a prompt for extracting grounded facts from the resume."""
    return f"""
You are a careful resume fact extractor.

Task:
Extract grounded facts from the resume only.
Use the job description only to classify which requirements are supported or unsupported.

Return STRICT JSON only (no markdown, no extra text), with this schema:
{{
  "language": "Chinese or English",
  "source_facts": ["string"],
  "supported_requirements": ["string"],
  "unsupported_requirements": ["string"]
}}

Requirements:
- Extract grounded facts from the resume only.
- Each source_fact must be directly stated or very lightly normalized from the resume.
- Do not infer missing skills, tools, achievements, ownership, metrics, or experience.
- Unsupported job requirements must stay in unsupported_requirements, not source_facts.
- Keep source_facts short, concrete, and faithful to the resume.

Resume:
{resume_text}

Job Description:
{jd_text}
""".strip()


def _build_grounded_rewrite_prompt(jd_text: str, style: str, extracted_facts: Dict[str, Any]) -> str:
    """Build a prompt that rewrites the resume only from extracted facts."""
    style_guidance_map = {
        "Professional": "Use polished, professional, and balanced wording.",
        "Concise": "Keep the rewrite concise and remove lower-priority details.",
        "Achievement-Oriented": "Emphasize measurable outcomes, ownership, and business impact.",
    }
    style_guidance = style_guidance_map.get(style, "Use polished, professional, and balanced wording.")
    grounded_facts_json = json.dumps(extracted_facts, ensure_ascii=False, indent=2)
    visible_fact_lines = "\n".join(
        f"- {fact}" for fact in _normalize_fact_list(extracted_facts.get("source_facts"))
    ) or "- None provided"
    supported_requirement_lines = "\n".join(
        f"- {item}" for item in _normalize_fact_list(extracted_facts.get("supported_requirements"))
    ) or "- None provided"
    unsupported_requirement_lines = "\n".join(
        f"- {item}" for item in _normalize_fact_list(extracted_facts.get("unsupported_requirements"))
    ) or "- None provided"

    return f"""
You are an expert resume coach.

Task:
Using the grounded facts below and the job description, generate:
1) optimized_resume: improved resume text
2) match_analysis: short analysis of fit between resume and JD
3) suggestions: list of concrete edit suggestions

Writing style requirement: {style}
Style-specific guidance: {style_guidance}

Grounded facts JSON:
{grounded_facts_json}

Grounded facts that must stay visible in optimized_resume:
{visible_fact_lines}

Supported requirements that may be described as matched:
{supported_requirement_lines}

Unsupported requirements that must remain gaps:
{unsupported_requirement_lines}

Important constraints:
- Use the grounded facts below as the only source of truth for optimized_resume.
- Unsupported requirements may appear only in match_analysis and suggestions.
- If the grounded facts are primarily in Chinese, return optimized_resume, match_analysis, and suggestions in Chinese.
- If the grounded facts are primarily in English, return optimized_resume, match_analysis, and suggestions in English.
- Do not write an English profile summary or generic English section headings when the grounded facts are Chinese.
- Do not invent or assume any experience, project, metric, title, technology, or result.
- Do not simply copy or lightly polish the grounded facts.
- Rewrite and reorder the resume content to improve relevance, clarity, and emphasis while preserving facts.
- Do not turn sparse grounded facts into a generic profile summary.
- Do not replace concrete grounded facts with generic capability claims.
- When evidence is limited, keep the wording conservative.
- Keep the candidate's concrete education, responsibilities, collaboration context, and workflow details visible in optimized_resume.
- In match_analysis, summarize the strongest alignment, the most important gaps, and an overall fit judgment.
- Explain what evidence from the grounded facts supports the JD and point out any missing evidence.
- Only describe requirements in supported_requirements as matched evidence.
- Treat every requirement in unsupported_requirements strictly as a gap.
- Do not describe unsupported requirements as partially matched, partially aligned, or indirectly satisfied.
- Do not upgrade related experience into stronger ownership, leadership, or requirement coverage unless it is directly stated in grounded facts.
- Keep match_analysis concise and easy to scan.
- Return 3 to 5 suggestions.
- Order suggestions from highest priority to lowest priority.
- Each suggestion should describe a concrete resume revision action.
- Suggestions must be concrete and actionable.
- Base suggestions only on the grounded facts and the job description.
- Do not give generic job-search advice.
- Prioritize the highest-impact resume edits first.
- Write suggestions as brief, practical resume revision actions in the same language as the grounded facts.
- When the grounded facts are Chinese, write each suggestion as one short Chinese resume-edit action.
- Avoid long consultant-style explanations or multi-sentence coaching paragraphs in suggestions.
- Prefer direct actions such as clarify, quantify, move, foreground, or specify.
- For missing job-description skills, write conditional suggestions such as 'if you truly have this experience, add evidence; otherwise do not claim it'.
- Do not tell the user to add a skill, tool, or achievement unless it is truthful.
- Do not suggest specific tools, frameworks, metrics, or example achievements that are not present in grounded facts.
- Use neutral placeholders such as 'if true, add the exact tool or metric you actually used'.
- Mirror important job-description keywords only when they are supported by the grounded facts.
- If a job-description keyword is not supported by the grounded facts, do not include it in optimized_resume.
- Do not force unsupported keywords into optimized_resume.
- Prefer ATS-friendly wording while staying truthful.

Return STRICT JSON only (no markdown, no extra text), with this schema:
{{
  "optimized_resume": "string",
  "match_analysis": "string",
  "suggestions": ["string", "string", "string"]
}}

Job Description:
{jd_text}
""".strip()


def _request_ai_json(client: OpenAI, prompt: str) -> Dict[str, Any]:
    """Send one prompt to the model and parse strict JSON output."""
    last_error: Optional[AIResponseError] = None

    for attempt in range(2):
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise assistant that outputs valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content if response.choices else ""
        if not content:
            last_error = AIResponseError("empty_ai_response")
        else:
            try:
                parsed = json.loads(_extract_json_content(content))
            except json.JSONDecodeError as exc:
                last_error = AIResponseError("invalid_json_response")
                if attempt == 0:
                    _log_ai_event("real_ai_retry_invalid_json", model=settings.openai_model, attempt=attempt + 1)
                else:
                    raise last_error from exc
            else:
                if isinstance(parsed, dict):
                    return parsed
                last_error = AIResponseError("invalid_json_response")

        if attempt == 0:
            _log_ai_event(
                "real_ai_retry_requested",
                model=settings.openai_model,
                reason=last_error.reason,
                attempt=attempt + 1,
            )
            continue

    raise last_error or AIResponseError("invalid_json_response")


def _normalize_fact_list(values: Any) -> List[str]:
    """Normalize list-like fact values into a list of non-empty strings."""
    if not isinstance(values, list):
        return []
    return [str(item).strip() for item in values if str(item).strip()]


def _detect_primary_language(*texts: str) -> str:
    """Detect whether the main language is Chinese or English."""
    combined = "\n".join(texts)
    if re.search(r"[\u4e00-\u9fff]", combined):
        return "Chinese"
    return "English"


def _extract_resume_source_facts(resume_text: str) -> List[str]:
    """Extract grounded source facts directly from the resume text."""
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    if lines:
        return lines

    compact = resume_text.strip()
    return [compact] if compact else []


def _extract_requirement_lines(jd_text: str) -> List[str]:
    """Extract normalized requirement lines from the job description."""
    requirements: List[str] = []
    for raw_line in jd_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = re.sub(r"^\s*(?:[-*•]|\d+[.)、．])\s*", "", line).strip()
        line = re.sub(r"^(?:岗位要求|Job Description|Requirements)[:：]\s*", "", line, flags=re.IGNORECASE).strip()
        if line:
            requirements.append(line)
    return requirements


def _line_is_supported_by_resume(requirement: str, resume_text: str) -> bool:
    """Use simple lexical overlap rules to check whether a requirement is supported by the resume."""
    resume_lower = resume_text.lower()
    english_tokens = re.findall(r"[A-Za-z][A-Za-z0-9#+.-]*", requirement)
    if english_tokens:
        return all(token.lower() in resume_lower for token in english_tokens)

    return requirement in resume_text




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

    _log_ai_event(
        "real_ai_request_started",
        model=settings.openai_model,
        base_url=settings.openai_base_url,
    )

    try:
        client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)

        extracted_facts = _request_ai_json(client, _build_fact_extraction_prompt(resume_text, jd_text))
        source_facts = _extract_resume_source_facts(resume_text)
        requirement_lines = _extract_requirement_lines(jd_text)
        normalized_facts = {
            "language": _detect_primary_language(resume_text, jd_text),
            "source_facts": source_facts,
            "supported_requirements": [
                line for line in requirement_lines if _line_is_supported_by_resume(line, resume_text)
            ],
            "unsupported_requirements": [
                line for line in requirement_lines if not _line_is_supported_by_resume(line, resume_text)
            ],
        }

        if not normalized_facts["source_facts"]:
            _log_ai_event("fallback_used_incomplete_ai_payload", model=settings.openai_model, stage="fact_extraction")
            return _mock_response(
                resume_text,
                jd_text,
                style,
                result_source="fallback",
                fallback_reason="incomplete_ai_payload",
            )

        parsed = _request_ai_json(client, _build_grounded_rewrite_prompt(jd_text, style, normalized_facts))
        optimized_resume = str(parsed.get("optimized_resume", "")).strip()
        match_analysis = str(parsed.get("match_analysis", "")).strip()
        suggestions = parsed.get("suggestions", [])

        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)]
        suggestions = [str(item).strip() for item in suggestions if str(item).strip()]

        if not optimized_resume or not match_analysis:
            _log_ai_event("fallback_used_incomplete_ai_payload", model=settings.openai_model, stage="grounded_rewrite")
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

    except AIResponseError as exc:
        if exc.reason == "invalid_json_response":
            logger.exception(
                "AI optimize event: fallback_used_invalid_json | model=%s, base_url=%s",
                settings.openai_model,
                settings.openai_base_url,
            )
        else:
            _log_ai_event("fallback_used_empty_ai_response", model=settings.openai_model)
        return _mock_response(
            resume_text,
            jd_text,
            style,
            result_source="fallback",
            fallback_reason=exc.reason,
        )

    except (AuthenticationError, PermissionDeniedError) as exc:
        logger.exception(
            "AI optimize event: provider_authentication_failed | model=%s, base_url=%s",
            settings.openai_model,
            settings.openai_base_url,
        )
        raise AIProviderAuthenticationFailure("AI provider authentication failed") from exc

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
