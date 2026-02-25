import { useMemo, useSyncExternalStore } from "react";

import { createPlatformStorage } from "@/shared/logic/platformStorage";
import {
  DEFAULT_MARKDOWN_TEXT_SIZE_LEVEL,
  isMarkdownTextSizeLevel,
  type MarkdownTextSizeLevel,
} from "@/shared/themes/markdownTextSize";
import { DEFAULT_THEME_ID, getTheme, isThemeId, type ThemeId } from "@/shared/themes/themes";

type ThemePreferencesSnapshot = {
  themeId: ThemeId;
  markdownTextSizeLevel: MarkdownTextSizeLevel;
};

type ThemePreferences = ThemePreferencesSnapshot & {
  theme: ReturnType<typeof getTheme>;
  setThemeId: (nextThemeId: ThemeId) => void;
  setMarkdownTextSizeLevel: (nextMarkdownTextSizeLevel: MarkdownTextSizeLevel) => void;
};

type ThemePreferencesRecord = {
  themeId: ThemeId;
  markdownTextSizeLevel: MarkdownTextSizeLevel;
};

type RawThemePreferencesRecordValue = string | undefined;
type ThemePreferencesRecordParseResult = ThemePreferencesRecord | null;

const THEME_PREFERENCES_STORAGE_KEY = "theme_preferences";
const storage = createPlatformStorage({
  key: THEME_PREFERENCES_STORAGE_KEY,
});

function parseThemePreferencesRecord(
  rawValue: RawThemePreferencesRecordValue,
): ThemePreferencesRecordParseResult {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<ThemePreferencesRecord>;
    if (!isThemeId(parsedValue.themeId)) {
      return null;
    }
    return {
      themeId: parsedValue.themeId,
      markdownTextSizeLevel: isMarkdownTextSizeLevel(parsedValue.markdownTextSizeLevel)
        ? parsedValue.markdownTextSizeLevel
        : DEFAULT_MARKDOWN_TEXT_SIZE_LEVEL,
    };
  } catch {
    return null;
  }
}

function readStoredThemePreferencesSnapshot(): ThemePreferencesSnapshot | null {
  const rawValue = storage.read();
  return parseThemePreferencesRecord(rawValue);
}

function saveStoredThemePreferencesSnapshot(snapshot: ThemePreferencesSnapshot): void {
  const nextRecord: ThemePreferencesRecord = {
    themeId: snapshot.themeId,
    markdownTextSizeLevel: snapshot.markdownTextSizeLevel,
  };
  storage.write(JSON.stringify(nextRecord));
}

let pendingStorageWriteTimer: ReturnType<typeof setTimeout> | null = null;
let pendingThemePreferencesSnapshotToPersist: ThemePreferencesSnapshot | null = null;

function scheduleThemePreferencesPersistence(nextSnapshot: ThemePreferencesSnapshot): void {
  pendingThemePreferencesSnapshotToPersist = nextSnapshot;

  if (pendingStorageWriteTimer !== null) {
    return;
  }

  pendingStorageWriteTimer = setTimeout(() => {
    pendingStorageWriteTimer = null;
    const snapshotToPersist = pendingThemePreferencesSnapshotToPersist;
    pendingThemePreferencesSnapshotToPersist = null;
    if (snapshotToPersist !== null) {
      saveStoredThemePreferencesSnapshot(snapshotToPersist);
    }
  }, 0);
}

const initialThemePreferencesSnapshot = readStoredThemePreferencesSnapshot() ?? {
  themeId: DEFAULT_THEME_ID,
  markdownTextSizeLevel: DEFAULT_MARKDOWN_TEXT_SIZE_LEVEL,
};
let themePreferencesSnapshot: ThemePreferencesSnapshot = initialThemePreferencesSnapshot;
const snapshotSubscribers = new Set<() => void>();

function subscribeToThemePreferences(onSnapshotChange: () => void): () => void {
  snapshotSubscribers.add(onSnapshotChange);

  return () => {
    snapshotSubscribers.delete(onSnapshotChange);
  };
}

function getThemePreferencesSnapshot(): ThemePreferencesSnapshot {
  return themePreferencesSnapshot;
}

function emitThemePreferencesSnapshotChange() {
  snapshotSubscribers.forEach((subscriber) => subscriber());
}

function updateThemePreferencesSnapshot(nextSnapshot: ThemePreferencesSnapshot) {
  const didChange =
    nextSnapshot.themeId !== themePreferencesSnapshot.themeId ||
    nextSnapshot.markdownTextSizeLevel !== themePreferencesSnapshot.markdownTextSizeLevel;

  if (!didChange) {
    return;
  }

  themePreferencesSnapshot = nextSnapshot;
  emitThemePreferencesSnapshotChange();
}

function setThemeId(nextThemeId: ThemeId) {
  if (nextThemeId === themePreferencesSnapshot.themeId) {
    return;
  }

  const nextSnapshot: ThemePreferencesSnapshot = {
    ...themePreferencesSnapshot,
    themeId: nextThemeId,
  };
  updateThemePreferencesSnapshot(nextSnapshot);
  scheduleThemePreferencesPersistence(nextSnapshot);
}

function setMarkdownTextSizeLevel(nextMarkdownTextSizeLevel: MarkdownTextSizeLevel) {
  if (nextMarkdownTextSizeLevel === themePreferencesSnapshot.markdownTextSizeLevel) {
    return;
  }

  const nextSnapshot: ThemePreferencesSnapshot = {
    ...themePreferencesSnapshot,
    markdownTextSizeLevel: nextMarkdownTextSizeLevel,
  };
  updateThemePreferencesSnapshot(nextSnapshot);
  scheduleThemePreferencesPersistence(nextSnapshot);
}

export function useThemePreferences(): ThemePreferences {
  const snapshot = useSyncExternalStore(
    subscribeToThemePreferences,
    getThemePreferencesSnapshot,
    getThemePreferencesSnapshot,
  );
  const theme = useMemo(() => getTheme(snapshot.themeId), [snapshot.themeId]);

  return {
    ...snapshot,
    theme,
    setThemeId,
    setMarkdownTextSizeLevel,
  };
}
