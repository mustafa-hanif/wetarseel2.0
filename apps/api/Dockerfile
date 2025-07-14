# Use the official Bun image
FROM oven/bun:1.1.38-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package.json and modify it to remove workspace dependency
COPY package.json ./
RUN sed -i '/"@wetarseel\/db-types"/d' package.json

# Install the missing packages that were in the workspace dependency
RUN bun add zapatos pg kysely

# Install all dependencies with Bun
RUN bun install

# Copy source code
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bunuser -u 1001

# Change ownership of the app directory
RUN chown -R bunuser:nodejs /app
USER bunuser

# Expose the port your app runs on
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["bun", "run", "index.ts"]
