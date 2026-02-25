import * as Linking from "expo-linking";
import { Platform } from "react-native";

const DIRECT_IMPORT_URI_PREFIXES = ["content://", "file://"] as const;
const WEB_IMPORT_URI_PREFIXES = ["/", "http://", "https://", "blob:", "data:"] as const;

function hasPrefix(value: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

function isDirectIncomingImportUri(uri: string): boolean {
  return hasPrefix(uri, DIRECT_IMPORT_URI_PREFIXES);
}

function isSupportedImportUri(uri: string): boolean {
  if (isDirectIncomingImportUri(uri)) {
    return true;
  }

  return Platform.OS === "web" && hasPrefix(uri, WEB_IMPORT_URI_PREFIXES);
}

export function resolveIncomingImportUri(url: string | null): string | null {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) {
    return null;
  }

  if (isDirectIncomingImportUri(trimmedUrl)) {
    return trimmedUrl;
  }

  const { queryParams } = Linking.parse(trimmedUrl);
  const importUriQueryParam = queryParams?.importUri;
  const importUri = Array.isArray(importUriQueryParam)
    ? importUriQueryParam[0]
    : importUriQueryParam;
  const trimmedImportUri = typeof importUri === "string" ? importUri.trim() : "";

  if (!trimmedImportUri || !isSupportedImportUri(trimmedImportUri)) {
    return null;
  }

  return trimmedImportUri;
}
