import { getSingleRouteParam, readArticleById, readArticleContent } from ".././readerRepository";
import { readLibraryItemById } from "@/features/library/logic/libraryRepository";
import { canReadTextFromWebUri, readTextFromWebUri } from "@/shared/logic/web/textUri";

jest.mock("@/features/library/logic/libraryRepository");
jest.mock("@/shared/logic/web/textUri");
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    text: jest.fn().mockResolvedValue("file content"),
  })),
}));

describe("readerRepository", () => {
  describe("getSingleRouteParam", () => {
    it("should return string as is", () => {
      expect(getSingleRouteParam("id")).toBe("id");
    });

    it("should return first element of array", () => {
      expect(getSingleRouteParam(["id1", "id2"])).toBe("id1");
    });

    it("should handle undefined", () => {
      expect(getSingleRouteParam(undefined)).toBeUndefined();
    });
  });

  describe("readArticleById", () => {
    it("should call readLibraryItemById", () => {
      (readLibraryItemById as jest.Mock).mockReturnValue({ id: "1" });
      const result = readArticleById("1");
      expect(result?.id).toBe("1");
      expect(readLibraryItemById).toHaveBeenCalledWith("1");
    });
  });

  describe("readArticleContent", () => {
    it("should read from web if canReadTextFromWebUri is true", async () => {
      (canReadTextFromWebUri as jest.Mock).mockReturnValue(true);
      (readTextFromWebUri as jest.Mock).mockResolvedValue("web content");

      const content = await readArticleContent("http://example.com");
      expect(content).toBe("web content");
      expect(readTextFromWebUri).toHaveBeenCalledWith("http://example.com");
    });

    it("should read from file if canReadTextFromWebUri is false", async () => {
      (canReadTextFromWebUri as jest.Mock).mockReturnValue(false);

      const content = await readArticleContent("file://path");
      expect(content).toBe("file content");
    });

    it("should sanitize base64 images", async () => {
      (canReadTextFromWebUri as jest.Mock).mockReturnValue(true);
      const mdWithImage =
        "![img](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==)";
      (readTextFromWebUri as jest.Mock).mockResolvedValue(mdWithImage);

      const content = await readArticleContent("http://img.com");
      expect(content).toContain("[base64-omitted]");
      expect(content).not.toContain("iVBORw0KGgo");
    });

    it("should throw if aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(readArticleContent("path", { signal: controller.signal })).rejects.toThrow(
        "The operation was aborted.",
      );
    });
  });
});
