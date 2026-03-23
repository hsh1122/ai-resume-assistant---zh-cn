import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthPanel from "./AuthPanel";

describe("AuthPanel", () => {
  it.each(["login", "register"])("submits %s when Enter is pressed in a field", (authMode) => {
    const onSubmit = vi.fn();

    render(
      <AuthPanel
        authMode={authMode}
        setAuthMode={vi.fn()}
        authUsername=""
        setAuthUsername={vi.fn()}
        authPassword=""
        setAuthPassword={vi.fn()}
        onSubmit={onSubmit}
        authSubmitting={false}
      />
    );

    fireEvent.keyDown(screen.getByLabelText("密码"), { key: "Enter", code: "Enter" });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps the auth panel focused on login controls", () => {
    render(
      <AuthPanel
        authMode="login"
        setAuthMode={vi.fn()}
        authUsername=""
        setAuthUsername={vi.fn()}
        authPassword=""
        setAuthPassword={vi.fn()}
        onSubmit={vi.fn()}
        authSubmitting={false}
      />
    );

    expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    expect(screen.queryByText("Operations Console")).not.toBeInTheDocument();
  });
});
