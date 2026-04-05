"""
UniConnect AI Microservice
FastAPI server for AI features: NL-to-SQL, RAG, Quiz Generator, Smart Insights.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import OLLAMA_BASE_URL, OLLAMA_MODEL
# Trigger reload to load new .env variables
from routes.query import router as query_router
from routes.rag import router as rag_router
from routes.quiz import router as quiz_router
from routes.insights import router as insights_router

app = FastAPI(
    title="UniConnect AI Service",
    description="AI augmentation layer for UniConnect student management system",
    version="1.0.0"
)

# CORS — allow all origins (same approach as the Express backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount route modules
app.include_router(query_router, prefix="/ai", tags=["Database Query"])
app.include_router(rag_router, prefix="/ai", tags=["RAG Learning"])
app.include_router(quiz_router, prefix="/ai", tags=["Quiz Generator"])
app.include_router(insights_router, prefix="/ai", tags=["Smart Insights"])


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "UniConnect AI",
        "llm_provider": "ollama",
        "ollama_model": OLLAMA_MODEL,
        "ollama_base_url": OLLAMA_BASE_URL,
    }


@app.get("/")
async def root():
    return {
        "message": "UniConnect AI Service is running!",
        "docs": "/docs",
        "endpoints": [
            "POST /ai/query — Natural language database queries",
            "POST /ai/upload — Upload documents for RAG",
            "POST /ai/ask — Ask questions about uploaded documents",
            "GET  /ai/documents — List uploaded documents",
            "POST /ai/quiz — Generate quiz questions",
            "POST /ai/insights — Get smart insights"
        ]
    }
