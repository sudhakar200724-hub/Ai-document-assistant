from fastapi import APIRouter
from core.config import config
from schemas.models import SettingsUpdateRequest, SystemStatusResponse
from database.database import get_db

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/status", response_model=SystemStatusResponse)
def get_system_status():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents;")
        doc_count = cursor.fetchone()[0]

    return SystemStatusResponse(
        active_provider=config.active_provider,
        is_demo_mode=config.is_demo_mode(),
        gemini_configured=bool(config.gemini_api_key),
        openai_configured=bool(config.openai_api_key),
        groq_configured=bool(config.groq_api_key),
        active_documents_count=doc_count,
        version="2.0.0"
    )


@router.post("/update")
def update_settings(req: SettingsUpdateRequest):
    config.update_keys(
        gemini_key=req.gemini_api_key,
        openai_key=req.openai_api_key,
        provider=req.provider,
        force_demo=req.force_demo_mode
    )
    return {
        "status": "success",
        "message": "Configuration updated successfully.",
        "active_provider": config.active_provider,
        "is_demo_mode": config.is_demo_mode()
    }
