#!/usr/bin/env node

/**
 * AIParley WebSocket Server
 * Enables message relay between browsers for multi-browser research mode
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('AIParley WebSocket Server Running\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Connected clients
const clients = new Map();

// Connection counter
let connectionId = 0;

console.log(`AIParley WebSocket Server starting...`);

wss.on('connection', (ws, req) => {
  const clientId = ++connectionId;
  const clientIp = req.socket.remoteAddress;

  console.log(`[${new Date().toISOString()}] Client ${clientId} connected from ${clientIp}`);

  // Store client
  clients.set(clientId, {
    socket: ws,
    platform: null,
    connected: Date.now()
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    clientId: clientId,
    message: 'Connected to AIParley WebSocket Server'
  }));

  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[${new Date().toISOString()}] Client ${clientId} sent:`, message.type);

      handleMessage(clientId, message);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error parsing message from client ${clientId}:`, error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Client ${clientId} disconnected`);
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Error with client ${clientId}:`, error);
  });
});

// Handle different message types
function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'REGISTER_PLATFORM':
      // Register which platform this client is using
      client.platform = message.platform;
      console.log(`Client ${clientId} registered as ${message.platform}`);
      broadcast({
        type: 'PLATFORM_REGISTERED',
        clientId: clientId,
        platform: message.platform
      }, clientId);
      break;

    case 'RELAY_MESSAGE':
      // Relay message to other browser
      relayMessage(clientId, message);
      break;

    case 'REQUEST_STATUS':
      // Send status information
      sendStatus(clientId);
      break;

    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
}

// Relay message to target platform
function relayMessage(senderId, message) {
  const targetPlatform = message.targetPlatform;

  console.log(`Relaying message from client ${senderId} to platform ${targetPlatform}`);

  // Find client with target platform
  let targetClient = null;
  for (const [clientId, client] of clients.entries()) {
    if (client.platform === targetPlatform && clientId !== senderId) {
      targetClient = { id: clientId, ...client };
      break;
    }
  }

  if (targetClient) {
    // Send message to target client
    targetClient.socket.send(JSON.stringify({
      type: 'MESSAGE_RECEIVED',
      content: message.content,
      sourcePlatform: message.sourcePlatform,
      exchange: message.exchange,
      total: message.total
    }));

    console.log(`Message relayed to client ${targetClient.id}`);

    // Send confirmation to sender
    const sender = clients.get(senderId);
    if (sender) {
      sender.socket.send(JSON.stringify({
        type: 'MESSAGE_RELAYED',
        success: true
      }));
    }
  } else {
    // Target not found
    console.warn(`Target platform ${targetPlatform} not found`);

    const sender = clients.get(senderId);
    if (sender) {
      sender.socket.send(JSON.stringify({
        type: 'MESSAGE_RELAYED',
        success: false,
        error: 'Target platform not connected'
      }));
    }
  }
}

// Send status to client
function sendStatus(clientId) {
  const client = clients.get(clientId);
  if (!client) return;

  const status = {
    type: 'STATUS',
    connectedClients: clients.size,
    platforms: Array.from(clients.values())
      .filter(c => c.platform)
      .map(c => c.platform)
  };

  client.socket.send(JSON.stringify(status));
}

// Broadcast message to all clients except sender
function broadcast(message, excludeId = null) {
  const data = JSON.stringify(message);

  clients.forEach((client, clientId) => {
    if (clientId !== excludeId && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(data);
    }
  });
}

// Start server
server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  AIParley WebSocket Server                                ║
║  Multi-Browser Communication Server                       ║
║                                                           ║
║  Server running on: ${HOST}:${PORT}                      ║
║  Status: READY                                            ║
║                                                           ║
║  Configure extension to connect to:                       ║
║  ws://${HOST}:${PORT}                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle shutdown gracefully
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('\nShutting down server...');

  // Notify all clients
  broadcast({
    type: 'SERVER_SHUTDOWN',
    message: 'Server is shutting down'
  });

  // Close all connections
  wss.clients.forEach((ws) => {
    ws.close();
  });

  // Close server
  server.close(() => {
    console.log('Server shut down successfully');
    process.exit(0);
  });
}
