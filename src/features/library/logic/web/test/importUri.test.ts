import { Platform } from "react-native";

import { resolveIncomingImportUri } from "@/features/library/logic/web/importUri";

const mockParse = jest.fn();

jest.mock("expo-linking", () => ({
  parse: (...args: any[]) => mockParse(...args),
}));

describe("resolveIncomingImportUri", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.restoreAllMocks();
    mockParse.mockReset();
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatform,
    });
  });

  it("returns null for empty values", () => {
    expect(resolveIncomingImportUri(null)).toBeNull();
    expect(resolveIncomingImportUri("   ")).toBeNull();
  });

  it("returns direct file/content URIs without parsing", () => {
    const fileUri = " file:///tmp/article.md ";

    expect(resolveIncomingImportUri(fileUri)).toBe("file:///tmp/article.md");
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("reads importUri from query params and supports web-only prefixes on web", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    mockParse.mockReturnValue({
      queryParams: {
        importUri: " https://example.com/article.md ",
      },
    } as any);

    expect(resolveIncomingImportUri("my-app://import")).toBe("https://example.com/article.md");
  });

  it("rejects web-only prefixes on native", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    mockParse.mockReturnValue({
      queryParams: {
        importUri: "https://example.com/article.md",
      },
    } as any);

    expect(resolveIncomingImportUri("my-app://import")).toBeNull();
  });

  it("supports array query params and rejects unsupported values", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    mockParse.mockReturnValueOnce({
      queryParams: { importUri: ["content://documents/article.md", "ignored"] },
    } as any);
    expect(resolveIncomingImportUri("my-app://import")).toBe("content://documents/article.md");

    mockParse.mockReturnValueOnce({
      queryParams: { importUri: "mailto:invalid" },
    } as any);
    expect(resolveIncomingImportUri("my-app://import")).toBeNull();
  });
});
