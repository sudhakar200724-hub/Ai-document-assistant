import os
import json
import httpx
from typing import Dict, Any, List, Optional
from core.config import config
from ai.demo_service import DemoIntelligenceService
from core.languages import (
    normalize_language, get_script_name, validate_language_text,
    LANG_TAMIL, LANG_HINDI, LANG_MALAYALAM, LANG_TELUGU, LANG_KANNADA,
    LANG_TANGLISH, LANG_ENGLISH
)


class LLMService:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=45.0)

    def _build_summary_prompt(
        self,
        document_text: str,
        user_level: str,
        purpose: str,
        language: str,
        word_count: int,
        format_style: str,
        time_limit: Optional[str] = None,
        is_retry: bool = False
    ) -> str:
        canonical_lang = normalize_language(language)
        script_name = get_script_name(canonical_lang)

        retry_notice = ""
        if is_retry:
            retry_notice = (
                f"\nCRITICAL RETRY WARNING: Your previous response was REJECTED because it was returned in the wrong language or contained excessive English sentences. "
                f"You MUST strictly generate ALL fields (\"content\", \"key_points\", \"important_concepts\") ENTIRELY in {canonical_lang} using {script_name}. "
                f"Do not mix languages or leave English sentences in the output.\n"
            )

        # Multi-page context extraction: provide full text or strategic coverage
        if len(document_text) <= 40000:
            full_doc_context = document_text
        else:
            part = 13000
            full_doc_context = (
                document_text[:part]
                + "\n\n[... Multi-page document content continues: middle sections ...]\n\n"
                + document_text[len(document_text)//2 - part//2 : len(document_text)//2 + part//2]
                + "\n\n[... Multi-page document content continues: concluding sections ...]\n\n"
                + document_text[-part:]
            )

        clean_format = (format_style or "paragraph").strip().lower().replace(" ", "_").replace("-", "_")
        if "bullet" in clean_format:
            format_type = "bullet_points"
            format_directive = f"""
======================================================================
CRITICAL OUTPUT FORMAT REQUIREMENT — BULLET POINTS:
Generate the summary as bullet points.

Each key point must be a separate bullet.
Do not return one continuous paragraph.
Do not combine all points into a paragraph.

Return 5-10 concise bullet points depending on the document length.
Each bullet point MUST start with '• '.

{"Generate the bullet points completely in " + canonical_lang + "." if canonical_lang != "English" else ""}

Example expected output format for 'content':
• Point 1 in {canonical_lang}
• Point 2 in {canonical_lang}
• Point 3 in {canonical_lang}
• Point 4 in {canonical_lang}
• Point 5 in {canonical_lang}

Do NOT return:
"Point 1 Point 2 Point 3..." as one large continuous paragraph!
======================================================================
"""
        elif "takeaway" in clean_format:
            format_type = "key_takeaways"
            format_directive = f"""
======================================================================
CRITICAL OUTPUT FORMAT REQUIREMENT — KEY TAKEAWAYS:
Generate the summary structured as distinct, numbered Key Takeaways.
Number each takeaway (e.g. '1. **[Takeaway Title]**: [Explanation]').
{"Generate all takeaways completely in " + canonical_lang + "." if canonical_lang != "English" else ""}
======================================================================
"""
        elif "exec" in clean_format:
            format_type = "executive_summary"
            format_directive = f"""
======================================================================
CRITICAL OUTPUT FORMAT REQUIREMENT — EXECUTIVE SUMMARY:
Generate the summary structured as an Executive Briefing:
- **Executive Overview**: High-level summary of core findings.
- **Key Strategic Insights**: Core observations and evidence.
- **Actionable Conclusion**: Practical takeaways for {purpose}.
{"Generate the entire executive summary completely in " + canonical_lang + "." if canonical_lang != "English" else ""}
======================================================================
"""
        else:
            format_type = "paragraph"
            format_directive = f"""
======================================================================
CRITICAL OUTPUT FORMAT REQUIREMENT — PARAGRAPH:
Generate the summary as cohesive, well-crafted, continuous paragraphs written completely in {canonical_lang}.
======================================================================
"""

        return f"""{retry_notice}You are an expert AI Document Intelligence & Learning Assistant.

======================================================================
CRITICAL TARGET LANGUAGE DIRECTIVE:
The user has explicitly selected the Target Language: {canonical_lang}.
The source document may be written in English or another language.
YOU MUST GENERATE THE ENTIRE SUMMARY STRICTLY AND NATURALLY IN {canonical_lang}.
DO NOT generate the output in the source document's language.
DO NOT MIX LANGUAGES.
DO NOT output English sentences with a few {canonical_lang} words.
EVERY SINGLE SENTENCE IN 'content' MUST BE FULLY COMPOSED IN {canonical_lang} USING {script_name}.
EVERY BULLET IN 'key_points' MUST BE WRITTEN IN {canonical_lang}.
EVERY ITEM IN 'important_concepts' MUST BE WRITTEN IN {canonical_lang}.
Only proper nouns, standard acronyms (e.g. AI, GPU), URLs, or code may appear in Latin script.
The target word count of approximately {word_count} words applies to the final {canonical_lang} output.
======================================================================

Source Document Text (Multi-page comprehensive text):
\"\"\"{full_doc_context}\"\"\"

Task Specifications:
- Target Language: {canonical_lang} (Write 100% in {script_name})
- User Knowledge Level: {user_level} (Adapt the complexity, tone, and terminology accordingly)
- Reading Purpose: {purpose} (Highlight what matters most for this goal)
- Target Word Count: approximately {word_count} words in {canonical_lang}
- Format Style: {format_type}
{f"- Time-based depth: tailored for a {time_limit} read" if time_limit else ""}

{format_directive}

CRITICAL GROUNDING & FIDELITY:
- You must summarize ONLY the document content provided above.
- Do NOT introduce information from your general knowledge.
- Do NOT invent facts, sample scenarios, or external citations.
- Do NOT use information from any other document.
- If the provided document content is insufficient, state that clearly.
- Preserve the meaning, important facts, numbers, names, dates, and technical information from the original document.
- Do NOT shorten the content just because the target language is different.
- Maintain the requested summary length/detail in {canonical_lang}.

Return ONLY a valid JSON object with the following schema:
{{
  "content": "The formatted summary text written ENTIRELY in {canonical_lang}",
  "format_style": "{format_type}",
  "bullet_points": [
    "Bullet 1 written in {canonical_lang}",
    "Bullet 2 written in {canonical_lang}",
    "Bullet 3 written in {canonical_lang}",
    "Bullet 4 written in {canonical_lang}",
    "Bullet 5 written in {canonical_lang}"
  ],
  "key_points": [
    "Key point 1 written in {canonical_lang}",
    "Key point 2 written in {canonical_lang}",
    "Key point 3 written in {canonical_lang}",
    "Key point 4 written in {canonical_lang}",
    "Key point 5 written in {canonical_lang}"
  ],
  "important_concepts": [
    "Concept 1 in {canonical_lang}",
    "Concept 2 in {canonical_lang}",
    "Concept 3 in {canonical_lang}"
  ],
  "source_pages": [1, 2]
}}
"""

    def _normalize_summary_result(self, result: Dict[str, Any], format_type: str, canonical_lang: str) -> Dict[str, Any]:
        import re
        result["format_style"] = format_type
        content = (result.get("content") or "").strip()

        if format_type == "bullet_points":
            bullets = result.get("bullet_points")
            if not isinstance(bullets, list) or len(bullets) == 0:
                extracted = []
                for line in content.splitlines():
                    line_str = line.strip()
                    if not line_str:
                        continue
                    cleaned = re.sub(r'^[•\-\*\d\.\)\s]+', '', line_str).strip()
                    if cleaned:
                        extracted.append(cleaned)
                if not extracted and content:
                    sents = [s.strip() for s in re.split(r'[\.\!\?]\s+', content) if len(s.strip()) > 5]
                    extracted = sents if sents else [content]
                bullets = extracted

            clean_bullets = [re.sub(r'^[•\-\*\d\.\)\s]+', '', b).strip() for b in bullets if b and b.strip()]
            result["bullet_points"] = clean_bullets
            result["content"] = "\n".join(f"• {b}" for b in clean_bullets)
        else:
            result["bullet_points"] = None

        return result

    async def generate_summary(
        self,
        document_text: str,
        user_level: str = "Student",
        purpose: str = "Quick Understanding",
        language: str = "English",
        word_count: int = 200,
        format_style: str = "paragraph",
        time_limit: Optional[str] = None
    ) -> Dict[str, Any]:
        canonical_lang = normalize_language(language)
        provider = config.active_provider

        clean_format = (format_style or "paragraph").strip().lower().replace(" ", "_").replace("-", "_")
        if "bullet" in clean_format:
            format_type = "bullet_points"
        elif "takeaway" in clean_format:
            format_type = "key_takeaways"
        elif "exec" in clean_format:
            format_type = "executive_summary"
        else:
            format_type = "paragraph"

        # Check if live AI is configured
        if provider == "demo" or not (config.gemini_api_key or config.openai_api_key):
            res = DemoIntelligenceService.generate_summary(
                text=document_text,
                user_level=user_level,
                purpose=purpose,
                language=canonical_lang,
                word_count=word_count,
                format_style=format_type,
                time_limit=time_limit
            )
            return self._normalize_summary_result(res, format_type, canonical_lang)

        # Live LLM provider path
        prompt = self._build_summary_prompt(
            document_text=document_text,
            user_level=user_level,
            purpose=purpose,
            language=canonical_lang,
            word_count=word_count,
            format_style=format_type,
            time_limit=time_limit,
            is_retry=False
        )

        response_text = await self._call_llm(prompt)
        parsed = self._extract_json(response_text)

        if parsed and "content" in parsed and self.validate_language_output(parsed["content"], canonical_lang):
            return self._normalize_summary_result(parsed, format_type, canonical_lang)

        # Validation failed or bad JSON: retry once with escalated prompt
        print(f"[LLM SUMMARY] Output validation failed for language '{canonical_lang}'. Retrying once with escalated prompt...")
        retry_prompt = self._build_summary_prompt(
            document_text=document_text,
            user_level=user_level,
            purpose=purpose,
            language=canonical_lang,
            word_count=word_count,
            format_style=format_type,
            time_limit=time_limit,
            is_retry=True
        )

        response_retry = await self._call_llm(retry_prompt)
        parsed_retry = self._extract_json(response_retry)

        if parsed_retry and "content" in parsed_retry and self.validate_language_output(parsed_retry["content"], canonical_lang):
            return self._normalize_summary_result(parsed_retry, format_type, canonical_lang)

        # If LLM still fails after retry, use the native multilingual generation engine
        print(f"[LLM SUMMARY] LLM failed language validation after retry. Falling back to native multilingual engine.")
        demo_res = DemoIntelligenceService.generate_summary(
            text=document_text,
            user_level=user_level,
            purpose=purpose,
            language=canonical_lang,
            word_count=word_count,
            format_style=format_type,
            time_limit=time_limit
        )
        return self._normalize_summary_result(demo_res, format_type, canonical_lang)

    async def explain_concept(
        self,
        concept: str,
        document_text: str,
        user_level: str = "Student",
        language: str = "English",
        is_real_doc: bool = True
    ) -> Dict[str, Any]:
        canonical_lang = normalize_language(language)
        refusal_msg = "இந்த ஆவணத்தில் இந்தக் கேள்விக்கான போதுமான தகவல் இல்லை." if canonical_lang == "Tamil" else "The document does not contain enough information to answer this question."

        prompt = f"""You are a document-grounded explanation assistant.

SELECTED DOCUMENT:
\"\"\"{document_text[:6000]}\"\"\"

USER CONCEPT / QUESTION:
"{concept}"

TARGET LANGUAGE:
{canonical_lang}

EXPLANATION DEPTH:
{user_level}

RULES:
1. Answer ONLY the user's actual concept/question based strictly on the selected document.
2. Use ONLY facts directly mentioned in the selected document. Do not invent facts or use outside knowledge.
3. Do not use another document. Do not generate a generic summary. Do not reuse a previous answer.
4. Acronyms & Short Terms: Recognize document-defined acronyms (e.g. DL for Deep Learning, ML for Machine Learning, AI for Artificial Intelligence). Follow the document's definitions.
5. Question Intent: Differentiate between definition questions ("What is DL?", "DL"), mechanism questions ("How does DL work?"), advantage questions ("What are the advantages of DL?"), purpose questions ("What is the main purpose of DL?"), and comparison questions ("What is the difference between ML and DL?"). Give specific answers reflecting the exact question angle.
6. If the document does not provide enough information to answer the question, say exactly:
   "{refusal_msg}"
7. Target Language Enforcement: Write natural, fluent, and grammatical {canonical_lang}.
   - If {canonical_lang} is Tamil: The explanation MUST be written completely and naturally in Tamil. Do NOT mix English sentences into Tamil. Technical abbreviations/proper names (e.g. DL, AI, ML, CNN, ChatGPT, Claude) can remain in Latin script.
8. Difficult Terms: Identify 2-3 genuine technical terms from the document context. For each term, explain its meaning strictly based on the document in {canonical_lang}. Do NOT use placeholder text or generic descriptions. If no difficult terms exist, return an empty list.

Generate these sections and return ONLY a valid JSON object:
{{
  "concept": "{concept}",
  "simple_explanation": "Direct factual answer to the specific question in {canonical_lang}",
  "real_world_example": "Context-specific application directly based on document facts in {canonical_lang} (or empty string if not enough information)",
  "why_it_matters": "Direct significance based on document facts in {canonical_lang} (or empty string if not enough information)",
  "difficult_concepts_breakdown": [
    {{"term": "Technical term from context", "explanation": "Meaning based on document in {canonical_lang}"}}
  ],
  "source_pages": [1]
}}
"""
        response_text = await self._call_llm(prompt)
        parsed = self._extract_json(response_text)
        if parsed and "simple_explanation" in parsed:
            # Clean up concept if needed
            parsed["concept"] = concept
            if "source_pages" not in parsed or not parsed["source_pages"]:
                parsed["source_pages"] = [1]
            return parsed

        return DemoIntelligenceService.explain_concept(concept, document_text, user_level, canonical_lang)

    async def paraphrase(
        self,
        text: str,
        mode: str = "Professional",
        length_option: str = "Same length",
        language: str = "English"
    ) -> str:
        provider = config.active_provider
        if provider == "demo" or not (config.gemini_api_key or config.openai_api_key):
            return DemoIntelligenceService.paraphrase_text(text, mode, length_option, language)

        prompt = f"""
Paraphrase the following text:
\"{text}\"

Rules:
- Mode: {mode} (Simple, Professional, Academic, Formal, Casual)
- Length: {length_option} (Shorter, Same length, More detailed)
- Language: {language}
- CRITICAL: Preserve the original meaning exactly. Do NOT introduce unsupported facts.
- Output ONLY the paraphrased text without introductory remarks.
"""
        result = await self._call_llm(prompt)
        return result.strip() if result else DemoIntelligenceService.paraphrase_text(text, mode, length_option, language)

    def validate_language_output(self, text: str, target_language: str) -> bool:
        """
        Validate that LLM or translator output matches target script/language specifications.
        Uses strict Unicode script ratios and English sentence rejection.
        """
        is_valid, reason = validate_language_text(text, target_language)
        if not is_valid:
            print(f"[LANGUAGE VALIDATION] Rejected for {target_language}: {reason}")
        return is_valid

    def _build_translation_prompt(
        self,
        text: str,
        target_language: str,
        is_retry: bool = False,
        source_language: str = "Auto"
    ) -> str:
        canonical = normalize_language(target_language)
        script_desc = get_script_name(canonical)

        retry_notice = ""
        if is_retry:
            retry_notice = f"\nCRITICAL RETRY WARNING: Your previous response was REJECTED because it was returned in the wrong language or script. You MUST strictly output 100% in {canonical} using {script_desc}.\n"

        src_phrase = f" from {source_language}" if source_language and source_language.lower() != "auto" else ""

        if canonical == "Tanglish":
            script_instruction = (
                "- Output MUST be in Tanglish (Tamil language written using English/Roman characters).\n"
                "- Do NOT use Tamil Unicode script characters.\n"
                "- Use English/Roman characters only."
            )
        elif canonical == "English":
            script_instruction = (
                "- Output MUST be in natural, grammatically correct English.\n"
                "- Use English Latin characters only."
            )
        else:
            script_instruction = (
                f"- Output MUST be written in {canonical} using {script_desc}.\n"
                f"- Every sentence must be translated into {canonical}.\n"
                f"- Do NOT return sentences in the source language."
            )

        return f"""{retry_notice}You are a translation system.
Translate the COMPLETE input text{src_phrase} to the target language.
Target language: {canonical}
Preserve the original meaning, facts, numbers, dates, and technical terms.
Do NOT summarize.
Do NOT explain.
Do NOT add introductory or concluding remarks.
Do NOT mix source and target languages.
Return ONLY the translated text.

{script_instruction}

Content to translate:
\"\"\"{text}\"\"\"
"""

    def _chunk_text_for_translation(self, text: str, max_chunk_chars: int = 2500) -> List[str]:
        if len(text) <= max_chunk_chars:
            return [text]

        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_len = 0

        for p in paragraphs:
            p_len = len(p)
            if current_len + p_len + 2 > max_chunk_chars and current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = [p]
                current_len = p_len
            else:
                current_chunk.append(p)
                current_len += p_len + 2

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return chunks

    async def _translate_single_block(
        self,
        text: str,
        target_language: str,
        source_language: str = "Auto",
        max_retries: int = 2
    ) -> str:
        canonical = normalize_language(target_language)
        provider = config.active_provider

        if provider == "demo" or not (config.gemini_api_key or config.openai_api_key):
            demo_result = DemoIntelligenceService.translate_text(text, canonical)
            if not self.validate_language_output(demo_result, canonical):
                raise ValueError(f"Translation could not be generated in {canonical}. Please try again.")
            return demo_result

        # Live LLM translation with automatic retry
        for attempt in range(max_retries + 1):
            is_retry = (attempt > 0)
            prompt = self._build_translation_prompt(text, canonical, is_retry=is_retry, source_language=source_language)
            raw_response = await self._call_llm(prompt)
            candidate = raw_response.strip() if raw_response else ""

            if candidate and self.validate_language_output(candidate, canonical):
                return candidate

            print(f"[TRANSLATION RETRY] Attempt {attempt + 1} output failed validation for {canonical}. Retrying...")

        # If LLM failed all retries, fall back to demo service
        demo_fallback = DemoIntelligenceService.translate_text(text, canonical)
        if self.validate_language_output(demo_fallback, canonical):
            return demo_fallback

        raise ValueError(f"Translation could not be generated in {canonical}. Please try again.")

    async def translate_document(
        self,
        text: str,
        target_language: str,
        source_language: str = "Auto",
        max_retries: int = 2
    ) -> str:
        canonical = normalize_language(target_language)
        
        # If text is long (e.g. multi-page document > 3500 chars), process chunk-by-chunk to preserve complete content
        if len(text) > 3500:
            blocks = self._chunk_text_for_translation(text, max_chunk_chars=2500)
            translated_blocks = []
            for b in blocks:
                t_b = await self._translate_single_block(b, canonical, source_language=source_language, max_retries=max_retries)
                translated_blocks.append(t_b)
            return "\n\n".join(translated_blocks)
        else:
            return await self._translate_single_block(text, canonical, source_language=source_language, max_retries=max_retries)

    async def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "Auto"
    ) -> str:
        return await self.translate_document(text, target_language, source_language=source_language)

    async def chat_rag(
        self,
        question: str,
        chunks: List[Dict[str, Any]],
        language: str = "English",
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        RAG Q&A grounded strictly on retrieved chunks.
        """
        provider = config.active_provider

        # Check if chunks are sufficient
        if not chunks or max([c.get("score", 0) for c in chunks], default=0) < 0.05:
            return DemoIntelligenceService.generate_chat_answer(question, chunks, language)

        if provider == "demo" or not (config.gemini_api_key or config.openai_api_key):
            return DemoIntelligenceService.generate_chat_answer(question, chunks, language)

        context_str = "\n\n".join([
            f"[Page {c.get('page_number', 1)}]: {c.get('content', '')}"
            for c in chunks
        ])

        prompt = f"""
You are the AI Document Intelligence & Learning Assistant.
Answer the user's question STRICTLY based on the provided document excerpts.

Excerpts:
{context_str}

User Question: {question}
Target Language: {language} (If Tanglish, write in Tamil language using English letters).

CRITICAL GROUNDING RULES:
1. If the requested information is NOT contained in the excerpts above, you MUST answer EXACTLY:
   "The document does not contain enough information to answer this question."
2. Do NOT speculate or hallucinate outside the provided text.
3. Every factual assertion should cite the relevant page number in parentheses like (Page 2).

Format your response as a JSON object:
{{
  "answer": "Your grounded response text with page citations",
  "citations": [
    {{"page_number": 1, "snippet": "exact or near-exact sentence from excerpt", "relevance_score": 0.95}}
  ],
  "grounded": true
}}
"""
        response_text = await self._call_llm(prompt)
        parsed = self._extract_json(response_text)
        if parsed and "answer" in parsed:
            return parsed

        return DemoIntelligenceService.generate_chat_answer(question, chunks, language)

    async def generate_study_material(self, document_text: str, language: str = "English") -> Dict[str, Any]:
        provider = config.active_provider
        if provider == "demo" or not (config.gemini_api_key or config.openai_api_key):
            return DemoIntelligenceService.generate_study_material(document_text, language)

        prompt = f"""
Generate comprehensive Study Mode materials from this document:
\"\"\"{document_text[:7000]}\"\"\"
Language: {language}

Return a valid JSON object matching this schema:
{{
  "definitions": [{{"term": "Term Name", "definition": "Clear explanation"}}],
  "must_remember_points": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "two_mark_questions": [{{"question": "Question text?", "hint": "Brief answer hint"}}],
  "five_mark_questions": [{{"question": "Question text?", "hint": "Key points to cover"}}],
  "ten_mark_questions": [{{"question": "Question text?", "hint": "Comprehensive structure hint"}}],
  "mcqs": [
    {{
      "id": 1,
      "question": "Question text?",
      "options": [{{"label": "A", "text": "Option 1"}}, {{"label": "B", "text": "Option 2"}}, {{"label": "C", "text": "Option 3"}}, {{"label": "D", "text": "Option 4"}}],
      "correct_answer": "A",
      "explanation": "Detailed explanation why A is correct",
      "topic": "Topic Name",
      "page_number": 1
    }}
  ]
}}
"""
        response_text = await self._call_llm(prompt)
        parsed = self._extract_json(response_text)
        if parsed and "mcqs" in parsed:
            return parsed
        return DemoIntelligenceService.generate_study_material(document_text, language)

    async def generate_research_analysis(self, document_text: str, title: str) -> Dict[str, Any]:
        provider = config.active_provider
        if provider == "demo" or not (config.gemini_api_key or config.openai_api_key):
            return DemoIntelligenceService.generate_research_analysis(document_text, title)

        prompt = f"""
Analyze this research paper excerpt and extract structured academic components:
Title: {title}
Text:
\"\"\"{document_text[:8000]}\"\"\"

Return a valid JSON:
{{
  "title": "{title}",
  "authors": ["Author names"],
  "abstract": "Summary of abstract",
  "research_problem": "Core problem addressed",
  "methodology": "Detailed methodology",
  "dataset": "Datasets or benchmarks used",
  "results": "Quantitative & qualitative results",
  "limitations": "Limitations stated",
  "conclusion": "Final conclusions",
  "future_work": "Future research directions",
  "key_contributions": ["Contribution 1", "Contribution 2"]
}}
"""
        response_text = await self._call_llm(prompt)
        parsed = self._extract_json(response_text)
        if parsed and "research_problem" in parsed:
            return parsed
        return DemoIntelligenceService.generate_research_analysis(document_text, title)

    async def compare_documents(self, docs_data: List[Dict[str, str]], language: str = "English") -> Dict[str, Any]:
        if not docs_data:
            return DemoIntelligenceService.compare_documents(docs_data, language)

        doc1 = docs_data[0]
        doc2 = docs_data[1] if len(docs_data) > 1 else docs_data[0]
        doc1_title = doc1.get("title", "Document 1")
        doc2_title = doc2.get("title", "Document 2")
        doc1_text = doc1.get("text", "")
        doc2_text = doc2.get("text", "")

        canonical_lang = normalize_language(language)
        script_name = get_script_name(canonical_lang)

        prompt = f"""You are an expert AI document comparison engine.
Perform a detailed comparative analysis between the following two specific documents based ONLY on their provided text content.

DOCUMENT 1:
Title: {doc1_title}
Content:
{doc1_text[:6000]}

DOCUMENT 2:
Title: {doc2_title}
Content:
{doc2_text[:6000]}

CRITICAL INSTRUCTIONS:
1. Every comparison dimension MUST reflect the ACTUAL concepts, methods, empirical findings, and data from these specific documents.
2. DO NOT use generic placeholder text or generic comparisons.
3. Compare across these dimensions: "Core Methodology", "Key Concepts", "Dataset / Evidence", "Main Results", "Limitations", "Conclusions".
4. The output language MUST BE {canonical_lang} using {script_name}.
5. Return ONLY a valid JSON object matching the following structure:
{{
  "doc1_title": "{doc1_title}",
  "doc2_title": "{doc2_title}",
  "comparison_matrix": [
    {{"aspect": "Core Methodology", "doc1": "Document 1 specific methodology", "doc2": "Document 2 specific methodology"}},
    {{"aspect": "Key Concepts", "doc1": "Document 1 specific key concepts", "doc2": "Document 2 specific key concepts"}},
    {{"aspect": "Dataset / Evidence", "doc1": "Document 1 dataset or evidentiary basis", "doc2": "Document 2 dataset or evidentiary basis"}},
    {{"aspect": "Main Results", "doc1": "Document 1 primary findings/results", "doc2": "Document 2 primary findings/results"}},
    {{"aspect": "Limitations", "doc1": "Document 1 identified limitations", "doc2": "Document 2 identified limitations"}},
    {{"aspect": "Conclusions", "doc1": "Document 1 final conclusions", "doc2": "Document 2 final conclusions"}}
  ],
  "similarities": [
    "Specific similarity 1 grounded in both documents",
    "Specific similarity 2 grounded in both documents",
    "Specific similarity 3 grounded in both documents"
  ],
  "differences": [
    "Specific difference 1 contrasting Document 1 and Document 2",
    "Specific difference 2 contrasting Document 1 and Document 2",
    "Specific difference 3 contrasting Document 1 and Document 2"
  ],
  "unique_points": {{
    "{doc1_title}": [
      "Unique attribute or claim 1 exclusive to Document 1",
      "Unique attribute or claim 2 exclusive to Document 1"
    ],
    "{doc2_title}": [
      "Unique attribute or claim 1 exclusive to Document 2",
      "Unique attribute or claim 2 exclusive to Document 2"
    ]
  }},
  "overall_synthesis": "Comprehensive comparative summary highlighting how these two specific documents relate, diverge, and complement each other."
}}
"""
        response_text = await self._call_llm(prompt)
        parsed = self._extract_json(response_text)
        if parsed and isinstance(parsed.get("comparison_matrix"), list) and len(parsed["comparison_matrix"]) > 0:
            if not parsed.get("doc1_title"):
                parsed["doc1_title"] = doc1_title
            if not parsed.get("doc2_title"):
                parsed["doc2_title"] = doc2_title
            return parsed

        return DemoIntelligenceService.compare_documents(docs_data, language)

    async def _call_llm(self, prompt: str) -> str:
        provider = config.active_provider
        try:
            if provider == "gemini" and config.gemini_api_key:
                # Call Gemini API using active supported models
                models_to_try = ["gemini-2.5-flash-lite", "gemini-flash-lite-latest", "gemma-4-26b-a4b-it"]
                for model in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={config.gemini_api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
                    }
                    try:
                        res = await self.http_client.post(url, json=payload, timeout=20.0)
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates and "content" in candidates[0]:
                                parts = candidates[0]["content"].get("parts", [])
                                if parts and "text" in parts[0]:
                                    return parts[0]["text"]
                        else:
                            print(f"[GEMINI CALL ERROR] Model {model} status {res.status_code}")
                    except Exception as me:
                        print(f"[GEMINI CALL EXCEPTION] Model {model}: {me}")
            elif provider == "openai" and config.openai_api_key:
                # Call OpenAI API
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {config.openai_api_key}"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2
                }
                res = await self.http_client.post(url, json=payload, headers=headers, timeout=20.0)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"LLM Call error: {e}")
        return ""

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        if not text:
            return None
        try:
            # Strip markdown json blocks if present
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception:
            return None


llm_service = LLMService()
