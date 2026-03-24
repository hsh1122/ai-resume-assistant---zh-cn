import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HistoryFilters from "./HistoryFilters";

describe("HistoryFilters", () => {
  it("uses a wider desktop search column and a narrower mode column", () => {
    const { container } = render(
      <HistoryFilters
        searchKeyword="北京"
        setSearchKeyword={vi.fn()}
        historyStyleFilter="all"
        setHistoryStyleFilter={vi.fn()}
        allStyle="all"
        allStyleLabel="全部"
        styleOptions={["Professional"]}
        styleLabels={{ Professional: "专业" }}
        onApplyFilters={vi.fn()}
      />
    );

    const filtersPanel = container.firstChild;

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(filtersPanel).toHaveClass("lg:grid-cols-[minmax(0,1fr)_110px_auto]");
    expect(filtersPanel).not.toHaveClass("lg:grid-cols-[minmax(0,1fr)_160px_auto]");
    expect(filtersPanel).not.toHaveClass("lg:grid-cols-[minmax(0,1fr),220px,auto]");
  });
});
