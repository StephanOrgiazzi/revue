import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { LibraryItem, LibraryItemId } from "@/features/library/logic/types";
import { LibraryGrid } from "@/features/library/components/LibraryGrid";
import { useLibrary } from "@/features/library/hooks/useLibrary";
import { triggerLongPressHaptic, triggerSelectionTickHaptic } from "@/shared/logic/haptics";
import { useDisclosure } from "@/shared/logic/useDisclosure";
import { ControlsSheet } from "@/shared/ui/ControlsSheet";
import { FloatingMenuButton } from "@/shared/ui/FloatingMenuButton";
import { THEME_OPTIONS } from "@/shared/themes/themes";
import { useThemePreferences } from "@/shared/themes/useThemePreferences";
import { ActionDialog } from "@/shared/ui/ActionDialog";
import { ScreenContainer } from "@/shared/ui/ScreenContainer";

export const LibraryScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, themeId, setThemeId } = useThemePreferences();
  const [selectedArticle, setSelectedArticle] = useState<LibraryItem | null>(null);
  const {
    isOpen: isControlsSheetVisible,
    open: handleOpenControls,
    close: handleCloseControls,
  } = useDisclosure();
  const [floatingMenuInstanceKey, setFloatingMenuInstanceKey] = useState(0);
  const {
    items,
    isImporting,
    pendingArticleIds,
    errorMessage,
    itemCountLabel,
    pendingAutoOpenArticleId,
    consumePendingAutoOpenArticleId,
    importArticle,
    removeArticle,
  } = useLibrary();

  const pendingArticleIdsSet = useMemo(() => new Set(pendingArticleIds), [pendingArticleIds]);

  const handleOpenArticle = useCallback(
    (articleId: LibraryItemId) => {
      if (pendingArticleIdsSet.has(articleId)) {
        return;
      }

      triggerSelectionTickHaptic();

      router.push(`/reader/${encodeURIComponent(articleId)}`);
    },
    [pendingArticleIdsSet, router],
  );

  const handleArticleLongPress = useCallback((article: LibraryItem) => {
    triggerLongPressHaptic();
    setSelectedArticle(article);
  }, []);

  const closeArticleActionDialog = useCallback(() => {
    setSelectedArticle(null);
  }, []);
  const handleImport = useCallback(() => {
    void importArticle();
  }, [importArticle]);

  useFocusEffect(
    useCallback(() => {
      setFloatingMenuInstanceKey((currentKey) => currentKey + 1);

      return undefined;
    }, []),
  );

  useEffect(() => {
    if (!pendingAutoOpenArticleId) {
      return;
    }

    router.push(`/reader/${encodeURIComponent(pendingAutoOpenArticleId)}`);
    consumePendingAutoOpenArticleId();
  }, [consumePendingAutoOpenArticleId, pendingAutoOpenArticleId, router]);

  const articleActions = useMemo(() => {
    if (!selectedArticle) {
      return [];
    }

    return [
      {
        label: "Delete",
        style: "destructive" as const,
        onPress: () => {
          void removeArticle(selectedArticle);
        },
      },
      {
        label: "Cancel",
        style: "cancel" as const,
      },
    ];
  }, [removeArticle, selectedArticle]);

  return (
    <ScreenContainer backgroundColor={theme.colors.pageBackground}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      <View className="mb-5 mt-4">
        <Text className="text-4xl font-bold" style={{ color: theme.colors.headingPrimary }}>
          Revue
        </Text>
        <Text className="mt-0.5 text-base" style={{ color: theme.colors.textMuted }}>
          Library
        </Text>
      </View>

      {errorMessage ? (
        <Text className="mb-2" style={{ color: theme.colors.error }}>
          {errorMessage}
        </Text>
      ) : null}
      <Text className="mb-2 text-xs" style={{ color: theme.colors.textMuted }}>
        {itemCountLabel}
      </Text>

      <LibraryGrid
        theme={theme}
        items={items}
        isImporting={isImporting}
        pendingArticleIds={pendingArticleIds}
        onImport={handleImport}
        onOpenArticle={handleOpenArticle}
        onArticleLongPress={handleArticleLongPress}
      />

      <ActionDialog
        visible={selectedArticle !== null}
        title={selectedArticle?.title ?? ""}
        message="Choose an action"
        actions={articleActions}
        onClose={closeArticleActionDialog}
      />

      <FloatingMenuButton
        key={`library-fab-${floatingMenuInstanceKey}`}
        bottomOffset={Math.max(24, insets.bottom + 12)}
        theme={theme}
        accessibilityLabel="Open library display settings"
        onPress={handleOpenControls}
      />

      <ControlsSheet
        visible={isControlsSheetVisible}
        theme={theme}
        showTableOfContents={false}
        themeOptions={THEME_OPTIONS}
        activeThemeId={themeId}
        onSelectTheme={setThemeId}
        onClose={handleCloseControls}
      />
    </ScreenContainer>
  );
};
