import { Marked, Renderer, type MarkedOptions, type Token } from "marked";
import hljs from "highlight.js/lib/common";

import {
  READER_BLOCKQUOTE_PARAGRAPH_CLASS_NAME,
  READER_CODE_BLOCK_CLASS_NAME,
  READER_CODE_BLOCK_CONTENT_CLASS_NAME,
  READER_H2_AFTER_BAR_CLASS_NAME,
  READER_INLINE_CODE_CLASS_NAME,
} from "@/features/reader/logic/markdown/constants";
import {
  escapeHtml,
  normalizeCodeLanguageClassName,
  normalizeHeadingLevel,
} from "@/features/reader/logic/markdown/markdownUtils";
import { READER_MATH_MARKED_EXTENSION } from "@/features/reader/logic/markdown/mathExtension";
import type { ReaderHeadingRenderToken } from "@/features/reader/logic/markdown/types";

const READER_MARKDOWN_RENDERER = new Renderer();

function highlightCodeHtml(text: string, language: string): string {
  if (!text.trim()) {
    return escapeHtml(text);
  }

  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(text, {
        language,
        ignoreIllegals: true,
      }).value;
    }

    return hljs.highlightAuto(text).value;
  } catch {
    return escapeHtml(text);
  }
}

READER_MARKDOWN_RENDERER.heading = function ({ depth, tokens, ...token }) {
  const normalizedHeadingLevel = normalizeHeadingLevel(depth);
  const headingText = this.parser.parseInline(tokens);
  const headingClassNames = (token as ReaderHeadingRenderToken).readerClassNames ?? [];
  const headingClassAttribute =
    headingClassNames.length > 0 ? ` class="${headingClassNames.join(" ")}"` : "";
  const headingHtml = `<h${normalizedHeadingLevel}${headingClassAttribute}>${headingText}</h${normalizedHeadingLevel}>`;

  if (normalizedHeadingLevel === 2) {
    return `${headingHtml}\n<div class="${READER_H2_AFTER_BAR_CLASS_NAME}"></div>\n`;
  }

  return `${headingHtml}\n`;
};

READER_MARKDOWN_RENDERER.blockquote = function ({ tokens }) {
  const parsedBlockquoteHtml = this.parser
    .parse(tokens)
    .replace(/<p>/g, `<p class="${READER_BLOCKQUOTE_PARAGRAPH_CLASS_NAME}">`);

  return `<blockquote>${parsedBlockquoteHtml}</blockquote>\n`;
};

READER_MARKDOWN_RENDERER.code = function ({ text, lang }) {
  const normalizedLanguageClassName = normalizeCodeLanguageClassName(lang);
  const codeClassNames = [READER_CODE_BLOCK_CONTENT_CLASS_NAME, "hljs"];
  if (normalizedLanguageClassName) {
    codeClassNames.push(`language-${normalizedLanguageClassName}`);
  }
  const codeClassName = codeClassNames.join(" ");
  const highlightedCodeHtml = highlightCodeHtml(text, normalizedLanguageClassName);

  return `<pre class="${READER_CODE_BLOCK_CLASS_NAME}"><code class="${codeClassName}">${highlightedCodeHtml}</code></pre>\n`;
};

READER_MARKDOWN_RENDERER.codespan = function ({ text }) {
  return `<code class="${READER_INLINE_CODE_CLASS_NAME}">${escapeHtml(text)}</code>`;
};

READER_MARKDOWN_RENDERER.checkbox = function ({ checked }) {
  return checked ? "[x] " : "[ ] ";
};

const MARKDOWN_RENDER_OPTIONS = {
  gfm: true,
  breaks: false,
  renderer: READER_MARKDOWN_RENDERER,
} satisfies MarkedOptions;

const READER_MARKDOWN_INSTANCE = new Marked(MARKDOWN_RENDER_OPTIONS, READER_MATH_MARKED_EXTENSION);

export function lexReaderMarkdown(markdown: string): Token[] {
  return READER_MARKDOWN_INSTANCE.lexer(markdown);
}

export function renderReaderTokensToHtml(tokens: Token[]): string {
  return READER_MARKDOWN_INSTANCE.parser(tokens).trim();
}
