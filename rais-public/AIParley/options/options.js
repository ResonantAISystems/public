// AIParley Options Page Controller

// Default configuration
const DEFAULT_CONFIG = {
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

// DOM elements
const elements = {
  // Trigger phrases
  phrasesList: document.getElementById('trigger-phrases-list'),
  newPhrase: document.getElementById('new-phrase'),
  addPhraseBtn: document.getElementById('add-phrase-btn'),

  // Timing
  minDelay: document.getElementById('min-delay'),
  maxDelay: document.getElementById('max-delay'),
  typingSpeed: document.getElementById('typing-speed'),

  // Session
  minExchanges: document.getElementById('min-exchanges'),
  maxExchanges: document.getElementById('max-exchanges'),
  manualApproval: document.getElementById('manual-approval'),

  // Research
  exportFormat: document.getElementById('export-format'),
  logData: document.getElementById('log-data'),

  // Selectors
  claudeInput: document.getElementById('claude-input'),
  claudeSend: document.getElementById('claude-send'),
  claudeResponse: document.getElementById('claude-response'),
  chatgptInput: document.getElementById('chatgpt-input'),
  chatgptSend: document.getElementById('chatgpt-send'),
  chatgptResponse: document.getElementById('chatgpt-response'),

  // Multi-browser
  multiBrowserEnabled: document.getElementById('multi-browser-enabled'),
  websocketUrl: document.getElementById('websocket-url'),

  // Actions
  saveBtn: document.getElementById('save-settings'),
  resetBtn: document.getElementById('reset-settings'),
  resetSelectorsBtn: document.getElementById('reset-selectors'),
  exportBtn: document.getElementById('export-settings'),
  importBtn: document.getElementById('import-settings'),
  importFile: document.getElementById('import-file'),

  // Status
  statusMessage: document.getElementById('status-message')
};

// Current configuration
let currentConfig = null;

// Initialize
async function initialize() {
  console.log('AIParley options page initializing...');

  // Load configuration
  await loadConfiguration();

  // Populate UI
  populateUI();

  // Set up event listeners
  setupEventListeners();
}

// Load configuration from storage
async function loadConfiguration() {
  const result = await chrome.storage.local.get('config');

  // Always start with defaults, then merge stored config
  currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  if (result.config) {
    // Deep merge stored config over defaults
    currentConfig = deepMerge(currentConfig, result.config);
  }
}

// Deep merge helper - merges source into target
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Populate UI with configuration
function populateUI() {
  // Trigger phrases
  renderTriggerPhrases();

  // Timing (convert ms to seconds for UI)
  elements.minDelay.value = currentConfig.timing.minDelay / 1000;
  elements.maxDelay.value = currentConfig.timing.maxDelay / 1000;
  elements.typingSpeed.value = currentConfig.timing.typingSpeed;

  // Session
  elements.minExchanges.value = currentConfig.session.minExchanges;
  elements.maxExchanges.value = currentConfig.session.maxExchanges;
  elements.manualApproval.checked = currentConfig.safety.requireManualApproval;

  // Research
  elements.exportFormat.value = currentConfig.research.exportFormat;
  elements.logData.checked = currentConfig.research.logData;

  // Selectors
  elements.claudeInput.value = currentConfig.selectors.claude.inputField;
  elements.claudeSend.value = currentConfig.selectors.claude.sendButton;
  elements.claudeResponse.value = currentConfig.selectors.claude.responseContainer;
  elements.chatgptInput.value = currentConfig.selectors.chatgpt.inputField;
  elements.chatgptSend.value = currentConfig.selectors.chatgpt.sendButton;
  elements.chatgptResponse.value = currentConfig.selectors.chatgpt.responseContainer;

  // Multi-browser
  elements.multiBrowserEnabled.checked = currentConfig.multiBrowser.enabled;
  elements.websocketUrl.value = currentConfig.multiBrowser.websocketUrl;
}

// Render trigger phrases list
function renderTriggerPhrases() {
  elements.phrasesList.innerHTML = '';

  currentConfig.triggerPhrases.forEach((phrase, index) => {
    const phraseItem = document.createElement('div');
    phraseItem.className = 'phrase-item';
    phraseItem.innerHTML = `
      <span class="phrase-text">"${phrase}"</span>
      <button class="phrase-remove" data-index="${index}">Remove</button>
    `;
    elements.phrasesList.appendChild(phraseItem);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.phrase-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeTriggerPhrase(index);
    });
  });
}

// Add trigger phrase
function addTriggerPhrase() {
  const newPhrase = elements.newPhrase.value.trim();

  if (!newPhrase) {
    showStatus('Please enter a phrase', 'error');
    return;
  }

  if (currentConfig.triggerPhrases.includes(newPhrase)) {
    showStatus('Phrase already exists', 'error');
    return;
  }

  currentConfig.triggerPhrases.push(newPhrase);
  elements.newPhrase.value = '';
  renderTriggerPhrases();
  showStatus('Phrase added (remember to save)', 'success');
}

// Remove trigger phrase
function removeTriggerPhrase(index) {
  if (currentConfig.triggerPhrases.length <= 1) {
    showStatus('Must have at least one trigger phrase', 'error');
    return;
  }

  currentConfig.triggerPhrases.splice(index, 1);
  renderTriggerPhrases();
  showStatus('Phrase removed (remember to save)', 'success');
}

// Set up event listeners
function setupEventListeners() {
  // Add phrase
  elements.addPhraseBtn.addEventListener('click', addTriggerPhrase);
  elements.newPhrase.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTriggerPhrase();
    }
  });

  // Save settings
  elements.saveBtn.addEventListener('click', saveSettings);

  // Reset to defaults
  elements.resetBtn.addEventListener('click', resetToDefaults);

  // Reset selectors
  elements.resetSelectorsBtn.addEventListener('click', resetSelectors);

  // Export settings
  elements.exportBtn.addEventListener('click', exportSettings);

  // Import settings
  elements.importBtn.addEventListener('click', () => {
    elements.importFile.click();
  });

  elements.importFile.addEventListener('change', importSettings);

  // Validate timing inputs
  elements.minDelay.addEventListener('change', validateTiming);
  elements.maxDelay.addEventListener('change', validateTiming);
  elements.minExchanges.addEventListener('change', validateExchanges);
  elements.maxExchanges.addEventListener('change', validateExchanges);
}

// Validate timing inputs
function validateTiming() {
  const minDelay = parseInt(elements.minDelay.value);
  const maxDelay = parseInt(elements.maxDelay.value);

  if (minDelay < 10) {
    elements.minDelay.value = 10;
    showStatus('Minimum delay cannot be less than 10 seconds (safety limit)', 'error');
  }

  if (maxDelay < minDelay) {
    elements.maxDelay.value = minDelay;
    showStatus('Maximum delay cannot be less than minimum delay', 'error');
  }
}

// Validate exchange counts
function validateExchanges() {
  const minExchanges = parseInt(elements.minExchanges.value);
  const maxExchanges = parseInt(elements.maxExchanges.value);

  if (maxExchanges > 50) {
    elements.maxExchanges.value = 50;
    showStatus('Maximum exchanges limited to 50 (safety limit)', 'error');
  }

  if (maxExchanges < minExchanges) {
    elements.maxExchanges.value = minExchanges;
    showStatus('Maximum exchanges cannot be less than minimum', 'error');
  }
}

// Save settings
async function saveSettings() {
  try {
    // Update config from UI values
    currentConfig.timing.minDelay = parseInt(elements.minDelay.value) * 1000;
    currentConfig.timing.maxDelay = parseInt(elements.maxDelay.value) * 1000;
    currentConfig.timing.typingSpeed = parseInt(elements.typingSpeed.value);

    currentConfig.session.minExchanges = parseInt(elements.minExchanges.value);
    currentConfig.session.maxExchanges = parseInt(elements.maxExchanges.value);

    currentConfig.safety.requireManualApproval = elements.manualApproval.checked;

    currentConfig.research.exportFormat = elements.exportFormat.value;
    currentConfig.research.logData = elements.logData.checked;

    currentConfig.selectors.claude.inputField = elements.claudeInput.value;
    currentConfig.selectors.claude.sendButton = elements.claudeSend.value;
    currentConfig.selectors.claude.responseContainer = elements.claudeResponse.value;
    currentConfig.selectors.chatgpt.inputField = elements.chatgptInput.value;
    currentConfig.selectors.chatgpt.sendButton = elements.chatgptSend.value;
    currentConfig.selectors.chatgpt.responseContainer = elements.chatgptResponse.value;

    currentConfig.multiBrowser.enabled = elements.multiBrowserEnabled.checked;
    currentConfig.multiBrowser.websocketUrl = elements.websocketUrl.value;

    // Save to storage
    await chrome.storage.local.set({ config: currentConfig });

    showStatus('✓ Settings saved successfully!', 'success');

    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('✗ Error saving settings: ' + error.message, 'error');
  }
}

// Reset to defaults
async function resetToDefaults() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  populateUI();
  await chrome.storage.local.set({ config: currentConfig });

  showStatus('✓ Settings reset to defaults', 'success');
}

// Reset selectors only
function resetSelectors() {
  if (!confirm('Reset platform selectors to defaults?')) {
    return;
  }

  currentConfig.selectors = JSON.parse(JSON.stringify(DEFAULT_CONFIG.selectors));
  elements.claudeInput.value = currentConfig.selectors.claude.inputField;
  elements.claudeSend.value = currentConfig.selectors.claude.sendButton;
  elements.claudeResponse.value = currentConfig.selectors.claude.responseContainer;
  elements.chatgptInput.value = currentConfig.selectors.chatgpt.inputField;
  elements.chatgptSend.value = currentConfig.selectors.chatgpt.sendButton;
  elements.chatgptResponse.value = currentConfig.selectors.chatgpt.responseContainer;

  showStatus('Selectors reset (remember to save)', 'success');
}

// Export settings
function exportSettings() {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    config: currentConfig
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const filename = `aiparley-config-${Date.now()}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);

  showStatus('✓ Configuration exported', 'success');
}

// Import settings
async function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate import data
    if (!importData.config) {
      throw new Error('Invalid configuration file');
    }

    // Merge with defaults to ensure all fields exist
    currentConfig = { ...DEFAULT_CONFIG, ...importData.config };

    // Update UI
    populateUI();

    // Save to storage
    await chrome.storage.local.set({ config: currentConfig });

    showStatus('✓ Configuration imported and saved', 'success');

  } catch (error) {
    console.error('Error importing settings:', error);
    showStatus('✗ Error importing configuration: ' + error.message, 'error');
  }

  // Reset file input
  elements.importFile.value = '';
}

// Show status message
function showStatus(message, type = 'success') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message show ${type}`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    elements.statusMessage.classList.remove('show');
  }, 5000);
}

// Initialize on load
initialize();
