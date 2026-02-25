import type { MixedStyleDeclaration, MixedStyleRecord } from "react-native-render-html";

import {
  getMarkdownTextSizeScale,
  type MarkdownTextSizeLevel,
} from "@/shared/themes/markdownTextSize";
import type { Theme } from "@/shared/themes/themes";

type ReaderHtmlStyles = {
  baseStyle: MixedStyleDeclaration;
  tagsStyles: MixedStyleRecord;
  classesStyles: MixedStyleRecord;
};

const MIN_FONT_SIZE = 12;
const MIN_LINE_HEIGHT = 16;

function scaleTypographyValue(value: number, scale: number, minimum: number): number {
  return Math.max(minimum, Math.round(value * scale));
}

export function createReaderHtmlStyles(
  theme: Theme,
  markdownTextSizeLevel: MarkdownTextSizeLevel,
): ReaderHtmlStyles {
  const typographyScale = getMarkdownTextSizeScale(markdownTextSizeLevel);
  const scaleFontSize = (fontSize: number) =>
    scaleTypographyValue(fontSize, typographyScale, MIN_FONT_SIZE);
  const scaleLineHeight = (lineHeight: number) =>
    scaleTypographyValue(lineHeight, typographyScale, MIN_LINE_HEIGHT);
  const syntaxColors = theme.isDark
    ? {
        keyword: "#C792EA",
        string: "#C3E88D",
        number: "#F78C6C",
        type: "#82AAFF",
        function: "#82AAFF",
        variable: "#F07178",
        attr: "#FFCB6B",
        comment: "#7A8CA5",
        meta: "#89DDFF",
      }
    : {
        keyword: "#7C3AED",
        string: "#0F766E",
        number: "#C2410C",
        type: "#1D4ED8",
        function: "#2563EB",
        variable: "#BE123C",
        attr: "#B45309",
        comment: "#64748B",
        meta: "#0369A1",
      };

  const baseHeadingStyle = (level: 1 | 2 | 3 | 4 | 5 | 6, weight: "900" | "800" | "700") => ({
    color: level <= 1 ? theme.colors.headingPrimary : theme.colors.headingSecondary,
    fontFamily: "sans-serif",
    fontSize: scaleFontSize(theme.typography.headingSizes[level]),
    lineHeight: scaleLineHeight(theme.typography.headingLineHeights[level]),
    fontWeight: weight,
    letterSpacing: level === 1 ? -0.6 : level === 2 ? -0.2 : 0,
    marginTop: level <= 2 ? 32 : level <= 3 ? 24 : level <= 4 ? 20 : 18,
    marginBottom: level <= 2 ? (level === 1 ? 24 : 6) : level <= 3 ? 12 : 8,
  });
  const tableCellStyle = {
    flexGrow: 0,
    flexShrink: 0,
    width: 220,
    minWidth: 220,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderColor: theme.colors.surfaceBorder,
    borderWidth: 1,
  };
  const inlineCodeLikeStyle = {
    backgroundColor: theme.colors.inlineCodeBackground,
    color: theme.colors.inlineCodeText,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: "monospace",
    fontWeight: "500" as const,
  };
  const blockCodeLikeStyle = {
    backgroundColor: theme.colors.codeBackground,
    borderColor: theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: theme.radii.code,
    alignSelf: "flex-start" as const,
    minWidth: "100%",
    paddingHorizontal: 14,
    paddingVertical: 12,
  };
  const createMonospaceBlockContentStyle = (fontSize: number, lineHeight: number) => ({
    color: theme.colors.codeText,
    fontFamily: "monospace",
    fontSize,
    lineHeight,
    whiteSpace: "pre" as const,
  });

  return {
    baseStyle: {
      color: theme.colors.textSecondary,
      fontFamily: "sans-serif",
      fontSize: scaleFontSize(theme.typography.bodySize),
      lineHeight: scaleLineHeight(theme.typography.bodyLineHeight),
    },
    tagsStyles: {
      p: {
        marginTop: 0,
        marginBottom: theme.spacing.blockGap,
      },
      h1: baseHeadingStyle(1, "900"),
      h2: baseHeadingStyle(2, "800"),
      h3: baseHeadingStyle(3, "800"),
      h4: baseHeadingStyle(4, "700"),
      h5: baseHeadingStyle(5, "700"),
      h6: baseHeadingStyle(6, "700"),
      blockquote: {
        color: theme.colors.quoteText,
        borderLeftColor: theme.colors.quoteBorder,
        backgroundColor: theme.colors.quoteBackground,
        borderLeftWidth: 4,
        borderTopLeftRadius: theme.radii.quote,
        borderBottomLeftRadius: theme.radii.quote,
        borderTopRightRadius: theme.radii.quote,
        borderBottomRightRadius: theme.radii.quote,
        fontStyle: "italic",
        fontFamily: "sans-serif",
        fontSize: scaleFontSize(theme.typography.quoteSize),
        lineHeight: scaleLineHeight(theme.typography.quoteLineHeight),
        paddingLeft: 20,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: 0,
        marginBottom: theme.spacing.blockGap,
      },
      pre: {
        marginTop: 0,
        marginBottom: theme.spacing.blockGap,
      },
      code: {
        fontFamily: "monospace",
        color: theme.colors.codeText,
        backgroundColor: "transparent",
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
      a: {
        color: theme.colors.link,
        textDecorationLine: "underline",
      },
      strong: {
        color: theme.colors.headingSecondary,
        fontWeight: "700",
      },
      em: {
        color: theme.colors.accentSecondary,
        fontStyle: "italic",
      },
      i: {
        color: theme.colors.accentSecondary,
        fontStyle: "italic",
      },
      ul: {
        marginTop: 0,
        marginBottom: theme.spacing.blockGap,
        paddingLeft: 24,
      },
      ol: {
        marginTop: 0,
        marginBottom: theme.spacing.blockGap,
        paddingLeft: 24,
      },
      li: {
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.listGap + 2,
        lineHeight: scaleLineHeight(theme.typography.bodyLineHeight),
      },
      hr: {
        borderTopColor: theme.colors.divider,
        borderTopWidth: 1,
        marginTop: 8,
        marginBottom: 32,
      },
      img: {
        borderColor: theme.colors.surfaceBorder,
        borderWidth: 1,
        borderRadius: theme.radii.code,
        marginTop: 4,
        marginBottom: theme.spacing.blockGap,
      },
      figure: {
        marginTop: 0,
        marginBottom: theme.spacing.blockGap,
      },
      figcaption: {
        color: theme.colors.textMuted,
        fontFamily: "sans-serif",
        fontSize: scaleFontSize(13),
        lineHeight: scaleLineHeight(18),
        textAlign: "center",
        marginTop: 8,
      },
      table: {
        backgroundColor: theme.colors.tableBackground,
        borderColor: theme.colors.surfaceBorder,
        borderWidth: 1,
        borderRadius: theme.radii.code,
        alignSelf: "flex-start",
        minWidth: "100%",
        marginTop: 0,
        marginBottom: theme.spacing.blockGap,
      },
      tr: {
        flexDirection: "row",
        flexWrap: "nowrap",
      },
      th: {
        ...tableCellStyle,
        backgroundColor: theme.colors.tableHeaderBackground,
        color: theme.colors.tableHeaderText,
        fontSize: scaleFontSize(14),
        fontWeight: "600",
      },
      td: {
        ...tableCellStyle,
        color: theme.colors.tableCellText,
        fontSize: scaleFontSize(14),
      },
    },
    classesStyles: {
      "inline-accent": {
        ...inlineCodeLikeStyle,
      },
      "code-block": {
        ...blockCodeLikeStyle,
      },
      "code-block-content": {
        ...createMonospaceBlockContentStyle(
          scaleFontSize(theme.typography.bodySize - 2),
          scaleLineHeight(theme.typography.bodyLineHeight - 1),
        ),
      },
      hljs: {
        color: theme.colors.codeText,
      },
      "hljs-keyword": {
        color: syntaxColors.keyword,
      },
      "hljs-selector-tag": {
        color: syntaxColors.keyword,
      },
      "hljs-literal": {
        color: syntaxColors.keyword,
      },
      "hljs-built_in": {
        color: syntaxColors.type,
      },
      "hljs-type": {
        color: syntaxColors.type,
      },
      "hljs-title": {
        color: syntaxColors.function,
      },
      function_: {
        color: syntaxColors.function,
      },
      class_: {
        color: syntaxColors.type,
      },
      "hljs-params": {
        color: theme.colors.codeText,
      },
      "hljs-string": {
        color: syntaxColors.string,
      },
      "hljs-number": {
        color: syntaxColors.number,
      },
      "hljs-symbol": {
        color: syntaxColors.number,
      },
      "hljs-bullet": {
        color: syntaxColors.number,
      },
      "hljs-variable": {
        color: syntaxColors.variable,
      },
      "hljs-template-variable": {
        color: syntaxColors.variable,
      },
      "hljs-attr": {
        color: syntaxColors.attr,
      },
      "hljs-attribute": {
        color: syntaxColors.attr,
      },
      "hljs-link": {
        color: syntaxColors.meta,
      },
      "hljs-meta": {
        color: syntaxColors.meta,
      },
      "hljs-comment": {
        color: syntaxColors.comment,
        fontStyle: "italic",
      },
      "hljs-quote": {
        color: syntaxColors.comment,
        fontStyle: "italic",
      },
      "hljs-addition": {
        color: syntaxColors.string,
      },
      "hljs-deletion": {
        color: syntaxColors.variable,
      },
      "hljs-subst": {
        color: theme.colors.codeText,
      },
      "hljs-emphasis": {
        fontStyle: "italic",
      },
      "hljs-strong": {
        fontWeight: "700",
      },
      "math-inline": {
        ...inlineCodeLikeStyle,
      },
      "math-block": {
        ...blockCodeLikeStyle,
      },
      "math-block-content": {
        ...createMonospaceBlockContentStyle(
          scaleFontSize(theme.typography.bodySize - 1),
          scaleLineHeight(theme.typography.bodyLineHeight),
        ),
      },
      "reader-h2-accent-bar": {
        width: 56,
        height: 3,
        borderRadius: 4,
        backgroundColor: theme.colors.accent,
        marginTop: 2,
        marginBottom: 16,
      },
      "reader-h3-after-h2": {
        color: theme.colors.headingPrimary,
        fontFamily: "sans-serif",
        fontSize: scaleFontSize(theme.typography.headingSizes[1]),
        lineHeight: scaleLineHeight(theme.typography.headingLineHeights[1]),
        fontWeight: "900",
        letterSpacing: -0.6,
        marginTop: 0,
        marginBottom: 16,
      },
      "reader-blockquote-paragraph": {
        marginTop: 0,
        marginBottom: 0,
      },
    },
  };
}
