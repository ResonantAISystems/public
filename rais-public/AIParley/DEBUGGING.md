# AIParley Debugging Guide

## 🐛 Comprehensive Debugging System

AIParley now includes extensive debugging capabilities to help you understand exactly what's happening during AI-to-AI communication sessions.

---

## Debug Console (In Extension Popup)

### Opening the Debug Console

1. Click the AIParley extension icon
2. Click the **"🐛 Debug Console"** button at the bottom
3. A dark console will appear showing real-time debug information

### What You'll See

**Session State Panel:**
- Current session status (Active/Inactive/Paused)
- Exchange progress (e.g., "Exchange 3/15")
- Whether manual approval is required

**Last Event:**
- The most recent event that occurred
- Timestamp of the event

**Pending Message:**
- Shows if there's a message waiting to be relayed
- Source and target platforms

**Tab Info:**
- Which browser tab IDs are registered for Claude and ChatGPT

**Event Log:**
- Scrollable list of all events (most recent first)
- Color-coded by type:
  - 🟢 Green: Success events
  - 🔵 Blue: Info events
  - 🟡 Yellow: Warning events
  - 🔴 Red: Error events

---

## Browser Console Logging

### Where to Check Console Logs

**Background Service Worker:**
1. Go to `chrome://extensions/`
2. Find AIParley
3. Click "service worker" link
4. Console opens showing background logs

**Claude.ai Tab:**
1. Open Claude.ai tab
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for `[Claude]` prefixed messages

**ChatGPT Tab:**
1. Open ChatGPT tab
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for `[ChatGPT]` prefixed messages

**Extension Popup:**
1. Right-click extension icon → "Inspect popup"
2. Console opens showing popup logs
3. Look for `[AIParley Debug]` messages

---

## Key Log Messages & What They Mean

### Background Service Worker

```
🚀 START_SESSION called
- Session is being started
- Check: Did you click Start Session?

✅ Session started: session_123456
- Session initialized successfully
- Shows session ID and total exchanges

📨 Received message: MESSAGE_EXTRACTED
- Background received a message from content script
- Check: Which platform sent it?

💬 Message extracted from claude/chatgpt
- Shows message preview and length
- Check: Is the message what you expected?

🔍 Checking for trigger phrases
- Looking for "Hey Claude", "Hey Assistant", etc.
- Shows which phrases being searched for

❌ No trigger phrase found - ignoring message
- Message doesn't contain trigger phrase
- Check: Did you include the trigger phrase?

✅ Trigger phrase FOUND!
- Message contains trigger phrase and will be processed

📦 Message prepared for relay
- Shows source and target platforms
- Shows if manual approval required

⏸️ Manual approval required - sending to popup
- Waiting for you to approve in popup

⏱️ Auto-relay enabled - scheduling relay
- Will relay automatically after delay

📤 Relaying message (Exchange X/Y)
- Message is being sent to target platform

🔍 Target tab lookup
- Searching for target platform tab
- Shows tab IDs found

❌ Target platform tab not found!
- Can't find tab for target platform
- Check: Is the platform tab still open?

🔄 Switching to target tab
- Activating the target platform tab

💉 Sending INJECT_MESSAGE to content script
- Sending message to content script to inject

✅ Message sent to content script successfully
- Content script received the message

❌ Error sending message to content script
- Failed to send to content script
- Check: Is content script loaded? Refresh page.

🏁 Session complete!
- All exchanges finished
```

### Claude Content Script

```
[Claude] 🚀 Session started - beginning monitoring
- Content script activated for session

[Claude] 👀 Starting response monitoring
- MutationObserver started
- Will watch for AI responses

[Claude] 📝 Found X completed response(s)
- Detected completed AI response(s)

[Claude] 🔍 Checking response element for message
- Examining response for message text

[Claude] 📄 Message text extracted
- Shows message length and preview

[Claude] 🔍 Checking for trigger phrases
- Shows which phrases being searched

[Claude] ✅ TRIGGER PHRASE DETECTED! Sending to background
- Found trigger phrase, sending to background

[Claude] ❌ No trigger phrase found in message
- Message doesn't contain trigger

[Claude] ⏭️ Message already processed, skipping
- Prevents duplicate processing

[Claude] ⚠️ Message container not found in response
- Can't find message text in DOM
- Check: Did selectors change?
```

### ChatGPT Content Script

Similar to Claude, but prefixed with `[ChatGPT]`

---

## Debugging Common Issues

### Issue: Session Goes Inactive Immediately

**Check Debug Console:**
- Look for "Session started" message
- Check if it shows "Active" status

**Check Browser Console (Background):**
```
Expected: 🚀 START_SESSION called
Expected: ✅ Session started: session_123456

If missing: Start Session button not working
If present but goes inactive: Check for errors after
```

### Issue: Messages Not Being Detected

**Check Browser Console (Claude/ChatGPT tab):**
```
Expected: [Claude] 👀 Starting response monitoring
Expected: [Claude] 📝 Found X completed response(s)
Expected: [Claude] 🔍 Checking response element
Expected: [Claude] 📄 Message text extracted
Expected: [Claude] 🔍 Checking for trigger phrases

Missing "Found completed responses"?
→ Selectors may be wrong, response not marked as complete

Missing "Message text extracted"?
→ Message text selector is wrong

"No trigger phrase found"?
→ Your message doesn't contain "Hey Claude" etc.
```

### Issue: Messages Not Being Relayed

**Check Background Console:**
```
Expected: ✅ Trigger phrase FOUND!
Expected: 📦 Message prepared for relay
Expected: 📤 Relaying message

Stopped at "prepared for relay"?
→ Check if manual approval is enabled
→ Look for approval prompt in popup

"Target platform tab not found"?
→ Platform tab closed or not detected
→ Reopen tab and run health check

"Error sending message to content script"?
→ Content script not loaded
→ Refresh the target platform page
```

### Issue: Message Injection Not Working

**Check Target Platform Console (ChatGPT/Claude):**
```
Expected: Received: INJECT_MESSAGE
Expected: Injecting message into [platform] input

Check for selector errors:
- "Input field not found"
- "Send button not found or disabled"
```

---

## Step-by-Step Debugging Workflow

### 1. Start Fresh
```bash
1. Reload extension (chrome://extensions/ → Reload button)
2. Refresh both Claude and ChatGPT tabs
3. Run Health Check
4. Open Debug Console
```

### 2. Start Session
```bash
1. Click Start Session
2. Check Debug Console - should show "Active"
3. Check Background Console - should show "Session started"
4. Check Platform Consoles - should show "Session started"
```

### 3. Send Test Message
```bash
1. In Claude, type: "Hey Assistant, this is a test"
2. Send the message
3. Wait for Claude to respond
```

### 4. Monitor Detection
```bash
1. Watch Claude Console for:
   - "Found completed response"
   - "Message text extracted"
   - "Checking for trigger phrases"
   - "TRIGGER PHRASE DETECTED" ← KEY!

2. Watch Background Console for:
   - "Received message: MESSAGE_EXTRACTED"
   - "Message extracted from claude"
   - "Trigger phrase FOUND"
   - "Message prepared for relay"
```

### 5. Monitor Relay (if approved)
```bash
1. Watch Background Console for:
   - "Relaying message"
   - "Target tab lookup" (should find ChatGPT tab)
   - "Switching to target tab"
   - "Sending INJECT_MESSAGE"
   - "Message sent successfully"

2. Watch ChatGPT Console for:
   - "Received: INJECT_MESSAGE"
   - "Injecting message"
```

### 6. Identify Where It Fails
```bash
The logs will show you EXACTLY where the process stops.

Examples:
- Stops at "Checking for trigger phrases" + "No trigger phrase found"
  → Add trigger phrase to your message

- Stops at "Target tab lookup" + "not found"
  → ChatGPT tab closed or not detected

- Stops at "Injecting message" + "Input field not found"
  → Selector is wrong, update in Settings
```

---

## Debug Console Features

### Auto-Refresh
- Updates every second while open
- Shows real-time session state
- No need to manually refresh

### Event Log
- Stores last 100 events
- Most recent events at top
- Automatically scrolls to show new events

### Clear Button
- Clears event log
- Useful for starting fresh
- Doesn't affect actual session

### Close Debug Console
- Click "Debug Console" button again
- Console hides but keeps collecting events
- Events will be there when you reopen

---

## Advanced Debugging Tips

### 1. Use Multiple Console Windows
Open all consoles simultaneously:
- Background worker console
- Claude tab console (F12)
- ChatGPT tab console (F12)
- Popup debug console
- Arrange windows side-by-side
- Watch events flow through system in real-time

### 2. Check Selector Accuracy
In platform console (F12):
```javascript
// Test Claude selectors
window.aiParley.runHealthCheck()

// Manually check selectors
document.querySelector('[data-testid="chat-input"]') // Should find input
document.querySelectorAll('[data-is-streaming="false"]') // Should find responses
```

### 3. Monitor Storage
In background console:
```javascript
// Check stored tabs
chrome.storage.local.get('platformTabs', console.log)

// Check config
chrome.storage.local.get('config', console.log)

// Check session logs
chrome.storage.local.get('conversationLogs', console.log)
```

### 4. Test Message Detection Manually
In Claude/ChatGPT console:
```javascript
// Get trigger phrases
chrome.storage.local.get('config', (r) => console.log(r.config.triggerPhrases))

// Test if your message would be detected
const message = "Hey Assistant, this is a test";
const triggers = ["Hey Claude", "Hey Assistant"];
console.log("Would detect:", triggers.some(t => message.includes(t)))
```

---

## Common Debug Patterns

### Pattern: "Silent Failure"
No errors, but nothing happens:
- Check if session is actually active (Debug Console)
- Check if monitoring started (Platform Console)
- Check if config loaded (Background Console logs)

### Pattern: "Works Once, Then Stops"
First message relays, then nothing:
- Check exchange counter (Debug Console)
- Check if session completed
- Check if paused
- Look for "Session complete" message

### Pattern: "Detects But Doesn't Relay"
Messages detected but not sent:
- Check manual approval setting
- Look for approval prompt in popup
- Check if pending message exists (Debug Console)
- Check target tab is still open

---

## Getting Help

When reporting issues, provide:
1. Screenshot of Debug Console
2. Copy of Background Console logs
3. Copy of Platform Console logs (Claude/ChatGPT)
4. Description of what you expected vs. what happened
5. Exact message you sent (with trigger phrase)

This makes debugging much faster!

---

## Summary

The debugging system provides complete visibility into:
- ✅ Session lifecycle (start, active, paused, stopped)
- ✅ Message detection (what's being found)
- ✅ Trigger phrase matching (what's being searched)
- ✅ Message relay process (every step)
- ✅ Tab management (which tabs are registered)
- ✅ Error conditions (what went wrong)

**The debug console and browser console logs will tell you exactly where and why things are failing.**

Happy debugging! 🐛🔍
