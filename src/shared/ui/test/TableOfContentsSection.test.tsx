import React from "react";
import { FlatList } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import {
  TableOfContentsSection,
  type TableOfContentsHeading,
} from "@/shared/ui/TableOfContentsSection";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

const mockTriggerFrequentTickHaptic = jest.fn();
const mockTriggerSelectionTickHaptic = jest.fn();

jest.mock("@/shared/logic/haptics", () => ({
  triggerFrequentTickHaptic: () => mockTriggerFrequentTickHaptic(),
  triggerSelectionTickHaptic: () => mockTriggerSelectionTickHaptic(),
}));

jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { FlatList, Pressable, Text } = require("react-native");

  const BottomSheetFlatList = React.forwardRef(
    ({ data, renderItem, ListEmptyComponent, ...props }: any, ref: React.ForwardedRef<unknown>) => {
      const mockApi = {
        scrollToIndex: jest.fn(),
        scrollToOffset: jest.fn(),
      };
      React.useImperativeHandle(ref, () => mockApi);

      if (!data || data.length === 0) {
        return <Pressable accessibilityLabel="toc-list-empty">{ListEmptyComponent}</Pressable>;
      }

      return (
        <FlatList
          {...props}
          data={data}
          renderItem={renderItem}
          ListFooterComponent={<Text accessibilityLabel="toc-list-ready">ready</Text>}
        />
      );
    },
  );

  return {
    BottomSheetFlatList,
    TouchableOpacity: Pressable,
  };
});

describe("TableOfContentsSection", () => {
  const headings: TableOfContentsHeading[] = [
    { slug: "intro", text: "Intro", level: 1, blockIndex: 0 },
    { slug: "deep", text: "Deep", level: 4, blockIndex: 1 },
    { slug: "chapter-1", text: "Chapter 1", level: 2, blockIndex: 2 },
  ];

  beforeEach(() => {
    mockTriggerFrequentTickHaptic.mockClear();
    mockTriggerSelectionTickHaptic.mockClear();
  });

  it("filters headings above level 3 and handles selection", () => {
    const onSelectHeading = jest.fn();
    const { getByText, queryByText } = render(
      <TableOfContentsSection
        visible
        theme={lightTheme}
        headings={headings}
        activeHeadingSlug="intro"
        onSelectHeading={onSelectHeading}
      />,
    );

    expect(getByText("Contents")).toBeVisible();
    expect(getByText("Intro")).toBeVisible();
    expect(getByText("Chapter 1")).toBeVisible();
    expect(queryByText("Deep")).toBeNull();

    fireEvent.press(getByText("Chapter 1"));
    expect(onSelectHeading).toHaveBeenCalledWith(expect.objectContaining({ slug: "chapter-1" }));
    expect(mockTriggerSelectionTickHaptic).toHaveBeenCalledTimes(1);
  });

  it("shows empty message when no headings are available", () => {
    const { getByText, queryByText } = render(
      <TableOfContentsSection
        visible
        theme={lightTheme}
        headings={[]}
        activeHeadingSlug={null}
        showBottomDivider={false}
        onSelectHeading={() => undefined}
      />,
    );
    expect(getByText("Contents")).toBeVisible();
    expect(getByText("No headings found in this article.")).toBeVisible();
    expect(queryByText("Intro")).toBeNull();
  });

  it("triggers scroll haptic when scrolling between heading rows", () => {
    const { UNSAFE_getByType } = render(
      <TableOfContentsSection
        visible
        theme={lightTheme}
        headings={headings}
        activeHeadingSlug={null}
        onSelectHeading={() => undefined}
      />,
    );

    const list = UNSAFE_getByType(FlatList);
    fireEvent(list, "scrollBeginDrag");
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { y: 120 },
      },
    });
    fireEvent(list, "scrollEndDrag", {
      nativeEvent: {
        velocity: { y: 0 },
      },
    });
    fireEvent(list, "momentumScrollEnd");

    expect(mockTriggerFrequentTickHaptic).toHaveBeenCalled();
  });
});
