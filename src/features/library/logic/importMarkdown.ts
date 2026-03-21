import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { copyAsync as copyFileAsyncLegacy } from "expo-file-system/legacy";
import { Platform } from "react-native";

import type { PickedMarkdownAsset } from "@/features/library/logic/types";
import type { LibraryItem, LibraryItemId } from "@/shared/library/types";

import { copyLocalMarkdownAssets } from "@/features/library/logic/importMarkdown/copyLocalMarkdownAssets";
import {
  assertMarkdownFileName,
  extractFileNameFromUri,
  normalizeLocalUri,
} from "@/features/library/logic/importMarkdown/uriUtils";
import { parseMarkdownDocument } from "@/shared/logic/markdown";
import { readTextFromWebUri } from "@/shared/logic/web/textUri";

type FinalizeMarkdownImportOptions = {
  id: LibraryItemId;
  createdAt: string;
  readingPosition?: {
    anchorSlug: string | null;
    scrollOffsetY: number | null;
  };
};

type ImportedMarkdown = {
  rawMarkdown: string;
  localPath: string;
};

export function createPickedMarkdownAssetFromUri(uri: string): PickedMarkdownAsset | null {
  const trimmedUri = normalizeLocalUri(uri);
  if (!trimmedUri) {
    return null;
  }

  const fileName = extractFileNameFromUri(trimmedUri);
  assertMarkdownFileName(fileName);

  return {
    name: fileName,
    uri: trimmedUri,
  };
}

export async function finalizeMarkdownImport(
  pickedAsset: PickedMarkdownAsset,
  options: FinalizeMarkdownImportOptions,
): Promise<LibraryItem> {
  assertMarkdownFileName(pickedAsset.name);

  const { rawMarkdown, localPath } = await readAndPersistImportedMarkdown(pickedAsset, options.id);

  const parsedMarkdown = parseMarkdownDocument(rawMarkdown);

  const title = extractTitle(parsedMarkdown.content, pickedAsset.name, parsedMarkdown.data.title);

  return createLibraryItem({
    id: options.id,
    title,
    localPath,
    createdAt: options.createdAt,
    tags: parsedMarkdown.data.tags,
    readingPosition: options.readingPosition,
  });
}

export async function pickMarkdownDocument(): Promise<PickedMarkdownAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: false,
    type: ["text/markdown", "text/plain"],
    copyToCacheDirectory: false,
  });

  if (result.canceled) {
    return null;
  }

  const pickedAsset = result.assets[0];
  if (!pickedAsset?.uri) {
    return null;
  }

  const fileName = pickedAsset.name || "untitled.md";
  assertMarkdownFileName(fileName);

  return {
    name: fileName,
    uri: normalizeLocalUri(pickedAsset.uri),
  };
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
    tags: normalizeTags(input.tags),
    createdAt: input.createdAt,
    lastAnchorSlug: input.readingPosition?.anchorSlug ?? null,
    lastScrollOffsetY: input.readingPosition?.scrollOffsetY ?? null,
    readingProgress: input.readingProgress ?? 0,
  };
}

function extractTitle(
  markdownBody: string,
  fallbackFileName: string,
  frontMatterTitle?: string,
): string {
  const trimmedFrontMatterTitle = frontMatterTitle?.trim();
  if (trimmedFrontMatterTitle) {
    return trimmedFrontMatterTitle;
  }

  const h1Match = markdownBody.match(/^#\s+(.+)$/m);

  const h1Title = h1Match?.[1]?.trim();
  if (h1Title) {
    return h1Title;
  }

  return fallbackFileName.replace(/\.md$/i, "");
}

function normalizeTags(tags: string[] | undefined): string[] {
  return tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
}

async function readAndPersistImportedMarkdown(
  pickedAsset: PickedMarkdownAsset,
  articleId: LibraryItemId,
): Promise<ImportedMarkdown> {
  const normalizedPickedAssetUri = normalizeLocalUri(pickedAsset.uri);

  if (Platform.OS === "web") {
    return {
      rawMarkdown: await readTextFromWebUri(normalizedPickedAssetUri),
      localPath: normalizedPickedAssetUri,
    };
  }

  const articleDirectory = new Directory(Paths.document, "articles", articleId);
  articleDirectory.create({ idempotent: true, intermediates: true });
  const destinationFile = new File(articleDirectory, "article.md");

  if (normalizedPickedAssetUri.startsWith("content://")) {
    await copyFileAsyncLegacy({
      from: normalizedPickedAssetUri,
      to: destinationFile.uri,
    });
  } else {
    new File(normalizedPickedAssetUri).copy(destinationFile);
  }

  const rawMarkdown = await destinationFile.text();

  const rewrittenMarkdown = await copyLocalMarkdownAssets(
    rawMarkdown,
    normalizedPickedAssetUri,
    articleDirectory,
  );

  if (rewrittenMarkdown !== rawMarkdown) {
    destinationFile.write(rewrittenMarkdown);
  }

  return {
    rawMarkdown: rewrittenMarkdown,
    localPath: destinationFile.uri,
  };
}
