import json
from fastapi import APIRouter
from database.database import get_db

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("/dashboard-stats")
def get_dashboard_stats():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents;")
        total_docs = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM summaries;")
        total_summaries = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM chat_messages WHERE role = 'user';")
        total_questions = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(percentage) FROM quiz_results;")
        avg_score_row = cursor.fetchone()[0]
        avg_score = round(avg_score_row, 1) if avg_score_row is not None else 0.0

        # Recent docs
        cursor.execute("""
            SELECT id, title, filename, file_type, page_count, created_at
            FROM documents ORDER BY created_at DESC LIMIT 5;
        """)
        recent_docs = [dict(r) for r in cursor.fetchall()]

        # Recent summaries
        cursor.execute("""
            SELECT s.id, s.document_id, s.summary_type, s.user_level, s.purpose, s.language,
                   s.content, s.created_at, d.title as doc_title
            FROM summaries s
            JOIN documents d ON s.document_id = d.id
            ORDER BY s.created_at DESC LIMIT 4;
        """)
        recent_summaries = [dict(r) for r in cursor.fetchall()]

        # Recent quiz attempts
        cursor.execute("""
            SELECT q.id, q.document_id, q.total_questions, q.score, q.percentage,
                   q.weak_topics_json, q.created_at, d.title as doc_title
            FROM quiz_results q
            JOIN documents d ON q.document_id = d.id
            ORDER BY q.created_at DESC LIMIT 4;
        """)
        recent_quizzes = [
            {
                **dict(r),
                "weak_topics": json.loads(r["weak_topics_json"] or "[]")
            }
            for r in cursor.fetchall()
        ]

    return {
        "stats": {
            "total_documents": total_docs,
            "total_summaries": total_summaries,
            "total_questions": total_questions,
            "avg_quiz_score": avg_score
        },
        "recent_documents": recent_docs,
        "recent_summaries": recent_summaries,
        "recent_quizzes": recent_quizzes
    }


@router.get("/all")
def get_full_history():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.id, 'summary' as type, s.document_id, d.title as doc_title,
                   s.summary_type as title, s.content, s.created_at
            FROM summaries s
            JOIN documents d ON s.document_id = d.id
            ORDER BY s.created_at DESC;
        """)
        summaries = [dict(r) for r in cursor.fetchall()]

        cursor.execute("""
            SELECT q.id, 'quiz' as type, q.document_id, d.title as doc_title,
                   ('Quiz Score: ' || q.score || '/' || q.total_questions || ' (' || q.percentage || '%)') as title,
                   ('Weak topics: ' || q.weak_topics_json) as content, q.created_at
            FROM quiz_results q
            JOIN documents d ON q.document_id = d.id
            ORDER BY q.created_at DESC;
        """)
        quizzes = [dict(r) for r in cursor.fetchall()]

    all_history = sorted(summaries + quizzes, key=lambda x: x["created_at"], reverse=True)
    return all_history
