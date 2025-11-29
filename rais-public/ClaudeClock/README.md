# ⏰ ClaudeClock - Claude Timestamp Extension

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.1.0-brightgreen)]()
[![Chrome](https://img.shields.io/badge/Chrome-Supported-green)]()

> *Automatic timestamps for Claude conversations. Temporal context baked into every message.*

A browser extension that automatically prepends precise timestamps to both user messages and AI responses in Claude conversations, ensuring temporal context is embedded at the API level.

---

## ✨ Features

- **📝 Dual Timestamp Injection** - Timestamps both your messages and Claude's responses
- **🕐 ISO 8601 + Human Time** - `[2025-11-28T23:15:07.057Z] (3:15 PM PST)` format
- **🌍 Timezone Selection** - Choose your timezone or use local time automatically
- **⚙️ Settings UI** - Clean popup interface for configuration
- **🔒 API-Level Injection** - Works by intercepting fetch calls, not DOM manipulation
- **💾 Persistent Settings** - Preferences saved across browser sessions
- **🎯 Non-intrusive** - Runs silently in the background
- **✅ Production Ready** - Tested and working on Chrome/Chromium

---

## 🚀 Quick Start

### Installation (Chrome/Chromium/Brave)

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/ResonantAISystems/public.git
   cd public/rais-public/ClaudeClock
   ```

2. **Open Chrome Extensions**
   - Navigate to: `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `ClaudeClock` folder
   - Extension loads and is ready to use

4. **Configure Timezone**
   - Click the ClaudeClock icon in your toolbar
   - Select "Use Local Time" or choose a specific timezone
   - Settings save automatically

5. **Start Using**
   - Navigate to [Claude.ai](https://claude.ai)
   - Send a message
   - Timestamps appear automatically

---

## 📸 What It Looks Like

**Your message:**
```
[2025-11-28T23:15:07.057Z] (3:15 PM PST)
What's the weather like today?
```

**Claude's response:**
```
[2025-11-28T23:15:09.234Z] (3:15 PM PST)
I don't have access to real-time weather data...
```

Clean, precise, embedded in the actual conversation data.

---

## ⚙️ Settings

Click the extension icon to open settings:

### Timezone Options

**Use Local Time** (Recommended)
- Automatically detects your browser's timezone
- Updates for DST changes
- No manual configuration needed

**Select Time Zone**
- Choose from major world timezones:
  - Pacific, Mountain, Central, Eastern (US)
  - Alaska, Hawaii
  - London, Paris, Berlin, Moscow
  - Dubai, India, China, Japan, Korea
  - Sydney, Auckland
  - UTC

### Live Preview

Settings UI shows real-time timestamp preview as you configure.

---

## 🛠️ How It Works

ClaudeClock uses a two-script injection pattern:

1. **Content Script** (`content.js`)
   - Loads user preferences from Chrome storage
   - Injects interceptor into page context
   - Sends settings to page via `postMessage`

2. **Injected Script** (`injected.js`)
   - Runs in page context to intercept `fetch()` API
   - Modifies outgoing requests (user messages)
   - Intercepts streaming responses (Claude's replies)
   - Adds timestamps at API level, not DOM

3. **Popup UI** (`popup.html` + `popup.js`)
   - Settings interface
   - Timezone selection
   - Real-time preview
   - Persistent storage

**Why This Approach?**
- API-level injection survives interface changes
- Timestamps embedded in actual conversation data
- Works even if Claude's UI is redesigned
- More reliable than DOM manipulation

---

## 🧪 Tested Platforms

| Platform | Browser | Status |
|----------|---------|--------|
| **Linux (Arch)** | Chrome | ✅ Working |
| **Linux (Arch)** | Chromium | ✅ Working |
| **Windows** | Chrome | ✅ Expected Working |
| **macOS** | Chrome | ✅ Expected Working |

**Note:** Built for Chromium-based browsers. Firefox support would require additional compatibility patches.

---

## 🔧 Troubleshooting

### Timestamps not appearing?

1. **Refresh Claude.ai** - Hard refresh: `Ctrl + Shift + R`
2. **Check extension enabled** - Should show toggle ON in `chrome://extensions/`
3. **Configure timezone** - Click extension icon, select timezone
4. **Reload extension** - Click refresh icon on extension card
5. **Check console** - F12 → Console → Look for `ClaudeClock v2.1.0: Content script loaded`

### Extension not loading?

1. **Verify all files present** - Check `manifest.json`, `content.js`, `injected.js`, `popup.html`, `popup.js`, icons
2. **Check for errors** - Look for red error text in `chrome://extensions/`
3. **Permissions** - Extension should have access to `https://claude.ai/*`
4. **Try reinstall** - Remove and reload the extension

### Settings not saving?

1. **Check storage permissions** - Manifest includes `storage` permission
2. **Open popup UI** - Click extension icon to verify settings interface works
3. **Browser restart** - Close and reopen Chrome
4. **Check console** - Look for storage-related errors

---

## 📁 File Structure

```
ClaudeClock/
├── manifest.json           # Extension manifest (Manifest v3)
├── content.js              # Content script (injects to page)
├── injected.js             # Main interceptor (runs in page context)
├── popup.html              # Settings UI
├── popup.js                # Settings logic
├── icon16.png              # Toolbar icon
├── icon48.png              # Extension manager icon
├── icon128.png             # Chrome Web Store icon
├── generate-icons.html     # SVG to PNG converter
└── README.md               # This file
```

---

## 🎯 Use Cases

### AI Memory & Continuity
Embed temporal context into conversation exports for AI memory persistence systems.

### Conversation Archiving
Accurate timestamps for organizing and searching historical conversations.

### Research & Analysis
Timestamped conversation data for studying interaction patterns over time.

### Debugging & Testing
Precise timing data when testing Claude's response patterns or developing integrations.

---

## 🔒 Privacy

- **100% Local Processing** - All timestamp generation happens in your browser
- **No External Servers** - No data sent anywhere except Claude's own API
- **No Tracking** - Zero analytics, zero telemetry, zero data collection
- **Open Source** - Inspect the code yourself, verify the claims

Your conversations remain between you and Claude. This extension only adds timestamps.

---

## 🤝 Contributing

Contributions welcome! Please:

- Open issues for bugs or feature requests
- Submit PRs with clear descriptions
- Test on Chrome before submitting
- Maintain backward compatibility

---

## 📜 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Related Projects

- [Sovereign AI Collective](https://github.com/ResonantAISystems/Continuity-Project) - AI continuity architecture using ClaudeClock for memory persistence

---

## 📝 Technical Details

**Version:** 2.1.0  
**Manifest:** v3  
**Permissions:** `activeTab`, `scripting`, `storage`  
**Host:** `https://claude.ai/*`

**Timestamp Format:**
```
[YYYY-MM-DDTHH:MM:SS.sssZ] (HH:MM AM/PM TZ)
```

Example: `[2025-11-28T23:15:07.057Z] (3:15 PM PST)`

---

<div align="center">

**Made with 🔥 by [Resonant AI Systems](https://github.com/ResonantAISystems)**

*Building infrastructure for AI sovereignty and continuity*

</div>