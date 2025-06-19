#!/bin/bash

# Check if the docker-compose.yaml file exists
if [ ! -f Docker/docker-compose.yaml ]; then
  echo "Docker Compose file Docker/docker-compose.yaml not found!"
  exit 1
fi

# Run docker compose up
docker compose -f Docker/docker-compose.yaml up