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
            cursor.execute("SELECT id, title, clean_text FROM documents WHERE id = ?;", (doc_id,))
            row = cursor.fetchone()
            if row:
                docs_data.append({
                    "id": row["id"],
                    "title": row["title"],
                    "text": row["clean_text"][:4000]
                })

    if len(docs_data) < 2:
        raise HTTPException(status_code=404, detail="Could not find sufficient documents to compare.")

    result = await llm_service.compare_documents(docs_data, req.language)

    return CompareResponse(
        comparison_matrix=result.get("comparison_matrix", []),
        similarities=result.get("similarities", []),
        differences=result.get("differences", []),
        unique_points=result.get("unique_points", {}),
        overall_synthesis=result.get("overall_synthesis", "")
    )
