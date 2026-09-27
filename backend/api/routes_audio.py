import io
import re
import httpx
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
from gtts import gTTS

router = APIRouter(prefix="/api/audio", tags=["Audio"])


class TTSRequest(BaseModel):
    text: str
    language: str = "English"
    speed: Optional[float] = 1.0


# Language code mapping for gTTS
LANGUAGE_TTS_MAP = {
    "tamil": "ta",
    "தமிழ்": "ta",
    "ta": "ta",
    "ta-in": "ta",
    "tanglish": "ta",

    "malayalam": "ml",
    "മലയാളം": "ml",
    "ml": "ml",
    "ml-in": "ml",

    "hindi": "hi",
    "हिन्दी": "hi",
    "हिंदी": "hi",
    "hi": "hi",
    "hi-in": "hi",

    "telugu": "te",
    "తెలుగు": "te",
    "te": "te",
    "te-in": "te",

    "kannada": "kn",
    "ಕನ್ನಡ": "kn",
    "kn": "kn",
    "kn-in": "kn",

    "english": "en",
    "en": "en",
    "en-us": "en",
    "en-in": "en",

    "spanish": "es",
    "es": "es",
    "french": "fr",
    "fr": "fr",
    "german": "de",
    "de": "de",
}


def resolve_tts_lang(lang_input: str) -> str:
    if not lang_input:
        return "en"
    clean = lang_input.strip().lower()
    if clean in LANGUAGE_TTS_MAP:
        return LANGUAGE_TTS_MAP[clean]
    if clean.startswith("ta"):
        return "ta"
    if clean.startswith("ml"):
        return "ml"
    if clean.startswith("hi"):
        return "hi"
    if clean.startswith("te"):
        return "te"
    if clean.startswith("kn"):
        return "kn"
    if clean.startswith("en"):
        return "en"
    if clean.startswith("es"):
        return "es"
    if clean.startswith("fr"):
        return "fr"
    if clean.startswith("de"):
        return "de"
    return "en"


def clean_tts_text(raw_text: str) -> str:
    """
    Strips markdown formatting, bullet symbols, and excessive whitespaces
    while strictly preserving all native characters (Tamil, Malayalam, etc.).
    """
    cleaned = re.sub(r'^[•\-\*✓\d\.\)\s]+', '', raw_text, flags=re.MULTILINE)
    cleaned = re.sub(r'[*#_~`]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


@router.get("/status")
def tts_status():
    return {
        "status": "ready",
        "provider": "gTTS + Google Translate TTS API",
        "supported_languages": [
            {"name": "Tamil", "code": "ta", "locale": "ta-IN"},
            {"name": "Malayalam", "code": "ml", "locale": "ml-IN"},
            {"name": "Hindi", "code": "hi", "locale": "hi-IN"},
            {"name": "Telugu", "code": "te", "locale": "te-IN"},
            {"name": "Kannada", "code": "kn", "locale": "kn-IN"},
            {"name": "English", "code": "en", "locale": "en-US"},
            {"name": "Spanish", "code": "es", "locale": "es-ES"},
            {"name": "French", "code": "fr", "locale": "fr-FR"},
            {"name": "German", "code": "de", "locale": "de-DE"},
        ]
    }


@router.post("/tts")
async def generate_speech(req: TTSRequest):
    text = clean_tts_text(req.text)
    if not text:
        raise HTTPException(status_code=400, detail="Text is required for TTS synthesis.")

    lang_code = resolve_tts_lang(req.language)
    print(f"[TTS REQUEST] Language: '{req.language}' -> resolved code '{lang_code}', Text length: {len(text)}")

    # 1. Primary engine: gTTS (handles long texts, multi-sentence chunking, accurate phonetics)
    try:
        fp = io.BytesIO()
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.write_to_fp(fp)
        audio_bytes = fp.getvalue()
        if audio_bytes and len(audio_bytes) > 200:
            print(f"[TTS SUCCESS] Generated {len(audio_bytes)} bytes of audio/mpeg for {lang_code}")
            return Response(
                content=audio_bytes,
                media_type="audio/mpeg",
                headers={
                    "Accept-Ranges": "bytes",
                    "Content-Disposition": f'inline; filename="tts_{lang_code}.mp3"'
                }
            )
    except Exception as e:
        print(f"[TTS gTTS Warning] gTTS engine raised: {e}. Trying direct Google HTTP TTS fallback...")

    # 2. Secondary fallback engine: Direct Google Translate TTS HTTP endpoint
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        # Split into smaller segments if longer than 200 chars
        segments = [s.strip() for s in re.split(r'[\.\!\?\n]+', text) if s.strip()]
        if not segments:
            segments = [text[:200]]

        combined_bytes = bytearray()
        async with httpx.AsyncClient(timeout=15.0) as client:
            for seg in segments[:10]: # Up to 10 sentences
                if not seg:
                    continue
                params = {
                    "ie": "UTF-8",
                    "q": seg[:180],
                    "tl": lang_code,
                    "client": "tw-ob"
                }
                res = await client.get(
                    "https://translate.google.com/translate_tts",
                    params=params,
                    headers=headers
                )
                if res.status_code == 200 and res.content:
                    combined_bytes.extend(res.content)

        if combined_bytes and len(combined_bytes) > 200:
            print(f"[TTS FALLBACK SUCCESS] Generated {len(combined_bytes)} bytes of audio/mpeg via direct HTTP fallback")
            return Response(
                content=bytes(combined_bytes),
                media_type="audio/mpeg",
                headers={
                    "Accept-Ranges": "bytes",
                    "Content-Disposition": f'inline; filename="tts_{lang_code}.mp3"'
                }
            )
    except Exception as e2:
        print(f"[TTS HTTP Fallback Error] {e2}")

    raise HTTPException(
        status_code=500,
        detail=f"Failed to generate text-to-speech for language {req.language}."
    )
