# Redis-Based Rate Limiting System

## Overview

This system provides comprehensive rate limiting capabilities using Redis to protect against brute force attacks and abuse, specifically for login attempts.

## Architecture

```
security/
├── rate-limit.service.ts     # Core rate limiting logic
├── security.module.ts        # Security module configuration
└── README.md                 # This documentation

guards/
├── rate-limit.guard.ts       # NestJS guard for route protection
└── index.ts

decorators/
├── rate-limit.decorator.ts   # Custom decorators for IP/UserAgent
└── index.ts
```

## Features

### 🛡️ **Multi-Layer Rate Limiting**
- **IP-based limiting**: Prevents attacks from specific IP addresses
- **Username-based limiting**: Protects individual user accounts
- **Automatic blocking**: Temporary blocks after threshold exceeded
- **Progressive timeouts**: Longer blocks for repeated violations

### 🔧 **Configurable Settings**
- Customizable attempt limits per time window
- Flexible time windows (minutes/hours)
- Different block durations for IP vs username
- Graceful degradation when Redis unavailable

### 📊 **Monitoring & Headers**
- Rate limit headers in HTTP responses
- Detailed logging of violations
- Real-time status tracking
- Reset time information

## Usage

### 1. Basic Integration (Auth Controller)

```typescript
import { ClientIp } from '~core/decorators';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @ClientIp() ipAddress: string,
  ): Promise<AuthResponseDto> {
    // Rate limiting is handled automatically in AuthService
    await this.authService.checkLoginRateLimit(ipAddress, loginDto.email);
    return this.authService.login(loginDto, ipAddress);
  }
}
```

### 2. Service-Level Rate Limiting

```typescript
@Injectable()
export class AuthService {
  constructor(private rateLimitService: RateLimitService) {}

  async checkLoginRateLimit(ipAddress: string, email: string): Promise<void> {
    // Check IP-based rate limit (5 attempts per 15 minutes)
    const ipResult = await this.rateLimitService.checkLoginAttempts(ipAddress);
    if (!ipResult.allowed) {
      throw new UnauthorizedException('Too many login attempts from this IP');
    }

    // Check username-based rate limit (3 attempts per 15 minutes)
    const userResult = await this.rateLimitService.checkUsernameAttempts(email);
    if (!userResult.allowed) {
      throw new UnauthorizedException('Too many login attempts for this account');
    }
  }

  async login(loginDto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (user && ipAddress) {
      // Reset rate limits on successful login
      await this.rateLimitService.resetLoginRateLimit(ipAddress, loginDto.email);
    }
    
    return this.generateAuthResponse(user);
  }
}
```

### 3. Using Guard Decorator (Alternative)

```typescript
import { RateLimit } from '~core/guards';

@Controller('api')
export class ApiController {
  @RateLimit({
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    message: 'Too many API requests',
  })
  @Get('data')
  async getData(): Promise<any> {
    return { data: 'sensitive information' };
  }

  @RateLimit({
    maxAttempts: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (req) => `user:${req.user?.id}:api`, // Per-user limiting
  })
  @Post('upload')
  async uploadFile(): Promise<any> {
    // File upload logic
  }
}
```

### 4. Custom Rate Limiting

```typescript
@Injectable()
export class CustomService {
  constructor(private rateLimitService: RateLimitService) {}

  async sensitiveOperation(userId: string): Promise<void> {
    // Custom rate limiting configuration
    const result = await this.rateLimitService.checkRateLimit(
      `sensitive:${userId}`,
      {
        maxAttempts: 2,
        windowMs: 60 * 60 * 1000, // 1 hour
        blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
      },
      userId
    );

    if (!result.allowed) {
      throw new BadRequestException('Rate limit exceeded for sensitive operation');
    }

    // Perform sensitive operation
  }
}
```

## Configuration

### Default Login Rate Limits

#### IP-Based Limiting
- **Max Attempts**: 5 failed login attempts
- **Time Window**: 15 minutes
- **Block Duration**: 30 minutes
- **Key Pattern**: `rate_limit:login:{ip_address}`

#### Username-Based Limiting
- **Max Attempts**: 3 failed login attempts  
- **Time Window**: 15 minutes
- **Block Duration**: 1 hour
- **Key Pattern**: `rate_limit:login_user:{username}`

### Customization

```typescript
// Override default configuration
const customConfig = {
  maxAttempts: 10,           // More lenient
  windowMs: 5 * 60 * 1000,   // 5 minute window
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
};

await this.rateLimitService.checkLoginAttempts(ipAddress, customConfig);
```

## Response Headers

When rate limiting is active, the following headers are included:

```http
X-RateLimit-Limit: 5                    # Maximum attempts allowed
X-RateLimit-Remaining: 2                # Remaining attempts
X-RateLimit-Reset: 2024-01-15T10:30:00Z # When the limit resets
Retry-After: 1800                       # Seconds until retry allowed
```

## Error Responses

### Rate Limit Exceeded (429)

```json
{
  "statusCode": 429,
  "message": "Too many login attempts from this IP. Try again after 10:30 AM",
  "error": "Too Many Requests",
  "retryAfter": 1705320600000
}
```

### Account-Specific Rate Limit

```json
{
  "statusCode": 401,
  "message": "Too many login attempts for this account. Try again after 11:00 AM"
}
```

## Redis Key Structure

### Rate Limiting Keys
```
rate_limit:login:{ip_address}           # IP attempt counter
rate_limit:login_user:{username}        # Username attempt counter
rate_limit_block:login:{ip_address}     # IP block status
rate_limit_block:login_user:{username}  # Username block status
```

### Example Keys
```
rate_limit:login:192.168.1.100
rate_limit:login_user:john@example.com
rate_limit_block:login:192.168.1.100
rate_limit_block:login_user:john@example.com
```

## Security Benefits

### 🚫 **Brute Force Protection**
- Prevents automated password guessing attacks
- Escalating penalties for repeated violations
- IP and account-level protection

### 🛡️ **Credential Stuffing Defense**
- Limits attempts per username across all IPs
- Prevents large-scale credential testing
- Account lockout for suspicious activity

### 📱 **DDoS Mitigation**
- Rate limits prevent overwhelming the auth system
- Distributed attack protection via IP limiting
- Graceful degradation under attack

### 🔍 **Attack Visibility**
- Comprehensive logging of violations
- Real-time monitoring capabilities
- Forensic data for security analysis

## Monitoring

### Log Messages

```bash
# Rate limit warnings
WARN [RateLimitService] Rate limit exceeded for key: login:192.168.1.100, blocking until: 2024-01-15T10:30:00.000Z

# Successful resets
DEBUG [RateLimitService] Rate limit reset for key: login:192.168.1.100

# Auth service integration
WARN [AuthService] IP rate limit exceeded: 192.168.1.100
WARN [AuthService] Username rate limit exceeded: john@example.com
```

### Health Monitoring

```typescript
// Check rate limit status without incrementing
const status = await this.rateLimitService.getRateLimitStatus('login:192.168.1.100');
console.log({
  remaining: status.remaining,
  resetTime: new Date(status.resetTime),
  blocked: status.blocked
});
```

## Best Practices

### 1. **Fail Open Strategy**
- System allows requests if Redis is unavailable
- Logs errors but doesn't block legitimate users
- Ensures high availability

### 2. **Progressive Penalties**
- IP limiting: 5 attempts → 30 min block
- Username limiting: 3 attempts → 1 hour block  
- Escalating timeouts for repeat offenders

### 3. **Reset on Success**
- Successful login clears all rate limits
- Prevents lockout of legitimate users
- Maintains user experience

### 4. **Comprehensive Logging**
- All rate limit violations logged
- IP and username tracking
- Timestamps for forensic analysis

### 5. **Header Communication**
- Clear rate limit information to clients
- Retry-After headers for proper backoff
- Transparent rate limiting

## Testing

### Manual Testing

```bash
# Test IP rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -v
done

# Check rate limit headers in response
# Should see 429 status on 6th request
```

### Integration Tests

```typescript
describe('Rate Limiting', () => {
  it('should block after 5 failed login attempts from same IP', async () => {
    const loginDto = { email: 'test@example.com', password: 'wrong' };
    
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    }
    
    // 6th attempt should be rate limited
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(401)
      .expect(res => {
        expect(res.body.message).toContain('Too many login attempts');
      });
  });
});
```

## Deployment Considerations

### Redis Configuration
- Ensure Redis persistence for rate limit data
- Configure appropriate memory limits
- Set up Redis clustering for high availability

### Performance
- Rate limiting adds ~1-2ms per request
- Redis operations are asynchronous and fast
- Pipeline operations minimize round trips

### Scaling
- Rate limits are shared across all application instances
- Horizontal scaling doesn't affect rate limiting accuracy
- Redis handles concurrent access efficiently

This rate limiting system provides robust protection against abuse while maintaining excellent user experience for legitimate users.