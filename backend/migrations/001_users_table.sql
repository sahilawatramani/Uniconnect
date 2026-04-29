-- =============================================
-- UniConnect RBAC Migration
-- Adds users table for authentication
-- Run this AFTER the main schema.sql
-- =============================================

-- Drop if re-creating
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed a default admin user (password: admin123 — bcrypt hash)
-- You can generate a new hash with: node -e "require('bcrypt').hash('admin123', 10).then(h => console.log(h))"
-- For now, this will be inserted via the register endpoint
