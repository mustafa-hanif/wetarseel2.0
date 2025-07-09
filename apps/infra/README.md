# Wetarseel Infrastructure

This directory contains the Pulumi infrastructure-as-code for the Wetarseel application, provisioning AWS resources including RDS PostgreSQL database and supporting infrastructure.

## 🚀 Modern Features

- **Latest PostgreSQL 16.4** with optimized parameter groups
- **GP3 Storage** with auto-scaling for better performance and cost
- **Encryption at rest** for security compliance
- **Enhanced monitoring** with Performance Insights and CloudWatch logs
- **Flexible security groups** with configurable CIDR blocks
- **Comprehensive tagging** for cost tracking and resource management
- **Environment-specific configurations** for dev/staging/production
- **Backup and maintenance** windows with configurable retention

## 📋 Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) installed
- AWS CLI configured with appropriate credentials
- Node.js and pnpm/npm installed

## 🔧 Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Initialize Pulumi stack:**

   ```bash
   # For development
   pulumi stack init dev

   # For production
   pulumi stack init prod
   ```

3. **Configure the stack:**

   ```bash
   # Copy example config
   cp Pulumi.dev.example.yaml Pulumi.dev.yaml

   # Set required secrets
   pulumi config set --secret dbPassword <your-secure-password>

   # Optional: Set other configuration
   pulumi config set dbInstanceClass db.t3.micro
   pulumi config set environment development
   ```

## 🛠️ Available Configuration

| Parameter             | Type    | Default       | Description                       |
| --------------------- | ------- | ------------- | --------------------------------- |
| `dbPassword`          | secret  | **required**  | Database password                 |
| `environment`         | string  | stack name    | Environment name                  |
| `dbName`              | string  | "wetarseel"   | Database name                     |
| `dbUsername`          | string  | "dbadmin"     | Database username                 |
| `dbInstanceClass`     | string  | "db.t3.micro" | RDS instance class                |
| `allowedCidrBlocks`   | array   | ["0.0.0.0/0"] | CIDR blocks for DB access         |
| `multiAz`             | boolean | false         | Enable Multi-AZ deployment        |
| `publiclyAccessible`  | boolean | true          | Make database publicly accessible |
| `backupRetentionDays` | number  | 7             | Backup retention period           |
| `skipFinalSnapshot`   | boolean | true          | Skip final snapshot on deletion   |
| `deletionProtection`  | boolean | false         | Enable deletion protection        |

## 🚦 Deployment

### Development Environment

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Production Environment

```bash
# Switch to production stack
pulumi stack select prod

# Use production configuration
cp Pulumi.prod.example.yaml Pulumi.prod.yaml
# Edit Pulumi.prod.yaml with production values

# Deploy with more restrictive settings
pulumi up
```

## 📊 Outputs

The stack provides the following outputs for use by other applications:

| Output                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `dbEndpoint`            | Full database endpoint with port          |
| `dbAddress`             | Database host address                     |
| `dbPort`                | Database port number                      |
| `dbName`                | Database name                             |
| `dbUsername`            | Database username                         |
| `dbConnectionString`    | Connection string (without password)      |
| `dbSecurityGroupId`     | Security group ID for application servers |
| `deploymentEnvironment` | Current environment                       |
| `deploymentRegion`      | AWS region                                |
| `vpcId`                 | VPC ID                                    |
| `dbInstanceArn`         | RDS instance ARN                          |
| `dbSubnetGroupArn`      | DB subnet group ARN                       |

## �️ Safety and Disaster Prevention

### **Database Protection Mechanisms**

1. **Deletion Protection**: Enabled by default (`deletionProtection: true`)
2. **Final Snapshots**: Taken by default (`skipFinalSnapshot: false`)
3. **Unique Identifiers**: Resources use versioned names to prevent accidental replacement
4. **Environment Warnings**: Production deployments show safety warnings

### **Safe Defaults by Environment**

| Setting               | Development | Production | Purpose                     |
| --------------------- | ----------- | ---------- | --------------------------- |
| `deletionProtection`  | `false`     | `true`     | Prevent accidental deletion |
| `skipFinalSnapshot`   | `true`      | `false`    | Backup before deletion      |
| `multiAz`             | `false`     | `true`     | High availability           |
| `publiclyAccessible`  | `true`      | `false`    | Network security            |
| `backupRetentionDays` | `7`         | `30`       | Data recovery window        |

### **What Happens if Someone Accidentally Runs `pulumi up`?**

**Development Environment (`dev` stack):**

- ✅ **Safer**: New resources created with `-v2` suffix
- ✅ **Recoverable**: Deletion protection enabled by default
- ⚠️ **Note**: Final snapshots disabled for faster cleanup

**Production Environment (`prod` stack):**

- 🛡️ **Maximum Protection**: All safety features enabled
- 🛡️ **Deletion Protection**: Cannot delete without explicit override
- 🛡️ **Final Snapshots**: Automatic backup before any deletion
- ⚠️ **Warnings**: Console warnings displayed during deployment

### **Emergency Procedures**

**If Infrastructure is Accidentally Modified:**

1. **Don't Panic**: Deletion protection prevents immediate data loss
2. **Check Snapshots**: Look for automatic snapshots in AWS RDS console
3. **Restore from Backup**: Use point-in-time recovery if needed
4. **Contact Team**: Notify team leads immediately

**Recovery Commands:**

```bash
# Check current stack status
pulumi stack output

# Rollback to previous deployment
pulumi refresh
pulumi up --target-dependents

# Manual snapshot creation (emergency backup)
aws rds create-db-snapshot \
  --db-snapshot-identifier emergency-backup-$(date +%Y%m%d-%H%M%S) \
  --db-instance-identifier wetarseel-prod-postgres-v2
```

## �🔒 Security Best Practices

### Development

- Use restrictive IP ranges instead of `0.0.0.0/0`
- Enable encryption at rest (included by default)
- Use secure password management

### Production

- Set `publiclyAccessible: false`
- Configure `allowedCidrBlocks` with specific IP ranges
- Enable `multiAz: true` for high availability
- Set `deletionProtection: true`
- Use longer `backupRetentionDays` (e.g., 30)
- Set `skipFinalSnapshot: false`

## 📈 Monitoring

The infrastructure includes:

- **Performance Insights** for query analysis
- **Enhanced monitoring** with 60-second intervals
- **CloudWatch logs** for PostgreSQL logs
- **Optimized parameter group** with safe dynamic parameters

## 🔄 Maintenance

### Regular Tasks

- Monitor Performance Insights dashboard
- Review CloudWatch logs for slow queries
- Update database engine version during maintenance windows
- Review and rotate database passwords

### Scaling

- Adjust `dbInstanceClass` for compute scaling
- Storage auto-scaling is enabled (20GB to 100GB)
- Enable `multiAz` for high availability

## 🧹 Cleanup

```bash
# Destroy infrastructure (be careful!)
pulumi destroy

# Remove stack
pulumi stack rm <stack-name>
```

## ⚠️ Parameter Group Notes

The RDS parameter group uses only dynamic parameters that can be applied immediately without requiring a database restart. Static parameters (like `shared_preload_libraries`) require careful handling and database restarts, so they are not included in the automated configuration.

For advanced PostgreSQL configuration requiring static parameters, consider:

1. Creating a custom parameter group manually in the AWS console
2. Applying static parameters during maintenance windows
3. Using separate parameter group updates with proper scheduling

## 📖 Additional Resources

- [Pulumi AWS Provider Documentation](https://www.pulumi.com/registry/packages/aws/)
- [RDS PostgreSQL Documentation](https://docs.aws.amazon.com/rds/latest/userguide/CHAP_PostgreSQL.html)
- [PostgreSQL 16 Release Notes](https://www.postgresql.org/docs/16/release-16.html)
- [AWS RDS Parameter Groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithParamGroups.html)

## 🤝 Contributing

When making changes to infrastructure:

1. Test in development environment first
2. Update this README if adding new configuration options
3. Follow the existing naming conventions
4. Add appropriate tags to new resources
5. Update example configuration files
6. Be careful with RDS parameter changes - test thoroughly
