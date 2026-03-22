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
        historyStatus="Record #7 restored into the workspace."
        onRefresh={vi.fn()}
        onRecordClick={vi.fn()}
        onRequestDelete={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
        filters={<div>filters</div>}
      />
    );

    expect(screen.getByRole("heading", { name: "History Archive" })).toBeInTheDocument();
    expect(screen.getByText(/optimized resume content focused on product ops/i)).toBeInTheDocument();
    expect(screen.getByText("Loaded in workspace")).toBeInTheDocument();
    expect(screen.getByText("Record #7 restored into the workspace.")).toBeInTheDocument();
    expect(screen.getByText("Record #3")).toBeInTheDocument();
    expect(screen.getByText(/reopen prior optimization runs, compare approaches/i)).toBeInTheDocument();
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
        onRefresh={vi.fn()}
        onRecordClick={vi.fn()}
        onRequestDelete={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
        filters={<div>filters</div>}
      />
    );

    expect(screen.getByRole("heading", { name: "History Archive" })).toBeInTheDocument();
    expect(screen.getByText(/reopen prior optimization runs, compare approaches, and restore a workspace instantly/i)).toBeInTheDocument();
    expect(screen.getByText("No saved runs yet.")).toBeInTheDocument();
  });
});
