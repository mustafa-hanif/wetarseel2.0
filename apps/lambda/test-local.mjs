#!/usr/bin/env bun

// IMPORTANT: Set environment BEFORE any imports
process.env.ENVIRONMENT = 'dev';
process.env.DYNAMODB_TABLE_NAME = 'WeTable';

// Simple test script for Lambda functions
import { onconnect, ondisconnect, onmessage, ondefault } from './handler.ts';

// Mock WebSocket events
const mockConnectEvent = {
  requestContext: {
    connectionId: 'test-connection-123',
    domainName: 'localhost',
    stage: 'dev'
  },
  queryStringParameters: {
    userId: 'test-user-456'
  }
};

const mockDisconnectEvent = {
  requestContext: {
    connectionId: 'test-connection-123'
  }
};

const mockMessageEvent = {
  requestContext: {
    connectionId: 'test-connection-123',
    domainName: 'localhost',
    stage: 'dev'
  },
  body: JSON.stringify({ type: 'hello', message: 'Hello World!' })
};

async function testLambdas() {
  console.log('🧪 Testing Lambda functions locally...\n');
  
  try {
    // Test onconnect
    console.log('📱 Testing onconnect...');
    const connectResult = await onconnect(mockConnectEvent);
    console.log('✅ Connect result:', connectResult);
    
    // Test onmessage
    console.log('\n💬 Testing onmessage...');
    const messageResult = await onmessage(mockMessageEvent);
    console.log('✅ Message result:', messageResult);
    
    // Test ondefault
    console.log('\n🔧 Testing ondefault...');
    const defaultResult = await ondefault(mockMessageEvent);
    console.log('✅ Default result:', defaultResult);
    
    // Test ondisconnect
    console.log('\n📱 Testing ondisconnect...');
    const disconnectResult = await ondisconnect(mockDisconnectEvent);
    console.log('✅ Disconnect result:', disconnectResult);
    
  } catch (error) {
    console.error('❌ Error testing:', error);
  }
}

// Set environment for testing
process.env.ENVIRONMENT = 'dev';
process.env.DYNAMODB_TABLE_NAME = 'WeTable';

testLambdas();
