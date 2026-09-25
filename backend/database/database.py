import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager
from datetime import datetime
from typing import Generator, Any, Optional
from core.config import DB_PATH


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for high concurrency
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                page_count INTEGER NOT NULL,
                raw_text TEXT NOT NULL,
                clean_text TEXT NOT NULL,
                metadata_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL
            );
        """)

        # Document chunks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                page_number INTEGER NOT NULL,
                content TEXT NOT NULL,
                token_count INTEGER NOT NULL,
                metadata_json TEXT DEFAULT '{}',
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id);")

        # Summaries table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS summaries (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                summary_type TEXT NOT NULL,
                user_level TEXT DEFAULT 'Student',
                purpose TEXT DEFAULT 'Quick Understanding',
                language TEXT DEFAULT 'English',
                word_count INTEGER DEFAULT 200,
                format_style TEXT DEFAULT 'Paragraph',
                content TEXT NOT NULL,
                key_points_json TEXT DEFAULT '[]',
                concepts_json TEXT DEFAULT '[]',
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_summaries_doc ON summaries(document_id);")

        # Chat messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                citations_json TEXT DEFAULT '[]',
                language TEXT DEFAULT 'English',
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_doc ON chat_messages(document_id, session_id);")

        # Quiz results table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quiz_results (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                total_questions INTEGER NOT NULL,
                score INTEGER NOT NULL,
                percentage REAL NOT NULL,
                weak_topics_json TEXT DEFAULT '[]',
                answers_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        """)

        # Study materials table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_materials (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                language TEXT DEFAULT 'English',
                definitions_json TEXT DEFAULT '[]',
                must_remember_json TEXT DEFAULT '[]',
                two_mark_questions_json TEXT DEFAULT '[]',
                five_mark_questions_json TEXT DEFAULT '[]',
                ten_mark_questions_json TEXT DEFAULT '[]',
                mcqs_json TEXT DEFAULT '[]',
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        """)

        # User preferences table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                pref_key TEXT PRIMARY KEY,
                pref_value TEXT NOT NULL
            );
        """)

        # Research analysis table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS research_analyses (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                analysis_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        """)
