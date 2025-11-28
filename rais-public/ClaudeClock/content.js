// ClaudeClock - Content Script v2.1.0
// This script injects the actual interceptor into the page
// Firefox-compatible version

(function() {
  console.log('ClaudeClock v2.1.0: Content script loaded');

  // Firefox compatibility: use browser namespace if available, fallback to chrome
  const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;

  // Inject the script into the page context
  const script = document.createElement('script');
  script.src = extensionAPI.runtime.getURL('injected.js');
  script.onload = function() {
    console.log('ClaudeClock: Injected script loaded into page');
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  console.log('ClaudeClock v2.1.0: Injection complete');
})();