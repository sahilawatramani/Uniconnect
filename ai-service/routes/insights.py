"""
Feature 4 — Smart Insights Dashboard
Generates AI-powered summaries of database statistics.
Supports RBAC: students see only their own stats.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import psycopg2
import json
from config import get_gemini_response, DATABASE_URL

router = APIRouter()


class InsightsRequest(BaseModel):
    role: Optional[str] = None
    student_id: Optional[str] = None


def get_db_connection():
    ssl_mode = "require" if "render.com" in (DATABASE_URL or "") else "prefer"
    return psycopg2.connect(DATABASE_URL, sslmode=ssl_mode)


def run_admin_queries() -> dict:
    """Run aggregate queries for admin — full institutional view."""
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


def run_student_queries(student_id: str) -> dict:
    """Run queries for a specific student — personal view only."""
    stats = {}
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Student's info
        try:
            cursor.execute("""
                SELECT s.name, s.email, d.department_name, s.admission_year
                FROM students s
                LEFT JOIN departments d ON s.department_id = d.department_id
                WHERE s.student_id = %s
            """, [student_id])
            row = cursor.fetchone()
            if row:
                stats["student_info"] = {
                    "name": row[0], "email": row[1],
                    "department": row[2], "admission_year": row[3]
                }
        except Exception:
            stats["student_info"] = {}

        # Student's enrolled courses
        try:
            cursor.execute("""
                SELECT c.course_name, c.credits, e.grade, e.enrollment_date
                FROM enrollments e
                JOIN courses c ON e.course_id = c.course_id
                WHERE e.student_id = %s
                ORDER BY e.enrollment_date DESC
            """, [student_id])
            stats["my_courses"] = [
                {"course": row[0], "credits": row[1], "grade": row[2],
                 "date": row[3].isoformat() if row[3] else None}
                for row in cursor.fetchall()
            ]
            stats["total_enrollments"] = len(stats["my_courses"])
        except Exception:
            stats["my_courses"] = []
            stats["total_enrollments"] = 0

        # Student's attendance
        try:
            cursor.execute("""
                SELECT 
                    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
                    COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent,
                    COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late,
                    COUNT(*) as total,
                    ROUND(COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as attendance_pct
                FROM attendance a
                WHERE a.student_id = %s
            """, [student_id])
            row = cursor.fetchone()
            if row:
                stats["attendance_summary"] = [
                    {"status": "Present", "count": row[0]},
                    {"status": "Absent", "count": row[1]},
                    {"status": "Late", "count": row[2]}
                ]
                stats["attendance_percentage"] = float(row[4]) if row[4] else 0
                stats["total_classes"] = row[3]
        except Exception:
            stats["attendance_summary"] = []
            stats["attendance_percentage"] = 0

        # Per-course attendance
        try:
            cursor.execute("""
                SELECT c.course_name,
                    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
                    COUNT(*) as total,
                    ROUND(COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as pct
                FROM attendance a
                JOIN courses c ON a.course_id = c.course_id
                WHERE a.student_id = %s
                GROUP BY c.course_name
            """, [student_id])
            stats["course_attendance"] = [
                {"course": row[0], "present": row[1], "total": row[2],
                 "percentage": float(row[3]) if row[3] else 0}
                for row in cursor.fetchall()
            ]
        except Exception:
            stats["course_attendance"] = []

    finally:
        cursor.close()
        conn.close()
    
    return stats


@router.post("/insights")
async def generate_insights(request: InsightsRequest = InsightsRequest()):
    """Generate AI-powered insights from database statistics."""
    try:
        is_student = request.role == "student" and request.student_id
        
        if is_student:
            stats = run_student_queries(request.student_id)
            insights_prompt = f"""You are a university academic advisor. Based on the following student data, provide 4-5 personalized insights and recommendations for the student.

STUDENT DATA:
{json.dumps(stats, indent=2, default=str)}

INSTRUCTIONS:
- Address the student directly (use "you/your")
- Comment on their attendance percentage and suggest improvements if below 80%
- Review their course grades and suggest areas of focus
- Be encouraging and supportive
- Provide actionable advice
- Use bullet points
- Keep insights concise and helpful

INSIGHTS:"""
        else:
            stats = run_admin_queries()
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
