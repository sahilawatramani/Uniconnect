const express = require('express');
const router = express.Router();
const db = require('../../config'); // PostgreSQL pool
const { requireAdmin } = require('../middleware/authMiddleware');

// Get all courses
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM courses');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching courses:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get a course by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM courses WHERE course_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching course:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a new course (admin only)
router.post('/', requireAdmin, async (req, res) => {
    const { course_id, course_name, credits, department_id, semester } = req.body;

    if (!course_id || !course_name || !credits || !department_id || !semester) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const result = await db.query(
            `INSERT INTO courses (course_id, course_name, credits, department_id, semester)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING course_id`,
            [course_id, course_name, credits, department_id, semester]
        );
        res.status(201).json({ message: 'Course created', courseId: result.rows[0].course_id });
    } catch (error) {
        console.error("Error creating course:", error.message);
        res.status(500).json({ error: "Failed to create course." });
    }
});

// Update a course (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { course_name, credits, department_id, semester } = req.body;

    if (!course_name || !credits || !department_id || !semester) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const result = await db.query(
            `UPDATE courses
             SET course_name = $1, credits = $2, department_id = $3, semester = $4
             WHERE course_id = $5`,
            [course_name, credits, department_id, semester, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course updated successfully' });
    } catch (error) {
        console.error("Error updating course:", error.message);
        res.status(500).json({ error: "Failed to update course." });
    }
});

// Delete a course (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM courses WHERE course_id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error("Error deleting course:", error.message);
        res.status(500).json({ error: "Failed to delete course." });
    }
});

module.exports = router;
