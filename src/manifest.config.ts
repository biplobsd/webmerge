import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";

const browserName = process.env.VITE_BROWSER_NAME || "chrome";
const isFirefox = browserName === "firefox";

export default defineManifest({
  manifest_version: 3,
  name: "WebMerge - Multi-Website Feed Aggregator",
  short_name: "WebMerge",
  author: {
    email: "webmerge@biplobsd.me",
  },
  homepage_url: "https://biplobsd.github.io/apps/webmerge",
  version: packageJson.version,
  description: "Multi-site aggregator and feed collector.",
  icons: {
    "16": "assets/icons/icon16.png",
    "32": "assets/icons/icon32.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png",
  },
  action: {
    default_icon: "assets/icons/icon48.png",
  },
  options_page: "src/app/app.html",
  background: {
    service_worker: "src/background/background.ts",
    scripts: ["src/background/background.ts"],
    type: "module",
  },
  permissions: [
    "storage",
    "tabs",
    "contextMenus",
    "cookies",
    ...(!isFirefox ? (["offscreen"] as chrome.runtime.ManifestPermission[]) : []),
  ] as chrome.runtime.ManifestPermission[],
  host_permissions: ["<all_urls>"],
});
