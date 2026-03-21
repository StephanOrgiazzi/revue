import {
  BottomSheetBackdrop,
  type BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { type ComponentProps, type ReactNode, useCallback, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MarkdownTextSizeLevel, Theme, ThemeId, ThemeOption } from "@/shared/themes/types";
import type { TableOfContentsHeading } from "@/shared/ui/types";

import { TableOfContentsSection } from "@/shared/ui/TableOfContentsSection";

import { EMPTY_HEADINGS, getControlsSheetLayoutConfig } from "./config";
import { ControlsSheetHandle } from "./ControlsSheetHandle";
import { ControlsSheetSettingsContent } from "./ControlsSheetSettingsContent";
import { controlsSheetStyles } from "./styles";
import { useControlsSheetController } from "./useControlsSheetController";
import { useReaderPanelsPager } from "./useReaderPanelsPager";

type ControlsSheetBodyProps = {
  visible: boolean;
  theme: Theme;
  headings: TableOfContentsHeading[];
  activeHeadingSlug: string | null;
  isReaderSheet: boolean;
  sheetBottomPadding: number;
  handleReaderPanelsLayout: NonNullable<ComponentProps<typeof View>["onLayout"]>;
  canSwipeBetweenReaderPanels: boolean;
  isReaderPanelsPagerReady: boolean;
  readerPanelsSwipeGesture: ReturnType<typeof useReaderPanelsPager>["readerPanelsSwipeGesture"];
  readerPanelsViewportWidth: number;
  readerPanelsAnimatedStyle: ReturnType<typeof useReaderPanelsPager>["readerPanelsAnimatedStyle"];
  tocListMaxHeight: number;
  canShowThemeSelection: boolean;
  isShowingTableOfContentsPanel: boolean;
  isShowingSettingsPanel: boolean;
  settingsPanelContent: ReactNode;
  handleSelectHeadingPress: (heading: TableOfContentsHeading) => void;
};

type ControlsSheetProps = {
  visible: boolean;
  theme: Theme;
  showTableOfContents?: boolean;
  showThemeSelection?: boolean;
  headings?: TableOfContentsHeading[];
  activeHeadingSlug?: string | null;
  onSelectHeading?: (heading: TableOfContentsHeading) => void;
  onExitReader?: () => void;
  themeOptions?: readonly ThemeOption[];
  activeThemeId?: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
  showMarkdownTextSizeSelection?: boolean;
  activeMarkdownTextSizeLevel?: MarkdownTextSizeLevel;
  onSelectMarkdownTextSizeLevel?: (markdownTextSizeLevel: MarkdownTextSizeLevel) => void;
  onClose: () => void;
};

export function ControlsSheet({
  visible,
  theme,
  showTableOfContents = true,
  showThemeSelection = true,
  headings = EMPTY_HEADINGS,
  activeHeadingSlug = null,
  onSelectHeading,
  onExitReader,
  themeOptions,
  activeThemeId,
  onSelectTheme,
  showMarkdownTextSizeSelection = false,
  activeMarkdownTextSizeLevel,
  onSelectMarkdownTextSizeLevel,
  onClose,
}: ControlsSheetProps) {
  const { sheetRef, handleSheetDismiss, startClose } = useControlsSheetController({
    visible,
    onClose,
  });

  const insets = useSafeAreaInsets();

  const { height: windowHeight } = useWindowDimensions();

  const sheetBottomPadding = Math.max(16, insets.bottom);

  const canExitReader = Boolean(showTableOfContents && onExitReader);

  const canShowThemeSelection =
    showThemeSelection &&
    themeOptions !== undefined &&
    activeThemeId !== undefined &&
    onSelectTheme !== undefined;

  const canShowMarkdownTextSizeSelection =
    showMarkdownTextSizeSelection &&
    activeMarkdownTextSizeLevel !== undefined &&
    onSelectMarkdownTextSizeLevel !== undefined;

  const canShowReaderSettingsPanel = canShowThemeSelection || canShowMarkdownTextSizeSelection;

  const canSwipeBetweenReaderPanels = showTableOfContents && canShowReaderSettingsPanel;

  const {
    activeReaderPanel,
    handleReaderPanelsLayout,
    isReaderPanelsPagerReady,
    readerPanelsAnimatedStyle,
    readerPanelsSwipeGesture,
    readerPanelsViewportWidth,
  } = useReaderPanelsPager({
    visible,
    canSwipeBetweenReaderPanels,
  });

  const {
    isReaderSheet,
    isShowingSettingsPanel,
    isShowingTableOfContentsPanel,
    sheetTitle,
    snapPoints,
    tocListMaxHeight,
  } = useMemo(
    () =>
      getControlsSheetLayoutConfig({
        showTableOfContents,
        canShowThemeSelection,
        canSwipeBetweenReaderPanels,
        activeReaderPanel,
        isReaderPanelsPagerReady,
        windowHeight,
        topInset: insets.top,
        sheetBottomPadding,
      }),
    [
      activeReaderPanel,
      canShowThemeSelection,
      canSwipeBetweenReaderPanels,
      insets.top,
      isReaderPanelsPagerReady,
      sheetBottomPadding,
      showTableOfContents,
      windowHeight,
    ],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={1}
        style={[props.style, { backgroundColor: theme.colors.sheetBackdrop }]}
      />
    ),
    [theme.colors.sheetBackdrop],
  );

  const handleSelectHeadingPress = useCallback(
    (heading: TableOfContentsHeading) => startClose(() => onSelectHeading?.(heading)),
    [onSelectHeading, startClose],
  );

  const handleExitReaderPress = useCallback(
    () => startClose(() => onExitReader?.()),
    [onExitReader, startClose],
  );

  const handleSelectThemePress = useCallback(
    (themeId: ThemeId) => startClose(() => onSelectTheme?.(themeId)),
    [onSelectTheme, startClose],
  );

  const handleSelectMarkdownTextSizeLevelPress = useCallback(
    (markdownTextSizeLevel: MarkdownTextSizeLevel) => {
      onSelectMarkdownTextSizeLevel?.(markdownTextSizeLevel);
    },
    [onSelectMarkdownTextSizeLevel],
  );

  const renderHandle = useCallback(
    (_props: BottomSheetHandleProps) => (
      <ControlsSheetHandle
        theme={theme}
        sheetTitle={sheetTitle}
        canExitReader={canExitReader}
        onExitReaderPress={handleExitReaderPress}
      />
    ),
    [canExitReader, handleExitReaderPress, sheetTitle, theme],
  );

  const settingsPanelContent = (
    <ControlsSheetSettingsContent
      theme={theme}
      canShowThemeSelection={canShowThemeSelection}
      themeOptions={themeOptions}
      activeThemeId={activeThemeId}
      onSelectTheme={handleSelectThemePress}
      canShowMarkdownTextSizeSelection={canShowMarkdownTextSizeSelection}
      activeMarkdownTextSizeLevel={activeMarkdownTextSizeLevel}
      onSelectMarkdownTextSizeLevel={handleSelectMarkdownTextSizeLevelPress}
    />
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      topInset={insets.top}
      enablePanDownToClose
      enableContentPanningGesture={false}
      enableDynamicSizing={!isReaderSheet}
      enableDismissOnClose
      animateOnMount
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      backgroundStyle={[
        controlsSheetStyles.sheetBackground,
        {
          backgroundColor: theme.colors.sheetBackground,
          borderColor: theme.colors.surfaceBorder,
        },
      ]}
      onDismiss={handleSheetDismiss}
    >
      <ControlsSheetBody
        visible={visible}
        theme={theme}
        headings={headings}
        activeHeadingSlug={activeHeadingSlug}
        isReaderSheet={isReaderSheet}
        sheetBottomPadding={sheetBottomPadding}
        handleReaderPanelsLayout={handleReaderPanelsLayout}
        canSwipeBetweenReaderPanels={canSwipeBetweenReaderPanels}
        isReaderPanelsPagerReady={isReaderPanelsPagerReady}
        readerPanelsSwipeGesture={readerPanelsSwipeGesture}
        readerPanelsViewportWidth={readerPanelsViewportWidth}
        readerPanelsAnimatedStyle={readerPanelsAnimatedStyle}
        tocListMaxHeight={tocListMaxHeight}
        canShowThemeSelection={canShowThemeSelection}
        isShowingTableOfContentsPanel={isShowingTableOfContentsPanel}
        isShowingSettingsPanel={isShowingSettingsPanel}
        settingsPanelContent={settingsPanelContent}
        handleSelectHeadingPress={handleSelectHeadingPress}
      />
    </BottomSheetModal>
  );
}

function ControlsSheetBody({
  visible,
  theme,
  headings,
  activeHeadingSlug,
  isReaderSheet,
  sheetBottomPadding,
  handleReaderPanelsLayout,
  canSwipeBetweenReaderPanels,
  isReaderPanelsPagerReady,
  readerPanelsSwipeGesture,
  readerPanelsViewportWidth,
  readerPanelsAnimatedStyle,
  tocListMaxHeight,
  canShowThemeSelection,
  isShowingTableOfContentsPanel,
  isShowingSettingsPanel,
  settingsPanelContent,
  handleSelectHeadingPress,
}: ControlsSheetBodyProps) {
  return (
    <BottomSheetView style={[{ paddingBottom: sheetBottomPadding }, isReaderSheet && { flex: 1 }]}>
      <View
        style={[{ overflow: "hidden" }, isReaderSheet && { flex: 1 }]}
        onLayout={handleReaderPanelsLayout}
      >
        {canSwipeBetweenReaderPanels && isReaderPanelsPagerReady ? (
          <GestureDetector gesture={readerPanelsSwipeGesture}>
            <View style={[{ overflow: "hidden" }, isReaderSheet && { flex: 1 }]}>
              <Animated.View
                style={[
                  {
                    flexDirection: "row",
                    width: readerPanelsViewportWidth * 2,
                  },
                  isReaderSheet && { flex: 1 },
                  readerPanelsAnimatedStyle,
                ]}
              >
                <View style={[{ width: readerPanelsViewportWidth }, isReaderSheet && { flex: 1 }]}>
                  <View className="px-6" style={isReaderSheet ? { flex: 1 } : undefined}>
                    <TableOfContentsSection
                      visible={visible}
                      theme={theme}
                      headings={headings}
                      activeHeadingSlug={activeHeadingSlug}
                      onSelectHeading={handleSelectHeadingPress}
                      listMaxHeight={tocListMaxHeight}
                      showBottomDivider={false}
                    />
                  </View>
                </View>

                <View style={{ width: readerPanelsViewportWidth }}>
                  <View className="px-6">{settingsPanelContent}</View>
                </View>
              </Animated.View>
            </View>
          </GestureDetector>
        ) : (
          <View className="px-6" style={isReaderSheet ? { flex: 1 } : undefined}>
            {isShowingTableOfContentsPanel ? (
              <TableOfContentsSection
                visible={visible}
                theme={theme}
                headings={headings}
                activeHeadingSlug={activeHeadingSlug}
                onSelectHeading={handleSelectHeadingPress}
                listMaxHeight={tocListMaxHeight}
                showBottomDivider={!canSwipeBetweenReaderPanels && canShowThemeSelection}
              />
            ) : null}

            {isShowingSettingsPanel ? settingsPanelContent : null}
          </View>
        )}
      </View>
    </BottomSheetView>
  );
}
