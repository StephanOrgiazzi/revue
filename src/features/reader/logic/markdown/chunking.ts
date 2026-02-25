import type { Token } from "marked";

import {
  normalizeComparableText,
  normalizeHeadingLevel,
} from "@/features/reader/logic/markdown/markdownUtils";
import { isHeadingBlockToken } from "@/features/reader/logic/markdown/tokenProcessing";
import type { ReaderHeading } from "@/features/reader/logic/markdown/types";

type HtmlBlocksAndHeadingsResult = {
  htmlBlocks: string[];
  headings: ReaderHeading[];
};

type RenderTokensToHtml = (tokens: Token[]) => string;

function buildUniqueHeadingSlug(rawHeadingText: string, slugCounters: Map<string, number>): string {
  const slugBase =
    `heading-${normalizeComparableText(rawHeadingText).replace(/\s+/g, "-")}`.replace(/-+$/g, "");
  const previousCounter = slugCounters.get(slugBase) ?? 0;
  const nextCounter = previousCounter + 1;
  slugCounters.set(slugBase, nextCounter);

  return nextCounter === 1 ? slugBase : `${slugBase}-${nextCounter}`;
}

export function buildHtmlBlocksAndHeadings(
  tokens: Token[],
  maxChunkSize: number,
  renderTokensToHtml: RenderTokensToHtml,
): HtmlBlocksAndHeadingsResult {
  const normalizedChunkSize = Math.max(1, maxChunkSize);
  const htmlBlocks: string[] = [];
  const headings: ReaderHeading[] = [];
  const slugCounters = new Map<string, number>();
  let currentChunk: Token[] = [];
  let currentChunkSize = 0;

  const flushChunk = () => {
    if (currentChunk.length === 0) {
      return;
    }

    const html = renderTokensToHtml(currentChunk);
    if (!html) {
      currentChunk = [];
      currentChunkSize = 0;
      return;
    }

    const blockIndex = htmlBlocks.length;
    htmlBlocks.push(html);

    for (const token of currentChunk) {
      if (!isHeadingBlockToken(token)) {
        continue;
      }

      const headingText = token.text.trim();
      if (!headingText) {
        continue;
      }

      headings.push({
        slug: buildUniqueHeadingSlug(headingText, slugCounters),
        text: headingText,
        level: normalizeHeadingLevel(token.depth),
        blockIndex,
      });
    }

    currentChunk = [];
    currentChunkSize = 0;
  };

  for (const token of tokens) {
    const tokenSize = Math.max(1, token.raw?.length ?? 0);
    const startsNewSection = isHeadingBlockToken(token) && currentChunk.length > 0;
    const wouldOverflow =
      currentChunk.length > 0 && currentChunkSize + tokenSize > normalizedChunkSize;

    if (startsNewSection || wouldOverflow) {
      flushChunk();
    }

    currentChunk.push(token);
    currentChunkSize += tokenSize;
  }

  flushChunk();

  return { htmlBlocks, headings };
}
