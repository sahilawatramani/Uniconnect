import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    UserOutlined, BookOutlined, ApartmentOutlined, FileTextOutlined,
    HomeOutlined, TeamOutlined, CheckCircleOutlined,
    CommentOutlined, RobotOutlined, TrophyOutlined, BarChartOutlined,
    ArrowRightOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const { user, isAdmin, authAxios } = useAuth();
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetchQuickStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchQuickStats = async () => {
        try {
            const response = await authAxios.get(`${API_URL}/api/stats`);
            setStats(response.data.stats);
        } catch (err) {
            // Stats are non-critical — silently fail
        } finally {
            setLoadingStats(false);
        }
    };

    const managementCards = [
        { title: 'Students', desc: isAdmin ? 'Manage all student records' : 'View your profile', path: '/students', icon: <UserOutlined />, color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)' },
        { title: 'Courses', desc: 'Browse available courses', path: '/courses', icon: <BookOutlined />, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
        { title: 'Departments', desc: 'University departments', path: '/departments', icon: <ApartmentOutlined />, color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
        { title: 'Enrollments', desc: isAdmin ? 'All enrollment records' : 'Your enrolled courses', path: '/enrollments', icon: <FileTextOutlined />, color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
        ...(isAdmin ? [
            { title: 'Classrooms', desc: 'Manage room allocation', path: '/classrooms', icon: <HomeOutlined />, color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)' },
            { title: 'Alumni', desc: 'Alumni directory', path: '/alumni', icon: <TeamOutlined />, color: '#14B8A6', gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)' },
        ] : []),
        { title: 'Attendance', desc: isAdmin ? 'Track all attendance' : 'Your attendance records', path: '/attendance', icon: <CheckCircleOutlined />, color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
    ];

    const aiCards = [
        { title: 'AI Assistant', desc: 'Query your database using natural language', path: '/ai-chat', icon: <CommentOutlined />, color: '#06B6D4' },
        { title: 'Learning Hub', desc: 'Upload materials & learn with AI', path: '/ai-learn', icon: <RobotOutlined />, color: '#8B5CF6' },
        { title: 'Quiz Generator', desc: 'AI-generated quizzes on any topic', path: '/ai-quiz', icon: <TrophyOutlined />, color: '#F59E0B' },
        { title: 'Smart Insights', desc: 'AI-powered analytics & reports', path: '/ai-insights', icon: <BarChartOutlined />, color: '#10B981' },
    ];

    const quickStats = isAdmin ? [
        { label: 'Students', value: stats?.total_students || '—', color: '#06B6D4' },
        { label: 'Courses', value: stats?.total_courses || '—', color: '#8B5CF6' },
        { label: 'Departments', value: stats?.total_departments || '—', color: '#10B981' },
        { label: 'Enrollments', value: stats?.total_enrollments || '—', color: '#F59E0B' },
    ] : [
        { label: 'My Courses', value: stats?.total_enrollments || stats?.my_courses?.length || '—', color: '#06B6D4' },
        { label: 'Attendance', value: stats?.attendance_percentage ? `${stats.attendance_percentage}%` : '—', color: '#10B981' },
        { label: 'Total Classes', value: stats?.total_classes || '—', color: '#8B5CF6' },
    ];

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content animate-fade-in-up">
                    <div className="hero-greeting">
                        <span className="greeting-wave">👋</span>
                        <span>Welcome back,</span>
                    </div>
                    <h1 className="hero-name">{user?.username || 'User'}</h1>
                    <p className="hero-desc">
                        {isAdmin
                            ? 'Manage your institution with AI-powered insights and tools.'
                            : 'Access your academic dashboard, courses, and AI learning tools.'}
                    </p>
                    <div className="hero-badge">
                        <ThunderboltOutlined />
                        <span>{isAdmin ? 'Administrator' : 'Student'}</span>
                    </div>
                </div>
                <div className="hero-glow" />
            </div>

            {/* Quick Stats */}
            <div className="stats-strip animate-fade-in-up delay-1">
                {loadingStats ? (
                    <div className="stats-loading"><Spin size="small" /> Loading stats...</div>
                ) : (
                    quickStats.map((stat, i) => (
                        <div className="stat-pill" key={i}>
                            <span className="stat-pill-value" style={{ color: stat.color }}>
                                {stat.value}
                            </span>
                            <span className="stat-pill-label">{stat.label}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Management Section */}
            <div className="section">
                <div className="section-header animate-fade-in-up delay-2">
                    <h2 className="section-title">
                        <span className="title-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>📊</span>
                        {isAdmin ? 'Management' : 'My Dashboard'}
                    </h2>
                </div>
                <Row gutter={[16, 16]}>
                    {managementCards.map((card, i) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={i}>
                            <div
                                className={`dash-card animate-fade-in-up delay-${Math.min(i + 2, 6)}`}
                                onClick={() => navigate(card.path)}
                                id={`card-${card.title.toLowerCase().replace(/\s/g, '-')}`}
                            >
                                <div className="dash-card-icon" style={{ background: card.gradient }}>
                                    {card.icon}
                                </div>
                                <div className="dash-card-info">
                                    <h3>{card.title}</h3>
                                    <p>{card.desc}</p>
                                </div>
                                <ArrowRightOutlined className="dash-card-arrow" />
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* AI Section */}
            <div className="section">
                <div className="section-header animate-fade-in-up delay-3">
                    <h2 className="section-title">
                        <span className="title-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>🤖</span>
                        AI-Powered Features
                    </h2>
                </div>
                <Row gutter={[16, 16]}>
                    {aiCards.map((card, i) => (
                        <Col xs={24} sm={12} md={6} key={i}>
                            <div
                                className={`ai-feature-card animate-fade-in-up delay-${Math.min(i + 3, 6)}`}
                                onClick={() => navigate(card.path)}
                                id={`ai-card-${card.title.toLowerCase().replace(/\s/g, '-')}`}
                            >
                                <div className="ai-card-glow" style={{ background: `radial-gradient(circle at center, ${card.color}20, transparent 70%)` }} />
                                <div className="ai-card-icon" style={{ color: card.color }}>
                                    {card.icon}
                                </div>
                                <h3>{card.title}</h3>
                                <p>{card.desc}</p>
                                <div className="ai-card-action" style={{ color: card.color }}>
                                    Explore <ArrowRightOutlined />
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};

export default Home;
