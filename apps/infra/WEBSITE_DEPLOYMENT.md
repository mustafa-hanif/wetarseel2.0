# Static Website Deployment with Pulumi CI/CD

This guide explains how to deploy your static website using Pulumi CI/CD with automatic builds.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Commit    │───▶│ Pulumi Cloud    │───▶│  AWS Resources  │
│                 │    │                 │    │                 │
│ • Frontend Code │    │ • Pre-Actions   │    │ • S3 Bucket     │
│ • Infra Code    │    │ • npm run build │    │ • CloudFront    │
│                 │    │ • pulumi up     │    │ • Website Live  │
│                 │    │ • Post-Actions  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Deployment Options

### Option 1: Pre/Post Actions in Pulumi Deployments (Recommended)

Your `.pulumi/deployment.yaml` now includes:

- **preActions**: Build the frontend before infrastructure deployment
- **postActions**: Upload built files to S3 after infrastructure is ready

**Workflow:**

1. Git push triggers Pulumi Deployment
2. Pre-action runs `bun install && bun run build` in `/web` directory
3. Pulumi deploys S3 bucket and CloudFront
4. Post-action uploads built files to S3 and invalidates cache

### Option 2: Manual Deployment Script

Use the deployment script for manual deployments:

```bash
# Deploy to development
cd apps/infra
./../../scripts/deploy-website.sh dev

# Deploy to production
./../../scripts/deploy-website.sh prod
```

### Option 3: Pulumi Command Provider (Advanced)

For more control, you can use the `@pulumi/command` provider to run builds as part of your Pulumi program itself.

## 📁 File Structure

```
apps/
├── infra/
│   ├── index.ts                 # Main infrastructure + website resources
│   ├── website-build.ts         # Advanced build automation example
│   └── package.json             # Added @pulumi/command dependency
│
├── web/
│   ├── src/                     # Your frontend source code
│   ├── dist/                    # Build output (created by npm run build)
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Build configuration
│
scripts/
└── deploy-website.sh            # Manual deployment script

.pulumi/
├── deployment.yaml              # Pulumi CI/CD configuration with build steps
└── environments/
    └── wetarseel.yaml           # Environment configuration
```

## ⚙️ Configuration

### Prerequisites

1. **Install command provider**:

   ```bash
   cd apps/infra
   npm install @pulumi/command
   ```

2. **Ensure your web app builds correctly**:
   ```bash
   cd apps/web
   bun install
   bun run build
   ```

### Environment Variables in Pulumi Cloud

Set these in your Pulumi Cloud deployment settings:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `PULUMI_SECRET_DB_PASSWORD_DEV`
- `PULUMI_SECRET_DB_PASSWORD_PROD`

## 🔄 Deployment Process

### Automatic (via Git Push)

1. **Commit changes** to `main` branch:

   ```bash
   git add .
   git commit -m "Update website"
   git push origin main
   ```

2. **Pulumi Cloud automatically**:
   - Detects changes in `apps/web/` or `apps/infra/`
   - Runs `bun install && bun run build` in web directory
   - Deploys infrastructure changes with `pulumi up`
   - Uploads built files to S3
   - Invalidates CloudFront cache

### Manual Deployment

1. **Deploy infrastructure** (if needed):

   ```bash
   cd apps/infra
   pulumi stack select dev
   pulumi up
   ```

2. **Build and deploy website**:
   ```bash
   # From infra directory
   ../../scripts/deploy-website.sh dev
   ```

## 🎯 Build Triggers

The website rebuilds and redeploys when:

- Files in `apps/web/` change
- Files in `apps/infra/` change (infrastructure updates)
- Manual deployment is triggered

## 📊 Monitoring Deployments

### Pulumi Cloud Dashboard

- View deployment history
- Monitor build logs
- Check resource status
- See deployment diffs

### AWS Resources Created

- **S3 Bucket**: `{project}-{env}-website`
- **CloudFront Distribution**: Global CDN
- **Bucket Policy**: Public read access for website

### Deployment URLs

After deployment, access your website via:

- **S3 Website URL**: `http://{bucket}.s3-website.{region}.amazonaws.com`
- **CloudFront URL**: `https://{distribution-id}.cloudfront.net` (recommended)

## 🔧 Troubleshooting

### Build Fails

```bash
# Check build locally
cd apps/web
bun install
bun run build

# Check deployment logs in Pulumi Cloud
```

### Upload Fails

```bash
# Check AWS credentials
aws s3 ls

# Verify bucket exists
pulumi stack output websiteBucketName
```

### Cache Issues

```bash
# Manual cache invalidation
aws cloudfront create-invalidation \
  --distribution-id $(pulumi stack output cloudfrontDistributionId) \
  --paths "/*"
```

## 🚨 Important Notes

5. **Build Output**: Ensure `bun run build` creates a `dist/` directory
6. **Cache Headers**: Static assets get long cache times, HTML gets short cache times
7. **SPA Support**: 404 errors redirect to `/index.html` for single-page apps
8. **Production**: Production deployments require manual approval in Pulumi Cloud
9. **Costs**: CloudFront has usage-based pricing; S3 storage is very cheap

## 🔗 Next Steps

1. **Custom Domain**: Add Route 53 and SSL certificate
2. **Build Optimization**: Add build caching and optimization
3. **Multiple Environments**: Set up staging environments
4. **Monitoring**: Add CloudWatch alarms for website health
