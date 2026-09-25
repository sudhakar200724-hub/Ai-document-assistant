from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Document Schemas ---
class DocumentCreate(BaseModel):
    title: str
    text_content: Optional[str] = None


class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: int
    content: str
    token_count: int


class DocumentResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    created_at: str
    preview_text: Optional[str] = ""
    chunk_count: Optional[int] = 0


# --- Summary Schemas ---
class SummaryRequest(BaseModel):
    document_id: str
    summary_type: str = "standard"  # standard, time_based, personalized, business
    word_count: Optional[int] = 200
    format_style: str = "Paragraph"  # Paragraph, Bullet points, Key takeaways, Executive summary
    key_points_count: int = 5
    user_level: str = "Student"  # Beginner, Student, Researcher, Professional, Expert
    purpose: str = "Quick Understanding"  # Quick Understanding, Exam Preparation, Research, Presentation, Business, General Knowledge
    language: str = "English"  # English, Tamil, Tanglish, Hindi, Malayalam, Telugu, Kannada
    target_language: Optional[str] = None
    targetLanguage: Optional[str] = None
    time_limit: Optional[str] = None  # 30 seconds, 2 minutes, 5 minutes, 10 minutes

    def get_target_language(self) -> str:
        from core.languages import normalize_language
        raw = self.target_language or self.targetLanguage or self.language or "English"
        return normalize_language(raw)


class SummaryResponse(BaseModel):
    id: str
    document_id: str
    summary_type: str
    content: str
    key_points: List[str]
    important_concepts: List[str]
    source_pages: List[int]
    word_count: int
    user_level: str
    purpose: str
    language: str
    created_at: str


# --- Explain Schemas ---
class ExplainRequest(BaseModel):
    document_id: str
    concept_or_text: str
    user_level: str = "Student"
    language: str = "English"


class ExplainResponse(BaseModel):
    concept: str
    simple_explanation: str
    real_world_example: str
    why_it_matters: str
    difficult_concepts_breakdown: List[Dict[str, str]]
    source_pages: List[int]
    language: str


# --- Paraphrase Schemas ---
class ParaphraseRequest(BaseModel):
    document_id: Optional[str] = None
    text: str
    mode: str = "Professional"  # Simple, Professional, Academic, Formal, Casual
    length_option: str = "Same length"  # Shorter, Same length, More detailed
    language: str = "English"


class ParaphraseResponse(BaseModel):
    original_text: str
    paraphrased_text: str
    mode: str
    length_option: str
    language: str


# --- Translate Schemas ---
class TranslateRequest(BaseModel):
    document_id: Optional[str] = None
    text: Optional[str] = None
    page_number: Optional[int] = None
    target_language: Optional[str] = None  # English, Tamil, Tanglish, Hindi, Malayalam, Telugu, Kannada, etc.
    targetLanguage: Optional[str] = None
    language: Optional[str] = None
    source_language: Optional[str] = "Auto"
    sourceLanguage: Optional[str] = None

    def get_target_language(self) -> str:
        from core.languages import normalize_language
        raw = self.target_language or self.targetLanguage or self.language or "Tamil"
        return normalize_language(raw)

    def get_source_language(self) -> str:
        raw = self.source_language or self.sourceLanguage or "Auto"
        return raw.strip()


class TranslateResponse(BaseModel):
    source_text: str
    translated_text: str
    target_language: str
    preserved_elements: List[str]


# --- Chat Schemas ---
class CitationItem(BaseModel):
    page_number: int
    snippet: str
    relevance_score: float = 1.0


class ChatRequest(BaseModel):
    document_id: str
    session_id: Optional[str] = "default"
    question: str
    language: str = "English"
    selected_text: Optional[str] = None


class ChatResponse(BaseModel):
    id: str
    role: str = "assistant"
    answer: str
    citations: List[CitationItem]
    grounded: bool
    language: str


# --- Study Mode Schemas ---
class StudyGenerateRequest(BaseModel):
    document_id: str
    language: str = "English"
    difficulty: str = "Medium"


class MCQOption(BaseModel):
    label: str  # A, B, C, D
    text: str


class MCQItem(BaseModel):
    id: int
    question: str
    options: List[MCQOption]
    correct_answer: str  # A, B, C, D
    explanation: str
    topic: str
    page_number: Optional[int] = 1


class StudyMaterialResponse(BaseModel):
    document_id: str
    language: str
    definitions: List[Dict[str, str]]
    must_remember_points: List[str]
    two_mark_questions: List[Dict[str, str]]
    five_mark_questions: List[Dict[str, str]]
    ten_mark_questions: List[Dict[str, str]]
    mcqs: List[MCQItem]


class QuizSubmitRequest(BaseModel):
    document_id: str
    answers: Dict[str, str]  # question_id -> chosen_option (e.g. "1": "B")
    mcqs: List[MCQItem]


class QuizResultResponse(BaseModel):
    id: str
    document_id: str
    total_questions: int
    score: int
    percentage: float
    weak_topics: List[str]
    performance_summary: str
    detailed_results: List[Dict[str, Any]]
    created_at: str


# --- Research Mode Schemas ---
class ResearchAnalysisResponse(BaseModel):
    document_id: str
    title: str
    authors: List[str]
    abstract: str
    research_problem: str
    methodology: str
    dataset: str
    results: str
    limitations: str
    conclusion: str
    future_work: str
    key_contributions: List[str]


# --- Compare Schemas ---
class CompareRequest(BaseModel):
    document_ids: List[str]
    language: str = "English"


class CompareResponse(BaseModel):
    comparison_matrix: List[Dict[str, Any]]
    similarities: List[str]
    differences: List[str]
    unique_points: Dict[str, List[str]]
    overall_synthesis: str


# --- Concept Map Schemas ---
class ConceptNode(BaseModel):
    id: str
    label: str
    category: str
    description: str
    page_reference: Optional[int] = 1


class ConceptEdge(BaseModel):
    source: str
    target: str
    relationship: str


class ConceptMapResponse(BaseModel):
    document_id: str
    title: str
    nodes: List[ConceptNode]
    edges: List[ConceptEdge]


# --- Export Schemas ---
class ExportRequest(BaseModel):
    title: str
    content: str
    export_format: str = "pdf"  # pdf, docx, txt, md
    document_title: Optional[str] = "AI Document Analysis"


# --- Settings & Status ---
class SettingsUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    provider: Optional[str] = None
    force_demo_mode: Optional[bool] = None


class SystemStatusResponse(BaseModel):
    active_provider: str
    is_demo_mode: bool
    gemini_configured: bool
    openai_configured: bool
    groq_configured: bool
    active_documents_count: int
    version: str = "2.0.0"
