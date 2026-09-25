from fastapi import APIRouter, HTTPException
from database.database import get_db
from schemas.models import ConceptMapResponse, ConceptNode, ConceptEdge
from ai.demo_service import DemoIntelligenceService

router = APIRouter(prefix="/api/concept-map", tags=["Concept Map"])


@router.get("/{doc_id}", response_model=ConceptMapResponse)
def get_concept_map(doc_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title, clean_text FROM documents WHERE id = ?;", (doc_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found.")
        title = row["title"]
        text = row["clean_text"]

    data = DemoIntelligenceService.generate_concept_map(text, title)

    nodes = [
        ConceptNode(
            id=n["id"],
            label=n["label"],
            category=n["category"],
            description=n["description"],
            page_reference=n.get("page_reference", 1)
        )
        for n in data.get("nodes", [])
    ]

    edges = [
        ConceptEdge(
            source=e["source"],
            target=e["target"],
            relationship=e["relationship"]
        )
        for e in data.get("edges", [])
    ]

    return ConceptMapResponse(
        document_id=doc_id,
        title=title,
        nodes=nodes,
        edges=edges
    )
