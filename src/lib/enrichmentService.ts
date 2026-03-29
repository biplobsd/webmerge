import type { DynamicEnrichment, ResultItem, CardLayout, SiteGroup, EnrichmentResult } from "./types";

const cache = new Map<string, EnrichmentResult>();
const inFlight = new Map<string, Promise<EnrichmentResult>>();

const FETCH_TIMEOUT_MS = 8_000;
const CONCURRENCY = 4;

function resolveDotPath(obj: unknown, path: string): string {
  if (!path) return "";
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (cur == null || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur != null ? String(cur) : "";
}

function extractOmdb(data: Record<string, unknown>, fields: string[]): EnrichmentResult {
  const out: EnrichmentResult = {};
  if (data.imdbID) out.imdbId = String(data.imdbID);
  if (data.Title) out.title = String(data.Title);

  for (const key of fields) {
    if (key === "rottenTomatoes") {
      const ratings = data.Ratings as { Source: string; Value: string }[] | undefined;
      const rt = ratings?.find((r) => r.Source === "Rotten Tomatoes");
      if (rt) out[key] = rt.Value;
    } else {
      const v = data[key];
      if (v && v !== "N/A") out[key] = String(v);
    }
  }
  return out;
}

function buildOmdbUrl(enr: DynamicEnrichment, item: ResultItem): string {
  const rawLookup = String(item[enr.lookupField] ?? "").trim();
  const exactTitle = String(item["exact_title"] ?? "").trim();
  const title = exactTitle || rawLookup;
  const year = enr.omdbYearField ? String(item[enr.omdbYearField] ?? "").trim() : "";
  const searchMode = enr.omdbSearchMode === "s" ? "s" : "t";

  const params = new URLSearchParams({
    [searchMode]: title,
    apikey: enr.apiKey,
    r: "json",
  });
  if (year) params.set("y", year);
  if (enr.omdbType) params.set("type", enr.omdbType);

  return `https://www.omdbapi.com/?${params.toString()}`;
}

function buildCustomUrl(enr: DynamicEnrichment, item: ResultItem): string {
  const value = String(item[enr.lookupField] ?? "").trim();
  const title = String(item["title"] ?? "").trim();
  const year = String(item["year"] ?? "").trim();

  return enr.customUrl
    .replace("{value}", encodeURIComponent(value))
    .replace("{title}", encodeURIComponent(title))
    .replace("{year}", encodeURIComponent(year));
}

function makeCacheKey(enr: DynamicEnrichment, item: ResultItem): string {
  if (enr.source === "omdb") {
    const title = String(item[enr.lookupField] ?? "").trim();
    const year = enr.omdbYearField ? String(item[enr.omdbYearField] ?? "").trim() : "";
    return `${enr.id}::${title}::${year}::${enr.omdbType}::${enr.omdbSearchMode}`;
  }
  return `${enr.id}::${buildCustomUrl(enr, item)}`;
}

async function fetchOne(enr: DynamicEnrichment, item: ResultItem): Promise<EnrichmentResult> {
  const key = makeCacheKey(enr, item);

  const cached = cache.get(key);
  if (cached) return cached;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  const promise = (async (): Promise<EnrichmentResult> => {
    try {
      if (enr.source === "omdb") {
        if (!enr.apiKey) return {};
        const lookupValue = String(item[enr.lookupField] ?? "").trim();
        if (!lookupValue) return {};
        const url = buildOmdbUrl(enr, item);
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return {};
        const data = (await res.json()) as Record<string, unknown>;
        if (data.Response === "False") return {};
        const result = extractOmdb(data, enr.omdbFields);
        cache.set(key, result);
        return result;
      }

      if (enr.source === "custom") {
        if (!enr.customUrl) return {};
        const lookupValue = String(item[enr.lookupField] ?? "").trim();
        if (!lookupValue) return {};
        const url = buildCustomUrl(enr, item);
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return {};
        const data = await res.json();
        const result = { value: resolveDotPath(data, enr.customJsonPath), url };
        cache.set(key, result);
        return result;
      }

      return {};
    } catch {
      return {};
    } finally {
      clearTimeout(timer);
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = Array.from({ length: tasks.length });
  let nextIdx = 0;

  async function worker() {
    while (nextIdx < tasks.length) {
      const idx = nextIdx++;
      results[idx] = await tasks[idx]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export async function enrichItems(items: ResultItem[], enrichments: DynamicEnrichment[]): Promise<ResultItem[]> {
  if (!enrichments.length) {
    return items.map((item) => ({ ...item, enrichments: item.enrichments ?? {} }));
  }

  const tasks = items.map((item) => async () => {
    const enrichmentsMap: Record<string, EnrichmentResult> = {};

    for (const enr of enrichments) {
      const result = await fetchOne(enr, item);
      if (Object.keys(result).length > 0) {
        enrichmentsMap[enr.id] = result;
      }
    }

    return { ...item, enrichments: enrichmentsMap } as ResultItem;
  });

  return runWithConcurrency(tasks, CONCURRENCY);
}

export async function loadEnrichmentsForSite(siteId: string): Promise<DynamicEnrichment[]> {
  const [syncData, localData] = await Promise.all([chrome.storage.sync.get("groups"), chrome.storage.local.get("cardLayouts")]);

  const groups: SiteGroup[] = Array.isArray(syncData.groups) ? (syncData.groups as SiteGroup[]) : [];
  const cardLayouts: CardLayout[] = Array.isArray(localData.cardLayouts) ? (localData.cardLayouts as CardLayout[]) : [];

  const group = groups.find((g) => g.siteIds.includes(siteId));
  if (group) {
    const groupLayout = cardLayouts.find((l) => l.scopeId === group.id);
    if (groupLayout?.enrichments.length) return groupLayout.enrichments;
  }

  const globalLayout = cardLayouts.find((l) => l.scopeId === "global");
  return globalLayout?.enrichments ?? [];
}
