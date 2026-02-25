import type { Token } from "marked";

import {
  READER_MATH_BLOCK_TOKEN_TYPE,
  READER_MATH_INLINE_TOKEN_TYPE,
} from "@/features/reader/logic/markdown/constants";

export type ReaderHeading = {
  slug: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  blockIndex: number;
};

export type ReaderHtmlBlocksResult = {
  htmlBlocks: string[];
  headings: ReaderHeading[];
};

export type ReaderHeadingRenderToken = Token & {
  readerClassNames?: string[];
};

export type ReaderMathToken = Token & {
  type: typeof READER_MATH_BLOCK_TOKEN_TYPE | typeof READER_MATH_INLINE_TOKEN_TYPE;
  expression: string;
};
