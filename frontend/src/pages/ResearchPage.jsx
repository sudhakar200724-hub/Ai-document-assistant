import React, { useState, useEffect } from 'react';
import {
  Microscope,
  FileText,
  User,
  HelpCircle,
  Cpu,
  Database,
  TrendingUp,
  AlertTriangle,
  Flag,
  Compass,
  Download,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { getResearchAnalysis, exportContent } from '../services/api';

export default function ResearchPage({ activeDoc }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeDoc) {
      loadAnalysis();
    }
  }, [activeDoc]);

  const loadAnalysis = async () => {
    if (!activeDoc) return;
    setLoading(true);
    try {
      const res = await getResearchAnalysis(activeDoc.id);
      setAnalysis(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    const txt = JSON.stringify(analysis, null, 2);
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format) => {
    if (!analysis) return;
    const content = `
# ${analysis.title}
Authors: ${analysis.authors?.join(', ')}

## Abstract
${analysis.abstract}

## Research Problem
${analysis.research_problem}

## Methodology
${analysis.methodology}

## Dataset & Benchmarks
${analysis.dataset}

## Empirical Results
${analysis.results}

## Limitations
${analysis.limitations}

## Conclusion & Future Work
${analysis.conclusion}
Future directions: ${analysis.future_work}
    `;
    await exportContent(analysis.title, content, format, activeDoc?.title);
  };

  if (!activeDoc) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No Document Selected</h3>
        <p className="text-xs mt-1">Please select an academic paper or report to generate structured research cards.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-purple-400 border border-indigo-200/50 dark:border-purple-800/50">
              <Microscope className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
            </span>
            <span>Research Paper Deep Analysis</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automatically decomposes research papers and technical whitepapers into structured academic components.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Deconstructing paper architecture: problem formulation, methodology, results, and limitations...
          </p>
        </div>
      ) : analysis ? (
        <div className="space-y-6 animate-fade-in">
          {/* Paper Title & Authors Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-950/60 shadow-xs space-y-3">
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 text-indigo-700 dark:text-purple-300 border border-indigo-200/60 dark:border-purple-800/60 text-xs font-bold uppercase tracking-wider">
              Academic Paper Identification
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {analysis.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Authors:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {analysis.authors?.join(', ') || 'Lead Author et al.'}
              </span>
            </div>
          </div>

          {/* Abstract */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Abstract Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif italic">
              &ldquo;{analysis.abstract}&rdquo;
            </p>
          </div>

          {/* 2-Column Grid: Problem, Method, Dataset, Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Research Problem */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Research Problem</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.research_problem}
              </p>
            </div>

            {/* Methodology */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Methodology & Architecture</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.methodology}
              </p>
            </div>

            {/* Dataset */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>Dataset & Benchmarks</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.dataset}
              </p>
            </div>

            {/* Results */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Reported Results</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.results}
              </p>
            </div>
          </div>

          {/* Limitations & Future Work */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Stated Limitations</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.limitations}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-violet-500 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>Future Work</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.future_work}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
