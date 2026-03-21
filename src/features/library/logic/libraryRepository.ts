import { Directory, File, Paths } from "expo-file-system";

import type { LibraryItem, LibraryItemId } from "@/shared/library/types";

import { sortLibraryItems } from "@/features/library/logic/libraryItemViewModel";
import { getLibraryIndex, saveLibraryIndex } from "@/shared/library/libraryIndexStorage";
import {
  readLibraryItemById,
  readLibraryItemReadingPosition,
  saveLibraryItemReadingPosition,
} from "@/shared/library/libraryStore";

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

export function readLibraryItems(): LibraryItem[] {
  return sortLibraryItems(Object.values(getLibraryIndex()));
}

export function saveLibraryItem(item: LibraryItem): void {
  const index = getLibraryIndex();
  index[item.id] = item;
  saveLibraryIndex(index);
}

function deleteLocalArticleFile(articleId: LibraryItemId, localPath: string): void {
  if (!isNativeLocalFilePath(localPath)) {
    return;
  }

  const managedArticleDirectory = resolveManagedArticleDirectory(articleId, localPath);
  if (managedArticleDirectory) {
    try {
      managedArticleDirectory.delete();
      return;
    } catch (error) {
      reportLocalFileDeleteFailure(articleId, managedArticleDirectory.uri, error);
    }
  }

  try {
    new File(localPath).delete();
  } catch (error) {
    reportLocalFileDeleteFailure(articleId, localPath, error);
  }
}

function isNativeLocalFilePath(localPath: string): boolean {
  return localPath.startsWith("file://") || localPath.startsWith("content://");
}

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

function resolveManagedArticleDirectory(
  articleId: LibraryItemId,
  localPath: string,
): Directory | null {
  if (!localPath.startsWith("file://")) {
    return null;
  }

  const articleDirectory = new Directory(Paths.document, "articles", articleId);

  const normalizedDirectoryUri = articleDirectory.uri.endsWith("/")
    ? articleDirectory.uri
    : `${articleDirectory.uri}/`;

  return localPath.startsWith(normalizedDirectoryUri) ? articleDirectory : null;
}

export { readLibraryItemById, readLibraryItemReadingPosition, saveLibraryItemReadingPosition };
