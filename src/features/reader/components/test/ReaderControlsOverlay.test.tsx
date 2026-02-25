import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ReaderControlsOverlay } from "@/features/reader/components/ReaderControlsOverlay";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

const mockOpen = jest.fn();
const mockClose = jest.fn();
const mockControlsSheet = jest.fn();
let mockIsOpen = false;

jest.mock("@/shared/logic/useDisclosure", () => ({
  useDisclosure: () => ({
    isOpen: mockIsOpen,
    open: mockOpen,
    close: mockClose,
  }),
}));

jest.mock("@/shared/ui/FloatingMenuButton", () => ({
  FloatingMenuButton: ({ onPress, visible }: any) => {
    const { Text } = require("react-native");
    return (
      <>
        <Text>{visible ? "Floating Button Visible" : "Floating Button Hidden"}</Text>
        <Text onPress={onPress}>Open Controls</Text>
      </>
    );
  },
}));

jest.mock("@/shared/ui/ControlsSheet", () => ({
  ControlsSheet: (props: any) => {
    const { Text } = require("react-native");
    mockControlsSheet(props);
    return (
      <>
        <Text>{props.visible ? "Controls Visible" : "Controls Hidden"}</Text>
        <Text onPress={props.onClose}>Close Controls</Text>
      </>
    );
  },
}));

describe("ReaderControlsOverlay", () => {
  beforeEach(() => {
    mockIsOpen = false;
    mockOpen.mockClear();
    mockClose.mockClear();
    mockControlsSheet.mockClear();
  });

  it("opens controls from floating button and forwards sheet props", () => {
    const onSelectTheme = jest.fn();
    const onSelectMarkdownTextSizeLevel = jest.fn();
    const onSelectHeading = jest.fn();
    const onExitReader = jest.fn();
    const { getByText } = render(
      <ReaderControlsOverlay
        isFloatingMenuVisible
        floatingMenuBottomOffset={28}
        theme={lightTheme}
        themeOptions={[]}
        activeThemeId="light"
        onSelectTheme={onSelectTheme}
        activeMarkdownTextSizeLevel={3}
        onSelectMarkdownTextSizeLevel={onSelectMarkdownTextSizeLevel}
        headings={[]}
        activeHeadingSlug={null}
        onSelectHeading={onSelectHeading}
        onExitReader={onExitReader}
      />,
    );

    expect(getByText("Floating Button Visible")).toBeVisible();
    expect(getByText("Controls Hidden")).toBeVisible();
    fireEvent.press(getByText("Open Controls"));

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockControlsSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: false,
        showMarkdownTextSizeSelection: true,
        activeThemeId: "light",
        activeMarkdownTextSizeLevel: 3,
        onSelectTheme,
        onSelectMarkdownTextSizeLevel,
        onSelectHeading,
        onExitReader,
      }),
    );
  });

  it("uses disclosure open state and closes via sheet callback", () => {
    mockIsOpen = true;
    const { getByText } = render(
      <ReaderControlsOverlay
        isFloatingMenuVisible={false}
        floatingMenuBottomOffset={16}
        theme={lightTheme}
        themeOptions={[]}
        activeThemeId="light"
        onSelectTheme={() => undefined}
        activeMarkdownTextSizeLevel={3}
        onSelectMarkdownTextSizeLevel={() => undefined}
        headings={[]}
        activeHeadingSlug={null}
        onSelectHeading={() => undefined}
        onExitReader={() => undefined}
      />,
    );

    expect(getByText("Floating Button Hidden")).toBeVisible();
    expect(getByText("Controls Visible")).toBeVisible();

    fireEvent.press(getByText("Close Controls"));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
