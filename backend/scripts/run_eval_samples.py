"""Run fixed evaluation cases against the resume optimization service."""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.ai_service import optimize_resume
from app.services.eval_service import evaluate_case_output, load_eval_cases


def _build_report(cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Run optimization for each case and collect a structured report."""
    results: List[Dict[str, Any]] = []

    for case in cases:
        try:
            output = optimize_resume(case["resume_text"], case["jd_text"], case.get("style", "Professional"))
            evaluation = evaluate_case_output(case, output)
        except Exception as exc:  # pragma: no cover - defensive reporting path
            evaluation = {
                "case_id": case.get("id", "unknown"),
                "result_source": "script_error",
                "fallback_reason": type(exc).__name__,
                "score": 0,
                "max_score": 5,
                "checks": {
                    "language_ok": False,
                    "must_keep_ok": False,
                    "must_not_claim_ok": False,
                    "gap_flagged_ok": False,
                    "actionable_suggestions_ok": False,
                },
                "output": {
                    "optimized_resume": "",
                    "match_analysis": str(exc),
                    "suggestions": [],
                },
            }

        evaluation["style"] = case.get("style", "Professional")
        results.append(evaluation)

    total_score = sum(item["score"] for item in results)
    total_max_score = sum(item["max_score"] for item in results)
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "total_cases": len(results),
        "total_score": total_score,
        "total_max_score": total_max_score,
        "results": results,
    }


def main() -> int:
    """Parse CLI arguments, run the eval cases, and write a JSON report."""
    parser = argparse.ArgumentParser(description="Run fixed resume optimization eval samples.")
    parser.add_argument(
        "--cases-dir",
        default=str(BACKEND_ROOT / "evals" / "cases"),
        help="Directory containing eval case JSON files.",
    )
    parser.add_argument(
        "--results-dir",
        default=str(BACKEND_ROOT / "evals" / "results"),
        help="Directory where eval reports will be written.",
    )
    parser.add_argument(
        "--case",
        action="append",
        dest="case_ids",
        default=[],
        help="Optional case id to run. Repeat to run multiple specific cases.",
    )
    args = parser.parse_args()

    cases_dir = Path(args.cases_dir)
    results_dir = Path(args.results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)

    cases = load_eval_cases(cases_dir, selected_ids=args.case_ids)
    if not cases:
        print("No eval cases found.")
        return 1

    report = _build_report(cases)
    output_path = results_dir / f"eval-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Saved eval report to: {output_path}")
    print(f"Score: {report['total_score']} / {report['total_max_score']}")
    for item in report["results"]:
        print(
            f"- {item['case_id']}: {item['score']}/{item['max_score']} | "
            f"source={item.get('result_source')} | fallback={item.get('fallback_reason')}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
