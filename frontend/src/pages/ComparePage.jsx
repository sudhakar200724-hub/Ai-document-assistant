import React, { useState } from 'react';
import { GitCompare, Check, RefreshCw, FileText, Split, Sparkles, AlertCircle } from 'lucide-react';
import { compareDocuments } from '../services/api';

export default function ComparePage({ documents = [], selectedLanguage }) {
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);

  const toggleDocSelection = (docId) => {
    setComparisonResult(null);
    setError(null);
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleCompare = async () => {
    if (selectedDocs.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await compareDocuments({
        document_ids: selectedDocs,
        language: selectedLanguage || 'English'
      });
      setComparisonResult(res.data);
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || err?.message || 'Comparison failed. Please check the documents and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-orange-500/15 to-blue-500/15 text-orange-600 dark:text-blue-400 border border-orange-200/50 dark:border-blue-800/50">
            <GitCompare className="w-5 h-5 text-orange-600 dark:text-blue-400" />
          </span>
          <span>Multi-Document Comparative Matrix</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select 2 or more documents to cross-compare methodology, empirical results, dataset constraints, similarities, and unique points.
        </p>
      </div>

      {/* Document Picker Strip */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-orange-100/80 dark:border-blue-950/60 shadow-xs space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
          Select Documents to Compare (Min 2 required):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const isSelected = selectedDocs.includes(doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => toggleDocSelection(doc.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-blue-300'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold truncate">{doc.title}</div>
                  <div className="text-[10px] text-slate-400">{doc.page_count} pages</div>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleCompare}
            disabled={loading || selectedDocs.length < 2}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-600 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-40"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Split className="w-4 h-4" />}
            Generate Comparison Table ({selectedDocs.length})
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Synthesis Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-50/80 via-white to-blue-50/80 dark:from-orange-950/30 dark:via-slate-800 dark:to-blue-950/30 border border-orange-200/80 dark:border-blue-900/60 space-y-2 shadow-xs">
            <h3 className="text-xs font-bold text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500" /> Executive Comparative Synthesis
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {comparisonResult.overall_synthesis}
            </p>
          </div>

          {/* Structured Comparison Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Matrix Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
                    <th className="pb-3 pr-4">Dimension</th>
                    <th className="pb-3 px-4 truncate max-w-[240px]">{comparisonResult.doc1_title || 'Document 1'}</th>
                    <th className="pb-3 pl-4 truncate max-w-[240px]">{comparisonResult.doc2_title || 'Document 2'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comparisonResult.comparison_matrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 pr-4 font-bold text-blue-600 dark:text-blue-400 align-top whitespace-nowrap">
                        {row.aspect}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed align-top">
                        {row.doc1}
                      </td>
                      <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 leading-relaxed align-top">
                        {row.doc2}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Similarities & Differences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Similarities */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-950/60 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Common Similarities
              </h3>
              <div className="space-y-2">
                {comparisonResult.similarities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Differences */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-orange-100 dark:border-orange-950/60 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Key Divergences
              </h3>
              <div className="space-y-2">
                {comparisonResult.differences.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unique Points */}
          {comparisonResult.unique_points && Object.keys(comparisonResult.unique_points).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(comparisonResult.unique_points).map(([docTitle, points], idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Distinctive Points: {docTitle}
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(points) && points.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
