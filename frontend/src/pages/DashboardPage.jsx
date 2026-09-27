import React, { useEffect, useState } from 'react';
import {
  FileText,
  BookOpen,
  Sparkles,
  Repeat,
  Languages,
  MessageSquare,
  GraduationCap,
  GitCompare,
  Upload,
  ArrowUpRight,
  Clock,
  Award,
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { getDashboardStats } from '../services/api';

export default function DashboardPage({ setActiveTab, activeDoc, setActiveDocId }) {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      setStatsData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { id: 'summarize', title: 'Summarize', desc: 'Custom length & personalized summary', icon: BookOpen, color: 'from-blue-500 via-indigo-600 to-violet-600' },
    { id: 'explain', title: 'Explain This', desc: 'Concept breakdowns & real analogies', icon: Sparkles, color: 'from-amber-500 via-orange-500 to-pink-500' },
    { id: 'paraphrase', title: 'Paraphrase', desc: 'Rewrite in 5 distinct tones', icon: Repeat, color: 'from-teal-500 via-emerald-500 to-cyan-600' },
    { id: 'translate', title: 'Translate', desc: 'English, Tamil, Tanglish & Hindi', icon: Languages, color: 'from-cyan-500 via-blue-600 to-indigo-600' },
    { id: 'chat', title: 'Ask Document', desc: 'Grounded RAG with page citations', icon: MessageSquare, color: 'from-violet-500 via-purple-600 to-indigo-600' },
    { id: 'study', title: 'Study Mode', desc: 'Exam questions & interactive quiz', icon: GraduationCap, color: 'from-rose-500 via-pink-500 to-purple-600' },
    { id: 'compare', title: 'Compare Docs', desc: 'Matrix comparison across 2+ documents', icon: GitCompare, color: 'from-fuchsia-600 via-purple-600 to-pink-600' },
  ];

  const stats = statsData?.stats || {
    total_documents: 0,
    total_summaries: 0,
    total_questions: 0,
    avg_quiz_score: 0
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 text-white p-8 shadow-xl shadow-indigo-500/10 border border-blue-400/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-400/20 via-pink-500/15 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-white/10 text-cyan-200 text-xs font-semibold backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Document Intelligence & Learning Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Understand. Learn. Analyze. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-pink-200 to-violet-200">
              Tailored to Your Exact Needs.
            </span>
          </h1>
          <p className="text-sm text-indigo-100/90 leading-relaxed font-normal">
            Move far beyond traditional summarizers. Adapt document comprehension by your user level, learning purpose, target language, and format style with zero hallucinations and real page citations.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('documents')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-white to-blue-50 text-indigo-950 font-bold text-sm hover:from-white hover:to-indigo-100 transition-all shadow-md shadow-indigo-900/20 active:scale-95"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              Upload Document
            </button>
            <button
              onClick={() => setActiveTab('summarize')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-md border border-white/25 hover:border-pink-300/40 hover:text-pink-100 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-cyan-200" />
              Summarize Active Doc
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Documents Indexed */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 shadow-xs hover:border-blue-400/80 hover:shadow-md hover:shadow-blue-500/10 transition-all">
          <div className="flex items-center justify-between text-blue-700/80 dark:text-blue-300 mb-2">
            <span className="text-xs font-semibold">Documents Indexed</span>
            <div className="p-1.5 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 dark:text-white">
            {stats.total_documents}
          </div>
          <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">Ready for AI operations</p>
        </div>

        {/* Metric 2: Summaries Generated */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50/80 via-white to-violet-50/50 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-purple-950/30 border border-purple-200/70 dark:border-purple-900/50 shadow-xs hover:border-purple-400/80 hover:shadow-md hover:shadow-purple-500/10 transition-all">
          <div className="flex items-center justify-between text-purple-700/80 dark:text-purple-300 mb-2">
            <span className="text-xs font-semibold">Summaries Generated</span>
            <div className="p-1.5 rounded-lg bg-purple-100/70 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-950 dark:text-white">
            {stats.total_summaries}
          </div>
          <p className="text-[11px] text-purple-600/70 dark:text-purple-400/70 mt-1 font-medium">Multi-level & time-based</p>
        </div>

        {/* Metric 3: Questions Asked */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/50 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-cyan-950/30 border border-cyan-200/70 dark:border-cyan-900/50 shadow-xs hover:border-cyan-400/80 hover:shadow-md hover:shadow-cyan-500/10 transition-all">
          <div className="flex items-center justify-between text-cyan-700/80 dark:text-cyan-300 mb-2">
            <span className="text-xs font-semibold">Questions Asked</span>
            <div className="p-1.5 rounded-lg bg-cyan-100/70 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-cyan-950 dark:text-white">
            {stats.total_questions}
          </div>
          <p className="text-[11px] text-cyan-600/70 dark:text-cyan-400/70 mt-1 font-medium">Grounded with citations</p>
        </div>

        {/* Metric 4: Average Quiz Score */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-pink-50/80 via-white to-rose-50/50 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-pink-950/30 border border-pink-200/70 dark:border-pink-900/50 shadow-xs hover:border-pink-400/80 hover:shadow-md hover:shadow-pink-500/10 transition-all">
          <div className="flex items-center justify-between text-pink-700/80 dark:text-pink-300 mb-2">
            <span className="text-xs font-semibold">Average Quiz Score</span>
            <div className="p-1.5 rounded-lg bg-pink-100/70 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-pink-950 dark:text-white">
            {stats.avg_quiz_score}%
          </div>
          <p className="text-[11px] text-pink-600/70 dark:text-pink-400/70 mt-1 font-medium">Study mode retention</p>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Quick Action Workflows
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className="group p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 hover:border-violet-400/80 dark:hover:border-violet-500/80 hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-sm shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-md transition-all`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-violet-600 dark:group-hover:from-cyan-300 dark:group-hover:to-violet-300 transition-all">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {action.desc}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-violet-600 dark:text-violet-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Launch <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Recent Documents & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-white via-white to-blue-50/30 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-blue-950/20 border border-blue-100 dark:border-blue-900/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <FileText className="w-3.5 h-3.5" />
              </div>
              Recent Documents
            </h2>
            <button
              onClick={() => setActiveTab('documents')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {statsData?.recent_documents && statsData.recent_documents.length > 0 ? (
              statsData.recent_documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveDocId(doc.id);
                    setActiveTab('summarize');
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    activeDoc?.id === doc.id
                      ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/60 dark:to-indigo-950/50 border-blue-300 dark:border-blue-700/80 shadow-xs'
                      : 'hover:bg-blue-50/40 dark:hover:bg-slate-700/50 border-slate-100 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {doc.file_type.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} &bull; {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {activeDoc?.id === doc.id && (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                      Active
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Summaries & Quizzes */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-white via-white to-purple-50/30 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-purple-950/20 border border-purple-100 dark:border-purple-900/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="p-1 rounded-md bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                <Award className="w-3.5 h-3.5" />
              </div>
              Recent Learning History
            </h2>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-violet-600 dark:hover:text-violet-300 hover:underline flex items-center gap-1 transition-colors"
            >
              Full history <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {statsData?.recent_quizzes && statsData.recent_quizzes.length > 0 ? (
              statsData.recent_quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-3 rounded-xl border border-purple-100/80 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Quiz: {quiz.doc_title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Score: {quiz.score}/{quiz.total_questions} ({quiz.percentage}%) &bull; {new Date(quiz.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md shadow-xs ${
                    quiz.percentage >= 75
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                  }`}>
                    {quiz.percentage}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No quiz results yet. Take a quiz in Study Mode!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
