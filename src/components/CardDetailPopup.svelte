<script lang="ts">
  import { store, getEffectiveLayout } from "src/lib/store.svelte";
  import { OMDB_LABELS, fmtDate } from "src/lib/cardRenderConfig";
  import { IMDB_URL_PREFIX, RT_SEARCH_PREFIX, METACRITIC_SEARCH_PREFIX } from "src/lib/constants";
  import { fade, fly, scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  const item = $derived(store.popupItem);
  const layout = $derived(item ? getEffectiveLayout(item.siteId) : null);
  const enrichmentData = $derived(item?.enrichments ?? {});
  const siteName = $derived(item ? (store.siteCfgs.find((s) => s.id === item.siteId)?.name ?? item.siteId) : "");

  let imageError = $state(false);

  $effect(() => {
    if (item) imageError = false;
  });

  function close() {
    store.popupItem = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  function fieldLabel(key: string): string {
    const MAP: Record<string, string> = {
      title: "Title",
      url: "URL",
      publish_date: "Date",
      image_url: "Image URL",
      price: "Price",
      year: "Year",
      media_type: "Type",
      exact_title: "Exact Title",
      _source: "Source",
    };
    return MAP[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const HIDDEN_KEYS = new Set(["siteId", "enrichments", "published_at"]);

  const imageUrl = $derived(
    (() => {
      if (!item || !layout) return null;
      const imgField = layout.fields.find((f) => f.visible && f.style === "image");
      if (!imgField) return null;
      const v = item[imgField.field];
      return v ? String(v) : null;
    })(),
  );

  const popupFields = $derived(
    item ? Object.entries(item).filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && String(v).trim() !== "") : [],
  );
</script>

<svelte:window onkeydown={handleKeydown} />

{#if item}
  <div class="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-md"
      in:fade={{ duration: 180 }}
      out:fade={{ duration: 150 }}
      onclick={close}
      aria-hidden="true"
    ></div>

    <div
      class="bg-base-100 border-base-300 relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl"
      style="max-height: min(88vh, 720px);"
      in:fly={{ y: 32, duration: 280, easing: cubicOut }}
      out:scale={{ start: 0.96, duration: 180, easing: cubicOut }}
    >
      {#if imageUrl && !imageError}
        <div class="relative h-52 w-full shrink-0 overflow-hidden">
          <img src={imageUrl} alt={String(item.title)} class="h-full w-full object-cover" onerror={() => (imageError = true)} />
          <div class="from-base-100 via-base-100/20 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent"></div>
          <button
            class="btn btn-circle btn-sm bg-base-100/80 border-base-300 absolute top-3 right-3 shadow-md backdrop-blur-sm"
            onclick={close}
            type="button"
            aria-label="Close">✕</button
          >
        </div>
      {:else}
        <div class="flex shrink-0 items-center justify-between px-5 pt-5 pb-0">
          <span class="badge badge-outline badge-sm">{siteName}</span>
          <button class="btn btn-circle btn-sm btn-ghost" onclick={close} type="button" aria-label="Close">✕</button>
        </div>
      {/if}

      <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div class="flex flex-col gap-1">
          {#if imageUrl && !imageError}
            <span class="badge badge-outline badge-xs w-fit">{siteName}</span>
          {/if}
          <h2 class="text-xl leading-snug font-bold">
            <a href={String(item.url)} target="_blank" rel="noopener noreferrer" class="link link-hover">{String(item.title)}</a>
          </h2>
          <p class="text-base-content/30 text-xs break-all">{String(item.url)}</p>
        </div>

        {#each layout?.enrichments ?? [] as enr}
          {@const data = enrichmentData[enr.id]}
          {@const hasVisibleData = enr.source === "omdb" ? enr.omdbFields.some((f) => data?.[f]) || !!data?.["Plot"] : !!data?.value}
          {#if data && hasVisibleData}
            <div class="border-base-300 flex flex-col gap-2 border-t pt-3">
              <span class="text-base-content/40 text-[10px] font-bold tracking-widest uppercase">{enr.label}</span>
              <div class="flex flex-wrap gap-2">
                {#if enr.source === "omdb"}
                  {#each enr.omdbFields as field}
                    {@const val = data[field]}
                    {#if val}
                      {#if field === "imdbRating" && data.imdbId}
                        <a
                          href="{IMDB_URL_PREFIX}{data.imdbId}/"
                          target="_blank"
                          rel="noreferrer"
                          class="text-warning bg-warning/10 border-warning/20 hover:bg-warning/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold transition-colors"
                        >
                          ⭐ {val}
                        </a>
                      {:else if field === "imdbRating"}
                        <span
                          class="text-warning bg-warning/10 border-warning/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold"
                          >⭐ {val}</span
                        >
                      {:else if field === "rottenTomatoes" && data.title}
                        <a
                          href="{RT_SEARCH_PREFIX}{encodeURIComponent(data.title)}"
                          target="_blank"
                          rel="noreferrer"
                          class="text-error bg-error/10 border-error/20 hover:bg-error/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold transition-colors"
                        >
                          🍅 {val}
                        </a>
                      {:else if field === "rottenTomatoes"}
                        <span
                          class="text-error bg-error/10 border-error/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold"
                          >🍅 {val}</span
                        >
                      {:else if field === "Metascore" && data.title}
                        <a
                          href="{METACRITIC_SEARCH_PREFIX}{encodeURIComponent(data.title)}/results"
                          target="_blank"
                          rel="noreferrer"
                          class="text-info bg-info/10 border-info/20 hover:bg-info/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold transition-colors"
                        >
                          M {val}
                        </a>
                      {:else if field === "Metascore"}
                        <span
                          class="text-info bg-info/10 border-info/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold"
                          >M {val}</span
                        >
                      {:else if field === "Plot"}
                        <p class="text-base-content/70 text-sm leading-relaxed">{val}</p>
                      {:else}
                        <span class="badge badge-ghost badge-md">{OMDB_LABELS[field] ?? field}: {val}</span>
                      {/if}
                    {/if}
                  {/each}
                {:else}
                  {@const val = data.value}
                  {#if val}
                    {#if data.url}
                      <a href={data.url} target="_blank" rel="noreferrer" class="transition-opacity hover:opacity-80">
                        {#if enr.style === "rating"}
                          <span
                            class="text-warning bg-warning/10 border-warning/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold"
                            >★ {val}</span
                          >
                        {:else if enr.style === "badge"}
                          <span class="badge badge-outline badge-md">{enr.label}: {val}</span>
                        {:else}
                          <span class="text-base-content/70 text-sm"><span class="font-medium">{enr.label}:</span> {val}</span>
                        {/if}
                      </a>
                    {:else if enr.style === "rating"}
                      <span
                        class="text-warning bg-warning/10 border-warning/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold"
                        >★ {val}</span
                      >
                    {:else if enr.style === "badge"}
                      <span class="badge badge-outline badge-md">{enr.label}: {val}</span>
                    {:else}
                      <span class="text-base-content/70 text-sm"><span class="font-medium">{enr.label}:</span> {val}</span>
                    {/if}
                  {/if}
                {/if}
              </div>
            </div>
          {/if}
        {/each}

        {#if popupFields.length > 0}
          <div class="border-base-300 flex flex-col gap-2 border-t pt-3">
            <span class="text-base-content/40 text-[10px] font-bold tracking-widest uppercase">All Data</span>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {#each popupFields as [key, value]}
                {#if key !== "url" && key !== "title"}
                  <dt class="text-base-content/40 font-medium whitespace-nowrap">{fieldLabel(key)}</dt>
                  <dd class="text-base-content/80 m-0 wrap-break-word">
                    {#if key === "publish_date"}
                      {fmtDate(String(value)) ?? String(value)}
                    {:else if key === "image_url"}
                      <a href={String(value)} target="_blank" rel="noopener noreferrer" class="link link-hover text-xs break-all opacity-50"
                        >{String(value).slice(0, 60)}{String(value).length > 60 ? "…" : ""}</a
                      >
                    {:else if key === "price"}
                      <span class="text-success font-semibold">{String(value)}</span>
                    {:else}
                      {String(value)}
                    {/if}
                  </dd>
                {/if}
              {/each}
            </dl>
          </div>
        {/if}

        <a href={String(item.url)} target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-1 w-full">Open in new tab →</a>
      </div>
    </div>
  </div>
{/if}
