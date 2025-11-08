FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml ./
RUN yarn global add pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm for build stage
RUN yarn global add pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Build arguments for distribution mode (no defaults - must be provided at build time)
ARG CLOSED_SOURCE_MODE=false
ARG MODAI_API_BASE_URL
ARG MODAI_DEFAULT_THINKING_MODEL=gemini-2.5-pro
ARG MODAI_DEFAULT_TASK_MODEL=gemini-2.5-flash

# Convert build args to environment variables for Next.js
ENV NEXT_PUBLIC_CLOSED_SOURCE_MODE=$CLOSED_SOURCE_MODE
ENV NEXT_PUBLIC_MODAI_API_BASE_URL=$MODAI_API_BASE_URL
ENV NEXT_PUBLIC_MODAI_DEFAULT_THINKING=$MODAI_DEFAULT_THINKING_MODEL
ENV NEXT_PUBLIC_MODAI_DEFAULT_TASK=$MODAI_DEFAULT_TASK_MODEL

RUN pnpm run build:standalone

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV NEXT_PUBLIC_BUILD_MODE=standalone

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]