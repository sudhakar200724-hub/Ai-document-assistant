import React from 'react';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Sparkles,
  Repeat,
  Languages,
  MessageSquare,
  GraduationCap,
  GitCompare,
  History,
  Settings,
  ChevronRight,
  ShieldCheck,
  Brain
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, docCount = 0, isDemoMode = true }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText, badge: docCount },
    { id: 'summarize', label: 'Summarize', icon: BookOpen },
    { id: 'explain', label: 'Explain This', icon: Sparkles },
    { id: 'paraphrase', label: 'Paraphrase', icon: Repeat },
    { id: 'translate', label: 'Translate', icon: Languages },
    { id: 'chat', label: 'Document Chat', icon: MessageSquare },
    { id: 'study', label: 'Study Mode', icon: GraduationCap },
    { id: 'compare', label: 'Compare Docs', icon: GitCompare },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const themeStyles = {
    dashboard: {
      activeBg: 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold shadow-xs border-l-2 border-blue-600 dark:border-blue-400',
      iconActive: 'text-blue-600 dark:text-blue-400',
      hoverText: 'hover:text-blue-600 dark:hover:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
    },
    documents: {
      activeBg: 'bg-cyan-50/90 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs border-l-2 border-cyan-500 dark:border-cyan-400',
      iconActive: 'text-cyan-600 dark:text-cyan-400',
      hoverText: 'hover:text-cyan-600 dark:hover:text-cyan-400',
      badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300'
    },
    summarize: {
      activeBg: 'bg-purple-50/90 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold shadow-xs border-l-2 border-purple-500 dark:border-purple-400',
      iconActive: 'text-purple-600 dark:text-purple-400',
      hoverText: 'hover:text-purple-600 dark:hover:text-purple-400',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
    },
    explain: {
      activeBg: 'bg-amber-50/90 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold shadow-xs border-l-2 border-amber-500 dark:border-amber-400',
      iconActive: 'text-amber-600 dark:text-amber-400',
      hoverText: 'hover:text-amber-600 dark:hover:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
    },
    paraphrase: {
      activeBg: 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs border-l-2 border-emerald-500 dark:border-emerald-400',
      iconActive: 'text-emerald-600 dark:text-emerald-400',
      hoverText: 'hover:text-emerald-600 dark:hover:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
    },
    translate: {
      activeBg: 'bg-sky-50/90 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 font-semibold shadow-xs border-l-2 border-sky-500 dark:border-sky-400',
      iconActive: 'text-sky-600 dark:text-sky-400',
      hoverText: 'hover:text-sky-600 dark:hover:text-sky-400',
      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300'
    },
    chat: {
      activeBg: 'bg-violet-50/90 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 font-semibold shadow-xs border-l-2 border-violet-500 dark:border-violet-400',
      iconActive: 'text-violet-600 dark:text-violet-400',
      hoverText: 'hover:text-violet-600 dark:hover:text-violet-400',
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300'
    },
    study: {
      activeBg: 'bg-teal-50/90 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold shadow-xs border-l-2 border-teal-500 dark:border-teal-400',
      iconActive: 'text-teal-600 dark:text-teal-400',
      hoverText: 'hover:text-teal-600 dark:hover:text-teal-400',
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300'
    },
    compare: {
      activeBg: 'bg-orange-50/90 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 font-semibold shadow-xs border-l-2 border-orange-500 dark:border-orange-400',
      iconActive: 'text-orange-600 dark:text-orange-400',
      hoverText: 'hover:text-orange-600 dark:hover:text-orange-400',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300'
    },
    history: {
      activeBg: 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold shadow-xs border-l-2 border-blue-500 dark:border-blue-400',
      iconActive: 'text-blue-600 dark:text-blue-400',
      hoverText: 'hover:text-blue-600 dark:hover:text-blue-400',
      badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    },
    settings: {
      activeBg: 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 font-semibold shadow-xs border-l-2 border-indigo-500 dark:border-indigo-400',
      iconActive: 'text-indigo-600 dark:text-indigo-400',
      hoverText: 'hover:text-indigo-600 dark:hover:text-indigo-400',
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0 transition-colors">
      {/* Brand logo & title */}
      <div>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              DocIntelligence
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              Learning Assistant
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const style = themeStyles[item.id] || themeStyles.dashboard;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? style.activeBg
                    : `text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${style.hoverText} dark:hover:text-slate-200`
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? style.iconActive : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${isActive ? style.badge : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer status widget */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <div className="text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isDemoMode ? 'Demo Mode' : 'Live AI API'}
              </span>
              <p className="text-[10px] text-slate-400">
                {isDemoMode ? 'Intelligent Fallback' : 'Active Provider'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
            title="Configure API key"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
