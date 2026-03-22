function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function ResumeForm({
  resumeText,
  setResumeText,
  jdText,
  setJdText,
  style,
  setStyle,
  styleOptions,
  styleCopy,
  onCopyAll,
  onExportMarkdown,
  onExportPdf,
  onOptimize,
  submitting,
}) {
  const stats = [
    { label: "Resume Words", value: countWords(resumeText) },
    { label: "JD Words", value: countWords(jdText) },
    { label: "Modes", value: styleOptions.length },
  ];

  return (
    <section className="surface-panel p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Optimization Workspace</p>
            <h2 className="section-heading mt-3">Source Workspace</h2>
            <p className="section-copy mt-3">
              Prepare source material and define the output posture before running a fresh optimization pass.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="surface-subtle min-w-[118px] px-4 py-4">
                <p className="metric-label">{item.label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="field-shell p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="field-label">Primary Resume</p>
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">Current resume draft</h3>
              </div>
              <span className="status-pill status-pill-soft">{countWords(resumeText)} words</span>
            </div>
            <p className="mb-4 text-sm leading-6 text-slate-600">Paste the working version you want to refine for the next application target.</p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={12}
              placeholder="Paste your resume content..."
              className="textarea-base"
            />
          </div>

          <div className="field-shell p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="field-label">Target Role</p>
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">Job description brief</h3>
              </div>
              <span className="status-pill status-pill-soft">{countWords(jdText)} words</span>
            </div>
            <p className="mb-4 text-sm leading-6 text-slate-600">Drop in the exact posting or requirements so the optimization can align the language and emphasis.</p>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={12}
              placeholder="Paste target job description..."
              className="textarea-base"
            />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="surface-subtle p-5 md:p-6">
            <p className="section-kicker">Output Package</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Share or export the current workspace output</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep the latest optimization package portable without leaving the main editing flow.
            </p>
            <div className="mt-5 grid gap-3">
              <button onClick={onCopyAll} className="btn-secondary w-full justify-between px-4">
                <span>Copy All Results</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Clipboard</span>
              </button>
              <button onClick={onExportMarkdown} className="btn-secondary w-full justify-between px-4">
                <span>Export Markdown</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">.md</span>
              </button>
              <button onClick={onExportPdf} className="btn-secondary w-full justify-between px-4">
                <span>Export PDF</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">.pdf</span>
              </button>
            </div>
          </div>

          <div className="surface-subtle p-5 md:p-6">
            <p className="section-kicker">Workflow Controls</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Action Center</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep exports, mode selection, and run controls together so the workspace stays compact at common desktop widths.
            </p>

            <div className="mt-5 min-w-0">
              <label className="field-label">Optimization Modes</label>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" role="group" aria-label="Optimization styles">
                {styleOptions.map((option) => {
                  const isActive = style === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStyle(option)}
                      aria-label={option}
                      aria-pressed={isActive}
                      className={`style-toggle h-full ${isActive ? "style-toggle-active" : ""}`}
                    >
                      <span className="block text-sm font-semibold text-current">{option}</span>
                      <span className="mt-2 block text-xs leading-6 text-current/75">{styleCopy?.[option] || "Targeted rewrite mode."}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="surface-subtle p-5 md:p-6">
            <p className="field-label">Selected Mode</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{style}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{styleCopy?.[style] || "Targeted rewrite mode."}</p>
          </div>

          <div className="rounded-[24px] bg-slate-950 px-5 py-5 text-white md:px-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="field-label text-slate-400">Ready Check</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">Run a new optimization pass</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  The current source content and selected mode will be submitted without changing your existing API flow.
                </p>
              </div>
              <button
                type="button"
                onClick={onOptimize}
                disabled={submitting}
                className="btn-primary min-w-[220px] w-full lg:w-auto"
              >
                {submitting ? "Optimizing..." : "Run Optimization"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
