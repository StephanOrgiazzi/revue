import { Platform } from "react-native";
import { Directory, File } from "expo-file-system";
import { createWebStorage } from "@/shared/logic/web/storage";

// We want to test the actual implementation
const { createPlatformStorage } = jest.requireActual(".././platformStorage");

jest.mock("@/shared/logic/web/storage", () => ({
  createWebStorage: jest.fn(),
}));

describe("platformStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPlatformStorage", () => {
    it("uses web storage adapter on web platform", () => {
      Platform.OS = "web";
      createPlatformStorage({ key: "test" });
      expect(createWebStorage).toHaveBeenCalledWith("storage/test.json", expect.any(Function));
    });

    it("returns native storage adapter on non-web platforms", () => {
      Platform.OS = "ios";
      const storage = createPlatformStorage({ key: "test" });
      expect(typeof storage.read).toBe("function");
      expect(typeof storage.write).toBe("function");
      expect(createWebStorage).not.toHaveBeenCalled();
    });
  });

  describe("native storage operations", () => {
    beforeEach(() => {
      Platform.OS = "ios";
      jest.clearAllMocks();
    });

    it("read should return undefined if file does not exist", () => {
      (File as unknown as jest.Mock).mockImplementation(() => ({
        exists: false,
      }));

      const storage = createPlatformStorage({ key: "test" });
      expect(storage.read()).toBeUndefined();
    });

    it("read returns value and caches it", () => {
      const mockFile = {
        exists: true,
        textSync: jest.fn().mockReturnValue("stored value"),
      };
      (File as unknown as jest.Mock).mockReturnValue(mockFile);

      const storage = createPlatformStorage({ key: "test" });
      expect(storage.read()).toBe("stored value");
      expect(storage.read()).toBe("stored value");
      expect(mockFile.textSync).toHaveBeenCalledTimes(1);
    });

    it("write creates directory/file and skips duplicate writes", () => {
      const mockDir = { create: jest.fn() };
      const mockFile = {
        exists: false,
        create: jest.fn(),
        write: jest.fn(),
      };
      (Directory as unknown as jest.Mock).mockReturnValue(mockDir);
      (File as unknown as jest.Mock).mockReturnValue(mockFile);

      const storage = createPlatformStorage({ key: "test" });
      storage.write("new value");
      storage.write("new value");

      expect(mockDir.create).toHaveBeenCalledTimes(1);
      expect(mockFile.create).toHaveBeenCalledTimes(1);
      expect(mockFile.write).toHaveBeenCalledTimes(1);
      expect(mockFile.write).toHaveBeenCalledWith("new value");
    });

    it("returns undefined when native read throws", () => {
      const mockFile = {
        exists: true,
        textSync: jest.fn(() => {
          throw new Error("Disk read failed");
        }),
      };
      (File as unknown as jest.Mock).mockReturnValue(mockFile);
      const mockWarn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const storage = createPlatformStorage({ key: "test" });
      expect(storage.read()).toBeUndefined();
      expect(mockWarn).toHaveBeenCalled();
      mockWarn.mockRestore();
    });
  });
});
