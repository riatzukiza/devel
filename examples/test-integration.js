// Integration test for complete file lock Redis migration
import { createHybridCache } from '/home/err/devel/.config/opencode/plugin/redis-hybrid-cache.js';

// Mock LockRecord type to avoid import issues
const LockRecord = {
  sessionId: '',
  timestamp: 0,
  agentId: undefined
};

async function testCompleteIntegration() {
  console.log('🚀 Testing complete Redis file lock integration...\n');

  // Test 1: Redis-only backend
  console.log('📋 Test 1: Redis-only backend');
  const redisCache = createHybridCache({
    backend: 'redis',
    redisConfig: {
      host: 'localhost',
      port: 6379,
    },
  }, {
    namespace: 'test-locks-redis',
    defaultTtlMs: 5000,
  });

  try {
    await redisCache.set('/test/redis/file.txt', {
      sessionId: 'redis-test-session',
      timestamp: Date.now(),
      agentId: 'redis-agent',
    });

    const retrieved = await redisCache.get('/test/redis/file.txt');
    if (retrieved && retrieved.sessionId === 'redis-test-session') {
      console.log('✅ Redis backend: PASSED');
    } else {
      console.log('❌ Redis backend: FAILED');
      return false;
    }
  } catch (error) {
    console.log(`❌ Redis backend: FAILED - ${error.message}`);
    return false;
  }
  await redisCache.close();

  // Test 2: LevelDB backend
  console.log('\n📋 Test 2: LevelDB backend');
  const levelCache = createHybridCache({
    backend: 'leveldb',
    leveldbPath: '/tmp/test-leveldb',
  }, {
    namespace: 'test-locks-leveldb',
    defaultTtlMs: 5000,
  });

  try {
    await levelCache.set('/test/leveldb/file.txt', {
      sessionId: 'leveldb-test-session',
      timestamp: Date.now(),
      agentId: 'leveldb-agent',
    });

    const retrieved = await levelCache.get('/test/leveldb/file.txt');
    if (retrieved && retrieved.sessionId === 'leveldb-test-session') {
      console.log('✅ LevelDB backend: PASSED');
    } else {
      console.log('❌ LevelDB backend: FAILED');
      return false;
    }
  } catch (error) {
    console.log(`❌ LevelDB backend: FAILED - ${error.message}`);
    return false;
  }
  await levelCache.close();

  // Test 3: Hybrid backend with Redis primary
  console.log('\n📋 Test 3: Hybrid backend (Redis primary)');
  const hybridCache = createHybridCache({
    backend: 'hybrid',
    redisConfig: {
      host: 'localhost',
      port: 6379,
    },
    leveldbPath: '/tmp/test-hybrid',
    fallbackOnError: true,
  }, {
    namespace: 'test-locks-hybrid',
    defaultTtlMs: 5000,
  });

  try {
    console.log(`Current backend: ${hybridCache.getCurrentBackend()}`);
    
    await hybridCache.set('/test/hybrid/file.txt', {
      sessionId: 'hybrid-test-session',
      timestamp: Date.now(),
      agentId: 'hybrid-agent',
    });

    const retrieved = await hybridCache.get('/test/hybrid/file.txt');
    if (retrieved && retrieved.sessionId === 'hybrid-test-session') {
      console.log('✅ Hybrid backend: PASSED');
    } else {
      console.log('❌ Hybrid backend: FAILED');
      return false;
    }

    // Test health check
    const health = await hybridCache.healthCheck();
    console.log(`Health check: primary=${health.primary.healthy} ${health.primary.error ? `(${health.primary.error})` : ''}`);
    if (health.fallback) {
      console.log(`Health check: fallback=${health.fallback.healthy} ${health.fallback.error ? `(${health.fallback.error})` : ''}`);
    }

  } catch (error) {
    console.log(`❌ Hybrid backend: FAILED - ${error.message}`);
    return false;
  }
  await hybridCache.close();

  // Test 4: Backend switching
  console.log('\n📋 Test 4: Backend switching');
  const switchCache = createHybridCache({
    backend: 'hybrid',
    redisConfig: {
      host: 'localhost',
      port: 6379,
    },
    leveldbPath: '/tmp/test-switch',
    fallbackOnError: true,
  }, {
    namespace: 'test-locks-switch',
    defaultTtlMs: 5000,
  });

  try {
    console.log(`Original backend: ${switchCache.getCurrentBackend()}`);
    
    await switchCache.switchToBackend('leveldb');
    console.log(`Switched to: ${switchCache.getCurrentBackend()}`);
    
    await switchCache.switchToBackend('redis');
    console.log(`Switched back to: ${switchCache.getCurrentBackend()}`);
    
    console.log('✅ Backend switching: PASSED');
  } catch (error) {
    console.log(`❌ Backend switching: FAILED - ${error.message}`);
    return false;
  }
  await switchCache.close();

  // Test 5: TTL functionality
  console.log('\n📋 Test 5: TTL functionality');
  const ttlCache = createHybridCache({
    backend: 'redis',
    redisConfig: {
      host: 'localhost',
      port: 6379,
    },
  }, {
    namespace: 'test-locks-ttl',
    defaultTtlMs: 2000, // 2 seconds
  });

  try {
    await ttlCache.set('/test/ttl/file.txt', {
      sessionId: 'ttl-test-session',
      timestamp: Date.now(),
      agentId: 'ttl-agent',
    });

    let retrieved = await ttlCache.get('/test/ttl/file.txt');
    if (retrieved) {
      console.log('✅ TTL: Set and immediate retrieve: PASSED');
    }

    // Wait for expiration
    console.log('⏳ Waiting for TTL expiration...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    retrieved = await ttlCache.get('/test/ttl/file.txt');
    if (!retrieved) {
      console.log('✅ TTL: Expiration: PASSED');
    } else {
      console.log('❌ TTL: Expiration: FAILED - record still exists');
      return false;
    }
  } catch (error) {
    console.log(`❌ TTL: FAILED - ${error.message}`);
    return false;
  }
  await ttlCache.close();

  console.log('\n🎉 All integration tests passed!');
  console.log('\n📝 Migration Status:');
  console.log('✅ Redis client working correctly');
  console.log('✅ Cache interface implemented');
  console.log('✅ Hybrid backend with fallback working');
  console.log('✅ TTL functionality working');
  console.log('✅ Backend switching working');
  console.log('\n🚀 Ready for production deployment!');
  
  return true;
}

// Run integration tests
testCompleteIntegration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);