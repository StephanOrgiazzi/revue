import type { Token } from "marked";

import { buildHtmlBlocksAndHeadings } from "@/features/reader/logic/markdown/chunking";
import { DEFAULT_HTML_BLOCK_TARGET_MARKDOWN_CHARS } from "@/features/reader/logic/markdown/constants";
import {
  lexReaderMarkdown,
  renderReaderTokensToHtml,
} from "@/features/reader/logic/markdown/markedRenderer";
import {
  annotateHeadingTokensWithRenderClasses,
  removeTitleDuplicateHeading,
} from "@/features/reader/logic/markdown/tokenProcessing";
import type { ReaderHeading, ReaderHtmlBlocksResult } from "@/features/reader/logic/markdown/types";

export type { ReaderHeading };

function parseMarkdownIntoTokens(markdown: string, articleTitle?: string): Token[] {
  const normalizedMarkdown = markdown.trim();
  if (!normalizedMarkdown) {
    return [];
  }

  const tokens = lexReaderMarkdown(normalizedMarkdown);
  removeTitleDuplicateHeading(tokens, articleTitle);
  annotateHeadingTokensWithRenderClasses(tokens);

  return tokens;
}

export function renderMarkdownToHtmlBlocksWithHeadings(
  markdown: string,
  articleTitle?: string,
  targetMarkdownCharsPerBlock: number = DEFAULT_HTML_BLOCK_TARGET_MARKDOWN_CHARS,
): ReaderHtmlBlocksResult {
  const tokens = parseMarkdownIntoTokens(markdown, articleTitle);
  if (tokens.length === 0) {
    return {
      htmlBlocks: [],
      headings: [],
    };
  }

  return buildHtmlBlocksAndHeadings(tokens, targetMarkdownCharsPerBlock, renderReaderTokensToHtml);
}
