## Dalgo frontend

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Code coverage badge](https://img.shields.io/codecov/c/github/DalgoT4D/webapp/main.svg)](https://codecov.io/gh/DalgoT4D/webapp/branch/main)

## Installation instructions

```bash
yarn install
```
## Prettier Formatting

- We are using Husky and lint-staged auto fix the fomatting in the code in the staging file.
- After yarn install run "npx husky init"
- A file will be created inside the "husky/_ folder/pre_commit"
- Add "npm run auto-format" inside the file

## Run the development server

You will need to run the [Django backend](https://github.com/DalgoT4D/DDP_backend). Once that is running, specify its URL in the `.env` under

```
NEXT_PUBLIC_BACKEND_URL=<url of django backend>
```

Next, generate a security secret using `https://generate-secret.vercel.app/32` and set it in

```
NEXTAUTH_SECRET=<secret>
```

Finally, select an available port on your system and define the URL for this frontend

```
NEXTAUTH_URL=http://localhost:<port>
```

Now you can start the application

```bash
yarn dev
```

Open `http://localhost:<port>` with your browser to see the result.

## Development convention

Refer to this [guide](https://github.com/airbnb/javascript/tree/master/react)



## Using Docker on Dev

Make sure you have docker and docker compose installed.

- Install [docker](https://docs.docker.com/engine/install/)
- Install [docker compose](https://docs.docker.com/compose/install/)

### Step 1: Copy .env file to Dcoker folder

### Step 2: Build the Docker image

All the variables with NEXT_PUBLIC prefix need to be added to the build command. This is because we are running the application as standalone mode

`docker build -f Docker/Dockerfile --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') --build-arg NEXT_PUBLIC_BACKEND_URL="<url of django backend>" -t dalgo_frontend:0.1 .`

### Step 3: Start the application

`docker compose -f Docker/docker-compose.yaml --env-file .env up`
