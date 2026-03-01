const URI_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const ABSOLUTE_POSIX_PATH_PATTERN = /^\/(?!\/)/;
const FILE_SINGLE_SLASH_SCHEME_PATTERN = /^file:\/(?!\/)/i;
const CONTENT_SINGLE_SLASH_SCHEME_PATTERN = /^content:\/(?!\/)/i;
const INVALID_FILE_NAME_CHARACTER_PATTERN = /[<>:"/\\|?*]/;

export function stripQueryAndFragment(uri: string): string {
  return uri.split(/[?#]/, 1)[0];
}

export function normalizeLocalUri(uri: string): string {
  const trimmedUri = uri.trim();
  if (!trimmedUri) {
    return "";
  }

  if (FILE_SINGLE_SLASH_SCHEME_PATTERN.test(trimmedUri)) {
    return `file://${trimmedUri.slice("file:".length)}`;
  }

  if (CONTENT_SINGLE_SLASH_SCHEME_PATTERN.test(trimmedUri)) {
    return `content://${trimmedUri.slice("content:".length)}`;
  }

  if (URI_SCHEME_PATTERN.test(trimmedUri)) {
    if (trimmedUri.startsWith("file://") && !trimmedUri.startsWith("file:///")) {
      return `file:///${trimmedUri.slice("file://".length).replace(/^\/+/, "")}`;
    }

    return trimmedUri;
  }

  if (ABSOLUTE_POSIX_PATH_PATTERN.test(trimmedUri)) {
    return `file://${trimmedUri}`;
  }

  return trimmedUri;
}

export function decodeUriSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function sanitizeUriDerivedFileName(segment: string): string {
  const baseName = segment.split(/[\\/:]/).pop() ?? "";
  const sanitizedBaseName = sanitizeFileNameCharacters(baseName).replace(/\.+$/g, "").trim() || "";

  return sanitizedBaseName === "." || sanitizedBaseName === ".." ? "" : sanitizedBaseName;
}

export function sanitizeAssetFileName(fileName: string, fallbackName: string): string {
  const trimmedFileName = fileName.trim();
  const sanitizedName =
    sanitizeFileNameCharacters(trimmedFileName).replace(/\.+$/g, "").trim() || "";

  if (!sanitizedName || sanitizedName === "." || sanitizedName === "..") {
    return fallbackName;
  }

  return sanitizedName;
}

function sanitizeFileNameCharacters(value: string): string {
  return Array.from(value, (char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || INVALID_FILE_NAME_CHARACTER_PATTERN.test(char) ? "-" : char;
  }).join("");
}

export function extractFileNameFromUri(uri: string): string {
  const normalizedUri = stripQueryAndFragment(uri).replace(/\/+$/, "");
  const pathSegments = normalizedUri.split("/");
  const lastPathSegment = pathSegments[pathSegments.length - 1];
  const decodedSegment = decodeUriSegment(lastPathSegment).trim();
  const normalizedFileName = sanitizeUriDerivedFileName(decodedSegment);

  if (!normalizedFileName) {
    return "imported.md";
  }

  return normalizedFileName.toLowerCase().endsWith(".md")
    ? normalizedFileName
    : `${normalizedFileName}.md`;
}

export function extractAssetFileNameFromUri(uri: string): string {
  const normalizedUri = stripQueryAndFragment(uri).replace(/\/+$/, "");
  const pathSegments = normalizedUri.split("/");
  const lastPathSegment = pathSegments[pathSegments.length - 1];
  const decodedSegment = decodeUriSegment(lastPathSegment).trim();
  const normalizedFileName = sanitizeUriDerivedFileName(decodedSegment);

  return normalizedFileName || "asset";
}

export function assertMarkdownFileName(fileName: string): void {
  if (!fileName.toLowerCase().endsWith(".md")) {
    throw new Error("Only .md files are supported.");
  }
}

export function unwrapMarkdownLinkHref(rawHref: string): string {
  const trimmedHref = rawHref.trim();
  if (trimmedHref.startsWith("<") && trimmedHref.endsWith(">") && trimmedHref.length > 2) {
    return trimmedHref.slice(1, -1).trim();
  }

  return trimmedHref;
}

export function isRelativeMarkdownAssetHref(href: string): boolean {
  if (!href || href.startsWith("/")) {
    return false;
  }

  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

export function splitRelativeHref(relativeHref: string): { path: string; suffix: string } {
  const match = relativeHref.match(/^[^?#]*/);
  const path = match?.[0] ?? relativeHref;
  const suffix = relativeHref.slice(path.length);
  return { path, suffix };
}

function extractAndroidSafEncodedDocumentId(uri: string): string | null {
  const normalizedUri = stripQueryAndFragment(uri).replace(/\/+$/g, "");
  const documentMarker = "/document/";
  const documentMarkerIndex = normalizedUri.indexOf(documentMarker);
  if (documentMarkerIndex < 0) {
    return null;
  }

  return normalizedUri.slice(documentMarkerIndex + documentMarker.length) || null;
}

function extractAndroidSafEncodedTreeId(uri: string): string | null {
  const normalizedUri = stripQueryAndFragment(uri).replace(/\/+$/g, "");
  const treeMarker = "/tree/";
  const treeMarkerIndex = normalizedUri.indexOf(treeMarker);
  if (treeMarkerIndex < 0) {
    return null;
  }

  return normalizedUri.slice(treeMarkerIndex + treeMarker.length) || null;
}

function parseAndroidSafPathSegmentsFromEncodedId(encodedId: string | null): string[] | null {
  if (!encodedId) {
    return null;
  }

  const decodedId = decodeUriSegment(encodedId).trim();
  if (!decodedId) {
    return null;
  }

  const pathStartIndex = decodedId.indexOf(":");
  const relativePath = pathStartIndex >= 0 ? decodedId.slice(pathStartIndex + 1) : decodedId;
  const normalizedPath = relativePath.trim();
  if (!normalizedPath) {
    return [];
  }

  return normalizedPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function extractAndroidSafSourceDirectoryPathSegments(
  sourceMarkdownUri: string,
): string[] | null {
  const filePathSegments = parseAndroidSafPathSegmentsFromEncodedId(
    extractAndroidSafEncodedDocumentId(sourceMarkdownUri),
  );
  if (!filePathSegments || filePathSegments.length === 0) {
    return null;
  }

  return filePathSegments.slice(0, -1);
}

export function extractAndroidSafGrantedDirectoryPathSegments(
  grantedDirectoryUri: string,
): string[] {
  return (
    parseAndroidSafPathSegmentsFromEncodedId(extractAndroidSafEncodedTreeId(grantedDirectoryUri)) ??
    []
  );
}
