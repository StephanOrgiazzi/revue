import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ActionDialog } from "@/shared/ui/ActionDialog";

const mockTriggerLightImpactHaptic = jest.fn();

jest.mock("@/shared/logic/haptics", () => ({
  triggerLightImpactHaptic: () => mockTriggerLightImpactHaptic(),
}));

jest.mock("@/shared/themes/useThemePreferences", () => ({
  useThemePreferences: () => ({
    theme: require("@/shared/themes/definitions/lightTheme").lightTheme,
  }),
}));

describe("ActionDialog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockTriggerLightImpactHaptic.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders content and executes default action with haptic feedback", () => {
    const onClose = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = render(
      <ActionDialog
        visible
        title="Delete article"
        message="This cannot be undone."
        onClose={onClose}
        actions={[
          { label: "Delete", style: "destructive", onPress: onDelete },
          { label: "Cancel", style: "cancel" },
        ]}
      />,
    );

    fireEvent.press(getByText("Delete"));

    expect(getByText("Delete article")).toBeTruthy();
    expect(getByText("This cannot be undone.")).toBeTruthy();
    expect(mockTriggerLightImpactHaptic).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not trigger haptic feedback for cancel action", () => {
    const onClose = jest.fn();
    const onCancel = jest.fn();
    const { getByText, queryByText } = render(
      <ActionDialog
        visible
        title="Exit reader"
        onClose={onClose}
        actions={[{ label: "Cancel", style: "cancel", onPress: onCancel }]}
      />,
    );

    expect(queryByText("This cannot be undone.")).toBeNull();
    fireEvent.press(getByText("Cancel"));

    expect(mockTriggerLightImpactHaptic).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(100);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
