import { renderHook, act } from "@testing-library/react-native";
import { useDisclosure } from ".././useDisclosure";

describe("useDisclosure", () => {
  it("should initialize with default value (false)", () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it("should initialize with provided value", () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("should open the disclosure", () => {
    const { result } = renderHook(() => useDisclosure(false));

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should close the disclosure", () => {
    const { result } = renderHook(() => useDisclosure(true));

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
