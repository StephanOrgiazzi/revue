import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { MarkdownTextSizeSection } from "@/shared/ui/MarkdownTextSizeSection";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

const mockUseMarkdownTextSizeSlider = jest.fn();

jest.mock("@/shared/ui/MarkdownTextSizeSection/useMarkdownTextSizeSlider", () => ({
  useMarkdownTextSizeSlider: (args: unknown) => mockUseMarkdownTextSizeSlider(args),
}));

describe("MarkdownTextSizeSection", () => {
  beforeEach(() => {
    mockUseMarkdownTextSizeSlider.mockReset();
  });

  it("renders slider semantics and binds layout handler", () => {
    const onTrackLayout = jest.fn();
    const onSelectMarkdownTextSizeLevel = jest.fn();
    mockUseMarkdownTextSizeSlider.mockReturnValue({
      activeTrackProgressRatio: 0.5,
      onTrackLayout,
      panHandlers: {},
      thumbLeftOffset: 44,
      thumbSize: 18,
      trackWidth: 120,
    });
    const { getByLabelText, getByText } = render(
      <MarkdownTextSizeSection
        theme={lightTheme}
        activeMarkdownTextSizeLevel={3}
        onSelectMarkdownTextSizeLevel={onSelectMarkdownTextSizeLevel}
      />,
    );

    const slider = getByLabelText("Markdown text size");
    fireEvent(slider, "layout", { nativeEvent: { layout: { width: 220 } } });

    expect(onTrackLayout).toHaveBeenCalled();
    expect(getByText("Text Size")).toBeTruthy();
    expect(mockUseMarkdownTextSizeSlider).toHaveBeenCalledWith({
      activeMarkdownTextSizeLevel: 3,
      onSelectMarkdownTextSizeLevel,
    });
  });
});
