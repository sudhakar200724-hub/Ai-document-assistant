import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional

from core.config import config
from database.database import get_db
from schemas.models import DocumentResponse, DocumentChunkResponse
from rag.extractor import DocumentExtractor
from rag.chunker import DocumentChunker
from rag.vector_store import vector_store
from services.sample_docs import seed_sample_documents_if_empty

router = APIRouter(prefix="/api/documents", tags=["Documents"])
chunker = DocumentChunker()


@router.get("", response_model=List[DocumentResponse])
def list_documents():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.id, d.title, d.filename, d.file_type, d.file_size, d.page_count, d.created_at,
                   d.clean_text, COUNT(c.id) as chunk_count
            FROM documents d
            LEFT JOIN document_chunks c ON d.id = c.document_id
            GROUP BY d.id
            ORDER BY d.created_at DESC;
        """)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            preview = r["clean_text"][:200] + "..." if len(r["clean_text"]) > 200 else r["clean_text"]
            result.append(DocumentResponse(
                id=r["id"],
                title=r["title"],
                filename=r["filename"],
                file_type=r["file_type"],
                file_size=r["file_size"],
                page_count=r["page_count"],
                created_at=r["created_at"],
                preview_text=preview,
                chunk_count=r["chunk_count"]
            ))
        return result


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    custom_title: Optional[str] = Form(None)
):
    filename = file.filename or "uploaded_document"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in config.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(config.allowed_extensions)}"
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)
    max_bytes = config.max_upload_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {config.max_upload_size_mb}MB.")

    # Extract text with page tracking
    try:
        pages = DocumentExtractor.extract_from_bytes(file_bytes, filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract document text: {str(e)}")

    full_text = "\n\n".join([p["text"] for p in pages])
    clean_text = DocumentExtractor.clean_text(full_text)
    if not clean_text.strip():
        raise HTTPException(status_code=400, detail="The document appears to be empty or contains unreadable content.")

    doc_id = str(uuid.uuid4())
    doc_title = custom_title.strip() if custom_title and custom_title.strip() else filename.rsplit(".", 1)[0]
    now = datetime.utcnow().isoformat()
    page_count = len(pages)

    # Chunk text
    chunks = chunker.chunk_pages(pages, doc_id)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (id, title, filename, file_type, file_size, page_count, raw_text, clean_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (doc_id, doc_title, filename, ext.replace(".", ""), file_size, page_count, full_text, clean_text, now))

        for c in chunks:
            chunk_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO document_chunks (id, document_id, chunk_index, page_number, content, token_count)
                VALUES (?, ?, ?, ?, ?, ?);
            """, (chunk_id, doc_id, c["chunk_index"], c["page_number"], c["content"], c["token_count"]))

    # Index in Vector Store
    vector_store.index_chunks(doc_id, chunks)

    return DocumentResponse(
        id=doc_id,
        title=doc_title,
        filename=filename,
        file_type=ext.replace(".", ""),
        file_size=file_size,
        page_count=page_count,
        created_at=now,
        preview_text=clean_text[:200] + "...",
        chunk_count=len(chunks)
    )


@router.post("/raw", response_model=DocumentResponse)
def create_raw_document(payload: dict):
    title = payload.get("title", "Pasted Document").strip()
    text = (payload.get("text_content") or payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text content cannot be empty.")

    clean_text = DocumentExtractor.clean_text(text)
    pages = DocumentExtractor.extract_from_raw_text(clean_text)
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    chunks = chunker.chunk_pages(pages, doc_id)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (id, title, filename, file_type, file_size, page_count, raw_text, clean_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (doc_id, title, f"{title.lower().replace(' ', '_')}.txt", "txt", len(clean_text.encode('utf-8')), len(pages), text, clean_text, now))

        for c in chunks:
            chunk_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO document_chunks (id, document_id, chunk_index, page_number, content, token_count)
                VALUES (?, ?, ?, ?, ?, ?);
            """, (chunk_id, doc_id, c["chunk_index"], c["page_number"], c["content"], c["token_count"]))

    vector_store.index_chunks(doc_id, chunks)

    return DocumentResponse(
        id=doc_id,
        title=title,
        filename=f"{title.lower().replace(' ', '_')}.txt",
        file_type="txt",
        file_size=len(clean_text.encode('utf-8')),
        page_count=len(pages),
        created_at=now,
        preview_text=clean_text[:200] + "...",
        chunk_count=len(chunks)
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.id, d.title, d.filename, d.file_type, d.file_size, d.page_count, d.created_at,
                   d.clean_text, COUNT(c.id) as chunk_count
            FROM documents d
            LEFT JOIN document_chunks c ON d.id = c.document_id
            WHERE d.id = ?
            GROUP BY d.id;
        """, (doc_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found.")

        return DocumentResponse(
            id=row["id"],
            title=row["title"],
            filename=row["filename"],
            file_type=row["file_type"],
            file_size=row["file_size"],
            page_count=row["page_count"],
            created_at=row["created_at"],
            preview_text=row["clean_text"][:300] + "...",
            chunk_count=row["chunk_count"]
        )


@router.get("/{doc_id}/chunks", response_model=List[DocumentChunkResponse])
def get_document_chunks(doc_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, chunk_index, page_number, content, token_count
            FROM document_chunks
            WHERE document_id = ?
            ORDER BY chunk_index ASC;
        """, (doc_id,))
        rows = cursor.fetchall()
        return [
            DocumentChunkResponse(
                id=r["id"],
                chunk_index=r["chunk_index"],
                page_number=r["page_number"],
                content=r["content"],
                token_count=r["token_count"]
            )
            for r in rows
        ]


@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?;", (doc_id,))
        cursor.execute("DELETE FROM document_chunks WHERE document_id = ?;", (doc_id,))
        cursor.execute("DELETE FROM summaries WHERE document_id = ?;", (doc_id,))
        cursor.execute("DELETE FROM chat_messages WHERE document_id = ?;", (doc_id,))
        cursor.execute("DELETE FROM quiz_results WHERE document_id = ?;", (doc_id,))

    vector_store.remove_document(doc_id)
    return {"status": "success", "message": f"Document {doc_id} deleted successfully."}
