import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Stack configuration
const config = new pulumi.Config();
const stackName = pulumi.getStack();
const projectName = pulumi.getProject();

// Safety check: Prevent accidental deployment to production-like resources
const isDevelopment = stackName === "dev" || stackName === "development";
const isProduction = stackName === "prod" || stackName === "production";

// Environment-specific configuration
const dbPassword = config.requireSecret("dbPassword");
const environment = config.get("environment") ?? stackName;
const region = config.get("aws:region") ?? "me-central-1";

// Safety warning for production
if (isProduction) {
  console.warn("⚠️  WARNING: Deploying to PRODUCTION environment!");
  console.warn("⚠️  Ensure you have:");
  console.warn("   - Backed up existing data");
  console.warn("   - Reviewed all configuration changes");
  console.warn("   - Coordinated with your team");
}

// Common tags for all resources
const commonTags = {
  Environment: environment,
  Project: projectName,
  Stack: stackName,
  ManagedBy: "Pulumi",
  CreatedAt: new Date().toISOString().split("T")[0],
};

// Get current AWS region and account
const current = aws.getCallerIdentity({});
const currentRegion = aws.getRegion({});

// Use default VPC and subnets with better typing
const vpc = aws.ec2.getVpc({
  default: true,
});

const availabilityZones = aws.getAvailabilityZones({
  state: "available",
});

// Get subnets for RDS deployment
const subnets = vpc.then((v) =>
  aws.ec2.getSubnets({
    filters: [{ name: "vpc-id", values: [v.id] }],
  })
);

// Security Group: PostgreSQL access with restricted ingress
const dbSecurityGroup = new aws.ec2.SecurityGroup("db-sg", {
  name: `${projectName}-${environment}-db-sg`,
  description: "Security group for PostgreSQL database",
  vpcId: vpc.then((v) => v.id),
  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-db-sg`,
    Purpose: "Database",
  },
});

// Security Group Rules (separate resources for better management)
const dbIngressRule = new aws.ec2.SecurityGroupRule("db-ingress", {
  type: "ingress",
  fromPort: 5432,
  toPort: 5432,
  protocol: "tcp",
  // In production, replace this with specific CIDR blocks or security group IDs
  cidrBlocks: config.getObject<string[]>("allowedCidrBlocks") ?? ["0.0.0.0/0"],
  securityGroupId: dbSecurityGroup.id,
  description: "PostgreSQL access",
});

const dbEgressRule = new aws.ec2.SecurityGroupRule("db-egress", {
  type: "egress",
  fromPort: 0,
  toPort: 0,
  protocol: "-1",
  cidrBlocks: ["0.0.0.0/0"],
  securityGroupId: dbSecurityGroup.id,
  description: "All outbound traffic",
});

// DB Subnet Group with better naming and tags
const dbSubnetGroup = new aws.rds.SubnetGroup("db-subnet-group", {
  name: `${projectName}-${environment}-db-subnet-group`,
  description: `Database subnet group for ${projectName} ${environment}`,
  subnetIds: subnets.then((s) => s.ids),
  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-db-subnet-group`,
    Purpose: "Database",
  },
});

// Enhanced monitoring role for RDS
const enhancedMonitoringRole = new aws.iam.Role("rds-enhanced-monitoring", {
  name: `${projectName}-${environment}-rds-enhanced-monitoring`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "monitoring.rds.amazonaws.com",
        },
      },
    ],
  }),
  tags: commonTags,
});

const enhancedMonitoringPolicyAttachment = new aws.iam.RolePolicyAttachment(
  "rds-enhanced-monitoring-policy",
  {
    role: enhancedMonitoringRole.name,
    policyArn:
      "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
  }
);

// RDS Parameter Group for PostgreSQL optimization
const dbParameterGroup = new aws.rds.ParameterGroup("db-parameter-group", {
  name: `${projectName}-${environment}-postgres16-v2`,
  family: "postgres16",
  description: `Parameter group for ${projectName} ${environment} PostgreSQL v2`,
  parameters: [
    {
      name: "log_min_duration_statement",
      value: "1000", // Log queries taking more than 1 second (dynamic parameter)
      applyMethod: "immediate",
    },
    {
      name: "log_connections",
      value: "1", // Log connection attempts (dynamic parameter)
      applyMethod: "immediate",
    },
    {
      name: "log_disconnections",
      value: "1", // Log disconnections (dynamic parameter)
      applyMethod: "immediate",
    },
    {
      name: "work_mem",
      value: "4096", // 4MB work memory (dynamic parameter)
      applyMethod: "immediate",
    },
  ],
  tags: commonTags,
});

// RDS PostgreSQL Instance with modern configuration
const dbInstance = new aws.rds.Instance("my-postgres", {
  identifier: `${projectName}-${environment}-postgres-v2`, // v2 to prevent accidental replacement
  allocatedStorage: 20,
  maxAllocatedStorage: 100, // Enable storage autoscaling
  storageType: "gp3", // Use GP3 for better performance and cost
  storageEncrypted: true, // Enable encryption at rest

  engine: "postgres",
  engineVersion: "16.4", // Latest PostgreSQL version
  instanceClass: config.get("dbInstanceClass") ?? "db.t3.micro",

  dbName: config.get("dbName") ?? "wetarseel",
  username: config.get("dbUsername") ?? "dbadmin",
  password: dbPassword,

  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [dbSecurityGroup.id],
  parameterGroupName: dbParameterGroup.name,

  // Backup and maintenance
  backupRetentionPeriod: config.getNumber("backupRetentionDays") ?? 7,
  backupWindow: "03:00-04:00", // UTC
  maintenanceWindow: "sun:04:00-sun:05:00", // UTC
  autoMinorVersionUpgrade: true,

  // Availability and access
  publiclyAccessible: config.getBoolean("publiclyAccessible") ?? true,
  multiAz: config.getBoolean("multiAz") ?? false,

  // Performance and monitoring
  performanceInsightsEnabled: true,
  performanceInsightsRetentionPeriod: 7,
  monitoringInterval: 60,
  monitoringRoleArn: enhancedMonitoringRole.arn,
  enabledCloudwatchLogsExports: ["postgresql"],

  // Deletion protection - CRITICAL for production safety
  skipFinalSnapshot: config.getBoolean("skipFinalSnapshot") ?? false, // Safe default: take snapshot
  deletionProtection: config.getBoolean("deletionProtection") ?? true, // Safe default: enable protection

  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-postgres`,
    Purpose: "Database",
    Engine: "PostgreSQL",
    Version: "16.4",
  },
});

// Outputs for other applications to consume
export const dbEndpoint = dbInstance.endpoint;
export const dbAddress = dbInstance.address;
export const dbPort = dbInstance.port;
export const dbName = dbInstance.dbName;
export const dbUsername = dbInstance.username;

// Connection string for applications (without password)
export const dbConnectionString = pulumi.interpolate`postgresql://${dbInstance.username}@${dbInstance.endpoint}/${dbInstance.dbName}`;

// Security group ID for application servers
export const dbSecurityGroupId = dbSecurityGroup.id;

// Additional metadata
export const deploymentEnvironment = environment;
export const deploymentRegion = region;
export const vpcId = vpc.then((v) => v.id);

// Resource ARNs for cross-stack references
export const dbInstanceArn = dbInstance.arn;
export const dbSubnetGroupArn = dbSubnetGroup.arn;
