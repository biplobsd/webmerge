<script lang="ts">
  import Docs_Link from "src/components/Docs_Link.svelte";
  import { DOCS } from "src/lib/docs";
  import { Settings, Plus } from "lucide-svelte";
  import { store } from "src/lib/store.svelte";
  import ContextMenuHint from "./ContextMenuHint.svelte";

  function goAddSite() {
    store.openAddSite = true;
    store.screen = "settings";
  }
</script>

<div class="empty-state">
  <div class="docs-corner">
    <Docs_Link href={DOCS.addYourFirstSite} />
  </div>

  <div class="empty-icon" aria-hidden="true">
    <Settings size={28} strokeWidth={1.5} />
  </div>

  <p class="empty-title">No sites yet</p>
  <p class="empty-sub">Add your first website to start searching across multiple sites.</p>

  <button class="add-site-btn" onclick={goAddSite}>
    <Plus size={15} />
    Add Your First Site
  </button>

  <ContextMenuHint />
</div>

<style>
  .empty-state {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 1.5rem 1rem;
    border-radius: 1rem;
    border: 1px dashed color-mix(in oklch, var(--color-base-content) 20%, transparent);
    background: color-mix(in oklch, var(--color-base-200) 60%, transparent);
    width: 100%;
    max-width: 22rem;
    text-align: center;
  }

  .docs-corner {
    position: absolute;
    top: 0.1rem;
    right: 0.6rem;
    z-index: 2;
  }

  .empty-icon {
    color: var(--color-primary);
    opacity: 0.7;
    margin-bottom: 0.25rem;
  }

  .empty-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-base-content);
  }

  .empty-sub {
    font-size: 0.78rem;
    color: color-mix(in oklch, var(--color-base-content) 55%, transparent);
    margin-bottom: 0.25rem;
  }

  .add-site-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.25rem;
    padding: 0.45rem 1rem;
    border-radius: 0.65rem;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    background: linear-gradient(
      135deg,
      var(--color-primary) 0%,
      color-mix(in oklch, var(--color-primary) 70%, var(--color-secondary)) 100%
    );
    color: var(--color-primary-content);
    box-shadow: 0 3px 12px color-mix(in oklch, var(--color-primary) 35%, transparent);
    transition:
      transform 0.15s,
      box-shadow 0.15s,
      filter 0.15s;
  }
  .add-site-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px color-mix(in oklch, var(--color-primary) 45%, transparent);
    filter: brightness(1.06);
  }
  .add-site-btn:active {
    transform: translateY(0);
  }
</style>
