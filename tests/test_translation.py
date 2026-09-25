import unittest
import urllib.request
import urllib.error
import json
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


BASE_URL = "http://127.0.0.1:8000"


def post_translate(payload):
    url = f"{BASE_URL}/api/translate"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            content = res.read().decode("utf-8")
            return json.loads(content), res.status
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return json.loads(content), e.code
        except Exception:
            return content, e.code


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


class TestTranslationEndToEnd(unittest.TestCase):
    eng_input = "Machine learning is a branch of artificial intelligence."
    tam_input = "இயந்திர கற்றல் என்பது செயற்கை நுண்ணறிவின் ஒரு முக்கியமான கிளையாகும்."
    hin_input = "मशीन लर्निंग आर्टिफिशियल इंटेलिजेंस (कृत्रिम बुद्धिमत्ता) की एक शाखा है।"

    def test_01_english_to_tamil(self):
        """Case 1: English -> Tamil translation produces natural Tamil Unicode script."""
        payload = {"text": self.eng_input, "target_language": "Tamil"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 1 - English -> Tamil]:\n{translated}")
        counts = count_scripts(translated)
        self.assertGreater(counts["tamil"], 10, "Tamil translation must contain Tamil Unicode characters")
        self.assertIn("இயந்திர கற்றல்", translated)
        self.assertEqual(data["target_language"], "Tamil")

    def test_02_english_to_hindi(self):
        """Case 2: English -> Hindi translation produces Hindi Devanagari script."""
        payload = {"text": self.eng_input, "target_language": "Hindi"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 2 - English -> Hindi]:\n{translated}")
        counts = count_scripts(translated)
        self.assertGreater(counts["hindi"], 10, "Hindi translation must contain Devanagari Unicode characters")
        self.assertTrue("मशीन लर्निंग" in translated or "कृत्रिम बुद्धिमत्ता" in translated)
        self.assertEqual(data["target_language"], "Hindi")

    def test_03_tamil_to_english(self):
        """Case 3: Tamil -> English translation produces English text with 0 Indic script."""
        payload = {"text": self.tam_input, "target_language": "English"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 3 - Tamil -> English]:\n{translated}")
        counts = count_scripts(translated)
        self.assertGreater(counts["latin"], 20, "English translation must contain Latin characters")
        self.assertEqual(counts["total_indic"], 0, "English translation must contain no Indic script")
        self.assertIn("machine learning", translated.lower())
        self.assertEqual(data["target_language"], "English")

    def test_04_hindi_to_tamil(self):
        """Case 4: Hindi -> Tamil translation produces Tamil Unicode with 0 Devanagari."""
        payload = {"text": self.hin_input, "target_language": "Tamil"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 4 - Hindi -> Tamil]:\n{translated}")
        counts = count_scripts(translated)
        self.assertGreater(counts["tamil"], 10, "Tamil output must contain Tamil Unicode script")
        self.assertEqual(counts["hindi"], 0, "Tamil output must not retain Hindi Devanagari script")
        self.assertIn("இயந்திர கற்றல்", translated)
        self.assertEqual(data["target_language"], "Tamil")

    def test_05_english_to_malayalam(self):
        """Case 5: English -> Malayalam translation produces Malayalam Unicode script."""
        payload = {"text": self.eng_input, "target_language": "Malayalam"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 5 - English -> Malayalam]:\n{translated}")
        counts = count_scripts(translated)
        self.assertGreater(counts["malayalam"], 10, "Malayalam translation must contain Malayalam Unicode script")
        self.assertEqual(data["target_language"], "Malayalam")

    def test_06_english_to_telugu(self):
        """Case 6: English -> Telugu translation produces Telugu Unicode script."""
        payload = {"text": self.eng_input, "target_language": "Telugu"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 6 - English -> Telugu]:\n{translated}")
        counts = count_scripts(translated)
        self.assertGreater(counts["telugu"], 10, "Telugu translation must contain Telugu Unicode script")
        self.assertEqual(data["target_language"], "Telugu")

    def test_07_english_to_kannada(self):
        """Case 7: English -> Kannada translation produces Kannada Unicode script."""
        payload = {"text": self.eng_input, "target_language": "Kannada"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 7 - English -> Kannada]:\n{translated}")
        counts = count_scripts(translated)
        self.assertGreater(counts["kannada"], 10, "Kannada translation must contain Kannada Unicode script")
        self.assertEqual(data["target_language"], "Kannada")

    def test_08_empty_input_handling(self):
        """Edge Case: Empty input returns 400 Bad Request with descriptive message, not crashing."""
        payload = {"text": "   ", "target_language": "Tamil"}
        data, status = post_translate(payload)
        self.assertEqual(status, 400)
        self.assertIn("detail", data)
        print(f"\n[TEST 8 - Empty Input Expected Error]: {data['detail']}")

    def test_09_long_text_and_structure_preservation(self):
        """Document translation: Long text preserves headings and bullet formatting in target language."""
        multi_paragraph_text = """# Model Architecture

The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.

- Multi-Head Attention: Multi-head attention allows the model to jointly attend to information from different representation subspaces.
- Encoder: The encoder maps an input sequence to continuous representations.
- Decoder: The decoder generates an output sequence one element at a time."""

        payload = {"text": multi_paragraph_text, "target_language": "Tamil"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 9 - Multi-paragraph Structured Output]:\n{translated[:250]}...")
        self.assertTrue("# " in translated, "Headings must be preserved")
        self.assertTrue("- " in translated, "Bullet points must be preserved")
        counts = count_scripts(translated)
        self.assertGreater(counts["tamil"], 40, "All segments should be in Tamil")

    def test_10_tanglish_translation(self):
        """Tanglish: Romanized Tamil without Tamil Unicode script."""
        payload = {"text": self.eng_input, "target_language": "Tanglish"}
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        translated = data["translated_text"]
        print(f"\n[TEST 10 - Tanglish Output]:\n{translated}")
        counts = count_scripts(translated)
        self.assertEqual(counts["tamil"], 0, "Tanglish must contain 0 Tamil script")
        self.assertGreater(counts["latin"], 10)
        self.assertIn("enbadhu", translated.lower())

    def test_11_language_code_and_alias_handling(self):
        """Language code mapping: 'ta', 'hi', 'en', 'ml', 'te', 'kn' mapped correctly."""
        # Test code 'ta'
        payload1 = {"text": self.eng_input, "target_language": "ta"}
        data1, status1 = post_translate(payload1)
        self.assertEqual(status1, 200)
        self.assertEqual(data1["target_language"], "Tamil")

        # Test camelCase alias targetLanguage
        payload2 = {"text": self.eng_input, "targetLanguage": "Hindi"}
        data2, status2 = post_translate(payload2)
        self.assertEqual(status2, 200)
        self.assertEqual(data2["target_language"], "Hindi")

    def test_12_document_id_translation(self):
        """Document ID translation: Fetches clean text or chunk and translates into target language."""
        # 1. Fetch available documents
        req = urllib.request.Request(f"{BASE_URL}/api/documents")
        with urllib.request.urlopen(req) as res:
            docs = json.loads(res.read().decode())
        doc_id = docs[0]["id"]

        payload = {
            "document_id": doc_id,
            "target_language": "Tamil",
            "page_number": 1
        }
        data, status = post_translate(payload)
        self.assertEqual(status, 200)
        self.assertIn("translated_text", data)
        counts = count_scripts(data["translated_text"])
        self.assertGreater(counts["tamil"], 20, "Document translation must produce Tamil script")


if __name__ == "__main__":
    unittest.main()
