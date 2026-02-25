import { createWebStorage } from ".././storage";

describe("createWebStorage", () => {
  let mockReportError: jest.Mock;
  const storageKey = "test-key";

  beforeEach(() => {
    mockReportError = jest.fn();
    // Mock localStorage
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("read should get value from localStorage", () => {
    (globalThis.localStorage.getItem as jest.Mock).mockReturnValue("stored");
    const storage = createWebStorage(storageKey, mockReportError);

    expect(storage.read()).toBe("stored");
    expect(globalThis.localStorage.getItem).toHaveBeenCalledWith(storageKey);
  });

  it("write should set value in localStorage", () => {
    const storage = createWebStorage(storageKey, mockReportError);
    storage.write("new-value");

    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(storageKey, "new-value");
  });

  it("should handle localStorage errors and use in-memory fallback", () => {
    const storage = createWebStorage(storageKey, mockReportError);

    (globalThis.localStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    storage.write("value");
    expect(mockReportError).toHaveBeenCalledWith("write", expect.any(String), expect.any(Error));

    (globalThis.localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error("security error");
    });

    // It should return the in-memory value
    expect(storage.read()).toBe("value");
  });
});
