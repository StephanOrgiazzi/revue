import { renderHook, waitFor } from "@testing-library/react-native";

import { useReaderArticle } from "@/features/reader/hooks/useReaderArticle";
import {
  getSingleRouteParam,
  readArticleById,
  readArticleContent,
} from "@/features/reader/logic/readerRepository";

jest.mock("@/features/reader/logic/readerRepository", () => ({
  getSingleRouteParam: jest.fn(),
  readArticleById: jest.fn(),
  readArticleContent: jest.fn(),
}));

describe("useReaderArticle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns missing-id error when route param is absent", async () => {
    (getSingleRouteParam as jest.Mock).mockReturnValue(undefined);
    const { result } = renderHook(() => useReaderArticle(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errorMessage).toBe("Missing article id.");
    expect(result.current.article).toBeNull();
    expect(result.current.content).toBe("");
  });

  it("returns not-found error when repository has no article", async () => {
    (getSingleRouteParam as jest.Mock).mockReturnValue("a-1");
    (readArticleById as jest.Mock).mockReturnValue(null);
    const { result } = renderHook(() => useReaderArticle("a-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(readArticleById).toHaveBeenCalledWith("a-1");
    expect(result.current.errorMessage).toBe("Article not found.");
  });

  it("hydrates article content when repository lookup succeeds", async () => {
    const article = {
      id: "a-2",
      title: "Title",
      localPath: "/tmp/path.md",
      createdAt: "2026-02-25T00:00:00.000Z",
      sourceUri: null,
    };
    (getSingleRouteParam as jest.Mock).mockReturnValue("a-2");
    (readArticleById as jest.Mock).mockReturnValue(article);
    (readArticleContent as jest.Mock).mockResolvedValue("# Body");
    const { result } = renderHook(() => useReaderArticle("a-2"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(readArticleContent).toHaveBeenCalledWith("/tmp/path.md", expect.any(Object));
    expect(result.current.article).toEqual(article);
    expect(result.current.content).toBe("# Body");
    expect(result.current.errorMessage).toBeNull();
  });

  it("surfaces read failures as user-facing errors", async () => {
    const article = {
      id: "a-3",
      title: "Title",
      localPath: "/tmp/broken.md",
      createdAt: "2026-02-25T00:00:00.000Z",
      sourceUri: null,
    };
    (getSingleRouteParam as jest.Mock).mockReturnValue("a-3");
    (readArticleById as jest.Mock).mockReturnValue(article);
    (readArticleContent as jest.Mock).mockRejectedValue(new Error("Disk unavailable"));
    const { result } = renderHook(() => useReaderArticle("a-3"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.article).toBeNull();
    expect(result.current.content).toBe("");
    expect(result.current.errorMessage).toBe("Disk unavailable");
  });
});
