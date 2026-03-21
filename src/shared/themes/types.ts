export const THEME_IDS = ["light", "midnight", "paper", "velvet", "pure-dark"] as const;

export type Theme = {
  id: ThemeId;
  isDark: boolean;
  colors: ThemeColors;
  radii: {
    quote: number;
    code: number;
  };
  spacing: {
    pagePaddingHorizontal: number;
    pagePaddingVertical: number;
    blockGap: number;
    listGap: number;
  };
  typography: ThemeTypography;
};

export type ThemeColors = {
  pageBackground: string;
  surfaceBorder: string;
  divider: string;
  accent: string;
  accentSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  headingPrimary: string;
  headingSecondary: string;
  quoteText: string;
  quoteBorder: string;
  quoteBackground: string;
  codeText: string;
  codeBackground: string;
  inlineCodeText: string;
  inlineCodeBackground: string;
  link: string;
  listMarker: string;
  tableBackground: string;
  tableHeaderBackground: string;
  tableHeaderText: string;
  tableCellText: string;
  error: string;
  fabBackground: string;
  fabIcon: string;
  fabShadow: string;
  sheetBackground: string;
  sheetHandle: string;
  sheetBackdrop: string;
  tocItemActiveBackground: string;
  themeOptionBorder: string;
  themeOptionSelectedBorder: string;
};

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeOption = {
  id: ThemeId;
  label: string;
  swatchColor: string;
};

export type ThemeTypography = {
  titleSize: number;
  titleLineHeight: number;
  bodySize: number;
  bodyLineHeight: number;
  quoteSize: number;
  quoteLineHeight: number;
  headingSizes: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  headingLineHeights: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
};

export const MARKDOWN_TEXT_SIZE_LEVELS = [1, 2, 3, 4, 5] as const;

export type MarkdownTextSizeLevel = (typeof MARKDOWN_TEXT_SIZE_LEVELS)[number];
