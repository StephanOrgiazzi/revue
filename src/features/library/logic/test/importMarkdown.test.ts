import * as DocumentPicker from "expo-document-picker";
import { StorageAccessFramework } from "expo-file-system/legacy";
import { Platform } from "react-native";

import {
  createPickedMarkdownAssetFromUri,
  finalizeMarkdownImport,
  pickMarkdownDocument,
} from "@/features/library/logic/importMarkdown";
import { parseMarkdownDocument } from "@/shared/logic/markdown";
import { readTextFromWebUri } from "@/shared/logic/web/textUri";

const mockFileTextByUri = new Map<string, string>();

const mockFileCopyCalls: Array<{ from: string; to: string }> = [];

const mockLegacyCopyCalls: Array<{ from: string; to: string }> = [];

const mockSafDirectoryEntriesByUri = new Map<string, string[]>();
let mockSafDirectoryPermissionResult: { granted: boolean; directoryUri?: string } = {
  granted: false,
};

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

jest.mock("expo-document-picker");
jest.mock("@/shared/logic/web/textUri");
jest.mock("@/shared/logic/markdown");
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(function MockFile(...parts: unknown[]) {
    const uri = mockJoinFsUri(parts);
    return {
      uri,
      copy: jest.fn((destination: { uri: string }) => {
        mockFileCopyCalls.push({ from: uri, to: destination.uri });
        const sourceText = mockFileTextByUri.get(uri);
        if (typeof sourceText === "string") {
          mockFileTextByUri.set(destination.uri, sourceText);
        } else {
          throw new Error(`Mock source not found: ${uri}`);
        }
      }),
      text: jest.fn(async () => mockFileTextByUri.get(uri) ?? ""),
      write: jest.fn((content: string) => {
        mockFileTextByUri.set(uri, content);
      }),
    };
  }),
  Directory: jest.fn().mockImplementation(function MockDirectory(...parts: unknown[]) {
    const uri = mockJoinFsUri(parts);
    return {
      uri,
      create: jest.fn(),
    };
  }),
  Paths: {
    document: "file:///documents",
  },
}));
jest.mock("expo-file-system/legacy", () => ({
  copyAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
    mockLegacyCopyCalls.push({ from, to });
    const sourceText = mockFileTextByUri.get(from);
    if (typeof sourceText !== "string") {
      throw new Error(`Mock source not found: ${from}`);
    }
    mockFileTextByUri.set(to, sourceText);
  }),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn(async () => mockSafDirectoryPermissionResult),
    readDirectoryAsync: jest.fn(async (directoryUri: string) => {
      const directoryEntries = mockSafDirectoryEntriesByUri.get(directoryUri);
      if (!directoryEntries) {
        throw new Error(`Mock SAF directory not found: ${directoryUri}`);
      }
      return directoryEntries;
    }),
  },
}));

describe("importMarkdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileTextByUri.clear();
    mockFileCopyCalls.length = 0;
    mockLegacyCopyCalls.length = 0;
    mockSafDirectoryEntriesByUri.clear();
    mockSafDirectoryPermissionResult = { granted: false };
    Platform.OS = "web";
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

    it("copies relative local assets on native and rewrites image links", async () => {
      Platform.OS = "ios";
      const pickedAsset = { name: "post.md", uri: "file:///imports/post.md" };
      mockFileTextByUri.set(
        pickedAsset.uri,
        ["# Post", "", "![Chart](./images/chart.png)"].join("\n"),
      );
      mockFileTextByUri.set("file:///imports/images/chart.png", "binary-image-content");
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-file-1",
        createdAt: "2023-01-01",
      } as any);

      expect(result.localPath).toBe("file:///documents/articles/article-file-1/article.md");
      expect(mockFileCopyCalls).toEqual(
        expect.arrayContaining([
          {
            from: "file:///imports/post.md",
            to: "file:///documents/articles/article-file-1/article.md",
          },
          {
            from: "file:///imports/images/chart.png",
            to: "file:///documents/articles/article-file-1/assets/1-chart.png",
          },
        ]),
      );
      expect(mockFileTextByUri.get(result.localPath)).toContain(
        "file:///documents/articles/article-file-1/assets/1-chart.png",
      );
    });

    it("rewrites only parsed image tokens and leaves code literals unchanged", async () => {
      Platform.OS = "ios";
      const pickedAsset = { name: "post.md", uri: "file:///imports/post.md" };
      mockFileTextByUri.set(
        pickedAsset.uri,
        [
          "# Post",
          "",
          "```md",
          "![CodeFence](./images/fence.png)",
          "```",
          "",
          "Inline `![InlineCode](./images/inline.png)` sample.",
          "",
          "![Real](./images/real.png)",
        ].join("\n"),
      );
      mockFileTextByUri.set("file:///imports/images/real.png", "binary-image-content");
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-file-2",
        createdAt: "2023-01-01",
      } as any);

      expect(mockFileCopyCalls).toEqual([
        {
          from: "file:///imports/post.md",
          to: "file:///documents/articles/article-file-2/article.md",
        },
        {
          from: "file:///imports/images/real.png",
          to: "file:///documents/articles/article-file-2/assets/1-real.png",
        },
      ]);

      const rewrittenMarkdown = mockFileTextByUri.get(result.localPath) ?? "";
      expect(rewrittenMarkdown).toContain("![CodeFence](./images/fence.png)");
      expect(rewrittenMarkdown).toContain("`![InlineCode](./images/inline.png)`");
      expect(rewrittenMarkdown).toContain(
        "file:///documents/articles/article-file-2/assets/1-real.png",
      );
    });

    it("rewrites reference-style images and preserves uppercase asset filename chars", async () => {
      Platform.OS = "ios";
      const pickedAsset = { name: "post.md", uri: "file:///imports/post.md" };
      mockFileTextByUri.set(
        pickedAsset.uri,
        ["# Post", "", "![Logo][logo]", "", "[logo]: ./images/ABC.png"].join("\n"),
      );
      mockFileTextByUri.set("file:///imports/images/ABC.png", "binary-image-content");
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-file-ref-1",
        createdAt: "2023-01-01",
      } as any);

      expect(mockFileCopyCalls).toEqual(
        expect.arrayContaining([
          {
            from: "file:///imports/images/ABC.png",
            to: "file:///documents/articles/article-file-ref-1/assets/1-ABC.png",
          },
        ]),
      );

      const rewrittenMarkdown = mockFileTextByUri.get(result.localPath) ?? "";
      expect(rewrittenMarkdown).toContain(
        "![Logo](file:///documents/articles/article-file-ref-1/assets/1-ABC.png)",
      );
      expect(rewrittenMarkdown).not.toContain("![Logo][logo]");
    });

    it("copies relative assets from Android content URIs via selected SAF folder", async () => {
      Platform.OS = "android";
      const pickedAsset = {
        name: "converted_document.md",
        uri: "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fconverted_document.md",
      };

      const grantedDirectoryUri =
        "content://com.android.externalstorage.documents/tree/primary%3ADownload";

      const safResolvedAssetUri =
        "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fserenissima.png";
      mockSafDirectoryPermissionResult = {
        granted: true,
        directoryUri: grantedDirectoryUri,
      };
      mockSafDirectoryEntriesByUri.set(grantedDirectoryUri, [safResolvedAssetUri]);
      mockFileTextByUri.set(
        pickedAsset.uri,
        ["# Post", "", "![Serenissima](./serenissima.png)"].join("\n"),
      );
      mockFileTextByUri.set(safResolvedAssetUri, "binary-image-content");
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-android-direct-1",
        createdAt: "2023-01-01",
      } as any);

      expect(mockLegacyCopyCalls).toEqual(
        expect.arrayContaining([
          {
            from: pickedAsset.uri,
            to: "file:///documents/articles/article-android-direct-1/article.md",
          },
          {
            from: safResolvedAssetUri,
            to: "file:///documents/articles/article-android-direct-1/assets/1-serenissima.png",
          },
        ]),
      );
      expect(StorageAccessFramework.requestDirectoryPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(mockFileTextByUri.get(result.localPath)).toContain(
        "file:///documents/articles/article-android-direct-1/assets/1-serenissima.png",
      );
    });

    it("resolves nested relative Android asset paths from markdown directory", async () => {
      Platform.OS = "android";
      const pickedAsset = {
        name: "converted_document.md",
        uri: "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fposts%2Fconverted_document.md",
      };

      const grantedDirectoryUri =
        "content://com.android.externalstorage.documents/tree/primary%3ADownload";

      const postsDirectoryUri =
        "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fposts";

      const imagesDirectoryUri =
        "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fposts%2Fimages";

      const safResolvedAssetUri =
        "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fposts%2Fimages%2Fchart.png";

      mockSafDirectoryPermissionResult = {
        granted: true,
        directoryUri: grantedDirectoryUri,
      };
      mockSafDirectoryEntriesByUri.set(grantedDirectoryUri, [postsDirectoryUri]);
      mockSafDirectoryEntriesByUri.set(postsDirectoryUri, [imagesDirectoryUri]);
      mockSafDirectoryEntriesByUri.set(imagesDirectoryUri, [safResolvedAssetUri]);
      mockFileTextByUri.set(
        pickedAsset.uri,
        ["# Post", "", "![Chart](./images/chart.png)"].join("\n"),
      );
      mockFileTextByUri.set(safResolvedAssetUri, "binary-image-content");
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-android-nested-path-1",
        createdAt: "2023-01-01",
      } as any);

      expect(mockLegacyCopyCalls).toEqual(
        expect.arrayContaining([
          {
            from: safResolvedAssetUri,
            to: "file:///documents/articles/article-android-nested-path-1/assets/1-chart.png",
          },
        ]),
      );
      expect(mockFileTextByUri.get(result.localPath)).toContain(
        "file:///documents/articles/article-android-nested-path-1/assets/1-chart.png",
      );
    });

    it("resolves parent-relative Android asset paths from markdown directory", async () => {
      Platform.OS = "android";
      const pickedAsset = {
        name: "converted_document.md",
        uri: "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fposts%2Fsub%2Fconverted_document.md",
      };

      const grantedDirectoryUri =
        "content://com.android.externalstorage.documents/tree/primary%3ADownload";

      const postsDirectoryUri =
        "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fposts";

      const safResolvedAssetUri =
        "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fposts%2Fshared.png";

      mockSafDirectoryPermissionResult = {
        granted: true,
        directoryUri: grantedDirectoryUri,
      };
      mockSafDirectoryEntriesByUri.set(grantedDirectoryUri, [postsDirectoryUri]);
      mockSafDirectoryEntriesByUri.set(postsDirectoryUri, [safResolvedAssetUri]);
      mockFileTextByUri.set(pickedAsset.uri, ["# Post", "", "![Shared](../shared.png)"].join("\n"));
      mockFileTextByUri.set(safResolvedAssetUri, "binary-image-content");
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-android-parent-path-1",
        createdAt: "2023-01-01",
      } as any);

      expect(mockLegacyCopyCalls).toEqual(
        expect.arrayContaining([
          {
            from: safResolvedAssetUri,
            to: "file:///documents/articles/article-android-parent-path-1/assets/1-shared.png",
          },
        ]),
      );
      expect(mockFileTextByUri.get(result.localPath)).toContain(
        "file:///documents/articles/article-android-parent-path-1/assets/1-shared.png",
      );
    });

    it("prompts folder selection for non-externalstorage content markdown URIs", async () => {
      Platform.OS = "android";
      const pickedAsset = {
        name: "converted_document.md",
        uri: "content://com.android.providers.downloads.documents/document/msf%3A1234",
      };

      const grantedDirectoryUri =
        "content://com.android.externalstorage.documents/tree/primary%3ADownload";

      const safResolvedAssetUri =
        "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fserenissima.png";

      mockSafDirectoryPermissionResult = {
        granted: true,
        directoryUri: grantedDirectoryUri,
      };
      mockSafDirectoryEntriesByUri.set(grantedDirectoryUri, [safResolvedAssetUri]);
      mockFileTextByUri.set(
        pickedAsset.uri,
        ["# Post", "", "![Serenissima](./serenissima.png)"].join("\n"),
      );
      mockFileTextByUri.set(safResolvedAssetUri, "binary-image-content");
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-android-provider-fallback-1",
        createdAt: "2023-01-01",
      } as any);

      expect(StorageAccessFramework.requestDirectoryPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(mockLegacyCopyCalls).toEqual(
        expect.arrayContaining([
          {
            from: safResolvedAssetUri,
            to: "file:///documents/articles/article-android-provider-fallback-1/assets/1-serenissima.png",
          },
        ]),
      );
      expect(mockFileTextByUri.get(result.localPath)).toContain(
        "file:///documents/articles/article-android-provider-fallback-1/assets/1-serenissima.png",
      );
    });

    it("keeps original relative image link when folder permission is denied", async () => {
      Platform.OS = "android";
      const pickedAsset = {
        name: "converted_document.md",
        uri: "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fconverted_document.md",
      };
      mockFileTextByUri.set(
        pickedAsset.uri,
        ["# Post", "", "![Serenissima](./serenissima.png)"].join("\n"),
      );
      (parseMarkdownDocument as jest.Mock).mockImplementation((markdown: string) => ({
        content: markdown,
        data: {},
      }));

      const result = await finalizeMarkdownImport(pickedAsset, {
        id: "article-android-folder-denied-1",
        createdAt: "2023-01-01",
      } as any);

      expect(StorageAccessFramework.requestDirectoryPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(mockFileTextByUri.get(result.localPath)).toContain(
        "![Serenissima](./serenissima.png)",
      );
    });
  });
});
