import { renderHook } from "@testing-library/react-native";

import { useReaderScreenViewModel } from "@/features/reader/hooks/useReaderScreenViewModel";
import { getTheme } from "@/shared/themes/themes";

jest.mock("@/features/reader/components/ReaderHtmlRenderers", () => ({
  readerHtmlRenderers: { custom: "renderers" },
}));

jest.mock("@/features/reader/logic/readerHtmlStyles", () => ({
  createReaderHtmlStyles: jest.fn(() => ({ baseStyle: {}, tagsStyles: {}, classesStyles: {} })),
}));

jest.mock("@/features/reader/logic/readerScreenUtils", () => ({
  MAX_HTML_CONTENT_WIDTH: 840,
  MIN_HTML_CONTENT_WIDTH: 280,
  buildArticleMeta: jest.fn((date) => (date ? `meta:${date}` : "meta:")),
  buildHtmlSystemFonts: jest.fn(() => ["System", "monospace"]),
  buildListMarkerRenderersProps: jest.fn((color) => ({ color })),
  shouldShowHeaderFromHtmlBlocks: jest.fn((blocks) => blocks.length > 0),
}));

jest.mock("@/features/reader/logic/markdownRenderer", () => ({
  renderMarkdownToHtmlBlocksWithHeadings: jest.fn((content: string) =>
    content.trim()
      ? {
          htmlBlocks: ["<p>content</p>"],
          headings: [{ slug: "h-1", text: "H1", level: 2, blockIndex: 0 }],
        }
      : { htmlBlocks: [], headings: [] },
  ),
}));

jest.mock("@/features/reader/logic/readerTableOfContents", () => ({
  buildReaderTocHeadings: jest.fn((headings, articleTitle, shouldShow) =>
    shouldShow && articleTitle
      ? [{ slug: "title", text: articleTitle, level: 1, blockIndex: -1 }]
      : headings,
  ),
}));

describe("useReaderScreenViewModel", () => {
  it("builds reader view-model for non-empty content", () => {
    const theme = getTheme("light");
    const { result } = renderHook(() =>
      useReaderScreenViewModel({
        articleTitle: "My Article",
        articleCreatedAt: "2026-02-20T00:00:00.000Z",
        content: "# Hello",
        theme,
        markdownTextSizeLevel: 3,
        insetsTop: 20,
        windowWidth: 420,
      }),
    );

    expect(result.current.screenTitle).toBe("My Article");
    expect(result.current.articleTitle).toBe("My Article");
    expect(result.current.isContentEmpty).toBe(false);
    expect(result.current.shouldShowArticleHeader).toBe(true);
    expect(result.current.htmlBlocks).toEqual(["<p>content</p>"]);
    expect(result.current.tocHeadings).toEqual([
      { slug: "title", text: "My Article", level: 1, blockIndex: -1 },
    ]);
    expect(result.current.pageBackgroundColor).toBe(theme.colors.pageBackground);
    expect(result.current.htmlRenderers).toEqual({ custom: "renderers" });
    expect(result.current.htmlSystemFonts).toEqual(["System", "monospace"]);
  });

  it("falls back when title/content are missing and clamps content width", () => {
    const theme = getTheme("paper");
    const { result } = renderHook(() =>
      useReaderScreenViewModel({
        articleTitle: undefined,
        articleCreatedAt: undefined,
        content: "   ",
        theme,
        markdownTextSizeLevel: 1,
        insetsTop: 0,
        windowWidth: 120,
      }),
    );

    expect(result.current.screenTitle).toBe("Reader");
    expect(result.current.articleTitle).toBe("Untitled");
    expect(result.current.isContentEmpty).toBe(true);
    expect(result.current.shouldShowArticleHeader).toBe(false);
    expect(result.current.htmlContentWidth).toBe(280);
    expect(result.current.tocHeadings).toEqual([]);
  });
});
