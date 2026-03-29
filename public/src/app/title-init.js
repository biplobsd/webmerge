(function () {
  const manifest = chrome.runtime.getManifest();
  document.title = manifest.short_name || manifest.name;
})();
