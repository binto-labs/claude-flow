# Docker Validation Suite

**Version:** Added in v2.5.0, enhanced in v2.7.0-alpha
**Status:** Production-ready

## Overview

The Docker Validation Suite is a comprehensive testing framework that validates claude-flow's functionality within Docker containers. It ensures consistent behavior across different environments, verifies all features work in containerized deployments, and provides automated testing for CI/CD pipelines.

The suite includes tests for core functionality, swarm coordination, neural models, memory systems, hooks integration, and multi-container orchestration scenarios.

## Architecture

### Validation System Design

```
┌─────────────────────────────────────────────────────────────┐
│            Docker Validation Suite                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Validation Orchestrator                     │  │
│  │  - Test discovery and execution                      │  │
│  │  - Container lifecycle management                    │  │
│  │  - Result aggregation and reporting                  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│      ┌────────────────┴────────────────┐                   │
│      │                                 │                    │
│  ┌───▼──────────┐              ┌──────▼────────┐          │
│  │ Test Runner  │              │ Container Mgr │          │
│  │ - Unit tests │              │ - Build images│          │
│  │ - Integration│              │ - Start/stop  │          │
│  │ - E2E tests  │              │ - Cleanup     │          │
│  └──────────────┘              └───────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         │                                    │
    ┌────▼────────────────────────────────────▼─────┐
    │         Docker Environment                      │
    ├─────────────────────────────────────────────────┤
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
    │  │  Test    │  │  Node    │  │ Multi-   │    │
    │  │Container │  │Container │  │Container │    │
    │  └──────────┘  └──────────┘  └──────────┘    │
    └─────────────────────────────────────────────────┘
```

### Test Categories

1. **Core Functionality** - Basic operations and CLI commands
2. **Swarm Coordination** - Multi-agent orchestration
3. **Neural Models** - ReasoningBank and ML features
4. **Memory System** - Persistence and caching
5. **Hooks Integration** - Lifecycle hooks and automation
6. **Multi-Container** - Distributed coordination
7. **Performance** - Benchmarks and stress tests
8. **Security** - Permission and isolation tests

## Running Validation Tests

### Quick Start

```bash
# Run all validation tests
npm run docker:validate

# Run specific test category
npm run docker:validate -- --category core

# Run with verbose output
npm run docker:validate -- --verbose

# Run in CI mode (fail fast)
npm run docker:validate -- --ci
```

### Docker Compose Setup

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    volumes:
      - ./tests:/app/tests
      - ./src:/app/src
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=test
      - CLAUDE_FLOW_TEST_MODE=true
    command: npm run test:docker

  node-1:
    build: .
    environment:
      - CLAUDE_FLOW_NODE_ID=node-1
      - CLAUDE_FLOW_CLUSTER_MODE=true
    ports:
      - "3001:3000"

  node-2:
    build: .
    environment:
      - CLAUDE_FLOW_NODE_ID=node-2
      - CLAUDE_FLOW_CLUSTER_MODE=true
    ports:
      - "3002:3000"
```

### Running Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run full test suite
docker-compose -f docker-compose.test.yml run test-runner npm test

# Run specific test file
docker-compose -f docker-compose.test.yml run test-runner \
  npm test -- tests/docker/swarm.test.ts

# Cleanup
docker-compose -f docker-compose.test.yml down -v
```

## Test Coverage and Scenarios

### 1. Core Functionality Tests

```typescript
// tests/docker/core.test.ts
describe('Docker Core Functionality', () => {
  test('CLI commands work in container', async () => {
    const result = await exec('npx claude-flow@alpha --version')
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/)
  })

  test('Memory initialization', async () => {
    const result = await exec(
      'npx claude-flow@alpha memory store "test" "value"'
    )
    expect(result.exitCode).toBe(0)

    const retrieve = await exec(
      'npx claude-flow@alpha memory retrieve "test"'
    )
    expect(retrieve.stdout).toContain('value')
  })

  test('File system operations', async () => {
    await exec('mkdir -p /app/test-data')
    await exec('echo "test" > /app/test-data/file.txt')

    const result = await exec('cat /app/test-data/file.txt')
    expect(result.stdout.trim()).toBe('test')
  })

  test('Environment variables', async () => {
    const result = await exec(
      'npx claude-flow@alpha config show',
      { env: { CLAUDE_FLOW_DEBUG: 'true' } }
    )
    expect(result.stdout).toContain('debug: true')
  })
})
```

### 2. Swarm Coordination Tests

```typescript
// tests/docker/swarm.test.ts
describe('Docker Swarm Coordination', () => {
  test('Initialize swarm in container', async () => {
    const result = await exec(`
      npx claude-flow@alpha swarm init \
        --topology mesh \
        --max-agents 5
    `)
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Swarm initialized')
  })

  test('Spawn multiple agents', async () => {
    await exec('npx claude-flow@alpha swarm init --topology mesh')

    const result = await exec(`
      npx claude-flow@alpha agent spawn --type coder &
      npx claude-flow@alpha agent spawn --type reviewer &
      npx claude-flow@alpha agent spawn --type tester &
      wait
    `)

    const status = await exec('npx claude-flow@alpha swarm status')
    expect(status.stdout).toContain('3 agents active')
  })

  test('Multi-container coordination', async () => {
    // Start coordination on node-1
    await execOnContainer('node-1', `
      npx claude-flow@alpha swarm init \
        --topology mesh \
        --distributed
    `)

    // Join from node-2
    await execOnContainer('node-2', `
      npx claude-flow@alpha swarm join \
        --coordinator node-1:3000
    `)

    // Verify cluster
    const status = await execOnContainer('node-1',
      'npx claude-flow@alpha swarm status --verbose'
    )
    expect(status.stdout).toContain('2 nodes')
  })
})
```

### 3. Neural Model Tests

```typescript
// tests/docker/neural.test.ts
describe('Docker Neural Models', () => {
  test('WASM runtime available', async () => {
    const result = await exec(
      'npx claude-flow@alpha features detect --category wasm'
    )
    expect(result.stdout).toContain('WASM: enabled')
    expect(result.stdout).toContain('SIMD: enabled')
  })

  test('Load and run neural model', async () => {
    const result = await exec(`
      npx claude-flow@alpha neural predict \
        --model convergent-v1 \
        --input '{"problem": "test"}' \
        --format json
    `)
    expect(result.exitCode).toBe(0)

    const output = JSON.parse(result.stdout)
    expect(output).toHaveProperty('prediction')
    expect(output).toHaveProperty('confidence')
  })

  test('Training in container', async () => {
    // Create training data
    await exec(`
      echo '[{"input": "test", "output": "result"}]' \
        > /tmp/training-data.jsonl
    `)

    const result = await exec(`
      npx claude-flow@alpha neural train \
        --model convergent-v1 \
        --data /tmp/training-data.jsonl \
        --epochs 5 \
        --batch-size 1
    `)
    expect(result.exitCode).toBe(0)
  })

  test('Model persistence across restarts', async () => {
    // Train and save model
    await exec('npx claude-flow@alpha neural train ...')
    const saveResult = await exec(
      'npx claude-flow@alpha neural save --model convergent-v1'
    )

    // Restart container
    await restartContainer()

    // Load saved model
    const loadResult = await exec(
      'npx claude-flow@alpha neural load --model convergent-v1'
    )
    expect(loadResult.exitCode).toBe(0)
  })
})
```

### 4. Memory System Tests

```typescript
// tests/docker/memory.test.ts
describe('Docker Memory System', () => {
  test('SQLite database creation', async () => {
    await exec('npx claude-flow@alpha memory store "key1" "value1"')

    const dbExists = await exec('test -f .swarm/memory.db && echo "exists"')
    expect(dbExists.stdout.trim()).toBe('exists')
  })

  test('Memory persistence with volumes', async () => {
    // Store data
    await exec('npx claude-flow@alpha memory store "persistent" "data"')

    // Restart container (volume persists)
    await restartContainer()

    // Retrieve data
    const result = await exec(
      'npx claude-flow@alpha memory retrieve "persistent"'
    )
    expect(result.stdout).toContain('data')
  })

  test('Memory search functionality', async () => {
    await exec('npx claude-flow@alpha memory store "search/item1" "value1"')
    await exec('npx claude-flow@alpha memory store "search/item2" "value2"')
    await exec('npx claude-flow@alpha memory store "other/item" "value3"')

    const result = await exec(
      'npx claude-flow@alpha memory search --pattern "search/*"'
    )
    expect(result.stdout).toContain('item1')
    expect(result.stdout).toContain('item2')
    expect(result.stdout).not.toContain('other')
  })

  test('Memory TTL expiration', async () => {
    await exec(`
      npx claude-flow@alpha memory store "ttl-test" "value" \
        --ttl 2
    `)

    // Immediate retrieval should work
    const immediate = await exec(
      'npx claude-flow@alpha memory retrieve "ttl-test"'
    )
    expect(immediate.stdout).toContain('value')

    // Wait for expiration
    await sleep(3000)

    // Should be expired
    const expired = await exec(
      'npx claude-flow@alpha memory retrieve "ttl-test"'
    )
    expect(expired.exitCode).not.toBe(0)
  })
})
```

### 5. Hooks Integration Tests

```typescript
// tests/docker/hooks.test.ts
describe('Docker Hooks Integration', () => {
  test('Pre-task hook execution', async () => {
    const result = await exec(`
      npx claude-flow@alpha hooks pre-task \
        --description "test task"
    `)
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Task ID:')
  })

  test('Post-edit hook with memory', async () => {
    // Create test file
    await exec('echo "console.log(\"test\")" > /tmp/test.js')

    const result = await exec(`
      npx claude-flow@alpha hooks post-edit \
        --file "/tmp/test.js" \
        --memory-key "test/edit"
    `)
    expect(result.exitCode).toBe(0)

    // Verify memory stored
    const memory = await exec(
      'npx claude-flow@alpha memory retrieve "test/edit"'
    )
    expect(memory.stdout).toContain('test.js')
  })

  test('Session hooks workflow', async () => {
    // Start session
    const start = await exec(`
      npx claude-flow@alpha hooks session-start \
        --session-id "test-session"
    `)
    expect(start.exitCode).toBe(0)

    // Perform operations
    await exec('npx claude-flow@alpha hooks pre-task --description "task1"')
    await exec('npx claude-flow@alpha hooks post-task --task-id "task1"')

    // End session
    const end = await exec(`
      npx claude-flow@alpha hooks session-end \
        --session-id "test-session" \
        --export-metrics true
    `)
    expect(end.exitCode).toBe(0)
    expect(end.stdout).toContain('metrics')
  })
})
```

### 6. Multi-Container Tests

```typescript
// tests/docker/multi-container.test.ts
describe('Multi-Container Orchestration', () => {
  test('Distributed swarm across containers', async () => {
    // Initialize on node-1
    await execOnContainer('node-1', `
      npx claude-flow@alpha swarm init \
        --topology mesh \
        --distributed \
        --port 3000
    `)

    // Join from node-2
    await execOnContainer('node-2', `
      npx claude-flow@alpha swarm join \
        --coordinator node-1:3000 \
        --node-id node-2
    `)

    // Spawn agents on both nodes
    await Promise.all([
      execOnContainer('node-1',
        'npx claude-flow@alpha agent spawn --type coder'),
      execOnContainer('node-2',
        'npx claude-flow@alpha agent spawn --type reviewer')
    ])

    // Verify distributed state
    const status1 = await execOnContainer('node-1',
      'npx claude-flow@alpha swarm status')
    const status2 = await execOnContainer('node-2',
      'npx claude-flow@alpha swarm status')

    expect(status1.stdout).toContain('2 nodes')
    expect(status2.stdout).toContain('2 nodes')
  })

  test('Cross-container memory sync', async () => {
    // Store on node-1
    await execOnContainer('node-1', `
      npx claude-flow@alpha memory store "shared/key" "value" \
        --sync-cluster
    `)

    // Retrieve from node-2
    const result = await execOnContainer('node-2', `
      npx claude-flow@alpha memory retrieve "shared/key"
    `)
    expect(result.stdout).toContain('value')
  })

  test('Distributed task execution', async () => {
    // Initialize distributed swarm
    await setupDistributedSwarm()

    // Orchestrate task across nodes
    const result = await execOnContainer('node-1', `
      npx claude-flow@alpha task orchestrate \
        --task "implement feature" \
        --strategy distributed \
        --max-agents 4
    `)

    expect(result.exitCode).toBe(0)

    // Verify agents on both nodes
    const agents1 = await execOnContainer('node-1',
      'npx claude-flow@alpha agent list')
    const agents2 = await execOnContainer('node-2',
      'npx claude-flow@alpha agent list')

    const totalAgents =
      countAgents(agents1.stdout) +
      countAgents(agents2.stdout)
    expect(totalAgents).toBeGreaterThanOrEqual(2)
  })
})
```

### 7. Performance Tests

```typescript
// tests/docker/performance.test.ts
describe('Docker Performance', () => {
  test('Benchmark execution in container', async () => {
    const result = await exec(`
      npx claude-flow@alpha benchmark run \
        --type all \
        --iterations 10
    `)
    expect(result.exitCode).toBe(0)

    const benchmarks = JSON.parse(result.stdout)
    expect(benchmarks.wasm.throughput).toBeGreaterThan(100)
  })

  test('Memory usage under load', async () => {
    // Start memory monitoring
    const monitor = execBackground(
      'npx claude-flow@alpha memory usage --monitor --interval 1'
    )

    // Generate load
    for (let i = 0; i < 100; i++) {
      await exec(`npx claude-flow@alpha memory store "load-${i}" "value"`)
    }

    // Check memory didn't exceed limits
    const stats = await getContainerStats()
    expect(stats.memory_usage).toBeLessThan(512 * 1024 * 1024) // 512MB
  })

  test('Concurrent agent spawning performance', async () => {
    const start = Date.now()

    await exec(`
      npx claude-flow@alpha swarm init --topology mesh &&
      for i in {1..10}; do
        npx claude-flow@alpha agent spawn --type coder &
      done &&
      wait
    `)

    const duration = Date.now() - start
    expect(duration).toBeLessThan(10000) // < 10 seconds
  })
})
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/docker-validation.yml
name: Docker Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  docker-validation:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build test image
        run: |
          docker build -t claude-flow:test .
          docker build -t claude-flow:test-runner -f Dockerfile.test .

      - name: Run core tests
        run: |
          docker-compose -f docker-compose.test.yml run test-runner \
            npm test -- --category core

      - name: Run swarm tests
        run: |
          docker-compose -f docker-compose.test.yml run test-runner \
            npm test -- --category swarm

      - name: Run neural tests
        run: |
          docker-compose -f docker-compose.test.yml run test-runner \
            npm test -- --category neural

      - name: Run multi-container tests
        run: |
          docker-compose -f docker-compose.test.yml up -d
          docker-compose -f docker-compose.test.yml run test-runner \
            npm test -- --category multi-container

      - name: Collect test results
        if: always()
        run: |
          docker-compose -f docker-compose.test.yml run test-runner \
            cat /app/test-results.json > test-results.json

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results.json

      - name: Cleanup
        if: always()
        run: docker-compose -f docker-compose.test.yml down -v
```

## Troubleshooting Validation Failures

### Issue: Tests Fail in Container but Work Locally

**Symptoms:**
- Tests pass on local machine
- Fail in Docker container
- Environment differences

**Solutions:**
```bash
# 1. Check environment variables
docker-compose -f docker-compose.test.yml run test-runner env

# 2. Verify file permissions
docker-compose -f docker-compose.test.yml run test-runner \
  ls -la /app

# 3. Check volume mounts
docker-compose -f docker-compose.test.yml config

# 4. Run with same environment
docker-compose -f docker-compose.test.yml run \
  -e NODE_ENV=test \
  -e CLAUDE_FLOW_DEBUG=true \
  test-runner npm test
```

### Issue: Multi-Container Tests Fail

**Symptoms:**
- Single container tests pass
- Multi-container coordination fails
- Network connectivity issues

**Solutions:**
```bash
# 1. Verify network configuration
docker network ls
docker network inspect claude-flow_default

# 2. Check container connectivity
docker-compose -f docker-compose.test.yml exec node-1 \
  ping -c 3 node-2

# 3. Verify port mapping
docker-compose -f docker-compose.test.yml ps

# 4. Check logs
docker-compose -f docker-compose.test.yml logs node-1
docker-compose -f docker-compose.test.yml logs node-2
```

### Issue: Performance Tests Timeout

**Symptoms:**
- Performance tests exceed time limits
- Resource constraints
- Slow execution

**Solutions:**
```bash
# 1. Increase resource limits
docker-compose -f docker-compose.test.yml run \
  --memory 4g \
  --cpus 2 \
  test-runner npm test

# 2. Reduce test iterations
docker-compose -f docker-compose.test.yml run test-runner \
  npm test -- --iterations 5

# 3. Run tests sequentially
docker-compose -f docker-compose.test.yml run test-runner \
  npm test -- --serial

# 4. Increase timeouts
export JEST_TIMEOUT=60000  # 60 seconds
```

## Best Practices

1. **Isolation**: Each test should be independent and clean up after itself
2. **Reproducibility**: Tests should produce consistent results across runs
3. **Coverage**: Test all features, edge cases, and error conditions
4. **Performance**: Keep test execution time reasonable
5. **Cleanup**: Always cleanup containers and volumes after tests
6. **Logging**: Capture detailed logs for debugging failures
7. **CI Integration**: Automate testing in CI/CD pipelines

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Jest Testing Framework](https://jestjs.io/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Swarm Coordination](./SWARM-COORDINATION.md)
- [Neural Models](./REASONINGBANK-INTEGRATION.md)

---

**Last Updated:** 2025-10-16
**Version:** 2.7.0-alpha
**Maintainer:** claude-flow team
