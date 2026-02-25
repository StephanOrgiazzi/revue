import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ControlsSheet } from "@/shared/ui/ControlsSheet";
import { THEME_OPTIONS } from "@/shared/themes/themes";

const mockStartClose = jest.fn((action?: () => void) => action?.());
const mockOnClose = jest.fn();
const mockOnSelectHeading = jest.fn();
const mockOnSelectTheme = jest.fn();
const mockOnSelectMarkdownTextSizeLevel = jest.fn();
const mockOnExitReader = jest.fn();

jest.mock("@/shared/ui/ControlsSheet/useControlsSheetController", () => ({
  useControlsSheetController: ({ onClose }: any) => ({
    sheetRef: { current: null },
    handleSheetDismiss: onClose,
    startClose: mockStartClose,
  }),
}));

jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetBackdrop: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
  BottomSheetModal: ({ children, onDismiss, handleComponent, backdropComponent }: any) => {
    const { View, Text } = require("react-native");
    return (
      <View>
        <Text onPress={onDismiss}>Dismiss Sheet</Text>
        {handleComponent?.({})}
        {backdropComponent?.({ style: [] })}
        {children}
      </View>
    );
  },
  BottomSheetView: ({ children, onLayout }: any) => {
    const { View } = require("react-native");
    return <View onLayout={onLayout}>{children}</View>;
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureDetector: ({ children }: any) => <>{children}</>,
  Gesture: {
    Pan: () => {
      const chain: any = {
        enabled: () => chain,
        activeOffsetX: () => chain,
        failOffsetY: () => chain,
        onBegin: () => chain,
        onUpdate: () => chain,
        onEnd: () => chain,
      };
      return chain;
    },
  },
}));

jest.mock("react-native-reanimated", () => ({
  ...require("react-native-reanimated/mock"),
  useSharedValue: (value: number) => ({ value }),
  useAnimatedStyle: () => ({}),
  withTiming: (value: number) => value,
  runOnJS: (fn: (...args: any[]) => any) => fn,
}));

jest.mock("@/shared/ui/TableOfContentsSection", () => ({
  TableOfContentsSection: ({ onSelectHeading }: any) => {
    const { Text } = require("react-native");
    return (
      <Text
        onPress={() => onSelectHeading({ slug: "intro", text: "Intro", level: 1, blockIndex: 0 })}
      >
        TOC Section
      </Text>
    );
  },
}));

jest.mock("@/shared/ui/ThemeSelectionSection", () => ({
  ThemeSelectionSection: ({ onSelectTheme }: any) => {
    const { Text } = require("react-native");
    return <Text onPress={() => onSelectTheme("paper")}>Theme Section</Text>;
  },
}));

jest.mock("@/shared/ui/MarkdownTextSizeSection", () => ({
  MarkdownTextSizeSection: ({ onSelectMarkdownTextSizeLevel }: any) => {
    const { Text } = require("react-native");
    return <Text onPress={() => onSelectMarkdownTextSizeLevel(4)}>Size Section</Text>;
  },
}));

describe("ControlsSheet", () => {
  const theme = require("@/shared/themes/definitions/lightTheme").lightTheme;

  beforeEach(() => {
    mockStartClose.mockClear();
    mockOnClose.mockClear();
    mockOnSelectHeading.mockClear();
    mockOnSelectTheme.mockClear();
    mockOnSelectMarkdownTextSizeLevel.mockClear();
    mockOnExitReader.mockClear();
  });

  it("renders settings-only sheet and handles theme selection", () => {
    const { getByText } = render(
      <ControlsSheet
        visible
        theme={theme}
        showTableOfContents={false}
        themeOptions={THEME_OPTIONS}
        activeThemeId="light"
        onSelectTheme={mockOnSelectTheme}
        onClose={mockOnClose}
      />,
    );

    fireEvent.press(getByText("Theme Section"));
    fireEvent.press(getByText("Dismiss Sheet"));

    expect(mockStartClose).toHaveBeenCalled();
    expect(mockOnSelectTheme).toHaveBeenCalledWith("paper");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders reader controls and forwards heading action", () => {
    const { getByText } = render(
      <ControlsSheet
        visible
        theme={theme}
        showTableOfContents
        headings={[{ slug: "intro", text: "Intro", level: 1, blockIndex: 0 }]}
        activeHeadingSlug="intro"
        onSelectHeading={mockOnSelectHeading}
        onExitReader={mockOnExitReader}
        showMarkdownTextSizeSelection
        activeMarkdownTextSizeLevel={3}
        onSelectMarkdownTextSizeLevel={mockOnSelectMarkdownTextSizeLevel}
        themeOptions={THEME_OPTIONS}
        activeThemeId="light"
        onSelectTheme={mockOnSelectTheme}
        onClose={mockOnClose}
      />,
    );

    fireEvent.press(getByText("TOC Section"));

    expect(mockOnSelectHeading).toHaveBeenCalledWith(expect.objectContaining({ slug: "intro" }));
  });

  it("renders markdown size settings when enabled without toc", () => {
    const { getByText } = render(
      <ControlsSheet
        visible
        theme={theme}
        showTableOfContents={false}
        showMarkdownTextSizeSelection
        activeMarkdownTextSizeLevel={3}
        onSelectMarkdownTextSizeLevel={mockOnSelectMarkdownTextSizeLevel}
        onClose={mockOnClose}
      />,
    );

    fireEvent.press(getByText("Size Section"));
    expect(mockOnSelectMarkdownTextSizeLevel).toHaveBeenCalledWith(4);
  });
});
