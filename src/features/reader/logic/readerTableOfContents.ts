import type { ReaderHeading } from "@/features/reader/logic/markdownRenderer";

const ACTIVE_HEADING_SCROLL_OFFSET = 24;
const ANCHOR_SCROLL_ALIGNMENT_OFFSET = 20;

const TITLE_TOC_ANCHOR_SLUG = "reader-title-anchor";
export const TITLE_TOC_BLOCK_INDEX = -1;

type BlockOffsetsByIndex = Record<number, number>;

export function resolveAnchorScrollOffset(blockOffset: number): number {
  return Math.max(0, blockOffset - ANCHOR_SCROLL_ALIGNMENT_OFFSET);
}

export function buildReaderTocHeadings(
  headings: ReaderHeading[],
  articleTitle: string | undefined,
  shouldShowArticleHeader: boolean,
): ReaderHeading[] {
  const title = articleTitle?.trim();
  if (!shouldShowArticleHeader || !title) {
    return headings;
  }

  const titleHeading: ReaderHeading = {
    slug: TITLE_TOC_ANCHOR_SLUG,
    text: title,
    level: 1,
    blockIndex: TITLE_TOC_BLOCK_INDEX,
  };

  return [titleHeading, ...headings];
}

export function resolveHeadingForScrollOffset(
  scrollOffsetY: number,
  headings: ReaderHeading[],
  blockOffsets: BlockOffsetsByIndex,
): ReaderHeading | null {
  if (headings.length === 0) {
    return null;
  }

  const targetOffsetY = Math.max(0, scrollOffsetY + ACTIVE_HEADING_SCROLL_OFFSET);
  let topHeading: ReaderHeading | null = null;
  let activeHeading: ReaderHeading | null = null;

  for (const heading of headings) {
    if (heading.blockIndex === TITLE_TOC_BLOCK_INDEX) {
      topHeading = heading;
      continue;
    }

    const blockOffsetY = blockOffsets[heading.blockIndex];
    if (typeof blockOffsetY !== "number") {
      continue;
    }

    if (blockOffsetY <= targetOffsetY) {
      activeHeading = heading;
      continue;
    }

    break;
  }

  return activeHeading ?? topHeading;
}
