import { useState } from "react";

import { deleteRecordById, fetchRecordById, fetchRecords, localizeApiMessage } from "../api";

const PAGE_SIZE = 5;

export default function useHistoryRecords({
  token,
  allStyle,
  defaultStyle,
  onAuthError,
  onError,
  onInfo,
  onRecordLoaded,
}) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [historyStyleFilter, setHistoryStyleFilter] = useState(allStyle);
  const [appliedStyleFilter, setAppliedStyleFilter] = useState("");
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState(null);
  const [historyStatus, setHistoryStatus] = useState("");

  async function loadRecords(targetPage = page, keyword = appliedKeyword, styleFilter = appliedStyleFilter) {
    if (!token) {
      return;
    }

    setLoadingRecords(true);

    try {
      const data = await fetchRecords(targetPage, PAGE_SIZE, keyword, styleFilter, token);
      const nextTotalPages = Math.max(data.total_pages || 1, 1);
      const nextPage = Math.min(Math.max(targetPage, 1), nextTotalPages);
      setRecords(data.items || []);
      setTotalPages(nextTotalPages);
      setTotalRecords(data.total || 0);
      setPage(nextPage);
      setHistoryStatus(data.total ? "" : "暂无已保存记录。");
    } catch (err) {
      const message = localizeApiMessage(err.message);

      if (!onAuthError(message)) {
        onError(message || "加载历史记录失败");
      }
    } finally {
      setLoadingRecords(false);
    }
  }

  async function handleRecordClick(recordOrId) {
    const recordId = typeof recordOrId === "object" ? recordOrId.id : recordOrId;
    const displayNumber = typeof recordOrId === "object" ? recordOrId.display_number || recordId : recordId;
    onError("");
    onInfo("");

    try {
      const data = await fetchRecordById(recordId, token);
      onRecordLoaded({
        resumeText: data.original_resume || "",
        jdText: data.jd_text || "",
        style: data.style || defaultStyle,
        optimizedResume: data.optimized_resume || "",
        matchAnalysis: data.match_analysis || "",
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      });
      setActiveRecordId(recordId);
      setHistoryStatus(`记录 #${displayNumber} 已打开。`);
      onInfo(`记录 #${displayNumber} 已打开。`);
    } catch (err) {
      const message = localizeApiMessage(err.message);

      if (!onAuthError(message)) {
        onError(message || "加载所选记录失败");
      }
    }
  }

  function requestDeleteRecord(record) {
    setPendingDeleteRecord(record);
  }

  function cancelDeleteRecord() {
    setPendingDeleteRecord(null);
  }

  async function confirmDeleteRecord() {
    if (!pendingDeleteRecord) {
      return;
    }
    const recordId = pendingDeleteRecord.id;
    const displayNumber = pendingDeleteRecord.display_number || recordId;
    onError("");
    onInfo("");

    try {
      await deleteRecordById(recordId, token);
      const nextPage = records.length === 1 && page > 1 ? page - 1 : page;
      await loadRecords(nextPage);
      setPendingDeleteRecord(null);
      if (activeRecordId === recordId) {
        setActiveRecordId(null);
      }
      setHistoryStatus(`记录 #${displayNumber} 已删除。`);
      onInfo(`记录 #${displayNumber} 已删除。`);
    } catch (err) {
      const message = localizeApiMessage(err.message);

      if (!onAuthError(message)) {
        onError(message || "删除记录失败");
      }
    }
  }

  function handleApplyFilters() {
    const nextKeyword = searchKeyword.trim();
    const nextStyle = historyStyleFilter === allStyle ? "" : historyStyleFilter;

    setAppliedKeyword(nextKeyword);
    setAppliedStyleFilter(nextStyle);
    loadRecords(1, nextKeyword, nextStyle);
  }

  function refreshRecords() {
    return loadRecords(page);
  }

  function goToPreviousPage() {
    return loadRecords(page - 1);
  }

  function goToNextPage() {
    return loadRecords(page + 1);
  }

  function resetHistoryRecords() {
    setRecords([]);
    setLoadingRecords(false);
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setActiveRecordId(null);
    setPendingDeleteRecord(null);
    setHistoryStatus("");
    setSearchKeyword("");
    setAppliedKeyword("");
    setHistoryStyleFilter(allStyle);
    setAppliedStyleFilter("");
  }

  return {
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
  };
}
