chrome.storage.local.get('theme', function (r) {
  document.documentElement.setAttribute('data-theme', r.theme || 'light');
});
