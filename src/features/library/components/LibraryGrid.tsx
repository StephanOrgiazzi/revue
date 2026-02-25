import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, type LayoutChangeEvent, View } from "react-native";

import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";
import { ArticleCard } from "@/features/library/components/ArticleCard";
import { ImportCard } from "@/features/library/components/ImportCard";
import { buildCardPalettesForGrid } from "@/features/library/logic/libraryItemViewModel";
import type { Theme } from "@/shared/themes/themes";

type LibraryGridCard =
  | { kind: "import" }
  | { kind: "article"; article: LibraryItem }
  | { kind: "spacer" };

type LibraryGridProps = {
  theme: Theme;
  items: LibraryItem[];
  isImporting: boolean;
  pendingArticleIds: LibraryItemId[];
  onImport: () => void;
  onOpenArticle: (articleId: LibraryItemId) => void;
  onArticleLongPress: (article: LibraryItem) => void;
};

const CARD_GAP = 10;
const CONTENT_PADDING_BOTTOM = 24;

export const LibraryGrid = memo(
  ({
    theme,
    items,
    isImporting,
    pendingArticleIds,
    onImport,
    onOpenArticle,
    onArticleLongPress,
  }: LibraryGridProps) => {
    const [listWidth, setListWidth] = useState(0);

    const cards = useMemo<LibraryGridCard[]>(() => {
      const nextCards: LibraryGridCard[] = [
        { kind: "import" },
        ...items.map((article) => ({ kind: "article" as const, article })),
      ];

      if (nextCards.length % 2 !== 0) {
        nextCards.push({ kind: "spacer" });
      }

      return nextCards;
    }, [items]);
    const pendingArticleIdsSet = useMemo(() => new Set(pendingArticleIds), [pendingArticleIds]);
    const articleCardPalettes = useMemo(
      () =>
        buildCardPalettesForGrid(items, {
          columnCount: 2,
          leadingCellCount: 1,
        }),
      [items],
    );

    const keyExtractor = useCallback((item: LibraryGridCard) => {
      if (item.kind === "import") {
        return "import-action";
      }

      if (item.kind === "spacer") {
        return "grid-spacer";
      }

      return item.article.id;
    }, []);

    const cardWidth = listWidth > 0 ? (listWidth - CARD_GAP) / 2 : undefined;
    const flatListExtraDataKey = `${theme.id}:${pendingArticleIds.join("|")}`;

    const handleListLayout = useCallback((event: LayoutChangeEvent) => {
      const nextWidth = event.nativeEvent.layout.width;
      setListWidth((previousWidth) => (previousWidth === nextWidth ? previousWidth : nextWidth));
    }, []);

    const renderItem = useCallback(
      ({ item }: { item: LibraryGridCard }) => {
        return (
          <View
            className="mb-2.5 flex-1"
            style={cardWidth === undefined ? undefined : { width: cardWidth }}
          >
            {item.kind === "spacer" ? (
              <View className="h-[180px]" />
            ) : item.kind === "import" ? (
              <ImportCard theme={theme} isImporting={isImporting} onPress={onImport} />
            ) : (
              <ArticleCard
                article={item.article}
                palette={articleCardPalettes[item.article.id]}
                disabled={pendingArticleIdsSet.has(item.article.id)}
                onPress={onOpenArticle}
                onLongPress={onArticleLongPress}
              />
            )}
          </View>
        );
      },
      [
        cardWidth,
        isImporting,
        onArticleLongPress,
        onImport,
        onOpenArticle,
        articleCardPalettes,
        pendingArticleIdsSet,
        theme,
      ],
    );

    return (
      <FlatList
        onLayout={handleListLayout}
        data={cards}
        extraData={flatListExtraDataKey}
        keyExtractor={keyExtractor}
        numColumns={2}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: CONTENT_PADDING_BOTTOM }}
        columnWrapperStyle={{ gap: CARD_GAP }}
        renderItem={renderItem}
      />
    );
  },
);

LibraryGrid.displayName = "LibraryGrid";
