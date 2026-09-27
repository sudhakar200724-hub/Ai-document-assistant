import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from core.config import config, BASE_DIR
from database.database import init_db, get_db
from services.sample_docs import seed_sample_documents_if_empty

from api.routes_documents import router as documents_router
from api.routes_summary import router as summary_router
from api.routes_explain import router as explain_router
from api.routes_paraphrase import router as paraphrase_router
from api.routes_translate import router as translate_router
from api.routes_chat import router as chat_router
from api.routes_study import router as study_router
from api.routes_compare import router as compare_router
from api.routes_export import router as export_router
from api.routes_settings import router as settings_router
from api.routes_history import router as history_router
from api.routes_audio import router as audio_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Init database and seed sample documents
    init_db()
    seed_sample_documents_if_empty()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="AI Document Intelligence & Learning Assistant",
    description="Adaptive AI-powered document understanding, learning, and research platform.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(documents_router)
app.include_router(summary_router)
app.include_router(explain_router)
app.include_router(paraphrase_router)
app.include_router(translate_router)
app.include_router(chat_router)
app.include_router(study_router)
app.include_router(compare_router)
app.include_router(export_router)
app.include_router(settings_router)
app.include_router(history_router)
app.include_router(audio_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "AI Document Intelligence & Learning Assistant",
        "active_provider": config.active_provider,
        "is_demo_mode": config.is_demo_mode(),
        "version": "2.0.0"
    }


@app.get("/api/ai/status")
def ai_status():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents;")
        doc_count = cursor.fetchone()[0]

    return {
        "status": "online",
        "active_provider": config.active_provider,
        "is_demo_mode": config.is_demo_mode(),
        "gemini_configured": bool(config.gemini_api_key),
        "openai_configured": bool(config.openai_api_key),
        "groq_configured": bool(config.groq_api_key),
        "active_documents_count": doc_count,
        "version": "2.0.0"
    }


# Mount frontend dist if it exists for unified production serving
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

from fastapi.responses import FileResponse, JSONResponse

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Endpoint not found")

    file_path = FRONTEND_DIST / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))

    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    return JSONResponse(
        status_code=200,
        content={
            "app": "AI Document Intelligence & Learning Assistant",
            "status": "online",
            "message": "Backend API is operational. Run 'npm run build' inside frontend/ to build the user interface."
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
