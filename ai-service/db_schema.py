"""
Database schema definition for schema-grounded NL-to-SQL.
This gives the LLM full awareness of the UniConnect database structure.
"""

SCHEMA = """
DATABASE: UniConnect (PostgreSQL)

TABLE: students
  - student_id (VARCHAR, PRIMARY KEY)
  - name (VARCHAR, NOT NULL)
  - date_of_birth (DATE)
  - email (VARCHAR, UNIQUE)
  - phone_number (VARCHAR)
  - admission_year (INTEGER)
  - department_id (INTEGER, FOREIGN KEY -> departments.department_id)

TABLE: courses
  - course_id (INTEGER, PRIMARY KEY, AUTO-INCREMENT)
  - course_name (VARCHAR, NOT NULL)
  - duration (VARCHAR)
  - instructor_id (INTEGER, FOREIGN KEY -> instructors.instructor_id)
  - start_date (DATE)
  - end_date (DATE)

TABLE: departments
  - department_id (INTEGER, PRIMARY KEY, AUTO-INCREMENT)
  - department_name (VARCHAR, NOT NULL)
  - head_of_department (VARCHAR)

TABLE: instructors
  - instructor_id (INTEGER, PRIMARY KEY, AUTO-INCREMENT)
  - name (VARCHAR, NOT NULL)
  - email (VARCHAR, UNIQUE)
  - phone_number (VARCHAR)
  - department_id (INTEGER, FOREIGN KEY -> departments.department_id)

TABLE: classrooms
  - classroom_id (INTEGER, PRIMARY KEY, AUTO-INCREMENT)
  - room_number (VARCHAR, NOT NULL)
  - building (VARCHAR)
  - capacity (INTEGER)

TABLE: enrollments
  - enrollment_id (INTEGER, PRIMARY KEY, AUTO-INCREMENT)
  - student_id (VARCHAR, FOREIGN KEY -> students.student_id)
  - course_id (INTEGER, FOREIGN KEY -> courses.course_id)
  - enrollment_date (DATE)

TABLE: attendance
  - attendance_id (INTEGER, PRIMARY KEY, AUTO-INCREMENT)
  - student_id (VARCHAR, FOREIGN KEY -> students.student_id)
  - course_id (INTEGER, FOREIGN KEY -> courses.course_id)
  - attendance_date (DATE)
  - status (VARCHAR) -- values: 'Present', 'Absent', 'Late'

TABLE: alumni
  - alumni_id (INTEGER, PRIMARY KEY, AUTO-INCREMENT)
  - name (VARCHAR, NOT NULL)
  - graduation_year (INTEGER)
  - degree (VARCHAR)
  - email (VARCHAR)
  - phone_number (VARCHAR)

RELATIONSHIPS:
  - students.department_id -> departments.department_id
  - courses.instructor_id -> instructors.instructor_id
  - instructors.department_id -> departments.department_id
  - enrollments.student_id -> students.student_id
  - enrollments.course_id -> courses.course_id
  - attendance.student_id -> students.student_id
  - attendance.course_id -> courses.course_id
"""
