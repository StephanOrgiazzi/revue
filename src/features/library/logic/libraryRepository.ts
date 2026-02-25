import { File } from "expo-file-system";

import { getLibraryIndex, saveLibraryIndex } from "@/features/library/logic/libraryIndexStorage";
import { sortLibraryItems } from "@/features/library/logic/libraryItemViewModel";
import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";

function reportLocalFileDeleteFailure(
  articleId: LibraryItemId,
  localPath: string,
  error: unknown,
): void {
  if (!__DEV__) {
    return;
  }

  console.warn(
    `[libraryRepository] Failed to delete local file for article ${articleId} at ${localPath}`,
    error,
  );
}

function isNativeLocalFilePath(localPath: string): boolean {
  return localPath.startsWith("file://") || localPath.startsWith("content://");
}

function deleteLocalArticleFile(articleId: LibraryItemId, localPath: string): void {
  if (!isNativeLocalFilePath(localPath)) {
    return;
  }

  try {
    new File(localPath).delete();
  } catch (error) {
    reportLocalFileDeleteFailure(articleId, localPath, error);
  }
}

function normalizeAnchorSlug(anchorSlug: string | null | undefined): string | null {
  return anchorSlug?.trim() || null;
}

function normalizeScrollOffsetY(scrollOffsetY: number | null | undefined): number | null {
  return typeof scrollOffsetY === "number" && Number.isFinite(scrollOffsetY)
    ? Math.max(0, scrollOffsetY)
    : null;
}

export function readLibraryItems(): LibraryItem[] {
  return sortLibraryItems(Object.values(getLibraryIndex()));
}

export function readLibraryItemById(articleId: LibraryItemId): LibraryItem | null {
  const index = getLibraryIndex();
  return index[articleId] ?? null;
}

export function saveLibraryItem(item: LibraryItem): void {
  const index = getLibraryIndex();
  index[item.id] = item;
  saveLibraryIndex(index);
}

export function deleteLibraryItem(article: LibraryItem): LibraryItem[] {
  const index = getLibraryIndex();
  if (!index[article.id]) {
    return sortLibraryItems(Object.values(index));
  }

  delete index[article.id];
  saveLibraryIndex(index);
  deleteLocalArticleFile(article.id, article.localPath);
  return sortLibraryItems(Object.values(index));
}

export function readLibraryItemReadingPosition(articleId: LibraryItemId): {
  anchorSlug: string | null;
  scrollOffsetY: number | null;
} {
  const article = readLibraryItemById(articleId);

  return {
    anchorSlug: normalizeAnchorSlug(article?.lastAnchorSlug),
    scrollOffsetY: normalizeScrollOffsetY(article?.lastScrollOffsetY),
  };
}

export function saveLibraryItemReadingPosition(
  articleId: LibraryItemId,
  position: {
    anchorSlug: string | null;
    scrollOffsetY: number | null;
  },
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
