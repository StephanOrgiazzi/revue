import { useEffect, useMemo, useState } from "react";
import type { CustomBlockRenderer } from "react-native-render-html";
import { useContentWidth, useNormalizedUrl } from "react-native-render-html";
import { Image, ScrollView, Text, View, type ImageLoadEvent } from "react-native";

import {
  READER_IMAGE_BORDERLESS_STYLE,
  READER_IMAGE_CORNER_RADIUS,
} from "@/features/reader/logic/readerImageStyles";

const HORIZONTAL_SCROLL_CONTAINER_STYLE = {
  width: "100%",
} as const;

const HORIZONTAL_SCROLL_CONTENT_CONTAINER_STYLE = {
  minWidth: "100%",
} as const;

const IMAGE_MIN_HEIGHT = 120;

const IMAGE_DEFAULT_ASPECT_RATIO = 16 / 9;

const IMAGE_CONTAINER_STYLE = {
  width: "100%",
  ...READER_IMAGE_BORDERLESS_STYLE,
  overflow: "hidden",
} as const;

const IMAGE_STYLE_BASE = {
  width: "100%",
  borderRadius: READER_IMAGE_CORNER_RADIUS,
} as const;

const IMAGE_CAPTION_STYLE = {
  textAlign: "center",
  fontSize: 13,
  lineHeight: 18,
  fontStyle: "italic",
  letterSpacing: 0.2,
  paddingHorizontal: 12,
  paddingTop: 8,
  paddingBottom: 10,
  opacity: 0.78,
} as const;

const horizontalScrollableBlockRenderer: CustomBlockRenderer =
  function HorizontalScrollableBlockRenderer({ TDefaultRenderer, ...props }) {
    return (
      <ScrollView
        testID="reader-horizontal-scroll-block"
        horizontal
        style={HORIZONTAL_SCROLL_CONTAINER_STYLE}
        nestedScrollEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={HORIZONTAL_SCROLL_CONTENT_CONTAINER_STYLE}
      >
        <View style={HORIZONTAL_SCROLL_CONTENT_CONTAINER_STYLE}>
          <TDefaultRenderer {...props} />
        </View>
      </ScrollView>
    );
  };

const imageRenderer: CustomBlockRenderer = function ImageRenderer({ tnode, style }) {
  const contentWidth = useContentWidth();

  const sourceUri = useNormalizedUrl(tnode.attributes.src ?? "");

  const altText = tnode.attributes.alt?.trim() || "Image unavailable";

  const captionText = tnode.attributes.title?.trim();

  const altColor = tnode.styles.nativeTextFlow.color ?? "#667085";

  const [aspectRatio, setAspectRatio] = useState<number>(IMAGE_DEFAULT_ASPECT_RATIO);

  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setAspectRatio(IMAGE_DEFAULT_ASPECT_RATIO);
    setHasLoadError(false);
  }, [sourceUri]);

  const imageHeight = useMemo(() => {
    const normalizedAspectRatio =
      Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : IMAGE_DEFAULT_ASPECT_RATIO;
    return Math.max(IMAGE_MIN_HEIGHT, Math.round(contentWidth / normalizedAspectRatio));
  }, [aspectRatio, contentWidth]);

  if (!sourceUri) {
    return null;
  }

  if (hasLoadError) {
    return (
      <View
        style={[
          style,
          IMAGE_CONTAINER_STYLE,
          { minHeight: imageHeight, justifyContent: "center", paddingVertical: 16 },
        ]}
      >
        <Text style={{ color: altColor, textAlign: "center", paddingHorizontal: 16 }}>
          {altText}
        </Text>
      </View>
    );
  }

  return (
    <View style={[style, IMAGE_CONTAINER_STYLE]}>
      <Image
        source={{ uri: sourceUri }}
        style={[IMAGE_STYLE_BASE, { height: imageHeight }]}
        resizeMode="contain"
        accessibilityLabel={altText}
        onLoad={({ nativeEvent }: ImageLoadEvent) => {
          const width = nativeEvent.source.width;

          const height = nativeEvent.source.height;
          if (width > 0 && height > 0) {
            setAspectRatio(width / height);
          }
        }}
        onError={() => {
          if (__DEV__) {
            console.warn("[reader] Failed to load image URI:", sourceUri);
          }
          setHasLoadError(true);
        }}
      />
      {captionText ? (
        <Text style={[IMAGE_CAPTION_STYLE, { color: altColor }]}>{captionText}</Text>
      ) : null}
    </View>
  );
};

export const readerHtmlRenderers = {
  pre: horizontalScrollableBlockRenderer,
  table: horizontalScrollableBlockRenderer,
  img: imageRenderer,
};
