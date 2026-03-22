import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import type { CardPalette } from "@/features/library/logic/types";
import type { LibraryItem, LibraryItemId } from "@/shared/library/types";

import { cardPaletteForTitle } from "@/features/library/logic/libraryItemViewModel";
import { formatArticleDate } from "@/shared/logic/formatArticleDate";

type ArticleCardProps = {
  article: LibraryItem;
  palette?: CardPalette;
  disabled?: boolean;
  onPress: (articleId: LibraryItemId) => void;
  onLongPress: (article: LibraryItem) => void;
};

export const ArticleCard = memo(
  ({ article, palette, disabled = false, onPress, onLongPress }: ArticleCardProps) => {
    const cardPalette = palette ?? cardPaletteForTitle(article.title);

    const formattedImportDate = formatArticleDate(article.createdAt);
    const footerLabel = disabled ? "Importing" : formattedImportDate;

    return (
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={article.title}
        onPress={() => onPress(article.id)}
        onLongPress={() => onLongPress(article)}
        className={`h-[180px] w-full overflow-hidden rounded-[13px] ${disabled ? "opacity-70" : ""}`}
        style={{
          backgroundColor: cardPalette.backgroundColor,
        }}
      >
        <View className="flex-1 justify-between p-5">
          <Text
            numberOfLines={4}
            className="text-[20px] font-extrabold leading-[26px] tracking-[-0.4px] text-[#0E1526]"
            style={{
              fontFamily: "serif",
            }}
          >
            {article.title}
          </Text>

          {footerLabel ? (
            <Text
              className={`text-sm font-semibold text-slate-700 ${disabled ? "uppercase tracking-[1.1px]" : ""}`}
            >
              {footerLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  },
);

ArticleCard.displayName = "ArticleCard";
