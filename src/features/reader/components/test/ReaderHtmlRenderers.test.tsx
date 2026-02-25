import React from "react";
import { ScrollView, Text, View } from "react-native";
import { render } from "@testing-library/react-native";

import { readerHtmlRenderers } from "@/features/reader/components/ReaderHtmlRenderers";

describe("readerHtmlRenderers", () => {
  it("wraps table blocks in a horizontal scroll container", () => {
    const TableRenderer = readerHtmlRenderers.table as any;
    const defaultRenderer = jest.fn((props: { marker?: string }) => (
      <Text>{props.marker ?? "Rendered block"}</Text>
    ));
    const { UNSAFE_getByType, UNSAFE_getAllByType, getByText } = render(
      <TableRenderer TDefaultRenderer={defaultRenderer} marker="table-marker" />,
    );
    const scrollContainer = UNSAFE_getByType(ScrollView);
    const innerContainer = UNSAFE_getAllByType(View).find(
      (node) => node.props.style?.minWidth === "100%",
    );

    expect(scrollContainer.props.horizontal).toBe(true);
    expect(scrollContainer.props.nestedScrollEnabled).toBe(true);
    expect(scrollContainer.props.showsHorizontalScrollIndicator).toBe(true);
    expect(scrollContainer.props.style).toEqual({ width: "100%" });
    expect(scrollContainer.props.contentContainerStyle).toEqual({ minWidth: "100%" });
    expect(innerContainer).toBeDefined();
    expect(innerContainer?.props.style).toEqual({ minWidth: "100%" });
    expect(defaultRenderer).toHaveBeenCalledTimes(1);
    const [firstArg] = defaultRenderer.mock.calls[0] ?? [];
    expect(firstArg).toEqual(expect.objectContaining({ marker: "table-marker" }));
    expect(getByText("table-marker")).toBeVisible();
  });

  it("wraps pre blocks in a horizontal scroll container", () => {
    const PreRenderer = readerHtmlRenderers.pre as any;
    const { UNSAFE_getByType, getByText } = render(
      <PreRenderer TDefaultRenderer={() => <Text>Code block</Text>} />,
    );
    const scrollContainer = UNSAFE_getByType(ScrollView);

    expect(scrollContainer.props.horizontal).toBe(true);
    expect(scrollContainer.props.bounces).toBe(false);
    expect(getByText("Code block")).toBeVisible();
  });
});
