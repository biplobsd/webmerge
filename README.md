> [!CAUTION]
> **Caution: Experimental Project**
> 
> This project is in an experimental stage and is intended for personal use only.

# WebMerge — Multi Website Aggregator & Feed Collector

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/biplobsd/webmerge/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/biplobsd/webmerge?label=Release&logo=github)](https://github.com/biplobsd/webmerge/releases)
[![Build](https://github.com/biplobsd/webmerge/actions/workflows/build.yml/badge.svg)](https://github.com/biplobsd/webmerge/actions/workflows/build.yml)

WebMerge is a browser extension for Chrome and Firefox that aggregates and searches across multiple websites simultaneously. It uses AI to extract structured data from web pages and presents results in a unified, sortable feed.

## Features

- **Parallel Multi-Site Search** — Query multiple websites at once in a single search
- **AI-Powered Data Extraction** — Uses OpenRouter or Mistral AI to parse raw HTML to cleaned Markdown and then into structured items (titles, prices, images, dates etc.)
- **Custom Site Schemas** — Define your own field schemas per site to extract exactly the data you need
- **Result Feed** — Browse, sort, and filter aggregated results across all sites
- **Homepage Feeds** — Pin sites as "homepage" sources and fetch their latest listings with one click
- **Result Cards** — Customisable card layouts with drag-and-drop field ordering, per-site or per-group
- **Site Groups** — Organise your sites into named groups and search within a specific group
- **Enrichments** — Optionally fetch extra metadata from external APIs (e.g. OMDB for movie ratings)
- **Context Menu Integration** — Right-click any page to add it as a new site
- **Custom Cookies** — Pass session cookies to search on sites that require login
- **Chrome & Firefox** — Full support for both browsers with a single codebase
- **Dynamic Filter Tabs** — A collapsible filter bar below the site tabs lets you filter results by any categorical field (e.g. `media_type`, `genre`). Filter rows are fully dynamic — any badge-style field you add to your card layout automatically gets its own filter row with all unique values as clickable tabs
- **Media Type Filtering** — The `media_type` field (e.g. Movie, Series, Game) is always surfaced as a filter row when two or more distinct values exist in the current results
- **Smooth Card Animations** — Card hover effects (lift, scale, image zoom, ambient glow) are GPU-accelerated via compositor-only transforms, keeping animations fluid on both Chrome and Firefox

## How It Works

1. **Configure Sites** — Add search sites with URL templates (e.g. `https://example.com/search?q={query}`) and field schemas
2. **Search** — Enter a query; the extension fetches all enabled sites in parallel
3. **AI Extraction** — Each page's HTML is converted to cleaned Markdown and sent to the LLM, which extracts structured JSON matching your schema
4. **Results** — Items are merged, sorted by publish date, and displayed in a card grid

## Limitations

- Cloudflare protected sites are not supported
- Sites with heavy JavaScript rendering may not work properly

## In-App Guide

### Add Your First Site

If you have no sites configured yet:

1. Go to **Settings -> Sites**
2. Click **Add Site**
3. Fill search/listing URLs and save

### Context Menu Add Site

You can quickly add a site from any webpage:

1. Right-click on the page
2. Choose **Add site to WebMerge**
3. Confirm and save in the popup form

### Homepage Auto Fetch

To fetch latest results automatically:

1. Enable **Homepage auto-fetch** on a site
2. Enable **Always show latest on open** in settings

When both are enabled, WebMerge fetches homepage sources on startup.

### Search And Results

Use the Home screen to search enabled sites in parallel. Results are merged and shown in one feed, with filtering/sorting options in the Results screen.

## Installation

### From GitHub Releases (Recommended)

1. Download the latest `webmerge_vX.X.X_chrome.zip` or `webmerge_vX.X.X_firefox.zip` from the [Releases page](https://github.com/biplobsd/webmerge/releases)
2. Unzip the archive

**Chrome / Edge / Brave:**

3. Navigate to `chrome://extensions`
4. Enable **Developer Mode** (toggle in the top-right corner)
5. Click **Load unpacked** and select the unzipped `dist/` folder

**Firefox:**

3. Navigate to `about:debugging#/runtime/this-firefox`
4. Click **Load Temporary Add-on**
5. Select the `manifest.json` file inside the unzipped folder

### Building from Source

See the [Build & Development](#build--development) section below.

## Setup — AI API Key

WebMerge uses OpenAI-compatible APIs for AI extraction (for example [OpenRouter](https://openrouter.ai) or [Mistral AI](https://mistral.ai)).

1. Create an account with your provider and generate an API key (e.g. OpenRouter or Mistral AI)
2. Open the extension and go to **Settings → AI Settings**
3. Paste your API key and set the provider base URL/model. Recommended values:

	 - **Mistral AI**
		 - Base URL: `https://api.mistral.ai/v1`
		 - Model: `devstral-latest`
	 - **OpenRouter**
		 - Base URL: `https://openrouter.ai/api/v1`
		 - Model: `google/gemini-2.5-flash-lite`

The AI key is stored locally in your browser's extension storage and is never shared.

## Build & Development

### Prerequisites

- [Bun](https://bun.sh) `>= 1.3.6`
- Node.js `>= 20`

### Clone & Install

```bash
git clone https://github.com/biplobsd/webmerge.git
cd webmerge
bun install
```

### Development (watch mode)

```bash
# Chrome only 
bun run dev
```

Load the `dist/` folder as an unpacked extension in your browser. The build will hot-reload on file changes.

### Production Build

```bash
# Chrome
bun run build:chrome

# Firefox
bun run build:firefox

# Default (Chrome)
bun run build
```

The built extension is output to the `dist/` folder.


## Contributing And Issues

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the [MIT License](LICENSE).

## Support

If you find this project useful, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/biplobsd)
