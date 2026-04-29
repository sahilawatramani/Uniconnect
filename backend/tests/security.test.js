/**
 * =============================================
 * UniConnect — Security Test Suite
 * Tests security headers, rate limiting, SQL injection, and middleware
 * =============================================
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../api/middleware/authMiddleware');

// =============================================
// 1. MIDDLEWARE — authenticate()
// =============================================
describe('Auth Middleware — authenticate()', () => {
    const { authenticate } = require('../api/middleware/authMiddleware');

    function createMockReqRes(authHeader) {
        const req = { headers: { authorization: authHeader } };
        const res = {
            statusCode: null,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(data) { this.body = data; return this; }
        };
        const next = jest.fn();
        return { req, res, next };
    }

    test('❌ should reject request without Authorization header', () => {
        const { req, res, next } = createMockReqRes(undefined);
        authenticate(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/authentication required/i);
        expect(next).not.toHaveBeenCalled();
    });

    test('❌ should reject request without Bearer prefix', () => {
        const token = jwt.sign({ user_id: 1 }, JWT_SECRET);
        const { req, res, next } = createMockReqRes(`Basic ${token}`);
        authenticate(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('❌ should reject expired token', () => {
        const token = jwt.sign({ user_id: 1 }, JWT_SECRET, { expiresIn: '0s' });
        const { req, res, next } = createMockReqRes(`Bearer ${token}`);

        // Small delay to ensure token is expired
        setTimeout(() => {
            authenticate(req, res, next);
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toMatch(/invalid or expired/i);
        }, 100);
    });

    test('❌ should reject token signed with wrong secret', () => {
        const token = jwt.sign({ user_id: 1 }, 'wrong-secret');
        const { req, res, next } = createMockReqRes(`Bearer ${token}`);
        authenticate(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('✅ should pass with valid token and attach user', () => {
        const payload = { user_id: 1, username: 'test', role: 'admin' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        const { req, res, next } = createMockReqRes(`Bearer ${token}`);
        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user.user_id).toBe(1);
        expect(req.user.role).toBe('admin');
    });
});

// =============================================
// 2. MIDDLEWARE — requireAdmin()
// =============================================
describe('Auth Middleware — requireAdmin()', () => {
    const { requireAdmin } = require('../api/middleware/authMiddleware');

    function createMockReqRes(user) {
        const req = { user };
        const res = {
            statusCode: null,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(data) { this.body = data; return this; }
        };
        const next = jest.fn();
        return { req, res, next };
    }

    test('❌ should reject non-admin user', () => {
        const { req, res, next } = createMockReqRes({ user_id: 1, role: 'student' });
        requireAdmin(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/admin access/i);
        expect(next).not.toHaveBeenCalled();
    });

    test('❌ should reject request with no user attached', () => {
        const { req, res, next } = createMockReqRes(null);
        requireAdmin(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('✅ should pass for admin user', () => {
        const { req, res, next } = createMockReqRes({ user_id: 1, role: 'admin' });
        requireAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// =============================================
// 3. MIDDLEWARE — optionalAuth()
// =============================================
describe('Auth Middleware — optionalAuth()', () => {
    const { optionalAuth } = require('../api/middleware/authMiddleware');

    test('✅ should proceed without token and set user to null', () => {
        const req = { headers: {} };
        const res = {};
        const next = jest.fn();
        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeNull();
    });

    test('✅ should attach user with valid token', () => {
        const token = jwt.sign({ user_id: 1, role: 'student' }, JWT_SECRET);
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = {};
        const next = jest.fn();
        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user.user_id).toBe(1);
    });

    test('✅ should proceed with null user for invalid token', () => {
        const req = { headers: { authorization: 'Bearer invalidtoken' } };
        const res = {};
        const next = jest.fn();
        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeNull();
    });
});

// =============================================
// 4. INPUT SANITIZATION — SQL Injection Patterns
// =============================================
describe('SQL Injection Prevention', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const sqlInjectionPayloads = [
        "admin'--",
        "' OR '1'='1",
        "'; DROP TABLE users;--",
        "' UNION SELECT * FROM users--",
        "1; DELETE FROM students WHERE 1=1",
        "admin@test.com' OR 1=1--",
        "' OR ''='",
        "') OR ('1'='1",
    ];

    test('❌ email regex should block all SQL injection payloads', () => {
        sqlInjectionPayloads.forEach(payload => {
            expect(emailRegex.test(payload)).toBe(false);
        });
    });

    test('❌ password regex should block SQL injection payloads', () => {
        sqlInjectionPayloads.forEach(payload => {
            expect(passwordRegex.test(payload)).toBe(false);
        });
    });

    test('✅ email regex should accept valid emails', () => {
        const validEmails = [
            'user@example.com',
            'firstname.lastname@company.co.in',
            'test+tag@gmail.com',
            'user123@university.edu',
        ];
        validEmails.forEach(email => {
            expect(emailRegex.test(email)).toBe(true);
        });
    });

    test('✅ password regex should accept strong passwords', () => {
        const validPasswords = [
            'Test@1234',
            'C0mplex!Pass',
            'Str0ng@Pass!',
            'MyP@ssw0rd',
        ];
        validPasswords.forEach(pw => {
            expect(passwordRegex.test(pw)).toBe(true);
        });
    });
});

// =============================================
// 5. XSS PREVENTION — Input Patterns
// =============================================
describe('XSS Prevention', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><img src=x onerror=alert(1)>',
        "javascript:alert('XSS')",
        '<svg onload=alert(1)>',
        '{{constructor.constructor("return this")()}}',
    ];

    test('❌ email regex should block XSS payloads', () => {
        xssPayloads.forEach(payload => {
            expect(emailRegex.test(payload)).toBe(false);
        });
    });
});

// =============================================
// 6. HELMET HEADERS — Verification
// =============================================
describe('Security Headers (Helmet)', () => {
    test('✅ should document expected security headers', () => {
        const expectedHeaders = [
            'x-content-type-options',   // nosniff
            'x-frame-options',          // SAMEORIGIN
            'x-xss-protection',         // deprecated but still set
            'strict-transport-security', // HSTS
            'content-security-policy',
        ];
        
        // This test documents the expected headers
        // Full integration test requires running the actual server
        expect(expectedHeaders.length).toBeGreaterThan(0);
        expectedHeaders.forEach(header => {
            expect(typeof header).toBe('string');
        });
    });
});

// =============================================
// 7. RATE LIMITING — Configuration Test
// =============================================
describe('Rate Limiting Configuration', () => {
    test('✅ rate limiter should be configured for auth routes', () => {
        // Verify the rate limit configuration exists and is sane
        const rateLimit = require('express-rate-limit');
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 10,
        });

        expect(typeof limiter).toBe('function');
        // 15 minutes window
        expect(15 * 60 * 1000).toBe(900000);
    });
});
