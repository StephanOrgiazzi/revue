import {
  READER_BLOCKQUOTE_PARAGRAPH_CLASS_NAME,
  READER_CODE_BLOCK_CLASS_NAME,
  READER_CODE_BLOCK_CONTENT_CLASS_NAME,
  READER_H2_AFTER_BAR_CLASS_NAME,
  READER_INLINE_CODE_CLASS_NAME,
} from "@/features/reader/logic/markdown/constants";
import {
  lexReaderMarkdown,
  renderReaderTokensToHtml,
} from "@/features/reader/logic/markdown/markedRenderer";

describe("markedRenderer", () => {
  it("renders heading accents, blockquote paragraphs, code, and task checkboxes", () => {
    const tokens = lexReaderMarkdown(
      [
        "## Heading",
        "",
        "> Quoted text",
        "",
        "`<inline>`",
        "",
        "```js",
        "const value = 1;",
        "```",
        "",
        "- [x] shipped",
        "- [ ] pending",
      ].join("\n"),
    );
    const html = renderReaderTokensToHtml(tokens);

    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain(`class="${READER_H2_AFTER_BAR_CLASS_NAME}"`);
    expect(html).toContain(`<p class="${READER_BLOCKQUOTE_PARAGRAPH_CLASS_NAME}">Quoted text</p>`);
    expect(html).toContain(`<code class="${READER_INLINE_CODE_CLASS_NAME}">&lt;inline&gt;</code>`);
    expect(html).toContain(
      `<pre class="${READER_CODE_BLOCK_CLASS_NAME}"><code class="${READER_CODE_BLOCK_CONTENT_CLASS_NAME} hljs language-js">`,
    );
    expect(html).toContain("[x] shipped");
    expect(html).toContain("[ ] pending");
  });

  it("sanitizes language names for code block CSS classes", () => {
    const tokens = lexReaderMarkdown("```TS++\nconst x = 1\n```");
    const html = renderReaderTokensToHtml(tokens);

    expect(html).toContain("language-ts");
  });
});
