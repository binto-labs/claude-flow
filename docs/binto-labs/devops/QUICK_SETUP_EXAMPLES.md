# DevOps Quick Setup Examples

## Overview

Quick-start examples for setting up and using the new DevOps tooling in Claude Flow v2.0.0.

---

## 1. Docker Validation Setup

### One-Command Validation

```bash
# Navigate to tests directory and run full validation
cd tests/docker && \
docker build -f Dockerfile.test -t claude-flow-test ../.. && \
docker run --rm claude-flow-test sh -c "cd /home/testuser && tests/docker/run-validation.sh"
```

### Interactive Development

```bash
# Start container for development
docker-compose -f tests/docker/docker-compose.test.yml up -d

# Enter container
docker exec -it claude-flow-test sh

# Inside container - run commands
./bin/claude-flow --help
./bin/claude-flow memory store test "Hello from Docker"
./bin/claude-flow agent agents
./bin/claude-flow agent memory status

# Run full validation
./tests/docker/run-validation.sh

# Exit container
exit

# Stop container
docker-compose -f tests/docker/docker-compose.test.yml down
```

### Quick Validation Script

```bash
# Fast validation without full Docker build
./tests/docker/quick-validation.sh
```

---

## 2. Integration Testing Setup

### Run All Integration Tests

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build project
npm run build

# Run all integration tests
npm run test:integration
```

### Run Specific Test Suites

```bash
# ReasoningBank integration
npx jest tests/integration/reasoningbank-integration.test.js

# Agent Booster tests
npx jest tests/integration/agent-booster.test.js

# Hive Mind schema
npx jest tests/integration/hive-mind-schema.test.js

# Batch task performance
npx jest tests/integration/batch-task-mock-test.ts

# Hook functionality
npx jest tests/integration/hook-basic.test.js
```

### Run with Coverage

```bash
# Generate coverage report
npm run test:coverage

# View in browser (macOS)
open coverage/lcov-report/index.html

# View in browser (Linux)
xdg-open coverage/lcov-report/index.html
```

### Watch Mode (Development)

```bash
# Run tests in watch mode
npm run test:watch

# Run specific test in watch mode
npx jest tests/integration/reasoningbank-integration.test.js --watch
```

---

## 3. Benchmark Execution

### Run Agent Booster Benchmarks

```bash
# Navigate to project root
cd /workspaces/claude-flow

# Run comprehensive benchmark suite
node tests/benchmark/agent-booster-benchmark.js
```

### Expected Output

```
🏁 Agent Booster Comprehensive Benchmark Suite

Testing ultra-fast code editing performance

────────────────────────────────────────────────────────────────────────────────

📊 Benchmark 1: Single File Edit Speed
Testing individual edit performance

  Progress: 100/100

  Results (100 iterations):
  Average: 8.45ms
  Min: 5ms
  Max: 15ms
  LLM Baseline: 352ms
  Speedup: 41.7x
  Time Saved: 34.36s

📊 Benchmark 2: Batch Processing Speed
Testing multi-file editing performance

  10 files:
    Agent Booster: 95ms (9.5ms per file)
    LLM Baseline: 3520ms (352ms per file)
    Speedup: 37.1x
    Time Saved: 3.43s
    Cost Saved: $0.10

  50 files:
    Agent Booster: 475ms (9.5ms per file)
    LLM Baseline: 17600ms (352ms per file)
    Speedup: 37.1x
    Time Saved: 17.13s
    Cost Saved: $0.50

  100 files:
    Agent Booster: 950ms (9.5ms per file)
    LLM Baseline: 35200ms (352ms per file)
    Speedup: 37.1x
    Time Saved: 34.25s
    Cost Saved: $1.00

📊 Benchmark 3: Large File Handling
Testing performance with different file sizes

  Small file (50 lines):
    Processing time: 18ms
    Lines per second: 2778

  Medium file (500 lines):
    Processing time: 45ms
    Lines per second: 11111

  Large file (2000 lines):
    Processing time: 180ms
    Lines per second: 11111

📊 Benchmark 4: Concurrent Operations
Testing parallel execution performance

  5 concurrent batches (10 files each):
    Total files: 50
    Agent Booster: 1523ms
    LLM Baseline: 17600ms
    Speedup: 11.6x
    Throughput: 32.8 files/sec

📊 Benchmark 5: Cost Analysis
Analyzing cost savings vs LLM APIs

  Daily refactoring (100 edits):
    LLM API cost: $1.00
    Agent Booster cost: $0.00
    Savings: $1.00

  Weekly migration (1000 edits):
    LLM API cost: $10.00
    Agent Booster cost: $0.00
    Savings: $10.00

  Monthly maintenance (3000 edits):
    LLM API cost: $30.00
    Agent Booster cost: $0.00
    Savings: $30.00

  Annual savings (100 edits/day): $365

📊 Benchmark 6: Accuracy Test
Verifying edit quality

  Add logging: ✅ PASS
  Add error handling: ✅ PASS
  Add JSDoc: ✅ PASS

  Accuracy: 100.0% (3/3)

────────────────────────────────────────────────────────────────────────────────

✅ All benchmarks completed successfully!
```

---

## 4. CI/CD Setup

### Enable Pre-commit Hooks

```bash
# Copy pre-commit hook to git hooks directory
cp .githooks/pre-commit .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit

# Build redaction hook
npm run build

# Test hook
git add .
git commit -m "Test commit"
# Should run: 🔒 Running API key redaction check...
# Should pass: ✅ Redaction check passed - safe to commit
```

### GitHub Actions Integration

Create `.github/workflows/docker-validation.yml`:

```yaml
name: Docker Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  docker-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build test container
        run: |
          cd tests/docker
          docker build -f Dockerfile.test -t claude-flow-test ../..

      - name: Run validation suite
        run: |
          docker run --rm claude-flow-test \
            sh -c "cd /home/testuser && tests/docker/run-validation.sh"

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: docker-test-results
          path: test-results/
```

Create `.github/workflows/benchmarks.yml`:

```yaml
name: Performance Benchmarks

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  benchmark:
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

      - name: Run benchmarks
        run: node tests/benchmark/agent-booster-benchmark.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmark-results.json
```

---

## 5. CLI Help System Usage

### Main Help

```bash
npx claude-flow --help
```

### Command-Specific Help

```bash
# Agent command help
npx claude-flow agent --help

# Swarm command help
npx claude-flow swarm --help

# Memory command help
npx claude-flow memory --help

# Verification system help
npx claude-flow verify --help

# Truth scoring help
npx claude-flow truth --help

# Pair programming help
npx claude-flow pair --help
```

### Feature Discovery

```bash
# List all SPARC modes
npx claude-flow sparc modes

# Show agent types
npx claude-flow agent agents

# Check system status
npx claude-flow status --verbose
```

---

## 6. Common Workflows

### Full Development Setup

```bash
# Clone and setup
git clone https://github.com/ruvnet/claude-flow.git
cd claude-flow

# Install dependencies
npm install --legacy-peer-deps

# Build project
npm run build

# Enable pre-commit hooks
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Run tests
npm test

# Run integration tests
npm run test:integration

# Run Docker validation
cd tests/docker
docker build -f Dockerfile.test -t claude-flow-test ../..
docker run --rm claude-flow-test sh -c "cd /home/testuser && tests/docker/run-validation.sh"

# Back to root
cd ../..

# Run benchmarks
node tests/benchmark/agent-booster-benchmark.js
```

### Quick Validation Workflow

```bash
# Quick local validation
npm run build
./tests/docker/quick-validation.sh

# Or use Docker
docker run --rm -v $(pwd):/app -w /app node:18-alpine sh -c "
  npm install --legacy-peer-deps &&
  npm run build &&
  ./bin/claude-flow --help
"
```

### Testing New Features

```bash
# 1. Write tests first (TDD)
# Create tests/integration/my-feature.test.js

# 2. Run tests (should fail)
npx jest tests/integration/my-feature.test.js

# 3. Implement feature
# Edit src/...

# 4. Build
npm run build

# 5. Run tests again (should pass)
npx jest tests/integration/my-feature.test.js

# 6. Add to Docker validation
# Edit tests/docker/run-validation.sh

# 7. Run full validation
cd tests/docker
docker build -f Dockerfile.test -t claude-flow-test ../..
docker run --rm claude-flow-test sh -c "cd /home/testuser && tests/docker/run-validation.sh"
```

---

## 7. Troubleshooting Common Issues

### Docker Build Fails

```bash
# Clean build
docker build --no-cache -f Dockerfile.test -t claude-flow-test ../..

# Check Docker version
docker --version  # Should be 20.10+

# Check available space
df -h
```

### Tests Timeout

```bash
# Increase Jest timeout
npx jest --testTimeout=120000

# Or edit jest.config.js
{
  "testTimeout": 120000
}
```

### Permission Errors

```bash
# Make scripts executable
chmod +x tests/docker/*.sh
chmod +x bin/claude-flow

# Fix ownership (if needed)
sudo chown -R $USER:$USER .
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear cache
npm cache clean --force
npx jest --clearCache
```

### Database Lock Errors

```bash
# Clean test databases
rm -rf .swarm/test-*.db*
rm -rf .swarm/memory.db-shm
rm -rf .swarm/memory.db-wal
```

---

## 8. Performance Optimization Tips

### Fast Docker Builds

```bash
# Use layer caching
docker build -f Dockerfile.test -t claude-flow-test ../..

# Multi-stage builds for smaller images
# Use .dockerignore to exclude unnecessary files
```

### Fast Test Execution

```bash
# Run in parallel
npx jest --maxWorkers=4

# Run only changed tests
npx jest --onlyChanged

# Run specific test pattern
npx jest --testNamePattern="ReasoningBank"
```

### Benchmark Optimization

```bash
# Run with fewer iterations for quick checks
# Edit agent-booster-benchmark.js
const iterations = 10;  // Instead of 100

# Run specific benchmarks
# Comment out unwanted benchmark sections
```

---

## 9. Maintenance Tasks

### Weekly Tasks

```bash
# Run full test suite
npm test

# Run benchmarks
node tests/benchmark/agent-booster-benchmark.js

# Update dependencies
npm outdated
npm update --legacy-peer-deps
```

### Monthly Tasks

```bash
# Docker validation
cd tests/docker
docker build --no-cache -f Dockerfile.test -t claude-flow-test ../..
docker run --rm claude-flow-test sh -c "cd /home/testuser && tests/docker/run-validation.sh"

# Coverage check
npm run test:coverage
# Review coverage/lcov-report/index.html

# Dependency audit
npm audit
npm audit fix --legacy-peer-deps
```

### Before Releases

```bash
# Full validation checklist
npm run build
npm test
npm run test:integration
cd tests/docker && docker build -f Dockerfile.test -t claude-flow-test ../..
docker run --rm claude-flow-test sh -c "cd /home/testuser && tests/docker/run-validation.sh"
cd ../..
node tests/benchmark/agent-booster-benchmark.js

# Update version
npm version patch  # or minor/major
git push --tags
```

---

## 10. Additional Resources

### Documentation Files

- [DEVOPS_TOOLING_ANALYSIS.md](./DEVOPS_TOOLING_ANALYSIS.md) - Comprehensive analysis
- [DOCKER_VALIDATION_GUIDE.md](./DOCKER_VALIDATION_GUIDE.md) - Docker testing guide
- [INTEGRATION_TESTING_GUIDE.md](./INTEGRATION_TESTING_GUIDE.md) - Integration tests
- [BENCHMARK_REFERENCE.md](./BENCHMARK_REFERENCE.md) - Performance benchmarks

### External Links

- [Claude Flow Repository](https://github.com/ruvnet/claude-flow)
- [Docker Documentation](https://docs.docker.com/)
- [Jest Testing Framework](https://jestjs.io/)
- [GitHub Actions](https://docs.github.com/en/actions)

### Support

- **Issues:** https://github.com/ruvnet/claude-flow/issues
- **Discussions:** https://github.com/ruvnet/claude-flow/discussions
- **Discord:** https://discord.agentics.org

---

**Last Updated:** 2025-10-16
**Version:** 2.0.0-alpha.130
