import {
  DEFAULT_MARKDOWN_TEXT_SIZE_LEVEL,
  getMarkdownTextSizeScale,
  isMarkdownTextSizeLevel,
  MARKDOWN_TEXT_SIZE_LEVELS,
} from "@/shared/themes/markdownTextSize";

describe("markdownTextSize", () => {
  it("defines a stable ordered set of size levels", () => {
    expect(MARKDOWN_TEXT_SIZE_LEVELS).toEqual([1, 2, 3, 4, 5]);
    expect(MARKDOWN_TEXT_SIZE_LEVELS).toContain(DEFAULT_MARKDOWN_TEXT_SIZE_LEVEL);
  });

  it("accepts only supported levels", () => {
    MARKDOWN_TEXT_SIZE_LEVELS.forEach((level) => {
      expect(isMarkdownTextSizeLevel(level)).toBe(true);
    });

    expect(isMarkdownTextSizeLevel(0)).toBe(false);
    expect(isMarkdownTextSizeLevel(6)).toBe(false);
    expect(isMarkdownTextSizeLevel(3.5)).toBe(false);
    expect(isMarkdownTextSizeLevel(NaN)).toBe(false);
    expect(isMarkdownTextSizeLevel("3")).toBe(false);
    expect(isMarkdownTextSizeLevel(null)).toBe(false);
    expect(isMarkdownTextSizeLevel(undefined)).toBe(false);
  });

  it("returns expected scales for each level", () => {
    expect(getMarkdownTextSizeScale(1)).toBe(0.88);
    expect(getMarkdownTextSizeScale(2)).toBe(0.94);
    expect(getMarkdownTextSizeScale(3)).toBe(1);
    expect(getMarkdownTextSizeScale(4)).toBe(1.08);
    expect(getMarkdownTextSizeScale(5)).toBe(1.16);
  });

  it("uses larger scales for larger levels", () => {
    const scales = MARKDOWN_TEXT_SIZE_LEVELS.map((level) => getMarkdownTextSizeScale(level));
    const isMonotonic = scales.every((scale, index) => index === 0 || scale > scales[index - 1]);

    expect(isMonotonic).toBe(true);
  });
});
