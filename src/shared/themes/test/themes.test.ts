import { THEME_IDS } from "@/shared/themes/themePrimitives";
import { isThemeId, getTheme, DEFAULT_THEME_ID, THEME_OPTIONS } from ".././themes";

describe("themes", () => {
  describe("isThemeId", () => {
    it("returns true for all supported ids", () => {
      THEME_IDS.forEach((id) => {
        expect(isThemeId(id)).toBe(true);
      });
    });

    it("returns false for unsupported values", () => {
      expect(isThemeId("invalid")).toBe(false);
      expect(isThemeId("")).toBe(false);
      expect(isThemeId(null as unknown as string)).toBe(false);
      expect(isThemeId(123 as unknown as string)).toBe(false);
    });
  });

  describe("getTheme", () => {
    it("returns theme definitions keyed by id", () => {
      THEME_IDS.forEach((themeId) => {
        const theme = getTheme(themeId);
        expect(theme.id).toBe(themeId);
      });
    });

    it("returns default theme when no id is provided", () => {
      expect(getTheme()).toBe(getTheme(DEFAULT_THEME_ID));
    });
  });

  describe("THEME_OPTIONS", () => {
    it("mirrors theme ids and swatch colors", () => {
      const optionIds = THEME_OPTIONS.map((option) => option.id);
      expect(optionIds).toEqual(THEME_IDS);

      THEME_OPTIONS.forEach((option) => {
        expect(option.label.trim().length).toBeGreaterThan(0);
        expect(option.swatchColor).toBe(getTheme(option.id).colors.pageBackground);
      });
    });
  });
});
