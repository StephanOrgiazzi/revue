import {
  buildHtmlSystemFonts,
  buildListMarkerRenderersProps,
  shouldShowHeaderFromHtmlBlocks,
  buildArticleMeta,
} from ".././readerScreenUtils";

jest.mock("expo-constants", () => ({
  systemFonts: ["ExpoFont"],
}));

describe("readerScreenUtils", () => {
  describe("buildHtmlSystemFonts", () => {
    it("should include expo and default system fonts", () => {
      const fonts = buildHtmlSystemFonts();
      expect(fonts).toContain("ExpoFont");
      expect(fonts).toContain("sans-serif");
    });
  });

  describe("buildListMarkerRenderersProps", () => {
    it("should return props with specified color", () => {
      const props = buildListMarkerRenderersProps("#fff");
      expect(props.ul.markerTextStyle.color).toBe("#fff");
      expect(props.ol.markerTextStyle.color).toBe("#fff");
    });
  });

  describe("shouldShowHeaderFromHtmlBlocks", () => {
    it("should be true if no h1 in first block", () => {
      expect(shouldShowHeaderFromHtmlBlocks(["<p>Hello</p>"])).toBe(true);
      expect(shouldShowHeaderFromHtmlBlocks([])).toBe(true);
    });

    it("should be false if first block starts with h1", () => {
      expect(shouldShowHeaderFromHtmlBlocks(["<h1>Title</h1>"])).toBe(false);
      expect(shouldShowHeaderFromHtmlBlocks(["  <h1>Title</h1>"])).toBe(false);
    });
  });

  describe("buildArticleMeta", () => {
    it("should return date if provided", () => {
      expect(buildArticleMeta("Oct 25, 2023")).toBe("Oct 25, 2023");
    });

    it("should return default label if no date", () => {
      expect(buildArticleMeta(null)).toBe("Imported markdown");
    });
  });
});
