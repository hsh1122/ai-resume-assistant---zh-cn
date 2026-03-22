const SHOW_DEBUG_RESULT_META = import.meta.env.DEV;
const SOURCE_COPY = {
  ai: {
    label: "Live AI",
    detail: "The latest response came from the configured model endpoint.",
  },
  mock: {
    label: "Mock Mode",
    detail: "No API key was configured, so the local fallback generated this result.",
  },
  fallback: {
    label: "Fallback",
    detail: "A live request was attempted, but the UI is currently showing deterministic backup output.",
  },
};

function ResultCard({ title, content, onCopy, accentClass }) {
  return (
    <article className="field-shell flex h-full flex-col overflow-hidden p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="field-label mb-1">Result Block</p>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        </div>
        <button
          onClick={onCopy}
          className="btn-ghost h-9 px-3 text-xs"
        >
          Copy
        </button>
      </div>
      <div className={`mb-4 h-1 rounded-full ${accentClass}`} />
      <div className="surface-subtle min-h-[280px] flex-1 overflow-auto whitespace-pre-wrap px-4 py-4 text-sm leading-7 text-slate-700">
        {content || "No content yet."}
      </div>
    </article>
  );
}

export default function OptimizationResult({
  optimizedResume,
  matchAnalysis,
  suggestionsText,
  resultSource,
  fallbackReason,
  onCopyText,
}) {
  const sourceMeta = resultSource ? SOURCE_COPY[resultSource] : null;
  const hasResults = Boolean(optimizedResume || matchAnalysis || suggestionsText);
  const summaryItems = [
    { label: "Output Sections", value: hasResults ? [optimizedResume, matchAnalysis, suggestionsText].filter(Boolean).length : 0 },
    { label: "Source", value: sourceMeta?.label || "Awaiting Run" },
    { label: "Suggestions", value: suggestionsText ? suggestionsText.split("\n").filter(Boolean).length : 0 },
  ];

  return (
    <section className="surface-panel p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="section-kicker">Results Review</p>
          <h2 className="section-heading mt-3">Analysis Output</h2>
          <p className="section-copy mt-3">
            Review the optimized resume package, scan alignment notes, and pull action items for the next application pass.
          </p>
        </div>
        <div className="surface-subtle px-4 py-4 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Output State</span>
          <span className="ml-3 rounded-full bg-white px-2.5 py-1 uppercase tracking-wide text-slate-600">
            {sourceMeta?.label || "Awaiting Run"}
          </span>
        </div>
      </div>
      {SHOW_DEBUG_RESULT_META && fallbackReason ? <p className="mb-6 text-xs text-slate-500">Fallback: {fallbackReason}</p> : null}

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="surface-subtle px-4 py-4">
            <p className="metric-label">{item.label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      {!hasResults ? (
        <div className="surface-subtle grid gap-4 px-6 py-10 text-left md:px-8">
          <p className="section-kicker">Awaiting Output</p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Run the first pass to generate a review package.</h3>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            The optimized resume, fit analysis, and suggested improvements will appear here after a successful optimization request.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ResultCard
            title="Optimized Resume"
            content={optimizedResume}
            onCopy={() => onCopyText(optimizedResume)}
            accentClass="bg-gradient-to-r from-slate-700 via-slate-500 to-slate-300"
          />
          <div className="grid gap-5">
            <ResultCard
              title="Match Analysis"
              content={matchAnalysis}
              onCopy={() => onCopyText(matchAnalysis)}
              accentClass="bg-gradient-to-r from-brand-700 to-brand-200"
            />
            <ResultCard
              title="Suggestions"
              content={suggestionsText}
              onCopy={() => onCopyText(suggestionsText)}
              accentClass="bg-gradient-to-r from-amber-300 to-stone-500"
            />
          </div>
        </div>
      )}

      {sourceMeta?.detail ? (
        <div className="mt-5 rounded-[22px] bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-300">
          <span className="mr-2 font-semibold text-white">{sourceMeta.label}:</span>
          {sourceMeta.detail}
        </div>
      ) : null}
    </section>
  );
}
