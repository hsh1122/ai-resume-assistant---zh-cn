export default function Toast({ message, type = "success", onClose }) {
  if (!message) {
    return null;
  }

  const toneClass =
    type === "error"
      ? "bg-red-50/95 text-red-700 shadow-[0_18px_50px_rgba(220,38,38,0.12)]"
      : "bg-white/95 text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.12)]";

  const label = type === "error" ? "Error" : "Workspace Update";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4 md:justify-end md:px-8">
      <div
        className={`toast-panel pointer-events-auto flex w-full max-w-md items-start justify-between gap-3 px-4 py-3 ${toneClass}`}
        role="status"
        aria-live="polite"
      >
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
          <p className="text-sm font-medium leading-6">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm font-medium text-current/70 transition hover:bg-black/5 hover:text-current"
          aria-label="Close notification"
        >
          Close
        </button>
      </div>
    </div>
  );
}
