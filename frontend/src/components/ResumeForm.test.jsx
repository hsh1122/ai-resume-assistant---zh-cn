import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ResumeForm from "./ResumeForm";

describe("ResumeForm", () => {
  it("renders optimization styles as an interactive button group", () => {
    const setStyle = vi.fn();

    render(
      <ResumeForm
        resumeText=""
        setResumeText={vi.fn()}
        jdText=""
        setJdText={vi.fn()}
        style="Professional"
        setStyle={setStyle}
        styleOptions={["Professional", "Concise", "Achievement-Oriented"]}
        onCopyAll={vi.fn()}
        onExportMarkdown={vi.fn()}
        onExportPdf={vi.fn()}
        onOptimize={vi.fn()}
        submitting={false}
      />
    );

    const conciseButton = screen.getByRole("button", { name: "Concise" });
    fireEvent.click(conciseButton);

    expect(setStyle).toHaveBeenCalledWith("Concise");
    expect(screen.getByRole("button", { name: "Professional" })).toHaveAttribute("aria-pressed", "true");
  });

  it("presents the form as a structured source workspace", () => {
    render(
      <ResumeForm
        resumeText=""
        setResumeText={vi.fn()}
        jdText=""
        setJdText={vi.fn()}
        style="Professional"
        setStyle={vi.fn()}
        styleOptions={["Professional", "Concise", "Achievement-Oriented"]}
        styleCopy={{ Professional: "Balanced phrasing for formal applications." }}
        onCopyAll={vi.fn()}
        onExportMarkdown={vi.fn()}
        onExportPdf={vi.fn()}
        onOptimize={vi.fn()}
        submitting={false}
      />
    );

    expect(screen.getByRole("heading", { name: "Source Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Action Center" })).toBeInTheDocument();
    expect(screen.getByText(/keep exports, mode selection, and run controls together/i)).toBeInTheDocument();
  });
});
