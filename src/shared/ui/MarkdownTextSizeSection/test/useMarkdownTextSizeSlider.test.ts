import { act, renderHook } from "@testing-library/react-native";
import { Gesture } from "react-native-gesture-handler";

import { useMarkdownTextSizeSlider } from "@/shared/ui/MarkdownTextSizeSection/useMarkdownTextSizeSlider";

describe("useMarkdownTextSizeSlider", () => {
  let capturedGestureCallbacks: any = {};

  beforeEach(() => {
    capturedGestureCallbacks = {};

    const originalPan = Gesture.Pan;
    jest.spyOn(Gesture, "Pan").mockImplementation(() => {
      const pan = originalPan();

      const wrapCallback = (name: string, cb: any) => {
        capturedGestureCallbacks[name] = cb;
        return pan;
      };

      jest.spyOn(pan, "onBegin").mockImplementation((cb) => wrapCallback("onBegin", cb));
      jest.spyOn(pan, "onUpdate").mockImplementation((cb) => wrapCallback("onUpdate", cb));
      jest.spyOn(pan, "onEnd").mockImplementation((cb) => wrapCallback("onEnd", cb));

      return pan;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns layout and style helpers", () => {
    const onSelectMarkdownTextSizeLevel = jest.fn();
    const { result } = renderHook(() =>
      useMarkdownTextSizeSlider({
        activeMarkdownTextSizeLevel: 3,
        onSelectMarkdownTextSizeLevel,
      }),
    );

    expect(result.current.thumbSize).toBe(22);
    expect(result.current.onTrackLayout).toBeDefined();
    expect(result.current.gesture).toBeDefined();
    expect(result.current.thumbAnimatedStyle).toBeDefined();
    expect(result.current.activeTrackAnimatedStyle).toBeDefined();
  });

  it("updates track width from layout", () => {
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
  });

  it("does not emit selection until gesture ends", () => {
    const onSelectMarkdownTextSizeLevel = jest.fn();
    const { result } = renderHook(() =>
      useMarkdownTextSizeSlider({
        activeMarkdownTextSizeLevel: 2,
        onSelectMarkdownTextSizeLevel,
      }),
    );

    act(() => {
      result.current.onTrackLayout({
        nativeEvent: { layout: { width: 100 } },
      } as any);
    });

    act(() => {
      capturedGestureCallbacks.onBegin?.({ x: 20 } as any);
    });

    expect(onSelectMarkdownTextSizeLevel).not.toHaveBeenCalled();

    act(() => {
      capturedGestureCallbacks.onEnd?.({ x: 80 } as any);
    });

    expect(onSelectMarkdownTextSizeLevel).toHaveBeenCalledWith(4);
  });

  it("clamped and snaps touch values into supported levels on release", () => {
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
      capturedGestureCallbacks.onEnd?.({ x: 62 } as any);
    });
    expect(onSelectMarkdownTextSizeLevel).toHaveBeenCalledWith(3);

    act(() => {
      capturedGestureCallbacks.onEnd?.({ x: 999 } as any);
    });
    expect(onSelectMarkdownTextSizeLevel).toHaveBeenCalledWith(5);
  });

  it("ignores non-finite gesture coordinates and keeps the current level", () => {
    const onSelectMarkdownTextSizeLevel = jest.fn();
    const { result } = renderHook(() =>
      useMarkdownTextSizeSlider({
        activeMarkdownTextSizeLevel: 3,
        onSelectMarkdownTextSizeLevel,
      }),
    );

    act(() => {
      result.current.onTrackLayout({
        nativeEvent: { layout: { width: 140 } },
      } as any);
    });

    act(() => {
      capturedGestureCallbacks.onBegin?.({ x: Number.NaN } as any);
      capturedGestureCallbacks.onUpdate?.({ x: Number.NaN } as any);
      capturedGestureCallbacks.onEnd?.({ x: Number.NaN } as any);
    });

    expect(onSelectMarkdownTextSizeLevel).toHaveBeenCalledWith(3);
  });
});
