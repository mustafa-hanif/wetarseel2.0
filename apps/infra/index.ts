import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as command from "@pulumi/command";
import * as docker_build from "@pulumi/docker-build";

// Install @pulumi/command for build automation
// Run: npm install @pulumi/command

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
const region = "me-central-1";

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
      name: "shared_buffers",
      value: "{DBInstanceClassMemory/32768}", // 25% of available memory
      applyMethod: "pending-reboot", // Requires restart
    },
    {
      name: "effective_cache_size",
      value: "{DBInstanceClassMemory/16384}", // 75% of available memory
      applyMethod: "immediate",
    },
    {
      name: "checkpoint_completion_target",
      value: "0.9",
      applyMethod: "immediate",
    },
    {
      name: "wal_buffers",
      value: "16MB",
      applyMethod: "pending-reboot",
    },
    {
      name: "default_statistics_target",
      value: "100",
      applyMethod: "immediate",
    },
    {
      name: "random_page_cost",
      value: "1.1", // For SSD storage
      applyMethod: "immediate",
    },
    {
      name: "work_mem",
      value: "8MB", // Increased from 4MB
      applyMethod: "immediate",
    },
  ],
  tags: commonTags,
});

// RDS PostgreSQL Instance
const dbInstance = new aws.rds.Instance(
  "my-postgres",
  {
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
  },
  {
    // Protect the RDS instance from accidental deletion/replacement
    protect: isProduction,
    // Prevent replacement by ignoring changes to certain properties
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
      "allocatedStorage", // Prevent replacement due to storage changes
      "engineVersion", // Prevent replacement due to version changes
      "backupRetentionPeriod", // Ignore backup retention changes
      "skipFinalSnapshot", // Ignore snapshot setting changes
      "deletionProtection", // Ignore deletion protection changes
      "applyImmediately", // Ignore apply immediately changes
      "password", // Ignore password changes to prevent updates
    ],
  }
);

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

// ============================================================================
// DYNAMODB INFRASTRUCTURE FOR LAMBDA FUNCTIONS
// ============================================================================

// DynamoDB Table for WebSocket connections
const dynamoTable = new aws.dynamodb.Table("wetable", {
  name: `${projectName}-${environment}-wetable`,
  billingMode: "PAY_PER_REQUEST",

  attributes: [
    {
      name: "pk",
      type: "S",
    },
    {
      name: "sk",
      type: "S",
    },
  ],

  hashKey: "pk",
  rangeKey: "sk",

  tags: {
    ...commonTags,
    Purpose: "WebSocketConnections",
  },
});

// ============================================================================
// LAMBDA INFRASTRUCTURE
// ============================================================================

// IAM Role for Lambda functions
const lambdaRole = new aws.iam.Role("lambda-role", {
  name: `${projectName}-${environment}-lambda-role`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
      },
    ],
  }),
  tags: commonTags,
});

// Attach basic Lambda execution policy
const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
  "lambda-basic-execution",
  {
    role: lambdaRole.name,
    policyArn:
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  }
);

// Custom policy for DynamoDB and API Gateway Management
const lambdaCustomPolicy = new aws.iam.RolePolicy("lambda-custom-policy", {
  role: lambdaRole.id,
  policy: pulumi.all([dynamoTable.arn]).apply(([tableArn]) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:DeleteItem",
            "dynamodb:UpdateItem",
            "dynamodb:Query",
            "dynamodb:Scan",
          ],
          Resource: [tableArn, `${tableArn}/index/*`],
        },
        {
          Effect: "Allow",
          Action: ["execute-api:ManageConnections"],
          Resource: "*",
        },
      ],
    })
  ),
});

// Build Lambda function
const buildLambda = new command.local.Command("build-lambda", {
  create: "cd ../lambda && pnpm install",
});

// ============================================================================
// STATIC WEBSITE INFRASTRUCTURE
// ============================================================================
const buildTrigger = Date.now().toString(); // Forces rebuild every time

const installDeps = new command.local.Command("install-deps", {
  create: "cd ../web && pnpm install",
});

const buildSite = new command.local.Command(
  "build",
  {
    create:
      "cd ../web && pnpm install && VITE_API_URL=https://api.uae.wetarseel.ai pnpm run build",
    update:
      "cd ../web && pnpm install && VITE_API_URL=https://api.uae.wetarseel.ai pnpm run build",
    triggers: [buildTrigger],
  },
  { dependsOn: [installDeps] }
);

// S3 Bucket for static website hosting
const websiteBucket = new aws.s3.Bucket(
  "website-bucket",
  {
    bucket: `${projectName}-${environment}-website`,
    website: {
      indexDocument: "index.html",
      errorDocument: "404.html",
    },
    tags: {
      ...commonTags,
      Purpose: "StaticWebsite",
    },
  },
  { dependsOn: [buildSite] }
);

// Create deployment package for Lambda
const lambdaArchive = new aws.s3.BucketObject(
  "lambda-archive",
  {
    bucket: websiteBucket.id,
    key: `lambda/${environment}/lambda-deployment.zip`,
    source: new pulumi.asset.FileArchive("../lambda"),
    tags: commonTags,
  },
  { dependsOn: [buildLambda] }
);

// Lambda code archive - builds from source
const lambdaCodeArchive = new pulumi.asset.FileArchive("../lambda/dist");

// Lambda functions - now deployed from source code
const onConnectFunction = new aws.lambda.Function(
  "onconnect",
  {
    name: `${projectName}-${environment}-onconnect`,
    role: lambdaRole.arn,
    handler: "handler.onconnect",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    timeout: 30,
    memorySize: 1024,

    // Use source code from dist directory
    code: lambdaCodeArchive,

    environment: {
      variables: {
        DYNAMODB_TABLE_NAME: dynamoTable.name,
        ENVIRONMENT: environment,
      },
    },

    tags: {
      ...commonTags,
      Purpose: "WebSocketOnConnect",
    },
  },
  {
    dependsOn: [lambdaCustomPolicy, lambdaBasicExecution],
    // Remove protect to allow code updates
  }
);

const onDisconnectFunction = new aws.lambda.Function(
  "ondisconnect",
  {
    name: `${projectName}-${environment}-ondisconnect`,
    role: lambdaRole.arn,
    handler: "handler.ondisconnect",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    timeout: 30,
    memorySize: 1024,

    // Use source code from dist directory
    code: lambdaCodeArchive,

    environment: {
      variables: {
        DYNAMODB_TABLE_NAME: dynamoTable.name,
        ENVIRONMENT: environment,
      },
    },

    tags: {
      ...commonTags,
      Purpose: "WebSocketOnDisconnect",
    },
  },
  {
    dependsOn: [lambdaCustomPolicy, lambdaBasicExecution],
    // Remove protect to allow code updates
  }
);

const onMessageFunction = new aws.lambda.Function(
  "onmessage",
  {
    name: `${projectName}-${environment}-onmessage`,
    role: lambdaRole.arn,
    handler: "handler.onmessage",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    timeout: 30,
    memorySize: 1024,

    // Use source code from dist directory
    code: lambdaCodeArchive,

    environment: {
      variables: {
        DYNAMODB_TABLE_NAME: dynamoTable.name,
        ENVIRONMENT: environment,
      },
    },

    tags: {
      ...commonTags,
      Purpose: "WebSocketOnMessage",
    },
  },
  {
    dependsOn: [lambdaCustomPolicy, lambdaBasicExecution],
    // Remove protect to allow code updates
  }
);

const onDefaultFunction = new aws.lambda.Function(
  "ondefault",
  {
    name: `${projectName}-${environment}-ondefault`,
    role: lambdaRole.arn,
    handler: "handler.ondefault",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    timeout: 30,
    memorySize: 1024,

    // Use source code from dist directory
    code: lambdaCodeArchive,

    environment: {
      variables: {
        DYNAMODB_TABLE_NAME: dynamoTable.name,
        ENVIRONMENT: environment,
      },
    },

    tags: {
      ...commonTags,
      Purpose: "WebSocketDefault",
    },
  },
  {
    dependsOn: [lambdaCustomPolicy, lambdaBasicExecution],
    // Remove protect to allow code updates
  }
);

// ============================================================================
// API GATEWAY WEBSOCKET API
// ============================================================================

// WebSocket API
const webSocketApi = new aws.apigatewayv2.Api("websocket-api", {
  name: `${projectName}-${environment}-websocket`,
  protocolType: "WEBSOCKET",
  routeSelectionExpression: "$request.body.action",
  tags: {
    ...commonTags,
    Purpose: "WebSocketAPI",
  },
});

// API Gateway integrations
const onConnectIntegration = new aws.apigatewayv2.Integration(
  "connect-integration",
  {
    apiId: webSocketApi.id,
    integrationType: "AWS_PROXY",
    integrationUri: onConnectFunction.invokeArn,
  }
);

const onDisconnectIntegration = new aws.apigatewayv2.Integration(
  "disconnect-integration",
  {
    apiId: webSocketApi.id,
    integrationType: "AWS_PROXY",
    integrationUri: onDisconnectFunction.invokeArn,
  }
);

const onMessageIntegration = new aws.apigatewayv2.Integration(
  "message-integration",
  {
    apiId: webSocketApi.id,
    integrationType: "AWS_PROXY",
    integrationUri: onMessageFunction.invokeArn,
  }
);

const onDefaultIntegration = new aws.apigatewayv2.Integration(
  "default-integration",
  {
    apiId: webSocketApi.id,
    integrationType: "AWS_PROXY",
    integrationUri: onDefaultFunction.invokeArn,
  }
);

// API Gateway routes
const connectRoute = new aws.apigatewayv2.Route("connect-route", {
  apiId: webSocketApi.id,
  routeKey: "$connect",
  target: pulumi.interpolate`integrations/${onConnectIntegration.id}`,
});

const disconnectRoute = new aws.apigatewayv2.Route("disconnect-route", {
  apiId: webSocketApi.id,
  routeKey: "$disconnect",
  target: pulumi.interpolate`integrations/${onDisconnectIntegration.id}`,
});

const messageRoute = new aws.apigatewayv2.Route("message-route", {
  apiId: webSocketApi.id,
  routeKey: "message",
  target: pulumi.interpolate`integrations/${onMessageIntegration.id}`,
});

const defaultRoute = new aws.apigatewayv2.Route("default-route", {
  apiId: webSocketApi.id,
  routeKey: "$default",
  target: pulumi.interpolate`integrations/${onDefaultIntegration.id}`,
});

// Lambda permissions for API Gateway
const onConnectPermission = new aws.lambda.Permission("onconnect-permission", {
  statementId: "AllowExecutionFromAPIGateway",
  action: "lambda:InvokeFunction",
  function: onConnectFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${webSocketApi.executionArn}/*/*`,
});

const onDisconnectPermission = new aws.lambda.Permission(
  "ondisconnect-permission",
  {
    statementId: "AllowExecutionFromAPIGateway",
    action: "lambda:InvokeFunction",
    function: onDisconnectFunction.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${webSocketApi.executionArn}/*/*`,
  }
);

const onMessagePermission = new aws.lambda.Permission("onmessage-permission", {
  statementId: "AllowExecutionFromAPIGateway",
  action: "lambda:InvokeFunction",
  function: onMessageFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${webSocketApi.executionArn}/*/*`,
});

const onDefaultPermission = new aws.lambda.Permission("ondefault-permission", {
  statementId: "AllowExecutionFromAPIGateway",
  action: "lambda:InvokeFunction",
  function: onDefaultFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${webSocketApi.executionArn}/*/*`,
});

// API Gateway stage
const webSocketStage = new aws.apigatewayv2.Stage("websocket-stage", {
  apiId: webSocketApi.id,
  autoDeploy: true,
  name: environment,
  tags: {
    ...commonTags,
    Purpose: "WebSocketStage",
  },
});

const websiteBucketOwnership = new aws.s3.BucketOwnershipControls(
  "website-bucket-ownership",
  {
    bucket: websiteBucket.id,
    rule: {
      objectOwnership: "ObjectWriter",
    },
  }
);

// S3 Bucket public access configuration
const websiteBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "website-bucket-pab",
  {
    bucket: websiteBucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  },
  { dependsOn: [websiteBucketOwnership] }
);

const deploySite = new command.local.Command(
  "deploy",
  {
    create: pulumi.interpolate`aws s3 sync ../web/dist s3://${websiteBucket.bucket} --delete --acl public-read`,
    update: pulumi.interpolate`aws s3 sync ../web/dist s3://${websiteBucket.bucket} --delete --acl public-read`,
    triggers: [buildTrigger],
  },
  {
    dependsOn: [
      buildSite,
      websiteBucket,
      websiteBucketOwnership,
      websiteBucketPublicAccessBlock,
    ],
  }
);

const websiteBucketPolicy2 = new aws.s3.BucketPolicy(
  "website-bucket-policy",
  {
    bucket: websiteBucket.id,
    policy: websiteBucket.arn.apply((bucketArn) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `${bucketArn}/*`,
          },
        ],
      })
    ),
  },
  { dependsOn: [websiteBucketPublicAccessBlock] }
);

// CloudFront Distribution for CDN
const cloudfrontDistribution = new aws.cloudfront.Distribution("website-cdn", {
  origins: [
    {
      domainName: websiteBucket.websiteEndpoint,
      originId: "S3-website",
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "http-only",
        originSslProtocols: ["TLSv1.2"],
      },
    },
  ],
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: "index.html",
  defaultCacheBehavior: {
    allowedMethods: [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT",
    ],
    cachedMethods: ["GET", "HEAD"],
    targetOriginId: "S3-website",
    compress: true,
    viewerProtocolPolicy: "redirect-to-https",
    forwardedValues: {
      queryString: false,
      cookies: { forward: "none" },
    },
    minTtl: 0,
    defaultTtl: 86400,
    maxTtl: 31536000,
  },
  customErrorResponses: [
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: "/index.html",
      errorCachingMinTtl: 300,
    },
    {
      errorCode: 403,
      responseCode: 200,
      responsePagePath: "/index.html",
      errorCachingMinTtl: 300,
    },
  ],
  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },
  aliases: ["uae.wetarseel.ai"],
  viewerCertificate: {
    acmCertificateArn:
      "arn:aws:acm:us-east-1:147997141811:certificate/46ffa677-09d8-4140-b93c-1be7642a8412",
    sslSupportMethod: "sni-only",
    minimumProtocolVersion: "TLSv1.2_2021",
  },
  tags: {
    ...commonTags,
    Purpose: "CDN",
  },
});

// Website outputs
export const websiteBucketName = websiteBucket.bucket;
export const websiteUrl = pulumi.interpolate`http://${websiteBucket.websiteEndpoint}`;
export const cloudfrontUrl = pulumi.interpolate`https://${cloudfrontDistribution.domainName}`;
export const cloudfrontDistributionId = cloudfrontDistribution.id;

const invalidateCloudFront = new command.local.Command(
  "invalidate",
  {
    create: pulumi.interpolate`aws cloudfront create-invalidation --distribution-id ${cloudfrontDistributionId} --paths "/*"`,
    triggers: [buildTrigger],
  },
  { dependsOn: [deploySite] }
);

// ============================================================================
// WHATSAPP WEBHOOK INFRASTRUCTURE
// ============================================================================

// Dead Letter Queue for failed messages
const whatsappDlq = new aws.sqs.Queue("whatsapp-events-dlq", {
  name: `${projectName}-${environment}-whatsapp-events-dlq`,
  messageRetentionSeconds: 1209600, // 14 days
  tags: {
    ...commonTags,
    Purpose: "WhatsAppWebhookDLQ",
  },
});

// SQS Queue for WhatsApp events with DLQ
const whatsappQueue = new aws.sqs.Queue("whatsapp-events-queue", {
  name: `${projectName}-${environment}-whatsapp-events`,
  visibilityTimeoutSeconds: 300,
  messageRetentionSeconds: 1209600, // 14 days
  redrivePolicy: pulumi.jsonStringify({
    deadLetterTargetArn: whatsappDlq.arn,
    maxReceiveCount: 3,
  }),
  tags: {
    ...commonTags,
    Purpose: "WhatsAppWebhook",
  },
});

// IAM policy for SQS access
const sqsPolicy = new aws.iam.RolePolicy("lambda-sqs-policy", {
  role: lambdaRole.id,
  policy: pulumi
    .all([whatsappQueue.arn, whatsappDlq.arn])
    .apply(([queueArn, dlqArn]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "sqs:SendMessage",
              "sqs:GetQueueAttributes",
              "sqs:GetQueueUrl",
            ],
            Resource: [queueArn, dlqArn],
          },
        ],
      })
    ),
});

// WhatsApp webhook Lambda function
const whatsappWebhookFunction = new aws.lambda.Function(
  "whatsapp-webhook",
  {
    name: `${projectName}-${environment}-whatsapp-webhook`,
    role: lambdaRole.arn,
    handler: "webhook.handler",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    timeout: 30,
    memorySize: 512,
    code: lambdaCodeArchive,
    environment: {
      variables: {
        SQS_QUEUE_URL: whatsappQueue.id,
        ENVIRONMENT: environment,
        WHATSAPP_VERIFY_TOKEN: "wetarseel-webhook-verify-token-2024", // You can change this to any secure token
      },
    },
    tags: {
      ...commonTags,
      Purpose: "WhatsAppWebhook",
    },
  },
  {
    dependsOn: [lambdaCustomPolicy, lambdaBasicExecution, sqsPolicy],
  }
);

// HTTP API Gateway for webhook
const httpApi = new aws.apigatewayv2.Api("whatsapp-webhook-api", {
  name: `${projectName}-${environment}-whatsapp-webhook`,
  protocolType: "HTTP",
  corsConfiguration: {
    allowCredentials: false,
    allowHeaders: ["*"],
    allowMethods: ["GET", "POST"],
    allowOrigins: ["*"],
    maxAge: 86400,
  },
  tags: {
    ...commonTags,
    Purpose: "WhatsAppWebhookAPI",
  },
});

// HTTP API integration
const webhookIntegration = new aws.apigatewayv2.Integration(
  "webhook-integration",
  {
    apiId: httpApi.id,
    integrationType: "AWS_PROXY",
    integrationUri: whatsappWebhookFunction.invokeArn,
    payloadFormatVersion: "2.0",
  }
);

// HTTP API routes
const webhookGetRoute = new aws.apigatewayv2.Route("webhook-get-route", {
  apiId: httpApi.id,
  routeKey: "GET /webhook",
  target: pulumi.interpolate`integrations/${webhookIntegration.id}`,
});

const webhookPostRoute = new aws.apigatewayv2.Route("webhook-post-route", {
  apiId: httpApi.id,
  routeKey: "POST /webhook",
  target: pulumi.interpolate`integrations/${webhookIntegration.id}`,
});

// Lambda permission for HTTP API Gateway
const webhookPermission = new aws.lambda.Permission("webhook-permission", {
  statementId: "AllowExecutionFromHTTPAPIGateway",
  action: "lambda:InvokeFunction",
  function: whatsappWebhookFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${httpApi.executionArn}/*/*`,
});

// HTTP API stage
const httpApiStage = new aws.apigatewayv2.Stage("webhook-stage", {
  apiId: httpApi.id,
  autoDeploy: true,
  name: environment,
  tags: {
    ...commonTags,
    Purpose: "WhatsAppWebhookStage",
  },
});

// ============================================================================
// LAMBDA AND WEBSOCKET OUTPUTS
// ============================================================================

// DynamoDB outputs
export const dynamoTableName = dynamoTable.name;
export const dynamoTableArn = dynamoTable.arn;

// Lambda function outputs
export const onConnectFunctionArn = onConnectFunction.arn;
export const onDisconnectFunctionArn = onDisconnectFunction.arn;
export const onMessageFunctionArn = onMessageFunction.arn;
export const onDefaultFunctionArn = onDefaultFunction.arn;

// WebSocket API outputs
export const webSocketApiId = webSocketApi.id;
export const webSocketApiEndpoint = pulumi.interpolate`${webSocketApi.apiEndpoint}/${webSocketStage.name}`;
export const webSocketUrl = pulumi.interpolate`wss://${webSocketApi.id}.execute-api.${region}.amazonaws.com/${webSocketStage.name}`;

// Lambda role outputs for cross-stack references
export const lambdaRoleArn = lambdaRole.arn;

// WhatsApp webhook outputs
export const whatsappQueueUrl = whatsappQueue.id;
export const whatsappQueueArn = whatsappQueue.arn;
export const whatsappDlqUrl = whatsappDlq.id;
export const whatsappDlqArn = whatsappDlq.arn;
export const whatsappWebhookFunctionArn = whatsappWebhookFunction.arn;
export const whatsappWebhookUrl = pulumi.interpolate`https://${httpApi.id}.execute-api.${region}.amazonaws.com/${httpApiStage.name}/webhook`;
export const httpApiId = httpApi.id;
export const httpApiEndpoint = pulumi.interpolate`https://${httpApi.id}.execute-api.${region}.amazonaws.com/${httpApiStage.name}`;

// ============================================================================
// ECS FARGATE INFRASTRUCTURE
// ============================================================================

// ECR Repository for API container images
const ecrRepository = new aws.ecr.Repository("api-ecr-repo", {
  name: `${projectName}-${environment}-api`,
  imageTagMutability: "MUTABLE",
  imageScanningConfiguration: {
    scanOnPush: true,
  },
  tags: {
    ...commonTags,
    Purpose: "ContainerRegistry",
  },
});

// ECR Lifecycle Policy to manage image retention
const ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy("api-ecr-lifecycle", {
  repository: ecrRepository.name,
  policy: JSON.stringify({
    rules: [
      {
        rulePriority: 1,
        description: "Keep last 10 images",
        selection: {
          tagStatus: "untagged",
          countType: "imageCountMoreThan",
          countNumber: 5,
        },
        action: {
          type: "expire",
        },
      },
    ],
  }),
});

// Build and push Docker image to ECR using modern docker-build provider
const imageTag = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Get ECR auth credentials
const authToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: ecrRepository.registryId,
});

const apiImage = new docker_build.Image("api-image", {
  tags: [pulumi.interpolate`${ecrRepository.repositoryUrl}:${imageTag}`],
  context: {
    location: "../api",
  },
  // Build for ARM64 (cheaper Fargate instances)
  platforms: ["linux/arm64"],
  // Push the final result to ECR
  push: true,
  // Provide ECR credentials
  registries: [
    {
      address: ecrRepository.repositoryUrl,
      password: authToken.password,
      username: authToken.userName,
    },
  ],
});

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster("api-cluster", {
  name: `${projectName}-${environment}-cluster`,
  settings: [
    {
      name: "containerInsights",
      value: "enabled",
    },
  ],
  tags: {
    ...commonTags,
    Purpose: "ContainerOrchestration",
  },
});

// ECS Task Execution Role
const ecsTaskExecutionRole = new aws.iam.Role("ecs-task-execution-role", {
  name: `${projectName}-${environment}-ecs-task-execution-role`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "ecs-tasks.amazonaws.com",
        },
      },
    ],
  }),
  tags: {
    ...commonTags,
    Purpose: "ECSTaskExecution",
  },
});

// Attach the AWS managed policy for ECS task execution
const ecsTaskExecutionRolePolicy = new aws.iam.RolePolicyAttachment(
  "ecs-task-execution-role-policy",
  {
    role: ecsTaskExecutionRole.name,
    policyArn:
      "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  }
);

// Additional policy for CloudWatch logs
const ecsTaskExecutionLogsPolicy = new aws.iam.Policy(
  "ecs-task-execution-logs-policy",
  {
    name: `${projectName}-${environment}-ecs-task-execution-logs-policy`,
    description:
      "Policy for ECS task execution to create CloudWatch log groups",
    policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          Resource: "*",
        },
      ],
    }),
    tags: {
      ...commonTags,
      Purpose: "ECSTaskExecutionLogs",
    },
  }
);

const ecsTaskExecutionLogsPolicyAttachment = new aws.iam.RolePolicyAttachment(
  "ecs-task-execution-logs-policy-attachment",
  {
    role: ecsTaskExecutionRole.name,
    policyArn: ecsTaskExecutionLogsPolicy.arn,
  }
);

// ECS Task Role (for application permissions)
const ecsTaskRole = new aws.iam.Role("ecs-task-role", {
  name: `${projectName}-${environment}-ecs-task-role`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "ecs-tasks.amazonaws.com",
        },
      },
    ],
  }),
  tags: {
    ...commonTags,
    Purpose: "ECSTask",
  },
});

// Policy for ECS task to access RDS, DynamoDB, and SQS
const ecsTaskPolicy = new aws.iam.Policy("ecs-task-policy", {
  name: `${projectName}-${environment}-ecs-task-policy`,
  description: "Policy for ECS tasks to access AWS services",
  policy: pulumi
    .all([dynamoTable.arn, whatsappQueue.arn, whatsappDlq.arn])
    .apply(([tableArn, queueArn, dlqArn]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan",
            ],
            Resource: [tableArn, `${tableArn}/index/*`],
          },
          {
            Effect: "Allow",
            Action: ["rds:DescribeDBInstances", "rds:DescribeDBClusters"],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "sqs:ReceiveMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes",
              "sqs:GetQueueUrl",
            ],
            Resource: [queueArn, dlqArn],
          },
        ],
      })
    ),
  tags: {
    ...commonTags,
    Purpose: "ECSTaskPermissions",
  },
});

const ecsTaskRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  "ecs-task-role-policy-attachment",
  {
    role: ecsTaskRole.name,
    policyArn: ecsTaskPolicy.arn,
  }
);

// Security Group for ECS tasks
const ecsSecurityGroup = new aws.ec2.SecurityGroup("ecs-sg", {
  name: `${projectName}-${environment}-ecs-sg`,
  description: "Security group for ECS tasks",
  vpcId: vpc.then((v) => v.id),
  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-ecs-sg`,
    Purpose: "ECS",
  },
});

// Allow inbound HTTP traffic on port 4000
const ecsIngressRule = new aws.ec2.SecurityGroupRule("ecs-ingress", {
  type: "ingress",
  fromPort: 4000,
  toPort: 4000,
  protocol: "tcp",
  cidrBlocks: ["0.0.0.0/0"],
  securityGroupId: ecsSecurityGroup.id,
  description: "HTTP access to API",
});

// Allow all outbound traffic
const ecsEgressRule = new aws.ec2.SecurityGroupRule("ecs-egress", {
  type: "egress",
  fromPort: 0,
  toPort: 0,
  protocol: "-1",
  cidrBlocks: ["0.0.0.0/0"],
  securityGroupId: ecsSecurityGroup.id,
  description: "All outbound traffic",
});

// Allow ECS tasks to access the database
const ecsToDbRule = new aws.ec2.SecurityGroupRule("ecs-to-db", {
  type: "ingress",
  fromPort: 5432,
  toPort: 5432,
  protocol: "tcp",
  sourceSecurityGroupId: ecsSecurityGroup.id,
  securityGroupId: dbSecurityGroup.id,
  description: "ECS to PostgreSQL access",
});

// ECS Task Definition
const ecsTaskDefinition = new aws.ecs.TaskDefinition("api-task", {
  family: `${projectName}-${environment}-api`,
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  cpu: "256",
  memory: "512",
  executionRoleArn: ecsTaskExecutionRole.arn,
  taskRoleArn: ecsTaskRole.arn,
  runtimePlatform: {
    cpuArchitecture: "ARM64",
    operatingSystemFamily: "LINUX",
  },
  containerDefinitions: pulumi.jsonStringify([
    {
      name: "api",
      image: apiImage.ref,
      essential: true,
      portMappings: [
        {
          containerPort: 4000,
          protocol: "tcp",
        },
      ],
      environment: [
        {
          name: "NODE_ENV",
          value: "production",
        },
        {
          name: "NODE_TLS_REJECT_UNAUTHORIZED",
          value: "0",
        },
        {
          name: "FRONTEND_URL",
          value: "https://uae.wetarseel.ai",
        },
        {
          name: "BETTER_AUTH_SECRET",
          value: "abcd",
        },
        {
          name: "BETTER_AUTH_URL",
          value: "https://api.uae.wetarseel.ai",
        },
        {
          name: "ZAPATOS_DB_URL",
          value:
            "postgresql://dbadmin:Jojo.3344@wetarseel-dev-postgres-v2.c78288muwwks.me-central-1.rds.amazonaws.com:5432/wetarseel?sslmode=require",
        },
        {
          name: "DYNAMODB_TABLE_NAME",
          value: "wetarseel-dev-wetable",
        },
        {
          name: "AWS_REGION",
          value: region,
        },
        {
          name: "WHATSAPP_SQS_QUEUE_URL",
          value:
            "https://sqs.me-central-1.amazonaws.com/147997141811/wetarseel-dev-whatsapp-events",
        },
        {
          name: "FORCE_UPDATE",
          value: "2025-07-14-v2",
        },
      ],
      logConfiguration: {
        logDriver: "awslogs",
        options: {
          "awslogs-group": `/ecs/${projectName}-${environment}-api`,
          "awslogs-region": region,
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true",
        },
      },
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://localhost:4000/health || exit 1",
        ],
        interval: 30,
        timeout: 5,
        retries: 3,
        startPeriod: 60,
      },
    },
  ]),
  tags: {
    ...commonTags,
    Purpose: "ECSTaskDefinition",
  },
});

// Application Load Balancer for ECS service
const albSecurityGroup = new aws.ec2.SecurityGroup("alb-sg", {
  name: `${projectName}-${environment}-alb-sg`,
  description: "Security group for Application Load Balancer",
  vpcId: vpc.then((v) => v.id),
  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-alb-sg`,
    Purpose: "LoadBalancer",
  },
});

// ALB ingress rules
const albHttpIngressRule = new aws.ec2.SecurityGroupRule("alb-http-ingress", {
  type: "ingress",
  fromPort: 80,
  toPort: 80,
  protocol: "tcp",
  cidrBlocks: ["0.0.0.0/0"],
  securityGroupId: albSecurityGroup.id,
  description: "HTTP access",
});

const albHttpsIngressRule = new aws.ec2.SecurityGroupRule("alb-https-ingress", {
  type: "ingress",
  fromPort: 443,
  toPort: 443,
  protocol: "tcp",
  cidrBlocks: ["0.0.0.0/0"],
  securityGroupId: albSecurityGroup.id,
  description: "HTTPS access",
});

// ALB egress rule
const albEgressRule = new aws.ec2.SecurityGroupRule("alb-egress", {
  type: "egress",
  fromPort: 0,
  toPort: 0,
  protocol: "-1",
  cidrBlocks: ["0.0.0.0/0"],
  securityGroupId: albSecurityGroup.id,
  description: "All outbound traffic",
});

// Update ECS security group to allow traffic from ALB
const albToEcsRule = new aws.ec2.SecurityGroupRule("alb-to-ecs", {
  type: "ingress",
  fromPort: 4000,
  toPort: 4000,
  protocol: "tcp",
  sourceSecurityGroupId: albSecurityGroup.id,
  securityGroupId: ecsSecurityGroup.id,
  description: "ALB to ECS access",
});

// Application Load Balancer
const applicationLoadBalancer = new aws.lb.LoadBalancer("api-alb", {
  name: `${projectName}-${environment}-api-alb`,
  loadBalancerType: "application",
  securityGroups: [albSecurityGroup.id],
  subnets: subnets.then((s) => s.ids),
  enableDeletionProtection: false,
  tags: {
    ...commonTags,
    Purpose: "LoadBalancer",
  },
});

// Target Group for ECS service
const targetGroup = new aws.lb.TargetGroup("api-tg", {
  name: `${projectName}-${environment}-api-tg`,
  port: 4000,
  protocol: "HTTP",
  vpcId: vpc.then((v) => v.id),
  targetType: "ip",
  healthCheck: {
    enabled: true,
    healthyThreshold: 2,
    unhealthyThreshold: 2,
    timeout: 5,
    interval: 30,
    path: "/health",
    matcher: "200",
    protocol: "HTTP",
    port: "traffic-port",
  },
  tags: {
    ...commonTags,
    Purpose: "TargetGroup",
  },
});

// ALB Listener
const albListener = new aws.lb.Listener("api-listener", {
  loadBalancerArn: applicationLoadBalancer.arn,
  port: 80,
  protocol: "HTTP",
  defaultActions: [
    {
      type: "forward",
      targetGroupArn: targetGroup.arn,
    },
  ],
  tags: {
    ...commonTags,
    Purpose: "LoadBalancerListener",
  },
});

// ECS Service
const ecsService = new aws.ecs.Service(
  "api-service",
  {
    name: `${projectName}-${environment}-api-service`,
    cluster: ecsCluster.arn,
    taskDefinition: ecsTaskDefinition.arn,
    desiredCount: 1,
    launchType: "FARGATE",
    networkConfiguration: {
      subnets: subnets.then((s) => s.ids),
      securityGroups: [ecsSecurityGroup.id],
      assignPublicIp: true,
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName: "api",
        containerPort: 4000,
      },
    ],
    tags: {
      ...commonTags,
      Purpose: "ECSService",
    },
  },
  {
    dependsOn: [albListener],
  }
);

// ============================================================================
// CLOUDWATCH DASHBOARD
// ============================================================================

// CloudWatch Dashboard for monitoring
const dashboard = new aws.cloudwatch.Dashboard("wetarseel-dashboard", {
  dashboardName: `${projectName}-${environment}-dashboard`,
  dashboardBody: JSON.stringify({
    widgets: [
      {
        type: "metric",
        x: 0,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [
              "AWS/ECS",
              "CPUUtilization",
              "ServiceName",
              ecsService.name,
              "ClusterName",
              ecsCluster.name,
            ],
            [".", "MemoryUtilization", ".", ".", ".", "."],
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "ECS Service Metrics",
          period: 300,
        },
      },
      {
        type: "metric",
        x: 12,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            [
              "AWS/SQS",
              "NumberOfMessagesSent",
              "QueueName",
              whatsappQueue.name,
            ],
            [".", "NumberOfMessagesReceived", ".", "."],
            [".", "ApproximateNumberOfVisibleMessages", ".", "."],
          ],
          view: "timeSeries",
          stacked: false,
          region: region,
          title: "WhatsApp SQS Queue Metrics",
          period: 300,
        },
      },
      {
        type: "log",
        x: 0,
        y: 6,
        width: 24,
        height: 6,
        properties: {
          query: `SOURCE '/ecs/${projectName}-${environment}-api'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20`,
          region: region,
          title: "Recent Errors",
          view: "table",
        },
      },
    ],
  }),
});

// ============================================================================
// ECS OUTPUTS
// ============================================================================

export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const ecsClusterName = ecsCluster.name;
export const ecsClusterArn = ecsCluster.arn;
export const ecsTaskExecutionRoleArn = ecsTaskExecutionRole.arn;
export const ecsTaskRoleArn = ecsTaskRole.arn;
export const ecsServiceName = ecsService.name;
export const ecsServiceId = ecsService.id;
export const applicationLoadBalancerDns = applicationLoadBalancer.dnsName;
export const applicationLoadBalancerArn = applicationLoadBalancer.arn;
export const apiUrl = pulumi.interpolate`http://${applicationLoadBalancer.dnsName}`;
export const apiHealthUrl = pulumi.interpolate`http://${applicationLoadBalancer.dnsName}/health`;
export const dashboardUrl = pulumi.interpolate`https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;
