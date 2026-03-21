export type LibraryIndex = Record<LibraryItemId, LibraryItem>;

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

export type LibraryItemId = string;

export type LibraryItemReadingPosition = {
  anchorSlug: string | null;
  scrollOffsetY: number | null;
};
