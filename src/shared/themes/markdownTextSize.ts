export const MARKDOWN_TEXT_SIZE_LEVELS = [1, 2, 3, 4, 5] as const;

export type MarkdownTextSizeLevel = (typeof MARKDOWN_TEXT_SIZE_LEVELS)[number];

export const DEFAULT_MARKDOWN_TEXT_SIZE_LEVEL: MarkdownTextSizeLevel = 3;

const MARKDOWN_TEXT_SIZE_SCALE_BY_LEVEL: Record<MarkdownTextSizeLevel, number> = {
  1: 0.88,
  2: 0.94,
  3: 1,
  4: 1.08,
  5: 1.16,
};

export function isMarkdownTextSizeLevel(value: unknown): value is MarkdownTextSizeLevel {
  return (
    typeof value === "number" && MARKDOWN_TEXT_SIZE_LEVELS.includes(value as MarkdownTextSizeLevel)
  );
}

export function getMarkdownTextSizeScale(markdownTextSizeLevel: MarkdownTextSizeLevel): number {
  return MARKDOWN_TEXT_SIZE_SCALE_BY_LEVEL[markdownTextSizeLevel];
}
