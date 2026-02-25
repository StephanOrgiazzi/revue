import {
  createPickedMarkdownAssetFromUri,
  finalizeMarkdownImport,
  type PickedMarkdownAsset,
  pickMarkdownDocument,
} from "@/features/library/logic/importMarkdown";
import {
  deleteLibraryItem,
  readLibraryItems,
  saveLibraryItem,
} from "@/features/library/logic/libraryRepository";
import { sortLibraryItems } from "@/features/library/logic/libraryItemViewModel";
import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";

type InitialLibrarySnapshot = {
  items: LibraryItem[];
  errorMessage: string | null;
};

type ImportLibraryResult = {
  importedArticleId: LibraryItemId | null;
  errorMessage: string | null;
};

type DeleteLibraryItemResult = {
  errorMessage: string | null;
};

type ImportWorkflowState = {
  addPendingArticleId: (articleId: LibraryItemId) => void;
  removePendingArticleId: (articleId: LibraryItemId) => void;
  appendItem: (item: LibraryItem) => void;
  replaceItem: (item: LibraryItem) => void;
  removeItem: (articleId: LibraryItemId) => void;
};

type DeleteWorkflowState = {
  removeItem: (articleId: LibraryItemId) => void;
  restoreItem: (item: LibraryItem) => void;
  replaceItems: (items: LibraryItem[]) => void;
};

function toSlugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createLibraryItemId(seedTitle: string): LibraryItemId {
  const now = Date.now();
  const slug = toSlugPart(seedTitle) || "article";
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${now}-${slug}-${randomPart}`;
}

function createLibraryItem(input: {
  id: LibraryItemId;
  title: string;
  localPath: string;
  tags?: string[];
  createdAt: string;
  readingProgress?: number;
  readingPosition?: {
    anchorSlug: string | null;
    scrollOffsetY: number | null;
  };
}): LibraryItem {
  return {
    id: input.id,
    title: input.title,
    localPath: input.localPath,
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
    createdAt: input.createdAt,
    lastAnchorSlug: input.readingPosition?.anchorSlug ?? null,
    lastScrollOffsetY: input.readingPosition?.scrollOffsetY ?? null,
    readingProgress: input.readingProgress ?? 0,
  };
}

function createOptimisticImportedItem(fileName: string): LibraryItem {
  const title = fileName.replace(/\.md$/i, "") || "Untitled";
  return createLibraryItem({
    id: createLibraryItemId(title),
    title,
    localPath: "",
    createdAt: new Date().toISOString(),
  });
}

function toReadingPosition(item: LibraryItem): {
  anchorSlug: string | null;
  scrollOffsetY: number | null;
} {
  return {
    anchorSlug: item.lastAnchorSlug,
    scrollOffsetY: item.lastScrollOffsetY,
  };
}

async function runOptimisticImport(
  resolvePickedAsset: () => Promise<PickedMarkdownAsset | null>,
  workflowState: ImportWorkflowState,
): Promise<ImportLibraryResult> {
  let optimisticItem: LibraryItem | null = null;

  try {
    const pickedAsset = await resolvePickedAsset();
    if (!pickedAsset) {
      return {
        importedArticleId: null,
        errorMessage: null,
      };
    }

    optimisticItem = createOptimisticImportedItem(pickedAsset.name);
    workflowState.addPendingArticleId(optimisticItem.id);
    workflowState.appendItem(optimisticItem);

    const importedItem = await finalizeMarkdownImport(pickedAsset, {
      id: optimisticItem.id,
      createdAt: optimisticItem.createdAt,
      readingPosition: toReadingPosition(optimisticItem),
    });
    saveLibraryItem(importedItem);
    workflowState.replaceItem(importedItem);

    return {
      importedArticleId: importedItem.id,
      errorMessage: null,
    };
  } catch (error) {
    if (optimisticItem) {
      workflowState.removeItem(optimisticItem.id);
    }

    return {
      importedArticleId: null,
      errorMessage: error instanceof Error ? error.message : "Import failed.",
    };
  } finally {
    if (optimisticItem) {
      workflowState.removePendingArticleId(optimisticItem.id);
    }
  }
}

export function readInitialLibrarySnapshot(): InitialLibrarySnapshot {
  try {
    return {
      items: readLibraryItems(),
      errorMessage: null,
    };
  } catch {
    return {
      items: [],
      errorMessage: "Failed to load local library index.",
    };
  }
}

export function appendPendingArticleId(
  articleIds: LibraryItemId[],
  articleId: LibraryItemId,
): LibraryItemId[] {
  return [...articleIds, articleId];
}

export function removePendingArticleId(
  articleIds: LibraryItemId[],
  articleId: LibraryItemId,
): LibraryItemId[] {
  return articleIds.filter((id) => id !== articleId);
}

export function appendLibraryItem(items: LibraryItem[], item: LibraryItem): LibraryItem[] {
  return sortLibraryItems([...items, item]);
}

export function replaceLibraryItem(items: LibraryItem[], item: LibraryItem): LibraryItem[] {
  return sortLibraryItems(
    items.map((existingItem) => (existingItem.id === item.id ? item : existingItem)),
  );
}

export function removeLibraryItem(items: LibraryItem[], itemId: LibraryItemId): LibraryItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function restoreLibraryItem(items: LibraryItem[], item: LibraryItem): LibraryItem[] {
  if (items.some((existingItem) => existingItem.id === item.id)) {
    return items;
  }

  return sortLibraryItems([...items, item]);
}

export function importLibraryItemFromPicker(
  workflowState: ImportWorkflowState,
): Promise<ImportLibraryResult> {
  return runOptimisticImport(pickMarkdownDocument, workflowState);
}

export function importLibraryItemFromUri(
  uri: string,
  workflowState: ImportWorkflowState,
): Promise<ImportLibraryResult> {
  const normalizedUri = uri.trim();
  return runOptimisticImport(
    async () => createPickedMarkdownAssetFromUri(normalizedUri),
    workflowState,
  );
}

export async function deleteLibraryItemWithOptimisticUpdate(
  article: LibraryItem,
  workflowState: DeleteWorkflowState,
): Promise<DeleteLibraryItemResult> {
  workflowState.removeItem(article.id);

  try {
    workflowState.replaceItems(deleteLibraryItem(article));
    return { errorMessage: null };
  } catch (error) {
    workflowState.restoreItem(article);
    return {
      errorMessage: error instanceof Error ? error.message : "Failed to delete article.",
    };
  }
}
