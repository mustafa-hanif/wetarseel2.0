# Deployment Safety Checklist

## Pre-Deployment Checklist

### For Development Environment (`dev` stack)

- [ ] Verified you're on the correct stack: `pulumi stack ls`
- [ ] Reviewed configuration: `pulumi config`
- [ ] Ran preview first: `pulumi preview`
- [ ] Confirmed resource names include `-v2` suffix
- [ ] Checked no existing critical data will be affected

### For Production Environment (`prod` stack)

- [ ] **CRITICAL**: Verified you're on the correct stack: `pulumi stack ls`
- [ ] **CRITICAL**: Created manual backup: `aws rds create-db-snapshot`
- [ ] **CRITICAL**: Coordinated with team (Slack/email notification)
- [ ] **CRITICAL**: Reviewed all configuration changes
- [ ] **CRITICAL**: Confirmed deletion protection is enabled
- [ ] **CRITICAL**: Confirmed final snapshots are enabled
- [ ] **CRITICAL**: Verified restricted CIDR blocks for security
- [ ] **CRITICAL**: Scheduled during maintenance window
- [ ] **CRITICAL**: Have rollback plan ready

## Deployment Commands

### Safe Deployment Process

```bash
# 1. Check current state
pulumi stack ls
pulumi stack output

# 2. Review what will change
pulumi preview

# 3. Deploy only if preview looks correct
pulumi up

# 4. Verify deployment
pulumi stack output
```

### Emergency Rollback

```bash
# If something goes wrong
pulumi refresh
pulumi cancel  # if update is in progress

# Create emergency backup
aws rds create-db-snapshot \
  --db-snapshot-identifier emergency-$(date +%Y%m%d-%H%M%S) \
  --db-instance-identifier wetarseel-prod-postgres-v2
```

## Post-Deployment Verification

- [ ] All outputs are correct: `pulumi stack output`
- [ ] Database is accessible from applications
- [ ] Performance Insights is enabled
- [ ] CloudWatch logs are flowing
- [ ] Backup retention settings are correct
- [ ] Security group rules are properly configured

## Common Issues and Solutions

### Issue: "Parameter group already exists"

**Solution**: The code now uses versioned names (-v2) to prevent conflicts

### Issue: "Database instance already exists"

**Solution**: Resource identifiers now include version suffix

### Issue: "Cannot delete - deletion protection enabled"

**Solution**: This is intentional! Disable only if you really need to delete:

```bash
pulumi config set deletionProtection false
pulumi up
```

## Team Communication Template

### Before Production Deployment

```
🚨 PRODUCTION DATABASE DEPLOYMENT SCHEDULED

Environment: Production
Stack: prod
Changes: [describe changes]
Timing: [maintenance window]
Backup: [snapshot ID]
Rollback Plan: [describe plan]

Please acknowledge if this affects your work.
```

### After Deployment

```
✅ PRODUCTION DATABASE DEPLOYMENT COMPLETE

Environment: Production
Status: Success/Failed
Database Endpoint: [from pulumi output]
Issues: None/[describe any issues]
Next Steps: [if any]
```
