import React, { useState, useEffect } from 'react';
import { History, BookOpen, Award, Search, FileText, ChevronRight, RefreshCw, Calendar } from 'lucide-react';
import { getFullHistory } from '../services/api';

export default function HistoryPage({ setActiveDocId, setActiveTab }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, summary, quiz
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await getFullHistory();
      setHistoryItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = historyItems.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.doc_title?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-500/15 to-slate-500/15 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-slate-700/60">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </span>
          <span>Persistent Activity & Learning History</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review previous summaries, quiz performance attempts, and conceptual analyses saved across sessions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['all', 'summary', 'quiz'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterType === t
                  ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-blue-700 dark:text-slate-400'
              }`}
            >
              {t === 'all' ? 'All Activities' : `${t}s`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-blue-500/70" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs">Loading persistent history records...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isSummary = item.type === 'summary';
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSummary
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSummary ? <BookOpen className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.doc_title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize font-medium">
                      {item.title || item.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed pl-9">
                    {item.content}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-9">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveDocId(item.document_id);
                    setActiveTab(isSummary ? 'summarize' : 'study');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-colors flex items-center gap-1 self-start sm:self-center"
                >
                  <span>Reopen</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
          No matching history records found.
        </div>
      )}
    </div>
  );
}
