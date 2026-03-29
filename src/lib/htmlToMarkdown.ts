import TurndownService from "turndown";

const LAZY_ATTRS = [
  "data-src",
  "data-lazy-src",
  "data-lazy",
  "data-original",
  "data-image",
  "data-img",
  "data-url",
  "data-srcset",
  "data-echo",
  "data-bg",
  "data-background",
  "data-defer-src",
  "data-wp-src",
  "data-orig-file",
  "data-cfsrc",
  "data-cf-src",
  "data-nimg",
  "data-src-set",
  "data-hero-img-url",
  "data-thumb",
  "data-thumbnail",
  "data-full-src",
  "data-actualsrc",
  "data-lazyload",
  "data-pagespeed-lazy-src",
];

const TAXONOMY_SEGMENTS = ["/category/", "/tag/", "/genre/", "/tags/", "/topics/", "/label/", "/type/", "/filter/"];

const BOILERPLATE_LINK_TEXTS = new Set([
  "read more",
  "continue reading",
  "learn more",
  "see more",
  "show more",
  "view all",
  "more",
  "load more",
  "click here",
  "here",
  "details",
  "view details",
  "buy now",
  "shop now",
  "add to cart",
  "get it now",
  "watch now",
  "download",
  "share",
  "tweet",
  "pin it",
  "next",
  "previous",
  "prev",
  "back",
  "home",
  "top",
  "skip to content",
  "reply",
  "comment",
  "subscribe",
  "sign up",
  "log in",
  "login",
  "sign in",
  "register",
]);

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "[class*='breadcrumb']",
  "[id*='breadcrumb']",
  "[class*='pagination']",
  "[class*='paging']",
  "[id*='pagination']",
  ".page-numbers",
  ".wp-pagenavi",
  "[class*='share-btn']",
  "[class*='share-bar']",
  "[class*='share-box']",
  "[class*='share-icon']",
  "[class*='share-link']",
  "[class*='share-buttons']",
  "[class*='-share-']",
  "[class*='social-share']",
  "[class*='social-icon']",
  "[class*='social-link']",
  "[class*='social-button']",
  "[class*='social-media']",
  "[class*='social-network']",
  "[class*='-social-']",
  "[class*='addtoany']",
  "[class*='addthis']",
  "[class*='advertisement']",
  "[class*='google-ad']",
  "[id*='google-ad']",
  "[class*='ad-slot']",
  "[class*='ad_slot']",
  "[id*='ad-slot']",
  "[class*='comment-list']",
  "[id*='comments']",
  "[class*='disqus']",
  "[class*='widget']",
  "[class*='sidebar']",
  "[id*='sidebar']",
  "[class*='newsletter']",
  "[class*='subscribe']",
  "[class*='cookie']",
  "[class*='gdpr']",
  "[class*='consent']",
  "[class*='related-posts']",
  "[class*='related_posts']",
  "[class*='recommended']",
  "[class*='you-may']",
  "[class*='also-like']",
  "[class*='tag-cloud']",
  "[class*='tag_cloud']",
  "[class*='popup']",
  "[class*='modal']",
  "[class*='overlay']",
  "figcaption",
  "button",
  "form",
  "input",
  "select",
  "textarea",
  "[class*='back-to-top']",
  "[class*='scroll-top']",
  "[aria-label='breadcrumb']",
  "[style*='display:none']",
  "[style*='display: none']",
  "[hidden]",
  "[aria-hidden='true']",
];

const NOISY_IMG_ATTRS = [
  "srcset",
  "sizes",
  "width",
  "height",
  "loading",
  "decoding",
  "crossorigin",
  "referrerpolicy",
  "style",
  "class",
  "id",
  "fetchpriority",
  "importance",
  "itemprop",
  "itemscope",
  "itemtype",
  "onload",
  "onerror",
  "onabort",
  "post-id",
  "fifu-featured",
  "elementtiming",
];

const td = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  br: "",
});
td.remove(["script", "style", "noscript", "nav", "footer", "header", "aside"]);

function removeNoisyElements(doc: Document): void {
  const SAFE_TAGS = new Set(["html", "head", "body"]);
  doc.querySelectorAll(NOISE_SELECTORS.join(",")).forEach((el) => {
    if (SAFE_TAGS.has(el.tagName.toLowerCase())) return;
    if (el.tagName.toLowerCase() === "img") return;
    el.remove();
  });
}

function unwrapPictures(doc: Document): void {
  doc.querySelectorAll("picture").forEach((picture) => {
    const img = picture.querySelector("img");
    if (img) picture.replaceWith(img);
    else picture.remove();
  });
}

function unwrapImageLinksBlocks(doc: Document): void {
  doc.querySelectorAll("a").forEach((a) => {
    const imgs = Array.from(a.querySelectorAll("img"));
    if (imgs.length === 0) return;

    imgs.forEach((img) => {
      let cursor = img.parentElement;
      while (cursor && cursor !== a) {
        const wrapper = cursor;
        const wrapperParent = wrapper.parentElement;
        if (!wrapperParent) break;
        while (wrapper.firstChild) {
          wrapperParent.insertBefore(wrapper.firstChild, wrapper);
        }
        wrapperParent.removeChild(wrapper);
        cursor = img.parentElement;
      }
    });
  });
}

function normalizeLazyImages(doc: Document): void {
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    const isPlaceholder = !src || src.startsWith("data:") || src === "#" || src === "about:blank" || src.length < 5;

    if (isPlaceholder) {
      for (const attr of LAZY_ATTRS) {
        const val = img.getAttribute(attr);
        if (val && !val.startsWith("data:") && val !== "#" && val.length > 5) {
          img.setAttribute("src", val);
          break;
        }
      }
    }

    if (!img.getAttribute("alt")) {
      const title = img.getAttribute("title") || img.getAttribute("data-alt") || "";
      if (title) img.setAttribute("alt", title);
    }
  });
}

function cleanImages(doc: Document): void {
  doc.querySelectorAll("img").forEach((img) => {
    const w = parseInt(img.getAttribute("width") ?? "0", 10);
    const h = parseInt(img.getAttribute("height") ?? "0", 10);
    if ((w > 0 && w <= 3) || (h > 0 && h <= 3)) {
      img.remove();
      return;
    }

    const src = img.getAttribute("src") ?? "";
    if (!src || src.startsWith("data:")) {
      img.remove();
      return;
    }

    NOISY_IMG_ATTRS.forEach((attr) => img.removeAttribute(attr));

    Array.from(img.attributes)
      .filter((a) => a.name.startsWith("data-"))
      .forEach((a) => img.removeAttribute(a.name));
  });
}

function stripTitleAttributes(doc: Document): void {
  doc.querySelectorAll("a[title], img[title]").forEach((el) => el.removeAttribute("title"));
}

function removeDuplicateHeadings(doc: Document): void {
  const imageWrapperHrefs = new Set<string>();
  doc.querySelectorAll("a img").forEach((img) => {
    const href = img.closest("a")?.getAttribute("href");
    if (href) imageWrapperHrefs.add(href);
  });

  doc.querySelectorAll("h1, h2, h3, h4").forEach((heading) => {
    const href = heading.querySelector("a")?.getAttribute("href");
    if (href && imageWrapperHrefs.has(href)) heading.remove();
  });
}

function removeEmptyHeadings(doc: Document): void {
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    if ((h.textContent ?? "").trim() === "") h.remove();
  });
}

function flattenTaxonomyLinks(doc: Document): void {
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (TAXONOMY_SEGMENTS.some((seg) => href.includes(seg))) {
      a.replaceWith(doc.createTextNode(a.textContent ?? ""));
    }
  });
}

function removeBoilerplateLinks(doc: Document): void {
  doc.querySelectorAll("a").forEach((a) => {
    const text = (a.textContent ?? "").trim().toLowerCase();
    if (BOILERPLATE_LINK_TEXTS.has(text)) a.remove();
  });
}

function removeOrphanImageLinks(doc: Document): void {
  const textLinkHrefs = new Set<string>();
  doc.querySelectorAll("a").forEach((a) => {
    if (!a.querySelector("img") && (a.textContent ?? "").trim().length > 0) {
      const href = a.getAttribute("href");
      if (href) textLinkHrefs.add(href);
    }
  });

  doc.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href");
    const imgs = a.querySelectorAll("img");
    if (href && textLinkHrefs.has(href) && imgs.length > 0 && (a.textContent ?? "").trim() === "") {
      imgs.forEach((img) => a.parentNode?.insertBefore(img, a));
      a.remove();
    }
  });
}

function stripMarkdownTitles(md: string): string {
  return md.replace(/(\]\()([^\s"')]+) "([^"]*)"\)/g, "$1$2)").replace(/(\]\()([^\s"')]+) '([^']*)'\)/g, "$1$2)");
}

function deduplicateLines(md: string): string {
  const strip = (s: string) => s.replace(/[*_`#>\-[\]!]/g, "").trim();
  const lines = md.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = lines[i - 1] ?? "";
    if (line.trim() !== "" && strip(line) === strip(prev)) continue;
    out.push(line);
  }
  return out.join("\n");
}

function deduplicateItemsByUrl(md: string): string {
  const seenUrls = new Set<string>();
  const blocks = md.split(/\n\n+/);
  const out: string[] = [];
  for (const block of blocks) {
    if (/^!\[/.test(block.trim())) {
      out.push(block);
      continue;
    }
    const urlMatches = [...block.matchAll(/\]\(([^)]+)\)/g)];
    const url = urlMatches.length > 0 ? urlMatches[urlMatches.length - 1][1] : undefined;
    if (url && seenUrls.has(url)) continue;
    if (url) seenUrls.add(url);
    out.push(block);
  }
  return out.join("\n\n");
}

const BOILERPLATE_LINE_PATTERNS: RegExp[] = [
  /^©/i,
  /\ball\s+rights\s+reserved\b/i,
  /^copyright\b/i,
  /^last\s+(updated|modified|edited|revised)\b/i,
  /^(filed|posted|published)\s+(under|in|on)\b/i,
  /^tagged\s+(with|in|under)\b/i,
  /^tags?\s*:/i,
  /^categor(y|ies)\s*:/i,
  /\b\d+\s*min\s+read\b/i,
  /^reading\s+time\b/i,
  /^\d+\s+(shares?|comments?|views?|likes?|reactions?)\s*$/i,
  /^(leave|post|write)\s+a\s+(reply|comment|response)\b/i,
  /^(you must be|log in to|sign in to)\b.*\b(comment|reply|post)\b/i,
  /^(we use cookies|this site uses cookies|by continuing)\b/i,
  /^(accept|decline|manage)\s+(cookies|preferences)\s*$/i,
  /^table of contents\s*$/i,
  /^(share this|share on|spread the word)\b/i,
  /^(previous|next)\s+(post|article|entry)\s*$/i,
  /^(about|written by)\s+the\s+author\s*$/i,
  /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*$/,
  /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\s*$/i,
];

function removeBoilerplateText(md: string): string {
  return md
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed === "") return true;
      return !BOILERPLATE_LINE_PATTERNS.some((rx) => rx.test(trimmed));
    })
    .join("\n");
}

function normalizeWhitespace(md: string): string {
  return md.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
}

export async function htmlStringToMarkdown(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, "text/html");

  removeNoisyElements(doc);
  unwrapPictures(doc);
  normalizeLazyImages(doc);
  cleanImages(doc);
  stripTitleAttributes(doc);
  removeDuplicateHeadings(doc);
  removeEmptyHeadings(doc);
  flattenTaxonomyLinks(doc);
  removeBoilerplateLinks(doc);
  unwrapImageLinksBlocks(doc);
  removeOrphanImageLinks(doc);

  const bodyEl = doc.body ?? doc.documentElement;
  if (!bodyEl) throw new Error("Job: content parsed");
  let result = td.turndown(bodyEl.innerHTML);

  result = stripMarkdownTitles(result);
  result = deduplicateLines(result);
  result = removeBoilerplateText(result);
  result = normalizeWhitespace(result);
  result = deduplicateItemsByUrl(result);

  return result.trim();
}
