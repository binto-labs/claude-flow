---
status: keep
phase: complete
type: guide
version: 2.1
last-updated: 2026-01-27
title: Binto-Flow - Multi-Agent Orchestration for Claude-Flow V3
author: Claude Code + Human Developer
tags: [binto-flow, v3, multi-agent, orchestration, templates, hooks, anti-drift]
---

# Binto-Flow

**Multi-Agent Orchestration for Claude-Flow V3**

> **Track A: Conservative** - Manual review with V3 improvements
> For automated validation, see [binto-flow-auto/](../binto-flow-auto/)

---

## What Is This?

Binto-Flow is a set of templates and guides for reliably running multi-agent swarms
with Claude Code using Claude-Flow V3. It's the evolution of the `multi-agent/` docs,
rewritten for V3.

## V3 Defaults (Anti-Drift)

All swarms use these defaults to prevent goal drift and agent desynchronization:

```javascript
// Anti-drift configuration (REQUIRED for all swarms)
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",    // Coordinator validates against goal
  maxAgents: 8,                // Smaller team = less drift
  strategy: "specialized"      // Clear roles, no overlap
})
```

**Model Routing:** All agents use **opus** by default (quality over cost).

## The Problem We Solve

**Claude Code skips steps.** Without explicit instructions, Claude Code will:
- Forget to coordinate agents via memory
- Spawn agents in separate messages (breaking coordination)
- Skip quality gates

## Our Solution: Two-Step Workflow

1. **Generate a prompt** using these templates
2. **Review the prompt** to verify all commands are included
3. **Execute the reviewed prompt**

This "forcing function" ensures Claude Code executes the complete coordination protocol.

## Why 3 Steps Instead of 6?

V3 hooks are pre-configured in `.claude/settings.json`:

| Old Step | Now Handled By |
|----------|----------------|
| pre-task | ✅ **PreToolUse hook** (automatic) |
| session-restore | ✅ **PreToolUse hook** (automatic) |
| post-edit | ✅ **PostToolUse hook** (automatic) |
| session-end | ✅ **Stop hook** (automatic) |

**What agents need to do:**
1. **READ** context from memory
2. **WORK** (hooks fire automatically)
3. **PUBLISH** results to memory

## V3 vs V2 Changes

| Aspect | V2 (multi-agent/) | V3 (binto-flow/) |
|--------|-------------------|------------------|
| Package | `npx claude-flow@alpha` | `npx claude-flow@v3alpha` |
| Coordinators | hierarchical, mesh, ring, star | `unified-coordinator` only |
| **Protocol** | **6-step (manual hooks)** | **3-step (auto hooks)** |
| Agent routing | Manual selection | Q-Learning pre-step available |
| Work claims | None | Claims System for multi-session |
| Memory search | Basic | HNSW (150x faster) |
| Learning | Manual pattern capture | SONA auto-learns from hooks |
| Two-step workflow | **Required** | **Still required** |

## Documents

| Document | Purpose |
|----------|---------|
| [workflow.md](./workflow.md) | Decision trees and workflow phases |
| [swarm-templates.md](./swarm-templates.md) | Agent spawn templates with 3-step protocol |
| [hive-mind-templates.md](./hive-mind-templates.md) | Queen-coordinated multi-phase swarms |
| [reference.md](./reference.md) | V3 command reference and architecture |
| [ralph-integration.md](./ralph-integration.md) | Ralph Wiggum iterative completion |

## Quick Start

```bash
# 1. Initialize V3 in your project
npx claude-flow@v3alpha init --force

# 2. Verify hooks are configured (REQUIRED)
npx claude-flow@v3alpha hooks verify || echo "Run init again"

# 3. (Optional) Start background workers
npx claude-flow@v3alpha daemon start

# 4. Generate a swarm prompt
"Generate a swarm prompt for [OBJECTIVE] using ./swarm-templates.md"

# 5. Review the generated prompt
# Verify: anti-drift config, @v3alpha commands, 3-step protocol,
#         opus model routing, quality gates

# 6. Execute
"Spawn this swarm using the reviewed prompt"
```

## Track A vs Track B

| Track | Location | Philosophy |
|-------|----------|------------|
| **A (this folder)** | `binto-flow/` | Manual review with V3 improvements |
| **B** | `binto-flow-auto/` | Automated gates, human on failure |

**When to use Track B:**
- High confidence in requirements
- Well-defined, repeatable tasks
- Want to reduce manual review overhead

See [binto-flow-auto/](../binto-flow-auto/) for the automated approach.

---

## Evolution from multi-agent/

The `docs/binto-labs/multi-agent/` folder is now archived. It contains V2 templates
that use `@alpha` and multiple coordinator types. Use binto-flow/ for V3.

Key differences:
- **Commands updated** to `@v3alpha`
- **Anti-drift configuration** as default
- **Model routing** (opus for all agents)
- **Protocol reduced** from 6 steps to 3 (hooks are automatic)
- **V3 features added** (Claims, Q-Learning routing) where useful
- **Same core approach** (templates, two-step workflow)

---

**Version**: 2.1 | **Last Updated**: 2026-01-27 | **Track**: A (Conservative)

