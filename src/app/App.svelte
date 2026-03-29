<script lang="ts">
  import { Toaster } from "svelte-sonner";
  import TopNav from "src/components/TopNav.svelte";
  import HomeScreen from "src/components/HomeScreen.svelte";
  import ResultsScreen from "src/components/ResultsScreen.svelte";
  import SettingsScreen from "src/components/SettingsScreen.svelte";
  import AboutScreen from "src/components/AboutScreen.svelte";
  import Footer from "src/components/Footer.svelte";
  import GradientTop from "src/components/GradientTop.svelte";
  import GradientBottom from "src/components/GradientBottom.svelte";
  import CardDetailPopup from "src/components/CardDetailPopup.svelte";
  import WelcomeModal from "src/components/WelcomeModal.svelte";
  import { store, saveLastResults, loadLastResults, loadCardLayouts } from "src/lib/store.svelte";
  import { APP_SHORT_NAME } from "src/lib/constants";
  import { SettingsSchema } from "src/lib/schemas";

  $effect(() => {
    document.title = APP_SHORT_NAME;
  });
  import type { ResultItem } from "src/lib/types";

  type AppScreen = typeof store.screen;
  const VALID_SCREENS: AppScreen[] = ["home", "results", "settings", "about"];

  const startupScreen = ((): AppScreen => {
    const h = location.hash.replace("#", "") as AppScreen;
    return VALID_SCREENS.includes(h) ? h : "home";
  })();

  let ready = $state(false);
  let showWelcome = $state(false);

  $effect(() => {
    document.title = APP_SHORT_NAME;
  });

  $effect(() => {
    if (ready) {
      history.replaceState(null, "", `#${store.screen}`);
    }
  });

  $effect(() => {
    chrome.storage.sync.get(null, async (stored) => {
      try {
        const settings = SettingsSchema.parse(stored);
        store.siteCfgs = settings.sites;
        store.groups = settings.groups;
        store.theme = settings.theme;
        store.alwaysShowLatest = settings.alwaysShowLatest;
        store.aiApiKey = settings.aiApiKey ?? "";
        document.documentElement.setAttribute("data-theme", store.theme);

        await loadCardLayouts();

        if (startupScreen === "settings" || startupScreen === "about") {
          store.screen = startupScreen;
        } else {
          const hasResults = await loadLastResults();
          if (hasResults) store.screen = "results";

          if (settings.alwaysShowLatest) {
            const homeSites = settings.sites.filter((s) => s.isHomepage && s.enabled);
            if (homeSites.length > 0) {
              store.screen = "results";
              chrome.runtime.sendMessage({ type: "FETCH_LISTINGS", sites: homeSites });
            }
          }
        }
      } catch {
        store.theme = "dark";
        document.documentElement.setAttribute("data-theme", "dark");
      } finally {
        ready = true;
      }
    });

    chrome.storage.local.get("showWelcome", (local) => {
      if (local.showWelcome) {
        showWelcome = true;
        chrome.storage.local.remove("showWelcome");
      }
    });
  });

  function handleWelcomeDone() {
    showWelcome = false;
  }

  $effect(() => {
    function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>, area: string) {
      if (area !== "sync") return;
      if (!changes.sites && !changes.groups) return;
      chrome.storage.sync.get(null, (stored) => {
        try {
          const settings = SettingsSchema.parse(stored);
          store.siteCfgs = settings.sites;
          store.groups = settings.groups;
        } catch {}
      });
    }
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  });

  $effect(() => {
    function onMessage(msg: unknown) {
      const m = msg as Record<string, unknown>;

      if (m.type === "JOB_UPDATE") {
        const jobId = m.jobId as string;
        const siteId = m.siteId as string;
        const status = m.status as string;
        const existingIdx = store.jobs.findIndex((j) => j.jobId === jobId);
        if (existingIdx >= 0) {
          store.jobs[existingIdx] = {
            ...store.jobs[existingIdx],
            status: status as "running" | "done" | "stopped" | "failed" | "pending",
          };
        } else {
          store.jobs.push({
            jobId,
            siteId,
            url: "",
            status: status as "running",
            startedAt: Date.now(),
            controller: new AbortController(),
          });
        }
        if (store.screen === "home") store.screen = "results";
      }

      if (m.type === "JOB_RESULT") {
        const jobId = m.jobId as string;
        const siteId = m.siteId as string;
        const results = (m.results as ResultItem[]) ?? [];
        const status = m.status as string;
        const jobError = m.error as string | undefined;

        const existing = store.resultMap.get(siteId) ?? [];
        store.resultMap.set(siteId, [...existing, ...results]);
        store.resultMap = new Map(store.resultMap);

        saveLastResults();

        const jobIdx = store.jobs.findIndex((j) => j.jobId === jobId);
        if (jobIdx >= 0) {
          store.jobs[jobIdx] = {
            ...store.jobs[jobIdx],
            status: status as "done" | "stopped" | "failed",
            error: jobError,
          };
        }

        if (jobError && status === "failed") {
          store.error = jobError;
        }

        if (store.screen === "home") store.screen = "results";
      }
    }

    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  });
</script>

<div class="text-base-content relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden">
  <GradientTop />
  <TopNav />
  <main class="container mx-auto max-w-7xl flex-1 px-4 py-6">
    {#if !ready}
      <span></span>
    {:else if store.screen === "home"}
      <HomeScreen />
    {:else if store.screen === "results"}
      <ResultsScreen />
    {:else if store.screen === "settings"}
      <SettingsScreen />
    {:else if store.screen === "about"}
      <AboutScreen />
    {/if}
  </main>
  <Footer />
  <GradientBottom />
</div>

<Toaster richColors position="bottom-right" />
<CardDetailPopup />
{#if showWelcome}
  <WelcomeModal onDone={handleWelcomeDone} />
{/if}
