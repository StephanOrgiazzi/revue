import type { CustomBlockRenderer } from "react-native-render-html";
import { ScrollView, View } from "react-native";

const HORIZONTAL_SCROLL_CONTAINER_STYLE = {
  width: "100%",
} as const;

const HORIZONTAL_SCROLL_CONTENT_CONTAINER_STYLE = {
  minWidth: "100%",
} as const;

const horizontalScrollableBlockRenderer: CustomBlockRenderer =
  function HorizontalScrollableBlockRenderer({ TDefaultRenderer, ...props }) {
    return (
      <ScrollView
        horizontal
        style={HORIZONTAL_SCROLL_CONTAINER_STYLE}
        nestedScrollEnabled
        bounces={false}
        showsHorizontalScrollIndicator
        contentContainerStyle={HORIZONTAL_SCROLL_CONTENT_CONTAINER_STYLE}
      >
        <View style={HORIZONTAL_SCROLL_CONTENT_CONTAINER_STYLE}>
          <TDefaultRenderer {...props} />
        </View>
      </ScrollView>
    );
  };

export const readerHtmlRenderers = {
  pre: horizontalScrollableBlockRenderer,
  table: horizontalScrollableBlockRenderer,
};
