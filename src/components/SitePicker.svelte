<script lang="ts">
  import emblaCarouselSvelte from "embla-carousel-svelte";
  import SiteCard from "./SiteCard.svelte";
  import { store, getActiveGroupSiteIds } from "src/lib/store.svelte";

  const enabledSites = $derived(
    store.activeGroup === "all"
      ? store.siteCfgs.filter((s) => s.enabled)
      : store.siteCfgs.filter((s) => {
          const g = store.groups.find((g) => g.id === store.activeGroup);
          return s.enabled && (g?.siteIds.includes(s.id) ?? false);
        }),
  );

  const label = $derived(
    store.activeGroup === "all" ? `Sites (${enabledSites.length} enabled)` : `Sites in group (${enabledSites.length})`,
  );
</script>

<div class="w-full max-w-3xl">
  <p class="text-base-content/50 mb-2 text-sm font-medium">{label}</p>
  <div class="overflow-hidden" use:emblaCarouselSvelte={{ options: { dragFree: true, containScroll: "trimSnaps" }, plugins: [] }}>
    <div class="flex gap-3 select-none">
      {#each enabledSites as site (site.id)}
        <SiteCard {site} />
      {/each}
    </div>
  </div>
</div>
