#!/usr/bin/env bun

import { onconnect, ondisconnect, onmessage, ondefault } from "./handler.ts";

const port = 3001;

interface WebSocketData {
  connectionId: string;
}

console.log(`🚀 Starting WebSocket server on port ${port}...`);
console.log(`📡 Connect to: ws://localhost:${port}`);

const server = Bun.serve({
  port,
  fetch(req, server) {
    // Handle WebSocket upgrade
    if (server.upgrade(req)) {
      return; // Bun automatically returns 101 Switching Protocols
    }

    // Handle HTTP requests (for health check, etc.)
    return new Response("WebSocket Server Running", {
      headers: { "Content-Type": "text/plain" },
    });
  },

  websocket: {
    async open(ws) {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store connection ID in the WebSocket
      ws.data = { connectionId } as WebSocketData;

      console.log(`✅ Client connected: ${connectionId}`);

      // Create WebSocket event for onconnect
      const connectEvent = {
        requestContext: {
          connectionId,
          routeKey: "$connect",
          eventType: "CONNECT",
          domainName: "localhost",
          stage: "local",
        },
        queryStringParameters: {
          userId: "test-user-" + Date.now(), // Generate a test user ID
        },
        headers: {
          Host: "localhost:3001",
        },
      };

      try {
        const result = await onconnect(connectEvent);
        console.log(`📝 Connect handler result:`, result);

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: "connection",
            connectionId,
            message: "Connected successfully",
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error(`❌ Connect handler error:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Connection failed",
            error: errorMessage,
          })
        );
      }
    },

    async message(ws, message) {
      const { connectionId } = ws.data as WebSocketData;
      const messageStr =
        typeof message === "string" ? message : message.toString();
      console.log(`📨 Message from ${connectionId}:`, messageStr);

      let parsedMessage;
      try {
        parsedMessage = JSON.parse(messageStr);
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid JSON format",
          })
        );
        return;
      }

      // Create WebSocket event for onmessage
      const messageEvent = {
        requestContext: {
          connectionId,
          routeKey: parsedMessage.action || "$default",
          eventType: "MESSAGE",
          domainName: "localhost",
          stage: "local",
        },
        body: JSON.stringify(parsedMessage),
        headers: {
          Host: "localhost:3001",
        },
      };

      try {
        let result;

        // Route to appropriate handler based on action
        switch (parsedMessage.action) {
          case "sendMessage":
            result = await onmessage(messageEvent);
            break;
          default:
            result = await ondefault(messageEvent);
            break;
        }

        console.log(`📤 Handler result:`, result);

        // Send response back to client
        ws.send(
          JSON.stringify({
            type: "response",
            action: parsedMessage.action || "default",
            result: result,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error(`❌ Message handler error:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Handler execution failed",
            error: errorMessage,
          })
        );
      }
    },

    async close(ws) {
      const { connectionId } = ws.data as WebSocketData;
      console.log(`👋 Client disconnected: ${connectionId}`);

      // Create WebSocket event for ondisconnect
      const disconnectEvent = {
        requestContext: {
          connectionId,
          routeKey: "$disconnect",
          eventType: "DISCONNECT",
          domainName: "localhost",
          stage: "local",
        },
        headers: {
          Host: "localhost:3001",
        },
      };

      try {
        const result = await ondisconnect(disconnectEvent);
        console.log(`📝 Disconnect handler result:`, result);
      } catch (error) {
        console.error(`❌ Disconnect handler error:`, error);
      }
    },
  },
});

console.log(`✅ WebSocket server started!`);
console.log(`📋 Available endpoints:`);
console.log(`   • WebSocket: ws://localhost:${port}`);
console.log(`   • Health check: http://localhost:${port}`);
console.log(`\n🧪 Test with:`);
console.log(`   • Browser: Open developer console and connect`);
console.log(`   • wscat: wscat -c ws://localhost:${port}`);
console.log(`\n📝 Send messages like:`);
console.log(`   {"action": "sendMessage", "data": "Hello WebSocket!"}`);
