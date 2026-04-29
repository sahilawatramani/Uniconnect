import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin, Typography, message } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './AiChat.css';

const { Text, Paragraph } = Typography;

const AiChat = () => {
    const { authAxios, isStudent, user } = useAuth();
    const API_URL = process.env.REACT_APP_API_URL;

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: isStudent
                ? `👋 Hi ${user?.username || ''}! I'm your **UniConnect AI Assistant**. Ask me questions about your academic data!\n\nTry:\n- "Show my attendance"\n- "What courses am I enrolled in?"\n- "What's my attendance percentage?"`
                : '👋 Hi! I\'m your **UniConnect AI Assistant**. Ask me anything about the database!\n\nTry:\n- "Show all students"\n- "Which course has the highest enrollment?"\n- "List students with attendance below 75%"',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || loading) return;

        const userMessage = { role: 'user', content: inputValue.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            const response = await authAxios.post(`${API_URL}/api/ai/query`, {
                question: userMessage.content
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.answer,
                sql: response.data.sql,
                data: response.data.data,
                totalRows: response.data.total_rows,
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ ${error.response?.data?.error || error.message}`,
                timestamp: new Date()
            }]);
            message.error('Failed to process query');
        } finally {
            setLoading(false);
        }
    };

    const formatContent = (content) => {
        return content.split('\n').map((line, i) => {
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i}>{line.substring(2)}</li>;
            if (line.match(/^\d+\./)) return <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>;
            if (line.startsWith('**') && line.endsWith('**'))
                return <Text key={i} strong style={{ display: 'block', color: 'inherit' }}>{line.replace(/\*\*/g, '')}</Text>;
            return <Paragraph key={i} style={{ marginBottom: 4, color: 'inherit' }}>{line}</Paragraph>;
        });
    };

    const suggestedQueries = isStudent
        ? ["Show my attendance", "My enrolled courses", "My grades", "My attendance percentage"]
        : ["Show all students", "Highest enrollment course?", "Departments with student count", "Low attendance students"];

    return (
        <div className="aichat-page">
            {/* Header */}
            <div className="aichat-header">
                <div className="aichat-header-icon"><DatabaseOutlined /></div>
                <div>
                    <h1>AI Database Assistant</h1>
                    <p>Query your database using natural language</p>
                </div>
            </div>

            {/* Messages */}
            <div className="aichat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`msg-row ${msg.role}`}>
                        <div className="msg-avatar">
                            {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        </div>
                        <div className="msg-content">
                            <div className={`msg-bubble ${msg.role}`}>
                                {formatContent(msg.content)}
                            </div>
                            <span className="msg-time">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="msg-row assistant">
                        <div className="msg-avatar"><RobotOutlined /></div>
                        <div className="msg-content">
                            <div className="msg-bubble assistant">
                                <Spin size="small" /> <Text style={{ color: 'var(--text-muted)' }}>Analyzing your query...</Text>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
                <div className="aichat-suggestions">
                    {suggestedQueries.map((query, i) => (
                        <button key={i} className="suggest-chip" onClick={() => setInputValue(query)}>
                            {query}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="aichat-input">
                <Input.TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask a question about your database..."
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    className="aichat-input-field"
                    disabled={loading}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={loading}
                    className="aichat-send-btn"
                    disabled={!inputValue.trim()}
                >
                    Send
                </Button>
            </div>
        </div>
    );
};

export default AiChat;
