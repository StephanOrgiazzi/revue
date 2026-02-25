import { canReadTextFromWebUri, readTextFromWebUri } from ".././textUri";

describe("textUri", () => {
  describe("canReadTextFromWebUri", () => {
    it("should return true for web prefixes", () => {
      expect(canReadTextFromWebUri("http://example.com")).toBe(true);
      expect(canReadTextFromWebUri("https://example.com")).toBe(true);
      expect(canReadTextFromWebUri("/local/path")).toBe(true);
      expect(canReadTextFromWebUri("blob:foo")).toBe(true);
      expect(canReadTextFromWebUri("data:text/plain;base64,AAA")).toBe(true);
    });

    it("should return false for other strings", () => {
      expect(canReadTextFromWebUri("file://path")).toBe(false);
      expect(canReadTextFromWebUri("content://path")).toBe(false);
    });
  });

  describe("readTextFromWebUri", () => {
    it("should fetch and return text", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("fetched content"),
      });

      const content = await readTextFromWebUri("http://example.com");
      expect(content).toBe("fetched content");
      expect(global.fetch).toHaveBeenCalledWith("http://example.com");
    });

    it("should throw error if response is not ok", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(readTextFromWebUri("http://bad.com")).rejects.toThrow(
        "Failed to read text from http://bad.com",
      );
    });
  });
});
