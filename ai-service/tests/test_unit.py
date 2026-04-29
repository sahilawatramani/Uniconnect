"""
=============================================
UniConnect — AI Unit Tests (No LLM Required)
Tests SQL validation, extraction, RBAC filtering, quiz parsing
Run: python -m pytest tests/test_unit.py -v
=============================================
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from routes.query import validate_sql, extract_sql, validate_student_filter


# =============================================
# 1. SQL VALIDATION — validate_sql()
# =============================================
class TestValidateSQL:
    """Test the SQL validation function that blocks dangerous queries."""

    def test_valid_select(self):
        assert validate_sql("SELECT * FROM students;") is True

    def test_valid_select_with_join(self):
        assert validate_sql("SELECT s.name FROM students s JOIN departments d ON s.department_id = d.department_id;") is True

    def test_valid_select_with_aggregate(self):
        assert validate_sql("SELECT COUNT(*) FROM students;") is True

    def test_valid_select_with_subquery(self):
        assert validate_sql("SELECT * FROM (SELECT name FROM students) AS sub;") is True

    # --- Dangerous queries ---
    def test_reject_insert(self):
        assert validate_sql("INSERT INTO students VALUES ('STU999', 'Hacker');") is False

    def test_reject_update(self):
        assert validate_sql("UPDATE students SET name = 'Hacked' WHERE student_id = 'STU001';") is False

    def test_reject_delete(self):
        assert validate_sql("DELETE FROM students WHERE 1=1;") is False

    def test_reject_drop_table(self):
        assert validate_sql("DROP TABLE students;") is False

    def test_reject_alter_table(self):
        assert validate_sql("ALTER TABLE students ADD COLUMN hack VARCHAR(100);") is False

    def test_reject_truncate(self):
        assert validate_sql("TRUNCATE students;") is False

    def test_reject_create_table(self):
        assert validate_sql("CREATE TABLE hacked (id INT);") is False

    def test_reject_grant(self):
        assert validate_sql("GRANT ALL ON students TO public;") is False

    # --- SQL injection in SELECT ---
    def test_reject_select_with_drop_comment(self):
        assert validate_sql("SELECT 1; DROP TABLE students; --") is False

    def test_reject_union_with_delete(self):
        assert validate_sql("SELECT * FROM students; DELETE FROM students;") is False

    # --- Edge cases ---
    def test_reject_empty_string(self):
        assert validate_sql("") is False

    def test_reject_only_comments(self):
        assert validate_sql("-- just a comment") is False

    def test_valid_with_case_when(self):
        sql = "SELECT CASE WHEN status = 'Present' THEN 1 END FROM attendance;"
        assert validate_sql(sql) is True

    def test_valid_with_having(self):
        sql = "SELECT student_id, COUNT(*) FROM attendance GROUP BY student_id HAVING COUNT(*) > 5;"
        assert validate_sql(sql) is True


# =============================================
# 2. SQL EXTRACTION — extract_sql()
# =============================================
class TestExtractSQL:
    """Test SQL extraction from LLM markdown responses."""

    def test_extract_from_code_block(self):
        response = "Here is the query:\n```sql\nSELECT * FROM students;\n```"
        assert extract_sql(response).startswith("SELECT")

    def test_extract_from_plain_text(self):
        response = "SELECT name FROM students WHERE student_id = 'STU001';"
        assert extract_sql(response).startswith("SELECT")

    def test_extract_multiline_sql(self):
        response = """Here is my answer:
SELECT s.name, d.department_name
FROM students s
JOIN departments d ON s.department_id = d.department_id;
That should work."""
        result = extract_sql(response)
        assert "SELECT" in result.upper()
        assert "JOIN" in result.upper()

    def test_extract_from_triple_backtick(self):
        response = "```\nSELECT COUNT(*) FROM courses;\n```"
        result = extract_sql(response)
        assert "COUNT" in result.upper()

    def test_handle_no_sql(self):
        response = "I'm sorry, I don't understand your question."
        result = extract_sql(response)
        assert isinstance(result, str)


# =============================================
# 3. RBAC FILTER — validate_student_filter()
# =============================================
class TestStudentFilter:
    """Test student data isolation enforcement."""

    def test_pass_when_filter_present(self):
        sql = "SELECT * FROM students WHERE student_id = 'STU001'"
        assert validate_student_filter(sql, "STU001") is True

    def test_fail_when_filter_missing_on_students(self):
        sql = "SELECT * FROM students"
        assert validate_student_filter(sql, "STU001") is False

    def test_fail_when_filter_missing_on_attendance(self):
        sql = "SELECT * FROM attendance GROUP BY course_id"
        assert validate_student_filter(sql, "STU001") is False

    def test_fail_when_filter_missing_on_enrollments(self):
        sql = "SELECT * FROM enrollments JOIN courses ON enrollments.course_id = courses.course_id"
        assert validate_student_filter(sql, "STU002") is False

    def test_pass_for_non_sensitive_table(self):
        sql = "SELECT * FROM courses"
        assert validate_student_filter(sql, "STU001") is True

    def test_pass_for_departments(self):
        sql = "SELECT * FROM departments"
        assert validate_student_filter(sql, "STU001") is True

    def test_pass_for_classrooms(self):
        sql = "SELECT * FROM classrooms WHERE capacity > 30"
        assert validate_student_filter(sql, "STU001") is True

    def test_fail_for_alumni_without_filter(self):
        sql = "SELECT * FROM alumni JOIN students ON alumni.student_id = students.student_id"
        assert validate_student_filter(sql, "STU003") is False

    def test_pass_for_alumni_with_filter(self):
        sql = "SELECT * FROM alumni WHERE student_id = 'STU003'"
        assert validate_student_filter(sql, "STU003") is True


# =============================================
# 4. QUIZ PARSING — parse_quiz_json()
# =============================================
class TestQuizParsing:
    """Test quiz JSON extraction from LLM responses."""

    def setup_method(self):
        from routes.quiz import parse_quiz_json
        self.parse = parse_quiz_json

    def test_parse_from_code_block(self):
        response = '```json\n[{"question": "What is 2+2?", "options": {"A": "3", "B": "4", "C": "5", "D": "6"}, "correct_answer": "B", "explanation": "Basic math"}]\n```'
        result = self.parse(response)
        assert len(result) == 1
        assert result[0]["correct_answer"] == "B"

    def test_parse_raw_json(self):
        response = '[{"question": "Test?", "options": {"A": "1", "B": "2", "C": "3", "D": "4"}, "correct_answer": "A", "explanation": "Explanation"}]'
        result = self.parse(response)
        assert len(result) == 1

    def test_return_empty_for_garbage(self):
        result = self.parse("This is not JSON at all, just random text!")
        assert result == []

    def test_parse_multiple_questions(self):
        questions = [
            {"question": f"Q{i}?", "options": {"A": "1", "B": "2", "C": "3", "D": "4"}, "correct_answer": "A", "explanation": "E"}
            for i in range(5)
        ]
        import json
        response = json.dumps(questions)
        result = self.parse(response)
        assert len(result) == 5
