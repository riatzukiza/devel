// Simple test for Redis connection
import { createClient } from 'redis';

async function testRedisConnection() {
  console.log('🚀 Testing Redis connection...');
  
  try {
    const client = createClient({
      host: 'localhost',
      port: 6379,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await client.connect();
    console.log('✅ Connected to Redis successfully');

    // Test basic operations
    await client.set('test-key', 'test-value', { EX: 5 });
    console.log('✅ SET operation successful');

    const value = await client.get('test-key');
    console.log(`✅ GET operation successful: ${value}`);

    await client.del('test-key');
    console.log('✅ DEL operation successful');

    // Test info
    const info = await client.info('server');
    console.log('✅ Redis info retrieved');
    
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    if (versionMatch) {
      console.log(`📊 Redis version: ${versionMatch[1]}`);
    }

    await client.quit();
    console.log('✅ Connection closed successfully');
    
    console.log('\n🎉 Redis is ready for file lock migration!');
    return true;

  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

testRedisConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);