#!/bin/bash
# Pulumi CI/CD Setup Script

set -e

echo "🚀 Setting up Pulumi CI/CD..."

# 1. Login to Pulumi Cloud
echo "📝 Logging into Pulumi Cloud..."
pulumi login

# 2. Configure ESC environments
echo "🔧 Setting up ESC environments..."
cd apps/infra

# Create ESC environments
pulumi env init wetarseel/dev --from-file ../../.pulumi/environments/wetarseel.yaml || true
pulumi env init wetarseel/prod --from-file ../../.pulumi/environments/wetarseel.yaml || true

# 3. Initialize stacks if they don't exist
echo "📦 Setting up stacks..."
pulumi stack init dev --non-interactive || echo "Stack 'dev' already exists"
pulumi stack init prod --non-interactive || echo "Stack 'prod' already exists"

# 4. Set stack configurations
echo "⚙️  Configuring stacks..."
pulumi stack select dev
pulumi config set aws:region me-central-1
pulumi config set pulumi:environment wetarseel/dev

pulumi stack select prod  
pulumi config set aws:region me-central-1
pulumi config set pulumi:environment wetarseel/prod

# 5. Set secrets (you'll need to do this manually or via environment variables)
echo "🔐 Setting up secrets..."
echo "⚠️  You need to set the following secrets:"
echo "   pulumi config set --secret wetarseel:dbPassword <your-db-password> --stack dev"
echo "   pulumi config set --secret wetarseel:dbPassword <your-db-password> --stack prod"

# 6. Install Pulumi Command provider
echo "📦 Installing Pulumi Command provider..."
cd apps/infra
bun add @pulumi/command
cd ../..

# 7. Enable Pulumi Deployments
echo "🔄 Setting up Pulumi Deployments..."
echo "📖 Next steps:"
echo "   1. Go to https://app.pulumi.com"
echo "   2. Connect your GitHub repository"
echo "   3. Enable Pulumi Deployments"
echo "   4. Configure environment variables in Pulumi Cloud"

echo "✅ Pulumi CI/CD setup complete!"
