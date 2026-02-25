import { createTheme } from "@/shared/themes/themePrimitives";

export const paperTheme = createTheme({
  id: "paper",
  isDark: false,
  palette: {
    pageBackground: "#FCFAF2",
    surface: "#F4F1E1",
    border: "#E0DAC1",
    textPrimary: "#3C3836",
    textSecondary: "#504945",
    textMuted: "#7C6F64",
    heading: "#282828",
    accent: "#8F3F2F",
    accentSecondary: "#427B58",
    error: "#9D0006",
    surfaceMuted: "#FBF1C7",
    overlay: "#28282833",
  },
  colors: {
    divider: "#EBDBB2",
    quoteBackground: "#F2E9C1",
    quoteBorder: "#8F3F2F",
    fabBackground: "#E0DAC1",
    fabIcon: "#3C3836",
    fabShadow: "#3C383633",
    sheetHandle: "#A89984",
    themeOptionSelectedBorder: "#8F3F2F",
  },
});
