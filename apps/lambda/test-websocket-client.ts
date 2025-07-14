#!/usr/bin/env bun

console.log("🧪 Testing WebSocket Lambda functions...\n");

const ws = new WebSocket(
  "wss://vxgv2qg8ae.execute-api.me-central-1.amazonaws.com/dev"
);
// const ws = new WebSocket("ws://localhost:3001");

ws.onopen = () => {
  console.log("✅ Connected to WebSocket server");

  // Test sending a message after connection
  setTimeout(() => {
    console.log("📤 Sending test message...");
    ws.send(
      JSON.stringify({
        action: "sendMessage",
        data: "Hello from test client!",
        timestamp: new Date().toISOString(),
      })
    );
  }, 1000);

  // Test default route
  setTimeout(() => {
    console.log("📤 Sending default message...");
    ws.send(
      JSON.stringify({
        action: "unknown",
        data: "This should go to default handler",
      })
    );
  }, 2000);

  // Close after tests
  setTimeout(() => {
    console.log("👋 Closing connection...");
    ws.close();
  }, 3000);
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("📨 Received:", JSON.stringify(data, null, 2));
};

ws.onclose = () => {
  console.log("🔌 Connection closed");
  process.exit(0);
};

ws.onerror = (error) => {
  console.error("❌ WebSocket error:", error);
  process.exit(1);
};
