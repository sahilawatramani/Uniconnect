const express = require('express');
const router = express.Router();
const db = require('../../config');
const { requireAdmin } = require('../middleware/authMiddleware');

// Get all departments
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM departments');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ error: 'Error fetching departments' });
    }
});

// Get a single department by ID
router.get('/:department_id', async (req, res) => {
    try {
        const { department_id } = req.params;
        const result = await db.query('SELECT * FROM departments WHERE department_id = $1', [department_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching department:", error);
        res.status(500).json({ error: 'Error fetching department' });
    }
});

// Add a new department (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { department_name, head_of_department } = req.body;
        const result = await db.query(
            'INSERT INTO departments (department_name, head_of_department) VALUES ($1, $2) RETURNING department_id',
            [department_name, head_of_department]
        );
        res.json({
            department_id: result.rows[0].department_id,
            department_name,
            head_of_department
        });
    } catch (error) {
        console.error("Error adding department:", error);
        res.status(500).json({ error: 'Error adding department' });
    }
});

// Update a department (admin only)
router.put('/:department_id', requireAdmin, async (req, res) => {
    try {
        const { department_id } = req.params;
        const { department_name, head_of_department } = req.body;

        const result = await db.query(
            'UPDATE departments SET department_name = $1, head_of_department = $2 WHERE department_id = $3',
            [department_name, head_of_department, department_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({ department_id, department_name, head_of_department });
    } catch (error) {
        console.error("Error updating department:", error);
        res.status(500).json({ error: 'Error updating department' });
    }
});

// Delete a department (admin only)
router.delete('/:department_id', requireAdmin, async (req, res) => {
    try {
        const { department_id } = req.params;
        const result = await db.query('DELETE FROM departments WHERE department_id = $1', [department_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error("Error deleting department:", error);
        res.status(500).json({ error: 'Error deleting department' });
    }
});

module.exports = router;
