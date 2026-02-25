import { useMemo } from "react";

import { readerHtmlRenderers } from "@/features/reader/components/ReaderHtmlRenderers";
import { createReaderHtmlStyles } from "@/features/reader/logic/readerHtmlStyles";
import {
  buildArticleMeta,
  buildHtmlSystemFonts,
  buildListMarkerRenderersProps,
  MAX_HTML_CONTENT_WIDTH,
  MIN_HTML_CONTENT_WIDTH,
  shouldShowHeaderFromHtmlBlocks,
} from "@/features/reader/logic/readerScreenUtils";
import { renderMarkdownToHtmlBlocksWithHeadings } from "@/features/reader/logic/markdownRenderer";
import { buildReaderTocHeadings } from "@/features/reader/logic/readerTableOfContents";
import { formatArticleDate } from "@/shared/logic/formatArticleDate";
import type { MarkdownTextSizeLevel } from "@/shared/themes/markdownTextSize";
import { useThemePreferences } from "@/shared/themes/useThemePreferences";

type UseReaderScreenViewModelInput = {
  articleTitle: string | undefined;
  articleCreatedAt: string | undefined;
  content: string;
  theme: ReturnType<typeof useThemePreferences>["theme"];
  markdownTextSizeLevel: MarkdownTextSizeLevel;
  insetsTop: number;
  windowWidth: number;
};

export function useReaderScreenViewModel({
  articleTitle,
  articleCreatedAt,
  content,
  theme,
  markdownTextSizeLevel,
  insetsTop,
  windowWidth,
}: UseReaderScreenViewModelInput) {
  const htmlStyles = useMemo(
    () => createReaderHtmlStyles(theme, markdownTextSizeLevel),
    [markdownTextSizeLevel, theme],
  );
  const htmlSystemFonts = useMemo(() => buildHtmlSystemFonts(), []);
  const htmlRenderers = readerHtmlRenderers;
  const htmlRenderersProps = useMemo(
    () => buildListMarkerRenderersProps(theme.colors.listMarker),
    [theme.colors.listMarker],
  );
  const { htmlBlocks, headings } = useMemo(
    () => renderMarkdownToHtmlBlocksWithHeadings(content, articleTitle),
    [articleTitle, content],
  );
  const shouldShowArticleHeader = useMemo(
    () => shouldShowHeaderFromHtmlBlocks(htmlBlocks),
    [htmlBlocks],
  );
  const tocHeadings = useMemo(
    () => buildReaderTocHeadings(headings, articleTitle, shouldShowArticleHeader),
    [articleTitle, headings, shouldShowArticleHeader],
  );

  const pageBackgroundColor = theme.colors.pageBackground;
  const horizontalPadding = theme.spacing.pagePaddingHorizontal;
  const topContentPadding = insetsTop + theme.spacing.pagePaddingVertical;
  const htmlContentWidth = Math.max(
    MIN_HTML_CONTENT_WIDTH,
    Math.min(windowWidth - horizontalPadding * 2, MAX_HTML_CONTENT_WIDTH),
  );
  const screenTitle = articleTitle ?? "Reader";
  const normalizedArticleTitle = articleTitle ?? "Untitled";
  const formattedDate = useMemo(() => formatArticleDate(articleCreatedAt), [articleCreatedAt]);
  const articleMeta = useMemo(() => buildArticleMeta(formattedDate), [formattedDate]);
  const isContentEmpty = htmlBlocks.length === 0;
  const contentContainerStyle = useMemo(
    () => ({
      paddingTop: topContentPadding,
      paddingBottom: theme.spacing.pagePaddingVertical,
      paddingLeft: horizontalPadding,
      paddingRight: horizontalPadding,
      alignItems: "center" as const,
    }),
    [horizontalPadding, theme.spacing.pagePaddingVertical, topContentPadding],
  );

  return {
    htmlStyles,
    htmlSystemFonts,
    htmlRenderers,
    htmlRenderersProps,
    htmlBlocks,
    shouldShowArticleHeader,
    tocHeadings,
    pageBackgroundColor,
    horizontalPadding,
    htmlContentWidth,
    screenTitle,
    articleTitle: normalizedArticleTitle,
    articleMeta,
    isContentEmpty,
    contentContainerStyle,
  };
}
