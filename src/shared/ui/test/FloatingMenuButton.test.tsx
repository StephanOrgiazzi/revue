import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { Animated } from "react-native";

import { FloatingMenuButton } from "@/shared/ui/FloatingMenuButton";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

describe("FloatingMenuButton", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("runs entrance/visibility animations and handles presses", () => {
    const springMock = jest.spyOn(Animated, "spring");
    const timingMock = jest.spyOn(Animated, "timing");
    const addMock = jest.spyOn(Animated, "add");
    const onPress = jest.fn();

    const { getByRole, rerender } = render(
      <FloatingMenuButton bottomOffset={24} theme={lightTheme} onPress={onPress} visible />,
    );
    const button = getByRole("button");

    fireEvent(button, "pressIn");
    fireEvent(button, "pressOut");
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(springMock).toHaveBeenCalled();
    expect(timingMock).toHaveBeenCalled();
    expect(addMock).toHaveBeenCalled();

    rerender(
      <FloatingMenuButton bottomOffset={24} theme={lightTheme} onPress={onPress} visible={false} />,
    );
    expect(timingMock).toHaveBeenCalledTimes(2);
  });
});
