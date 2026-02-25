import React from "react";
import { render } from "@testing-library/react-native";

import { ReaderArticleHeader } from "@/features/reader/components/ReaderArticleHeader";
import { lightTheme } from "@/shared/themes/definitions/lightTheme";

describe("ReaderArticleHeader", () => {
  it("renders title and metadata", () => {
    const { getByText } = render(
      <ReaderArticleHeader
        theme={lightTheme}
        contentWidth={420}
        title="A Great Article"
        articleMeta="Jan 1, 2026"
      />,
    );

    expect(getByText("A Great Article")).toBeTruthy();
    expect(getByText("Jan 1, 2026")).toBeTruthy();
  });
});
