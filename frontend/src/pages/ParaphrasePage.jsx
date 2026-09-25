import React, { useState } from 'react';
import { Repeat, Copy, Check, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import { paraphraseText } from '../services/api';

export default function ParaphrasePage({ activeDoc, selectedLanguage }) {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('Professional');
  const [lengthOption, setLengthOption] = useState('Same length');
  const [language, setLanguage] = useState(selectedLanguage || 'English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const modes = ['Simple', 'Professional', 'Academic', 'Formal', 'Casual'];
  const lengths = ['Shorter', 'Same length', 'More detailed'];

  const handleUseDocumentExcerpt = () => {
    if (activeDoc && activeDoc.preview_text) {
      setInputText(activeDoc.preview_text.slice(0, 400));
    }
  };

  const handleParaphrase = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await paraphraseText({
        document_id: activeDoc?.id,
        text: inputText.trim(),
        mode,
        length_option: lengthOption,
        language
      });
      setResult(res.data.paraphrased_text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
            <Repeat className="w-5 h-5 text-emerald-500" />
          </span>
          <span>Context-Preserving Paraphraser</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Rewrite text across 5 distinct tonal registers while strictly preserving the original empirical meaning without introducing hallucinations.
        </p>
      </div>

      {/* Control Strip */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100/80 dark:border-teal-950/60 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
              Tone & Register:
            </label>
            <div className="flex flex-wrap gap-1">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    mode === m
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 font-bold ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:border-emerald-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
              Target Length:
            </label>
            <div className="flex flex-wrap gap-1">
              {lengths.map((len) => (
                <button
                  key={len}
                  onClick={() => setLengthOption(len)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    lengthOption === len
                      ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold ring-1 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:border-teal-300'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
              Language Output:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {['English', 'Tamil', 'Tanglish', 'Hindi'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side by Side Input & Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100/60 dark:border-teal-950/60 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Original Text
              </label>
              {activeDoc && (
                <button
                  onClick={handleUseDocumentExcerpt}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <FileText className="w-3 h-3" /> Load doc excerpt
                </button>
              )}
            </div>
            <textarea
              rows={8}
              placeholder="Paste sentence or excerpt from document to paraphrase..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleParaphrase}
            disabled={loading || !inputText.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
            Paraphrase Text
          </button>
        </div>

        {/* Output */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-teal-100/60 dark:border-teal-950/60 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>Paraphrased Result</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                  {mode} &bull; {lengthOption}
                </span>
              </label>
              {result && (
                <button
                  onClick={handleCopy}
                  className="text-[11px] text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-medium"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-emerald-500" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            <div className="p-3 min-h-[190px] rounded-xl bg-slate-50/50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-200 dark:border-slate-700">
              {result || (
                <span className="text-slate-400 italic">
                  Paraphrased output will appear here...
                </span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-teal-500" /> Preserves core semantic truth without introducing unsupported claims.
          </div>
        </div>
      </div>
    </div>
  );
}
