#!/usr/bin/env bun

import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

console.log('🔍 Verifying DynamoDB Local for SQL Workbench connection...\n');

// Use EXACT same config as your Lambda functions
const client = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
  }
});

try {
  // Test connection
  console.log('✅ Testing connection...');
  const listCommand = new ListTablesCommand({});
  const listResult = await client.send(listCommand);
  
  console.log(`📋 Found ${listResult.TableNames?.length || 0} tables:`);
  
  if (listResult.TableNames && listResult.TableNames.length > 0) {
    for (const tableName of listResult.TableNames) {
      console.log(`   • ${tableName}`);
      
      // Get table details
      try {
        const describeCommand = new DescribeTableCommand({ TableName: tableName });
        const tableInfo = await client.send(describeCommand);
        const itemCount = tableInfo.Table?.ItemCount || 0;
        const status = tableInfo.Table?.TableStatus || 'UNKNOWN';
        console.log(`     Status: ${status}, Items: ${itemCount}`);
      } catch (e) {
        console.log(`     Error getting details: ${e.message}`);
      }
    }
  } else {
    console.log('   (No tables found)');
  }
  
  console.log('\n🎯 Connection Parameters for SQL Workbench:');
  console.log('   Region: localhost');
  console.log('   Endpoint: http://localhost:8000');
  console.log('   Access Key: fake');
  console.log('   Secret Key: fake');
  
  console.log('\n✅ DynamoDB Local is ready for SQL Workbench connection!');
  
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Ensure DynamoDB Local is running: docker ps | grep dynamodb');
  console.log('2. Check port 8000 is accessible: curl http://localhost:8000');
  console.log('3. Restart DynamoDB Local if needed');
}
