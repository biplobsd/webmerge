export async function parseWithOffscreen(html: string): Promise<string> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "PARSE_HTML", html }, (res) => {
      resolve((res as { text: string })?.text ?? "");
    });
  });
}
