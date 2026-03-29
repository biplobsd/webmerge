import { REPO_URL } from "./constants";

const DOCS_BASE_URL = `${REPO_URL}/blob/main/README.md`;

function withAnchor(anchor: string): string {
	return `${DOCS_BASE_URL}#${anchor}`;
}

export const DOCS = {
	overview: withAnchor("in-app-guide"),
	aiSettings: withAnchor("setup-ai-api-key"),
	addYourFirstSite: withAnchor("add-your-first-site"),
	contextMenuAddSite: withAnchor("context-menu-add-site"),
	homepageAutoFetch: withAnchor("homepage-auto-fetch"),
	searchAndResults: withAnchor("search-and-results"),
	buildAndDevelopment: withAnchor("build--development"),
	contributingAndIssues: withAnchor("contributing-and-issues"),
	support: withAnchor("support"),
} as const;

