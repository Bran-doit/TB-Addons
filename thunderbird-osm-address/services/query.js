// Local, editable suggestions only. Never changes the event title.
export function titleSuggestion(title) {
  return String(title || "")
    .replace(/^\s*\d{1,2}(?::\d{2})?\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:Uhr)?\s*/i, "")
    .replace(/^\s*(?:TdA|Tag der offenen T\u00fcr)\s+/i, "")
    .replace(/\bev\.?\s+GS\b/gi, "Evangelische Grundschule")
    .replace(/\bGS\b/g, "Grundschule")
    .replace(/\bev\.\s*/gi, "Evangelische ")
    .replace(/[,&]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

export function searchQueries(query) {
  const original = query.trim();
  const expanded = titleSuggestion(original);
  // Address queries are never shortened. Name searches may discard trailing
  // event descriptions, but the UI must identify the actual query used.
  if (!/\b(?:Grundschule|Schule|Gymnasium|Kita|Museum|Hotel)\b/i.test(expanded) || /\d/.test(expanded)) return [original];
  const words = expanded.split(/\s+/);
  const queries = [expanded];
  for (const length of [words.length - 2, Math.max(3, Math.ceil(words.length / 2))]) {
    if (length < 3 || length >= words.length) continue;
    queries.push(words.slice(0, length).join(" "));
  }
  return [...new Set(queries)];
}
