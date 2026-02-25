import Constants from "expo-constants";
import { defaultSystemFonts } from "react-native-render-html";

const DEFAULT_ARTICLE_META_LABEL = "Imported markdown";

export const MIN_HTML_CONTENT_WIDTH = 1;
export const MAX_HTML_CONTENT_WIDTH = 760;

type FormattedDate = string | null;

export function buildHtmlSystemFonts(): string[] {
  const expoSystemFonts = Array.isArray(Constants.systemFonts) ? Constants.systemFonts : [];

  return Array.from(
    new Set([...defaultSystemFonts, ...expoSystemFonts, "sans-serif", "monospace"]),
  );
}

export function buildListMarkerRenderersProps(markerColor: string) {
  const markerStyle = { color: markerColor };
  return {
    ul: { markerTextStyle: markerStyle },
    ol: { markerTextStyle: markerStyle },
  };
}

export function shouldShowHeaderFromHtmlBlocks(htmlBlocks: string[]): boolean {
  const firstBlock = htmlBlocks[0];
  return !firstBlock || !firstBlock.trimStart().startsWith("<h1");
}

export function buildArticleMeta(formattedDate: FormattedDate): string {
  if (!formattedDate) {
    return DEFAULT_ARTICLE_META_LABEL;
  }

  return formattedDate;
}
