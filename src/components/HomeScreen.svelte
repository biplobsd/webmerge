<script lang="ts">
  import AnimatedBrand from "./AnimatedBrand.svelte";
  import SitePicker from "./SitePicker.svelte";
  import SearchBox from "./SearchBox.svelte";
  import GroupPicker from "./GroupPicker.svelte";
  import HomeEmptyState from "./home/HomeEmptyState.svelte";
  import AIConfigHint from "./home/AIConfigHint.svelte";
  import FetchLatestCta from "./home/FetchLatestCta.svelte";
  import { store } from "src/lib/store.svelte";

  const homeSites = $derived(
    store.activeGroup === "all"
      ? store.siteCfgs.filter((s) => s.isHomepage && s.enabled)
      : store.siteCfgs.filter((s) => {
          const g = store.groups.find((g) => g.id === store.activeGroup);
          return s.isHomepage && s.enabled && (g?.siteIds.includes(s.id) ?? false);
        }),
  );

  const hasSites = $derived(
    store.activeGroup === "all"
      ? store.siteCfgs.length > 0
      : store.siteCfgs.some((s) => {
          const g = store.groups.find((g) => g.id === store.activeGroup);
          return g?.siteIds.includes(s.id) ?? false;
        }),
  );

  const totalResults = $derived([...store.lastResultMap.values()].flat().length);

  function fetchLatest() {
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
    store.screen = "results";
    chrome.runtime.sendMessage({ type: "FETCH_LISTINGS", sites: $state.snapshot(homeSites) });
  }
</script>

<div class="flex min-h-full flex-col items-center gap-5 px-2 py-6">
  <div class="flex w-full justify-center">
    <AnimatedBrand />
  </div>

  {#if store.groups.length > 0}
    <div class="w-full max-w-3xl">
      <GroupPicker />
    </div>
  {/if}

  {#if !store.aiApiKey}
    <div class="flex w-full justify-center">
      <AIConfigHint />
    </div>
  {/if}

  {#if hasSites}
    <div class="flex w-full justify-center">
      <SearchBox />
    </div>

    <div class="flex justify-center">
      <SitePicker />
    </div>
  {:else}
    <div>
      <HomeEmptyState />
    </div>
  {/if}

  {#if homeSites.length > 0}
    <div class="flex w-full justify-center">
      <FetchLatestCta homeSiteCount={homeSites.length} {totalResults} onFetch={fetchLatest} />
    </div>
  {/if}
</div>
