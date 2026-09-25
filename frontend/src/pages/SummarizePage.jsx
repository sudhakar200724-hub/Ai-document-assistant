import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Clock,
  User,
  Target,
  Globe,
  Sliders,
  Copy,
  Download,
  Check,
  RefreshCw,
  FileText,
  Volume2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { generateSummary, getDocumentSummaries, exportContent } from '../services/api';
import AudioPlayer from '../components/common/AudioPlayer';

export default function SummarizePage({ activeDoc, selectedLanguage }) {
  const [summaryMode, setSummaryMode] = useState('standard'); // standard, time_based, personalized, business
  const [wordCount, setWordCount] = useState(200);
  const [customWordCount, setCustomWordCount] = useState(250);
  const [isCustomWordCount, setIsCustomWordCount] = useState(false);
  const [formatStyle, setFormatStyle] = useState('Paragraph');
  const [keyPointsCount, setKeyPointsCount] = useState(5);
  const [userLevel, setUserLevel] = useState('Student');
  const [purpose, setPurpose] = useState('Quick Understanding');
  const [language, setLanguage] = useState(selectedLanguage || 'English');
  const [isUserLanguageSet, setIsUserLanguageSet] = useState(false);
  const [timeLimit, setTimeLimit] = useState('2 minutes');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [pastSummaries, setPastSummaries] = useState([]);
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (!isUserLanguageSet && selectedLanguage) {
      setLanguage(selectedLanguage);
    }
  }, [selectedLanguage, isUserLanguageSet]);

  useEffect(() => {
    if (activeDoc) {
      loadPastSummaries();
    }
  }, [activeDoc]);

  const loadPastSummaries = async () => {
    if (!activeDoc) return;
    try {
      const res = await getDocumentSummaries(activeDoc.id);
      setPastSummaries(res.data);
      if (res.data.length > 0 && !summaryResult) {
        setSummaryResult(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!activeDoc) return;

    setLoading(true);
    setError(null);
    const targetWords = isCustomWordCount ? parseInt(customWordCount, 10) : wordCount;
    console.log('[SUMMARIZE UI] Dispatching summary generation with target language:', language);

    try {
      const res = await generateSummary({
        document_id: activeDoc.id,
        summary_type: summaryMode,
        word_count: targetWords,
        format_style: formatStyle,
        key_points_count: keyPointsCount,
        user_level: userLevel,
        purpose: purpose,
        language: language,
        target_language: language,
        targetLanguage: language,
        time_limit: summaryMode === 'time_based' ? timeLimit : null
      });
      setSummaryResult(res.data);
      loadPastSummaries();
    } catch (err) {
      console.error('Summary generation error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to generate summary.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format) => {
    if (!summaryResult) return;
    setExportOpen(false);
    try {
      await exportContent(
        `${activeDoc?.title || 'Document'} - Summary`,
        summaryResult.content,
        format,
        activeDoc?.title
      );
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (!activeDoc) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No Document Selected</h3>
        <p className="text-xs mt-1">Please upload or select a document from the Documents tab to generate summaries.</p>
      </div>
    );
  }

  const userLevels = ['Beginner', 'Student', 'Researcher', 'Professional', 'Expert'];
  const purposes = ['Quick Understanding', 'Exam Preparation', 'Research', 'Presentation', 'Business', 'General Knowledge'];
  const formats = ['Paragraph', 'Bullet points', 'Key takeaways', 'Executive summary'];
  const wordCountOptions = [50, 100, 200, 500];
  const timeLimits = ['30 seconds', '2 minutes', '5 minutes', '10 minutes'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50">
            <BookOpen className="w-5 h-5" />
          </span>
          <span>Adaptive AI Summarization</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Generate depth-calibrated summaries matching your persona, purpose, reading time, and target language.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Summary Mode Tabs */}
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold">
            {[
              { id: 'standard', label: 'Standard' },
              { id: 'time_based', label: 'Time-Based' },
              { id: 'personalized', label: 'Personalized' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSummaryMode(m.id)}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  summaryMode === m.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Time-Based Options */}
          {summaryMode === 'time_based' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" /> Target Reading Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeLimits.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      timeLimit === t
                        ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:border-purple-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Word Count Selection */}
          {summaryMode !== 'time_based' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-500" /> Word Count Target
              </label>
              <div className="flex flex-wrap gap-2">
                {wordCountOptions.map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => {
                      setWordCount(cnt);
                      setIsCustomWordCount(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      !isCustomWordCount && wordCount === cnt
                        ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:border-purple-300'
                    }`}
                  >
                    {cnt} words
                  </button>
                ))}
                <button
                  onClick={() => setIsCustomWordCount(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isCustomWordCount
                      ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:border-purple-300'
                  }`}
                >
                  Custom
                </button>
              </div>

              {isCustomWordCount && (
                <div className="pt-2">
                  <input
                    type="number"
                    min="30"
                    max="2000"
                    value={customWordCount}
                    onChange={(e) => setCustomWordCount(e.target.value)}
                    placeholder="Enter word count (e.g. 350)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Personalization: Level & Purpose */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" /> Personalization Parameters
            </h3>

            {/* User Level */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                User Knowledge Level:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {userLevels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setUserLevel(lvl)}
                    className={`py-1 px-2 text-xs rounded-lg border transition-all text-center ${
                      userLevel === lvl
                        ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:border-purple-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                Reading Purpose:
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {purposes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Format Style */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                Format Style:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {formats.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormatStyle(f)}
                    className={`py-1.5 px-2 text-xs rounded-lg border transition-all text-center ${
                      formatStyle === f
                        ? 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 font-bold ring-1 ring-pink-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:border-pink-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                Target Language:
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setIsUserLanguageSet(true);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              >
                {[
                  { id: 'English', label: 'English' },
                  { id: 'Tamil', label: 'Tamil (தமிழ்)' },
                  { id: 'Hindi', label: 'Hindi (हिन्दी)' },
                  { id: 'Malayalam', label: 'Malayalam (മലയാളം)' },
                  { id: 'Telugu', label: 'Telugu (తెలుగు)' },
                  { id: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
                  { id: 'Tanglish', label: 'Tanglish (Romanized Tamil)' },
                  { id: 'Spanish', label: 'Spanish' },
                  { id: 'French', label: 'French' },
                  { id: 'German', label: 'German' }
                ].map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs">
              <span className="font-bold">Error: </span>
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing Adaptive Summary...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate {summaryMode === 'time_based' ? `${timeLimit} Summary` : 'Summary'}
              </>
            )}
          </button>
        </div>

        {/* Right Column: Generated Summary Display */}
        <div className="lg:col-span-7 space-y-6">
          {summaryResult ? (
            <div className="space-y-6 animate-fade-in">
              {/* Summary Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-950/60 shadow-sm space-y-4">
                {/* Meta details header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                      Level: {summaryResult.user_level}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200/50 dark:border-pink-800/50">
                      Purpose: {summaryResult.purpose}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200/50 dark:border-fuchsia-800/50">
                      Lang: {summaryResult.language}
                    </span>
                    <span className="text-slate-400 font-normal">
                      &bull; {summaryResult.word_count} words
                    </span>
                  </div>

                  {/* Actions: Copy & Export */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 hover:border-purple-300 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setExportOpen(!exportOpen)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/60 dark:to-pink-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:border-pink-300 transition-colors font-semibold shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-500" />
                        <span>Export</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {exportOpen && (
                        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-100 dark:border-purple-900 py-1 z-20">
                          {['pdf', 'docx', 'md', 'txt'].map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => handleExport(fmt)}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 uppercase font-semibold"
                            >
                              .{fmt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audio Reader Component */}
                <AudioPlayer
                  text={summaryResult.content}
                  language={summaryResult.language}
                />

                {/* Main Content */}
                <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                  {summaryResult.content}
                </div>

                {/* Source page references */}
                {summaryResult.source_pages && (
                  <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>Source references:</span>
                    {summaryResult.source_pages.map((p) => (
                      <span key={p} className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 font-medium text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40">
                        Page {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Takeaways & Points */}
              {summaryResult.key_points && summaryResult.key_points.length > 0 && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-950/60 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Core Key Points ({summaryResult.key_points.length})
                  </h3>
                  <div className="space-y-2">
                    {summaryResult.key_points.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/60 dark:to-pink-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Concepts Pill Tags */}
              {summaryResult.important_concepts && summaryResult.important_concepts.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Important Concepts Extracted
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {summaryResult.important_concepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50"
                      >
                        #{concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Ready to Generate Summary
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Configure your desired persona, reading time, format, and language on the left, then click "Generate Summary".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
