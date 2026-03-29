export const DEFAULT_AI_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_AI_MODEL = "google/gemini-2.5-flash-lite";
export const DEFAULT_AI_TEMPERATURE = 0;

export const BMC_LINK = "https://www.buymeacoffee.com/biplobsd";
export const REPO_URL = "https://github.com/biplobsd/webmerge";
export const DEVELOPER_NAME = "Biplob Kumar Sutradhar";
export const DEVELOPER_URL = "https://github.com/biplobsd";
export const COUNTRY_URL = "https://en.wikipedia.org/wiki/Bangladesh";
export const CHROME_WEB_STORE_REVIEW_LINK = "https://chromewebstore.google.com/detail/webmerge";
export const IMDB_URL_PREFIX = "https://www.imdb.com/title/";
export const RT_SEARCH_PREFIX = "https://www.rottentomatoes.com/search?search=";
export const METACRITIC_SEARCH_PREFIX = "https://www.metacritic.com/search/all/";

const manifest =
  typeof chrome !== "undefined" && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest()
    : { name: "WebMerge", short_name: "WebMerge" };
export const APP_SHORT_NAME = ((manifest as Record<string, unknown>).short_name as string) || manifest.name;

export const APP_CONTEXT_MENU_ID = "webmerge-add-site";
