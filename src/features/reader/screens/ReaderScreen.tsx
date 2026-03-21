import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
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

  const handleContentSizeChangeWithFloatingMenu = useCallback(() => {
    handleContentSizeChange();
    if (!isLoading) {
      setRenderedArticleContentKey(articleContentRenderKey);
    }
  }, [articleContentRenderKey, handleContentSizeChange, isLoading]);

  const {
    isFloatingMenuButtonVisible,
    handleScrollOffsetChange: handleFloatingMenuScrollOffsetChange,
  } = useReaderFloatingMenuVisibility({
    isEnabled:
      !hasError && !isLoading && isReadingPositionRestoreReady && hasRenderedArticleContent,
  });

  const handleArticleScrollWithFloatingMenu = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleFloatingMenuScrollOffsetChange(event.nativeEvent.contentOffset.y);
      handleArticleScroll(event);
    },
    [handleArticleScroll, handleFloatingMenuScrollOffsetChange],
  );

  const shouldDisplayFloatingMenu =
    !hasError &&
    !isLoading &&
    isReadingPositionRestoreReady &&
    hasRenderedArticleContent &&
    isFloatingMenuButtonVisible;

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
    persistReadingPosition();
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
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

      {hasError ? (
        <ReaderErrorState errorColor={theme.colors.error} errorMessage={errorMessage} />
      ) : (
        <View style={{ flex: 1 }}>
          <TRenderEngineProvider
            systemFonts={htmlSystemFonts}
            baseStyle={htmlStyles.baseStyle}
            tagsStyles={htmlStyles.tagsStyles}
            classesStyles={htmlStyles.classesStyles}
          >
            <RenderHTMLConfigProvider
              renderers={readerHtmlRenderers}
              renderersProps={htmlRenderersProps}
              enableExperimentalMarginCollapsing
            >
              <ReaderArticleContent
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
            </RenderHTMLConfigProvider>
          </TRenderEngineProvider>
        </View>
      )}
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
