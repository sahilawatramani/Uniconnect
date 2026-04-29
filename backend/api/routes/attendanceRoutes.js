const express = require('express');
const router = express.Router();
const db = require('../../config');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/attendance/summary — Subject-wise attendance summary for students
router.get('/summary', async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(400).json({ error: 'Summary is only available for students.' });
        }

        const { semester } = req.query;

        let query = `
            SELECT c.course_id, c.course_name, c.semester,
                COUNT(*) as total_classes,
                COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
                COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent,
                COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late,
                ROUND(COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as percentage
            FROM attendance a
            LEFT JOIN courses c ON a.course_id = c.course_id
            WHERE a.student_id = $1`;
        const params = [req.user.student_id];

        if (semester) {
            query += ` AND c.semester = $2`;
            params.push(semester);
        }

        query += ` GROUP BY c.course_id, c.course_name, c.semester ORDER BY c.semester, c.course_name`;

        const result = await db.query(query, params);

        // Also get list of distinct semesters for the filter dropdown
        const semResult = await db.query(
            `SELECT DISTINCT c.semester FROM attendance a
             LEFT JOIN courses c ON a.course_id = c.course_id
             WHERE a.student_id = $1 AND c.semester IS NOT NULL
             ORDER BY c.semester`,
            [req.user.student_id]
        );

        res.json({
            subjects: result.rows,
            semesters: semResult.rows.map(r => r.semester)
        });
    } catch (err) {
        console.error('Error fetching attendance summary:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance — List attendance records (role-filtered)
router.get('/', async (req, res) => {
    try {
        const { semester } = req.query;

        if (req.user.role === 'student') {
            let query = `SELECT a.*, s.name as student_name, c.course_name, c.semester
                 FROM attendance a
                 LEFT JOIN students s ON a.student_id = s.student_id
                 LEFT JOIN courses c ON a.course_id = c.course_id
                 WHERE a.student_id = $1`;
            const params = [req.user.student_id];

            if (semester) {
                query += ` AND c.semester = $2`;
                params.push(semester);
            }

            query += ` ORDER BY a.attendance_date DESC LIMIT 500`;
            const result = await db.query(query, params);
            return res.json(result.rows);
        }
        // Admin: see all
        const result = await db.query(
            `SELECT a.*, s.name as student_name, c.course_name, c.semester
             FROM attendance a
             LEFT JOIN students s ON a.student_id = s.student_id
             LEFT JOIN courses c ON a.course_id = c.course_id
             ORDER BY a.attendance_date DESC
             LIMIT 500`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance/:id — Get single attendance record
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT a.*, s.name as student_name, c.course_name
             FROM attendance a
             JOIN students s ON a.student_id = s.student_id
             JOIN courses c ON a.course_id = c.course_id
             WHERE a.attendance_id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        // Students can only see their own attendance
        if (req.user.role === 'student' && result.rows[0].student_id !== req.user.student_id) {
            return res.status(403).json({ error: 'You can only view your own attendance records.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/attendance — Add attendance record (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { student_id, course_id, attendance_date, status } = req.body;
        const result = await db.query(
            `INSERT INTO attendance (student_id, course_id, attendance_date, status)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [student_id, course_id, attendance_date, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/attendance/:id — Update attendance (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { student_id, course_id, attendance_date, status } = req.body;
        const result = await db.query(
            `UPDATE attendance SET student_id=$1, course_id=$2, attendance_date=$3, status=$4
             WHERE attendance_id=$5 RETURNING *`,
            [student_id, course_id, attendance_date, status, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/attendance/:id — Delete attendance (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM attendance WHERE attendance_id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        res.json({ message: 'Attendance record deleted successfully' });
    } catch (err) {
        console.error('Error deleting attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
