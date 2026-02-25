import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import { ReaderArticleContent } from "@/features/reader/components/ReaderArticleContent";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

jest.mock("react-native-render-html", () => ({
  RenderHTMLSource: ({ source }: any) => {
    const { Text } = require("react-native");
    return <Text>{`HTML:${source.html}`}</Text>;
  },
}));

jest.mock("@/features/reader/components/ReaderSkeleton", () => ({
  ReaderSkeleton: () => {
    const { Text } = require("react-native");
    return <Text>Loading Skeleton</Text>;
  },
}));

describe("ReaderArticleContent", () => {
  const baseProps = {
    articleScrollRef: { current: null },
    contentContainerStyle: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      alignItems: "center" as const,
    },
    onContentSizeChange: jest.fn(),
    onScroll: jest.fn(),
    shouldSuppressListHeader: false,
    listHeaderComponent: <Text>Header</Text>,
    theme: lightTheme,
    htmlContentWidth: 360,
    horizontalPadding: 20,
    shouldShowArticleHeader: true,
    onBlockLayout: jest.fn(),
  };

  it("renders loading state", () => {
    const { getByText } = render(
      <ReaderArticleContent
        {...baseProps}
        isLoading
        isContentEmpty={false}
        listEmptyComponent={<Text>Empty</Text>}
        htmlBlocks={[]}
      />,
    );
    expect(getByText("Loading Skeleton")).toBeTruthy();
  });

  it("renders empty state when content is empty", () => {
    const { getByText } = render(
      <ReaderArticleContent
        {...baseProps}
        isLoading={false}
        isContentEmpty
        listEmptyComponent={<Text>Empty</Text>}
        htmlBlocks={[]}
      />,
    );
    expect(getByText("Empty")).toBeTruthy();
  });

  it("renders html blocks and reports layout", () => {
    const { getByText, getAllByText } = render(
      <ReaderArticleContent
        {...baseProps}
        isLoading={false}
        isContentEmpty={false}
        listEmptyComponent={<Text>Empty</Text>}
        htmlBlocks={["<p>A</p>", "<p>A</p>"]}
      />,
    );

    expect(getAllByText("HTML:<p>A</p>")).toHaveLength(2);
    expect(getByText("Header")).toBeTruthy();
  });
});
