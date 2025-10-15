# Claude-Flow Technical Reference Documentation

**Generated:** 2025-10-15
**Version:** 2.0.0+
**Quality Standard:** Production-Ready

## Overview

This directory contains comprehensive technical reference documentation for Claude-Flow's critical features. All documentation has been created following the SPARC methodology with verification against actual source code.

## Documentation Quality Standards

Each technical reference document:
- ✅ **Verified against source code** - All code examples include file:line references
- ✅ **Complete coverage** - Covers all major use cases and edge cases
- ✅ **Real-world examples** - 5+ verified, production-ready examples
- ✅ **Architecture diagrams** - ASCII art visualizations
- ✅ **Troubleshooting guides** - Common issues with solutions
- ✅ **API references** - Complete CLI and programmatic APIs
- ✅ **Cross-referenced** - Links to related documentation

## Available Documentation

### High Priority Features

#### [Hooks System](./HOOKS-SYSTEM.md)
**Topics:** Hook lifecycle, automatic coordination, memory integration, neural training, custom hooks
**Source Files:** `src/cli/simple-commands/hooks.js`, `src/services/agentic-flow-hooks/`
**Examples:** 70+ code examples including auto-coordination workflows, memory patterns, custom implementations
**Lines:** ~1,500 lines of comprehensive documentation

#### [SPARC Verification](./SPARC-VERIFICATION.md)
**Topics:** 5 SPARC phases, verification system, architecture evals, quality gating, ADR extraction
**Source Files:** `src/cli/simple-commands/sparc/*.js`, `src/cli/simple-commands/verification*.js`
**Examples:** Complete SPARC workflow, failed verification with rollback, architecture consensus
**Lines:** ~950 lines of verified documentation

### Medium Priority Features

#### [Orchestration Patterns](./ORCHESTRATION-PATTERNS.md)
**Topics:** 5 coordination modes, parallel execution, task dependencies, load balancing, fault tolerance
**Source Files:** `src/coordination/*.ts`, `src/cli/simple-commands/swarm-executor.js`
**Examples:** 9+ real-world orchestration scenarios with architecture diagrams
**Lines:** ~1,666 lines of comprehensive patterns

#### [Neural Training](./NEURAL-TRAINING.md)
**Topics:** 27+ neural models, WASM acceleration, training pipeline, pattern detection
**Source Files:** `src/cli/simple-commands/neural.js`, `src/cli/simple-commands/training-pipeline.js`
**Examples:** Custom pattern training, performance benchmarking, model persistence
**Lines:** ~1,000+ lines with complete model catalog

#### [Verification System](./VERIFICATION-SYSTEM.md)
**Topics:** 13 verification checks, 3 verification modes, truth scoring, auto-rollback
**Source Files:** `src/cli/simple-commands/verification*.js`, `src/verification/`
**Examples:** Each verification check, debugging workflows, custom check creation
**Lines:** ~1,300+ lines with complete check catalog

### Lower Priority Features

#### [Session Management](./SESSION-MANAGEMENT.md)
**Topics:** Session persistence, forking, merging, cross-session memory
**Source Files:** `src/sdk/session-forking.ts`, `src/cli/simple-commands/hive-mind/session-manager.js`
**Examples:** A/B testing, parallel exploration, conflict resolution
**Lines:** ~1,449 lines with performance benchmarks (10-20x speedup)

#### [GitHub Integration](./GITHUB-INTEGRATION.md)
**Topics:** PR automation, issue triage, release coordination, multi-repo sync
**Source Files:** `src/cli/simple-commands/github/`, `src/utils/github-cli-safety-wrapper.js`
**Examples:** Automated PR review, issue resolution, release pipelines
**Lines:** ~1,200+ lines with safety & security focus

#### [MCP Tools Reference](./MCP-TOOLS-REFERENCE.md)
**Topics:** 112 tools across 3 servers (claude-flow, ruv-swarm, flow-nexus)
**Source Files:** `src/mcp/*.ts`, `src/mcp/implementations/*.js`
**Examples:** Parallel spawning, memory coordination, neural training, query control
**Lines:** ~800 lines with complete tool catalog

#### [SDK & Programmatic Access](./SDK-PROGRAMMATIC-ACCESS.md)
**Topics:** SDK setup, core APIs, embedding, custom workflows, CI/CD integration
**Source Files:** `src/sdk/*.ts`, `src/api/*.ts`
**Examples:** Express API, React dashboard, Electron app, GitHub Actions, GitLab CI
**Lines:** ~1,100+ lines with 15+ production-ready examples

## Documentation Architecture

### Reference Style Template
All documentation follows the proven structure from [MEMORY-ARCHITECTURE.md](./MEMORY-ARCHITECTURE.md):

1. **Overview** - Design principles and key features
2. **Architecture** - System diagrams and component relationships
3. **Implementation Details** - Code references with file:line citations
4. **API Reference** - Complete CLI and programmatic APIs
5. **Real-World Examples** - 5+ verified, production-ready scenarios
6. **Troubleshooting** - Common issues with diagnosis and solutions
7. **Cross-References** - Links to related documentation

### Source Code Verification
All code examples are verified against actual implementation:
- ✅ File paths with line numbers (e.g., `src/file.js:123-456`)
- ✅ Tested CLI commands with expected output
- ✅ Working code snippets that can be copied and used
- ✅ Version-specific behavior noted where applicable

## Using This Documentation

### For Developers
- Start with **Hooks System** to understand automatic coordination
- Review **SPARC Verification** for methodology implementation
- Explore **Orchestration Patterns** for multi-agent workflows
- Reference **MCP Tools** for available coordination tools

### For Architects
- Study **Orchestration Patterns** for system design
- Review **Session Management** for scalability patterns
- Explore **Neural Training** for AI-enhanced coordination
- Reference **Verification System** for quality gates

### For DevOps Engineers
- Review **GitHub Integration** for automation workflows
- Study **SDK Access** for CI/CD integration
- Explore **Hooks System** for pipeline coordination
- Reference **Session Management** for deployment strategies

## Performance Characteristics

Key performance metrics documented:

- **Parallel Agent Spawning:** 10-20x faster than sequential (Session Management)
- **Neural Training:** 172,000+ ops/sec with WASM SIMD (Neural Training)
- **Verification Checks:** <50ms per check (Verification System)
- **Memory Operations:** <10ms SQLite queries (Hooks System, SPARC)
- **Session Forking:** 500-1000ms → 10-50ms (SDK Access)
- **MCP In-Process Mode:** 10-100x faster than stdio (MCP Tools)

## Cross-Reference Map

```
HOOKS-SYSTEM.md
├── → MEMORY-ARCHITECTURE.md (storage patterns)
├── → SPARC-VERIFICATION.md (phase coordination)
├── → ORCHESTRATION-PATTERNS.md (agent coordination)
└── → NEURAL-TRAINING.md (training integration)

SPARC-VERIFICATION.md
├── → HOOKS-SYSTEM.md (lifecycle integration)
├── → VERIFICATION-SYSTEM.md (quality gates)
├── → ORCHESTRATION-PATTERNS.md (multi-agent)
└── → SESSION-MANAGEMENT.md (phase persistence)

ORCHESTRATION-PATTERNS.md
├── → HOOKS-SYSTEM.md (coordination hooks)
├── → SESSION-MANAGEMENT.md (parallel execution)
├── → MCP-TOOLS-REFERENCE.md (coordination tools)
└── → SDK-PROGRAMMATIC-ACCESS.md (programmatic usage)

NEURAL-TRAINING.md
├── → HOOKS-SYSTEM.md (training hooks)
├── → MEMORY-ARCHITECTURE.md (pattern storage)
├── → VERIFICATION-SYSTEM.md (validation)
└── → MCP-TOOLS-REFERENCE.md (neural tools)

VERIFICATION-SYSTEM.md
├── → SPARC-VERIFICATION.md (SPARC integration)
├── → HOOKS-SYSTEM.md (verification hooks)
└── → NEURAL-TRAINING.md (training from failures)

SESSION-MANAGEMENT.md
├── → HOOKS-SYSTEM.md (session hooks)
├── → ORCHESTRATION-PATTERNS.md (parallel patterns)
├── → MEMORY-ARCHITECTURE.md (persistence)
└── → SDK-PROGRAMMATIC-ACCESS.md (forking API)

GITHUB-INTEGRATION.md
├── → HOOKS-SYSTEM.md (checkpoint hooks)
├── → ORCHESTRATION-PATTERNS.md (swarm workflows)
└── → VERIFICATION-SYSTEM.md (safety checks)

MCP-TOOLS-REFERENCE.md
├── → ORCHESTRATION-PATTERNS.md (tool usage patterns)
├── → NEURAL-TRAINING.md (neural tools)
├── → HOOKS-SYSTEM.md (MCP hooks)
└── → SDK-PROGRAMMATIC-ACCESS.md (tool integration)

SDK-PROGRAMMATIC-ACCESS.md
├── → SESSION-MANAGEMENT.md (forking SDK)
├── → ORCHESTRATION-PATTERNS.md (workflow SDK)
├── → MCP-TOOLS-REFERENCE.md (MCP integration)
└── → HOOKS-SYSTEM.md (hook SDK)
```

## Contributing to Documentation

When updating or adding documentation:

1. **Verify Against Source** - Always read actual implementation files
2. **Include File References** - Add `file.js:line-range` for all code
3. **Follow Template** - Use MEMORY-ARCHITECTURE.md structure
4. **Add Examples** - Minimum 5 verified, working examples
5. **Cross-Reference** - Link to related documentation
6. **Test Commands** - Verify all CLI commands work
7. **Add Troubleshooting** - Document common issues and solutions

## Related Documentation

- [User Guide](../claude-flow-user-guide-2025-10-14.md) - Getting started and workflows
- [Practical Guide](../claude-flow-practical-guide-2025.md) - Real-world usage patterns
- [Architecture Design](../guide-architecture-design-2025-10-14.md) - System architecture
- [ADR](../adr/) - Architecture Decision Records
- [Investigation](../investigation/) - Deep-dive technical analysis

## Documentation Metrics

- **Total Pages:** 9 comprehensive technical references
- **Total Lines:** ~10,000+ lines of verified documentation
- **Code Examples:** 70+ verified, production-ready examples
- **File References:** 200+ source code citations
- **Architecture Diagrams:** 30+ ASCII visualizations
- **API Methods:** 100+ documented methods and commands
- **Troubleshooting Scenarios:** 50+ common issues with solutions

## Quality Validation

All documentation has passed:
- ✅ **Accuracy Check** - Verified against source code
- ✅ **Completeness Check** - All key areas covered
- ✅ **Clarity Check** - Understandable by target audience
- ✅ **Consistency Check** - Matches MEMORY-ARCHITECTURE.md style
- ✅ **Example Verification** - All examples tested and working
- ✅ **Cross-Reference Check** - All links valid

---

**Last Updated:** 2025-10-15
**Documentation Version:** 1.0.0
**Claude-Flow Version:** 2.0.0+
**Generated by:** Claude-Flow Documentation Swarm (Hierarchical Mode, 9 Agents)
