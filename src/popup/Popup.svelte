<script lang="ts">
  import { onMount } from "svelte";
  import { CheckCircle } from "lucide-svelte";
  import { APP_SHORT_NAME } from "src/lib/constants";
  import SiteForm from "src/components/settings/SiteForm.svelte";
  import type { SiteConfig } from "src/lib/types";

  interface PendingSite {
    name: string;
    origin: string;
    pageUrl: string;
    searchUrlTemplate: string;
    listingUrl: string;
    faviconUrl: string;
    cookies: string;
  }

  let loading = $state(true);
  let saved = $state(false);
  let savedName = $state("");
  let prefill = $state<SiteConfig | null>(null);

  $effect(() => {
    document.title = `Add Site — ${APP_SHORT_NAME}`;
  });

  onMount(async () => {
    const stored = await chrome.storage.sync.get("theme");
    const theme = (stored.theme as string) ?? "dark";
    document.documentElement.setAttribute("data-theme", theme);

    const session = await chrome.storage.local.get("pendingSite");
    const pending = session.pendingSite as PendingSite | undefined;

    if (pending) {
      prefill = {
        id: crypto.randomUUID(),
        name: pending.name,
        faviconUrl: pending.faviconUrl,
        searchUrlTemplate: pending.searchUrlTemplate,
        listingUrl: pending.listingUrl,
        cookies: pending.cookies,
        isHomepage: true,
        enabled: true,
        schema: {},
      };
    }

    loading = false;
  });

  async function handleSave(site: SiteConfig) {
    const stored = await chrome.storage.sync.get("sites");
    const sites: SiteConfig[] = Array.isArray(stored.sites) ? stored.sites : [];
    sites.push(site);
    await chrome.storage.sync.set({ sites });
    await chrome.storage.local.remove("pendingSite");
    savedName = site.name;
    saved = true;
    setTimeout(() => window.close(), 1400);
  }
</script>

<div class="bg-base-100 text-base-content flex min-h-screen w-full flex-col overflow-x-hidden">
  <!-- Header -->
  <div class="bg-base-200 border-base-300 flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
    <div class="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded">
      <svg class="text-primary-content h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </div>
    <div>
      <p class="text-sm leading-none font-semibold">Add Site to {APP_SHORT_NAME}</p>
      <p class="text-base-content/50 mt-0.5 text-xs">Added ungrouped — manage groups in the app</p>
    </div>
  </div>

  <!-- Body -->
  {#if loading}
    <div class="flex flex-1 items-center justify-center">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>
  {:else if saved}
    <div class="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <CheckCircle size={44} class="text-success" />
      <p class="text-base font-semibold">Site saved!</p>
      <p class="text-base-content/60 text-center text-sm">
        <strong>{savedName}</strong> has been added to {APP_SHORT_NAME}.
      </p>
    </div>
  {:else}
    <div class="flex-1 overflow-x-hidden overflow-y-auto p-3">
      <SiteForm site={prefill} compact={true} onSave={handleSave} onCancel={() => window.close()} />
    </div>
  {/if}
</div>

<style>
  :global(html, body, #app) {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
</style>
