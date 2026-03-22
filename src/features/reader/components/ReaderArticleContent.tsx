import type { ReactNode, RefObject } from "react";

import { ScrollView, View, type ScrollViewProps } from "react-native";
import { RenderHTMLSource } from "react-native-render-html";

import { ReaderSkeleton } from "@/features/reader/components/ReaderSkeleton";
import { useThemePreferences } from "@/shared/themes/useThemePreferences";

type HtmlBlockItemProps = {
  htmlBlock: string;
  htmlContentWidth: number;
  blockIndex: number;
  onBlockLayout: (blockIndex: number, blockY: number) => void;
};

type ReaderArticleContentProps = {
  articleScrollRef: RefObject<ScrollView | null>;
  contentContainerStyle: {
    paddingTop: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;
    alignItems: "center";
  };
  onContentSizeChange: NonNullable<ScrollViewProps["onContentSizeChange"]>;
  onScroll: NonNullable<ScrollViewProps["onScroll"]>;
  shouldSuppressListHeader: boolean;
  listHeaderComponent: ReactNode;
  isLoading: boolean;
  theme: ReturnType<typeof useThemePreferences>["theme"];
  htmlContentWidth: number;
  horizontalPadding: number;
  shouldShowArticleHeader: boolean;
  isContentEmpty: boolean;
  listEmptyComponent: ReactNode;
  htmlBlocks: string[];
  onBlockLayout: (blockIndex: number, blockY: number) => void;
};

export function ReaderArticleContent({
  articleScrollRef,
  contentContainerStyle,
  onContentSizeChange,
  onScroll,
  shouldSuppressListHeader,
  listHeaderComponent,
  isLoading,
  theme,
  htmlContentWidth,
  horizontalPadding,
  shouldShowArticleHeader,
  isContentEmpty,
  listEmptyComponent,
  htmlBlocks,
  onBlockLayout,
}: ReaderArticleContentProps) {
  const htmlBlockOccurrences = new Map<string, number>();
  const content = createReaderContent({
    isLoading,
    theme,
    htmlContentWidth,
    horizontalPadding,
    shouldShowArticleHeader,
    isContentEmpty,
    listEmptyComponent,
    htmlBlocks,
    onBlockLayout,
    htmlBlockOccurrences,
  });

  return (
    <ScrollView
      testID="reader-article-scroll"
      ref={articleScrollRef}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      onContentSizeChange={onContentSizeChange}
      onScroll={onScroll}
      scrollEventThrottle={100}
    >
      {shouldSuppressListHeader ? null : listHeaderComponent}
      {content}
    </ScrollView>
  );
}

function createReaderContent(params: {
  isLoading: boolean;
  theme: ReturnType<typeof useThemePreferences>["theme"];
  htmlContentWidth: number;
  horizontalPadding: number;
  shouldShowArticleHeader: boolean;
  isContentEmpty: boolean;
  listEmptyComponent: ReactNode;
  htmlBlocks: string[];
  onBlockLayout: (blockIndex: number, blockY: number) => void;
  htmlBlockOccurrences: Map<string, number>;
}): ReactNode {
  if (params.isLoading) {
    return (
      <ReaderSkeleton
        theme={params.theme}
        contentWidth={params.htmlContentWidth}
        horizontalPadding={params.horizontalPadding}
        verticalPadding={0}
        showHeader={params.shouldShowArticleHeader}
      />
    );
  }

  if (params.isContentEmpty) {
    return params.listEmptyComponent;
  }

  return params.htmlBlocks.map((htmlBlock, blockIndex) => {
    const occurrenceCount = (params.htmlBlockOccurrences.get(htmlBlock) ?? 0) + 1;
    params.htmlBlockOccurrences.set(htmlBlock, occurrenceCount);

    return (
      <HtmlBlockItem
        key={`${htmlBlock.length}:${occurrenceCount}:${htmlBlock}`}
        htmlBlock={htmlBlock}
        htmlContentWidth={params.htmlContentWidth}
        blockIndex={blockIndex}
        onBlockLayout={params.onBlockLayout}
      />
    );
  });
}

function HtmlBlockItem({
  htmlBlock,
  htmlContentWidth,
  blockIndex,
  onBlockLayout,
}: HtmlBlockItemProps) {
  return (
    <View
      onLayout={(event) => {
        onBlockLayout(blockIndex, event.nativeEvent.layout.y);
      }}
    >
      <View style={{ width: htmlContentWidth }}>
        <RenderHTMLSource contentWidth={htmlContentWidth} source={{ html: htmlBlock }} />
      </View>
    </View>
  );
}
