export function formatSuggestionsText(suggestions) {
  if (!suggestions.length) {
    return "";
  }

  return suggestions.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
}

export function buildCombinedResultsText({ optimizedResume, matchAnalysis, suggestionsText }) {
  return [
    "Optimized Resume:\n" + (optimizedResume || ""),
    "Match Analysis:\n" + (matchAnalysis || ""),
    "Suggestions:\n" + (suggestionsText || ""),
  ].join("\n\n");
}
