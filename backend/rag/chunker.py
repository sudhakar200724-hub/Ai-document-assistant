import re
from typing import List, Dict, Any


class DocumentChunker:
    def __init__(self, target_words: int = 150, overlap_words: int = 30):
        self.target_words = target_words
        self.overlap_words = overlap_words

    def chunk_pages(self, pages: List[Dict[str, Any]], doc_id: str) -> List[Dict[str, Any]]:
        chunks = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page["page_number"]
            page_text = page["text"]
            
            if not page_text.strip():
                continue

            # Split by double newline or sentences
            paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]
            
            current_words = []
            
            for para in paragraphs:
                words = para.split()
                if not words:
                    continue
                
                # If paragraph itself is very long, chunk by words
                current_words.extend(words)
                
                while len(current_words) >= self.target_words:
                    chunk_text = " ".join(current_words[:self.target_words])
                    chunks.append({
                        "chunk_index": global_chunk_idx,
                        "document_id": doc_id,
                        "page_number": page_num,
                        "content": chunk_text,
                        "token_count": len(current_words[:self.target_words]),
                        "metadata": {
                            "document_id": doc_id,
                            "page_number": page_num,
                            "chunk_index": global_chunk_idx
                        }
                    })
                    global_chunk_idx += 1
                    # Keep overlap
                    current_words = current_words[self.target_words - self.overlap_words:]

            # Emit remaining words from this page if any
            if current_words:
                chunk_text = " ".join(current_words)
                chunks.append({
                    "chunk_index": global_chunk_idx,
                    "document_id": doc_id,
                    "page_number": page_num,
                    "content": chunk_text,
                    "token_count": len(current_words),
                    "metadata": {
                        "document_id": doc_id,
                        "page_number": page_num,
                        "chunk_index": global_chunk_idx
                    }
                })
                global_chunk_idx += 1

        return chunks
