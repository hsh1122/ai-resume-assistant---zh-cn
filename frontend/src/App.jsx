import { useEffect, useMemo, useState } from "react";
import { localizeApiMessage, optimizeResume } from "./api";
import AuthPanel from "./components/AuthPanel";
import ConfirmDialog from "./components/ConfirmDialog";
import HistoryFilters from "./components/HistoryFilters";
import HistoryList from "./components/HistoryList";
import OptimizationResult from "./components/OptimizationResult";
import ResumeForm from "./components/ResumeForm";
import Toast from "./components/Toast";
import useAuth from "./hooks/useAuth";
import useHistoryRecords from "./hooks/useHistoryRecords";
import { exportMarkdownFile, exportPdfFile } from "./utils/export";
import { buildCombinedResultsText, formatSuggestionsText } from "./utils/text";

const STYLE_OPTIONS = ["Professional", "Concise", "Achievement-Oriented"];
const ALL_STYLE = "All";
const ALL_STYLE_LABEL = "全部";
const TOKEN_KEY = "resume_assistant_token";
const STYLE_LABELS = {
  Professional: "专业",
  Concise: "简洁",
  "Achievement-Oriented": "成果导向",
};
const STYLE_COPY = {
  Professional: "适合正式求职申请，表达均衡，阅读体验清晰。",
  Concise: "压缩冗余信息，突出最关键的证据与重点。",
  "Achievement-Oriented": "强化量化成果与结果导向的叙述方式。",
};

export default function App() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);

  const [optimizedResume, setOptimizedResume] = useState("");
  const [matchAnalysis, setMatchAnalysis] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [resultSource, setResultSource] = useState("");
  const [fallbackReason, setFallbackReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const suggestionsText = useMemo(() => formatSuggestionsText(suggestions), [suggestions]);
  const activeToast = error ? { type: "error", message: error } : infoMessage ? { type: "success", message: infoMessage } : null;
  const hasResults = Boolean(optimizedResume || matchAnalysis || suggestions.length);
  const workspaceStatus = hasResults ? "结果已就绪" : submitting ? "正在优化" : "等待输入内容";

  useEffect(() => {
    if (!infoMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setInfoMessage("");
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [infoMessage]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setError("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [error]);

  function resetWorkspace() {
    setResumeText("");
    setJdText("");
    setStyle(STYLE_OPTIONS[0]);
    setOptimizedResume("");
    setMatchAnalysis("");
    setSuggestions([]);
    setResultSource("");
    setFallbackReason("");
    setSubmitting(false);
    setError("");
    setInfoMessage("");
  }

  const {
    token,
    currentUser,
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authSubmitting,
    logout,
    handleAuthError,
    handleAuthSubmit,
  } = useAuth({
    tokenKey: TOKEN_KEY,
    onError: setError,
    onInfo: setInfoMessage,
    onAuthenticated: async () => {
      await loadRecords(1);
    },
    onLogout: () => {
      resetWorkspace();
      resetHistoryRecords();
    },
  });

  const {
    records,
    loadingRecords,
    page,
    totalPages,
    totalRecords,
    activeRecordId,
    pendingDeleteRecord,
    historyStatus,
    searchKeyword,
    setSearchKeyword,
    historyStyleFilter,
    setHistoryStyleFilter,
    loadRecords,
    handleApplyFilters,
    goToPreviousPage,
    goToNextPage,
    handleRecordClick,
    requestDeleteRecord,
    cancelDeleteRecord,
    confirmDeleteRecord,
    resetHistoryRecords,
  } = useHistoryRecords({
    token,
    allStyle: ALL_STYLE,
    defaultStyle: STYLE_OPTIONS[0],
    onAuthError: handleAuthError,
    onError: setError,
    onInfo: setInfoMessage,
    onRecordLoaded: ({ resumeText, jdText, style, optimizedResume, matchAnalysis, suggestions }) => {
      setResumeText(resumeText);
      setJdText(jdText);
      setStyle(style);
      setOptimizedResume(optimizedResume);
      setMatchAnalysis(matchAnalysis);
      setSuggestions(suggestions);
      setResultSource("");
      setFallbackReason("");
    },
  });

  const headerMetrics = [
    { label: "已保存记录", value: totalRecords, detail: "可复用的历史归档" },
    { label: "优化模式", value: STYLE_OPTIONS.length, detail: "可用的优化模式" },
    { label: "工作区", value: workspaceStatus, detail: hasResults ? "当前输出内容已可查看" : "载入简历和职位描述后即可开始" },
  ];

  async function copyText(text) {
    if (!text) {
      setInfoMessage("暂无可复制内容。");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setInfoMessage("已复制到剪贴板。");
    } catch {
      setInfoMessage("复制失败，请手动复制。");
    }
  }

  function exportMarkdown() {
    exportMarkdownFile({ style, optimizedResume, matchAnalysis, suggestions });
    setInfoMessage("已导出 Markdown。");
  }

  async function exportPdf() {
    try {
      await exportPdfFile({ style, optimizedResume, matchAnalysis, suggestions });
      setInfoMessage("已导出 PDF。");
    } catch {
      setError("PDF 导出失败。");
    }
  }

  async function handleOptimize() {
    if (!resumeText.trim() || !jdText.trim()) {
      setError("请同时填写简历和职位描述。");
      return;
    }

    setSubmitting(true);
    setError("");
    setInfoMessage("");

    try {
      const data = await optimizeResume(
        {
          resume_text: resumeText,
          jd_text: jdText,
          style,
        },
        token
      );

      setOptimizedResume(data.optimized_resume || "");
      setMatchAnalysis(data.match_analysis || "");
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setResultSource(data.result_source || "");
      setFallbackReason(data.fallback_reason || "");

      await loadRecords(1);
      setInfoMessage("优化完成。");
    } catch (err) {
      const message = localizeApiMessage(err.message);

      if (!handleAuthError(message)) {
        setError(message || "简历优化失败");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10 md:px-6">
        <Toast
          message={activeToast?.message}
          type={activeToast?.type}
          onClose={() => {
            setError("");
            setInfoMessage("");
          }}
        />
        <AuthPanel
          authMode={authMode}
          setAuthMode={setAuthMode}
          authUsername={authUsername}
          setAuthUsername={setAuthUsername}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          onSubmit={handleAuthSubmit}
          authSubmitting={authSubmitting}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-6 md:px-6 md:py-8">
      <Toast
        message={activeToast?.message}
        type={activeToast?.type}
        onClose={() => {
          setError("");
          setInfoMessage("");
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteRecord)}
        title={`删除记录 #${pendingDeleteRecord?.display_number || pendingDeleteRecord?.id || ""}？`}
        description="这会从归档中移除这次保存记录，但不会影响当前工作区里已加载的内容。"
        confirmLabel="删除记录"
        onConfirm={confirmDeleteRecord}
        onCancel={cancelDeleteRecord}
      />
      <div className="mx-auto max-w-[1480px] px-4">
        <header className="surface-command mb-6 overflow-hidden px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)] xl:items-end">
            <div className="space-y-6">
              <div className="space-y-4">
                <span className="status-pill">产品运营控制台</span>
                <div className="max-w-3xl space-y-4">
                  <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
                    像真实招聘产品一样完成简历优化。
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                    整理原始材料，运行结构化智能改写，并把每次迭代保存在可检索的归档里。
                    这个工作区强调清晰、高效和可靠审阅。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <span className="info-chip">专业业务界面</span>
                  <span className="info-chip">按用户隔离的历史归档</span>
                  <span className="info-chip">支持复制与导出</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {headerMetrics.map((metric) => (
                  <div key={metric.label} className="metric-card">
                    <p className="metric-label">{metric.label}</p>
                    <p className="metric-value text-slate-950">{metric.value}</p>
                    <p className="metric-detail text-slate-600">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-command-subtle p-5 md:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="field-label text-slate-500">当前用户</p>
                    <p className="text-lg font-semibold tracking-tight text-slate-950">{currentUser?.username || "..."}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">当前会话已启用历史记录、导出操作和恢复控制。</p>
                  </div>
                  <button onClick={logout} className="btn-secondary">
                    退出登录
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[20px] bg-white/90 px-4 py-4">
                    <p className="field-label text-slate-500">当前状态</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="status-dot" />
                      <p className="text-sm font-medium text-slate-800">{workspaceStatus}</p>
                    </div>
                  </div>
                  <div className="rounded-[20px] bg-white/80 px-4 py-4">
                    <p className="field-label text-slate-500">操作提示</p>
                    <ul className="space-y-2 text-sm leading-6 text-slate-600">
                      <li>使用左侧工作区准备原始内容并选择改写风格。</li>
                      <li>在结果区域查看优化后的文案、分析说明和后续建议。</li>
                      <li>使用归档可恢复之前的运行结果，同时保留当前工作草稿。</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.86fr)] xl:items-start">
          <div className="space-y-6">
            <ResumeForm
              resumeText={resumeText}
              setResumeText={setResumeText}
              jdText={jdText}
              setJdText={setJdText}
              style={style}
              setStyle={setStyle}
              styleOptions={STYLE_OPTIONS}
              styleCopy={STYLE_COPY}
              styleLabels={STYLE_LABELS}
              onCopyAll={() => copyText(buildCombinedResultsText({ optimizedResume, matchAnalysis, suggestionsText }))}
              onExportMarkdown={exportMarkdown}
              onExportPdf={exportPdf}
              onOptimize={handleOptimize}
              submitting={submitting}
            />

            <OptimizationResult
              optimizedResume={optimizedResume}
              matchAnalysis={matchAnalysis}
              suggestionsText={suggestionsText}
              resultSource={resultSource}
              fallbackReason={fallbackReason}
              onCopyText={copyText}
            />
          </div>

          <div className="xl:sticky xl:top-6">
            <HistoryList
              records={records}
              totalRecords={totalRecords}
              loadingRecords={loadingRecords}
              page={page}
              totalPages={totalPages}
              activeRecordId={activeRecordId}
              historyStatus={historyStatus}
              onRecordClick={handleRecordClick}
              onRequestDelete={requestDeleteRecord}
              onPreviousPage={goToPreviousPage}
              onNextPage={goToNextPage}
              styleLabels={STYLE_LABELS}
              filters={
                <HistoryFilters
                  searchKeyword={searchKeyword}
                  setSearchKeyword={setSearchKeyword}
                  historyStyleFilter={historyStyleFilter}
                  setHistoryStyleFilter={setHistoryStyleFilter}
                  allStyle={ALL_STYLE}
                  allStyleLabel={ALL_STYLE_LABEL}
                  styleOptions={STYLE_OPTIONS}
                  styleLabels={STYLE_LABELS}
                  onApplyFilters={handleApplyFilters}
                />
              }
            />
          </div>
        </div>
      </div>
    </main>
  );
}
