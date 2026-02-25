import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from "react-native";

import {
  readLibraryItemReadingPosition,
  saveLibraryItemReadingPosition,
} from "@/features/library/logic/libraryRepository";
import type { LibraryItemId } from "@/features/library/logic/types";
import type { ReaderHeading } from "@/features/reader/logic/markdownRenderer";
import {
  resolveAnchorScrollOffset,
  resolveHeadingForScrollOffset,
  TITLE_TOC_BLOCK_INDEX,
} from "@/features/reader/logic/readerTableOfContents";

const MIN_SCROLL_OFFSET_TO_PERSIST_READING_POSITION = 120;

type RestorePhase = "pending" | "ready";
type ActiveHeadingSlug = string | null;

type StoredReadingPosition = {
  anchorSlug: ActiveHeadingSlug;
  scrollOffsetY: number | null;
};

type RestoreState = {
  storedReadingPosition: StoredReadingPosition;
  restorePhase: RestorePhase;
};

type UseReaderPositionParams = {
  articleId: LibraryItemId | undefined;
  htmlBlocks: string[];
  tocHeadings: ReaderHeading[];
  isLoading: boolean;
};

type UseReaderPositionResult = {
  articleScrollRef: React.RefObject<ScrollView | null>;
  activeHeadingSlug: ActiveHeadingSlug;
  isRestoringReadingPosition: boolean;
  isReadingPositionRestoreReady: boolean;
  shouldSuppressListHeader: boolean;
  handleSelectHeading: (heading: ReaderHeading) => void;
  handleBlockLayout: (index: number, y: number) => void;
  handleArticleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleContentSizeChange: () => void;
  persistReadingPosition: () => void;
};

function getStoredReadingPosition(articleId: LibraryItemId | undefined): StoredReadingPosition {
  if (!articleId) {
    return {
      anchorSlug: null,
      scrollOffsetY: null,
    };
  }

  const { anchorSlug, scrollOffsetY } = readLibraryItemReadingPosition(articleId);
  return {
    anchorSlug,
    scrollOffsetY,
  };
}

function resolveRestorePhase(position: StoredReadingPosition): RestorePhase {
  return position.anchorSlug === null && position.scrollOffsetY === null ? "ready" : "pending";
}

function resolveRestoreState(articleId: LibraryItemId | undefined): RestoreState {
  const storedReadingPosition = getStoredReadingPosition(articleId);
  return {
    storedReadingPosition,
    restorePhase: resolveRestorePhase(storedReadingPosition),
  };
}

export function useReaderPosition({
  articleId,
  htmlBlocks,
  tocHeadings,
  isLoading,
}: UseReaderPositionParams): UseReaderPositionResult {
  const [initialRestoreState] = useState<RestoreState>(() => resolveRestoreState(articleId));
  const { storedReadingPosition: initialStoredReadingPosition, restorePhase: initialRestorePhase } =
    initialRestoreState;
  const articleScrollRef = useRef<ScrollView>(null);
  const blockOffsetsRef = useRef<Record<number, number>>({});
  const restorePhaseRef = useRef<RestorePhase>(initialRestorePhase);
  const storedReadingPositionRef = useRef<StoredReadingPosition>(initialStoredReadingPosition);
  const activeHeadingSlugRef = useRef<ActiveHeadingSlug>(null);
  const currentScrollOffsetYRef = useRef(0);
  const hasMeasuredContentRef = useRef(false);
  const [restorePhase, setRestorePhaseState] = useState<RestorePhase>(initialRestorePhase);
  const [storedReadingPosition, setStoredReadingPosition] = useState<StoredReadingPosition>(
    initialStoredReadingPosition,
  );
  const [activeHeadingSlug, setActiveHeadingSlug] = useState<ActiveHeadingSlug>(null);

  const setRestorePhase = useCallback((phase: RestorePhase) => {
    if (restorePhaseRef.current === phase) {
      return;
    }

    restorePhaseRef.current = phase;
    setRestorePhaseState(phase);
  }, []);

  const setResolvedActiveHeadingSlug = useCallback((headingSlug: ActiveHeadingSlug) => {
    if (activeHeadingSlugRef.current === headingSlug) {
      return;
    }

    activeHeadingSlugRef.current = headingSlug;
    setActiveHeadingSlug(headingSlug);
  }, []);

  const setStoredReadingPositionValue = useCallback((position: StoredReadingPosition) => {
    const currentPosition = storedReadingPositionRef.current;
    if (
      currentPosition.anchorSlug === position.anchorSlug &&
      currentPosition.scrollOffsetY === position.scrollOffsetY
    ) {
      return;
    }

    storedReadingPositionRef.current = position;
    setStoredReadingPosition(position);
  }, []);

  const scrollToArticleOffset = useCallback((offsetY: number, animated: boolean) => {
    articleScrollRef.current?.scrollTo({
      y: offsetY,
      animated,
    });
    currentScrollOffsetYRef.current = offsetY;
  }, []);

  useEffect(() => {
    if (tocHeadings.length === 0) {
      setResolvedActiveHeadingSlug(null);
      return;
    }

    const currentHeadingSlug = activeHeadingSlugRef.current;
    if (currentHeadingSlug && tocHeadings.some((heading) => heading.slug === currentHeadingSlug)) {
      return;
    }

    const storedAnchorSlug = storedReadingPositionRef.current.anchorSlug;
    const nextHeadingSlug =
      storedAnchorSlug && tocHeadings.some((heading) => heading.slug === storedAnchorSlug)
        ? storedAnchorSlug
        : tocHeadings[0].slug;
    setResolvedActiveHeadingSlug(nextHeadingSlug);
  }, [setResolvedActiveHeadingSlug, tocHeadings]);

  useEffect(() => {
    blockOffsetsRef.current = {};
  }, [htmlBlocks]);

  useLayoutEffect(() => {
    blockOffsetsRef.current = {};
    hasMeasuredContentRef.current = false;
    setResolvedActiveHeadingSlug(null);
    currentScrollOffsetYRef.current = 0;
    const { storedReadingPosition: nextStoredReadingPosition, restorePhase: nextRestorePhase } =
      resolveRestoreState(articleId);
    setStoredReadingPositionValue(nextStoredReadingPosition);
    activeHeadingSlugRef.current = nextStoredReadingPosition.anchorSlug;
    currentScrollOffsetYRef.current = nextStoredReadingPosition.scrollOffsetY ?? 0;
    setRestorePhase(nextRestorePhase);
  }, [articleId, setResolvedActiveHeadingSlug, setRestorePhase, setStoredReadingPositionValue]);

  const persistReadingPosition = useCallback(() => {
    if (!articleId) {
      return;
    }

    const roundedScrollOffsetY = Math.max(0, Math.round(currentScrollOffsetYRef.current));
    if (roundedScrollOffsetY < MIN_SCROLL_OFFSET_TO_PERSIST_READING_POSITION) {
      saveLibraryItemReadingPosition(articleId, {
        anchorSlug: null,
        scrollOffsetY: null,
      });
      return;
    }

    saveLibraryItemReadingPosition(articleId, {
      anchorSlug: activeHeadingSlugRef.current,
      scrollOffsetY: roundedScrollOffsetY,
    });
  }, [articleId]);

  const restoreStoredReadingPositionIfReady = useCallback(() => {
    if (isLoading || restorePhaseRef.current === "ready") {
      return;
    }

    const { anchorSlug: storedAnchorSlug, scrollOffsetY: storedScrollOffsetY } =
      storedReadingPositionRef.current;

    if (storedScrollOffsetY !== null) {
      if (storedScrollOffsetY > 0 && !hasMeasuredContentRef.current) {
        return;
      }

      scrollToArticleOffset(storedScrollOffsetY, false);
      const activeHeading = resolveHeadingForScrollOffset(
        storedScrollOffsetY,
        tocHeadings,
        blockOffsetsRef.current,
      );
      setResolvedActiveHeadingSlug(activeHeading?.slug ?? null);
      setRestorePhase("ready");
      return;
    }

    if (!storedAnchorSlug || tocHeadings.length === 0) {
      setRestorePhase("ready");
      return;
    }

    const storedHeading = tocHeadings.find((heading) => heading.slug === storedAnchorSlug);
    if (!storedHeading) {
      setRestorePhase("ready");
      return;
    }

    if (storedHeading.blockIndex === TITLE_TOC_BLOCK_INDEX) {
      scrollToArticleOffset(0, false);
      setResolvedActiveHeadingSlug(storedHeading.slug);
      setRestorePhase("ready");
      return;
    }

    const blockOffset = blockOffsetsRef.current[storedHeading.blockIndex];
    if (typeof blockOffset !== "number") {
      return;
    }
    scrollToArticleOffset(resolveAnchorScrollOffset(blockOffset), false);
    setResolvedActiveHeadingSlug(storedHeading.slug);
    setRestorePhase("ready");
  }, [
    isLoading,
    scrollToArticleOffset,
    setResolvedActiveHeadingSlug,
    setRestorePhase,
    tocHeadings,
  ]);

  useEffect(() => {
    restoreStoredReadingPositionIfReady();
  }, [restoreStoredReadingPositionIfReady]);

  useEffect(
    () => () => {
      persistReadingPosition();
    },
    [persistReadingPosition],
  );

  const handleSelectHeading = useCallback(
    (heading: ReaderHeading) => {
      setResolvedActiveHeadingSlug(heading.slug);

      if (heading.blockIndex === TITLE_TOC_BLOCK_INDEX) {
        scrollToArticleOffset(0, true);
        return;
      }

      const blockOffset = blockOffsetsRef.current[heading.blockIndex];
      if (typeof blockOffset !== "number") {
        return;
      }
      scrollToArticleOffset(resolveAnchorScrollOffset(blockOffset), true);
    },
    [scrollToArticleOffset, setResolvedActiveHeadingSlug],
  );

  const handleBlockLayout = useCallback(
    (index: number, y: number) => {
      blockOffsetsRef.current[index] = y;
      hasMeasuredContentRef.current = true;
      restoreStoredReadingPositionIfReady();
    },
    [restoreStoredReadingPositionIfReady],
  );

  const handleArticleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollOffsetY = Math.max(0, event.nativeEvent.contentOffset.y);
      currentScrollOffsetYRef.current = scrollOffsetY;

      const hasStoredRestoreTarget =
        storedReadingPositionRef.current.scrollOffsetY !== null ||
        Boolean(storedReadingPositionRef.current.anchorSlug);
      if (restorePhaseRef.current === "pending" && hasStoredRestoreTarget) {
        return;
      }

      const activeHeading = resolveHeadingForScrollOffset(
        scrollOffsetY,
        tocHeadings,
        blockOffsetsRef.current,
      );
      const nextHeadingSlug = activeHeading?.slug ?? null;
      setResolvedActiveHeadingSlug(nextHeadingSlug);
    },
    [setResolvedActiveHeadingSlug, tocHeadings],
  );

  const handleContentSizeChange = useCallback(() => {
    if (isLoading) {
      return;
    }

    hasMeasuredContentRef.current = true;
    restoreStoredReadingPositionIfReady();
  }, [isLoading, restoreStoredReadingPositionIfReady]);

  const isReadingPositionRestoreReady = restorePhase === "ready";
  const { anchorSlug: storedAnchorSlug, scrollOffsetY: storedScrollOffsetY } =
    storedReadingPosition;
  const isRestoringFromAnchorOnly = storedScrollOffsetY === null;
  const isRestoringToFirstHeadingAnchor =
    Boolean(storedAnchorSlug && tocHeadings[0] && tocHeadings[0].slug === storedAnchorSlug) &&
    isRestoringFromAnchorOnly;
  const isRestoringToTopPosition =
    (storedScrollOffsetY !== null && storedScrollOffsetY <= 0) || isRestoringToFirstHeadingAnchor;
  const isRestoringReadingPosition =
    !isLoading && !isReadingPositionRestoreReady && !isRestoringToTopPosition;
  const shouldSuppressListHeader = !isReadingPositionRestoreReady && !isRestoringToTopPosition;

  return {
    articleScrollRef,
    activeHeadingSlug,
    isRestoringReadingPosition,
    isReadingPositionRestoreReady,
    shouldSuppressListHeader,
    handleSelectHeading,
    handleBlockLayout,
    handleArticleScroll,
    handleContentSizeChange,
    persistReadingPosition,
  };
}
