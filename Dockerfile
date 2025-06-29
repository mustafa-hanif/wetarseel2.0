FROM --platform=linux/arm64 oven/bun:1 AS base
WORKDIR /usr/src/app
COPY ./apps/api ./
RUN bun install
USER bun
EXPOSE 4000
ENTRYPOINT ["bun", "index.ts"]
