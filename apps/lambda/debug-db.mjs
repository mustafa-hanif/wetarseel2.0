#!/usr/bin/env bun

process.env.ENVIRONMENT = 'dev';
process.env.DYNAMODB_TABLE_NAME = 'WeTable';

import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

// Test the exact same config as handler
const isLocal = process.env.ENVIRONMENT === "dev" || process.env.AWS_SAM_LOCAL;
console.log('isLocal:', isLocal);
console.log('ENVIRONMENT:', process.env.ENVIRONMENT);

const dynamoDBClient = new DynamoDBClient(
  isLocal
    ? {
        region: "localhost",
        endpoint: "http://localhost:8000",
        credentials: {
          accessKeyId: "ggevny",
          secretAccessKey: "r2q3sh",
        },
      }
    : {
        region: process.env.AWS_REGION || "me-central-1",
      }
);

try {
  console.log('Testing DynamoDB connection...');
  const result = await dynamoDBClient.send(new ListTablesCommand({}));
  console.log('Available tables:', result.TableNames);
} catch (error) {
  console.error('DynamoDB connection error:', error.message);
}
