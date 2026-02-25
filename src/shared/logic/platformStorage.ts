import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { createWebStorage } from "@/shared/logic/web/storage";

const DEFAULT_STORAGE_DIRECTORY = "storage";
const STORAGE_DIRECTORY_CREATE_OPTIONS = {
  idempotent: true,
  intermediates: true,
} as const;
const STORAGE_FILE_CREATE_OPTIONS = {
  intermediates: true,
} as const;

type CreatePlatformStorageInput = {
  key: string;
  fileName?: string;
  directoryName?: string;
};

type StorageOperation = "read" | "write";

export type StorageAdapter = {
  read: () => string | undefined;
  write: (value: string) => void;
};

export type ReportStorageError = (
  operation: StorageOperation,
  storagePath: string,
  error: unknown,
) => void;

const reportStorageError: ReportStorageError = (operation, storagePath, error) => {
  if (!__DEV__) {
    return;
  }

  console.warn(`[platformStorage] Failed to ${operation} ${storagePath}`, error);
};

function createNativeStorage(directoryName: string, fileName: string): StorageAdapter {
  const storageDirectory = new Directory(Paths.document, directoryName);
  const storageFile = new File(storageDirectory, fileName);
  const storagePath = `${directoryName}/${fileName}`;
  let hasCachedValue = false;
  let cachedValue: string | undefined;
  let hasEnsuredStorageDirectory = false;
  let hasEnsuredStorageFile = false;

  function ensureStorageFile(): void {
    if (!hasEnsuredStorageDirectory) {
      storageDirectory.create(STORAGE_DIRECTORY_CREATE_OPTIONS);
      hasEnsuredStorageDirectory = true;
    }

    if (hasEnsuredStorageFile) {
      return;
    }

    if (!storageFile.exists) {
      storageFile.create(STORAGE_FILE_CREATE_OPTIONS);
    }

    hasEnsuredStorageFile = true;
  }

  return {
    read: () => {
      if (hasCachedValue) {
        return cachedValue;
      }

      try {
        if (!storageFile.exists) {
          hasCachedValue = true;
          cachedValue = undefined;
          return cachedValue;
        }

        const value = storageFile.textSync();
        cachedValue = value === "" ? undefined : value;
        hasCachedValue = true;
        return cachedValue;
      } catch (error) {
        reportStorageError("read", storagePath, error);
        return undefined;
      }
    },
    write: (value) => {
      if (hasCachedValue && cachedValue === value) {
        return;
      }

      try {
        ensureStorageFile();

        storageFile.write(value);
        cachedValue = value;
        hasCachedValue = true;
      } catch (error) {
        reportStorageError("write", storagePath, error);
      }
    },
  };
}

export function createPlatformStorage({
  key,
  fileName = `${key}.json`,
  directoryName = DEFAULT_STORAGE_DIRECTORY,
}: CreatePlatformStorageInput): StorageAdapter {
  if (Platform.OS === "web") {
    return createWebStorage(`${directoryName}/${fileName}`, reportStorageError);
  }

  return createNativeStorage(directoryName, fileName);
}
