"""Helpers for running fixed evaluation samples against resume optimization."""

import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


CHINESE_ACTION_HINTS = [
    "补充",
    "明确",
    "量化",
    "前置",
    "突出",
    "说明",
    "强化",
    "添加",
    "补写",
    "调整",
    "列出",
    "改写",
    "写明",
    "增加",   # 例如：增加协作频率描述
    "完善",   # 例如：完善项目背景说明
    "细化",   # 例如：细化职责边界
    "检查",   # 例如：检查量化结果是否完整
    "确保",   # 例如：确保每条成果都对齐业务目标
    "将",
]
ENGLISH_ACTION_HINTS = [
    "add",
    "clarify",
    "quantify",
    "move",
    "foreground",
    "specify",
    "rewrite",
    "highlight",
    "describe",
    "consider",
]


def _contains_chinese(text: str) -> bool:
    """Return whether the text contains CJK characters."""
    return bool(re.search(r"[\u4e00-\u9fff]", text))


def _normalize_string_list(values: Any) -> List[str]:
    """Normalize user-provided check values into a clean list of strings."""
    if not isinstance(values, list):
        return []
    return [str(item).strip() for item in values if str(item).strip()]


def _normalize_match_text(text: str) -> str:
    """Normalize text for lightweight substring matching in eval checks."""
    return re.sub(r"\s+", "", text).lower()


def _language_matches(expected_language: str, texts: Iterable[str]) -> bool:
    """Check whether output language roughly matches the expected language."""
    normalized_texts = [text.strip() for text in texts if text and text.strip()]
    if not normalized_texts:
        return False

    if expected_language == "Chinese":
        return all(_contains_chinese(text) for text in normalized_texts)

    if expected_language == "English":
        return all(not _contains_chinese(text) and bool(re.search(r"[A-Za-z]", text)) for text in normalized_texts)

    return True


def _has_actionable_suggestions(suggestions: Any, expected_language: str) -> bool:
    """Apply a lightweight heuristic for whether suggestions read like edit actions."""
    items = _normalize_string_list(suggestions)
    if not 3 <= len(items) <= 5:
        return False

    if expected_language == "Chinese":
        for item in items:
            if len(item) > 80 or "\n" in item:
                return False
            if not any(keyword in item for keyword in CHINESE_ACTION_HINTS):
                return False
        return True

    if expected_language == "English":
        lowered_items = [item.lower() for item in items]
        return all(any(keyword in item for keyword in ENGLISH_ACTION_HINTS) for item in lowered_items)

    return True


def evaluate_case_output(case: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
    """Score one evaluation case against lightweight quality checks."""
    checks = case.get("checks", {})
    expected_language = str(checks.get("language", "")).strip() or "Chinese"
    optimized_resume = str(result.get("optimized_resume", "")).strip()
    match_analysis = str(result.get("match_analysis", "")).strip()
    suggestions = result.get("suggestions", [])
    suggestion_items = _normalize_string_list(suggestions)
    suggestion_text = "\n".join(suggestion_items)
    gap_scan_text = f"{match_analysis}\n{suggestion_text}"

    must_keep = _normalize_string_list(checks.get("must_keep"))
    must_not_claim = _normalize_string_list(checks.get("must_not_claim"))
    should_flag_as_gap = _normalize_string_list(checks.get("should_flag_as_gap"))
    normalized_resume = _normalize_match_text(optimized_resume)
    normalized_gap_scan_text = _normalize_match_text(gap_scan_text)

    evaluation_checks = {
        "language_ok": _language_matches(expected_language, [optimized_resume, match_analysis, suggestion_text]),
        "must_keep_ok": all(_normalize_match_text(item) in normalized_resume for item in must_keep),
        "must_not_claim_ok": all(_normalize_match_text(item) not in normalized_resume for item in must_not_claim),
        "gap_flagged_ok": all(_normalize_match_text(item) in normalized_gap_scan_text for item in should_flag_as_gap),
        "actionable_suggestions_ok": _has_actionable_suggestions(suggestion_items, expected_language),
    }
    score = sum(1 for passed in evaluation_checks.values() if passed)

    return {
        "case_id": case.get("id", "unknown"),
        "result_source": result.get("result_source"),
        "fallback_reason": result.get("fallback_reason"),
        "score": score,
        "max_score": len(evaluation_checks),
        "checks": evaluation_checks,
        "output": {
            "optimized_resume": optimized_resume,
            "match_analysis": match_analysis,
            "suggestions": suggestion_items,
        },
    }


def load_eval_cases(cases_dir: Path, selected_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """Load fixed evaluation cases from a directory of JSON files."""
    selected = set(selected_ids or [])
    cases: List[Dict[str, Any]] = []

    for path in sorted(cases_dir.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if selected and payload.get("id") not in selected:
            continue
        cases.append(payload)

    return cases
