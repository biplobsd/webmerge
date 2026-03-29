import { defineConfig } from "vite-plus";
import { loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.config";
import path from "path";
import { resolve } from "path";
import * as fs from "node:fs";
import type { Plugin } from "vite";

type Browser = "firefox" | "chrome";

const env = loadEnv("all", process.cwd());
const browserName: Browser = (env.VITE_BROWSER_NAME || process.env.VITE_BROWSER_NAME || "chrome") as Browser;
const isFirefox = browserName === "firefox";

function firefoxManifestPlugin(): Plugin {
  return {
    name: "firefox-manifest-patch",
    closeBundle() {
      if (!isFirefox) return;

      const manifestPath = resolve(__dirname, "dist", "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        console.error("[firefox-manifest-patch] manifest.json not found at", manifestPath);
        return;
      }

      const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const geckoId = data.author?.email || data.author;

      data.browser_specific_settings = {
        gecko: {
          id: geckoId,
          strict_min_version: "128.0",
        },
      };

      if (typeof data.author === "object" && "email" in data.author) {
        data.author = data.author.email;
      }

      fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf-8");
      console.log("[firefox-manifest-patch] manifest.json patched for Firefox");
    },
  };
}

export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {
    useTabs: false,
    tabWidth: 2,
    singleQuote: true,
    trailingComma: "es5",
    printWidth: 100,
    sortTailwindcss: {},
    sortPackageJson: false,
    ignorePatterns: [],
  },
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, "src/app/app.html"),
        popup: resolve(__dirname, "src/popup/popup.html"),
        ...(!isFirefox && { offscreen: resolve(__dirname, "src/offscreen/offscreen.html") }),
      },
    },
  },
  plugins: [svelte(), crx({ manifest, browser: browserName }), firefoxManifestPlugin()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
    },
  },
  legacy: {
    skipWebSocketTokenCheck: true,
  },
});
