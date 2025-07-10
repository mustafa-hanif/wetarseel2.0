#!/bin/bash
# Import Existing RDS Instance Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

STACK_NAME=${1:-dev}

echo -e "${GREEN}🔄 Importing existing RDS instance to prevent replacement${NC}"

# Get the actual RDS identifier from AWS
echo -e "${YELLOW}📋 Finding existing RDS instances...${NC}"
EXISTING_INSTANCES=$(aws rds describe-db-instances --query 'DBInstances[?contains(DBInstanceIdentifier, `wetarseel`) && contains(DBInstanceIdentifier, `postgres`)].DBInstanceIdentifier' --output text)

if [ -z "$EXISTING_INSTANCES" ]; then
    echo -e "${RED}❌ No existing wetarseel postgres instances found${NC}"
    echo -e "${YELLOW}💡 Available instances:${NC}"
    aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier' --output table
    exit 1
fi

echo -e "${GREEN}✅ Found existing instances:${NC}"
echo "$EXISTING_INSTANCES"

# Select the first instance or prompt user
DB_IDENTIFIER=$(echo "$EXISTING_INSTANCES" | head -n 1)
echo -e "${GREEN}📝 Using instance: $DB_IDENTIFIER${NC}"

# Import the instance
echo -e "${YELLOW}🔄 Importing RDS instance into Pulumi state...${NC}"
cd "$(dirname "$0")/../apps/infra"

pulumi stack select $STACK_NAME

# Import the RDS instance
echo -e "${YELLOW}📥 Importing $DB_IDENTIFIER...${NC}"
pulumi import aws:rds/instance:Instance my-postgres "$DB_IDENTIFIER"

echo -e "${GREEN}✅ RDS instance imported successfully!${NC}"
echo -e "${YELLOW}🔧 Now you can run 'pulumi preview' safely${NC}"

echo -e "\n${GREEN}🎉 Import completed!${NC}"
echo -e "${GREEN}📋 Next steps:${NC}"
echo -e "${GREEN}   1. Run 'pulumi preview' to verify no replacements${NC}"
echo -e "${GREEN}   2. Run 'pulumi up' to apply any other infrastructure changes${NC}"
