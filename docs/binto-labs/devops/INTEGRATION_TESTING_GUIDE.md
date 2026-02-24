# Integration Testing Guide

## Overview

Comprehensive integration testing framework for Claude Flow with 20+ test suites covering all system components.

## Test Structure

```
tests/integration/
├── Core System
│   ├── cli-simple.test.js          # Basic CLI functionality
│   ├── cli-integration.test.js     # Advanced CLI workflows
│   └── system-integration.test.ts  # Full system integration
│
├── Lifecycle & Hooks
│   ├── hook-basic.test.js          # Hook functionality
│   └── init-workflow.test.js       # Initialization workflows
│
├── Performance
│   ├── batch-task-test.ts          # Batch operations
│   ├── batch-task-mock-test.ts     # Mock performance tests
│   └── real-metrics.test.js        # Real-time metrics
│
├── Compatibility
│   ├── cross-platform-portability.test.js
│   ├── functional-portability.test.js
│   └── start-compatibility.test.ts
│
├── Advanced Features
│   ├── hive-mind-schema.test.js
│   ├── reasoningbank-integration.test.js
│   ├── agent-booster.test.js
│   ├── mcp.test.ts
│   └── sdk-integration.test.ts
│
└── Error Handling
    └── error-handling-patterns.test.js
```

## Quick Start

### Run All Tests

```bash
npm run test:integration
```

### Run Specific Test Suite

```bash
# ReasoningBank tests
npx jest tests/integration/reasoningbank-integration.test.js

# Agent Booster tests
npx jest tests/integration/agent-booster.test.js

# Hive Mind tests
npx jest tests/integration/hive-mind-schema.test.js
```

### Run with Coverage

```bash
npm run test:coverage
```

## Key Test Suites

### 1. ReasoningBank Integration Tests

**File:** `reasoningbank-integration.test.js`

Tests the complete ReasoningBank semantic memory system:

```javascript
Test Suites:
1. CLI Memory Commands
   ✅ memory init - Database initialization
   ✅ memory status - Statistics display
   ✅ memory list - Memory retrieval
   ✅ Help system

2. Agent Execution with Memory
   ✅ --enable-memory flag
   ✅ --memory-k flag (retrieval count)
   ✅ --memory-domain flag

3. SDK Integration
   ✅ AgentExecutor memory methods
   ✅ AgentExecutionOptions typing
   ✅ Type safety validation

4. Dependency Validation
   ✅ agentic-flow@1.4.11 installation
   ✅ ReasoningBank CLI availability

5. End-to-End Workflows
   ✅ Complete memory lifecycle
   ✅ Multi-step operations
   ✅ Data persistence

6. Performance Requirements
   ✅ Init: < 30 seconds
   ✅ Status: < 5 seconds
```

**Run:**
```bash
npx jest tests/integration/reasoningbank-integration.test.js --verbose
```

### 2. Batch Task Performance Tests

**File:** `batch-task-mock-test.ts`

Mock-based performance testing:

```javascript
Test Results:
⏱️  Total execution time: 2.74s
📋 Tasks created: 7
✅ Tasks completed: 7
❌ Tasks failed: 0
⚡ Average task time: 1927ms
🚀 Throughput: 2.55 tasks/second
```

**Features Tested:**
- Parallel agent creation
- Task batching and assignment
- Load balancing across agents
- Performance metrics tracking
- Throughput measurement

**Run:**
```bash
npm run test:batch
```

### 3. Hook Functionality Tests

**File:** `hook-basic.test.js`

Tests lifecycle hooks and automation:

```javascript
Tests:
✅ Hook parameter handling
✅ File extension to agent mapping
✅ Dangerous command detection
✅ Safety validation
✅ Resource preparation
```

**Agent Mapping:**
```javascript
.js  → javascript-developer
.ts  → typescript-developer
.py  → python-developer
.go  → golang-developer
.md  → technical-writer
.yml → devops-engineer
```

### 4. System Integration Tests

**File:** `system-integration.test.ts`

Full system integration validation:

```javascript
Tests:
✅ Orchestrator initialization
✅ Agent spawning and coordination
✅ Task execution pipelines
✅ Memory persistence
✅ MCP integration
✅ Event bus communication
```

## Test Results Summary

From `TEST_RESULTS.md`:

### Performance Characteristics

1. **Throughput:** 2-3 tasks per second
2. **Scalability:** 4 agents, 20+ tasks tested
3. **Latency:** Near-instantaneous task assignment
4. **Resource Usage:** Efficient memory and CPU

### Architecture Validation

Validated Components:
1. ✅ Orchestrator - Central coordination
2. ✅ Coordination Manager - Task scheduling
3. ✅ Event Bus - Async communication
4. ✅ Task Scheduler - Dependency resolution
5. ✅ Resource Manager - Deadlock prevention

### Success Metrics

```
Total Test Suites: 20+
Total Tests: 150+
Execution Time: ~5-10 minutes
Coverage: 85%+
Success Rate: 100%
```

## Running Tests

### Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build project
npm run build

# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

### CI/CD Pipeline

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build
        run: npm run build

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Writing New Tests

### Test Template

```javascript
/**
 * Feature Integration Tests
 */

import { describe, it, expect } from '@jest/globals';

describe('Feature Tests', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should test feature functionality', async () => {
    // Arrange
    const input = 'test input';

    // Act
    const result = await featureFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Best Practices

1. **Isolation** - Each test should be independent
2. **Cleanup** - Always clean up resources
3. **Timeouts** - Set appropriate timeouts for async operations
4. **Mocking** - Use mocks for external dependencies
5. **Coverage** - Aim for 80%+ code coverage

## Performance Requirements

### ReasoningBank Tests

```javascript
✅ Memory init: < 30 seconds
✅ Memory status: < 5 seconds
✅ Memory query: < 10 seconds
✅ Agent execution: < 60 seconds
```

### Batch Processing Tests

```javascript
✅ Task creation: < 100ms
✅ Agent spawning: < 500ms
✅ Task completion: < 3 seconds
✅ Throughput: > 2 tasks/second
```

## Troubleshooting

### Tests Failing

1. **Clean build:**
   ```bash
   npm run clean
   npm run build
   npm test
   ```

2. **Clear cache:**
   ```bash
   npx jest --clearCache
   ```

3. **Check dependencies:**
   ```bash
   npm list agentic-flow
   npm list @anthropic-ai/sdk
   ```

### Timeout Errors

```javascript
// Increase timeout for slow operations
test('slow operation', async () => {
  // Test code
}, 120000); // 2 minutes
```

### Database Locks

```bash
# Clean up test databases
rm -rf .swarm/test-*.db*
```

## Code Coverage

### View Coverage Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Goals

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

## Test Fixtures

### Sample Data

```javascript
const testMemories = [
  { key: 'auth', value: 'JWT authentication', namespace: 'security' },
  { key: 'api', value: 'REST API endpoints', namespace: 'backend' },
  { key: 'db', value: 'PostgreSQL database', namespace: 'backend' }
];
```

### Mock Functions

```javascript
const mockAgentExecutor = {
  execute: jest.fn().mockResolvedValue({ success: true }),
  initializeMemory: jest.fn().mockResolvedValue(true),
  getMemoryStats: jest.fn().mockResolvedValue({ count: 0 })
};
```

## Related Documentation

- [DEVOPS_TOOLING_ANALYSIS.md](./DEVOPS_TOOLING_ANALYSIS.md) - Full analysis
- [DOCKER_VALIDATION_GUIDE.md](./DOCKER_VALIDATION_GUIDE.md) - Docker testing
- [BENCHMARK_REFERENCE.md](./BENCHMARK_REFERENCE.md) - Performance benchmarks

## Support

For test issues:
1. Check test output for specific failures
2. Review stack traces
3. Verify dependencies are installed
4. Open issue with test results

---

**Last Updated:** 2025-10-16
**Version:** 2.0.0-alpha.130
