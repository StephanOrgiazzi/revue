import { File } from "expo-file-system";

import { readLibraryItemById } from "@/features/library/logic/libraryRepository";
import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";
import { extractMarkdownFrontMatter, normalizeMarkdownLineEndings } from "@/shared/logic/markdown";
import { canReadTextFromWebUri, readTextFromWebUri } from "@/shared/logic/web/textUri";

const DATA_IMAGE_BASE64_PATTERN = /(data:image\/[a-z0-9.+-]+;base64,)[a-z0-9+/=_\r\n-]+/gi;

type ReadArticleContentOptions = {
  signal?: AbortSignal;
};

type SingleRouteParamValue = string | string[] | undefined;
type ReadArticleByIdResult = LibraryItem | null;

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}

export function getSingleRouteParam(value: SingleRouteParamValue): LibraryItemId | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeEmbeddedMarkdownDataUris(markdown: string): string {
  return markdown.replace(DATA_IMAGE_BASE64_PATTERN, "$1[base64-omitted]");
}

async function readRawMarkdown(localPath: string): Promise<string> {
  if (canReadTextFromWebUri(localPath)) {
    return readTextFromWebUri(localPath);
  }

  const file = new File(localPath);
  return file.text();
}

export function readArticleById(articleId: LibraryItemId): ReadArticleByIdResult {
  return readLibraryItemById(articleId);
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
