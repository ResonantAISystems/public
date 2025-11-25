// AIParley - Claude.ai Content Script
// Handles DOM interaction for Claude platform

const PLATFORM = 'claude';

// Selectors for Claude interface
const SELECTORS = {
  inputField: '[data-testid="chat-input"]',
  sendButton: 'button[aria-label*="Send"]',
  responseContainer: '[data-is-streaming]',
  completedResponse: '[data-is-streaming="false"]',
  messageText: '.font-claude-response'
};

// State
let observerActive = false;
let lastProcessedMessage = null;
let sessionActive = false;
let debounceTimer = null;

// Initialize
console.log('AIParley: Claude handler initialized');

// Notify background that platform is detected
chrome.runtime.sendMessage({
  type: 'PLATFORM_DETECTED',
  platform: PLATFORM
});

// Run health check on load
setTimeout(() => runHealthCheck(), 2000);

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Claude handler received:', message.type);

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
  console.log('[Claude] 🚀 Session started - beginning monitoring');
  console.log('[Claude] Session state:', state);
  sessionActive = true;
  lastProcessedMessage = null; // Reset for new session
  startMonitoring();
}

// Handle session stop
function handleSessionStop() {
  console.log('[Claude] 🛑 Session stopped - stopping monitoring');
  sessionActive = false;
  lastProcessedMessage = null; // Reset for next session
  stopMonitoring();
}

// Start monitoring for AI responses
function startMonitoring() {
  if (observerActive) {
    console.log('[Claude] ⚠️ Monitoring already active');
    return;
  }

  console.log('[Claude] 👀 Starting response monitoring');
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
      // Check for completed responses
      const completedResponses = document.querySelectorAll(SELECTORS.completedResponse);
      if (completedResponses.length > 0) {
        console.log(`[Claude] 📝 Found ${completedResponses.length} completed response(s)`);
        const latestResponse = completedResponses[completedResponses.length - 1];
        checkAndExtractMessage(latestResponse);
      }
    }, 500);
  });

  // Observe the main chat container
  const chatContainer = document.querySelector('main') || document.body;
  console.log('[Claude] 🎯 Observing container:', chatContainer ? 'main' : 'body');

  observer.observe(chatContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-is-streaming']
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
  console.log('[Claude] Monitoring stopped, timers cleared');
}

// Check and extract message from completed response
function checkAndExtractMessage(responseElement) {
  console.log('[Claude] 🔍 Checking response element for message');

  // Get message text
  const messageContainer = responseElement.querySelector(SELECTORS.messageText);
  if (!messageContainer) {
    console.log('[Claude] ⚠️ Message container not found in response');
    return;
  }

  const messageText = messageContainer.innerText || messageContainer.textContent;
  console.log('[Claude] 📄 Message text extracted:', {
    length: messageText?.length,
    preview: messageText?.substring(0, 100)
  });

  if (!messageText) {
    console.log('[Claude] ⚠️ Message text is empty');
    return;
  }

  if (messageText === lastProcessedMessage) {
    console.log('[Claude] ⏭️ Message already processed, skipping');
    return;
  }

  // Load config to check trigger phrases
  chrome.storage.local.get('config', (result) => {
    const config = result.config;
    if (!config) {
      console.log('[Claude] ⚠️ Config not found');
      return;
    }

    console.log('[Claude] 🔍 Checking for trigger phrases:', config.triggerPhrases);

    // Check if message contains trigger phrase
    const hasTrigger = config.triggerPhrases.some(phrase =>
      messageText.includes(phrase)
    );

    if (hasTrigger) {
      console.log('[Claude] ✅ TRIGGER PHRASE DETECTED! Sending to background');
      lastProcessedMessage = messageText;

      // Send to background for processing
      chrome.runtime.sendMessage({
        type: 'MESSAGE_EXTRACTED',
        platform: PLATFORM,
        content: messageText,
        timestamp: Date.now()
      });
    } else {
      console.log('[Claude] ❌ No trigger phrase found in message');
    }
  });
}

// Inject message into input field and send
async function handleInjectMessage(message) {
  console.log('Injecting message into Claude input');

  const inputField = document.querySelector(SELECTORS.inputField);
  if (!inputField) {
    console.error('Input field not found');
    return;
  }

  // Clear existing content
  inputField.innerHTML = '';

  // Simulate typing for natural behavior
  await simulateTyping(inputField, message.content);

  // Wait a moment before clicking send
  await new Promise(resolve => setTimeout(resolve, 500));

  // Click send button
  const sendButton = document.querySelector(SELECTORS.sendButton);
  if (sendButton && !sendButton.disabled) {
    sendButton.click();
    console.log('Message sent on Claude');
  } else {
    console.error('Send button not found or disabled');
  }
}

// Simulate natural typing behavior
async function simulateTyping(element, text) {
  // For contenteditable div, we need to handle it differently
  element.focus();

  console.log('[Claude] 💉 Starting typing simulation, text length:', text.length);

  // Get typing speed from config
  const config = await chrome.storage.local.get('config');
  const typingSpeed = config.config?.timing?.typingSpeed || 50;

  // For Claude's contenteditable div, we need to build the text as a single text node
  // Create a paragraph element to hold the text
  const p = document.createElement('p');
  let currentText = '';

  const words = text.split(' ');

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Type each character
    for (const char of word) {
      currentText += char;
      p.textContent = currentText;
      element.innerHTML = '';
      element.appendChild(p);

      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // Random delay for natural typing
      const delay = typingSpeed + Math.random() * 30 - 15;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Add space between words (except last word)
    if (i < words.length - 1) {
      currentText += ' ';
      p.textContent = currentText;
      element.innerHTML = '';
      element.appendChild(p);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
  }

  console.log('[Claude] ✅ Text inserted into input field');
}

// Run health check on selectors
function runHealthCheck() {
  console.log('Running health check on Claude');

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
