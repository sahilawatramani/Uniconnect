import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Spin, Typography, message } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, DatabaseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AiChat.css';

const { Text, Paragraph } = Typography;

const API_URL = process.env.REACT_APP_API_URL;

const AiChat = () => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hi! I\'m your **UniConnect AI Assistant**. Ask me anything about your database!\n\nTry questions like:\n- "Show all students"\n- "Which course has the highest enrollment?"\n- "List students with attendance below 75%"\n- "How many departments are there?"',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/ai/query`, {
                question: userMessage.content
            });

            const assistantMessage = {
                role: 'assistant',
                content: response.data.answer,
                sql: response.data.sql,
                data: response.data.data,
                totalRows: response.data.total_rows,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = {
                role: 'assistant',
                content: `❌ Sorry, I encountered an error: ${error.response?.data?.error || error.message}. Please try rephrasing your question.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            message.error('Failed to process query');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };



    const formatContent = (content) => {
        // Simple markdown-like formatting
        return content.split('\n').map((line, i) => {
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={i}>{line.substring(2)}</li>;
            }
            if (line.match(/^\d+\./)) {
                return <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
                return <Text key={i} strong style={{ display: 'block' }}>{line.replace(/\*\*/g, '')}</Text>;
            }
            return <Paragraph key={i} style={{ marginBottom: 4 }}>{line}</Paragraph>;
        });
    };

    const suggestedQueries = [
        "Show all students",
        "Which course has highest enrollment?",
        "List departments with student count",
        "Students with attendance below 75%"
    ];

    return (
        <div className="ai-chat-container">
            {/* Header */}
            <div className="ai-chat-header">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                    className="back-btn"
                    type="text"
                >
                    Dashboard
                </Button>
                <div className="ai-chat-header-title">
                    <DatabaseOutlined className="header-icon" />
                    <div>
                        <h2>AI Database Assistant</h2>
                        <span className="header-subtitle">Query your database using natural language</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="ai-chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <div className="message-avatar">
                            {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        </div>
                        <div className="message-content">
                            <Card
                                className={`message-card ${msg.role}`}
                                bordered={false}
                                size="small"
                            >
                                <div className="message-text">
                                    {formatContent(msg.content)}
                                </div>

                                {/* Data Table was removed to only show answer */}
                            </Card>
                            <Text className="message-time" type="secondary">
                                {msg.timestamp.toLocaleTimeString()}
                            </Text>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="chat-message assistant">
                        <div className="message-avatar"><RobotOutlined /></div>
                        <div className="message-content">
                            <Card className="message-card assistant" bordered={false} size="small">
                                <Spin size="small" /> <Text type="secondary">Analyzing your query...</Text>
                            </Card>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            {messages.length <= 1 && (
                <div className="suggested-queries">
                    {suggestedQueries.map((query, i) => (
                        <Button
                            key={i}
                            className="suggested-btn"
                            onClick={() => {
                                setInputValue(query);
                            }}
                        >
                            {query}
                        </Button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="ai-chat-input">
                <Input.TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about your database..."
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    className="chat-input-field"
                    disabled={loading}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={loading}
                    className="send-btn"
                    disabled={!inputValue.trim()}
                >
                    Send
                </Button>
            </div>
        </div>
    );
};

export default AiChat;
