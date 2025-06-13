# Node.js Datadog RUM Proxy

This project contains a simple and efficient Node.js proxy server for forwarding Datadog RUM (Real User Monitoring) data. It is designed to be run as a Docker container.

The primary purpose of this proxy is to avoid ad-blockers that might prevent the Datadog RUM SDK from sending data directly to Datadog's intake servers.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) must be installed and running on your machine.

## How It Works

This server uses [Express.js](https://expressjs.com/) and [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) to forward all incoming HTTP requests to the official Datadog RUM intake endpoint for the EU region (`https://browser-intake-datadoghq.eu`).

It includes:
- **CORS handling:** Automatically responds to preflight `OPTIONS` requests.
- **Logging:** Uses `morgan` to log incoming requests to the console.
- **Health Check:** Provides a `/health` endpoint that returns a `200 OK` status.

## Getting Started

### 1. Build and Run the Container

From the root of this project directory, run the following command:

```sh
docker compose up --build
```

This will build the Docker image and start the container. The proxy will be listening on port `8080`.

### 2. Stop the Container

To stop the service, run:

```sh
docker compose down
```

### 3. Configure Your Frontend Application

In your frontend application's Datadog RUM initialization code, you need to point the SDK to this proxy.

Find the `proxy` or `proxyUrl` configuration option and set it as follows:

```typescript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
    applicationId: 'YOUR_APPLICATION_ID',
    clientToken: 'YOUR_CLIENT_TOKEN',
    site: 'datadoghq.eu',
    service: 'your-service-name',
    env: 'production',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    // Point the SDK to the Node.js proxy
    proxy: (options) => `http://localhost:8080${options.path}?${options.parameters}`,
});
```

Now, all RUM data from your application will be routed through the local Node.js proxy instead of directly to Datadog, helping to bypass many common ad and tracker blockers. 