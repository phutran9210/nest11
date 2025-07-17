# NestJS Enterprise Application

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

A **production-ready NestJS application** with enterprise-grade features including hierarchical RBAC, Redis caching, comprehensive security, real-time communication, and extensive testing infrastructure.

## 🚀 Features

### Core Features
- **Hierarchical RBAC System** - Role-based access control with inheritance
- **JWT Authentication** - Secure token-based authentication
- **Redis Integration** - Dual setup with cache abstraction and direct access
- **Real-time Communication** - WebSocket support with Socket.IO
- **Database Management** - TypeORM with PostgreSQL and migrations
- **Comprehensive Testing** - Unit and integration tests with 80% coverage
- **Security Features** - Rate limiting, password hashing, request idempotency
- **Email Services** - Transactional email with Handlebars templates
- **Health Monitoring** - Database and Redis health checks
- **API Documentation** - Swagger/OpenAPI integration

### Development Features
- **Code Quality** - Biome linting and formatting
- **Git Hooks** - Pre-commit hooks with Husky
- **Docker Support** - Containerized development and deployment
- **Environment Management** - Hierarchical configuration with validation
- **Logging System** - Structured logging with Winston
- **Path Aliases** - Clean imports with TypeScript path mapping

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis 6+
- Docker and Docker Compose (optional)

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd nest11

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
pnpm run db:setup

# Start development server
pnpm run start:dev
```

## 🐳 Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## 📚 Available Scripts

### Development
```bash
pnpm run start:dev      # Start development server with watch mode
pnpm run start:debug    # Start with debug mode
pnpm run start:prod     # Start production server
pnpm run build          # Build the application
```

### Code Quality
```bash
pnpm run lint           # Lint and fix TypeScript files
pnpm run lint:check     # Check linting without fixing
pnpm run format         # Format code with Biome
```

### Testing
```bash
pnpm run test           # Run all tests
pnpm run test:unit      # Run unit tests only
pnpm run test:e2e       # Run integration/e2e tests
pnpm run test:cov       # Run tests with coverage report
pnpm run test:watch     # Run tests in watch mode
```

### Database
```bash
pnpm run migration:generate  # Generate new migration
pnpm run migration:run      # Run pending migrations
pnpm run migration:revert   # Revert last migration
pnpm run db:seed           # Run database seeds
pnpm run db:setup          # Run migrations and seeds
pnpm run db:reset          # Drop database and setup with persistent seeds
```

## 🏗️ Architecture

### Module Structure
```
src/
├── core/                    # Core infrastructure modules
│   ├── config/             # Configuration management
│   ├── database/           # Database service and migrations
│   ├── logger/             # Logging service
│   ├── redis/              # Redis services
│   └── security/           # Security services
├── modules/                # Feature modules
│   ├── auth/               # Authentication
│   ├── user/               # User management
│   ├── rbac/               # Role-based access control
│   └── websocket/          # WebSocket communication
├── shared/                 # Shared utilities
│   ├── entities/           # Database entities
│   ├── dto/                # Data transfer objects
│   └── services/           # Common services
└── templates/              # Email templates
```

### Key Design Patterns

**Authentication & Authorization:**
- JWT-based authentication with refresh tokens
- **Hierarchical RBAC**: Role inheritance with parent-child relationships
- **Permission-based access**: Granular permissions (CREATE, READ, UPDATE, DELETE, MANAGE)
- Decorators: `@RequirePermission()`, `@RequireRole()`, `@Public()`, `@CurrentUser()`

**Security Features:**
- Rate limiting per IP/user
- Request idempotency protection
- Password hashing with bcrypt
- Global authentication guards

**Database Design:**
- Migration-based schema management
- Entities: User, Role, Permission, RoleHierarchy, IdempotencyKey
- Hierarchical role system with cycle detection

**Redis Integration:**
- Dual setup: NestJS cache abstraction + direct Redis access
- Specialized services: String, Hash, List, Set, Lock, PubSub
- Health monitoring and connection management

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example`):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=nest11

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Security
SALT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=10
```

### Path Aliases

The application uses TypeScript path aliases for clean imports:

```typescript
import { UserService } from '~/modules/user/user.service'
import { CustomLoggerService } from '~core/logger/logger.service'
import { UserEntity } from '~shared/entities/user.entity'
```

## 🧪 Testing

### Test Structure
```
test/
├── unit/                   # Unit tests with mocking
└── e2e/                    # End-to-end API tests
```

### Testing Guidelines
- **Unit Tests**: Isolated component testing with mocks
- **Integration Tests**: Full API workflow testing
- **Coverage**: 80% minimum threshold
- **Test Data**: Factories and fixtures for consistent test data

### Running Tests
```bash
# Run specific test suites
pnpm run test:unit:watch    # Unit tests in watch mode
pnpm run test:e2e:watch     # E2E tests in watch mode
pnpm run test:cov           # Coverage report
```

## 📝 API Documentation

The API documentation is available via Swagger UI when running the application:

- **Development**: http://localhost:3000/api/docs
- **Production**: Configure according to your deployment

### Key API Endpoints

```
POST /auth/login            # User authentication
POST /auth/register         # User registration
GET  /users                 # List users (with pagination)
GET  /users/:id             # Get user by ID
PUT  /users/:id             # Update user
DELETE /users/:id           # Delete user
GET  /health                # Health check
```

## 🚀 Deployment

### Production Checklist
- [ ] Set secure JWT secrets
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure email service
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Set up backup strategy

### Docker Deployment
```bash
# Build production image
docker build -t nest11-app .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Considerations

- **Authentication**: JWT tokens with secure secrets
- **Authorization**: Role-based access control
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Class-validator for all DTOs
- **Password Security**: bcrypt hashing with configurable rounds
- **Environment Variables**: Never commit secrets to version control
- **CORS**: Properly configured for production
- **Helmet**: Security headers middleware

## 📊 Monitoring & Logging

### Logging
- **Structured Logging**: JSON format with contextual information
- **Log Levels**: Error, Warn, Info, Debug
- **Business Events**: Trackable user actions and system events
- **File Rotation**: Daily log rotation with retention policies

### Health Checks
```
GET /health              # Overall application health
GET /health/database     # Database connectivity
GET /health/redis        # Redis connectivity
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Write comprehensive tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Redis Documentation](https://redis.io/documentation)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Docker Documentation](https://docs.docker.com)

---

**Note**: This is a production-ready template. Make sure to review and adjust security settings, database configurations, and deployment strategies according to your specific requirements.