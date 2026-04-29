const express = require('express');
const router = express.Router();
const db = require('../../config');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/students — List students (role-filtered)
router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'student') {
            // Students can only see their own record
            const result = await db.query('SELECT * FROM students WHERE student_id = $1', [req.user.student_id]);
            return res.json(result.rows);
        }
        // Admin: see all (limited for performance)
        const result = await db.query('SELECT * FROM students ORDER BY student_id LIMIT 500');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/students/:id — Get single student
router.get('/:id', async (req, res) => {
    try {
        // Students can only see their own record
        if (req.user.role === 'student' && req.params.id !== req.user.student_id) {
            return res.status(403).json({ error: 'You can only view your own student record.' });
        }
        const result = await db.query('SELECT * FROM students WHERE student_id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching student:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/students — Add student (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { student_id, name, date_of_birth, email, phone_number, admission_year, department_id } = req.body;
        const result = await db.query(
            `INSERT INTO students (student_id, name, date_of_birth, email, phone_number, admission_year, department_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [student_id, name, date_of_birth, email, phone_number, admission_year, department_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding student:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/students/:id — Update student (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { name, date_of_birth, email, phone_number, admission_year, department_id } = req.body;
        const result = await db.query(
            `UPDATE students SET name=$1, date_of_birth=$2, email=$3, phone_number=$4, admission_year=$5, department_id=$6
             WHERE student_id=$7 RETURNING *`,
            [name, date_of_birth, email, phone_number, admission_year, department_id, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/students/:id — Delete student (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM students WHERE student_id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
