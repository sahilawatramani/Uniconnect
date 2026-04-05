"""
Feature 2 — Academic Learning Assistant (RAG-based)
Upload PDFs, chunk & embed them, then answer questions using retrieved context.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import json
import numpy as np
import faiss
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from config import get_gemini_response

router = APIRouter()

# Initialize embedding model (lightweight, fast)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Storage paths
VECTOR_STORE_DIR = os.path.join(os.path.dirname(__file__), '..', 'vector_store')
FAISS_INDEX_PATH = os.path.join(VECTOR_STORE_DIR, 'index.faiss')
CHUNKS_PATH = os.path.join(VECTOR_STORE_DIR, 'chunks.json')

# In-memory stores
faiss_index = None
text_chunks = []
document_names = []


class AskRequest(BaseModel):
    question: str


def ensure_vector_store_dir():
    """Create vector store directory if it doesn't exist."""
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)


def load_existing_index():
    """Load existing FAISS index and chunks from disk."""
    global faiss_index, text_chunks, document_names
    
    if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(CHUNKS_PATH):
        faiss_index = faiss.read_index(FAISS_INDEX_PATH)
        with open(CHUNKS_PATH, 'r', encoding='utf-8') as f:
            stored = json.load(f)
            text_chunks = stored.get('chunks', [])
            document_names = stored.get('documents', [])


def save_index():
    """Save FAISS index and chunks to disk."""
    ensure_vector_store_dir()
    if faiss_index is not None:
        faiss.write_index(faiss_index, FAISS_INDEX_PATH)
        with open(CHUNKS_PATH, 'w', encoding='utf-8') as f:
            json.dump({'chunks': text_chunks, 'documents': document_names}, f)


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 30) -> list:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


# Load existing index on startup
load_existing_index()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF, extract text, chunk it, embed it, and store in FAISS."""
    global faiss_index, text_chunks, document_names
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        # Read PDF
        reader = PdfReader(file.file)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
        
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
        
        # Chunk the text
        new_chunks = chunk_text(full_text)
        
        if not new_chunks:
            raise HTTPException(status_code=400, detail="No meaningful text found in the PDF.")
        
        # Generate embeddings
        embeddings = embedding_model.encode(new_chunks, show_progress_bar=False)
        embeddings = np.array(embeddings).astype('float32')
        
        # Initialize or add to FAISS index
        if faiss_index is None:
            dimension = embeddings.shape[1]
            faiss_index = faiss.IndexFlatL2(dimension)
        
        faiss_index.add(embeddings)
        text_chunks.extend(new_chunks)
        document_names.extend([file.filename] * len(new_chunks))
        
        # Save to disk
        save_index()
        
        return {
            "message": f"Document '{file.filename}' uploaded successfully!",
            "chunks_created": len(new_chunks),
            "total_chunks": len(text_chunks),
            "total_documents": len(set(document_names))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@router.post("/ask")
async def ask_question(request: AskRequest):
    """Answer a question using RAG — retrieve relevant chunks and generate answer."""
    global faiss_index, text_chunks
    
    if faiss_index is None or len(text_chunks) == 0:
        raise HTTPException(
            status_code=400, 
            detail="No documents uploaded yet. Please upload course materials first."
        )
    
    try:
        # Convert question to embedding
        question_embedding = embedding_model.encode([request.question])
        question_embedding = np.array(question_embedding).astype('float32')
        
        # Search FAISS for top-k relevant chunks (reduced to 3 to prevent LLM OOM/Timeout on local machines)
        k = min(3, len(text_chunks))
        distances, indices = faiss_index.search(question_embedding, k)
        
        # Gather relevant context
        relevant_chunks = []
        sources = []
        for idx in indices[0]:
            if idx < len(text_chunks):
                relevant_chunks.append(text_chunks[idx])
                if idx < len(document_names):
                    sources.append(document_names[idx])
        
        context = "\n\n---\n\n".join(relevant_chunks)
        
        # Generate answer using Gemini with retrieved context
        rag_prompt = f"""You are an academic learning assistant for university students. 
Answer the following question based ONLY on the provided course material context.

COURSE MATERIAL CONTEXT:
{context}

STUDENT QUESTION: {request.question}

IMPORTANT:
- Base your answer ONLY on the provided context
- If the context doesn't contain enough information, say so clearly
- Explain concepts in a clear, student-friendly way
- Use examples when helpful
- Structure your answer with headings and bullet points when appropriate

ANSWER:"""
        
        answer = get_gemini_response(rag_prompt)
        
        return {
            "answer": answer,
            "sources": list(set(sources)),
            "chunks_used": len(relevant_chunks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")


@router.get("/documents")
async def list_documents():
    """List all uploaded documents."""
    unique_docs = list(set(document_names))
    return {
        "documents": unique_docs,
        "total_chunks": len(text_chunks),
        "total_documents": len(unique_docs)
    }
