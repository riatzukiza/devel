---
title: WebSocket E2E Test Suite Specification
type: spec
component: testing
priority: critical
status: implemented
workflow-state: done
related-issues: []
estimated-effort: 8 hours
implementation-date: 2026-01-25
updated_at: 2026-02-10
---

# WebSocket E2E Test Suite Specification

## Overview

This specification outlines a comprehensive WebSocket end-to-end test suite that runs against a real backend instance to validate game fundamentals and snapshot state validity.

## Test Architecture

### Test Environment
- **Target**: Live backend server on `http://localhost:3000`
- **WebSocket Endpoint**: `ws://localhost:3000/ws`
- **Test Framework**: Vitest (frontend testing setup)
- **Test Type**: Integration/E2E tests with real WebSocket connections

### Test Categories

#### 1. Connection and Protocol Tests
- Valid WebSocket connection establishment
- Hello message structure and completeness
- Connection lifecycle (open/close/error handling)
- Message parsing and validation

#### 2. Snapshot Validation Tests
- Initial state completeness after connection
- Tick advancement state consistency
- Agent state integrity (positions, needs, inventory)
- Tile state consistency (terrain, resources, structures)
- Stockpile and resource tracking accuracy

#### 3. Game Mechanics Tests
- Tick progression and time advancement
- Agent movement and pathing validation
- Resource gathering and stockpile operations
- Job assignment and execution
- Building placement and management
- Day/night cycle and environmental effects

#### 4. Operations Tests
- World reset with different seeds
- Lever adjustments and their effects
- Structure placement (walls, stockpiles, buildings)
- Agent interactions and job assignment

## Test Structure

### File Organization
```
web/src/__tests__/e2e/
├── websocket-e2e.test.ts          # Main test suite
├── helpers/
│   ├── backend-client.ts           # WebSocket test client
│   ├── state-validators.ts         # Snapshot validation utilities
│   └── test-setup.ts              # Test environment setup
├── fixtures/
│   ├── sample-snapshots.ts         # Expected state examples
│   └── test-configs.ts            # Test configuration data
```

### Test Dependencies
- Existing `WSClient` class from `../ws`
- Type definitions from `../types`
- Backend health check via `/healthz` endpoint

## Validation Criteria

### Snapshot Schema Validation
- Required fields present and correctly typed
- Agent IDs consistent across state updates
- Position coordinates within valid bounds
- Resource quantities non-negative
- Tile keys properly formatted ("q,r" strings)

### Game Logic Validation
- Tick numbers monotonically increasing
- Agent positions change realistically (no teleporting)
- Resource conservation in transfers
- Job state transitions follow valid sequences
- Time-based systems (day/night, temperature) advance correctly

### Performance Validation
- Message response times within acceptable thresholds
- Memory usage patterns stable during extended runs
- No memory leaks in connection management

## Test Data and Fixtures

### Known Good States
- Initial world state for different seed values
- Expected agent counts and starting positions
- Valid resource distributions
- Proper shrine and structure placements

### Edge Cases
- Empty agent scenarios
- Maximum agent counts
- Boundary condition testing
- Invalid operation handling

## Implementation Requirements

### Backend Dependencies
- Backend must be running and accessible
- Health check endpoint available
- WebSocket server accepting connections
- Test isolation (state reset between tests)

### Test Configuration
- Configurable backend URL via environment variable

## Closure Notes (2026-02-10)

- Closed as `done` with `status: implemented`.
- This specification remains the completed baseline for WebSocket E2E coverage and validation criteria.
- Timeout settings for async operations
- Retry logic for flaky network conditions
- Clean shutdown procedures

### Error Handling
- Connection failure recovery
- Malformed message handling
- Backend unavailability detection
- Test isolation failure recovery

## Success Metrics

- All tests pass with consistent results
- No false positives/negatives in state validation
- Tests complete within reasonable time limits
- Reliable execution in CI/CD environments

## Integration Points

### Existing Infrastructure
- Reuse frontend test framework setup
- Leverage existing type definitions
- Complement current unit test coverage
- Work with existing build/test scripts

### Future Extensions
- Support for multiple backend instances
- Load testing scenarios
- Performance benchmarking
- Automated regression testing
