import { act, renderHook } from "@testing-library/react-native";
import { PanResponder } from "react-native";

import { useMarkdownTextSizeSlider } from "@/shared/ui/MarkdownTextSizeSection/useMarkdownTextSizeSlider";

describe("useMarkdownTextSizeSlider", () => {
  let capturedPanResponderConfig: any;

  beforeEach(() => {
    capturedPanResponderConfig = undefined;
    jest.spyOn(PanResponder, "create").mockImplementation((config: any) => {
      capturedPanResponderConfig = config;
      return { panHandlers: {} } as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("computes track progress from active level", () => {
    const onSelectMarkdownTextSizeLevel = jest.fn();
    const { result } = renderHook(() =>
      useMarkdownTextSizeSlider({
        activeMarkdownTextSizeLevel: 3,
        onSelectMarkdownTextSizeLevel,
      }),
    );

    expect(result.current.activeTrackProgressRatio).toBe(0.5);
    expect(result.current.thumbSize).toBe(22);
    expect(result.current.thumbLeftOffset).toBe(-11);
  });

  it("updates track width from layout and thumb offset follows", () => {
    const onSelectMarkdownTextSizeLevel = jest.fn();
    const { result } = renderHook(() =>
      useMarkdownTextSizeSlider({
        activeMarkdownTextSizeLevel: 5,
        onSelectMarkdownTextSizeLevel,
      }),
    );

    act(() => {
      result.current.onTrackLayout({
        nativeEvent: { layout: { width: 200 } },
      } as any);
    });

    expect(result.current.trackWidth).toBe(200);
    expect(result.current.activeTrackProgressRatio).toBe(1);
    expect(result.current.thumbLeftOffset).toBe(189);
  });

  it("does not emit selection when track width is not measured", () => {
    const onSelectMarkdownTextSizeLevel = jest.fn();
    renderHook(() =>
      useMarkdownTextSizeSlider({
        activeMarkdownTextSizeLevel: 2,
        onSelectMarkdownTextSizeLevel,
      }),
    );

    act(() => {
      capturedPanResponderConfig.onPanResponderGrant({
        nativeEvent: { locationX: 20 },
      } as any);
    });

    expect(onSelectMarkdownTextSizeLevel).not.toHaveBeenCalled();
  });

  it("snaps and clamps touch values into supported levels", () => {
    const onSelectMarkdownTextSizeLevel = jest.fn();
    const { result } = renderHook(() =>
      useMarkdownTextSizeSlider({
        activeMarkdownTextSizeLevel: 3,
        onSelectMarkdownTextSizeLevel,
      }),
    );

    act(() => {
      result.current.onTrackLayout({
        nativeEvent: { layout: { width: 100 } },
      } as any);
    });

    act(() => {
      capturedPanResponderConfig.onPanResponderGrant({
        nativeEvent: { locationX: -10 },
      } as any);
      capturedPanResponderConfig.onPanResponderMove({
        nativeEvent: { locationX: 62 },
      } as any);
      capturedPanResponderConfig.onPanResponderMove({
        nativeEvent: { locationX: 999 },
      } as any);
    });

    expect(onSelectMarkdownTextSizeLevel).toHaveBeenNthCalledWith(1, 1);
    expect(onSelectMarkdownTextSizeLevel).toHaveBeenNthCalledWith(2, 3);
    expect(onSelectMarkdownTextSizeLevel).toHaveBeenNthCalledWith(3, 5);
  });
});
