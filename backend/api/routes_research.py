from fastapi import APIRouter, HTTPException
from database.database import get_db
from schemas.models import ResearchAnalysisResponse
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/research", tags=["Research Mode"])


@router.get("/{doc_id}", response_model=ResearchAnalysisResponse)
async def analyze_research_paper(doc_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title, clean_text FROM documents WHERE id = ?;", (doc_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found.")
        doc_title = row["title"]
        doc_text = row["clean_text"]

    analysis = await llm_service.generate_research_analysis(doc_text, doc_title)

    return ResearchAnalysisResponse(
        document_id=doc_id,
        title=analysis.get("title", doc_title),
        authors=analysis.get("authors", ["Primary Investigator et al."]),
        abstract=analysis.get("abstract", ""),
        research_problem=analysis.get("research_problem", ""),
        methodology=analysis.get("methodology", ""),
        dataset=analysis.get("dataset", ""),
        results=analysis.get("results", ""),
        limitations=analysis.get("limitations", ""),
        conclusion=analysis.get("conclusion", ""),
        future_work=analysis.get("future_work", ""),
        key_contributions=analysis.get("key_contributions", [])
    )
