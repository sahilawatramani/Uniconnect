import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spin } from 'antd';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Main Pages
import Home from './pages/Home';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Departments from './pages/Departments';
import Enrollments from './pages/Enrollments';
import Classrooms from './pages/Classrooms';
import Alumni from './pages/Alumni';
import Attendance from './pages/Attendance';

// AI Pages
import AiChat from './pages/AiChat';
import AiLearn from './pages/AiLearn';
import AiQuiz from './pages/AiQuiz';
import AiInsights from './pages/AiInsights';

// Components
import Layout from './components/Layout';
import ChatWidget from './components/ChatWidget';

// Protected Route Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#0F172A'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Layout>{children}</Layout>;
};

// Public Route (redirect to home if already logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#0F172A'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
            <Route path="/enrollments" element={<ProtectedRoute><Enrollments /></ProtectedRoute>} />
            <Route path="/classrooms" element={<ProtectedRoute adminOnly><Classrooms /></ProtectedRoute>} />
            <Route path="/alumni" element={<ProtectedRoute adminOnly><Alumni /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

            {/* AI Routes */}
            <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
            <Route path="/ai-learn" element={<ProtectedRoute><AiLearn /></ProtectedRoute>} />
            <Route path="/ai-quiz" element={<ProtectedRoute><AiQuiz /></ProtectedRoute>} />
            <Route path="/ai-insights" element={<ProtectedRoute><AiInsights /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
                <ChatWidget />
            </AuthProvider>
        </Router>
    );
}

export default App;
