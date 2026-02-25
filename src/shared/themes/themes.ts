import { lightTheme } from "@/shared/themes/definitions/lightTheme";
import { midnightTheme } from "@/shared/themes/definitions/midnightTheme";
import { paperTheme } from "@/shared/themes/definitions/paperTheme";
import { pureDarkTheme } from "@/shared/themes/definitions/pureDarkTheme";
import { velvetTheme } from "@/shared/themes/definitions/velvetTheme";
import {
  THEME_IDS,
  type Theme,
  type ThemeId,
  type ThemeOption,
} from "@/shared/themes/themePrimitives";

const THEME_LABELS: Record<ThemeId, string> = {
  light: "Light",
  midnight: "Midnight",
  paper: "Paper",
  velvet: "Velvet",
  "pure-dark": "Pure Dark",
};

const themeDefinitions: Record<ThemeId, Theme> = {
  light: lightTheme,
  midnight: midnightTheme,
  paper: paperTheme,
  velvet: velvetTheme,
  "pure-dark": pureDarkTheme,
};

export const THEME_OPTIONS: readonly ThemeOption[] = THEME_IDS.map((id) => ({
  id,
  label: THEME_LABELS[id],
  swatchColor: themeDefinitions[id].colors.pageBackground,
}));

export const DEFAULT_THEME_ID: ThemeId = "light";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(themeDefinitions, value);
}

export function getTheme(themeId: ThemeId = DEFAULT_THEME_ID): Theme {
  return themeDefinitions[themeId];
}

export type { Theme, ThemeId, ThemeOption } from "@/shared/themes/themePrimitives";
