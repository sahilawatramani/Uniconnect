const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config');
const { JWT_SECRET, authenticate } = require('../middleware/authMiddleware');

const SALT_ROUNDS = 10;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'UNICONNECT2026';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role, student_id, admin_code } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }

        // Validate role
        const userRole = role || 'student';
        if (!['admin', 'student'].includes(userRole)) {
            return res.status(400).json({ error: 'Role must be either "admin" or "student".' });
        }

        // Admin registration requires a secret code
        if (userRole === 'admin') {
            if (!admin_code || admin_code !== ADMIN_SECRET) {
                return res.status(403).json({ error: 'Invalid admin authorization code. Contact your administrator.' });
            }
        }

        // If student role, student_id should be provided
        if (userRole === 'student' && !student_id) {
            return res.status(400).json({ error: 'Student role requires a student_id to link to.' });
        }

        // Check if student_id exists (if provided)
        if (student_id) {
            const studentCheck = await db.query('SELECT student_id FROM students WHERE student_id = $1', [student_id]);
            if (studentCheck.rows.length === 0) {
                return res.status(400).json({ error: `Student ID '${student_id}' not found in the database.` });
            }
        }

        // Check if username or email already exists
        const existingUser = await db.query(
            'SELECT user_id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Username or email already registered.' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert user
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, role, student_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, role, student_id, created_at`,
            [username, email, password_hash, userRole, student_id || null]
        );

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                student_id: user.student_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                student_id: user.student_id
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const result = await db.query(
            'SELECT user_id, username, email, password_hash, role, student_id FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                student_id: user.student_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                student_id: user.student_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// GET /api/auth/me — Get current user profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT user_id, username, email, role, student_id, created_at FROM users WHERE user_id = $1',
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile.' });
    }
});

// GET /api/auth/students — List all students (for registration dropdown)
router.get('/students', async (req, res) => {
    try {
        const result = await db.query('SELECT student_id, name FROM students ORDER BY name');
        res.json({ students: result.rows });
    } catch (error) {
        console.error('List students error:', error);
        res.status(500).json({ error: 'Failed to list students.' });
    }
});

module.exports = router;
