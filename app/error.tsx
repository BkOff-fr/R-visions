"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          Une erreur est survenue
        </h2>
        <p className="mb-6 text-sm text-slate-600">
          {error.message || "Une erreur inattendue s'est produite."}
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-slate-400">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
