import { formatArticleDate } from ".././formatArticleDate";

describe("formatArticleDate", () => {
  it("returns null for missing date values", () => {
    expect(formatArticleDate(undefined)).toBeNull();
    expect(formatArticleDate(null as unknown as string)).toBeNull();
    expect(formatArticleDate("")).toBeNull();
  });

  it("returns null for invalid date strings", () => {
    expect(formatArticleDate("invalid-date")).toBeNull();
    expect(formatArticleDate("2023-13-45")).toBeNull();
  });

  it("formats valid dates with en-US short date options", () => {
    const localeSpy = jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockReturnValue("Oct 25, 2023");

    expect(formatArticleDate("2023-10-25")).toBe("Oct 25, 2023");
    expect(formatArticleDate("2023-10-25T10:00:00Z")).toBe("Oct 25, 2023");
    expect(localeSpy).toHaveBeenCalledWith("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    localeSpy.mockRestore();
  });
});
