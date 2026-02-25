import {
  escapeHtml,
  normalizeCodeLanguageClassName,
  normalizeMathExpression,
  normalizeComparableText,
  normalizeHeadingLevel,
} from ".././markdownUtils";

describe("markdownUtils", () => {
  describe("escapeHtml", () => {
    it("should escape HTML characters", () => {
      expect(escapeHtml('<b>"Me & You"</b>')).toBe("&lt;b&gt;&quot;Me &amp; You&quot;&lt;/b&gt;");
    });
  });

  describe("normalizeCodeLanguageClassName", () => {
    it("should return empty string for undefined", () => {
      expect(normalizeCodeLanguageClassName(undefined)).toBe("");
    });

    it("should normalize language name", () => {
      expect(normalizeCodeLanguageClassName(" Type Script! ")).toBe("type-script");
    });
  });

  describe("normalizeMathExpression", () => {
    it("should normalize line endings and trim", () => {
      expect(normalizeMathExpression("  a + b\r\nc  ")).toBe("a + b\nc");
    });
  });

  describe("normalizeComparableText", () => {
    it("should normalize text for comparison", () => {
      expect(normalizeComparableText(" Hello, World! ")).toBe("hello world");
    });
  });

  describe("normalizeHeadingLevel", () => {
    it("should stay within 1-6 range", () => {
      expect(normalizeHeadingLevel(0)).toBe(1);
      expect(normalizeHeadingLevel(7)).toBe(6);
      expect(normalizeHeadingLevel(3)).toBe(3);
    });
  });
});
