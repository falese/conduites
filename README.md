# Conduites - GraphQL BFF (Backend-for-Frontend)

A thin GraphQL Backend-for-Frontend (BFF) built with Node.js, TypeScript, Express, and GraphQL Yoga v5. Designed for serving MFE (Micro-Frontend) assets and proxying requests to downstream microservices in a Kubernetes/OpenShift environment with service mesh.

## Features

- **Thin BFF Architecture**: No business logic, only pass-through resolvers to downstream services
- **GraphQL Yoga v5**: Modern GraphQL server with built-in features
- **Express.js**: HTTP server for serving static assets and API endpoints
- **TypeScript**: Full type safety with ES2022 modules
- **Static Asset Serving**:
  - Development mode: Serve local assets
  - Production mode: Use CDN URLs
- **Service Mesh Ready**: Headers and configuration for distributed tracing
- **Health Checks**: Kubernetes liveness and readiness probes
- **CORS & Security**: Production-ready security headers
- **Request Logging**: Structured logging for observability

## Project Structure

```
src/
├── index.ts                 # Server entry point
├── config/
│   └── index.ts            # Configuration management
├── schema/
│   ├── index.ts            # GraphQL schema definition
│   └── resolvers/
│       ├── user.ts         # User resolvers (pass-through)
│       ├── product.ts      # Product resolvers (pass-through)
│       └── notification.ts # Notification resolvers (pass-through)
├── middleware/
│   ├── errorHandler.ts     # Global error handling
│   ├── health.ts          # Health check endpoints
│   ├── requestLogger.ts   # Request logging
│   └── security.ts        # CORS & security headers
└── services/
    ├── httpClient.ts       # HTTP client for downstream services
    ├── userService.ts      # User service client
    ├── productService.ts   # Product service client
    └── notificationService.ts # Notification service client
```

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Development:**

   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Environment Configuration

Key environment variables:

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 4000)
- `ASSETS_MODE`: Asset serving mode (development/production)
- `ASSETS_CDN_URL`: CDN URL for production assets
- `USER_SERVICE_URL`: User microservice URL
- `PRODUCT_SERVICE_URL`: Product microservice URL
- `NOTIFICATION_SERVICE_URL`: Notification microservice URL

See `.env.example` for all available configuration options.

## GraphQL Schema

The BFF exposes a unified GraphQL schema that aggregates data from multiple downstream services:

- **Users**: User management operations
- **Products**: Product catalog operations
- **Notifications**: User notification operations
- **Health**: System health checks

### Example Queries

```graphql
# Get user information
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
    avatar
  }
}

# Get products with pagination
query GetProducts($limit: Int, $offset: Int) {
  products(limit: $limit, offset: $offset) {
    id
    name
    price
    category
  }
}

# Health check
query HealthCheck {
  health {
    status
    timestamp
    services {
      name
      status
    }
  }
}
```

## API Endpoints

- `GET /graphql` - GraphQL endpoint (with playground in dev)
- `GET /health` - Health check for liveness probe
- `GET /ready` - Readiness check for readiness probe
- `GET /api/info` - Service information
- `GET /api/assets-config` - Asset configuration for MFEs
- `GET /assets/*` - Static assets (development mode only)

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 4000

USER node

CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: conduites-bff
spec:
  replicas: 3
  selector:
    matchLabels:
      app: conduites-bff
  template:
    metadata:
      labels:
        app: conduites-bff
    spec:
      containers:
        - name: bff
          image: conduites-bff:latest
          ports:
            - containerPort: 4000
          env:
            - name: NODE_ENV
              value: "production"
            - name: ASSETS_MODE
              value: "production"
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
```

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Contributing

This is a thin BFF - keep it simple! No business logic should be added here. All resolvers should be pass-through to downstream services.
