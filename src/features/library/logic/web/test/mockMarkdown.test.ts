import { resolveWebMockMarkdownUris } from "@/features/library/logic/web/mockMarkdown";

describe("mockMarkdown", () => {
  it("returns the expected bundled mock markdown URIs", () => {
    expect(resolveWebMockMarkdownUris()).toEqual([
      "/mocks/converted_document.md",
      "/mocks/js.md",
      "/mocks/lepoint.md",
      "/mocks/market-brief.md",
    ]);
  });
});
