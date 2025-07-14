#!/bin/bash

# Complete build and deployment script for CI/CD
# This builds Lambda functions, API Docker image, and deploys with Pulumi

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting complete build and deployment...${NC}"

# Step 1: Build Lambda functions
echo -e "${BLUE}📦 Step 1: Building Lambda functions...${NC}"
./build-lambda.sh

# Step 2: Build and push API Docker image
echo -e "${BLUE}🐳 Step 2: Building and pushing API Docker image...${NC}"
cd ../api
./build-and-push.sh
cd ../infra

# Step 3: Deploy with Pulumi
echo -e "${BLUE}🏗️  Step 3: Deploying infrastructure with Pulumi...${NC}"
pulumi up --yes

echo -e "${GREEN}✅ Complete deployment finished successfully!${NC}"
echo ""
echo -e "${GREEN}🎯 Your infrastructure is ready:${NC}"
echo "  - Lambda functions: Updated with latest code"
echo "  - API container: Built and pushed to ECR"
echo "  - ECS service: Running with latest image"
echo "  - Load balancer: Routing traffic to API"
echo ""
echo -e "${GREEN}📋 Get your endpoints:${NC}"
echo "  pulumi stack output apiUrl"
echo "  pulumi stack output webSocketUrl"
