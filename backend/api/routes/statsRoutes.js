const express = require('express');
const router = express.Router();
const db = require('../../config');

// GET /api/stats — Lightweight dashboard stats (no AI call)
router.get('/', async (req, res) => {
    try {
        const isStudent = req.user?.role === 'student';
        const studentId = req.user?.student_id;
        const stats = {};

        if (isStudent && studentId) {
            // Student: personal stats
            const [enrollments, attendance] = await Promise.all([
                db.query(
                    `SELECT COUNT(*) as count FROM enrollments WHERE student_id = $1`,
                    [studentId]
                ),
                db.query(
                    `SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
                        ROUND(COUNT(CASE WHEN status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as pct
                     FROM attendance WHERE student_id = $1`,
                    [studentId]
                )
            ]);

            stats.total_enrollments = parseInt(enrollments.rows[0]?.count || 0);
            stats.total_classes = parseInt(attendance.rows[0]?.total || 0);
            stats.attendance_percentage = parseFloat(attendance.rows[0]?.pct || 0);
        } else {
            // Admin: institutional overview
            const [students, courses, departments, enrollments] = await Promise.all([
                db.query('SELECT COUNT(*) as count FROM students'),
                db.query('SELECT COUNT(*) as count FROM courses'),
                db.query('SELECT COUNT(*) as count FROM departments'),
                db.query('SELECT COUNT(*) as count FROM enrollments'),
            ]);

            stats.total_students = parseInt(students.rows[0]?.count || 0);
            stats.total_courses = parseInt(courses.rows[0]?.count || 0);
            stats.total_departments = parseInt(departments.rows[0]?.count || 0);
            stats.total_enrollments = parseInt(enrollments.rows[0]?.count || 0);
        }

        res.json({ stats });
    } catch (error) {
        console.error('Stats error:', error.message);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
