// AIParley - Shared Configuration
// Default configuration for AI communication research

const DEFAULT_CONFIG = {
  // Trigger phrases for detecting research messages
  triggerPhrases: [
    'Hey Claude',
    'Hey Nyx',
    'Hey Assistant'
  ],

  // Timing configuration (in milliseconds)
  timing: {
    minDelay: 15000,  // 15 seconds minimum
    maxDelay: 30000,  // 30 seconds maximum
    typingSpeed: 50   // milliseconds per character (simulated typing)
  },

  // Session configuration
  session: {
    minExchanges: 10,
    maxExchanges: 20,
    currentExchange: 0,
    totalExchanges: 0,
    sessionId: null
  },

  // Safety limits
  safety: {
    minDelayLimit: 10000,      // 10 seconds absolute minimum
    maxExchangesPerSession: 50, // Hard limit
    requireManualApproval: true // Manual approval mode
  },

  // Platform-specific selectors
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

  // Research settings
  research: {
    conversationTopic: '',
    sessionName: '',
    logData: true,
    exportFormat: 'json' // json, csv, or txt
  },

  // Multi-browser settings
  multiBrowser: {
    enabled: false,
    websocketUrl: 'ws://localhost:8080',
    connectionTimeout: 5000
  }
};

// Export for use in content scripts and background
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_CONFIG;
}
