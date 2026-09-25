import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List

from database.database import get_db
from schemas.models import SummaryRequest, SummaryResponse
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/summary", tags=["Summarize"])


@router.post("/generate", response_model=SummaryResponse)
async def generate_summary(req: SummaryRequest):
    target_lang = req.get_target_language()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title, clean_text, page_count FROM documents WHERE id = ?;", (req.document_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found.")

        doc_text = row["clean_text"]
        page_count = row["page_count"] or 1

        cursor.execute("SELECT DISTINCT page_number FROM document_chunks WHERE document_id = ? ORDER BY page_number ASC;", (req.document_id,))
        page_rows = cursor.fetchall()
        doc_pages = [r["page_number"] for r in page_rows] if page_rows else list(range(1, page_count + 1))

    word_count = req.word_count or 200

    print(f"[API SUMMARY] Request: document_id={req.document_id}, target_language='{target_lang}' (raw='{req.language}'), user_level='{req.user_level}', format='{req.format_style}'")

    try:
        result = await llm_service.generate_summary(
            document_text=doc_text,
            user_level=req.user_level,
            purpose=req.purpose,
            language=target_lang,
            word_count=word_count,
            format_style=req.format_style,
            time_limit=req.time_limit
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation error: {str(e)}")

    summary_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    key_points = result.get("key_points", [])
    important_concepts = result.get("important_concepts", [])
    source_pages = result.get("source_pages", doc_pages[:3] or [1])
    content = result.get("content", "")

    print(f"[API SUMMARY SUCCESS] Target: '{target_lang}', Output length: {len(content)}")

    # Save to SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO summaries (id, document_id, summary_type, user_level, purpose, language, word_count, format_style, content, key_points_json, concepts_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            summary_id,
            req.document_id,
            req.summary_type,
            req.user_level,
            req.purpose,
            target_lang,
            word_count,
            req.format_style,
            content,
            json.dumps(key_points),
            json.dumps(important_concepts),
            now
        ))

    return SummaryResponse(
        id=summary_id,
        document_id=req.document_id,
        summary_type=req.summary_type,
        content=content,
        key_points=key_points,
        important_concepts=important_concepts,
        source_pages=source_pages,
        word_count=len(content.split()),
        user_level=req.user_level,
        purpose=req.purpose,
        language=target_lang,
        created_at=now
    )


@router.get("/document/{doc_id}", response_model=List[SummaryResponse])
def get_summaries_for_document(doc_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, document_id, summary_type, user_level, purpose, language, word_count,
                   format_style, content, key_points_json, concepts_json, created_at
            FROM summaries
            WHERE document_id = ?
            ORDER BY created_at DESC;
        """, (doc_id,))
        rows = cursor.fetchall()
        results = []
        for r in rows:
            results.append(SummaryResponse(
                id=r["id"],
                document_id=r["document_id"],
                summary_type=r["summary_type"],
                content=r["content"],
                key_points=json.loads(r["key_points_json"] or "[]"),
                important_concepts=json.loads(r["concepts_json"] or "[]"),
                source_pages=[1],
                word_count=r["word_count"],
                user_level=r["user_level"],
                purpose=r["purpose"],
                language=r["language"],
                created_at=r["created_at"]
            ))
        return results
