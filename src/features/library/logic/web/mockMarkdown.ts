const DEFAULT_WEB_MOCK_MARKDOWN_FILE_NAMES = [
  "converted_document.md",
  "js.md",
  "lepoint.md",
  "market-brief.md",
] as const;

export function resolveWebMockMarkdownUris(): string[] {
  return DEFAULT_WEB_MOCK_MARKDOWN_FILE_NAMES.map((fileName) => `/mocks/${fileName}`);
}
