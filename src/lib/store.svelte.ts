import { BUILTIN_FIELDS, type ResultItem, type Job, type SiteConfig, type SiteGroup, type CardLayout, type CardField } from "./types";
import { sortByPublishDate } from "./sorter";

export const store = $state({
  resultMap: new Map<string, ResultItem[]>(),
  lastResultMap: new Map<string, ResultItem[]>(),
  activeTab: "all",
  activeGroup: "all",
  jobs: [] as Job[],
  siteCfgs: [] as SiteConfig[],
  groups: [] as SiteGroup[],
  query: "",
  error: null as string | null,
  theme: "dark" as "light" | "dark",
  screen: "home" as "home" | "results" | "settings" | "about",
  alwaysShowLatest: false,
  cardLayouts: [] as CardLayout[],
  popupItem: null as ResultItem | null,
  openAddSite: false,
  openAISettings: false,
  editingSiteId: null as string | null,
  aiApiKey: "",
  searchMode: "onsite" as "local" | "onsite",
});

export function getActiveGroupSiteIds(): string[] | null {
  if (store.activeGroup === "all") return null;
  const group = store.groups.find((g) => g.id === store.activeGroup);
  return group?.siteIds ?? [];
}

export function getVisibleResults(): ResultItem[] {
  const groupSiteIds = getActiveGroupSiteIds();
  let items: ResultItem[] = [];
  if (store.activeTab === "all") {
    items = groupSiteIds
      ? Array.from(store.resultMap.entries())
          .filter(([id]) => groupSiteIds.includes(id))
          .flatMap(([, v]) => v)
      : Array.from(store.resultMap.values()).flat();
  } else {
    items = store.resultMap.get(store.activeTab) ?? [];
  }

  if (store.searchMode === "local" && store.query.trim()) {
    const q = store.query.toLowerCase();
    items = items.filter((i) => i.title.toLowerCase().includes(q));
  }

  return sortByPublishDate(items);
}

export function getProviderTabs(): string[] {
  const groupSiteIds = getActiveGroupSiteIds();
  const tabs = Array.from(store.resultMap.keys()).filter((id) => (store.resultMap.get(id)?.length ?? 0) > 0);
  if (groupSiteIds) {
    return tabs.filter((id) => groupSiteIds.includes(id));
  }
  return tabs;
}

export function hasActiveJobs(): boolean {
  return store.jobs.some((j) => j.status === "running" || j.status === "pending");
}

export function saveLastResults() {
  const serialized: Record<string, ResultItem[]> = {};
  store.resultMap.forEach((items, siteId) => {
    serialized[siteId] = items;
  });
  chrome.storage.local.set({ lastResultMap: serialized });
  store.lastResultMap = new Map(store.resultMap);
}

export async function loadLastResults(): Promise<boolean> {
  const data = await chrome.storage.local.get("lastResultMap");
  const saved = data.lastResultMap as Record<string, ResultItem[]> | undefined;
  if (!saved || Object.keys(saved).length === 0) return false;
  store.resultMap = new Map(Object.entries(saved));
  store.lastResultMap = new Map(store.resultMap);
  return true;
}

function safeLayouts(): CardLayout[] {
  return Array.isArray(store.cardLayouts) ? store.cardLayouts : [];
}

export function getDefaultLayout(scopeId: string): CardLayout {
  return {
    scopeId,
    fields: BUILTIN_FIELDS.map((f, i) => ({ ...f, id: `${scopeId}-${i}-${f.field}` })),
    enrichments: [],
  };
}

/** @public Used by CardLayoutBuilder.svelte */
export function getLayoutForScope(scopeId: string): CardLayout {
  return safeLayouts().find((l) => l.scopeId === scopeId) ?? getDefaultLayout(scopeId);
}

export function getEffectiveLayout(siteId: string): CardLayout {
  const layouts = safeLayouts();
  const group = store.groups.find((g) => g.siteIds.includes(siteId));
  if (group) {
    const groupLayout = layouts.find((l) => l.scopeId === group.id);
    if (groupLayout) return groupLayout;
  }
  const globalLayout = layouts.find((l) => l.scopeId === "global");
  return globalLayout ?? getDefaultLayout("global");
}

/** @public Used by CardLayoutBuilder.svelte */
export async function saveCardLayout(layout: CardLayout) {
  const current = safeLayouts();
  const idx = current.findIndex((l) => l.scopeId === layout.scopeId);
  if (idx >= 0) {
    store.cardLayouts = current.map((l, i) => (i === idx ? layout : l));
  } else {
    store.cardLayouts = [...current, layout];
  }
  await chrome.storage.local.set({ cardLayouts: JSON.parse(JSON.stringify(store.cardLayouts)) });
}

export async function loadCardLayouts() {
  const data = await chrome.storage.local.get("cardLayouts");
  const raw = data.cardLayouts;
  if (Array.isArray(raw) && raw.length > 0) {
    store.cardLayouts = raw as CardLayout[];
  }
}

/** @public Used by CardLayoutBuilder.svelte */
export function getAvailableSchemaFields(scopeId: string): CardField[] {
  const sites =
    scopeId === "global"
      ? store.siteCfgs
      : store.siteCfgs.filter((s) => {
          const g = store.groups.find((g) => g.id === scopeId);
          return g?.siteIds.includes(s.id) ?? false;
        });

  const fieldKeys = new Set<string>();
  const fieldTypes = new Map<string, string>();
  for (const site of sites) {
    for (const key of Object.keys(site.schema)) {
      fieldKeys.add(key);
      const t = site.schemaTypes?.[key];
      if (t && !fieldTypes.has(key)) fieldTypes.set(key, t);
    }
  }

  return Array.from(fieldKeys).map((key) => {
    const savedType = fieldTypes.get(key) as CardField["style"] | undefined;
    const defaultStyle: CardField["style"] = savedType ?? (key === "price" ? "price" : "text");
    return {
      id: `schema-${key}`,
      field: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      style: defaultStyle,
      visible: true,
    };
  });
}
