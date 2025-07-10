# Preventing RDS Replacement - Quick Fix Guide

## 🚨 Problem

Pulumi wants to replace your existing RDS instance, which would cause downtime and data loss.

## ✅ Solutions (Choose One)

### Option 1: Import Existing RDS (Recommended)

```bash
# Run the import script
./scripts/import-existing-rds.sh dev

# Or manually import
pulumi import aws:rds/instance:Instance my-postgres your-actual-db-identifier
```

### Option 2: Use ignoreChanges (Temporary Fix)

I've already added this to your `index.ts`:

```typescript
{
  ignoreChanges: [
    "availabilityZone",
    "backupTarget",
    "caCertIdentifier",
    // ... other properties
  ],
}
```

### Option 3: Reference Existing DB Instead of Managing It

Replace the RDS creation with a data source:

```typescript
// Instead of creating new RDS instance, reference existing one
const existingDb = aws.rds.getInstanceOutput({
  identifier: "your-existing-db-identifier", // Replace with actual ID
});

// Export the existing DB properties
export const dbEndpoint = existingDb.endpoint;
export const dbAddress = existingDb.address;
// ... etc
```

## 🔧 Quick Fix Commands

### Check what would change:

```bash
cd apps/infra
pulumi preview --diff
```

### Import existing RDS (safest):

```bash
# Find your RDS identifier
aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier' --output table

# Import it
pulumi import aws:rds/instance:Instance my-postgres YOUR-ACTUAL-DB-IDENTIFIER
```

## 🛡️ What I Added to Prevent Replacement

In your `index.ts`, I added `ignoreChanges` to the RDS resource options:

```typescript
{
  protect: isProduction,
  ignoreChanges: [
    "availabilityZone",
    "backupTarget",
    "caCertIdentifier",
    "databaseInsightsMode",
    "engineLifecycleSupport",
    "iops",
    "kmsKeyId",
    "licenseModel",
    "networkType",
    "optionGroupName",
    "allocatedStorage",
    "engineVersion",
  ],
}
```

This tells Pulumi to ignore changes to these properties that might trigger a replacement.

## ⚠️ Important Notes

1. **Don't run `pulumi up`** until you've either imported or fixed the configuration
2. **Always run `pulumi preview`** first to see what would change
3. **Use the import script** for the safest approach
4. **Back up your database** before making any changes

## 🎯 Recommended Action

Run this command to safely import your existing RDS:

```bash
./scripts/import-existing-rds.sh dev
```

This will import your existing database into Pulumi's state without recreating it.
