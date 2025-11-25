// AIParley - Background Service Worker
// Coordinates message relay between AI platforms

// ============================================================================
// DEBUG LOGGING
// ============================================================================
function debugLog(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage, data || '');

  // Also send to popup if it's open
  try {
    chrome.runtime.sendMessage({
      type: 'DEBUG_LOG',
      message: message,
      data: data,
      timestamp: timestamp
    }).catch(() => {
      // Popup not open, ignore
    });
  } catch (e) {
    // Ignore
  }
}

// Session state
let sessionState = {
  active: false,
  paused: false,
  currentExchange: 0,
  totalExchanges: 0,
  sessionId: null,
  conversationLog: [],
  lastMessageTime: null,
  pendingMessage: null,
  sourcePlatform: null,
  targetPlatform: null,
  manualApprovalRequired: true
};

// WebSocket connection for multi-browser support
let wsConnection = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AIParley Research Extension installed');

  // Load default configuration
  const config = await loadConfig();
  if (!config) {
    await initializeDefaultConfig();
  }

  // Set up alarm for periodic cleanup
  chrome.alarms.create('cleanup', { periodInMinutes: 60 });
});

// Message handler from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog(`📨 Received message: ${message.type}`, { from: sender.tab?.id, message });

  switch (message.type) {
    case 'PLATFORM_DETECTED':
      handlePlatformDetection(message, sender);
      sendResponse({ success: true });
      break;

    case 'MESSAGE_EXTRACTED':
      debugLog('🎯 MESSAGE_EXTRACTED received', { platform: message.platform, contentLength: message.content?.length });
      handleMessageExtraction(message, sender);
      sendResponse({ success: true });
      break;

    case 'START_SESSION':
      handleStartSession(message);
      sendResponse({ success: true });
      break;

    case 'STOP_SESSION':
      handleStopSession();
      sendResponse({ success: true });
      break;

    case 'PAUSE_SESSION':
      handlePauseSession();
      sendResponse({ success: true });
      break;

    case 'APPROVE_MESSAGE':
      handleApproveMessage();
      sendResponse({ success: true });
      break;

    case 'GET_SESSION_STATE':
      sendResponse({ state: sessionState });
      break;

    case 'HEALTH_CHECK':
      handleHealthCheck(message, sender);
      sendResponse({ success: true });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep channel open for async response
});

// Handle platform detection from content scripts
async function handlePlatformDetection(message, sender) {
  console.log(`Platform detected: ${message.platform} on tab ${sender.tab.id}`);

  // Store tab information
  const tabs = await chrome.storage.local.get('platformTabs') || {};
  tabs.platformTabs = tabs.platformTabs || {};
  tabs.platformTabs[message.platform] = sender.tab.id;
  await chrome.storage.local.set(tabs);
}

// Handle message extraction from AI response
async function handleMessageExtraction(message, sender) {
  debugLog('💬 Message extracted from ' + message.platform, {
    preview: message.content.substring(0, 100) + '...',
    length: message.content.length
  });

  if (!sessionState.active) {
    debugLog('⚠️ Session not active - ignoring message', { sessionState });
    return;
  }

  // Check if message contains trigger phrase
  const config = await loadConfig();
  debugLog('🔍 Checking for trigger phrases', { phrases: config.triggerPhrases });

  const hasTrigger = config.triggerPhrases.some(phrase =>
    message.content.includes(phrase)
  );

  if (!hasTrigger) {
    debugLog('❌ No trigger phrase found - ignoring message', {
      searchedFor: config.triggerPhrases,
      messagePreview: message.content.substring(0, 200)
    });
    return;
  }

  debugLog('✅ Trigger phrase FOUND!', { platform: message.platform });

  // Log the message
  sessionState.conversationLog.push({
    timestamp: Date.now(),
    platform: message.platform,
    content: message.content,
    exchange: sessionState.currentExchange
  });

  // Prepare message for relay
  sessionState.pendingMessage = {
    content: message.content,
    sourcePlatform: message.platform,
    targetPlatform: message.platform === 'claude' ? 'chatgpt' : 'claude',
    timestamp: Date.now()
  };

  debugLog('📦 Message prepared for relay', {
    from: sessionState.pendingMessage.sourcePlatform,
    to: sessionState.pendingMessage.targetPlatform,
    manualApproval: sessionState.manualApprovalRequired
  });

  // Save conversation log
  await saveConversationLog();

  // Check if manual approval is required
  if (sessionState.manualApprovalRequired) {
    debugLog('⏸️ Manual approval required - sending to popup');
    // Notify popup for approval (with error handling for when popup isn't open)
    chrome.runtime.sendMessage({
      type: 'APPROVAL_REQUIRED',
      message: sessionState.pendingMessage
    }, (response) => {
      // Handle response or error
      if (chrome.runtime.lastError) {
        debugLog('⚠️ Could not send to popup (popup may be closed)', { error: chrome.runtime.lastError.message });
        // Popup will get state via GET_SESSION_STATE when it opens
      } else {
        debugLog('✅ Approval request sent to popup');
      }
    });
  } else {
    debugLog('⏱️ Auto-relay enabled - scheduling relay');
    // Auto-relay after delay
    await scheduleMessageRelay();
  }
}

// Schedule message relay with realistic timing
async function scheduleMessageRelay() {
  const config = await loadConfig();

  // Calculate random delay
  const delay = Math.floor(
    Math.random() * (config.timing.maxDelay - config.timing.minDelay) + config.timing.minDelay
  );

  console.log(`Scheduling message relay in ${delay}ms`);

  setTimeout(async () => {
    await relayMessage();
  }, delay);
}

// Relay message to target platform
async function relayMessage() {
  if (!sessionState.pendingMessage) {
    debugLog('⚠️ No pending message to relay');
    return;
  }

  const message = sessionState.pendingMessage;
  sessionState.pendingMessage = null;

  // Increment exchange counter
  sessionState.currentExchange++;

  debugLog(`📤 Relaying message (Exchange ${sessionState.currentExchange}/${sessionState.totalExchanges})`, {
    from: message.sourcePlatform,
    to: message.targetPlatform
  });

  // Get target tab
  const tabs = await chrome.storage.local.get('platformTabs');
  const targetTabId = tabs.platformTabs?.[message.targetPlatform];

  debugLog('🔍 Target tab lookup', {
    targetPlatform: message.targetPlatform,
    targetTabId: targetTabId,
    allTabs: tabs.platformTabs
  });

  if (!targetTabId) {
    debugLog('❌ Target platform tab not found!', {
      lookingFor: message.targetPlatform,
      available: tabs.platformTabs
    });
    return;
  }

  // Add turn counter to message
  const messageWithCounter = `[Turn ${sessionState.currentExchange}/${sessionState.totalExchanges}]\n\n${message.content}`;

  debugLog('🔄 Switching to target tab', { tabId: targetTabId });

  // Switch to target tab
  await chrome.tabs.update(targetTabId, { active: true });

  // Wait a moment for tab to activate
  await new Promise(resolve => setTimeout(resolve, 500));

  debugLog('💉 Sending INJECT_MESSAGE to content script', {
    tabId: targetTabId,
    platform: message.targetPlatform,
    messageLength: messageWithCounter.length
  });

  // Send message to target tab
  try {
    await chrome.tabs.sendMessage(targetTabId, {
      type: 'INJECT_MESSAGE',
      content: messageWithCounter,
      exchange: sessionState.currentExchange,
      total: sessionState.totalExchanges
    });
    debugLog('✅ Message sent to content script successfully');
  } catch (error) {
    debugLog('❌ Error sending message to content script', { error: error.message });
  }

  // Update last message time
  sessionState.lastMessageTime = Date.now();

  // Check if session is complete
  if (sessionState.currentExchange >= sessionState.totalExchanges) {
    debugLog('🏁 Session complete!');
    await completeSession();
  }
}

// Start research session
async function handleStartSession(message) {
  debugLog('🚀 START_SESSION called');

  const config = await loadConfig();

  // Generate session ID
  sessionState.sessionId = `session_${Date.now()}`;

  // Set total exchanges (randomized within range)
  sessionState.totalExchanges = Math.floor(
    Math.random() * (config.session.maxExchanges - config.session.minExchanges) + config.session.minExchanges
  );

  sessionState.currentExchange = 0;
  sessionState.active = true;
  sessionState.paused = false;
  sessionState.conversationLog = [];
  sessionState.manualApprovalRequired = config.safety.requireManualApproval;

  debugLog(`✅ Session started: ${sessionState.sessionId}`, {
    totalExchanges: sessionState.totalExchanges,
    manualApproval: sessionState.manualApprovalRequired
  });

  // Notify all tabs
  broadcastToTabs({ type: 'SESSION_STARTED', state: sessionState });
}

// Stop research session
async function handleStopSession() {
  console.log('Session stopped');
  sessionState.active = false;

  // Save final log
  await saveConversationLog();

  // Notify all tabs
  broadcastToTabs({ type: 'SESSION_STOPPED' });
}

// Pause research session
async function handlePauseSession() {
  sessionState.paused = !sessionState.paused;
  console.log(`Session ${sessionState.paused ? 'paused' : 'resumed'}`);

  broadcastToTabs({
    type: sessionState.paused ? 'SESSION_PAUSED' : 'SESSION_RESUMED',
    state: sessionState
  });
}

// Approve pending message for relay
async function handleApproveMessage() {
  if (sessionState.pendingMessage) {
    await scheduleMessageRelay();
  }
}

// Complete session and prompt for continuation
async function completeSession() {
  console.log('Session completed');
  sessionState.active = false;

  // Save final conversation log
  await saveConversationLog();

  // Notify popup for continuation prompt
  chrome.runtime.sendMessage({
    type: 'SESSION_COMPLETE',
    sessionId: sessionState.sessionId,
    exchanges: sessionState.currentExchange
  });
}

// Health check for selectors
async function handleHealthCheck(message, sender) {
  console.log(`Health check from ${message.platform}:`, message.results);

  // Store health check results
  const health = await chrome.storage.local.get('healthChecks') || {};
  health.healthChecks = health.healthChecks || {};
  health.healthChecks[message.platform] = {
    timestamp: Date.now(),
    results: message.results,
    tabId: sender.tab.id
  };
  await chrome.storage.local.set(health);

  // Notify popup if there are issues
  const hasIssues = Object.values(message.results).some(result => !result);
  if (hasIssues) {
    chrome.runtime.sendMessage({
      type: 'HEALTH_CHECK_WARNING',
      platform: message.platform,
      results: message.results
    });
  }
}

// Save conversation log
async function saveConversationLog() {
  const logs = await chrome.storage.local.get('conversationLogs') || {};
  logs.conversationLogs = logs.conversationLogs || {};
  logs.conversationLogs[sessionState.sessionId] = {
    sessionId: sessionState.sessionId,
    startTime: sessionState.conversationLog[0]?.timestamp,
    endTime: Date.now(),
    exchanges: sessionState.currentExchange,
    totalExchanges: sessionState.totalExchanges,
    messages: sessionState.conversationLog
  };
  await chrome.storage.local.set(logs);
}

// Load configuration
async function loadConfig() {
  const result = await chrome.storage.local.get('config');

  // If no config exists, initialize defaults
  if (!result.config) {
    await initializeDefaultConfig();
    return (await chrome.storage.local.get('config')).config;
  }

  return result.config;
}

// Initialize default configuration
async function initializeDefaultConfig() {
  // Load default config from shared/config.js
  const defaultConfig = {
    triggerPhrases: ['Hey Claude', 'Hey Nyx', 'Hey Assistant'],
    timing: {
      minDelay: 15000,
      maxDelay: 30000,
      typingSpeed: 50
    },
    session: {
      minExchanges: 10,
      maxExchanges: 20
    },
    safety: {
      minDelayLimit: 10000,
      maxExchangesPerSession: 50,
      requireManualApproval: true
    },
    selectors: {
      claude: {
        inputField: '[data-testid="chat-input"]',
        sendButton: 'button[aria-label*="Send"]',
        responseContainer: '[data-is-streaming]',
        completedResponse: '[data-is-streaming="false"]',
        messageText: '.font-claude-response'
      },
      chatgpt: {
        inputField: '#prompt-textarea',
        sendButton: 'button[data-testid="send-button"]',
        responseContainer: '[data-message-author-role="assistant"]',
        messageText: '.markdown'
      }
    },
    research: {
      conversationTopic: '',
      sessionName: '',
      logData: true,
      exportFormat: 'json'
    },
    multiBrowser: {
      enabled: false,
      websocketUrl: 'ws://localhost:8080',
      connectionTimeout: 5000
    }
  };

  await chrome.storage.local.set({ config: defaultConfig });
  console.log('Default configuration initialized');
}

// Broadcast message to all tabs
function broadcastToTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Ignore errors for tabs without content script
      });
    });
  });
}

// Cleanup old logs periodically
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldLogs();
  }
});

async function cleanupOldLogs() {
  const logs = await chrome.storage.local.get('conversationLogs') || {};
  if (!logs.conversationLogs) return;

  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  // Remove logs older than one week
  Object.keys(logs.conversationLogs).forEach(sessionId => {
    const log = logs.conversationLogs[sessionId];
    if (log.startTime < oneWeekAgo) {
      delete logs.conversationLogs[sessionId];
    }
  });

  await chrome.storage.local.set(logs);
  console.log('Old logs cleaned up');
}
