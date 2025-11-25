// GhostClock - Content Script v2.0.0
// This script injects the actual interceptor into the page

(function() {
  console.log('GhostClock v2.0.0: Content script loaded');

  // Inject the script into the page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    console.log('GhostClock: Injected script loaded into page');
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  console.log('GhostClock v2.0.0: Injection complete');
})();
