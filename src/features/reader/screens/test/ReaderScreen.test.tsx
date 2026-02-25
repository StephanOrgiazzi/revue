import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ReaderScreen } from "@/features/reader/screens/ReaderScreen";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPersistReadingPosition = jest.fn();
const mockUseReaderArticle = jest.fn();
const mockUseReaderPosition = jest.fn();
const mockUseReaderFloatingMenuVisibility = jest.fn();
const mockReaderControlsOverlay = jest.fn();
let mockCanGoBack = true;

const defaultArticle = {
  id: "article-id",
  title: "Title",
  createdAt: "2026-01-01",
};

const defaultUseReaderPositionResult = {
  articleScrollRef: { current: null },
  activeHeadingSlug: null,
  isRestoringReadingPosition: false,
  isReadingPositionRestoreReady: true,
  shouldSuppressListHeader: false,
  handleSelectHeading: jest.fn(),
  handleBlockLayout: jest.fn(),
  handleArticleScroll: jest.fn(),
  handleContentSizeChange: jest.fn(),
  persistReadingPosition: mockPersistReadingPosition,
};

jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ children }: any) => children ?? null,
  },
  useLocalSearchParams: () => ({ id: "article-id" }),
  useRouter: () => ({
    canGoBack: () => mockCanGoBack,
    back: mockBack,
    replace: mockReplace,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@/shared/themes/useThemePreferences", () => ({
  useThemePreferences: () => ({
    theme: require("@/shared/themes/definitions/lightTheme").lightTheme,
    themeId: "light",
    setThemeId: jest.fn(),
    markdownTextSizeLevel: "base",
    setMarkdownTextSizeLevel: jest.fn(),
  }),
}));

jest.mock("@/features/reader/hooks/useReaderArticle", () => ({
  useReaderArticle: (...args: unknown[]) => mockUseReaderArticle(...args),
}));

jest.mock("@/features/reader/hooks/useReaderScreenViewModel", () => ({
  useReaderScreenViewModel: () => ({
    htmlStyles: { baseStyle: {}, tagsStyles: {}, classesStyles: {} },
    htmlSystemFonts: [],
    htmlRenderers: {},
    htmlRenderersProps: {},
    htmlBlocks: ["<p>content</p>"],
    shouldShowArticleHeader: true,
    tocHeadings: [],
    pageBackgroundColor: "#fff",
    horizontalPadding: 20,
    htmlContentWidth: 360,
    screenTitle: "Reader",
    articleTitle: "Title",
    articleMeta: "Meta",
    isContentEmpty: false,
    contentContainerStyle: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      alignItems: "center",
    },
  }),
}));

jest.mock("@/features/reader/hooks/useReaderPosition", () => ({
  useReaderPosition: (...args: unknown[]) => mockUseReaderPosition(...args),
}));

jest.mock("@/features/reader/hooks/useReaderFloatingMenuVisibility", () => ({
  useReaderFloatingMenuVisibility: (...args: unknown[]) =>
    mockUseReaderFloatingMenuVisibility(...args),
}));

jest.mock("react-native-render-html", () => ({
  RenderHTMLConfigProvider: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
  TRenderEngineProvider: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));

jest.mock("@/features/reader/components/ReaderArticleContent", () => ({
  ReaderArticleContent: () => {
    const { Text } = require("react-native");
    return <Text>Article Content</Text>;
  },
}));

jest.mock("@/features/reader/components/ReaderArticleHeader", () => ({
  ReaderArticleHeader: () => {
    const { Text } = require("react-native");
    return <Text>Article Header</Text>;
  },
}));

jest.mock("@/features/reader/components/ReaderEmptyState", () => ({
  ReaderEmptyState: () => {
    const { Text } = require("react-native");
    return <Text>Empty Article</Text>;
  },
}));

jest.mock("@/features/reader/components/ReaderSkeleton", () => ({
  ReaderSkeleton: () => {
    const { Text } = require("react-native");
    return <Text>Reader Skeleton</Text>;
  },
}));

jest.mock("@/features/reader/components/ReaderControlsOverlay", () => ({
  ReaderControlsOverlay: (props: any) => {
    const { Text } = require("react-native");
    mockReaderControlsOverlay(props);
    return (
      <>
        <Text>
          {props.isFloatingMenuVisible ? "Floating Menu Visible" : "Floating Menu Hidden"}
        </Text>
        <Text onPress={props.onExitReader}>Exit Reader</Text>
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

describe("ReaderScreen", () => {
  beforeEach(() => {
    mockCanGoBack = true;
    mockUseReaderArticle.mockReset();
    mockUseReaderPosition.mockReset();
    mockUseReaderFloatingMenuVisibility.mockReset();
    mockReaderControlsOverlay.mockReset();
    mockBack.mockClear();
    mockReplace.mockClear();
    mockPersistReadingPosition.mockClear();

    mockUseReaderArticle.mockReturnValue({
      article: defaultArticle,
      content: "# Heading",
      errorMessage: "",
      isLoading: false,
    });
    mockUseReaderPosition.mockReturnValue(defaultUseReaderPositionResult);
    mockUseReaderFloatingMenuVisibility.mockReturnValue({
      isFloatingMenuButtonVisible: true,
      handleScrollOffsetChange: jest.fn(),
    });
  });

  it("renders error state and disables floating controls", () => {
    mockUseReaderArticle.mockReturnValue({
      article: null,
      content: "",
      errorMessage: "Unable to load article",
      isLoading: false,
    });
    const { getByText, queryByText } = render(<ReaderScreen />);

    expect(getByText("Unable to load article")).toBeVisible();
    expect(getByText("Floating Menu Hidden")).toBeVisible();
    expect(queryByText("Article Content")).toBeNull();
  });

  it("persists position and goes back when exiting", () => {
    const { getByText } = render(<ReaderScreen />);

    fireEvent.press(getByText("Exit Reader"));

    expect(mockPersistReadingPosition).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("falls back to root route when exiting without back history", () => {
    mockCanGoBack = false;
    const { getByText } = render(<ReaderScreen />);

    fireEvent.press(getByText("Exit Reader"));

    expect(mockPersistReadingPosition).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("shows restore overlay while reading position is being restored", () => {
    mockUseReaderPosition.mockReturnValue({
      ...defaultUseReaderPositionResult,
      isRestoringReadingPosition: true,
      isReadingPositionRestoreReady: false,
    });

    const { getByText } = render(<ReaderScreen />);

    expect(getByText("Reader Skeleton")).toBeVisible();
    expect(getByText("Floating Menu Hidden")).toBeVisible();
  });

  it("wires article id and loading state into reader position hook", () => {
    render(<ReaderScreen />);

    expect(mockUseReaderPosition).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: "article-id",
        isLoading: false,
      }),
    );
  });
});
