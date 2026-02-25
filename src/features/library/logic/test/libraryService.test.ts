import {
  readInitialLibrarySnapshot,
  appendPendingArticleId,
  removePendingArticleId,
  appendLibraryItem,
  importLibraryItemFromPicker,
  deleteLibraryItemWithOptimisticUpdate,
} from ".././libraryService";
import { readLibraryItems, saveLibraryItem, deleteLibraryItem } from ".././libraryRepository";
import { pickMarkdownDocument, finalizeMarkdownImport } from ".././importMarkdown";

jest.mock(".././libraryRepository");
jest.mock(".././importMarkdown");
jest.mock(".././libraryItemViewModel", () => ({
  sortLibraryItems: jest.fn((items) => items),
}));

describe("libraryService", () => {
  const mockItem = { id: "1", title: "T", createdAt: "2023" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("readInitialLibrarySnapshot", () => {
    it("should return items from repository", () => {
      (readLibraryItems as jest.Mock).mockReturnValue([mockItem]);
      const result = readInitialLibrarySnapshot();
      expect(result.items).toEqual([mockItem]);
    });

    it("should handle repository errors", () => {
      (readLibraryItems as jest.Mock).mockImplementation(() => {
        throw new Error("E");
      });
      const result = readInitialLibrarySnapshot();
      expect(result.items).toEqual([]);
      expect(result.errorMessage).toBe("Failed to load local library index.");
    });
  });

  describe("array operations", () => {
    it("appendPendingArticleId should add id", () => {
      expect(appendPendingArticleId(["1"], "2")).toEqual(["1", "2"]);
    });

    it("removePendingArticleId should remove id", () => {
      expect(removePendingArticleId(["1", "2"], "1")).toEqual(["2"]);
    });

    it("appendLibraryItem should add item", () => {
      const result = appendLibraryItem([], mockItem as any);
      expect(result).toEqual([mockItem]);
    });
  });

  describe("import workflows", () => {
    const mockWorkflowState = {
      addPendingArticleId: jest.fn(),
      removePendingArticleId: jest.fn(),
      appendItem: jest.fn(),
      replaceItem: jest.fn(),
      removeItem: jest.fn(),
    };

    it("importLibraryItemFromPicker should handle successful import", async () => {
      (pickMarkdownDocument as jest.Mock).mockResolvedValue({ name: "file.md", uri: "u" });
      (finalizeMarkdownImport as jest.Mock).mockResolvedValue(mockItem);

      const result = await importLibraryItemFromPicker(mockWorkflowState);

      expect(result.importedArticleId).toBe("1");
      expect(result.errorMessage).toBeNull();
      expect(mockWorkflowState.addPendingArticleId).toHaveBeenCalledTimes(1);
      expect(mockWorkflowState.appendItem).toHaveBeenCalledTimes(1);
      expect(saveLibraryItem).toHaveBeenCalledWith(mockItem);
      expect(mockWorkflowState.replaceItem).toHaveBeenCalledWith(mockItem);
      expect(mockWorkflowState.removePendingArticleId).toHaveBeenCalledTimes(1);
      expect(mockWorkflowState.removeItem).not.toHaveBeenCalled();
    });

    it("importLibraryItemFromPicker should handle cancellation", async () => {
      (pickMarkdownDocument as jest.Mock).mockResolvedValue(null);
      const result = await importLibraryItemFromPicker(mockWorkflowState);
      expect(result.importedArticleId).toBeNull();
      expect(result.errorMessage).toBeNull();
      expect(saveLibraryItem).not.toHaveBeenCalled();
      expect(mockWorkflowState.addPendingArticleId).not.toHaveBeenCalled();
      expect(mockWorkflowState.appendItem).not.toHaveBeenCalled();
      expect(mockWorkflowState.replaceItem).not.toHaveBeenCalled();
      expect(mockWorkflowState.removePendingArticleId).not.toHaveBeenCalled();
    });
  });

  describe("delete workflow", () => {
    const mockDeleteWorkflowState = {
      removeItem: jest.fn(),
      restoreItem: jest.fn(),
      replaceItems: jest.fn(),
    };

    it("deleteLibraryItemWithOptimisticUpdate should update optimistically", async () => {
      (deleteLibraryItem as jest.Mock).mockReturnValue([]);

      await deleteLibraryItemWithOptimisticUpdate(mockItem as any, mockDeleteWorkflowState);

      expect(mockDeleteWorkflowState.removeItem).toHaveBeenCalledWith("1");
      expect(deleteLibraryItem).toHaveBeenCalledWith(mockItem);
      expect(mockDeleteWorkflowState.replaceItems).toHaveBeenCalledWith([]);
    });

    it("deleteLibraryItemWithOptimisticUpdate should restore on failure", async () => {
      (deleteLibraryItem as jest.Mock).mockImplementation(() => {
        throw new Error("E");
      });

      const result = await deleteLibraryItemWithOptimisticUpdate(
        mockItem as any,
        mockDeleteWorkflowState,
      );

      expect(mockDeleteWorkflowState.restoreItem).toHaveBeenCalledWith(mockItem);
      expect(result).toEqual({ errorMessage: "E" });
    });
  });
});
