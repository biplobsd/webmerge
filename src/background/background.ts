import { v4 as uuid } from "uuid";
import { APP_CONTEXT_MENU_ID } from "src/lib/constants";
import { logger } from "src/lib/logger";
import { fetchHtml } from "src/lib/fetcher";
import { parseWithOffscreen } from "src/lib/htmlParser";
import { AIService } from "src/lib/aiService";
import { buildSearchUrl } from "src/lib/urlBuilder";
import { sortByPublishDate } from "src/lib/sorter";
import { enqueue, stop, stopAll, setStatus } from "src/lib/jobQueue";
import { enrichItems, loadEnrichmentsForSite } from "src/lib/enrichmentService";
import type { SiteConfig } from "src/lib/types";
import { htmlStringToMarkdown } from "src/lib/htmlToMarkdown";

const OFFSCREEN_URL = "src/offscreen/offscreen.html";

async function setupOffscreenDocument() {
  const exists = await chrome.offscreen.hasDocument();

  if (!exists) {
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL(OFFSCREEN_URL),
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: "Convert raw HTML to Markdown for AI processing",
    });
  }
}

chrome.runtime.onStartup.addListener(setupOffscreenDocument);
chrome.runtime.onInstalled.addListener(setupOffscreenDocument);

chrome.action.onClicked.addListener(() => {
  const appUrl = chrome.runtime.getURL("src/app/app.html");
  chrome.tabs.query({ url: appUrl }, (tabs) => {
    if (tabs.length > 0 && tabs[0].id != null) {
      chrome.tabs.update(tabs[0].id, { active: true });
    } else {
      chrome.tabs.create({ url: appUrl });
    }
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  const manifest = chrome.runtime.getManifest() as any;
  chrome.contextMenus.create({
    id: APP_CONTEXT_MENU_ID,
    title: `Add site to ${manifest.short_name || manifest.name}`,
    contexts: ["page", "link"],
  });

  if (details.reason === "install") {
    chrome.storage.local.set({ showWelcome: true });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== APP_CONTEXT_MENU_ID || !tab?.id) return;

  const pageUrl = info.linkUrl ?? info.pageUrl ?? tab.url ?? "";
  const pageTitle = tab.title ?? "";

  let origin = "";
  let hostname = "";
  try {
    const u = new URL(pageUrl);
    origin = u.origin;
    hostname = u.hostname;
  } catch {
    origin = pageUrl;
    hostname = pageUrl;
  }

  const searchUrlTemplate = detectSearchTemplate(pageUrl);
  const faviconUrl = `${origin}/favicon.ico`;

  let cookies = "";
  try {
    const allCookies = await chrome.cookies.getAll({ domain: hostname });
    cookies = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch {
    cookies = "";
  }

  const pendingSite = {
    name: pageTitle,
    origin,
    pageUrl,
    searchUrlTemplate,
    listingUrl: origin,
    faviconUrl,
    cookies,
  };

  await chrome.storage.local.set({ pendingSite });

  chrome.windows.create({
    url: chrome.runtime.getURL("src/popup/popup.html"),
    type: "popup",
    width: 460,
    height: 620,
    focused: true,
  });
});

function detectSearchTemplate(rawUrl: string): string {
  const SEARCH_PARAMS = ["q", "query", "s", "search", "k", "keyword", "term", "text", "p", "wd"];
  try {
    const u = new URL(rawUrl);
    for (const param of SEARCH_PARAMS) {
      if (u.searchParams.has(param)) {
        u.searchParams.set(param, "{query}");
        return decodeURIComponent(u.toString());
      }
    }
    const pathMatch = u.pathname.match(/^(.*\/(search|find|results|query)\/)([^/]+)(\/?.*)$/i);
    if (pathMatch) {
      u.pathname = `${pathMatch[1]}{query}${pathMatch[4]}`;
      return decodeURIComponent(u.toString());
    }
  } catch {
    /* url parse failed — ignore */
  }
  return "";
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const m = msg as Record<string, unknown>;

  switch (m.type) {
    case "SEARCH": {
      const sites = m.sites as SiteConfig[];
      const query = m.query as string;
      const targets = sites.filter((s) => s.enabled);
      Promise.allSettled(targets.map((site) => runJob(site, buildSearchUrl(site.searchUrlTemplate, query))));
      sendResponse({ jobCount: targets.length });
      return false;
    }

    case "FETCH_LISTINGS": {
      const sites = m.sites as SiteConfig[];
      const targets = sites.filter((s) => s.isHomepage && s.enabled);
      Promise.allSettled(targets.map((site) => runJob(site, site.listingUrl)));
      sendResponse({ jobCount: targets.length });
      return false;
    }

    case "STOP_JOB": {
      stop(m.jobId as string);
      sendResponse({ ok: true });
      return false;
    }

    case "STOP_ALL": {
      stopAll();
      sendResponse({ ok: true });
      return false;
    }

    default:
      return false;
  }
});

async function runJob(site: SiteConfig, url: string): Promise<void> {
  const jobId = uuid();
  const controller = new AbortController();

  enqueue({
    jobId,
    siteId: site.id,
    url,
    status: "running",
    startedAt: Date.now(),
    controller,
  });

  chrome.runtime.sendMessage({
    type: "JOB_UPDATE",
    jobId,
    siteId: site.id,
    status: "running",
  });

  try {
    const rawHtml = await fetchHtml(url, controller.signal, site.cookies);
    let content = "";
    if (import.meta.env.VITE_BROWSER_NAME === "firefox") {
      content = await htmlStringToMarkdown(rawHtml);
    } else {
      content = await parseWithOffscreen(rawHtml);
    }

    const ai = new AIService();
    const rawResults = await ai.extract(content, site.schema);

    const enrichments = await loadEnrichmentsForSite(site.id);
    const enrichedResults = await enrichItems(
      rawResults.map((r) => ({ ...r, siteId: site.id })),
      enrichments,
    );
    const results = sortByPublishDate(enrichedResults);

    setStatus(jobId, "done");
    chrome.runtime.sendMessage({
      type: "JOB_RESULT",
      jobId,
      siteId: site.id,
      status: "done",
      results,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const aborted = ["AbortError", "CanceledError"].includes(e.name);
    const status = aborted ? "stopped" : "failed";
    const error = e.message;

    setStatus(jobId, status, error);
    logger.error({ jobId, siteId: site.id, err }, `Job ${status}`);
    chrome.runtime.sendMessage({
      type: "JOB_RESULT",
      jobId,
      siteId: site.id,
      status,
      error,
      results: [],
    });
  }
}
