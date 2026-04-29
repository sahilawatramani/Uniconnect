import urllib.request, json

print("=== Quick AI Query Test ===")
try:
    data = json.dumps({"question": "How many departments are there?"}).encode()
    req = urllib.request.Request(
        "http://localhost:8000/ai/query",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        body = json.loads(r.read())
        print(f"SUCCESS!")
        print(f"SQL: {body.get('sql','N/A')}")
        print(f"Answer: {body.get('answer','')[:300]}")
        print(f"Total rows: {body.get('total_rows','N/A')}")
except Exception as e:
    print(f"FAILED: {e}")
