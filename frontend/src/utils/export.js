import { formatSuggestionsText } from "./text";

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

function buildPdfContent({ style, optimizedResume, matchAnalysis, suggestions }) {
  const suggestionLines = formatSuggestionsText(suggestions) || "No suggestions.";

  return [
    `Style: ${style}`,
    `Exported At: ${new Date().toLocaleString()}`,
    "",
    "Optimized Resume",
    optimizedResume || "No content.",
    "",
    "Match Analysis",
    matchAnalysis || "No content.",
    "",
    "Suggestions",
    suggestionLines,
  ].join("\n");
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
  const content = buildPdfContent(payload);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const maxWidth = 515;
  const lines = doc.splitTextToSize(content, maxWidth);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(lines, margin, margin + 10);
  doc.save("optimized_resume.pdf");
}
