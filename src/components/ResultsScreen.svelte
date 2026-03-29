<script lang="ts">
  import { store, getProviderTabs, getVisibleResults, getActiveGroupSiteIds, getLayoutForScope } from "src/lib/store.svelte";
  import { toast } from "svelte-sonner";
  import ResultCard from "./ResultCard.svelte";
  import LoadingState from "./LoadingState.svelte";
  import SearchBox from "./SearchBox.svelte";
  import GroupPicker from "./GroupPicker.svelte";
  import { RefreshCw, ArrowUpDown, Filter, ChevronDown, Edit } from "lucide-svelte";
  import { scale, slide } from "svelte/transition";
  import type { ResultItem, CardField } from "src/lib/types";

  const providerTabs = $derived(getProviderTabs());
  const activeJobs = $derived(store.jobs.filter((j) => j.status === "running" || j.status === "pending"));
  const failedJobs = $derived(store.jobs.filter((j) => j.status === "failed"));

  $effect(() => {
    if (store.error) {
      toast.error(store.error);
      store.error = null;
    }
  });

  function label(siteId: string): string {
    return store.siteCfgs.find((s) => s.id === siteId)?.name ?? siteId;
  }

  function siteResults(siteId: string) {
    let items = store.resultMap.get(siteId) ?? [];
    if (store.searchMode === "local" && store.query.trim()) {
      const q = store.query.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q));
    }
    return items;
  }

  function allResults() {
    return getVisibleResults();
  }

  const activeGroupName = $derived(
    store.activeGroup === "all" ? null : (store.groups.find((g) => g.id === store.activeGroup)?.name ?? null),
  );

  function fetchLatest() {
    const groupIds = getActiveGroupSiteIds();
    const homeSites = store.siteCfgs.filter((s) => s.isHomepage && s.enabled && (!groupIds || groupIds.includes(s.id)));
    if (homeSites.length === 0) return;

    if (store.activeGroup === "all") {
      store.resultMap = new Map();
      store.jobs = [];
    } else {
      const fetchIds = new Set(homeSites.map((s) => s.id));
      const newMap = new Map(store.resultMap);
      fetchIds.forEach((id) => newMap.delete(id));
      store.resultMap = newMap;
      store.jobs = store.jobs.filter((j) => !fetchIds.has(j.siteId));
    }

    store.activeTab = "all";
    chrome.runtime.sendMessage({ type: "FETCH_LISTINGS", sites: $state.snapshot(homeSites) });
  }

  function retryFailedSite(siteId: string) {
    const site = store.siteCfgs.find((s) => s.id === siteId);
    if (!site) return;

    store.jobs = store.jobs.filter((j) => j.siteId !== siteId);

    chrome.runtime.sendMessage({ type: "FETCH_LISTINGS", sites: $state.snapshot([site]) });
  }

  const hasHomeSites = $derived(
    store.activeGroup === "all"
      ? store.siteCfgs.some((s) => s.isHomepage && s.enabled)
      : store.siteCfgs.some((s) => {
          const g = store.groups.find((g) => g.id === store.activeGroup);
          return s.isHomepage && s.enabled && (g?.siteIds.includes(s.id) ?? false);
        }),
  );

  const skeletonCount = $derived(Math.max(activeJobs.length, 4));

  let sortKey = $state("default");

  // Filter state
  let filtersOpen = $state(false);
  let activeFilters = $state<Record<string, string>>({});
  let activeRangeFilters = $state<Record<string, { min: string; max: string }>>({});

  const FILTER_SKIP = new Set(["siteId", "url", "title", "publish_date", "image_url", "enrichments", "exact_title", "_source"]);

  const fieldTypeMap = $derived(() => {
    const map = new Map<string, string>();
    for (const site of store.siteCfgs) {
      for (const [key, type] of Object.entries(site.schemaTypes ?? {})) {
        if (!map.has(key)) map.set(key, type);
      }
    }
    const layout = getLayoutForScope("global");
    for (const f of layout.fields) {
      if (f.datatype && !map.has(f.field)) map.set(f.field, f.datatype);
    }
    return map;
  });

  type FilterGroup =
    | { field: string; label: string; kind: "enum"; values: string[] }
    | { field: string; label: string; kind: "bool" }
    | { field: string; label: string; kind: "range"; min: number; max: number };

  const filterableTabs = $derived((): FilterGroup[] => {
    const allItems = Array.from(store.resultMap.values()).flat();
    if (allItems.length === 0) return [];

    const layout = getLayoutForScope("global");
    const typeMap = fieldTypeMap();
    const result: FilterGroup[] = [];

    for (const layoutField of layout.fields) {
      const field = layoutField.field;
      if (FILTER_SKIP.has(field)) continue;

      const label = layoutField.label;
      const type = typeMap.get(field) ?? layoutField.datatype ?? null;

      if (type === "bool") {
        const hasTrue = allItems.some((i) => i[field] === true || String(i[field]).toLowerCase() === "true");
        const hasFalse = allItems.some((i) => i[field] === false || String(i[field]).toLowerCase() === "false");
        if (hasTrue && hasFalse) result.push({ field, label, kind: "bool" });
      } else if (type === "int" || type === "float") {
        const nums: number[] = [];
        for (const item of allItems) {
          const n = parseFloat(String(item[field] ?? "").replace(/[^0-9.-]/g, ""));
          if (!isNaN(n)) nums.push(n);
        }
        if (nums.length >= 2) {
          const lo = Math.min(...nums),
            hi = Math.max(...nums);
          if (lo < hi) result.push({ field, label, kind: "range", min: lo, max: hi });
        }
      } else if (type === "list<string>") {
        const values = new Set<string>();
        for (const item of allItems) {
          const v = item[field];
          const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,;|]/) : [];
          for (const s of arr) {
            const t = String(s).trim();
            if (t && t.length <= 60) values.add(t);
          }
        }
        if (values.size >= 1) result.push({ field, label, kind: "enum", values: Array.from(values).sort() });
      } else if (type === "list<int>" || type === "list<float>") {
        const nums: number[] = [];
        for (const item of allItems) {
          const v = item[field];
          const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,;|]/) : [];
          for (const s of arr) {
            const n = parseFloat(String(s).replace(/[^0-9.-]/g, ""));
            if (!isNaN(n)) nums.push(n);
          }
        }
        if (nums.length >= 2) {
          const lo = Math.min(...nums),
            hi = Math.max(...nums);
          if (lo < hi) result.push({ field, label, kind: "range", min: lo, max: hi });
        }
      } else {
        const values = new Set<string>();
        for (const item of allItems) {
          const v = item[field];
          if (Array.isArray(v)) {
            for (const s of v) {
              const t = String(s).trim();
              if (t && t.length <= 60 && !t.startsWith("http")) values.add(t);
            }
          } else if (typeof v === "string" && v.trim() && v.length <= 60 && !v.startsWith("http")) {
            values.add(v.trim());
          }
        }
        if (values.size >= 2 && values.size <= 30) result.push({ field, label, kind: "enum", values: Array.from(values).sort() });
      }
    }

    return result;
  });

  const hasFilterableTabs = $derived(filterableTabs().length > 0);

  function applyFilters(items: ResultItem[]): ResultItem[] {
    let filtered = items;
    for (const [field, value] of Object.entries(activeFilters)) {
      if (!value || value === "all") continue;
      filtered = filtered.filter((item) => {
        const v = item[field];
        if (value === "true") return v === true || String(v).toLowerCase() === "true";
        if (value === "false") return v === false || String(v).toLowerCase() === "false";
        if (Array.isArray(v)) return v.some((s) => String(s).trim() === value);
        return v != null && String(v).trim() === value;
      });
    }
    for (const [field, range] of Object.entries(activeRangeFilters)) {
      const lo = range.min !== "" ? parseFloat(range.min) : null;
      const hi = range.max !== "" ? parseFloat(range.max) : null;
      if (lo === null && hi === null) continue;
      filtered = filtered.filter((item) => {
        const v = item[field];
        const arr = Array.isArray(v) ? v : [v];
        return arr.some((elem) => {
          const n = parseFloat(String(elem ?? "").replace(/[^0-9.-]/g, ""));
          if (isNaN(n)) return false;
          if (lo !== null && n < lo) return false;
          if (hi !== null && n > hi) return false;
          return true;
        });
      });
    }
    return filtered;
  }

  function setFilter(field: string, value: string) {
    activeFilters = { ...activeFilters, [field]: value };
  }

  function setRangeFilter(field: string, min: string, max: string) {
    activeRangeFilters = { ...activeRangeFilters, [field]: { min, max } };
  }

  function getActiveFilter(field: string): string {
    return activeFilters[field] ?? "all";
  }

  function getRangeFilter(field: string) {
    return activeRangeFilters[field] ?? { min: "", max: "" };
  }

  const hasActiveFilters = $derived(
    Object.values(activeFilters).some((v) => v && v !== "all") ||
      Object.values(activeRangeFilters).some((r) => r.min !== "" || r.max !== ""),
  );

  function parseNumeric(val: string | null | undefined): number | null {
    if (!val) return null;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }

  function getImdbRating(item: ResultItem): number | null {
    for (const data of Object.values(item.enrichments ?? {})) {
      const v = parseNumeric(data["imdbRating"]);
      if (v !== null) return v;
    }
    return null;
  }

  function getRtScore(item: ResultItem): number | null {
    for (const data of Object.values(item.enrichments ?? {})) {
      const v = parseNumeric(data["rottenTomatoes"]);
      if (v !== null) return v;
    }
    return null;
  }

  function getMetascore(item: ResultItem): number | null {
    for (const data of Object.values(item.enrichments ?? {})) {
      const v = parseNumeric(data["Metascore"]);
      if (v !== null) return v;
    }
    return null;
  }

  function getPrice(item: ResultItem): number | null {
    return parseNumeric(item["price"] as string | null);
  }

  function getYear(item: ResultItem): number | null {
    return parseNumeric(item["year"] as string | null);
  }

  function getDateMs(item: ResultItem): number {
    const d = item.publish_date;
    if (!d) return 0;
    try {
      return new Date(String(d)).getTime();
    } catch {
      return 0;
    }
  }

  const skeletonHeight = $derived(() => {
    const layout = getLayoutForScope("global");
    const imgField = layout.fields.find((f: CardField) => f.style === "image");
    return imgField?.height ?? "h-96";
  });

  const SORT_OPTIONS = [
    {
      value: "default",
      label: "Default order",
      check: (_: ResultItem[]) => true,
    },
    {
      value: "date_new",
      label: "Date: Newest first",
      check: (items: ResultItem[]) => items.some((i) => getDateMs(i) > 0),
    },
    {
      value: "date_old",
      label: "Date: Oldest first",
      check: (items: ResultItem[]) => items.some((i) => getDateMs(i) > 0),
    },
    {
      value: "year_new",
      label: "Year: Newest first",
      check: (items: ResultItem[]) => items.some((i) => getYear(i) !== null),
    },
    {
      value: "year_old",
      label: "Year: Oldest first",
      check: (items: ResultItem[]) => items.some((i) => getYear(i) !== null),
    },
    {
      value: "imdb_high",
      label: "IMDB Rating: High → Low",
      check: (items: ResultItem[]) => items.some((i) => getImdbRating(i) !== null),
    },
    {
      value: "imdb_low",
      label: "IMDB Rating: Low → High",
      check: (items: ResultItem[]) => items.some((i) => getImdbRating(i) !== null),
    },
    {
      value: "rt_high",
      label: "Rotten Tomatoes: High → Low",
      check: (items: ResultItem[]) => items.some((i) => getRtScore(i) !== null),
    },
    {
      value: "rt_low",
      label: "Rotten Tomatoes: Low → High",
      check: (items: ResultItem[]) => items.some((i) => getRtScore(i) !== null),
    },
    {
      value: "meta_high",
      label: "Metascore: High → Low",
      check: (items: ResultItem[]) => items.some((i) => getMetascore(i) !== null),
    },
    {
      value: "meta_low",
      label: "Metascore: Low → High",
      check: (items: ResultItem[]) => items.some((i) => getMetascore(i) !== null),
    },
    {
      value: "price_high",
      label: "Price: High → Low",
      check: (items: ResultItem[]) => items.some((i) => getPrice(i) !== null),
    },
    {
      value: "price_low",
      label: "Price: Low → High",
      check: (items: ResultItem[]) => items.some((i) => getPrice(i) !== null),
    },
  ];

  const dynamicSortOptions = $derived(() => {
    const typeMap = fieldTypeMap();
    const opts: typeof SORT_OPTIONS = [];
    for (const [field, type] of typeMap) {
      if (type !== "int" && type !== "float") continue;
      if (FILTER_SKIP.has(field)) continue;
      const layout = getLayoutForScope("global");
      const label =
        layout.fields.find((f) => f.field === field)?.label ?? field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
      const getter = (item: ResultItem) => {
        const n = parseFloat(String(item[field] ?? "").replace(/[^0-9.-]/g, ""));
        return isNaN(n) ? null : n;
      };
      opts.push({ value: `__dyn_${field}_high`, label: `${label}: High → Low`, check: (items) => items.some((i) => getter(i) !== null) });
      opts.push({ value: `__dyn_${field}_low`, label: `${label}: Low → High`, check: (items) => items.some((i) => getter(i) !== null) });
    }
    return opts;
  });

  function visibleSortOptions(items: ResultItem[]) {
    return [...SORT_OPTIONS, ...dynamicSortOptions()].filter((opt) => opt.check(items));
  }

  function sortedResults(items: ResultItem[]): ResultItem[] {
    if (sortKey === "default") return items;
    const arr = [...items];

    function cmp(a: ResultItem, b: ResultItem, getVal: (item: ResultItem) => number | null, desc: boolean): number {
      const va = getVal(a);
      const vb = getVal(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return desc ? vb - va : va - vb;
    }

    switch (sortKey) {
      case "date_new":
        return arr.sort((a, b) => cmp(a, b, getDateMs, true));
      case "date_old":
        return arr.sort((a, b) => cmp(a, b, getDateMs, false));
      case "year_new":
        return arr.sort((a, b) => cmp(a, b, getYear, true));
      case "year_old":
        return arr.sort((a, b) => cmp(a, b, getYear, false));
      case "imdb_high":
        return arr.sort((a, b) => cmp(a, b, getImdbRating, true));
      case "imdb_low":
        return arr.sort((a, b) => cmp(a, b, getImdbRating, false));
      case "rt_high":
        return arr.sort((a, b) => cmp(a, b, getRtScore, true));
      case "rt_low":
        return arr.sort((a, b) => cmp(a, b, getRtScore, false));
      case "meta_high":
        return arr.sort((a, b) => cmp(a, b, getMetascore, true));
      case "meta_low":
        return arr.sort((a, b) => cmp(a, b, getMetascore, false));
      case "price_high":
        return arr.sort((a, b) => cmp(a, b, getPrice, true));
      case "price_low":
        return arr.sort((a, b) => cmp(a, b, getPrice, false));
      default: {
        const dynMatch = sortKey.match(/^__dyn_(.+)_(high|low)$/);
        if (dynMatch) {
          const [, field, dir] = dynMatch;
          const getter = (item: ResultItem) => {
            const n = parseFloat(String(item[field] ?? "").replace(/[^0-9.-]/g, ""));
            return isNaN(n) ? null : n;
          };
          return arr.sort((a, b) => cmp(a, b, getter, dir === "high"));
        }
        return arr;
      }
    }
  }

  $effect(() => {
    const items = allResults();
    const valid = visibleSortOptions(items).map((o) => o.value);
    if (!valid.includes(sortKey)) sortKey = "default";
  });
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center gap-3">
    <div class="flex-1">
      <SearchBox />
    </div>
    {#if hasHomeSites}
      <button
        class="btn btn-sm shrink-0 gap-2"
        style="transition: transform 150ms ease-out, box-shadow 150ms ease-out;"
        onclick={fetchLatest}
        title="Fetch latest from homepage sites{activeGroupName ? ` in ${activeGroupName}` : ''}"
      >
        <RefreshCw size={14} />
        Fetch Latest
      </button>
    {/if}
  </div>

  {#if store.groups.length > 0}
    <GroupPicker />
  {/if}

  {#if activeJobs.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each activeJobs as job (job.jobId)}
        <LoadingState {job} />
      {/each}
    </div>
  {/if}

  {#if activeJobs.length === 0 && failedJobs.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each failedJobs as job (job.jobId)}
        <div
          class="bg-base-100/60 border-error/40 flex items-center gap-2 rounded-lg border px-3 py-2"
          in:scale={{ duration: 200, start: 0.8 }}
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-error text-xs font-medium">{label(job.siteId)}</span>
            <span class="text-error/60 text-[10px]">{job.error || "Failed to fetch"}</span>
          </div>
          <div class="ml-auto flex items-center gap-1.5">
            <button class="btn btn-error btn-xs gap-1" onclick={() => retryFailedSite(job.siteId)} type="button">
              <RefreshCw size={10} /> Retry
            </button>
            <button
              class="btn btn-info btn-xs gap-1"
              onclick={() => {
                store.editingSiteId = job.siteId;
                store.screen = "settings";
              }}
              type="button"
              title="Edit site URL and configuration"
            >
              <Edit size={10} /> Edit
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div>
    <div role="tablist" class="tabs tabs-box bg-base-100/40! rounded-box h-auto! flex-wrap p-1 {hasFilterableTabs ? 'rounded-b-none' : ''}">
      {#if providerTabs.length > 0}
        <button
          role="tab"
          class="tab font-medium {store.activeTab === 'all' ? 'tab-active' : ''}"
          onclick={() => (store.activeTab = "all")}
        >
          {activeGroupName ? `All (${activeGroupName})` : "All"}
        </button>
      {/if}

      {#each providerTabs as siteId (siteId)}
        {@const site = store.siteCfgs.find((s) => s.id === siteId)}
        <button
          role="tab"
          class="tab gap-2 font-medium {store.activeTab === siteId ? 'tab-active' : ''}"
          onclick={() => (store.activeTab = siteId)}
        >
          {#if site?.faviconUrl}
            <img src={site.faviconUrl} class="h-3.5 w-3.5 shrink-0" alt="" />
          {:else if site?.listingUrl}
            {@const hostname = (() => {
              try {
                return new URL(site.listingUrl).hostname;
              } catch {
                return null;
              }
            })()}
            {#if hostname}
              <img src="https://www.google.com/s2/favicons?sz=32&domain={hostname}" class="h-3.5 w-3.5 shrink-0" alt="" />
            {/if}
          {/if}
          <span class="max-w-[120px] truncate">{label(siteId)}</span>
          <span class="text-[10px] opacity-50">({siteResults(siteId).length})</span>
        </button>
      {/each}

      {#if store.activeTab === "all"}
        {@const opts = visibleSortOptions(applyFilters(allResults()))}
        {#if opts.length > 1}
          <div class="ml-auto flex shrink-0 items-center pl-2">
            <label class="text-base-content/50 flex cursor-pointer items-center gap-1.5 text-xs">
              <ArrowUpDown size={12} class="shrink-0" />
              <select
                class="select select-xs bg-base-100 cursor-pointer border-none text-xs font-medium shadow-none focus:outline-none"
                bind:value={sortKey}
              >
                {#each opts as opt (opt.value)}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </label>
          </div>
        {/if}
      {:else}
        {@const opts = visibleSortOptions(applyFilters(siteResults(store.activeTab)))}
        {#if opts.length > 1}
          <div class="ml-auto flex shrink-0 items-center pl-2">
            <label class="text-base-content/50 flex cursor-pointer items-center gap-1.5 text-xs">
              <ArrowUpDown size={12} class="shrink-0" />
              <select
                class="select select-xs cursor-pointer border-none text-xs font-medium shadow-none focus:outline-none"
                bind:value={sortKey}
              >
                {#each opts as opt (opt.value)}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </label>
          </div>
        {/if}
      {/if}
    </div>

    {#if hasFilterableTabs}
      <div class="border-base-300/50 rounded-b-box bg-base-100/20 border-x border-b px-3 py-1.5">
        <button class="flex w-full items-center gap-1.5 text-left" onclick={() => (filtersOpen = !filtersOpen)}>
          <Filter size={11} class="text-base-content/40 shrink-0" />
          <span class="text-base-content/50 text-xs font-medium">Filter</span>
          {#if hasActiveFilters}
            <span class="bg-primary/20 text-primary ml-1 rounded-full px-1.5 py-0 text-[10px] font-semibold">active</span>
          {/if}
          <ChevronDown
            size={12}
            class="text-base-content/30 ml-auto shrink-0"
            style="transition: transform 200ms ease; transform: rotate({filtersOpen ? 180 : 0}deg);"
          />
        </button>

        {#if filtersOpen}
          <div class="flex flex-col gap-2 pt-2 pb-1" transition:slide={{ duration: 200 }}>
            {#each filterableTabs() as group (group.field)}
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-base-content/35 w-20 shrink-0 truncate text-[10px] font-semibold tracking-wide uppercase"
                  >{group.label}</span
                >

                {#if group.kind === "enum"}
                  <div class="flex flex-wrap gap-1">
                    <button
                      class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style="transition: background-color 120ms, color 120ms;"
                      class:bg-primary={getActiveFilter(group.field) === "all"}
                      class:text-primary-content={getActiveFilter(group.field) === "all"}
                      class:bg-base-200={getActiveFilter(group.field) !== "all"}
                      class:text-base-content={getActiveFilter(group.field) !== "all"}
                      onclick={() => setFilter(group.field, "all")}>All</button
                    >
                    {#each group.values as value (value)}
                      <button
                        class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                        style="transition: background-color 120ms, color 120ms;"
                        class:bg-primary={getActiveFilter(group.field) === value}
                        class:text-primary-content={getActiveFilter(group.field) === value}
                        class:bg-base-200={getActiveFilter(group.field) !== value}
                        class:text-base-content={getActiveFilter(group.field) !== value}
                        onclick={() => setFilter(group.field, value)}>{value}</button
                      >
                    {/each}
                  </div>
                {:else if group.kind === "bool"}
                  <div class="flex gap-1">
                    {#each ["all", "true", "false"] as val (val)}
                      <button
                        class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                        style="transition: background-color 120ms, color 120ms;"
                        class:bg-primary={getActiveFilter(group.field) === val}
                        class:text-primary-content={getActiveFilter(group.field) === val}
                        class:bg-base-200={getActiveFilter(group.field) !== val}
                        class:text-base-content={getActiveFilter(group.field) !== val}
                        onclick={() => setFilter(group.field, val)}>{val === "all" ? "Any" : val === "true" ? "Yes" : "No"}</button
                      >
                    {/each}
                  </div>
                {:else if group.kind === "range"}
                  {@const rf = getRangeFilter(group.field)}
                  <div class="flex items-center gap-1.5">
                    <input
                      type="number"
                      class="input input-xs bg-base-200 border-base-300 w-20 text-xs"
                      placeholder="Min ({group.min})"
                      value={rf.min}
                      oninput={(e) => setRangeFilter(group.field, (e.target as HTMLInputElement).value, rf.max)}
                    />
                    <span class="text-base-content/30 text-xs">–</span>
                    <input
                      type="number"
                      class="input input-xs bg-base-200 border-base-300 w-20 text-xs"
                      placeholder="Max ({group.max})"
                      value={rf.max}
                      oninput={(e) => setRangeFilter(group.field, rf.min, (e.target as HTMLInputElement).value)}
                    />
                    {#if rf.min !== "" || rf.max !== ""}
                      <button
                        class="text-base-content/40 hover:text-base-content text-xs"
                        onclick={() => setRangeFilter(group.field, "", "")}>✕</button
                      >
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <div>
      {#if store.activeTab === "all"}
        {@const displayItems = sortedResults(applyFilters(allResults()))}
        <div
          role="tabpanel"
          class="border-base-300 rounded-box bg-base-100/10! animate-fade-in border p-4 backdrop-blur-md {hasFilterableTabs
            ? 'rounded-t-none border-t-0'
            : ''}"
        >
          {#if activeJobs.length > 0 && allResults().length === 0}
            <div class="result-card-grid">
              {#each { length: skeletonCount } as _, i (i)}
                <div class="card card-compact bg-base-100/40 border-base-300 animate-pulse overflow-hidden border backdrop-blur-md">
                  <div class="bg-base-content/10 skeleton {skeletonHeight()} w-full"></div>
                  <div class="card-body gap-2">
                    <div class="skeleton bg-base-content/10 h-3 w-20 rounded"></div>
                    <div class="skeleton bg-base-content/10 h-4 w-full rounded"></div>
                    <div class="skeleton bg-base-content/10 h-4 w-3/4 rounded"></div>
                    <div class="skeleton bg-base-content/10 mt-1 h-3 w-1/2 rounded"></div>
                    <div class="mt-auto">
                      <div class="skeleton bg-base-content/10 h-4 w-16 rounded-full"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else if displayItems.length === 0}
            <div class="text-base-content/40 flex flex-col items-center justify-center py-16">
              {#if hasActiveFilters}
                <p class="text-lg">No results match the filter</p>
                <button class="btn btn-ghost btn-sm mt-3 text-xs" onclick={() => (activeFilters = {})}>Clear filters</button>
              {:else}
                <p class="text-lg">No results yet</p>
                <p class="mt-1 text-sm">Results will appear here as sites are searched</p>
              {/if}
            </div>
          {:else}
            <div class="result-card-grid">
              {#each displayItems as item, idx (`${item.siteId}:${item.url}:${item.publish_date ?? ""}:${idx}`)}
                <ResultCard {item} />
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        {@const siteId = store.activeTab}
        {@const displayItems = sortedResults(applyFilters(getVisibleResults()))}
        <div
          role="tabpanel"
          class="border-base-300 rounded-box bg-base-100/10! animate-fade-in border p-4 backdrop-blur-md {hasFilterableTabs
            ? 'rounded-t-none border-t-0'
            : ''}"
        >
          {#if activeJobs.length > 0 && siteResults(siteId).length === 0}
            <div class="result-card-grid">
              {#each { length: 3 } as _, i (i)}
                <div class="card card-compact bg-base-100/40 border-base-300 animate-pulse overflow-hidden border backdrop-blur-md">
                  <div class="bg-base-content/10 skeleton {skeletonHeight()} w-full"></div>
                  <div class="card-body gap-2">
                    <div class="skeleton bg-base-content/10 h-3 w-20 rounded"></div>
                    <div class="skeleton bg-base-content/10 h-4 w-full rounded"></div>
                    <div class="skeleton bg-base-content/10 h-4 w-3/4 rounded"></div>
                    <div class="skeleton bg-base-content/10 mt-1 h-3 w-1/2 rounded"></div>
                    <div class="mt-auto">
                      <div class="skeleton bg-base-content/10 h-4 w-16 rounded-full"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else if displayItems.length === 0}
            <div class="text-base-content/40 flex flex-col items-center justify-center py-16">
              {#if hasActiveFilters}
                <p class="text-sm">No results match the filter</p>
                <button class="btn btn-ghost btn-sm mt-3 text-xs" onclick={() => (activeFilters = {})}>Clear filters</button>
              {:else}
                <p class="text-sm">No results from {label(siteId)}</p>
              {/if}
            </div>
          {:else}
            <div class="result-card-grid">
              {#each displayItems as item, idx (`${item.siteId}:${item.url}:${item.publish_date ?? ""}:${idx}`)}
                <ResultCard {item} />
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
