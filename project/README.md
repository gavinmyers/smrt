# SMRT Project

## Production Deployment (Linux)

This project is configured to work with a Traefik reverse proxy using Let's Encrypt for SSL.

### Prerequisites

- A running Traefik instance on the host machine.
- An external Docker network named `shared-proxy` that Traefik is connected to.

### Deployment

1. Ensure your `.env.prod` is configured.
2. Run:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

The application will be accessible at:
- Web: `https://smrt.357graphics.com`
- API: `https://smrt-api.357graphics.com`

## Local Development

1. Start the services:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. Access the application at `http://localhost:5174` (or whatever `WEB_PORT` is set to in your `.env`).