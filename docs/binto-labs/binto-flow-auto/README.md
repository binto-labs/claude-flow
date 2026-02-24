---
status: keep
phase: complete
type: guide
version: 3.0
last-updated: 2026-01-27
title: Binto-Flow-Auto - Native Claude-Flow Automated Orchestration
author: Claude Code + Human Developer
tags: [binto-flow, v3, multi-agent, orchestration, automation, claude-flow, hooks, memory]
---

# Binto-Flow-Auto

**Native Claude-Flow Automated Orchestration**

> **Track B: Progressive** - Continuous validation using claude-flow primitives
> For manual review approach, see [binto-flow/](../binto-flow/)

---

## What Is This?

Binto-Flow-Auto uses **claude-flow's native mechanisms** — hooks, memory, claims,
hive-mind consensus, and HNSW search — to automate multi-agent orchestration.
Instead of daemon workers or external gate systems, automation is built from
primitives that are already working and tested.

## Design Principles

1. **Use what works.** No daemon workers, no headless executor, no `claude --print` shelling.
2. **Agents self-gate.** Each agent runs verification commands and iterates (Ralph loops).
3. **Hooks do the plumbing.** PostToolUse hooks fire on every edit — use them for validation.
4. **Memory is the coordination layer.** Agents communicate via claude-flow memory namespaces.
5. **Escalation uses consensus.** Hive-mind consensus proposes actions when agents are blocked.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   BINTO-FLOW-AUTO (v3.0)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CLAUDE CODE (orchestrator)                                      │
│    │                                                             │
│    ├── claude-flow swarm init (anti-drift config)                │
│    ├── claude-flow route task (agent recommendations)            │
│    │                                                             │
│    ├── Task tool ──→ Agent 1 (self-gating Ralph loop)            │
│    │                   ├── claude-flow memory retrieve (dependencies) │
│    │                   ├── Work + verify + iterate                │
│    │                   ├── claude-flow memory store (results)     │
│    │                   └── COMPLETE or BLOCKED                    │
│    │                                                             │
│    ├── Task tool ──→ Agent 2 (self-gating Ralph loop)            │
│    ├── Task tool ──→ Agent 3 (self-gating Ralph loop)            │
│    │                                                             │
│    ├── Final validation (bash: tsc + test + lint)                │
│    └── claude-flow memory store (learnings)                      │
│                                                                  │
│  HOOKS (automatic, every edit)                                   │
│    ├── PostToolUse: memory update, pattern training              │
│    ├── PreToolUse: context loading                               │
│    └── Stop: session persistence, metrics export                 │
│                                                                  │
│  CLAUDE-FLOW INFRASTRUCTURE                                      │
│    ├── Memory namespaces (cross-agent state)                     │
│    ├── Claims system (work ownership)                            │
│    ├── HNSW search (pattern retrieval)                           │
│    ├── Hive-mind consensus (escalation decisions)                │
│    └── Session persistence (cross-session context)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## What We Use vs What We Don't

| Mechanism | Status | Used? |
|-----------|--------|-------|
| Memory namespaces | Working | **Yes** — cross-agent coordination |
| Claims system | Working | **Yes** — work ownership |
| Hooks (Pre/PostToolUse) | Working | **Yes** — automatic lifecycle |
| Hive-mind consensus | Working | **Yes** — escalation decisions |
| HNSW search | Working | **Yes** — pattern retrieval |
| Agent routing | Working | **Yes** — agent selection |
| Session persistence | Working | **Yes** — cross-session context |
| Task tool (Claude Code) | Working | **Yes** — agent spawning |
| Bash commands | Working | **Yes** — verification gates |
| Daemon workers (headless) | **Broken** | **No** — not depended on |

## V3 Defaults (Anti-Drift)

```bash
# Initialize with anti-drift config
npx claude-flow@v3alpha swarm init \
  --topology hierarchical \
  --strategy specialized

# For hive-mind (7+ agents)
npx claude-flow@v3alpha hive-mind init \
  --topology hierarchical-mesh \
  --consensus raft
```

**Model Routing:** All agents use **opus** by default.

## Documents

| Document | Purpose |
|----------|---------|
| [workflow.md](./workflow.md) | End-to-end workflow using claude-flow primitives |
| [continuous-gating.md](./continuous-gating.md) | Self-gating agents + hook-based validation |
| [escalation.md](./escalation.md) | Consensus-based escalation protocol |
| [swarm-templates.md](./swarm-templates.md) | Agent templates with claude-flow integration |
| [hive-mind-templates.md](./hive-mind-templates.md) | Hive-mind patterns with consensus |
| [reference.md](./reference.md) | V3 command reference |
| [ralph-integration.md](./ralph-integration.md) | Ralph iteration loops |

## Quick Start

```bash
# 1. Initialize V3
npx claude-flow@v3alpha init --force

# 2. Verify hooks (REQUIRED - fails loudly)
npx claude-flow@v3alpha hooks verify || exit 1

# 3. Initialize swarm
npx claude-flow@v3alpha swarm init \
  --topology hierarchical \
  --strategy specialized

# 4. Route task to get agent recommendations
npx claude-flow@v3alpha route task "[OBJECTIVE]"

# 5. Spawn agents with self-gating prompts
# (Use Task tool with Ralph loops + claude-flow memory)

# 6. Agents self-validate, coordinate via memory, escalate via consensus
# Human only involved when consensus proposes escalation
```

## When to Use Track B vs Track A

| Scenario | Track |
|----------|-------|
| High confidence in requirements | **Track B** (auto) |
| Well-defined, repeatable tasks | **Track B** (auto) |
| Exploratory or uncertain scope | **Track A** (manual) |
| Critical/sensitive changes | **Track A** (manual) |
| Learning the methodology | **Track A** (manual) |

## Migration from Track A

Start with Track A, then migrate incrementally:

1. **Stage 1**: Track A baseline (manual review)
2. **Stage 2**: Add Ralph loops to agent prompts (self-gating)
3. **Stage 3**: Add claude-flow memory coordination
4. **Stage 4**: Full Track B (consensus escalation, claims, HNSW)

---

**Version**: 3.0 | **Last Updated**: 2026-01-27 | **Track**: B (Progressive)
