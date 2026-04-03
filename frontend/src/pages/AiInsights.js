import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Button, Tag, message } from 'antd';
import {
    ArrowLeftOutlined, TeamOutlined, BookOutlined, ApartmentOutlined,
    UserOutlined, BarChartOutlined, AlertOutlined, RiseOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AiInsights.css';

const { Paragraph, Text, Title } = Typography;

const API_URL = process.env.REACT_APP_API_URL;

const AiInsights = () => {
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState('');
    const [stats, setStats] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/ai/insights`, {});
            setInsights(response.data.insights || '');
            setStats(response.data.stats || {});
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    const formatInsights = (text) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('## ') || line.startsWith('### ')) {
                return <Title key={i} level={5} style={{ color: '#004643', marginTop: 16 }}>{line.replace(/^#+ /, '')}</Title>;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
                const content = line.substring(2);
                const hasWarning = content.toLowerCase().includes('low') || content.toLowerCase().includes('concern') || content.toLowerCase().includes('below');
                return (
                    <li key={i} className={`insight-item ${hasWarning ? 'warning' : ''}`}>
                        {hasWarning && <AlertOutlined style={{ color: '#faad14', marginRight: 4 }} />}
                        {content}
                    </li>
                );
            }
            if (line.match(/^\d+\./)) {
                return <li key={i} className="insight-item">{line.replace(/^\d+\.\s*/, '')}</li>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
                return <Text key={i} strong style={{ display: 'block', marginTop: 8 }}>{line.replace(/\*\*/g, '')}</Text>;
            }
            if (line.trim() === '') return <br key={i} />;
            return <Paragraph key={i} style={{ marginBottom: 6 }}>{line}</Paragraph>;
        });
    };

    const statCards = [
        { title: 'Total Students', value: stats.total_students, icon: <TeamOutlined />, color: '#004643' },
        { title: 'Total Courses', value: stats.total_courses, icon: <BookOutlined />, color: '#007f5f' },
        { title: 'Departments', value: stats.total_departments, icon: <ApartmentOutlined />, color: '#0a9396' },
        { title: 'Instructors', value: stats.total_instructors, icon: <UserOutlined />, color: '#94d2bd' },
        { title: 'Enrollments', value: stats.total_enrollments, icon: <BarChartOutlined />, color: '#ee9b00' },
        { title: 'Alumni', value: stats.total_alumni, icon: <RiseOutlined />, color: '#005f73' },
    ];

    if (loading) {
        return (
            <div className="ai-insights-container">
                <div className="ai-insights-header">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} type="text" className="back-btn">Dashboard</Button>
                    <div className="ai-insights-header-title">
                        <BarChartOutlined className="header-icon" />
                        <div>
                            <h2>Smart Insights</h2>
                            <span className="header-subtitle">AI-powered analytics</span>
                        </div>
                    </div>
                </div>
                <div className="insights-loading">
                    <Spin size="large" />
                    <Title level={4} style={{ color: '#004643', marginTop: 16 }}>Analyzing your data...</Title>
                    <Text type="secondary">AI is reviewing institutional statistics</Text>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-insights-container">
            {/* Header */}
            <div className="ai-insights-header">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} type="text" className="back-btn">Dashboard</Button>
                <div className="ai-insights-header-title">
                    <BarChartOutlined className="header-icon" />
                    <div>
                        <h2>Smart Insights</h2>
                        <span className="header-subtitle">AI-powered analytics & recommendations</span>
                    </div>
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchInsights} className="refresh-btn">Refresh</Button>
            </div>

            <div className="ai-insights-body">
                {/* Stats Grid */}
                <Row gutter={[16, 16]} className="stats-row">
                    {statCards.map((stat, i) => (
                        <Col xs={12} sm={8} md={4} key={i}>
                            <Card className="stat-card" bordered={false}>
                                <div className="stat-icon" style={{ background: stat.color }}>
                                    {stat.icon}
                                </div>
                                <Statistic
                                    title={stat.title}
                                    value={stat.value || 0}
                                    className="stat-value"
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Row gutter={[16, 16]}>
                    {/* AI Insights Panel */}
                    <Col xs={24} lg={16}>
                        <Card
                            className="insights-card"
                            title={<span>🤖 AI-Generated Insights</span>}
                            bordered={false}
                        >
                            <div className="insights-content">
                                {formatInsights(insights)}
                            </div>
                        </Card>
                    </Col>

                    {/* Side Stats */}
                    <Col xs={24} lg={8}>
                        {/* Top Courses */}
                        {stats.top_courses_by_enrollment && stats.top_courses_by_enrollment.length > 0 && (
                            <Card className="side-card" title="📚 Top Courses by Enrollment" bordered={false}>
                                {stats.top_courses_by_enrollment.map((course, i) => (
                                    <div key={i} className="course-row">
                                        <Text ellipsis style={{ flex: 1 }}>{course.course}</Text>
                                        <Tag color="blue">{course.enrollments}</Tag>
                                    </div>
                                ))}
                            </Card>
                        )}

                        {/* Attendance Summary */}
                        {stats.attendance_summary && stats.attendance_summary.length > 0 && (
                            <Card className="side-card" title="📊 Attendance Overview" bordered={false} style={{ marginTop: 16 }}>
                                {stats.attendance_summary.map((item, i) => (
                                    <div key={i} className="attendance-row">
                                        <Text>{item.status}</Text>
                                        <Tag color={
                                            item.status === 'Present' ? 'green' :
                                                item.status === 'Absent' ? 'red' : 'orange'
                                        }>{item.count}</Tag>
                                    </div>
                                ))}
                            </Card>
                        )}

                        {/* Low Attendance Students */}
                        {stats.low_attendance_students && stats.low_attendance_students.length > 0 && (
                            <Card className="side-card warning-card" title="⚠️ Low Attendance Students" bordered={false} style={{ marginTop: 16 }}>
                                {stats.low_attendance_students.map((student, i) => (
                                    <div key={i} className="student-row">
                                        <Text ellipsis style={{ flex: 1 }}>{student.name}</Text>
                                        <Tag color="red">{student.attendance_pct}%</Tag>
                                    </div>
                                ))}
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default AiInsights;
