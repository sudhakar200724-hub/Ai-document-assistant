import unittest
import urllib.request
import json


BASE_URL = "http://127.0.0.1:8000"


def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as res:
        content = res.read().decode("utf-8")
        try:
            return json.loads(content)
        except Exception:
            return content


class TestAIDocumentAssistant(unittest.TestCase):
    def test_01_health_and_status(self):
        res = make_request("/api/health")
        self.assertEqual(res["status"], "healthy")
        self.assertIn("version", res)

    def test_02_documents_list(self):
        docs = make_request("/api/documents")
        self.assertIsInstance(docs, list)
        self.assertGreaterEqual(len(docs), 3)
        self.sample_id = docs[0]["id"]

    def test_03_summary_generation(self):
        docs = make_request("/api/documents")
        doc_id = docs[0]["id"]
        payload = {
            "document_id": doc_id,
            "summary_type": "personalized",
            "word_count": 100,
            "format_style": "Key takeaways",
            "user_level": "Student",
            "purpose": "Exam Preparation",
            "language": "English"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        self.assertIn("content", res)
        self.assertIn("key_points", res)
        self.assertGreaterEqual(len(res["key_points"]), 1)

    def test_04_explain_concept(self):
        docs = make_request("/api/documents")
        doc_id = docs[0]["id"]
        payload = {
            "document_id": doc_id,
            "concept_or_text": "Transformer Architecture",
            "user_level": "Student",
            "language": "English"
        }
        res = make_request("/api/explain", method="POST", data=payload)
        self.assertIn("simple_explanation", res)
        self.assertIn("real_world_example", res)
        self.assertIn("why_it_matters", res)

    def test_05_paraphrase(self):
        payload = {
            "text": "The model demonstrates significant performance improvements across all evaluation tasks.",
            "mode": "Professional",
            "length_option": "Same length",
            "language": "English"
        }
        res = make_request("/api/paraphrase", method="POST", data=payload)
        self.assertIn("paraphrased_text", res)
        self.assertGreater(len(res["paraphrased_text"]), 10)

    def test_06_translate(self):
        payload = {
            "text": "The attention mechanism replaces recurrence and convolutions entirely.",
            "target_language": "Tanglish"
        }
        res = make_request("/api/translate", method="POST", data=payload)
        self.assertIn("translated_text", res)

    def test_07_rag_chat_and_citations(self):
        docs = make_request("/api/documents")
        target_doc = next((d for d in docs if "attention" in d["title"].lower() or d["id"] == "sample-doc-1"), docs[0])
        doc_id = target_doc["id"]
        payload = {
            "document_id": doc_id,
            "question": "What is the BLEU score on English-to-German?",
            "language": "English"
        }
        res = make_request("/api/chat", method="POST", data=payload)
        self.assertIn("answer", res)
        self.assertIn("citations", res)
        self.assertTrue(res["grounded"])
        self.assertGreaterEqual(len(res["citations"]), 1)
        self.assertIn("page_number", res["citations"][0])

    def test_08_rag_chat_not_found_guardrail(self):
        docs = make_request("/api/documents")
        doc_id = docs[0]["id"]
        payload = {
            "document_id": doc_id,
            "question": "What is the recipe for chocolate lava cake with extra vanilla?",
            "language": "English"
        }
        res = make_request("/api/chat", method="POST", data=payload)
        self.assertIn("not found", res["answer"].lower())
        self.assertFalse(res["grounded"])

    def test_09_study_mode_and_quiz(self):
        docs = make_request("/api/documents")
        doc_id = docs[0]["id"]
        study = make_request("/api/study/generate", method="POST", data={"document_id": doc_id, "language": "English"})
        self.assertIn("mcqs", study)
        self.assertGreater(len(study["mcqs"]), 0)

        # Submit quiz
        mcqs = study["mcqs"]
        answers = {str(m["id"]): m["correct_answer"] for m in mcqs}
        quiz_res = make_request("/api/study/quiz/submit", method="POST", data={
            "document_id": doc_id,
            "answers": answers,
            "mcqs": mcqs
        })
        self.assertEqual(quiz_res["score"], len(mcqs))
        self.assertEqual(quiz_res["percentage"], 100.0)

    def test_10_research_mode(self):
        docs = make_request("/api/documents")
        doc_id = docs[0]["id"]
        res = make_request(f"/api/research/{doc_id}")
        self.assertIn("research_problem", res)
        self.assertIn("methodology", res)
        self.assertIn("results", res)

    def test_11_compare_documents(self):
        docs = make_request("/api/documents")
        if len(docs) >= 2:
            payload = {
                "document_ids": [docs[0]["id"], docs[1]["id"]],
                "language": "English"
            }
            res = make_request("/api/compare", method="POST", data=payload)
            self.assertIn("comparison_matrix", res)
            self.assertIn("similarities", res)

    def test_12_concept_map(self):
        docs = make_request("/api/documents")
        doc_id = docs[0]["id"]
        res = make_request(f"/api/concept-map/{doc_id}")
        self.assertIn("nodes", res)
        self.assertIn("edges", res)
        self.assertGreater(len(res["nodes"]), 0)

    def test_13_dashboard_stats(self):
        stats = make_request("/api/history/dashboard-stats")
        self.assertIn("stats", stats)
        self.assertGreaterEqual(stats["stats"]["total_documents"], 3)


if __name__ == "__main__":
    unittest.main()
