import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import App from "./App";

let authSnapshot = {
  token: "",
  currentUser: null,
};
const authListeners = new Set();

function setAuthState(nextState) {
  authSnapshot = {
    ...authSnapshot,
    ...nextState,
  };
  authListeners.forEach((listener) => listener());
}

vi.mock("./api", () => ({
  optimizeResume: vi.fn(),
}));

vi.mock("./hooks/useAuth", () => ({
  default: ({ onLogout }) => {
    const snapshot = React.useSyncExternalStore(
      (listener) => {
        authListeners.add(listener);
        return () => authListeners.delete(listener);
      },
      () => authSnapshot
    );

    return {
      token: snapshot.token,
      currentUser: snapshot.currentUser,
      authMode: "login",
      setAuthMode: vi.fn(),
      authUsername: "",
      setAuthUsername: vi.fn(),
      authPassword: "",
      setAuthPassword: vi.fn(),
      authSubmitting: false,
      logout: () => {
        setAuthState({
          token: "",
          currentUser: null,
        });
        onLogout();
      },
      handleAuthError: vi.fn(() => false),
      handleAuthSubmit: vi.fn(),
    };
  },
}));

vi.mock("./hooks/useHistoryRecords", () => ({
  default: () => ({
    records: [],
    loadingRecords: false,
    page: 1,
    totalPages: 1,
    totalRecords: 0,
    activeRecordId: null,
    pendingDeleteRecord: null,
    historyStatus: "",
    searchKeyword: "",
    setSearchKeyword: vi.fn(),
    historyStyleFilter: "All",
    setHistoryStyleFilter: vi.fn(),
    loadRecords: vi.fn(),
    handleApplyFilters: vi.fn(),
    refreshRecords: vi.fn(),
    goToPreviousPage: vi.fn(),
    goToNextPage: vi.fn(),
    handleRecordClick: vi.fn(),
    requestDeleteRecord: vi.fn(),
    cancelDeleteRecord: vi.fn(),
    confirmDeleteRecord: vi.fn(),
    resetHistoryRecords: vi.fn(),
  }),
}));

vi.mock("./components/AuthPanel", () => ({
  default: () => <div>Auth Panel</div>,
}));

vi.mock("./components/ConfirmDialog", () => ({
  default: () => null,
}));

vi.mock("./components/HistoryFilters", () => ({
  default: () => null,
}));

vi.mock("./components/HistoryList", () => ({
  default: () => null,
}));

vi.mock("./components/OptimizationResult", () => ({
  default: () => null,
}));

vi.mock("./components/ResumeForm", () => ({
  default: ({ resumeText, setResumeText, jdText, setJdText }) => (
    <div>
      <p>Resume Value: {resumeText || "(empty)"}</p>
      <p>JD Value: {jdText || "(empty)"}</p>
      <button onClick={() => setResumeText("Alice resume draft")}>Set Resume</button>
      <button onClick={() => setJdText("Alice job description")}>Set JD</button>
    </div>
  ),
}));

vi.mock("./components/Toast", () => ({
  default: () => null,
}));

describe("App", () => {
  it("clears workspace inputs after logout before another account signs in", () => {
    setAuthState({
      token: "token-alice",
      currentUser: { username: "alice" },
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Set Resume" }));
    fireEvent.click(screen.getByRole("button", { name: "Set JD" }));

    expect(screen.getByText("Resume Value: Alice resume draft")).toBeInTheDocument();
    expect(screen.getByText("JD Value: Alice job description")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "退出登录" }));
    expect(screen.getByText("Auth Panel")).toBeInTheDocument();

    act(() => {
      setAuthState({
        token: "token-bob",
        currentUser: { username: "bob" },
      });
    });

    expect(screen.getByText("Resume Value: (empty)")).toBeInTheDocument();
    expect(screen.getByText("JD Value: (empty)")).toBeInTheDocument();
  });

  it("renders only the auth UI when signed out", () => {
    setAuthState({
      token: "",
      currentUser: null,
    });

    render(<App />);

    expect(screen.getByText("Auth Panel")).toBeInTheDocument();
    expect(screen.queryByText(/产品运营控制台/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/像真实招聘产品一样完成简历优化/i)).not.toBeInTheDocument();
  });
});
