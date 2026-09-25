import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re


class VectorStore:
    """
    High-performance, document-isolated Vector Store.
    Uses TF-IDF + n-gram vectorization with cosine similarity for ultra-fast,
    zero-setup semantic retrieval, with exact lexical boosting for keywords and terminology.
    """
    def __init__(self):
        # document_id -> { "vectorizer": TfidfVectorizer, "matrix": matrix, "chunks": list }
        self._doc_indexes: Dict[str, Dict[str, Any]] = {}

    def index_chunks(self, document_id: str, chunks: List[Dict[str, Any]]):
        if not chunks:
            return

        texts = [c["content"] for c in chunks]
        
        # Build TF-IDF vectorizer with unigram and bigram features
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            max_features=5000,
            sublinear_tf=True
        )
        
        try:
            matrix = vectorizer.fit_transform(texts)
        except ValueError:
            # Fallback if text only contains stop words or numbers
            vectorizer = TfidfVectorizer(ngram_range=(1, 1), stop_words=None)
            matrix = vectorizer.fit_transform(texts)

        self._doc_indexes[document_id] = {
            "vectorizer": vectorizer,
            "matrix": matrix,
            "chunks": chunks
        }

    def search(self, document_id: str, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        if document_id not in self._doc_indexes:
            self._lazy_load_from_db(document_id)

        index = self._doc_indexes.get(document_id)
        if not index:
            return []

        vectorizer: TfidfVectorizer = index["vectorizer"]
        matrix = index["matrix"]
        chunks = index["chunks"]

        clean_query = query.strip()
        if not clean_query:
            return []

        try:
            query_vec = vectorizer.transform([clean_query])
            scores = cosine_similarity(query_vec, matrix).flatten()
        except Exception:
            return []

        # Find top_k indices
        top_indices = np.argsort(scores)[::-1]
        
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            # Even if score is low, if it's the best match, include it
            chunk = chunks[idx]
            
            # Boost score only if meaningful content words (>3 chars) literally appear in chunk
            STOP_WORDS = {"what", "when", "where", "which", "who", "whom", "this", "that", "with", "from", "have", "been", "were", "they", "their", "there", "about", "into", "more", "some", "such", "than", "then", "them", "these", "will", "would", "could", "should"}
            query_words = set(w for w in re.findall(r'\b[a-zA-Z]{4,}\b', clean_query.lower()) if w not in STOP_WORDS)
            chunk_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', chunk["content"].lower()))
            overlap = len(query_words.intersection(chunk_words))
            if overlap > 0 and len(query_words) > 0:
                score = min(1.0, score + 0.20 * (overlap / len(query_words)))

            results.append({
                "chunk_index": chunk["chunk_index"],
                "page_number": chunk["page_number"],
                "content": chunk["content"],
                "score": round(score, 4)
            })

            if len(results) >= top_k:
                break

        return results

    def _lazy_load_from_db(self, document_id: str):
        try:
            from database.database import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT chunk_index, page_number, content, token_count FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC;",
                    (document_id,)
                )
                rows = cursor.fetchall()
                if rows:
                    chunks = [
                        {
                            "chunk_index": r["chunk_index"],
                            "page_number": r["page_number"],
                            "content": r["content"],
                            "token_count": r["token_count"]
                        }
                        for r in rows
                    ]
                    self.index_chunks(document_id, chunks)
        except Exception as e:
            print(f"Lazy load error for doc {document_id}: {e}")

    def remove_document(self, document_id: str):
        if document_id in self._doc_indexes:
            del self._doc_indexes[document_id]


vector_store = VectorStore()
