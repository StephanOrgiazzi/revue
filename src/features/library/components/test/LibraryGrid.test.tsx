import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { LibraryGrid } from "@/features/library/components/LibraryGrid";
import type { LibraryItem } from "@/features/library/logic/types";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

const mockTriggerContextClickHaptic = jest.fn();

jest.mock("@/shared/logic/haptics", () => ({
  triggerContextClickHaptic: () => mockTriggerContextClickHaptic(),
}));

describe("LibraryGrid", () => {
  const items: LibraryItem[] = [
    {
      id: "a1",
      title: "Alpha",
      localPath: "/alpha.md",
      tags: [],
      createdAt: "2024-01-10T00:00:00.000Z",
      lastAnchorSlug: null,
      lastScrollOffsetY: null,
      readingProgress: 0,
    },
    {
      id: "b2",
      title: "Beta",
      localPath: "/beta.md",
      tags: [],
      createdAt: "invalid-date",
      lastAnchorSlug: null,
      lastScrollOffsetY: null,
      readingProgress: 0,
    },
  ];

  beforeEach(() => {
    mockTriggerContextClickHaptic.mockClear();
  });

  it("renders grid cards and wires import/open/long-press actions", () => {
    const onImport = jest.fn();
    const onOpenArticle = jest.fn();
    const onArticleLongPress = jest.fn();
    const { getByText, rerender } = render(
      <LibraryGrid
        theme={lightTheme}
        items={items}
        isImporting={false}
        pendingArticleIds={["b2"]}
        onImport={onImport}
        onOpenArticle={onOpenArticle}
        onArticleLongPress={onArticleLongPress}
      />,
    );

    expect(getByText("Import")).toBeTruthy();
    expect(getByText("Alpha")).toBeTruthy();
    expect(getByText("Beta")).toBeTruthy();
    expect(getByText("Importing")).toBeTruthy();

    fireEvent.press(getByText("Import"));
    expect(mockTriggerContextClickHaptic).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("Alpha"));
    expect(onOpenArticle).toHaveBeenCalledWith("a1");

    fireEvent(getByText("Alpha"), "onLongPress");
    expect(onArticleLongPress).toHaveBeenCalledWith(items[0]);

    rerender(
      <LibraryGrid
        theme={lightTheme}
        items={items}
        isImporting={true}
        pendingArticleIds={[]}
        onImport={onImport}
        onOpenArticle={onOpenArticle}
        onArticleLongPress={onArticleLongPress}
      />,
    );

    expect(getByText("Importing...")).toBeTruthy();
    fireEvent.press(getByText("Import"));
    expect(onImport).toHaveBeenCalledTimes(1);
  });
});
