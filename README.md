## Dalgo frontend

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Code coverage badge](https://img.shields.io/codecov/c/github/DalgoT4D/webapp/main.svg)](https://codecov.io/gh/DalgoT4D/webapp/branch/main)

## Installation instructions

```bash
yarn install
```

## Formatter

This project uses `Prettier` for code formatting to maintain consistent style across all JavaScript and TypeScript files.
`Husky` is used as a pre-commit hook. It automatically formats the code and adds the changes to the commit if any formatting inconsistencies are found.


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

### Step 1: Copy .env file to Docker folder

### Step 2: Build the Docker image

All the variables with NEXT_PUBLIC prefix need to be added to the build command. This is because we are running the application as standalone mode
Run the script: 
```bash
bash docker-build.sh "image_name:tag"
```
Once the image is built, add that image_name:tag to the Docker/docker-compose.yaml file

### Step 3: Start the application
Run the script:
```bash
bash docker-compose.sh
```
