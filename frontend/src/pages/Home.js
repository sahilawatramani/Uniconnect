import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightOutlined, CommentOutlined, RobotOutlined,
    TrophyOutlined, BarChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const { user, authAxios } = useAuth();
    const [stats, setStats] = useState(null);
    const revealRefs = useRef([]);

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetchQuickStats();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        revealRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addToRevealRefs = (el) => {
        if (el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    };

    const fetchQuickStats = async () => {
        try {
            const response = await authAxios.get(`${API_URL}/api/stats`);
            setStats(response.data.stats);
        } catch (err) {}
    };

    const dashboardCards = [
        { title: 'Students', desc: 'Comprehensive student records and profile management.', path: '/students', category: 'Records', image: '/images/hero.png' },
        { title: 'Courses', desc: 'Interactive lecture schedules and detailed curriculum.', path: '/courses', category: 'Academics', image: '/images/classroom.png' },
        { title: 'Departments', desc: 'Academic schools, faculty listings, and resources.', path: '/departments', category: 'Schools', image: '/images/lounge.png' },
        { title: 'Enrollments', desc: 'Track and manage student course registrations.', path: '/enrollments', category: 'Registry', image: '/images/enrollments.png' },
        { title: 'Attendance', desc: 'Real-time tracking and participation analytics.', path: '/attendance', category: 'Analytics', image: '/images/attendance.png' },
        { title: 'Faculty', desc: 'Profiles and research directories for all departments.', path: '/faculty', category: 'Staff', image: '/images/faculty.png' },
    ];

    const aiTools = [
        { title: 'AI Assistant', desc: 'Conversational interface for campus data.', path: '/ai-chat', icon: <CommentOutlined /> },
        { title: 'Learning Hub', desc: 'AI-generated study flows and materials.', path: '/ai-learn', icon: <RobotOutlined /> },
        { title: 'Quiz Generator', desc: 'Adaptive practice sets for every course.', path: '/ai-quiz', icon: <TrophyOutlined /> },
        { title: 'Smart Insights', desc: 'Predictive analytics on academic trends.', path: '/ai-insights', icon: <BarChartOutlined /> },
    ];

    return (
        <div className="home-page">
            <div className="hero-modern-wrapper">
                <section className="hero-modern reveal" ref={addToRevealRefs}>
                    <div className="hero-copy">
                        <span className="hero-eyebrow">Academic Portal v2.4</span>
                        <h1 className="hero-heading">
                            Welcome back, <br />
                            <span className="text-highlight">{user?.username || 'James R. Harding'}</span>
                        </h1>
                        
                        {/* Quick Stats POV Row */}
                        <div className="hero-stats">
                            {user?.role === 'student' ? (
                                <>
                                    <div className="stat-item">
                                        <span className="stat-value">3.88</span>
                                        <span className="stat-label">Current GPA</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{stats?.attendance_percentage || '94'}%</span>
                                        <span className="stat-label">Attendance</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="stat-item">
                                        <span className="stat-value">{stats?.total_students || '12.4k'}</span>
                                        <span className="stat-label">Total Students</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{stats?.total_courses || '342'}</span>
                                        <span className="stat-label">Active Courses</span>
                                    </div>
                                </>
                            )}
                            <div className="stat-item">
                                <span className="stat-value">Ivy League</span>
                                <span className="stat-label">Status</span>
                            </div>
                        </div>

                        <p className="hero-description italic-subtext">
                            At UniConnect, we're building a culture in which community members engage in respectful discussion across differences and feel comfortable having their views challenged.
                        </p>
                        <div className="hero-actions">
                            <button className="premium-btn" onClick={() => navigate('/courses')}>
                                Learn More <ArrowRightOutlined />
                            </button>
                        </div>
                    </div>

                    <div className="hero-visual-circles">
                        <div className="circle-main">
                            <img src="/images/hero.png" alt="Campus Life" />
                        </div>
                        <div className="circle-sub circle-1">
                            <img src="/images/classroom.png" alt="Learning" />
                        </div>
                        <div className="circle-sub circle-2">
                            <img src="/images/lounge.png" alt="Community" />
                        </div>
                        <div className="circle-decorator"></div>
                    </div>
                </section>
            </div>

            <div className="marquee-premium">
                <div className="marquee-content">
                    {[1, 2, 3, 4].map(i => (
                        <span key={i}>
                            Enrollment Management • AI Insights • Campus Collaboration • Attendance Tracking • Smart Classrooms • 
                        </span>
                    ))}
                </div>
            </div>

            <section className="dashboard-bento reveal" ref={addToRevealRefs}>
                <div className="section-header">
                    <h2>Academic Resources</h2>
                    <p>Manage your records with precision.</p>
                </div>
                <div className="bento-grid">
                    {dashboardCards.map((card, idx) => (
                        <div key={idx} className="bento-card" onClick={() => navigate(card.path)}>
                            <div className="bento-image">
                                <img src={card.image} alt={card.title} />
                                <span className="bento-pill">{card.category}</span>
                            </div>
                            <div className="bento-body">
                                <h3>{card.title}</h3>
                                <p>{card.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="ai-universe reveal" ref={addToRevealRefs}>
                <div className="section-header centered">
                    <span className="hero-eyebrow">The Future</span>
                    <h2>AI-Powered Learning</h2>
                </div>
                <div className="ai-grid">
                    {aiTools.map((tool, idx) => (
                        <div key={idx} className="ai-tool-glass" onClick={() => navigate(tool.path)}>
                            <div className="ai-icon-box">{tool.icon}</div>
                            <h3>{tool.title}</h3>
                            <p>{tool.desc}</p>
                            <div className="ai-launch">Launch <ArrowRightOutlined /></div>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="home-footer">
                <div className="footer-logo">UniConnect</div>
                <p>&copy; 2024 Hanover-Inspired Academic Solutions.</p>
            </footer>
        </div>
    );
};

export default Home;
