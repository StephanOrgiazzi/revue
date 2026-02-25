import type { Token } from "marked";
import { buildHtmlBlocksAndHeadings } from ".././chunking";

describe("chunking", () => {
  const mockRender = (tokens: Token[]) => tokens.map((t) => (t as any).text || "html").join(",");

  it("should split tokens into chunks based on size", () => {
    const tokens = [
      { type: "paragraph", raw: "12345", text: "p1" } as Token,
      { type: "paragraph", raw: "12345", text: "p2" } as Token,
      { type: "paragraph", raw: "12345", text: "p3" } as Token,
    ];

    // Max size 12 should put p1 and p2 in first chunk, p3 in second
    const result = buildHtmlBlocksAndHeadings(tokens, 12, mockRender);

    expect(result.htmlBlocks).toHaveLength(2);
    expect(result.htmlBlocks[0]).toBe("p1,p2");
    expect(result.htmlBlocks[1]).toBe("p3");
  });

  it("should split chunks at headings", () => {
    const tokens = [
      { type: "paragraph", raw: "p1", text: "p1" } as Token,
      { type: "heading", depth: 2, raw: "h2", text: "h2" } as Token,
      { type: "paragraph", raw: "p2", text: "p2" } as Token,
    ];

    // Headings should start a new chunk
    const result = buildHtmlBlocksAndHeadings(tokens, 100, mockRender);

    expect(result.htmlBlocks).toHaveLength(2);
    expect(result.htmlBlocks[0]).toBe("p1");
    expect(result.htmlBlocks[1]).toBe("h2,p2");
    expect(result.headings).toHaveLength(1);
    expect(result.headings[0].text).toBe("h2");
    expect(result.headings[0].blockIndex).toBe(1);
  });

  it("should handle duplicate heading text by generating unique slugs", () => {
    const tokens = [
      { type: "heading", depth: 2, raw: "h", text: "Test" } as Token,
      { type: "paragraph", raw: "p", text: "p" } as Token,
      { type: "heading", depth: 2, raw: "h", text: "Test" } as Token,
    ];

    const result = buildHtmlBlocksAndHeadings(tokens, 1, mockRender);

    expect(result.headings).toHaveLength(2);
    expect(result.headings[0].slug).toBe("heading-test");
    expect(result.headings[1].slug).toBe("heading-test-2");
  });

  it("should handle tokens without raw property", () => {
    const tokens = [{ type: "paragraph", text: "p1" } as Token];

    const result = buildHtmlBlocksAndHeadings(tokens, 10, mockRender);
    expect(result.htmlBlocks).toHaveLength(1);
  });
});
