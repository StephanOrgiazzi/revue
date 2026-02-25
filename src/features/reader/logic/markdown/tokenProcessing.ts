import type { Token, Tokens } from "marked";

import {
  READER_H3_AFTER_H2_CLASS_NAME,
  TOKEN_TYPE_SPACE,
} from "@/features/reader/logic/markdown/constants";
import type { ReaderHeadingRenderToken } from "@/features/reader/logic/markdown/types";

export function isHeadingBlockToken(token: Token | undefined): token is Tokens.Heading {
  return token?.type === "heading";
}

export function removeTitleDuplicateHeading(tokens: Token[], articleTitle?: string): void {
  if (!articleTitle) {
    return;
  }

  const firstHeadingTokenIndex = tokens.findIndex((token) => isHeadingBlockToken(token));
  if (firstHeadingTokenIndex < 0) {
    return;
  }

  const firstHeadingToken = tokens[firstHeadingTokenIndex];
  if (
    !isHeadingBlockToken(firstHeadingToken) ||
    firstHeadingToken.text.trim() !== articleTitle.trim()
  ) {
    return;
  }

  tokens.splice(firstHeadingTokenIndex, 1);
}

export function annotateHeadingTokensWithRenderClasses(tokens: Token[]): void {
  let previousNonWhitespaceToken: Token | undefined;

  for (const token of tokens) {
    if (isHeadingBlockToken(token)) {
      const headingToken = token as ReaderHeadingRenderToken;

      if (
        token.depth === 3 &&
        isHeadingBlockToken(previousNonWhitespaceToken) &&
        previousNonWhitespaceToken.depth === 2
      ) {
        headingToken.readerClassNames = [READER_H3_AFTER_H2_CLASS_NAME];
      } else {
        delete headingToken.readerClassNames;
      }
    }

    if (token.type !== TOKEN_TYPE_SPACE) {
      previousNonWhitespaceToken = token;
    }
  }
}
