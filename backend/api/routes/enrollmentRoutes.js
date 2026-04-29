const express = require('express');
const router = express.Router();
const db = require('../../config');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/enrollments — List enrollments (role-filtered)
router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'student') {
            // Students can only see their own enrollments
            const result = await db.query(
                `SELECT e.*, s.name as student_name, c.course_name, c.credits
                 FROM enrollments e
                 JOIN students s ON e.student_id = s.student_id
                 JOIN courses c ON e.course_id = c.course_id
                 WHERE e.student_id = $1
                 ORDER BY e.enrollment_date DESC`,
                [req.user.student_id]
            );
            return res.json(result.rows);
        }
        // Admin: see all (limited for performance)
        const result = await db.query(
            `SELECT e.*, s.name as student_name, c.course_name, c.credits
             FROM enrollments e
             LEFT JOIN students s ON e.student_id = s.student_id
             LEFT JOIN courses c ON e.course_id = c.course_id
             ORDER BY e.enrollment_date DESC
             LIMIT 500`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching enrollments:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/enrollments/:id — Get single enrollment
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT e.*, s.name as student_name, c.course_name
             FROM enrollments e
             JOIN students s ON e.student_id = s.student_id
             JOIN courses c ON e.course_id = c.course_id
             WHERE e.enrollment_id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }
        if (req.user.role === 'student' && result.rows[0].student_id !== req.user.student_id) {
            return res.status(403).json({ error: 'You can only view your own enrollments.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching enrollment:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/enrollments — Add enrollment (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { enrollment_id, student_id, course_id, enrollment_date, grade } = req.body;
        const result = await db.query(
            `INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [enrollment_id, student_id, course_id, enrollment_date, grade]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding enrollment:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/enrollments/:id — Update enrollment (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { student_id, course_id, enrollment_date, grade } = req.body;
        const result = await db.query(
            `UPDATE enrollments SET student_id=$1, course_id=$2, enrollment_date=$3, grade=$4
             WHERE enrollment_id=$5 RETURNING *`,
            [student_id, course_id, enrollment_date, grade, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating enrollment:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/enrollments/:id — Delete enrollment (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM enrollments WHERE enrollment_id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }
        res.json({ message: 'Enrollment deleted successfully' });
    } catch (err) {
        console.error('Error deleting enrollment:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
