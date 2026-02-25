const mockStorage = {
  read: jest.fn(),
  write: jest.fn(),
};

jest.mock("@/shared/logic/platformStorage", () => ({
  createPlatformStorage: jest.fn(() => mockStorage),
}));

describe("libraryIndexStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module to clear internal cache
    jest.resetModules();
  });

  it("should return empty object if storage is empty", () => {
    // Re-import to get fresh module with reset cache
    const { getLibraryIndex } = require(".././libraryIndexStorage");
    mockStorage.read.mockReturnValue(undefined);

    expect(getLibraryIndex()).toEqual({});
    expect(mockStorage.read).toHaveBeenCalled();
  });

  it("should parse and return library index from storage", () => {
    const { getLibraryIndex } = require(".././libraryIndexStorage");
    const index = { id1: { id: "id1", title: "Title", tags: ["t1"] } };
    mockStorage.read.mockReturnValue(JSON.stringify(index));

    const result = getLibraryIndex();
    expect(result).toEqual(index);
    expect(result).not.toBe(index); // Should be cloned
  });

  it("should save library index to storage", () => {
    const { saveLibraryIndex } = require(".././libraryIndexStorage");
    const index = { id2: { id: "id2", title: "Save me", tags: [] } };

    saveLibraryIndex(index);

    expect(mockStorage.write).toHaveBeenCalledWith(JSON.stringify(index));
  });

  it("should handle JSON parse errors", () => {
    const { getLibraryIndex } = require(".././libraryIndexStorage");
    mockStorage.read.mockReturnValue("invalid json");

    expect(getLibraryIndex()).toEqual({});
  });
});
