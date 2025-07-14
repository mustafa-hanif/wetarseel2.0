const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://vxgv2qg8ae.execute-api.me-central-1.amazonaws.com/dev';

console.log('Testing WebSocket connection to:', WEBSOCKET_URL);

const ws = new WebSocket(`${WEBSOCKET_URL}?userId=test-user-123`);

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened successfully!');
  
  // Send a test message
  const testMessage = {
    action: 'message',
    data: 'Hello from test client!'
  };
  
  console.log('Sending test message:', testMessage);
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close(code, reason) {
  console.log('🔌 WebSocket connection closed:', code, reason.toString());
});

// Close connection after 5 seconds
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
}, 5000);
