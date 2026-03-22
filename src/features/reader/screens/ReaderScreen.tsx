import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState, type ComponentProps } from "react";
import {
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { RenderHTMLConfigProvider, TRenderEngineProvider } from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Theme } from "@/shared/themes/types";

import { ReaderArticleContent } from "@/features/reader/components/ReaderArticleContent";
import { ReaderArticleHeader } from "@/features/reader/components/ReaderArticleHeader";
import { ReaderControlsOverlay } from "@/features/reader/components/ReaderControlsOverlay";
import { ReaderEmptyState } from "@/features/reader/components/ReaderEmptyState";
import { readerHtmlRenderers } from "@/features/reader/components/ReaderHtmlRenderers";
import { ReaderSkeleton } from "@/features/reader/components/ReaderSkeleton";
import { useReaderArticle } from "@/features/reader/hooks/useReaderArticle";
import { useReaderFloatingMenuVisibility } from "@/features/reader/hooks/useReaderFloatingMenuVisibility";
import { useReaderPosition } from "@/features/reader/hooks/useReaderPosition";
import { useReaderScreenViewModel } from "@/features/reader/hooks/useReaderScreenViewModel";
import { THEME_OPTIONS } from "@/shared/themes/themes";
import { useThemePreferences } from "@/shared/themes/useThemePreferences";
import { ScreenContainer } from "@/shared/ui/ScreenContainer";

type ReaderArticleContentProps = ComponentProps<typeof ReaderArticleContent>;
type ReaderBodyProps = {
  hasError: boolean;
  errorColor: string;
  errorMessage: string | null;
  htmlSystemFonts: ReaderScreenViewModel["htmlSystemFonts"];
  htmlStyles: ReaderScreenViewModel["htmlStyles"];
  htmlRenderersProps: ReaderScreenViewModel["htmlRenderersProps"];
} & Pick<
  ReaderArticleContentProps,
  | "articleScrollRef"
  | "contentContainerStyle"
  | "onContentSizeChange"
  | "onScroll"
  | "shouldSuppressListHeader"
  | "listHeaderComponent"
  | "isLoading"
  | "theme"
  | "htmlContentWidth"
  | "horizontalPadding"
  | "shouldShowArticleHeader"
  | "isContentEmpty"
  | "listEmptyComponent"
  | "htmlBlocks"
  | "onBlockLayout"
>;
type ReaderRouter = Pick<ReturnType<typeof useRouter>, "back" | "canGoBack" | "replace">;
type ReaderScreenViewModel = ReturnType<typeof useReaderScreenViewModel>;

export function ReaderScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const router = useRouter();

  const { width: windowWidth } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  const { theme, themeId, setThemeId, markdownTextSizeLevel, setMarkdownTextSizeLevel } =
    useThemePreferences();

  const { article, content, errorMessage, isLoading } = useReaderArticle(params.id);

  const hasError = Boolean(errorMessage);

  const {
    htmlStyles,
    htmlSystemFonts,
    htmlRenderersProps,
    htmlBlocks,
    shouldShowArticleHeader,
    tocHeadings,
    pageBackgroundColor,
    horizontalPadding,
    htmlContentWidth,
    screenTitle,
    articleTitle,
    articleMeta,
    isContentEmpty,
    contentContainerStyle,
  } = useReaderScreenViewModel({
    articleTitle: article?.title,
    articleCreatedAt: article?.createdAt,
    articleSourceUri: article?.localPath,
    content,
    theme,
    markdownTextSizeLevel,
    insetsTop: insets.top,
    windowWidth,
  });

  const {
    articleScrollRef,
    activeHeadingSlug,
    isRestoringReadingPosition,
    isReadingPositionRestoreReady,
    shouldSuppressListHeader,
    handleSelectHeading,
    handleBlockLayout,
    handleArticleScroll,
    handleContentSizeChange,
    persistReadingPosition,
  } = useReaderPosition({
    articleId: article?.id,
    htmlBlocks,
    tocHeadings,
    isLoading,
  });

  const articleContentRenderKey = `${article?.id ?? "no-article"}:${isLoading ? "loading" : "ready"}`;

  const [renderedArticleContentKey, setRenderedArticleContentKey] = useState<string | null>(null);

  const hasRenderedArticleContent =
    !isLoading && renderedArticleContentKey === articleContentRenderKey;

  const isFloatingMenuEnabled = isFloatingMenuInteractionEnabled({
    hasError,
    isLoading,
    isReadingPositionRestoreReady,
    hasRenderedArticleContent,
  });

  const handleContentSizeChangeWithFloatingMenu = useCallback(() => {
    handleContentSizeChange();
    if (!isLoading) {
      setRenderedArticleContentKey(articleContentRenderKey);
    }
  }, [articleContentRenderKey, handleContentSizeChange, isLoading]);

  const {
    isFloatingMenuButtonVisible,
    handleScrollOffsetChange: handleFloatingMenuScrollOffsetChange,
  } = useReaderFloatingMenuVisibility({ isEnabled: isFloatingMenuEnabled });

  const handleArticleScrollWithFloatingMenu = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleFloatingMenuScrollOffsetChange(event.nativeEvent.contentOffset.y);
      handleArticleScroll(event);
    },
    [handleArticleScroll, handleFloatingMenuScrollOffsetChange],
  );

  const shouldDisplayFloatingMenu = shouldDisplayFloatingMenuButton({
    isFloatingMenuEnabled,
    isFloatingMenuButtonVisible,
  });

  const listHeaderComponent = useMemo(
    () =>
      shouldShowArticleHeader ? (
        <ReaderArticleHeader
          theme={theme}
          contentWidth={htmlContentWidth}
          title={articleTitle}
          articleMeta={articleMeta}
        />
      ) : null,
    [articleMeta, articleTitle, htmlContentWidth, shouldShowArticleHeader, theme],
  );

  const listEmptyComponent = useMemo(
    () => <ReaderEmptyState theme={theme} contentWidth={htmlContentWidth} />,
    [htmlContentWidth, theme],
  );

  const handleExitReader = useCallback(() => {
    exitReader(router, persistReadingPosition);
  }, [persistReadingPosition, router]);

  return (
    <ScreenContainer
      edges={["right", "bottom", "left"]}
      backgroundColor={pageBackgroundColor}
      className="px-0"
    >
      <Stack.Screen
        options={{
          title: screenTitle,
          headerShadowVisible: false,
          headerTintColor: theme.colors.textPrimary,
          headerStyle: {
            backgroundColor: pageBackgroundColor,
          },
        }}
      />
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      <ReaderBody
        hasError={hasError}
        errorColor={theme.colors.error}
        errorMessage={errorMessage}
        htmlSystemFonts={htmlSystemFonts}
        htmlStyles={htmlStyles}
        htmlRenderersProps={htmlRenderersProps}
        articleScrollRef={articleScrollRef}
        contentContainerStyle={contentContainerStyle}
        onContentSizeChange={handleContentSizeChangeWithFloatingMenu}
        onScroll={handleArticleScrollWithFloatingMenu}
        shouldSuppressListHeader={shouldSuppressListHeader}
        listHeaderComponent={listHeaderComponent}
        isLoading={isLoading}
        theme={theme}
        htmlContentWidth={htmlContentWidth}
        horizontalPadding={horizontalPadding}
        shouldShowArticleHeader={shouldShowArticleHeader}
        isContentEmpty={isContentEmpty}
        listEmptyComponent={listEmptyComponent}
        htmlBlocks={htmlBlocks}
        onBlockLayout={handleBlockLayout}
      />
      <ReaderRestoringOverlay
        visible={!hasError && isRestoringReadingPosition}
        backgroundColor={pageBackgroundColor}
        theme={theme}
        contentWidth={htmlContentWidth}
        horizontalPadding={horizontalPadding}
      />

      <ReaderControlsOverlay
        isFloatingMenuVisible={shouldDisplayFloatingMenu}
        floatingMenuBottomOffset={Math.max(24, insets.bottom + 12)}
        theme={theme}
        themeOptions={THEME_OPTIONS}
        activeThemeId={themeId}
        onSelectTheme={setThemeId}
        activeMarkdownTextSizeLevel={markdownTextSizeLevel}
        onSelectMarkdownTextSizeLevel={setMarkdownTextSizeLevel}
        headings={tocHeadings}
        activeHeadingSlug={activeHeadingSlug}
        onSelectHeading={handleSelectHeading}
        onExitReader={handleExitReader}
      />
    </ScreenContainer>
  );
}

function exitReader(router: ReaderRouter, persistReadingPosition: () => void) {
  persistReadingPosition();
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/");
}

function isFloatingMenuInteractionEnabled(props: {
  hasError: boolean;
  isLoading: boolean;
  isReadingPositionRestoreReady: boolean;
  hasRenderedArticleContent: boolean;
}) {
  const { hasError, isLoading, isReadingPositionRestoreReady, hasRenderedArticleContent } = props;
  return !hasError && !isLoading && isReadingPositionRestoreReady && hasRenderedArticleContent;
}

function ReaderBody(props: ReaderBodyProps) {
  if (props.hasError) {
    return <ReaderErrorState errorColor={props.errorColor} errorMessage={props.errorMessage} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <TRenderEngineProvider
        systemFonts={props.htmlSystemFonts}
        baseStyle={props.htmlStyles.baseStyle}
        tagsStyles={props.htmlStyles.tagsStyles}
        classesStyles={props.htmlStyles.classesStyles}
      >
        <RenderHTMLConfigProvider
          renderers={readerHtmlRenderers}
          renderersProps={props.htmlRenderersProps}
          enableExperimentalMarginCollapsing
        >
          <ReaderArticleContent
            articleScrollRef={props.articleScrollRef}
            contentContainerStyle={props.contentContainerStyle}
            onContentSizeChange={props.onContentSizeChange}
            onScroll={props.onScroll}
            shouldSuppressListHeader={props.shouldSuppressListHeader}
            listHeaderComponent={props.listHeaderComponent}
            isLoading={props.isLoading}
            theme={props.theme}
            htmlContentWidth={props.htmlContentWidth}
            horizontalPadding={props.horizontalPadding}
            shouldShowArticleHeader={props.shouldShowArticleHeader}
            isContentEmpty={props.isContentEmpty}
            listEmptyComponent={props.listEmptyComponent}
            htmlBlocks={props.htmlBlocks}
            onBlockLayout={props.onBlockLayout}
          />
        </RenderHTMLConfigProvider>
      </TRenderEngineProvider>
    </View>
  );
}

function ReaderErrorState(props: { errorColor: string; errorMessage: string | null }) {
  return (
    <View className="px-5 py-6">
      <Text className="text-base leading-6" style={{ color: props.errorColor }}>
        {props.errorMessage}
      </Text>
    </View>
  );
}

function ReaderRestoringOverlay(props: {
  visible: boolean;
  backgroundColor: string;
  theme: Theme;
  contentWidth: number;
  horizontalPadding: number;
}) {
  if (!props.visible) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: props.backgroundColor,
      }}
    >
      <ReaderSkeleton
        theme={props.theme}
        contentWidth={props.contentWidth}
        horizontalPadding={props.horizontalPadding}
        verticalPadding={0}
        showHeader={false}
      />
    </View>
  );
}

function shouldDisplayFloatingMenuButton(props: {
  isFloatingMenuEnabled: boolean;
  isFloatingMenuButtonVisible: boolean;
}) {
  return props.isFloatingMenuEnabled && props.isFloatingMenuButtonVisible;
}
