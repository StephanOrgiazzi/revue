import React from "react";
import { act, renderHook } from "@testing-library/react-native";

type MockStorage = {
  read: jest.Mock<string | undefined, []>;
  write: jest.Mock<void, [string]>;
};

function setupModule(readValue?: string) {
  jest.resetModules();

  const storage: MockStorage = {
    read: jest.fn(() => readValue),
    write: jest.fn(),
  };

  jest.doMock("react", () => React);
  jest.doMock("@/shared/logic/platformStorage", () => ({
    createPlatformStorage: jest.fn(() => storage),
  }));

  const module = require(".././useThemePreferences") as typeof import(".././useThemePreferences");
  return {
    useThemePreferences: module.useThemePreferences,
    storage,
  };
}

describe("useThemePreferences", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("falls back to default snapshot when storage is empty", () => {
    const { useThemePreferences, storage } = setupModule(undefined);
    const { result } = renderHook(() => useThemePreferences());

    expect(storage.read).toHaveBeenCalledTimes(1);
    expect(result.current.themeId).toBe("light");
    expect(result.current.markdownTextSizeLevel).toBe(3);
  });

  it("hydrates from valid persisted preferences", () => {
    const storedValue = JSON.stringify({
      themeId: "midnight",
      markdownTextSizeLevel: 5,
    });
    const { useThemePreferences } = setupModule(storedValue);
    const { result } = renderHook(() => useThemePreferences());

    expect(result.current.themeId).toBe("midnight");
    expect(result.current.markdownTextSizeLevel).toBe(5);
  });

  it("falls back to default markdown size when persisted level is invalid", () => {
    const storedValue = JSON.stringify({
      themeId: "paper",
      markdownTextSizeLevel: 9,
    });
    const { useThemePreferences } = setupModule(storedValue);
    const { result } = renderHook(() => useThemePreferences());

    expect(result.current.themeId).toBe("paper");
    expect(result.current.markdownTextSizeLevel).toBe(3);
  });

  it("ignores invalid persisted payload", () => {
    const { useThemePreferences } = setupModule(
      '{"themeId":"not-a-theme","markdownTextSizeLevel":3}',
    );
    const { result } = renderHook(() => useThemePreferences());

    expect(result.current.themeId).toBe("light");
    expect(result.current.markdownTextSizeLevel).toBe(3);
  });

  it("batches persistence and writes only latest snapshot", () => {
    const { useThemePreferences, storage } = setupModule(undefined);
    const { result } = renderHook(() => useThemePreferences());

    act(() => {
      result.current.setThemeId("paper");
      result.current.setThemeId("velvet");
      result.current.setMarkdownTextSizeLevel(5);
      result.current.setMarkdownTextSizeLevel(4);
    });

    expect(result.current.themeId).toBe("velvet");
    expect(result.current.markdownTextSizeLevel).toBe(4);
    expect(storage.write).not.toHaveBeenCalled();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(storage.write).toHaveBeenCalledTimes(1);
    expect(storage.write).toHaveBeenCalledWith(
      JSON.stringify({
        themeId: "velvet",
        markdownTextSizeLevel: 4,
      }),
    );
  });

  it("does not schedule persistence when setting same values", () => {
    const { useThemePreferences, storage } = setupModule(undefined);
    const { result } = renderHook(() => useThemePreferences());

    act(() => {
      result.current.setThemeId("light");
      result.current.setMarkdownTextSizeLevel(3);
      jest.runOnlyPendingTimers();
    });

    expect(storage.write).not.toHaveBeenCalled();
  });
});
