import io
import re
from typing import List, Dict, Any
from pypdf import PdfReader


class DocumentExtractor:
    @staticmethod
    def extract_from_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """
        Extract text from file bytes (PDF or TXT) and return page-structured records:
        [{ "page_number": 1, "text": "...", "char_count": 123 }, ...]
        """
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            return DocumentExtractor._extract_pdf(file_bytes)
        elif lower_name.endswith(".txt") or lower_name.endswith(".md"):
            return DocumentExtractor._extract_txt(file_bytes)
        else:
            # Fallback to UTF-8 text attempt
            return DocumentExtractor._extract_txt(file_bytes)

    @staticmethod
    def _extract_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
        pages = []
        try:
            import pymupdf
            doc = pymupdf.open(stream=file_bytes, filetype="pdf")
            for idx, page in enumerate(doc):
                page_text = page.get_text() or ""
                clean_page_text = DocumentExtractor.clean_text(page_text)
                pages.append({
                    "page_number": idx + 1,
                    "text": clean_page_text,
                    "char_count": len(clean_page_text)
                })
        except Exception:
            pdf_stream = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_stream)
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                clean_page_text = DocumentExtractor.clean_text(page_text)
                pages.append({
                    "page_number": idx + 1,
                    "text": clean_page_text,
                    "char_count": len(clean_page_text)
                })
            
        if not pages or all(len(p["text"].strip()) == 0 for p in pages):
            pages = [{
                "page_number": 1,
                "text": "The document contains no readable text or consists only of scanned raster images.",
                "char_count": 80
            }]
        return pages

    @staticmethod
    def _extract_txt(file_bytes: bytes) -> List[Dict[str, Any]]:
        try:
            raw_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raw_text = file_bytes.decode("latin-1", errors="replace")

        clean = DocumentExtractor.clean_text(raw_text)
        # Approximate 3000 chars per virtual page for TXT files
        PAGE_SIZE = 3000
        pages = []
        if len(clean) <= PAGE_SIZE:
            pages.append({"page_number": 1, "text": clean, "char_count": len(clean)})
        else:
            parts = [clean[i:i + PAGE_SIZE] for i in range(0, len(clean), PAGE_SIZE)]
            for idx, part in enumerate(parts):
                pages.append({
                    "page_number": idx + 1,
                    "text": part.strip(),
                    "char_count": len(part.strip())
                })
        return pages

    @staticmethod
    def extract_from_raw_text(text: str) -> List[Dict[str, Any]]:
        clean = DocumentExtractor.clean_text(text)
        PAGE_SIZE = 3000
        pages = []
        if len(clean) <= PAGE_SIZE:
            pages.append({"page_number": 1, "text": clean, "char_count": len(clean)})
        else:
            parts = [clean[i:i + PAGE_SIZE] for i in range(0, len(clean), PAGE_SIZE)]
            for idx, part in enumerate(parts):
                pages.append({
                    "page_number": idx + 1,
                    "text": part.strip(),
                    "char_count": len(part.strip())
                })
        return pages

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Fix hyphenation across lines (e.g. "trans- \nformer" -> "transformer")
        text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
        # Normalize carriage returns
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        # Replace 3 or more consecutive newlines with 2
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Replace multiple spaces with a single space
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()
