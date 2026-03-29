<script lang="ts">
  import { store, getActiveGroupSiteIds } from "src/lib/store.svelte";

  async function handleSearch() {
    if (!store.query.trim()) return;

    if (store.searchMode === "onsite") {
      const groupSiteIds = getActiveGroupSiteIds();
      const sitesToSearch = groupSiteIds
        ? store.siteCfgs.filter((s) => s.enabled && groupSiteIds.includes(s.id))
        : store.siteCfgs.filter((s) => s.enabled);

      if (sitesToSearch.length === 0) return;

      const searchIds = new Set(sitesToSearch.map((s) => s.id));
      const newMap = new Map(store.resultMap);
      searchIds.forEach((id) => newMap.delete(id));
      store.resultMap = newMap;
      store.jobs = store.jobs.filter((j) => !searchIds.has(j.siteId));
    }

    store.activeTab = "all";
    store.screen = "results";

    if (store.searchMode === "onsite") {
      const groupSiteIds = getActiveGroupSiteIds();
      const sitesToSearch = groupSiteIds
        ? store.siteCfgs.filter((s) => s.enabled && groupSiteIds.includes(s.id))
        : store.siteCfgs.filter((s) => s.enabled);

      await chrome.runtime.sendMessage({
        type: "SEARCH",
        sites: $state.snapshot(sitesToSearch),
        query: store.query.trim(),
      });
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }
</script>

<div class="flex w-full max-w-2xl flex-col justify-center gap-2">
  <div class="flex flex-wrap items-center gap-2">
    <div class="bg-base-200/50 join rounded-lg p-0.5">
      <button
        class="join-item btn btn-xs border-none font-medium {store.searchMode === 'local'
          ? 'btn-primary shadow-sm'
          : 'btn-ghost opacity-60'}"
        onclick={() => (store.searchMode = "local")}
      >
        Local
      </button>
      <button
        class="join-item btn btn-xs border-none font-medium {store.searchMode === 'onsite'
          ? 'btn-primary shadow-sm'
          : 'btn-ghost opacity-60'}"
        onclick={() => (store.searchMode = "onsite")}
      >
        Onsite
      </button>
    </div>
    <span class="text-base-content/30 text-[10px] font-bold tracking-wider uppercase">Search Mode</span>
  </div>

  <div class="flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
    <label class="input w-full sm:flex-1">
      <svg
        class="h-[1em] opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        bind:value={store.query}
        placeholder={store.searchMode === "local" ? "Filter current list..." : "Search across enabled sites..."}
        onkeydown={onKeydown}
      />
    </label>
    {#if store.searchMode === "onsite"}
      <button
        class="btn btn-primary w-full gap-2 transition-all duration-150 hover:-translate-y-0.5 sm:w-auto"
        onclick={handleSearch}
        disabled={!store.query.trim()}
      >
        <svg
          class="h-[1em]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Search
      </button>
    {/if}
  </div>
</div>
