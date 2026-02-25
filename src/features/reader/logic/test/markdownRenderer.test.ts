import { DEFAULT_HTML_BLOCK_TARGET_MARKDOWN_CHARS } from "@/features/reader/logic/markdown/constants";
import { renderMarkdownToHtmlBlocksWithHeadings } from "@/features/reader/logic/markdownRenderer";
import {
  lexReaderMarkdown,
  renderReaderTokensToHtml,
} from "@/features/reader/logic/markdown/markedRenderer";
import {
  annotateHeadingTokensWithRenderClasses,
  removeTitleDuplicateHeading,
} from "@/features/reader/logic/markdown/tokenProcessing";
import { buildHtmlBlocksAndHeadings } from "@/features/reader/logic/markdown/chunking";

jest.mock("@/features/reader/logic/markdown/markedRenderer", () => ({
  lexReaderMarkdown: jest.fn(),
  renderReaderTokensToHtml: jest.fn(),
}));

jest.mock("@/features/reader/logic/markdown/tokenProcessing", () => ({
  annotateHeadingTokensWithRenderClasses: jest.fn(),
  removeTitleDuplicateHeading: jest.fn(),
}));

jest.mock("@/features/reader/logic/markdown/chunking", () => ({
  buildHtmlBlocksAndHeadings: jest.fn(),
}));

describe("markdownRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty result for blank markdown", () => {
    const result = renderMarkdownToHtmlBlocksWithHeadings("   \n  ");

    expect(result).toEqual({
      htmlBlocks: [],
      headings: [],
    });
    expect(lexReaderMarkdown).not.toHaveBeenCalled();
    expect(removeTitleDuplicateHeading).not.toHaveBeenCalled();
    expect(annotateHeadingTokensWithRenderClasses).not.toHaveBeenCalled();
    expect(buildHtmlBlocksAndHeadings).not.toHaveBeenCalled();
  });

  it("runs token pipeline and chunking with default target size", () => {
    const tokens = [{ type: "heading", text: "Hello" }] as any[];
    const expectedResult = {
      htmlBlocks: ["<h1>Hello</h1>"],
      headings: [{ slug: "hello", text: "Hello", level: 1, blockIndex: 0 }],
    };
    (lexReaderMarkdown as jest.Mock).mockReturnValue(tokens);
    (buildHtmlBlocksAndHeadings as jest.Mock).mockReturnValue(expectedResult);

    const result = renderMarkdownToHtmlBlocksWithHeadings("# Hello", "Hello");

    expect(result).toBe(expectedResult);
    expect(lexReaderMarkdown).toHaveBeenCalledWith("# Hello");
    expect(removeTitleDuplicateHeading).toHaveBeenCalledWith(tokens, "Hello");
    expect(annotateHeadingTokensWithRenderClasses).toHaveBeenCalledWith(tokens);
    expect(buildHtmlBlocksAndHeadings).toHaveBeenCalledWith(
      tokens,
      DEFAULT_HTML_BLOCK_TARGET_MARKDOWN_CHARS,
      renderReaderTokensToHtml,
    );
  });

  it("forwards custom block target size", () => {
    const tokens = [{ type: "paragraph", text: "Body" }] as any[];
    (lexReaderMarkdown as jest.Mock).mockReturnValue(tokens);
    (buildHtmlBlocksAndHeadings as jest.Mock).mockReturnValue({
      htmlBlocks: ["<p>Body</p>"],
      headings: [],
    });

    renderMarkdownToHtmlBlocksWithHeadings("Body", "Title", 999);

    expect(buildHtmlBlocksAndHeadings).toHaveBeenCalledWith(tokens, 999, renderReaderTokensToHtml);
  });
});
