<script lang="ts">
  import { Trash2, Plus, FolderOpen, Pencil, Check, X } from "lucide-svelte";
  import type { SiteGroup } from "src/lib/types";

  const {
    groups,
    sites,
    onAdd,
    onDelete,
    onRename,
  }: {
    groups: SiteGroup[];
    sites: { id: string; name: string; faviconUrl: string }[];
    onAdd: (name: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
  } = $props();

  let newGroupName = $state("");
  let editingId = $state<string | null>(null);
  let editingName = $state("");

  function handleAdd() {
    const name = newGroupName.trim();
    if (!name) return;
    onAdd(name);
    newGroupName = "";
  }

  function startEdit(group: SiteGroup) {
    editingId = group.id;
    editingName = group.name;
  }

  function confirmEdit() {
    if (!editingId || !editingName.trim()) return;
    onRename(editingId, editingName.trim());
    editingId = null;
    editingName = "";
  }

  function cancelEdit() {
    editingId = null;
    editingName = "";
  }

  function getSiteNames(siteIds: string[]) {
    return siteIds.map((id) => sites.find((s) => s.id === id)?.name ?? id).filter(Boolean);
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center gap-2">
    <label class="input input-sm flex-1">
      <FolderOpen size={14} class="shrink-0 opacity-50" />
      <input type="text" bind:value={newGroupName} placeholder="New group name…" onkeydown={(e) => e.key === "Enter" && handleAdd()} />
    </label>
    <button type="button" class="btn btn-primary btn-sm shrink-0 gap-1" onclick={handleAdd} disabled={!newGroupName.trim()}>
      <Plus size={14} /> Add Group
    </button>
  </div>

  {#if groups.length === 0}
    <div class="animate-fade-in py-12 text-center">
      <div class="bg-base-200/40 mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl">
        <FolderOpen size={28} class="text-base-content/20" />
      </div>
      <p class="text-base-content/50 font-semibold">No groups yet</p>
      <p class="text-base-content/30 mt-1 text-xs">Type a name above and click Add Group</p>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each groups as group (group.id)}
        {@const memberNames = getSiteNames(group.siteIds)}
        <div class="border-base-300 bg-base-200/20 animate-scale-in rounded-xl border p-4 backdrop-blur-sm">
          <div class="flex items-center gap-2">
            <div class="bg-primary/10 shrink-0 rounded-lg p-1.5">
              <FolderOpen size={14} class="text-primary" />
            </div>

            {#if editingId === group.id}
              <input
                class="input input-sm min-w-0 flex-1"
                type="text"
                bind:value={editingName}
                onkeydown={(e) => {
                  if (e.key === "Enter") confirmEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <button type="button" class="btn btn-ghost btn-xs text-success" onclick={confirmEdit}>
                <Check size={14} />
              </button>
              <button type="button" class="btn btn-ghost btn-xs" onclick={cancelEdit}>
                <X size={14} />
              </button>
            {:else}
              <span class="min-w-0 flex-1 truncate text-sm font-semibold">{group.name}</span>
              <span class="text-base-content/40 shrink-0 text-xs">{group.siteIds.length} site{group.siteIds.length === 1 ? "" : "s"}</span>
              <button
                type="button"
                class="btn btn-ghost btn-xs hover:btn-primary hover:text-primary-content transition-all duration-150"
                onclick={() => startEdit(group)}
                title="Rename"><Pencil size={12} /></button
              >
              <button
                type="button"
                class="btn btn-ghost btn-xs hover:bg-error/10 hover:text-error transition-all duration-150"
                onclick={() => {
                  if (confirm(`Delete group "${group.name}"?`)) onDelete(group.id);
                }}
                title="Delete group"><Trash2 size={12} /></button
              >
            {/if}
          </div>

          {#if memberNames.length > 0}
            <div class="mt-3 flex flex-wrap gap-1 pl-8">
              {#each memberNames as name}
                <span class="badge badge-sm badge-ghost">{name}</span>
              {/each}
            </div>
          {:else}
            <p class="text-base-content/30 mt-2 pl-8 text-xs">No sites — drag sites here from the Sites tab</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
