const WEB_TEXT_URI_PREFIXES = ["/", "http://", "https://", "blob:", "data:"] as const;

export function canReadTextFromWebUri(uri: string): boolean {
  return WEB_TEXT_URI_PREFIXES.some((prefix) => uri.startsWith(prefix));
}

export async function readTextFromWebUri(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read text from ${uri}.`);
  }

  return response.text();
}
