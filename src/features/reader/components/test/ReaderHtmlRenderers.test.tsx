import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import { readerHtmlRenderers } from "@/features/reader/components/ReaderHtmlRenderers";

jest.mock("react-native-render-html", () => {
  const actual = jest.requireActual("react-native-render-html");
  return {
    ...actual,
    useContentWidth: () => 320,
    useNormalizedUrl: (uri: string) => uri,
  };
});

describe("readerHtmlRenderers", () => {
  it("wraps table blocks in a horizontal scroll container", () => {
    const TableRenderer = readerHtmlRenderers.table as any;

    const defaultRenderer = jest.fn((props: { marker?: string }) => (
      <Text>{props.marker ?? "Rendered block"}</Text>
    ));

    const { getByTestId, getByText } = render(
      <TableRenderer TDefaultRenderer={defaultRenderer} marker="table-marker" />,
    );

    const scrollContainer = getByTestId("reader-horizontal-scroll-block");

    expect(scrollContainer).toHaveProp("horizontal", true);
    expect(scrollContainer).toHaveProp("nestedScrollEnabled", true);
    expect(scrollContainer).toHaveProp("showsHorizontalScrollIndicator", false);
    expect(defaultRenderer).toHaveBeenCalledTimes(1);
    const [firstArg] = defaultRenderer.mock.calls[0] ?? [];
    expect(firstArg).toEqual(expect.objectContaining({ marker: "table-marker" }));
    expect(getByText("table-marker")).toBeVisible();
  });

  it("wraps pre blocks in a horizontal scroll container", () => {
    const PreRenderer = readerHtmlRenderers.pre as any;

    const { getByTestId, getByText } = render(
      <PreRenderer TDefaultRenderer={() => <Text>Code block</Text>} />,
    );

    const scrollContainer = getByTestId("reader-horizontal-scroll-block");

    expect(scrollContainer).toHaveProp("horizontal", true);
    expect(getByText("Code block")).toBeVisible();
  });
});
