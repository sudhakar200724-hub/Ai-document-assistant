from fastapi import APIRouter, Response, HTTPException
from schemas.models import ExportRequest
from services.export_service import ExportService

router = APIRouter(prefix="/api/export", tags=["Export"])


@router.post("")
def export_content(req: ExportRequest):
    fmt = req.export_format.lower()
    doc_name = req.document_title or "AI Document Analysis"

    if fmt == "pdf":
        pdf_bytes = ExportService.generate_pdf(req.title, req.content, doc_name)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=analysis_{req.title.lower().replace(' ', '_')}.pdf"}
        )
    elif fmt == "docx":
        docx_bytes = ExportService.generate_docx(req.title, req.content, doc_name)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename=analysis_{req.title.lower().replace(' ', '_')}.docx"}
        )
    elif fmt == "md" or fmt == "markdown":
        md_text = ExportService.generate_markdown(req.title, req.content, doc_name)
        return Response(
            content=md_text,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=analysis_{req.title.lower().replace(' ', '_')}.md"}
        )
    elif fmt == "txt":
        txt_text = ExportService.generate_txt(req.title, req.content, doc_name)
        return Response(
            content=txt_text,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=analysis_{req.title.lower().replace(' ', '_')}.txt"}
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{fmt}'. Choose from pdf, docx, md, txt.")
