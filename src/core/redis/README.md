# Redis Service Architecture

## Overview
Redis service đã được tách thành các service chuyên biệt để dễ quản lý và maintain từng loại dữ liệu Redis.

## Structure

```
redis/
├── redis.service.ts          # Main service với composition pattern
├── services/                 # Specialized services
│   ├── redis-string.service.ts    # String operations
│   ├── redis-hash.service.ts      # Hash operations  
│   ├── redis-list.service.ts      # List operations
│   ├── redis-set.service.ts       # Set operations
│   ├── redis-pubsub.service.ts    # Pub/Sub operations
│   ├── redis-utility.service.ts   # Utility & key management
│   ├── redis-json.service.ts      # JSON operations (Redis Stack)
│   └── index.ts
├── redis.module.ts
└── README.md
```

## Usage

### 1. Basic Usage (Legacy methods)
```typescript
// Inject main service
constructor(private redisService: RedisService) {}

// Use legacy methods (still available)
await this.redisService.get('key');
await this.redisService.set('key', 'value');
await this.redisService.del('key');
```

### 2. Specialized Services Usage (Recommended)
```typescript
// String operations
await this.redisService.string.get('key');
await this.redisService.string.set('key', 'value', 300);
await this.redisService.string.incr('counter');
await this.redisService.string.append('key', 'suffix');

// Hash operations
await this.redisService.hash.hset('user:123', 'name', 'John');
await this.redisService.hash.hget('user:123', 'name');
await this.redisService.hash.hgetall('user:123');
await this.redisService.hash.hmset('user:123', { name: 'John', age: '30' });

// List operations
await this.redisService.list.lpush('queue', 'task1', 'task2');
await this.redisService.list.rpop('queue');
await this.redisService.list.lrange('queue', 0, -1);
await this.redisService.list.llen('queue');

// Set operations
await this.redisService.sets.sadd('online_users', 'user1', 'user2');
await this.redisService.sets.smembers('online_users');
await this.redisService.sets.sismember('online_users', 'user1');
await this.redisService.sets.srem('online_users', 'user1');

// Pub/Sub operations
await this.redisService.pubsub.publish('channel', 'message');
await this.redisService.pubsub.subscribe('channel');
this.redisService.pubsub.onMessage((channel, message) => {
  console.log(`Received: ${message} from ${channel}`);
});

// Utility operations
await this.redisService.utility.exists('key');
await this.redisService.utility.expire('key', 300);
await this.redisService.utility.ttl('key');
await this.redisService.utility.keys('pattern*');
await this.redisService.utility.ping();

// JSON operations (requires Redis Stack)
await this.redisService.json.jsonSet('user:123', '$', { name: 'John', age: 30 });
await this.redisService.json.jsonGet('user:123');
await this.redisService.json.setObject('config', { theme: 'dark' });
await this.redisService.json.getObject('config');
```

## Benefits

### 1. **Organized & Maintainable**
- Each data type has its own service
- Easy to find and modify specific operations
- Clear separation of concerns

### 2. **Type Safety**
- Better TypeScript support
- Specific return types for each operation
- Clearer method signatures

### 3. **Extensibility**
- Easy to add new operations to specific data types
- Can add custom utility methods
- Modular approach for Redis Stack features

### 4. **Backward Compatibility**
- Legacy methods still work
- Gradual migration possible
- No breaking changes

## Examples

### User Session Management
```typescript
// Using hash service for user data
await this.redisService.hash.hmset('session:user123', {
  userId: '123',
  loginTime: Date.now().toString(),
  ip: '192.168.1.1'
});

// Using utility service for expiration
await this.redisService.utility.expire('session:user123', 3600);
```

### Real-time Notifications
```typescript
// Using pub/sub service
await this.redisService.pubsub.publish('user:123:notifications', 
  JSON.stringify({ type: 'message', data: 'New message' })
);

// Using list service for notification queue
await this.redisService.list.lpush('notifications:user123', 
  JSON.stringify({ message: 'Welcome!', timestamp: Date.now() })
);
```

### Activity Tracking
```typescript
// Using sets for online users
await this.redisService.sets.sadd('online_users', 'user123');

// Using JSON for complex user preferences
await this.redisService.json.setObject('preferences:user123', {
  theme: 'dark',
  notifications: { email: true, push: false },
  settings: { language: 'en' }
});
```

## Connection Management

The main RedisService handles:
- ✅ Connection initialization and error handling
- ✅ Graceful shutdown and cleanup
- ✅ Automatic client distribution to sub-services
- ✅ Fallback mechanisms when Redis is unavailable

All sub-services automatically handle null client scenarios and provide graceful degradation.