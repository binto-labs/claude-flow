# Docker Validation Suite - Quick Start Guide

## Overview

The Docker validation suite provides automated testing in clean, isolated environments to ensure claude-flow works correctly for end users.

## Quick Start

### Option 1: One-Line Validation (Recommended)

```bash
cd tests/docker && \
docker build -f Dockerfile.test -t claude-flow-test ../.. && \
docker run --rm claude-flow-test sh -c "cd /home/testuser && tests/docker/run-validation.sh"
```

### Option 2: Interactive Development

```bash
# Start container
docker-compose -f tests/docker/docker-compose.test.yml up -d

# Enter container
docker exec -it claude-flow-test sh

# Run tests
cd /home/testuser
./tests/docker/run-validation.sh

# Or test individual commands
./bin/claude-flow --help
./bin/claude-flow memory store test "value"
./bin/claude-flow agent agents
```

## Test Coverage

### Phase 1: Installation & Build ✅
- NPM and Node.js versions
- Build completion
- Binary generation

### Phase 2: CLI Commands ✅
- Help system
- Version reporting
- Agent commands

### Phase 3: Memory System ✅
- Store/query operations
- Statistics and metrics
- Import/export workflows

### Phase 4: ReasoningBank ✅
- Mode detection
- Configuration
- Semantic search

### Phase 5: Agent System ✅
- 66+ agent types
- Agent info and configuration
- Multi-provider support

### Phase 6: Proxy Features ✅
- OpenRouter integration
- Cost optimization
- Configuration

### Phase 7: Help System ✅
- Comprehensive documentation
- Feature discoverability
- Command-specific help

### Phase 8: Security ✅
- API key redaction
- Secure storage
- Data protection

### Phase 9: File Structure ✅
- Directory creation
- Permission validation
- Database files

### Phase 10: Integration ✅
- End-to-end workflows
- Error handling
- Cross-feature integration

## Expected Output

```
🐳 Claude-Flow Docker Validation Suite
========================================

📦 Phase 1: Installation & Build
--------------------------------
Testing: NPM install... ✓ PASS
Testing: Node version... ✓ PASS
Testing: Build completed... ✓ PASS
Testing: Binary exists... ✓ PASS

...

========================================
📊 Test Results Summary
========================================
Total Tests: 50
Passed: 50
Failed: 0

✅ All tests passed!
🚀 Claude-Flow is ready for production release
```

## Troubleshooting

### Build Fails

```bash
# Clean build
docker build --no-cache -f Dockerfile.test -t claude-flow-test ../..
```

### Permission Errors

The Dockerfile uses a non-root user (testuser) to simulate real user environments. This is intentional for security testing.

### Tests Timeout

```bash
# Run specific phases
docker exec -it claude-flow-test ./bin/claude-flow --help
docker exec -it claude-flow-test ./bin/claude-flow memory stats
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Validation

on: [push, pull_request]

jobs:
  docker-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build test container
        run: |
          cd tests/docker
          docker build -f Dockerfile.test -t claude-flow-test ../..

      - name: Run validation suite
        run: |
          docker run --rm claude-flow-test \
            sh -c "cd /home/testuser && tests/docker/run-validation.sh"
```

## Multi-Platform Testing

```bash
# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 \
    -f Dockerfile.test -t claude-flow-test ../..
```

## Adding New Tests

Edit `run-validation.sh`:

```bash
test_command "Your test description" \
    "./bin/claude-flow your-command" \
    "expected-output-pattern"
```

## Security Testing

The validation suite includes:
- API key redaction tests
- Secure storage validation
- Permission checks
- Data protection verification

## Performance Benchmarks

```
Build Time: ~3-5 minutes (cached: 30-60s)
Test Execution: ~2-3 minutes
Success Rate: 100% (50/50 tests)
Coverage: 10 test phases, 50+ assertions
```

## Best Practices

1. **Run Before PRs** - Validate changes in clean environment
2. **Test Locally** - Use docker-compose for development
3. **Monitor Output** - Check all test phases complete
4. **Update Tests** - Add tests for new features
5. **Security First** - Never commit API keys to tests

## File Structure

```
tests/docker/
├── Dockerfile.test              # Main test container (Node 18 Alpine)
├── docker-compose.test.yml      # Multi-container orchestration
├── run-validation.sh            # 50+ validation tests
├── run-tests.sh                 # Integration test runner
├── quick-validation.sh          # Fast validation script
└── README.md                    # Detailed documentation

docker-test/
├── Dockerfile.reasoningbank-test    # ReasoningBank validation
└── reasoningbank-validation.mjs     # 9-phase semantic search tests
```

## Related Documentation

- [DEVOPS_TOOLING_ANALYSIS.md](./DEVOPS_TOOLING_ANALYSIS.md) - Comprehensive analysis
- [INTEGRATION_TESTING_GUIDE.md](./INTEGRATION_TESTING_GUIDE.md) - Integration tests
- [BENCHMARK_REFERENCE.md](./BENCHMARK_REFERENCE.md) - Performance benchmarks

## Support

For issues:
1. Check Docker logs: `docker logs claude-flow-test`
2. Review test output for failures
3. Open issue with validation output
4. Include Docker version and platform

---

**Last Updated:** 2025-10-16
**Version:** 2.0.0-alpha.130
