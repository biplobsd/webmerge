<script lang="ts">
  import { store } from "src/lib/store.svelte";

  function selectGroup(id: string) {
    store.activeGroup = id;
    store.activeTab = "all";
  }
</script>

{#if store.groups.length > 0}
  <div class="flex w-full gap-2 overflow-x-auto pb-1" style="scrollbar-width: none;">
    <button
      type="button"
      class="btn btn-xs shrink-0 rounded-full whitespace-nowrap transition-all duration-150
        {store.activeGroup === 'all' ? 'btn-primary shadow-sm' : 'btn-ghost border-base-300 border'}"
      onclick={() => selectGroup("all")}
    >
      All Sites
    </button>
    {#each store.groups as group (group.id)}
      <button
        type="button"
        class="btn btn-xs shrink-0 rounded-full whitespace-nowrap transition-all duration-150
          {store.activeGroup === group.id ? 'btn-primary shadow-sm' : 'btn-ghost border-base-300 border'}"
        onclick={() => selectGroup(group.id)}
      >
        {group.name}
        <span class="text-[10px] opacity-50">{group.siteIds.length}</span>
      </button>
    {/each}
  </div>
{/if}
