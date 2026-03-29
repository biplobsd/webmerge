<script lang="ts">
  import Docs_Link from "src/components/Docs_Link.svelte";
  import { DOCS } from "src/lib/docs";
  import { store } from "src/lib/store.svelte";

  function goToAISettings() {
    store.openAISettings = true;
    store.screen = "settings";
  }
</script>

<div class="ai-hint">
  <div class="docs-corner">
    <Docs_Link href={DOCS.aiSettings} />
  </div>

  <!-- Illustration -->
  <div class="ai-art" aria-hidden="true">
    <svg viewBox="0 0 200 110" fill="none" class="ai-svg" xmlns="http://www.w3.org/2000/svg">
      <!-- Panel frame -->
      <rect x="1" y="1" width="198" height="108" rx="8" class="svg-frame" stroke-width="1.5" />
      <!-- Title bar -->
      <rect x="1" y="1" width="198" height="20" rx="8" class="svg-titlebar" />
      <rect x="1" y="13" width="198" height="8" class="svg-titlebar" />
      <!-- Traffic lights -->
      <circle cx="13" cy="11" r="3" fill="#ff5f57" />
      <circle cx="23" cy="11" r="3" fill="#febc2e" />
      <circle cx="33" cy="11" r="3" fill="#28c840" />
      <!-- CPU/AI icon in title -->
      <rect x="88" y="6" width="24" height="10" rx="3" class="svg-tab-active" />
      <rect x="92" y="9" width="8" height="4" rx="1" class="svg-tab-text" opacity="0.85" />
      <rect x="102" y="9" width="7" height="4" rx="1" class="svg-tab-text" opacity="0.85" />

      <!-- Section label -->
      <rect x="12" y="29" width="52" height="4.5" rx="2" class="svg-section-label" />

      <!-- API Base URL field -->
      <rect x="12" y="40" width="176" height="14" rx="3.5" class="svg-field" stroke-width="1" />
      <!-- link icon -->
      <path
        d="M18 47a2.5 2.5 0 1 0 0-.001M20.5 49.5l1.5 1.5"
        stroke="currentColor"
        stroke-width="0.9"
        stroke-linecap="round"
        opacity="0.3"
      />
      <rect x="26" y="44.5" width="72" height="3.5" rx="1.5" class="svg-field-text" />

      <!-- API Key label -->
      <rect x="12" y="60" width="36" height="4" rx="1.5" class="svg-section-label" opacity="0.6" />
      <!-- API Key field -->
      <rect x="12" y="68" width="176" height="14" rx="3.5" class="svg-field" stroke-width="1" />
      <!-- lock icon -->
      <path d="M18.5 74.5a2 2 0 1 0 3 0M20 76.5v2.5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" opacity="0.3" />
      <!-- Animated dots (masked key) -->
      <g class="svg-key-dots">
        <circle cx="28" cy="75.5" r="2.2" class="svg-dot d1" />
        <circle cx="35" cy="75.5" r="2.2" class="svg-dot d2" />
        <circle cx="42" cy="75.5" r="2.2" class="svg-dot d3" />
        <circle cx="49" cy="75.5" r="2.2" class="svg-dot d4" />
        <circle cx="56" cy="75.5" r="2.2" class="svg-dot d5" />
      </g>
      <!-- warning badge on field -->
      <g class="svg-warn-badge">
        <circle cx="182" cy="75" r="5.5" fill="#febc2e" opacity="0.9" />
        <path d="M182 72.5v3" stroke="white" stroke-width="1.2" stroke-linecap="round" />
        <circle cx="182" cy="77" r="0.8" fill="white" />
      </g>

      <!-- Save button (pulsing) -->
      <g class="svg-save-anim">
        <rect x="147" y="89" width="41" height="13" rx="3.5" class="svg-save-btn" />
        <rect x="155" y="93.5" width="25" height="3.5" rx="1.5" fill="var(--color-primary-content)" opacity="0.9" />
      </g>
      <!-- Cancel/ghost button -->
      <rect x="100" y="89" width="41" height="13" rx="3.5" class="svg-ghost-btn" stroke-width="1" />
      <rect x="108" y="93.5" width="25" height="3.5" rx="1.5" class="svg-ghost-text" opacity="0.4" />
    </svg>
  </div>

  <p class="ai-title">AI not configured</p>
  <p class="ai-sub">Add your OpenRouter API key (or any OpenAI-compatible provider) to enable data extraction from sites.</p>

  <button class="ai-btn" onclick={goToAISettings} type="button">
    <svg viewBox="0 0 20 20" fill="none" class="ai-btn-icon" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.6" />
      <path
        d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>
    Configure AI
  </button>
</div>

<style>
  .ai-hint {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    padding: 1.4rem 1.2rem 1.5rem;
    border-radius: 1rem;
    border: 1px dashed color-mix(in oklch, var(--color-warning) 45%, transparent);
    background: color-mix(in oklch, var(--color-warning) 5%, var(--color-base-200));
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

  .ai-art {
    width: 100%;
    max-width: 200px;
    margin-bottom: 0.3rem;
    filter: drop-shadow(0 4px 14px color-mix(in oklch, var(--color-primary) 14%, transparent));
  }
  .ai-svg {
    width: 100%;
    height: auto;
    border-radius: 8px;
    overflow: visible;
  }

  /* SVG tokens */
  .svg-frame {
    stroke: color-mix(in oklch, var(--color-base-content) 18%, transparent);
    fill: color-mix(in oklch, var(--color-base-200) 80%, transparent);
  }
  .svg-titlebar {
    fill: color-mix(in oklch, var(--color-base-300) 90%, transparent);
  }
  .svg-tab-active {
    fill: var(--color-primary);
    opacity: 0.2;
  }
  .svg-tab-text {
    fill: var(--color-primary);
  }
  .svg-section-label {
    fill: color-mix(in oklch, var(--color-primary) 55%, transparent);
  }
  .svg-field {
    fill: color-mix(in oklch, var(--color-base-100) 85%, transparent);
    stroke: color-mix(in oklch, var(--color-base-content) 14%, transparent);
  }
  .svg-field-text {
    fill: color-mix(in oklch, var(--color-base-content) 25%, transparent);
  }
  .svg-ghost-btn {
    fill: transparent;
    stroke: color-mix(in oklch, var(--color-base-content) 15%, transparent);
  }
  .svg-ghost-text {
    fill: color-mix(in oklch, var(--color-base-content) 35%, transparent);
  }
  .svg-save-btn {
    fill: var(--color-primary);
  }
  .svg-save-anim {
    animation: save-pulse 2.2s ease-in-out infinite;
  }
  @keyframes save-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.55;
    }
  }

  /* Animated password dots */
  .svg-dot {
    fill: color-mix(in oklch, var(--color-base-content) 30%, transparent);
    animation: dot-fade 2s ease-in-out infinite;
  }
  .d1 {
    animation-delay: 0s;
  }
  .d2 {
    animation-delay: 0.18s;
  }
  .d3 {
    animation-delay: 0.36s;
  }
  .d4 {
    animation-delay: 0.54s;
  }
  .d5 {
    animation-delay: 0.72s;
  }
  @keyframes dot-fade {
    0%,
    100% {
      opacity: 0.15;
      transform: scale(0.7);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Warning badge bounce */
  .svg-warn-badge {
    animation: warn-bob 2s ease-in-out infinite;
  }
  @keyframes warn-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }

  .ai-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-base-content);
    margin-top: 0.15rem;
  }

  .ai-sub {
    font-size: 0.76rem;
    line-height: 1.5;
    color: color-mix(in oklch, var(--color-base-content) 55%, transparent);
    margin-bottom: 0.2rem;
  }

  .ai-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.3rem;
    padding: 0.45rem 1.1rem;
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
  .ai-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px color-mix(in oklch, var(--color-primary) 45%, transparent);
    filter: brightness(1.06);
  }
  .ai-btn:active {
    transform: translateY(0);
  }
  .ai-btn-icon {
    width: 15px;
    height: 15px;
  }
</style>
