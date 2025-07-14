#!/usr/bin/env bun
// Set environment BEFORE imports
process.env.ENVIRONMENT = 'dev';
process.env.DYNAMODB_TABLE_NAME = 'WeTable';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
// Test with raw AWS SDK (no dynamodb-toolbox)
const isLocal = process.env.ENVIRONMENT === "dev" || process.env.AWS_SAM_LOCAL;
const dynamoDBClient = new DynamoDBClient(isLocal
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
    });
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
async function testRawDynamoDB() {
    console.log('🧪 Testing raw DynamoDB operations...');
    try {
        // Test PUT
        console.log('📝 Testing PUT operation...');
        await docClient.send(new PutCommand({
            TableName: 'WeTable',
            Item: {
                pk: 'CONNECTION#test-123',
                sk: 'CONNECTION#test-123',
                userId: 'user-456',
                connectedAt: new Date().toISOString(),
                domain: 'localhost',
                stage: 'dev'
            }
        }));
        console.log('✅ PUT operation successful');
        // Test GET
        console.log('📖 Testing GET operation...');
        const result = await docClient.send(new GetCommand({
            TableName: 'WeTable',
            Key: {
                pk: 'CONNECTION#test-123',
                sk: 'CONNECTION#test-123'
            }
        }));
        console.log('✅ GET operation successful:', result.Item);
        console.log('🎉 Raw DynamoDB operations work fine!');
        console.log('💡 The issue is with dynamodb-toolbox configuration');
    }
    catch (error) {
        console.error('❌ Raw DynamoDB test failed:', error.message);
    }
}
await testRawDynamoDB();
