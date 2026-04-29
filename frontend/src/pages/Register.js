import React, { useState, useEffect } from 'react';
import { Input, Button, Select, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, ThunderboltOutlined, EyeOutlined, EyeInvisibleOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import universityImg from '../University.jpg';
import './Login.css'; // Shared auth styles

const { Option } = Select;
const API_URL = process.env.REACT_APP_API_URL;

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [studentId, setStudentId] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [adminCode, setAdminCode] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();
    const { register } = useAuth();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/auth/students`);
            setStudents(response.data.students || []);
        } catch (error) {
            console.log('Could not fetch students');
        }
    };

    const handleRegister = async () => {
        if (!username.trim() || !email.trim() || !password.trim()) {
            message.warning('Please fill in all required fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            message.warning('Please enter a valid email address.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            message.warning('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
            return;
        }

        if (role === 'student' && !studentId) {
            message.warning('Please select your student ID.');
            return;
        }

        if (role === 'admin' && !adminCode.trim()) {
            message.warning('Admin authorization code is required.');
            return;
        }

        setLoading(true);
        try {
            await register({
                username: username.trim(),
                email: email.trim(),
                password,
                role,
                student_id: role === 'student' ? studentId : null,
                admin_code: role === 'admin' ? adminCode.trim() : undefined
            });
            message.success('Account created successfully!');
            navigate('/');
        } catch (error) {
            message.error(error.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-media" style={{ backgroundImage: `url(${universityImg})` }}>
                <div className="auth-media-overlay" />
                <div className="auth-media-content animate-slide-in-left">
                    <h2>Join Symbiosis Institute</h2>
                    <p>Create an account to connect with the campus, view your courses, and access AI-driven educational insights.</p>
                </div>
            </div>

            <div className="auth-content">
                <div className="auth-card animate-fade-in-up">
                    {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <ThunderboltOutlined />
                    </div>
                    <h1 className="auth-logo-text">UniConnect</h1>
                    <p className="auth-subtitle">Smart Campus Management</p>
                </div>

                {/* Form */}
                <div className="auth-form">
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-desc">Register to get started</p>

                    {/* Role Selector */}
                    <div className="role-selector">
                        <div
                            className={`role-option ${role === 'admin' ? 'selected' : ''}`}
                            onClick={() => setRole('admin')}
                            id="role-admin"
                        >
                            <span className="role-icon">⚡</span>
                            <span className="role-name">Admin</span>
                            <span className="role-desc">Full access</span>
                        </div>
                        <div
                            className={`role-option ${role === 'student' ? 'selected' : ''}`}
                            onClick={() => setRole('student')}
                            id="role-student"
                        >
                            <span className="role-icon">🎓</span>
                            <span className="role-name">Student</span>
                            <span className="role-desc">Personal view</span>
                        </div>
                    </div>

                    {role === 'admin' && (
                        <div className="auth-field">
                            <label>Admin Authorization Code</label>
                            <Input
                                prefix={<SafetyOutlined className="field-icon" />}
                                type="password"
                                placeholder="Enter admin secret code"
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                size="large"
                                className="auth-input"
                                id="register-admin-code"
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label>Username</label>
                        <Input
                            prefix={<UserOutlined className="field-icon" />}
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            size="large"
                            className="auth-input"
                            id="register-username"
                        />
                    </div>

                    <div className="auth-field">
                        <label>Email</label>
                        <Input
                            prefix={<MailOutlined className="field-icon" />}
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError('');
                            }}
                            onBlur={() => {
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                if (email && !emailRegex.test(email.trim())) {
                                    setEmailError('Please enter a valid email address.');
                                }
                            }}
                            status={emailError ? 'error' : ''}
                            size="large"
                            className="auth-input"
                            id="register-email"
                        />
                        {emailError && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{emailError}</div>}
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <Input
                            prefix={<LockOutlined className="field-icon" />}
                            suffix={
                                <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </span>
                            }
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (passwordError) setPasswordError('');
                            }}
                            onBlur={() => {
                                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                                if (password && !passwordRegex.test(password)) {
                                    setPasswordError('Must be at least 8 chars, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
                                }
                            }}
                            status={passwordError ? 'error' : ''}
                            size="large"
                            className="auth-input"
                            id="register-password"
                        />
                        {passwordError && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', lineHeight: '1.2' }}>{passwordError}</div>}
                    </div>

                    {role === 'student' && (
                        <div className="student-select">
                            <label>Link Student ID</label>
                            <Select
                                placeholder="Select your student ID"
                                value={studentId || undefined}
                                onChange={setStudentId}
                                size="large"
                                style={{ width: '100%' }}
                                showSearch
                                optionFilterProp="children"
                                id="register-student-id"
                            >
                                {students.map(s => (
                                    <Option key={s.student_id} value={s.student_id}>
                                        {s.student_id} — {s.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    )}

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleRegister}
                        loading={loading}
                        block
                        className="auth-submit-btn"
                        id="register-submit"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>

                    <div className="auth-footer">
                        <span>Already have an account? </span>
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
