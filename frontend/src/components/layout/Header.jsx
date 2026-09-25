import React from 'react';
import { Sun, Moon, FileText, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Header({
  documents = [],
  activeDocId,
  setActiveDocId,
  selectedLanguage,
  setSelectedLanguage,
  darkMode,
  setDarkMode,
  isDemoMode,
  setActiveTab
}) {
  const languages = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'Tanglish', 'Spanish', 'French', 'German'];
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Active Document Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-slate-400 font-medium">Document:</span>
          {documents.length > 0 ? (
            <select
              value={activeDocId || ''}
              onChange={(e) => setActiveDocId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id} className="dark:bg-slate-800">
                  {d.title} ({d.page_count} {d.page_count === 1 ? 'page' : 'pages'})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-slate-500 italic">No document selected</span>
          )}
        </div>

        {activeDoc && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {activeDoc.file_type.toUpperCase()} &bull; {(activeDoc.file_size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {/* Right controls: Demo Mode Badge, Language, Theme */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Notice */}
        {isDemoMode ? (
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
            title="Click to configure live LLM API Key"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Demo Mode</span>
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Live AI</span>
          </span>
        )}

        {/* Global Language Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang} className="dark:bg-slate-800">
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
