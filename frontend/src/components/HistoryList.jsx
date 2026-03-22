function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

function buildPreview(record) {
  const source = record.preview_text || record.optimized_resume || record.match_analysis || record.original_resume || "";
  const normalized = source.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Open this record to restore the full resume, JD, and generated output.";
  }

  return normalized.length > 140 ? `${normalized.slice(0, 140)}...` : normalized;
}

export default function HistoryList({
  records,
  totalRecords,
  loadingRecords,
  page,
  totalPages,
  activeRecordId,
  historyStatus,
  onRefresh,
  onRecordClick,
  onRequestDelete,
  onPreviousPage,
  onNextPage,
  filters,
}) {
  return (
    <section className="surface-panel p-6 md:p-8">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="section-kicker">Saved Runs</p>
            <h2 className="section-heading mt-3">History Archive</h2>
            <p className="section-copy mt-3">
              Reopen prior optimization runs, compare approaches, and restore a workspace instantly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="status-pill status-pill-soft">{totalRecords} total</span>
            <button
              type="button"
              onClick={onRefresh}
              className="btn-secondary"
              disabled={loadingRecords}
            >
              {loadingRecords ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {filters}

      {historyStatus ? <p className="mb-5 text-sm text-slate-500">{loadingRecords ? "Loading history..." : historyStatus}</p> : null}

      {!records.length ? (
        <div className="surface-subtle px-5 py-10 text-left">
          <p className="field-label">Archive Empty</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">No saved runs yet.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Run an optimization once and the archive will start tracking reusable versions here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <article
              key={record.id}
              onClick={() => onRecordClick(record)}
              className={`group cursor-pointer rounded-[24px] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:bg-slate-50 ${
                activeRecordId === record.id ? "ring-2 ring-brand-100" : ""
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Record #{record.display_number || record.id}
                    </span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {record.style}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-800 group-hover:text-slate-950">{buildPreview(record)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{formatDate(record.created_at)}</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="status-dot" />
                      {activeRecordId === record.id ? "Loaded in workspace" : "Ready to restore"}
                    </span>
                  </div>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRecordClick(record);
                    }}
                    className="btn-ghost w-full sm:w-auto"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRequestDelete(record);
                    }}
                    className="btn-danger w-full sm:w-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-[22px] bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-slate-500">Archive navigation</span>
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={page <= 1 || loadingRecords}
          className="btn-secondary w-full sm:w-auto"
        >
          Previous
        </button>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-center text-sm text-slate-600">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNextPage}
          disabled={page >= totalPages || loadingRecords}
          className="btn-secondary w-full sm:w-auto"
        >
          Next
        </button>
      </div>
    </section>
  );
}
