import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  BarChart2,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateStudyMaterial, submitQuiz, getQuizHistory } from '../services/api';

export default function StudyPage({ activeDoc, selectedLanguage }) {
  const [activeSubTab, setActiveSubTab] = useState('notes'); // notes, quiz
  const [loading, setLoading] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [studyData, setStudyData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizHistoryList, setQuizHistoryList] = useState([]);

  useEffect(() => {
    if (activeDoc) {
      handleLoadOrGenerate();
      loadQuizHistory();
    }
  }, [activeDoc]);

  const handleLoadOrGenerate = async () => {
    if (!activeDoc) return;
    setLoading(true);
    setQuizResult(null);
    setUserAnswers({});

    try {
      const res = await generateStudyMaterial({
        document_id: activeDoc.id,
        language: selectedLanguage || 'English'
      });
      setStudyData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizHistory = async () => {
    if (!activeDoc) return;
    try {
      const res = await getQuizHistory(activeDoc.id);
      setQuizHistoryList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptionSelect = (qId, optionLabel) => {
    if (quizResult) return; // Locked once submitted
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionLabel
    }));
  };

  const handleQuizSubmit = async () => {
    if (!studyData || !studyData.mcqs || studyData.mcqs.length === 0) return;
    setSubmittingQuiz(true);

    try {
      const res = await submitQuiz({
        document_id: activeDoc.id,
        answers: userAnswers,
        mcqs: studyData.mcqs
      });
      setQuizResult(res.data);

      if (res.data.percentage >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      loadQuizHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizResult(null);
    setUserAnswers({});
  };

  if (!activeDoc) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No Document Selected</h3>
        <p className="text-xs mt-1">Please select an active document to view study notes and practice quizzes.</p>
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = studyData?.mcqs?.length || 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/15 to-blue-500/15 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/50">
              <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </span>
            <span>Study Mode & Exam Preparation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exam revision notes, definitions, 2/5/10 mark sample questions, and an interactive MCQ quiz with weak-topic diagnostics.
          </p>
        </div>

        <button
          onClick={handleLoadOrGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200/80 dark:border-teal-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 ${loading ? 'animate-spin' : ''}`} />
          Regenerate Materials
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'notes'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-bold'
              : 'text-slate-500 hover:text-emerald-700 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Exam Revision Notes & Questions
        </button>
        <button
          onClick={() => setActiveSubTab('quiz')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'quiz'
              ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-500 hover:text-blue-700 dark:text-slate-400'
          }`}
        >
          <Award className="w-4 h-4" />
          Interactive MCQ Quiz ({totalQuestions})
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Synthesizing definitions, exam questions, and dynamic quiz questions from document...
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: REVISION NOTES & EXAM QUESTIONS */}
          {activeSubTab === 'notes' && studyData && (
            <div className="space-y-6 animate-fade-in">
              {/* Must-Remember Points */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100/80 dark:border-teal-950/60 shadow-xs space-y-3">
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Must-Remember Points for Exams
                </h2>
                <div className="space-y-2">
                  {studyData.must_remember_points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                      <p className="leading-relaxed">{pt}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Definitions */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-teal-100/80 dark:border-teal-950/60 shadow-xs space-y-4">
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Essential Definitions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studyData.definitions.map((def, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-teal-50/20 dark:bg-slate-900 border border-teal-100/60 dark:border-slate-700 space-y-1 hover:border-teal-300 transition-colors">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                        {def.term}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {def.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2-Mark, 5-Mark, 10-Mark Question Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2 Mark */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-950/60 shadow-xs space-y-3">
                  <div className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold w-fit border border-blue-200/50 dark:border-blue-800/50">
                    2-Mark Short Questions
                  </div>
                  <div className="space-y-3 pt-1">
                    {studyData.two_mark_questions.map((q, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Q{idx + 1}. {q.question}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          Hint: {q.hint}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5 Mark */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-teal-100 dark:border-teal-950/60 shadow-xs space-y-3">
                  <div className="px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold w-fit border border-teal-200/50 dark:border-teal-800/50">
                    5-Mark Conceptual Questions
                  </div>
                  <div className="space-y-3 pt-1">
                    {studyData.five_mark_questions.map((q, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Q{idx + 1}. {q.question}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          Structure: {q.hint}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10 Mark */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-950/60 shadow-xs space-y-3">
                  <div className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold w-fit border border-emerald-200/50 dark:border-emerald-800/50">
                    10-Mark Detailed Essay
                  </div>
                  <div className="space-y-3 pt-1">
                    {studyData.ten_mark_questions.map((q, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Q{idx + 1}. {q.question}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          Comprehensive outline: {q.hint}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE MCQ QUIZ */}
          {activeSubTab === 'quiz' && studyData && (
            <div className="space-y-6 animate-fade-in">
              {/* Score Banner if Submitted */}
              {quizResult && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-blue-900 text-white space-y-4 shadow-lg animate-fade-in border border-teal-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                        Quiz Completed
                      </div>
                      <h2 className="text-2xl font-black mt-1">
                        Your Score: {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
                      </h2>
                      <p className="text-xs text-teal-100/90 mt-1 max-w-xl">
                        {quizResult.performance_summary}
                      </p>
                    </div>

                    <button
                      onClick={handleRetakeQuiz}
                      className="px-5 py-2.5 rounded-xl bg-white text-teal-950 font-bold text-xs hover:bg-emerald-50 transition-all shadow-md flex-shrink-0"
                    >
                      Retake Quiz
                    </button>
                  </div>

                  {/* Weak topics diagnosis */}
                  {quizResult.weak_topics && quizResult.weak_topics.length > 0 && (
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <span className="text-xs font-bold text-amber-300">
                        Weak Topics Identified for Review:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {quizResult.weak_topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold"
                          >
                            &bull; {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar before submit */}
              {!quizResult && (
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2">
                  <span>Questions answered: <span className="font-semibold text-teal-600 dark:text-teal-400">{answeredCount}</span> of {totalQuestions}</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">{Math.round((answeredCount / (totalQuestions || 1)) * 100)}% Complete</span>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {studyData.mcqs.map((mcq, qIdx) => {
                  const selectedOption = userAnswers[mcq.id];
                  const isSubmitted = !!quizResult;
                  const isCorrect = isSubmitted && selectedOption === mcq.correct_answer;

                  return (
                    <div
                      key={mcq.id}
                      className={`p-6 rounded-2xl border transition-all ${
                        isSubmitted
                          ? isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : selectedOption
                            ? 'bg-white dark:bg-slate-800 border-teal-300 dark:border-teal-800/80 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {mcq.question}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5 inline-block">
                              Topic: {mcq.topic} &bull; Page {mcq.page_number}
                            </span>
                          </div>
                        </div>

                        {isSubmitted && (
                          isCorrect ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Correct (+1)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-bold">
                              <XCircle className="w-4 h-4" /> Incorrect
                            </span>
                          )
                        )}
                      </div>

                      {/* Options A, B, C, D */}
                      <div className="space-y-2">
                        {mcq.options.map((opt) => {
                          const isSelected = selectedOption === opt.label;
                          const isTheCorrectAnswer = isSubmitted && opt.label === mcq.correct_answer;
                          
                          let optionClass = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200';
                          if (isSelected) {
                            optionClass = 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold ring-1 ring-teal-500/20';
                          }
                          if (isSubmitted) {
                            if (isTheCorrectAnswer) {
                              optionClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold';
                            } else if (isSelected && !isCorrect) {
                              optionClass = 'border-rose-500 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-semibold line-through';
                            }
                          }

                          return (
                            <button
                              key={opt.label}
                              onClick={() => handleOptionSelect(mcq.id, opt.label)}
                              disabled={isSubmitted}
                              className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-center gap-3 ${optionClass}`}
                            >
                              <span className="w-6 h-6 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                                {opt.label}
                              </span>
                              <span className="flex-1">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation reveal if submitted */}
                      {isSubmitted && (
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            Explanation:
                          </span>
                          <p className="leading-relaxed">
                            {mcq.explanation} (Verified against Page {mcq.page_number})
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!quizResult && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleQuizSubmit}
                    disabled={submittingQuiz || answeredCount === 0}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-40"
                  >
                    {submittingQuiz ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    Submit Quiz Answers
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
