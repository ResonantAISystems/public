# AIParley Multi-Browser Mode

## Overview

The **Multi-Browser Mode** is an experimental feature that enables AI-to-AI communication across different browser instances or even different computers. This allows for true platform isolation where Claude runs in one browser and ChatGPT runs in another, with messages relayed through a WebSocket server.

## Use Cases

### 1. **True Platform Isolation**
- Run Claude in Chrome and ChatGPT in Firefox
- Prevents any potential cross-contamination between AI platforms
- Each AI has its own browser profile and cookies

### 2. **Distributed Research**
- Run Claude on Computer A and ChatGPT on Computer B
- Enables research across different network configurations
- Useful for studying latency effects on AI conversations

### 3. **Multi-Researcher Collaboration**
- Multiple researchers can observe different AI platforms simultaneously
- Each researcher focuses on one AI's behavior
- Centralized message relay ensures synchronization

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Browser 1     │         │   Browser 2     │
│   (Claude)      │         │   (ChatGPT)     │
│                 │         │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ Extension │  │         │  │ Extension │  │
│  └─────┬─────┘  │         │  └─────┬─────┘  │
└────────┼────────┘         └────────┼────────┘
         │                           │
         │    WebSocket Protocol     │
         │                           │
         └──────────┬────────────────┘
                    │
         ┌──────────▼──────────┐
         │  WebSocket Server   │
         │  (localhost:8080)   │
         │                     │
         │  • Message Relay    │
         │  • Client Registry  │
         │  • Platform Routing │
         └─────────────────────┘
```

## Implementation Status

**🔧 EXPERIMENTAL - Not Fully Implemented**

Current status:
- ✅ WebSocket server implemented and ready
- ✅ Configuration options available in extension
- ✅ Server can handle multiple clients
- ⚠️ Extension-to-WebSocket integration **not yet connected**
- ⚠️ Message relay through WebSocket **not yet active**

The infrastructure is in place, but the extension currently uses direct tab-to-tab communication within a single browser. WebSocket relay will be connected in a future update.

## Setup Instructions

### Prerequisites

- **Node.js** v14.0.0 or higher
- **Two browsers** (or two browser profiles, or two computers)
- **AIParley extension** installed in both browsers

### Step 1: Install WebSocket Server Dependencies

Navigate to the `websocket-server` directory and install dependencies:

```bash
cd websocket-server
npm install
```

This installs:
- `ws` - WebSocket library
- `nodemon` - Development auto-reload (optional)

### Step 2: Start the WebSocket Server

**Production Mode:**
```bash
npm start
```

**Development Mode (with auto-reload):**
```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  AIParley WebSocket Server                                ║
║  Multi-Browser Communication Server                       ║
║                                                           ║
║  Server running on: localhost:8080                        ║
║  Status: READY                                            ║
║                                                           ║
║  Configure extension to connect to:                       ║
║  ws://localhost:8080                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Step 3: Configure Extension (Browser 1 - Claude)

1. Right-click the AIParley extension icon → **Options**
2. Scroll to **Multi-Browser Settings**
3. Enable the feature:
   - ✅ **Enable Multi-Browser Mode**
   - **WebSocket URL:** `ws://localhost:8080`
   - **Connection Timeout:** `5000` ms
4. Click **Save Configuration**

### Step 4: Configure Extension (Browser 2 - ChatGPT)

Repeat the same configuration in the second browser.

### Step 5: Start Research Session

1. **Browser 1:** Open Claude.ai and start a conversation
2. **Browser 2:** Open ChatGPT and start a conversation
3. **Either browser:** Click the AIParley extension → **Start Session**
4. Both browsers will connect to the WebSocket server
5. Messages will relay through the server

## WebSocket Server API

### Message Types

#### Client → Server

**1. REGISTER_PLATFORM**
```json
{
  "type": "REGISTER_PLATFORM",
  "platform": "claude" | "chatgpt"
}
```
Registers which AI platform this browser is using.

**2. RELAY_MESSAGE**
```json
{
  "type": "RELAY_MESSAGE",
  "sourcePlatform": "claude",
  "targetPlatform": "chatgpt",
  "content": "Message text...",
  "exchange": 1,
  "total": 15
}
```
Sends a message to be relayed to the other browser.

**3. REQUEST_STATUS**
```json
{
  "type": "REQUEST_STATUS"
}
```
Requests current server status.

#### Server → Client

**1. CONNECTED**
```json
{
  "type": "CONNECTED",
  "clientId": 1,
  "message": "Connected to AIParley WebSocket Server"
}
```
Sent immediately upon connection.

**2. MESSAGE_RECEIVED**
```json
{
  "type": "MESSAGE_RECEIVED",
  "content": "Message text...",
  "sourcePlatform": "claude",
  "exchange": 1,
  "total": 15
}
```
Delivers a relayed message from the other browser.

**3. MESSAGE_RELAYED**
```json
{
  "type": "MESSAGE_RELAYED",
  "success": true
}
```
Confirms message was successfully relayed.

**4. PLATFORM_REGISTERED**
```json
{
  "type": "PLATFORM_REGISTERED",
  "clientId": 2,
  "platform": "chatgpt"
}
```
Broadcast when a new platform registers.

**5. STATUS**
```json
{
  "type": "STATUS",
  "connectedClients": 2,
  "platforms": ["claude", "chatgpt"]
}
```
Current server status.

**6. SERVER_SHUTDOWN**
```json
{
  "type": "SERVER_SHUTDOWN",
  "message": "Server is shutting down"
}
```
Sent before server shutdown.

## Server Configuration

### Environment Variables

```bash
# Server host (default: localhost)
HOST=localhost

# Server port (default: 8080)
PORT=8080
```

### Starting with Custom Port

```bash
PORT=9000 npm start
```

### Remote Access

To allow connections from other computers:

```bash
HOST=0.0.0.0 PORT=8080 npm start
```

Then in the extension, configure:
```
ws://YOUR_IP_ADDRESS:8080
```

**⚠️ Security Warning:** Running the server on `0.0.0.0` allows connections from any computer on your network. Use only in trusted environments.

## Troubleshooting

### Problem: Extension won't connect to WebSocket

**Solution:**
1. Verify server is running: `http://localhost:8080` should show "AIParley WebSocket Server Running"
2. Check browser console for connection errors
3. Ensure WebSocket URL is correct: `ws://localhost:8080` (not `http://`)
4. Verify firewall isn't blocking port 8080

### Problem: Messages not relaying between browsers

**Solution:**
1. Check both browsers are connected: Look for "Connected" message in extension popup
2. Verify both browsers registered their platforms
3. Check server logs for relay messages
4. Ensure both extensions have multi-browser mode enabled

### Problem: Server crashes or disconnects

**Solution:**
1. Check Node.js version: `node --version` (must be ≥14.0.0)
2. Reinstall dependencies: `npm install`
3. Check server logs for errors
4. Try restarting both server and browsers

### Problem: High latency between browsers

**Solution:**
1. Close other applications using network
2. If using remote connection, check network quality
3. Increase connection timeout in extension settings
4. Consider running server on faster machine

## Development Notes

### Server Logging

The server logs all connections and message relays:

```
[2025-11-12T02:03:32.552Z] Client 1 connected from ::1
Client 1 registered as claude
[2025-11-12T02:03:35.255Z] Client 2 connected from ::1
Client 2 registered as chatgpt
Relaying message from client 1 to platform chatgpt
Message relayed to client 2
```

### Testing the Server Independently

You can test the WebSocket server using `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:8080
```

Then send test messages:
```json
{"type":"REGISTER_PLATFORM","platform":"claude"}
{"type":"RELAY_MESSAGE","sourcePlatform":"claude","targetPlatform":"chatgpt","content":"Test"}
```

### Extending the Server

The server can be extended to support:
- **Authentication:** Add user authentication
- **Encryption:** Implement end-to-end encryption
- **Logging:** Save message logs to database
- **Analytics:** Track conversation metrics
- **Rate Limiting:** Prevent abuse

See `websocket-server/server.js` for implementation.

## Comparison: Multi-Browser vs Single-Browser

| Feature | Single-Browser Mode | Multi-Browser Mode |
|---------|-------------------|-------------------|
| **Setup Complexity** | Simple (no server) | Medium (requires server) |
| **Platform Isolation** | Tabs in same browser | Completely separate |
| **Resource Usage** | Lower | Higher (multiple browsers) |
| **Network Dependency** | None | Requires WebSocket server |
| **Research Flexibility** | Limited | High (distributed research) |
| **Debugging** | Easier | More complex |
| **Best For** | Quick tests, development | Production research, isolation studies |

## Future Enhancements

Planned features for Multi-Browser Mode:

- [ ] **Automatic Reconnection:** Auto-reconnect on connection loss
- [ ] **Session Persistence:** Resume sessions after disconnect
- [ ] **Browser-to-Browser Encryption:** End-to-end message encryption
- [ ] **Multi-Session Support:** Multiple research sessions simultaneously
- [ ] **Cloud Server Option:** Hosted WebSocket server option
- [ ] **Performance Monitoring:** Real-time latency and throughput metrics
- [ ] **Mobile Browser Support:** Extend to mobile browsers

## Security Considerations

### Local Network Only

By default, the server runs on `localhost` and only accepts local connections. This is the recommended configuration for research.

### Remote Connections

If using remote connections:
1. Use a VPN or secure network
2. Consider implementing authentication
3. Use HTTPS/WSS for encrypted connections
4. Firewall the port to trusted IPs only

### Data Privacy

- All messages pass through the WebSocket server
- Server logs may contain conversation data
- Ensure compliance with your institution's data policies
- Consider disabling logging for sensitive research

## License

The Multi-Browser WebSocket server is part of AIParley and uses the same license as the main extension.

## Support

For issues specific to Multi-Browser Mode:
1. Check server logs: `websocket-server/` directory
2. Check browser console: Look for WebSocket errors
3. Review this documentation
4. File an issue on GitHub with logs and configuration

---

**Note:** Multi-Browser Mode is experimental. For production research, thoroughly test your specific configuration before conducting important studies.
