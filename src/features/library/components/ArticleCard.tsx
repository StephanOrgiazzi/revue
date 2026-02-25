import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";
import {
  cardPaletteForTitle,
  type CardPalette,
} from "@/features/library/logic/libraryItemViewModel";
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

    return (
      <Pressable
        disabled={disabled}
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

          {disabled ? (
            <Text className="text-sm font-semibold uppercase tracking-[1.1px] text-slate-700">
              Importing
            </Text>
          ) : formattedImportDate ? (
            <Text className="text-sm font-semibold text-slate-700">{formattedImportDate}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  },
);

ArticleCard.displayName = "ArticleCard";
