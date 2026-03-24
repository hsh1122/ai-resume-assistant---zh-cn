import { formatSuggestionsText } from "./text";

const PDF_PAGE_WIDTH_PX = 760;
const PDF_PAGE_PADDING_PX = 40;
const PDF_FONT_FAMILY =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif';

function buildMarkdown({ style, optimizedResume, matchAnalysis, suggestions }) {
  const suggestionLines = formatSuggestionsText(suggestions) || "No suggestions.";

  return [
    "# Optimized Resume Output",
    "",
    `- Style: ${style}`,
    `- Exported At: ${new Date().toLocaleString()}`,
    "",
    "## Optimized Resume",
    optimizedResume || "No content.",
    "",
    "## Match Analysis",
    matchAnalysis || "No content.",
    "",
    "## Suggestions",
    suggestionLines,
    "",
  ].join("\n");
}

function setPdfHeightHint(element, pixels) {
  element.dataset.pdfHeightHint = String(Math.max(1, Math.ceil(pixels)));
}

function estimateTextHeight(text, { charsPerLine, lineHeightPx, marginBottomPx, blankHeightPx }) {
  if (!text) {
    return blankHeightPx;
  }

  const visualLines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return visualLines * lineHeightPx + marginBottomPx;
}

function createPdfTitleBlock() {
  const title = document.createElement("h1");

  title.textContent = "Optimized Resume Output";
  title.style.margin = "0 0 14px";
  title.style.fontSize = "26px";
  title.style.fontWeight = "700";
  title.style.lineHeight = "1.4";
  title.style.color = "#0f172a";
  setPdfHeightHint(title, 50);

  return title;
}

function createPdfMetaBlock(style, exportedAt) {
  const meta = document.createElement("div");

  meta.textContent = `Style: ${style}\nExported At: ${exportedAt}`;
  meta.style.margin = "0 0 24px";
  meta.style.fontSize = "13px";
  meta.style.lineHeight = "1.8";
  meta.style.color = "#475569";
  meta.style.whiteSpace = "pre-wrap";
  setPdfHeightHint(meta, 72);

  return meta;
}

function createPdfSectionHeading(title) {
  const heading = document.createElement("h2");

  heading.textContent = title;
  heading.style.margin = "24px 0 10px";
  heading.style.fontSize = "18px";
  heading.style.fontWeight = "700";
  heading.style.lineHeight = "1.5";
  heading.style.color = "#0f172a";
  setPdfHeightHint(heading, 46);

  return heading;
}

function createPdfBodyLine(line) {
  const bodyLine = document.createElement("div");
  const content = line || "\u00A0";

  bodyLine.textContent = content;
  bodyLine.style.margin = "0 0 6px";
  bodyLine.style.fontSize = "14px";
  bodyLine.style.lineHeight = "1.8";
  bodyLine.style.color = "#334155";
  bodyLine.style.whiteSpace = "pre-wrap";
  bodyLine.style.wordBreak = "break-word";
  setPdfHeightHint(
    bodyLine,
    estimateTextHeight(line, {
      charsPerLine: 40,
      lineHeightPx: 25,
      marginBottomPx: 6,
      blankHeightPx: 18,
    })
  );

  return bodyLine;
}

function splitContentLines(content, fallbackText) {
  const normalizedContent = (content || fallbackText).replace(/\r\n/g, "\n");
  return normalizedContent.split("\n");
}

function buildPdfBlocks({ style, optimizedResume, matchAnalysis, suggestions }) {
  const exportedAt = new Date().toLocaleString();
  const sections = [
    { title: "Optimized Resume", content: optimizedResume || "No content." },
    { title: "Match Analysis", content: matchAnalysis || "No content." },
    {
      title: "Suggestions",
      content: formatSuggestionsText(Array.isArray(suggestions) ? suggestions : []) || "No suggestions.",
    },
  ];
  const blocks = [createPdfTitleBlock(), createPdfMetaBlock(style, exportedAt)];

  sections.forEach(({ title, content }) => {
    blocks.push(createPdfSectionHeading(title));

    splitContentLines(content, "No content.").forEach((line) => {
      blocks.push(createPdfBodyLine(line));
    });
  });

  return blocks;
}

function createPdfPageElement(pageHeightPx) {
  const page = document.createElement("div");

  page.dataset.pdfPage = "true";
  page.style.width = `${PDF_PAGE_WIDTH_PX}px`;
  page.style.height = `${pageHeightPx}px`;
  page.style.padding = `${PDF_PAGE_PADDING_PX}px`;
  page.style.boxSizing = "border-box";
  page.style.background = "#ffffff";
  page.style.color = "#0f172a";
  page.style.fontFamily = PDF_FONT_FAMILY;
  page.style.overflow = "hidden";

  return page;
}

function createPdfRenderHost() {
  const host = document.createElement("div");

  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.zIndex = "-1";
  host.style.pointerEvents = "none";
  host.style.display = "flex";
  host.style.flexDirection = "column";
  host.style.gap = "16px";

  return host;
}

function pageOverflows(page) {
  return page.scrollHeight > page.clientHeight + 1;
}

function buildPdfPages(payload, pageHeightPx, host) {
  const blocks = buildPdfBlocks(payload);
  const pages = [];
  let currentPage = createPdfPageElement(pageHeightPx);

  host.appendChild(currentPage);
  pages.push(currentPage);

  blocks.forEach((block) => {
    currentPage.appendChild(block);

    if (!pageOverflows(currentPage)) {
      return;
    }

    currentPage.removeChild(block);

    const nextPage = createPdfPageElement(pageHeightPx);
    host.appendChild(nextPage);
    pages.push(nextPage);
    nextPage.appendChild(block);

    if (pageOverflows(nextPage)) {
      throw new Error("PDF content block is too large to fit on a single page.");
    }

    currentPage = nextPage;
  });

  return pages;
}

export function exportMarkdownFile(payload) {
  const markdown = buildMarkdown(payload);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "optimized_resume.md";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportPdfFile(payload) {
  const { jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageHeightPx = Math.round((PDF_PAGE_WIDTH_PX / pageWidth) * pageHeight);
  const host = createPdfRenderHost();

  document.body.appendChild(host);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const pages = buildPdfPages(payload, pageHeightPx, host);

    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await html2canvas(pages[index], {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      if (index > 0) {
        doc.addPage();
      }

      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight);
    }

    doc.save("optimized_resume.pdf");
  } finally {
    host.remove();
  }
}
