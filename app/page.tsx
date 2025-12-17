"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ExamManifest } from "./api/exams/route";

type Question = {
  id: number;
  category: string;
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
  ref?: string;
  page?: number;
};

type View = "dashboard" | "quiz" | "end";

function classNames(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function normalizePublicPath(pathname?: string): string {
  if (!pathname) return "";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function buildPdfSrc(question: Question, exam?: ExamManifest): string {
  if (!exam?.resources) return "";
  const refKey = question.ref ?? "";
  const resources = exam.resources ?? {};
  const fallbackResource = Object.values(resources)[0];
  const targetResource = (refKey && resources[refKey]) || fallbackResource;
  if (!targetResource) return "";

  const base = normalizePublicPath(targetResource);
  const page = question.page ?? 1;
  return `${base}#page=${page}&view=FitH`;
}

function ExamCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex justify-between">
        <div className="h-6 w-20 rounded bg-slate-200"></div>
        <div className="h-6 w-12 rounded bg-slate-200"></div>
      </div>
      <div className="mb-2 h-6 w-3/4 rounded bg-slate-200"></div>
      <div className="mb-6 h-4 w-full rounded bg-slate-200"></div>
      <div className="h-12 w-full rounded-xl bg-slate-200"></div>
    </div>
  );
}

export default function Home() {
  const [manifest, setManifest] = useState<ExamManifest[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [pdfSrc, setPdfSrc] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingExam, setLoadingExam] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeExam = useMemo(
    () => manifest.find((item) => item.id === activeExamId),
    [activeExamId, manifest],
  );

  // Group exams by subject
  const groupedExams = useMemo(() => {
    const groups: Record<string, ExamManifest[]> = {};
    manifest.forEach((exam) => {
      const subject = exam.subject || "Autres";
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(exam);
    });
    return groups;
  }, [manifest]);

  const currentQuestion = questions[currentIndex];
  const isMulti = (currentQuestion?.correct?.length ?? 0) > 1;

  useEffect(() => {
    const loadManifest = async () => {
      try {
        const res = await fetch("/api/exams");
        if (!res.ok) throw new Error("Réponse serveur invalide");
        const data = await res.json();
        setManifest(data);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "Impossible de charger le catalogue d'examens. Vérifiez les logs Vercel.",
        );
      }
    };
    loadManifest();
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startExam = async (examId: string) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingExam(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Server error");
      }

      const data = await res.json();

      // Only update state if this request wasn't cancelled
      if (!controller.signal.aborted) {
        setActiveExamId(data.exam?.id ?? examId);
        setQuestions(data.questions ?? []);
        setCurrentIndex(0);
        setSelected([]);
        setScore(0);
        setShowExplanation(false);
        setPdfSrc("");
        setCurrentPage(1);
        setView("quiz");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'ouvrir l'examen. Vérifiez le fichier JSON et les chemins.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoadingExam(false);
      }
      abortControllerRef.current = null;
    }
  };

  const toggleOption = (idx: number) => {
    if (showExplanation) return;

    if (!isMulti) {
      setSelected([idx]);
      return;
    }

    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const validateAnswer = () => {
    if (!currentQuestion) return;

    const correctSet = new Set(currentQuestion.correct);
    const isSameLength = selected.length === currentQuestion.correct.length;
    const allCorrect = isSameLength && selected.every((i) => correctSet.has(i));

    if (allCorrect) setScore((prev) => prev + 1);

    const pdf = buildPdfSrc(currentQuestion, activeExam);
    setPdfSrc(pdf);
    setCurrentPage(currentQuestion.page ?? 1);
    setShowExplanation(true);
  };

  const goNext = () => {
    const next = currentIndex + 1;
    if (next < questions.length) {
      setCurrentIndex(next);
      setSelected([]);
      setShowExplanation(false);
      setPdfSrc("");
      setCurrentPage(1);
    } else {
      setView("end");
    }
  };

  const closeQuiz = () => {
    setView("dashboard");
    setActiveExamId(null);
    setQuestions([]);
    setSelected([]);
    setShowExplanation(false);
    setPdfSrc("");
    setScore(0);
    setCurrentIndex(0);
    setCurrentPage(1);
  };

  const restartQuiz = () => {
    if (!activeExamId) return;
    startExam(activeExamId);
  };

  const totalQuestions = questions.length;
  const scoreLabel = `${score} / ${totalQuestions || 0}`;
  const scorePercent =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="h-screen overflow-hidden text-slate-800">
      {/* Tableau de bord */}
      <div
        className={classNames(
          view === "dashboard" ? "flex" : "hidden",
          "absolute inset-0 z-30 bg-slate-50 flex-col overflow-y-auto",
        )}
      >
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 sticky top-0 z-30 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white">
                <FontAwesomeIcon icon="graduation-cap" className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Icam Revision Hub
                </h1>
                <p className="text-sm text-indigo-100">
                  Plateforme de révision interactive avec synchronisation PDF
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10 w-full">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Mes Révisions
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Sélectionnez un examen pour commencer à réviser
                </p>
              </div>
              {loadingExam && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                  <span className="text-sm text-blue-700 font-medium">
                    Chargement...
                  </span>
                </div>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800 shadow-sm flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>{errorMessage}</div>
            </div>
          )}

          {manifest.length === 0 && !errorMessage ? (
            <div className="space-y-6">
              <div>
                <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ExamCardSkeleton />
                  <ExamCardSkeleton />
                  <ExamCardSkeleton />
                </div>
              </div>
            </div>
          ) : (
            Object.entries(groupedExams).map(([subject, exams]) => (
              <div key={subject} className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-1 w-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full"></div>
                  <h3 className="text-xl font-bold text-slate-800">{subject}</h3>
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-sm text-slate-500 font-medium">
                    {exams.length} {exams.length > 1 ? "examens" : "examen"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map((item) => (
                    <div
                      key={item.id}
                      className="group bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden"
                      onClick={() => startExam(item.id)}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>

                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide">
                            {item.type}
                          </span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                            {item.year}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-lg text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors relative z-10">
                        {item.title}
                      </h4>

                      <p className="text-sm text-slate-600 flex-1 mb-4 relative z-10 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 relative z-10">
                        <span className="text-xs text-slate-500 font-medium">
                          {item.code}
                        </span>
                        <button
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-indigo-200 group-hover:shadow-xl group-hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loadingExam}
                          onClick={(e) => {
                            e.stopPropagation();
                            startExam(item.id);
                          }}
                        >
                          {loadingExam ? "Ouverture..." : "Réviser"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Vue Quiz */}
      <div
        className={classNames(
          view === "quiz" ? "flex" : "hidden",
          "h-full w-full",
        )}
      >
        <div className="w-full md:w-5/12 bg-white flex flex-col border-r border-slate-200 shadow-xl z-20">
          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white">
            <button
              onClick={closeQuiz}
              className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-2"
            >
              <FontAwesomeIcon icon="arrow-left" /> Menu
            </button>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {activeExam?.title ?? "Module"}
            </div>
            <div className="font-mono font-bold text-slate-800">{scoreLabel}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 relative">
            {currentQuestion ? (
              <div className="fade-in">
                <div className="mb-6">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">
                    {currentQuestion.category}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
                    {currentQuestion.question}
                  </h2>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = selected.includes(i);
                    const isCorrect = showExplanation
                      ? currentQuestion.correct.includes(i)
                      : false;
                    const isWrong = showExplanation && isSelected && !isCorrect;
                    return (
                      <div
                        key={i}
                        className={classNames(
                          "option p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3",
                          isSelected && !showExplanation
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-100 hover:bg-slate-50 hover:border-slate-300",
                          isCorrect && "bg-green-50 border-green-500 text-green-800",
                          isWrong && "bg-red-50 border-red-500 text-red-800",
                        )}
                        onClick={() => toggleOption(i)}
                      >
                        <div
                          className={classNames(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            isSelected ? "border-blue-500" : "border-slate-300",
                            isCorrect && "border-green-500",
                            isWrong && "border-red-500",
                          )}
                        >
                          <div
                            className={classNames(
                              "w-2.5 h-2.5 rounded-full",
                              isSelected ? "bg-blue-600" : "hidden",
                              isCorrect && "bg-green-600",
                              isWrong && "bg-red-600",
                            )}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700 flex-1">
                          {opt}
                        </span>
                        {isCorrect && (
                          <FontAwesomeIcon
                            icon="check"
                            className="text-green-600 ml-auto"
                          />
                        )}
                        {isWrong && (
                          <FontAwesomeIcon
                            icon="times"
                            className="text-red-500 ml-auto"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  className={classNames(
                    "mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm",
                    showExplanation ? "block" : "hidden",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon
                      icon="check-circle"
                      className="text-emerald-600 mt-1"
                    />
                    <div className="text-sm w-full">
                      <span className="font-bold text-emerald-800 block mb-1">
                        Explication
                      </span>
                      <p className="text-emerald-900 mb-3">
                        {currentQuestion.explanation}
                      </p>
                      {pdfSrc && (
                        <a
                          href={pdfSrc}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition inline-flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon="sync-alt" /> Ouvrir le PDF
                          (page {currentPage})
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Aucune question chargée.</p>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button
              onClick={validateAnswer}
              className={classNames(
                "w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-50",
                showExplanation && "hidden",
              )}
              disabled={!selected.length}
            >
              Valider
            </button>
            <button
              onClick={goNext}
              className={classNames(
                "w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200",
                showExplanation ? "block" : "hidden",
              )}
            >
              Question suivante{" "}
              <FontAwesomeIcon icon="arrow-right" className="ml-2" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-1 bg-slate-800 flex-col h-full relative">
          <div className="h-10 bg-slate-900 flex items-center justify-between px-4 text-slate-400 text-xs border-b border-slate-700">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon="file-pdf" />
              {pdfSrc ? pdfSrc.split("#")[0].split("/").pop() : "Support de cours"}
            </span>
            {pdfSrc && (
              <a
                href={pdfSrc}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white underline"
              >
                Ouvrir dans un nouvel onglet
              </a>
            )}
          </div>

          <div className="flex-1 relative w-full bg-gray-600">
            {pdfSrc ? (
              <iframe
                key={pdfSrc}
                src={pdfSrc}
                className="w-full h-full border-none"
                title="Support de cours"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 z-10">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon="book-open" className="text-2xl" />
                </div>
                <p className="font-medium text-slate-600">
                  Le cours s&apos;affichera ici
                </p>
                <p className="text-sm mt-1">
                  Valide une réponse pour synchroniser la page.
                </p>
                <div className="mt-4 text-xs font-mono bg-slate-200 p-2 rounded text-slate-500">
                  Prêt
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Écran de fin */}
      <div
        className={classNames(
          view === "end" ? "flex" : "hidden",
          "fixed inset-0 z-[60] bg-white/90 backdrop-blur-sm items-center justify-center p-4",
        )}
      >
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl text-center border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Terminé !</h2>
          <div className="text-5xl font-black text-slate-900 mb-8">
            {scorePercent}%
          </div>
          <div className="text-slate-600 mb-6">{scoreLabel}</div>
          <div className="flex flex-col gap-3">
            <button
              onClick={restartQuiz}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
            >
              Recommencer
            </button>
            <button
              onClick={closeQuiz}
              className="w-full bg-white text-slate-600 font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              Retour au menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

