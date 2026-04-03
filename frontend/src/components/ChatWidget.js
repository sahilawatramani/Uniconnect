import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin, Typography } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, ExpandOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChatWidget.css';

const { Text } = Typography;
const API_URL = process.env.REACT_APP_API_URL;

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '👋 Quick question about your data? Ask me here!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const q = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: q }]);
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/ai/query`, { question: q });
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error. Try the full AI Chat for better results.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Chat Bubble */}
            <div
                className={`chat-widget-bubble ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <CloseOutlined /> : <MessageOutlined />}
            </div>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chat-widget-panel">
                    <div className="chat-widget-header">
                        <RobotOutlined style={{ fontSize: 20 }} />
                        <span>UniConnect AI</span>
                        <Button
                            type="text"
                            icon={<ExpandOutlined />}
                            onClick={() => { setIsOpen(false); navigate('/ai-chat'); }}
                            className="expand-btn"
                            title="Open full chat"
                        />
                    </div>

                    <div className="chat-widget-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`widget-msg ${msg.role}`}>
                                {msg.content.substring(0, 300)}
                                {msg.content.length > 300 && '...'}
                            </div>
                        ))}
                        {loading && (
                            <div className="widget-msg assistant">
                                <Spin size="small" /> <Text type="secondary">Thinking...</Text>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-widget-input">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleSend(); }}
                            placeholder="Quick question..."
                            disabled={loading}
                            size="small"
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleSend}
                            loading={loading}
                            size="small"
                            className="widget-send"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
