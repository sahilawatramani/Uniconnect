import React, { useState } from 'react';
import { Input, Button, Card, Radio, Select, InputNumber, Typography, Tag, Spin, Progress, message } from 'antd';
import { TrophyOutlined, ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AiQuiz.css';

const { Text, Title } = Typography;
const { Option } = Select;

const API_URL = process.env.REACT_APP_API_URL;

const AiQuiz = () => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [numQuestions, setNumQuestions] = useState(5);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const navigate = useNavigate();

    const handleGenerate = async () => {
        if (!topic.trim()) {
            message.warning('Please enter a topic');
            return;
        }

        setLoading(true);
        setQuestions([]);
        setAnswers({});
        setSubmitted(false);
        setScore(null);

        try {
            const response = await axios.post(`${API_URL}/api/ai/quiz`, {
                topic: topic.trim(),
                difficulty,
                num_questions: numQuestions
            });

            setQuestions(response.data.questions || []);
            if (response.data.questions?.length === 0) {
                message.warning('No questions were generated. Try a different topic.');
            }
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to generate quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionIndex, value) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            message.warning('Please answer all questions before submitting');
            return;
        }

        let correct = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.correct_answer) {
                correct++;
            }
        });

        setScore({ correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) });
        setSubmitted(true);
    };

    const handleRetry = () => {
        setAnswers({});
        setSubmitted(false);
        setScore(null);
    };

    const handleNewQuiz = () => {
        setQuestions([]);
        setAnswers({});
        setSubmitted(false);
        setScore(null);
        setTopic('');
    };

    const getScoreColor = (pct) => {
        if (pct >= 80) return '#52c41a';
        if (pct >= 60) return '#faad14';
        return '#f5222d';
    };

    return (
        <div className="ai-quiz-container">
            {/* Header */}
            <div className="ai-quiz-header">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} type="text" className="back-btn">
                    Dashboard
                </Button>
                <div className="ai-quiz-header-title">
                    <TrophyOutlined className="header-icon" />
                    <div>
                        <h2>AI Quiz Generator</h2>
                        <span className="header-subtitle">Test your knowledge with AI-generated questions</span>
                    </div>
                </div>
            </div>

            <div className="ai-quiz-body">
                {/* Quiz Setup */}
                {questions.length === 0 && !loading && (
                    <Card className="quiz-setup-card" bordered={false}>
                        <div className="quiz-setup">
                            <TrophyOutlined style={{ fontSize: 64, color: '#4ecdc4' }} />
                            <Title level={3} style={{ color: '#004643', marginTop: 16 }}>Generate a Quiz</Title>
                            <Text type="secondary">Enter a topic and customize your quiz settings</Text>

                            <div className="quiz-form">
                                <div className="form-row">
                                    <label>Topic</label>
                                    <Input
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Database Normalization, Data Structures, Machine Learning"
                                        size="large"
                                        onKeyPress={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                                    />
                                </div>

                                <div className="form-row-inline">
                                    <div className="form-row">
                                        <label>Difficulty</label>
                                        <Select value={difficulty} onChange={setDifficulty} size="large" style={{ width: '100%' }}>
                                            <Option value="easy">🟢 Easy</Option>
                                            <Option value="medium">🟡 Medium</Option>
                                            <Option value="hard">🔴 Hard</Option>
                                        </Select>
                                    </div>
                                    <div className="form-row">
                                        <label>Number of Questions</label>
                                        <InputNumber
                                            min={3}
                                            max={15}
                                            value={numQuestions}
                                            onChange={setNumQuestions}
                                            size="large"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleGenerate}
                                    className="generate-btn"
                                    block
                                >
                                    🚀 Generate Quiz
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Loading */}
                {loading && (
                    <Card className="quiz-loading-card" bordered={false}>
                        <div className="quiz-loading">
                            <Spin size="large" />
                            <Title level={4} style={{ color: '#004643', marginTop: 16 }}>Generating your quiz...</Title>
                            <Text type="secondary">AI is crafting {numQuestions} questions on "{topic}"</Text>
                        </div>
                    </Card>
                )}

                {/* Score Result */}
                {submitted && score && (
                    <Card className="score-card" bordered={false}>
                        <div className="score-display">
                            <Progress
                                type="circle"
                                percent={score.percentage}
                                width={120}
                                strokeColor={getScoreColor(score.percentage)}
                                format={() => (
                                    <div>
                                        <div style={{ fontSize: 28, fontWeight: 700, color: getScoreColor(score.percentage) }}>
                                            {score.correct}/{score.total}
                                        </div>
                                    </div>
                                )}
                            />
                            <Title level={3} style={{ marginTop: 16, color: '#004643' }}>
                                {score.percentage >= 80 ? '🎉 Excellent!' :
                                    score.percentage >= 60 ? '👍 Good job!' :
                                        '📚 Keep practicing!'}
                            </Title>
                            <Text type="secondary">You scored {score.percentage}% on {topic}</Text>
                            <div className="score-actions" style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                <Button icon={<ReloadOutlined />} onClick={handleRetry}>Retry</Button>
                                <Button type="primary" onClick={handleNewQuiz}>New Quiz</Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Questions */}
                {questions.length > 0 && (
                    <div className="quiz-questions">
                        {questions.map((q, index) => (
                            <Card
                                key={index}
                                className={`question-card ${submitted ? (answers[index] === q.correct_answer ? 'correct' : 'incorrect') : ''}`}
                                bordered={false}
                            >
                                <div className="question-header">
                                    <Tag color={difficulty === 'easy' ? 'green' : difficulty === 'medium' ? 'orange' : 'red'}>
                                        Q{index + 1}
                                    </Tag>
                                    {submitted && (
                                        answers[index] === q.correct_answer ?
                                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} /> :
                                            <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 20 }} />
                                    )}
                                </div>
                                <Text strong className="question-text">{q.question}</Text>

                                <Radio.Group
                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                    value={answers[index]}
                                    disabled={submitted}
                                    className="options-group"
                                >
                                    {q.options && Object.entries(q.options).map(([key, value]) => (
                                        <Radio
                                            key={key}
                                            value={key}
                                            className={`option-radio ${submitted ? (key === q.correct_answer ? 'correct-option' : (answers[index] === key ? 'wrong-option' : '')) : ''}`}
                                        >
                                            <span className="option-key">{key}.</span> {value}
                                        </Radio>
                                    ))}
                                </Radio.Group>

                                {submitted && q.explanation && (
                                    <div className="explanation">
                                        <Text type="secondary">
                                            <strong>Explanation:</strong> {q.explanation}
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        ))}

                        {!submitted && (
                            <div className="quiz-submit">
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleSubmit}
                                    className="submit-btn"
                                    disabled={Object.keys(answers).length < questions.length}
                                >
                                    ✅ Submit Quiz ({Object.keys(answers).length}/{questions.length} answered)
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiQuiz;
