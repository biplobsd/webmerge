<script lang="ts">
  import {
    BUILTIN_FIELDS,
    OMDB_PRESET_FIELDS,
    FIELD_TYPES,
    type CardField,
    type CardFieldStyle,
    type DynamicEnrichment,
    type FieldDataType,
  } from "src/lib/types";
  import { store, getLayoutForScope, saveCardLayout, getAvailableSchemaFields, getDefaultLayout } from "src/lib/store.svelte";
  import { STYLE_OPTIONS, fmtDate } from "src/lib/cardRenderConfig";
  import { GripVertical, Eye, EyeOff, Trash2, Plus, Sparkles, ChevronDown, ChevronUp, RotateCcw, Tag } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { fly, fade, scale } from "svelte/transition";
  import CardFieldRenderer from "src/components/CardFieldRenderer.svelte";

  let activeScope = $state("global");
  function setScope(s: string) {
    activeScope = s;
  }

  let localFields = $state<CardField[]>([]);
  let localEnrichments = $state<DynamicEnrichment[]>([]);

  $effect(() => {
    const layout = getLayoutForScope(activeScope);
    localFields = layout.fields.map((f) => ({ ...f }));
    localEnrichments = layout.enrichments.map((e) => ({ ...e }));
  });

  const EXCLUDED_KEYS = new Set(["siteId", "title", "url", "publish_date", "image_url", "enrichments"]);

  const allAvailable = $derived(() => {
    const schemaFields = getAvailableSchemaFields(activeScope);
    const builtins = BUILTIN_FIELDS.map(
      (f, i) =>
        ({
          ...f,
          id: `builtin-${i}-${f.field}`,
        }) as CardField,
    );

    const candidates: CardField[] = [...builtins, ...schemaFields];
    const inCandidates = new Set(candidates.map((f) => f.field));

    const scopeSiteIds = activeScope === "global" ? null : (store.groups.find((g) => g.id === activeScope)?.siteIds ?? []);

    store.resultMap.forEach((items, siteId) => {
      if (scopeSiteIds !== null && !scopeSiteIds.includes(siteId)) return;
      for (const item of items) {
        for (const key of Object.keys(item)) {
          if (EXCLUDED_KEYS.has(key) || inCandidates.has(key)) continue;
          inCandidates.add(key);
          candidates.push({
            id: `discovered-${key}`,
            field: key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
            style:
              key.includes("date") || key.endsWith("_at") || key.endsWith("_on")
                ? "date"
                : key === "price"
                  ? "price"
                  : key === "rating"
                    ? "rating"
                    : "text",
            visible: true,
          });
        }
      }
    });

    const inLayout = new Set(localFields.map((f) => f.field));
    return candidates.filter((f) => !inLayout.has(f.field));
  });

  let dragIdx = $state<number | null>(null);
  let dragAvailField = $state<CardField | null>(null);

  let newFieldOpen = $state(false);
  let newFieldName = $state("");
  let newFieldLabel = $state("");
  let newFieldStyle = $state<CardFieldStyle>("text");
  let newFieldDatatype = $state<FieldDataType>("string");
  let newFieldHint = $state("");
  let newFieldError = $state("");

  async function createField() {
    const key = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key) {
      newFieldError = "Field name is required";
      return;
    }
    if (localFields.some((f) => f.field === key)) {
      newFieldError = "Field already in layout";
      return;
    }
    const label = newFieldLabel.trim() || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
    const hint = newFieldHint.trim();

    const field: CardField = {
      id: `custom-${Date.now()}-${key}`,
      field: key,
      label,
      style: newFieldStyle,
      datatype: newFieldDatatype,
      visible: true,
    };
    localFields = [...localFields, field];
    saveNow();

    // Also push the field into every relevant site's schema so the AI knows to extract it
    if (hint) {
      const scopeSiteIds = activeScope === "global" ? null : (store.groups.find((g) => g.id === activeScope)?.siteIds ?? []);

      const updated = store.siteCfgs.map((site) => {
        if (scopeSiteIds !== null && !scopeSiteIds.includes(site.id)) return site;
        if (key in site.schema) return site; // already defined — don't overwrite
        return {
          ...site,
          schema: { ...site.schema, [key]: hint },
          schemaTypes: { ...(site.schemaTypes ?? {}), [key]: newFieldDatatype },
        };
      });
      store.siteCfgs = updated;
      await chrome.storage.sync.set({ sites: updated });
    }

    newFieldName = "";
    newFieldLabel = "";
    newFieldStyle = "text";
    newFieldDatatype = "string";
    newFieldHint = "";
    newFieldError = "";
    newFieldOpen = false;
    toast.success(hint ? `Field "${label}" added to layout and site schemas` : `Field "${label}" added to layout`);
  }
  let dropIdx = $state<number | null>(null);

  function onLayoutDragStart(e: DragEvent, i: number) {
    dragIdx = i;
    dragAvailField = null;
    e.dataTransfer?.setData("text/plain", "layout");
  }
  function onLayoutDragEnd() {
    dragIdx = null;
    dropIdx = null;
    dragAvailField = null;
  }

  function onAvailDragStart(e: DragEvent, field: CardField) {
    dragAvailField = field;
    dragIdx = null;
    e.dataTransfer?.setData("text/plain", "available");
  }
  function onAvailDragEnd() {
    dragAvailField = null;
  }

  function onLayoutDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    dropIdx = i;
  }

  function onLayoutDrop(e: DragEvent) {
    e.preventDefault();
    if (dragAvailField !== null) {
      if (localFields.some((f) => f.field === dragAvailField?.field)) {
        dragAvailField = null;
        dropIdx = null;
        return;
      }
      const newField = { ...dragAvailField, id: `${activeScope}-${Date.now()}-${dragAvailField.field}`, visible: true };
      if (dropIdx !== null) {
        const arr = [...localFields];
        arr.splice(dropIdx, 0, newField);
        localFields = arr;
      } else {
        localFields = [...localFields, newField];
      }
      dragAvailField = null;
      dropIdx = null;
      saveNow();
      return;
    }
    if (dragIdx === null || dropIdx === null || dragIdx === dropIdx) {
      dragIdx = null;
      dropIdx = null;
      return;
    }
    const arr = [...localFields];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(dropIdx, 0, moved);
    localFields = arr;
    dragIdx = null;
    dropIdx = null;
    saveNow();
  }

  function onZoneDrop(e: DragEvent) {
    e.preventDefault();
    if (dragAvailField !== null && dropIdx === null) {
      if (!localFields.some((f) => f.field === dragAvailField?.field)) {
        localFields = [...localFields, { ...dragAvailField, id: `${activeScope}-${Date.now()}-${dragAvailField.field}`, visible: true }];
        saveNow();
      }
      dragAvailField = null;
    } else {
      onLayoutDrop(e);
    }
  }

  function saveNow() {
    saveCardLayout({ scopeId: activeScope, fields: localFields, enrichments: localEnrichments });
  }

  let _labelTimer: ReturnType<typeof setTimeout> | null = null;
  function saveLabelDebounced() {
    if (_labelTimer) clearTimeout(_labelTimer);
    _labelTimer = setTimeout(() => saveNow(), 700);
  }

  function addField(field: CardField) {
    if (localFields.some((f) => f.field === field.field)) return;
    localFields = [...localFields, { ...field, id: `${activeScope}-${Date.now()}-${field.field}`, visible: true }];
    saveNow();
  }

  function removeField(i: number) {
    localFields = localFields.filter((_, idx) => idx !== i);
    saveNow();
  }

  async function deleteFieldGlobally(i: number) {
    const field = localFields[i];
    if (!field) return;

    if (!confirm(`Are you sure you want to delete "${field.label}" from this layout AND all site custom fields? This cannot be undone.`)) {
      return;
    }

    const fieldKey = field.field;

    // 1. Remove from local layout
    localFields = localFields.filter((_, idx) => idx !== i);
    saveNow();

    // 2. Remove from all site schemas and types
    const updated = store.siteCfgs.map((site) => {
      if (!(fieldKey in site.schema) && !(site.schemaTypes && fieldKey in site.schemaTypes)) return site;

      const newSchema = { ...site.schema };
      delete newSchema[fieldKey];

      const newTypes = site.schemaTypes ? { ...site.schemaTypes } : {};
      delete newTypes[fieldKey];

      return {
        ...site,
        schema: newSchema,
        schemaTypes: newTypes,
      };
    });

    store.siteCfgs = updated;
    await chrome.storage.sync.set({ sites: updated });

    toast.success(`"${field.label}" deleted globally`);
  }

  function toggleVisible(i: number) {
    localFields = localFields.map((f, idx) => (idx === i ? { ...f, visible: !f.visible } : f));
    saveNow();
  }

  function toggleShowLabel(i: number) {
    localFields = localFields.map((f, idx) => (idx === i ? { ...f, showLabel: f.showLabel === false ? true : false } : f));
    saveNow();
  }

  function setStyle(i: number, style: CardFieldStyle) {
    localFields = localFields.map((f, idx) => (idx === i ? { ...f, style } : f));
    saveNow();
  }

  function updateLabel(i: number, label: string) {
    localFields = localFields.map((f, idx) => (idx === i ? { ...f, label } : f));
    saveLabelDebounced();
  }

  const HEIGHT_OPTIONS = [
    { value: "h-32", label: "Small (128px)" },
    { value: "h-48", label: "Medium (192px)" },
    { value: "h-64", label: "Large (256px)" },
    { value: "h-80", label: "X-Large (320px)" },
    { value: "h-96", label: "Huge (384px)" },
    { value: "h-[30rem]", label: "Massive (480px)" },
    { value: "h-[40rem]", label: "Giant (640px)" },
  ];

  function setHeight(i: number, height: string) {
    localFields = localFields.map((f, idx) => (idx === i ? { ...f, height } : f));
    saveNow();
  }

  let expandedEnrichmentId = $state<string | null>(null);

  function addEnrichment() {
    const e: DynamicEnrichment = {
      id: crypto.randomUUID(),
      label: "IMDB & Ratings",
      source: "omdb",
      lookupField: "exact_title",
      apiKey: "",
      customUrl: "",
      customJsonPath: "",
      resultKey: `enriched_${Date.now()}`,
      style: "rating",
      omdbFields: ["imdbRating", "rottenTomatoes"],
      omdbSearchMode: "t",
      omdbYearField: "year",
      omdbType: "",
    };
    localEnrichments = [...localEnrichments, e];
    expandedEnrichmentId = e.id;
  }

  function removeEnrichment(id: string) {
    localEnrichments = localEnrichments.filter((e) => e.id !== id);
    if (expandedEnrichmentId === id) expandedEnrichmentId = null;
  }

  function patchEnrichment(id: string, patch: Partial<DynamicEnrichment>) {
    localEnrichments = localEnrichments.map((e) => (e.id === id ? { ...e, ...patch } : e));
  }

  function toggleOmdbField(enrichmentId: string, field: string) {
    const e = localEnrichments.find((e) => e.id === enrichmentId);
    if (!e) return;
    const has = e.omdbFields.includes(field);
    patchEnrichment(enrichmentId, {
      omdbFields: has ? e.omdbFields.filter((f) => f !== field) : [...e.omdbFields, field],
    });
  }

  async function save() {
    await saveCardLayout({ scopeId: activeScope, fields: localFields, enrichments: localEnrichments });
    toast.success("Card layout saved");
  }

  function reset() {
    const def = getDefaultLayout(activeScope);
    localFields = def.fields.map((f) => ({ ...f }));
    localEnrichments = [];
  }

  const MOCK: Record<string, unknown> = {
    siteId: "preview",
    title: "Sample Result — Click to Open",
    url: "https://example.com",
    publish_date: new Date(Date.now() - 3600_000 * 2).toISOString(),
    price: "$29.99",
    image_url: "https://placehold.co/400x180/6366f1/ffffff?text=Preview",
    _source: "Example Site",
    rating: "8.5/10",
    genre: "Technology",
    exact_title: "Sample Result",
    year: "2024",
    media_type: "movie",
  };

  function mockValue(field: CardField): string {
    const key = field.field;
    if (key === "_source") return store.groups.find((g) => g.id === activeScope)?.name ?? "Example Site";
    const v = MOCK[key];
    if (v !== undefined && v !== null && v !== "") {
      if (field.style === "date" && typeof v === "string") {
        return fmtDate(v, { dateStyle: "medium", timeStyle: "short" }) ?? v;
      }
      return String(v);
    }
    // For custom fields not in MOCK, return a style-appropriate placeholder
    switch (field.style) {
      case "title":
        return `${field.label} — Sample Title`;
      case "date":
        return fmtDate(new Date(Date.now() - 86400_000).toISOString(), { dateStyle: "medium", timeStyle: "short" }) ?? "Yesterday";
      case "price":
        return "$19.99";
      case "rating":
        return "8.5";
      case "badge":
        return field.label;
      case "image":
        return `https://placehold.co/400x180/6366f1/ffffff?text=${encodeURIComponent(field.label)}`;
      default:
        return `Sample ${field.label.toLowerCase()}`;
    }
  }

  const allFields = $derived(() => {
    const keys = new Set<string>();
    for (const site of store.siteCfgs) {
      for (const key of Object.keys(site.schema)) keys.add(key);
    }
    store.resultMap.forEach((items) => {
      for (const item of items) {
        for (const key of Object.keys(item)) {
          if (!EXCLUDED_KEYS.has(key)) keys.add(key);
        }
      }
    });
    return keys;
  });
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-wrap items-center gap-1">
    <span class="text-base-content/50 mr-1 text-xs font-semibold tracking-wide uppercase">Layout for:</span>
    <button
      class="btn btn-xs {activeScope === 'global' ? 'btn-primary' : 'btn-ghost'}"
      style="transition: background-color 150ms, color 150ms, border-color 150ms;"
      onclick={() => setScope("global")}
    >
      🌐 Global
    </button>
    {#each store.groups as group (group.id)}
      <button
        class="btn btn-xs {activeScope === group.id ? 'btn-primary' : 'btn-ghost'}"
        style="transition: background-color 150ms, color 150ms, border-color 150ms;"
        onclick={() => setScope(group.id)}
      >
        📁 {group.name}
      </button>
    {/each}
    {#if activeScope !== "global"}
      <span class="text-base-content/40 ml-1 text-xs">overrides Global</span>
    {/if}
  </div>

  <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
    <div class="flex flex-col gap-2">
      <h4 class="text-base-content/50 text-xs font-semibold tracking-wide uppercase">Available Fields</h4>
      <p class="text-base-content/40 text-xs">Click or drag a field into the layout</p>
      <div class="flex flex-col gap-1">
        {#each allAvailable() as field (field.field)}
          <button
            class="bg-base-200/40 border-base-300 hover:border-primary hover:bg-primary/5 group flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 text-left active:cursor-grabbing
              {dragAvailField?.field === field.field ? 'scale-95 opacity-40' : ''}"
            style="transition: background-color 150ms, border-color 150ms, opacity 150ms, transform 150ms;"
            onclick={() => addField(field)}
            draggable="true"
            ondragstart={(e) => onAvailDragStart(e, field)}
            ondragend={onAvailDragEnd}
            in:fly={{ x: -8, duration: 200 }}
          >
            <GripVertical size={11} class="text-base-content/20 shrink-0" />
            <span class="flex-1 text-sm font-medium">{field.label}</span>
            {#if field.id.startsWith("discovered-")}
              <span class="bg-info/10 text-info/70 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">live</span>
            {:else}
              <span class="text-base-content/30 shrink-0 font-mono text-xs">{field.field}</span>
            {/if}
            <Plus size={12} class="text-primary shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        {/each}
        {#if allAvailable().length === 0}
          <p class="text-base-content/30 py-4 text-center text-xs italic">All fields are in the layout</p>
        {/if}
      </div>

      <div class="border-base-300 mt-2 border-t pt-2">
        {#if !newFieldOpen}
          <button
            class="btn btn-ghost btn-xs hover:btn-primary w-full gap-1.5 transition-colors duration-150"
            onclick={() => {
              newFieldOpen = true;
              newFieldError = "";
            }}
            type="button"
          >
            <Plus size={12} /> Create custom field
          </button>
        {:else}
          <div class="bg-base-200/60 border-base-300 flex flex-col gap-2 rounded-lg border p-3" in:fly={{ y: -6, duration: 150 }}>
            <p class="text-base-content/60 text-xs font-semibold tracking-wide uppercase">New Field</p>

            <label class="input input-sm w-full">
              <span class="text-base-content/40 text-xs">key</span>
              <input
                type="text"
                bind:value={newFieldName}
                placeholder="e.g. languages"
                class="flex-1"
                onkeydown={(e) => {
                  if (e.key === "Enter") createField();
                  if (e.key === "Escape") newFieldOpen = false;
                }}
              />
            </label>

            <label class="input input-sm w-full">
              <span class="text-base-content/40 text-xs">label</span>
              <input
                type="text"
                bind:value={newFieldLabel}
                placeholder="Display label (optional)"
                class="flex-1"
                onkeydown={(e) => {
                  if (e.key === "Enter") createField();
                  if (e.key === "Escape") newFieldOpen = false;
                }}
              />
            </label>

            <select class="select select-sm bg-base-100 border-base-300 w-full text-xs" bind:value={newFieldStyle}>
              {#each STYLE_OPTIONS as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>

            <select
              class="select select-sm bg-base-100 border-base-300 w-full text-xs"
              bind:value={newFieldDatatype}
              title={FIELD_TYPES.find((t) => t.value === newFieldDatatype)?.hint ?? ""}
            >
              {#each FIELD_TYPES as ft (ft.value)}
                <option value={ft.value}>{ft.label}</option>
              {/each}
            </select>

            <label class="input input-sm w-full">
              <span class="text-base-content/40 shrink-0 text-xs">AI hint</span>
              <input
                type="text"
                bind:value={newFieldHint}
                placeholder="e.g. list of available audio languages"
                class="flex-1"
                onkeydown={(e) => {
                  if (e.key === "Enter") createField();
                  if (e.key === "Escape") newFieldOpen = false;
                }}
              />
            </label>

            <p class="text-base-content/40 text-[10px] leading-relaxed">
              <strong class="text-base-content/60">AI hint</strong> tells the AI what to extract from the page. Without it, this field will be
              empty unless the site already returns it.
            </p>

            {#if newFieldError}
              <p class="text-error text-xs">{newFieldError}</p>
            {/if}

            <div class="flex gap-2">
              <button class="btn btn-primary btn-xs flex-1" onclick={createField} type="button">Add to Layout</button>
              <button
                class="btn btn-ghost btn-xs"
                onclick={() => {
                  newFieldOpen = false;
                  newFieldError = "";
                  newFieldHint = "";
                }}
                type="button">Cancel</button
              >
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <h4 class="text-base-content/50 text-xs font-semibold tracking-wide uppercase">Card Layout</h4>
      <p class="text-base-content/40 text-xs">Drag fields here to reorder · click + to add · toggle visibility</p>
      <div
        class="flex min-h-[120px] flex-col gap-1 rounded-xl border-2 border-dashed p-2 transition-colors duration-150
          {dragAvailField !== null ? 'border-primary bg-primary/5' : 'border-base-300'}"
        role="list"
        ondragover={(e) => {
          e.preventDefault();
        }}
        ondrop={onZoneDrop}
      >
        {#each localFields as field, i (field.id)}
          <div
            class="bg-base-100/60 flex items-center gap-2 rounded-lg border px-2 py-1.5
              {dragIdx === i ? 'scale-95 opacity-40' : ''}
              {dropIdx === i && (dragIdx !== null || dragAvailField !== null) && dragIdx !== i
              ? 'border-primary bg-primary/5'
              : 'border-base-300'}
              {!field.visible ? 'opacity-50' : ''}"
            style="transition: background-color 150ms, border-color 150ms, opacity 150ms, transform 150ms;"
            role="listitem"
            draggable="true"
            ondragstart={(e) => onLayoutDragStart(e, i)}
            ondragend={onLayoutDragEnd}
            ondragover={(e) => onLayoutDragOver(e, i)}
          >
            <GripVertical size={12} class="text-base-content/20 shrink-0 cursor-grab" />

            <input
              class="input input-xs min-w-0 flex-1 border-none bg-transparent text-sm font-medium shadow-none focus:outline-none"
              type="text"
              value={field.label}
              oninput={(e) => updateLabel(i, (e.target as HTMLInputElement).value)}
            />

            <select
              class="select select-xs bg-base-200 border-base-300 w-28 shrink-0 text-xs"
              value={field.style}
              onchange={(e) => setStyle(i, (e.target as HTMLSelectElement).value as CardFieldStyle)}
            >
              {#each STYLE_OPTIONS as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>

            {#if field.style === "image"}
              <select
                class="select select-xs bg-base-200 border-base-300 w-32 shrink-0 text-xs"
                value={field.height ?? "h-96"}
                onchange={(e) => setHeight(i, (e.target as HTMLSelectElement).value)}
              >
                {#each HEIGHT_OPTIONS as opt (opt.value)}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            {/if}

            <button
              class="btn btn-ghost btn-xs p-1 {field.showLabel === false ? 'text-base-content/20' : 'text-base-content/60'}"
              onclick={() => toggleShowLabel(i)}
              title={field.showLabel === false ? "Show label" : "Hide label"}
              type="button"
            >
              <Tag size={12} class={field.showLabel === false ? "opacity-25" : ""} />
            </button>

            <button
              class="btn btn-ghost btn-xs p-1 {field.visible ? 'text-base-content/60' : 'text-base-content/20'}"
              onclick={() => toggleVisible(i)}
              title={field.visible ? "Hide field" : "Show field"}
              type="button"
            >
              {#if field.visible}<Eye size={12} />{:else}<EyeOff size={12} />{/if}
            </button>

            <button
              class="btn btn-ghost btn-xs text-error/40 hover:text-error hover:bg-error/10 p-1"
              style="transition: background-color 150ms, color 150ms;"
              onclick={() => deleteFieldGlobally(i)}
              title="Delete from all sites"
              type="button"
            >
              <Trash2 size={11} />
            </button>

            <button
              class="btn btn-ghost btn-xs text-base-content/20 hover:text-base-content hover:bg-base-content/5 p-1"
              style="transition: background-color 150ms, color 150ms;"
              onclick={() => removeField(i)}
              title="Remove from layout only"
              type="button"
            >
              <Trash2 size={11} class="opacity-50" />
            </button>
          </div>
        {/each}

        {#if localFields.length === 0}
          <div class="text-base-content/30 flex flex-1 items-center justify-center py-8 text-xs">Add fields from the left panel</div>
        {/if}
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <h4 class="text-base-content/50 text-xs font-semibold tracking-wide uppercase">Card Preview</h4>
      <p class="text-base-content/40 text-xs">Sample card using current layout</p>
      <div class="card card-compact bg-base-100/40 border-base-300 relative overflow-hidden border shadow-sm backdrop-blur-md">
        <div class="pointer-events-none absolute -bottom-10 -left-10 -z-10 h-32 w-32 bg-[#ff80b5] opacity-[0.08] blur-3xl"></div>
        <div class="pointer-events-none absolute -top-10 -right-10 -z-10 h-24 w-24 bg-[#9089fc] opacity-[0.06] blur-3xl"></div>

        {#if localFields.some((f) => f.visible && f.style === "badge")}
          <div class="absolute top-2 left-2 z-10 flex max-w-[70%] flex-wrap gap-1">
            {#each localFields.filter((f) => f.visible && f.style === "badge") as badgeField}
              {@const val = mockValue(badgeField)}
              {#if val}
                <span class="badge badge-sm bg-base-100/80 border-base-300/60 text-xs shadow-sm backdrop-blur-sm">{val}</span>
              {/if}
            {/each}
          </div>
        {/if}

        {#each localFields.filter((f) => f.visible && f.style === "image") as imgField}
          {@const src = mockValue(imgField)}
          {#if src}
            <figure class="bg-base-content/5 relative {imgField.height ?? 'h-96'} w-full overflow-hidden">
              <img {src} alt="preview" class="h-full w-full object-cover" />
              <div class="from-base-100 via-base-100/30 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent"></div>
            </figure>
          {:else}
            <figure class="bg-base-content/5 flex {imgField.height ?? 'h-96'} w-full items-center justify-center opacity-30">
              <span class="text-[10px] font-bold tracking-[0.2em] uppercase">Preview</span>
            </figure>
          {/if}
        {/each}

        <div class="card-body gap-1.5">
          {#each localFields.filter((f) => f.style !== "badge") as field}
            {#if field.visible}
              <CardFieldRenderer
                style={field.style}
                value={mockValue(field)}
                label={field.label}
                href={field.style === "title" ? "#preview" : undefined}
                compact={false}
                showLabel={field.showLabel !== false}
              />
            {/if}
          {/each}

          {#each localEnrichments as enr}
            <div class="border-base-300/50 text-info/70 mt-1 flex items-center gap-1.5 border-t pt-1 text-xs">
              <Sparkles size={10} />
              <span class="italic">{enr.label} · live data</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="flex items-center gap-2 text-sm font-bold">
          <Sparkles size={14} class="text-info" />
          Dynamic Enrichments
        </h4>
        <p class="text-base-content/40 mt-0.5 text-xs">Fetch live data (IMDB, Rotten Tomatoes, custom APIs) and display it on each card</p>
      </div>
      <button
        class="btn btn-outline btn-sm gap-1.5 hover:-translate-y-0.5"
        style="transition: background-color 150ms, border-color 150ms, color 150ms, transform 150ms, box-shadow 150ms;"
        onclick={addEnrichment}
        type="button"
      >
        <Plus size={14} /> Add Enrichment
      </button>
    </div>

    {#each localEnrichments as enr (enr.id)}
      <div
        class="border-base-300 bg-base-200/20 animate-scale-in overflow-hidden rounded-xl border"
        in:fly={{ y: 8, duration: 220 }}
        out:scale={{ duration: 160, start: 0.95 }}
      >
        <div class="bg-base-200/40 flex items-center gap-3 px-4 py-3">
          <div class="bg-info/10 rounded-lg p-1.5">
            <Sparkles size={12} class="text-info" />
          </div>
          <input
            class="input input-sm min-w-0 flex-1 border-none bg-transparent font-semibold shadow-none focus:outline-none"
            type="text"
            value={enr.label}
            oninput={(e) => patchEnrichment(enr.id, { label: (e.target as HTMLInputElement).value })}
          />
          <button
            class="btn btn-ghost btn-xs"
            onclick={() => (expandedEnrichmentId = expandedEnrichmentId === enr.id ? null : enr.id)}
            type="button"
          >
            {#if expandedEnrichmentId === enr.id}
              <ChevronUp size={14} />
            {:else}
              <ChevronDown size={14} />
            {/if}
          </button>
          <button
            class="btn btn-ghost btn-xs text-error/50 hover:text-error hover:bg-error/10"
            style="transition: background-color 150ms, color 150ms;"
            onclick={() => removeEnrichment(enr.id)}
            type="button"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {#if expandedEnrichmentId === enr.id}
          <div class="flex flex-col gap-4 p-4" in:fly={{ y: -6, duration: 200 }}>
            <div class="flex gap-2">
              <button
                class="btn btn-sm flex-1 {enr.source === 'omdb' ? 'btn-info' : 'btn-ghost'}"
                style="transition: background-color 150ms, color 150ms, border-color 150ms;"
                onclick={() => patchEnrichment(enr.id, { source: "omdb" })}
                type="button"
              >
                🎬 OMDb (IMDB / RT)
              </button>
              <button
                class="btn btn-sm flex-1 {enr.source === 'custom' ? 'btn-secondary' : 'btn-ghost'}"
                style="transition: background-color 150ms, color 150ms, border-color 150ms;"
                onclick={() => patchEnrichment(enr.id, { source: "custom" })}
                type="button"
              >
                🔗 Custom API
              </button>
            </div>

            <div>
              <span class="fieldset-legend mb-1 block text-xs">Lookup using field</span>
              <select
                class="select select-sm select-bordered w-full"
                value={enr.lookupField}
                onchange={(e) => patchEnrichment(enr.id, { lookupField: (e.target as HTMLSelectElement).value })}
              >
                <option value="exact_title">exact_title (AI-cleaned, recommended)</option>
                <option value="title">title</option>
                <option value="url">url</option>
                {#each allFields() as key}
                  {#if key !== "exact_title"}
                    <option value={key}>{key}</option>
                  {/if}
                {/each}
              </select>
              <p class="text-base-content/40 mt-1 text-xs">The value of this field is used to look up data from the source</p>
            </div>

            {#if enr.source === "omdb"}
              <div>
                <span class="fieldset-legend mb-1 block text-xs">OMDb API Key</span>
                <label class="input input-sm w-full">
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
                    <path
                      d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                    />
                  </svg>
                  <input
                    type="text"
                    value={enr.apiKey}
                    oninput={(e) => patchEnrichment(enr.id, { apiKey: (e.target as HTMLInputElement).value })}
                    placeholder="Get free key at omdbapi.com"
                  />
                </label>
              </div>

              <div>
                <span class="fieldset-legend mb-1 block text-xs">Title Search Mode</span>
                <div class="flex gap-2">
                  <button
                    class="btn btn-sm flex-1 {(enr.omdbSearchMode ?? 't') === 't' ? 'btn-info' : 'btn-ghost'}"
                    style="transition: background-color 150ms, color 150ms, border-color 150ms;"
                    onclick={() => patchEnrichment(enr.id, { omdbSearchMode: "t" })}
                    type="button"
                    title="Exact title match (t=)"
                  >
                    Exact (t=)
                  </button>
                  <button
                    class="btn btn-sm flex-1 {(enr.omdbSearchMode ?? 't') === 's' ? 'btn-info' : 'btn-ghost'}"
                    style="transition: background-color 150ms, color 150ms, border-color 150ms;"
                    onclick={() => patchEnrichment(enr.id, { omdbSearchMode: "s" })}
                    type="button"
                    title="Partial/fuzzy search (s=)"
                  >
                    Fuzzy (s=)
                  </button>
                </div>
                <p class="text-base-content/40 mt-1 text-xs">
                  <span class="font-medium">Exact</span> matches the full title precisely.
                  <span class="font-medium">Fuzzy</span> returns a list of partial matches.
                </p>
              </div>

              <div>
                <span class="fieldset-legend mb-1 block text-xs">Year field (optional)</span>
                <select
                  class="select select-sm select-bordered w-full"
                  value={enr.omdbYearField ?? "year"}
                  onchange={(e) => patchEnrichment(enr.id, { omdbYearField: (e.target as HTMLSelectElement).value })}
                >
                  <option value="">— None —</option>
                  <option value="year">year (AI-extracted)</option>
                  {#each allFields() as key}
                    {#if key !== "year"}
                      <option value={key}>{key}</option>
                    {/if}
                  {/each}
                </select>
                <p class="text-base-content/40 mt-1 text-xs">Narrows OMDB results to the correct release year (y= param)</p>
              </div>

              <div>
                <span class="fieldset-legend mb-1 block text-xs">Media Type (optional)</span>
                <select
                  class="select select-sm select-bordered w-full"
                  value={enr.omdbType ?? ""}
                  onchange={(e) => patchEnrichment(enr.id, { omdbType: (e.target as HTMLSelectElement).value })}
                >
                  <option value="">— Any —</option>
                  <option value="movie">Movie</option>
                  <option value="series">Series / TV Show</option>
                  <option value="episode">Episode</option>
                </select>
                <p class="text-base-content/40 mt-1 text-xs">Filters results by type (type= param)</p>
              </div>

              <div>
                <span class="fieldset-legend mb-2 block text-xs">Show these fields on the card</span>
                <div class="grid grid-cols-2 gap-1.5">
                  {#each OMDB_PRESET_FIELDS as preset}
                    <label
                      class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5
                      {enr.omdbFields.includes(preset.key)
                        ? 'bg-info/10 border-info/30 border'
                        : 'bg-base-200/40 border-base-300 hover:border-info/30 border'}"
                      style="transition: background-color 150ms, border-color 150ms;"
                    >
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-info"
                        checked={enr.omdbFields.includes(preset.key)}
                        onchange={() => toggleOmdbField(enr.id, preset.key)}
                      />
                      <span class="text-xs font-medium">{preset.label}</span>
                    </label>
                  {/each}
                </div>
              </div>
            {:else}
              <div>
                <span class="fieldset-legend mb-1 block text-xs">API URL Template</span>
                <label class="input input-sm w-full">
                  <input
                    type="text"
                    value={enr.customUrl}
                    oninput={(e) => patchEnrichment(enr.id, { customUrl: (e.target as HTMLInputElement).value })}
                    placeholder="https://api.example.com/lookup?q={'{value}'}&y={'{year}'}"
                  />
                </label>
                <p class="text-base-content/40 mt-1 text-xs">
                  Placeholders:
                  <code class="bg-base-300/30 rounded px-1">{"{value}"}</code> = lookup field value ·
                  <code class="bg-base-300/30 rounded px-1">{"{title}"}</code> = item title ·
                  <code class="bg-base-300/30 rounded px-1">{"{year}"}</code> = AI-extracted year
                </p>
              </div>
              <div>
                <span class="fieldset-legend mb-1 block text-xs">JSON Path to value</span>
                <label class="input input-sm w-full">
                  <input
                    type="text"
                    value={enr.customJsonPath}
                    oninput={(e) => patchEnrichment(enr.id, { customJsonPath: (e.target as HTMLInputElement).value })}
                    placeholder="data.rating"
                  />
                </label>
                <p class="text-base-content/40 mt-1 text-xs">Dot-notation path in the JSON response</p>
              </div>
              <div>
                <span class="fieldset-legend mb-1 block text-xs">Result Key (internal)</span>
                <label class="input input-sm w-full">
                  <input
                    type="text"
                    value={enr.resultKey}
                    oninput={(e) => patchEnrichment(enr.id, { resultKey: (e.target as HTMLInputElement).value })}
                    placeholder="my_rating"
                  />
                </label>
              </div>
              <div>
                <span class="fieldset-legend mb-1 block text-xs">Display Style</span>
                <select
                  class="select select-sm select-bordered w-full"
                  value={enr.style}
                  onchange={(e) => patchEnrichment(enr.id, { style: (e.target as HTMLSelectElement).value as DynamicEnrichment["style"] })}
                >
                  <option value="rating">⭐ Rating</option>
                  <option value="badge">🏷 Badge</option>
                  <option value="text">📝 Text</option>
                </select>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}

    {#if localEnrichments.length === 0}
      <div class="border-base-300 rounded-xl border border-dashed p-6 text-center" in:fade={{ duration: 200 }}>
        <Sparkles size={24} class="text-base-content/20 mx-auto mb-2" />
        <p class="text-base-content/40 text-sm">No enrichments yet</p>
        <p class="text-base-content/30 mt-1 text-xs">
          Add an OMDb enrichment to show IMDB ratings, Rotten Tomatoes scores, and more on every card
        </p>
      </div>
    {/if}
  </div>

  <div class="border-base-300 flex items-center justify-between border-t pt-3">
    <button class="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content gap-1.5" onclick={reset} type="button">
      <RotateCcw size={13} /> Reset to default
    </button>
    <button
      class="btn btn-primary btn-sm shadow-sm hover:-translate-y-0.5 hover:shadow-md"
      style="transition: transform 150ms, box-shadow 150ms;"
      onclick={save}
      type="button"
    >
      Save Layout
    </button>
  </div>
</div>
