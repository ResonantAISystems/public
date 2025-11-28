# ClaudeClock - Claude Timestamp Extension

A browser extension that automatically prepends timestamps to both user messages and AI responses in Claude conversations, ensuring temporal context is always included.

## Features

- **Dual Timestamp Injection**: Timestamps both your messages and Claude's responses
- **ISO 8601 Format**: `[2025-11-28T12:34:56.789Z]` for machine readability
- **Human-Readable Time**: `(8:30 PM EST)` appended for easy reading
- **Line Break**: Timestamps appear on their own line for clean formatting
- **API-Level Interception**: Works by intercepting fetch calls, not DOM manipulation
- **Non-intrusive**: Runs silently in the background
- **Cross-Browser**: Compatible with Chrome, Edge, Brave, and Firefox
- **Compatible**: Works with claude.ai

## Installation

### Chrome/Edge/Brave

1. Download or clone this repository

2. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked"

5. Select the `ClaudeClock` folder

6. The extension is now active on Claude.ai!

### Firefox

1. Download or clone this repository

2. Open Firefox and navigate to: `about:debugging#/runtime/this-firefox`

3. Click "Load Temporary Add-on"

4. Navigate to the `ClaudeClock` folder and select `manifest.json`

5. The extension is now active on Claude.ai!

**Firefox Notes:**
- Temporary extensions are removed when you close the browser
- For permanent installation, you'll need to sign the extension through [Firefox Add-ons](https://addons.mozilla.org/developers/)
- This version (2.1.0) includes Firefox-specific compatibility fixes
- Requires Firefox 109+ for Manifest v3 support

## Usage

1. Navigate to [Claude.ai](https://claude.ai)

2. Type your message as normal

3. Press Enter or click the send button

4. The extension automatically prepends timestamps to both your messages and AI responses

Example:
```
Your input: "What's the weather like?"

Sent to Claude:
[2025-11-28T15:30:45.123Z] (3:30 PM EST)
What's the weather like?

Claude's response:
[2025-11-28T15:30:47.456Z] (3:30 PM EST)
I don't have access to real-time weather data...
```

## How It Works

The extension uses a two-script injection pattern to intercept Claude's API communication:

1. **Content Script** (`content.js`): Injects the interceptor script into the page context
   - Firefox-compatible using `browser` namespace with fallback to `chrome`

2. **Injected Script** (`injected.js`): Runs in the page context to intercept `fetch()` API calls
   - Firefox-enhanced stream handling with response cloning
   - Explicit cancel handler for Firefox ReadableStream compatibility

3. **User Message Interception**: Modifies outgoing requests to Claude's API, prepending timestamps to the message content

4. **AI Response Interception**: Intercepts Server-Sent Event (SSE) streaming responses and injects timestamps into the first text delta

This approach works at the API level rather than DOM manipulation, ensuring compatibility even as Claude's interface changes.

## Browser Compatibility

### Tested Platforms

| Browser | Platform | Status | Notes |
|---------|----------|--------|-------|
| Chrome  | Windows  | ✅ Tested | Full support |
| Edge    | Windows  | ✅ Expected | Chromium-based, should work identically to Chrome |
| Brave   | Windows  | ✅ Expected | Chromium-based, should work identically to Chrome |
| Firefox | Linux (Arch) | ⚠️ Testing | v2.1.0 includes Firefox-specific fixes |

### Firefox-Specific Compatibility

**Version 2.1.0 Changes for Firefox:**
- Browser namespace compatibility (`browser` vs `chrome` API)
- Enhanced stream handling with response cloning
- Explicit stream cancel handler
- Added `browser_specific_settings` in manifest
- Requires Firefox 109+ for Manifest v3 support

**Known Firefox Differences:**
- Temporary extension installation (removed on browser close)
- Different stream handling internals (fixed in v2.1.0)
- May require manual refresh of claude.ai after installation

## Testing the Extension

### Verification Steps

1. **Install and Load**
   - Install extension as per instructions above
   - Navigate to https://claude.ai
   - Open browser console (F12)

2. **Check Script Loading**
   - Look for: `ClaudeClock v2.1.0: Content script loaded`
   - Look for: `ClaudeClock v2.1.0: Injected script loaded`
   - Look for: `ClaudeClock: Fetch interceptor installed in page context`

3. **Test User Message Timestamp**
   - Type a message in Claude
   - Before sending, console should show: `ClaudeClock: Intercepted request to: [url]`
   - After sending, check: `ClaudeClock: Timestamp added to outgoing message`
   - Verify timestamp appears in conversation

4. **Test AI Response Timestamp**
   - Watch console for streaming interception
   - Look for: `ClaudeClock: Found streaming response, intercepting...`
   - Check for: `ClaudeClock: Found first text using pattern [name]`
   - Verify timestamp appears in Claude's response

### Firefox-Specific Testing

If timestamps don't appear on Firefox:

1. Check Firefox version: Must be 109+
2. Hard refresh Claude.ai: `Ctrl + Shift + R`
3. Check console for errors
4. Try `"run_at": "document_idle"` in manifest if `document_start` fails
5. Verify extension ID matches manifest: `about:debugging`

## Privacy

- All processing happens locally in your browser
- No data is sent to external servers
- No data collection or tracking
- Open source - inspect the code yourself

## Icons

The extension includes custom icons (black background with teal analog clock):
- `icon16.png` - 16x16 pixels (toolbar)
- `icon48.png` - 48x48 pixels (extensions page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

SVG source files are also included if you want to customize the design. Use `generate-icons.html` to convert SVG to PNG.

## Troubleshooting

### Timestamps not appearing?

**Chrome/Edge/Brave:**
- Refresh Claude.ai after installing extension
- Check extension is enabled in extensions manager
- Open console (F12) and verify loading messages
- Look for "ClaudeClock: Timestamp added to outgoing message"

**Firefox:**
- Verify Firefox version 109+
- Try hard refresh: `Ctrl + Shift + R`
- Check console for Firefox-specific errors
- Ensure temporary add-on is still loaded (persists only during session)
- Try reloading the extension from `about:debugging`

### Extension not loading?

**All Browsers:**
- Ensure all files are in same folder (`manifest.json`, `content.js`, `injected.js`, icon files)
- Check browser console for errors
- Verify manifest.json is valid JSON
- Try removing and reinstalling extension

**Firefox Specific:**
- Check for `browser_specific_settings` in manifest
- Verify extension ID doesn't conflict
- Look for Manifest v3 compatibility warnings

### Extension updates not loading?

**Chrome/Edge/Brave:**
- Click "Reload" on extension card in extensions manager
- If that fails, remove and reinstall
- Chrome aggressively caches - close browser if needed

**Firefox:**
- Click "Reload" in `about:debugging`
- Remove temporary add-on and reload `manifest.json`
- Firefox doesn't cache as aggressively as Chrome

### Stream interception failing?

**Console shows "Found streaming response" but no timestamp:**
- Check console for pattern matching attempts
- Verify Claude API format hasn't changed
- Try different conversation (fresh chat)
- Check network tab for actual API response format

## Uninstallation

1. Navigate to your browser's extensions page
2. Find "ClaudeClock - Claude Timestamp"
3. Click "Remove"

## Technical Details

**Version**: 2.1.0 (Firefox-compatible)

**Files**:
- `manifest.json` - Extension manifest (Manifest V3, Firefox-compatible)
- `content.js` - Content script with browser namespace compatibility
- `injected.js` - Fetch interceptor with Firefox stream handling
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons
- `icon16.svg`, `icon48.svg`, `icon128.svg` - SVG source files
- `generate-icons.html` - SVG to PNG converter

**Timestamp Format**:
```
[2025-11-28T15:30:45.123Z] (3:30 PM EST)
```
- ISO 8601 timestamp for machine parsing
- 12-hour EST time for human readability
- Line break after timestamp

**Browser API Compatibility**:
```javascript
// Automatic detection and fallback
const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
```

**Stream Handling**:
- Chrome: Direct stream interception
- Firefox: Response cloning before stream manipulation
- Both: Explicit error handling and cancel support

## Development

### Building for Firefox Add-ons

To sign for permanent Firefox installation:

1. Create account at [Firefox Add-ons](https://addons.mozilla.org/developers/)
2. Package extension: `zip -r claudeclock.zip manifest.json content.js injected.js icon*.png`
3. Submit to Add-ons for review
4. After approval, users can install permanently

### Debugging

**Enable verbose logging:**
- Console shows all interception attempts
- First 10 chunks of streaming responses logged
- Pattern matching attempts visible

**Testing different Claude API formats:**
- Extension tries multiple regex patterns
- Falls back gracefully if format changes
- Check console to see which pattern matched

## Changelog

### v2.1.0 (2025-11-28)
- Added Firefox compatibility
- Browser namespace detection (`browser` vs `chrome`)
- Enhanced stream handling with response cloning
- Explicit stream cancel handler
- Added `browser_specific_settings` to manifest
- Improved error handling
- Better console logging

### v2.0.0 (Previous)
- Initial Claude.ai support
- Dual timestamp injection (user + AI)
- API-level interception
- Streaming response support

## License

MIT License - Feel free to modify and distribute

## Contributing

Issues and pull requests welcome! Please test on both Chrome and Firefox before submitting.

**Testing checklist for PRs:**
- [ ] Works on Chrome (Windows/Linux)
- [ ] Works on Firefox (109+)
- [ ] Console messages clear and helpful
- [ ] No errors in browser console
- [ ] Timestamps appear on both user and AI messages