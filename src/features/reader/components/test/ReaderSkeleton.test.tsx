import React from "react";
import { render } from "@testing-library/react-native";
import Animated from "react-native-reanimated";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.cancelAnimation = jest.fn();
  Reanimated.useReducedMotion = () => false;
  Reanimated.ReduceMotion = { System: "system" };
  return Reanimated;
});

import { ReaderSkeleton } from "@/features/reader/components/ReaderSkeleton";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

function getWidthValues(
  animatedNodes: Array<{ props: { style: unknown } }>,
): Array<number | string> {
  return animatedNodes
    .map((node) => {
      const styles = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
      const staticStyle = styles.find(
        (style) =>
          style &&
          typeof style === "object" &&
          "width" in (style as object) &&
          "maxWidth" in (style as object),
      ) as { width?: number | string } | undefined;

      return staticStyle?.width;
    })
    .filter((width): width is number | string => width !== undefined);
}

describe("ReaderSkeleton", () => {
  it("renders header bars in addition to paragraph rows when header is shown", () => {
    const { UNSAFE_getAllByType } = render(
      <ReaderSkeleton
        theme={lightTheme}
        contentWidth={360}
        horizontalPadding={20}
        verticalPadding={16}
        showHeader
      />,
    );
    const animatedBars = UNSAFE_getAllByType(Animated.View) as Array<{ props: { style: unknown } }>;
    const widths = getWidthValues(animatedBars);

    expect(widths).toHaveLength(17);
    expect(widths).toContain("52%");
    expect(widths).toContain("40%");
  });

  it("renders only paragraph rows when header is hidden", () => {
    const { UNSAFE_getAllByType } = render(
      <ReaderSkeleton
        theme={lightTheme}
        contentWidth={360}
        horizontalPadding={20}
        verticalPadding={16}
        showHeader={false}
      />,
    );
    const animatedBars = UNSAFE_getAllByType(Animated.View) as Array<{ props: { style: unknown } }>;
    const widths = getWidthValues(animatedBars);

    expect(widths).toHaveLength(15);
    expect(widths).not.toContain("52%");
    expect(widths).not.toContain("40%");
  });
});
