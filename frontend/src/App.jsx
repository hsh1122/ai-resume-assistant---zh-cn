import { useEffect, useMemo, useState } from "react";
import { optimizeResume } from "./api";
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
const TOKEN_KEY = "resume_assistant_token";
const STYLE_COPY = {
  Professional: "Balanced phrasing for formal applications and clean readability.",
  Concise: "Trims noise and keeps the strongest evidence in quick-scanning shape.",
  "Achievement-Oriented": "Pushes measurable impact and outcome-driven storytelling.",
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
  const workspaceStatus = hasResults ? "Results ready" : submitting ? "Running optimization" : "Awaiting source material";

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
    refreshRecords,
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
    { label: "Saved Runs", value: totalRecords, detail: "Reusable history archive" },
    { label: "Playbooks", value: STYLE_OPTIONS.length, detail: "Optimization modes available" },
    { label: "Workspace", value: workspaceStatus, detail: hasResults ? "Current output package is available" : "Load resume and job description to begin" },
  ];

  async function copyText(text) {
    if (!text) {
      setInfoMessage("Nothing to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setInfoMessage("Copied to clipboard.");
    } catch {
      setInfoMessage("Copy failed. Please copy manually.");
    }
  }

  function exportMarkdown() {
    exportMarkdownFile({ style, optimizedResume, matchAnalysis, suggestions });
    setInfoMessage("Markdown exported.");
  }

  async function exportPdf() {
    try {
      await exportPdfFile({ style, optimizedResume, matchAnalysis, suggestions });
      setInfoMessage("PDF exported.");
    } catch {
      setError("PDF export failed.");
    }
  }

  async function handleOptimize() {
    if (!resumeText.trim() || !jdText.trim()) {
      setError("Please fill both Resume and JD fields.");
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
      setInfoMessage("Optimization complete.");
    } catch (err) {
      if (!handleAuthError(err.message)) {
        setError(err.message || "Optimization failed");
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
        title={`Delete record #${pendingDeleteRecord?.display_number || pendingDeleteRecord?.id || ""}?`}
        description="This removes the saved run from your archive. It will not change the content currently loaded in the workspace."
        confirmLabel="Delete Record"
        onConfirm={confirmDeleteRecord}
        onCancel={cancelDeleteRecord}
      />
      <div className="mx-auto max-w-[1480px] px-4">
        <header className="surface-command mb-6 overflow-hidden px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)] xl:items-end">
            <div className="space-y-6">
              <div className="space-y-4">
                <span className="status-pill">Product Operations Console</span>
                <div className="max-w-3xl space-y-4">
                  <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
                    Resume optimization that looks and feels like a real hiring product.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                    Refine source material, run structured AI rewrites, and keep every iteration in a searchable archive.
                    The workspace is tuned for clarity, speed, and trustworthy review.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <span className="info-chip">Professional SaaS surface</span>
                  <span className="info-chip">Per-user history archive</span>
                  <span className="info-chip">Copy and export ready</span>
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
                    <p className="field-label text-slate-500">Workspace Owner</p>
                    <p className="text-lg font-semibold tracking-tight text-slate-950">{currentUser?.username || "..."}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Authenticated session with record history, export actions, and recovery controls.</p>
                  </div>
                  <button onClick={logout} className="btn-secondary">
                    Logout
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[20px] bg-white/90 px-4 py-4">
                    <p className="field-label text-slate-500">Current State</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="status-dot" />
                      <p className="text-sm font-medium text-slate-800">{workspaceStatus}</p>
                    </div>
                  </div>
                  <div className="rounded-[20px] bg-white/80 px-4 py-4">
                    <p className="field-label text-slate-500">Operator Notes</p>
                    <ul className="space-y-2 text-sm leading-6 text-slate-600">
                      <li>Use the left workspace to prepare source content and choose the rewrite posture.</li>
                      <li>Use the results area to review optimized copy, analysis notes, and next-step suggestions.</li>
                      <li>Use the archive to restore prior runs without losing the current working draft.</li>
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
              onRefresh={refreshRecords}
              onRecordClick={handleRecordClick}
              onRequestDelete={requestDeleteRecord}
              onPreviousPage={goToPreviousPage}
              onNextPage={goToNextPage}
              filters={
                <HistoryFilters
                  searchKeyword={searchKeyword}
                  setSearchKeyword={setSearchKeyword}
                  historyStyleFilter={historyStyleFilter}
                  setHistoryStyleFilter={setHistoryStyleFilter}
                  allStyle={ALL_STYLE}
                  styleOptions={STYLE_OPTIONS}
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
