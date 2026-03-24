import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ResumeForm from "./ResumeForm";

describe("ResumeForm", () => {
  const baseProps = {
    resumeText: "",
    setResumeText: vi.fn(),
    jdText: "",
    setJdText: vi.fn(),
    style: "Professional",
    setStyle: vi.fn(),
    styleOptions: ["Professional", "Concise", "Achievement-Oriented"],
    styleCopy: {
      Professional: "适合正式求职申请。",
      Concise: "突出重点。",
      "Achievement-Oriented": "强化成果表达。",
    },
    styleLabels: {
      Professional: "专业",
      Concise: "简洁",
      "Achievement-Oriented": "成果导向",
    },
    onCopyAll: vi.fn(),
    onOptimize: vi.fn(),
    submitting: false,
  };

  it("renders optimization styles as an interactive button group", () => {
    const setStyle = vi.fn();

    render(<ResumeForm {...baseProps} setStyle={setStyle} />);

    fireEvent.click(screen.getByRole("button", { name: "简洁" }));

    expect(setStyle).toHaveBeenCalledWith("Concise");
    expect(screen.getByRole("button", { name: "专业" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps only copy action and removes export actions", () => {
    render(<ResumeForm {...baseProps} />);

    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /复制全部结果/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Markdown/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /PDF/i })).not.toBeInTheDocument();
    expect(screen.getByText(/将模式选择与运行控制放在一起，让常见桌面宽度下的工作区保持紧凑/i)).toBeInTheDocument();
  });

  it("shows character counts for Chinese and mixed-language content", () => {
    render(
      <ResumeForm
        {...baseProps}
        resumeText="你好世界"
        jdText="AI 产品经理"
      />
    );

    expect(screen.getByText("简历字数")).toBeInTheDocument();
    expect(screen.getByText("职位描述字数")).toBeInTheDocument();
    expect(screen.getByText("4 字")).toBeInTheDocument();
    expect(screen.getByText("6 字")).toBeInTheDocument();
  });
});
