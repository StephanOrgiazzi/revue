import {
  sortLibraryItems,
  cardPaletteForTitle,
  buildCardPalettesForGrid,
} from ".././libraryItemViewModel";
import type { LibraryItem } from ".././types";

describe("libraryItemViewModel", () => {
  const mockItems: LibraryItem[] = [
    {
      id: "1",
      title: "A",
      createdAt: "2023-01-01",
      localPath: "a.md",
      tags: [],
      lastAnchorSlug: null,
      lastScrollOffsetY: null,
      readingProgress: 0,
    },
    {
      id: "2",
      title: "B",
      createdAt: "2023-01-02",
      localPath: "b.md",
      tags: [],
      lastAnchorSlug: null,
      lastScrollOffsetY: null,
      readingProgress: 0,
    },
  ];

  describe("sortLibraryItems", () => {
    it("returns a new array sorted by createdAt descending", () => {
      const sorted = sortLibraryItems(mockItems);
      expect(sorted).not.toBe(mockItems);
      expect(sorted[0].id).toBe("2");
      expect(sorted[1].id).toBe("1");
    });
  });

  describe("cardPaletteForTitle", () => {
    it("returns a deterministic palette shape for a title", () => {
      const firstPalette = cardPaletteForTitle("Hello");
      const secondPalette = cardPaletteForTitle("Hello");

      expect(secondPalette).toEqual(firstPalette);
      expect(firstPalette).toEqual(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/^#[0-9A-F]{6}$/i),
          highlightColor: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        }),
      );
    });
  });

  describe("buildCardPalettesForGrid", () => {
    it("returns palette entries for each item id", () => {
      const palettes = buildCardPalettesForGrid(mockItems);

      expect(Object.keys(palettes)).toEqual(["1", "2"]);
      expect(palettes["1"]).toEqual(
        expect.objectContaining({
          backgroundColor: expect.any(String),
          highlightColor: expect.any(String),
        }),
      );
      expect(palettes["2"]).toEqual(
        expect.objectContaining({
          backgroundColor: expect.any(String),
          highlightColor: expect.any(String),
        }),
      );
    });

    it("avoids assigning the same palette to neighboring cells when possible", () => {
      const items: LibraryItem[] = [
        {
          id: "1",
          title: "Same",
          createdAt: "2023-01-01",
          localPath: "1.md",
          tags: [],
          lastAnchorSlug: null,
          lastScrollOffsetY: null,
          readingProgress: 0,
        },
        {
          id: "2",
          title: "Same",
          createdAt: "2023-01-01",
          localPath: "2.md",
          tags: [],
          lastAnchorSlug: null,
          lastScrollOffsetY: null,
          readingProgress: 0,
        },
      ];
      const palettes = buildCardPalettesForGrid(items, { columnCount: 2, leadingCellCount: 0 });

      expect(palettes["1"]).not.toEqual(palettes["2"]);
    });
  });
});
