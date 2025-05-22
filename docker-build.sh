#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <tagname>"
  exit 1
fi

TAG=$1
ENV_FILE="Docker/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Source the .env file to get exact values
source "$ENV_FILE"

# Build with all environment variables from Dockerfile ARGs
docker build \
  --build-arg NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL}" \
  --build-arg NEXT_PUBLIC_USAGE_DASHBOARD_ID="${NEXT_PUBLIC_USAGE_DASHBOARD_ID}" \
  --build-arg NEXT_PUBLIC_USAGE_DASHBOARD_DOMAIN="${NEXT_PUBLIC_USAGE_DASHBOARD_DOMAIN}" \
  --build-arg NEXT_PUBLIC_DEMO_ACCOUNT_DEST_SCHEMA="${NEXT_PUBLIC_DEMO_ACCOUNT_DEST_SCHEMA}" \
  --build-arg NEXT_PUBLIC_DEMO_WALKTRHOUGH_ENABLED="${NEXT_PUBLIC_DEMO_WALKTRHOUGH_ENABLED}" \
  --build-arg NEXT_PUBLIC_WEBSOCKET_URL="${NEXT_PUBLIC_WEBSOCKET_URL}" \
  --build-arg NEXT_PUBLIC_SHOW_ELEMENTARY_MENU="${NEXT_PUBLIC_SHOW_ELEMENTARY_MENU}" \
  --build-arg NEXT_PUBLIC_SHOW_DATA_INSIGHTS_TAB="${NEXT_PUBLIC_SHOW_DATA_INSIGHTS_TAB}" \
  --build-arg NEXT_PUBLIC_SHOW_DATA_ANALYSIS_TAB="${NEXT_PUBLIC_SHOW_DATA_ANALYSIS_TAB}" \
  --build-arg NEXT_PUBLIC_SHOW_SUPERSET_USAGE_TAB="${NEXT_PUBLIC_SHOW_SUPERSET_USAGE_TAB}" \
  --build-arg NEXT_PUBLIC_SHOW_SUPERSET_ANALYSIS_TAB="${NEXT_PUBLIC_SHOW_SUPERSET_ANALYSIS_TAB}" \
  --build-arg NEXT_PUBLIC_SENTRY_DSN="${NEXT_PUBLIC_SENTRY_DSN}" \
  --build-arg NEXT_PUBLIC_AMPLITUDE_ENV="${NEXT_PUBLIC_AMPLITUDE_ENV}" \
  --build-arg NEXT_PUBLIC_DALGO_WHITELIST_IPS="${NEXT_PUBLIC_DALGO_WHITELIST_IPS}" \
  --build-arg NEXT_PUBLIC_AIRBYTE_URL="${NEXT_PUBLIC_AIRBYTE_URL}" \
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  -f Docker/Dockerfile \
  -t "$TAG" .
