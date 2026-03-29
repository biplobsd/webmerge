<script lang="ts">
  import { store, hasActiveJobs } from "src/lib/store.svelte";
  import JobItem from "./JobItem.svelte";
</script>

<div class="card bg-base-200/40 border-base-300 border backdrop-blur-md">
  <div class="card-body p-4">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold">Jobs</h3>
      {#if hasActiveJobs()}
        <button class="btn btn-error btn-xs" onclick={() => chrome.runtime.sendMessage({ type: "STOP_ALL" })}> Stop All </button>
      {/if}
    </div>

    {#if store.jobs.length === 0}
      <p class="text-base-content/40 py-2 text-center text-xs">No jobs running</p>
    {:else}
      <div class="flex flex-col gap-1">
        {#each store.jobs as job (job.jobId)}
          <JobItem {job} />
        {/each}
      </div>
    {/if}
  </div>
</div>
