<script lang="ts">
  import { Zap } from "lucide-svelte";
  import { loadLastResults, store } from "src/lib/store.svelte";

  interface Props {
    homeSiteCount: number;
    totalResults: number;
    onFetch: () => void;
  }

  const { homeSiteCount, totalResults, onFetch }: Props = $props();

  const groupName = $derived(store.activeGroup !== "all" ? store.groups.find((g) => g.id === store.activeGroup)?.name : null);

  async function viewCached() {
    await loadLastResults();
    store.screen = "results";
  }
</script>

<div class="cta-section">
  {#if totalResults > 0}
    <button class="prev-badge" onclick={viewCached}>
      <span class="ping-dot" aria-hidden="true">
        <span class="ping-ring"></span>
        <span class="ping-core"></span>
      </span>
      <span class="prev-label">View {totalResults} cached results</span>
      <svg viewBox="0 0 16 16" fill="currentColor" class="prev-arrow" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 111.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 11-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  {/if}

  <button class="fetch-btn" onclick={onFetch}>
    <span class="fetch-icon"><Zap size={16} /></span>
    <span>Fetch Latest</span>
  </button>

  <p class="fetch-hint">
    Pulls fresh content from <strong>{homeSiteCount}</strong>
    homepage site{homeSiteCount === 1 ? "" : "s"}
    {#if groupName}
      &nbsp;in <strong>{groupName}</strong>
    {/if}
  </p>
</div>

<style>
  .cta-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    max-width: 22rem;
  }

  /* ── cached results badge ── */
  .prev-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.9rem 0.35rem 0.65rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklch, var(--color-primary) 30%, transparent);
    background: color-mix(in oklch, var(--color-primary) 8%, var(--color-base-100));
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.15s;
  }
  .prev-badge:hover {
    background: color-mix(in oklch, var(--color-primary) 15%, var(--color-base-100));
    transform: translateY(-1px);
  }
  .prev-badge:hover .prev-arrow {
    transform: translateX(3px);
  }

  .ping-dot {
    position: relative;
    display: flex;
    height: 0.5rem;
    width: 0.5rem;
  }
  .ping-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--color-primary);
    opacity: 0.75;
    animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .ping-core {
    position: relative;
    border-radius: 50%;
    background: var(--color-primary);
    width: 0.5rem;
    height: 0.5rem;
  }
  @keyframes ping {
    75%,
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  .prev-label {
    flex: 1;
  }
  .prev-arrow {
    width: 0.85rem;
    height: 0.85rem;
    transition: transform 0.2s;
  }

  /* ── fetch button ── */
  .fetch-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.65rem 1.5rem;
    border-radius: 0.875rem;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    border: none;
    background: linear-gradient(
      135deg,
      var(--color-primary) 0%,
      color-mix(in oklch, var(--color-primary) 70%, var(--color-secondary)) 100%
    );
    color: var(--color-primary-content);
    box-shadow:
      0 4px 16px color-mix(in oklch, var(--color-primary) 35%, transparent),
      0 1px 3px rgba(0, 0, 0, 0.15);
    transition:
      transform 0.18s,
      box-shadow 0.18s,
      filter 0.18s;
    position: relative;
    overflow: hidden;
  }
  .fetch-btn::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 60%);
    pointer-events: none;
  }
  .fetch-btn:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 24px color-mix(in oklch, var(--color-primary) 45%, transparent),
      0 2px 6px rgba(0, 0, 0, 0.18);
    filter: brightness(1.05);
  }
  .fetch-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px color-mix(in oklch, var(--color-primary) 25%, transparent);
  }
  .fetch-icon {
    display: flex;
    align-items: center;
  }

  .fetch-hint {
    font-size: 0.72rem;
    color: color-mix(in oklch, var(--color-base-content) 45%, transparent);
    text-align: center;
  }
</style>
