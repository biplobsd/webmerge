<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { onMount } from "svelte";
  import Confetti from "src/components/Confetti.svelte";
  import { APP_SHORT_NAME } from "src/lib/constants";
  import { DOCS } from "src/lib/docs";

  const { onDone }: { onDone: () => void } = $props();

  const TOTAL = 4; // slide 0 = welcome, 1-3 = steps
  const DURATION = 5000; // ms per slide

  let slide = $state(0);
  let paused = $state(false);

  /* ── timer ── */
  let elapsed = $state(0);
  let rafId = 0;
  let lastTick = 0;

  function tick(now: number) {
    if (!paused && slide < TOTAL - 1) {
      if (lastTick) elapsed += now - lastTick;
      if (elapsed >= DURATION) {
        elapsed = 0;
        slide++;
      }
    }
    lastTick = now;
    rafId = requestAnimationFrame(tick);
  }

  function resetProgress() {
    elapsed = 0;
    lastTick = 0;
  }

  function goTo(target: number) {
    slide = target;
    resetProgress();
  }

  function next() {
    if (slide < TOTAL - 1) goTo(slide + 1);
    else onDone();
  }

  function prev() {
    if (slide > 0) goTo(slide - 1);
  }

  function togglePause() {
    paused = !paused;
    if (!paused) lastTick = 0;
  }

  onMount(() => {
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  const progressPct = $derived(slide === TOTAL - 1 ? 100 : paused ? (elapsed / DURATION) * 100 : (elapsed / DURATION) * 100);

  const steps = [
    {
      label: "Step 1 of 3",
      title: "Set up your AI provider",
      body: "Open Settings → AI Settings, paste your API key from OpenRouter (or any OpenAI-compatible provider) and save. This powers the data extraction engine.",
    },
    {
      label: "Step 2 of 3",
      title: "Add a site via right-click",
      body: "Go to any website's search results page, right-click anywhere on the page, and choose 'Add site to WebMerge'. The site is registered instantly.",
    },
    {
      label: "Step 3 of 3",
      title: "Search and fetch results",
      body: "Type a query in WebMerge and hit Search. It fetches and extracts results from all your sites simultaneously. You're all set!",
    },
  ];
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  in:fade={{ duration: 240 }}
  out:fade={{ duration: 200 }}
  role="dialog"
  aria-modal="true"
  aria-label="Welcome tutorial"
>
  <!-- Card -->
  <div
    class="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
    style="background: color-mix(in oklch, var(--color-base-100) 97%, transparent)"
    in:fly={{ y: 32, duration: 320, easing: cubicOut }}
  >
    <!-- Dot nav (top) -->
    <div class="absolute top-3 right-0 left-0 z-20 flex justify-center gap-1.5">
      {#each Array(TOTAL) as _, i}
        <button
          type="button"
          class="rounded-full transition-all duration-300
            {i === slide ? 'bg-primary h-2 w-5' : 'bg-base-content/20 hover:bg-base-content/40 h-2 w-2'}"
          onclick={() => goTo(i)}
          aria-label="Go to slide {i + 1}"
        ></button>
      {/each}
    </div>

    <!-- ── CSS-transform slider track ── no Svelte key/transition, no flash ── -->
    <div class="overflow-hidden">
      <div
        class="flex"
        style="
          width: {TOTAL * 100}%;
          transform: translateX(-{slide * (100 / TOTAL)}%);
          transition: transform 420ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        "
      >
        <!-- ══ Slide 0 — Welcome ══ -->
        <div class="slide-panel">
          <div class="relative flex flex-col items-center gap-4 overflow-hidden px-8 pt-14 pb-10 text-center">
            <Confetti />

            <div
              class="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg"
              style="background: color-mix(in oklch, var(--color-primary) 15%, var(--color-base-200))"
            >
              <svg viewBox="0 0 48 48" fill="none" class="h-10 w-10" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="22" fill="var(--color-primary)" opacity="0.15" />
                <path
                  d="M14 24l7 7 13-14"
                  stroke="var(--color-primary)"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>

            <div class="relative z-10">
              <p class="text-base-content/40 mb-1 text-xs font-semibold tracking-widest uppercase">Welcome to</p>
              <h1 class="text-base-content text-3xl font-extrabold tracking-tight">{APP_SHORT_NAME}</h1>
              <p class="text-base-content/55 mt-2 text-sm leading-relaxed">
                Search across multiple websites simultaneously.<br />
                Let's get you set up in 3 quick steps.
              </p>
            </div>

            <button class="btn btn-primary relative z-10 mt-1 w-full gap-1.5" onclick={next} type="button">
              Get started
              <svg viewBox="0 0 16 16" fill="none" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <!-- ══ Slide 1 — AI Setup ══ -->
        <div class="slide-panel">
          <div class="slide-inner">
            <div class="ill-panel">
              <svg viewBox="0 0 220 130" fill="none" class="ill-svg" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="218" height="128" rx="9" class="ill-frame" stroke-width="1.5" />
                <rect x="1" y="1" width="218" height="22" rx="9" class="ill-titlebar" />
                <rect x="1" y="15" width="218" height="8" class="ill-titlebar" />
                <circle cx="14" cy="12" r="3.5" fill="#ff5f57" />
                <circle cx="25" cy="12" r="3.5" fill="#febc2e" />
                <circle cx="36" cy="12" r="3.5" fill="#28c840" />
                <circle cx="200" cy="12" r="5" class="ill-settings-icon" opacity="0.6" />
                <path d="M197 12h6M200 9v6" stroke="var(--color-base-100)" stroke-width="1.2" stroke-linecap="round" opacity="0.9" />
                <rect x="12" y="30" width="48" height="5" rx="2" class="ill-section-label" />
                <rect x="12" y="42" width="196" height="16" rx="4" class="ill-input-box" stroke-width="1" />
                <path
                  d="M20 50a3 3 0 1 0 0-.001M23 53l2 2"
                  stroke="var(--color-base-content)"
                  stroke-width="1"
                  stroke-linecap="round"
                  opacity="0.35"
                />
                <rect x="29" y="47" width="80" height="4" rx="2" class="ill-urltext" />
                <rect x="12" y="65" width="196" height="16" rx="4" class="ill-input-box" stroke-width="1" />
                <path
                  d="M21 73a2.5 2.5 0 1 0 4 0M23.5 75.5v3"
                  stroke="var(--color-base-content)"
                  stroke-width="1"
                  stroke-linecap="round"
                  opacity="0.35"
                />
                <g class="ill-key-typing">
                  <rect x="29" y="70" width="6" height="7" rx="1.5" class="ill-key-dot" />
                  <rect x="38" y="70" width="6" height="7" rx="1.5" class="ill-key-dot" />
                  <rect x="47" y="70" width="6" height="7" rx="1.5" class="ill-key-dot" />
                  <rect x="56" y="70" width="6" height="7" rx="1.5" class="ill-key-dot" />
                  <rect x="65" y="70" width="6" height="7" rx="1.5" class="ill-key-dot" />
                  <rect x="74" y="70" width="6" height="7" rx="1.5" class="ill-key-dot" />
                </g>
                <rect x="12" y="88" width="140" height="16" rx="4" class="ill-input-box" stroke-width="1" />
                <rect x="20" y="94" width="80" height="4" rx="2" class="ill-urltext" />
                <g class="ill-save-btn-anim">
                  <rect x="160" y="88" width="48" height="16" rx="4" class="ill-save-btn" />
                  <rect x="170" y="93" width="28" height="4" rx="2" fill="var(--color-primary-content)" opacity="0.9" />
                </g>
              </svg>
            </div>
            <div class="slide-text">
              <p class="slide-label">{steps[0].label}</p>
              <h2 class="slide-title">{steps[0].title}</h2>
              <p class="slide-body">{steps[0].body}</p>
            </div>
          </div>
        </div>

        <!-- ══ Slide 2 — Add site ══ -->
        <div class="slide-panel">
          <div class="slide-inner">
            <div class="ill-panel">
              <svg viewBox="0 0 220 130" fill="none" class="ill-svg" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="218" height="128" rx="9" class="ill-frame" stroke-width="1.5" />
                <rect x="1" y="1" width="218" height="22" rx="9" class="ill-titlebar" />
                <rect x="1" y="15" width="218" height="8" class="ill-titlebar" />
                <circle cx="14" cy="12" r="3.5" fill="#ff5f57" />
                <circle cx="25" cy="12" r="3.5" fill="#febc2e" />
                <circle cx="36" cy="12" r="3.5" fill="#28c840" />
                <rect x="55" y="7" width="110" height="10" rx="5" class="ill-urlbar" />
                <rect x="62" y="10.5" width="65" height="3" rx="1.5" class="ill-urltext" />
                <rect x="12" y="30" width="90" height="5" rx="2.5" class="ill-line" opacity="0.5" />
                <rect x="12" y="40" width="130" height="5" rx="2.5" class="ill-line" opacity="0.4" />
                <rect x="12" y="50" width="110" height="5" rx="2.5" class="ill-line" opacity="0.3" />
                <rect x="12" y="60" width="95" height="5" rx="2.5" class="ill-line" opacity="0.22" />
                <g class="ill-cursor-anim">
                  <polygon points="0,0 0,14 4,11 6.5,16 8,15.3 5.5,10.3 10,10.3" class="ill-cursor" stroke-width="0.8" />
                </g>
                <g class="ill-menu-anim">
                  <rect x="98" y="55" width="110" height="66" rx="6" class="ill-menu-bg" stroke-width="1" />
                  <rect x="105" y="62" width="80" height="7" rx="2" class="ill-menu-item" opacity="0.4" />
                  <rect x="105" y="73" width="60" height="7" rx="2" class="ill-menu-item" opacity="0.4" />
                  <line x1="105" y1="85" x2="204" y2="85" class="ill-menu-sep" stroke-width="0.75" />
                  <rect x="100" y="89" width="106" height="14" rx="4" class="ill-highlight-row" />
                  <rect x="107" y="93" width="9" height="6" rx="1.5" class="ill-highlight-icon" />
                  <rect x="120" y="94" width="56" height="4" rx="2" class="ill-highlight-text" />
                  <rect x="105" y="107" width="70" height="7" rx="2" class="ill-menu-item" opacity="0.4" />
                </g>
              </svg>
            </div>
            <div class="slide-text">
              <p class="slide-label">{steps[1].label}</p>
              <h2 class="slide-title">{steps[1].title}</h2>
              <p class="slide-body">{steps[1].body}</p>
            </div>
          </div>
        </div>

        <!-- ══ Slide 3 — Search & fetch ══ -->
        <div class="slide-panel">
          <div class="slide-inner">
            <div class="ill-panel">
              <svg viewBox="0 0 220 130" fill="none" class="ill-svg" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="218" height="128" rx="9" class="ill-frame" stroke-width="1.5" />
                <rect x="1" y="1" width="218" height="22" rx="9" class="ill-titlebar" />
                <rect x="1" y="15" width="218" height="8" class="ill-titlebar" />
                <circle cx="14" cy="12" r="3.5" fill="#ff5f57" />
                <circle cx="25" cy="12" r="3.5" fill="#febc2e" />
                <circle cx="36" cy="12" r="3.5" fill="#28c840" />
                <rect x="10" y="28" width="148" height="14" rx="4" class="ill-input-box" stroke-width="1" />
                <rect x="18" y="33" width="60" height="4" rx="2" class="ill-typed" />
                <rect x="164" y="28" width="44" height="14" rx="4" class="ill-save-btn" />
                <path
                  d="M178 35h12M186 32l4 3-4 3"
                  stroke="var(--color-primary-content)"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.9"
                />
                <g class="ill-card-anim" style="--delay: 0s">
                  <rect x="10" y="50" width="94" height="36" rx="5" class="ill-card" stroke-width="1" />
                  <rect x="17" y="57" width="24" height="14" rx="3" class="ill-card-thumb" />
                  <rect x="47" y="58" width="48" height="4" rx="2" class="ill-card-title" />
                  <rect x="47" y="66" width="36" height="3.5" rx="1.75" class="ill-card-sub" opacity="0.5" />
                  <rect x="47" y="73" width="42" height="3" rx="1.5" class="ill-card-sub" opacity="0.3" />
                </g>
                <g class="ill-card-anim" style="--delay: 0.15s">
                  <rect x="114" y="50" width="94" height="36" rx="5" class="ill-card" stroke-width="1" />
                  <rect x="121" y="57" width="24" height="14" rx="3" class="ill-card-thumb" />
                  <rect x="151" y="58" width="48" height="4" rx="2" class="ill-card-title" />
                  <rect x="151" y="66" width="36" height="3.5" rx="1.75" class="ill-card-sub" opacity="0.5" />
                  <rect x="151" y="73" width="42" height="3" rx="1.5" class="ill-card-sub" opacity="0.3" />
                </g>
                <g class="ill-card-anim" style="--delay: 0.3s">
                  <rect x="10" y="93" width="94" height="28" rx="5" class="ill-card" stroke-width="1" />
                  <rect x="17" y="100" width="20" height="12" rx="3" class="ill-card-thumb" />
                  <rect x="44" y="101" width="50" height="4" rx="2" class="ill-card-title" />
                  <rect x="44" y="109" width="36" height="3" rx="1.5" class="ill-card-sub" opacity="0.45" />
                </g>
                <g class="ill-card-anim" style="--delay: 0.45s">
                  <rect x="114" y="93" width="94" height="28" rx="5" class="ill-card" stroke-width="1" />
                  <rect x="121" y="100" width="20" height="12" rx="3" class="ill-card-thumb" />
                  <rect x="148" y="101" width="50" height="4" rx="2" class="ill-card-title" />
                  <rect x="148" y="109" width="36" height="3" rx="1.5" class="ill-card-sub" opacity="0.45" />
                </g>
                <g class="ill-done-badge">
                  <circle cx="186" cy="50" r="12" class="ill-done-circle" />
                  <path
                    d="M180 50l4 4 7-7"
                    stroke="var(--color-primary-content)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
              </svg>
            </div>
            <div class="slide-text">
              <p class="slide-label">{steps[2].label}</p>
              <h2 class="slide-title">{steps[2].title}</h2>
              <p class="slide-body">{steps[2].body}</p>
              <a href={DOCS.searchAndResults} target="_blank" rel="noreferrer" class="btn btn-ghost btn-sm mt-1 w-full gap-1.5 normal-case">
                <svg class="h-4 w-4 opacity-60" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                    fill="currentColor"
                  />
                </svg>
                Learn more on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
      <!-- /track -->
    </div>
    <!-- /overflow-hidden -->

    <!-- ── Bottom nav bar (only on steps 1-3) ── -->
    {#if slide > 0}
      <div
        class="flex items-center gap-2 border-t px-4 py-3"
        style="border-color: color-mix(in oklch, var(--color-base-content) 8%, transparent)"
      >
        <!-- Prev -->
        <button type="button" class="btn btn-ghost btn-sm btn-square shrink-0" onclick={prev} aria-label="Previous">
          <svg viewBox="0 0 16 16" fill="none" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <!-- Progress bar + pause -->
        <div class="flex flex-1 items-center gap-1.5">
          <div class="bg-base-content/10 relative h-1.5 flex-1 overflow-hidden rounded-full">
            <div class="bg-primary absolute inset-y-0 left-0 rounded-full transition-none" style="width: {progressPct}%"></div>
          </div>
          <!-- Pause / Play -->
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square shrink-0 opacity-50 hover:opacity-100"
            onclick={togglePause}
            aria-label={paused ? "Resume auto-slide" : "Pause auto-slide"}
            title={paused ? "Resume" : "Pause"}
          >
            {#if paused}
              <!-- Play icon -->
              <svg viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg">
                <polygon points="4,2 13,8 4,14" fill="currentColor" />
              </svg>
            {:else}
              <!-- Pause icon -->
              <svg viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor" />
                <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor" />
              </svg>
            {/if}
          </button>
        </div>

        <!-- Next / Done -->
        <button type="button" class="btn btn-primary btn-sm shrink-0 gap-1" onclick={next}>
          {slide === TOTAL - 1 ? "Done" : "Next"}
          {#if slide === TOTAL - 1}
            <svg viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8l4 4 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          {:else}
            <svg viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Each slide takes up the container width */
  .slide-panel {
    width: calc(100% / 4); /* 100% / TOTAL */
    flex-shrink: 0;
  }

  /* Tutorial slide layout */
  .slide-inner {
    display: flex;
    flex-direction: column;
  }
  .ill-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 2rem 2rem;
    background: color-mix(in oklch, var(--color-primary) 7%, var(--color-base-200));
  }
  .ill-svg {
    width: 100%;
    max-width: 220px;
    height: auto;
  }
  .slide-text {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 1.25rem 2rem 1.5rem;
  }
  .slide-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-primary);
    margin-bottom: 0.1rem;
  }
  .slide-title {
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-base-content);
  }
  .slide-body {
    font-size: 0.85rem;
    line-height: 1.6;
    color: color-mix(in oklch, var(--color-base-content) 55%, transparent);
  }

  /* ── Illustration styles ── */
  .ill-frame {
    stroke: color-mix(in oklch, var(--color-base-content) 18%, transparent);
    fill: color-mix(in oklch, var(--color-base-200) 75%, transparent);
  }
  .ill-titlebar {
    fill: color-mix(in oklch, var(--color-base-300) 85%, transparent);
  }
  .ill-urlbar {
    fill: color-mix(in oklch, var(--color-base-100) 80%, transparent);
  }
  .ill-urltext {
    fill: color-mix(in oklch, var(--color-base-content) 28%, transparent);
  }
  .ill-line {
    fill: color-mix(in oklch, var(--color-base-content) 22%, transparent);
  }
  .ill-input-box {
    fill: color-mix(in oklch, var(--color-base-100) 85%, transparent);
    stroke: color-mix(in oklch, var(--color-base-content) 15%, transparent);
  }

  /* Slide 1 — AI settings */
  .ill-settings-icon {
    fill: var(--color-primary);
  }
  .ill-section-label {
    fill: color-mix(in oklch, var(--color-primary) 50%, transparent);
  }
  .ill-key-dot {
    fill: color-mix(in oklch, var(--color-base-content) 35%, transparent);
    animation: dot-pop 2.2s ease-in-out infinite;
  }
  .ill-key-dot:nth-child(1) {
    animation-delay: 0s;
  }
  .ill-key-dot:nth-child(2) {
    animation-delay: 0.15s;
  }
  .ill-key-dot:nth-child(3) {
    animation-delay: 0.3s;
  }
  .ill-key-dot:nth-child(4) {
    animation-delay: 0.45s;
  }
  .ill-key-dot:nth-child(5) {
    animation-delay: 0.6s;
  }
  .ill-key-dot:nth-child(6) {
    animation-delay: 0.75s;
  }
  @keyframes dot-pop {
    0%,
    100% {
      opacity: 0.2;
      transform: scale(0.7);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }
  .ill-save-btn {
    fill: var(--color-primary);
  }
  .ill-save-btn-anim {
    animation: save-pulse 2s ease-in-out infinite;
  }
  @keyframes save-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  /* Slide 2 — context menu */
  .ill-cursor {
    fill: var(--color-base-content);
    stroke: var(--color-base-100);
    opacity: 0.85;
  }
  .ill-cursor-anim {
    animation: cursor-drift 3s ease-in-out infinite;
  }
  @keyframes cursor-drift {
    0% {
      transform: translate(86px, 42px);
    }
    40% {
      transform: translate(86px, 55px);
    }
    100% {
      transform: translate(86px, 55px);
    }
  }
  .ill-menu-bg {
    fill: var(--color-base-100);
    stroke: color-mix(in oklch, var(--color-base-content) 14%, transparent);
    filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.2));
  }
  .ill-menu-item {
    fill: color-mix(in oklch, var(--color-base-content) 20%, transparent);
  }
  .ill-menu-sep {
    stroke: color-mix(in oklch, var(--color-base-content) 10%, transparent);
  }
  .ill-highlight-row {
    fill: var(--color-primary);
    animation: hl-pulse 2.4s ease-in-out infinite;
  }
  @keyframes hl-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
  .ill-highlight-icon {
    fill: var(--color-primary-content);
    opacity: 0.9;
  }
  .ill-highlight-text {
    fill: var(--color-primary-content);
    opacity: 0.85;
  }
  .ill-menu-anim {
    animation: menu-pop 3s ease-in-out infinite;
  }
  @keyframes menu-pop {
    0% {
      opacity: 0;
      transform: scale(0.9);
      transform-origin: 98px 55px;
    }
    35% {
      opacity: 0;
      transform: scale(0.9);
      transform-origin: 98px 55px;
    }
    55% {
      opacity: 1;
      transform: scale(1);
      transform-origin: 98px 55px;
    }
    100% {
      opacity: 1;
      transform: scale(1);
      transform-origin: 98px 55px;
    }
  }

  /* Slide 3 — results */
  .ill-typed {
    fill: color-mix(in oklch, var(--color-base-content) 50%, transparent);
    animation: text-grow 3s ease-in-out infinite;
  }
  @keyframes text-grow {
    0% {
      width: 0;
    }
    55% {
      width: 60px;
    }
    85% {
      width: 60px;
    }
    100% {
      width: 0;
    }
  }
  .ill-card {
    fill: color-mix(in oklch, var(--color-base-100) 85%, transparent);
    stroke: color-mix(in oklch, var(--color-base-content) 12%, transparent);
  }
  .ill-card-thumb {
    fill: color-mix(in oklch, var(--color-primary) 18%, var(--color-base-300));
  }
  .ill-card-title {
    fill: color-mix(in oklch, var(--color-base-content) 55%, transparent);
  }
  .ill-card-sub {
    fill: color-mix(in oklch, var(--color-base-content) 30%, transparent);
  }
  .ill-card-anim {
    animation: card-rise 3s ease-in-out infinite;
    animation-delay: var(--delay, 0s);
  }
  @keyframes card-rise {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    20% {
      opacity: 0;
      transform: translateY(10px);
    }
    50% {
      opacity: 1;
      transform: translateY(0);
    }
    80% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(0);
    }
  }
  .ill-done-circle {
    fill: var(--color-primary);
  }
  .ill-done-badge {
    animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
  }
  @keyframes badge-pop {
    from {
      opacity: 0;
      transform: scale(0.3);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
