import { createReaderHtmlStyles } from "@/features/reader/logic/readerHtmlStyles";
import { getMarkdownTextSizeScale } from "@/shared/themes/markdownTextSize";
import { getTheme } from "@/shared/themes/themes";

describe("createReaderHtmlStyles", () => {
  it("scales typography from markdown text size level", () => {
    const theme = getTheme("light");
    const smallStyles = createReaderHtmlStyles(theme, 1);
    const largeStyles = createReaderHtmlStyles(theme, 5);

    const smallScale = getMarkdownTextSizeScale(1);
    const largeScale = getMarkdownTextSizeScale(5);
    const expectedSmallBaseFont = Math.max(12, Math.round(theme.typography.bodySize * smallScale));
    const expectedLargeBaseFont = Math.max(12, Math.round(theme.typography.bodySize * largeScale));

    expect(smallStyles.baseStyle.fontSize).toBe(expectedSmallBaseFont);
    expect(largeStyles.baseStyle.fontSize).toBe(expectedLargeBaseFont);
    expect((largeStyles.tagsStyles.h1 as { fontSize: number }).fontSize).toBeGreaterThan(
      (smallStyles.tagsStyles.h1 as { fontSize: number }).fontSize,
    );
  });

  it("enforces minimum readable typography values", () => {
    const baseTheme = getTheme("paper");
    const tinyTheme = {
      ...baseTheme,
      typography: {
        ...baseTheme.typography,
        bodySize: 1,
        bodyLineHeight: 1,
        quoteSize: 1,
        quoteLineHeight: 1,
        headingSizes: {
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1,
          6: 1,
        },
        headingLineHeights: {
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1,
          6: 1,
        },
      },
    };
    const styles = createReaderHtmlStyles(tinyTheme, 1);

    expect(styles.baseStyle.fontSize).toBe(12);
    expect(styles.baseStyle.lineHeight).toBe(16);
    expect((styles.tagsStyles.h1 as { fontSize: number; lineHeight: number }).fontSize).toBe(12);
    expect((styles.tagsStyles.h1 as { fontSize: number; lineHeight: number }).lineHeight).toBe(16);
  });
});
