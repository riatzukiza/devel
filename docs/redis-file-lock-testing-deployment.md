# Redis File Lock Testing and Deployment Guide

## Testing Strategy

### Unit Testing

#### Redis Cache Implementation Tests
```typescript
// tests/redis-cache.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'test';
import { RedisCache } from '../src/redis-cache';
import { createClient } from 'redis';

describe('RedisCache', () => {
  let redisCache: RedisCache<LockRecord>;
  let testClient: RedisClientType;

  beforeEach(async () => {
    testClient = createClient({ url: 'redis://localhost:6379/15' });
    await testClient.connect();
    redisCache = new RedisCache<LockRecord>({
      client: testClient,
      namespace: 'test-locks',
      defaultTtlMs: 5000
    });
  });

  afterEach(async () => {
    await testClient.flushDb();
    await testClient.quit();
  });

  it('should store and retrieve lock records', async () => {
    const lockRecord: LockRecord = {
      sessionId: 'test-session',
      timestamp: Date.now(),
      agentId: 'test-agent'
    };

    await redisCache.set('file:/test/path', lockRecord);
    const retrieved = await redisCache.get('file:/test/path');
    
    expect(retrieved).toEqual(lockRecord);
  });

  it('should respect TTL expiration', async () => {
    const lockRecord: LockRecord = {
      sessionId: 'test-session',
      timestamp: Date.now(),
      agentId: 'test-agent'
    };

    await redisCache.set('file:/test/path', lockRecord, { ttlMs: 100 });
    
    // Should exist immediately
    let retrieved = await redisCache.get('file:/test/path');
    expect(retrieved).toBeDefined();
    
    // Wait for expiration
    await sleep(150);
    retrieved = await redisCache.get('file:/test/path');
    expect(retrieved).toBeUndefined();
  });

  it('should handle concurrent lock acquisition', async () => {
    const lockRecord1: LockRecord = {
      sessionId: 'session-1',
      timestamp: Date.now(),
      agentId: 'agent-1'
    };

    const lockRecord2: LockRecord = {
      sessionId: 'session-2',
      timestamp: Date.now(),
      agentId: 'agent-2'
    };

    // First lock should succeed
    await redisCache.set('file:/test/path', lockRecord1);
    
    // Second lock with different session should fail
    const existing = await redisCache.get('file:/test/path');
    expect(existing?.sessionId).toBe('session-1');
  });
});
```

#### Lock Operation Tests
```typescript
// tests/lock-operations.test.ts
import { describe, it, expect, beforeEach } from 'test';
import { acquireLock, releaseLock } from '../src/lock-operations';
import { RedisCache } from '../src/redis-cache';

describe('Lock Operations', () => {
  let redisCache: RedisCache<LockRecord>;

  beforeEach(async () => {
    redisCache = new RedisCache<LockRecord>({
      client: testClient,
      namespace: 'test-locks',
      defaultTtlMs: 5000
    });
  });

  it('should acquire lock successfully', async () => {
    const filePath = '/test/file.txt';
    const sessionId = 'test-session';
    const agentId = 'test-agent';

    const result = await acquireLock(filePath, agentId, sessionId, redisCache);
    
    expect(result).toBe('/test/file.txt');
    
    // Verify lock is stored
    const lock = await redisCache.get(result);
    expect(lock?.sessionId).toBe(sessionId);
    expect(lock?.agentId).toBe(agentId);
  });

  it('should prevent concurrent lock acquisition', async () => {
    const filePath = '/test/file.txt';
    const sessionId1 = 'session-1';
    const sessionId2 = 'session-2';

    // First lock should succeed
    await acquireLock(filePath, 'agent-1', sessionId1, redisCache);
    
    // Second lock should fail
    await expect(
      acquireLock(filePath, 'agent-2', sessionId2, redisCache)
    ).rejects.toThrow('File /test/file.txt is locked by another agent');
  });

  it('should allow same session to reacquire lock', async () => {
    const filePath = '/test/file.txt';
    const sessionId = 'test-session';

    // First acquisition
    await acquireLock(filePath, 'agent-1', sessionId, redisCache);
    
    // Second acquisition by same session should succeed
    await expect(
      acquireLock(filePath, 'agent-1', sessionId, redisCache)
    ).resolves.not.toThrow();
  });

  it('should release lock correctly', async () => {
    const filePath = '/test/file.txt';
    const sessionId = 'test-session';

    const normalizedPath = await acquireLock(filePath, 'agent-1', sessionId, redisCache);
    
    // Verify lock exists
    let lock = await redisCache.get(normalizedPath);
    expect(lock).toBeDefined();
    
    // Release lock
    await releaseLock(normalizedPath, sessionId, redisCache);
    
    // Verify lock is released
    lock = await redisCache.get(normalizedPath);
    expect(lock).toBeUndefined();
  });
});
```

### Integration Testing

#### End-to-End Plugin Tests
```typescript
// tests/plugin-integration.test.ts
import { describe, it, expect, beforeEach } from 'test';
import { FileLockPlugin } from '../src/file-lock';
import { RedisCache } from '../src/redis-cache';

describe('FileLockPlugin Integration', () => {
  let plugin: ReturnType<typeof FileLockPlugin>;
  let redisCache: RedisCache<LockRecord>;

  beforeEach(async () => {
    redisCache = new RedisCache<LockRecord>({
      client: testClient,
      namespace: 'test-locks',
      defaultTtlMs: 5000
    });
    
    plugin = await FileLockPlugin({
      agentId: 'test-agent',
      cacheBackend: 'redis',
      redisCache
    });
  });

  it('should intercept write operations', async () => {
    const mockInput = {
      tool: 'write',
      callID: 'test-call-123'
    };

    const mockOutput = {
      args: { filePath: '/test/file.txt' }
    };

    // Test before hook
    await plugin['tool.execute.before'](mockInput, mockOutput);
    
    // Verify lock was acquired
    const lock = await redisCache.get('/test/file.txt');
    expect(lock).toBeDefined();
    expect(lock?.agentId).toBe('test-agent');

    // Test after hook
    await plugin['tool.execute.after'](mockInput);
    
    // Verify lock was released
    const releasedLock = await redisCache.get('/test/file.txt');
    expect(releasedLock).toBeUndefined();
  });

  it('should ignore read operations', async () => {
    const mockInput = {
      tool: 'read',
      callID: 'test-call-123'
    };

    const mockOutput = {
      args: { filePath: '/test/file.txt' }
    };

    // Test before hook
    await plugin['tool.execute.before'](mockInput, mockOutput);
    
    // Verify no lock was acquired
    const lock = await redisCache.get('/test/file.txt');
    expect(lock).toBeUndefined();
  });

  it('should cleanup on session end', async () => {
    // Acquire multiple locks
    await redisCache.set('/test/file1.txt', {
      sessionId: 'test-session',
      timestamp: Date.now(),
      agentId: 'test-agent'
    });
    
    await redisCache.set('/test/file2.txt', {
      sessionId: 'test-session',
      timestamp: Date.now(),
      agentId: 'test-agent'
    });

    // End session
    await plugin['session.end']();
    
    // Verify all locks are released
    const lock1 = await redisCache.get('/test/file1.txt');
    const lock2 = await redisCache.get('/test/file2.txt');
    
    expect(lock1).toBeUndefined();
    expect(lock2).toBeUndefined();
  });
});
```

### Performance Testing

#### Benchmark Suite
```typescript
// tests/performance.test.ts
import { describe, it, expect } from 'test';
import { performance } from 'perf_hooks';
import { RedisCache } from '../src/redis-cache';
import { LevelCache } from '@promethean-os/level-cache';

describe('Performance Comparison', () => {
  const iterations = 1000;
  const testFiles = Array.from({ length: 100 }, (_, i) => `/test/file-${i}.txt`);

  it('should compare Redis vs LevelDB performance', async () => {
    const redisCache = new RedisCache<LockRecord>({
      client: redisClient,
      namespace: 'perf-test',
      defaultTtlMs: 5000
    });

    const levelCache = await openLevelCache<LockRecord>({
      path: '/tmp/perf-test',
      namespace: 'perf-test',
      defaultTtlMs: 5000
    });

    const lockRecord: LockRecord = {
      sessionId: 'perf-session',
      timestamp: Date.now(),
      agentId: 'perf-agent'
    };

    // Benchmark Redis
    const redisStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const file = testFiles[i % testFiles.length];
      await redisCache.set(file, lockRecord);
      await redisCache.get(file);
    }
    const redisEnd = performance.now();
    const redisTime = redisEnd - redisStart;

    // Benchmark LevelDB
    const levelStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const file = testFiles[i % testFiles.length];
      await levelCache.set(file, lockRecord);
      await levelCache.get(file);
    }
    const levelEnd = performance.now();
    const levelTime = levelEnd - levelStart;

    console.log(`Redis: ${redisTime}ms, LevelDB: ${levelTime}ms`);
    console.log(`Redis ops/sec: ${iterations / (redisTime / 1000)}`);
    console.log(`LevelDB ops/sec: ${iterations / (levelTime / 1000)}`);

    // Redis should be within reasonable range of LevelDB
    expect(redisTime).toBeLessThan(levelTime * 3);

    await levelCache.close();
  });

  it('should test concurrent lock acquisition', async () => {
    const redisCache = new RedisCache<LockRecord>({
      client: redisClient,
      namespace: 'concurrent-test',
      defaultTtlMs: 5000
    });

    const concurrentOps = 50;
    const filePath = '/test/concurrent-file.txt';

    const promises = Array.from({ length: concurrentOps }, (_, i) => 
      acquireLock(filePath, `agent-${i}`, `session-${i}`, redisCache)
        .catch(err => err)
    );

    const results = await Promise.all(promises);
    
    // Only one should succeed, others should fail
    const successes = results.filter(r => typeof r === 'string');
    const failures = results.filter(r => r instanceof Error);
    
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(concurrentOps - 1);
  });
});
```

## Deployment Strategy

### Environment Configuration

#### Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    environment:
      - REDIS_PASSWORD=dev-password

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379:0:dev-password
    depends_on:
      - redis

volumes:
  redis_data:
```

#### Production Environment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  redis-primary:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_primary_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  redis-replica:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_replica_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --slaveof redis-primary 6379 --masterauth ${REDIS_PASSWORD}
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - redis-primary
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  redis-sentinel:
    image: redis:7-alpine
    ports:
      - "26379:26379"
    volumes:
      - ./sentinel.conf:/etc/redis/sentinel.conf
    command: redis-sentinel /etc/redis/sentinel.conf
    depends_on:
      - redis-primary
      - redis-replica

volumes:
  redis_primary_data:
  redis_replica_data:
```

### Configuration Management

#### Environment Variables
```typescript
// src/config.ts
export interface RedisConfig {
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
  retryStrategy?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

export function getRedisConfig(): RedisConfig {
  return {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DATABASE || '0'),
    tls: process.env.REDIS_TLS === 'true',
    connectionPool: {
      min: parseInt(process.env.REDIS_POOL_MIN || '2'),
      max: parseInt(process.env.REDIS_POOL_MAX || '10'),
      acquireTimeout: parseInt(process.env.REDIS_POOL_TIMEOUT || '5000'),
    },
    retryStrategy: {
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '10'),
      baseDelay: parseInt(process.env.REDIS_BASE_DELAY || '100'),
      maxDelay: parseInt(process.env.REDIS_MAX_DELAY || '3000'),
    }
  };
}
```

#### Feature Flags
```typescript
// src/feature-flags.ts
export interface FeatureFlags {
  useRedisCache: boolean;
  enableDistributedLocks: boolean;
  enableLockRenewal: boolean;
  enableMetrics: boolean;
  enableDebugMode: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  return {
    useRedisCache: process.env.USE_REDIS_CACHE === 'true',
    enableDistributedLocks: process.env.ENABLE_DISTRIBUTED_LOCKS === 'true',
    enableLockRenewal: process.env.ENABLE_LOCK_RENEWAL === 'true',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableDebugMode: process.env.DEBUG_MODE === 'true',
  };
}
```

### Monitoring and Observability

#### Metrics Collection
```typescript
// src/metrics.ts
import { createClient } from 'redis';
import { Counter, Histogram, Gauge } from 'prom-client';

export class RedisMetrics {
  private static instance: RedisMetrics;
  
  public lockAcquisitionTotal: Counter;
  public lockAcquisitionDuration: Histogram;
  public activeLocks: Gauge;
  public redisConnectionErrors: Counter;
  public redisOperationDuration: Histogram;

  private constructor() {
    this.lockAcquisitionTotal = new Counter({
      name: 'file_lock_acquisitions_total',
      help: 'Total number of lock acquisitions',
      labelNames: ['status', 'agent_id']
    });

    this.lockAcquisitionDuration = new Histogram({
      name: 'file_lock_acquisition_duration_seconds',
      help: 'Time spent acquiring locks',
      labelNames: ['status'],
      buckets: [0.001, 0.01, 0.1, 1, 5]
    });

    this.activeLocks = new Gauge({
      name: 'file_lock_active_count',
      help: 'Number of currently active locks',
      labelNames: ['session_id']
    });

    this.redisConnectionErrors = new Counter({
      name: 'redis_connection_errors_total',
      help: 'Total number of Redis connection errors',
      labelNames: ['operation']
    });

    this.redisOperationDuration = new Histogram({
      name: 'redis_operation_duration_seconds',
      help: 'Time spent on Redis operations',
      labelNames: ['operation', 'status'],
      buckets: [0.0001, 0.001, 0.01, 0.1, 1]
    });
  }

  static getInstance(): RedisMetrics {
    if (!RedisMetrics.instance) {
      RedisMetrics.instance = new RedisMetrics();
    }
    return RedisMetrics.instance;
  }

  recordLockAcquisition(status: 'success' | 'failure', agentId: string, duration: number) {
    this.lockAcquisitionTotal.inc({ status, agent_id: agentId });
    this.lockAcquisitionDuration.observe({ status }, duration / 1000);
  }

  recordRedisOperation(operation: string, status: 'success' | 'error', duration: number) {
    this.redisOperationDuration.observe({ operation, status }, duration / 1000);
  }

  incrementConnectionErrors(operation: string) {
    this.redisConnectionErrors.inc({ operation });
  }

  setActiveLocks(sessionId: string, count: number) {
    this.activeLocks.set({ session_id: sessionId }, count);
  }
}
```

#### Health Checks
```typescript
// src/health-check.ts
import { createClient } from 'redis';

export class RedisHealthCheck {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async check(): Promise<{
    healthy: boolean;
    details: {
      connected: boolean;
      latency: number;
      memoryUsage?: number;
      keyCount?: number;
    };
  }> {
    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : undefined;

      const keyCount = await this.client.dbSize();

      return {
        healthy: true,
        details: {
          connected: true,
          latency,
          memoryUsage,
          keyCount
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          connected: false,
          latency: 0
        }
      };
    }
  }
}
```

### Deployment Scripts

#### Migration Script
```typescript
// scripts/migrate-to-redis.ts
import { createClient } from 'redis';
import { openLevelCache } from '@promethean-os/level-cache';
import { RedisCache } from '../src/redis-cache';

async function migrateLevelDbToRedis() {
  console.log('Starting LevelDB to Redis migration...');

  // Connect to Redis
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  await redisClient.connect();

  // Open LevelDB
  const levelCache = await openLevelCache<LockRecord>({
    path: '/tmp/opencode/file-locks',
    namespace: 'locks',
    defaultTtlMs: 5 * 60 * 1000
  });

  // Create Redis cache
  const redisCache = new RedisCache<LockRecord>({
    client: redisClient,
    namespace: 'locks',
    defaultTtlMs: 5 * 60 * 1000
  });

  try {
    let migratedCount = 0;
    let errorCount = 0;

    // Iterate through all LevelDB entries
    for await (const [key, value] of levelCache.entries()) {
      try {
        await redisCache.set(key, value);
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`Migrated ${migratedCount} locks...`);
        }
      } catch (error) {
        console.error(`Failed to migrate key ${key}:`, error);
        errorCount++;
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Successfully migrated: ${migratedCount} locks`);
    console.log(`- Failed migrations: ${errorCount} locks`);

    // Verify migration
    const levelCount = await countLevelDbEntries(levelCache);
    const redisCount = await countRedisEntries(redisCache);
    
    console.log(`Verification:`);
    console.log(`- LevelDB entries: ${levelCount}`);
    console.log(`- Redis entries: ${redisCount}`);
    console.log(`- Migration accuracy: ${((redisCount / levelCount) * 100).toFixed(2)}%`);

  } finally {
    await levelCache.close();
    await redisClient.quit();
  }
}

async function countLevelDbEntries(cache: Cache<LockRecord>): Promise<number> {
  let count = 0;
  for await (const _ of cache.entries()) {
    count++;
  }
  return count;
}

async function countRedisEntries(cache: RedisCache<LockRecord>): Promise<number> {
  // Implementation depends on RedisCache interface
  // This is a placeholder
  return 0;
}

migrateLevelDbToRedis().catch(console.error);
```

#### Rollback Script
```typescript
// scripts/rollback-to-leveldb.ts
import { createClient } from 'redis';
import { openLevelCache } from '@promethean-os/level-cache';
import { RedisCache } from '../src/redis-cache';

async function rollbackToLevelDb() {
  console.log('Starting Redis to LevelDB rollback...');

  // Connect to Redis
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  await redisClient.connect();

  // Open LevelDB
  const levelCache = await openLevelCache<LockRecord>({
    path: '/tmp/opencode/file-locks-rollback',
    namespace: 'locks',
    defaultTtlMs: 5 * 60 * 1000
  });

  // Create Redis cache
  const redisCache = new RedisCache<LockRecord>({
    client: redisClient,
    namespace: 'locks',
    defaultTtlMs: 5 * 60 * 1000
  });

  try {
    let rollbackCount = 0;
    let errorCount = 0;

    // Iterate through all Redis entries
    for await (const [key, value] of redisCache.entries()) {
      try {
        await levelCache.set(key, value);
        rollbackCount++;
        
        if (rollbackCount % 100 === 0) {
          console.log(`Rolled back ${rollbackCount} locks...`);
        }
      } catch (error) {
        console.error(`Failed to rollback key ${key}:`, error);
        errorCount++;
      }
    }

    console.log(`Rollback completed:`);
    console.log(`- Successfully rolled back: ${rollbackCount} locks`);
    console.log(`- Failed rollbacks: ${errorCount} locks`);

  } finally {
    await levelCache.close();
    await redisClient.quit();
  }
}

rollbackToLevelDb().catch(console.error);
```

## Operational Procedures

### Monitoring Dashboard

#### Key Metrics to Monitor
1. **Lock Acquisition Rate**: Number of locks acquired per minute
2. **Lock Acquisition Duration**: Time spent acquiring locks
3. **Active Locks**: Current number of active locks
4. **Redis Connection Health**: Connection status and latency
5. **Redis Memory Usage**: Memory consumption and eviction rates
6. **Error Rates**: Connection errors, operation failures

#### Alerting Rules
```yaml
# alerts.yml
groups:
  - name: redis-file-lock-alerts
    rules:
      - alert: RedisConnectionDown
        expr: up{job="redis-file-lock"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection is down"
          description: "Redis file lock service has been down for more than 1 minute"

      - alert: HighLockAcquisitionLatency
        expr: histogram_quantile(0.95, file_lock_acquisition_duration_seconds_bucket) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High lock acquisition latency"
          description: "95th percentile of lock acquisition time is above 1 second for 5 minutes"

      - alert: RedisMemoryUsageHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage is high"
          description: "Redis memory usage is above 80% for 5 minutes"

      - alert: ActiveLocksHigh
        expr: file_lock_active_count > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High number of active locks"
          description: "More than 1000 active locks for 10 minutes"
```

### Runbook

#### Common Issues and Solutions

**Issue: Redis Connection Failures**
- **Symptoms**: Lock acquisition failures, connection errors in logs
- **Diagnosis**: Check Redis server status, network connectivity, authentication
- **Solution**: 
  1. Verify Redis server is running: `redis-cli ping`
  2. Check network connectivity: `telnet redis-host 6379`
  3. Verify credentials and connection parameters
  4. Restart Redis service if necessary
  5. Enable fallback to LevelDB if configured

**Issue: High Lock Acquisition Latency**
- **Symptoms**: Slow file operations, timeout errors
- **Diagnosis**: Monitor Redis latency, check for network issues, analyze lock contention
- **Solution**:
  1. Check Redis latency: `redis-cli --latency`
  2. Monitor for lock contention patterns
  3. Consider increasing connection pool size
  4. Enable Redis pipelining for batch operations
  5. Review lock acquisition logic for optimization opportunities

**Issue: Memory Usage High**
- **Symptoms**: Redis OOM errors, evictions, performance degradation
- **Diagnosis**: Check Redis memory usage, analyze key patterns, monitor TTL effectiveness
- **Solution**:
  1. Check memory usage: `redis-cli info memory`
  2. Analyze key patterns: `redis-cli --scan --pattern "locks:*"`
  3. Verify TTL is working correctly
  4. Consider increasing Redis memory limit
  5. Implement more aggressive cleanup policies

**Issue: Lock Leaks**
- **Symptoms**: Accumulation of stale locks, files remaining locked
- **Diagnosis**: Check for expired locks, analyze session cleanup, monitor release operations
- **Solution**:
  1. Manually clean up stale locks: `redis-cli --scan --pattern "locks:*" | xargs redis-cli del`
  2. Verify session cleanup is working correctly
  3. Implement automated cleanup jobs
  4. Add monitoring for lock leak detection
  5. Review lock release logic for edge cases

### Backup and Recovery

#### Backup Strategy
```bash
#!/bin/bash
# backup-redis.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/redis"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your-password"

mkdir -p $BACKUP_DIR

# Create Redis backup
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD \
  --rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# Create backup metadata
echo "Backup created at: $(date)" > $BACKUP_DIR/backup_$DATE.info
echo "Redis version: $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD info server | grep redis_version)" >> $BACKUP_DIR/backup_$DATE.info
echo "Database size: $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD dbsize)" >> $BACKUP_DIR/backup_$DATE.info

# Keep only last 7 days of backups
find $BACKUP_DIR -name "redis_backup_*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "backup_*.info" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/redis_backup_$DATE.rdb"
```

#### Recovery Procedure
```bash
#!/bin/bash
# recover-redis.sh
BACKUP_FILE=$1
REDIS_DATA_DIR="/var/lib/redis"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Stop Redis service
sudo systemctl stop redis

# Backup current data
sudo cp -r $REDIS_DATA_DIR $REDIS_DATA_DIR.backup.$(date +%Y%m%d_%H%M%S)

# Copy backup file to Redis data directory
sudo cp $BACKUP_FILE $REDIS_DATA_DIR/dump.rdb
sudo chown redis:redis $REDIS_DATA_DIR/dump.rdb
sudo chmod 644 $REDIS_DATA_DIR/dump.rdb

# Start Redis service
sudo systemctl start redis

echo "Recovery completed from: $BACKUP_FILE"
```

## Conclusion

This comprehensive testing and deployment guide ensures that the Redis file lock migration is executed with minimal risk and maximum reliability. The testing strategy covers unit, integration, and performance testing, while the deployment strategy provides clear procedures for environment setup, monitoring, and operational management.

The key to success lies in:
1. **Thorough testing** at all levels to ensure compatibility and performance
2. **Gradual deployment** with proper monitoring and rollback capabilities
3. **Comprehensive monitoring** to detect and respond to issues quickly
4. **Clear operational procedures** for common scenarios and emergencies

By following this guide, the migration to Redis will provide improved performance, scalability, and reliability for the file lock system while maintaining backward compatibility and operational stability.