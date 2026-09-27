import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
SAMPLES_DIR = DATA_DIR / "samples"
DB_PATH = DATA_DIR / "assistant.db"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

# Load root, backend, or user .env
ROOT_DIR = BASE_DIR.parent
for env_candidate in [
    ROOT_DIR / ".env",
    BASE_DIR / ".env",
    Path("C:/Users/lenovo/ai-document-assistant/.env")
]:
    if env_candidate.exists():
        load_dotenv(env_candidate, override=True)


class AppConfig:
    def __init__(self):
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
        self.groq_api_key: str = os.getenv("GROQ_API_KEY", "").strip()
        self.ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip()
        
        # Provider priority: gemini -> openai -> groq -> ollama -> demo
        self.preferred_provider: str = os.getenv("LLM_PROVIDER", "").strip().lower()
        self.force_demo_mode: bool = os.getenv("FORCE_DEMO_MODE", "false").lower() == "true"
        
        self.max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))
        self.allowed_extensions: set[str] = {".pdf", ".txt", ".md"}
        self.chunk_size: int = int(os.getenv("CHUNK_SIZE", "650"))
        self.chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "120"))
        
    @property
    def active_provider(self) -> str:
        if self.force_demo_mode:
            return "demo"
        if self.preferred_provider and self._is_provider_ready(self.preferred_provider):
            return self.preferred_provider
        if self.gemini_api_key:
            return "gemini"
        if self.openai_api_key:
            return "openai"
        if self.groq_api_key:
            return "groq"
        return "demo"

    def _is_provider_ready(self, provider: str) -> bool:
        if provider == "gemini":
            return bool(self.gemini_api_key)
        if provider == "openai":
            return bool(self.openai_api_key)
        if provider == "groq":
            return bool(self.groq_api_key)
        if provider == "ollama":
            return True
        if provider == "demo":
            return True
        return False

    def is_demo_mode(self) -> bool:
        return self.active_provider == "demo"

    def update_keys(self, gemini_key: str = None, openai_key: str = None, provider: str = None, force_demo: bool = None):
        if gemini_key is not None:
            self.gemini_api_key = gemini_key.strip()
            os.environ["GEMINI_API_KEY"] = self.gemini_api_key
        if openai_key is not None:
            self.openai_api_key = openai_key.strip()
            os.environ["OPENAI_API_KEY"] = self.openai_api_key
        if provider is not None:
            self.preferred_provider = provider.strip().lower()
        if force_demo is not None:
            self.force_demo_mode = force_demo


config = AppConfig()
