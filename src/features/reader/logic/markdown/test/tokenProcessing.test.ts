import type { Token } from "marked";
import {
  isHeadingBlockToken,
  removeTitleDuplicateHeading,
  annotateHeadingTokensWithRenderClasses,
} from ".././tokenProcessing";
import { READER_H3_AFTER_H2_CLASS_NAME } from ".././constants";

describe("tokenProcessing", () => {
  describe("isHeadingBlockToken", () => {
    it("should return true if token type is heading", () => {
      expect(isHeadingBlockToken({ type: "heading" } as Token)).toBe(true);
    });

    it("should return false if token type is not heading", () => {
      expect(isHeadingBlockToken({ type: "paragraph" } as Token)).toBe(false);
      expect(isHeadingBlockToken(undefined)).toBe(false);
    });
  });

  describe("removeTitleDuplicateHeading", () => {
    it("should remove the first heading if it matches the article title", () => {
      const tokens = [
        { type: "heading", text: "My Title", depth: 1 } as Token,
        { type: "paragraph", text: "Some text" } as Token,
      ];
      removeTitleDuplicateHeading(tokens, "My Title");
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe("paragraph");
    });

    it("should not remove anything if title does not match", () => {
      const tokens = [{ type: "heading", text: "Another Title", depth: 1 } as Token];
      removeTitleDuplicateHeading(tokens, "My Title");
      expect(tokens).toHaveLength(1);
    });

    it("should do nothing if no title provided", () => {
      const tokens = [{ type: "heading", text: "T", depth: 1 } as Token];
      removeTitleDuplicateHeading(tokens, undefined);
      expect(tokens).toHaveLength(1);
    });
  });

  describe("annotateHeadingTokensWithRenderClasses", () => {
    it("should add specific class to H3 that follows H2", () => {
      const tokens = [
        { type: "heading", depth: 2, text: "H2" } as Token,
        { type: "heading", depth: 3, text: "H3" } as Token,
      ];
      annotateHeadingTokensWithRenderClasses(tokens);
      const h3 = tokens[1] as any;
      expect(h3.readerClassNames).toContain(READER_H3_AFTER_H2_CLASS_NAME);
    });

    it("should not add class to H3 if it does not follow H2", () => {
      const tokens = [
        { type: "heading", depth: 1, text: "H1" } as Token,
        { type: "heading", depth: 3, text: "H3" } as Token,
      ];
      annotateHeadingTokensWithRenderClasses(tokens);
      const h3 = tokens[1] as any;
      expect(h3.readerClassNames).toBeUndefined();
    });

    it("should handle whitespace between H2 and H3", () => {
      const tokens = [
        { type: "heading", depth: 2, text: "H2" } as Token,
        { type: "space" } as Token,
        { type: "heading", depth: 3, text: "H3" } as Token,
      ];
      annotateHeadingTokensWithRenderClasses(tokens);
      const h3 = tokens[2] as any;
      expect(h3.readerClassNames).toContain(READER_H3_AFTER_H2_CLASS_NAME);
    });
  });
});
