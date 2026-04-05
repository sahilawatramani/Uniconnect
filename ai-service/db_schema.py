"""
Database schema definition for schema-grounded NL-to-SQL.
This gives the LLM full awareness of the UniConnect database structure.
"""

SCHEMA = """
DATABASE: UniConnect (PostgreSQL)

TABLE: departments
  - department_id (SERIAL, PRIMARY KEY)
  - department_name (VARCHAR, NOT NULL)
  - head_of_department (VARCHAR)

TABLE: students
  - student_id (VARCHAR, PRIMARY KEY)
  - name (VARCHAR, NOT NULL)
  - date_of_birth (DATE, NOT NULL)
  - email (VARCHAR, UNIQUE, NOT NULL)
  - phone_number (VARCHAR, NOT NULL)
  - admission_year (INTEGER, NOT NULL)
  - department_id (INTEGER, FOREIGN KEY -> departments.department_id)

TABLE: instructors
  - instructor_id (SERIAL, PRIMARY KEY)
  - name (VARCHAR, NOT NULL)
  - email (VARCHAR, UNIQUE, NOT NULL)
  - phone_number (VARCHAR)
  - hire_date (DATE)
  - department_id (INTEGER, FOREIGN KEY -> departments.department_id)

TABLE: courses
  - course_id (VARCHAR, PRIMARY KEY)
  - course_name (VARCHAR, NOT NULL)
  - credits (INTEGER, NOT NULL)
  - department_id (INTEGER, FOREIGN KEY -> departments.department_id)
  - semester (VARCHAR, NOT NULL)

TABLE: classrooms
  - classroom_id (VARCHAR, PRIMARY KEY)
  - building (VARCHAR, NOT NULL)
  - room_number (VARCHAR, NOT NULL)
  - capacity (INTEGER, NOT NULL)

TABLE: enrollments
  - enrollment_id (VARCHAR, PRIMARY KEY)
  - student_id (VARCHAR, FOREIGN KEY -> students.student_id)
  - course_id (VARCHAR, FOREIGN KEY -> courses.course_id)
  - enrollment_date (DATE, NOT NULL)
  - grade (VARCHAR)

TABLE: attendance
  - attendance_id (SERIAL, PRIMARY KEY)
  - student_id (VARCHAR, FOREIGN KEY -> students.student_id)
  - course_id (VARCHAR, FOREIGN KEY -> courses.course_id)
  - attendance_date (DATE, NOT NULL)
  - status (VARCHAR) -- values: 'Present', 'Absent', 'Late'

TABLE: alumni
  - alumni_id (SERIAL, PRIMARY KEY)
  - student_id (VARCHAR, FOREIGN KEY -> students.student_id)
  - graduation_year (INTEGER, NOT NULL)
  - current_job_title (VARCHAR)
  - company (VARCHAR)

RELATIONSHIPS:
  - students.department_id -> departments.department_id
  - instructors.department_id -> departments.department_id
  - courses.department_id -> departments.department_id
  - enrollments.student_id -> students.student_id
  - enrollments.course_id -> courses.course_id
  - attendance.student_id -> students.student_id
  - attendance.course_id -> courses.course_id
  - alumni.student_id -> students.student_id

HINTS FOR CALCULATING METRICS AND SQL GENERATION:
1. "Course Enrollment" / "Highest Enrollment": This means the number of students registered for a course. Calculate by grouping by courses.course_id or course_name and using COUNT(enrollments.student_id). Do NOT involve dates.
2. "Attendance percentage": Calculate as (COUNT(CASE WHEN attendance.status = 'Present' THEN 1 END) * 100.0) / NULLIF(COUNT(attendance.status), 0). Group by student or course as requested.
3. "Highest/Top": Use ORDER BY [metric] DESC LIMIT 1 (or requested number).
4. "Lowest/Bottom": Use ORDER BY [metric] ASC LIMIT 1.
5. "Student Count per Department": Group by departments.department_name and COUNT(students.student_id).
"""
