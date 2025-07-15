# ECS Deployment Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. **Pulumi Output Objects in Environment Variables**

**Problem**: Environment variables contain Pulumi `Output<T>` objects instead of actual values.

**Symptoms**:
```
InvalidAddress: The address Calling [toJSON] on an [Output<T>] is not supported
```

**Solutions**:
```typescript
// ❌ BAD - Creates Output objects
environment: [
  {
    name: "QUEUE_URL",
    value: queue.url  // This is Output<string>!
  }
]

// ✅ GOOD - Use apply() method
environment: queue.url.apply(url => [
  {
    name: "QUEUE_URL",
    value: url
  }
])

// ✅ ALTERNATIVE - Use pulumi.all() for multiple outputs
environment: pulumi.all([queue.url, db.connectionString]).apply(([queueUrl, dbUrl]) => [
  { name: "QUEUE_URL", value: queueUrl },
  { name: "DATABASE_URL", value: dbUrl }
])
```

### 2. **ECS Task Definition Caching**

**Problem**: Old task definitions keep running even after deploying fixes.

**Quick Fixes**:
```bash
# Force new deployment
aws ecs update-service --cluster wetarseel-dev --service wetarseel-dev-api --force-new-deployment

# Stop all running tasks (they'll restart with new definition)
aws ecs list-tasks --cluster wetarseel-dev --service-name wetarseel-dev-api --query 'taskArns[]' --output text | \
xargs -I {} aws ecs stop-task --cluster wetarseel-dev --task {}
```

### 3. **Mixed Logs from Multiple Tasks**

**Problem**: Multiple task versions running simultaneously create confusing logs.

**Debug Commands**:
```bash
# List all running tasks
aws ecs list-tasks --cluster wetarseel-dev --service-name wetarseel-dev-api

# Get task details to see which task definition version
aws ecs describe-tasks --cluster wetarseel-dev --tasks TASK_ARN

# Filter logs by specific task
aws logs filter-log-events --log-group-name /ecs/wetarseel-dev-api --filter-pattern "TASK_ID"
```

## 🔧 **Deployment Best Practices**

### **1. Always Validate Environment Variables**
```typescript
// Add validation in your Pulumi code
const validateEnvVars = (envVars: any[]) => {
  envVars.forEach(env => {
    if (typeof env.value !== 'string') {
      throw new Error(`Environment variable ${env.name} is not a string: ${typeof env.value}`);
    }
  });
  return envVars;
};

// Use in task definition
environment: queue.url.apply(url => validateEnvVars([
  { name: "QUEUE_URL", value: url }
]))
```

### **2. Deployment Verification Script**
```bash
#!/bin/bash
# deploy-and-verify.sh

echo "🚀 Deploying infrastructure..."
pulumi up --yes

echo "⏳ Waiting for deployment to stabilize..."
sleep 30

echo "🔍 Checking service status..."
aws ecs describe-services --cluster wetarseel-dev --services wetarseel-dev-api

echo "📋 Listing running tasks..."
aws ecs list-tasks --cluster wetarseel-dev --service-name wetarseel-dev-api

echo "🏥 Testing health endpoint..."
curl -f https://api.uae.wetarseel.ai/health || echo "❌ Health check failed"

echo "📊 Checking recent logs..."
aws logs tail /ecs/wetarseel-dev-api --since 5m
```

### **3. Environment Variable Debugging**
```typescript
// Add to your app startup
console.log('🔍 Environment Variables Check:');
const requiredEnvVars = ['WHATSAPP_SQS_QUEUE_URL', 'DATABASE_URL'];
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
  if (value && value.includes('Output')) {
    console.error(`🚨 ${envVar} contains Pulumi Output object!`);
  }
});
```

## 🚨 **Emergency Recovery Commands**

### **When Everything is Broken**:
```bash
# 1. Stop all tasks (forces restart with latest task definition)
aws ecs update-service --cluster wetarseel-dev --service wetarseel-dev-api --desired-count 0
sleep 10
aws ecs update-service --cluster wetarseel-dev --service wetarseel-dev-api --desired-count 1

# 2. Check what task definition is actually being used
aws ecs describe-services --cluster wetarseel-dev --services wetarseel-dev-api \
  --query 'services[0].taskDefinition' --output text

# 3. Force deployment of latest task definition
aws ecs update-service --cluster wetarseel-dev --service wetarseel-dev-api --force-new-deployment
```

### **When Logs are Confusing**:
```bash
# Get clean logs from only the latest task
LATEST_TASK=$(aws ecs list-tasks --cluster wetarseel-dev --service-name wetarseel-dev-api \
  --query 'taskArns[0]' --output text | cut -d'/' -f3)

aws logs filter-log-events --log-group-name /ecs/wetarseel-dev-api \
  --filter-pattern "$LATEST_TASK" --start-time $(date -d '5 minutes ago' +%s)000
```

## 🎯 **Prevention Checklist**

Before deploying:
- [ ] All environment variables use `.apply()` for Pulumi outputs
- [ ] Test environment variables locally first
- [ ] Have rollback plan ready
- [ ] Know how to check task status
- [ ] Have log filtering commands ready

After deploying:
- [ ] Verify only one task definition version is running
- [ ] Check health endpoints
- [ ] Verify environment variables are set correctly
- [ ] Test core functionality

## 📚 **Useful Commands Reference**

```bash
# Service status
aws ecs describe-services --cluster wetarseel-dev --services wetarseel-dev-api

# Task definitions
aws ecs list-task-definitions --family-prefix wetarseel-dev-api

# Force new deployment
aws ecs update-service --cluster wetarseel-dev --service wetarseel-dev-api --force-new-deployment

# Live logs
aws logs tail /ecs/wetarseel-dev-api --follow

# Environment variables in running task
aws ecs describe-tasks --cluster wetarseel-dev --tasks TASK_ARN \
  --query 'tasks[0].containers[0].environment'
```
