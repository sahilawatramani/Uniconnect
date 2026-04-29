const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'uniconnect-secret-key-change-in-production';

/**
 * Authenticate — verify JWT from Authorization header.
 * Attaches req.user = { user_id, username, email, role, student_id }
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
};

/**
 * Require Admin — must be called AFTER authenticate.
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

/**
 * Optional Auth — attach user if token present, but don't block.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            // Token invalid — proceed without user
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

module.exports = { authenticate, requireAdmin, optionalAuth, JWT_SECRET };
