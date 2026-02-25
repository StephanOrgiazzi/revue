import { act, renderHook } from "@testing-library/react-native";

import { useControlsSheetController } from "@/shared/ui/ControlsSheet/useControlsSheetController";

type ControlsSheetControllerProps = {
  visible: boolean;
};

type ControlsSheetControllerResult = ReturnType<typeof useControlsSheetController>;

describe("useControlsSheetController", () => {
  it("presents when becoming visible and dismisses when hidden", () => {
    const onClose = jest.fn();
    const modal = {
      present: jest.fn(),
      dismiss: jest.fn(),
      snapToIndex: jest.fn(),
    };
    const { result, rerender } = renderHook<
      ControlsSheetControllerResult,
      ControlsSheetControllerProps
    >(({ visible }) => useControlsSheetController({ visible, onClose }), {
      initialProps: { visible: false },
    });

    act(() => {
      result.current.sheetRef.current = modal as any;
    });

    rerender({ visible: true });
    expect(modal.present).toHaveBeenCalledTimes(1);

    rerender({ visible: false });
    expect(modal.dismiss).toHaveBeenCalledTimes(1);

    rerender({ visible: true });
    expect(modal.snapToIndex).toHaveBeenCalledWith(0);
  });

  it("closes immediately when startClose is called while not presented", () => {
    const onClose = jest.fn();
    const pendingAction = jest.fn();
    const { result } = renderHook(() =>
      useControlsSheetController({
        visible: false,
        onClose,
      }),
    );

    act(() => {
      result.current.startClose(pendingAction);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pendingAction).toHaveBeenCalledTimes(1);
  });

  it("queues pending close action until dismiss callback is handled", () => {
    const onClose = jest.fn();
    const pendingAction = jest.fn();
    const modal = {
      present: jest.fn(),
      dismiss: jest.fn(),
      snapToIndex: jest.fn(),
    };
    const { result, rerender } = renderHook<
      ControlsSheetControllerResult,
      ControlsSheetControllerProps
    >(({ visible }) => useControlsSheetController({ visible, onClose }), {
      initialProps: { visible: true },
    });

    act(() => {
      result.current.sheetRef.current = modal as any;
    });
    rerender({ visible: true });

    act(() => {
      result.current.startClose(pendingAction);
      result.current.startClose(() => {});
    });

    expect(modal.dismiss).toHaveBeenCalledTimes(1);
    expect(pendingAction).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.handleSheetDismiss();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pendingAction).toHaveBeenCalledTimes(1);
  });
});
