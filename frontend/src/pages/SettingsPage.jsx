import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { getSystemStatus, updateSettings } from '../services/api';

export default function SettingsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('demo');
  const [forceDemo, setForceDemo] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await getSystemStatus();
      setStatus(res.data);
      setSelectedProvider(res.data.active_provider);
      setForceDemo(res.data.is_demo_mode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedbackMessage('');

    try {
      const res = await updateSettings({
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        provider: selectedProvider,
        force_demo_mode: forceDemo
      });
      setFeedbackMessage('Configuration updated successfully!');
      await loadStatus();
      setGeminiKey('');
      setOpenaiKey('');
    } catch (err) {
      setFeedbackMessage('Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/15 to-slate-500/15 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            <span className="bg-gradient-to-r from-indigo-600 to-slate-700 dark:from-indigo-400 dark:to-slate-300 bg-clip-text text-transparent">System Settings</span> & AI Provider Setup
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure API credentials or utilize the built-in Intelligent Demo Engine for 100% offline, zero-setup testing.
          </p>
        </div>
      </div>

      {/* Demo Mode Notice Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50/60 to-indigo-50/40 dark:from-indigo-950/30 dark:via-slate-900/40 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Intelligent Demo Mode & Offline Capability</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          If no external LLM API key is provided, the platform automatically runs in <b className="text-indigo-700 dark:text-indigo-300">Demo Mode</b>. It parses the actual text of your uploaded documents to extract key points, generate personalized summaries, formulate multi-choice quizzes, and execute citation-backed RAG queries with zero crashes.
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm shadow-indigo-500/5 space-y-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-500" />
          API Key Configuration
        </h2>

        {/* Gemini API Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Google Gemini API Key
            </label>
            {status?.gemini_configured && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Configured in Environment
              </span>
            )}
          </div>
          <input
            type="password"
            placeholder={status?.gemini_configured ? "••••••••••••••••••••••••••••••••" : "Paste your GEMINI_API_KEY here..."}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono transition-all"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Get a free key from Google AI Studio. Recommended for fast reasoning and multi-language support.
          </p>
        </div>

        {/* OpenAI API Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              OpenAI API Key
            </label>
            {status?.openai_configured && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Configured in Environment
              </span>
            )}
          </div>
          <input
            type="password"
            placeholder={status?.openai_configured ? "••••••••••••••••••••••••••••••••" : "Paste your OPENAI_API_KEY here..."}
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono transition-all"
          />
        </div>

        {/* Provider Switcher */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Preferred Intelligence Provider:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'demo', label: 'Intelligent Demo Mode', desc: 'Zero API keys required' },
              { id: 'gemini', label: 'Google Gemini', desc: 'Requires Gemini Key' },
              { id: 'openai', label: 'OpenAI GPT-4o', desc: 'Requires OpenAI Key' }
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedProvider === p.id
                    ? 'border-indigo-600 dark:border-indigo-500 bg-gradient-to-br from-indigo-50 to-slate-50/80 dark:from-indigo-950/50 dark:to-slate-900/80 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-900/40'
                }`}
              >
                <div className="text-xs font-bold">{p.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Assurance */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Enterprise Security & Privacy
            </span>
            <p className="leading-relaxed">
              API keys are stored exclusively in the backend runtime memory or your local <code>.env</code> file. They are never exposed to browser client-side scripts.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-slate-800 hover:from-indigo-500 hover:to-slate-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>
      </form>

      {/* Diagnostics */}
      {status && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm shadow-indigo-500/5 space-y-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" /> System Diagnostics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Active Provider</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                {status.active_provider}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Vector DB Index</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Operational</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Active Documents</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {status.active_documents_count}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">System Build</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">v{status.version}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
