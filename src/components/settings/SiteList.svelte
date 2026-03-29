<script lang="ts">
  import { Edit, Trash2, Globe, GripVertical, FolderOpen } from "lucide-svelte";
  import type { SiteConfig, SiteGroup } from "src/lib/types";

  const {
    sites,
    groups,
    onEdit,
    onDelete,
    onAssignToGroup,
    onToggle,
  }: {
    sites: SiteConfig[];
    groups: SiteGroup[];
    onEdit: (site: SiteConfig) => void;
    onDelete: (id: string) => void;
    onAssignToGroup: (siteId: string, groupId: string | null) => void;
    onToggle: (id: string, enabled: boolean) => void;
  } = $props();

  let draggedSiteId = $state<string | null>(null);
  let dragOverTarget = $state<string | null>(null);

  function getSitesForGroup(groupId: string): SiteConfig[] {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    return sites.filter((s) => group.siteIds.includes(s.id));
  }

  const ungroupedSites = $derived(sites.filter((s) => !groups.some((g) => g.siteIds.includes(s.id))));

  function confirmDelete(site: SiteConfig) {
    if (confirm(`Delete "${site.name}"?`)) onDelete(site.id);
  }

  function onDragStart(e: DragEvent, siteId: string) {
    draggedSiteId = siteId;
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    draggedSiteId = null;
    dragOverTarget = null;
  }

  function onDragOver(e: DragEvent, target: string) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    dragOverTarget = target;
  }

  function onDragLeave() {
    dragOverTarget = null;
  }

  function onDrop(e: DragEvent, target: string) {
    e.preventDefault();
    dragOverTarget = null;
    if (!draggedSiteId) return;
    onAssignToGroup(draggedSiteId, target === "ungrouped" ? null : target);
    draggedSiteId = null;
  }
</script>

{#snippet siteRow(site: SiteConfig, i: number)}
  <tr
    class="hover border-base-200 animate-slide-in-up cursor-grab transition-colors duration-150 active:cursor-grabbing
      {draggedSiteId === site.id ? 'opacity-40' : ''}"
    style="animation-delay: {i * 30}ms"
    draggable="true"
    ondragstart={(e) => onDragStart(e, site.id)}
    ondragend={onDragEnd}
  >
    <td class="w-4 pr-0"><GripVertical size={14} class="text-base-content/20" /></td>
    <td>
      <input
        type="checkbox"
        class="toggle toggle-success toggle-xs"
        checked={site.enabled}
        title={site.enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
        onchange={(e) => onToggle(site.id, (e.currentTarget as HTMLInputElement).checked)}
        onclick={(e) => e.stopPropagation()}
      />
    </td>
    <td>
      <div class="flex items-center gap-2">
        {#if site.faviconUrl}
          <img
            src={site.faviconUrl}
            alt=""
            class="h-4 w-4 rounded-sm object-contain"
            onerror={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        {:else}
          <div class="bg-base-300/30 flex h-4 w-4 items-center justify-center rounded-sm">
            <Globe size={10} class="text-base-content/30" />
          </div>
        {/if}
        <span class="text-sm font-semibold">{site.name}</span>
      </div>
    </td>
    <td>
      <code class="text-base-content/50 bg-base-200/40 block max-w-48 truncate rounded px-1.5 py-0.5 text-xs">
        {site.searchUrlTemplate}
      </code>
    </td>
    <td>
      {#if site.isHomepage}
        <div class="badge badge-primary badge-sm font-medium">auto</div>
      {:else}
        <span class="text-base-content/20 text-sm">—</span>
      {/if}
    </td>
    <td>
      <div class="flex justify-end gap-1">
        <button
          class="btn btn-ghost btn-xs hover:btn-primary hover:text-primary-content transition-all duration-150"
          onclick={() => onEdit(site)}
          title="Edit"
          type="button"
        >
          <Edit size={13} />
        </button>
        <button
          class="btn btn-ghost btn-xs hover:bg-error/10 hover:text-error transition-all duration-150"
          onclick={() => confirmDelete(site)}
          title="Delete"
          type="button"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </td>
  </tr>
{/snippet}

{#snippet dropSection(targetId: string, label: string, icon: "folder" | "globe", sectionSites: SiteConfig[])}
  <div
    class="overflow-hidden rounded-xl border-2 transition-all duration-150
      {dragOverTarget === targetId && draggedSiteId ? 'border-primary bg-primary/5 shadow-sm' : 'border-base-300'}"
    ondragover={(e) => onDragOver(e, targetId)}
    ondragleave={onDragLeave}
    ondrop={(e) => onDrop(e, targetId)}
    role="region"
    aria-label="Drop zone: {label}"
  >
    <div class="bg-base-200/40 border-base-300 flex items-center gap-2 border-b px-4 py-2.5">
      {#if icon === "folder"}
        <FolderOpen size={14} class="text-primary shrink-0" />
      {:else}
        <Globe size={14} class="text-base-content/40 shrink-0" />
      {/if}
      <span class="text-base-content/60 text-xs font-semibold tracking-wide uppercase">{label}</span>
      <span class="text-base-content/30 ml-auto text-xs">{sectionSites.length} site{sectionSites.length === 1 ? "" : "s"}</span>
      {#if draggedSiteId && dragOverTarget === targetId}
        <span class="text-primary animate-pulse text-xs font-medium">Drop here</span>
      {/if}
    </div>
    {#if sectionSites.length > 0}
      <div class="overflow-x-auto">
        <table class="table-sm table">
          <tbody>
            {#each sectionSites as site, i (site.id)}
              {@render siteRow(site, i)}
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="text-base-content/30 flex flex-col items-center justify-center gap-1 py-6">
        <p class="text-xs">No sites{icon === "folder" ? " — drag sites here to add" : ""}</p>
      </div>
    {/if}
  </div>
{/snippet}

{#if sites.length === 0}
  <div class="animate-fade-in py-20 text-center">
    <div class="bg-base-200/40 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
      <Globe size={32} class="text-base-content/20" />
    </div>
    <p class="text-base-content/50 text-lg font-semibold">No sites configured</p>
    <p class="text-base-content/30 mt-1 text-sm">Click "Add Site" to get started</p>
  </div>
{:else if groups.length === 0}
  <div class="border-base-300 animate-scale-in overflow-x-auto rounded-xl border shadow-sm">
    <table class="table-sm table">
      <thead>
        <tr class="bg-base-200/40 text-base-content/60 text-xs tracking-wide uppercase">
          <th class="w-4"></th>
          <th class="font-semibold">Enabled</th>
          <th class="font-semibold">Site</th>
          <th class="font-semibold">Search Template</th>
          <th class="font-semibold">Homepage</th>
          <th class="text-right font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each sites as site, i (site.id)}
          {@render siteRow(site, i)}
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  {#if draggedSiteId}
    <p class="text-base-content/40 animate-fade-in mb-2 text-center text-xs">Drag the site to a group section to assign it</p>
  {/if}
  <div class="flex flex-col gap-3">
    {#each groups as group (group.id)}
      {@render dropSection(group.id, group.name, "folder", getSitesForGroup(group.id))}
    {/each}
    {@render dropSection("ungrouped", "Ungrouped", "globe", ungroupedSites)}
  </div>
{/if}
