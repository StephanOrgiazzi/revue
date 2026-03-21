import {
  MARKDOWN_TEXT_SIZE_LEVELS as MARKDOWN_TEXT_SIZE_LEVELS_BASE,
  type MarkdownTextSizeLevel,
} from "@/shared/themes/types";

export const MARKDOWN_TEXT_SIZE_LEVELS = MARKDOWN_TEXT_SIZE_LEVELS_BASE;

export const DEFAULT_MARKDOWN_TEXT_SIZE_LEVEL: MarkdownTextSizeLevel = 3;

const MARKDOWN_TEXT_SIZE_SCALE_BY_LEVEL: Record<MarkdownTextSizeLevel, number> = {
  1: 0.88,
  2: 0.94,
  3: 1,
  4: 1.08,
  5: 1.16,
};

export function getMarkdownTextSizeScale(markdownTextSizeLevel: MarkdownTextSizeLevel): number {
  return MARKDOWN_TEXT_SIZE_SCALE_BY_LEVEL[markdownTextSizeLevel];
}

export function isMarkdownTextSizeLevel(value: unknown): value is MarkdownTextSizeLevel {
  return (
    typeof value === "number" && MARKDOWN_TEXT_SIZE_LEVELS.includes(value as MarkdownTextSizeLevel)
  );
}
