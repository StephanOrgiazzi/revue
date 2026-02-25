import {
  resolveAnchorScrollOffset,
  buildReaderTocHeadings,
  resolveHeadingForScrollOffset,
  TITLE_TOC_BLOCK_INDEX,
} from ".././readerTableOfContents";

describe("readerTableOfContents", () => {
  describe("resolveAnchorScrollOffset", () => {
    it("should calculate offset with alignment", () => {
      expect(resolveAnchorScrollOffset(100)).toBe(80);
      expect(resolveAnchorScrollOffset(10)).toBe(0);
    });
  });

  describe("buildReaderTocHeadings", () => {
    const headings = [{ slug: "h1", text: "H1", level: 2, blockIndex: 0 }] as any[];

    it("should prepend title heading if header should be shown", () => {
      const result = buildReaderTocHeadings(headings, "My Title", true);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("My Title");
      expect(result[0].blockIndex).toBe(TITLE_TOC_BLOCK_INDEX);
    });

    it("should not prepend if header should not be shown", () => {
      const result = buildReaderTocHeadings(headings, "My Title", false);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("h1");
    });

    it("should handle missing title", () => {
      const result = buildReaderTocHeadings(headings, undefined, true);
      expect(result).toHaveLength(1);
    });
  });

  describe("resolveHeadingForScrollOffset", () => {
    const headings = [
      { slug: "title", text: "T", level: 1, blockIndex: TITLE_TOC_BLOCK_INDEX },
      { slug: "h1", text: "H1", level: 2, blockIndex: 0 },
      { slug: "h2", text: "H2", level: 2, blockIndex: 1 },
    ] as any[];
    const blockOffsets = { 0: 100, 1: 500 };

    it("should return null for empty headings", () => {
      expect(resolveHeadingForScrollOffset(0, [], {})).toBeNull();
    });

    it("should return title heading if scroll is at top", () => {
      const active = resolveHeadingForScrollOffset(0, headings, blockOffsets);
      expect(active?.slug).toBe("title");
    });

    it("should return correct heading based on scroll position", () => {
      // scroll is at 100. targetOffsetY = 100 + 24 = 124.
      // H1 (block 0) offset is 100 <= 124, so H1 is active.
      // H2 (block 1) offset is 500 > 124.
      const active = resolveHeadingForScrollOffset(100, headings, blockOffsets);
      expect(active?.slug).toBe("h1");
    });

    it("should return top heading if first non-title heading is ahead", () => {
      const active = resolveHeadingForScrollOffset(40, headings, blockOffsets);
      expect(active?.slug).toBe("title");
    });
  });
});
