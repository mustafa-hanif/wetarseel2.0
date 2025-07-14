import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as command from "@pulumi/command";

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

const installDeps = new command.local.Command("install-deps", {
  create: "cd ../web && pnpm install",
});

const buildSite = new command.local.Command(
  "build",
  {
    create: "cd ../web && pnpm run build",
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

// API Gateway deployment
const webSocketDeployment = new aws.apigatewayv2.Deployment(
  "websocket-deployment",
  {
    apiId: webSocketApi.id,
    description: `Deployment for ${environment} environment`,
  },
  {
    dependsOn: [connectRoute, disconnectRoute, messageRoute, defaultRoute],
  }
);

// API Gateway stage
const webSocketStage = new aws.apigatewayv2.Stage("websocket-stage", {
  apiId: webSocketApi.id,
  deploymentId: webSocketDeployment.id,
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
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
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
  },
  { dependsOn: [deploySite] }
);

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
