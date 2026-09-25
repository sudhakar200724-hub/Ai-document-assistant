import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from database.database import get_db
from schemas.models import (
    StudyGenerateRequest,
    StudyMaterialResponse,
    QuizSubmitRequest,
    QuizResultResponse,
    MCQItem
)
from ai.llm_service import llm_service

router = APIRouter(prefix="/api/study", tags=["Study Mode"])


@router.post("/generate", response_model=StudyMaterialResponse)
async def generate_study_material(req: StudyGenerateRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT clean_text FROM documents WHERE id = ?;", (req.document_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found.")
        doc_text = row["clean_text"]

    result = await llm_service.generate_study_material(doc_text, req.language)

    # Cache/Save to study_materials table
    study_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO study_materials (
                id, document_id, language, definitions_json, must_remember_json,
                two_mark_questions_json, five_mark_questions_json, ten_mark_questions_json,
                mcqs_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            study_id,
            req.document_id,
            req.language,
            json.dumps(result.get("definitions", [])),
            json.dumps(result.get("must_remember_points", [])),
            json.dumps(result.get("two_mark_questions", [])),
            json.dumps(result.get("five_mark_questions", [])),
            json.dumps(result.get("ten_mark_questions", [])),
            json.dumps(result.get("mcqs", [])),
            now
        ))

    return StudyMaterialResponse(
        document_id=req.document_id,
        language=req.language,
        definitions=result.get("definitions", []),
        must_remember_points=result.get("must_remember_points", []),
        two_mark_questions=result.get("two_mark_questions", []),
        five_mark_questions=result.get("five_mark_questions", []),
        ten_mark_questions=result.get("ten_mark_questions", []),
        mcqs=result.get("mcqs", [])
    )


@router.post("/quiz/submit", response_model=QuizResultResponse)
def submit_quiz(payload: QuizSubmitRequest):
    answers = payload.answers
    mcqs = payload.mcqs

    total = len(mcqs)
    score = 0
    weak_topics_dict = {}
    detailed = []

    for mcq in mcqs:
        q_id = str(mcq.id)
        chosen = answers.get(q_id, "").upper().strip()
        is_correct = (chosen == mcq.correct_answer.upper().strip())

        if is_correct:
            score += 1
        else:
            topic = mcq.topic or "General Concepts"
            weak_topics_dict[topic] = weak_topics_dict.get(topic, 0) + 1

        detailed.append({
            "question_id": mcq.id,
            "question": mcq.question,
            "user_answer": chosen or "Not Answered",
            "correct_answer": mcq.correct_answer,
            "is_correct": is_correct,
            "explanation": mcq.explanation,
            "topic": mcq.topic,
            "page_number": mcq.page_number
        })

    percentage = round((score / total) * 100, 1) if total > 0 else 0.0

    # Sort weak topics by miss count
    sorted_weak_topics = sorted(weak_topics_dict.keys(), key=lambda t: weak_topics_dict[t], reverse=True)
    if not sorted_weak_topics and score == total:
        weak_topics = []
        performance_summary = "Outstanding! You scored 100% and demonstrated total mastery of all tested topics in the document."
    elif percentage >= 75:
        weak_topics = sorted_weak_topics
        performance_summary = f"Great work! You scored {percentage}%. Review the minor missed concepts above to achieve full mastery."
    elif percentage >= 50:
        weak_topics = sorted_weak_topics
        performance_summary = f"Solid foundation ({percentage}%). Focus on reviewing the identified weak topics: {', '.join(sorted_weak_topics[:3])}."
    else:
        weak_topics = sorted_weak_topics
        performance_summary = f"Needs review ({percentage}%). We strongly recommend rereading the document sections and reviewing the definitions tab."

    quiz_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Save to SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO quiz_results (id, document_id, total_questions, score, percentage, weak_topics_json, answers_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            quiz_id,
            payload.document_id,
            total,
            score,
            percentage,
            json.dumps(weak_topics),
            json.dumps(detailed),
            now
        ))

    return QuizResultResponse(
        id=quiz_id,
        document_id=payload.document_id,
        total_questions=total,
        score=score,
        percentage=percentage,
        weak_topics=weak_topics,
        performance_summary=performance_summary,
        detailed_results=detailed,
        created_at=now
    )


@router.get("/quiz/history/{doc_id}")
def get_quiz_history(doc_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, document_id, total_questions, score, percentage, weak_topics_json, created_at
            FROM quiz_results
            WHERE document_id = ?
            ORDER BY created_at DESC;
        """, (doc_id,))
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "document_id": r["document_id"],
                "total_questions": r["total_questions"],
                "score": r["score"],
                "percentage": r["percentage"],
                "weak_topics": json.loads(r["weak_topics_json"] or "[]"),
                "created_at": r["created_at"]
            }
            for r in rows
        ]
