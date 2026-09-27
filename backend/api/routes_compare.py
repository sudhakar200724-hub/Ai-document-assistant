from fastapi import APIRouter, HTTPException
from typing import List
from database.database import get_db
from schemas.models import CompareRequest, CompareResponse
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/compare", tags=["Document Comparison"])


@router.post("", response_model=CompareResponse)
async def compare_documents(req: CompareRequest):
    if len(req.document_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 documents must be selected for comparison.")

    docs_data = []
    with get_db() as conn:
        cursor = conn.cursor()
        for doc_id in req.document_ids:
            cursor.execute("SELECT id, title, raw_text, clean_text FROM documents WHERE id = ?;", (doc_id,))
            row = cursor.fetchone()
            if row:
                text = (row["clean_text"] or row["raw_text"] or "").strip()
                docs_data.append({
                    "id": row["id"],
                    "title": row["title"],
                    "text": text[:20000]
                })

    if len(docs_data) < 2:
        raise HTTPException(status_code=404, detail="Could not find sufficient documents to compare.")

    for d in docs_data:
        if not d.get("text") or len(d["text"].strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Unable to compare because readable content could not be extracted from one of the selected documents."
            )

    result = await llm_service.compare_documents(docs_data, req.language)

    doc1_title = docs_data[0]["title"] if len(docs_data) > 0 else "Document 1"
    doc2_title = docs_data[1]["title"] if len(docs_data) > 1 else "Document 2"

    return CompareResponse(
        comparison_matrix=result.get("comparison_matrix", []),
        similarities=result.get("similarities", []),
        differences=result.get("differences", []),
        unique_points=result.get("unique_points", {}),
        overall_synthesis=result.get("overall_synthesis", ""),
        doc1_title=result.get("doc1_title") or doc1_title,
        doc2_title=result.get("doc2_title") or doc2_title
    )
