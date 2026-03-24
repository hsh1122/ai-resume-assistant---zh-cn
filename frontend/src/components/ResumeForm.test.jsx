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
        styleLabels={{ Professional: "专业", Concise: "简洁", "Achievement-Oriented": "成果导向" }}
        onCopyAll={vi.fn()}
        onExportMarkdown={vi.fn()}
        onExportPdf={vi.fn()}
        onOptimize={vi.fn()}
        submitting={false}
      />
    );

    const conciseButton = screen.getByRole("button", { name: "简洁" });
    fireEvent.click(conciseButton);

    expect(setStyle).toHaveBeenCalledWith("Concise");
    expect(screen.getByRole("button", { name: "专业" })).toHaveAttribute("aria-pressed", "true");
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
        styleCopy={{ Professional: "适合正式求职申请。" }}
        styleLabels={{ Professional: "专业", Concise: "简洁", "Achievement-Oriented": "成果导向" }}
        onCopyAll={vi.fn()}
        onExportMarkdown={vi.fn()}
        onExportPdf={vi.fn()}
        onOptimize={vi.fn()}
        submitting={false}
      />
    );

    expect(screen.getByRole("heading", { name: "原始内容工作区" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "操作中心" })).toBeInTheDocument();
    expect(screen.getByText(/将导出、模式选择与运行控制放在一起，让常见桌面宽度下的工作区保持紧凑/i)).toBeInTheDocument();
  });

  it("shows character counts for Chinese and mixed-language content", () => {
    render(
      <ResumeForm
        resumeText="你好世界"
        setResumeText={vi.fn()}
        jdText="AI 产品经理"
        setJdText={vi.fn()}
        style="Professional"
        setStyle={vi.fn()}
        styleOptions={["Professional", "Concise", "Achievement-Oriented"]}
        styleCopy={{ Professional: "适合正式求职申请。" }}
        styleLabels={{ Professional: "专业", Concise: "简洁", "Achievement-Oriented": "成果导向" }}
        onCopyAll={vi.fn()}
        onExportMarkdown={vi.fn()}
        onExportPdf={vi.fn()}
        onOptimize={vi.fn()}
        submitting={false}
      />
    );

    expect(screen.getByText("简历字数")).toBeInTheDocument();
    expect(screen.getByText("职位描述字数")).toBeInTheDocument();
    expect(screen.getByText("4 字")).toBeInTheDocument();
    expect(screen.getByText("6 字")).toBeInTheDocument();
  });
});
