const FILE_PROVIDER_FIRST_SEGMENTS = new Set(["external", "document", "tree", "file"]);
const APP_ROUTE_PREFIXES = ["/reader"];

type RedirectSystemPathParams = {
  path: string;
  initial: boolean;
};

function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function isAppRoutePath(pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/" || normalizedPath === "/index") {
    return true;
  }

  return APP_ROUTE_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

function toImportRoute(uri: string): string {
  return `/?importUri=${encodeURIComponent(uri)}`;
}

function contentUriFromPath(path: string): string | null {
  const normalizedPath = normalizePath(path).split(/[?#]/, 1)[0];
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const host = segments[0];
  const firstSegment = segments[1];
  if (!host || !firstSegment || !FILE_PROVIDER_FIRST_SEGMENTS.has(firstSegment)) {
    return null;
  }

  const remainder = segments.slice(1).join("/");
  return `content://${host}/${remainder}`;
}

function fileUriFromPath(path: string): string | null {
  const normalizedPath = normalizePath(path).split(/[?#]/, 1)[0];
  if (!normalizedPath.toLowerCase().endsWith(".md")) {
    return null;
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  const host = segments[0];
  if (!host) {
    return null;
  }

  const remainder = segments.slice(1).join("/");
  return remainder ? `file://${host}/${remainder}` : `file://${host}`;
}

function importUriFromRevuemdUrl(url: URL): string | null {
  const routeCandidate = normalizePath(`${url.hostname}${url.pathname}`);
  if (isAppRoutePath(routeCandidate)) {
    return null;
  }

  const contentUri = contentUriFromPath(`${url.hostname}${url.pathname}`);
  if (contentUri) {
    return `${contentUri}${url.search}${url.hash}`;
  }

  const fileUri = fileUriFromPath(`${url.hostname}${url.pathname}`);
  return fileUri ? `${fileUri}${url.search}${url.hash}` : null;
}

export function redirectSystemPath({ path }: RedirectSystemPathParams): string {
  try {
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      return "/";
    }

    if (trimmedPath.startsWith("content://") || trimmedPath.startsWith("file://")) {
      return toImportRoute(trimmedPath);
    }

    if (trimmedPath.startsWith("/")) {
      if (isAppRoutePath(trimmedPath)) {
        return trimmedPath;
      }

      const contentUri = contentUriFromPath(trimmedPath);
      if (contentUri) {
        return toImportRoute(contentUri);
      }

      const fileUri = fileUriFromPath(trimmedPath);
      return fileUri ? toImportRoute(fileUri) : trimmedPath;
    }

    const parsedUrl = new URL(trimmedPath, "revuemd://");
    const protocol = parsedUrl.protocol.toLowerCase();

    if (protocol === "content:" || protocol === "file:") {
      return toImportRoute(parsedUrl.toString());
    }

    if (protocol === "revuemd:") {
      const importUri = importUriFromRevuemdUrl(parsedUrl);
      if (importUri) {
        return toImportRoute(importUri);
      }
    }

    return path;
  } catch {
    return "/";
  }
}
