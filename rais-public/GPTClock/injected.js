// GPTClock - Injected Script v2.0.0
// This script runs in the page context to intercept fetch

(function() {
  'use strict';

  // Function to get current timestamp
  function getTimestamp() {
    const now = new Date();

    // Get settings from window (injected by content script)
    const settings = window.__GPTClockSettings || { timezoneMode: 'local', timezoneValue: 'America/New_York' };

    console.log('GPTClock: Using settings:', JSON.stringify(settings));

    let timeZone, tzAbbr;

    if (settings.timezoneMode === 'local') {
      // Use local time
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('GPTClock: Using local timezone:', timeZone);

      // Get local time zone abbreviation
      const localTimeStr = now.toLocaleString('en-US', {
        timeZoneName: 'short'
      });
      const match = localTimeStr.match(/\b([A-Z]{2,5})\b$/);
      tzAbbr = match ? match[1] : 'Local';
    } else {
      // Use specific timezone from settings
      timeZone = settings.timezoneValue;
      console.log('GPTClock: Using specific timezone:', timeZone);

      // Get timezone abbreviation
      const tzTimeStr = now.toLocaleString('en-US', {
        timeZone: timeZone,
        timeZoneName: 'short'
      });
      const match = tzTimeStr.match(/\b([A-Z]{2,5})\b$/);
      tzAbbr = match ? match[1] : timeZone.split('/')[1];
    }

    // Get time in selected timezone
    const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timeZone }));

    // Format as hh:mm AM/PM
    let hours = tzTime.getHours();
    const minutes = tzTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format

    const humanReadable = `${hours}:${minutes} ${ampm} ${tzAbbr}`;
    const timestamp = `[${now.toISOString()}] (${humanReadable})\n`;

    console.log('GPTClock: Generated timestamp:', timestamp.trim());

    return timestamp;
  }

  console.log('GPTClock v2.0.0: Injected script loaded');

  // Get settings from the script tag's data attribute
  const currentScript = document.querySelector('script[data-gptclock-settings]');
  let defaultSettings = { timezoneMode: 'local', timezoneValue: 'America/New_York' };

  if (currentScript) {
    try {
      const settingsJson = currentScript.getAttribute('data-gptclock-settings');
      defaultSettings = JSON.parse(settingsJson);
      console.log('GPTClock: Loaded settings from script attribute:', defaultSettings);
    } catch (e) {
      console.error('GPTClock: Failed to parse settings from script attribute:', e);
    }
  } else {
    console.warn('GPTClock: No settings found on script tag, using defaults');
  }

  // Set global settings for getTimestamp to use
  window.__GPTClockSettings = defaultSettings;
  console.log('GPTClock: Settings available:', window.__GPTClockSettings);

  // Intercept fetch API
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    let [url, options] = args;

    // Log all ChatGPT-related requests
    if (url && typeof url === 'string' && (url.includes('chatgpt.com') || url.includes('openai.com') || url.includes('/backend-api/'))) {
      console.log('GPTClock: Intercepted request to:', url);

      if (options && options.body) {
        console.log('GPTClock: Request has body, attempting to parse...');
        try {
          const body = JSON.parse(options.body);
          console.log('GPTClock: Parsed body:', body);

          // Prepend timestamp to user messages
          if (body.messages && Array.isArray(body.messages)) {
            console.log('GPTClock: Found messages array with', body.messages.length, 'messages');
            body.messages = body.messages.map(msg => {
              if (msg.author?.role === 'user' && msg.content) {
                // Handle the content.parts array structure
                if (msg.content.content_type === 'text' && msg.content.parts && Array.isArray(msg.content.parts)) {
                  console.log('GPTClock: Adding timestamp to content.parts');
                  return {
                    ...msg,
                    content: {
                      ...msg.content,
                      parts: msg.content.parts.map(part => {
                        if (typeof part === 'string' && !part.startsWith('[20')) {
                          return getTimestamp() + part;
                        }
                        return part;
                      })
                    }
                  };
                }
                // Fallback for old string-based format
                else if (typeof msg.content === 'string' && !msg.content.startsWith('[20')) {
                  console.log('GPTClock: Adding timestamp to string content');
                  return {
                    ...msg,
                    content: getTimestamp() + msg.content
                  };
                }
              }
              return msg;
            });
            options.body = JSON.stringify(body);
            console.log('GPTClock: Timestamp added to outgoing message');
            console.log('GPTClock: Modified body:', body);
          }
        } catch (e) {
          console.log('GPTClock: Could not parse request body', e);
        }
      }
    }

    // Get the response
    const response = await originalFetch.apply(this, args);

    // Intercept AI responses (streaming)
    if (url && typeof url === 'string' && url.includes('/backend-api/')) {
      console.log('GPTClock: Checking response from:', url);
      console.log('GPTClock: Content-Type:', response.headers.get('content-type'));

      // For streaming responses, we need to intercept the stream
      if (response.body && response.headers.get('content-type')?.includes('text/event-stream')) {
        console.log('GPTClock: Found streaming response, intercepting...');
        const originalBody = response.body;
        const reader = originalBody.getReader();
        const decoder = new TextDecoder();
        let firstChunk = true;

        const stream = new ReadableStream({
          async start(controller) {
            try {
              let chunkIndex = 0;
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                let chunk = decoder.decode(value, { stream: true });
                chunkIndex++;

                // Inject timestamp into first text delta
                if (firstChunk && chunk.includes('"v":')) {
                  // Check if this is a text delta (not empty)
                  const vMatch = chunk.match(/"v":\s*"([^"]*)"/);
                  if (vMatch && vMatch[1].length > 0) {
                    const timestamp = getTimestamp();
                    console.log('GPTClock: Found first text delta, injecting timestamp');

                    // Pattern: {"v": "text"} -> {"v": "timestamp\ntext"}
                    chunk = chunk.replace(/"v":\s*"/, `"v": "${timestamp.replace(/\n/g, '\\n')}`);
                    firstChunk = false;
                    console.log('GPTClock: Timestamp injected into AI response');
                  }
                }

                controller.enqueue(new TextEncoder().encode(chunk));
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          }
        });

        return new Response(stream, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    }

    return response;
  };

  console.log('GPTClock: Fetch interceptor installed in page context');
})();
