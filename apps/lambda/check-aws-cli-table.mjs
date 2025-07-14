#!/usr/bin/env bun

import { DynamoDBClient, ListTablesCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

console.log('Testing if Node.js SDK can see AWS CLI created table...');

const client = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
  }
});

try {
  // List all tables
  const listCommand = new ListTablesCommand({});
  const listResult = await client.send(listCommand);
  
  console.log('\nTables visible to Node.js SDK:');
  console.log(listResult.TableNames || []);
  
  // Check if CliTestTable is visible
  if (listResult.TableNames?.includes('CliTestTable')) {
    console.log('\n✅ CliTestTable is visible to Node.js SDK!');
    
    // Try to scan it
    const scanCommand = new ScanCommand({
      TableName: 'CliTestTable'
    });
    
    const scanResult = await client.send(scanCommand);
    console.log('\nData in CliTestTable (via Node.js SDK):');
    console.log(JSON.stringify(scanResult.Items, null, 2));
  } else {
    console.log('\n❌ CliTestTable is NOT visible to Node.js SDK');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
