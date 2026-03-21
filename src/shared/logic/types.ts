export type ReportStorageError = (
  operation: StorageOperation,
  storagePath: string,
  error: unknown,
) => void;

export type StorageAdapter = {
  read: () => string | undefined;
  write: (value: string) => void;
};

type StorageOperation = "read" | "write";
