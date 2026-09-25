import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bookmark,
  FileText,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Info
} from 'lucide-react';
import { askDocument, getChatHistory, clearChatHistory } from '../services/api';

export default function ChatPage({ activeDoc, selectedLanguage }) {
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSnippetPopover, setActiveSnippetPopover] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (activeDoc) {
      loadHistory();
    }
  }, [activeDoc]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    if (!activeDoc) return;
    try {
      const res = await getChatHistory(activeDoc.id);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSend = async (questionText) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || !activeDoc) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q.trim(),
      citations: [],
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await askDocument({
        document_id: activeDoc.id,
        question: q.trim(),
        language: selectedLanguage || 'English'
      });

      const assistantMessage = {
        id: res.data.id,
        role: 'assistant',
        answer: res.data.answer,
        citations: res.data.citations,
        grounded: res.data.grounded,
        language: res.data.language,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          answer: 'An error occurred while analyzing the document.',
          citations: [],
          grounded: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!activeDoc) return;
    if (!window.confirm('Clear all chat messages for this document?')) return;
    try {
      await clearChatHistory(activeDoc.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeDoc) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No Document Selected</h3>
        <p className="text-xs mt-1">Please select an active document to chat with.</p>
      </div>
    );
  }

  // Contextual starter prompts
  const starterQuestions = [
    `What are the core conclusions of this document?`,
    `What methodology or framework is presented?`,
    `Summarize the key metrics or experimental results.`,
    `What are the critical limitations mentioned?`
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-80px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-violet-500/15 to-purple-500/15 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/50">
              <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </span>
            <span>Document-Grounded RAG Chat</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Discussing: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeDoc.title}</span> &bull; Answers strictly cited with page numbers
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="py-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-50 to-purple-50 dark:from-violet-950/60 dark:to-purple-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-sm border border-violet-200/50 dark:border-violet-800/50">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ask anything about "{activeDoc.title}"
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Every response is retrieved from vector chunks and verified against the document with clickable page citations.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400">Suggested questions:</span>
              <div className="flex flex-col gap-1.5">
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-2 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 text-slate-700 dark:text-slate-300 transition-all"
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            const answerText = m.answer || m.content;
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-1">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-xs shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-violet-100/80 dark:border-purple-950/60 text-slate-900 dark:text-slate-100 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {answerText}
                  </p>

                  {/* Supporting Citations if assistant */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <Bookmark className="w-3.5 h-3.5 text-violet-500" />
                        <span>Source Citations (Click to inspect excerpt):</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {m.citations.map((c, cIdx) => (
                          <div key={cIdx} className="relative">
                            <button
                              onClick={() =>
                                setActiveSnippetPopover(
                                  activeSnippetPopover === `${m.id}-${cIdx}`
                                    ? null
                                    : `${m.id}-${cIdx}`
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800/80 transition-colors flex items-center gap-1"
                            >
                              <span>Page {c.page_number}</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </button>

                            {/* Snippet popover */}
                            {activeSnippetPopover === `${m.id}-${cIdx}` && (
                              <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl z-30 border border-slate-700 space-y-1 animate-fade-in">
                                <div className="flex items-center justify-between text-[10px] text-violet-300 font-bold">
                                  <span>Document Excerpt &bull; Page {c.page_number}</span>
                                  <button
                                    onClick={() => setActiveSnippetPopover(null)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    &times;
                                  </button>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-300 font-mono">
                                  &ldquo;{c.snippet}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounded verification badge */}
                  {!isUser && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      {m.grounded !== false ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Grounded in document vectors
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Info className="w-3 h-3" /> Information not found in document
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                    You
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold animate-pulse">
              AI
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-violet-100 dark:border-purple-950/60 text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
              Retrieving relevant vector chunks and grounding citations...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-2 shadow-xs focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500">
          <input
            type="text"
            placeholder={`Ask a question grounded in ${activeDoc.title}...`}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-100"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuestion.trim()}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
}
