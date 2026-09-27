import React, { useState } from 'react';
import {
  Languages,
  Copy,
  Check,
  Download,
  RefreshCw,
  FileText,
  Globe,
  AlertCircle,
  RotateCcw,
  ArrowRightLeft,
  BookOpen
} from 'lucide-react';
import { translateText, exportContent } from '../services/api';

const supportedLanguages = [
  { code: 'ta', name: 'Tamil', label: 'Tamil (தமிழ்)' },
  { code: 'hi', name: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'en', name: 'English', label: 'English' },
  { code: 'ml', name: 'Malayalam', label: 'Malayalam (മലയാളം)' },
  { code: 'te', name: 'Telugu', label: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'tanglish', name: 'Tanglish', label: 'Tanglish (Romanized)' },
  { code: 'es', name: 'Spanish', label: 'Spanish (Español)' },
  { code: 'fr', name: 'French', label: 'French (Français)' },
  { code: 'de', name: 'German', label: 'German (Deutsch)' },
];

const sourceLanguages = [
  { code: 'auto', name: 'Auto', label: 'Auto-Detect (தானியங்கி)' },
  { code: 'en', name: 'English', label: 'English' },
  { code: 'ta', name: 'Tamil', label: 'Tamil (தமிழ்)' },
  { code: 'hi', name: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'ml', name: 'Malayalam', label: 'Malayalam (മലയാളം)' },
  { code: 'te', name: 'Telugu', label: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'tanglish', name: 'Tanglish', label: 'Tanglish' },
];

const sampleTexts = {
  English: 'Artificial intelligence is transforming many industries. Machine learning is a branch of artificial intelligence. It focuses on using data and algorithms to imitate the way that humans learn, gradually improving its accuracy.',
  Tamil: 'செயற்கை நுண்ணறிவு பல தொழில்களை மாற்றி வருகிறது. இயந்திர கற்றல் என்பது செயற்கை நுண்ணறிவின் ஒரு முக்கியமான கிளையாகும்.',
  Hindi: 'आर्टिफिशियल इंटेलिजेंस कई उद्योगों को बदल रहा है। मशीन लर्निंग आर्टिफिशियल इंटेलिजेंस (कृत्रिम बुद्धिमत्ता) की एक शाखा है।'
};

export default function TranslatePage({ activeDoc, documents = [], setActiveDocId }) {
  const [scope, setScope] = useState('custom'); // 'custom', 'full', 'page'
  const [sourceLanguage, setSourceLanguage] = useState('Auto');
  const [targetLanguage, setTargetLanguage] = useState('Tamil');
  const [customText, setCustomText] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Swap source and target languages if source is not Auto
  const handleSwapLanguages = () => {
    if (sourceLanguage === 'Auto') return;
    const oldSource = sourceLanguage;
    const oldTarget = targetLanguage;
    setSourceLanguage(oldTarget);
    setTargetLanguage(oldSource);
  };

  const handleReset = () => {
    setCustomText('');
    setResult(null);
    setErrorMessage('');
    setLoading(false);
  };

  const handleTranslate = async () => {
    setErrorMessage('');
    setResult(null);

    // Validation
    if (scope === 'custom' && !customText.trim()) {
      setErrorMessage('Please enter or paste some text to translate.');
      return;
    }

    if ((scope === 'full' || scope === 'page') && !activeDoc) {
      setErrorMessage('No document is selected. Please select a document or switch to Custom Text.');
      return;
    }

    setLoading(true);

    const payload = {
      target_language: targetLanguage,
      targetLanguage: targetLanguage,
      source_language: sourceLanguage,
      sourceLanguage: sourceLanguage,
    };

    if (scope === 'custom') {
      payload.text = customText.trim();
    } else if (scope === 'page') {
      payload.document_id = activeDoc.id;
      payload.page_number = parseInt(pageNumber, 10) || 1;
    } else {
      payload.document_id = activeDoc.id;
    }

    console.log('[Frontend Translate] Sending payload:', payload);

    try {
      const res = await translateText(payload);
      console.log('[Frontend Translate] Success:', res.data);
      if (res.data && res.data.translated_text) {
        setResult(res.data);
      } else {
        setErrorMessage('Received empty response from translation service.');
      }
    } catch (err) {
      console.error('[Frontend Translate Error]', err);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        `Translation into ${targetLanguage} could not be completed. Please try again.`;
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.translated_text) return;
    try {
      navigator.clipboard.writeText(result.translated_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleExport = async (format) => {
    if (!result?.translated_text) return;
    try {
      const docTitle = activeDoc?.title || 'Translation';
      await exportContent(
        `${docTitle} - Translated (${targetLanguage})`,
        result.translated_text,
        format,
        docTitle
      );
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const totalPages = activeDoc?.page_count || 1;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 text-blue-600 dark:text-cyan-400 border border-blue-200/50 dark:border-cyan-800/50">
            <Languages className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
          </span>
          <span>AI Document & Text Translation</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Full structural translation supporting Tamil, Hindi, Malayalam, Telugu, Kannada, Tanglish, and English while preserving headings, paragraphs, and formatting.
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-0.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Strip */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100/80 dark:border-cyan-950/60 shadow-xs space-y-4">
        {/* Scope Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-semibold">
            {[
              { id: 'custom', label: 'Custom Text / Excerpt' },
              { id: 'full', label: 'Full Document' },
              { id: 'page', label: 'Single Page' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setScope(s.id);
                  setErrorMessage('');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  scope === s.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-blue-700 dark:text-slate-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Document selection helper if in document scope */}
          {scope !== 'custom' && documents.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Document:</span>
              <select
                value={activeDoc?.id || ''}
                onChange={(e) => setActiveDocId && setActiveDocId(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Page Picker if scope === page */}
          {scope === 'page' && activeDoc && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Page:</span>
              <select
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>Page {p}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Language Selection Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {/* Source Language */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">From:</span>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {sourceLanguages.map((l) => (
                <option key={l.code} value={l.name}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapLanguages}
            disabled={sourceLanguage === 'Auto'}
            title={sourceLanguage === 'Auto' ? 'Cannot swap Auto-detect' : 'Swap languages'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          {/* Target Language */}
          <div className="flex items-center gap-2 text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-slate-500 font-medium">To (Target):</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.name}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Reset / Clear Button */}
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={loading || (scope === 'custom' && !customText.trim()) || (scope !== 'custom' && !activeDoc)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              {loading ? 'Translating...' : 'Translate Now'}
            </button>
          </div>
        </div>

        {/* Input Area */}
        {scope === 'custom' ? (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Enter or paste content below:</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => setCustomText(sampleTexts.English)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600"
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setCustomText(sampleTexts.Tamil)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/40 hover:text-cyan-600"
                >
                  Tamil
                </button>
                <button
                  type="button"
                  onClick={() => setCustomText(sampleTexts.Hindi)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-900/40 hover:text-sky-600"
                >
                  Hindi
                </button>
              </div>
            </div>
            <textarea
              rows={5}
              placeholder="Paste or type text to translate..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
            <div className="flex justify-between text-[11px] text-slate-400 px-1">
              <span>Characters: {customText.length} | Words: {customText.trim() ? customText.trim().split(/\s+/).length : 0}</span>
              {customText && (
                <button
                  type="button"
                  onClick={() => setCustomText('')}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-100 to-cyan-100 dark:from-blue-950/60 dark:to-cyan-950/60 flex items-center justify-center text-blue-600 dark:text-cyan-400 font-bold border border-blue-200/50 dark:border-cyan-800/50">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeDoc ? activeDoc.title : 'No document selected'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeDoc
                    ? `${scope === 'page' ? `Translating Page ${pageNumber} of ${totalPages}` : `Translating Entire Document (${totalPages} pages)`}`
                    : 'Please select a document or use Custom Text mode.'}
                </p>
              </div>
            </div>
            {!activeDoc && (
              <button
                onClick={() => setScope('custom')}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold"
              >
                Switch to Custom Text
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4 animate-pulse">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/60 rounded" />
            <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-700/60 rounded" />
            <div className="h-3 w-4/6 bg-slate-100 dark:bg-slate-700/60 rounded" />
          </div>
          <p className="text-center text-xs text-blue-600 dark:text-cyan-400 font-medium pt-2 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Generating complete translation in {targetLanguage}...
          </p>
        </div>
      )}

      {/* Result Section */}
      {!loading && result && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-cyan-950/60 shadow-xs space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Translation into {result.target_language}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/60 dark:to-cyan-950/60 text-blue-700 dark:text-cyan-300 font-medium border border-blue-200/50 dark:border-cyan-800/50">
                Structure Preserved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:border-blue-300 transition-all font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/60 dark:to-cyan-950/60 text-blue-700 dark:text-cyan-300 font-semibold hover:border-cyan-300 border border-blue-200 dark:border-cyan-800 transition-all shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-all"
              >
                TXT
              </button>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900 border border-blue-100/60 dark:border-slate-800 font-sans">
            {result.translated_text}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40">
          <Languages className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Ready to Translate
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Choose Custom Text, Full Document, or Single Page, select your target language, and click "Translate Now".
          </p>
        </div>
      )}
    </div>
  );
}
