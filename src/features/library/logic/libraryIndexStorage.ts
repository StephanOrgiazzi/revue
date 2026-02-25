import type { LibraryIndex, LibraryItem } from "@/features/library/logic/types";
import { createPlatformStorage } from "@/shared/logic/platformStorage";

const LIBRARY_INDEX_KEY = "library_index";
let cachedRawLibraryIndex: string | undefined;
let cachedParsedLibraryIndex: LibraryIndex = {};

const storage = createPlatformStorage({
  key: LIBRARY_INDEX_KEY,
});

function cloneLibraryItem(item: LibraryItem): LibraryItem {
  return {
    ...item,
    tags: [...item.tags],
  };
}

function cloneLibraryIndex(index: LibraryIndex): LibraryIndex {
  const clonedIndex: LibraryIndex = {};

  for (const [id, item] of Object.entries(index)) {
    clonedIndex[id] = cloneLibraryItem(item);
  }

  return clonedIndex;
}

export function getLibraryIndex(): LibraryIndex {
  const raw = storage.read();
  if (!raw) {
    cachedRawLibraryIndex = undefined;
    cachedParsedLibraryIndex = {};
    return {};
  }

  if (raw !== cachedRawLibraryIndex) {
    try {
      const parsed = JSON.parse(raw) as LibraryIndex;
      cachedRawLibraryIndex = raw;
      cachedParsedLibraryIndex = cloneLibraryIndex(parsed);
    } catch {
      cachedRawLibraryIndex = undefined;
      cachedParsedLibraryIndex = {};
    }
  }

  return cloneLibraryIndex(cachedParsedLibraryIndex);
}

export function saveLibraryIndex(index: LibraryIndex): void {
  const serializedIndex = JSON.stringify(index);
  cachedRawLibraryIndex = serializedIndex;
  cachedParsedLibraryIndex = cloneLibraryIndex(index);
  storage.write(serializedIndex);
}
