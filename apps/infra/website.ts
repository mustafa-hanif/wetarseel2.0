import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as command from "@pulumi/command";
import * as path from "path";

// Stack configuration (same as in index.ts)
const config = new pulumi.Config();
const stackName = pulumi.getStack();
const projectName = pulumi.getProject();
const environment = config.get("environment") ?? stackName;
const region = config.get("aws:region") ?? "me-central-1";

// Common tags for all resources
const commonTags = {
  Environment: environment,
  Project: projectName,
  Stack: stackName,
  ManagedBy: "Pulumi",
  CreatedAt: new Date().toISOString().split("T")[0],
};

// Static Website Infrastructure
// S3 Bucket for static website hosting
const websiteBucket = new aws.s3.Bucket("website-bucket", {
  bucket: `${projectName}-${environment}-website`,
  website: {
    indexDocument: "index.html",
    errorDocument: "error.html",
  },
  tags: {
    ...commonTags,
    Purpose: "StaticWebsite",
  },
});

// S3 Bucket Policy for public read access
const websiteBucketPolicy = new aws.s3.BucketPolicy("website-bucket-policy", {
  bucket: websiteBucket.id,
  policy: websiteBucket.arn.apply((bucketArn) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `${bucketArn}/*`,
        },
      ],
    })
  ),
});

// Build the frontend application using Bun
const buildCommand = new command.local.Command("build-frontend", {
  create: "cd ../../web && bun install && bun run build",
  dir: __dirname,
  triggers: [
    // Trigger rebuild when package.json or source files change
    // You can add file hashes here to trigger rebuilds
    new Date().toISOString(), // For now, always rebuild
  ],
});

// Sync built files to S3
const syncCommand = new command.local.Command(
  "sync-to-s3",
  {
    create: pulumi.interpolate`aws s3 sync ../../web/dist s3://${websiteBucket.bucket} --delete`,
    dir: __dirname,
    environment: {
      AWS_REGION: region,
    },
  },
  { dependsOn: [buildCommand, websiteBucket] }
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

// Invalidate CloudFront cache after deployment
const invalidateCache = new command.local.Command(
  "invalidate-cloudfront",
  {
    create: pulumi.interpolate`aws cloudfront create-invalidation --distribution-id ${cloudfrontDistribution.id} --paths "/*"`,
    dir: __dirname,
    environment: {
      AWS_REGION: region,
    },
  },
  { dependsOn: [syncCommand, cloudfrontDistribution] }
);

// Website outputs
export const websiteBucketName = websiteBucket.bucket;
export const websiteUrl = websiteBucket.websiteEndpoint;
export const cloudfrontUrl = cloudfrontDistribution.domainName;
export const cloudfrontDistributionId = cloudfrontDistribution.id;
