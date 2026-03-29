<script lang="ts">
  import { onMount } from "svelte";
  import { APP_SHORT_NAME } from "src/lib/constants";
  import appIcon from "/assets/icons/icon128.png";

  const taglines = [
    "Search many websites in one shot",
    "Merge multiple sites into one tab",
    "AI-extracted results, sorted by date",
    "Browse every site without switching",
    "Your web, unified and searchable",
  ];

  let taglineEl = $state<HTMLSpanElement | null>(null);
  let idx = $state(0);

  onMount(() => {
    const cycle = setInterval(() => {
      idx = (idx + 1) % taglines.length;
    }, 3600);
    return () => clearInterval(cycle);
  });
</script>

<div class="brand-root relative flex flex-col items-center gap-3 select-none">
  <!-- ambient glow orbs -->
  <div class="orb orb-a" aria-hidden="true"></div>
  <div class="orb orb-b" aria-hidden="true"></div>

  <!-- logo mark -->
  <div class="logo-wrap flex items-center gap-2.5">
    <div class="logo-icon" aria-hidden="true">
      <img src={appIcon} alt="Logo" class="h-9 w-9 object-contain" />
    </div>

    <h1 class="app-name h-16 text-4xl font-black tracking-tight sm:text-5xl">
      {APP_SHORT_NAME}
    </h1>
  </div>

  <!-- animated tagline -->
  <div class="tagline-wrap relative flex h-6 items-center justify-center overflow-visible">
    <span bind:this={taglineEl} class="tagline-text text-base-content/60 text-sm font-medium tracking-wide">
      {taglines[idx]}
    </span>
  </div>

  <!-- feature pills -->
  <div class="pill-row mt-1 flex flex-wrap justify-center gap-1.5">
    {#each ["⚡ Parallel search", "🤖 AI extraction", "📅 Sorted by date"] as pill}
      <span class="pill">{pill}</span>
    {/each}
  </div>
</div>

<style>
  .brand-root {
    padding: 1.25rem 0 0.5rem;
  }

  /* ── floating orbs ── */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
    z-index: 0;
    animation: float 6s ease-in-out infinite;
  }
  .orb-a {
    width: 180px;
    height: 180px;
    background: color-mix(in oklch, var(--color-primary) 30%, transparent);
    top: -40px;
    left: -60px;
    animation-delay: 0s;
  }
  .orb-b {
    width: 140px;
    height: 140px;
    background: color-mix(in oklch, var(--color-secondary) 25%, transparent);
    top: -20px;
    right: -40px;
    animation-delay: -3s;
  }
  @keyframes float {
    0%,
    100% {
      transform: translateY(0px) scale(1);
    }
    50% {
      transform: translateY(-12px) scale(1.06);
    }
  }

  /* ── logo icon pulse ── */
  .logo-icon {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 0 10px color-mix(in oklch, var(--color-primary) 50%, transparent));
    animation: icon-pulse 4s ease-in-out infinite;
  }
  @keyframes icon-pulse {
    0%,
    100% {
      filter: drop-shadow(0 0 8px color-mix(in oklch, var(--color-primary) 40%, transparent));
    }
    50% {
      filter: drop-shadow(0 0 18px color-mix(in oklch, var(--color-primary) 70%, transparent));
    }
  }

  /* ── app name shimmer ── */
  .app-name {
    position: relative;
    z-index: 1;
    background: linear-gradient(
      90deg,
      var(--color-primary) 0%,
      var(--color-secondary) 40%,
      var(--color-primary) 80%,
      var(--color-secondary) 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }
  @keyframes shimmer {
    from {
      background-position: 0% center;
    }
    to {
      background-position: 200% center;
    }
  }

  /* ── tagline ── */
  .tagline-wrap {
    z-index: 1;
  }
  .tagline-text {
    display: inline-block;
    letter-spacing: 0.02em;
  }

  /* ── pills ── */
  .pill {
    z-index: 1;
    font-size: 0.67rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 10%, var(--color-base-200));
    color: var(--color-primary);
    border: 1px solid color-mix(in oklch, var(--color-primary) 25%, transparent);
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
</style>
