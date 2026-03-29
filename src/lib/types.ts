export interface SiteGroup {
  id: string;
  name: string;
  siteIds: string[];
}

export interface SiteConfig {
  id: string;
  name: string;
  faviconUrl: string;
  searchUrlTemplate: string;
  listingUrl: string;
  cookies: string;
  isHomepage: boolean;
  enabled: boolean;
  schema: Record<string, string>;
  schemaTypes?: Record<string, string>;
}

export interface EnrichmentResult {
  imdbId?: string;
  title?: string;
  url?: string;
  [key: string]: string | undefined;
}

export interface ResultItem {
  siteId: string;
  title: string;
  url: string;
  publish_date: string | null;
  enrichments: Record<string, EnrichmentResult>;
  [key: string]: unknown;
}

export type JobStatus = "pending" | "running" | "done" | "stopped" | "failed";

export interface Job {
  jobId: string;
  siteId: string;
  url: string;
  status: JobStatus;
  error?: string;
  startedAt: number;
  controller: AbortController;
}

export type CardFieldStyle = "image" | "title" | "date" | "price" | "text" | "badge" | "rating";

export interface CardField {
  id: string;
  field: string;
  label: string;
  style: CardFieldStyle;
  visible: boolean;
  showLabel?: boolean;
  height?: string;
  datatype?: FieldDataType;
}

export type EnrichmentSource = "omdb" | "custom";

export interface DynamicEnrichment {
  id: string;
  label: string;
  source: EnrichmentSource;
  lookupField: string;
  apiKey: string;
  customUrl: string;
  customJsonPath: string;
  resultKey: string;
  style: "rating" | "badge" | "text";
  omdbFields: string[];
  omdbSearchMode: "t" | "s";
  omdbYearField: string;
  omdbType: string;
}

export interface CardLayout {
  scopeId: string;
  fields: CardField[];
  enrichments: DynamicEnrichment[];
}

export const BUILTIN_FIELDS: Omit<CardField, "id">[] = [
  { field: "image_url", label: "Image", style: "image", visible: true, height: "h-96" },
  { field: "title", label: "Title", style: "title", visible: true },
  { field: "publish_date", label: "Date", style: "date", visible: true },
  { field: "_source", label: "Source", style: "badge", visible: true },
  { field: "price", label: "Price", style: "price", visible: false },
  { field: "exact_title", label: "Exact Title", style: "text", visible: false },
  { field: "year", label: "Year", style: "badge", visible: false },
  { field: "media_type", label: "Media Type", style: "badge", visible: false },
];

export const FIELD_TYPES = [
  { value: "string", label: "String", hint: "Text value" },
  { value: "int", label: "Integer", hint: "Whole number" },
  { value: "float", label: "Float", hint: "Decimal number" },
  { value: "bool", label: "Boolean", hint: "True / False" },
  { value: "list<string>", label: "List of Strings", hint: "Multiple text values" },
  { value: "list<int>", label: "List of Integers", hint: "Multiple whole numbers" },
  { value: "list<float>", label: "List of Floats", hint: "Multiple decimal numbers" },
] as const;

export type FieldDataType = (typeof FIELD_TYPES)[number]["value"];

export const OMDB_PRESET_FIELDS: { key: string; label: string }[] = [
  { key: "imdbRating", label: "IMDB Rating" },
  { key: "rottenTomatoes", label: "Rotten Tomatoes" },
  { key: "Metascore", label: "Metascore" },
  { key: "Genre", label: "Genre" },
  { key: "Year", label: "Year" },
  { key: "Plot", label: "Plot" },
];
