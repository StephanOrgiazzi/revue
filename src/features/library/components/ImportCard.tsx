import { memo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { triggerContextClickHaptic } from "@/shared/logic/haptics";
import type { Theme } from "@/shared/themes/themes";

type ImportCardProps = {
  theme: Theme;
  isImporting: boolean;
  onPress: () => void;
};

export const ImportCard = memo(({ theme, isImporting, onPress }: ImportCardProps) => {
  return (
    <Pressable
      onPress={() => {
        triggerContextClickHaptic();
        onPress();
      }}
      disabled={isImporting}
      className="h-[180px] w-full items-center justify-center overflow-hidden rounded-[13px] border border-dashed p-4"
      style={{
        borderColor: theme.colors.accent,
        backgroundColor: theme.colors.codeBackground,
      }}
    >
      <View className="h-9 items-center justify-center">
        {isImporting ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : (
          <Text className="text-4xl leading-9" style={{ color: theme.colors.accent }}>
            +
          </Text>
        )}
      </View>
      <Text className="text-md mt-1 font-bold" style={{ color: theme.colors.headingPrimary }}>
        Import
      </Text>
      <Text className="mt-1 text-sm opacity-80" style={{ color: theme.colors.textMuted }}>
        {isImporting ? "Importing..." : "Select .md file"}
      </Text>
    </Pressable>
  );
});

ImportCard.displayName = "ImportCard";
