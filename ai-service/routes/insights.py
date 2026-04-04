"""
Feature 4 — Smart Insights Dashboard
Generates AI-powered summaries of database statistics.
"""

from fastapi import APIRouter, HTTPException
import psycopg2
import json
from config import get_gemini_response, DATABASE_URL

router = APIRouter()


def get_db_connection():
    ssl_mode = "require" if "render.com" in (DATABASE_URL or "") else "prefer"
    return psycopg2.connect(DATABASE_URL, sslmode=ssl_mode)


def run_aggregate_queries() -> dict:
    """Run various aggregate queries to gather institution statistics."""
    stats = {}
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Total counts
        queries = {
            "total_students": "SELECT COUNT(*) FROM students",
            "total_courses": "SELECT COUNT(*) FROM courses",
            "total_departments": "SELECT COUNT(*) FROM departments",
            "total_instructors": "SELECT COUNT(*) FROM instructors",
            "total_enrollments": "SELECT COUNT(*) FROM enrollments",
            "total_classrooms": "SELECT COUNT(*) FROM classrooms",
            "total_alumni": "SELECT COUNT(*) FROM alumni",
        }
        
        for key, query in queries.items():
            try:
                cursor.execute(query)
                stats[key] = cursor.fetchone()[0]
            except Exception:
                stats[key] = 0
        
        # Department-wise student count
        try:
            cursor.execute("""
                SELECT d.department_name, COUNT(s.student_id) as student_count
                FROM departments d
                LEFT JOIN students s ON d.department_id = s.department_id
                GROUP BY d.department_name
                ORDER BY student_count DESC
            """)
            stats["students_by_department"] = [
                {"department": row[0], "count": row[1]} for row in cursor.fetchall()
            ]
        except Exception:
            stats["students_by_department"] = []
        
        # Course enrollment counts
        try:
            cursor.execute("""
                SELECT c.course_name, COUNT(e.enrollment_id) as enrollment_count
                FROM courses c
                LEFT JOIN enrollments e ON c.course_id = e.course_id
                GROUP BY c.course_name
                ORDER BY enrollment_count DESC
                LIMIT 10
            """)
            stats["top_courses_by_enrollment"] = [
                {"course": row[0], "enrollments": row[1]} for row in cursor.fetchall()
            ]
        except Exception:
            stats["top_courses_by_enrollment"] = []
        
        # Attendance statistics
        try:
            cursor.execute("""
                SELECT 
                    status, COUNT(*) as count
                FROM attendance
                GROUP BY status
            """)
            stats["attendance_summary"] = [
                {"status": row[0], "count": row[1]} for row in cursor.fetchall()
            ]
        except Exception:
            stats["attendance_summary"] = []
        
        # Students with low attendance (below 75%)
        try:
            cursor.execute("""
                SELECT s.name, s.student_id,
                    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as attendance_pct
                FROM students s
                JOIN attendance a ON s.student_id = a.student_id
                GROUP BY s.student_id, s.name
                HAVING COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) < 75
                ORDER BY attendance_pct ASC
                LIMIT 10
            """)
            stats["low_attendance_students"] = [
                {"name": row[0], "student_id": row[1], "attendance_pct": round(float(row[2]), 1) if row[2] else 0}
                for row in cursor.fetchall()
            ]
        except Exception:
            stats["low_attendance_students"] = []
        
        # Recent enrollments
        try:
            cursor.execute("""
                SELECT s.name, c.course_name, e.enrollment_date
                FROM enrollments e
                JOIN students s ON e.student_id = s.student_id
                JOIN courses c ON e.course_id = c.course_id
                ORDER BY e.enrollment_date DESC
                LIMIT 5
            """)
            stats["recent_enrollments"] = [
                {"student": row[0], "course": row[1], "date": row[2].isoformat() if row[2] else None}
                for row in cursor.fetchall()
            ]
        except Exception:
            stats["recent_enrollments"] = []
            
    finally:
        cursor.close()
        conn.close()
    
    return stats


@router.post("/insights")
async def generate_insights():
    """Generate AI-powered insights from database statistics."""
    try:
        # Gather statistics
        stats = run_aggregate_queries()
        
        # Generate AI summary
        insights_prompt = f"""You are a university analytics assistant. Based on the following institutional data, provide 5-7 key insights and recommendations.

INSTITUTIONAL DATA:
{json.dumps(stats, indent=2, default=str)}

INSTRUCTIONS:
- Identify trends and patterns
- Highlight any concerning metrics (e.g., low attendance)
- Suggest actionable recommendations
- Be specific with numbers and percentages
- Keep insights concise and actionable
- Use bullet points
- Focus on what matters most to administrators

INSIGHTS:"""

        ai_summary = get_gemini_response(insights_prompt)
        
        return {
            "insights": ai_summary,
            "stats": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")
