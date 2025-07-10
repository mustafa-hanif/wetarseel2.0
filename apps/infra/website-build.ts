import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as command from "@pulumi/command";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

/**
 * Advanced Website Deployment with Pulumi Command Provider
 * This approach builds and deploys the website as part of the Pulumi program
 */

// Configuration
const config = new pulumi.Config();
const projectName = pulumi.getProject();
const environment = config.get("environment") ?? pulumi.getStack();

// Get hash of web source files to trigger rebuilds when files change
function getWebSourceHash(): string {
  const webDir = path.join(__dirname, "../../web/src");
  const packageJsonPath = path.join(__dirname, "../../web/package.json");

  try {
    // Simple hash based on package.json modification time for now
    // In production, you'd want to hash all source files
    const packageStats = fs.statSync(packageJsonPath);
    return crypto
      .createHash("md5")
      .update(packageStats.mtime.toISOString())
      .digest("hex");
  } catch {
    return new Date().toISOString();
  }
}

// S3 Bucket (from your existing infrastructure)
export function createWebsiteWithBuild(
  websiteBucket: aws.s3.Bucket,
  cloudfrontDistribution?: aws.cloudfront.Distribution
) {
  const sourceHash = getWebSourceHash();

  // Build the frontend application using Bun
  const buildCommand = new command.local.Command("build-frontend", {
    create: `
      cd ${path.join(__dirname, "../../web")} && 
      bun install && 
      bun run build
    `,
    update: `
      cd ${path.join(__dirname, "../../web")} && 
      bun install && 
      bun run build
    `,
    triggers: [sourceHash], // Rebuild when source changes
  });

  // Upload files to S3 with proper cache headers
  const uploadCommand = new command.local.Command(
    "upload-website",
    {
      create: pulumi.interpolate`
      # Upload static assets with long cache
      aws s3 sync ${path.join(__dirname, "../../web/dist")} s3://${websiteBucket.bucket} \
        --delete \
        --exclude "*.html" \
        --exclude "*.json" \
        --cache-control "public, max-age=31536000, immutable"
      
      # Upload HTML/JSON with short cache
      aws s3 sync ${path.join(__dirname, "../../web/dist")} s3://${websiteBucket.bucket} \
        --exclude "*" \
        --include "*.html" \
        --include "*.json" \
        --cache-control "public, max-age=0, must-revalidate"
    `,
      update: pulumi.interpolate`
      # Upload static assets with long cache
      aws s3 sync ${path.join(__dirname, "../../web/dist")} s3://${websiteBucket.bucket} \
        --delete \
        --exclude "*.html" \
        --exclude "*.json" \
        --cache-control "public, max-age=31536000, immutable"
      
      # Upload HTML/JSON with short cache
      aws s3 sync ${path.join(__dirname, "../../web/dist")} s3://${websiteBucket.bucket} \
        --exclude "*" \
        --include "*.html" \
        --include "*.json" \
        --cache-control "public, max-age=0, must-revalidate"
    `,
      triggers: [sourceHash],
    },
    { dependsOn: [buildCommand] }
  );

  // Invalidate CloudFront cache if distribution exists
  const invalidateCommand = cloudfrontDistribution
    ? new command.local.Command(
        "invalidate-cloudfront",
        {
          create: pulumi.interpolate`
      aws cloudfront create-invalidation \
        --distribution-id ${cloudfrontDistribution.id} \
        --paths "/*"
    `,
          update: pulumi.interpolate`
      aws cloudfront create-invalidation \
        --distribution-id ${cloudfrontDistribution.id} \
        --paths "/*"
    `,
          triggers: [sourceHash],
        },
        { dependsOn: [uploadCommand] }
      )
    : undefined;

  return {
    buildCommand,
    uploadCommand,
    invalidateCommand,
  };
}

// Example usage (add this to your main index.ts after creating the S3 bucket):
// const websiteDeployment = createWebsiteWithBuild(websiteBucket, cloudfrontDistribution);
