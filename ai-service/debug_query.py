import asyncio
from routes.query import get_gemini_response, extract_sql, validate_sql, get_db_connection
from db_schema import SCHEMA
import time
import json

def test_nl_sql():
    question = "Show all students"
    print("Asking LLM...")
    t0 = time.time()
    
    sql_prompt = f"""You are a PostgreSQL SQL expert. Given the following database schema and a natural language question, generate ONLY a valid PostgreSQL SELECT query. Do not include any explanation, just the SQL query.

DATABASE SCHEMA:
{SCHEMA}

USER QUESTION: {question}

IMPORTANT RULES:
- Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE, etc.)
- Use proper PostgreSQL syntax
- Use JOINs when the question involves multiple tables
- Return meaningful column aliases for readability
- Always end with a semicolon
- Return ONLY the SQL query, nothing else

SQL QUERY:"""

    try:
        sql_response = get_gemini_response(sql_prompt)
        print(f"LLM Response took {time.time()-t0:.2f}s:\n{sql_response}")
        
        sql_query = extract_sql(sql_response).rstrip(';').strip()
        print(f"Extracted SQL:\n{sql_query}")
        
        # execution
        print("Connecting to DB and executing...")
        t1 = time.time()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]
        
        # Make data JSON-serializable
        for row in data:
            for key, value in row.items():
                if hasattr(value, 'isoformat'):
                    row[key] = value.isoformat()
                elif isinstance(value, (bytes, bytearray)):
                    row[key] = str(value)
                    
        print(f"Data serialized. Ready for format_prompt. Sending {len(data[:50])} rows.")
        
        format_prompt = f"""You are a helpful university data assistant. A user asked: "{question}"

The database returned the following data:
{json.dumps(data[:50], indent=2, default=str)}

Total rows returned: {len(data)}

Please provide a clear, friendly, human-readable response summarizing this data. 
- Use bullet points or numbered lists for multiple items
- Highlight key statistics or findings
- If the data is empty, say so politely
- Keep it concise but informative
- Do NOT include any SQL or technical details"""

        print("Asking LLM to format response...")
        t2 = time.time()
        formatted_answer = get_gemini_response(format_prompt)
        print(f"LLM Format Response took {time.time()-t2:.2f}s:\n{formatted_answer[:200]}...")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR: {type(e).__name__}: {str(e)}")

test_nl_sql()
