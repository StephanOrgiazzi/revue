import { Text, View } from "react-native";

import type { Theme } from "@/shared/themes/themes";

type ReaderArticleHeaderProps = {
  theme: Theme;
  contentWidth: number;
  title: string;
  articleMeta: string;
};

export function ReaderArticleHeader({
  theme,
  contentWidth,
  title,
  articleMeta,
}: ReaderArticleHeaderProps) {
  return (
    <View style={{ width: contentWidth, marginBottom: theme.spacing.blockGap }}>
      <Text
        className="mt-4 font-black tracking-[-0.4px]"
        style={{
          color: theme.colors.headingPrimary,
          fontSize: theme.typography.titleSize,
          lineHeight: theme.typography.titleLineHeight,
        }}
      >
        {title}
      </Text>
      <Text
        className="mt-3 font-sans text-[15px] leading-[22px]"
        style={{
          color: theme.colors.textMuted,
        }}
      >
        {articleMeta}
      </Text>
    </View>
  );
}
