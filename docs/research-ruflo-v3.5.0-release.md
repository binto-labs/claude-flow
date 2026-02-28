# Research: RuFlo v3.5.0 Production Release

**Date**: 2026-02-27 (initial), updated 2026-02-28
**Branch**: `claude/research-ruflow-release-X8KqO`
**Subject**: Claude Flow → RuFlo rebrand and v3.5.0 graduation from alpha

---

## Executive Summary

Claude Flow has been rebranded to **RuFlo** (stylized as 🌊 RuFlo). Version 3.5.0 was published to npm on February 27, 2026 (followed quickly by a 3.5.1 patch), marking the first production-ready (non-alpha) release after 10 months of alpha development spanning versions 3.0.0-alpha.1 through 3.1.0-alpha.55.

The rebrand is a **dual-package branding layer** — internal packages remain `@claude-flow/*`, while two umbrella packages (`claude-flow` and `ruflo`) coexist on npm. This was an intentional design decision (ADR-046) to avoid breaking changes for existing users.

The upstream repository (`ruvnet/claude-flow`) has 15,586 stars, 1,801 forks, and 246 published versions of the CLI package. All three npm packages now point to v3.5.1 across all dist-tags.

---

## 1. Release Status

### npm Publication Timeline

All three packages were published to npm on February 27, 2026:

| Package | v3.5.0 Published | v3.5.1 Published | Delta |
|---------|-----------------|-----------------|-------|
| `@claude-flow/cli` | 2026-02-27 22:58:17 UTC | 2026-02-27 23:22:56 UTC | ~25 min |
| `claude-flow` | 2026-02-27 22:58:33 UTC | 2026-02-27 23:23:05 UTC | ~25 min |
| `ruflo` | 2026-02-27 22:58:36 UTC | 2026-02-27 23:23:09 UTC | ~25 min |

The version jumped from `3.1.0-alpha.55` directly to `3.5.0`, skipping 3.2-3.4 entirely. v3.5.1 followed 25 minutes later as a dependency cleanup (removed `agentic-flow`, `@claude-flow/guidance`, `@claude-flow/aidefence` from `@claude-flow/cli`).

### Current npm Dist-Tags

| Package | `latest` | `alpha` | `v3alpha` |
|---------|----------|---------|-----------|
| `@claude-flow/cli` | 3.5.1 | 3.5.1 | 3.5.1 |
| `claude-flow` | 3.5.1 | 3.5.1 | 3.5.1 |
| `ruflo` | 3.5.1 | 3.5.1 | — |

### GitHub Release Status

The most recent GitHub Release is **v3.0.0-alpha.79** (2026-01-15). No GitHub Release was created for v3.5.0 or v3.5.1 — the production release exists only on npm.

### Repository Stats (upstream: ruvnet/claude-flow)

| Metric | Value |
|--------|-------|
| Stars | 15,586 |
| Forks | 1,801 |
| Open Issues | 530 |
| Total CLI versions published | 246 |
| Commits | 5,800+ (claimed) |
| Alpha iterations | 3.0.0-alpha.1 → 3.1.0-alpha.55 |
| Created | June 2, 2025 |

### This Fork (binto-labs/claude-flow)

| Metric | Value |
|--------|-------|
| Local version | 3.1.0-alpha.44 |
| Behind upstream | Needs sync to v3.5.1 |

---

## 2. Rebrand Architecture

### Dual-Package Strategy (ADR-046)

The rebrand uses a **dual-package model**, not a replacement:

```
ruflo (npm)          → thin wrapper → @claude-flow/cli
claude-flow (npm)    → bundles      → @claude-flow/cli + v3/@claude-flow/*
@claude-flow/cli     → core implementation (26 commands, 140+ subcommands)
```

### What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Product name | Claude Flow | RuFlo |
| README branding | Claude Flow | "🌊 Ruflo v3: Enterprise AI Orchestration Platform" |
| CLI display | `claude-flow` | Shows `ruflo` branding |
| npm package | `claude-flow` | Both `claude-flow` AND `ruflo` |
| MCP add command | `claude mcp add claude-flow ...` | `claude mcp add ruflo -- npx -y ruflo@latest` |

### What Did NOT Change

- Internal packages: all remain `@claude-flow/*` (20 packages)
- GitHub repository: still `ruvnet/claude-flow`
- Core functionality: zero changes
- `claude-flow` npm package: still published and supported
- Existing user workflows: unaffected

---

## 3. Ecosystem Scope

### Packages (20 under @claude-flow/*)

| Package | Version | Purpose |
|---------|---------|---------|
| `@claude-flow/cli` | 3.1.0-alpha.44 | CLI entry point (26 commands) |
| `@claude-flow/memory` | 3.0.0-alpha.11 | AgentDB + HNSW search |
| `@claude-flow/codex` | 3.0.0-alpha.9 | Dual-mode Claude + Codex |
| `@claude-flow/mcp` | 3.0.0-alpha.8 | MCP server management |
| `@claude-flow/claims` | 3.0.0-alpha.8 | Claims-based authorization |
| `@claude-flow/embeddings` | 3.0.0-alpha.12 | Vector embeddings with sql.js |
| `@claude-flow/neural` | 3.0.0-alpha.7 | SONA, MoE, EWC++ |
| `@claude-flow/hooks` | 3.0.0-alpha.7 | 17 hooks + 12 workers |
| `@claude-flow/deployment` | 3.0.0-alpha.7 | Deployment management |
| `@claude-flow/plugins` | 3.0.0-alpha.7 | Plugin system with IPFS registry |
| `@claude-flow/security` | 3.0.0-alpha.6 | Input validation, CVE remediation |
| `@claude-flow/performance` | 3.0.0-alpha.6 | Profiling and benchmarking |
| `@claude-flow/providers` | 3.0.0-alpha.6 | AI provider management |
| `@claude-flow/shared` | 3.0.0-alpha.6 | Shared utilities |
| `@claude-flow/swarm` | 3.0.0-alpha.6 | Swarm coordination |
| `@claude-flow/testing` | 3.0.0-alpha.6 | Testing harness |
| `@claude-flow/guidance` | 3.0.0-alpha.1 | Governance control plane |
| `@claude-flow/integration` | 3.0.0 | agentic-flow integration |
| `@claude-flow/aidefence` | 3.0.2 | AI defence module |
| `@claude-flow/browser` | 3.0.0-alpha.2 | Browser rendering |

Plus: `@claude-flow/coflow`, `@claude-flow/domains`, `@claude-flow/swarm-ui`, `@claude-flow/testing-harness`, `@claude-flow/v2-compat`, `@claude-flow/worker-plugin`

### Agent Types (80+)

| Category | Count | Examples |
|----------|-------|---------|
| Core Development | 5 | coder, reviewer, tester, planner, researcher |
| Swarm Coordination | 6 | hierarchical-coordinator, mesh-coordinator, adaptive-coordinator |
| Consensus & Distributed | 7 | byzantine-coordinator, raft-manager, gossip-coordinator, crdt-synchronizer |
| GitHub & Repository | 11 | pr-manager, code-review-swarm, release-manager, workflow-automation |
| SPARC Methodology | 6 | sparc-coord, sparc-coder, specification, pseudocode |
| Specialized Dev | 7 | backend-dev, mobile-dev, ml-developer, system-architect |
| Performance | 5 | perf-analyzer, performance-benchmarker, task-orchestrator |
| Flow Nexus | 9 | flow-nexus-neural, flow-nexus-payments, flow-nexus-swarm |
| Planning | 4 | goal-planner, code-goal-planner, sublinear-goal-planner |
| V3 Specialized | 5 | security-architect, memory-specialist, performance-engineer |
| Others | 8+ | trading-predictor, matrix-optimizer, pagerank-analyzer |

### MCP Tools (~215)

Organized across categories:

| Category | Approx. Count |
|----------|---------------|
| Agent Management | ~15 |
| Swarm Orchestration | ~12 |
| Memory Operations | ~18 |
| Task Management | ~10 |
| Session Management | ~8 |
| Hooks System | ~20 |
| Neural/Intelligence | ~15 |
| Security | ~12 |
| Performance | ~10 |
| Workflow | ~8 |
| Configuration | ~10 |
| MCP Management | ~8 |
| Coordination | ~12 |
| Hive Mind | ~8 |
| Deployment | ~8 |
| Embeddings | ~6 |
| GitHub Integration | ~15 |
| Plugin Management | ~8 |
| Process/Diagnostics | ~10 |

### CLI Commands (26 commands, 140+ subcommands)

Core: `init`, `agent`, `swarm`, `memory`, `mcp`, `task`, `session`, `config`, `status`, `start`, `workflow`, `hooks`, `hive-mind`

Advanced: `daemon`, `neural`, `security`, `performance`, `providers`, `plugins`, `deployment`, `embeddings`, `claims`, `migrate`, `process`, `doctor`, `completions`

### Consensus Mechanisms (7)

Byzantine (PBFT), Raft, Gossip, CRDT, Quorum, Hierarchical, Adaptive

### Swarm Topologies (5)

Hierarchical, Mesh, Hierarchical-Mesh (hybrid), Adaptive, Pipeline

### Plugins (20)

14 in repository + 6 core packages counted as plugins = 20 total. Distributed via IPFS/Pinata registry.

---

## 4. Intelligence System (RuVector)

| Component | Description | Performance |
|-----------|-------------|-------------|
| SONA | Self-Optimizing Neural Architecture | <0.05ms adaptation |
| MoE | Mixture of Experts routing | 8 expert models |
| HNSW | Hierarchical Navigable Small World indexing | 150x-12,500x faster search |
| Flash Attention | Optimized attention mechanism | 2.49x-7.47x speedup |
| EWC++ | Elastic Weight Consolidation | Prevents catastrophic forgetting |
| ReasoningBank | Adaptive learning bank | 32% token savings |

Pipeline: RETRIEVE (HNSW) → JUDGE (verdicts) → DISTILL (LoRA) → CONSOLIDATE (EWC++)

---

## 5. Platform Independence

RuFlo is designed to be provider-agnostic:

- **Claude Code**: Native integration via MCP
- **OpenAI Codex**: Dual-mode orchestration (`@claude-flow/codex`)
- **Local ONNX models**: Via agentic-flow integration
- **Hybrid stacks**: One control plane for multiple providers
- **Offline capable**: Works without internet connection
- **Local or remote**: No cloud dependency required

Installation: `claude mcp add ruflo -- npx -y ruflo@latest`

---

## 6. Key Observations

1. **Version jump**: 3.1.0-alpha.55 → 3.5.0 skips 3.2-3.4 entirely, signaling maturity graduation rather than incremental progress
2. **npm-only release**: v3.5.0/3.5.1 were published to npm but no corresponding GitHub Release was created (latest GH release is v3.0.0-alpha.79)
3. **Quick patch**: v3.5.1 followed v3.5.0 by just 25 minutes, removing 3 dependencies from @claude-flow/cli
4. **Stars verified**: Upstream repo has **15,586 stars** and **1,801 forks** — the "approaching 16,000" claim is accurate
5. **Dual branding**: Both `ruflo` and `claude-flow` continue to work — no migration required
6. **Internal consistency**: All `@claude-flow/*` packages retain their naming, reducing ecosystem disruption
7. **Enterprise positioning**: The release frames RuFlo as enterprise-grade, production-ready, Fortune 500-used
8. **Third-party recognition**: Listed in "Top 10+ Agentic Orchestration Frameworks & Tools in 2026" by AIMultiple
9. **This fork is behind**: Local codebase is at 3.1.0-alpha.44, needs sync to v3.5.1
10. **No changelog entries**: Neither local CHANGELOG.md nor v3/CHANGELOG.md have entries for v3.5.x

---

## 7. v3.5.0 Release Notes Summary

From the GitHub release:

**Core Platform**: 60+ agents, hierarchical/mesh swarms, BFT consensus, self-learning memory, 215 MCP tools, 26 CLI commands, 17 hooks + 12 workers

**Intelligence**: RuVector (SONA, MoE, Flash Attention, EWC++, ReasoningBank)

**Enterprise**: Claims-based auth, CVE remediation, IPFS plugin registry, dual-mode orchestration, V2 migration support

**Installation**:
```bash
claude mcp add ruflo -- npx -y ruflo@latest
```

---

## 8. External Coverage & Metrics

| Metric | Value | Source |
|--------|-------|--------|
| npm total downloads | "Closing in on 500,000" | Web search |
| Monthly active users | ~100,000 | Web search |
| Countries | 80+ | Announcement |
| SWE-Bench solve rate | 84.8% | Web search |
| Cost savings (3-tier routing) | 75% | Web search |
| Token reduction | 32.3% | Web search |
| Batch spawning speedup | 10-20x | Web search |
| Claude subscription capacity | 250% improvement | Web search |

Third-party coverage:
- Listed in AIMultiple "Top 10+ Agentic Orchestration Frameworks & Tools in 2026"
- Medium quickstart guide by Ngoc Phan
- Official site: claude-flow.ruv.io

---

## 9. Actions for This Fork

1. **Sync upstream**: Pull v3.5.1 changes from `ruvnet/claude-flow` to align with production release
2. **Update local versions**: Bump package.json versions to match 3.5.1
3. **Review dependency changes**: v3.5.1 removed `agentic-flow`, `@claude-flow/guidance`, `@claude-flow/aidefence` from CLI deps
4. **Update CHANGELOG**: No v3.5.x entries exist in either changelog file
