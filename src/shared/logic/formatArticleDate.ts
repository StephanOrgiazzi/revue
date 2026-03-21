type FormattedArticleDate = string | null;
type RawArticleDate = string | undefined;

export function formatArticleDate(rawDate: RawArticleDate): FormattedArticleDate {
  if (!rawDate) {
    return null;
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
