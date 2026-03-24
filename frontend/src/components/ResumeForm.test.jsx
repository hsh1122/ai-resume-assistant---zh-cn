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

  it("uses desktop-only mode summary inside the copy card and keeps the mobile mode card", () => {
    render(<ResumeForm {...baseProps} />);

    expect(screen.getByRole("heading", { name: "快速复制结果" })).toBeInTheDocument();
    expect(
      screen.getByText(/一键复制当前的优化结果、匹配分析和建议，便于直接粘贴到别处使用/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /复制全部结果/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Markdown/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /PDF/i })).not.toBeInTheDocument();

    const copyCard = screen.getByRole("heading", { name: "快速复制结果" }).closest(".surface-subtle");
    const desktopModePanel = screen.getByText("当前模式").closest("div");
    const mobileModeCard = screen.getAllByText("已选模式")[0].closest(".surface-subtle");
    const optimizeCard = screen.getByRole("button", { name: "开始优化" }).closest(".bg-slate-950");
    const layout = copyCard?.parentElement;

    expect(copyCard).toHaveClass("xl:h-full");
    expect(desktopModePanel).toHaveClass("hidden", "xl:block");
    expect(mobileModeCard).toHaveClass("xl:hidden");
    expect(optimizeCard).toHaveClass("xl:col-span-2");
    expect(layout).toHaveClass("space-y-5", "xl:grid", "xl:space-y-0");
  });

  it("shows character counts for Chinese and mixed-language content", () => {
    render(<ResumeForm {...baseProps} resumeText="你好世界" jdText="AI 产品经理" />);

    expect(screen.getByText("简历字数")).toBeInTheDocument();
    expect(screen.getByText("职位描述字数")).toBeInTheDocument();
    expect(screen.getByText("4 字")).toBeInTheDocument();
    expect(screen.getByText("6 字")).toBeInTheDocument();
  });
});
