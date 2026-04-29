
const express = require('express');
const router = express.Router();
const db = require('../../config'); // PostgreSQL Pool from config.js
const { requireAdmin } = require('../middleware/authMiddleware');

// Get all classrooms
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM classrooms');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching classrooms:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get a classroom by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM classrooms WHERE classroom_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching classroom by ID:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a new classroom (admin only)
router.post('/', requireAdmin, async (req, res) => {
    const { classroom_id, building, room_number, capacity } = req.body;

    try {
        // Check for duplicate classroom_id
        const existing = await db.query('SELECT * FROM classrooms WHERE classroom_id = $1', [classroom_id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Classroom ID already exists' });
        }

        await db.query(
            'INSERT INTO classrooms (classroom_id, building, room_number, capacity) VALUES ($1, $2, $3, $4)',
            [classroom_id, building, room_number, capacity]
        );

        res.status(201).json({ message: 'Classroom created', classroomId: classroom_id });
    } catch (error) {
        console.error("Error creating classroom:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Update a classroom (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { building, room_number, capacity } = req.body;

    try {
        const result = await db.query(
            'UPDATE classrooms SET building = $1, room_number = $2, capacity = $3 WHERE classroom_id = $4',
            [building, room_number, capacity, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        res.json({ message: 'Classroom updated' });
    } catch (error) {
        console.error("Error updating classroom:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Delete a classroom (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM classrooms WHERE classroom_id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        res.json({ message: 'Classroom deleted' });
    } catch (error) {
        console.error("Error deleting classroom:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
