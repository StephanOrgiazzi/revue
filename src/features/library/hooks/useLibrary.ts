import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import type { LibraryItem, LibraryItemId } from "@/shared/library/types";

import {
  appendLibraryItem,
  appendPendingArticleId,
  deleteLibraryItemWithOptimisticUpdate,
  importLibraryItemFromPicker,
  importLibraryItemFromUri,
  readInitialLibrarySnapshot,
  removeLibraryItem,
  removePendingArticleId,
  replaceLibraryItem,
  restoreLibraryItem,
} from "@/features/library/logic/libraryService";
import { resolveIncomingImportUri } from "@/features/library/logic/web/importUri";

const WEB_MOCK_MARKDOWN_URIS = ["/mocks/market-brief.md"];

type ImportFromFileUriOptions = {
  autoOpenImportedArticle?: boolean;
};

type ImportOperationResult = {
  importedArticleId: LibraryItemId | null;
  errorMessage: string | null;
};

type RunImportOperationOptions = {
  autoOpenImportedArticle?: boolean;
  onFinally?: () => void;
};

type UseLibraryResult = {
  items: LibraryItem[];
  isImporting: boolean;
  pendingArticleIds: LibraryItemId[];
  errorMessage: string | null;
  itemCountLabel: string;
  pendingAutoOpenArticleId: LibraryItemId | null;
  importArticle: () => Promise<void>;
  removeArticle: (article: LibraryItem) => Promise<void>;
  consumePendingAutoOpenArticleId: () => void;
};

export function useLibrary(): UseLibraryResult {
  const [{ items: initialItems, errorMessage: initialErrorMessage }] = useState(
    readInitialLibrarySnapshot,
  );

  const [items, setItems] = useState<LibraryItem[]>(initialItems);
  const [pendingArticleIds, setPendingArticleIds] = useState<LibraryItemId[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);

  const [pendingAutoOpenArticleId, setPendingAutoOpenArticleId] = useState<LibraryItemId | null>(
    null,
  );

  const importWorkflowState = useImportWorkflowState(setItems, setPendingArticleIds);
  const deleteWorkflowState = useDeleteWorkflowState(setItems);

  const { isImporting, importArticle, importFromFileUri } = useLibraryImports({
    importWorkflowState,
    setErrorMessage,
    setPendingAutoOpenArticleId,
  });

  useIncomingLibraryImports(importFromFileUri, initialItems);

  const removeArticle = useCallback(
    async (article: LibraryItem) => {
      const removedItem = items.find((item) => item.id === article.id);
      if (!removedItem) {
        return;
      }

      setErrorMessage(null);
      const { errorMessage: deleteErrorMessage } = await deleteLibraryItemWithOptimisticUpdate(
        removedItem,
        deleteWorkflowState,
      );
      if (deleteErrorMessage) {
        setErrorMessage(deleteErrorMessage);
      }
    },
    [deleteWorkflowState, items],
  );

  const itemCountLabel = useMemo(
    () => `${items.length} article${items.length === 1 ? "" : "s"}`,
    [items.length],
  );

  const consumePendingAutoOpenArticleId = useCallback(() => {
    setPendingAutoOpenArticleId(null);
  }, []);

  return {
    items,
    isImporting,
    pendingArticleIds,
    errorMessage,
    itemCountLabel,
    pendingAutoOpenArticleId,
    importArticle,
    removeArticle,
    consumePendingAutoOpenArticleId,
  };
}

function useDeleteWorkflowState(setItems: React.Dispatch<React.SetStateAction<LibraryItem[]>>) {
  return useMemo(
    () => ({
      removeItem: (itemId: LibraryItemId) => {
        setItems((previousItems) => removeLibraryItem(previousItems, itemId));
      },
      restoreItem: (item: LibraryItem) => {
        setItems((previousItems) => restoreLibraryItem(previousItems, item));
      },
      replaceItems: (nextItems: LibraryItem[]) => {
        setItems(nextItems);
      },
    }),
    [setItems],
  );
}

function useImportWorkflowState(
  setItems: React.Dispatch<React.SetStateAction<LibraryItem[]>>,
  setPendingArticleIds: React.Dispatch<React.SetStateAction<LibraryItemId[]>>,
) {
  return useMemo(
    () => ({
      addPendingArticleId: (articleId: LibraryItemId) => {
        setPendingArticleIds((previousIds) => appendPendingArticleId(previousIds, articleId));
      },
      removePendingArticleId: (articleId: LibraryItemId) => {
        setPendingArticleIds((previousIds) => removePendingArticleId(previousIds, articleId));
      },
      appendItem: (item: LibraryItem) => {
        setItems((previousItems) => appendLibraryItem(previousItems, item));
      },
      replaceItem: (item: LibraryItem) => {
        setItems((previousItems) => replaceLibraryItem(previousItems, item));
      },
      removeItem: (itemId: LibraryItemId) => {
        setItems((previousItems) => removeLibraryItem(previousItems, itemId));
      },
    }),
    [setItems, setPendingArticleIds],
  );
}

function useIncomingLibraryImports(
  importFromFileUri: (fileUri: string, options?: ImportFromFileUriOptions) => Promise<void>,
  initialItems: LibraryItem[],
): void {
  const hasAttemptedWebMockImportRef = useRef(false);
  const initialImportedLocalPathsRef = useRef(new Set(initialItems.map((item) => item.localPath)));

  useEffect(() => {
    const importIncomingFileUri = (url: string | null): void => {
      const importUri = resolveIncomingImportUri(url);
      if (!importUri) {
        return;
      }

      void importFromFileUri(importUri);
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      importIncomingFileUri(url);
    });

    void Linking.getInitialURL().then(importIncomingFileUri);

    return () => {
      subscription.remove();
    };
  }, [importFromFileUri]);

  useEffect(() => {
    if (Platform.OS !== "web" || hasAttemptedWebMockImportRef.current) {
      return;
    }

    hasAttemptedWebMockImportRef.current = true;
    void (async () => {
      const importedLocalPaths = new Set(initialImportedLocalPathsRef.current);
      for (const mockMarkdownUri of WEB_MOCK_MARKDOWN_URIS) {
        if (importedLocalPaths.has(mockMarkdownUri)) {
          continue;
        }

        importedLocalPaths.add(mockMarkdownUri);
        await importFromFileUri(mockMarkdownUri, {
          autoOpenImportedArticle: false,
        });
      }
    })();
  }, [importFromFileUri]);
}

function useLibraryImports(args: {
  importWorkflowState: ReturnType<typeof useImportWorkflowState>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setPendingAutoOpenArticleId: React.Dispatch<React.SetStateAction<LibraryItemId | null>>;
}) {
  const { importWorkflowState, setErrorMessage, setPendingAutoOpenArticleId } = args;
  const [isImporting, setIsImporting] = useState(false);
  const inFlightImportUrisRef = useRef<Set<string>>(new Set());
  const activeImportCountRef = useRef(0);

  const runImportOperation = useCallback(
    async (
      runImport: () => Promise<ImportOperationResult>,
      options: RunImportOperationOptions = {},
    ) => {
      activeImportCountRef.current += 1;
      setIsImporting(true);
      setErrorMessage(null);

      try {
        const { importedArticleId, errorMessage: importErrorMessage } = await runImport();
        if (importErrorMessage) {
          setErrorMessage(importErrorMessage);
          return;
        }

        if (importedArticleId && options.autoOpenImportedArticle) {
          setPendingAutoOpenArticleId(importedArticleId);
        }
      } finally {
        options.onFinally?.();
        activeImportCountRef.current = Math.max(0, activeImportCountRef.current - 1);
        if (activeImportCountRef.current === 0) {
          setIsImporting(false);
        }
      }
    },
    [setErrorMessage, setPendingAutoOpenArticleId],
  );

  const importFromFileUri = useCallback(
    async (fileUri: string, options?: ImportFromFileUriOptions) => {
      const normalizedUri = fileUri.trim();
      if (!normalizedUri || inFlightImportUrisRef.current.has(normalizedUri)) {
        return;
      }

      inFlightImportUrisRef.current.add(normalizedUri);
      await runImportOperation(() => importLibraryItemFromUri(normalizedUri, importWorkflowState), {
        autoOpenImportedArticle: options?.autoOpenImportedArticle ?? true,
        onFinally: () => {
          inFlightImportUrisRef.current.delete(normalizedUri);
        },
      });
    },
    [importWorkflowState, runImportOperation],
  );

  const importArticle = useCallback(async () => {
    await runImportOperation(() => importLibraryItemFromPicker(importWorkflowState));
  }, [importWorkflowState, runImportOperation]);

  return {
    isImporting,
    importArticle,
    importFromFileUri,
  };
}
