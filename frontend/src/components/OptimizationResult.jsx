const SHOW_DEBUG_RESULT_META = import.meta.env.DEV;
const SOURCE_COPY = {
  ai: {
    label: "实时模型",
    detail: "最近一次结果来自已配置的模型接口。",
  },
  mock: {
    label: "模拟模式",
    detail: "当前未配置 API Key，因此此结果由本地兜底逻辑生成。",
  },
  fallback: {
    label: "兜底结果",
    detail: "系统曾尝试发起实时请求，但当前界面展示的是确定性的备用输出。",
  },
};

const FALLBACK_REASON_COPY = {
  missing_api_key: "未配置 API Key",
  empty_ai_response: "模型返回为空",
  invalid_json_response: "模型返回的 JSON 无效",
  incomplete_ai_payload: "模型返回内容不完整",
  request_exception: "请求过程中发生异常",
};

function ResultCard({ title, content, onCopy, accentClass }) {
  return (
    <article className="field-shell flex h-full flex-col overflow-hidden p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="field-label mb-1">结果区块</p>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        </div>
        <button
          onClick={onCopy}
          className="btn-ghost h-9 px-3 text-xs"
        >
          复制
        </button>
      </div>
      <div className={`mb-4 h-1 rounded-full ${accentClass}`} />
      <div className="surface-subtle min-h-[280px] flex-1 overflow-auto whitespace-pre-wrap px-4 py-4 text-sm leading-7 text-slate-700">
        {content || "暂无内容。"}
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
  const localizedFallbackReason = fallbackReason ? FALLBACK_REASON_COPY[fallbackReason] || fallbackReason : "";
  const hasResults = Boolean(optimizedResume || matchAnalysis || suggestionsText);
  const summaryItems = [
    { label: "输出分区", value: hasResults ? [optimizedResume, matchAnalysis, suggestionsText].filter(Boolean).length : 0 },
    { label: "来源", value: sourceMeta?.label || "等待运行" },
    { label: "建议条数", value: suggestionsText ? suggestionsText.split("\n").filter(Boolean).length : 0 },
  ];

  return (
    <section className="surface-panel p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="section-kicker">结果审阅</p>
          <h2 className="section-heading mt-3">分析输出</h2>
          <p className="section-copy mt-3">
            查看优化后的简历结果，快速浏览匹配分析，并提取下一轮投递的行动建议。
          </p>
        </div>
        <div className="surface-subtle px-4 py-4 text-xs text-slate-600">
          <span className="font-medium text-slate-700">输出状态</span>
          <span className="ml-3 rounded-full bg-white px-2.5 py-1 uppercase tracking-wide text-slate-600">
            {sourceMeta?.label || "等待运行"}
          </span>
        </div>
      </div>
      {SHOW_DEBUG_RESULT_META && localizedFallbackReason ? <p className="mb-6 text-xs text-slate-500">兜底原因：{localizedFallbackReason}</p> : null}

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
          <p className="section-kicker">等待输出</p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">先运行一次优化，生成可审阅的结果内容。</h3>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            优化后的简历、匹配分析和改进建议会在请求成功后出现在这里。
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ResultCard
            title="优化后简历"
            content={optimizedResume}
            onCopy={() => onCopyText(optimizedResume)}
            accentClass="bg-gradient-to-r from-slate-700 via-slate-500 to-slate-300"
          />
          <div className="grid gap-5">
            <ResultCard
              title="匹配分析"
              content={matchAnalysis}
              onCopy={() => onCopyText(matchAnalysis)}
              accentClass="bg-gradient-to-r from-brand-700 to-brand-200"
            />
            <ResultCard
              title="建议"
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
