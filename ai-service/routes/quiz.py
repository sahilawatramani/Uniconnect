"""
Feature 3 — Automated Quiz Generator
Generate MCQs from uploaded course material or a given topic.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
import re
import numpy as np
from config import get_gemini_response

router = APIRouter()


class QuizRequest(BaseModel):
    topic: str
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"  # easy, medium, hard


def parse_quiz_json(response_text: str) -> list:
    """Extract JSON array from Gemini response."""
    # Try to find JSON in code blocks
    json_match = re.search(r'```(?:json)?\s*(\[.*?\])```', response_text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))
    
    # Try to find raw JSON array
    json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    return []


def get_rag_context(topic: str) -> str:
    """Try to get relevant context from uploaded documents."""
    try:
        from routes.rag import faiss_index, text_chunks, embedding_model
        
        if faiss_index is None or len(text_chunks) == 0:
            return ""
        
        # Search for relevant chunks
        topic_embedding = embedding_model.encode([topic])
        topic_embedding = np.array(topic_embedding).astype('float32')
        
        k = min(3, len(text_chunks))
        distances, indices = faiss_index.search(topic_embedding, k)
        
        relevant_chunks = []
        for idx in indices[0]:
            if idx < len(text_chunks):
                relevant_chunks.append(text_chunks[idx])
        
        return "\n\n".join(relevant_chunks)
    except Exception:
        return ""


@router.post("/quiz")
async def generate_quiz(request: QuizRequest):
    """Generate MCQ quiz questions on a given topic."""
    try:
        # Try to get relevant context from uploaded documents
        context = get_rag_context(request.topic)
        
        context_section = ""
        if context:
            context_section = f"""
Use the following course material as the primary source for generating questions:

COURSE MATERIAL:
{context}
"""
        
        quiz_prompt = f"""You are an academic quiz generator for university students.
Generate exactly {request.num_questions} multiple-choice questions (MCQs) on the topic: "{request.topic}"

Difficulty level: {request.difficulty}
{context_section}

RULES:
- Each question must have exactly 4 options: A, B, C, D
- Exactly one option must be correct
- Include a brief explanation for the correct answer
- For "easy": basic recall and definitions
- For "medium": application and understanding
- For "hard": analysis, synthesis, and tricky edge cases
- Questions should be educational and clear

Return your response as a valid JSON array with this exact structure:
[
  {{
    "question": "What is ...?",
    "options": {{
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option"
    }},
    "correct_answer": "A",
    "explanation": "Brief explanation of why A is correct."
  }}
]

Return ONLY the JSON array, no other text."""

        response = get_gemini_response(quiz_prompt)
        questions = parse_quiz_json(response)
        
        if not questions:
            # Retry with simpler prompt
            simple_prompt = f"""Generate {request.num_questions} MCQ questions about "{request.topic}" at {request.difficulty} difficulty.
Return as JSON array: [{{"question":"...", "options":{{"A":"...","B":"...","C":"...","D":"..."}}, "correct_answer":"A", "explanation":"..."}}]
Only return the JSON array."""
            
            response = get_gemini_response(simple_prompt)
            questions = parse_quiz_json(response)
        
        if not questions:
            raise HTTPException(status_code=500, detail="Could not generate quiz questions. Please try again.")
        
        return {
            "topic": request.topic,
            "difficulty": request.difficulty,
            "num_questions": len(questions),
            "questions": questions,
            "has_context": bool(context)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")
