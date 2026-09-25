import React, { useState } from 'react';
import { Sparkles, HelpCircle, Lightbulb, Compass, AlertTriangle, RefreshCw, FileText, Check, Copy } from 'lucide-react';
import { explainConcept } from '../services/api';

export default function ExplainPage({ activeDoc, selectedLanguage }) {
  const [conceptInput, setConceptInput] = useState('');
  const [userLevel, setUserLevel] = useState('Student');
  const [language, setLanguage] = useState(selectedLanguage || 'English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Suggested concepts based on typical docs
  const sampleSuggestions = ['Transformer Architecture', 'Self-Attention Mechanism', 'Enterprise Data Drift', 'Okazaki Fragments', 'Mendelian Segregation'];

  const handleExplain = async (conceptToUse) => {
    const target = conceptToUse || conceptInput;
    if (!target.trim() || !activeDoc) return;

    setLoading(true);
    try {
      const res = await explainConcept({
        document_id: activeDoc.id,
        concept_or_text: target.trim(),
        user_level: userLevel,
        language: language
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `Concept: ${result.concept}\n\nSimple Explanation:\n${result.simple_explanation}\n\nReal-World Example:\n${result.real_world_example}\n\nWhy It Matters:\n${result.why_it_matters}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeDoc) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No Document Selected</h3>
        <p className="text-xs mt-1">Please select an active document to explain concepts in context.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/15 via-orange-500/15 to-yellow-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </span>
          <span>"Explain This" Conceptual Deep Dive</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select or enter any difficult term, equation, or concept from "{activeDoc.title}". The AI breaks it down with plain-English intuition and real-world analogies.
        </p>
      </div>

      {/* Input Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-amber-100/80 dark:border-amber-950/60 shadow-xs space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Concept or Excerpt to Explain
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. Scaled Dot-Product Attention, Okazaki Fragments, Capital Allocation..."
              value={conceptInput}
              onChange={(e) => setConceptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={() => handleExplain()}
              disabled={loading || !conceptInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Explain
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Quick Prompts:</span>
          {sampleSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setConceptInput(s);
                handleExplain(s);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border border-transparent hover:border-amber-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Level and Language */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Explanation Depth:</span>
            <select
              value={userLevel}
              onChange={(e) => setUserLevel(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-amber-500"
            >
              {['Beginner', 'Student', 'Researcher', 'Professional', 'Expert'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-amber-500"
            >
              {['English', 'Tamil', 'Tanglish', 'Hindi'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Explanation Cards Result */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Bar with Copy */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-800 dark:text-amber-300 text-xs border border-amber-200/60 dark:border-amber-800/60 font-semibold">
                Concept Breakdown
              </span>
              <span>"{result.concept}"</span>
            </h2>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-amber-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
              {copied ? 'Copied' : 'Copy Breakdown'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Simple Explanation */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-950/60 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/50 dark:border-amber-800/50">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Simple Explanation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.simple_explanation}
              </p>
            </div>

            {/* Card 2: Real-World Analogy */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-orange-100 dark:border-orange-950/60 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/50 dark:border-orange-800/50">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Real-World Example
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.real_world_example}
              </p>
            </div>

            {/* Card 3: Why It Matters */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-yellow-100 dark:border-yellow-950/60 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-100 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/50 text-yellow-600 dark:text-yellow-400 flex items-center justify-center border border-yellow-200/50 dark:border-yellow-800/50">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                Why It Matters
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.why_it_matters}
              </p>
            </div>
          </div>

          {/* Difficult Sub-Concepts Breakdown */}
          {result.difficult_concepts_breakdown && result.difficult_concepts_breakdown.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-950/60 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Difficult Terms Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.difficult_concepts_breakdown.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-50/30 dark:bg-slate-900/40 border border-amber-100/60 dark:border-slate-700/80 space-y-1 hover:border-amber-300 dark:hover:border-amber-800/60 transition-colors">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {item.term}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
