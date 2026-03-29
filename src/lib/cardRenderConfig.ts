import type { CardFieldStyle } from "./types";

export const STYLE_OPTIONS = [
  { value: "image" as const, label: "Image" },
  { value: "title" as const, label: "Title Link" },
  { value: "date" as const, label: "Date" },
  { value: "price" as const, label: "Price" },
  { value: "badge" as const, label: "Badge" },
  { value: "text" as const, label: "Text" },
  { value: "rating" as const, label: "Rating" },
] satisfies { value: CardFieldStyle; label: string }[];

type _StyleOptionValues = (typeof STYLE_OPTIONS)[number]["value"];
type _AssertAllStylesCovered = [CardFieldStyle] extends [_StyleOptionValues] ? true : never;
type _AssertNoExtras = [_StyleOptionValues] extends [CardFieldStyle] ? true : never;
const _a: _AssertAllStylesCovered = true;
const _b: _AssertNoExtras = true;
void _a;
void _b;

export const OMDB_LABELS: Record<string, string> = {
  imdbRating: "IMDB Rating",
  rottenTomatoes: "Rotten Tomatoes",
  Metascore: "Metascore",
  Genre: "Genre",
  Year: "Year",
  Plot: "Plot",
  Director: "Director",
  Actors: "Actors",
  Runtime: "Runtime",
  Language: "Language",
  Country: "Country",
  Awards: "Awards",
};

export const OMDB_LABELS_SHORT: Record<string, string> = {
  imdbRating: "IMDB",
  rottenTomatoes: "RT",
  Metascore: "Meta",
  Genre: "Genre",
  Year: "Year",
  Plot: "Plot",
};

export function fmtDate(
  val: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string | null {
  if (!val) return null;
  try {
    return new Intl.DateTimeFormat(undefined, opts).format(new Date(val));
  } catch {
    return String(val);
  }
}
