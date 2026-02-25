import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { ThemeSelectionSection } from "@/shared/ui/ThemeSelectionSection";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";
import { THEME_OPTIONS } from "@/shared/themes/themes";

describe("ThemeSelectionSection", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders all options, marks the active one, and selects another theme", () => {
    jest.spyOn(ReactNative, "useWindowDimensions").mockReturnValue({
      width: 420,
      height: 900,
      scale: 1,
      fontScale: 1,
    });
    const onSelectTheme = jest.fn();
    const { getAllByText, getByText } = render(
      <ThemeSelectionSection
        theme={lightTheme}
        themeOptions={THEME_OPTIONS}
        activeThemeId="light"
        onSelectTheme={onSelectTheme}
      />,
    );

    expect(getByText("Theme Selection")).toBeVisible();
    THEME_OPTIONS.forEach((option) => {
      expect(getByText(option.label)).toBeVisible();
    });
    expect(getAllByText("✓")).toHaveLength(1);
    expect(getByText("Light")).toHaveStyle({ color: lightTheme.colors.textPrimary });
    expect(getByText("Paper")).toHaveStyle({ color: lightTheme.colors.textMuted });

    fireEvent.press(getByText("Paper"));
    expect(onSelectTheme).toHaveBeenCalledTimes(1);
    expect(onSelectTheme).toHaveBeenCalledWith("paper");
  });
});
