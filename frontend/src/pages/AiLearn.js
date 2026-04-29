import React, { useState, useEffect } from 'react';
import { Input, Button, Spin, Typography, message, Empty, Popconfirm } from 'antd';
import { InboxOutlined, SendOutlined, FileTextOutlined, BookOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './AiLearn.css';

const { Text, Paragraph } = Typography;

const AiLearn = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const { authAxios } = useAuth();

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        // Clear stale documents on page mount, then fetch fresh list
        clearAndFetch();
    }, []);

    const clearAndFetch = async () => {
        try {
            await authAxios.delete(`${API_URL}/api/ai/documents`);
        } catch (e) { /* ignore */ }
        fetchDocuments();
    };

    const fetchDocuments = async () => {
        try {
            const response = await authAxios.get(`${API_URL}/api/ai/documents`);
            setDocuments(response.data.documents || []);
        } catch (error) {
            console.log('Could not fetch documents');
        }
    };

    const handleFileUpload = async (file) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            message.error('Only PDF files are supported.');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await authAxios.post(`${API_URL}/api/ai/upload`, formData, {
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

    const handleRemoveDoc = async (docName) => {
        try {
            await authAxios.delete(`${API_URL}/api/ai/documents/${encodeURIComponent(docName)}`);
            message.success(`"${docName}" removed.`);
            fetchDocuments();
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to remove document');
        }
    };

    const handleClearAll = async () => {
        try {
            await authAxios.delete(`${API_URL}/api/ai/documents`);
            message.success('All documents cleared.');
            setDocuments([]);
            setChatHistory([]);
        } catch (error) {
            message.error('Failed to clear documents');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    };

    const handleAsk = async () => {
        if (!question.trim() || asking) return;

        const q = question.trim();
        setQuestion('');
        setAsking(true);

        setChatHistory(prev => [...prev, { role: 'user', content: q }]);

        try {
            const response = await authAxios.post(`${API_URL}/api/ai/ask`, { question: q });
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
            if (line.startsWith('## ')) return <h3 key={i} className="ans-heading">{line.replace('## ', '')}</h3>;
            if (line.startsWith('# ')) return <h2 key={i} className="ans-heading">{line.replace('# ', '')}</h2>;
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i}>{line.substring(2)}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <Paragraph key={i} style={{ marginBottom: 4, color: 'var(--text-primary)' }}>{line}</Paragraph>;
        });
    };

    return (
        <div className="learn-page">
            <div className="learn-header">
                <div className="learn-header-icon"><BookOutlined /></div>
                <div>
                    <h1>AI Learning Hub</h1>
                    <p>Upload course materials & ask questions powered by RAG</p>
                </div>
            </div>

            <div className="learn-body">
                {/* Left Panel */}
                <div className="learn-sidebar">
                    {/* Upload Zone */}
                    <div className="panel-card">
                        <div className="panel-title">
                            <span>📤</span> Upload Documents
                        </div>
                        <div
                            className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => !uploading && document.getElementById('file-input').click()}
                        >
                            <input
                                type="file"
                                id="file-input"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            {uploading ? (
                                <div className="upload-status">
                                    <Spin size="large" />
                                    <p>Processing document...</p>
                                </div>
                            ) : (
                                <div className="upload-prompt">
                                    <InboxOutlined className="upload-icon" />
                                    <p className="upload-text">Click or drag PDF files here</p>
                                    <p className="upload-hint">Course notes, textbooks, or study material</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="panel-card">
                        <div className="panel-title" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📚</span> Documents ({documents.length})
                            </div>
                            {documents.length > 0 && (
                                <Popconfirm title="Clear all documents?" onConfirm={handleClearAll} okText="Yes" cancelText="No">
                                    <Button size="small" type="text" icon={<DeleteOutlined />} className="clear-all-btn">
                                        Clear All
                                    </Button>
                                </Popconfirm>
                            )}
                        </div>
                        <div className="docs-list">
                            {documents.length > 0 ? documents.map((doc, i) => (
                                <div key={i} className="doc-item">
                                    <FileTextOutlined className="doc-icon" />
                                    <Text ellipsis className="doc-name">{doc}</Text>
                                    <span className="doc-ready">Ready</span>
                                    <CloseCircleOutlined
                                        className="doc-remove"
                                        onClick={() => handleRemoveDoc(doc)}
                                        title="Remove document"
                                    />
                                </div>
                            )) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={<span style={{ color: 'var(--text-muted)' }}>No documents uploaded</span>}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel — Chat */}
                <div className="learn-chat">
                    <div className="panel-card chat-panel">
                        <div className="panel-title"><span>💬</span> Ask Questions</div>

                        <div className="chat-messages">
                            {chatHistory.length === 0 && (
                                <div className="chat-empty">
                                    <BookOutlined className="empty-icon" />
                                    <h3>Ask about your course materials</h3>
                                    <p>Upload a PDF first, then ask any question about its content.</p>
                                    <div className="suggestion-chips">
                                        <button onClick={() => setQuestion('Summarize the key concepts')}>Summarize key concepts</button>
                                        <button onClick={() => setQuestion('Explain the main topics')}>Explain main topics</button>
                                        <button onClick={() => setQuestion('What are the important definitions?')}>Important definitions</button>
                                    </div>
                                </div>
                            )}

                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`chat-msg ${msg.role}`}>
                                    <div className={`chat-bubble ${msg.role}`}>
                                        {msg.role === 'assistant' ? formatAnswer(msg.content) : msg.content}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="chat-sources">
                                                Sources: {msg.sources.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {asking && (
                                <div className="chat-msg assistant">
                                    <div className="chat-bubble assistant">
                                        <Spin size="small" /> <Text style={{ color: 'var(--text-muted)' }}>Searching course materials...</Text>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="chat-input-area">
                            <Input.TextArea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                                placeholder="Ask about your uploaded course materials..."
                                autoSize={{ minRows: 1, maxRows: 3 }}
                                className="chat-text-input"
                                disabled={asking}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleAsk}
                                loading={asking}
                                className="chat-send-btn"
                                disabled={!question.trim()}
                            >
                                Ask
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiLearn;
