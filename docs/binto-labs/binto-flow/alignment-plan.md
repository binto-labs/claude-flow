---
status: active
phase: planning
type: alignment-plan
version: 1.0
last-updated: 2026-01-26
title: Binto-Flow V3 Alignment Plan
author: Claude Code
tags: [alignment, plan, v3, binto-flow, claude-flow]
---

# Binto-Flow V3 Alignment Plan

> **Purpose:** Bring binto-flow documentation in alignment with the latest CLAUDE.md and claude-flow V3 codebase.
> **Created:** 2026-01-26
> **Status:** Planning Phase

---

## Executive Summary

The binto-flow documents (last updated 2026-01-17) have fallen behind the latest CLAUDE.md updates. This plan identifies **17 major gaps** across 6 documents that need updating to reflect V3 changes including:

- 3-tier model routing (ADR-026)
- Anti-drift swarm configuration
- Expanded hooks system (17 hooks + 12 workers)
- 26 CLI commands with 140+ subcommands
- 60+ agent types
- RuVector intelligence system

---

## Gap Analysis Summary

| Document | Gaps Found | Priority | Estimated Changes |
|----------|------------|----------|-------------------|
| README.md | 4 | High | Medium |
| workflow.md | 5 | High | Medium |
| reference.md | 8 | Critical | Large |
| swarm-templates.md | 6 | High | Large |
| hive-mind-templates.md | 4 | Medium | Medium |
| ralph-integration.md | 2 | Low | Small |

---

## Detailed Gap Analysis

### 1. README.md Gaps

| Gap ID | Issue | Current State | Required State |
|--------|-------|---------------|----------------|
| R-1 | Anti-drift defaults missing | Generic topology mention | Add anti-drift config as recommended default |
| R-2 | No model routing mention | - | Add ADR-026 3-tier routing summary |
| R-3 | Protocol still accurate | 3-step (correct) | Keep (no change needed) |
| R-4 | Version table outdated | Version 2.0 | Update to 2.1+ with V3 alignment |

**Specific Changes:**
- [ ] Add section: "V3 Defaults (Anti-Drift)"
- [ ] Add brief mention of model routing in "What's New" or similar
- [ ] Update version number and last-updated date

---

### 2. workflow.md Gaps

| Gap ID | Issue | Current State | Required State |
|--------|-------|---------------|----------------|
| W-1 | Missing auto-invoke swarm trigger | Manual decision only | Add complexity detection triggers |
| W-2 | No model routing pre-step | - | Add model recommendation check before spawning |
| W-3 | Decision tree doesn't include anti-drift | Generic topology selection | Add anti-drift as default recommendation |
| W-4 | Missing task complexity detection | - | Add when-to-swarm criteria from CLAUDE.md |
| W-5 | Agent routing codes missing | - | Reference new routing table (codes 1-13) |

**Specific Changes:**
- [ ] Add "Task Complexity Detection" section matching CLAUDE.md
- [ ] Add "Model Routing Pre-Step" to pre-work section
- [ ] Update decision tree to recommend anti-drift config by default
- [ ] Add reference to agent routing codes table
- [ ] Update version and date

---

### 3. reference.md Gaps (CRITICAL)

| Gap ID | Issue | Current State | Required State |
|--------|-------|---------------|----------------|
| REF-1 | Hook config uses `@alpha` | Line 197: `@alpha` | Change to `@v3alpha` |
| REF-2 | CLI command count outdated | Subset only | Document 26 commands, 140+ subcommands |
| REF-3 | Missing 12 background workers | Not mentioned | Add full worker table |
| REF-4 | Missing advanced commands | Basic only | Add neural, security, performance, etc. |
| REF-5 | Agent types incomplete | ~15 types | Document 60+ types |
| REF-6 | Missing intelligence system | Basic SONA mention | Add RuVector 4-step pipeline |
| REF-7 | Missing embeddings package | - | Add embeddings section |
| REF-8 | Hive-mind consensus incomplete | Basic mention | Add all 5 consensus strategies |

**Specific Changes:**
- [ ] Fix `@alpha` → `@v3alpha` in hook config example (line 197)
- [ ] Add "V3 CLI Commands" table with all 26 commands
- [ ] Add "Advanced Commands" section (daemon, neural, security, performance, etc.)
- [ ] Add "12 Background Workers" table
- [ ] Expand "Agent Types" to include all 60+ types (grouped by category)
- [ ] Add "RuVector Intelligence System" section with 4-step pipeline
- [ ] Add "Embeddings Package" section
- [ ] Expand "Hive-Mind Consensus" with all strategies
- [ ] Add "Performance Targets" table
- [ ] Update version and date

---

### 4. swarm-templates.md Gaps

| Gap ID | Issue | Current State | Required State |
|--------|-------|---------------|----------------|
| ST-1 | Missing anti-drift default config | Various topologies shown | Add anti-drift config as recommended default |
| ST-2 | No model routing in agent prompts | - | Add `[TASK_MODEL_RECOMMENDATION]` handling |
| ST-3 | unified-coordinator inconsistency | Listed as replacement | CLAUDE.md shows multiple coordinator types still available |
| ST-4 | Missing auto-start swarm protocol | - | Add CLAUDE.md's auto-start pattern |
| ST-5 | Agent routing codes not referenced | - | Add routing table or reference |
| ST-6 | Token optimizer not mentioned | - | Add optimization hooks |

**Specific Changes:**
- [ ] Add "Anti-Drift Default Configuration" section at top
- [ ] Update "Single-Message Spawning" to include model parameter
- [ ] Clarify coordinator types (unified-coordinator is option, not replacement)
- [ ] Add "Auto-Start Swarm Protocol" pattern from CLAUDE.md
- [ ] Add agent routing codes reference
- [ ] Add "Token Optimization" notes for agent prompts
- [ ] Update version and date

---

### 5. hive-mind-templates.md Gaps

| Gap ID | Issue | Current State | Required State |
|--------|-------|---------------|----------------|
| HM-1 | Consensus strategies incomplete | Basic mention | Add all 5: byzantine, raft, gossip, crdt, quorum |
| HM-2 | Topologies incomplete | mesh only in init | Add hierarchical-mesh (recommended), adaptive |
| HM-3 | Anti-drift not emphasized | - | Add raft as recommended consensus |
| HM-4 | Background workers not integrated | - | Show how workers support hive-mind |

**Specific Changes:**
- [ ] Expand "V3 Hive-Mind Commands" with all topology options
- [ ] Add "Consensus Strategies" detailed section
- [ ] Add "Anti-Drift Hive-Mind" recommendation (raft consensus)
- [ ] Add note about background workers supporting hive operations
- [ ] Update version and date

---

### 6. ralph-integration.md Gaps

| Gap ID | Issue | Current State | Required State |
|--------|-------|---------------|----------------|
| RI-1 | Minor: uses @v3alpha (correct) | Correct | No change |
| RI-2 | Could integrate model routing | - | Optional: add model param to Task examples |

**Specific Changes:**
- [ ] (Optional) Add model parameter to Task() examples
- [ ] Update version and date

---

## New Content to Add

### A. 3-Tier Model Routing Section (for workflow.md and reference.md)

```markdown
## Model Routing (ADR-026)

Before spawning agents, check for routing recommendations:

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| 1 | Agent Booster (WASM) | <1ms | $0 | Simple transforms |
| 2 | Haiku | ~500ms | $0.0002 | Low complexity (<30%) |
| 3 | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning (>30%) |

When you see `[TASK_MODEL_RECOMMENDATION] Use model="opus"`:
```javascript
Task({
  prompt: "...",
  subagent_type: "coder",
  model: "opus"  // USE THE RECOMMENDED MODEL
})
```
```

### B. Anti-Drift Configuration Section (for multiple docs)

```markdown
## Anti-Drift Default Configuration

For coding swarms, use this configuration to prevent drift:

```javascript
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",  // Coordinator validates against goal
  maxAgents: 8,              // Smaller team = less drift
  strategy: "specialized"    // Clear roles, no overlap
})
```

For hive-mind, use `raft` consensus (leader maintains authoritative state).
```

### C. 12 Background Workers Table (for reference.md)

```markdown
## Background Workers

| Worker | Priority | Description |
|--------|----------|-------------|
| ultralearn | normal | Deep knowledge acquisition |
| optimize | high | Performance optimization |
| consolidate | low | Memory consolidation |
| predict | normal | Predictive preloading |
| audit | critical | Security analysis |
| map | normal | Codebase mapping |
| preload | low | Resource preloading |
| deepdive | normal | Deep code analysis |
| document | normal | Auto-documentation |
| refactor | normal | Refactoring suggestions |
| benchmark | normal | Performance benchmarking |
| testgaps | normal | Test coverage analysis |
```

### D. Task Complexity Detection (for workflow.md)

```markdown
## Task Complexity Detection

**AUTO-INVOKE SWARM when task involves:**
- Multiple files (3+)
- New feature implementation
- Refactoring across modules
- API changes with tests
- Security-related changes
- Performance optimization
- Database schema changes

**SKIP SWARM for:**
- Single file edits
- Simple bug fixes (1-2 lines)
- Documentation updates
- Configuration changes
- Quick questions/exploration
```

---

## Implementation Order

### Phase 1: Critical Fixes (Do First)
1. **reference.md** - Fix `@alpha` → `@v3alpha` bug (line 197)
2. **reference.md** - Add complete CLI commands table
3. **reference.md** - Add background workers table

### Phase 2: Anti-Drift Alignment (High Priority)
4. **swarm-templates.md** - Add anti-drift default configuration
5. **workflow.md** - Add task complexity detection
6. **hive-mind-templates.md** - Add raft consensus recommendation

### Phase 3: Feature Documentation (Medium Priority)
7. **reference.md** - Add RuVector intelligence system
8. **reference.md** - Expand agent types (60+)
9. **workflow.md** - Add model routing pre-step
10. **swarm-templates.md** - Add auto-start protocol

### Phase 4: Polish (Lower Priority)
11. **README.md** - Update overview with V3 highlights
12. **hive-mind-templates.md** - Add all consensus strategies
13. **ralph-integration.md** - Optional model routing additions
14. All docs - Update version numbers and dates

---

## Validation Checklist

After updates, verify:

- [ ] All docs use `@v3alpha` (not `@alpha`) for commands
- [ ] Anti-drift config is documented as default recommendation
- [ ] Model routing (ADR-026) is mentioned where relevant
- [ ] CLI commands match CLAUDE.md (26 commands, 140+ subcommands)
- [ ] Background workers (12) are documented
- [ ] Agent types match CLAUDE.md (60+ types)
- [ ] Hive-mind consensus strategies (5) are documented
- [ ] RuVector intelligence system is documented
- [ ] Version numbers and dates updated in all docs
- [ ] Cross-references between docs still work

---

## Notes

### What NOT to Change
- **3-step protocol** - Still correct, hooks handle the rest
- **Two-step workflow** - Still required (generate → review → execute)
- **Single-message spawning** - Still required for coordination
- **Quality gates** - Still required

### Potential Breaking Changes
- The `unified-coordinator` claim in reference.md may need clarification - CLAUDE.md still shows multiple coordinator types available
- Anti-drift defaults may change existing workflows that used mesh topology

---

## Appendix: Source Reference

| Source | Location | Key Sections |
|--------|----------|--------------|
| CLAUDE.md | /workspaces/claude-flow/CLAUDE.md | All V3 configuration |
| Recent commits | `git log --oneline -10` | Feature additions |
| CLI codebase | v3/@claude-flow/cli/ | Command implementations |

---

**Plan Version**: 1.0 | **Created**: 2026-01-26 | **Status**: Ready for Review
