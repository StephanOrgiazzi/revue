import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import {
  pickMarkdownDocument,
  createPickedMarkdownAssetFromUri,
  finalizeMarkdownImport,
} from ".././importMarkdown";
import { readTextFromWebUri } from "@/shared/logic/web/textUri";
import { parseMarkdownDocument } from "@/shared/logic/markdown";

jest.mock("expo-document-picker");
jest.mock("@/shared/logic/web/textUri");
jest.mock("@/shared/logic/markdown");

describe("importMarkdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("pickMarkdownDocument", () => {
    it("should return picked asset on success", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ name: "test.md", uri: "file://test.md" }],
      });

      const result = await pickMarkdownDocument();
      expect(result?.name).toBe("test.md");
    });

    it("should return null on cancel", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true });
      const result = await pickMarkdownDocument();
      expect(result).toBeNull();
    });

    it("should throw for non-md files", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ name: "test.txt", uri: "file://test.txt" }],
      });
      await expect(pickMarkdownDocument()).rejects.toThrow("Only .md files are supported.");
    });
  });

  describe("createPickedMarkdownAssetFromUri", () => {
    it("should extract filename from URI", () => {
      const result = createPickedMarkdownAssetFromUri("https://example.com/path/doc.md?q=1");
      expect(result?.name).toBe("doc.md");
      expect(result?.uri).toBe("https://example.com/path/doc.md?q=1");
    });

    it("should handle URIs without extensions", () => {
      const result = createPickedMarkdownAssetFromUri("https://example.com/path/doc");
      expect(result?.name).toBe("doc.md");
    });
  });

  describe("finalizeMarkdownImport", () => {
    it("should process markdown and return library item", async () => {
      Platform.OS = "web";
      (readTextFromWebUri as jest.Mock).mockResolvedValue("# Title\nContent");
      (parseMarkdownDocument as jest.Mock).mockReturnValue({
        content: "# Title\nContent",
        data: {},
      });

      const pickedAsset = { name: "test.md", uri: "http://test.md" };
      const options = { id: "1", createdAt: "2023-01-01" };

      const result = await finalizeMarkdownImport(pickedAsset, options as any);

      expect(result.id).toBe("1");
      expect(result.title).toBe("Title");
      expect(result.localPath).toBe("http://test.md");
    });

    it("should use frontmatter title if available", async () => {
      Platform.OS = "web";
      (readTextFromWebUri as jest.Mock).mockResolvedValue("---Title: FM Title---");
      (parseMarkdownDocument as jest.Mock).mockReturnValue({
        content: "Content",
        data: { title: "FM Title" },
      });

      const pickedAsset = { name: "test.md", uri: "http://test.md" };
      const result = await finalizeMarkdownImport(pickedAsset, { id: "1", createdAt: "1" } as any);
      expect(result.title).toBe("FM Title");
    });
  });
});
