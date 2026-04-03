import React from 'react';
import { Card, Row, Col, Button, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    UserOutlined,
    BookOutlined,
    ApartmentOutlined,
    FileTextOutlined,
    HomeOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    RobotOutlined,
    CommentOutlined,
    TrophyOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    const sections = [
        { title: 'Manage Students', path: '/students', icon: <UserOutlined className="card-icon" /> },
        { title: 'Manage Courses', path: '/courses', icon: <BookOutlined className="card-icon" /> },
        { title: 'Manage Departments', path: '/departments', icon: <ApartmentOutlined className="card-icon" /> },
        { title: 'Manage Enrollments', path: '/enrollments', icon: <FileTextOutlined className="card-icon" /> },
        { title: 'Manage Classrooms', path: '/classrooms', icon: <HomeOutlined className="card-icon" /> },
        { title: 'Manage Alumni', path: '/alumni', icon: <TeamOutlined className="card-icon" /> },
        { title: 'View Attendance', path: '/attendance', icon: <CheckCircleOutlined className="card-icon" /> },
    ];

    const aiSections = [
        {
            title: 'AI Assistant',
            path: '/ai-chat',
            icon: <CommentOutlined className="card-icon ai-icon" />,
            description: 'Query database using natural language'
        },
        {
            title: 'Learning Hub',
            path: '/ai-learn',
            icon: <RobotOutlined className="card-icon ai-icon" />,
            description: 'Upload materials & learn with AI'
        },
        {
            title: 'Take Quiz',
            path: '/ai-quiz',
            icon: <TrophyOutlined className="card-icon ai-icon" />,
            description: 'AI-generated quizzes on any topic'
        },
        {
            title: 'Smart Insights',
            path: '/ai-insights',
            icon: <BarChartOutlined className="card-icon ai-icon" />,
            description: 'AI-powered analytics & reports'
        },
    ];

    return (
        <div className="dashboard-container">
            {/* Header with Admin Info */}
            <div className="header">
                <div className="header-title">UniConnect</div>
                <div className="header-subtext">Empowering University Connections</div>
                <div className="user-info">Logged in as Admin</div>
            </div>

            {/* Navigation Bar */}
            <nav className="navbar">
                <a href="/">Home</a>
                <a href="https://home.dartmouth.edu/campus-life/residential-life" target="_blank" rel="noopener noreferrer">Campus Life</a>
                <a href="https://students.dartmouth.edu/ugar/" target="_blank" rel="noopener noreferrer">Research</a>
                <a href="https://home.dartmouth.edu/news" target="_blank" rel="noopener noreferrer">News & Events</a>
                <a href="https://home.dartmouth.edu/about/follow-us-social-media" target="_blank" rel="noopener noreferrer">Connect With Us</a>
            </nav>

            {/* Campus Banner */}
            <div className="campus-banner"></div>

            {/* Dashboard Title */}
            <h1 className="dashboard-title">UniConnect Dashboard</h1>

            {/* Management Cards Section */}
            <Row gutter={[16, 16]}>
                {sections.map((section, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                        <Card
                            title={
                                <div className="card-title-with-icon">
                                    {section.icon}
                                    <span>{section.title}</span>
                                </div>
                            }
                            bordered={false}
                            className="dashboard-card"
                            hoverable
                        >
                            <Button
                                type="primary"
                                onClick={() => navigate(section.path)}
                                block
                            >
                                Open {section.title}
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* AI Section Divider */}
            <Divider className="ai-divider">
                <span className="ai-divider-text">
                    <RobotOutlined /> AI-Powered Features
                </span>
            </Divider>

            {/* AI Cards Section */}
            <Row gutter={[16, 16]}>
                {aiSections.map((section, index) => (
                    <Col xs={24} sm={12} md={6} key={index}>
                        <Card
                            title={
                                <div className="card-title-with-icon">
                                    {section.icon}
                                    <span>{section.title}</span>
                                </div>
                            }
                            bordered={false}
                            className="dashboard-card ai-card"
                            hoverable
                        >
                            <p className="ai-card-desc">{section.description}</p>
                            <Button
                                type="primary"
                                onClick={() => navigate(section.path)}
                                block
                                className="ai-card-btn"
                            >
                                Open {section.title}
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Footer */}
            <div className="footer">
                &copy; 2024 UniConnect. All Rights Reserved.
            </div>
        </div>
    );
};

export default Home;
