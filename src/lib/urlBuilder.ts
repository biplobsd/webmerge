export function buildSearchUrl(template: string, query: string): string {
  if (!template.includes("{query}")) {
    throw new Error(`URL template "${template}" must contain {query}`);
  }
  return template.replace("{query}", encodeURIComponent(query));
}
