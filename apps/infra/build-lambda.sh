#!/bin/bash

# CI/CD build script for Lambda functions
# This should be run before `pulumi up` in your CI/CD pipeline

set -e  # Exit on any error

echo "🚀 Building Lambda functions for Pulumi deployment..."

# Navigate to lambda directory
cd ../lambda

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Lambda dependencies..."
    pnpm install
fi

# Build the Lambda code
echo "📦 Building Lambda TypeScript code..."
pnpm run build

# Verify build output exists
if [ ! -f "dist/handler.js" ]; then
    echo "❌ Build failed: dist/handler.js not found"
    exit 1
fi

echo "✅ Lambda build completed successfully!"
echo "📁 Built files are in: apps/lambda/dist/"

# Return to infra directory
cd ../infra

echo "🎯 Ready for Pulumi deployment!"
echo "💡 Run: pulumi up"
