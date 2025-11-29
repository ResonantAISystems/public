// GPTClock - Content Script v2.0.0
// This script injects the actual interceptor into the page

(function() {
  console.log('GPTClock v2.0.0: Content script loaded');

  // Load settings from storage and inject them into the page
  chrome.storage.sync.get(['timezoneMode', 'timezoneValue'], function(result) {
    const settings = {
      timezoneMode: result.timezoneMode || 'local',
      timezoneValue: result.timezoneValue || 'America/New_York'
    };

    console.log('GPTClock: Loaded settings from storage:', settings);

    // Inject settings into page context via data attribute
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.setAttribute('data-gptclock-settings', JSON.stringify(settings));
    script.onload = function() {
      console.log('GPTClock: Injected script loaded into page');
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);

    console.log('GPTClock v2.0.0: Injection complete');
  });

  // Listen for settings changes from storage
  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'sync' && (changes.timezoneMode || changes.timezoneValue)) {
      console.log('GPTClock: Settings changed, updating...');
      chrome.storage.sync.get(['timezoneMode', 'timezoneValue'], function(result) {
        const settings = {
          timezoneMode: result.timezoneMode || 'local',
          timezoneValue: result.timezoneValue || 'America/New_York'
        };
        console.log('GPTClock: Updated settings:', settings);

        // Update settings in page context
        const updateScript = document.createElement('script');
        updateScript.textContent = `
          if (window.__GPTClockSettings) {
            window.__GPTClockSettings = ${JSON.stringify(settings)};
            console.log('GPTClock: Settings updated dynamically to:', window.__GPTClockSettings);
          }
        `;
        (document.head || document.documentElement).appendChild(updateScript);
        updateScript.remove();
      });
    }
  });
})();
