import { renderHook, act } from "@testing-library/react-native";
import { useReaderFloatingMenuVisibility } from ".././useReaderFloatingMenuVisibility";

type VisibilityHookProps = {
  isEnabled: boolean;
};

type VisibilityHookResult = ReturnType<typeof useReaderFloatingMenuVisibility>;

describe("useReaderFloatingMenuVisibility", () => {
  it("should initialize as visible", () => {
    const { result } = renderHook(() => useReaderFloatingMenuVisibility({ isEnabled: true }));
    expect(result.current.isFloatingMenuButtonVisible).toBe(true);
  });

  it("should hide after scrolling down beyond threshold", () => {
    const { result } = renderHook(() => useReaderFloatingMenuVisibility({ isEnabled: true }));

    act(() => {
      // Initialize anchor
      result.current.handleScrollOffsetChange(10);
      // Scroll down 400px (threshold is 380)
      result.current.handleScrollOffsetChange(410);
    });

    expect(result.current.isFloatingMenuButtonVisible).toBe(false);
  });

  it("should show again when scrolling up", () => {
    const { result } = renderHook(() => useReaderFloatingMenuVisibility({ isEnabled: true }));

    act(() => {
      result.current.handleScrollOffsetChange(10);
      result.current.handleScrollOffsetChange(500); // Should be hidden
    });
    expect(result.current.isFloatingMenuButtonVisible).toBe(false);

    act(() => {
      result.current.handleScrollOffsetChange(450); // Scrolled up
    });
    expect(result.current.isFloatingMenuButtonVisible).toBe(true);
  });

  it("should show when at top", () => {
    const { result } = renderHook(() => useReaderFloatingMenuVisibility({ isEnabled: true }));

    act(() => {
      result.current.handleScrollOffsetChange(500);
      result.current.handleScrollOffsetChange(0);
    });

    expect(result.current.isFloatingMenuButtonVisible).toBe(true);
  });

  it("should reset when disabled", () => {
    const { result, rerender } = renderHook<VisibilityHookResult, VisibilityHookProps>(
      ({ isEnabled }) => useReaderFloatingMenuVisibility({ isEnabled }),
      { initialProps: { isEnabled: true } },
    );

    act(() => {
      result.current.handleScrollOffsetChange(0);
      result.current.handleScrollOffsetChange(500);
    });
    expect(result.current.isFloatingMenuButtonVisible).toBe(false);

    rerender({ isEnabled: false });
    expect(result.current.isFloatingMenuButtonVisible).toBe(true);
  });
});
