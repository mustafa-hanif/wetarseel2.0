#!/usr/bin/env bun

import { DynamoDBClient, ListTablesCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

console.log('🔍 Checking DynamoDB instances...\n');

// Check LOCAL DynamoDB
console.log('1️⃣ LOCAL DynamoDB (localhost:8000):');
const localClient = new DynamoDBClient({
  region: "localhost",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "yvwy23",
    secretAccessKey: "e9y2t",
  },
});

try {
  const localTables = await localClient.send(new ListTablesCommand({}));
  console.log('✅ Connected to local DynamoDB');
  console.log('📋 Tables:', localTables.TableNames);
  
  if (localTables.TableNames?.includes('WeTable')) {
    const localData = await localClient.send(new ScanCommand({ TableName: "WeTable" }));
    console.log(`📊 WeTable has ${localData.Count} items locally`);
  }
} catch (error) {
  console.log('❌ Cannot connect to local DynamoDB:', error.message);
}

console.log('\n2️⃣ AWS DynamoDB (me-central-1):');
// Check AWS DynamoDB (what SQL Workbench might be connecting to)
const awsClient = new DynamoDBClient({
  region: "me-central-1"
});

try {
  const awsTables = await awsClient.send(new ListTablesCommand({}));
  console.log('✅ Connected to AWS DynamoDB');
  console.log('📋 Tables:', awsTables.TableNames);
  
  if (awsTables.TableNames?.includes('WeTable')) {
    const awsData = await awsClient.send(new ScanCommand({ TableName: "WeTable" }));
    console.log(`📊 WeTable has ${awsData.Count} items in AWS`);
  } else {
    console.log('❌ WeTable not found in AWS DynamoDB');
  }
} catch (error) {
  console.log('❌ Cannot connect to AWS DynamoDB:', error.message);
  console.log('   (This is expected if no AWS credentials are configured)');
}

console.log('\n💡 SQL Workbench Configuration:');
console.log('To connect SQL Workbench to DynamoDB Local:');
console.log('- Endpoint: http://localhost:8000');
console.log('- Region: localhost (or any dummy region)');
console.log('- Access Key: ggevny (or any dummy value)');
console.log('- Secret Key: r2q3sh (or any dummy value)');
console.log('- Table Name: WeTable');
