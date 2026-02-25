import type { ReportStorageError, StorageAdapter } from "@/shared/logic/platformStorage";

export function createWebStorage(
  storageKey: string,
  reportStorageError: ReportStorageError,
): StorageAdapter {
  const storagePath = `localStorage:${storageKey}`;
  let hasCachedValue = false;
  let cachedValue: string | undefined;
  let inMemoryValue: string | undefined;

  function readLocalStorageValue(): string | undefined {
    try {
      const value = globalThis.localStorage?.getItem(storageKey);
      if (value == null || value === "") {
        return undefined;
      }

      return value;
    } catch (error) {
      reportStorageError("read", storagePath, error);
      return inMemoryValue;
    }
  }

  function writeLocalStorageValue(value: string): void {
    try {
      globalThis.localStorage?.setItem(storageKey, value);
    } catch (error) {
      reportStorageError("write", storagePath, error);
    }
  }

  return {
    read: () => {
      if (hasCachedValue) {
        return cachedValue;
      }

      cachedValue = readLocalStorageValue();
      hasCachedValue = true;
      return cachedValue;
    },
    write: (value) => {
      if (hasCachedValue && cachedValue === value) {
        return;
      }

      inMemoryValue = value;
      writeLocalStorageValue(value);
      cachedValue = value;
      hasCachedValue = true;
    },
  };
}
