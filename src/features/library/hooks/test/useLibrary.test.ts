import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useLibrary } from ".././useLibrary";
import * as Linking from "expo-linking";
import {
  readInitialLibrarySnapshot,
  importLibraryItemFromPicker,
  importLibraryItemFromUri,
  deleteLibraryItemWithOptimisticUpdate,
} from "@/features/library/logic/libraryService";
import { resolveIncomingImportUri } from "@/features/library/logic/web/importUri";
import { resolveWebMockMarkdownUris } from "@/features/library/logic/web/mockMarkdown";

jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(),
  getInitialURL: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/features/library/logic/libraryService", () => ({
  ...jest.requireActual("@/features/library/logic/libraryService"),
  readInitialLibrarySnapshot: jest.fn(() => ({ items: [], errorMessage: null })),
  importLibraryItemFromPicker: jest.fn(),
  importLibraryItemFromUri: jest.fn(),
  deleteLibraryItemWithOptimisticUpdate: jest.fn(),
}));

jest.mock("@/features/library/logic/web/importUri", () => ({
  resolveIncomingImportUri: jest.fn(),
}));

jest.mock("@/features/library/logic/web/mockMarkdown", () => ({
  resolveWebMockMarkdownUris: jest.fn(() => []),
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => {};
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

describe("useLibrary", () => {
  const mockRemoveListener = jest.fn();
  const mockItem = {
    id: "1",
    title: "Alpha",
    localPath: "/alpha.md",
    tags: [],
    createdAt: "2026-02-25T00:00:00.000Z",
    lastAnchorSlug: null,
    lastScrollOffsetY: null,
    readingProgress: 0,
  };
  let urlListener: ((event: { url: string }) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    urlListener = null;
    mockRemoveListener.mockClear();

    (Linking.addEventListener as jest.Mock).mockImplementation(
      (_eventName: string, listener: (event: { url: string }) => void) => {
        urlListener = listener;
        return { remove: mockRemoveListener };
      },
    );
    (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);
    (resolveIncomingImportUri as jest.Mock).mockReturnValue(null);
    (resolveWebMockMarkdownUris as jest.Mock).mockReturnValue([]);
    (readInitialLibrarySnapshot as jest.Mock).mockReturnValue({
      items: [],
      errorMessage: null,
    });
    (importLibraryItemFromPicker as jest.Mock).mockResolvedValue({
      importedArticleId: null,
      errorMessage: null,
    });
    (importLibraryItemFromUri as jest.Mock).mockResolvedValue({
      importedArticleId: null,
      errorMessage: null,
    });
    (deleteLibraryItemWithOptimisticUpdate as jest.Mock).mockResolvedValue({
      errorMessage: null,
    });
  });

  it("initializes from snapshot and exposes derived count label", () => {
    (readInitialLibrarySnapshot as jest.Mock).mockReturnValue({
      items: [mockItem],
      errorMessage: null,
    });

    const { result } = renderHook(() => useLibrary());

    expect(result.current.items).toEqual([mockItem]);
    expect(result.current.itemCountLabel).toBe("1 article");
    expect(Linking.addEventListener).toHaveBeenCalledWith("url", expect.any(Function));
  });

  it("surfaces picker import errors to hook state", async () => {
    (importLibraryItemFromPicker as jest.Mock).mockResolvedValue({
      importedArticleId: null,
      errorMessage: "Import failed",
    });
    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.importArticle();
    });

    expect(importLibraryItemFromPicker).toHaveBeenCalledWith(expect.any(Object));
    expect(result.current.errorMessage).toBe("Import failed");
  });

  it("calls delete workflow for existing items and sets delete errors", async () => {
    (readInitialLibrarySnapshot as jest.Mock).mockReturnValue({
      items: [mockItem],
      errorMessage: null,
    });
    (deleteLibraryItemWithOptimisticUpdate as jest.Mock).mockResolvedValue({
      errorMessage: "Delete failed",
    });

    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.removeArticle(mockItem);
    });

    expect(deleteLibraryItemWithOptimisticUpdate).toHaveBeenCalledWith(
      mockItem,
      expect.any(Object),
    );
    expect(result.current.errorMessage).toBe("Delete failed");
  });

  it("skips delete workflow when the target item is not in memory", async () => {
    (readInitialLibrarySnapshot as jest.Mock).mockReturnValue({
      items: [mockItem],
      errorMessage: null,
    });

    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.removeArticle({
        ...mockItem,
        id: "missing-id",
      });
    });

    expect(deleteLibraryItemWithOptimisticUpdate).not.toHaveBeenCalled();
  });

  it("imports from initial URL and exposes auto-open article id", async () => {
    (Linking.getInitialURL as jest.Mock).mockResolvedValue("my-app://import");
    (resolveIncomingImportUri as jest.Mock).mockReturnValue(" file:///docs/article.md ");
    (importLibraryItemFromUri as jest.Mock).mockResolvedValue({
      importedArticleId: "article-2",
      errorMessage: null,
    });

    const { result } = renderHook(() => useLibrary());

    await waitFor(() => {
      expect(importLibraryItemFromUri).toHaveBeenCalledWith(
        "file:///docs/article.md",
        expect.any(Object),
      );
    });
    expect(result.current.pendingAutoOpenArticleId).toBe("article-2");

    act(() => {
      result.current.consumePendingAutoOpenArticleId();
    });
    expect(result.current.pendingAutoOpenArticleId).toBeNull();
  });

  it("deduplicates in-flight link imports and removes listener on unmount", async () => {
    (resolveIncomingImportUri as jest.Mock).mockReturnValue("file:///docs/article.md");
    const deferredImport = createDeferred<{
      importedArticleId: string | null;
      errorMessage: string | null;
    }>();
    (importLibraryItemFromUri as jest.Mock).mockReturnValue(deferredImport.promise);

    const { unmount } = renderHook(() => useLibrary());

    expect(urlListener).not.toBeNull();
    act(() => {
      urlListener?.({ url: "my-app://import" });
      urlListener?.({ url: "my-app://import" });
    });

    expect(importLibraryItemFromUri).toHaveBeenCalledTimes(1);

    deferredImport.resolve({ importedArticleId: null, errorMessage: null });
    await waitFor(() => {
      expect(importLibraryItemFromUri).toHaveBeenCalledTimes(1);
    });

    unmount();
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
  });
});
