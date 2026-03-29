<script lang="ts">
  import { Settings, ChevronLeft } from "lucide-svelte";
  import ThemeToggle from "./ThemeToggle.svelte";
  import { store } from "src/lib/store.svelte";
  import { APP_SHORT_NAME } from "src/lib/constants";
  import appIcon from "/assets/icons/icon128.png";
  import { fade } from "svelte/transition";

  function openSettings() {
    store.screen = "settings";
  }

  function goHome() {
    store.screen = "home";
    store.jobs = [];
    store.resultMap = new Map();
  }

  const isSubPage = $derived(store.screen === "settings" || store.screen === "about");

  const subPageTitle = $derived(store.screen === "settings" ? "Settings" : store.screen === "about" ? "About" : "");
</script>

<header class="navbar sticky top-0 z-10 px-4 transition-all duration-200">
  <div class="flex flex-1 items-center gap-1">
    {#if isSubPage}
      <button class="btn btn-ghost btn-sm gap-1" onclick={goHome} title="Back">
        <ChevronLeft size={18} />
        <span class="text-sm">Back</span>
      </button>
      <span class="ml-1 text-lg font-bold">{subPageTitle}</span>
    {:else if store.screen != "home"}
      <button in:fade={{ duration: 200, delay: 200 }} class="btn btn-ghost gap-2 text-xl font-bold" onclick={goHome}>
        <img src={appIcon} alt="Logo" class="h-8 w-8 object-contain" />
        {APP_SHORT_NAME}
      </button>
    {/if}
  </div>
  <div class="flex flex-none items-center gap-2">
    <ThemeToggle />
    {#if !isSubPage}
      <button class="btn btn-ghost btn-sm" onclick={openSettings} title="Settings">
        <Settings size={18} />
      </button>
    {/if}
  </div>
</header>
