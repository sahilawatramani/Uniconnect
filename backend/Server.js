const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authenticate, optionalAuth } = require('./api/middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS config
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Auth routes (no authentication required)
const authRoutes = require('./api/routes/authRoutes');
app.use('/api/auth', authLimiter, authRoutes);

// Apply authentication middleware to all routes below
app.use(authenticate);

// Routes (all protected by authentication)
const studentRoutes = require('./api/routes/studentRoutes');
const courseRoutes = require('./api/routes/CourseRoutes');
const departmentRoutes = require('./api/routes/DepartmentRoutes');
const enrollmentRoutes = require('./api/routes/enrollmentRoutes');
const classroomRoutes = require('./api/routes/classroomRoutes');
const alumniRoutes = require('./api/routes/alumniRoutes');
const attendanceRoutes = require('./api/routes/attendanceRoutes');
const aiRoutes = require('./api/routes/aiRoutes');
const statsRoutes = require('./api/routes/statsRoutes');

app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
