import type { TableOfContentsHeading } from "@/shared/ui/TableOfContentsSection";

const READER_SHEET_SNAP_POINT = "82%";
const READER_SHEET_SNAP_POINT_RATIO = 0.82;
const READER_TOC_RESERVED_HEIGHT = 160;

export const EMPTY_HEADINGS: TableOfContentsHeading[] = [];

type GetControlsSheetLayoutConfigParams = {
  showTableOfContents: boolean;
  canShowThemeSelection: boolean;
  canSwipeBetweenReaderPanels: boolean;
  activeReaderPanel: "toc" | "settings";
  isReaderPanelsPagerReady: boolean;
  windowHeight: number;
  topInset: number;
  sheetBottomPadding: number;
};

type ControlsSheetLayoutConfig = {
  isReaderSheet: boolean;
  snapPoints: (string | number)[] | undefined;
  isShowingTableOfContentsPanel: boolean;
  isShowingSettingsPanel: boolean;
  tocListMaxHeight: number;
  sheetTitle: string;
};

export function getControlsSheetLayoutConfig({
  showTableOfContents,
  canShowThemeSelection,
  canSwipeBetweenReaderPanels,
  activeReaderPanel,
  isReaderPanelsPagerReady,
  windowHeight,
  topInset,
  sheetBottomPadding,
}: GetControlsSheetLayoutConfigParams): ControlsSheetLayoutConfig {
  const isReaderSheet = showTableOfContents;
  const snapPoints = isReaderSheet ? [READER_SHEET_SNAP_POINT] : undefined;
  const isShowingTableOfContentsPanel =
    showTableOfContents &&
    (!canSwipeBetweenReaderPanels || !isReaderPanelsPagerReady || activeReaderPanel === "toc");
  const isShowingSettingsPanel =
    !showTableOfContents ||
    (canSwipeBetweenReaderPanels && isReaderPanelsPagerReady && activeReaderPanel === "settings");
  const readerSheetHeight = Math.max(0, (windowHeight - topInset) * READER_SHEET_SNAP_POINT_RATIO);
  const readerTocListMaxHeight = Math.max(
    220,
    Math.round(readerSheetHeight - READER_TOC_RESERVED_HEIGHT - sheetBottomPadding),
  );
  const tocListFallbackMaxHeight = canSwipeBetweenReaderPanels
    ? 440
    : canShowThemeSelection
      ? 320
      : 440;
  const tocListMaxHeight = isReaderSheet ? readerTocListMaxHeight : tocListFallbackMaxHeight;
  const sheetTitle = canSwipeBetweenReaderPanels
    ? activeReaderPanel === "toc"
      ? "Navigation"
      : "Settings"
    : showTableOfContents
      ? "Navigation"
      : "Settings";

  return {
    isReaderSheet,
    snapPoints,
    isShowingTableOfContentsPanel,
    isShowingSettingsPanel,
    tocListMaxHeight,
    sheetTitle,
  };
}
