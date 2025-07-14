#!/usr/bin/env bun

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({
  region: "localhost",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "ggevny",
    secretAccessKey: "r2q3sh",
  },
});

console.log('🔍 Scanning WeTable for all items...');

try {
  const result = await dynamoDBClient.send(new ScanCommand({
    TableName: "WeTable"
  }));
  
  console.log(`📊 Found ${result.Count} items in WeTable:`);
  
  if (result.Items && result.Items.length > 0) {
    result.Items.forEach((item, index) => {
      console.log(`\n${index + 1}.`, JSON.stringify(item, null, 2));
    });
  } else {
    console.log('❌ No items found in the table');
  }
  
} catch (error) {
  console.error('❌ Error scanning table:', error.message);
}
