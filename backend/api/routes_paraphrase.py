from fastapi import APIRouter
from schemas.models import ParaphraseRequest, ParaphraseResponse
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/paraphrase", tags=["Paraphrase"])


@router.post("", response_model=ParaphraseResponse)
async def paraphrase_text(req: ParaphraseRequest):
    result = await llm_service.paraphrase(
        text=req.text,
        mode=req.mode,
        length_option=req.length_option,
        language=req.language
    )

    return ParaphraseResponse(
        original_text=req.text,
        paraphrased_text=result,
        mode=req.mode,
        length_option=req.length_option,
        language=req.language
    )
