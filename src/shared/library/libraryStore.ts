import type {
  LibraryItem,
  LibraryItemId,
  LibraryItemReadingPosition,
} from "@/shared/library/types";

import { getLibraryIndex, saveLibraryIndex } from "@/shared/library/libraryIndexStorage";

export function readLibraryItemById(articleId: LibraryItemId): LibraryItem | null {
  const index = getLibraryIndex();
  return index[articleId] ?? null;
}

export function readLibraryItemReadingPosition(
  articleId: LibraryItemId,
): LibraryItemReadingPosition {
  const article = readLibraryItemById(articleId);

  return {
    anchorSlug: normalizeAnchorSlug(article?.lastAnchorSlug),
    scrollOffsetY: normalizeScrollOffsetY(article?.lastScrollOffsetY),
  };
}

export function saveLibraryItemReadingPosition(
  articleId: LibraryItemId,
  position: LibraryItemReadingPosition,
): void {
  const nextAnchorSlug = normalizeAnchorSlug(position.anchorSlug);
  const nextScrollOffsetY = normalizeScrollOffsetY(position.scrollOffsetY);

  const index = getLibraryIndex();
  const article = index[articleId];
  if (!article) {
    return;
  }

  const currentAnchorSlug = normalizeAnchorSlug(article.lastAnchorSlug);
  const currentScrollOffsetY = normalizeScrollOffsetY(article.lastScrollOffsetY);
  if (currentAnchorSlug === nextAnchorSlug && currentScrollOffsetY === nextScrollOffsetY) {
    return;
  }

  index[articleId] = {
    ...article,
    lastAnchorSlug: nextAnchorSlug,
    lastScrollOffsetY: nextScrollOffsetY,
  };
  saveLibraryIndex(index);
}

function normalizeAnchorSlug(anchorSlug: string | null | undefined): string | null {
  return anchorSlug?.trim() || null;
}

function normalizeScrollOffsetY(scrollOffsetY: number | null | undefined): number | null {
  return typeof scrollOffsetY === "number" && Number.isFinite(scrollOffsetY)
    ? Math.max(0, scrollOffsetY)
    : null;
}
