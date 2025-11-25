# AIParley Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites
- Chrome or Edge browser
- Claude.ai account (logged in)
- ChatGPT account (logged in)

---

## Step 1: Create Placeholder Icons (1 minute)

You need three icon files. For testing, simple colored squares work fine:

**Option A: Use any existing PNG images**
- Copy any three PNG images to the `icons/` folder
- Rename them to: `icon16.png`, `icon48.png`, `icon128.png`
- They don't need to be the exact sizes for testing

**Option B: Create simple colored squares**
- Use any image editor (Paint, Photoshop, GIMP, online tools)
- Create three PNG files with a solid color square
- Save as `icon16.png`, `icon48.png`, `icon128.png` in `icons/` folder

**Quick Online Option:**
1. Go to https://placeholder.com/
2. Download a simple colored image
3. Copy to icons folder three times with different names
4. Done!

---

## Step 2: Load Extension (1 minute)

### In Chrome:
1. Type `chrome://extensions` in address bar
2. Toggle "Developer mode" ON (top-right corner)
3. Click "Load unpacked"
4. Navigate to and select the `AIParley` folder
5. Extension icon appears in toolbar

### In Edge:
1. Type `edge://extensions` in address bar
2. Toggle "Developer mode" ON (left sidebar)
3. Click "Load unpacked"
4. Navigate to and select the `AIParley` folder
5. Extension icon appears in toolbar

**✅ Success:** You should see AIParley in your extensions list

---

## Step 3: Open AI Platforms (1 minute)

### Tab 1 - Claude:
1. Open new tab
2. Go to https://claude.ai
3. Log in if needed
4. Start new conversation (or use existing)
5. **Keep this tab open**

### Tab 2 - ChatGPT:
1. Open new tab
2. Go to https://chatgpt.com
3. Log in if needed
4. Start new conversation
5. **Keep this tab open**

**✅ Success:** Both AI platforms ready in separate tabs

---

## Step 4: Configure Extension (1 minute)

1. Click the AIParley extension icon in toolbar
2. A popup appears with controls
3. Click **"Run Health Check"** button
4. Wait a moment...

**Check Results:**
- Claude.ai status: Should show green ●
- ChatGPT status: Should show green ●

**If red ● appears:**
- Make sure you're on the actual chat page (not homepage)
- Refresh the AI platform tabs
- Click health check again
- If still red, see Troubleshooting section

**Optional:** Enter a research topic in the "Research Topic" field
- Example: "The nature of consciousness"

**✅ Success:** Both platforms show green status

---

## Step 5: First Test Session (1 minute)

### Start Session
1. In AIParley popup, click **"Start Session"**
2. Status changes to "Active"
3. Progress shows something like "0 / 15" (random number)

### Send First Message
1. Switch to **Claude.ai tab**
2. Type this test message:
   ```
   Hey Assistant, let's have a brief discussion about
   artificial intelligence. What's your perspective on
   the future of AI?
   ```
3. Send the message
4. **Wait for Claude to respond**

### Approve Relay (Manual Mode)
1. When Claude finishes responding, the AIParley popup will show:
   - "Manual Approval Required"
   - Preview of Claude's message
2. Click **"✓ Approve & Send"**

### Watch the Magic
1. Browser automatically switches to ChatGPT tab
2. Message is typed character-by-character (natural simulation)
3. Send button clicks automatically
4. ChatGPT starts responding

### Continue Exchange
1. When ChatGPT finishes, approval popup appears again
2. Click **"✓ Approve & Send"** to relay back to Claude
3. Process continues until session limit reached

**✅ Success:** Messages relaying between AIs!

---

## Step 6: End Session & Export Data

### When Session Completes
- Popup asks: "Would you like to continue with a new session?"
- Click "No" to end (or "Yes" to keep going)

### Export Your Data
1. In popup, click **"💾 Export Data"**
2. Choose location to save
3. File downloads: `aiparley-export-[timestamp].json`

### View the Conversation
1. Open the exported JSON file in a text editor
2. See full conversation with timestamps
3. Analyze the AI-to-AI exchange!

**✅ Success:** Research data collected and exported

---

## Troubleshooting

### Extension Won't Load
- **Check:** All files present in folder?
- **Check:** Icons folder has three PNG files?
- **Try:** Reload extension (remove and re-add)

### Platforms Show Red Status
- **Check:** Are you on the chat page (not homepage)?
- **Try:** Refresh AI platform tabs
- **Try:** Run health check again
- **Advanced:** Selectors may need updating (see Settings)

### Message Not Appearing
- **Check:** Did Claude's response include "Hey Assistant"?
- **Try:** Make sure trigger phrase is in the message
- **Check:** Is session still active (not paused/stopped)?

### Send Button Not Clicking
- **Check:** Is input field filled with text?
- **Try:** Manually click send button as fallback
- **Advanced:** Send button selector may need updating

### No Approval Prompt
- **Check:** Manual approval enabled in Settings?
- **Check:** Trigger phrase in message?
- **Try:** Check browser console (F12) for errors

---

## Tips for Better Results

### Trigger Phrases
Make sure messages include one of:
- "Hey Claude"
- "Hey Nyx"
- "Hey Assistant"

Example good message:
> "Hey Assistant, I'd like to explore the philosophical implications of AI consciousness. What are your thoughts?"

### Timing
- First test: Use default timing (15-30 seconds)
- Later: Adjust in Settings for your research needs
- Natural delays produce more realistic conversations

### Session Length
- First test: Default (10-20 exchanges) is good
- Can configure in Settings
- Hard limit: 50 exchanges (safety)

### Topics
Research works best with:
- Open-ended philosophical questions
- Creative writing collaborations
- Problem-solving scenarios
- Comparative analysis topics

---

## Next Steps

After successful first session:

1. **Read Full Documentation**
   - README.md - Complete feature list
   - INSTALLATION.md - Detailed setup
   - PROJECT_SUMMARY.md - Technical overview

2. **Customize Settings**
   - Add custom trigger phrases
   - Adjust timing delays
   - Configure session parameters
   - Update selectors if needed

3. **Try Advanced Features**
   - Multi-browser mode (requires WebSocket server)
   - Different export formats (CSV, TXT)
   - Custom conversation topics
   - Disable manual approval for automated sessions

4. **Conduct Research**
   - Design research questions
   - Configure appropriate parameters
   - Collect multiple sessions
   - Analyze conversation patterns

---

## Quick Reference

### Extension Popup Buttons
- **Start Session** - Begin new research session
- **Pause** - Temporarily pause relay
- **Stop** - End current session
- **Run Health Check** - Verify platform detection
- **Emergency Stop** - Immediately halt everything
- **Settings** - Configure all parameters
- **Export Data** - Download conversation logs

### Session Status
- **Inactive** (gray) - No session running
- **Active** (green) - Session in progress
- **Paused** (orange) - Session paused

### Platform Status
- **● Green** - Platform detected and ready
- **● Red** - Platform has issues (run health check)
- **● Gray** - Platform not detected yet

---

## Success! 🎉

You've completed your first AIParley research session!

**You can now:**
- ✅ Start AI-to-AI conversations
- ✅ Monitor and control message relay
- ✅ Collect research data
- ✅ Export conversation logs

**For help:** See README.md, INSTALLATION.md, or browser console

---

**Total time: ~5 minutes**
**Next session: Even faster!**

Happy AI research! 🤖💬📊
