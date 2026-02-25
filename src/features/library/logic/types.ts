export type LibraryItemId = string;

export type LibraryItem = {
  id: LibraryItemId;
  title: string;
  localPath: string;
  tags: string[];
  createdAt: string;
  lastAnchorSlug: string | null;
  lastScrollOffsetY: number | null;
  readingProgress: number;
};

export type LibraryIndex = Record<LibraryItemId, LibraryItem>;
