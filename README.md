## DDP frontend

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Code coverage badge](https://img.shields.io/codecov/c/github/DalgoT4D/webapp/main.svg)](https://codecov.io/gh/DalgoT4D/webapp/branch/main)

## Installation instructions

```bash
yarn install
```

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

## Development conventions

Refer to this [guide](https://github.com/airbnb/javascript/tree/master/react)
