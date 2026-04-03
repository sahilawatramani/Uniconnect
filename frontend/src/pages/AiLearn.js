import React, { useState, useEffect } from 'react';
import { Upload, Input, Button, Card, List, Spin, Typography, message, Tag, Empty } from 'antd';
import { InboxOutlined, SendOutlined, FileTextOutlined, BookOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AiLearn.css';

const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

const API_URL = process.env.REACT_APP_API_URL;

const AiLearn = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/ai/documents`);
            setDocuments(response.data.documents || []);
        } catch (error) {
            // Documents endpoint may not be available yet
            console.log('Could not fetch documents');
        }
    };

    const handleUpload = async (info) => {
        const { file } = info;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/api/ai/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000
            });
            message.success(response.data.message);
            fetchDocuments();
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleAsk = async () => {
        if (!question.trim() || asking) return;

        const q = question.trim();
        setQuestion('');
        setAsking(true);

        setChatHistory(prev => [...prev, { role: 'user', content: q }]);

        try {
            const response = await axios.post(`${API_URL}/api/ai/ask`, {
                question: q
            });

            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: response.data.answer,
                sources: response.data.sources
            }]);
        } catch (error) {
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: `❌ ${error.response?.data?.error || 'Failed to get answer. Make sure you have uploaded documents first.'}`
            }]);
        } finally {
            setAsking(false);
        }
    };

    const formatAnswer = (text) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
                return <h3 key={i} style={{ color: '#004643', marginTop: 12 }}>{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('# ')) {
                return <h2 key={i} style={{ color: '#004643', marginTop: 12 }}>{line.replace('# ', '')}</h2>;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={i} style={{ marginLeft: 16, marginBottom: 4 }}>{line.substring(2)}</li>;
            }
            if (line.trim() === '') return <br key={i} />;
            return <Paragraph key={i} style={{ marginBottom: 4 }}>{line}</Paragraph>;
        });
    };

    return (
        <div className="ai-learn-container">
            {/* Header */}
            <div className="ai-learn-header">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} type="text" className="back-btn">
                    Dashboard
                </Button>
                <div className="ai-learn-header-title">
                    <BookOutlined className="header-icon" />
                    <div>
                        <h2>AI Learning Hub</h2>
                        <span className="header-subtitle">Upload course materials & ask questions</span>
                    </div>
                </div>
            </div>

            <div className="ai-learn-body">
                {/* Left Panel — Upload & Documents */}
                <div className="ai-learn-sidebar">
                    <Card className="upload-card" title="📤 Upload Documents" bordered={false}>
                        <Dragger
                            name="file"
                            accept=".pdf"
                            showUploadList={false}
                            customRequest={handleUpload}
                            disabled={uploading}
                            className="upload-dragger"
                        >
                            {uploading ? (
                                <div>
                                    <Spin size="large" />
                                    <p style={{ marginTop: 12, color: '#888' }}>Processing document...</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined style={{ color: '#4ecdc4', fontSize: 48 }} />
                                    </p>
                                    <p className="ant-upload-text">Click or drag PDF files here</p>
                                    <p className="ant-upload-hint">Upload course notes, textbooks, or any educational material</p>
                                </div>
                            )}
                        </Dragger>
                    </Card>

                    <Card className="docs-card" title="📚 Uploaded Documents" bordered={false}>
                        {documents.length > 0 ? (
                            <List
                                size="small"
                                dataSource={documents}
                                renderItem={(doc) => (
                                    <List.Item>
                                        <FileTextOutlined style={{ color: '#007f5f', marginRight: 8 }} />
                                        <Text ellipsis style={{ flex: 1 }}>{doc}</Text>
                                        <Tag color="green">Ready</Tag>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No documents uploaded yet"
                            />
                        )}
                    </Card>
                </div>

                {/* Right Panel — Q&A */}
                <div className="ai-learn-chat">
                    <Card className="qa-card" title="💬 Ask Questions" bordered={false}>
                        <div className="qa-messages">
                            {chatHistory.length === 0 && (
                                <div className="qa-empty">
                                    <BookOutlined style={{ fontSize: 64, color: 'rgba(0, 70, 67, 0.2)' }} />
                                    <h3>Ask about your course materials</h3>
                                    <p>Upload a PDF first, then ask any question about its content.</p>
                                    <div className="qa-suggestions">
                                        <Button size="small" onClick={() => setQuestion("Summarize the key concepts")}>
                                            Summarize key concepts
                                        </Button>
                                        <Button size="small" onClick={() => setQuestion("Explain the main topics")}>
                                            Explain main topics
                                        </Button>
                                        <Button size="small" onClick={() => setQuestion("What are the important definitions?")}>
                                            Important definitions
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`qa-message ${msg.role}`}>
                                    <div className={`qa-bubble ${msg.role}`}>
                                        {msg.role === 'assistant' ? formatAnswer(msg.content) : msg.content}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="qa-sources">
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    Sources: {msg.sources.join(', ')}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {asking && (
                                <div className="qa-message assistant">
                                    <div className="qa-bubble assistant">
                                        <Spin size="small" /> <Text type="secondary">Searching course materials...</Text>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="qa-input">
                            <Input.TextArea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                                placeholder="Ask about your uploaded course materials..."
                                autoSize={{ minRows: 1, maxRows: 3 }}
                                className="qa-input-field"
                                disabled={asking}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleAsk}
                                loading={asking}
                                className="qa-send-btn"
                                disabled={!question.trim()}
                            >
                                Ask
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AiLearn;
