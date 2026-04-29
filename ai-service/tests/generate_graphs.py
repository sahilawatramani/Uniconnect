"""
=============================================
UniConnect — AI Evaluation Graphs Generator
Reads evaluation_results.json and generates visual PNG charts.
=============================================
"""

import json
import os
import matplotlib.pyplot as plt
import numpy as np

# ── Paths ──
BASE_DIR = os.path.dirname(__file__)
RESULTS_FILE = os.path.join(BASE_DIR, "evaluation_results.json")
METRICS_GRAPH_PATH = os.path.join(BASE_DIR, "metrics_chart.png")
LATENCY_GRAPH_PATH = os.path.join(BASE_DIR, "latency_chart.png")

def main():
    if not os.path.exists(RESULTS_FILE):
        print(f"Could not find {RESULTS_FILE}.")
        print("Please run `python tests/evaluate_ai.py` first to generate the data.")
        return

    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # ==========================================
    # 1. CORE METRICS BAR CHART
    # ==========================================
    metrics = data.get("metrics", {})
    
    # We will pick the top-level scores to plot
    labels = []
    scores = []
    
    # Predefined metric titles for readability
    metric_names = {
        "execution_accuracy": "SQL Exec Accuracy",
        "table_accuracy": "SQL Table Match",
        "keyword_accuracy": "SQL Keyword Match",
        "result_validity": "Valid SQL Result",
        "rbac": "RBAC Enforcement",
        "injection": "Injection Prevention",
        "quiz_format": "Quiz Validity",
        "quiz_yield": "Question Yield",
        "insights_completeness": "Insights Quality"
    }

    for key, name in metric_names.items():
        if key in metrics:
            labels.append(name)
            scores.append(metrics[key].get("score", 0))

    # Also add composite score
    composite = data.get("composite_score", {}).get("composite_score", 0)
    labels.insert(0, "COMPOSITE SCORE")
    scores.insert(0, composite)

    # Plot
    plt.figure(figsize=(12, 7))
    # Give the composite score a distinct color (crimson), the rest navy
    colors = ['#dc143c'] + ['#0f172a'] * (len(scores) - 1)
    
    bars = plt.barh(labels[::-1], scores[::-1], color=colors[::-1])
    
    plt.xlabel('Score Percentage (%)', fontsize=12)
    plt.title('UniConnect AI Service - Core Evaluation Metrics', fontsize=14, fontweight='bold', pad=15)
    plt.xlim(0, 110) # Leave room for labels
    
    # Add exact numbers next to the bars
    for bar in bars:
        width = bar.get_width()
        plt.text(width + 1, bar.get_y() + bar.get_height()/2, 
                 f'{width:.1f}%', ha='left', va='center', fontsize=10)

    plt.tight_layout()
    plt.savefig(METRICS_GRAPH_PATH, dpi=300)
    plt.close()
    print(f"Generated Core Metrics Graph: {METRICS_GRAPH_PATH}")

    # ==========================================
    # 2. LATENCY PERCENTILES CHART
    # ==========================================
    latency = data.get("latency", {})
    if latency:
        endpoints = list(latency.keys())
        
        # We'll plot P50, P95, and P99 for each endpoint
        p50s = [latency[ep].get("p50", 0) for ep in endpoints]
        p95s = [latency[ep].get("p95", 0) for ep in endpoints]
        p99s = [latency[ep].get("p99", 0) for ep in endpoints]
        
        x = np.arange(len(endpoints))  # the label locations
        width = 0.25  # the width of the bars

        fig, ax = plt.subplots(figsize=(10, 6))
        rects1 = ax.bar(x - width, p50s, width, label='P50 (Median)', color='#3b82f6')
        rects2 = ax.bar(x, p95s, width, label='P95', color='#f59e0b')
        rects3 = ax.bar(x + width, p99s, width, label='P99', color='#ef4444')

        # Add some text for labels, title and custom x-axis tick labels, etc.
        ax.set_ylabel('Latency (milliseconds)')
        ax.set_title('AI Service Endpoint Latency Percentiles', fontsize=14, fontweight='bold', pad=15)
        ax.set_xticks(x, endpoints)
        ax.legend()

        ax.bar_label(rects1, padding=3, fmt='%d')
        ax.bar_label(rects2, padding=3, fmt='%d')
        ax.bar_label(rects3, padding=3, fmt='%d')

        fig.tight_layout()
        plt.savefig(LATENCY_GRAPH_PATH, dpi=300)
        plt.close()
        print(f"Generated Latency Graph: {LATENCY_GRAPH_PATH}")
    else:
        print("No latency data found to plot.")

if __name__ == "__main__":
    main()
