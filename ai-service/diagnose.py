"""Quick diagnostic to pinpoint the AI service failure."""
import json
import traceback

print("=" * 60)
print("STEP 1: Check Ollama connectivity")
print("=" * 60)
try:
    from urllib import request, error
    req = request.Request("http://127.0.0.1:11434/api/tags")
    with request.urlopen(req, timeout=5) as r:
        data = json.loads(r.read())
        models = [m["name"] for m in data.get("models", [])]
        print(f"  ✅ Ollama is running. Available models: {models}")
except Exception as e:
    print(f"  ❌ Ollama NOT reachable: {e}")

print()
print("=" * 60)
print("STEP 2: Check Database connectivity")
print("=" * 60)
try:
    from config import DATABASE_URL
    import psycopg2
    ssl_mode = "require" if "render.com" in (DATABASE_URL or "") else "prefer"
    conn = psycopg2.connect(DATABASE_URL, sslmode=ssl_mode)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM departments")
    count = cur.fetchone()[0]
    print(f"  ✅ Database connected. Departments count: {count}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"  ❌ Database error: {e}")
    traceback.print_exc()

print()
print("=" * 60)
print("STEP 3: Test Ollama LLM generation")
print("=" * 60)
try:
    from config import get_llm_response
    result = get_llm_response("Reply with exactly: HELLO")
    print(f"  ✅ LLM responded: {result[:200]}")
except Exception as e:
    print(f"  ❌ LLM generation failed: {e}")
    traceback.print_exc()

print()
print("=" * 60)
print("STEP 4: Test full NL-to-SQL pipeline")
print("=" * 60)
try:
    from config import get_gemini_response
    from db_schema import SCHEMA
    
    sql_prompt = f"""You are a PostgreSQL SQL expert. Given the following database schema and a natural language question, generate ONLY a valid PostgreSQL SELECT query.

DATABASE SCHEMA:
{SCHEMA}

USER QUESTION: How many departments are there?

IMPORTANT RULES:
- Generate ONLY SELECT queries
- Use proper PostgreSQL syntax
- Return ONLY the SQL query, nothing else

SQL QUERY:"""
    
    sql_response = get_gemini_response(sql_prompt)
    print(f"  LLM SQL response: {sql_response[:500]}")
    
    from routes.query import extract_sql, validate_sql
    sql_query = extract_sql(sql_response)
    print(f"  Extracted SQL: {sql_query}")
    
    sql_clean = sql_query.rstrip(';').strip()
    valid = validate_sql(sql_clean + ';')
    print(f"  SQL valid: {valid}")
    
    if valid:
        conn = psycopg2.connect(DATABASE_URL, sslmode=ssl_mode)
        cur = conn.cursor()
        cur.execute(sql_clean)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        print(f"  ✅ Query executed! Columns: {cols}, Rows: {rows[:5]}")
        cur.close()
        conn.close()
    else:
        print(f"  ❌ SQL validation failed")
        
except Exception as e:
    print(f"  ❌ Pipeline failed: {e}")
    traceback.print_exc()

print()
print("=" * 60)
print("STEP 5: Test via HTTP (the actual endpoint)")
print("=" * 60)
try:
    from urllib import request as urllib_request
    body = json.dumps({"question": "How many departments are there?"}).encode()
    req = urllib_request.Request(
        "http://localhost:8000/ai/query",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib_request.urlopen(req, timeout=180) as r:
        result = json.loads(r.read())
        print(f"  ✅ Endpoint works!")
        print(f"  SQL: {result.get('sql', 'N/A')}")
        print(f"  Answer: {result.get('answer', '')[:300]}")
except Exception as e:
    print(f"  ❌ Endpoint failed: {e}")
    if hasattr(e, 'read'):
        print(f"  Response body: {e.read().decode()[:500]}")
    traceback.print_exc()
