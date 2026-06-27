/**
 * Test setup for vitest
 * Minimal setup for integration tests
 */

import { beforeAll, afterAll } from "vitest";

// Global test timeout
beforeAll(() => {
  // Set test timeout
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  // Cleanup
});
