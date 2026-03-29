/// <reference types="vite-plus/client" />

declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType;
  export default component;
}
