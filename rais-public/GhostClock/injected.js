// GhostClock - Injected Script v2.0.0
// This script runs in the page context to intercept fetch

(function() {
  'use strict';

  // Function to get current timestamp
  function getTimestamp() {
    const now = new Date();

    // Get EST time (UTC-5, or UTC-4 during DST)
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    // Format as hh:mm AM/PM
    let hours = estTime.getHours();
    const minutes = estTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format

    const humanReadable = `${hours}:${minutes} ${ampm} EST`;

    return `[${now.toISOString()}] (${humanReadable})\n`;
  }

  console.log('GhostClock v2.0.0: Injected script loaded');

  // Intercept fetch API
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    let [url, options] = args;

    // Log all ChatGPT-related requests
    if (url && typeof url === 'string' && (url.includes('chatgpt.com') || url.includes('openai.com') || url.includes('/backend-api/'))) {
      console.log('GhostClock: Intercepted request to:', url);

      if (options && options.body) {
        console.log('GhostClock: Request has body, attempting to parse...');
        try {
          const body = JSON.parse(options.body);
          console.log('GhostClock: Parsed body:', body);

          // Prepend timestamp to user messages
          if (body.messages && Array.isArray(body.messages)) {
            console.log('GhostClock: Found messages array with', body.messages.length, 'messages');
            body.messages = body.messages.map(msg => {
              if (msg.author?.role === 'user' && msg.content) {
                // Handle the content.parts array structure
                if (msg.content.content_type === 'text' && msg.content.parts && Array.isArray(msg.content.parts)) {
                  console.log('GhostClock: Adding timestamp to content.parts');
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
                  console.log('GhostClock: Adding timestamp to string content');
                  return {
                    ...msg,
                    content: getTimestamp() + msg.content
                  };
                }
              }
              return msg;
            });
            options.body = JSON.stringify(body);
            console.log('GhostClock: Timestamp added to outgoing message');
            console.log('GhostClock: Modified body:', body);
          }
        } catch (e) {
          console.log('GhostClock: Could not parse request body', e);
        }
      }
    }

    // Get the response
    const response = await originalFetch.apply(this, args);

    // Intercept AI responses (streaming)
    if (url && typeof url === 'string' && url.includes('/backend-api/')) {
      console.log('GhostClock: Checking response from:', url);
      console.log('GhostClock: Content-Type:', response.headers.get('content-type'));

      // For streaming responses, we need to intercept the stream
      if (response.body && response.headers.get('content-type')?.includes('text/event-stream')) {
        console.log('GhostClock: Found streaming response, intercepting...');
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
                    console.log('GhostClock: Found first text delta, injecting timestamp');

                    // Pattern: {"v": "text"} -> {"v": "timestamp\ntext"}
                    chunk = chunk.replace(/"v":\s*"/, `"v": "${timestamp.replace(/\n/g, '\\n')}`);
                    firstChunk = false;
                    console.log('GhostClock: Timestamp injected into AI response');
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

  console.log('GhostClock: Fetch interceptor installed in page context');
})();
