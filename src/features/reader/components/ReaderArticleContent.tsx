import type { ReactNode, RefObject } from "react";
import type { ScrollViewProps } from "react-native";
import { ScrollView, View } from "react-native";
import { RenderHTMLSource } from "react-native-render-html";

import { ReaderSkeleton } from "@/features/reader/components/ReaderSkeleton";
import { useThemePreferences } from "@/shared/themes/useThemePreferences";

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

type HtmlBlockItemProps = {
  htmlBlock: string;
  htmlContentWidth: number;
  blockIndex: number;
  onBlockLayout: (blockIndex: number, blockY: number) => void;
};

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

  return (
    <ScrollView
      ref={articleScrollRef}
      nestedScrollEnabled
      contentContainerStyle={contentContainerStyle}
      onContentSizeChange={onContentSizeChange}
      onScroll={onScroll}
      scrollEventThrottle={100}
    >
      {shouldSuppressListHeader ? null : listHeaderComponent}
      {isLoading ? (
        <ReaderSkeleton
          theme={theme}
          contentWidth={htmlContentWidth}
          horizontalPadding={horizontalPadding}
          verticalPadding={0}
          showHeader={shouldShowArticleHeader}
        />
      ) : isContentEmpty ? (
        listEmptyComponent
      ) : (
        htmlBlocks.map((htmlBlock, blockIndex) => {
          const occurrenceCount = (htmlBlockOccurrences.get(htmlBlock) ?? 0) + 1;
          htmlBlockOccurrences.set(htmlBlock, occurrenceCount);

          return (
            <HtmlBlockItem
              key={`${htmlBlock.length}:${occurrenceCount}:${htmlBlock}`}
              htmlBlock={htmlBlock}
              htmlContentWidth={htmlContentWidth}
              blockIndex={blockIndex}
              onBlockLayout={onBlockLayout}
            />
          );
        })
      )}
    </ScrollView>
  );
}
