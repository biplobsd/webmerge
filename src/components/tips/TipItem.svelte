<script lang="ts">
  import type { Snippet } from "svelte";

  const {
    text,
    href,
    title,
    children,
  }: {
    text: string;
    href: string;
    title: string;
    children?: Snippet;
  } = $props();
</script>

<a
  target="_blank"
  rel="noreferrer"
  {href}
  {title}
  class="btn btn-info mx-1 flex h-32 w-full flex-col items-center justify-center gap-3 p-3"
>
  {@render children?.()}
  <p class="text-center text-sm font-medium">{text}</p>
</a>
