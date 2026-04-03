import os
import traceback
from dotenv import load_dotenv

load_dotenv()

results = []

# Test 1: Env vars
api_key = os.getenv("GEMINI_API_KEY")
db_url = os.getenv("DATABASE_URL")
results.append(f"API_KEY: {'SET' if api_key else 'NOT SET'}")
results.append(f"DB_URL: {'SET' if db_url else 'NOT SET'}")

# Test 2: Gemini
try:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content("Say hello")
    results.append(f"GEMINI: PASS - {response.text[:100]}")
except Exception as e:
    results.append(f"GEMINI: FAIL - {type(e).__name__}: {e}")
    results.append(traceback.format_exc())

# Test 3: Database
try:
    import psycopg2
    conn = psycopg2.connect(db_url, sslmode="require")
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM students")
    count = cursor.fetchone()[0]
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    results.append(f"DB: PASS - {count} students, tables: {tables}")
except Exception as e:
    results.append(f"DB: FAIL - {type(e).__name__}: {e}")
    results.append(traceback.format_exc())

# Write results
with open("diag_results.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results))

print("Results written to diag_results.txt")
