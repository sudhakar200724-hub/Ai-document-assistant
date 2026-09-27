import re
from typing import Tuple, Dict, Any, List

# Supported languages canonical names
LANG_ENGLISH = "English"
LANG_TAMIL = "Tamil"
LANG_HINDI = "Hindi"
LANG_MALAYALAM = "Malayalam"
LANG_TELUGU = "Telugu"
LANG_KANNADA = "Kannada"
LANG_TANGLISH = "Tanglish"
LANG_SPANISH = "Spanish"
LANG_FRENCH = "French"
LANG_GERMAN = "German"

SUPPORTED_LANGUAGES = [
    LANG_ENGLISH,
    LANG_TAMIL,
    LANG_HINDI,
    LANG_MALAYALAM,
    LANG_TELUGU,
    LANG_KANNADA,
    LANG_TANGLISH,
    LANG_SPANISH,
    LANG_FRENCH,
    LANG_GERMAN,
]

# Aliases and codes mapping to canonical names
LANGUAGE_MAP: Dict[str, str] = {
    # English
    "en": LANG_ENGLISH,
    "eng": LANG_ENGLISH,
    "english": LANG_ENGLISH,
    # Tamil
    "ta": LANG_TAMIL,
    "tam": LANG_TAMIL,
    "tamil": LANG_TAMIL,
    "தமிழ்": LANG_TAMIL,
    # Hindi
    "hi": LANG_HINDI,
    "hin": LANG_HINDI,
    "hindi": LANG_HINDI,
    "हिंदी": LANG_HINDI,
    "हिन्दी": LANG_HINDI,
    # Malayalam
    "ml": LANG_MALAYALAM,
    "mal": LANG_MALAYALAM,
    "malayalam": LANG_MALAYALAM,
    "മലയാളം": LANG_MALAYALAM,
    # Telugu
    "te": LANG_TELUGU,
    "tel": LANG_TELUGU,
    "telugu": LANG_TELUGU,
    "తెలుగు": LANG_TELUGU,
    # Kannada
    "kn": LANG_KANNADA,
    "kan": LANG_KANNADA,
    "kannada": LANG_KANNADA,
    "ಕನ್ನಡ": LANG_KANNADA,
    # Tanglish
    "tanglish": LANG_TANGLISH,
    "tan": LANG_TANGLISH,
    "tamil_english": LANG_TANGLISH,
    # European
    "es": LANG_SPANISH,
    "spa": LANG_SPANISH,
    "spanish": LANG_SPANISH,
    "español": LANG_SPANISH,
    "fr": LANG_FRENCH,
    "fra": LANG_FRENCH,
    "french": LANG_FRENCH,
    "français": LANG_FRENCH,
    "de": LANG_GERMAN,
    "deu": LANG_GERMAN,
    "german": LANG_GERMAN,
    "deutsch": LANG_GERMAN,
}


def normalize_language(lang_input: str) -> str:
    """
    Normalizes any language code, localized name, or alias to canonical form.
    Defaults to 'English' if unknown.
    """
    if not lang_input:
        return LANG_ENGLISH
    cleaned = lang_input.strip().lower()
    return LANGUAGE_MAP.get(cleaned, lang_input.strip().title())


def get_script_name(canonical_lang: str) -> str:
    mapping = {
        LANG_TAMIL: "Tamil script (தமிழ் எழுத்து)",
        LANG_HINDI: "Devanagari script (देवनागरी लिपि)",
        LANG_MALAYALAM: "Malayalam script (മലയാള ലിപി)",
        LANG_TELUGU: "Telugu script (తెలుగు లిపి)",
        LANG_KANNADA: "Kannada script (ಕನ್ನಡ ಲಿಪಿ)",
        LANG_TANGLISH: "Romanized Latin alphabet (Tanglish - Tamil in English letters)",
        LANG_ENGLISH: "English Latin alphabet",
        LANG_SPANISH: "Spanish Latin alphabet",
        LANG_FRENCH: "French Latin alphabet",
        LANG_GERMAN: "German Latin alphabet",
    }
    return mapping.get(canonical_lang, f"{canonical_lang} script")


def get_language_code(canonical_lang: str) -> str:
    norm = normalize_language(canonical_lang)
    mapping = {
        LANG_ENGLISH: "en",
        LANG_TAMIL: "ta",
        LANG_HINDI: "hi",
        LANG_MALAYALAM: "ml",
        LANG_TELUGU: "te",
        LANG_KANNADA: "kn",
        LANG_TANGLISH: "tanglish",
        LANG_SPANISH: "es",
        LANG_FRENCH: "fr",
        LANG_GERMAN: "de",
    }
    return mapping.get(norm, "en")


def count_script_chars(text: str) -> Dict[str, int]:
    """Counts characters belonging to different scripts."""
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
        "total_indic": tamil + hindi + malayalam + telugu + kannada,
        "total_alpha": tamil + hindi + malayalam + telugu + kannada + latin,
    }


def validate_language_text(text: str, target_lang: str) -> Tuple[bool, str]:
    """
    Validates that text strictly conforms to the requested target language.
    Returns (is_valid, failure_reason).
    """
    if not text or not text.strip():
        return False, "Output text is empty."

    canonical = normalize_language(target_lang)
    counts = count_script_chars(text)
    total_alpha = counts["total_alpha"]

    # Short inputs (under 15 alphabet chars)
    if total_alpha < 15:
        if canonical in [LANG_TAMIL, LANG_HINDI, LANG_MALAYALAM, LANG_TELUGU, LANG_KANNADA]:
            key = canonical.lower()
            if counts[key] == 0:
                return False, f"Expected {canonical} script characters, but none were found."
            return True, "Valid"
        return True, "Valid"

    if canonical == LANG_TAMIL:
        # Must have substantial Tamil script and Latin should NOT dominate
        tamil_ratio = counts["tamil"] / total_alpha
        latin_ratio = counts["latin"] / total_alpha
        if counts["tamil"] == 0:
            return False, "Output contains zero Tamil characters."
        if tamil_ratio < 0.25 and latin_ratio > 0.60:
            return False, f"Output is predominantly English ({latin_ratio:.1%} Latin) instead of Tamil ({tamil_ratio:.1%})."
        return True, "Valid"

    elif canonical == LANG_HINDI:
        hindi_ratio = counts["hindi"] / total_alpha
        latin_ratio = counts["latin"] / total_alpha
        if counts["hindi"] == 0:
            return False, "Output contains zero Devanagari Hindi characters."
        if hindi_ratio < 0.25 and latin_ratio > 0.60:
            return False, f"Output is predominantly English ({latin_ratio:.1%} Latin) instead of Hindi ({hindi_ratio:.1%})."
        return True, "Valid"

    elif canonical == LANG_MALAYALAM:
        mal_ratio = counts["malayalam"] / total_alpha
        latin_ratio = counts["latin"] / total_alpha
        if counts["malayalam"] == 0:
            return False, "Output contains zero Malayalam characters."
        if mal_ratio < 0.25 and latin_ratio > 0.60:
            return False, f"Output is predominantly English ({latin_ratio:.1%} Latin) instead of Malayalam ({mal_ratio:.1%})."
        return True, "Valid"

    elif canonical == LANG_TELUGU:
        tel_ratio = counts["telugu"] / total_alpha
        latin_ratio = counts["latin"] / total_alpha
        if counts["telugu"] == 0:
            return False, "Output contains zero Telugu characters."
        if tel_ratio < 0.25 and latin_ratio > 0.60:
            return False, f"Output is predominantly English ({latin_ratio:.1%} Latin) instead of Telugu ({tel_ratio:.1%})."
        return True, "Valid"

    elif canonical == LANG_KANNADA:
        kan_ratio = counts["kannada"] / total_alpha
        latin_ratio = counts["latin"] / total_alpha
        if counts["kannada"] == 0:
            return False, "Output contains zero Kannada characters."
        if kan_ratio < 0.25 and latin_ratio > 0.60:
            return False, f"Output is predominantly English ({latin_ratio:.1%} Latin) instead of Kannada ({kan_ratio:.1%})."
        return True, "Valid"

    elif canonical == LANG_TANGLISH:
        # Tanglish must have NO Tamil Unicode script and use Latin characters
        if counts["tamil"] > 0:
            return False, f"Tanglish output must use Roman alphabet, but contains {counts['tamil']} Tamil Unicode characters."
        if counts["latin"] == 0:
            return False, "Tanglish output contains no Latin characters."
        return True, "Valid"

    elif canonical == LANG_ENGLISH:
        # English should have minimal or no Indic characters
        if counts["total_indic"] > 8:
            return False, f"English output contains {counts['total_indic']} non-English Indic characters."
        if counts["latin"] == 0:
            return False, "English output contains no Latin characters."
        return True, "Valid"

    return True, "Valid"
