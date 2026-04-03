-- =============================================
-- UniConnect Database Schema
-- PostgreSQL DDL for all tables
-- =============================================

-- Drop tables in reverse dependency order (if re-creating)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS alumni CASCADE;
DROP TABLE IF EXISTS instructors CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- =============================================
-- 1. Departments (no dependencies)
-- =============================================
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    head_of_department VARCHAR(100)
);

-- =============================================
-- 2. Students (depends on departments)
-- =============================================
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    admission_year INTEGER NOT NULL,
    department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL
);

-- =============================================
-- 3. Instructors (depends on departments)
-- =============================================
CREATE TABLE instructors (
    instructor_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15),
    hire_date DATE,
    department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL
);

-- =============================================
-- 4. Courses (depends on departments)
-- =============================================
CREATE TABLE courses (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
    semester VARCHAR(20) NOT NULL
);

-- =============================================
-- 5. Classrooms (no dependencies)
-- =============================================
CREATE TABLE classrooms (
    classroom_id VARCHAR(20) PRIMARY KEY,
    building VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL
);

-- =============================================
-- 6. Enrollments (depends on students, courses)
-- =============================================
CREATE TABLE enrollments (
    enrollment_id VARCHAR(20) PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    course_id VARCHAR(20) REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL,
    grade VARCHAR(5)
);

-- =============================================
-- 7. Attendance (depends on students, courses)
-- =============================================
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    course_id VARCHAR(20) REFERENCES courses(course_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
    UNIQUE(student_id, course_id, attendance_date)
);

-- =============================================
-- 8. Alumni (depends on students)
-- =============================================
CREATE TABLE alumni (
    alumni_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    graduation_year INTEGER NOT NULL,
    current_job_title VARCHAR(100),
    company VARCHAR(100)
);

-- =============================================
-- Sample seed data (optional - for development)
-- =============================================

-- Departments
INSERT INTO departments (department_name, head_of_department) VALUES
('Computer Science', 'Dr. Rajesh Kumar'),
('Electrical Engineering', 'Dr. Priya Sharma'),
('Mechanical Engineering', 'Dr. Anil Mehta'),
('Civil Engineering', 'Dr. Sunita Patil'),
('Information Technology', 'Dr. Vikram Singh');

-- Students
INSERT INTO students (student_id, name, date_of_birth, email, phone_number, admission_year, department_id) VALUES
('STU001', 'Aarav Patel', '2003-05-15', 'aarav.patel@email.com', '9876543210', 2021, 1),
('STU002', 'Priya Sharma', '2002-08-22', 'priya.sharma@email.com', '9876543211', 2021, 2),
('STU003', 'Rohan Desai', '2003-01-10', 'rohan.desai@email.com', '9876543212', 2022, 1),
('STU004', 'Sneha Kulkarni', '2002-11-30', 'sneha.kulkarni@email.com', '9876543213', 2022, 3),
('STU005', 'Amit Joshi', '2003-03-18', 'amit.joshi@email.com', '9876543214', 2023, 5);

-- Instructors
INSERT INTO instructors (name, email, phone_number, hire_date, department_id) VALUES
('Dr. Meena Iyer', 'meena.iyer@university.edu', '9123456780', '2015-06-01', 1),
('Prof. Suresh Reddy', 'suresh.reddy@university.edu', '9123456781', '2018-08-15', 2),
('Dr. Kavita Nair', 'kavita.nair@university.edu', '9123456782', '2020-01-10', 1);

-- Courses
INSERT INTO courses (course_id, course_name, credits, department_id, semester) VALUES
('CS101', 'Introduction to Programming', 4, 1, 'Semester 1'),
('CS201', 'Data Structures', 4, 1, 'Semester 3'),
('EE101', 'Circuit Analysis', 3, 2, 'Semester 1'),
('ME101', 'Engineering Mechanics', 3, 3, 'Semester 1'),
('IT201', 'Web Development', 4, 5, 'Semester 3');

-- Classrooms
INSERT INTO classrooms (classroom_id, building, room_number, capacity) VALUES
('CR001', 'Main Building', '101', 60),
('CR002', 'Main Building', '202', 40),
('CR003', 'Science Block', '301', 50),
('CR004', 'IT Wing', '105', 35);

-- Enrollments
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES
('ENR001', 'STU001', 'CS101', '2021-07-01', 'A'),
('ENR002', 'STU001', 'CS201', '2022-01-15', 'A+'),
('ENR003', 'STU002', 'EE101', '2021-07-01', 'B+'),
('ENR004', 'STU003', 'CS101', '2022-07-01', 'A'),
('ENR005', 'STU005', 'IT201', '2023-07-01', 'B');

-- Attendance
INSERT INTO attendance (student_id, course_id, attendance_date, status) VALUES
('STU001', 'CS101', '2024-01-15', 'Present'),
('STU001', 'CS101', '2024-01-16', 'Present'),
('STU002', 'EE101', '2024-01-15', 'Absent'),
('STU003', 'CS101', '2024-01-15', 'Present'),
('STU005', 'IT201', '2024-01-15', 'Late');

-- Alumni
INSERT INTO alumni (student_id, graduation_year, current_job_title, company) VALUES
('STU001', 2025, 'Software Engineer', 'TCS'),
('STU002', 2025, 'Electrical Engineer', 'Siemens');
