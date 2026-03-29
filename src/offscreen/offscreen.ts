import { htmlStringToMarkdown } from "src/lib/htmlToMarkdown";

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type !== "PARSE_HTML") return false;

  (async () => {
    try {
      const text = await htmlStringToMarkdown(msg.html as string);
      sendResponse({ text });
    } catch {
      sendResponse({ text: "" });
    }
  })();

  return true;
});
