import React from "react";
import { render } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { ScreenContainer } from ".././ScreenContainer";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require("react-native");
    return (
      <View testID="safe-area" {...props}>
        {children}
      </View>
    );
  },
}));

describe("ScreenContainer", () => {
  it("renders children inside a safe-area container", () => {
    const { getByTestId, getByText, UNSAFE_getAllByType } = render(
      <ScreenContainer>
        <Text>Test Child</Text>
      </ScreenContainer>,
    );
    const safeArea = getByTestId("safe-area");
    const contentContainer = UNSAFE_getAllByType(View).find(
      (node) => node.props.testID !== "safe-area",
    );

    expect(getByText("Test Child")).toBeVisible();
    expect(safeArea.props.style).toEqual([{ flex: 1 }, undefined]);
    expect(contentContainer).toBeDefined();
    expect(contentContainer?.props.style).toEqual([undefined, undefined]);
  });

  it("forwards edges, background, and content style", () => {
    const { getByTestId, UNSAFE_getAllByType } = render(
      <ScreenContainer
        edges={["top", "bottom"]}
        backgroundColor="#121212"
        className="pt-2"
        style={{ paddingTop: 12 }}
      >
        <Text>Configured</Text>
      </ScreenContainer>,
    );
    const safeArea = getByTestId("safe-area");
    const contentContainer = UNSAFE_getAllByType(View).find(
      (node) => node.props.testID !== "safe-area",
    );

    expect(safeArea.props.edges).toEqual(["top", "bottom"]);
    expect(safeArea.props.style).toEqual([{ flex: 1 }, { backgroundColor: "#121212" }]);
    expect(contentContainer).toBeDefined();
    expect(contentContainer?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: "#121212" })]),
    );
  });
});
