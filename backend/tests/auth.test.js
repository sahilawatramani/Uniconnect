/**
 * =============================================
 * UniConnect — Auth API Test Suite
 * Tests registration, login, validation, and edge cases
 * =============================================
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// --- Mock the database module BEFORE requiring routes ---
const mockQuery = jest.fn();
jest.mock('../config', () => ({
    query: mockQuery
}));

const { JWT_SECRET } = require('../api/middleware/authMiddleware');
const authRoutes = require('../api/routes/authRoutes');

// Build a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Helper: generate a valid JWT for a test user
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
    mockQuery.mockReset();
});

// =============================================
// 1. REGISTRATION — Happy Path
// =============================================
describe('POST /api/auth/register', () => {
    const validPayload = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@1234',
        role: 'student',
        student_id: 'STU001'
    };

    test('✅ should register a new student successfully', async () => {
        // Mock: student exists
        mockQuery.mockResolvedValueOnce({ rows: [{ student_id: 'STU001' }] });
        // Mock: no existing user
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // Mock: insert user
        mockQuery.mockResolvedValueOnce({
            rows: [{
                user_id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'student',
                student_id: 'STU001',
                created_at: new Date()
            }]
        });

        const res = await request(app)
            .post('/api/auth/register')
            .send(validPayload);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.role).toBe('student');
        expect(res.body.user.username).toBe('testuser');
    });

    test('✅ should register an admin with valid admin_code', async () => {
        // Mock: no existing user
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // Mock: insert user
        mockQuery.mockResolvedValueOnce({
            rows: [{
                user_id: 2,
                username: 'adminuser',
                email: 'admin@example.com',
                role: 'admin',
                student_id: null,
                created_at: new Date()
            }]
        });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'adminuser',
                email: 'admin@example.com',
                password: 'Admin@1234',
                role: 'admin',
                admin_code: 'UNICONNECT2026'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.user.role).toBe('admin');
    });

    // =============================================
    // 2. REGISTRATION — Validation Edge Cases
    // =============================================
    test('❌ should reject missing username', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@example.com', password: 'Test@1234' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    test('❌ should reject missing email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', password: 'Test@1234' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    test('❌ should reject missing password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'test@example.com' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    test('❌ should reject empty string fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: '', email: '', password: '' });

        expect(res.statusCode).toBe(400);
    });

    // =============================================
    // 3. EMAIL VALIDATION — Edge Cases
    // =============================================
    test('❌ should reject email without @ symbol', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, email: 'bademail.com' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });

    test('❌ should reject email without domain', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, email: 'user@' });

        expect(res.statusCode).toBe(400);
    });

    test('❌ should reject email with spaces', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, email: 'user @example.com' });

        expect(res.statusCode).toBe(400);
    });

    test('❌ should reject email without TLD', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, email: 'user@domain' });

        expect(res.statusCode).toBe(400);
    });

    // =============================================
    // 4. PASSWORD VALIDATION — Edge Cases
    // =============================================
    test('❌ should reject password shorter than 8 characters', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, password: 'Ab1@' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/password/i);
    });

    test('❌ should reject password without uppercase letter', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, password: 'test@1234' });

        expect(res.statusCode).toBe(400);
    });

    test('❌ should reject password without lowercase letter', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, password: 'TEST@1234' });

        expect(res.statusCode).toBe(400);
    });

    test('❌ should reject password without number', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, password: 'Test@abcd' });

        expect(res.statusCode).toBe(400);
    });

    test('❌ should reject password without special character', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, password: 'Test12345' });

        expect(res.statusCode).toBe(400);
    });

    test('✅ should accept a strong password', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ student_id: 'STU001' }] });
        mockQuery.mockResolvedValueOnce({ rows: [] });
        mockQuery.mockResolvedValueOnce({
            rows: [{ user_id: 1, username: 'testuser', email: 'test@example.com', role: 'student', student_id: 'STU001', created_at: new Date() }]
        });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, password: 'C0mpl3x@Pass!' });

        expect(res.statusCode).toBe(201);
    });

    // =============================================
    // 5. ROLE VALIDATION — Edge Cases
    // =============================================
    test('❌ should reject invalid role', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, role: 'superadmin' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/role/i);
    });

    test('❌ should reject admin registration without admin_code', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, role: 'admin', admin_code: '' });

        expect(res.statusCode).toBe(403);
    });

    test('❌ should reject admin registration with wrong admin_code', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, role: 'admin', admin_code: 'WRONGCODE' });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/invalid admin/i);
    });

    test('❌ should reject student registration without student_id', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, student_id: undefined });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/student_id/i);
    });

    test('❌ should reject if student_id does not exist in database', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] }); // student not found

        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validPayload, student_id: 'INVALID999' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/not found/i);
    });

    // =============================================
    // 6. DUPLICATE USER — Edge Cases
    // =============================================
    test('❌ should reject duplicate username or email', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ student_id: 'STU001' }] });
        mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); // user exists

        const res = await request(app)
            .post('/api/auth/register')
            .send(validPayload);

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/already registered/i);
    });
});

// =============================================
// 7. LOGIN — Happy Path & Edge Cases
// =============================================
describe('POST /api/auth/login', () => {
    test('❌ should reject missing email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'Test@1234' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    test('❌ should reject missing password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com' });

        expect(res.statusCode).toBe(400);
    });

    test('❌ should reject non-existent email', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'Test@1234' });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid/i);
    });

    test('❌ should reject empty string credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: '', password: '' });

        expect(res.statusCode).toBe(400);
    });
});

// =============================================
// 8. JWT TOKEN — Validation
// =============================================
describe('JWT Token Verification', () => {
    test('✅ generated token should have correct claims', () => {
        const payload = { user_id: 1, username: 'test', email: 'test@test.com', role: 'student', student_id: 'STU001' };
        const token = generateToken(payload);
        const decoded = jwt.verify(token, JWT_SECRET);

        expect(decoded.user_id).toBe(1);
        expect(decoded.role).toBe('student');
        expect(decoded.student_id).toBe('STU001');
        expect(decoded).toHaveProperty('exp');
        expect(decoded).toHaveProperty('iat');
    });

    test('❌ should fail to verify a tampered token', () => {
        const token = generateToken({ user_id: 1 });
        const tampered = token.slice(0, -5) + 'XXXXX';

        expect(() => jwt.verify(tampered, JWT_SECRET)).toThrow();
    });

    test('❌ should fail to verify a token signed with wrong secret', () => {
        const token = jwt.sign({ user_id: 1 }, 'wrong-secret', { expiresIn: '1h' });

        expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
    });
});

// =============================================
// 9. GET /api/auth/students — List Students
// =============================================
describe('GET /api/auth/students', () => {
    test('✅ should return list of students', async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [
                { student_id: 'STU001', name: 'Aarav Patel' },
                { student_id: 'STU002', name: 'Priya Sharma' }
            ]
        });

        const res = await request(app).get('/api/auth/students');

        expect(res.statusCode).toBe(200);
        expect(res.body.students).toHaveLength(2);
        expect(res.body.students[0]).toHaveProperty('student_id');
        expect(res.body.students[0]).toHaveProperty('name');
    });

    test('✅ should return empty array when no students', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/auth/students');

        expect(res.statusCode).toBe(200);
        expect(res.body.students).toHaveLength(0);
    });
});
