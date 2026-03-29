<script lang="ts">
  import { toast } from "svelte-sonner";
  import { ChevronLeft, Globe, Cpu, ListChecks, FolderOpen, Layout, Activity, Square } from "lucide-svelte";
  import { fly, fade, scale } from "svelte/transition";
  import SiteForm from "src/components/settings/SiteForm.svelte";
  import SiteList from "src/components/settings/SiteList.svelte";
  import GroupList from "src/components/settings/GroupList.svelte";
  import AISettings from "src/components/settings/AISettings.svelte";
  import CardLayoutBuilder from "src/components/settings/CardLayoutBuilder.svelte";
  import { store, hasActiveJobs } from "src/lib/store.svelte";
  import type { SiteConfig, SiteGroup } from "src/lib/types";
  import { v4 as uuid } from "uuid";

  let editingSite = $state<SiteConfig | null>(null);
  let showForm = $state(false);
  let aiTabInput = $state<HTMLInputElement | null>(null);
  const shouldReduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const jobBarFly = shouldReduceMotion ? { y: 0, duration: 0 } : { y: -8, duration: 220 };
  const jobBarOutScale = shouldReduceMotion ? { duration: 0, start: 1 } : { duration: 160, start: 0.97 };
  const jobChipScale = shouldReduceMotion ? { duration: 0, start: 1 } : { duration: 200, start: 0.8 };

  $effect(() => {
    if (store.openAddSite) {
      store.openAddSite = false;
      editingSite = null;
      showForm = true;
    }
  });

  $effect(() => {
    if (store.openAISettings && aiTabInput) {
      store.openAISettings = false;
      aiTabInput.checked = true;
      aiTabInput.dispatchEvent(new Event("change"));
    }
  });

  $effect(() => {
    if (store.editingSiteId) {
      const site = store.siteCfgs.find((s) => s.id === store.editingSiteId);
      if (site) {
        editingSite = site;
        showForm = true;
      }
      store.editingSiteId = null;
    }
  });

  const activeJobs = $derived(store.jobs.filter((j) => j.status === "running" || j.status === "pending"));
  const doneJobs = $derived(store.jobs.filter((j) => j.status === "done" || j.status === "failed" || j.status === "stopped"));

  async function saveSites(updated: SiteConfig[]) {
    await chrome.storage.sync.set({ sites: updated });
    store.siteCfgs = updated;
    toast.success("Sites saved");
  }

  async function saveGroups(updated: SiteGroup[]) {
    await chrome.storage.sync.set({ groups: updated });
    store.groups = updated;
  }

  async function handleSave(site: SiteConfig) {
    try {
      const existing = store.siteCfgs.findIndex((s) => s.id === site.id);
      const updated = existing >= 0 ? store.siteCfgs.map((s) => (s.id === site.id ? site : s)) : [...store.siteCfgs, site];
      await saveSites(updated);
      showForm = false;
      editingSite = null;
    } catch (err) {
      toast.error("Failed to save — please try again");
      console.error("[handleSave]", err);
    }
  }

  async function handleDelete(id: string) {
    const updatedSites = store.siteCfgs.filter((s) => s.id !== id);
    const updatedGroups = store.groups.map((g) => ({
      ...g,
      siteIds: g.siteIds.filter((sid) => sid !== id),
    }));
    await chrome.storage.sync.set({ sites: updatedSites, groups: updatedGroups });
    store.siteCfgs = updatedSites;
    store.groups = updatedGroups;
    toast.success("Site deleted");
  }

  async function handleToggle(id: string, enabled: boolean) {
    const updatedSites = store.siteCfgs.map((s) => (s.id === id ? { ...s, enabled } : s));
    await chrome.storage.sync.set({ sites: updatedSites });
    store.siteCfgs = updatedSites;
  }

  async function handleAssignToGroup(siteId: string, groupId: string | null) {
    const updatedGroups = store.groups.map((g) => {
      const without = g.siteIds.filter((id) => id !== siteId);
      if (g.id === groupId) return { ...g, siteIds: [...without, siteId] };
      return { ...g, siteIds: without };
    });
    await saveGroups(updatedGroups);
  }

  function handleEdit(site: SiteConfig) {
    editingSite = site;
    showForm = true;
  }
  function handleAddNew() {
    editingSite = null;
    showForm = true;
  }
  function handleCancel() {
    showForm = false;
    editingSite = null;
  }

  async function toggleAlwaysShowLatest(val: boolean) {
    store.alwaysShowLatest = val;
    await chrome.storage.sync.set({ alwaysShowLatest: val });
  }

  async function handleGroupAdd(name: string) {
    const newGroup: SiteGroup = { id: uuid(), name, siteIds: [] };
    await saveGroups([...store.groups, newGroup]);
    toast.success(`Group "${name}" created`);
  }

  async function handleGroupDelete(id: string) {
    await saveGroups(store.groups.filter((g) => g.id !== id));
    if (store.activeGroup === id) store.activeGroup = "all";
    toast.success("Group deleted");
  }

  async function handleGroupRename(id: string, name: string) {
    await saveGroups(store.groups.map((g) => (g.id === id ? { ...g, name } : g)));
  }

  function stopAll() {
    chrome.runtime.sendMessage({ type: "STOP_ALL" });
  }

  function statusColor(status: string) {
    if (status === "running" || status === "pending") return "text-info";
    if (status === "done") return "text-success";
    if (status === "failed") return "text-error";
    return "text-base-content/40";
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Job Status Bar (only when jobs are active or recent) -->
  {#if store.jobs.length > 0}
    <div
      class="border-base-300 bg-base-200/40 overflow-hidden rounded-xl border backdrop-blur-sm"
      in:fly={jobBarFly}
      out:scale={jobBarOutScale}
    >
      <div class="flex items-center gap-3 px-4 py-2.5">
        <div class="bg-info/10 rounded-md p-1">
          <Activity size={13} class="text-info" />
        </div>
        <span class="text-xs font-semibold">Job Status</span>
        {#if activeJobs.length > 0}
          <span class="badge badge-info badge-xs">{activeJobs.length} running</span>
        {:else}
          <span class="badge badge-ghost badge-xs">idle</span>
        {/if}
        <div class="ml-auto flex items-center gap-2">
          {#if hasActiveJobs()}
            <button class="btn btn-error btn-xs gap-1" onclick={stopAll} type="button">
              <Square size={10} fill="currentColor" /> Stop All
            </button>
          {/if}
          <button
            class="btn btn-ghost btn-xs text-base-content/40"
            onclick={() => (store.jobs = [])}
            type="button"
            title="Clear job history">Clear</button
          >
        </div>
      </div>
      <div class="border-base-300 flex flex-wrap gap-2 border-t px-4 py-2">
        {#each store.jobs as job (job.jobId)}
          {@const siteName = store.siteCfgs.find((s) => s.id === job.siteId)?.name ?? job.siteId}
          <div
            class="bg-base-100/60 border-base-300 flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs"
            in:scale={jobChipScale}
          >
            {#if job.status === "running" || job.status === "pending"}
              <span class="loading loading-spinner loading-xs text-info"></span>
            {:else if job.status === "done"}
              <span class="bg-success inline-block h-1.5 w-1.5 rounded-full"></span>
            {:else if job.status === "failed"}
              <span class="bg-error inline-block h-1.5 w-1.5 rounded-full"></span>
            {:else}
              <span class="bg-base-content/20 inline-block h-1.5 w-1.5 rounded-full"></span>
            {/if}
            <span class="{statusColor(job.status)} font-medium">{siteName}</span>
            {#if job.error}
              <span class="text-error/60 max-w-32 truncate" title={job.error}>· {job.error}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Settings Tabs -->
  <div role="tablist" class="tabs tabs-lift animate-fade-in w-full">
    <!-- Sites Tab -->
    <input type="radio" name="settings_tabs" role="tab" class="tab gap-2 font-semibold" aria-label="Sites" checked />
    <div role="tabpanel" class="tab-content bg-base-100/40 border-base-300 rounded-box p-5 backdrop-blur-md">
      <label
        class="bg-base-200/40 border-base-300 group mb-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3 backdrop-blur-md"
      >
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 rounded-lg p-1.5">
            <ListChecks size={14} class="text-primary" />
          </div>
          <div>
            <p class="text-sm font-semibold">Always show latest on open</p>
            <p class="text-base-content/50 text-xs">Restore last results when the popup opens</p>
          </div>
        </div>
        <input
          type="checkbox"
          class="toggle toggle-primary toggle-sm"
          checked={store.alwaysShowLatest}
          onchange={(e) => toggleAlwaysShowLatest((e.target as HTMLInputElement).checked)}
        />
      </label>

      {#if showForm}
        <div class="animate-fade-in mb-4">
          <button class="btn btn-ghost btn-sm hover:bg-base-200/60 gap-2 transition-all duration-150" onclick={handleCancel}>
            <ChevronLeft size={16} /> Back to list
          </button>
        </div>
        <SiteForm site={editingSite} onSave={handleSave} onCancel={handleCancel} />
      {:else}
        <div class="animate-fade-in mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 rounded-lg p-1.5">
              <Globe size={16} class="text-primary" />
            </div>
            <div>
              <h2 class="text-base font-bold">Configured Sites</h2>
              <p class="text-base-content/50 text-xs">
                {store.siteCfgs.length} site{store.siteCfgs.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            class="btn btn-primary btn-sm gap-2 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            onclick={handleAddNew}
          >
            <span class="text-base leading-none">+</span> Add Site
          </button>
        </div>
        <SiteList
          sites={store.siteCfgs}
          groups={store.groups}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignToGroup={handleAssignToGroup}
          onToggle={handleToggle}
        />
      {/if}
    </div>

    <!-- Groups Tab -->
    <input type="radio" name="settings_tabs" role="tab" class="tab gap-2 font-semibold" aria-label="Groups" />
    <div role="tabpanel" class="tab-content bg-base-100/40 border-base-300 rounded-box p-5 backdrop-blur-md">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-accent/10 rounded-lg p-1.5">
          <FolderOpen size={16} class="text-accent" />
        </div>
        <div>
          <h2 class="text-base font-bold">Site Groups</h2>
          <p class="text-base-content/50 text-xs">Organise sites into groups for quick filtering</p>
        </div>
      </div>
      <GroupList
        groups={store.groups}
        sites={store.siteCfgs.map((s) => ({ id: s.id, name: s.name, faviconUrl: s.faviconUrl }))}
        onAdd={handleGroupAdd}
        onDelete={handleGroupDelete}
        onRename={handleGroupRename}
      />
    </div>

    <!-- AI Settings Tab -->
    <input bind:this={aiTabInput} type="radio" name="settings_tabs" role="tab" class="tab gap-2 font-semibold" aria-label="AI Settings" />
    <div role="tabpanel" class="tab-content bg-base-100/40 border-base-300 rounded-box p-5 backdrop-blur-md">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-secondary/10 rounded-lg p-1.5">
          <Cpu size={16} class="text-secondary" />
        </div>
        <div>
          <h2 class="text-base font-bold">AI Configuration</h2>
          <p class="text-base-content/50 text-xs">Model, API key, and parser settings</p>
        </div>
      </div>
      <AISettings />
    </div>

    <!-- Card Layout Tab -->
    <input type="radio" name="settings_tabs" role="tab" class="tab gap-2 font-semibold" aria-label="Card Layout" />
    <div role="tabpanel" class="tab-content bg-base-100/40 border-base-300 rounded-box p-5 backdrop-blur-md">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-primary/10 rounded-lg p-1.5">
          <Layout size={16} class="text-primary" />
        </div>
        <div>
          <h2 class="text-base font-bold">Card Layout</h2>
          <p class="text-base-content/50 text-xs">Drag fields to reorder · add dynamic enrichments (IMDB, RT, custom APIs)</p>
        </div>
      </div>
      <CardLayoutBuilder />
    </div>
  </div>
</div>
