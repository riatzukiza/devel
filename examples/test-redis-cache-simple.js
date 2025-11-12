import { createClient } from 'redis';

// Define LockRecord inline to avoid import issues
const LockRecord = {
  sessionId: '',
  timestamp: 0,
  agentId: undefined
};

// Simple Redis cache test that doesn't rely on complex imports
async function testRedisCacheSimple() {
  console.log('🚀 Testing Redis cache for file locks...');
  
  try {
    const client = createClient({
      host: 'localhost',
      port: 6379,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await client.connect();
    console.log('✅ Connected to Redis');

    const LOCK_TTL = 5; // 5 seconds for testing
    const NAMESPACE = 'test-locks';

    // Test lock record
    const lockRecord = {
      sessionId: 'test-session-123',
      timestamp: Date.now(),
      agentId: 'test-agent',
    };

    const key = `${NAMESPACE}\u241F/test/file.txt`;
    const envelope = {
      v: lockRecord,
      x: Date.now() + (LOCK_TTL * 1000)
    };

    // Test set with TTL
    await client.setEx(key, LOCK_TTL, JSON.stringify(envelope));
    console.log('✅ Lock record stored with TTL');

    // Test get
    const stored = await client.get(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log(`✅ Lock record retrieved: session ${parsed.v.sessionId}`);
    }

    // Test TTL
    const ttl = await client.ttl(key);
    console.log(`✅ TTL remaining: ${ttl} seconds`);

    // Test simple key operations
    const keys = await client.keys(`${NAMESPACE}\u241F*`);
    console.log(`✅ Found ${keys.length} keys in namespace`);
    
    for (const redisKey of keys) {
      const value = await client.get(redisKey);
      if (value) {
        const parsed = JSON.parse(value);
        console.log(`📁 Key: ${redisKey}, session: ${parsed.v.sessionId}`);
      }
    }

    // Test cleanup
    await client.del(key);
    console.log('✅ Test key deleted');

    await client.quit();
    console.log('✅ Redis connection closed');

    console.log('\n🎉 Redis cache test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Redis cache test failed:', error);
    return false;
  }
}

testRedisCacheSimple().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);