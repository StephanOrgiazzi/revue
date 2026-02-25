import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useReaderPosition } from "@/features/reader/hooks/useReaderPosition";
import {
  readLibraryItemReadingPosition,
  saveLibraryItemReadingPosition,
} from "@/features/library/logic/libraryRepository";
import {
  resolveAnchorScrollOffset,
  resolveHeadingForScrollOffset,
  TITLE_TOC_BLOCK_INDEX,
} from "@/features/reader/logic/readerTableOfContents";

jest.mock("@/features/library/logic/libraryRepository", () => ({
  readLibraryItemReadingPosition: jest.fn(() => ({ anchorSlug: null, scrollOffsetY: null })),
  saveLibraryItemReadingPosition: jest.fn(),
}));

jest.mock("@/features/reader/logic/readerTableOfContents", () => ({
  TITLE_TOC_BLOCK_INDEX: -1,
  resolveAnchorScrollOffset: jest.fn((value) => value - 20),
  resolveHeadingForScrollOffset: jest.fn(() => null),
}));

const tocHeadings = [
  { slug: "title", text: "Title", level: 1, blockIndex: TITLE_TOC_BLOCK_INDEX },
  { slug: "h-1", text: "H1", level: 2, blockIndex: 0 },
  { slug: "h-2", text: "H2", level: 2, blockIndex: 1 },
] as const;

describe("useReaderPosition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("restores stored scroll offset after content is measured", async () => {
    (readLibraryItemReadingPosition as jest.Mock).mockReturnValue({
      anchorSlug: "h-2",
      scrollOffsetY: 250,
    });
    (resolveHeadingForScrollOffset as jest.Mock).mockReturnValue(tocHeadings[2]);
    const scrollTo = jest.fn();
    const { result } = renderHook(() =>
      useReaderPosition({
        articleId: "a-1",
        htmlBlocks: ["<p>a</p>"],
        tocHeadings: [...tocHeadings],
        isLoading: false,
      }),
    );

    act(() => {
      result.current.articleScrollRef.current = { scrollTo } as any;
      result.current.handleContentSizeChange();
    });

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({ y: 250, animated: false });
      expect(result.current.isReadingPositionRestoreReady).toBe(true);
      expect(result.current.shouldSuppressListHeader).toBe(false);
    });
  });

  it("restores using stored anchor when no scroll offset is persisted", async () => {
    (readLibraryItemReadingPosition as jest.Mock).mockReturnValue({
      anchorSlug: "h-1",
      scrollOffsetY: null,
    });
    const scrollTo = jest.fn();
    const { result } = renderHook(() =>
      useReaderPosition({
        articleId: "a-2",
        htmlBlocks: ["<p>a</p>"],
        tocHeadings: [...tocHeadings],
        isLoading: false,
      }),
    );

    act(() => {
      result.current.articleScrollRef.current = { scrollTo } as any;
      result.current.handleBlockLayout(0, 180);
    });

    await waitFor(() => {
      expect(resolveAnchorScrollOffset).toHaveBeenCalledWith(180);
      expect(scrollTo).toHaveBeenCalledWith({ y: 160, animated: false });
      expect(result.current.isReadingPositionRestoreReady).toBe(true);
    });
  });

  it("selecting headings scrolls to top or block offset", () => {
    const scrollTo = jest.fn();
    const { result } = renderHook(() =>
      useReaderPosition({
        articleId: "a-3",
        htmlBlocks: ["<p>a</p>"],
        tocHeadings: [...tocHeadings],
        isLoading: false,
      }),
    );

    act(() => {
      result.current.articleScrollRef.current = { scrollTo } as any;
      result.current.handleBlockLayout(1, 300);
      result.current.handleSelectHeading(tocHeadings[0] as any);
      result.current.handleSelectHeading(tocHeadings[2] as any);
    });

    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
    expect(resolveAnchorScrollOffset).toHaveBeenCalledWith(300);
    expect(scrollTo).toHaveBeenCalledWith({ y: 280, animated: true });
    expect(result.current.activeHeadingSlug).toBe("h-2");
  });

  it("persists null position below threshold and concrete position above threshold", () => {
    const { result } = renderHook(() =>
      useReaderPosition({
        articleId: "a-4",
        htmlBlocks: ["<p>a</p>"],
        tocHeadings: [...tocHeadings],
        isLoading: false,
      }),
    );

    act(() => {
      result.current.handleArticleScroll({
        nativeEvent: { contentOffset: { y: 60 } },
      } as any);
      result.current.persistReadingPosition();
    });
    expect(saveLibraryItemReadingPosition).toHaveBeenCalledWith("a-4", {
      anchorSlug: null,
      scrollOffsetY: null,
    });

    act(() => {
      result.current.handleArticleScroll({
        nativeEvent: { contentOffset: { y: 245.6 } },
      } as any);
      result.current.persistReadingPosition();
    });
    expect(saveLibraryItemReadingPosition).toHaveBeenCalledWith("a-4", {
      anchorSlug: "h-1",
      scrollOffsetY: 246,
    });
  });
});
