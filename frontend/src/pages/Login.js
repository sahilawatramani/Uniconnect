import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, ThunderboltOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import universityImg from '../University.jpg';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            message.warning('Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            message.success('Welcome back!');
            navigate('/');
        } catch (error) {
            message.error(error.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left - University Image */}
            <div className="auth-media" style={{ backgroundImage: `url(${universityImg})` }}>
                <div className="auth-media-overlay" />
                <div className="auth-media-content">
                    <h2>Academic Excellence, <br />Digital Precision.</h2>
                    <p>Welcome to UniConnect. Access your personalized Ivy League-inspired portal to manage records, track attendance, and leverage AI-powered insights.</p>
                </div>
            </div>

            {/* Right - Login Form */}
            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            U
                        </div>
                        <h1 className="auth-logo-text">UniConnect</h1>
                        <p className="auth-subtitle">Smart Campus Management</p>
                    </div>

                    <div className="auth-form">
                        <h2 className="auth-title">Welcome Back</h2>
                        <p className="auth-desc">Secure access to your academic workspace</p>

                        <div className="auth-field">
                            <label>Email</label>
                            <Input
                                prefix={<MailOutlined className="field-icon" />}
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                size="large"
                                className="auth-input"
                                id="login-email"
                            />
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
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                size="large"
                                className="auth-input"
                                id="login-password"
                            />
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            onClick={handleLogin}
                            loading={loading}
                            block
                            className="auth-submit-btn"
                            id="login-submit"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <div className="auth-footer">
                            <span>Don't have an account? </span>
                            <Link to="/register" className="auth-link">Create one</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
