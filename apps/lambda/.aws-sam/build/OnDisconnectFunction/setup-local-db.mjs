#!/usr/bin/env bun
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
// Local DynamoDB client
const dynamoDBClient = new DynamoDBClient({
    region: "localhost",
    endpoint: "http://localhost:8000",
    credentials: {
        accessKeyId: "ggevny",
        secretAccessKey: "r2q3sh",
    },
});
async function createTableIfNotExists() {
    const tableName = "WeTable";
    try {
        // Check if table already exists
        await dynamoDBClient.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`✅ Table ${tableName} already exists`);
        return;
    }
    catch (error) {
        if (error.name !== "ResourceNotFoundException") {
            throw error;
        }
    }
    // Create the table
    const createTableParams = {
        TableName: tableName,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
            {
                AttributeName: "pk",
                AttributeType: "S",
            },
            {
                AttributeName: "sk",
                AttributeType: "S",
            },
        ],
        KeySchema: [
            {
                AttributeName: "pk",
                KeyType: "HASH",
            },
            {
                AttributeName: "sk",
                KeyType: "RANGE",
            },
        ],
    };
    try {
        await dynamoDBClient.send(new CreateTableCommand(createTableParams));
        console.log(`✅ Created table ${tableName}`);
        // Wait a bit for table to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    catch (error) {
        console.error(`❌ Error creating table: ${error.message}`);
        throw error;
    }
}
// Run setup
console.log("🔧 Setting up local DynamoDB table...");
await createTableIfNotExists();
console.log("🎉 Setup complete!");
