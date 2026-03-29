import type { ResultItem } from "./types";

export function sortByPublishDate(items: ResultItem[]): ResultItem[] {
  return [...items].sort((a, b) => {
    if (!a.publish_date && !b.publish_date) return 0;
    if (!a.publish_date) return 1;
    if (!b.publish_date) return -1;
    return new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
  });
}
