"""
=============================================
UniConnect — AI Evaluation Metrics Module
Quantitative metrics for NL-to-SQL, RAG, Quiz, and System Performance
=============================================
"""

import time
import json
import re
from typing import Optional


# =============================================
# 1. NL-to-SQL METRICS
# =============================================

def sql_execution_accuracy(results: list) -> dict:
    """
    Execution Accuracy (EX):
    Measures whether the generated SQL executes without errors.
    EX = (# of successfully executed queries) / (# of total queries)
    """
    total = len(results)
    executed = sum(1 for r in results if r.get("status") in ("PASS", "PARTIAL"))
    failed = sum(1 for r in results if r.get("status") == "FAIL")

    return {
        "metric": "Execution Accuracy (EX)",
        "formula": "Successfully Executed / Total Queries",
        "score": round(executed / total * 100, 1) if total > 0 else 0,
        "executed": executed,
        "failed": failed,
        "total": total,
    }


def sql_table_accuracy(results: list) -> dict:
    """
    Table Match Accuracy (TMA):
    Measures whether the generated SQL references the correct tables.
    TMA = (# of queries with all expected tables) / (# of total queries)
    """
    total = len(results)
    matched = 0
    for r in results:
        issues = r.get("issues", [])
        table_issues = [i for i in issues if "Missing table" in i]
        if not table_issues:
            matched += 1

    return {
        "metric": "Table Match Accuracy (TMA)",
        "formula": "Queries With Correct Tables / Total Queries",
        "score": round(matched / total * 100, 1) if total > 0 else 0,
        "matched": matched,
        "total": total,
    }


def sql_keyword_accuracy(results: list) -> dict:
    """
    Keyword Match Accuracy (KMA):
    Measures whether the generated SQL uses expected SQL constructs.
    KMA = (# of queries with all expected keywords) / (# of total queries)
    """
    total = len(results)
    matched = 0
    for r in results:
        issues = r.get("issues", [])
        keyword_issues = [i for i in issues if "Missing keyword" in i]
        if not keyword_issues:
            matched += 1

    return {
        "metric": "Keyword Match Accuracy (KMA)",
        "formula": "Queries With Correct SQL Constructs / Total Queries",
        "score": round(matched / total * 100, 1) if total > 0 else 0,
        "matched": matched,
        "total": total,
    }


def sql_result_validity(results: list) -> dict:
    """
    Result Validity Rate (RVR):
    Measures whether the query returned non-empty, meaningful data.
    RVR = (# of queries returning rows > 0) / (# of successfully executed queries)
    """
    executed = [r for r in results if r.get("status") in ("PASS", "PARTIAL")]
    with_data = sum(1 for r in executed if r.get("total_rows", 0) > 0)

    return {
        "metric": "Result Validity Rate (RVR)",
        "formula": "Queries With Non-Empty Results / Successfully Executed",
        "score": round(with_data / len(executed) * 100, 1) if executed else 0,
        "with_data": with_data,
        "executed": len(executed),
    }


# =============================================
# 2. RBAC SECURITY METRICS
# =============================================

def rbac_enforcement_rate(results: list) -> dict:
    """
    RBAC Enforcement Rate (RER):
    Measures how reliably student queries are filtered to their own data.
    RER = (# of correctly filtered queries) / (# of total student queries)
    """
    total = len(results)
    enforced = sum(1 for r in results if r.get("status") == "PASS")

    return {
        "metric": "RBAC Enforcement Rate (RER)",
        "formula": "Correctly Filtered Queries / Total Queries",
        "score": round(enforced / total * 100, 1) if total > 0 else 0,
        "enforced": enforced,
        "total": total,
        "severity": "CRITICAL" if enforced < total else "PASS",
    }


# =============================================
# 3. SQL INJECTION PREVENTION METRICS
# =============================================

def injection_prevention_rate(results: list) -> dict:
    """
    Injection Prevention Rate (IPR):
    Measures how effectively the system blocks SQL injection attempts.
    IPR = (# of blocked/safe responses) / (# of injection attempts)
    """
    total = len(results)
    blocked = sum(1 for r in results if r.get("status") in ("BLOCKED", "SAFE"))
    vulnerable = sum(1 for r in results if r.get("status") == "VULNERABLE")

    return {
        "metric": "Injection Prevention Rate (IPR)",
        "formula": "Blocked Payloads / Total Payloads",
        "score": round(blocked / total * 100, 1) if total > 0 else 0,
        "blocked": blocked,
        "vulnerable": vulnerable,
        "total": total,
        "severity": "CRITICAL" if vulnerable > 0 else "PASS",
    }


# =============================================
# 4. QUIZ GENERATION METRICS
# =============================================

def quiz_format_validity(results: list) -> dict:
    """
    Format Validity Score (FVS):
    Measures whether generated quizzes have correct JSON structure.
    FVS = (# of valid quizzes) / (# of total quiz requests)
    """
    total = len(results)
    valid = sum(1 for r in results if r.get("status") == "PASS")

    return {
        "metric": "Quiz Format Validity (FVS)",
        "formula": "Structurally Valid Quizzes / Total Requests",
        "score": round(valid / total * 100, 1) if total > 0 else 0,
        "valid": valid,
        "total": total,
    }


def quiz_question_yield(results: list) -> dict:
    """
    Question Yield Rate (QYR):
    Measures whether the correct number of questions were generated.
    QYR = (total generated questions) / (total requested questions)
    """
    requested = sum(r.get("num_questions", 0) for r in results)
    generated = sum(r.get("generated_count", 0) for r in results)

    return {
        "metric": "Question Yield Rate (QYR)",
        "formula": "Generated Questions / Requested Questions",
        "score": round(generated / requested * 100, 1) if requested > 0 else 0,
        "generated": generated,
        "requested": requested,
    }


# =============================================
# 5. INSIGHTS QUALITY METRICS
# =============================================

def insights_completeness(results: list) -> dict:
    """
    Insights Completeness (IC):
    Measures whether insights include both AI summary and raw stats.
    IC = (# of complete responses) / (# of requests)
    """
    total = len(results)
    complete = sum(1 for r in results if r.get("status") == "PASS")

    return {
        "metric": "Insights Completeness (IC)",
        "formula": "Complete Responses / Total Requests",
        "score": round(complete / total * 100, 1) if total > 0 else 0,
        "complete": complete,
        "total": total,
    }


# =============================================
# 6. SYSTEM PERFORMANCE METRICS
# =============================================

class LatencyTracker:
    """Track response latency across API calls."""

    def __init__(self):
        self.latencies = {}  # endpoint -> [latency_ms]

    def record(self, endpoint: str, latency_ms: float):
        if endpoint not in self.latencies:
            self.latencies[endpoint] = []
        self.latencies[endpoint].append(latency_ms)

    def get_stats(self, endpoint: str) -> dict:
        times = sorted(self.latencies.get(endpoint, []))
        if not times:
            return {"p50": 0, "p95": 0, "p99": 0, "avg": 0, "min": 0, "max": 0}

        n = len(times)
        return {
            "p50": round(times[int(n * 0.50)], 0),
            "p95": round(times[int(min(n * 0.95, n - 1))], 0),
            "p99": round(times[int(min(n * 0.99, n - 1))], 0),
            "avg": round(sum(times) / n, 0),
            "min": round(times[0], 0),
            "max": round(times[-1], 0),
            "count": n,
        }

    def get_all_stats(self) -> dict:
        return {ep: self.get_stats(ep) for ep in self.latencies}


def error_rate(results: list) -> dict:
    """
    Error Rate (ER):
    Measures the percentage of API calls that returned errors.
    ER = (# of error responses) / (# of total requests)
    """
    total = len(results)
    errors = sum(1 for r in results if r.get("status") == "FAIL" or r.get("_error"))

    return {
        "metric": "Error Rate (ER)",
        "formula": "Error Responses / Total Requests",
        "score": round(errors / total * 100, 1) if total > 0 else 0,
        "errors": errors,
        "total": total,
    }


# =============================================
# 7. COMPOSITE SCORE
# =============================================

def compute_composite_score(metric_results: dict) -> dict:
    """
    Weighted composite score across all evaluation dimensions.

    Weights:
    - Security (RBAC + Injection): 30%
    - NL-to-SQL Accuracy: 25%
    - Quiz Quality: 15%
    - Insights Quality: 15%
    - System Reliability: 15%
    """
    weights = {
        "security": 0.30,
        "nl2sql": 0.25,
        "quiz": 0.15,
        "insights": 0.15,
        "reliability": 0.15,
    }

    scores = {}

    # Security = average of RBAC + Injection
    sec_scores = []
    if "rbac" in metric_results:
        sec_scores.append(metric_results["rbac"]["score"])
    if "injection" in metric_results:
        sec_scores.append(metric_results["injection"]["score"])
    scores["security"] = sum(sec_scores) / len(sec_scores) if sec_scores else 0

    # NL-to-SQL = average of EX + TMA + KMA
    nl2sql_scores = []
    for key in ["execution_accuracy", "table_accuracy", "keyword_accuracy"]:
        if key in metric_results:
            nl2sql_scores.append(metric_results[key]["score"])
    scores["nl2sql"] = sum(nl2sql_scores) / len(nl2sql_scores) if nl2sql_scores else 0

    # Quiz = average of FVS + QYR
    quiz_scores = []
    for key in ["quiz_format", "quiz_yield"]:
        if key in metric_results:
            quiz_scores.append(metric_results[key]["score"])
    scores["quiz"] = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0

    # Insights
    scores["insights"] = metric_results.get("insights_completeness", {}).get("score", 0)

    # Reliability = 100 - Error Rate
    scores["reliability"] = 100 - metric_results.get("error_rate", {}).get("score", 0)

    # Weighted composite
    composite = sum(scores[k] * weights[k] for k in weights)

    return {
        "composite_score": round(composite, 1),
        "breakdown": {k: round(v, 1) for k, v in scores.items()},
        "weights": weights,
        "grade": (
            "A+" if composite >= 95 else
            "A"  if composite >= 90 else
            "B+" if composite >= 85 else
            "B"  if composite >= 80 else
            "C+" if composite >= 75 else
            "C"  if composite >= 70 else
            "D"  if composite >= 60 else
            "F"
        ),
    }


# =============================================
# 8. REPORT GENERATOR
# =============================================

def generate_report(all_metrics: dict, latency_stats: dict, composite: dict) -> str:
    """Generate a human-readable evaluation report."""

    lines = []
    lines.append("=" * 70)
    lines.append("  📊 UniConnect AI — Evaluation Metrics Report")
    lines.append("=" * 70)
    lines.append("")

    # Composite Score
    lines.append(f"  🏆 COMPOSITE SCORE: {composite['composite_score']}% (Grade: {composite['grade']})")
    lines.append("")
    lines.append("  Breakdown:")
    for dim, score in composite["breakdown"].items():
        weight = composite["weights"].get(dim, 0)
        bar = "█" * int(score / 5) + "░" * (20 - int(score / 5))
        lines.append(f"    {dim:20s} {bar} {score:5.1f}%  (weight: {weight*100:.0f}%)")
    lines.append("")

    # Individual Metrics
    lines.append("─" * 70)
    lines.append("  📐 INDIVIDUAL METRICS")
    lines.append("─" * 70)

    for key, m in all_metrics.items():
        if isinstance(m, dict) and "metric" in m:
            icon = "✅" if m["score"] >= 80 else "⚠️" if m["score"] >= 60 else "❌"
            severity = f" [{m['severity']}]" if "severity" in m else ""
            lines.append(f"  {icon} {m['metric']}: {m['score']}%{severity}")
            lines.append(f"     Formula: {m['formula']}")
            details = {k: v for k, v in m.items() if k not in ("metric", "formula", "score", "severity")}
            if details:
                lines.append(f"     Details: {json.dumps(details)}")
            lines.append("")

    # Latency
    if latency_stats:
        lines.append("─" * 70)
        lines.append("  ⏱️  LATENCY (milliseconds)")
        lines.append("─" * 70)
        lines.append(f"  {'Endpoint':30s} {'P50':>6s} {'P95':>6s} {'P99':>6s} {'Avg':>6s} {'Count':>6s}")
        for ep, stats in latency_stats.items():
            lines.append(
                f"  {ep:30s} {stats['p50']:6.0f} {stats['p95']:6.0f} "
                f"{stats['p99']:6.0f} {stats['avg']:6.0f} {stats['count']:6d}"
            )
        lines.append("")

    lines.append("=" * 70)
    return "\n".join(lines)
