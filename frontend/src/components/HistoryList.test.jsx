import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HistoryList from "./HistoryList";

describe("HistoryList", () => {
  it("renders summary previews and highlights the active restored record", () => {
    render(
      <HistoryList
        records={[
          {
            id: 7,
            display_number: 3,
            style: "Professional",
            preview_text: "Optimized resume content focused on product ops and measurable impact.",
            created_at: "2026-03-21T03:40:00.000Z",
          },
        ]}
        totalRecords={1}
        loadingRecords={false}
        page={1}
        totalPages={1}
        activeRecordId={7}
        historyStatus="记录 #7 已载入工作区。"
        onRecordClick={vi.fn()}
        onRequestDelete={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
        styleLabels={{ Professional: "专业" }}
        filters={<div>filters</div>}
      />
    );

    expect(screen.getByRole("heading", { name: "历史归档" })).toBeInTheDocument();
    expect(screen.getByText(/optimized resume content focused on product ops/i)).toBeInTheDocument();
    expect(screen.getByText("已载入工作区")).toBeInTheDocument();
    expect(screen.getByText("记录 #7 已载入工作区。")).toBeInTheDocument();
    expect(screen.getByText("记录 #3")).toBeInTheDocument();
    expect(screen.getByText("共 1 条")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "刷新" })).not.toBeInTheDocument();
    expect(screen.getByText(/重新打开过往的优化结果、比较不同方案，并即时恢复工作区/i)).toBeInTheDocument();
  });

  it("frames saved runs as a readable archive workspace", () => {
    render(
      <HistoryList
        records={[]}
        totalRecords={0}
        loadingRecords={false}
        page={1}
        totalPages={1}
        activeRecordId={null}
        historyStatus=""
        onRecordClick={vi.fn()}
        onRequestDelete={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
        styleLabels={{}}
        filters={<div>filters</div>}
      />
    );

    expect(screen.getByRole("heading", { name: "历史归档" })).toBeInTheDocument();
    expect(screen.getByText(/重新打开过往的优化结果、比较不同方案，并即时恢复工作区/i)).toBeInTheDocument();
    expect(screen.getByText("暂无已保存记录。")).toBeInTheDocument();
  });
});
