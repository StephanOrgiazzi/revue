import type { TableOfContentsHeading } from "@/shared/ui/types";

const READER_SHEET_SNAP_POINT = "82%";

const READER_SHEET_SNAP_POINT_RATIO = 0.82;

const READER_TOC_RESERVED_HEIGHT = 160;

export const EMPTY_HEADINGS: TableOfContentsHeading[] = [];

type ControlsSheetLayoutConfig = {
  isReaderSheet: boolean;
  snapPoints: (string | number)[] | undefined;
  isShowingTableOfContentsPanel: boolean;
  isShowingSettingsPanel: boolean;
  tocListMaxHeight: number;
  sheetTitle: string;
};

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

  const tocListFallbackMaxHeight = getTocListFallbackMaxHeight({
    canSwipeBetweenReaderPanels,
    canShowThemeSelection,
  });

  const tocListMaxHeight = isReaderSheet ? readerTocListMaxHeight : tocListFallbackMaxHeight;

  const sheetTitle = getSheetTitle({
    canSwipeBetweenReaderPanels,
    activeReaderPanel,
    showTableOfContents,
  });

  return {
    isReaderSheet,
    snapPoints,
    isShowingTableOfContentsPanel,
    isShowingSettingsPanel,
    tocListMaxHeight,
    sheetTitle,
  };
}

function getSheetTitle(params: {
  canSwipeBetweenReaderPanels: boolean;
  activeReaderPanel: "toc" | "settings";
  showTableOfContents: boolean;
}): string {
  if (params.canSwipeBetweenReaderPanels) {
    return params.activeReaderPanel === "toc" ? "Navigation" : "Settings";
  }
  return params.showTableOfContents ? "Navigation" : "Settings";
}

function getTocListFallbackMaxHeight(params: {
  canSwipeBetweenReaderPanels: boolean;
  canShowThemeSelection: boolean;
}): number {
  if (!params.canSwipeBetweenReaderPanels && params.canShowThemeSelection) {
    return 320;
  }
  return 440;
}
