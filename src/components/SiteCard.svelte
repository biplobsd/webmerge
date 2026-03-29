<script lang="ts">
  import type { SiteConfig } from "src/lib/types";

  const { site }: { site: SiteConfig } = $props();
</script>

<div
  class="card card-compact bg-base-200/40 border-base-300 hover:border-primary w-32 shrink-0 cursor-default border backdrop-blur-md transition-colors"
>
  <div class="card-body items-center p-3 text-center">
    {#if site.faviconUrl}
      <img
        src={site.faviconUrl}
        alt={site.name}
        class="h-8 w-8 rounded object-contain"
        onerror={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    {:else}
      <div class="bg-base-300/30 flex h-8 w-8 items-center justify-center rounded text-xs font-bold">
        {site.name.charAt(0).toUpperCase()}
      </div>
    {/if}
    <span class="w-full truncate text-xs font-medium">{site.name}</span>
    {#if site.isHomepage}
      <div class="badge badge-primary badge-xs">auto</div>
    {/if}
  </div>
</div>
