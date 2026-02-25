import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";

type UseControlsSheetControllerParams = {
  visible: boolean;
  onClose: () => void;
};

export function useControlsSheetController({ visible, onClose }: UseControlsSheetControllerParams) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const isClosingRef = useRef(false);
  const pendingAfterCloseActionRef = useRef<(() => void) | null>(null);
  const flushPendingAfterCloseAction = useCallback(() => {
    const pendingAfterCloseAction = pendingAfterCloseActionRef.current;
    pendingAfterCloseActionRef.current = null;
    pendingAfterCloseAction?.();
  }, []);

  const handleSheetDismiss = useCallback(() => {
    isPresentedRef.current = false;
    isClosingRef.current = false;
    onClose();
    flushPendingAfterCloseAction();
  }, [flushPendingAfterCloseAction, onClose]);

  const startClose = useCallback(
    (pendingAfterCloseAction?: () => void) => {
      if (isClosingRef.current) {
        return;
      }

      if (pendingAfterCloseAction) {
        pendingAfterCloseActionRef.current = pendingAfterCloseAction;
      }

      if (!isPresentedRef.current) {
        onClose();
        flushPendingAfterCloseAction();
        return;
      }

      isClosingRef.current = true;
      sheetRef.current?.dismiss();
    },
    [flushPendingAfterCloseAction, onClose],
  );

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      pendingAfterCloseActionRef.current = null;
      if (!isPresentedRef.current) {
        sheetRef.current?.present();
        isPresentedRef.current = true;
      } else {
        sheetRef.current?.snapToIndex(0);
      }
      return;
    }

    if (!isPresentedRef.current) {
      return;
    }

    sheetRef.current?.dismiss();
  }, [visible]);

  return {
    sheetRef,
    handleSheetDismiss,
    startClose,
  };
}
