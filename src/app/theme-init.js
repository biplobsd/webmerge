document.documentElement.setAttribute("data-theme", "dark");

chrome.storage.sync.get("theme", function (result) {
  document.documentElement.setAttribute("data-theme", result.theme || "dark");
});
