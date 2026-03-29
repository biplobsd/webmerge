<script lang="ts">
  import appIcon from "/assets/icons/icon128.png";
  import BDIcon from "./icons/BD_Icon.svelte";
  import SliderTips from "./tips/SliderTips.svelte";
  import { COUNTRY_URL, DEVELOPER_NAME, DEVELOPER_URL } from "src/lib/constants";
  import { DOCS } from "src/lib/docs";
  import Docs_Link from "./Docs_Link.svelte";
  import External_Link from "./External_Link.svelte";
  import { onMount } from "svelte";

  const manifest = chrome.runtime.getManifest();
  const { name, version } = manifest;
  let author: string | undefined;
  const extensionId = chrome.runtime.id;

  onMount(() => {
    if (import.meta.env.BROWSER_NAME === "firefox") {
      author = manifest.author as unknown as string;
    } else {
      author = manifest.author?.email;
    }
  });
</script>

<div class="animate-fade-in flex flex-col gap-5 py-4">
  <div class="flex flex-col items-center gap-3 py-4">
    <div class="relative">
      <div class="bg-primary/20 absolute -inset-4 animate-pulse rounded-full blur-2xl"></div>
      <img src={appIcon} alt="Logo" class="relative h-20 w-20 object-contain drop-shadow-xl" />
    </div>
    <div class="text-center">
      <h2 class="text-2xl font-black tracking-tight">{name}</h2>
      <p class="text-base-content/50 text-sm font-medium">Version {version}</p>
    </div>
  </div>

  <div class="card bg-base-200/40 border-base-300 border backdrop-blur-md">
    <div class="card-body gap-2 p-4 text-sm">
      <div class="flex items-baseline gap-2">
        <span class="text-base-content/60 w-28 shrink-0 font-semibold">Extension ID</span>
        <span class="text-base-content/70 font-mono text-xs break-all">{extensionId}</span>
      </div>
      {#if author}
        <div class="flex items-baseline gap-2">
          <span class="text-base-content/60 w-28 shrink-0 font-semibold">Author</span>
          <External_Link>
            <a class="link link-hover" href="mailto:{author}" rel="noreferrer" target="_blank">{author}</a>
          </External_Link>
        </div>
      {/if}
      <div class="flex items-baseline gap-2">
        <span class="text-base-content/60 w-28 shrink-0 font-semibold">Developer</span>
        <External_Link>
          <a class="link link-hover" href={DEVELOPER_URL} rel="noreferrer" target="_blank"> {DEVELOPER_NAME} </a>
        </External_Link>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-base-content/60 w-28 shrink-0 font-semibold">Source code</span>
        <External_Link>
          <a class="link link-hover text-xs break-all" href={DOCS.contributingAndIssues} rel="noreferrer" target="_blank">
            GitHub README: Contributing and issues
          </a>
        </External_Link>
        <Docs_Link href={DOCS.contributingAndIssues} />
      </div>
      <a
        class="text-base-content/50 mt-1 flex items-center gap-1 pt-2 text-xs"
        rel="noreferrer"
        target="_blank"
        title="Open Bangladesh Wikipedia page"
        href={COUNTRY_URL}
      >
        Made in <BDIcon /> Bangladesh
      </a>
    </div>
  </div>

  <div>
    <p class="text-base-content/50 mb-3 text-xs font-semibold tracking-wider uppercase">Support the project</p>
    <SliderTips />
  </div>
</div>
