// ClaudeClock - Injected Script v2.1.0
// This script runs in the page context to intercept fetch
// Firefox-compatible version with enhanced stream handling

(function() {
  'use strict';

function getTimestamp() {
  const now = new Date();

  // Get PST time (America/Los_Angeles handles PST/PDT automatically)
   const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

  // Format as hh:mm AM/PM
  let hours = pstTime.getHours();
  const minutes = pstTime.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format

   const humanReadable = `${hours}:${minutes} ${ampm} PST`;

  return `[${now.toISOString()}] (${humanReadable})\n`;
}

  console.log('ClaudeClock v2.1.0: Injected script loaded');

  // Intercept fetch API
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    let [url, options] = args;

    // Log all Claude-related requests
    if (url && typeof url === 'string' && url.includes('/api/')) {
      console.log('ClaudeClock: Intercepted request to:', url);

      if (options && options.body) {
        console.log('ClaudeClock: Request has body, attempting to parse...');
        try {
          const body = JSON.parse(options.body);
          console.log('ClaudeClock: Parsed body:', body);

          // Prepend timestamp to user messages (Claude API format)
          // Handle "prompt" field format
          if (body.prompt && typeof body.prompt === 'string' && !body.prompt.startsWith('[20')) {
            console.log('ClaudeClock: Adding timestamp to prompt');
            body.prompt = getTimestamp() + body.prompt;
            options.body = JSON.stringify(body);
            console.log('ClaudeClock: Timestamp added to outgoing message');
            console.log('ClaudeClock: Modified body:', body);
          }
          // Handle "messages" array format
          else if (body.messages && Array.isArray(body.messages)) {
            console.log('ClaudeClock: Found messages array with', body.messages.length, 'messages');
            const lastMessage = body.messages[body.messages.length - 1];
            if (lastMessage && lastMessage.role === 'user' && lastMessage.content) {
              if (typeof lastMessage.content === 'string' && !lastMessage.content.startsWith('[20')) {
                console.log('ClaudeClock: Adding timestamp to last user message');
                lastMessage.content = getTimestamp() + lastMessage.content;
                options.body = JSON.stringify(body);
                console.log('ClaudeClock: Timestamp added to outgoing message');
                console.log('ClaudeClock: Modified body:', body);
              }
            }
          }
        } catch (e) {
          console.log('ClaudeClock: Could not parse request body', e);
        }
      }
    }

    // Get the response
    const response = await originalFetch.apply(this, args);

    // Intercept AI responses (streaming)
    if (url && typeof url === 'string' && url.includes('/api/')) {
      console.log('ClaudeClock: Checking response from:', url);
      
      const contentType = response.headers.get('content-type');
      console.log('ClaudeClock: Content-Type:', contentType);

      // For streaming responses, we need to intercept the stream
      if (response.body && contentType && contentType.includes('text/event-stream')) {
        console.log('ClaudeClock: Found streaming response, intercepting...');
        
        // Firefox-compatible stream handling
        // Clone the response to avoid "body already read" errors
        const clonedResponse = response.clone();
        const originalBody = clonedResponse.body;
        
        // Check if getReader is available (should be, but defensive)
        if (!originalBody.getReader) {
          console.warn('ClaudeClock: ReadableStream.getReader not available, skipping interception');
          return response;
        }

        const reader = originalBody.getReader();
        const decoder = new TextDecoder();
        let firstTextFound = false;
        let chunkCount = 0;

        const stream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  controller.close();
                  break;
                }

                let chunk = decoder.decode(value, { stream: true });
                chunkCount++;

                // Log first 10 chunks to debug
                if (chunkCount <= 10) {
                  console.log(`ClaudeClock: Chunk ${chunkCount}:`, chunk);
                }

                // Inject timestamp into first text delta
                // Claude SSE format: data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}
                if (!firstTextFound) {
                  // Try multiple patterns to find the first text content
                  const patterns = [
                    // Standard text_delta pattern
                    { regex: /"delta":\s*\{\s*"type"\s*:\s*"text_delta"\s*,\s*"text"\s*:\s*"([^"]*)"/, name: 'text_delta' },
                    // Alternative ordering
                    { regex: /"text"\s*:\s*"([^"]*)"\s*,\s*"type"\s*:\s*"text_delta"/, name: 'text_delta_alt' },
                    // Direct text field
                    { regex: /"text"\s*:\s*"([^"]+)"/, name: 'direct_text' },
                    // Completion field
                    { regex: /"completion"\s*:\s*"([^"]+)"/, name: 'completion' }
                  ];

                  for (let pattern of patterns) {
                    const match = chunk.match(pattern.regex);
                    if (match && match[1] && match[1].length > 0) {
                      const timestamp = getTimestamp();
                      console.log(`ClaudeClock: Found first text using pattern '${pattern.name}', injecting timestamp`);
                      console.log('ClaudeClock: Matched text:', match[1]);

                      // Inject timestamp at the beginning of the text
                      // Escape newline for JSON
                      const escapedTimestamp = timestamp.replace(/\n/g, '\\n');
                      chunk = chunk.replace(pattern.regex, (fullMatch, capturedText) => {
                        return fullMatch.replace(`"${capturedText}"`, `"${escapedTimestamp}${capturedText}"`);
                      });
                      firstTextFound = true;
                      console.log('ClaudeClock: Timestamp injected into AI response');
                      console.log('ClaudeClock: Modified chunk:', chunk);
                      break;
                    }
                  }
                }

                // Enqueue the (possibly modified) chunk
                controller.enqueue(new TextEncoder().encode(chunk));
              }
            } catch (e) {
              console.error('ClaudeClock: Stream error:', e);
              controller.error(e);
            }
          },
          
          // Firefox sometimes needs explicit cancel handler
          cancel(reason) {
            console.log('ClaudeClock: Stream cancelled:', reason);
            reader.cancel(reason);
          }
        });

        // Return new response with intercepted stream
        return new Response(stream, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    }

    return response;
  };

  console.log('ClaudeClock: Fetch interceptor installed in page context');
})();