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
    return "打开此记录可恢复完整的简历、职位描述和生成结果。";
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
  styleLabels,
  filters,
}) {
  return (
    <section className="surface-panel p-6 md:p-8">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="section-kicker">已保存记录</p>
            <h2 className="section-heading mt-3">历史归档</h2>
            <p className="section-copy mt-3">
              重新打开过往的优化结果、比较不同方案，并即时恢复工作区。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="status-pill status-pill-soft">共 {totalRecords} 条</span>
            <button
              type="button"
              onClick={onRefresh}
              className="btn-secondary"
              disabled={loadingRecords}
            >
              {loadingRecords ? "加载中..." : "刷新"}
            </button>
          </div>
        </div>
      </div>

      {filters}

      {historyStatus ? <p className="mb-5 text-sm text-slate-500">{loadingRecords ? "正在加载历史记录..." : historyStatus}</p> : null}

      {!records.length ? (
        <div className="surface-subtle px-5 py-10 text-left">
          <p className="field-label">归档为空</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">暂无已保存记录。</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">运行一次优化后，这里就会开始记录可复用的历史版本。</p>
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
                      记录 #{record.display_number || record.id}
                    </span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {styleLabels?.[record.style] || record.style}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-800 group-hover:text-slate-950">{buildPreview(record)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{formatDate(record.created_at)}</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="status-dot" />
                      {activeRecordId === record.id ? "已载入工作区" : "可恢复"}
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
                    打开
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRequestDelete(record);
                    }}
                    className="btn-danger w-full sm:w-auto"
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-[22px] bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-slate-500">归档翻页</span>
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={page <= 1 || loadingRecords}
          className="btn-secondary w-full sm:w-auto"
        >
          上一页
        </button>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-center text-sm text-slate-600">
          第 {page} / {totalPages} 页
        </span>
        <button
          type="button"
          onClick={onNextPage}
          disabled={page >= totalPages || loadingRecords}
          className="btn-secondary w-full sm:w-auto"
        >
          下一页
        </button>
      </div>
    </section>
  );
}
