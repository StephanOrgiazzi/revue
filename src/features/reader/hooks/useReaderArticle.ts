import { useEffect, useState } from "react";

import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";
import {
  getSingleRouteParam,
  readArticleById,
  readArticleContent,
} from "@/features/reader/logic/readerRepository";

type UseReaderArticleResult = {
  article: LibraryItem | null;
  content: string;
  errorMessage: string | null;
  isLoading: boolean;
};

type ReaderArticleState = UseReaderArticleResult;

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function useReaderArticle(
  routeId: LibraryItemId | LibraryItemId[] | undefined,
): UseReaderArticleResult {
  const articleId = getSingleRouteParam(routeId);
  const [state, setState] = useState<ReaderArticleState>({
    article: null,
    content: "",
    errorMessage: null,
    isLoading: true,
  });

  useEffect(() => {
    const abortController = new AbortController();

    const hydrateArticle = async () => {
      if (!articleId) {
        setState({
          article: null,
          content: "",
          errorMessage: "Missing article id.",
          isLoading: false,
        });
        return;
      }

      const nextArticle = readArticleById(articleId);
      if (!nextArticle) {
        setState({
          article: null,
          content: "",
          errorMessage: "Article not found.",
          isLoading: false,
        });
        return;
      }

      setState({
        article: nextArticle,
        content: "",
        errorMessage: null,
        isLoading: true,
      });

      try {
        const nextContent = await readArticleContent(nextArticle.localPath, {
          signal: abortController.signal,
        });

        setState({
          article: nextArticle,
          content: nextContent,
          errorMessage: null,
          isLoading: false,
        });
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        setState({
          article: null,
          content: "",
          errorMessage: error instanceof Error ? error.message : "Failed to load article.",
          isLoading: false,
        });
      }
    };

    void hydrateArticle();

    return () => {
      abortController.abort();
    };
  }, [articleId]);

  return state;
}
