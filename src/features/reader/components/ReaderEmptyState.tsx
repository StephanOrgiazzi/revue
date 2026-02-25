import { Text } from "react-native";

import type { Theme } from "@/shared/themes/themes";

type ReaderEmptyStateProps = {
  theme: Theme;
  contentWidth: number;
};

export function ReaderEmptyState({ theme, contentWidth }: ReaderEmptyStateProps) {
  return (
    <Text
      selectable
      className="font-normal"
      style={{
        width: contentWidth,
        color: theme.colors.textSecondary,
        fontSize: theme.typography.bodySize,
        lineHeight: theme.typography.bodyLineHeight,
        fontFamily: "sans-serif",
      }}
    >
      This article is empty.
    </Text>
  );
}
