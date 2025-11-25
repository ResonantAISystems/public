// AIParley - ChatGPT Content Script
// Handles DOM interaction for ChatGPT platform

const PLATFORM = 'chatgpt';

// Selectors for ChatGPT interface
const SELECTORS = {
  inputField: '#prompt-textarea',
  sendButton: 'button[data-testid="send-button"]',
  responseContainer: '[data-message-author-role="assistant"]',
  messageText: '.markdown'
};

// State
let observerActive = false;
let lastProcessedMessage = null;
let sessionActive = false;
let debounceTimer = null;

// Initialize
console.log('AIParley: ChatGPT handler initialized');

// Notify background that platform is detected
chrome.runtime.sendMessage({
  type: 'PLATFORM_DETECTED',
  platform: PLATFORM
});

// Run health check on load
setTimeout(() => runHealthCheck(), 2000);

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('ChatGPT handler received:', message.type);

  switch (message.type) {
    case 'SESSION_STARTED':
      handleSessionStart(message.state);
      sendResponse({ success: true });
      break;

    case 'SESSION_STOPPED':
      handleSessionStop();
      sendResponse({ success: true });
      break;

    case 'INJECT_MESSAGE':
      handleInjectMessage(message);
      sendResponse({ success: true });
      break;

    case 'RUN_HEALTH_CHECK':
      runHealthCheck();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false });
  }

  return true;
});

// Handle session start
function handleSessionStart(state) {
  console.log('[ChatGPT] 🚀 Session started - beginning monitoring');
  console.log('[ChatGPT] Session state:', state);
  sessionActive = true;
  lastProcessedMessage = null; // Reset for new session
  startMonitoring();
}

// Handle session stop
function handleSessionStop() {
  console.log('[ChatGPT] 🛑 Session stopped - stopping monitoring');
  sessionActive = false;
  lastProcessedMessage = null; // Reset for next session
  stopMonitoring();
}

// Start monitoring for AI responses
function startMonitoring() {
  if (observerActive) {
    console.log('[ChatGPT] ⚠️ Monitoring already active');
    return;
  }

  console.log('[ChatGPT] 👀 Starting response monitoring');
  observerActive = true;

  // Use MutationObserver to watch for new messages
  const observer = new MutationObserver((mutations) => {
    if (!sessionActive) return;

    // Debounce: Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Wait 500ms after last mutation before checking
    debounceTimer = setTimeout(() => {
      // Check for completed assistant responses
      const assistantMessages = document.querySelectorAll(SELECTORS.responseContainer);
      if (assistantMessages.length > 0) {
        const latestMessage = assistantMessages[assistantMessages.length - 1];

        // Check if response is complete (not streaming)
        // ChatGPT shows a regenerate button when complete
        const isComplete = checkIfResponseComplete(latestMessage);

        if (isComplete) {
          checkAndExtractMessage(latestMessage);
        }
      }
    }, 500);
  });

  // Observe the main chat container
  const chatContainer = document.querySelector('main') || document.body;
  observer.observe(chatContainer, {
    childList: true,
    subtree: true
    // Removed attributes: true to reduce sensitivity during streaming
  });

  // Store observer for cleanup
  window.aiParleyObserver = observer;
}

// Stop monitoring
function stopMonitoring() {
  if (window.aiParleyObserver) {
    window.aiParleyObserver.disconnect();
    window.aiParleyObserver = null;
  }
  // Clear any pending debounce timers
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  observerActive = false;
  console.log('[ChatGPT] Monitoring stopped, timers cleared');
}

// Check if ChatGPT response is complete
function checkIfResponseComplete(messageElement) {
  // Look for indicators that response is complete
  // ChatGPT typically shows action buttons when done
  const parentContainer = messageElement.closest('.group\\/turn-messages') || messageElement.parentElement;

  if (!parentContainer) return false;

  // Check for stop button - if present, still streaming
  const stopButton = document.querySelector('[data-testid="stop-button"]');
  if (stopButton) {
    console.log('[ChatGPT] Still streaming (stop button present)');
    return false;
  }

  // Check for copy button (appears when complete)
  const hasCopyButton = parentContainer.querySelector('button[aria-label*="Copy"]');

  // Check for regenerate button (appears when complete)
  const hasRegenerateButton = parentContainer.querySelector('button[aria-label*="Regenerate"]');

  const isComplete = hasCopyButton || hasRegenerateButton;

  if (isComplete) {
    console.log('[ChatGPT] Response complete (action buttons present)');
  }

  return isComplete;
}

// Check and extract message from completed response
function checkAndExtractMessage(messageElement) {
  // Get message text from markdown container
  const messageContainer = messageElement.querySelector(SELECTORS.messageText);
  if (!messageContainer) return;

  const messageText = messageContainer.innerText || messageContainer.textContent;
  if (!messageText || messageText === lastProcessedMessage) return;

  console.log('[ChatGPT] 📝 Message extracted, checking for trigger phrases');
  console.log('[ChatGPT] Message length:', messageText.length);
  console.log('[ChatGPT] Message preview:', messageText.substring(0, 100) + '...');

  // IMMEDIATE debounce: Set BEFORE async operation
  lastProcessedMessage = messageText;

  // Load config to check trigger phrases
  chrome.storage.local.get('config', (result) => {
    const config = result.config;
    if (!config) return;

    console.log('[ChatGPT] 🔍 Checking for trigger phrases:', config.triggerPhrases);

    // Check if message contains trigger phrase
    const hasTrigger = config.triggerPhrases.some(phrase =>
      messageText.includes(phrase)
    );

    if (hasTrigger) {
      console.log('[ChatGPT] ✅ TRIGGER PHRASE DETECTED! Sending to background');

      // Send to background for processing
      chrome.runtime.sendMessage({
        type: 'MESSAGE_EXTRACTED',
        platform: PLATFORM,
        content: messageText,
        timestamp: Date.now()
      });
    } else {
      console.log('[ChatGPT] No trigger phrase found in message');
    }
  });
}

// Inject message into input field and send
async function handleInjectMessage(message) {
  console.log('Injecting message into ChatGPT input');

  const inputField = document.querySelector(SELECTORS.inputField);
  if (!inputField) {
    console.error('Input field not found');
    return;
  }

  // Clear existing content
  inputField.innerHTML = '';
  inputField.value = '';

  // Focus the input
  inputField.focus();

  // Simulate typing for natural behavior
  await simulateTyping(inputField, message.content);

  // Wait a moment before clicking send
  await new Promise(resolve => setTimeout(resolve, 500));

  // Click send button
  const sendButton = document.querySelector(SELECTORS.sendButton);
  if (sendButton && !sendButton.disabled) {
    sendButton.click();
    console.log('Message sent on ChatGPT');
  } else {
    console.error('Send button not found or disabled');

    // Alternative: trigger Enter key
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true
    });
    inputField.dispatchEvent(enterEvent);
  }
}

// Simulate natural typing behavior
async function simulateTyping(element, text) {
  element.focus();

  // Get typing speed from config
  const config = await chrome.storage.local.get('config');
  const typingSpeed = config.config?.timing?.typingSpeed || 50;

  // For ChatGPT's textarea/contenteditable
  const words = text.split(' ');

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Type each character
    for (const char of word) {
      // Add character to element
      if (element.tagName === 'TEXTAREA') {
        element.value += char;
      } else {
        element.textContent += char;
      }

      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // Random delay for natural typing
      const delay = typingSpeed + Math.random() * 30 - 15;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Add space between words (except last word)
    if (i < words.length - 1) {
      if (element.tagName === 'TEXTAREA') {
        element.value += ' ';
      } else {
        element.textContent += ' ';
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
  }

  // Final input event
  element.dispatchEvent(new Event('input', { bubbles: true }));

  // Also trigger change event
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

// Run health check on selectors
function runHealthCheck() {
  console.log('Running health check on ChatGPT');

  // Check main chat container (always present)
  const mainContainer = document.querySelector('main');

  // Check for existing response messages
  const existingResponses = document.querySelectorAll(SELECTORS.responseContainer);
  const hasExistingMessages = existingResponses.length > 0;

  const results = {
    inputField: !!document.querySelector(SELECTORS.inputField),
    sendButton: !!document.querySelector(SELECTORS.sendButton),
    // Response container: true if main exists (even without messages)
    // OR if messages already exist
    responseContainer: !!mainContainer || hasExistingMessages
  };

  console.log('Health check results:', results);
  console.log(`Main container: ${!!mainContainer}, Existing messages: ${existingResponses.length}`);

  // Send results to background
  chrome.runtime.sendMessage({
    type: 'HEALTH_CHECK',
    platform: PLATFORM,
    results: results,
    details: {
      mainContainerFound: !!mainContainer,
      existingMessages: existingResponses.length,
      note: hasExistingMessages ? 'Messages detected' : 'No messages yet (send one to test response detection)'
    }
  });

  return results;
}

// Export for testing
if (typeof window !== 'undefined') {
  window.aiParley = {
    runHealthCheck,
    SELECTORS,
    PLATFORM
  };
}
