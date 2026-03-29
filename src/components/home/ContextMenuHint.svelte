<div class="ctx-hint">
  <div class="ctx-divider"><span>or</span></div>

  <div class="ctx-art" aria-hidden="true">
    <svg viewBox="0 0 200 118" fill="none" xmlns="http://www.w3.org/2000/svg" class="ctx-svg">
      <!-- window frame -->
      <rect x="1" y="1" width="198" height="116" rx="8" class="svg-frame" stroke-width="1.5" />
      <!-- title bar -->
      <rect x="1" y="1" width="198" height="22" rx="8" class="svg-titlebar" />
      <rect x="1" y="15" width="198" height="8" class="svg-titlebar" />
      <!-- traffic lights -->
      <circle cx="14" cy="12" r="3.5" fill="#ff5f57" />
      <circle cx="25" cy="12" r="3.5" fill="#febc2e" />
      <circle cx="36" cy="12" r="3.5" fill="#28c840" />
      <!-- url bar -->
      <rect x="50" y="7" width="100" height="10" rx="5" class="svg-urlbar" />
      <rect x="57" y="10.5" width="60" height="3" rx="1.5" class="svg-urltext" />
      <!-- page content lines -->
      <rect x="12" y="32" width="120" height="6" rx="3" class="svg-line" opacity="0.5" />
      <rect x="12" y="44" width="90" height="5" rx="2.5" class="svg-line" opacity="0.35" />
      <rect x="12" y="55" width="105" height="5" rx="2.5" class="svg-line" opacity="0.35" />
      <rect x="12" y="66" width="75" height="5" rx="2.5" class="svg-line" opacity="0.25" />
      <!-- cursor arrow -->
      <g class="svg-cursor">
        <polygon points="0,0 0,14 4,11 6.5,16 8,15.3 5.5,10.3 10,10.3" class="svg-cursor-fill" stroke-width="0.8" />
      </g>
      <!-- right-click context menu -->
      <g class="ctx-menu-group">
        <rect x="96" y="58" width="90" height="56" rx="5" class="svg-menu-bg" stroke-width="1" />
        <rect x="100" y="63" width="70" height="7" rx="2" class="svg-menu-item" opacity="0.4" />
        <rect x="100" y="74" width="55" height="7" rx="2" class="svg-menu-item" opacity="0.4" />
        <line x1="100" y1="85.5" x2="182" y2="85.5" class="svg-menu-sep" stroke-width="0.75" />
        <!-- highlighted "Add this site" row -->
        <rect x="98" y="89" width="86" height="11" rx="3" class="svg-highlight-row" />
        <rect x="103" y="92" width="8" height="5" rx="1" class="svg-highlight-icon" />
        <rect x="115" y="92.5" width="42" height="4" rx="2" class="svg-highlight-text" />
      </g>
    </svg>
  </div>

  <p class="ctx-label">
    On any website → <kbd>right-click</kbd> → <strong>Add this site</strong>
  </p>
</div>

<style>
  .ctx-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .ctx-divider {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 0.5rem;
    color: color-mix(in oklch, var(--color-base-content) 30%, transparent);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .ctx-divider::before,
  .ctx-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: color-mix(in oklch, var(--color-base-content) 15%, transparent);
  }

  .ctx-art {
    width: 100%;
    max-width: 200px;
    filter: drop-shadow(0 4px 12px color-mix(in oklch, var(--color-primary) 18%, transparent));
  }
  .ctx-svg {
    width: 100%;
    height: auto;
    border-radius: 8px;
    overflow: visible;
  }

  .svg-frame {
    stroke: color-mix(in oklch, var(--color-base-content) 20%, transparent);
    fill: color-mix(in oklch, var(--color-base-200) 80%, transparent);
  }
  .svg-titlebar {
    fill: color-mix(in oklch, var(--color-base-300) 90%, transparent);
  }
  .svg-urlbar {
    fill: color-mix(in oklch, var(--color-base-100) 80%, transparent);
  }
  .svg-urltext {
    fill: color-mix(in oklch, var(--color-base-content) 30%, transparent);
  }
  .svg-line {
    fill: color-mix(in oklch, var(--color-base-content) 25%, transparent);
  }
  .svg-cursor-fill {
    fill: var(--color-base-content);
    stroke: var(--color-base-100);
    opacity: 0.85;
  }
  .svg-menu-bg {
    fill: var(--color-base-100);
    stroke: color-mix(in oklch, var(--color-base-content) 15%, transparent);
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.18));
  }
  .svg-menu-item {
    fill: color-mix(in oklch, var(--color-base-content) 22%, transparent);
  }
  .svg-menu-sep {
    stroke: color-mix(in oklch, var(--color-base-content) 12%, transparent);
  }
  .svg-highlight-row {
    fill: var(--color-primary);
    animation: row-pulse 2s ease-in-out infinite;
  }
  .svg-highlight-icon {
    fill: var(--color-primary-content);
    opacity: 0.9;
  }
  .svg-highlight-text {
    fill: var(--color-primary-content);
    opacity: 0.85;
  }

  @keyframes row-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  .svg-cursor {
    animation: cursor-move 3s ease-in-out infinite;
  }
  @keyframes cursor-move {
    0% {
      transform: translate(88px, 44px);
    }
    40% {
      transform: translate(88px, 54px);
    }
    100% {
      transform: translate(88px, 54px);
    }
  }

  .ctx-menu-group {
    animation: menu-appear 3s ease-in-out infinite;
  }
  @keyframes menu-appear {
    0% {
      opacity: 0;
      transform: scale(0.92);
      transform-origin: 96px 58px;
    }
    35% {
      opacity: 0;
      transform: scale(0.92);
      transform-origin: 96px 58px;
    }
    55% {
      opacity: 1;
      transform: scale(1);
      transform-origin: 96px 58px;
    }
    100% {
      opacity: 1;
      transform: scale(1);
      transform-origin: 96px 58px;
    }
  }

  .ctx-label {
    font-size: 0.72rem;
    color: color-mix(in oklch, var(--color-base-content) 55%, transparent);
    text-align: center;
    line-height: 1.5;
  }
  .ctx-label kbd {
    display: inline-block;
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
    border: 1px solid color-mix(in oklch, var(--color-base-content) 25%, transparent);
    background: color-mix(in oklch, var(--color-base-200) 70%, transparent);
    font-family: inherit;
    font-size: 0.68rem;
    font-weight: 700;
    color: color-mix(in oklch, var(--color-base-content) 75%, transparent);
  }
  .ctx-label strong {
    color: var(--color-primary);
    font-weight: 700;
  }
</style>
