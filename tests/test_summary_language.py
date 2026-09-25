import unittest
import urllib.request
import json
import sys

# Ensure UTF-8 output encoding for console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

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


def count_scripts(text):
    tamil = sum(1 for c in text if '\u0b80' <= c <= '\u0bff')
    hindi = sum(1 for c in text if '\u0900' <= c <= '\u097f')
    malayalam = sum(1 for c in text if '\u0d00' <= c <= '\u0d7f')
    telugu = sum(1 for c in text if '\u0c00' <= c <= '\u0c7f')
    kannada = sum(1 for c in text if '\u0c80' <= c <= '\u0cff')
    latin = sum(1 for c in text if ('a' <= c <= 'z') or ('A' <= c <= 'Z'))
    return {
        "tamil": tamil,
        "hindi": hindi,
        "malayalam": malayalam,
        "telugu": telugu,
        "kannada": kannada,
        "latin": latin,
        "total_indic": tamil + hindi + malayalam + telugu + kannada
    }


class TestSummaryLanguageEnforcement(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 1. Fetch documents or ensure an English document exists
        docs = make_request("/api/documents")
        cls.eng_doc = next((d for d in docs if "attention" in d["title"].lower() or d["id"] == "sample-doc-1"), docs[0])

        # 2. Create a Tamil document for cross-language testing
        tamil_doc_payload = {
            "title": "தமிழ் இயந்திர கற்றல் ஆவணம்",
            "text_content": (
                "இயந்திர கற்றல் என்பது செயற்கை நுண்ணறிவின் ஒரு முக்கியமான கிளையாகும். "
                "டிரான்ஸ்ஃபார்மர் மாதிரி கட்டமைப்பு கவன பொறிமுறையை அடிப்படையாகக் கொண்டது. "
                "குறியாக்கி மற்றும் குறியீட்டு நீக்கி மூலம் தரவு செயலாக்கம் சிறப்பாக நடைபெறுகிறது. "
                "இந்த ஆய்வு நவீன தொழில்நுட்பத்தில் சிறந்த முடிவுகளை வழங்குகிறது."
            )
        }
        res = make_request("/api/documents/raw", method="POST", data=tamil_doc_payload)
        cls.tamil_doc = res

    def test_01_english_article_to_tamil_summary(self):
        payload = {
            "document_id": self.eng_doc["id"],
            "target_language": "Tamil",  # Testing target_language alias
            "word_count": 150,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 1: English -> Tamil Summary]")
        print("Tamil chars:", counts["tamil"], "| Latin chars:", counts["latin"], "| Content preview:", content[:100])
        # Assert full native generation (hundreds of Tamil characters, heavily dominating Latin)
        self.assertGreater(counts["tamil"], 200, "Summary must be written extensively in Tamil Unicode script.")
        self.assertGreater(counts["tamil"], counts["latin"] * 3, "Tamil characters must vastly outnumber any English technical terms.")
        self.assertEqual(res["language"], "Tamil")
        self.assertGreaterEqual(len(res["key_points"]), 3)
        kp_counts = count_scripts(" ".join(res["key_points"]))
        self.assertGreater(kp_counts["tamil"], 100, "Key points must be in Tamil script.")
        # Verify concepts
        concepts = res.get("important_concepts") or res.get("concepts", [])
        concept_counts = count_scripts(" ".join(concepts))
        self.assertGreater(concept_counts["tamil"], 20, "Extracted concepts must be in Tamil script.")

    def test_02_english_article_to_hindi_summary(self):
        payload = {
            "document_id": self.eng_doc["id"],
            "targetLanguage": "Hindi",  # Testing camelCase alias
            "word_count": 150,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 2: English -> Hindi Summary]")
        print("Hindi chars:", counts["hindi"], "| Latin chars:", counts["latin"], "| Content preview:", content[:100])
        self.assertGreater(counts["hindi"], 200, "Summary must be written extensively in Hindi Devanagari script.")
        self.assertGreater(counts["hindi"], counts["latin"] * 3, "Hindi Devanagari must vastly outnumber any English terms.")
        self.assertEqual(res["language"], "Hindi")
        kp_counts = count_scripts(" ".join(res["key_points"]))
        self.assertGreater(kp_counts["hindi"], 100, "Key points must be in Hindi Devanagari.")

    def test_03_english_article_to_english_summary(self):
        payload = {
            "document_id": self.eng_doc["id"],
            "language": "English",
            "word_count": 150,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 3: English -> English Summary]")
        print("Latin chars:", counts["latin"], "Indic chars:", counts["total_indic"])
        self.assertGreater(counts["latin"], 200, "Summary must be in English.")
        self.assertLessEqual(counts["total_indic"], 0, "English summary must not contain Indic scripts.")
        self.assertEqual(res["language"], "English")

    def test_04_tamil_article_to_english_summary(self):
        payload = {
            "document_id": self.tamil_doc["id"],
            "language": "English",
            "word_count": 100,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 4: Tamil -> English Summary]")
        print("Latin chars:", counts["latin"], "| Indic chars:", counts["total_indic"], "| Content:", content[:120])
        self.assertGreater(counts["latin"], 150, "Tamil article must produce English summary.")
        self.assertEqual(counts["total_indic"], 0, "Output should not retain Tamil when English is selected.")
        self.assertIn("machine learning", content.lower())

    def test_05_tamil_article_to_hindi_summary(self):
        payload = {
            "document_id": self.tamil_doc["id"],
            "language": "Hindi",
            "word_count": 100,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 5: Tamil -> Hindi Summary]")
        print("Hindi chars:", counts["hindi"], "| Tamil chars:", counts["tamil"], "| Content:", content[:120])
        self.assertGreater(counts["hindi"], 150, "Tamil article must produce Hindi Devanagari summary.")
        self.assertEqual(counts["tamil"], 0, "Output should not retain Tamil script.")

    def test_06_english_article_to_malayalam_summary(self):
        payload = {
            "document_id": self.eng_doc["id"],
            "language": "Malayalam",
            "word_count": 150,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 6: English -> Malayalam Summary]")
        print("Malayalam chars:", counts["malayalam"], "| Content preview:", content[:100])
        self.assertGreater(counts["malayalam"], 200, "Summary must be in Malayalam Unicode script.")
        self.assertEqual(res["language"], "Malayalam")

    def test_07_english_article_to_telugu_summary(self):
        payload = {
            "document_id": self.eng_doc["id"],
            "language": "Telugu",
            "word_count": 150,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 7: English -> Telugu Summary]")
        print("Telugu chars:", counts["telugu"], "| Content preview:", content[:100])
        self.assertGreater(counts["telugu"], 200, "Summary must be in Telugu Unicode script.")
        self.assertEqual(res["language"], "Telugu")

    def test_08_english_article_to_kannada_summary(self):
        payload = {
            "document_id": self.eng_doc["id"],
            "language": "Kannada",
            "word_count": 150,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 8: English -> Kannada Summary]")
        print("Kannada chars:", counts["kannada"], "| Content preview:", content[:100])
        self.assertGreater(counts["kannada"], 200, "Summary must be in Kannada Unicode script.")
        self.assertEqual(res["language"], "Kannada")

    def test_09_english_article_to_tanglish_summary(self):
        payload = {
            "document_id": self.eng_doc["id"],
            "language": "Tanglish",
            "word_count": 150,
            "format_style": "Paragraph",
            "user_level": "Student"
        }
        res = make_request("/api/summary/generate", method="POST", data=payload)
        content = res["content"]
        counts = count_scripts(content)
        print("\n[TEST 9: English -> Tanglish Summary]")
        print("Latin chars:", counts["latin"], "| Tamil chars:", counts["tamil"], "| Content preview:", content[:100])
        self.assertEqual(counts["tamil"], 0, "Tanglish must NOT contain Tamil Unicode characters.")
        self.assertGreater(counts["latin"], 200, "Tanglish must be written using Roman letters.")
        self.assertEqual(res["language"], "Tanglish")
        self.assertTrue(any(w in content.lower() for w in ["indha", "mukkiyamana", "katturai", "adhavadhu"]))


if __name__ == "__main__":
    unittest.main()

