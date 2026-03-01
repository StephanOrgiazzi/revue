import {
  readLibraryItems,
  readLibraryItemById,
  saveLibraryItem,
  deleteLibraryItem,
  readLibraryItemReadingPosition,
  saveLibraryItemReadingPosition,
} from ".././libraryRepository";
import { getLibraryIndex, saveLibraryIndex } from ".././libraryIndexStorage";
import { sortLibraryItems } from ".././libraryItemViewModel";
import { File } from "expo-file-system";
import type { LibraryItem } from ".././types";

const mockDirectoryInstances: Array<{ uri: string; delete: jest.Mock }> = [];

function mockJoinFsUri(parts: unknown[]): string {
  return parts.reduce<string>((currentUri, part) => {
    const nextPart =
      typeof part === "string"
        ? part
        : part && typeof part === "object" && "uri" in part
          ? String((part as { uri: string }).uri)
          : "";
    if (!currentUri) {
      return nextPart;
    }
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(nextPart)) {
      return nextPart;
    }

    return `${currentUri.replace(/\/+$/g, "")}/${nextPart.replace(/^\/+/g, "")}`;
  }, "");
}

jest.mock("@/features/library/logic/libraryIndexStorage");
jest.mock("@/features/library/logic/libraryItemViewModel");
jest.mock("@/shared/logic/platformStorage", () => ({
  createPlatformStorage: jest.fn(() => ({
    read: jest.fn(),
    write: jest.fn(),
  })),
}));
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    delete: jest.fn(),
  })),
  Directory: jest.fn().mockImplementation(function MockDirectory(...parts: unknown[]) {
    const directory = {
      uri: mockJoinFsUri(parts),
      delete: jest.fn(),
    };
    mockDirectoryInstances.push(directory);
    return directory;
  }),
  Paths: {
    document: "file://mock-doc-path",
  },
}));

describe("libraryRepository", () => {
  const mockItem: LibraryItem = {
    id: "1",
    title: "T",
    localPath: "file://path",
    createdAt: "2023",
    tags: [],
    lastAnchorSlug: null,
    lastScrollOffsetY: null,
    readingProgress: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDirectoryInstances.length = 0;
    (getLibraryIndex as jest.Mock).mockReturnValue({ "1": mockItem });
    (sortLibraryItems as jest.Mock).mockImplementation((items) => items);
  });

  it("readLibraryItems should return items from index", () => {
    const items = readLibraryItems();
    expect(items).toContain(mockItem);
    expect(getLibraryIndex).toHaveBeenCalled();
  });

  it("readLibraryItemById should return item if it exists", () => {
    expect(readLibraryItemById("1")).toBe(mockItem);
    expect(readLibraryItemById("nonexistent")).toBeNull();
  });

  it("saveLibraryItem should update index", () => {
    const newItem = { ...mockItem, title: "New" };
    saveLibraryItem(newItem);
    expect(saveLibraryIndex).toHaveBeenCalledWith(expect.objectContaining({ "1": newItem }));
  });

  it("deleteLibraryItem should remove from index and delete file", () => {
    const index = { "1": mockItem };
    (getLibraryIndex as jest.Mock).mockReturnValue(index);

    deleteLibraryItem(mockItem as any);

    expect(index["1"]).toBeUndefined();
    expect(saveLibraryIndex).toHaveBeenCalledWith(index);
    expect(File).toHaveBeenCalledWith("file://path");
  });

  it("deleteLibraryItem should delete managed article directory when localPath is inside it", () => {
    const managedItem: LibraryItem = {
      ...mockItem,
      id: "article-1",
      localPath: "file://mock-doc-path/articles/article-1/article.md",
    };
    const index = { "article-1": managedItem };
    (getLibraryIndex as jest.Mock).mockReturnValue(index);

    deleteLibraryItem(managedItem);

    const managedDirectoryInstance = mockDirectoryInstances.find(
      (directory) => directory.uri === "file://mock-doc-path/articles/article-1",
    );

    expect(managedDirectoryInstance?.delete).toHaveBeenCalledTimes(1);
  });

  it("readLibraryItemReadingPosition should return position", () => {
    const itemWithPos = { ...mockItem, lastAnchorSlug: "slug", lastScrollOffsetY: 100 };
    (getLibraryIndex as jest.Mock).mockReturnValue({ "1": itemWithPos });

    const pos = readLibraryItemReadingPosition("1");
    expect(pos).toEqual({ anchorSlug: "slug", scrollOffsetY: 100 });
  });

  it("saveLibraryItemReadingPosition should update position", () => {
    const index = { "1": mockItem };
    (getLibraryIndex as jest.Mock).mockReturnValue(index);

    saveLibraryItemReadingPosition("1", { anchorSlug: "new-slug", scrollOffsetY: 200 });

    expect(saveLibraryIndex).toHaveBeenCalled();
    expect(index["1"].lastAnchorSlug).toBe("new-slug");
    expect(index["1"].lastScrollOffsetY).toBe(200);
  });
});
