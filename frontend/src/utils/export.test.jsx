import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const PAGE_HEIGHT = 1075;
const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

const html2canvasMock = vi.fn((element) =>
  Promise.resolve({
    width: element?.dataset?.pdfPage === "true" ? 760 : 1000,
    height: element?.dataset?.pdfPage === "true" ? PAGE_HEIGHT : 1400,
    toDataURL: vi.fn(() => "data:image/png;base64,mock-image"),
  })
);

const mockDoc = {
  addImage: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn(),
  html: vi.fn(),
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 595.28),
      getHeight: vi.fn(() => 841.89),
    },
  },
};

const jsPDFMock = vi.fn(function MockJsPDF() {
  return mockDoc;
});

vi.mock("jspdf", () => ({
  jsPDF: jsPDFMock,
}));

vi.mock("html2canvas", () => ({
  default: html2canvasMock,
}));

import { exportPdfFile } from "./export";

describe("exportPdfFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillStyle: "#ffffff",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    }));
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,page-image");

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return this.dataset?.pdfPage === "true" ? PAGE_HEIGHT : 0;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        if (this.dataset?.pdfPage !== "true") {
          return 0;
        }

        return Array.from(this.children).reduce(
          (total, child) => total + Number(child.dataset?.pdfHeightHint || 0),
          0
        );
      },
    });
  });

  afterAll(() => {
    if (originalClientHeight) {
      Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
    } else {
      delete HTMLElement.prototype.clientHeight;
    }

    if (originalScrollHeight) {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
    } else {
      delete HTMLElement.prototype.scrollHeight;
    }
  });

  it("renders PDF content through canvas snapshots so Chinese text is preserved", async () => {
    const optimizedResume = "负责中文简历优化与岗位匹配分析。";
    const matchAnalysis = "匹配度较高，建议突出量化成果。";

    await exportPdfFile({
      style: "成果导向",
      optimizedResume,
      matchAnalysis,
      suggestions: ["补充项目结果", "强化业务指标"],
    });

    expect(jsPDFMock).toHaveBeenCalledWith({ unit: "pt", format: "a4" });
    expect(html2canvasMock).toHaveBeenCalled();

    const [container] = html2canvasMock.mock.calls[0];

    expect(container.textContent).toContain("成果导向");
    expect(container.textContent).toContain(optimizedResume);
    expect(container.textContent).toContain(matchAnalysis);
    expect(container.textContent).toContain("补充项目结果");
    expect(container.textContent).toContain("强化业务指标");
    expect(mockDoc.addImage).toHaveBeenCalled();
    expect(mockDoc.html).not.toHaveBeenCalled();
    expect(mockDoc.save).toHaveBeenCalledWith("optimized_resume.pdf");
    expect(document.body.textContent).not.toContain(optimizedResume);
  });

  it("renders long content as page-sized snapshots instead of slicing one long image", async () => {
    const longLines = Array.from(
      { length: 60 },
      (_, index) => `Line ${String(index + 1).padStart(2, "0")} achievement summary`
    ).join("\n");

    await exportPdfFile({
      style: "Achievement-Oriented",
      optimizedResume: longLines,
      matchAnalysis: longLines,
      suggestions: [longLines],
    });

    expect(html2canvasMock.mock.calls.length).toBeGreaterThan(1);
    expect(html2canvasMock.mock.calls.every(([element]) => element.dataset.pdfPage === "true")).toBe(true);
    expect(mockDoc.addPage).toHaveBeenCalled();
    expect(mockDoc.addImage).toHaveBeenCalledTimes(html2canvasMock.mock.calls.length);
  });
});
