FROM node:23-alpine AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
# A common issue that may arise with node-alpine is a missing shared library required for use of process.dlopen. To add the missing shared libraries to your image, adding the libc6-compat package in your Dockerfile is recommended: apk add --no-cache libc6-compat

RUN apk add --no-cache libc6-compat
COPY package.json yarn.lock tsconfig.json next.config.js sentry.server.config.ts sentry.edge.config.ts ./
RUN yarn install --frozen-lockfile --network-timeout 1000000


# Stage 2: build
FROM node:23-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_BACKEND_URL NEXT_PUBLIC_USAGE_DASHBOARD_ID NEXT_PUBLIC_USAGE_DASHBOARD_DOMAIN NEXT_PUBLIC_DEMO_ACCOUNT_DEST_SCHEMA NEXT_PUBLIC_DEMO_WALKTHROUGH_ENABLED NEXT_PUBLIC_WEBSOCKET_URL NEXT_PUBLIC_SHOW_ELEMENTARY_MENU NEXT_PUBLIC_SHOW_DATA_INSIGHTS_TAB NEXT_PUBLIC_SHOW_DATA_ANALYSIS_TAB NEXT_PUBLIC_SHOW_SUPERSET_USAGE_TAB NEXT_PUBLIC_SHOW_SUPERSET_ANALYSIS_TAB NEXT_PUBLIC_SENTRY_DSN NEXT_PUBLIC_AMPLITUDE_ENV NEXT_PUBLIC_DALGO_WHITELIST_IPS NEXT_PUBLIC_AIRBYTE_URL

ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_USAGE_DASHBOARD_ID=${NEXT_PUBLIC_USAGE_DASHBOARD_ID}
ENV NEXT_PUBLIC_USAGE_DASHBOARD_DOMAIN=${NEXT_PUBLIC_USAGE_DASHBOARD_DOMAIN}
ENV NEXT_PUBLIC_DEMO_ACCOUNT_DEST_SCHEMA=${NEXT_PUBLIC_DEMO_ACCOUNT_DEST_SCHEMA}
ENV NEXT_PUBLIC_DEMO_WALKTHROUGH_ENABLED=${NEXT_PUBLIC_DEMO_WALKTHROUGH_ENABLED}
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}
ENV NEXT_PUBLIC_SHOW_ELEMENTARY_MENU=${NEXT_PUBLIC_SHOW_ELEMENTARY_MENU}
ENV NEXT_PUBLIC_SHOW_DATA_INSIGHTS_TAB=${NEXT_PUBLIC_SHOW_DATA_INSIGHTS_TAB}
ENV NEXT_PUBLIC_SHOW_DATA_ANALYSIS_TAB=${NEXT_PUBLIC_SHOW_DATA_ANALYSIS_TAB}
ENV NEXT_PUBLIC_SHOW_SUPERSET_USAGE_TAB=${NEXT_PUBLIC_SHOW_SUPERSET_USAGE_TAB}
ENV NEXT_PUBLIC_SHOW_SUPERSET_ANALYSIS_TAB=${NEXT_PUBLIC_SHOW_SUPERSET_ANALYSIS_TAB}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_PUBLIC_AMPLITUDE_ENV=${NEXT_PUBLIC_AMPLITUDE_ENV}
ENV NEXT_PUBLIC_DALGO_WHITELIST_IPS=${NEXT_PUBLIC_DALGO_WHITELIST_IPS}
ENV NEXT_PUBLIC_AIRBYTE_URL=${NEXT_PUBLIC_AIRBYTE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/next.config.js ./
COPY --from=deps /app/tsconfig.json ./
COPY --from=deps /app/package.json ./
COPY --from=deps /app/sentry.server.config.ts ./
COPY --from=deps /app/sentry.edge.config.ts ./

COPY src ./src
COPY public ./public

ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build

# Stage 3: run
FROM node:23-alpine AS runner

ARG BUILD_DATE

LABEL maintainer="DalgoT4D"
LABEL org.opencontainers.image.source="https://github.com/DalgoT4D/webapp"
LABEL org.opencontainers.image.licenses="https://github.com/DalgoT4D/webapp?tab=AGPL-3.0-1-ov-file#readme"
LABEL org.opencontainers.image.version="1.0"
LABEL org.opencontainers.image.created=${BUILD_DATE}

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next \
 && chown nextjs:nodejs .next

# This is for running it as standalone so that it can reduce the size of the image
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/tsconfig.json ./


USER nextjs

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000
CMD ["node", "server.js"]
# CMD ["yarn", "start"]