import { useCallback, useState } from "react";

type UseDisclosureResult = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export function useDisclosure(initialValue = false): UseDisclosureResult {
  const [isOpen, setIsOpen] = useState(initialValue);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    open,
    close,
  };
}
