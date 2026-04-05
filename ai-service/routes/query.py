"""
Feature 1 — Conversational Database Assistant (NL-to-SQL)
Converts natural language questions to SQL, executes them, and formats results.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import re
import json
from config import get_gemini_response, DATABASE_URL
from db_schema import SCHEMA

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


def get_db_connection():
    """Create a fresh database connection."""
    ssl_mode = "require" if "render.com" in (DATABASE_URL or "") else "prefer"
    return psycopg2.connect(DATABASE_URL, sslmode=ssl_mode)


def validate_sql(sql: str) -> bool:
    """Validate that the SQL is a SELECT-only query (no mutations)."""
    cleaned = sql.strip().upper()
    # Remove comments
    cleaned = re.sub(r'--.*$', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
    cleaned = cleaned.strip()
    
    dangerous_keywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 
                          'TRUNCATE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE']
    
    for keyword in dangerous_keywords:
        if re.search(r'\b' + keyword + r'\b', cleaned):
            return False
    
    if not cleaned.startswith('SELECT'):
        return False
    
    return True


def extract_sql(response_text: str) -> str:
    """Extract SQL from Gemini response (may be wrapped in markdown code blocks)."""
    # Try to find SQL in code blocks
    sql_match = re.search(r'```(?:sql)?\s*(SELECT.*?)```', response_text, re.DOTALL | re.IGNORECASE)
    if sql_match:
        return sql_match.group(1).strip()
    
    # Try to find a line starting with SELECT
    for line in response_text.split('\n'):
        stripped = line.strip()
        if stripped.upper().startswith('SELECT'):
            # Collect multi-line SQL
            idx = response_text.index(line)
            remaining = response_text[idx:].split(';')[0] + ';'
            return remaining.strip()
    
    return response_text.strip()


@router.post("/query")
async def query_database(request: QueryRequest):
    """Convert natural language to SQL, execute, and return formatted response."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        last_error = ""
        sql_query = ""
        rows = []
        columns = []
        total_rows = 0
        
        for attempt in range(3):
            # Step 1: Generate SQL from natural language
            error_hint = f"\n\nYOUR PREVIOUS QUERY FAILED WITH THIS ERROR: {last_error}\nPLEASE FIX THE SQL QUERY SO IT EXECUTES SUCCESSFULLY." if last_error else ""
            sql_prompt = f"""You are a PostgreSQL SQL expert. Given the following database schema and a natural language question, generate ONLY a valid PostgreSQL SELECT query. Do not include any explanation, just the SQL query.

DATABASE SCHEMA:
{SCHEMA}

USER QUESTION: {request.question}{error_hint}

IMPORTANT RULES:
- Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE, etc.)
- Use proper PostgreSQL syntax
- Use JOINs when the question involves multiple tables
- Return meaningful column aliases for readability
- If the question involves attendance percentage, calculate it using COUNT and GROUP BY
- Always end with a semicolon
- Return ONLY the SQL query, nothing else

SQL QUERY:"""

            sql_response = get_gemini_response(sql_prompt)
            sql_query = extract_sql(sql_response)
            
            # Remove trailing semicolons for psycopg2
            sql_query = sql_query.rstrip(';').strip()
            
            # Step 2: Validate SQL (security check)
            if not validate_sql(sql_query + ';'):
                raise HTTPException(status_code=400, detail="Only SELECT queries are allowed for security.")
            
            # Step 3: Execute SQL
            try:
                cursor.execute(sql_query)
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchmany(100) # Only fetch first 100 rows to prevent OOM
                
                try:
                    # Calculate real total row count without loading all rows into python
                    cursor.execute(f"SELECT COUNT(*) FROM ({sql_query}) AS subq")
                    total_rows = cursor.fetchone()[0]
                except Exception:
                    total_rows = len(rows)
                
                break # Success! Exit the retry loop
                
            except psycopg2.Error as e:
                conn.rollback() # Important: reset transaction state after error
                last_error = str(e).strip()
                if attempt == 2:
                    cursor.close()
                    conn.close()
                    raise HTTPException(status_code=500, detail=f"Database error after 3 attempts: {last_error}")
            
        # Convert to list of dicts
        data = [dict(zip(columns, row)) for row in rows]
        
        # Make data JSON-serializable
        for row in data:
            for key, value in row.items():
                if hasattr(value, 'isoformat'):
                    row[key] = value.isoformat()
                elif isinstance(value, (bytes, bytearray)):
                    row[key] = str(value)
                    
        # Clean up database connection
        cursor.close()
        conn.close()
        
        # Step 4: Format response with Gemini
        format_prompt = f"""You are a strict data formatting assistant. A user asked: "{request.question}"

The database returned the following JSON data:
{json.dumps(data[:50], indent=2, default=str)}

Total rows returned: {len(data)}

Please provide a clear, friendly, human-readable response summarizing EXACTLY this data.
- DO NOT invent, hallucinate, or bring in outside information. Only use the JSON provided above.
- If the data is empty, say so politely.
- Keep it concise but informative.
- Do NOT include any SQL or technical details."""

        formatted_answer = get_gemini_response(format_prompt)
        
        return {
            "answer": formatted_answer,
            "sql": sql_query,
            "data": data,  # Already limited to 100 max
            "total_rows": total_rows
        }
        
    except psycopg2.Error as db_error:
        raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
