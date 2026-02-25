type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export function escapeHtml(value: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

export function normalizeCodeLanguageClassName(language: string | undefined): string {
  if (!language) {
    return "";
  }

  return language
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeMathExpression(expression: string): string {
  return expression.replace(/\r\n?/g, "\n").trim();
}

export function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeHeadingLevel(level: number): HeadingLevel {
  return Math.max(1, Math.min(6, Math.round(level))) as HeadingLevel;
}
