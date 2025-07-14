#!/usr/bin/env bun

import { DynamoDBClient, CreateTableCommand, PutItemCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";

console.log('🔧 Creating test data directly for SQL Workbench...\n');

const client = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'yvwy23',
    secretAccessKey: 'e9y2t'
  }
});

try {
  // Create the WeTable manually
  console.log('📝 Creating WeTable...');
  
  const createTableCommand = new CreateTableCommand({
    TableName: 'WeTable',
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });
  
  await client.send(createTableCommand);
  console.log('✅ WeTable created successfully');
  
  // Add some test data
  console.log('📝 Adding test connection data...');
  
  const putConnectionCommand = new PutItemCommand({
    TableName: 'WeTable',
    Item: {
      pk: { S: 'CONNECTION#test-connection-123' },
      sk: { S: 'CONNECTION#test-connection-123' },
      connectionId: { S: 'test-connection-123' },
      connectedAt: { S: new Date().toISOString() },
      userId: { S: 'test-user-456' },
      domain: { S: 'localhost' },
      stage: { S: 'dev' }
    }
  });
  
  await client.send(putConnectionCommand);
  console.log('✅ Connection data added');
  
  console.log('📝 Adding test user connection data...');
  
  const putUserConnectionCommand = new PutItemCommand({
    TableName: 'WeTable',
    Item: {
      pk: { S: 'USER#test-user-456' },
      sk: { S: 'USER#test-user-456' },
      id: { S: 'test-user-456' },
      userId: { S: 'test-user-456' },
      connectionId: { S: 'test-connection-123' }
    }
  });
  
  await client.send(putUserConnectionCommand);
  console.log('✅ User connection data added');
  
  // Verify tables exist
  const listCommand = new ListTablesCommand({});
  const result = await client.send(listCommand);
  
  console.log('\n📋 Final verification:');
  console.log(`Tables: ${result.TableNames?.join(', ') || 'None'}`);
  
  console.log('\n🎯 SQL Workbench should now see:');
  console.log('   • WeTable with 2 test records');
  console.log('   • Connection: test-connection-123');
  console.log('   • User: test-user-456');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
