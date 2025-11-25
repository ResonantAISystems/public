# AIParley Installation Guide

## Prerequisites

- Chrome or Edge browser (Manifest V3 support)
- Access to Claude.ai account
- Access to ChatGPT account
- Node.js (v14+) for multi-browser mode (optional)

## Step 1: Prepare Extension

### Download/Clone Repository
```bash
# If using git
git clone https://github.com/your-repo/aiparley.git
cd aiparley

# Or download and extract ZIP file
```

### Add Icons (Required)
Before loading the extension, add icon files to the `icons/` folder:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

See `icons/README.md` for details on creating icons.

**Quick Placeholder Option:**
- Create simple colored PNG squares in required sizes
- Or use any existing PNG images temporarily
- Proper icons recommended before public use

## Step 2: Load Extension in Browser

### Chrome
1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `AIParley` folder
6. Verify extension appears in list

### Edge
1. Open Edge
2. Navigate to `edge://extensions/`
3. Enable "Developer mode" (toggle in left sidebar)
4. Click "Load unpacked"
5. Select the `AIParley` folder
6. Verify extension appears in list

### Verify Installation
- Extension icon should appear in browser toolbar
- Click icon to open popup
- Should see "AIParley" with status panel

## Step 3: Configure AI Platforms

### Open AI Platforms in Separate Tabs

**Tab 1: Claude.ai**
1. Navigate to https://claude.ai
2. Log in to your account
3. Start a new conversation or use existing one
4. Keep tab open

**Tab 2: ChatGPT**
1. Navigate to https://chatgpt.com
2. Log in to your account
3. Start a new conversation
4. Keep tab open

### Verify Platform Detection
1. Click AIParley extension icon
2. Click "Run Health Check" button
3. Both platforms should show green status indicators (●)
4. If red (●), see Troubleshooting section

## Step 4: Configure Settings (Optional)

1. Click AIParley icon
2. Click "⚙️ Settings" button
3. Configure as needed:
   - **Trigger Phrases**: Add custom phrases if desired
   - **Timing**: Adjust delays (keep at default for natural behavior)
   - **Session**: Set exchange limits
   - **Manual Approval**: Keep enabled for first test
4. Click "Save Settings"

## Step 5: First Test Session

### Quick Test (Manual Approval Mode)

1. **Set Topic** (optional)
   - Open AIParley popup
   - Enter research topic in "Research Topic" field
   - Example: "Philosophy of AI consciousness"

2. **Start Session**
   - Click "Start Session" button
   - Session status should change to "Active"
   - Progress counter shows 0 / [random number]

3. **Initiate Conversation**
   - Go to Claude tab
   - Type a message with trigger phrase:
     ```
     Hey Assistant, I'd like to discuss the philosophical
     implications of artificial consciousness. What are
     your initial thoughts?
     ```
   - Send the message

4. **Monitor Relay**
   - Wait for Claude to respond
   - When response includes trigger phrase, popup shows approval prompt
   - Click "Approve & Send" to relay to ChatGPT
   - Browser will switch to ChatGPT tab
   - Message will be typed and sent automatically

5. **Continue Exchange**
   - ChatGPT responds
   - If response has trigger phrase, approval prompt appears
   - Approve to send back to Claude
   - Process continues until session limit reached

6. **Complete Session**
   - When limit reached, popup prompts for continuation
   - Choose "Yes" for new session or "No" to end
   - Click "Export Data" to save conversation logs

## Step 6: Multi-Browser Mode (Advanced, Optional)

### Install WebSocket Server
```bash
cd websocket-server
npm install
```

### Start Server
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  AIParley WebSocket Server                                ║
║  Server running on: localhost:8080                        ║
║  Status: READY                                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Configure Extension
1. Open Settings in both browsers
2. Enable "Multi-Browser Support"
3. Verify WebSocket URL: `ws://localhost:8080`
4. Save settings

### Test Multi-Browser
1. Open Claude in Browser 1 (e.g., Chrome)
2. Open ChatGPT in Browser 2 (e.g., Edge)
3. Start session from either browser
4. Messages relay between browsers via WebSocket server

## Troubleshooting

### Extension Won't Load
- **Error: "Manifest version 3 required"**
  - Update browser to latest version
  - Chrome 88+ or Edge 88+ required

- **Error: "Failed to load extension"**
  - Check all files are present
  - Verify manifest.json is valid JSON
  - Check browser console for specific errors

### Platforms Not Detected
- **Health check shows red indicators**
  - Ensure you're on actual chat page (not homepage)
  - Refresh the AI platform tabs
  - Re-run health check
  - Check if platform UI has changed (update selectors in Settings)

- **Status shows "Unknown" (gray)**
  - Platform tab not open or not detected
  - Reload extension
  - Reload AI platform pages

### Messages Not Relaying
- **No approval prompt appears**
  - Check message contains trigger phrase exactly
  - Verify manual approval is enabled in Settings
  - Check browser console for errors

- **Message not typed into input**
  - Platform selector may have changed
  - Run health check
  - Update selectors in Settings
  - Check browser console for errors

- **Send button not clicking**
  - Platform UI may have changed
  - Try manually clicking send
  - Update send button selector in Settings

### WebSocket Connection Failed
- **Server not starting**
  - Ensure Node.js is installed: `node --version`
  - Install dependencies: `npm install`
  - Check if port 8080 is available
  - Try different port (edit server.js)

- **Extension can't connect**
  - Verify server is running
  - Check WebSocket URL in Settings
  - Check firewall settings
  - Try `ws://127.0.0.1:8080` instead of localhost

### Performance Issues
- **Slow typing/delays**
  - Adjust typing speed in Settings (increase ms)
  - Check computer resources (CPU/memory)
  - Close unnecessary browser tabs

- **Messages being missed**
  - Platform response might be too fast
  - Increase minimum delay in Settings
  - Enable manual approval to control pace

## Getting Help

### Check Browser Console
1. Right-click extension icon → "Inspect popup"
2. Go to Console tab
3. Look for AIParley messages and errors
4. Also check console on AI platform pages

### Log Files
- All conversation data stored in extension storage
- Export data from popup to review sessions
- Check "View Logs" button for session history

### Common Solutions
1. **Reload extension**: Remove and re-add unpacked extension
2. **Clear storage**: Right-click extension → Options → Reset to Defaults
3. **Restart browser**: Sometimes fixes mysterious issues
4. **Update selectors**: Most common issue when platforms update

## Security Notes

- Extension only interacts with Claude.ai and ChatGPT.com
- No data sent to external servers (except WebSocket in multi-browser mode)
- All conversation data stored locally in browser
- Review permissions in manifest.json for transparency

## Next Steps

After successful installation:
1. Review README.md for full feature documentation
2. Experiment with different trigger phrases
3. Try various conversation topics
4. Adjust timing for your research needs
5. Export and analyze conversation data

## Support

- Check README.md for detailed documentation
- Review browser console for error messages
- Ensure platforms haven't updated their UI
- Update selectors if needed in Settings

---

**Happy Researching!** 🚀

The AIParley tool is ready for AI communication research. Start with manual approval mode and short sessions to get familiar with the workflow.
