import { createTheme } from "@/shared/themes/themePrimitives";

export const lightTheme = createTheme({
  id: "light",
  isDark: false,
  palette: {
    pageBackground: "#eef5fd",
    surface: "#EEF2F8",
    border: "#CED7E3",
    textPrimary: "#1D2739",
    textSecondary: "#30425E",
    textMuted: "#7986A0",
    heading: "#101A31",
    accent: "#FF8A1F",
    accentSecondary: "#6279F2",
    error: "#C2413A",
    surfaceMuted: "#F7F9FC",
    overlay: "#10182752",
  },
  colors: {
    divider: "#D8DFE9",
    quoteBackground: "#F2ECE3",
    fabBackground: "#D6DFEC",
    fabIcon: "#223149",
    fabShadow: "#2B344533",
    sheetHandle: "#B9C5D9",
    themeOptionSelectedBorder: "#1A2942",
  },
});
