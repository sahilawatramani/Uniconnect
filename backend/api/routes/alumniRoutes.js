const express = require('express');
const router = express.Router();
const db = require('../../config');
const { requireAdmin } = require('../middleware/authMiddleware');

// Get all alumni
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM alumni');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching alumni:", error);
        res.status(500).json({ error: 'Error fetching alumni data' });
    }
});

// Get a single alumnus by ID
router.get('/:alumni_id', async (req, res) => {
    const { alumni_id } = req.params;
    try {
        const result = await db.query('SELECT * FROM alumni WHERE alumni_id = $1', [alumni_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Alumnus not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching alumnus:", error);
        res.status(500).json({ error: 'Error fetching alumnus data' });
    }
});

// Add a new alumnus (admin only)
router.post('/', requireAdmin, async (req, res) => {
    const { student_id, graduation_year, current_job_title, company } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO alumni (student_id, graduation_year, current_job_title, company)
             VALUES ($1, $2, $3, $4) RETURNING alumni_id`,
            [student_id, graduation_year, current_job_title, company]
        );

        res.status(201).json({
            alumni_id: result.rows[0].alumni_id,
            student_id,
            graduation_year,
            current_job_title,
            company
        });
    } catch (error) {
        console.error("Error adding alumnus:", error);
        res.status(500).json({ error: 'Error adding alumnus data' });
    }
});

// Update an alumnus (admin only)
router.put('/:alumni_id', requireAdmin, async (req, res) => {
    const { alumni_id } = req.params;
    const { student_id, graduation_year, current_job_title, company } = req.body;

    try {
        const result = await db.query(
            `UPDATE alumni
             SET student_id = $1, graduation_year = $2, current_job_title = $3, company = $4
             WHERE alumni_id = $5`,
            [student_id, graduation_year, current_job_title, company, alumni_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Alumnus not found' });
        }

        res.json({ message: 'Alumnus updated successfully' });
    } catch (error) {
        console.error("Error updating alumnus:", error);
        res.status(500).json({ error: 'Error updating alumnus data' });
    }
});

// Delete an alumnus (admin only)
router.delete('/:alumni_id', requireAdmin, async (req, res) => {
    const { alumni_id } = req.params;

    try {
        const result = await db.query('DELETE FROM alumni WHERE alumni_id = $1', [alumni_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Alumnus not found' });
        }

        res.json({ message: 'Alumnus deleted successfully' });
    } catch (error) {
        console.error("Error deleting alumnus:", error);
        res.status(500).json({ error: 'Error deleting alumnus data' });
    }
});

module.exports = router;
