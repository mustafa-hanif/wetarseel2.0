#!/bin/bash

# Build and push Docker image to ECR
# This script can be used for both local development and CI/CD

set -e  # Exit on any error

# Configuration
PROJECT_NAME="wetarseel"
ENVIRONMENT="dev"
REGION="me-central-1"
ECR_REPO_NAME="${PROJECT_NAME}-${ENVIRONMENT}-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building and pushing API Docker image...${NC}"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Failed to get AWS account ID. Make sure AWS CLI is configured.${NC}"
    exit 1
fi

# Construct ECR repository URL
ECR_REPO_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  AWS Account: $AWS_ACCOUNT_ID"
echo "  Region: $REGION"
echo "  ECR Repository: $ECR_REPO_URL"
echo ""

# Login to ECR
echo -e "${YELLOW}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO_URL

# Build Docker image
echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
docker build -t $ECR_REPO_NAME .

# Tag image for ECR
echo -e "${YELLOW}🏷️  Tagging image...${NC}"
docker tag $ECR_REPO_NAME:latest $ECR_REPO_URL:latest

# Get git commit hash for additional tag
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_COMMIT=$(git rev-parse --short HEAD)
    docker tag $ECR_REPO_NAME:latest $ECR_REPO_URL:$GIT_COMMIT
    echo "  Tagged with git commit: $GIT_COMMIT"
fi

# Push image to ECR
echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker push $ECR_REPO_URL:latest

if [ ! -z "$GIT_COMMIT" ]; then
    docker push $ECR_REPO_URL:$GIT_COMMIT
fi

echo -e "${GREEN}✅ Successfully built and pushed Docker image!${NC}"
echo ""
echo -e "${GREEN}🎯 Image URLs:${NC}"
echo "  Latest: $ECR_REPO_URL:latest"
if [ ! -z "$GIT_COMMIT" ]; then
    echo "  Commit: $ECR_REPO_URL:$GIT_COMMIT"
fi
echo ""
# Optional: Auto-update ECS service (uncomment to enable)
# echo -e "${YELLOW}🔄 Updating ECS service...${NC}"
# aws ecs update-service \
#   --cluster ${PROJECT_NAME}-${ENVIRONMENT}-cluster \
#   --service ${PROJECT_NAME}-${ENVIRONMENT}-api-service \
#   --force-new-deployment \
#   --no-cli-pager > /dev/null
# echo -e "${GREEN}✅ ECS service update initiated!${NC}"

echo -e "${GREEN}💡 Next steps:${NC}"
echo "  1. Auto-update ECS: Uncomment the ECS update section in this script"
echo "  2. Manual ECS update: aws ecs update-service --cluster ${PROJECT_NAME}-${ENVIRONMENT}-cluster --service ${PROJECT_NAME}-${ENVIRONMENT}-api-service --force-new-deployment"
echo "  3. Or deploy with Pulumi: cd ../infra && pulumi up"
