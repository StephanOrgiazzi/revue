import { Directory, File } from "expo-file-system";
import { StorageAccessFramework, copyAsync as copyFileAsyncLegacy } from "expo-file-system/legacy";
import { lexer, walkTokens, type Token } from "marked";
import { Platform } from "react-native";

import {
  decodeUriSegment,
  extractAndroidSafGrantedDirectoryPathSegments,
  extractAndroidSafSourceDirectoryPathSegments,
  extractAssetFileNameFromUri,
  isRelativeMarkdownAssetHref,
  normalizeLocalUri,
  sanitizeAssetFileName,
  splitRelativeHref,
  stripQueryAndFragment,
  unwrapMarkdownLinkHref,
} from "@/features/library/logic/importMarkdown/uriUtils";

const MARKDOWN_IMAGE_TOKEN_PATTERN = /^!\[[^\]]*\]\(\s*(<[^>\n]+>|[^)\s]+)([^)]*)\)$/;

type AndroidSafAssetContext = {
  requestedDirectoryPermission: boolean;
  grantedDirectoryUri: string | null;
  directoryEntriesByUri: Map<string, string[] | null>;
  sourceDirectoryPathSegments: string[] | null;
};

type MarkdownAssetCopyRuntime = {
  normalizedSourceMarkdownUri: string;
  shouldResolveWithFileBase: boolean;
  androidSafAssetContext: AndroidSafAssetContext | null;
  assetsDirectory: Directory;
  copiedAssetUriByHref: Map<string, string>;
  copiedAssetCount: number;
};

type MarkdownImageMatch = {
  fullMatch: string;
  rawHref: string | null;
  normalizedHref: string;
  altText: string;
  title: string | null;
  start: number;
  end: number;
};

export async function copyLocalMarkdownAssets(
  markdown: string,
  sourceMarkdownUri: string,
  articleDirectory: Directory,
): Promise<string> {
  const normalizedSourceMarkdownUri = normalizeLocalUri(sourceMarkdownUri);
  if (!isNativeMarkdownUri(normalizedSourceMarkdownUri)) {
    return markdown;
  }

  const markdownImageMatches = collectMarkdownImageMatches(markdown);
  if (markdownImageMatches.length === 0) {
    return markdown;
  }

  const runtime = createMarkdownAssetCopyRuntime(normalizedSourceMarkdownUri, articleDirectory);
  let cursor = 0;
  let rewrittenMarkdown = "";

  for (const markdownImageMatch of markdownImageMatches) {
    rewrittenMarkdown += markdown.slice(cursor, markdownImageMatch.start);
    cursor = markdownImageMatch.end;

    const copiedAssetUri = await copyMarkdownImageAsset(markdownImageMatch, runtime);
    if (!copiedAssetUri) {
      rewrittenMarkdown += markdownImageMatch.fullMatch;
      continue;
    }

    rewrittenMarkdown += rewriteMarkdownImageHref(markdownImageMatch, copiedAssetUri);
  }

  rewrittenMarkdown += markdown.slice(cursor);
  return rewrittenMarkdown;
}

function arePathSegmentsEqual(left: string, right: string): boolean {
  return (
    left.localeCompare(right, undefined, {
      sensitivity: "accent",
      usage: "search",
    }) === 0
  );
}

function collectMarkdownImageMatches(markdown: string): MarkdownImageMatch[] {
  const parsedTokens = lexer(markdown);

  const imageTokens: Array<{
    raw: string;
    href: string;
    text: string;
    title: string | null;
  }> = [];

  walkTokens(parsedTokens, (token: Token) => {
    if (
      token.type === "image" &&
      typeof token.raw === "string" &&
      token.raw &&
      typeof token.href === "string" &&
      token.href
    ) {
      imageTokens.push({
        raw: token.raw,
        href: token.href,
        text: token.text ?? "",
        title: token.title ?? null,
      });
    }
  });

  const matches: MarkdownImageMatch[] = [];
  let searchStart = 0;
  for (const imageToken of imageTokens) {
    const tokenStart = markdown.indexOf(imageToken.raw, searchStart);
    if (tokenStart < 0) {
      continue;
    }

    searchStart = tokenStart + imageToken.raw.length;
    const rawHref = extractRawHrefFromImageToken(imageToken.raw);

    const rawRelativeHref = rawHref ?? imageToken.href;

    const normalizedHref = unwrapMarkdownLinkHref(rawRelativeHref);
    if (!isRelativeMarkdownAssetHref(normalizedHref)) {
      continue;
    }

    matches.push({
      fullMatch: imageToken.raw,
      rawHref,
      normalizedHref,
      altText: imageToken.text,
      title: imageToken.title,
      start: tokenStart,
      end: tokenStart + imageToken.raw.length,
    });
  }

  return matches;
}

async function copyMarkdownImageAsset(
  markdownImageMatch: MarkdownImageMatch,
  runtime: MarkdownAssetCopyRuntime,
): Promise<string | null> {
  const existingCopiedAssetUri = runtime.copiedAssetUriByHref.get(
    markdownImageMatch.normalizedHref,
  );
  if (existingCopiedAssetUri) {
    return existingCopiedAssetUri;
  }

  const sourceAssetUri = resolveSourceAssetUri(markdownImageMatch, runtime);
  const normalizedSourceAssetUri = sourceAssetUri ? normalizeLocalUri(sourceAssetUri) : null;

  const destinationAssetFile = createDestinationAssetFile(
    runtime,
    markdownImageMatch,
    normalizedSourceAssetUri,
  );

  try {
    if (runtime.shouldResolveWithFileBase) {
      if (!normalizedSourceAssetUri?.startsWith("file://")) {
        return null;
      }

      new File(normalizedSourceAssetUri).copy(destinationAssetFile);
    } else if (runtime.androidSafAssetContext) {
      const didCopyAsset = await copyRelativeContentAsset(
        markdownImageMatch.normalizedHref,
        destinationAssetFile.uri,
        runtime.androidSafAssetContext,
      );
      if (!didCopyAsset) {
        return null;
      }
    } else {
      return null;
    }

    runtime.copiedAssetUriByHref.set(markdownImageMatch.normalizedHref, destinationAssetFile.uri);
    return destinationAssetFile.uri;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[import] Failed to copy markdown image asset:",
        normalizedSourceAssetUri ?? markdownImageMatch.normalizedHref,
        error,
      );
    }
    return null;
  }
}

async function copyRelativeContentAsset(
  relativeHref: string,
  destinationUri: string,
  context: AndroidSafAssetContext,
): Promise<boolean> {
  const grantedDirectoryUri = await ensureAndroidSafDirectoryUri(context);
  if (!grantedDirectoryUri) {
    return false;
  }

  const { path: relativePath } = splitRelativeHref(relativeHref);

  const basePathSegments = resolveAndroidSafBasePathSegments(
    context.sourceDirectoryPathSegments,
    grantedDirectoryUri,
  );

  const relativePathSegments = resolveRelativePathSegments(basePathSegments, relativePath);
  if (!relativePathSegments) {
    return false;
  }

  const sourceAssetUri = await findAndroidSafEntryUriByPath(
    grantedDirectoryUri,
    relativePathSegments,
    context,
  );
  if (!sourceAssetUri) {
    return false;
  }

  try {
    await copyFileAsyncLegacy({
      from: sourceAssetUri,
      to: destinationUri,
    });
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn("[import] Failed to copy markdown image asset:", sourceAssetUri, error);
    }
    return false;
  }
}

function createAndroidSafAssetContext(sourceMarkdownUri: string): AndroidSafAssetContext | null {
  if (Platform.OS !== "android" || !sourceMarkdownUri.startsWith("content://")) {
    return null;
  }

  return {
    requestedDirectoryPermission: false,
    grantedDirectoryUri: null,
    directoryEntriesByUri: new Map<string, string[] | null>(),
    sourceDirectoryPathSegments: extractAndroidSafSourceDirectoryPathSegments(sourceMarkdownUri),
  };
}

function createDestinationAssetFile(
  runtime: MarkdownAssetCopyRuntime,
  markdownImageMatch: MarkdownImageMatch,
  normalizedSourceAssetUri: string | null,
): File {
  runtime.copiedAssetCount += 1;
  const sourceAssetFileName = sanitizeAssetFileName(
    extractAssetFileNameFromUri(normalizedSourceAssetUri ?? markdownImageMatch.normalizedHref),
    `asset-${runtime.copiedAssetCount}`,
  );

  runtime.assetsDirectory.create({ idempotent: true, intermediates: true });
  return new File(runtime.assetsDirectory, `${runtime.copiedAssetCount}-${sourceAssetFileName}`);
}

function createMarkdownAssetCopyRuntime(
  normalizedSourceMarkdownUri: string,
  articleDirectory: Directory,
): MarkdownAssetCopyRuntime {
  const shouldResolveWithFileBase = normalizedSourceMarkdownUri.startsWith("file://");

  return {
    normalizedSourceMarkdownUri,
    shouldResolveWithFileBase,
    androidSafAssetContext: shouldResolveWithFileBase
      ? null
      : createAndroidSafAssetContext(normalizedSourceMarkdownUri),
    assetsDirectory: new Directory(articleDirectory, "assets"),
    copiedAssetUriByHref: new Map<string, string>(),
    copiedAssetCount: 0,
  };
}

async function ensureAndroidSafDirectoryUri(
  context: AndroidSafAssetContext,
): Promise<string | null> {
  if (context.requestedDirectoryPermission) {
    return context.grantedDirectoryUri;
  }

  context.requestedDirectoryPermission = true;
  try {
    const permissionResult = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissionResult.granted || !permissionResult.directoryUri) {
      context.grantedDirectoryUri = null;
      return null;
    }

    context.grantedDirectoryUri = normalizeLocalUri(permissionResult.directoryUri);
    return context.grantedDirectoryUri;
  } catch (error) {
    if (__DEV__) {
      console.warn("[import] Failed to request Android directory permission:", error);
    }
    context.grantedDirectoryUri = null;
    return null;
  }
}

function extractAndroidSafEntryName(uri: string): string {
  const normalizedUri = stripQueryAndFragment(uri).replace(/\/+$/g, "");

  const pathSegments = normalizedUri.split("/");

  const lastPathSegment = pathSegments[pathSegments.length - 1];

  const decodedLastSegment = decodeUriSegment(lastPathSegment).trim();

  const decodedDisplayName = decodedLastSegment.split("/").pop()?.trim() ?? "";

  return decodedDisplayName;
}

function extractRawHrefFromImageToken(rawImageToken: string): string | null {
  const match = rawImageToken.match(MARKDOWN_IMAGE_TOKEN_PATTERN);
  return match?.[1] ?? null;
}

async function findAndroidSafEntryUriByPath(
  directoryUri: string,
  relativePathSegments: string[],
  context: AndroidSafAssetContext,
): Promise<string | null> {
  let currentDirectoryUri = directoryUri;

  for (let index = 0; index < relativePathSegments.length; index += 1) {
    const segment = relativePathSegments[index];

    const directoryEntries = await readAndroidSafDirectoryEntries(currentDirectoryUri, context);
    if (!directoryEntries) {
      return null;
    }

    const matchingEntryUri = directoryEntries.find((entryUri) => {
      const entryName = extractAndroidSafEntryName(entryUri);
      return (
        entryName.localeCompare(segment, undefined, {
          sensitivity: "accent",
          usage: "search",
        }) === 0
      );
    });
    if (!matchingEntryUri) {
      return null;
    }

    if (index === relativePathSegments.length - 1) {
      return normalizeLocalUri(matchingEntryUri);
    }

    currentDirectoryUri = normalizeLocalUri(matchingEntryUri);
  }

  return null;
}

function isNativeMarkdownUri(uri: string): boolean {
  return uri.startsWith("file://") || uri.startsWith("content://");
}

async function readAndroidSafDirectoryEntries(
  directoryUri: string,
  context: AndroidSafAssetContext,
): Promise<string[] | null> {
  const cachedEntries = context.directoryEntriesByUri.get(directoryUri);
  if (typeof cachedEntries !== "undefined") {
    return cachedEntries;
  }

  try {
    const directoryEntries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
    context.directoryEntriesByUri.set(directoryUri, directoryEntries);
    return directoryEntries;
  } catch {
    context.directoryEntriesByUri.set(directoryUri, null);
    return null;
  }
}

function resolveAndroidSafBasePathSegments(
  sourceDirectoryPathSegments: string[] | null,
  grantedDirectoryUri: string,
): string[] {
  if (!sourceDirectoryPathSegments || sourceDirectoryPathSegments.length === 0) {
    return [];
  }

  const grantedDirectoryPathSegments =
    extractAndroidSafGrantedDirectoryPathSegments(grantedDirectoryUri);
  if (grantedDirectoryPathSegments.length === 0) {
    return sourceDirectoryPathSegments;
  }

  if (sourceDirectoryPathSegments.length < grantedDirectoryPathSegments.length) {
    return [];
  }

  for (let index = 0; index < grantedDirectoryPathSegments.length; index += 1) {
    if (
      !arePathSegmentsEqual(sourceDirectoryPathSegments[index], grantedDirectoryPathSegments[index])
    ) {
      return [];
    }
  }

  return sourceDirectoryPathSegments.slice(grantedDirectoryPathSegments.length);
}

function resolveRelativeFileAssetUri(
  sourceMarkdownUri: string,
  relativeHref: string,
): string | null {
  try {
    return new URL(relativeHref, sourceMarkdownUri).toString();
  } catch {
    return null;
  }
}

function resolveRelativePathSegments(
  basePathSegments: string[],
  relativePath: string,
): string[] | null {
  const resolvedPathSegments = [...basePathSegments];

  for (const rawSegment of relativePath.split("/")) {
    const segment = decodeUriSegment(rawSegment);
    if (segment.includes("/")) {
      return null;
    }

    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (resolvedPathSegments.length === 0) {
        return null;
      }
      resolvedPathSegments.pop();
      continue;
    }

    resolvedPathSegments.push(segment);
  }

  return resolvedPathSegments.length > 0 ? resolvedPathSegments : null;
}

function resolveSourceAssetUri(
  markdownImageMatch: MarkdownImageMatch,
  runtime: MarkdownAssetCopyRuntime,
): string | null {
  if (!runtime.shouldResolveWithFileBase) {
    return null;
  }

  return resolveRelativeFileAssetUri(
    runtime.normalizedSourceMarkdownUri,
    markdownImageMatch.normalizedHref,
  );
}

function rewriteMarkdownImageHref(
  markdownImageMatch: MarkdownImageMatch,
  nextHref: string,
): string {
  if (markdownImageMatch.rawHref) {
    return markdownImageMatch.fullMatch.replace(markdownImageMatch.rawHref, nextHref);
  }

  const normalizedTitle = markdownImageMatch.title?.trim();

  const serializedTitle = normalizedTitle ? ` "${normalizedTitle.replace(/"/g, '\\"')}"` : "";
  return `![${markdownImageMatch.altText}](${nextHref}${serializedTitle})`;
}
