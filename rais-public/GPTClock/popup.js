// GPTClock - Popup Script v2.0.0
// Handles settings UI and storage

(function() {
  'use strict';

  const localRadio = document.getElementById('local');
  const specificRadio = document.getElementById('specific');
  const timezoneSelect = document.getElementById('timezoneSelect');
  const preview = document.getElementById('preview');
  const status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['timezoneMode', 'timezoneValue'], function(result) {
    console.log('Popup: Loaded from storage:', result);
    const mode = result.timezoneMode || 'local';
    const value = result.timezoneValue || 'America/New_York';

    console.log('Popup: Using mode:', mode, 'value:', value);

    if (mode === 'specific') {
      specificRadio.checked = true;
      timezoneSelect.disabled = false;
    } else {
      localRadio.checked = true;
      timezoneSelect.disabled = true;
    }

    timezoneSelect.value = value;
    updatePreview();
  });

  // Handle radio button changes
  localRadio.addEventListener('change', function() {
    if (this.checked) {
      timezoneSelect.disabled = true;
      saveSettings();
      updatePreview();
    }
  });

  specificRadio.addEventListener('change', function() {
    if (this.checked) {
      timezoneSelect.disabled = false;
      saveSettings();
      updatePreview();
    }
  });

  // Handle timezone select changes
  timezoneSelect.addEventListener('change', function() {
    saveSettings();
    updatePreview();
  });

  // Save settings to storage
  function saveSettings() {
    const mode = specificRadio.checked ? 'specific' : 'local';
    const value = timezoneSelect.value;

    console.log('Popup: Saving settings - mode:', mode, 'value:', value);

    chrome.storage.sync.set({
      timezoneMode: mode,
      timezoneValue: value
    }, function() {
      console.log('Popup: Settings saved successfully');
      // Show saved status
      status.classList.add('show');
      setTimeout(function() {
        status.classList.remove('show');
      }, 2000);
    });
  }

  // Update preview
  function updatePreview() {
    try {
      const now = new Date();
      const mode = specificRadio.checked ? 'specific' : 'local';
      let timeZone, tzAbbr;

      if (mode === 'local') {
        // Use local time
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Get local time zone abbreviation
        const localTimeStr = now.toLocaleString('en-US', {
          timeZoneName: 'short'
        });
        const match = localTimeStr.match(/\b([A-Z]{2,5})\b$/);
        tzAbbr = match ? match[1] : 'Local';
      } else {
        // Use specific timezone
        timeZone = timezoneSelect.value;

        // Get timezone abbreviation
        const tzTimeStr = now.toLocaleString('en-US', {
          timeZone: timeZone,
          timeZoneName: 'short'
        });
        const match = tzTimeStr.match(/\b([A-Z]{2,5})\b$/);
        tzAbbr = match ? match[1] : timeZone.split('/')[1];
      }

      // Format time in selected timezone
      const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timeZone }));
      let hours = tzTime.getHours();
      const minutes = tzTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      const humanReadable = `${hours}:${minutes} ${ampm} ${tzAbbr}`;
      const timestamp = `[${now.toISOString()}] (${humanReadable})`;

      preview.textContent = timestamp;
    } catch (e) {
      preview.textContent = 'Error generating preview';
      console.error('Preview error:', e);
    }
  }

  // Update preview every second
  setInterval(updatePreview, 1000);
})();
