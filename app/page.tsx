"use client";

import { useEffect, useMemo, useState } from "react";
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

  const activeExam = useMemo(
    () => manifest.find((item) => item.id === activeExamId),
    [activeExamId, manifest],
  );

  const currentQuestion = questions[currentIndex];
  const isMulti = (currentQuestion?.correct?.length ?? 0) > 1;

  useEffect(() => {
    const loadManifest = async () => {
      try {
        const res = await fetch("/api/exams", { cache: "no-store" });
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

  const startExam = async (examId: string) => {
    setLoadingExam(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/exams/${examId}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erreur serveur");
      }
      const data = await res.json();
      setActiveExamId(data.exam?.id ?? examId);
      setQuestions(data.questions ?? []);
      setCurrentIndex(0);
      setSelected([]);
      setScore(0);
      setShowExplanation(false);
      setPdfSrc("");
      setCurrentPage(1);
      setView("quiz");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Impossible d'ouvrir l'examen. Vérifiez le fichier JSON et les chemins.",
      );
    } finally {
      setLoadingExam(false);
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
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-graduation-cap text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Icam Revision Hub
                </h1>
                <p className="text-sm text-slate-500">
                  Next.js + API Vercel pour un déploiement durable
                </p>
              </div>
            </div>
            <a
              href="https://vercel.com/new"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Déployer sur Vercel →
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10 w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Examens
              </h2>
              <p className="text-sm text-slate-500">
                Les examens sont lus via l&apos;API Next (fichiers /data).
              </p>
            </div>
            {loadingExam && (
              <span className="text-xs text-blue-600 font-semibold">
                Chargement...
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manifest.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                    {item.subject}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {item.year}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 flex-1">{item.description}</p>
                <button
                  onClick={() => startExam(item.id)}
                  className="w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-600 transition mt-6 disabled:opacity-50"
                  disabled={loadingExam}
                >
                  {loadingExam ? "Ouverture..." : "Lancer"}
                </button>
              </div>
            ))}
          </div>
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
              <i className="fas fa-arrow-left" /> Menu
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
                          <i className="fas fa-check text-green-600 ml-auto" />
                        )}
                        {isWrong && (
                          <i className="fas fa-times text-red-500 ml-auto" />
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
                    <i className="fas fa-check-circle text-emerald-600 mt-1" />
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
                          <i className="fas fa-sync-alt" /> Ouvrir le PDF (page{" "}
                          {currentPage})
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
              Question suivante <i className="fas fa-arrow-right ml-2" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-1 bg-slate-800 flex-col h-full relative">
          <div className="h-10 bg-slate-900 flex items-center justify-between px-4 text-slate-400 text-xs border-b border-slate-700">
            <span className="flex items-center gap-2">
              <i className="fas fa-file-pdf" />
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
                  <i className="fas fa-book-open text-2xl" />
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

