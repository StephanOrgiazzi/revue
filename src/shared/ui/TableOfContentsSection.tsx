import {
  BottomSheetFlatList,
  TouchableOpacity,
  type BottomSheetFlatListMethods,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import type { Theme } from "@/shared/themes/types";
import type { TableOfContentsHeading } from "@/shared/ui/types";

import { triggerFrequentTickHaptic, triggerSelectionTickHaptic } from "@/shared/logic/haptics";

type TableOfContentsDataList = ArrayLike<TableOfContentsHeading> | null | undefined;

type TableOfContentsItemProps = {
  heading: TableOfContentsHeading;
  index: number;
  isActive: boolean;
  theme: Theme;
  onSelectHeading: (heading: TableOfContentsHeading) => void;
};

type TableOfContentsRenderItemParams = {
  item: TableOfContentsHeading;
  index: number;
};

type TableOfContentsScrollToIndexError = {
  index: number;
  highestMeasuredFrameIndex: number;
  averageItemLength: number;
};

type TableOfContentsSectionProps = {
  visible: boolean;
  theme: Theme;
  headings: TableOfContentsHeading[];
  activeHeadingSlug: string | null;
  onSelectHeading: (heading: TableOfContentsHeading) => void;
  listMaxHeight?: number;
  showBottomDivider?: boolean;
};

const TOC_ITEM_TOTAL_HEIGHT = 58;

const TOC_LIST_BOTTOM_PADDING = 12;

const TOC_SCROLL_HAPTIC_COOLDOWN_MS = 45;

function TableOfContentsEmptyState({ theme }: { theme: Theme }) {
  return (
    <Text className="mb-2 text-sm leading-5" style={{ color: theme.colors.textMuted }}>
      No headings found in this article.
    </Text>
  );
}

function TableOfContentsItem({
  heading,
  index,
  isActive,
  theme,
  onSelectHeading,
}: TableOfContentsItemProps) {
  const isPaperLikeTheme = theme.id === "paper" || theme.id === "light";

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        {
          backgroundColor: isActive ? theme.colors.tocItemActiveBackground : "transparent",
          borderColor: isPaperLikeTheme ? theme.colors.surfaceBorder : "transparent",
          borderWidth: isPaperLikeTheme ? 1 : 0,
        },
      ]}
      onPress={() => {
        triggerSelectionTickHaptic();
        onSelectHeading(heading);
      }}
    >
      <View className="shrink flex-row items-center">
        <Text
          className="mr-[14px] text-base font-bold leading-5 tracking-[0.4px]"
          style={{ color: theme.colors.textMuted }}
        >
          {String(index + 1).padStart(2, "0")}
        </Text>
        <Text
          numberOfLines={1}
          className="shrink text-base font-medium leading-6"
          style={{
            color: isActive ? theme.colors.headingPrimary : theme.colors.textSecondary,
          }}
        >
          {heading.text}
        </Text>
      </View>
      {isActive ? (
        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
      ) : null}
    </TouchableOpacity>
  );
}

function useTableOfContentsScrollHaptics(visible: boolean, headingCount: number) {
  const isUserScrollingRef = useRef(false);
  const lastHapticIndexRef = useRef<number | null>(null);
  const lastHapticAtMsRef = useRef(0);

  const handleTocScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!visible || !isUserScrollingRef.current || headingCount === 0) {
        return;
      }

      const rawIndex = Math.round(event.nativeEvent.contentOffset.y / TOC_ITEM_TOTAL_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(headingCount - 1, rawIndex));
      if (clampedIndex === lastHapticIndexRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastHapticAtMsRef.current < TOC_SCROLL_HAPTIC_COOLDOWN_MS) {
        return;
      }

      lastHapticIndexRef.current = clampedIndex;
      lastHapticAtMsRef.current = now;
      triggerFrequentTickHaptic();
    },
    [headingCount, visible],
  );

  const handleTocScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  const handleTocScrollEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) {
      isUserScrollingRef.current = false;
    }
  }, []);

  const handleTocMomentumEnd = useCallback(() => {
    isUserScrollingRef.current = false;
  }, []);

  return {
    handleTocScroll,
    handleTocScrollBeginDrag,
    handleTocScrollEndDrag,
    handleTocMomentumEnd,
  };
}

export const TableOfContentsSection = memo(
  ({
    visible,
    theme,
    headings,
    activeHeadingSlug,
    onSelectHeading,
    listMaxHeight = 844,
    showBottomDivider = true,
  }: TableOfContentsSectionProps) => {
    const tocListRef = useRef<BottomSheetFlatListMethods>(null);

    const filteredHeadings = useMemo(
      () => headings.filter((heading) => heading.level <= 3),
      [headings],
    );

    const activeHeadingIndex = useMemo(
      () => filteredHeadings.findIndex((heading) => heading.slug === activeHeadingSlug),
      [activeHeadingSlug, filteredHeadings],
    );

    const headingKeyExtractor = useCallback((heading: TableOfContentsHeading) => heading.slug, []);

    const scrollToActiveHeading = useCallback(() => {
      if (activeHeadingIndex < 0) {
        return;
      }

      tocListRef.current?.scrollToIndex({
        index: activeHeadingIndex,
        animated: false,
        viewPosition: 0.5,
      });
    }, [activeHeadingIndex]);

    const {
      handleTocScroll,
      handleTocScrollBeginDrag,
      handleTocScrollEndDrag,
      handleTocMomentumEnd,
    } = useTableOfContentsScrollHaptics(visible, filteredHeadings.length);

    const bottomSheetScrollHandlers = {
      onScroll: handleTocScroll,
    };

    useEffect(() => {
      if (!visible) {
        return;
      }

      const frameId = requestAnimationFrame(() => {
        scrollToActiveHeading();
      });

      return () => {
        cancelAnimationFrame(frameId);
      };
    }, [scrollToActiveHeading, visible]);

    const renderHeadingItem = useCallback(
      ({ item, index }: TableOfContentsRenderItemParams) => {
        return (
          <TableOfContentsItem
            heading={item}
            index={index}
            isActive={activeHeadingSlug === item.slug}
            theme={theme}
            onSelectHeading={onSelectHeading}
          />
        );
      },
      [activeHeadingSlug, onSelectHeading, theme],
    );

    return (
      <>
        <View className="mb-2 flex-row items-center justify-between">
          <Text
            className="text-xs font-bold uppercase tracking-[0.9px]"
            style={{ color: theme.colors.textMuted }}
          >
            Contents
          </Text>
        </View>

        <BottomSheetFlatList
          ref={tocListRef}
          data={filteredHeadings}
          style={{ maxHeight: listMaxHeight, flexGrow: 1 }}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: TOC_LIST_BOTTOM_PADDING }}
          keyExtractor={headingKeyExtractor}
          renderItem={renderHeadingItem}
          getItemLayout={(_data: TableOfContentsDataList, index: number) => ({
            length: TOC_ITEM_TOTAL_HEIGHT,
            offset: TOC_ITEM_TOTAL_HEIGHT * index,
            index,
          })}
          onScrollToIndexFailed={(error: TableOfContentsScrollToIndexError) => {
            tocListRef.current?.scrollToOffset({
              offset: TOC_ITEM_TOTAL_HEIGHT * error.index,
              animated: false,
            });
            requestAnimationFrame(() => {
              scrollToActiveHeading();
            });
          }}
          focusHook={useFocusEffect}
          {...bottomSheetScrollHandlers}
          onScrollBeginDrag={handleTocScrollBeginDrag}
          onScrollEndDrag={handleTocScrollEndDrag}
          onMomentumScrollEnd={handleTocMomentumEnd}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={4}
          removeClippedSubviews
          ListEmptyComponent={<TableOfContentsEmptyState theme={theme} />}
        />

        {showBottomDivider ? (
          <View className="mb-[18px] mt-3 h-px" style={{ backgroundColor: theme.colors.divider }} />
        ) : null}
      </>
    );
  },
);

TableOfContentsSection.displayName = "TableOfContentsSection";
