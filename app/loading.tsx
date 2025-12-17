export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="text-sm font-medium text-slate-600">Chargement...</p>
      </div>
    </div>
  );
}
