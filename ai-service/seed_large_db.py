import os
import random
import psycopg2
from psycopg2.extras import execute_values
from faker import Faker
from datetime import date, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
DB_URL = os.environ.get("DATABASE_URL")

fake = Faker('en_IN')

# Configuration
NUM_DEPARTMENTS = 30
NUM_CLASSROOMS = 400
NUM_INSTRUCTORS = 1500
NUM_COURSES = 3000
NUM_STUDENTS = 30000
NUM_ENROLLMENTS = 100000
NUM_ATTENDANCE = 300000
NUM_ALUMNI = 5000
BATCH_SIZE = 5000

def generate_departments(count):
    departments = []
    # Mix tech, science, arts, commerce to sound like a full scale university
    prefixes = ["Computer", "Electrical", "Mechanical", "Civil", "Aeronautical", 
                "Chemical", "Biotechnology", "Information", "Electronics", "Physics", 
                "Chemistry", "Mathematics", "Economics", "Literature", "History", 
                "Political", "Psychology", "Sociology", "Management", "Finance", 
                "Marketing", "Law", "Medicine", "Pharmacy", "Architecture", 
                "Design", "Fine Arts", "Music", "Agriculture", "Environmental"]
    
    for i in range(min(count, len(prefixes))):
        name = prefixes[i] + (" Engineering" if i < 11 else " Science" if 10 < i < 14 else " Studies")
        hod = fake.name()
        departments.append((name, hod))
    return departments

def generate_classrooms(count):
    classrooms = []
    buildings = ["Main Block", "Science Wing", "Engineering Annex", "Library Block", "Auditorium", "New IT Block", "Management Wing"]
    for i in range(count):
        cr_id = f"CR{i+1:04d}"
        bldg = random.choice(buildings)
        room = f"{random.randint(1,9)}{random.randint(0,9)}{random.randint(1,9)}"
        cap = random.choice([30, 40, 50, 60, 100, 150, 200])
        classrooms.append((cr_id, bldg, room, cap))
    return classrooms

def generate_instructors(count, dept_ids):
    instructors = []
    emails_set = set() # Ensure unique
    for i in range(count):
        name = fake.name()
        
        email = f"{name.lower().replace(' ', '.')}.{random.randint(10,999)}@university.edu"
        while email in emails_set:
            email = f"{name.lower().replace(' ', '.')}.{random.randint(1000,9999)}@university.edu"
        emails_set.add(email)
        
        phone = f"9{fake.msisdn()[4:]}" # Indian style mobile
        hire_date = fake.date_between(start_date='-10y', end_date='today')
        dept_id = random.choice(dept_ids)
        instructors.append((name, email, phone, hire_date, dept_id))
    return instructors

def generate_courses(count, dept_ids):
    courses = []
    semesters = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", 
                 "Semester 5", "Semester 6", "Semester 7", "Semester 8"]
    course_topics = ["Introduction to", "Advanced", "Principles of", "Applied", "Fundamentals of"]
    course_subjects = ["Programming", "Data Structures", "Algorithms", "Thermodynamics", "Mechanics", 
                       "Quantum Physics", "Organic Chemistry", "Macroeconomics", "Machine Learning", 
                       "Cyber Security", "Network Protocols", "Microbiology", "Calculus", "Linear Algebra",
                       "Project Management", "Digital Electronics", "Signal Processing", "Web Systems"]
    
    for i in range(count):
        c_id = f"CS{i+1:05d}"
        c_name = f"{random.choice(course_topics)} {random.choice(course_subjects)} {random.choice(['I', 'II', 'III', ''])}".strip()
        credits = random.randint(2, 4)
        dept_id = random.choice(dept_ids)
        sem = random.choice(semesters)
        courses.append((c_id, c_name, credits, dept_id, sem))
    return courses

def generate_students(count, dept_ids):
    students = []
    emails_set = set()
    for i in range(count):
        s_id = f"STU{i+1:06d}"
        name = fake.name()
        dob = fake.date_of_birth(minimum_age=17, maximum_age=26)
        
        email = f"{name.lower().replace(' ', '')}{random.randint(100, 999)}@student.uni.edu"
        while email in emails_set:
            email = f"{name.lower().replace(' ', '')}{random.randint(1000, 9999)}@student.uni.edu"
        emails_set.add(email)
        
        phone = f"8{fake.msisdn()[4:]}"
        admission_year = random.randint(2019, 2024)
        dept_id = random.choice(dept_ids)
        students.append((s_id, name, dob, email, phone, admission_year, dept_id))
    return students

def generate_enrollments(count, student_ids, course_ids):
    enrollments = []
    grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', None]
    weights = [0.1, 0.2, 0.25, 0.2, 0.1, 0.08, 0.05, 0.02, 0.2] # Current students represent None grade possibly
    
    # Pre-select valid combinations using a set to avoid uniqueness collision? 
    # For speed, we just generate and accept duplicates because in schema.sql, enrollment uniqueness is primary key based on id
    # However we don't want the exact same student-course combo ideally, but for fake massive data it's acceptable.
    
    for i in range(count):
        e_id = f"ENR{i+1:07d}"
        s_id = random.choice(student_ids)
        c_id = random.choice(course_ids)
        date_enr = fake.date_between(start_date='-4y', end_date='-1m')
        grade = random.choices(grades, weights=weights, k=1)[0]
        enrollments.append((e_id, s_id, c_id, date_enr, grade))
    return enrollments

def generate_attendance(count, student_ids, course_ids):
    attendance = []
    statuses = ['Present', 'Absent', 'Late']
    weights = [0.75, 0.15, 0.10]
    
    used_combo = set()
    i = 0
    while i < count:
        s_id = random.choice(student_ids)
        c_id = random.choice(course_ids)
        # Random date in last year
        a_date = date.today() - timedelta(days=random.randint(0, 300))
        
        key = (s_id, c_id, a_date)
        if key not in used_combo:
            used_combo.add(key)
            status = random.choices(statuses, weights=weights, k=1)[0]
            attendance.append((s_id, c_id, a_date, status))
            i += 1
            if i % 10000 == 0:
                print(f"Generated {i} attendance records...")
    return attendance

def generate_alumni(count, student_ids):
    alumni = []
    job_titles = ["Software Engineer", "Data Scientist", "Product Manager", "Mechanical Engineer", 
                  "Consultant", "Analyst", "Research Associate", "System Administrator", "Civil Engineer"]
    companies = ["TCS", "Infosys", "Wipro", "Cognizant", "Google", "Microsoft", "Amazon", "L&T", 
                 "Reliance", "Tata Motors", "IBM", "Accenture", "Capgemini", "Deloitte", "HDFC"]
    
    selected_students = random.sample(student_ids, min(count, len(student_ids)))
    
    for s_id in selected_students:
        grad_year = random.randint(2010, 2023)
        job = random.choice(job_titles)
        company = random.choice(companies)
        alumni.append((s_id, grad_year, job, company))
    return alumni

def main():
    print("Connecting to DB...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cursor = conn.cursor()

    try:
        print("Truncating old tables...")
        # TRUNCATE cascades
        cursor.execute("TRUNCATE TABLE attendance, enrollments, alumni, instructors, courses, classrooms, students, departments CASCADE;")
        
        print("Generating and inserting Departments...")
        depts = generate_departments(NUM_DEPARTMENTS)
        execute_values(cursor, "INSERT INTO departments (department_name, head_of_department) VALUES %s RETURNING department_id", depts)
        dept_ids = [row[0] for row in cursor.fetchall()]
        
        print("Generating and inserting Classrooms...")
        classm = generate_classrooms(NUM_CLASSROOMS)
        execute_values(cursor, "INSERT INTO classrooms (classroom_id, building, room_number, capacity) VALUES %s", classm)

        print(f"Generating and inserting {NUM_INSTRUCTORS} Instructors...")
        inst = generate_instructors(NUM_INSTRUCTORS, dept_ids)
        execute_values(cursor, "INSERT INTO instructors (name, email, phone_number, hire_date, department_id) VALUES %s", inst, page_size=BATCH_SIZE)
        
        print(f"Generating and inserting {NUM_COURSES} Courses...")
        courses = generate_courses(NUM_COURSES, dept_ids)
        execute_values(cursor, "INSERT INTO courses (course_id, course_name, credits, department_id, semester) VALUES %s", courses, page_size=BATCH_SIZE)
        course_ids = [c[0] for c in courses]

        print(f"Generating and inserting {NUM_STUDENTS} Students...")
        students = generate_students(NUM_STUDENTS, dept_ids)
        execute_values(cursor, "INSERT INTO students (student_id, name, date_of_birth, email, phone_number, admission_year, department_id) VALUES %s", students, page_size=BATCH_SIZE)
        student_ids = [s[0] for s in students]

        print(f"Generating and inserting {NUM_ENROLLMENTS} Enrollments...")
        enrolls = generate_enrollments(NUM_ENROLLMENTS, student_ids, course_ids)
        execute_values(cursor, "INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES %s", enrolls, page_size=BATCH_SIZE)

        print(f"Generating and inserting {NUM_ATTENDANCE} Attendance records...")
        atts = generate_attendance(NUM_ATTENDANCE, student_ids, course_ids)
        execute_values(cursor, "INSERT INTO attendance (student_id, course_id, attendance_date, status) VALUES %s", atts, page_size=BATCH_SIZE)

        print(f"Generating and inserting {NUM_ALUMNI} Alumni...")
        alums = generate_alumni(NUM_ALUMNI, student_ids)
        execute_values(cursor, "INSERT INTO alumni (student_id, graduation_year, current_job_title, company) VALUES %s", alums, page_size=BATCH_SIZE)

        print("Committing transaction...")
        conn.commit()
        print("Done! Database is loaded.")

    except Exception as e:
        conn.rollback()
        print("Error during insertion:", e)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
