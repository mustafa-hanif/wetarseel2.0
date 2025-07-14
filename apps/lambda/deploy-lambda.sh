#!/bin/bash

# Lambda deployment script for local development
# This allows quick iterations without running full Pulumi deployment

set -e  # Exit on any error

echo "🚀 Building and deploying Lambda functions..."

# Build the Lambda code
echo "📦 Building Lambda code..."
pnpm run build

# Create deployment package
echo "📦 Creating deployment package..."
cp dist/handler.js handler.js
zip -q lambda-code-fixed.zip handler.js

# Update all Lambda functions
echo "🔄 Updating Lambda functions..."

echo "  - Updating onconnect..."
aws lambda update-function-code --function-name wetarseel-dev-onconnect --zip-file fileb://lambda-code-fixed.zip > /dev/null

echo "  - Updating ondisconnect..."
aws lambda update-function-code --function-name wetarseel-dev-ondisconnect --zip-file fileb://lambda-code-fixed.zip > /dev/null

echo "  - Updating onmessage..."
aws lambda update-function-code --function-name wetarseel-dev-onmessage --zip-file fileb://lambda-code-fixed.zip > /dev/null

echo "  - Updating ondefault..."
aws lambda update-function-code --function-name wetarseel-dev-ondefault --zip-file fileb://lambda-code-fixed.zip > /dev/null

# Clean up
rm handler.js lambda-code-fixed.zip

echo "✅ All Lambda functions updated successfully!"
echo ""
echo "🔗 WebSocket URL: wss://vxgv2qg8ae.execute-api.me-central-1.amazonaws.com/dev"
echo "📊 DynamoDB Table: wetarseel-dev-wetable"
echo ""
echo "💡 To test: node test-websocket-connection.js"
