<script lang="ts">
  import { Sun, Moon } from "lucide-svelte";
  import { store } from "src/lib/store.svelte";
  import { createThemeTransition } from "src/lib/themeTransition";

  let buttonElement = $state<HTMLButtonElement>();

  const { toggleThemeWithAnimation } = createThemeTransition({
    isLightFun: () => store.theme === "light",
    toggleTheme: () => {
      store.theme = store.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", store.theme);
      chrome.storage.sync.set({ theme: store.theme });
    },
  });

  function handleToggle() {
    if (buttonElement) {
      toggleThemeWithAnimation(buttonElement);
    } else {
      store.theme = store.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", store.theme);
      chrome.storage.sync.set({ theme: store.theme });
    }
  }
</script>

<abbr title="Switch to {store.theme === 'light' ? 'dark' : 'light'} theme">
  <button
    bind:this={buttonElement}
    onclick={handleToggle}
    class="btn btn-ghost btn-sm btn-circle swap swap-rotate {store.theme === 'light' ? 'swap-active' : ''}"
  >
    <Sun size={18} class="swap-on" />
    <Moon size={18} class="swap-off" />
  </button>
</abbr>

<div id="rainbow-ripple-svg"></div>

<style>
  ::view-transition-group(root) {
    animation-duration: 800ms;
    animation-timing-function: ease-in-out;
  }

  ::view-transition-image-pair(root) {
    isolation: auto;
  }

  :root {
    --transition-z-index-new: 999;
    --transition-z-index-old: 998;
  }

  ::view-transition-old(root) {
    animation: none;
    mix-blend-mode: normal;
    z-index: var(--transition-z-index-old);
    display: block;
  }

  ::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
    z-index: var(--transition-z-index-new);
    display: block;
  }
</style>
