import type { MarkedExtension, Token } from "marked";

import {
  READER_MATH_BLOCK_CLASS_NAME,
  READER_MATH_BLOCK_CONTENT_CLASS_NAME,
  READER_MATH_BLOCK_TOKEN_TYPE,
  READER_MATH_INLINE_CLASS_NAME,
  READER_MATH_INLINE_TOKEN_TYPE,
} from "@/features/reader/logic/markdown/constants";
import {
  escapeHtml,
  normalizeMathExpression,
} from "@/features/reader/logic/markdown/markdownUtils";
import type { ReaderMathToken } from "@/features/reader/logic/markdown/types";

const READER_MATH_EM_STRONG_MASK_REGEX =
  /(?:\$\$[\s\S]+?\$\$)|(?:\\\[[\s\S]+?\\\])|(?:\\\([\s\S]+?\\\))|(?:\$[^\n$]+?\$)/g;
const READER_MATH_BLOCK_DOLLAR_MULTILINE_REGEX = /^\$\$[ \t]*\n([\s\S]+?)\n\$\$[ \t]*(?:\n+|$)/;
const READER_MATH_BLOCK_DOLLAR_SINGLE_LINE_REGEX = /^\$\$([^\n]+?)\$\$[ \t]*(?:\n+|$)/;
const READER_MATH_BLOCK_BRACKET_REGEX = /^\\\[[ \t]*\n?([\s\S]+?)\n?\\\][ \t]*(?:\n+|$)/;
const READER_MATH_INLINE_PAREN_REGEX = /^\\\(([\s\S]+?)\\\)/;
const READER_MATH_BLOCK_START_REGEX = /(?:^|\n)(?:\$\$|\\\[)/;
const READER_MATH_INLINE_START_REGEX = /(?:\$|\\\()/;

type InlineDollarMathExpressionMatch = {
  raw: string;
  expression: string;
};

type ReaderMathTokenType = ReaderMathToken["type"];

function isEscapedCharacter(source: string, index: number): boolean {
  let slashCount = 0;
  for (
    let characterIndex = index - 1;
    characterIndex >= 0 && source[characterIndex] === "\\";
    characterIndex -= 1
  ) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function extractInlineDollarMathExpression(src: string): InlineDollarMathExpressionMatch | null {
  if (!src.startsWith("$") || src.startsWith("$$")) {
    return null;
  }

  if (!src[1] || /\s/.test(src[1])) {
    return null;
  }

  for (let characterIndex = 1; characterIndex < src.length; characterIndex += 1) {
    const character = src[characterIndex];
    if (character === "\n") {
      return null;
    }
    if (character !== "$" || isEscapedCharacter(src, characterIndex)) {
      continue;
    }

    const expression = src.slice(1, characterIndex);
    if (!expression.trim() || /\s$/.test(expression)) {
      return null;
    }
    if (src[characterIndex + 1] === "$") {
      return null;
    }

    return {
      raw: src.slice(0, characterIndex + 1),
      expression,
    };
  }

  return null;
}

function buildMathToken(
  type: ReaderMathTokenType,
  raw: string,
  expression: string,
): ReaderMathToken | undefined {
  if (!expression) {
    return;
  }

  return {
    type,
    raw,
    expression,
  };
}

function isReaderMathToken(token: Token): token is ReaderMathToken {
  return (
    (token.type === READER_MATH_BLOCK_TOKEN_TYPE || token.type === READER_MATH_INLINE_TOKEN_TYPE) &&
    typeof (token as ReaderMathToken).expression === "string"
  );
}

function renderMathToken(token: Token, isBlock: boolean): string {
  if (!isReaderMathToken(token)) {
    return "";
  }

  const escapedExpression = escapeHtml(token.expression);
  if (isBlock) {
    return `<pre class="${READER_MATH_BLOCK_CLASS_NAME}"><code class="${READER_MATH_BLOCK_CONTENT_CLASS_NAME}">${escapedExpression}</code></pre>\n`;
  }

  return `<code class="${READER_MATH_INLINE_CLASS_NAME}">${escapedExpression}</code>`;
}

export const READER_MATH_MARKED_EXTENSION = {
  extensions: [
    {
      name: READER_MATH_BLOCK_TOKEN_TYPE,
      level: "block",
      start(src) {
        const match = READER_MATH_BLOCK_START_REGEX.exec(src);
        return match?.index;
      },
      tokenizer(src) {
        const blockMathMatch =
          src.match(READER_MATH_BLOCK_DOLLAR_MULTILINE_REGEX) ??
          src.match(READER_MATH_BLOCK_DOLLAR_SINGLE_LINE_REGEX) ??
          src.match(READER_MATH_BLOCK_BRACKET_REGEX);
        if (!blockMathMatch) {
          return;
        }

        return buildMathToken(
          READER_MATH_BLOCK_TOKEN_TYPE,
          blockMathMatch[0],
          normalizeMathExpression(blockMathMatch[1]),
        );
      },
      renderer(token) {
        return renderMathToken(token, true);
      },
    },
    {
      name: READER_MATH_INLINE_TOKEN_TYPE,
      level: "inline",
      start(src) {
        const match = READER_MATH_INLINE_START_REGEX.exec(src);
        return match?.index;
      },
      tokenizer(src) {
        if (src.startsWith("\\(")) {
          const parenMathMatch = src.match(READER_MATH_INLINE_PAREN_REGEX);
          if (parenMathMatch) {
            return buildMathToken(
              READER_MATH_INLINE_TOKEN_TYPE,
              parenMathMatch[0],
              normalizeMathExpression(parenMathMatch[1]),
            );
          }
        }

        const inlineDollarMath = extractInlineDollarMathExpression(src);
        if (!inlineDollarMath) {
          return;
        }

        return buildMathToken(
          READER_MATH_INLINE_TOKEN_TYPE,
          inlineDollarMath.raw,
          normalizeMathExpression(inlineDollarMath.expression),
        );
      },
      renderer(token) {
        return renderMathToken(token, false);
      },
    },
  ],
  hooks: {
    emStrongMask(src) {
      return src.replace(READER_MATH_EM_STRONG_MASK_REGEX, (match) => match.replace(/[^\n]/g, "a"));
    },
  },
} satisfies MarkedExtension;
