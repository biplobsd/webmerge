<script lang="ts">
  import { untrack } from "svelte";
  import { FIELD_TYPES, type SiteConfig, type CardFieldStyle } from "src/lib/types";
  import { SiteConfigSchema } from "src/lib/schemas";
  import { getLayoutForScope, saveCardLayout } from "src/lib/store.svelte";

  const {
    site = null,
    compact = false,
    onSave,
    onCancel,
  }: {
    site?: SiteConfig | null;
    compact?: boolean;
    onSave: (site: SiteConfig) => void;
    onCancel: () => void;
  } = $props();

  let name = $state(untrack(() => site?.name ?? ""));
  let faviconUrl = $state(untrack(() => site?.faviconUrl ?? ""));
  let searchUrlTemplate = $state(untrack(() => site?.searchUrlTemplate ?? ""));
  let listingUrl = $state(untrack(() => site?.listingUrl ?? ""));
  let cookies = $state(untrack(() => site?.cookies ?? ""));
  let isHomepage = $state(untrack(() => site?.isHomepage ?? true));
  let enabled = $state(untrack(() => site?.enabled ?? true));
  let useBaseUrlAsListing = $state(false);
  let schemaEntries = $state<Array<{ key: string; value: string; datatype: string }>>(
    untrack(() =>
      Object.entries(site?.schema ?? {}).map(([key, value]) => ({
        key,
        value,
        datatype: site?.schemaTypes?.[key] ?? "string",
      })),
    ),
  );

  let errors = $state<Record<string, string>>({});
  let formEl = $state<HTMLDivElement | null>(null);

  function getBaseUrl(template: string): string {
    try {
      const url = new URL(template.replace("{query}", "test"));
      return url.origin;
    } catch {
      return "";
    }
  }

  function handleUseBaseUrlChange(checked: boolean) {
    useBaseUrlAsListing = checked;
    if (checked && searchUrlTemplate) {
      const base = getBaseUrl(searchUrlTemplate);
      if (base) listingUrl = base;
    }
  }

  $effect(() => {
    if (useBaseUrlAsListing && searchUrlTemplate) {
      const base = getBaseUrl(searchUrlTemplate);
      if (base) listingUrl = base;
    }
  });

  function addSchemaField() {
    schemaEntries = [...schemaEntries, { key: "", value: "", datatype: "string" }];
  }

  function removeSchemaField(idx: number) {
    schemaEntries = schemaEntries.filter((_, i) => i !== idx);
  }

  function autoFavicon() {
    if (!faviconUrl && (searchUrlTemplate || listingUrl)) {
      try {
        const urlStr = listingUrl || searchUrlTemplate.replace("{query}", "test");
        const { origin } = new URL(urlStr);
        faviconUrl = `${origin}/favicon.ico`;
      } catch {
        /* url parse failed — ignore */
      }
    }
  }

  function validate(): boolean {
    errors = {};
    const result = SiteConfigSchema.safeParse({
      id: site?.id ?? crypto.randomUUID(),
      name,
      faviconUrl,
      searchUrlTemplate,
      listingUrl,
      cookies,
      isHomepage,
      enabled,
      schema: Object.fromEntries(schemaEntries.filter((e) => e.key).map((e) => [e.key, e.value])),
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      setTimeout(() => formEl?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      return false;
    }
    return true;
  }

  function datatypeToStyle(key: string, datatype: string): CardFieldStyle {
    if (key === "price") return "price";
    if (key.includes("rating") || key.includes("score")) return "rating";
    if (key.includes("date") || key.endsWith("_at") || key.endsWith("_on")) return "date";
    if (datatype === "bool") return "badge";
    return "text";
  }

  async function handleSubmit() {
    autoFavicon();
    if (!validate()) return;

    const validEntries = schemaEntries.filter((e) => e.key.trim());
    const schema = Object.fromEntries(validEntries.map((e) => [e.key.trim(), e.value.trim()]));
    const schemaTypes = Object.fromEntries(validEntries.map((e) => [e.key.trim(), e.datatype]));

    onSave({
      id: site?.id ?? crypto.randomUUID(),
      name,
      faviconUrl,
      searchUrlTemplate,
      listingUrl,
      cookies,
      isHomepage,
      enabled,
      schema,
      schemaTypes,
    });

    const layout = getLayoutForScope("global");
    const inLayout = new Set(layout.fields.map((f) => f.field));
    const SKIP = new Set(["title", "url", "publish_date", "image_url", "exact_title", "media_type", "year"]);
    const newFields = validEntries
      .map((e) => e.key.trim())
      .filter((key) => key && !inLayout.has(key) && !SKIP.has(key))
      .map((key, i) => ({
        id: `schema-${Date.now()}-${i}-${key}`,
        field: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        style: datatypeToStyle(key, schemaTypes[key] ?? "string"),
        datatype: (schemaTypes[key] ?? "string") as import("src/lib/types").FieldDataType,
        visible: true,
      }));

    if (newFields.length > 0) {
      await saveCardLayout({
        ...layout,
        fields: [...layout.fields, ...newFields],
      });
    }
  }
</script>

<div class="card bg-base-200/40 border-base-300 animate-scale-in border shadow-lg backdrop-blur-md" bind:this={formEl}>
  <div class="card-body gap-4">
    <div class="border-base-300 flex items-center gap-3 border-b pb-2">
      <div class="bg-primary h-6 w-1 rounded-full"></div>
      <h3 class="text-lg font-bold tracking-tight">{site ? "Edit Site" : "Add New Site"}</h3>
    </div>

    {#if Object.keys(errors).length > 0}
      <div class="alert alert-error animate-fade-in py-2 text-sm">
        <ul class="list-inside list-disc space-y-0.5">
          {#each Object.entries(errors) as [field, msg]}
            <li><strong>{field}:</strong> {msg}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <fieldset class="fieldset animate-slide-in-up stagger-1">
      <legend class="fieldset-legend">Site Name <span class="text-error">*</span></legend>
      <label class="input w-full {errors.name ? 'input-error' : ''}">
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
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <input type="text" bind:value={name} placeholder="e.g. Hacker News" />
      </label>
      {#if errors.name}
        <p class="label text-error">{errors.name}</p>
      {:else}
        <p class="label">Display name shown in tabs and lists</p>
      {/if}
    </fieldset>

    <fieldset class="fieldset animate-slide-in-up stagger-2">
      <legend class="fieldset-legend">Favicon URL</legend>
      <label class="input w-full">
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
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <input type="url" bind:value={faviconUrl} placeholder="https://example.com/favicon.ico" />
      </label>
      <p class="label">Optional — auto-detected from URL on save</p>
    </fieldset>

    <fieldset class="fieldset animate-slide-in-up stagger-2">
      <legend class="fieldset-legend">Search URL Template <span class="text-error">*</span></legend>
      <label class="input w-full {errors.searchUrlTemplate ? 'input-error' : ''}">
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
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" bind:value={searchUrlTemplate} placeholder="https://example.com/search?q={'{query}'}" />
      </label>
      {#if errors.searchUrlTemplate}
        <p class="label text-error">{errors.searchUrlTemplate}</p>
      {:else}
        <p class="label">Must contain <code class="bg-base-300/30 rounded px-1">&#123;query&#125;</code></p>
      {/if}
    </fieldset>

    <fieldset class="fieldset animate-slide-in-up stagger-3">
      <legend class="fieldset-legend">
        <span>Default Listing URL <span class="text-error">*</span></span>
        <label class="group ml-3 flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            class="checkbox checkbox-xs checkbox-primary transition-all duration-150"
            checked={useBaseUrlAsListing}
            onchange={(e) => handleUseBaseUrlChange((e.target as HTMLInputElement).checked)}
          />
          <span class="text-base-content/60 group-hover:text-base-content/80 text-xs font-normal transition-colors">
            Use base URL from template
          </span>
        </label>
      </legend>
      <label class="input w-full {errors.listingUrl ? 'input-error' : ''} {useBaseUrlAsListing ? 'opacity-60' : ''}">
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
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <input type="url" bind:value={listingUrl} placeholder="https://example.com/newest" disabled={useBaseUrlAsListing} />
      </label>
      {#if errors.listingUrl}
        <p class="label text-error">{errors.listingUrl}</p>
      {:else}
        <p class="label">Homepage URL fetched when the extension opens</p>
      {/if}
    </fieldset>

    <fieldset class="fieldset animate-slide-in-up stagger-3">
      <legend class="fieldset-legend">Cookies</legend>
      <textarea
        bind:value={cookies}
        placeholder="name=value; another=value"
        rows="3"
        class="textarea textarea-bordered focus:textarea-primary w-full resize-y font-mono text-xs leading-relaxed transition-all duration-200"
      ></textarea>
      <p class="label">Format: <code class="bg-base-300/30 rounded px-1">name=value; name2=value2</code></p>
    </fieldset>

    <div class="animate-slide-in-up stagger-4 flex flex-wrap gap-4">
      <label class="group flex cursor-pointer items-center gap-3">
        <input type="checkbox" bind:checked={isHomepage} class="checkbox checkbox-primary transition-all duration-150" />
        <div>
          <span class="label-text group-hover:text-primary font-medium transition-colors duration-150">Homepage auto-fetch</span>
          <p class="text-base-content/40 text-xs">Fetch on extension open</p>
        </div>
      </label>
      <label class="group flex cursor-pointer items-center gap-3">
        <input type="checkbox" bind:checked={enabled} class="checkbox checkbox-success transition-all duration-150" />
        <div>
          <span class="label-text group-hover:text-success font-medium transition-colors duration-150">Enabled</span>
          <p class="text-base-content/40 text-xs">Include in searches</p>
        </div>
      </label>
    </div>

    {#if !compact}
      <fieldset class="fieldset animate-slide-in-up stagger-4">
        <legend class="fieldset-legend">
          Field Hints
          <span class="badge badge-ghost badge-sm ml-2 font-normal">optional</span>
          <button
            class="btn btn-ghost btn-xs hover:btn-primary ml-auto gap-1 transition-all duration-150"
            onclick={addSchemaField}
            type="button"
          >
            <span class="text-base leading-none">+</span> Add field
          </button>
        </legend>
        <div class="flex w-full flex-col gap-2">
          {#each schemaEntries as entry, idx}
            <div class="animate-slide-in-up flex items-center gap-2">
              <label class="input input-sm w-32 shrink-0">
                <svg
                  class="h-[1em] opacity-40"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <input type="text" bind:value={entry.key} placeholder="Field name" />
              </label>
              <label class="input input-sm flex-1">
                <svg
                  class="h-[1em] opacity-40"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                <input type="text" bind:value={entry.value} placeholder="Description for AI" />
              </label>
              <select
                class="select select-sm bg-base-200 border-base-300 w-36 shrink-0 text-xs"
                bind:value={entry.datatype}
                title={FIELD_TYPES.find((t) => t.value === entry.datatype)?.hint ?? ""}
              >
                {#each FIELD_TYPES as ft (ft.value)}
                  <option value={ft.value}>{ft.label}</option>
                {/each}
              </select>
              <button
                class="btn btn-ghost btn-xs text-error hover:bg-error/10 transition-all duration-150"
                onclick={() => removeSchemaField(idx)}
                type="button">✕</button
              >
            </div>
          {/each}
        </div>
        {#if schemaEntries.length === 0}
          <p class="label">No hints — AI extracts title, url, and publish_date by default</p>
        {/if}
      </fieldset>
    {/if}

    <div class="card-actions border-base-300 animate-slide-in-up stagger-5 mt-1 justify-end gap-2 border-t pt-3">
      <button class="btn btn-ghost btn-sm hover:bg-base-300/60 transition-all duration-150" onclick={onCancel} type="button">
        Cancel
      </button>
      <button
        class="btn btn-primary btn-sm shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        onclick={handleSubmit}
        type="button"
      >
        Save Site
      </button>
    </div>
  </div>
</div>
