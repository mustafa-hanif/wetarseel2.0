#!/bin/bash
# Website Build and Deploy Script
# This script builds the frontend and uploads it to S3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="../../web"
BUILD_DIR="$FRONTEND_DIR/dist"
STACK_NAME=${1:-dev}

echo -e "${GREEN}🚀 Building and deploying website for stack: $STACK_NAME${NC}"

# Step 1: Get Pulumi stack outputs
echo -e "${YELLOW}📋 Getting stack outputs...${NC}"
cd "$(dirname "$0")"
pulumi stack select $STACK_NAME

# Get S3 bucket name and CloudFront distribution ID
BUCKET_NAME=$(pulumi stack output websiteBucketName 2>/dev/null || echo "")
CLOUDFRONT_ID=$(pulumi stack output cloudfrontDistributionId 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}❌ Error: Could not get bucket name from Pulumi stack${NC}"
    echo -e "${YELLOW}💡 Make sure you've deployed the infrastructure first with: pulumi up${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found bucket: $BUCKET_NAME${NC}"

# Step 2: Build the frontend
echo -e "${YELLOW}🔨 Building frontend application...${NC}"
cd "$FRONTEND_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies with Bun...${NC}"
    bun install
fi

# Build the application using Bun
echo -e "${YELLOW}⚡ Running build with Bun...${NC}"
bun run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Error: Build directory not found at $BUILD_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Step 3: Upload to S3
echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
    --delete \
    --exact-timestamps \
    --exclude "*.map" \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML files with shorter cache control
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
    --delete \
    --exact-timestamps \
    --include "*.html" \
    --include "*.json" \
    --cache-control "public, max-age=0, must-revalidate"

echo -e "${GREEN}✅ Files uploaded to S3${NC}"

# Step 4: Invalidate CloudFront cache
if [ ! -z "$CLOUDFRONT_ID" ]; then
    echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        > /dev/null
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: No CloudFront distribution found, skipping cache invalidation${NC}"
fi

# Step 5: Show deployment URLs
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📋 Website URLs:${NC}"

WEBSITE_URL=$(cd ../infra && pulumi stack output websiteUrl 2>/dev/null || echo "")
CLOUDFRONT_URL=$(cd ../infra && pulumi stack output cloudfrontUrl 2>/dev/null || echo "")

if [ ! -z "$WEBSITE_URL" ]; then
    echo -e "${GREEN}   S3 Website: $WEBSITE_URL${NC}"
fi

if [ ! -z "$CLOUDFRONT_URL" ]; then
    echo -e "${GREEN}   CloudFront CDN: $CLOUDFRONT_URL${NC}"
fi

echo -e "\n${YELLOW}💡 Tip: Use CloudFront URL for production traffic${NC}"
