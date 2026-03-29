<script lang="ts">
  import { toast } from "svelte-sonner";
  import { store, getVisibleResults } from "src/lib/store.svelte";
  import ResultCard from "./ResultCard.svelte";
  import LoadingState from "./LoadingState.svelte";

  const visibleResults = $derived(getVisibleResults());
  const activeJobs = $derived(store.jobs.filter((j) => j.status === "running" || j.status === "pending"));

  $effect(() => {
    if (store.error) {
      toast.error(store.error);
      store.error = null;
    }
  });
</script>

<div>
  {#if activeJobs.length > 0}
    <div class="mb-4 flex flex-wrap gap-2">
      {#each activeJobs as job (job.jobId)}
        <LoadingState {job} />
      {/each}
    </div>
  {/if}

  {#if visibleResults.length === 0 && activeJobs.length === 0}
    <div class="text-base-content/40 flex flex-col items-center justify-center py-16">
      <p class="text-lg">No results yet</p>
      <p class="mt-1 text-sm">Results will appear here as sites are searched</p>
    </div>
  {:else}
    <div class="result-card-grid">
      {#each visibleResults as item (item.url + item.siteId)}
        <ResultCard {item} />
      {/each}
    </div>
  {/if}
</div>
