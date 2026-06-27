# Redis File Lock Migration Plan

## Overview

This document outlines the comprehensive plan for migrating the `@.config/opencode/plugin/file-lock.ts` from LevelDB-based caching to Redis for improved performance, scalability, and distributed lock management.

## Current Implementation Analysis

### Existing Architecture
- **Cache Backend**: LevelDB (`@promethean-os/level-cache`)
- **Storage Location**: File system (`/tmp/opencode/file-locks`)
- **Data Structure**: Namespaced key-value store with TTL support
- **Lock Management**: In-memory `Map` objects for session tracking
- **TTL**: 5 minutes (300,000ms)

### Key Components to Migrate
1. **Cache Interface** (`Cache<LockRecord>`): Replace LevelDB with Redis client
2. **Lock Storage**: Migrate from file-based to Redis-based storage
3. **Session Management**: Maintain in-memory Maps but enhance with Redis persistence
4. **TTL Management**: Leverage Redis native TTL instead of manual expiration

## Redis Design Strategy

### Data Structure Selection

#### Primary Lock Storage
- **Key Pattern**: `locks:{normalizedPath}`
- **Value**: JSON-serialized `LockRecord`
- **TTL**: 5 minutes (300 seconds)
- **Commands**: `SET`, `GET`, `DEL` with `EX` option

#### Session Tracking Enhancement
- **Key Pattern**: `sessions:{sessionId}:locks`
- **Value**: Set of locked file paths
- **TTL**: 5 minutes (auto-cleanup)
- **Commands**: `SADD`, `SREM`, `SMEMBERS`, `EXPIRE`

#### Call Lock Management
- **Key Pattern**: `calls:{callKey}`
- **Value**: JSON-serialized `ActiveCallLock`
- **TTL**: 5 minutes
- **Commands**: `SET`, `GET`, `DEL`

### Redis Commands Mapping

| LevelDB Operation | Redis Equivalent | Notes |
|------------------|------------------|-------|
| `cache.get(key)` | `client.get(key)` | Direct mapping |
| `cache.set(key, value, ttl)` | `client.set(key, JSON.stringify(value), { EX: ttl/1000 })` | TTL in seconds |
| `cache.del(key)` | `client.del(key)` | Direct mapping |
| `cache.sweepExpired()` | Native Redis TTL | No manual cleanup needed |
| `cache.entries()` | `client.scan()` with pattern | For migration/debugging |

## Migration Strategy

### Phase 1: Foundation and Redis Integration

#### 1.1 Dependencies and Setup
- Add `redis` package to dependencies
- Create Redis client factory with configuration support
- Implement connection pooling and error handling
- Add environment variable support for Redis configuration

#### 1.2 Redis Cache Interface
- Create `RedisCache<T>` class implementing `Cache<T>` interface
- Implement all required methods: `get`, `set`, `del`, `has`, `batch`, `entries`, `sweepExpired`, `withNamespace`, `close`
- Add Redis-specific optimizations like pipelining and connection reuse

#### 1.3 Configuration Management
- Add Redis configuration options to plugin interface
- Support both LevelDB and Redis backends (dual mode)
- Implement fallback mechanism for Redis connection failures

### Phase 2: Core Functionality Migration

#### 2.1 Lock Operations Migration
- Migrate `acquireLock()` function to use Redis
- Implement Redis-based atomic operations for lock acquisition
- Add Redis transactions for complex lock operations
- Maintain backward compatibility with existing session management

#### 2.2 Release Operations Migration
- Migrate `releaseLock()` and `releaseAllLocks()` functions
- Implement Redis-based atomic release operations
- Add session cleanup using Redis sets
- Ensure proper cleanup of expired locks

#### 2.3 Session Management Enhancement
- Enhance session tracking with Redis persistence
- Implement cross-process session awareness
- Add session migration capabilities for failover scenarios

### Phase 3: Advanced Features and Optimization

#### 3.1 Distributed Lock Enhancement
- Implement Redis RedLock algorithm for distributed scenarios
- Add lock renewal mechanisms for long-running operations
- Implement lock priority and queuing systems

#### 3.2 Performance Optimization
- Implement Redis pipelining for batch operations
- Add connection pooling for high-concurrency scenarios
- Optimize serialization/deserialization performance

#### 3.3 Monitoring and Observability
- Add Redis connection health monitoring
- Implement lock metrics and statistics
- Add debugging and diagnostic tools

### Phase 4: Testing and Deployment

#### 4.1 Comprehensive Testing
- Unit tests for Redis cache implementation
- Integration tests for lock operations
- Performance benchmarks comparing LevelDB vs Redis
- Failure scenario testing (connection drops, Redis restarts)

#### 4.2 Migration Tools
- Create LevelDB to Redis migration script
- Implement data validation and consistency checks
- Add rollback mechanisms for failed migrations

#### 4.3 Deployment Strategy
- Gradual rollout with feature flags
- Monitoring and alerting during migration
- Documentation and operational procedures

## Implementation Details

### Redis Client Configuration

```typescript
interface RedisCacheOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  tls?: boolean;
  connectionPool?: {
    min: number;
    max: number;
    acquireTimeout: number;
  };
  retryStrategy?: (retries: number) => number | false;
}
```

### Cache Interface Implementation

```typescript
class RedisCache<T> implements Cache<T> {
  private client: RedisClientType;
  private namespace: string;
  private defaultTtlMs: number;

  async get(key: string): Promise<T | undefined> {
    const fullKey = this.namespacedKey(key);
    const value = await this.client.get(fullKey);
    return value ? JSON.parse(value) : undefined;
  }

  async set(key: string, value: T, options?: PutOptions): Promise<void> {
    const fullKey = this.namespacedKey(key);
    const ttl = (options?.ttlMs ?? this.defaultTtlMs) / 1000;
    await this.client.set(fullKey, JSON.stringify(value), { EX: ttl });
  }

  async del(key: string): Promise<void> {
    const fullKey = this.namespacedKey(key);
    await this.client.del(fullKey);
  }

  // ... other interface methods
}
```

### Migration Compatibility Layer

```typescript
class HybridCache<T> implements Cache<T> {
  private levelCache: Cache<T>;
  private redisCache: RedisCache<T>;
  private useRedis: boolean;

  constructor(levelCache: Cache<T>, redisCache: RedisCache<T>, useRedis: boolean) {
    this.levelCache = levelCache;
    this.redisCache = redisCache;
    this.useRedis = useRedis;
  }

  async get(key: string): Promise<T | undefined> {
    return this.useRedis 
      ? this.redisCache.get(key)
      : this.levelCache.get(key);
  }

  // ... other methods with dual backend support
}
```

## Risk Assessment and Mitigation

### Potential Risks

1. **Data Loss**: During migration, locks might be lost
   - Mitigation: Implement backup and rollback mechanisms

2. **Performance Degradation**: Redis latency vs local LevelDB
   - Mitigation: Connection pooling, pipelining, local caching

3. **Connection Issues**: Redis unavailability
   - Mitigation: Fallback to LevelDB, retry mechanisms

4. **Complexity**: Increased operational complexity
   - Mitigation: Comprehensive monitoring, documentation

### Rollback Strategy

1. **Feature Flag**: Enable/disable Redis backend at runtime
2. **Data Preservation**: Keep LevelDB data during migration
3. **Graceful Degradation**: Automatic fallback on Redis failures
4. **Migration Scripts**: Tools to revert to LevelDB if needed

## Success Criteria

### Functional Requirements
- [ ] All existing lock functionality preserved
- [ ] Redis backend fully operational
- [ ] Backward compatibility maintained
- [ ] Performance meets or exceeds LevelDB

### Non-Functional Requirements
- [ ] High availability (99.9% uptime)
- [ ] Sub-millisecond response times
- [ ] Proper error handling and recovery
- [ ] Comprehensive monitoring and alerting

### Operational Requirements
- [ ] Deployment procedures documented
- [ ] Monitoring dashboards in place
- [ ] Runbooks for common issues
- [ ] Team training completed

## Timeline and Milestones

### Phase 1: Foundation (2-3 weeks)
- Week 1: Dependencies, Redis client setup, basic cache interface
- Week 2: Configuration management, dual backend support
- Week 3: Testing and refinement

### Phase 2: Core Migration (3-4 weeks)
- Week 4: Lock operations migration
- Week 5: Release operations migration
- Week 6: Session management enhancement
- Week 7: Integration testing and bug fixes

### Phase 3: Advanced Features (2-3 weeks)
- Week 8: Distributed lock enhancement
- Week 9: Performance optimization
- Week 10: Monitoring and observability

### Phase 4: Testing and Deployment (2-3 weeks)
- Week 11: Comprehensive testing
- Week 12: Migration tools and deployment
- Week 13: Final validation and go-live

## Resource Requirements

### Development Resources
- 1-2 senior developers
- DevOps engineer for Redis setup
- QA engineer for testing

### Infrastructure Resources
- Redis server(s) (cluster for production)
- Monitoring and alerting infrastructure
- Backup and recovery systems

### Training and Documentation
- Team training on Redis operations
- Operational documentation
- Runbooks and troubleshooting guides

## Conclusion

This migration plan provides a comprehensive approach to migrating the file-lock plugin from LevelDB to Redis. The phased approach ensures minimal risk while delivering significant improvements in performance, scalability, and reliability. The dual-backend strategy provides a safety net during the transition, and the comprehensive testing ensures a smooth migration experience.

The migration will enable distributed lock management, improve performance under high load, and provide better observability and monitoring capabilities. With proper planning and execution, this migration will significantly enhance the reliability and scalability of the file-lock system.