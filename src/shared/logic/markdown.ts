type MarkdownFrontMatterExtraction = {
  frontMatter: string | null;
  content: string;
};

type ParsedMarkdownFrontMatter = {
  title?: string;
  tags?: string[];
};

type ParsedMarkdownDocument = {
  content: string;
  frontMatter: string | null;
  data: ParsedMarkdownFrontMatter;
};

const YAML_KEY_VALUE_PATTERN = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/;
const YAML_LIST_ITEM_PATTERN = /^-\s+(.+)$/;

function removeUtf8Bom(value: string): string {
  return value.startsWith("\uFEFF") ? value.slice(1) : value;
}

export function normalizeMarkdownLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function stripWrappingQuotes(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const firstChar = value[0];
  const lastChar = value[value.length - 1];
  if ((firstChar === "'" && lastChar === "'") || (firstChar === '"' && lastChar === '"')) {
    return value.slice(1, -1);
  }

  return value;
}

function parseInlineTags(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((tag) => stripWrappingQuotes(tag.trim()))
      .filter(Boolean);
  }

  return [stripWrappingQuotes(trimmed)];
}

function parseYamlLikeKeyValue(line: string): {
  key: string;
  rawValue: string;
} | null {
  const match = line.match(YAML_KEY_VALUE_PATTERN);
  if (!match) {
    return null;
  }

  return {
    key: match[1],
    rawValue: match[2].trim(),
  };
}

export function extractMarkdownFrontMatter(markdown: string): MarkdownFrontMatterExtraction {
  const cleanedMarkdown = removeUtf8Bom(markdown);

  if (!cleanedMarkdown.startsWith("---\n") && !cleanedMarkdown.startsWith("---\r\n")) {
    return {
      frontMatter: null,
      content: cleanedMarkdown,
    };
  }

  const frontMatterStart = cleanedMarkdown.startsWith("---\r\n") ? 5 : 4;
  let cursor = frontMatterStart;

  while (cursor < cleanedMarkdown.length) {
    const nextLineBreakIndex = cleanedMarkdown.indexOf("\n", cursor);
    if (nextLineBreakIndex === -1) {
      return {
        frontMatter: null,
        content: cleanedMarkdown,
      };
    }

    const currentLine = cleanedMarkdown.slice(cursor, nextLineBreakIndex).replace(/\r$/, "").trim();
    if (currentLine === "---") {
      return {
        frontMatter: cleanedMarkdown.slice(frontMatterStart, cursor),
        content: cleanedMarkdown.slice(nextLineBreakIndex + 1),
      };
    }

    cursor = nextLineBreakIndex + 1;
  }

  return {
    frontMatter: null,
    content: cleanedMarkdown,
  };
}

function parseMarkdownFrontMatter(
  frontMatter: string | null | undefined,
): ParsedMarkdownFrontMatter {
  if (!frontMatter) {
    return {};
  }

  const lines = normalizeMarkdownLineEndings(frontMatter).split("\n");
  const hasYamlLikeKeyValue = lines.some((line) => parseYamlLikeKeyValue(line.trim()) !== null);
  if (!hasYamlLikeKeyValue) {
    return {};
  }

  const data: ParsedMarkdownFrontMatter = {};
  const bufferedTags: string[] = [];
  let readingTagList = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const listItemMatch = trimmedLine.match(YAML_LIST_ITEM_PATTERN);
    if (readingTagList && listItemMatch) {
      bufferedTags.push(stripWrappingQuotes(listItemMatch[1].trim()));
      continue;
    }

    const keyValue = parseYamlLikeKeyValue(trimmedLine);
    if (!keyValue) {
      readingTagList = false;
      continue;
    }

    const { key, rawValue } = keyValue;
    readingTagList = false;

    if (key === "title" && rawValue) {
      data.title = stripWrappingQuotes(rawValue);
      continue;
    }

    if (key === "tags") {
      if (!rawValue) {
        readingTagList = true;
        continue;
      }

      bufferedTags.push(...parseInlineTags(rawValue));
    }
  }

  if (bufferedTags.length > 0) {
    data.tags = bufferedTags;
  }

  return data;
}

export function parseMarkdownDocument(markdown: string): ParsedMarkdownDocument {
  const extracted = extractMarkdownFrontMatter(markdown);

  return {
    content: extracted.content,
    frontMatter: extracted.frontMatter,
    data: parseMarkdownFrontMatter(extracted.frontMatter),
  };
}
