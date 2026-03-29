<script lang="ts">
  import Docs_Link from "src/components/Docs_Link.svelte";
  import { DOCS } from "src/lib/docs";
  import { toast } from "svelte-sonner";
  import { Eye, EyeOff, CheckCircle, XCircle, Loader } from "lucide-svelte";
  import { SettingsSchema } from "src/lib/schemas";
  import { DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL } from "src/lib/constants";
  import { store } from "src/lib/store.svelte";

  let aiBaseUrl = $state(DEFAULT_AI_BASE_URL);
  let aiApiKey = $state("");
  let aiModel = $state(DEFAULT_AI_MODEL);
  let showKey = $state(false);
  let saving = $state(false);
  let testing = $state(false);
  let testResult = $state<"success" | "error" | null>(null);
  let testMessage = $state("");

  $effect(() => {
    chrome.storage.sync.get(["aiBaseUrl", "aiApiKey", "aiModel"], (stored) => {
      if (stored.aiBaseUrl) aiBaseUrl = stored.aiBaseUrl as string;
      if (stored.aiApiKey) aiApiKey = stored.aiApiKey as string;
      if (stored.aiModel) aiModel = stored.aiModel as string;
    });
  });

  async function save() {
    saving = true;
    try {
      const validated = SettingsSchema.pick({
        aiBaseUrl: true,
        aiApiKey: true,
        aiModel: true,
      }).parse({ aiBaseUrl, aiApiKey, aiModel });
      await chrome.storage.sync.set(validated);
      store.aiApiKey = validated.aiApiKey;
      toast.success("AI settings saved");
    } catch {
      toast.error("Validation failed — check the fields");
    } finally {
      saving = false;
    }
  }

  async function testConnection() {
    if (!aiApiKey.trim()) {
      testResult = "error";
      testMessage = "API key is required";
      return;
    }
    if (!aiBaseUrl.trim()) {
      testResult = "error";
      testMessage = "API Base URL is required";
      return;
    }
    testing = true;
    testResult = null;
    testMessage = "";
    try {
      const url = `${aiBaseUrl.replace(/\/$/, "")}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiApiKey}` },
        body: JSON.stringify({ model: aiModel, messages: [{ role: "user", content: "Reply with the single word: ok" }], max_tokens: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content ?? "";
        testResult = "success";
        testMessage = reply ? `Connected — model replied: "${reply.trim()}"` : "Connected successfully";
      } else {
        const err = await res.json().catch(() => ({}));
        testResult = "error";
        testMessage = err?.error?.message ?? `HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (e: unknown) {
      testResult = "error";
      testMessage = e instanceof Error ? e.message : "Network error — check the URL";
    } finally {
      testing = false;
    }
  }
</script>

<div class="flex flex-col gap-4">
  <fieldset class="fieldset">
    <legend class="fieldset-legend inline-flex items-center gap-1.5">API Base URL <Docs_Link href={DOCS.aiSettings} /></legend>
    <label class="input w-full">
      <svg
        class="h-[1em] opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <input id="ai-base-url" type="url" bind:value={aiBaseUrl} placeholder={DEFAULT_AI_BASE_URL} oninput={() => (testResult = null)} />
    </label>
    <p class="label">OpenAI-compatible endpoint (e.g. OpenRouter, local Ollama)</p>
  </fieldset>

  <fieldset class="fieldset">
    <legend class="fieldset-legend inline-flex items-center gap-1.5">API Key <Docs_Link href={DOCS.aiSettings} /></legend>
    <label class="input w-full">
      <svg
        class="h-[1em] opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
      <input
        id="ai-api-key"
        type={showKey ? "text" : "password"}
        bind:value={aiApiKey}
        placeholder="sk-or-..."
        oninput={() => (testResult = null)}
      />
      <button class="btn btn-ghost btn-xs p-1" onclick={() => (showKey = !showKey)} title={showKey ? "Hide key" : "Show key"} type="button">
        {#if showKey}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
      </button>
    </label>
    <p class="label">Your provider API key — stored locally, never sent anywhere else</p>
  </fieldset>

  <fieldset class="fieldset">
    <legend class="fieldset-legend inline-flex items-center gap-1.5">Model <Docs_Link href={DOCS.aiSettings} /></legend>
    <label class="input w-full">
      <svg
        class="h-[1em] opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
      </svg>
      <input id="ai-model" type="text" bind:value={aiModel} placeholder={DEFAULT_AI_MODEL} oninput={() => (testResult = null)} />
    </label>
    <p class="label">Default: <code class="bg-base-300/30 rounded px-1 text-xs">{DEFAULT_AI_MODEL}</code></p>
  </fieldset>

  {#if testResult !== null}
    <div
      class="animate-fade-in flex items-start gap-2 rounded-lg border px-3 py-2 text-sm
      {testResult === 'success' ? 'border-success/40 bg-success/10 text-success' : 'border-error/40 bg-error/10 text-error'}"
    >
      {#if testResult === "success"}<CheckCircle size={16} class="mt-0.5 shrink-0" />
      {:else}<XCircle size={16} class="mt-0.5 shrink-0" />{/if}
      <span>{testMessage}</span>
    </div>
  {/if}

  <div class="border-base-300 flex justify-end gap-2 border-t pt-2">
    <button
      class="btn btn-accent btn-soft btn-sm transition-all duration-150"
      onclick={testConnection}
      disabled={testing || saving}
      type="button"
    >
      {#if testing}<Loader size={14} class="animate-spin" />Testing…{:else}Test Connection{/if}
    </button>
    <button
      class="btn btn-primary btn-sm shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      onclick={save}
      disabled={saving || testing}
    >
      {#if saving}<span class="loading loading-spinner loading-sm"></span>{/if}
      Save Settings
    </button>
  </div>
</div>
