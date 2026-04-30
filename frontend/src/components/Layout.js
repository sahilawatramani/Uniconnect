import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    UserOutlined, BookOutlined, ApartmentOutlined, FileTextOutlined, 
    HomeOutlined, TeamOutlined, CheckCircleOutlined, CommentOutlined,
    RobotOutlined, TrophyOutlined, BarChartOutlined, LogoutOutlined,
    DashboardOutlined
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import './Layout.css';

const Layout = ({ children }) => {
    const collapsed = false;
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAdmin, logout } = useAuth();

    const managementNav = [
        { title: 'Students', path: '/students', icon: <UserOutlined />, adminOnly: false },
        { title: 'Courses', path: '/courses', icon: <BookOutlined />, adminOnly: false },
        { title: 'Departments', path: '/departments', icon: <ApartmentOutlined />, adminOnly: false },
        { title: 'Enrollments', path: '/enrollments', icon: <FileTextOutlined />, adminOnly: false },
        { title: 'Classrooms', path: '/classrooms', icon: <HomeOutlined />, adminOnly: true },
        { title: 'Alumni', path: '/alumni', icon: <TeamOutlined />, adminOnly: true },
        { title: 'Attendance', path: '/attendance', icon: <CheckCircleOutlined />, adminOnly: false },
    ];

    const aiNav = [
        { title: 'AI Assistant', path: '/ai-chat', icon: <CommentOutlined /> },
        { title: 'Learning Hub', path: '/ai-learn', icon: <RobotOutlined /> },
        { title: 'Quiz Generator', path: '/ai-quiz', icon: <TrophyOutlined /> },
        { title: 'Smart Insights', path: '/ai-insights', icon: <BarChartOutlined /> },
    ];

    const filteredManagementNav = managementNav.filter(
        item => isAdmin || !item.adminOnly
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userInitials = (user?.username || 'UC')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.path;
        const content = (
            <div
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
            >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.title}</span>}
            </div>
        );

        return collapsed ? (
            <Tooltip title={item.title} placement="right">
                {content}
            </Tooltip>
        ) : content;
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-inner">
                    {/* Logo */}
                    <div className="sidebar-logo" onClick={() => navigate('/')}>
                        <div className="logo-mark">U</div>
                        {!collapsed && (
                            <div className="logo-name-container">
                                <span className="logo-name" style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>UniConnect</span>
                                <span className="logo-tagline" style={{ color: 'var(--accent-gold)' }}>Smart Campus</span>
                            </div>
                        )}
                    </div>

                    {/* Toggle */}
                    {/* Toggle removed to disable collapse functionality */}

                    {/* Nav Sections */}
                    <div className="nav-section">
                        {!collapsed && <div className="nav-section-title">Dashboard</div>}
                        <NavItem item={{ title: 'Overview', path: '/', icon: <DashboardOutlined /> }} />
                    </div>

                    <div className="nav-section">
                        {!collapsed && <div className="nav-section-title">Management</div>}
                        {filteredManagementNav.map(item => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </div>

                    <div className="nav-section">
                        {!collapsed && <div className="nav-section-title">AI Features</div>}
                        {aiNav.map(item => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </div>

                    {/* User Section */}
                    <div className="sidebar-user">
                        <div className="user-avatar">{userInitials}</div>
                        {!collapsed && (
                            <div className="user-details">
                                <span className="user-name">{user?.username || 'User'}</span>
                                <span className={`user-role ${user?.role || ''}`}>
                                    {user?.role === 'admin' ? 'Admin' : 'Student'}
                                </span>
                            </div>
                        )}
                        <Tooltip title="Logout" placement="right">
                            <div className="logout-btn" onClick={handleLogout}>
                                <LogoutOutlined />
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
