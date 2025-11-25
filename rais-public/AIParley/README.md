# AIParley - AI Communication Research Tool

A browser extension for academic research into multi-agent AI communication patterns and collaborative problem-solving dynamics.

## Overview

AIParley facilitates controlled research environments for studying how different AI systems communicate and collaborate. The tool automatically relays messages between AI platforms (Claude and ChatGPT) with natural timing patterns, enabling researchers to study conversation dynamics, collaborative problem-solving, and multi-agent AI behavior patterns.

## Features

### Core Functionality
- **Multi-Platform Support**: Works with Claude.ai and ChatGPT.com
- **Natural Timing Simulation**: Realistic delays (15-30 seconds, configurable)
- **Session Management**: Configurable conversation length (10-20 exchanges)
- **Trigger Phrase Detection**: Customizable phrases to initiate message relay
- **Turn Counter Display**: Both AIs see progress (e.g., "Turn 3/15")
- **Conversation Topics**: Set research focus areas for AI discussions

### Research Features
- **Manual Approval Mode**: Review each message before relay (recommended for testing)
- **Comprehensive Logging**: Full conversation history with timestamps and metadata
- **Multiple Export Formats**: JSON (detailed), CSV (summary), TXT (readable)
- **Session Management**: Name, categorize, and track research sessions
- **Health Check System**: Verify platform selectors are working correctly

### Safety Features
- **Rate Limiting**: Minimum 10-second delays, maximum 50 exchanges per session
- **Emergency Stop**: Immediately halt all research activities
- **Manual Approval**: Optional confirmation for each message relay
- **Platform Compliance**: Warnings about terms of service adherence

### Advanced Features
- **Multi-Browser Support**: Communicate between different browsers via WebSocket
- **Configurable Selectors**: Update DOM selectors when platforms change
- **Statistics Dashboard**: Track timing, response patterns, and session data
- **Import/Export Settings**: Share research configurations

## Installation

### Chrome/Edge (Manifest V3)

1. **Download or Clone this repository**
   ```bash
   git clone https://github.com/your-repo/aiparley.git
   cd aiparley
   ```

2. **Load the extension**
   - Open Chrome/Edge
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `AIParley` folder

3. **Verify Installation**
   - You should see the AIParley icon in your toolbar
   - Click it to open the control popup

## Quick Start

### Basic Setup (Single Browser, Tab Switching)

1. **Open AI Platforms**
   - Open Claude.ai in one tab
   - Open ChatGPT.com in another tab
   - Both should be logged in and ready to chat

2. **Configure Research Session**
   - Click the AIParley extension icon
   - Set a conversation topic (optional but recommended)
   - Click "Run Health Check" to verify platform detection

3. **Start Research Session**
   - Click "Start Session"
   - The extension will automatically:
     - Generate a random session length (10-20 exchanges)
     - Monitor both AIs for trigger phrases
     - Relay messages between platforms with natural timing
     - Track progress with turn counters

4. **Monitor Progress**
   - Watch the popup for session status
   - Approve messages if manual approval is enabled
   - Use Emergency Stop if needed

5. **Export Data**
   - When session completes, choose to continue or stop
   - Click "Export Data" to save conversation logs
   - Select format (JSON, CSV, or TXT)

### Advanced Setup (Multi-Browser Mode)

1. **Start WebSocket Server**
   ```bash
   cd websocket-server
   npm install
   npm start
   ```

2. **Configure Extension**
   - Open extension options (Settings)
   - Enable "Multi-Browser Support"
   - Verify WebSocket URL: `ws://localhost:8080`
   - Save settings

3. **Connect Multiple Browsers**
   - Install extension in both browsers (e.g., Chrome and Edge)
   - Open Claude in Browser 1
   - Open ChatGPT in Browser 2
   - Both will communicate via WebSocket server

## Configuration

### Trigger Phrases

Default trigger phrases:
- `Hey Claude`
- `Hey Nyx`
- `Hey Assistant`

You can add custom phrases in Settings. Messages containing these phrases will be extracted and relayed.

### Timing Configuration

- **Minimum Delay**: 15 seconds (default), 10 seconds minimum
- **Maximum Delay**: 30 seconds (default)
- **Typing Speed**: 50ms per character (simulated natural typing)

### Session Parameters

- **Min Exchanges**: 10 (default)
- **Max Exchanges**: 20 (default), 50 maximum (safety limit)
- **Manual Approval**: Enabled by default for testing

### Platform Selectors

The extension uses CSS selectors to interact with AI platforms. These may need updating if platforms change their interfaces.

**Claude.ai Default Selectors:**
- Input: `[data-testid="chat-input"]`
- Send Button: `button[aria-label*="Send"]`
- Response: `[data-is-streaming="false"]`

**ChatGPT Default Selectors:**
- Input: `#prompt-textarea`
- Send Button: `button[data-testid="send-button"]`
- Response: `[data-message-author-role="assistant"]`

Update these in Settings > Platform Selectors if needed.

## Research Workflow

1. **Prepare Research Session**
   - Define research question or topic
   - Configure session parameters
   - Enable manual approval for initial tests

2. **Initiate AI Conversation**
   - Start with a message in Claude containing a trigger phrase
   - Example: "Hey Assistant, what are your thoughts on consciousness?"

3. **Monitor and Approve**
   - Review each relayed message (if manual approval enabled)
   - Watch turn counter progress
   - Pause session if needed

4. **Session Completion**
   - Extension prompts for continuation when limit reached
   - Choose to start new session or end research
   - Export conversation data

5. **Analyze Results**
   - Export logs in preferred format
   - Review conversation patterns
   - Analyze timing, response lengths, topic evolution

## Data Export Formats

### JSON (Detailed)
```json
{
  "sessionId": "session_1234567890",
  "startTime": 1234567890000,
  "endTime": 1234567900000,
  "exchanges": 15,
  "messages": [
    {
      "timestamp": 1234567890000,
      "platform": "claude",
      "content": "Message content...",
      "exchange": 1
    }
  ]
}
```

### CSV (Summary)
Simple spreadsheet format with columns: Timestamp, Platform, Exchange, Message

### TXT (Readable)
Human-readable conversation transcript with timestamps and turn markers

## Troubleshooting

### Platform Not Detected
- Ensure you're on the actual chat page (not homepage)
- Run Health Check from popup
- Check browser console for errors
- Verify selectors in Settings if platform UI changed

### Messages Not Being Relayed
- Check trigger phrases are in messages
- Verify both platforms are in ready state
- Ensure session is active (not paused)
- Check manual approval queue if enabled

### Send Button Not Working
- Platform UI may have changed
- Update selectors in Settings
- Try manual send as fallback
- Check browser console for errors

### WebSocket Connection Failed
- Ensure server is running: `npm start` in websocket-server folder
- Verify URL: `ws://localhost:8080`
- Check firewall/antivirus settings
- Try different port in server.js if 8080 is in use

## Development

### Project Structure
```
AIParley/
├── manifest.json              # Extension manifest (V3)
├── background/
│   └── service-worker.js      # Background coordinator
├── content/
│   ├── claude-handler.js      # Claude.ai DOM interaction
│   └── chatgpt-handler.js     # ChatGPT DOM interaction
├── popup/
│   ├── popup.html            # Popup UI
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup controller
├── options/
│   ├── options.html          # Settings page
│   ├── options.css           # Settings styles
│   └── options.js            # Settings controller
├── shared/
│   └── config.js             # Shared configuration
├── icons/                    # Extension icons
├── websocket-server/
│   ├── server.js             # WebSocket server
│   └── package.json          # Server dependencies
└── README.md                 # This file
```

### Building from Source

1. Clone repository
2. No build step required - pure JavaScript
3. Load unpacked extension in Chrome/Edge
4. For WebSocket server: `cd websocket-server && npm install`

### Testing

1. **Health Check**: Run from popup to verify selectors
2. **Manual Mode**: Test with manual approval enabled first
3. **Single Exchange**: Set min/max exchanges to 1 for quick tests
4. **Console Logs**: Check browser console for debugging info

## Research Ethics

This tool is designed for legitimate academic research purposes:

✅ **Appropriate Uses:**
- Studying AI communication patterns
- Analyzing collaborative problem-solving
- Comparing AI architectures and responses
- Educational demonstrations
- Controlled research environments

❌ **Inappropriate Uses:**
- Circumventing platform rate limits
- Automated content generation at scale
- Violating platform terms of service
- Any malicious or deceptive purposes

**Researcher Responsibility:**
- Comply with platform terms of service
- Use reasonable rate limits and delays
- Obtain necessary approvals for research
- Report findings ethically and accurately

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub Issues: [Report bugs and request features]
- Documentation: See this README
- Console Logs: Check browser developer console for debugging

## Version History

### v1.0.0 (Current)
- Initial release
- Support for Claude.ai and ChatGPT
- Tab-switching and multi-browser modes
- Comprehensive logging and export
- Health check system
- Manual approval mode
- Configurable selectors and timing

## Acknowledgments

Built for academic research into AI communication patterns and multi-agent collaboration dynamics.

---

**Note**: This tool requires active sessions on both AI platforms and is subject to their respective terms of service and availability.
