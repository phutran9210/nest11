# Docker Documentation

This document provides comprehensive information about the Docker setup for the NestJS application.

## Overview

The application uses Docker for containerization with multi-stage builds and Docker Compose for orchestrating multiple services including PostgreSQL, Redis, and a Figma MCP server.

## Files

### Dockerfile

Multi-stage Docker build optimized for production:

- **Build Stage**: Uses Node.js 18 Alpine to build the application
- **Production Stage**: Creates a minimal production image with only runtime dependencies
- **Security**: Runs as non-root user (`nestjs:nodejs`)
- **Health Check**: Built-in health monitoring on port 3000

### docker-compose.yml

Orchestrates the complete application stack:

- **app**: Main NestJS application
- **postgres**: PostgreSQL 15 database
- **redis**: Redis 7 cache server
- **figma-mcp**: Figma MCP server for design integration

### .dockerignore

Excludes unnecessary files from Docker build context to improve build performance and security.

## Services

### Application Service (`app`)

- **Port**: 3000 (exposed externally)
- **Environment**: Development mode by default
- **Dependencies**: PostgreSQL and Redis
- **Volumes**: 
  - Source code mounted for development
  - Node modules excluded from host mounting

### PostgreSQL Service (`postgres`)

- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: nest_db
- **Credentials**: postgres/password (development only)
- **Volume**: Persistent data storage

### Redis Service (`redis`)

- **Image**: redis:7-alpine
- **Port**: 6379
- **Volume**: Persistent data storage

### Figma MCP Service (`figma-mcp`)

- **Image**: acuvity/mcp-server-figma:latest
- **Port**: 3845
- **Environment**: Requires FIGMA_API_TOKEN
- **Health Check**: Monitors service availability

## Usage

### Development

Start the complete development environment:

```bash
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f app
```

### Production

Build production image:

```bash
docker build -t nest11-app .
```

Run with production configuration:

```bash
docker-compose -f docker-compose.yml up -d
```

### Database Operations

Access PostgreSQL:

```bash
docker-compose exec postgres psql -U postgres -d nest_db
```

Access Redis:

```bash
docker-compose exec redis redis-cli
```

### Maintenance

Stop all services:

```bash
docker-compose down
```

Remove volumes (WARNING: This will delete all data):

```bash
docker-compose down -v
```

Rebuild application:

```bash
docker-compose build app
```

## Environment Variables

### Required for Production

- `FIGMA_API_TOKEN`: Token for Figma MCP server integration

### Database Configuration

- `DB_HOST`: Database host (default: postgres)
- `DB_PORT`: Database port (default: 5432)
- `DB_USERNAME`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (default: password)
- `DB_NAME`: Database name (default: nest_db)

### Redis Configuration

- `REDIS_HOST`: Redis host (default: redis)
- `REDIS_PORT`: Redis port (default: 6379)

## Security Considerations

- Default credentials are for development only
- Use environment variables for production secrets
- Application runs as non-root user
- Health checks monitor service availability
- Network isolation between services

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5432, 6379, and 3845 are available
2. **Build failures**: Check .dockerignore excludes are correct
3. **Database connection**: Verify PostgreSQL is running and accessible
4. **Redis connection**: Ensure Redis service is healthy

### Debugging

Check service status:

```bash
docker-compose ps
```

View resource usage:

```bash
docker stats
```

Inspect container:

```bash
docker-compose exec app sh
```

## Best Practices

1. Use specific image tags in production
2. Set resource limits for containers
3. Use Docker secrets for sensitive data
4. Implement proper logging and monitoring
5. Regular backup of persistent volumes
6. Use multi-stage builds for smaller images
7. Run security scans on images before deployment