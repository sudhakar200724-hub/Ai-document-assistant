import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List

from database.database import get_db
from schemas.models import ChatRequest, ChatResponse, CitationItem
from rag.vector_store import vector_store
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def ask_document(req: ChatRequest):
    # Verify document exists
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title FROM documents WHERE id = ?;", (req.document_id,))
        doc_row = cursor.fetchone()
        if not doc_row:
            raise HTTPException(status_code=404, detail="Document not found.")

    query = req.question
    if req.selected_text and req.selected_text.strip():
        query = f"{req.selected_text} - {req.question}"

    # Perform RAG vector similarity search
    retrieved_chunks = vector_store.search(req.document_id, query, top_k=4)

    # Fetch past conversation messages for session if any
    session_id = req.session_id or "default"
    history = []
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT role, content FROM chat_messages 
            WHERE document_id = ? AND session_id = ? 
            ORDER BY created_at ASC LIMIT 6;
        """, (req.document_id, session_id))
        history = [{"role": r["role"], "content": r["content"]} for r in cursor.fetchall()]

    # Generate answer with citations via LLM / grounded engine
    result = await llm_service.chat_rag(
        question=req.question,
        chunks=retrieved_chunks,
        language=req.language,
        history=history
    )

    answer_id = str(uuid.uuid4())
    user_msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    answer_text = result.get("answer", "")
    citations_data = result.get("citations", [])
    grounded = result.get("grounded", False)

    # Save user message and assistant answer to SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_messages (id, document_id, session_id, role, content, citations_json, language, created_at)
            VALUES (?, ?, ?, 'user', ?, '[]', ?, ?);
        """, (user_msg_id, req.document_id, session_id, req.question, req.language, now))

        cursor.execute("""
            INSERT INTO chat_messages (id, document_id, session_id, role, content, citations_json, language, created_at)
            VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?);
        """, (answer_id, req.document_id, session_id, answer_text, json.dumps(citations_data), req.language, now))

    citations_list = [
        CitationItem(
            page_number=c.get("page_number", 1),
            snippet=c.get("snippet", ""),
            relevance_score=c.get("relevance_score", 1.0)
        )
        for c in citations_data
    ]

    return ChatResponse(
        id=answer_id,
        role="assistant",
        answer=answer_text,
        citations=citations_list,
        grounded=grounded,
        language=req.language
    )


@router.get("/history/{doc_id}")
def get_chat_history(doc_id: str, session_id: str = "default"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, role, content, citations_json, language, created_at
            FROM chat_messages
            WHERE document_id = ? AND session_id = ?
            ORDER BY created_at ASC;
        """, (doc_id, session_id))
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "role": r["role"],
                "content": r["content"],
                "citations": json.loads(r["citations_json"] or "[]"),
                "language": r["language"],
                "created_at": r["created_at"]
            }
            for r in rows
        ]


@router.delete("/history/{doc_id}")
def clear_chat_history(doc_id: str, session_id: str = "default"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_messages WHERE document_id = ? AND session_id = ?;", (doc_id, session_id))
    return {"status": "success", "message": "Chat history cleared."}
