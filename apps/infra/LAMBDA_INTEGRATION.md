# Lambda Integration with Pulumi

This document describes how your Pulumi infrastructure has been extended to include Lambda functions while maintaining compatibility with your existing Serverless framework structure.

## Overview

Your Pulumi infrastructure now includes:

1. **PostgreSQL RDS Database** (existing)
2. **Static Website hosting** (existing)
3. **DynamoDB Table** for WebSocket connections (new)
4. **Lambda Functions** for WebSocket API (new)
5. **API Gateway WebSocket API** (new)

## Lambda Functions

The following Lambda functions have been added, matching your existing Serverless structure:

### Functions

- `onconnect` - Handles WebSocket connection events
- `ondisconnect` - Handles WebSocket disconnection events
- `onmessage` - Handles WebSocket message events
- `ondefault` - Handles default WebSocket route

### Key Features

- **Environment-aware configuration**: Works with both local DynamoDB and AWS DynamoDB
- **Dynamic table naming**: Uses environment variables for table names
- **Proper IAM permissions**: Includes DynamoDB and API Gateway Management permissions
- **S3-based deployment**: Lambda code is packaged and stored in S3

## Infrastructure Components

### DynamoDB Table

```typescript
const dynamoTable = new aws.dynamodb.Table("wetable", {
  name: `${projectName}-${environment}-wetable`,
  billingMode: "PAY_PER_REQUEST",
  // ... partition key: pk, sort key: sk
});
```

### Lambda Functions

Each function is configured with:

- Runtime: `nodejs20.x`
- Timeout: 30 seconds
- Environment variables: `DYNAMODB_TABLE_NAME`, `ENVIRONMENT`
- S3-based deployment from the `../lambda` directory

### WebSocket API Gateway

- Protocol: WebSocket
- Routes: `$connect`, `$disconnect`, `message`, `$default`
- Integration: AWS Lambda Proxy integration

## Environment Variables

The Lambda functions now use environment variables for configuration:

- `DYNAMODB_TABLE_NAME`: The name of the DynamoDB table
- `ENVIRONMENT`: The deployment environment (dev, prod, etc.)
- `AWS_REGION`: AWS region (automatically set by Lambda runtime)

## Local Development

The Lambda handler automatically detects local development and switches to local DynamoDB:

```typescript
const isLocal = process.env.ENVIRONMENT === "dev" || process.env.AWS_SAM_LOCAL;
```

## Deployment

### Prerequisites

1. Ensure Pulumi is installed and configured
2. Set up AWS credentials
3. Configure required secrets:
   ```bash
   pulumi config set --secret dbPassword your-db-password
   ```

### Deploy Infrastructure

```bash
cd apps/infra
pnpm install
pulumi up
```

### Environment Configuration

Set environment-specific configuration:

```bash
# Development
pulumi config set environment dev
pulumi config set aws:region me-central-1

# Production
pulumi config set environment prod
pulumi config set dbInstanceClass db.t3.small
pulumi config set multiAz true
pulumi config set deletionProtection true
```

## Outputs

After deployment, you'll get the following outputs:

### Database

- `dbEndpoint`: PostgreSQL database endpoint
- `dbConnectionString`: Connection string (without password)

### Website

- `websiteUrl`: S3 website URL
- `cloudfrontUrl`: CloudFront CDN URL

### Lambda & WebSocket (NEW)

- `dynamoTableName`: DynamoDB table name
- `webSocketApiId`: WebSocket API ID
- `webSocketUrl`: WebSocket connection URL
- `onConnectFunctionArn`: Connect function ARN
- `onDisconnectFunctionArn`: Disconnect function ARN
- `onMessageFunctionArn`: Message function ARN
- `onDefaultFunctionArn`: Default function ARN

## Migration from Serverless

Your existing Serverless configuration is preserved in `apps/lambda/serverless.yml`. The Pulumi setup:

1. **Maintains the same handler structure**: No changes needed to your Lambda code
2. **Uses the same runtime**: `nodejs20.x`
3. **Preserves IAM permissions**: Includes all necessary permissions for DynamoDB and API Gateway
4. **Environment compatibility**: Works with both local and cloud DynamoDB

## Serverless vs Pulumi Comparison

| Feature              | Serverless     | Pulumi                 |
| -------------------- | -------------- | ---------------------- |
| Configuration        | YAML           | TypeScript             |
| Infrastructure scope | Lambda-focused | Full infrastructure    |
| Type safety          | No             | Yes                    |
| IDE support          | Limited        | Full IntelliSense      |
| Resource management  | Limited        | Complete AWS resources |
| State management     | Cloud-based    | Pulumi state           |

## Best Practices

1. **Environment separation**: Use different stacks for dev/prod
2. **Secret management**: Use Pulumi secrets for sensitive data
3. **Resource naming**: Environment-prefixed resource names
4. **Dependencies**: Explicit resource dependencies
5. **Protection**: Enable deletion protection for production

## Testing

### Local Testing with DynamoDB Local

```bash
# Start DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Set environment for local testing
export ENVIRONMENT=dev
export DYNAMODB_TABLE_NAME=wetarseel-dev-wetable
```

### WebSocket Testing

```javascript
const ws = new WebSocket(
  "wss://your-api-id.execute-api.me-central-1.amazonaws.com/dev?userId=test123"
);

ws.onopen = () => {
  ws.send(JSON.stringify({ action: "message", data: "Hello!" }));
};
```

## Troubleshooting

### Common Issues

1. **Lambda deployment fails**: Ensure the `../lambda` directory contains valid Node.js code
2. **DynamoDB access denied**: Check IAM permissions in `lambdaCustomPolicy`
3. **WebSocket connection fails**: Verify API Gateway permissions and Lambda function URLs

### Debugging

Check CloudWatch logs for each Lambda function:

```bash
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/wetarseel
```

## Future Enhancements

Consider these improvements:

1. **Lambda Layers**: Share common dependencies
2. **VPC Integration**: Connect Lambda to your RDS VPC
3. **Custom Authorizers**: Add authentication to WebSocket API
4. **Monitoring**: Add CloudWatch alarms and dashboards
5. **Auto-scaling**: Configure reserved concurrency for Lambda functions
