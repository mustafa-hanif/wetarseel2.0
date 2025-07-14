# SQL Workbench Configuration for DynamoDB Local

## Connection Parameters

Use these EXACT parameters to connect SQL Workbench to your DynamoDB Local instance where your Lambda data resides:

### Basic Connection Settings

- **Service Name**: DynamoDB
- **Region**: `localhost`
- **Endpoint URL**: `http://localhost:8000`

### Authentication

- **Access Key ID**: `fake`
- **Secret Access Key**: `fake`
- **Session Token**: (leave empty)

### Advanced Settings

- **Use SSL**: NO/Disabled
- **Port**: 8000
- **Host**: localhost

## Why These Specific Settings?

Your Lambda functions use the Node.js AWS SDK with these exact parameters:

```javascript
const client = new DynamoDBClient({
  region: "localhost",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "fake",
    secretAccessKey: "fake",
  },
});
```

## Expected Tables

Once connected with these settings, you should see:

- **WeTable** - Created by your Lambda functions via dynamodb-toolbox
- This table contains your connection and user data

## Testing the Connection

Before configuring SQL Workbench, verify your DynamoDB Local is running:

```bash
# Check if DynamoDB Local is running
docker ps | grep dynamodb

# Verify your Lambda can see the data
cd /Users/mustafa.hanif/code/wetarseel2.0/apps/lambda
bun run check-table.mjs
```

## Split-Brain Issue Explanation

We discovered that AWS CLI and Node.js SDK see different tables in DynamoDB Local:

- AWS CLI sees: `CliTestTable` (created via CLI)
- Node.js SDK sees: `WeTable` (created via your Lambda)

SQL Workbench needs to connect using the Node.js SDK-compatible settings above to see your actual Lambda data.

## Troubleshooting

If SQL Workbench doesn't show tables:

1. Verify DynamoDB Local is running on port 8000
2. Double-check all connection parameters match exactly
3. Try connecting without SSL/TLS
4. Ensure you're using the region as `localhost` (not `us-east-1`)

## Alternative: Direct Data Verification

You can always verify your data using our debug scripts:

```bash
# See all tables and data
bun run debug-connections.mjs

# Check specific table
bun run check-table.mjs
```
