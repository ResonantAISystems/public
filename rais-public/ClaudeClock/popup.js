// ClaudeClock - Popup Script v2.1.0
// Handles timezone preference UI and storage

(function() {
  'use strict';

  const localRadio = document.getElementById('local');
  const customRadio = document.getElementById('custom');
  const timezoneSelect = document.getElementById('timezoneSelect');
  const preview = document.getElementById('preview');
  const status = document.getElementById('status');

  // Generate timestamp preview
  function getTimestampPreview(useLocal, timezone) {
    const now = new Date();
    let timeZone, label;

    if (useLocal) {
      // Use browser's local timezone
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const localTime = new Date(now.toLocaleString('en-US', { timeZone }));
      let hours = localTime.getHours();
      const minutes = localTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      // Get timezone abbreviation
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(now);
      const tzAbbr = parts.find(p => p.type === 'timeZoneName')?.value || 'Local';

      label = `${hours}:${minutes} ${ampm} ${tzAbbr}`;
    } else {
      // Use selected timezone
      timeZone = timezone;
      const customTime = new Date(now.toLocaleString('en-US', { timeZone }));
      let hours = customTime.getHours();
      const minutes = customTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      // Get timezone abbreviation
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(now);
      const tzAbbr = parts.find(p => p.type === 'timeZoneName')?.value || timeZone.split('/').pop();

      label = `${hours}:${minutes} ${ampm} ${tzAbbr}`;
    }

    return `[${now.toISOString()}] (${label})`;
  }

  // Update preview
  function updatePreview() {
    const useLocal = localRadio.checked;
    const timezone = timezoneSelect.value;
    preview.textContent = getTimestampPreview(useLocal, timezone);
  }

  // Save settings
  function saveSettings() {
    const settings = {
      useLocal: localRadio.checked,
      timezone: timezoneSelect.value
    };

    chrome.storage.sync.set(settings, function() {
      // Show saved status
      status.classList.add('show');
      setTimeout(() => {
        status.classList.remove('show');
      }, 2000);
    });
  }

  // Load settings
  function loadSettings() {
    chrome.storage.sync.get(['useLocal', 'timezone'], function(result) {
      // Default to EST if no settings exist
      const useLocal = result.useLocal !== undefined ? result.useLocal : false;
      const timezone = result.timezone || 'America/New_York';

      // Set radio buttons
      if (useLocal) {
        localRadio.checked = true;
        customRadio.checked = false;
        timezoneSelect.disabled = true;
      } else {
        localRadio.checked = false;
        customRadio.checked = true;
        timezoneSelect.disabled = false;
      }

      // Set timezone select
      timezoneSelect.value = timezone;

      // Update preview
      updatePreview();
    });
  }

  // Event listeners
  localRadio.addEventListener('change', function() {
    if (this.checked) {
      timezoneSelect.disabled = true;
      updatePreview();
      saveSettings();
    }
  });

  customRadio.addEventListener('change', function() {
    if (this.checked) {
      timezoneSelect.disabled = false;
      updatePreview();
      saveSettings();
    }
  });

  timezoneSelect.addEventListener('change', function() {
    updatePreview();
    saveSettings();
  });

  // Update preview every second
  setInterval(updatePreview, 1000);

  // Load settings on popup open
  loadSettings();
})();
