import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";

export type CardPalette = {
  backgroundColor: string;
  highlightColor: string;
};

const CARD_PALETTES: CardPalette[] = [
  { backgroundColor: "#DCE7FB", highlightColor: "#C8D6F4" },
  { backgroundColor: "#C8EFE2", highlightColor: "#B4E6D7" },
  { backgroundColor: "#F6E3BA", highlightColor: "#EED5A3" },
  { backgroundColor: "#E8DEF9", highlightColor: "#DACCF5" },
  { backgroundColor: "#FADDE2", highlightColor: "#F2CBD3" },
  { backgroundColor: "#D7EFF8", highlightColor: "#C5E6F2" },
  { backgroundColor: "#E6F3DE", highlightColor: "#D5EBC9" },
  { backgroundColor: "#FBE4D6", highlightColor: "#F4D3BE" },
  { backgroundColor: "#E3EAFB", highlightColor: "#D2DDF6" },
  { backgroundColor: "#E5F4F1", highlightColor: "#D3EBE6" },
  { backgroundColor: "#F5E5EE", highlightColor: "#EED3E1" },
  { backgroundColor: "#EAF1D9", highlightColor: "#DDE8C3" },
];

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function sortLibraryItems(items: LibraryItem[]): LibraryItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function cardPaletteForTitle(title: string): CardPalette {
  return CARD_PALETTES[hashString(title) % CARD_PALETTES.length];
}

type BuildCardPalettesOptions = {
  columnCount?: number;
  leadingCellCount?: number;
};

export function buildCardPalettesForGrid(
  items: LibraryItem[],
  options: BuildCardPalettesOptions = {},
): Record<LibraryItemId, CardPalette> {
  const columnCount = Math.max(1, options.columnCount ?? 2);
  const leadingCellCount = Math.max(0, options.leadingCellCount ?? 1);
  const paletteIndexByGridCell: Record<number, number> = {};
  const paletteByItemId: Record<LibraryItemId, CardPalette> = {};

  items.forEach((item, itemIndex) => {
    const gridCellIndex = leadingCellCount + itemIndex;
    const forbiddenPaletteIndices = new Set<number>();

    if (gridCellIndex % columnCount !== 0) {
      const leftPaletteIndex = paletteIndexByGridCell[gridCellIndex - 1];
      if (leftPaletteIndex !== undefined) {
        forbiddenPaletteIndices.add(leftPaletteIndex);
      }
    }

    if (gridCellIndex >= columnCount) {
      const topPaletteIndex = paletteIndexByGridCell[gridCellIndex - columnCount];
      if (topPaletteIndex !== undefined) {
        forbiddenPaletteIndices.add(topPaletteIndex);
      }
    }

    const preferredPaletteIndex = hashString(item.title) % CARD_PALETTES.length;
    const selectedPaletteIndex =
      forbiddenPaletteIndices.size < CARD_PALETTES.length
        ? (Array.from(
            { length: CARD_PALETTES.length },
            (_, i) => (preferredPaletteIndex + i) % CARD_PALETTES.length,
          ).find((i) => !forbiddenPaletteIndices.has(i)) ?? preferredPaletteIndex)
        : preferredPaletteIndex;

    paletteIndexByGridCell[gridCellIndex] = selectedPaletteIndex;
    paletteByItemId[item.id] = CARD_PALETTES[selectedPaletteIndex];
  });

  return paletteByItemId;
}
