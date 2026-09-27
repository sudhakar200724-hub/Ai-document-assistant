from fastapi import APIRouter, HTTPException
from database.database import get_db
from schemas.models import ExplainRequest, ExplainResponse
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/explain", tags=["Explain"])


@router.post("", response_model=ExplainResponse)
async def explain_concept(req: ExplainRequest):
    doc_id = (req.document_id or "").strip()
    if not doc_id:
        raise HTTPException(status_code=400, detail="Document ID is required.")

    query = req.get_query()
    if not query:
        raise HTTPException(status_code=400, detail="Please provide a concept or question to explain.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, filename, clean_text, page_count FROM documents WHERE id = ?;", (doc_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Selected document was not found.")
        doc_text = (row["clean_text"] or "").strip()
        retrieved_id = row["id"]

        # Fetch page numbers for source reference
        cursor.execute("SELECT DISTINCT page_number FROM document_chunks WHERE document_id = ? ORDER BY page_number ASC;", (doc_id,))
        chunk_pages = [r["page_number"] for r in cursor.fetchall()]

    if not doc_text:
        raise HTTPException(status_code=400, detail="This document does not contain readable text.")

    depth = req.get_depth()
    lang = req.language or "English"
    is_real_doc = not doc_id.startswith("sample-")

    # Logging as required in Section 4:
    print(f"[EXPLAIN] document_id = {doc_id}")
    print(f"[EXPLAIN] question = {query}")
    print(f"[EXPLAIN] language = {lang}")
    print(f"[EXPLAIN] retrieved_text_length = {len(doc_text)}")
    print(f"[EXPLAIN] retrieved_document_id = {retrieved_id}")

    result = await llm_service.explain_concept(
        concept=query,
        document_text=doc_text,
        user_level=depth,
        language=lang,
        is_real_doc=is_real_doc
    )

    source_pages = result.get("source_pages", chunk_pages[:2] or [1])
    if not source_pages:
        source_pages = [1]

    return ExplainResponse(
        concept=result.get("concept", query),
        simple_explanation=result.get("simple_explanation", ""),
        real_world_example=result.get("real_world_example", ""),
        why_it_matters=result.get("why_it_matters", ""),
        difficult_concepts_breakdown=result.get("difficult_concepts_breakdown", []),
        source_pages=source_pages,
        language=lang
    )
