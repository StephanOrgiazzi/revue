import {
  normalizeMarkdownLineEndings,
  extractMarkdownFrontMatter,
  parseMarkdownDocument,
} from ".././markdown";

describe("markdown utility", () => {
  describe("normalizeMarkdownLineEndings", () => {
    it("should convert CRLF to LF", () => {
      expect(normalizeMarkdownLineEndings("line1\r\nline2")).toBe("line1\nline2");
    });

    it("should keep LF as is", () => {
      expect(normalizeMarkdownLineEndings("line1\nline2")).toBe("line1\nline2");
    });
  });

  describe("extractMarkdownFrontMatter", () => {
    it("should return null frontMatter if no front matter is present", () => {
      const md = "# Hello World";
      const result = extractMarkdownFrontMatter(md);
      expect(result.frontMatter).toBeNull();
      expect(result.content).toBe(md);
    });

    it("should extract front matter correctly", () => {
      const md = "---\ntitle: Test\n---\nHello World";
      const result = extractMarkdownFrontMatter(md);
      expect(result.frontMatter).toBe("title: Test\n");
      expect(result.content).toBe("Hello World");
    });

    it("should handle CRLF in front matter", () => {
      const md = "---\r\ntitle: Test\r\n---\r\nHello World";
      const result = extractMarkdownFrontMatter(md);
      // The implementation seems to preserve the content as is but trims \r from lines it checks
      expect(result.frontMatter).not.toBeNull();
      expect(result.content).toBe("Hello World");
    });

    it("should handle missing closing ---", () => {
      const md = "---\ntitle: Test\nHello World";
      const result = extractMarkdownFrontMatter(md);
      expect(result.frontMatter).toBeNull();
      expect(result.content).toBe(md);
    });
  });

  describe("parseMarkdownDocument", () => {
    it("should parse document with front matter", () => {
      const md = '---\ntitle: "Hello World"\ntags: [tag1, tag2]\n---\nContent here';
      const doc = parseMarkdownDocument(md);
      expect(doc.data.title).toBe("Hello World");
      expect(doc.data.tags).toEqual(["tag1", "tag2"]);
      expect(doc.content).toBe("Content here");
    });

    it("should parse document with list tags", () => {
      const md = "---\ntitle: My Title\ntags:\n  - tagA\n  - tagB\n---\nContent";
      const doc = parseMarkdownDocument(md);
      expect(doc.data.title).toBe("My Title");
      expect(doc.data.tags).toEqual(["tagA", "tagB"]);
    });

    it("should handle single quote wrapping", () => {
      const md = "---\ntitle: 'Single Quoted'\n---\n";
      const doc = parseMarkdownDocument(md);
      expect(doc.data.title).toBe("Single Quoted");
    });

    it("should ignore comments in front matter", () => {
      const md = "---\ntitle: Test\n# comment\ntags: [tag]\n---\n";
      const doc = parseMarkdownDocument(md);
      expect(doc.data.title).toBe("Test");
      expect(doc.data.tags).toEqual(["tag"]);
    });

    it("should return empty data if no front matter matches", () => {
      const md = "---\nnot-a-key-value\n---";
      const doc = parseMarkdownDocument(md);
      expect(doc.data).toEqual({});
    });
  });
});
