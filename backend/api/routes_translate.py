from fastapi import APIRouter, HTTPException
from database.database import get_db
from schemas.models import TranslateRequest, TranslateResponse
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/translate", tags=["Translate"])


@router.post("", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    text_to_translate = ""
    target_lang = req.get_target_language()
    source_lang = req.get_source_language()
    
    print(f"[API TRANSLATE] Processing request: target_language='{target_lang}', source_language='{source_lang}', document_id='{req.document_id}', page_number={req.page_number}")

    if req.text and req.text.strip():
        text_to_translate = req.text.strip()
    elif req.document_id:
        with get_db() as conn:
            cursor = conn.cursor()
            if req.page_number:
                cursor.execute("""
                    SELECT content FROM document_chunks 
                    WHERE document_id = ? AND page_number = ? 
                    ORDER BY chunk_index ASC;
                """, (req.document_id, req.page_number))
                chunks = cursor.fetchall()
                if not chunks:
                    raise HTTPException(status_code=404, detail=f"Page {req.page_number} not found in the selected document.")
                text_to_translate = "\n\n".join([c["content"] for c in chunks])
            else:
                cursor.execute("SELECT clean_text FROM documents WHERE id = ?;", (req.document_id,))
                row = cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Selected document not found.")
                text_to_translate = row["clean_text"]
    else:
        raise HTTPException(status_code=400, detail="Please provide either text or select a document to translate.")

    if not text_to_translate.strip():
        raise HTTPException(status_code=400, detail="Input text to translate is empty.")

    try:
        result = await llm_service.translate_document(
            text=text_to_translate,
            target_language=target_lang,
            source_language=source_lang
        )
    except ValueError as ve:
        print(f"[API TRANSLATE ERROR] Language validation failed: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        print(f"[API TRANSLATE ERROR] Unexpected translation error: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

    print(f"[API TRANSLATE SUCCESS] Target: '{target_lang}', Output length: {len(result)}")

    from core.languages import get_language_code
    return TranslateResponse(
        source_text=text_to_translate,
        translated_text=result,
        target_language=target_lang,
        target_language_code=get_language_code(target_lang),
        preserved_elements=["Headings", "Bullet points", "Paragraphs", "Numbering"]
    )

