import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { LibraryScreen } from "@/features/library/screens/LibraryScreen";

const mockPush = jest.fn();
const mockSelectionTick = jest.fn();
const mockLongPress = jest.fn();
const mockUseLibrary = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: () => undefined,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@/shared/themes/useThemePreferences", () => ({
  useThemePreferences: () => ({
    theme: require("@/shared/themes/definitions/lightTheme").lightTheme,
    themeId: "light",
    setThemeId: jest.fn(),
  }),
}));

jest.mock("@/shared/logic/haptics", () => ({
  triggerSelectionTickHaptic: () => mockSelectionTick(),
  triggerLongPressHaptic: () => mockLongPress(),
}));

jest.mock("@/features/library/hooks/useLibrary", () => ({
  useLibrary: () => mockUseLibrary(),
}));

jest.mock("@/features/library/components/LibraryGrid", () => ({
  LibraryGrid: ({ onImport, onOpenArticle, onArticleLongPress, items }: any) => {
    const { Text } = require("react-native");
    return (
      <>
        <Text onPress={() => onImport()}>Import</Text>
        <Text onPress={() => onOpenArticle(items[0].id)}>Open First Article</Text>
        <Text onPress={() => onArticleLongPress(items[0])}>Long Press First</Text>
      </>
    );
  },
}));

jest.mock("@/shared/ui/ActionDialog", () => ({
  ActionDialog: ({ visible, title, actions }: any) => {
    const { Text } = require("react-native");
    return (
      <>
        <Text>{visible ? "Dialog Visible" : "Dialog Hidden"}</Text>
        <Text>{title}</Text>
        {actions?.[0] ? <Text onPress={actions[0].onPress}>Delete Selected</Text> : null}
      </>
    );
  },
}));

jest.mock("@/shared/ui/FloatingMenuButton", () => ({
  FloatingMenuButton: ({ onPress }: any) => {
    const { Text } = require("react-native");
    return <Text onPress={onPress}>Open Library Controls</Text>;
  },
}));

jest.mock("@/shared/ui/ControlsSheet", () => ({
  ControlsSheet: ({ visible, onClose }: any) => {
    const { Text } = require("react-native");
    return (
      <>
        <Text>{visible ? "Controls Open" : "Controls Closed"}</Text>
        <Text onPress={onClose}>Close Controls</Text>
      </>
    );
  },
}));

jest.mock("@/shared/ui/ScreenContainer", () => ({
  ScreenContainer: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));

const baseItem = {
  id: "a1",
  title: "Alpha",
  localPath: "/alpha.md",
  tags: [],
  createdAt: "2026-01-01",
  lastAnchorSlug: null,
  lastScrollOffsetY: null,
  readingProgress: 0,
};

function createLibraryHookResult(overrides: Record<string, unknown> = {}) {
  return {
    items: [baseItem],
    isImporting: false,
    pendingArticleIds: [],
    errorMessage: "",
    itemCountLabel: "1 article",
    pendingAutoOpenArticleId: null,
    consumePendingAutoOpenArticleId: jest.fn(),
    importArticle: jest.fn(),
    removeArticle: jest.fn(),
    ...overrides,
  };
}

describe("LibraryScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSelectionTick.mockClear();
    mockLongPress.mockClear();
    mockUseLibrary.mockReset();
    mockUseLibrary.mockReturnValue(createLibraryHookResult());
  });

  it("auto-opens pending article and consumes it", () => {
    const consumePendingAutoOpenArticleId = jest.fn();
    mockUseLibrary.mockReturnValue(
      createLibraryHookResult({
        pendingAutoOpenArticleId: "auto-open-id",
        consumePendingAutoOpenArticleId,
      }),
    );

    render(<LibraryScreen />);

    expect(mockPush).toHaveBeenCalledWith("/reader/auto-open-id");
    expect(consumePendingAutoOpenArticleId).toHaveBeenCalledTimes(1);
  });

  it("imports and opens non-pending article with selection haptic", () => {
    const importArticle = jest.fn();
    mockUseLibrary.mockReturnValue(createLibraryHookResult({ importArticle }));
    const { getByText } = render(<LibraryScreen />);

    fireEvent.press(getByText("Import"));
    fireEvent.press(getByText("Open First Article"));

    expect(importArticle).toHaveBeenCalledTimes(1);
    expect(mockSelectionTick).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/reader/a1");
  });

  it("does not open pending article", () => {
    mockUseLibrary.mockReturnValue(createLibraryHookResult({ pendingArticleIds: ["a1"] }));

    const { getByText } = render(<LibraryScreen />);
    fireEvent.press(getByText("Open First Article"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockSelectionTick).not.toHaveBeenCalled();
  });

  it("opens delete dialog on long press and deletes selected article", () => {
    const removeArticle = jest.fn();
    mockUseLibrary.mockReturnValue(createLibraryHookResult({ removeArticle }));

    const { getByText } = render(<LibraryScreen />);
    fireEvent.press(getByText("Long Press First"));

    expect(mockLongPress).toHaveBeenCalledTimes(1);
    expect(getByText("Dialog Visible")).toBeVisible();
    expect(getByText("Alpha")).toBeVisible();

    fireEvent.press(getByText("Delete Selected"));
    expect(removeArticle).toHaveBeenCalledWith(expect.objectContaining({ id: "a1" }));
  });

  it("toggles controls sheet from floating menu", () => {
    const { getByText } = render(<LibraryScreen />);

    expect(getByText("Controls Closed")).toBeVisible();
    fireEvent.press(getByText("Open Library Controls"));
    expect(getByText("Controls Open")).toBeVisible();

    fireEvent.press(getByText("Close Controls"));
    expect(getByText("Controls Closed")).toBeVisible();
  });
});
