// AIParley Popup Controller

// DOM elements
const elements = {
  sessionStatus: document.getElementById('session-status'),
  sessionProgress: document.getElementById('session-progress'),
  sessionId: document.getElementById('session-id'),
  claudeStatus: document.getElementById('claude-status'),
  chatgptStatus: document.getElementById('chatgpt-status'),
  conversationTopic: document.getElementById('conversation-topic'),
  startButton: document.getElementById('start-session'),
  pauseButton: document.getElementById('pause-session'),
  stopButton: document.getElementById('stop-session'),
  approvalSection: document.getElementById('approval-section'),
  approvalMessage: document.getElementById('approval-message'),
  approveButton: document.getElementById('approve-message'),
  rejectButton: document.getElementById('reject-message'),
  healthCheckButton: document.getElementById('run-health-check'),
  healthResults: document.getElementById('health-results'),
  optionsButton: document.getElementById('open-options'),
  logsButton: document.getElementById('view-logs'),
  exportButton: document.getElementById('export-data'),
  emergencyButton: document.getElementById('emergency-stop'),
  // Debug console
  toggleDebugButton: document.getElementById('toggle-debug'),
  debugConsole: document.getElementById('debug-console'),
  debugSessionState: document.getElementById('debug-session-state'),
  debugLastEvent: document.getElementById('debug-last-event'),
  debugPendingMessage: document.getElementById('debug-pending-message'),
  debugTabInfo: document.getElementById('debug-tab-info'),
  debugLog: document.getElementById('debug-log'),
  clearDebugButton: document.getElementById('clear-debug')
};

// Debug log storage
let debugLogEntries = [];

// Initialize popup
async function initialize() {
  console.log('AIParley popup initializing...');

  // Load current session state
  await updateSessionState();

  // Check platform status
  await checkPlatformStatus();

  // Load saved topic
  await loadConversationTopic();

  // Set up event listeners
  setupEventListeners();

  // Listen for background messages
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

// Update session state from background
async function updateSessionState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' });
    if (response && response.state) {
      updateUI(response.state);
    }
  } catch (error) {
    console.error('Error getting session state:', error);
  }
}

// Update UI based on session state
function updateUI(state) {
  // Update status badge
  if (state.active) {
    elements.sessionStatus.textContent = state.paused ? 'Paused' : 'Active';
    elements.sessionStatus.className = state.paused ? 'status-badge paused' : 'status-badge active';
  } else {
    elements.sessionStatus.textContent = 'Inactive';
    elements.sessionStatus.className = 'status-badge inactive';
  }

  // Update progress
  elements.sessionProgress.textContent = `${state.currentExchange} / ${state.totalExchanges}`;

  // Update session ID
  elements.sessionId.textContent = state.sessionId || 'None';

  // Update button states
  elements.startButton.disabled = state.active;
  elements.pauseButton.disabled = !state.active;
  elements.stopButton.disabled = !state.active;

  // Check for pending approval (in case popup was closed when approval was requested)
  if (state.pendingMessage && state.manualApprovalRequired) {
    showApprovalPrompt(state.pendingMessage);
  }
}

// Check platform status
async function checkPlatformStatus() {
  try {
    const health = await chrome.storage.local.get('healthChecks');
    const platformTabs = await chrome.storage.local.get('platformTabs');

    // Check Claude
    if (platformTabs.platformTabs?.claude) {
      const claudeHealth = health.healthChecks?.claude;
      updatePlatformStatus('claude', claudeHealth);
    }

    // Check ChatGPT
    if (platformTabs.platformTabs?.chatgpt) {
      const chatgptHealth = health.healthChecks?.chatgpt;
      updatePlatformStatus('chatgpt', chatgptHealth);
    }
  } catch (error) {
    console.error('Error checking platform status:', error);
  }
}

// Update platform status indicator
function updatePlatformStatus(platform, health) {
  const statusElement = platform === 'claude' ? elements.claudeStatus : elements.chatgptStatus;

  if (!health) {
    statusElement.className = 'status-indicator unknown';
    return;
  }

  // Check if all health checks passed
  const allPassed = Object.values(health.results).every(result => result);

  if (allPassed) {
    statusElement.className = 'status-indicator ready';
  } else {
    statusElement.className = 'status-indicator error';
  }
}

// Load conversation topic from storage
async function loadConversationTopic() {
  const config = await chrome.storage.local.get('config');
  if (config.config?.research?.conversationTopic) {
    elements.conversationTopic.value = config.config.research.conversationTopic;
  }
}

// Save conversation topic to storage
async function saveConversationTopic() {
  const topic = elements.conversationTopic.value;
  const config = await chrome.storage.local.get('config');

  if (config.config) {
    config.config.research.conversationTopic = topic;
    await chrome.storage.local.set({ config: config.config });
  }
}

// Set up event listeners
function setupEventListeners() {
  // Start session
  elements.startButton.addEventListener('click', handleStartSession);

  // Pause session
  elements.pauseButton.addEventListener('click', handlePauseSession);

  // Stop session
  elements.stopButton.addEventListener('click', handleStopSession);

  // Approve message
  elements.approveButton.addEventListener('click', handleApproveMessage);

  // Reject message
  elements.rejectButton.addEventListener('click', handleRejectMessage);

  // Health check
  elements.healthCheckButton.addEventListener('click', handleHealthCheck);

  // Options
  elements.optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // View logs
  elements.logsButton.addEventListener('click', handleViewLogs);

  // Export data
  elements.exportButton.addEventListener('click', handleExportData);

  // Emergency stop
  elements.emergencyButton.addEventListener('click', handleEmergencyStop);

  // Save topic when changed
  elements.conversationTopic.addEventListener('change', saveConversationTopic);
}

// Handle start session
async function handleStartSession() {
  console.log('Starting research session...');

  // Save conversation topic first
  await saveConversationTopic();

  // Check if both platforms are ready
  const platformTabs = await chrome.storage.local.get('platformTabs');

  if (!platformTabs.platformTabs?.claude || !platformTabs.platformTabs?.chatgpt) {
    alert('Please open both Claude.ai and ChatGPT in separate tabs before starting a session.');
    return;
  }

  // Send start session message
  try {
    await chrome.runtime.sendMessage({ type: 'START_SESSION' });
    await updateSessionState();
  } catch (error) {
    console.error('Error starting session:', error);
    alert('Failed to start session. Please try again.');
  }
}

// Handle pause session
async function handlePauseSession() {
  try {
    await chrome.runtime.sendMessage({ type: 'PAUSE_SESSION' });
    await updateSessionState();
  } catch (error) {
    console.error('Error pausing session:', error);
  }
}

// Handle stop session
async function handleStopSession() {
  if (confirm('Are you sure you want to stop the current research session?')) {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
      await updateSessionState();
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }
}

// Handle approve message
async function handleApproveMessage() {
  try {
    await chrome.runtime.sendMessage({ type: 'APPROVE_MESSAGE' });
    elements.approvalSection.style.display = 'none';
  } catch (error) {
    console.error('Error approving message:', error);
  }
}

// Handle reject message
function handleRejectMessage() {
  elements.approvalSection.style.display = 'none';
  // Message will not be relayed
}

// Handle health check
async function handleHealthCheck() {
  console.log('Running health check...');

  elements.healthResults.innerHTML = '<div style="padding: 10px; color: #666;">Running checks...</div>';

  // Get all tabs
  const tabs = await chrome.tabs.query({});

  // Send health check to Claude and ChatGPT tabs
  const claudeTab = tabs.find(tab => tab.url?.includes('claude.ai'));
  const chatgptTab = tabs.find(tab => tab.url?.includes('chatgpt.com'));

  const results = [];

  if (claudeTab) {
    try {
      await chrome.tabs.sendMessage(claudeTab.id, { type: 'RUN_HEALTH_CHECK' });
      results.push({ platform: 'Claude.ai', status: 'running' });
    } catch (error) {
      results.push({ platform: 'Claude.ai', status: 'error', error: error.message });
    }
  } else {
    results.push({ platform: 'Claude.ai', status: 'not_found' });
  }

  if (chatgptTab) {
    try {
      await chrome.tabs.sendMessage(chatgptTab.id, { type: 'RUN_HEALTH_CHECK' });
      results.push({ platform: 'ChatGPT', status: 'running' });
    } catch (error) {
      results.push({ platform: 'ChatGPT', status: 'error', error: error.message });
    }
  } else {
    results.push({ platform: 'ChatGPT', status: 'not_found' });
  }

  // Wait for results and update
  setTimeout(async () => {
    await checkPlatformStatus();
    displayHealthResults();
  }, 1000);
}

// Display health check results
async function displayHealthResults() {
  const health = await chrome.storage.local.get('healthChecks');

  if (!health.healthChecks) {
    elements.healthResults.innerHTML = '<div style="padding: 10px; color: #999;">No health check data available.</div>';
    return;
  }

  let html = '';

  // Claude results
  if (health.healthChecks.claude) {
    html += '<div style="margin-bottom: 10px;"><strong>Claude.ai:</strong></div>';
    Object.entries(health.healthChecks.claude.results).forEach(([key, value]) => {
      html += `
        <div class="health-item ${value ? 'pass' : 'fail'}">
          <span>${key}</span>
          <span>${value ? '✓' : '✗'}</span>
        </div>
      `;
    });
  }

  // ChatGPT results
  if (health.healthChecks.chatgpt) {
    html += '<div style="margin-top: 10px; margin-bottom: 10px;"><strong>ChatGPT:</strong></div>';
    Object.entries(health.healthChecks.chatgpt.results).forEach(([key, value]) => {
      html += `
        <div class="health-item ${value ? 'pass' : 'fail'}">
          <span>${key}</span>
          <span>${value ? '✓' : '✗'}</span>
        </div>
      `;
    });
  }

  elements.healthResults.innerHTML = html;
}

// Handle view logs
async function handleViewLogs() {
  const logs = await chrome.storage.local.get('conversationLogs');

  if (!logs.conversationLogs || Object.keys(logs.conversationLogs).length === 0) {
    alert('No conversation logs available.');
    return;
  }

  // Open a new tab with logs (we'll create a viewer page later)
  const logData = JSON.stringify(logs.conversationLogs, null, 2);
  console.log('Conversation logs:', logData);

  alert(`Found ${Object.keys(logs.conversationLogs).length} session(s). Check console for details.\n\nTip: Use Export Data to save logs to a file.`);
}

// Handle export data
async function handleExportData() {
  const logs = await chrome.storage.local.get('conversationLogs');

  if (!logs.conversationLogs || Object.keys(logs.conversationLogs).length === 0) {
    alert('No data to export.');
    return;
  }

  // Create JSON export
  const exportData = {
    exportDate: new Date().toISOString(),
    sessions: logs.conversationLogs
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  // Download file
  const url = URL.createObjectURL(dataBlob);
  const filename = `aiparley-export-${Date.now()}.json`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

// Handle emergency stop
async function handleEmergencyStop() {
  if (confirm('⚠️ EMERGENCY STOP\n\nThis will immediately halt all research activities.\n\nAre you sure?')) {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
      await updateSessionState();
      alert('Session stopped.');
    } catch (error) {
      console.error('Error during emergency stop:', error);
    }
  }
}

// Handle messages from background
function handleBackgroundMessage(message, sender, sendResponse) {
  console.log('Popup received message:', message.type);

  // Add to debug log
  if (message.type !== 'DEBUG_LOG') {
    addDebugLog(`Received: ${message.type}`, 'info', {
      type: message.type,
      source: 'background'
    });

    // Update debug display
    if (elements.debugLastEvent) {
      elements.debugLastEvent.textContent = `${message.type} at ${new Date().toLocaleTimeString()}`;
    }
  }

  switch (message.type) {
    case 'APPROVAL_REQUIRED':
      showApprovalPrompt(message.message);
      break;

    case 'SESSION_COMPLETE':
      handleSessionComplete(message);
      break;

    case 'HEALTH_CHECK_WARNING':
      handleHealthWarning(message);
      break;

    case 'DEBUG_LOG':
      // Add to debug console
      addDebugLog(message.message, message.data?.type || 'info', message.data);
      break;
  }
}

// Show approval prompt for manual approval mode
function showApprovalPrompt(message) {
  elements.approvalMessage.textContent = message.content.substring(0, 200) + '...';
  elements.approvalSection.style.display = 'block';
}

// Handle session complete
function handleSessionComplete(message) {
  const continueSession = confirm(
    `Research session complete!\n\n` +
    `Session ID: ${message.sessionId}\n` +
    `Exchanges: ${message.exchanges}\n\n` +
    `Would you like to continue with a new session?`
  );

  if (continueSession) {
    handleStartSession();
  } else {
    updateSessionState();
  }
}

// Handle health check warning
function handleHealthWarning(message) {
  const failedChecks = Object.entries(message.results)
    .filter(([key, value]) => !value)
    .map(([key]) => key)
    .join(', ');

  console.warn(`Health check warning for ${message.platform}:`, failedChecks);

  // Update platform status
  checkPlatformStatus();
}

// ============================================================================
// DEBUG CONSOLE FUNCTIONS
// ============================================================================

// Add log entry to debug console
function addDebugLog(message, type = 'info', details = null) {
  try {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
      timestamp,
      message,
      type,
      details
    };

    debugLogEntries.unshift(entry); // Add to beginning
    if (debugLogEntries.length > 100) {
      debugLogEntries = debugLogEntries.slice(0, 100); // Keep last 100
    }

    updateDebugLogDisplay();
    console.log(`[AIParley Debug] ${message}`, details || '');
  } catch (error) {
    console.error('Error in addDebugLog:', error);
  }
}

// Update debug log display
function updateDebugLogDisplay() {
  if (!elements.debugLog) return;

  let html = '';
  debugLogEntries.forEach(entry => {
    const typeClass = entry.type || 'info';
    html += `
      <div class="debug-entry ${typeClass}">
        <span class="debug-timestamp">${entry.timestamp}</span>
        <span class="debug-message">${entry.message}</span>
        ${entry.details ? `<div class="debug-details">${JSON.stringify(entry.details)}</div>` : ''}
      </div>
    `;
  });

  elements.debugLog.innerHTML = html || '<div style="color: #858585; padding: 8px;">No events yet</div>';
}

// Update debug info panel
async function updateDebugInfo() {
  try {
    // Get session state
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' });
    const state = response?.state;

    if (state && elements.debugSessionState) {
      elements.debugSessionState.textContent = state.active
        ? `Active (${state.paused ? 'PAUSED' : 'RUNNING'}) - Exchange ${state.currentExchange}/${state.totalExchanges}`
        : 'Inactive';

      if (elements.debugPendingMessage) {
        elements.debugPendingMessage.textContent = state.pendingMessage
          ? `From ${state.pendingMessage.sourcePlatform} to ${state.pendingMessage.targetPlatform}`
          : 'None';
      }
    }

    // Get tab info
    const tabs = await chrome.storage.local.get('platformTabs');
    if (tabs.platformTabs && elements.debugTabInfo) {
      const claudeTab = tabs.platformTabs.claude;
      const chatgptTab = tabs.platformTabs.chatgpt;
      elements.debugTabInfo.textContent = `Claude: Tab ${claudeTab || 'N/A'}, ChatGPT: Tab ${chatgptTab || 'N/A'}`;
    }

  } catch (error) {
    console.error('Error updating debug info:', error);
  }
}

// Toggle debug console
function toggleDebugConsole() {
  if (!elements.debugConsole) {
    console.error('Debug console element not found');
    return;
  }

  const isVisible = elements.debugConsole.style.display !== 'none';
  elements.debugConsole.style.display = isVisible ? 'none' : 'block';

  if (!isVisible) {
    updateDebugInfo();
    // Poll for updates while open
    if (window.debugInterval) clearInterval(window.debugInterval);
    window.debugInterval = setInterval(updateDebugInfo, 1000);
  } else {
    if (window.debugInterval) clearInterval(window.debugInterval);
  }
}

// Clear debug log
function clearDebugLog() {
  debugLogEntries = [];
  updateDebugLogDisplay();
  addDebugLog('Debug log cleared', 'info');
}

// Start initialization
initialize();

// Set up debug console event listeners after DOM is ready
setTimeout(() => {
  if (elements.toggleDebugButton) {
    elements.toggleDebugButton.addEventListener('click', toggleDebugConsole);
  }
  if (elements.clearDebugButton) {
    elements.clearDebugButton.addEventListener('click', clearDebugLog);
  }

  // Add initial log entry
  addDebugLog('AIParley initialized', 'success');
  addDebugLog('Debug console ready - Click "Debug Console" button to view', 'info');
}, 100);
