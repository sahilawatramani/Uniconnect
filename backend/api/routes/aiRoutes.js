const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

// AI Service URL — change this to your deployed Render URL for production
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Multer setup for file uploads (in-memory storage)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// POST /api/ai/query — Natural language database query
router.post('/query', async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/ai/query`, req.body, {
            timeout: 120000
        });
        res.json(response.data);
    } catch (error) {
        console.error('AI Query Error:', error.response?.data || error.message);
        const msg = error.code === 'ECONNABORTED'
            ? 'AI query timed out. Ollama may still be loading the model — try again in a moment.'
            : (error.response?.data?.detail || 'Failed to process AI query');
        res.status(error.response?.status || 500).json({ error: msg });
    }
});

// POST /api/ai/upload — Upload PDF for RAG
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post(`${AI_SERVICE_URL}/ai/upload`, formData, {
            headers: formData.getHeaders(),
            timeout: 180000
        });
        res.json(response.data);
    } catch (error) {
        console.error('AI Upload Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Failed to upload document'
        });
    }
});

// POST /api/ai/ask — Ask question about uploaded documents
router.post('/ask', async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/ai/ask`, req.body, {
            timeout: 300000
        });
        res.json(response.data);
    } catch (error) {
        console.error('AI Ask Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Failed to get answer'
        });
    }
});

// GET /api/ai/documents — List uploaded documents
router.get('/documents', async (req, res) => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/ai/documents`, {
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('AI Documents Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Failed to list documents'
        });
    }
});

// POST /api/ai/quiz — Generate quiz questions
router.post('/quiz', async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/ai/quiz`, req.body, {
            timeout: 120000
        });
        res.json(response.data);
    } catch (error) {
        console.error('AI Quiz Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Failed to generate quiz'
        });
    }
});

// POST /api/ai/insights — Get smart insights
router.post('/insights', async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/ai/insights`, req.body, {
            timeout: 120000
        });
        res.json(response.data);
    } catch (error) {
        console.error('AI Insights Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.detail || 'Failed to generate insights'
        });
    }
});

module.exports = router;
