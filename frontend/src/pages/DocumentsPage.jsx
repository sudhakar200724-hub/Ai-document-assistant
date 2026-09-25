import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Plus,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Search,
  Sparkles
} from 'lucide-react';
import { uploadDocument, createRawDocument, deleteDocument, getDocumentChunks } from '../services/api';

export default function DocumentsPage({
  documents = [],
  activeDocId,
  setActiveDocId,
  refreshDocuments,
  setActiveTab
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [inspectChunksDoc, setInspectChunksDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset messages
    setErrorMessage('');
    setSuccessMessage('');
    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('custom_title', file.name.replace(/\.[^/.]+$/, ''));

    try {
      setUploadProgress(60);
      const res = await uploadDocument(formData);
      setUploadProgress(100);
      setSuccessMessage(`Document "${res.data.title}" processed, chunked, and indexed successfully!`);
      await refreshDocuments();
      setActiveDocId(res.data.id);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to process document. Ensure it is a valid PDF or TXT file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteContent.trim()) {
      setErrorMessage('Please provide both a title and text content.');
      return;
    }

    try {
      setUploading(true);
      const res = await createRawDocument({
        title: pasteTitle.trim(),
        text_content: pasteContent.trim()
      });
      setSuccessMessage(`Document "${res.data.title}" created and indexed successfully!`);
      setShowPasteModal(false);
      setPasteTitle('');
      setPasteContent('');
      await refreshDocuments();
      setActiveDocId(res.data.id);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to index text.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteDocument(docId);
      await refreshDocuments();
      if (activeDocId === docId && documents.length > 1) {
        const remaining = documents.filter((d) => d.id !== docId);
        setActiveDocId(remaining[0]?.id || null);
      }
    } catch (err) {
      setErrorMessage('Failed to delete document.');
    }
  };

  const handleInspectChunks = async (doc) => {
    setInspectChunksDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await getDocumentChunks(doc.id);
      setChunks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    d.filename.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/15 to-blue-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-800/50">
              <FileText className="w-5 h-5" />
            </span>
            <span>Document Repository</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload PDFs, TXTs, or paste raw text. Documents are automatically extracted, cleaned, chunked, and vector-indexed for RAG.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-cyan-200/80 dark:border-cyan-900/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 hover:border-cyan-400/60 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Paste Raw Text
          </button>
          <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white cursor-pointer shadow-md shadow-cyan-600/20 transition-all active:scale-95">
            <Upload className="w-3.5 h-3.5" /> Upload File (PDF/TXT)
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Uploading progress indicator */}
      {uploading && (
        <div className="p-4 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600" /> Processing document pipeline: extracting text, cleaning, generating chunks, and vectorizing...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-cyan-200 dark:bg-cyan-900/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-600/60 dark:text-cyan-400/60" />
          <input
            type="text"
            placeholder="Search documents by title or filename..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing {filteredDocs.length} of {documents.length} documents
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => {
          const isActive = activeDocId === doc.id;
          return (
            <div
              key={doc.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-50/50 via-white to-blue-50/30 dark:from-cyan-950/30 dark:via-slate-800/90 dark:to-blue-950/20 border-cyan-500 ring-2 ring-cyan-500/20 shadow-md shadow-cyan-500/10'
                  : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-cyan-300 dark:hover:border-cyan-700/60 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/15 to-blue-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {doc.file_type}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1" title={doc.title}>
                        {doc.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {doc.filename}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {doc.preview_text || 'No preview available.'}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                  <span>{doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}</span>
                  <span>&bull;</span>
                  <span>{doc.chunk_count || 0} Chunks</span>
                  <span>&bull;</span>
                  <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setActiveTab('summarize');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-700 dark:hover:text-cyan-300'
                    }`}
                  >
                    Select & Learn
                  </button>
                  <button
                    onClick={() => handleInspectChunks(doc)}
                    className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors"
                    title="Inspect chunks & vectors"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paste Raw Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Paste Document Text
            </h2>
            <p className="text-xs text-slate-500">
              Paste an article, study guide, or notes. It will be structured into pages, chunked, and indexed.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Modern Web Architecture Overview"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content
                </label>
                <textarea
                  rows={8}
                  placeholder="Paste your text here..."
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={uploading}
                className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl shadow-md shadow-cyan-600/20 transition-all"
              >
                Process & Index
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Chunks Modal */}
      {inspectChunksDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  Vector Chunks Inspector: {inspectChunksDoc.title}
                </h2>
                <p className="text-xs text-slate-400">
                  {chunks.length} chunks generated with sliding window overlap and page metadata
                </p>
              </div>
              <button
                onClick={() => setInspectChunksDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-3">
              {loadingChunks ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Loading chunk vector data...
                </div>
              ) : chunks.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-cyan-100/80 dark:border-cyan-950/60 bg-gradient-to-r from-cyan-50/20 to-blue-50/10 dark:from-cyan-950/20 dark:to-slate-800/40 space-y-2 hover:border-cyan-300 dark:hover:border-cyan-700/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">Chunk #{c.chunk_index}</span>
                    <span>Page {c.page_number} &bull; {c.token_count} words</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
