// ClaudeClock - Content Script v2.1.0
// This script injects the actual interceptor into the page

(function() {
  console.log('ClaudeClock v2.1.0: Content script loaded');

  // Inject the script into the page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    console.log('ClaudeClock: Injected script loaded into page');
    this.remove();

    // Load timezone settings and send to page context
    chrome.storage.sync.get(['useLocal', 'timezone'], function(result) {
      const settings = {
        useLocal: result.useLocal !== undefined ? result.useLocal : false,
        timezone: result.timezone || 'America/New_York'
      };

      console.log('ClaudeClock: Loaded settings:', settings);

      // Send settings to page context
      window.postMessage({
        type: 'CLAUDECLOCK_SETTINGS',
        settings: settings
      }, '*');
    });
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for storage changes and update settings in real-time
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
      chrome.storage.sync.get(['useLocal', 'timezone'], function(result) {
        const settings = {
          useLocal: result.useLocal !== undefined ? result.useLocal : false,
          timezone: result.timezone || 'America/New_York'
        };

        console.log('ClaudeClock: Settings changed:', settings);

        // Send updated settings to page context
        window.postMessage({
          type: 'CLAUDECLOCK_SETTINGS',
          settings: settings
        }, '*');
      });
    }
  });

  console.log('ClaudeClock v2.1.0: Injection complete');
})();
