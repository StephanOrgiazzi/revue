import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { copyAsync as copyFileAsyncLegacy } from "expo-file-system/legacy";
import { Platform } from "react-native";

import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";
import { parseMarkdownDocument } from "@/shared/logic/markdown";
import { readTextFromWebUri } from "@/shared/logic/web/textUri";

export type PickedMarkdownAsset = {
  name: string;
  uri: string;
};

type ImportedMarkdown = {
  rawMarkdown: string;
  localPath: string;
};

type FinalizeMarkdownImportOptions = {
  id: LibraryItemId;
  createdAt: string;
  readingPosition?: {
    anchorSlug: string | null;
    scrollOffsetY: number | null;
  };
};

function normalizeTags(tags: string[] | undefined): string[] {
  return tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
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

function stripQueryAndFragment(uri: string): string {
  return uri.split(/[?#]/, 1)[0];
}

function decodeUriSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function sanitizeUriDerivedFileName(segment: string): string {
  const baseName = segment.split(/[\\/:]/).pop() ?? "";
  const sanitizedBaseName =
    Array.from(baseName, (char) => {
      const code = char.charCodeAt(0);
      return code <= 31 || /[<>:"/\\|?*]/.test(char) ? "-" : char;
    })
      .join("")
      .replace(/\.+$/g, "")
      .trim() || "";

  return sanitizedBaseName === "." || sanitizedBaseName === ".." ? "" : sanitizedBaseName;
}

function extractFileNameFromUri(uri: string): string {
  const normalizedUri = stripQueryAndFragment(uri).replace(/\/+$/, "");
  const pathSegments = normalizedUri.split("/");
  const lastPathSegment = pathSegments[pathSegments.length - 1];
  const decodedSegment = decodeUriSegment(lastPathSegment).trim();
  const normalizedFileName = sanitizeUriDerivedFileName(decodedSegment);

  if (!normalizedFileName) {
    return "imported.md";
  }

  if (normalizedFileName.toLowerCase().endsWith(".md")) {
    return normalizedFileName;
  }

  return `${normalizedFileName}.md`;
}

function assertMarkdownFileName(fileName: string): void {
  if (!fileName.toLowerCase().endsWith(".md")) {
    throw new Error("Only .md files are supported.");
  }
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

export async function pickMarkdownDocument(): Promise<PickedMarkdownAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: false,
    type: ["text/markdown", "text/plain"],
    copyToCacheDirectory: true,
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
    uri: pickedAsset.uri,
  };
}

export function createPickedMarkdownAssetFromUri(uri: string): PickedMarkdownAsset | null {
  const trimmedUri = uri.trim();
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

async function readAndPersistImportedMarkdown(
  pickedAsset: PickedMarkdownAsset,
): Promise<ImportedMarkdown> {
  if (Platform.OS === "web") {
    return {
      rawMarkdown: await readTextFromWebUri(pickedAsset.uri),
      localPath: pickedAsset.uri,
    };
  }

  const articlesDirectory = new Directory(Paths.document, "articles");
  articlesDirectory.create({ idempotent: true, intermediates: true });

  const safeFileName = pickedAsset.name.toLowerCase().endsWith(".md")
    ? pickedAsset.name
    : `${pickedAsset.name}.md`;
  const importedFileName = `${Date.now()}-${safeFileName}`;
  const destinationFile = new File(articlesDirectory, importedFileName);

  if (pickedAsset.uri.startsWith("content://")) {
    await copyFileAsyncLegacy({
      from: pickedAsset.uri,
      to: destinationFile.uri,
    });
  } else {
    new File(pickedAsset.uri).copy(destinationFile);
  }

  return {
    rawMarkdown: await destinationFile.text(),
    localPath: destinationFile.uri,
  };
}

export async function finalizeMarkdownImport(
  pickedAsset: PickedMarkdownAsset,
  options: FinalizeMarkdownImportOptions,
): Promise<LibraryItem> {
  assertMarkdownFileName(pickedAsset.name);

  const { rawMarkdown, localPath } = await readAndPersistImportedMarkdown(pickedAsset);
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
