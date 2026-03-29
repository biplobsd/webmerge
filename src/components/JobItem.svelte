<script lang="ts">
  import { X } from "lucide-svelte";
  import type { Job } from "src/lib/types";
  import { store } from "src/lib/store.svelte";

  const { job }: { job: Job } = $props();

  const siteName = $derived(store.siteCfgs.find((s) => s.id === job.siteId)?.name ?? job.siteId);

  const badgeClass = $derived(
    job.status === "running"
      ? "badge-info"
      : job.status === "done"
        ? "badge-success"
        : job.status === "stopped"
          ? "badge-warning"
          : job.status === "failed"
            ? "badge-error"
            : "badge-ghost",
  );

  async function stopJob() {
    await chrome.runtime.sendMessage({ type: "STOP_JOB", jobId: job.jobId });
  }
</script>

<div class="bg-base-300/30 flex items-center justify-between gap-2 rounded px-2 py-1 text-xs">
  <span class="flex-1 truncate font-medium">{siteName}</span>
  <span class="badge badge-xs {badgeClass}">{job.status}</span>
  {#if job.status === "running" || job.status === "pending"}
    <button class="btn btn-xs btn-ghost h-5 min-h-0 w-5 p-0" onclick={stopJob} title="Stop">
      <X size={12} />
    </button>
  {/if}
</div>
