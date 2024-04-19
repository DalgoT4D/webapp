FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
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
FROM node:20-alpine

ARG BUILD_DATE

LABEL maintainer="DalgoT4D"
LABEL org.opencontainers.image.source="https://github.com/DalgoT4D/DDP_backend"
LABEL org.opencontainers.image.licenses="https://github.com/DalgoT4D/DDP_backend?tab=AGPL-3.0-1-ov-file#readme"
LABEL org.opencontainers.image.version="1.0"
LABEL org.opencontainers.image.created=${BUILD_DATE}

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules


USER nextjs
EXPOSE 3000
ENV PORT 3000
# CMD ["node", "server.js"]
CMD ["yarn", "dev"]