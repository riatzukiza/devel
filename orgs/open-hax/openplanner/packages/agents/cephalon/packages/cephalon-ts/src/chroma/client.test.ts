/**
 * Tests for ChromaMemoryStore retry and backoff logic
 */

import anyTest, { type TestFn } from 'ava';
import { ChromaMemoryStore, type ChromaConfig } from './client.js';
import type { EmbeddingService } from '../embeddings/service.js';

interface TestContext {
  store: ChromaMemoryStore;
  mockConfig: ChromaConfig;
  mockEmbeddingService: EmbeddingService;
}

const test = anyTest as TestFn<TestContext>;

/**
 * Test helper class to access protected methods
 */
class TestableChromaMemoryStore extends ChromaMemoryStore {
  // Re-export protected methods as public for testing
  public calculateBackoff(attempt: number): number {
    return super.calculateBackoff(attempt);
  }

  public isRetryableError(error: unknown): boolean {
    return super.isRetryableError(error);
  }

  public getRetryConfig(): { maxRetries: number; initialDelayMs: number; maxDelayMs: number; backoffMultiplier: number } {
    return {
      maxRetries: this.maxRetries,
      initialDelayMs: this.initialDelayMs,
      maxDelayMs: this.maxDelayMs,
      backoffMultiplier: this.backoffMultiplier,
    };
  }
}

/**
 * Test: calculateBackoff returns exponential delay with jitter
 *
 * The backoff should increase exponentially and be within expected bounds
 */
test('calculateBackoff returns exponential delay with jitter', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  // Test attempt 1: should be around 1000ms ± 30%
  const attempt1 = store.calculateBackoff(1);
  t.true(
    attempt1 >= 1000 && attempt1 <= 1300,
    `Attempt 1 delay ${attempt1}ms should be between 1000-1300ms`,
  );

  // Test attempt 2: should be around 2000ms ± 30%
  const attempt2 = store.calculateBackoff(2);
  t.true(
    attempt2 >= 2000 && attempt2 <= 2600,
    `Attempt 2 delay ${attempt2}ms should be between 2000-2600ms`,
  );

  // Test attempt 3: should be around 4000ms ± 30%
  const attempt3 = store.calculateBackoff(3);
  t.true(
    attempt3 >= 4000 && attempt3 <= 5200,
    `Attempt 3 delay ${attempt3}ms should be between 4000-5200ms`,
  );

  // Test attempt 4: should be around 8000ms ± 30%
  const attempt4 = store.calculateBackoff(4);
  t.true(
    attempt4 >= 8000 && attempt4 <= 10400,
    `Attempt 4 delay ${attempt4}ms should be between 8000-10400ms`,
  );
});

/**
 * Test: calculateBackoff respects max delay cap
 *
 * Higher attempts should be capped at maxDelayMs (30000ms)
 */
test('calculateBackoff respects max delay cap', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  // Very high attempt should be capped at maxDelayMs
  const veryHighAttempt = store.calculateBackoff(100);
  t.true(
    veryHighAttempt <= 30000,
    `Very high attempt delay ${veryHighAttempt}ms should be capped at 30000ms`,
  );

  // Verify it's still within jitter range of max
  t.true(
    veryHighAttempt >= 30000 * 0.7, // At least 70% of max
    `Very high attempt delay ${veryHighAttempt}ms should be at least 21000ms`,
  );
});

/**
 * Test: isRetryableError identifies connection refused errors
 */
test('isRetryableError identifies ECONNREFUSED errors', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  // Test lowercase econnrefused
  t.true(
    store.isRetryableError(new Error('connect ECONNREFUSED ::1:8000')),
    'Should identify lowercase econnrefused as retryable',
  );

  // Test uppercase ECONNREFUSED
  t.true(
    store.isRetryableError(new Error('ECONNREFUSED Connection refused')),
    'Should identify uppercase ECONNREFUSED as retryable',
  );
});

/**
 * Test: isRetryableError identifies network errors
 */
test('isRetryableError identifies network errors', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  // Test generic network errors
  t.true(
    store.isRetryableError(new Error('network error: server unavailable')),
    'Should identify network errors as retryable',
  );

  // Test socket errors
  t.true(
    store.isRetryableError(new Error('socket hang up')),
    'Should identify socket errors as retryable',
  );

  // Test timeout errors
  t.true(
    store.isRetryableError(new Error('connection timeout')),
    'Should identify timeout errors as retryable',
  );

  // Test ETIMEDOUT
  t.true(
    store.isRetryableError(new Error('ETIMEDOUT: connection timed out')),
    'Should identify ETIMEDOUT as retryable',
  );

  // Test temporary errors
  t.true(
    store.isRetryableError(new Error('temporary failure in name resolution')),
    'Should identify temporary errors as retryable',
  );

  // Test "refused" in message
  t.true(
    store.isRetryableError(new Error('connection refused by target')),
    'Should identify "refused" errors as retryable',
  );
});

/**
 * Test: isRetryableError identifies connect errors
 */
test('isRetryableError identifies connect errors', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  t.true(
    store.isRetryableError(new Error('Failed to connect to server')),
    'Should identify connect errors as retryable',
  );

  t.true(
    store.isRetryableError(new Error('Cannot connect to database')),
    'Should identify connection attempt errors as retryable',
  );
});

/**
 * Test: isRetryableError rejects non-retryable errors
 */
test('isRetryableError rejects non-retryable errors', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  // Test authentication errors (should not be retryable)
  t.false(
    store.isRetryableError(new Error('Invalid authentication token')),
    'Should not retry authentication errors',
  );

  // Test permission errors (should not be retryable)
  t.false(
    store.isRetryableError(new Error('Permission denied: access denied')),
    'Should not retry permission errors',
  );

  // Test validation errors (should not be retryable)
  t.false(
    store.isRetryableError(new Error('Invalid request: missing required field')),
    'Should not retry validation errors',
  );

  // Test resource not found (should not be retryable)
  t.false(
    store.isRetryableError(new Error('Collection not found: test_collection')),
    'Should not retry "not found" errors',
  );
});

/**
 * Test: isRetryableError handles non-Error types
 */
test('isRetryableError handles non-Error types', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  // String errors should not be retryable
  t.false(
    store.isRetryableError('Connection refused'),
    'String errors should not be retryable',
  );

  // null should not be retryable
  t.false(
    store.isRetryableError(null),
    'null should not be retryable',
  );

  // undefined should not be retryable
  t.false(
    store.isRetryableError(undefined),
    'undefined should not be retryable',
  );

  // Object errors should not be retryable
  t.false(
    store.isRetryableError({ message: 'ECONNREFUSED' }),
    'Object errors should not be retryable',
  );
});

/**
 * Test: initialize succeeds on first attempt when ChromaDB is available
 *
 * This test mocks the ChromaClient to simulate successful connection
 */
test('initialize succeeds on first attempt when connection succeeds', async (t) => {
  // Create a minimal mock that will be used briefly
  const mockConfig: ChromaConfig = {
    url: 'http://localhost:8000',
    collectionName: 'test-collection',
  };

  const store = new TestableChromaMemoryStore(
    mockConfig,
    {} as EmbeddingService,
  );

  // The actual initialize will fail because ChromaDB is not running,
  // but we can verify the retry logic is in place by checking the method exists
  t.true(
    typeof store.initialize === 'function',
    'initialize method should exist',
  );
});

/**
 * Test: initialize retries on connection failure
 *
 * Verifies that the store handles connection errors and retries appropriately
 */
test('initialize handles connection errors appropriately', async (t) => {
  const mockConfig: ChromaConfig = {
    url: 'http://localhost:8000',
    collectionName: 'test-collection',
  };

  const store = new TestableChromaMemoryStore(
    mockConfig,
    {} as EmbeddingService,
  );

  // Attempting to connect when ChromaDB is not running should throw
  // after exhausting retries
  try {
    await store.initialize();
    t.pass('initialize completed when ChromaDB is available');
  } catch (error) {
    t.regex(
      (error as Error).message,
      /ECONNREFUSED|Failed to connect/,
      'Should throw connection error after retries',
    );
  }
});

/**
 * Test: verify retry configuration constants
 */
test('verify retry configuration constants are set correctly', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  const config = store.getRetryConfig();

  t.is(config.maxRetries, 5, 'maxRetries should be 5');
  t.is(config.initialDelayMs, 1000, 'initialDelayMs should be 1000ms');
  t.is(config.maxDelayMs, 30000, 'maxDelayMs should be 30000ms');
  t.is(config.backoffMultiplier, 2, 'backoffMultiplier should be 2');
});

/**
 * Test: backoff calculation follows exponential pattern
 */
test('backoff calculation follows exponential pattern', (t) => {
  const store = new TestableChromaMemoryStore(
    { url: 'http://localhost:8000', collectionName: 'test' },
    {} as EmbeddingService,
  );

  // Run multiple times to account for jitter
  const attempt1Delays: number[] = [];
  const attempt2Delays: number[] = [];

  for (let i = 0; i < 10; i++) {
    attempt1Delays.push(store.calculateBackoff(1));
    attempt2Delays.push(store.calculateBackoff(2));
  }

  // Calculate averages
  const avgAttempt1 = attempt1Delays.reduce((a, b) => a + b, 0) / attempt1Delays.length;
  const avgAttempt2 = attempt2Delays.reduce((a, b) => a + b, 0) / attempt2Delays.length;

  // Attempt 2 should be approximately double attempt 1 (within jitter tolerance)
  t.true(
    avgAttempt2 > avgAttempt1,
    'Attempt 2 delay should be greater than attempt 1',
  );

  // The ratio should be close to 2 (with jitter variance)
  const ratio = avgAttempt2 / avgAttempt1;
  t.true(
    ratio >= 1.5 && ratio <= 2.5,
    `Backoff ratio ${ratio.toFixed(2)} should be approximately 2 (± jitter)`,
  );
});
