import React from "react";
import { render } from "@testing-library/react-native";

import { ReaderEmptyState } from "@/features/reader/components/ReaderEmptyState";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

describe("ReaderEmptyState", () => {
  it("renders empty message with expected typography and width", () => {
    const { getByText } = render(<ReaderEmptyState theme={lightTheme} contentWidth={420} />);
    const message = getByText("This article is empty.");

    expect(message).toBeVisible();
    expect(message.props.selectable).toBe(true);
    expect(message).toHaveStyle({
      width: 420,
      color: lightTheme.colors.textSecondary,
      fontSize: lightTheme.typography.bodySize,
      lineHeight: lightTheme.typography.bodyLineHeight,
      fontFamily: "sans-serif",
    });
  });
});
