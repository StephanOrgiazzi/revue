import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from "react-native";

import type { ReaderHeading } from "@/features/reader/logic/markdown/types";
import type { LibraryItemId } from "@/shared/library/types";

import {
  readArticleReadingPosition,
  saveArticleReadingPosition,
} from "@/features/reader/logic/readerRepository";
import {
  resolveAnchorScrollOffset,
  resolveHeadingForScrollOffset,
  TITLE_TOC_BLOCK_INDEX,
} from "@/features/reader/logic/readerTableOfContents";

const MIN_SCROLL_OFFSET_TO_PERSIST_READING_POSITION = 120;

type ActiveHeadingSlug = string | null;
type ReaderPositionRefs = {
  blockOffsetsRef: React.MutableRefObject<Record<number, number>>;
  restorePhaseRef: React.MutableRefObject<RestorePhase>;
  storedReadingPositionRef: React.MutableRefObject<StoredReadingPosition>;
  activeHeadingSlugRef: React.MutableRefObject<ActiveHeadingSlug>;
  currentScrollOffsetYRef: React.MutableRefObject<number>;
  hasMeasuredContentRef: React.MutableRefObject<boolean>;
};

type ReaderPositionState = {
  refs: ReaderPositionRefs;
  restorePhase: RestorePhase;
  setRestorePhaseState: React.Dispatch<React.SetStateAction<RestorePhase>>;
  storedReadingPosition: StoredReadingPosition;
  setStoredReadingPosition: React.Dispatch<React.SetStateAction<StoredReadingPosition>>;
  activeHeadingSlug: ActiveHeadingSlug;
  setActiveHeadingSlug: React.Dispatch<React.SetStateAction<ActiveHeadingSlug>>;
};

type ReaderRestoreUiState = {
  isReadingPositionRestoreReady: boolean;
  isRestoringReadingPosition: boolean;
  shouldSuppressListHeader: boolean;
};

type RestorePhase = "pending" | "ready";

type RestoreState = {
  storedReadingPosition: StoredReadingPosition;
  restorePhase: RestorePhase;
};

type StoredReadingPosition = {
  anchorSlug: ActiveHeadingSlug;
  scrollOffsetY: number | null;
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

  const {
    refs,
    restorePhase,
    setRestorePhaseState,
    storedReadingPosition,
    setStoredReadingPosition,
    activeHeadingSlug,
    setActiveHeadingSlug,
  } = useReaderPositionState(initialRestorePhase, initialStoredReadingPosition);

  const {
    blockOffsetsRef,
    restorePhaseRef,
    storedReadingPositionRef,
    activeHeadingSlugRef,
    currentScrollOffsetYRef,
    hasMeasuredContentRef,
  } = refs;

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
    if (isReadingPositionUnchanged(currentPosition, position)) {
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

  useLayoutEffect(() => {
    syncActiveHeadingForTableOfContents(
      activeHeadingSlugRef,
      storedReadingPositionRef,
      tocHeadings,
      setResolvedActiveHeadingSlug,
    );
  }, [tocHeadings, setResolvedActiveHeadingSlug]);

  useEffect(() => {
    blockOffsetsRef.current = {};
  }, [htmlBlocks]);

  useLayoutEffect(() => {
    resetReaderPositionState({
      articleId,
      refs,
      setResolvedActiveHeadingSlug,
      setStoredReadingPositionValue,
      setRestorePhase,
    });
  }, [articleId, setResolvedActiveHeadingSlug, setRestorePhase, setStoredReadingPositionValue]);

  const persistReadingPosition = useCallback(() => {
    if (!articleId) {
      return;
    }

    const roundedScrollOffsetY = Math.max(0, Math.round(currentScrollOffsetYRef.current));
    if (roundedScrollOffsetY < MIN_SCROLL_OFFSET_TO_PERSIST_READING_POSITION) {
      saveArticleReadingPosition(articleId, {
        anchorSlug: null,
        scrollOffsetY: null,
      });
      return;
    }

    saveArticleReadingPosition(articleId, {
      anchorSlug: activeHeadingSlugRef.current,
      scrollOffsetY: roundedScrollOffsetY,
    });
  }, [articleId]);

  const restoreStoredReadingPositionIfReady = useCallback(() => {
    restoreStoredReadingPosition({
      isLoading,
      tocHeadings,
      refs,
      scrollToArticleOffset,
      setResolvedActiveHeadingSlug,
      setRestorePhase,
    });
  }, [
    isLoading,
    tocHeadings,
    refs,
    scrollToArticleOffset,
    setResolvedActiveHeadingSlug,
    setRestorePhase,
  ]);

  useLayoutEffect(() => {
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

      if (
        restorePhaseRef.current === "pending" &&
        hasStoredRestoreTarget(storedReadingPositionRef.current)
      ) {
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

  const { isReadingPositionRestoreReady, isRestoringReadingPosition, shouldSuppressListHeader } =
    resolveReaderRestoreUiState({
      isLoading,
      restorePhase,
      storedReadingPosition,
      tocHeadings,
    });

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

function getStoredReadingPosition(articleId: LibraryItemId | undefined): StoredReadingPosition {
  if (!articleId) {
    return {
      anchorSlug: null,
      scrollOffsetY: null,
    };
  }

  const { anchorSlug, scrollOffsetY } = readArticleReadingPosition(articleId);
  return {
    anchorSlug,
    scrollOffsetY,
  };
}

function hasStoredRestoreTarget(position: StoredReadingPosition): boolean {
  return position.scrollOffsetY !== null || Boolean(position.anchorSlug);
}

function isReadingPositionUnchanged(
  currentPosition: StoredReadingPosition,
  nextPosition: StoredReadingPosition,
): boolean {
  return (
    currentPosition.anchorSlug === nextPosition.anchorSlug &&
    currentPosition.scrollOffsetY === nextPosition.scrollOffsetY
  );
}

function resetReaderPositionState(args: {
  articleId: LibraryItemId | undefined;
  refs: ReaderPositionRefs;
  setResolvedActiveHeadingSlug: (headingSlug: ActiveHeadingSlug) => void;
  setStoredReadingPositionValue: (position: StoredReadingPosition) => void;
  setRestorePhase: (phase: RestorePhase) => void;
}): void {
  const {
    articleId,
    refs,
    setResolvedActiveHeadingSlug,
    setStoredReadingPositionValue,
    setRestorePhase,
  } = args;

  refs.blockOffsetsRef.current = {};
  refs.hasMeasuredContentRef.current = false;
  setResolvedActiveHeadingSlug(null);
  refs.currentScrollOffsetYRef.current = 0;

  const { storedReadingPosition, restorePhase } = resolveRestoreState(articleId);
  setStoredReadingPositionValue(storedReadingPosition);
  refs.activeHeadingSlugRef.current = storedReadingPosition.anchorSlug;
  refs.currentScrollOffsetYRef.current = storedReadingPosition.scrollOffsetY ?? 0;
  setRestorePhase(restorePhase);
}

function resolveReaderRestoreUiState(args: {
  isLoading: boolean;
  restorePhase: RestorePhase;
  storedReadingPosition: StoredReadingPosition;
  tocHeadings: ReaderHeading[];
}): ReaderRestoreUiState {
  const { isLoading, restorePhase, storedReadingPosition, tocHeadings } = args;
  const isReadingPositionRestoreReady = restorePhase === "ready";
  const isRestoringToTopPosition = resolveTopRestoreState(storedReadingPosition, tocHeadings);

  return {
    isReadingPositionRestoreReady,
    isRestoringReadingPosition:
      !isLoading && !isReadingPositionRestoreReady && !isRestoringToTopPosition,
    shouldSuppressListHeader: !isReadingPositionRestoreReady && !isRestoringToTopPosition,
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

function resolveTopRestoreState(
  position: StoredReadingPosition,
  tocHeadings: ReaderHeading[],
): boolean {
  if (position.scrollOffsetY !== null) {
    return position.scrollOffsetY <= 0;
  }

  return Boolean(
    position.anchorSlug && tocHeadings[0] && tocHeadings[0].slug === position.anchorSlug,
  );
}

function restoreStoredReadingPosition(args: {
  isLoading: boolean;
  tocHeadings: ReaderHeading[];
  refs: ReaderPositionRefs;
  scrollToArticleOffset: (offsetY: number, animated: boolean) => void;
  setResolvedActiveHeadingSlug: (headingSlug: ActiveHeadingSlug) => void;
  setRestorePhase: (phase: RestorePhase) => void;
}): void {
  const {
    isLoading,
    tocHeadings,
    refs,
    scrollToArticleOffset,
    setResolvedActiveHeadingSlug,
    setRestorePhase,
  } = args;

  if (isLoading || refs.restorePhaseRef.current === "ready") {
    return;
  }

  const { anchorSlug: storedAnchorSlug, scrollOffsetY: storedScrollOffsetY } =
    refs.storedReadingPositionRef.current;

  if (storedScrollOffsetY !== null) {
    if (storedScrollOffsetY > 0 && !refs.hasMeasuredContentRef.current) {
      return;
    }

    scrollToArticleOffset(storedScrollOffsetY, false);
    const activeHeading = resolveHeadingForScrollOffset(
      storedScrollOffsetY,
      tocHeadings,
      refs.blockOffsetsRef.current,
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

  const blockOffset = refs.blockOffsetsRef.current[storedHeading.blockIndex];
  if (typeof blockOffset !== "number") {
    return;
  }

  scrollToArticleOffset(resolveAnchorScrollOffset(blockOffset), false);
  setResolvedActiveHeadingSlug(storedHeading.slug);
  setRestorePhase("ready");
}

function syncActiveHeadingForTableOfContents(
  activeHeadingSlugRef: ReaderPositionRefs["activeHeadingSlugRef"],
  storedReadingPositionRef: ReaderPositionRefs["storedReadingPositionRef"],
  tocHeadings: ReaderHeading[],
  setResolvedActiveHeadingSlug: (headingSlug: ActiveHeadingSlug) => void,
): void {
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
}

function useReaderPositionState(
  initialRestorePhase: RestorePhase,
  initialStoredReadingPosition: StoredReadingPosition,
): ReaderPositionState {
  const blockOffsetsRef = useRef<Record<number, number>>({});
  const restorePhaseRef = useRef<RestorePhase>(initialRestorePhase);
  const storedReadingPositionRef = useRef<StoredReadingPosition>(initialStoredReadingPosition);
  const activeHeadingSlugRef = useRef<ActiveHeadingSlug>(null);
  const currentScrollOffsetYRef = useRef(0);
  const hasMeasuredContentRef = useRef(false);

  const refs = useRef<ReaderPositionRefs>({
    blockOffsetsRef,
    restorePhaseRef,
    storedReadingPositionRef,
    activeHeadingSlugRef,
    currentScrollOffsetYRef,
    hasMeasuredContentRef,
  }).current;

  const [restorePhase, setRestorePhaseState] = useState<RestorePhase>(initialRestorePhase);

  const [storedReadingPosition, setStoredReadingPosition] = useState<StoredReadingPosition>(
    initialStoredReadingPosition,
  );

  const [activeHeadingSlug, setActiveHeadingSlug] = useState<ActiveHeadingSlug>(null);

  return {
    refs,
    restorePhase,
    setRestorePhaseState,
    storedReadingPosition,
    setStoredReadingPosition,
    activeHeadingSlug,
    setActiveHeadingSlug,
  };
}
