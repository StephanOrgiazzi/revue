import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ControlsSheetHandle } from "@/shared/ui/ControlsSheet/ControlsSheetHandle";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

describe("ControlsSheetHandle", () => {
  it("shows exit card when enabled and handles press", () => {
    const onExitReaderPress = jest.fn();
    const { getByText } = render(
      <ControlsSheetHandle
        theme={lightTheme}
        sheetTitle="Navigation"
        canExitReader
        onExitReaderPress={onExitReaderPress}
      />,
    );

    fireEvent.press(getByText("Back to Library"));
    expect(onExitReaderPress).toHaveBeenCalledTimes(1);
    expect(getByText("Exit Reader")).toBeTruthy();
  });

  it("hides exit card when disabled", () => {
    const { queryByText } = render(
      <ControlsSheetHandle
        theme={lightTheme}
        sheetTitle="Settings"
        canExitReader={false}
        onExitReaderPress={() => undefined}
      />,
    );
    expect(queryByText("Back to Library")).toBeNull();
  });
});
