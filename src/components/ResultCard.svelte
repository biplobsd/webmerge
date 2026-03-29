<script lang="ts">
  import type { ResultItem } from "src/lib/types";
  import { store, getEffectiveLayout } from "src/lib/store.svelte";
  import { OMDB_LABELS_SHORT, fmtDate } from "src/lib/cardRenderConfig";
  import { IMDB_URL_PREFIX, RT_SEARCH_PREFIX, METACRITIC_SEARCH_PREFIX } from "src/lib/constants";
  import { fade } from "svelte/transition";
  import CardFieldRenderer from "src/components/CardFieldRenderer.svelte";

  interface Props {
    item: ResultItem;
  }

  const { item }: Props = $props();

  const siteName = $derived(store.siteCfgs.find((s) => s.id === item.siteId)?.name ?? item.siteId);
  const layout = $derived(getEffectiveLayout(item.siteId));
  const visibleFields = $derived(layout.fields.filter((f) => f.visible));
  const enrichmentData = $derived(item.enrichments ?? {});

  let mouseX = $state(160);
  let mouseY = $state(100);
  let imageError = $state(false);

  function openPopup() {
    store.popupItem = item;
  }

  function fieldValue(field: { field: string; style: string }): string {
    if (field.field === "_source") return siteName;
    const v = item[field.field];
    if (v === null || v === undefined) return "";
    if (field.style === "date") return fmtDate(String(v)) ?? "";
    if (Array.isArray(v)) return v.map(String).filter(Boolean).join(", ");
    return String(v);
  }

  const imageUrl = $derived(() => {
    const imgField = visibleFields.find((f) => f.style === "image");
    if (!imgField) return null;
    const v = item[imgField.field];
    return v ? String(v) : null;
  });
</script>

<div
  role="button"
  tabindex="0"
  class="card-root card card-compact bg-base-100/40 border-base-300 focus-visible:ring-primary/50 relative cursor-pointer overflow-hidden border shadow-sm backdrop-blur-md focus-visible:ring-2 focus-visible:outline-none"
  onclick={(e) => {
    const isInteractive = (e.target as HTMLElement).closest("a, button, input, select, textarea");
    if (isInteractive) return;
    openPopup();
  }}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      if ((e.target as HTMLElement).closest("a, button")) return;
      e.preventDefault();
      openPopup();
    }
  }}
  onmousemove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }}
>
  {#if imageUrl() && !imageError}
    <div class="bg-glow pointer-events-none absolute inset-0 -z-20 opacity-15">
      <img src={imageUrl()!} alt="" class="h-full w-full scale-150 object-cover blur-3xl" />
    </div>
  {:else}
    <div class="bg-blob-pink pointer-events-none absolute -bottom-16 -left-16 -z-20 h-48 w-48 bg-[#ff80b5] opacity-[0.08] blur-3xl"></div>
    <div class="bg-blob-purple pointer-events-none absolute -top-16 -right-16 -z-20 h-40 w-40 bg-[#9089fc] opacity-[0.05] blur-3xl"></div>
  {/if}

  <div
    class="mouse-glow pointer-events-none absolute -z-10 h-64 w-64 rounded-full bg-linear-to-br from-white/20 to-transparent opacity-0 blur-3xl"
    style="top: 0; left: 0; transform: translate3d({mouseX - 128}px, {mouseY - 128}px, 0);"
  ></div>

  {#if visibleFields.some((f) => f.style === "badge")}
    <div class="absolute top-2 right-2 z-10 flex max-w-[70%] flex-wrap gap-1">
      {#each visibleFields.filter((f) => f.style === "badge") as badgeField}
        {@const val = fieldValue(badgeField)}
        {#if val}
          <span class="badge badge-sm bg-base-100/40 border-base-300/60 text-xs shadow-sm backdrop-blur-sm">{val}</span>
        {/if}
      {/each}
    </div>
  {/if}

  {#each visibleFields.filter((f) => f.style === "image") as imgField}
    {@const src = fieldValue(imgField)}
    <figure
      class="card-figure bg-base-content/5 relative flex {imgField.height ?? 'h-96'} w-full items-center justify-center overflow-hidden"
    >
      {#if src && !imageError}
        <img
          {src}
          alt={String(item.title)}
          class="card-image absolute inset-0 h-full w-full object-cover"
          onerror={() => (imageError = true)}
        />
      {:else}
        <div class="opacity-30 select-none">
          <span class="text-[10px] font-bold tracking-[0.2em] uppercase">{siteName}</span>
        </div>
      {/if}
    </figure>
  {/each}

  <div class="card-body gap-1.5">
    {#each visibleFields.filter((f) => f.style !== "badge") as field}
      <CardFieldRenderer
        style={field.style}
        value={fieldValue(field)}
        label={field.label}
        href={field.style === "title" ? String(item.url) : undefined}
        compact={true}
        showLabel={field.showLabel !== false}
      />
    {/each}

    {#each layout.enrichments as enr}
      {@const data = enrichmentData[enr.id]}
      {@const hasVisibleData = enr.source === "omdb" ? enr.omdbFields.some((f) => data?.[f]) || !!data?.["Plot"] : !!data?.value}
      {#if data && hasVisibleData}
        <div class="flex flex-wrap gap-1.5 pt-1" in:fade={{ duration: 200 }}>
          {#if enr.source === "omdb"}
            {#each enr.omdbFields as field}
              {@const val = data[field]}
              {#if val}
                {#if field === "imdbRating" && data.imdbId}
                  <a
                    href="{IMDB_URL_PREFIX}{data.imdbId}/"
                    target="_blank"
                    rel="noreferrer"
                    onclick={(e) => e.stopPropagation()}
                    class="enr-link text-warning bg-warning/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                  >
                    ⭐ {val}
                  </a>
                {:else if field === "rottenTomatoes" && data.title}
                  <a
                    href="{RT_SEARCH_PREFIX}{encodeURIComponent(data.title)}"
                    target="_blank"
                    rel="noreferrer"
                    onclick={(e) => e.stopPropagation()}
                    class="enr-link text-error bg-error/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                  >
                    🍅 {val}
                  </a>
                {:else if field === "Metascore" && data.title}
                  <a
                    href="{METACRITIC_SEARCH_PREFIX}{encodeURIComponent(data.title)}/results"
                    target="_blank"
                    rel="noreferrer"
                    onclick={(e) => e.stopPropagation()}
                    class="enr-link text-info bg-info/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                  >
                    M {val}
                  </a>
                {:else if field === "imdbRating" || field === "rottenTomatoes" || field === "Metascore"}
                  <span
                    class="{field === 'imdbRating'
                      ? 'text-warning bg-warning/10'
                      : field === 'rottenTomatoes'
                        ? 'text-error bg-error/10'
                        : 'text-info bg-info/10'} inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                  >
                    {field === "imdbRating" ? "⭐" : field === "rottenTomatoes" ? "🍅" : "M"}
                    {val}
                  </span>
                {:else}
                  <span class="badge badge-ghost badge-sm">{OMDB_LABELS_SHORT[field] ?? field}: {val}</span>
                {/if}
              {/if}
            {/each}
          {:else}
            {@const val = data.value}
            {#if val}
              {#if data.url}
                <a href={data.url} target="_blank" rel="noreferrer" onclick={(e) => e.stopPropagation()} class="enr-url-link">
                  {#if enr.style === "rating"}
                    <span class="text-warning inline-flex items-center gap-1 text-xs font-bold">★ {val}</span>
                  {:else if enr.style === "badge"}
                    <span class="badge badge-outline badge-sm">{enr.label}: {val}</span>
                  {:else}
                    <span class="text-base-content/60 text-xs"><span class="font-medium">{enr.label}:</span> {val}</span>
                  {/if}
                </a>
              {:else if enr.style === "rating"}
                <span class="text-warning inline-flex items-center gap-1 text-xs font-bold">★ {val}</span>
              {:else if enr.style === "badge"}
                <span class="badge badge-outline badge-sm">{enr.label}: {val}</span>
              {:else}
                <span class="text-base-content/60 text-xs"><span class="font-medium">{enr.label}:</span> {val}</span>
              {/if}
            {/if}
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .card-root {
    will-change: transform;
    transition:
      transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
      box-shadow 300ms ease-out;
  }

  .card-root:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow:
      0 20px 40px -8px rgba(0, 0, 0, 0.35),
      0 8px 16px -4px rgba(0, 0, 0, 0.2);
  }

  .card-root:focus-visible {
    transform: translateY(-2px) scale(1.005);
  }

  .bg-glow {
    transition: opacity 700ms ease;
  }

  .card-root:hover .bg-glow {
    opacity: 0.4;
  }

  .bg-blob-pink {
    transition: opacity 500ms ease;
  }

  .card-root:hover .bg-blob-pink {
    opacity: 0.2;
  }

  .bg-blob-purple {
    transition: opacity 500ms ease;
  }

  .card-root:hover .bg-blob-purple {
    opacity: 0.15;
  }

  .mouse-glow {
    transition: opacity 400ms ease;
  }

  .card-root:hover .mouse-glow {
    opacity: 0.3;
  }

  .card-figure {
    transition: background-color 300ms ease;
  }

  .card-root:hover .card-figure {
    background-color: rgba(var(--color-base-content) / 0.1);
  }

  .card-image {
    will-change: transform;
    transition: transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .card-root:hover .card-image {
    transform: scale(1.1);
  }

  .enr-link {
    transition: background-color 150ms ease;
  }

  .enr-link:hover {
    filter: brightness(1.15);
  }

  .enr-url-link {
    transition: opacity 150ms ease;
    opacity: 1;
  }

  .enr-url-link:hover {
    opacity: 0.8;
  }
</style>
