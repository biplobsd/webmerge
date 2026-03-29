<script lang="ts">
  import { X } from "lucide-svelte";
  import type { Job } from "src/lib/types";
  import { store } from "src/lib/store.svelte";

  const { job }: { job: Job } = $props();

  const siteName = $derived(store.siteCfgs.find((s) => s.id === job.siteId)?.name ?? job.siteId);
  let hovered = $state(false);

  async function stopJob() {
    await chrome.runtime.sendMessage({ type: "STOP_JOB", jobId: job.jobId });
  }
</script>

<div
  class="bg-base-200/40 group flex cursor-default items-center gap-2 rounded px-3 py-1.5 text-sm backdrop-blur-sm"
  role="status"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
>
  {#if hovered && (job.status === "running" || job.status === "pending")}
    <button
      class="btn btn-xs btn-ghost text-error hover:bg-error/10 h-4 min-h-0 w-4 p-0 transition-colors"
      onclick={stopJob}
      title="Stop {siteName}"
      type="button"
    >
      <X size={11} />
    </button>
  {:else}
    <span class="loading loading-spinner loading-xs text-info shrink-0"></span>
  {/if}
  <span class="text-base-content/70">{siteName}</span>
</div>
