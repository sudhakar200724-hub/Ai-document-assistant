from fastapi import APIRouter, HTTPException
from database.database import get_db
from schemas.models import ExplainRequest, ExplainResponse
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/explain", tags=["Explain"])


@router.post("", response_model=ExplainResponse)
async def explain_concept(req: ExplainRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT clean_text FROM documents WHERE id = ?;", (req.document_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found.")
        doc_text = row["clean_text"]

    result = await llm_service.explain_concept(
        concept=req.concept_or_text,
        document_text=doc_text,
        user_level=req.user_level,
        language=req.language
    )

    return ExplainResponse(
        concept=result.get("concept", req.concept_or_text),
        simple_explanation=result.get("simple_explanation", ""),
        real_world_example=result.get("real_world_example", ""),
        why_it_matters=result.get("why_it_matters", ""),
        difficult_concepts_breakdown=result.get("difficult_concepts_breakdown", []),
        source_pages=result.get("source_pages", [1]),
        language=req.language
    )
