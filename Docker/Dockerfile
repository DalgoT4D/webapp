FROM node:20-alpine AS deps
WORKDIR /app

# A common issue that may arise with node-alpine is a missing shared library required for use of process.dlopen. To add the missing shared libraries to your image, adding the libc6-compat package in your Dockerfile is recommended: apk add --no-cache libc6-compat

RUN apk add --no-cache libc6-compat
COPY package.json yarn.lock tsconfig.json next.config.js ./
RUN yarn install --frozen-lockfile --network-timeout 1000000


# Stage 2: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/next.config.js ./
COPY --from=deps /app/tsconfig.json ./
COPY --from=deps /app/package.json ./

COPY src ./src
COPY public ./public

RUN yarn build

# Stage 3: run
FROM node:20-alpine AS runner

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


USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
#CMD ["yarn", "start"]