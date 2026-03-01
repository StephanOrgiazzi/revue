export const READER_IMAGE_CORNER_RADIUS = 30;

export const READER_IMAGE_BORDERLESS_STYLE = {
  borderRadius: READER_IMAGE_CORNER_RADIUS,
  borderWidth: 0,
  borderColor: "transparent",
} as const;

export function createReaderImageTagStyle(blockGap: number) {
  return {
    ...READER_IMAGE_BORDERLESS_STYLE,
    marginTop: 4,
    marginBottom: blockGap,
  } as const;
}
