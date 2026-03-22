import { File } from "expo-file-system";

import type {
  LibraryItem,
  LibraryItemId,
  LibraryItemReadingPosition,
} from "@/shared/library/types";

import {
  readLibraryItemById,
  readLibraryItemReadingPosition,
  saveLibraryItemReadingPosition,
} from "@/shared/library/libraryStore";
import { extractMarkdownFrontMatter, normalizeMarkdownLineEndings } from "@/shared/logic/markdown";
import { canReadTextFromWebUri, readTextFromWebUri } from "@/shared/logic/web/textUri";

const DATA_IMAGE_BASE64_PATTERN = /(data:image\/[a-z0-9.+-]+;base64,)[a-z0-9+/=_\r\n-]+/gi;

type ReadArticleByIdResult = LibraryItem | null;
type ReadArticleContentOptions = {
  signal?: AbortSignal;
};
type SingleRouteParamValue = string | string[] | undefined;

export function getSingleRouteParam(value: SingleRouteParamValue): LibraryItemId | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readArticleById(articleId: LibraryItemId): ReadArticleByIdResult {
  const normalizedArticleId = normalizeArticleId(articleId);
  if (!normalizedArticleId) {
    return null;
  }

  return readLibraryItemById(normalizedArticleId);
}

export async function readArticleContent(
  localPath: string,
  options?: ReadArticleContentOptions,
): Promise<string> {
  throwIfAborted(options?.signal);

  const rawMarkdown = await readRawMarkdown(localPath);

  throwIfAborted(options?.signal);

  const contentWithoutFrontMatter = extractMarkdownFrontMatter(rawMarkdown).content;

  const normalizedContent = normalizeMarkdownLineEndings(contentWithoutFrontMatter);
  return sanitizeEmbeddedMarkdownDataUris(normalizedContent).trim();
}

export function readArticleReadingPosition(articleId: LibraryItemId): LibraryItemReadingPosition {
  const normalizedArticleId = normalizeArticleId(articleId);
  if (!normalizedArticleId) {
    return {
      anchorSlug: null,
      scrollOffsetY: null,
    };
  }

  const position = readLibraryItemReadingPosition(normalizedArticleId);
  return {
    anchorSlug: normalizeAnchorSlug(position.anchorSlug),
    scrollOffsetY: normalizeScrollOffsetY(position.scrollOffsetY),
  };
}

export function saveArticleReadingPosition(
  articleId: LibraryItemId,
  position: LibraryItemReadingPosition,
): void {
  const normalizedArticleId = normalizeArticleId(articleId);
  if (!normalizedArticleId) {
    return;
  }

  saveLibraryItemReadingPosition(normalizedArticleId, {
    anchorSlug: normalizeAnchorSlug(position.anchorSlug),
    scrollOffsetY: normalizeScrollOffsetY(position.scrollOffsetY),
  });
}

function normalizeAnchorSlug(anchorSlug: string | null | undefined): string | null {
  return anchorSlug?.trim() || null;
}

function normalizeArticleId(articleId: LibraryItemId): LibraryItemId | null {
  const normalizedArticleId = articleId.trim();
  return normalizedArticleId ? normalizedArticleId : null;
}

function normalizeScrollOffsetY(scrollOffsetY: number | null | undefined): number | null {
  return typeof scrollOffsetY === "number" && Number.isFinite(scrollOffsetY)
    ? Math.max(0, scrollOffsetY)
    : null;
}

async function readRawMarkdown(localPath: string): Promise<string> {
  if (canReadTextFromWebUri(localPath)) {
    return readTextFromWebUri(localPath);
  }

  const file = new File(localPath);
  return file.text();
}

function sanitizeEmbeddedMarkdownDataUris(markdown: string): string {
  return markdown.replace(DATA_IMAGE_BASE64_PATTERN, "$1[base64-omitted]");
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}
