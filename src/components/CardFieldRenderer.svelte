<script lang="ts">
  import type { CardFieldStyle } from "src/lib/types";

  const {
    style,
    value,
    label,
    href = undefined,
    compact = true,
    showLabel = true,
  }: {
    style: CardFieldStyle;
    value: string;
    label: string;
    href?: string;
    compact?: boolean;
    showLabel?: boolean;
  } = $props();
</script>

{#if style === "title"}
  {#if href}
    <a
      {href}
      target={href === "#preview" ? undefined : "_blank"}
      rel={href === "#preview" ? undefined : "noopener noreferrer"}
      class="card-title link link-hover line-clamp-3 text-sm leading-snug font-semibold">{value || label}</a
    >
  {:else}
    <p class="card-title line-clamp-3 text-sm leading-snug font-semibold">
      {value || label}
    </p>
  {/if}
{:else if style === "date"}
  {#if value}
    <div class="text-base-content/50 text-xs font-medium">
      {#if showLabel}<span class="font-semibold">{label}: </span>{/if}
      {value}
    </div>
  {/if}
{:else if style === "price"}
  {#if value}
    <div class="text-success text-sm font-bold">
      {#if showLabel}<span class="text-base-content/50 mr-1 text-xs font-normal">{label}</span>{/if}{value}
    </div>
  {/if}
{:else if style === "rating"}
  {#if value}
    <div class="text-warning flex items-center gap-1 text-xs font-semibold">
      {#if showLabel}<span class="text-base-content/50 mr-0.5 font-normal">{label}:</span>{/if}★ {value}
    </div>
  {/if}
{:else if style === "badge"}
  {#if value}
    <div>
      <span class="badge badge-outline badge-xs">
        {#if showLabel}{label}:
        {/if}{value}
      </span>
    </div>
  {/if}
{:else if style === "text"}
  {#if value && value.trim()}
    <div class="text-base-content/60 text-xs">
      {#if showLabel}<span class="font-medium capitalize">{label}: </span>{/if} <span>{compact ? value.slice(0, 120) : value}</span>
    </div>
  {/if}
{:else}
  {@const _exhaustiveCheck: 'image' = style}
  {@const _void = void _exhaustiveCheck}
{/if}
