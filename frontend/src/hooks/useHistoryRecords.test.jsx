import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useHistoryRecords from "./useHistoryRecords";

vi.mock("../api", () => ({
  deleteRecordById: vi.fn(),
  fetchRecordById: vi.fn(),
  fetchRecords: vi.fn(),
}));

import { fetchRecords } from "../api";

describe("useHistoryRecords", () => {
  it("advances the current page when the user moves to the next history page", async () => {
    fetchRecords
      .mockResolvedValueOnce({
        items: [{ id: 1 }],
        total: 20,
        page: 1,
        page_size: 5,
        total_pages: 4,
      })
      .mockResolvedValueOnce({
        items: [{ id: 2 }],
        total: 20,
        page: 1,
        page_size: 5,
        total_pages: 4,
      });

    const { result } = renderHook(() =>
      useHistoryRecords({
        token: "token",
        allStyle: "All",
        defaultStyle: "Professional",
        onAuthError: vi.fn(() => false),
        onError: vi.fn(),
        onInfo: vi.fn(),
        onRecordLoaded: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.loadRecords(1);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(4);

    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(fetchRecords).toHaveBeenNthCalledWith(2, 2, 5, "", "", "token");
    expect(result.current.page).toBe(2);
    expect(result.current.totalPages).toBe(4);
  });
});
