# Pulumi CI/CD Setup Guide

This project uses **Pulumi Cloud** for automated CI/CD deployments instead of traditional GitHub Actions.

## 🚀 Quick Setup

1. **Run the setup script:**

   ```bash
   ./scripts/setup-pulumi-cicd.sh
   ```

2. **Connect to Pulumi Cloud:**
   - Go to [app.pulumi.com](https://app.pulumi.com)
   - Connect your GitHub repository
   - Enable Pulumi Deployments

## 🏗️ Architecture

### Pulumi Cloud Components:

- **Pulumi Deployments**: Automatic CI/CD triggered by git pushes
- **Pulumi ESC**: Centralized environment configuration and secrets management
- **Stack Management**: Environment-specific deployments (dev/prod)

### File Structure:

```
.pulumi/
├── deployment.yaml          # CI/CD deployment configuration
└── environments/
    └── wetarseel.yaml       # ESC environment configuration

apps/infra/
├── Pulumi.dev.yaml          # Dev stack configuration
├── Pulumi.prod.yaml         # Prod stack configuration
└── index.ts                 # Infrastructure code
```

## 🔧 Configuration

### Environment Variables (Set in Pulumi Cloud):

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `PULUMI_SECRET_DB_PASSWORD_DEV`: Database password for dev
- `PULUMI_SECRET_DB_PASSWORD_PROD`: Database password for prod

### Stack Configuration:

```yaml
# Development
pulumi config set aws:region me-central-1
pulumi config set pulumi:environment wetarseel/dev
pulumi config set --secret wetarseel:dbPassword <password>

# Production
pulumi config set aws:region me-central-1
pulumi config set pulumi:environment wetarseel/prod
pulumi config set --secret wetarseel:dbPassword <password>
```

## 🔄 Deployment Workflow

### Automatic Deployments:

1. **Push to main branch** → Triggers dev deployment
2. **Changes in `apps/infra/`** → Triggers infrastructure updates
3. **Production deployments** → Require manual approval

### Manual Deployments:

```bash
# Deploy to development
cd apps/infra
pulumi stack select dev
pulumi up

# Deploy to production
pulumi stack select prod
pulumi up
```

## 🔐 Security Features

### Development Environment:

- Public database access (for development)
- Shorter backup retention
- No deletion protection
- Single AZ deployment

### Production Environment:

- Private database access only
- 30-day backup retention
- Deletion protection enabled
- Multi-AZ deployment
- Manual approval required

## 📊 Monitoring

Pulumi Cloud provides:

- **Deployment History**: Track all deployments
- **Resource Diffs**: See exactly what changed
- **Deployment Logs**: Debug deployment issues
- **Stack Insights**: Monitor resource health

## 🚨 Troubleshooting

### Common Issues:

1. **Deployment Fails**:

   ```bash
   pulumi logs --stack dev
   ```

2. **Secret Management**:

   ```bash
   pulumi config set --secret key value --stack <stack-name>
   ```

3. **Environment Configuration**:

   ```bash
   pulumi env get wetarseel/dev
   ```

4. **Stack State Issues**:
   ```bash
   pulumi refresh --stack <stack-name>
   ```

## 🔗 Links

- [Pulumi Cloud Console](https://app.pulumi.com)
- [Pulumi Deployments Docs](https://www.pulumi.com/docs/intro/pulumi-cloud/deployments/)
- [Pulumi ESC Docs](https://www.pulumi.com/docs/intro/pulumi-cloud/esc/)
- [AWS Provider Docs](https://www.pulumi.com/registry/packages/aws/)

## 📝 Best Practices

1. **Always use preview** before production deployments
2. **Test in dev environment** first
3. **Use ESC for secrets** management
4. **Enable stack protection** for production
5. **Review deployment diffs** carefully
6. **Set up monitoring** and alerting
