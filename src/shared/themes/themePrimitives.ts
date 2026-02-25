export const THEME_IDS = ["light", "midnight", "paper", "velvet", "pure-dark"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

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

type ThemeColorPalette = {
  pageBackground: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  heading: string;
  accent: string;
  error: string;
  accentSecondary?: string;
  surfaceMuted?: string;
  overlay?: string;
};

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

export type ThemeOption = {
  id: ThemeId;
  label: string;
  swatchColor: string;
};

const BASE_THEME_TYPOGRAPHY: Theme["typography"] = {
  titleSize: 36,
  titleLineHeight: 40,
  bodySize: 18,
  bodyLineHeight: 29,
  quoteSize: 18,
  quoteLineHeight: 29,
  headingSizes: {
    1: 36,
    2: 24,
    3: 20,
    4: 18,
    5: 16,
    6: 14,
  },
  headingLineHeights: {
    1: 40,
    2: 30,
    3: 28,
    4: 24,
    5: 22,
    6: 20,
  },
};

const BASE_THEME_SPACING: Theme["spacing"] = {
  pagePaddingHorizontal: 16,
  pagePaddingVertical: 16,
  blockGap: 24,
  listGap: 12,
};

export const BASE_THEME_RADII: Theme["radii"] = {
  quote: 4,
  code: 4,
};

type CreateThemeInput = {
  id: ThemeId;
  isDark: boolean;
  palette: ThemeColorPalette;
  colors?: Partial<ThemeColors>;
  radii?: Theme["radii"];
  spacing?: Theme["spacing"];
  typography?: Theme["typography"];
};

function buildThemeColors(
  palette: ThemeColorPalette,
  isDark: boolean,
  colorOverrides: Partial<ThemeColors> = {},
): ThemeColors {
  const surfaceMuted = palette.surfaceMuted ?? palette.surface;
  const accentSecondary = palette.accentSecondary ?? palette.accent;

  return {
    pageBackground: palette.pageBackground,
    surfaceBorder: palette.border,
    divider: palette.border,
    accent: palette.accent,
    accentSecondary,
    textPrimary: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,
    headingPrimary: palette.heading,
    headingSecondary: palette.heading,
    quoteText: palette.textSecondary,
    quoteBorder: palette.accent,
    quoteBackground: surfaceMuted,
    codeText: palette.textPrimary,
    codeBackground: palette.surface,
    inlineCodeText: accentSecondary,
    inlineCodeBackground: surfaceMuted,
    link: accentSecondary,
    listMarker: palette.accent,
    tableBackground: surfaceMuted,
    tableHeaderBackground: palette.surface,
    tableHeaderText: palette.heading,
    tableCellText: palette.textSecondary,
    error: palette.error,
    fabBackground: isDark ? palette.textPrimary : palette.surface,
    fabIcon: isDark ? palette.pageBackground : palette.textPrimary,
    fabShadow: "#00000033",
    sheetBackground: palette.surface,
    sheetHandle: palette.border,
    sheetBackdrop: palette.overlay ?? (isDark ? "#000000BF" : "#10182752"),
    tocItemActiveBackground: surfaceMuted,
    themeOptionBorder: palette.border,
    themeOptionSelectedBorder: palette.accent,
    ...colorOverrides,
  };
}

export function createTheme({
  id,
  isDark,
  palette,
  colors,
  radii = BASE_THEME_RADII,
  spacing = BASE_THEME_SPACING,
  typography = BASE_THEME_TYPOGRAPHY,
}: CreateThemeInput): Theme {
  return {
    id,
    isDark,
    colors: buildThemeColors(palette, isDark, colors),
    radii,
    spacing,
    typography,
  };
}
