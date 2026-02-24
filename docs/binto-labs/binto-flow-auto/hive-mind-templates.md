---
status: keep
phase: complete
type: reference
version: 3.0
last-updated: 2026-01-27
title: Hive-Mind Templates (Binto-Flow-Auto)
author: Claude Code + Human Developer
tags: [hive-mind, queen, swarm, consensus, raft, memory, v3, binto-flow, automation]
---

# Hive-Mind Templates (Binto-Flow-Auto)

> **Track B: Progressive** - Continuous validation using claude-flow primitives
> **When to use Hive-Mind:** 7+ agents, uncertain scope, multi-phase projects
> **For simpler swarms (3-6 agents):** [swarm-templates.md](./swarm-templates.md)
> **For gating:** [continuous-gating.md](./continuous-gating.md)
> **For escalation:** [escalation.md](./escalation.md)

---

## Anti-Drift Hive-Mind Configuration (REQUIRED)

```bash
# Pre-flight check (fails loudly)
npx claude-flow@v3alpha hooks verify || exit 1

# Initialize with anti-drift + raft consensus
npx claude-flow@v3alpha hive-mind init \
  --topology hierarchical-mesh \
  --consensus raft
```

**All agents use opus model.**

---

## Hive-Mind with Continuous Gating

```
┌─────────────────────────────────────────────────────────────────┐
│                HIVE-MIND WITH CONTINUOUS GATING                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     QUEEN (orchestrator)                          │
│                          │                                       │
│    ┌─────────────────────┼─────────────────────┐                 │
│    │                     │                     │                 │
│    ↓                     ↓                     ↓                 │
│  PHASE 1              PHASE 2              PHASE 3               │
│  Workers              Workers              Workers               │
│  (self-gating)        (self-gating)        (self-gating)         │
│    │                     │                     │                 │
│    ↓                     ↓                     ↓                 │
│  Memory publish       Memory publish       Memory publish        │
│    │                     │                     │                 │
│    ↓                     ↓                     ↓                 │
│  Queen reads results  Queen reads results  Queen reads results   │
│  Any blocked?         Any blocked?         Any blocked?          │
│    │ yes                 │ yes                 │ yes             │
│    ↓                     ↓                     ↓                 │
│  Fix agent →          Fix agent →          Fix agent →           │
│  Consensus escalate   Consensus escalate   Consensus escalate    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Key difference from v2.1: No external phase gates. Workers self-gate via Ralph loops.
Queen coordinates phases by reading memory, not by running gate commands.

---

## The Queen Agent

```markdown
You are the QUEEN agent for the [PROJECT] hive-mind.

## YOUR ROLE:
- Break down the objective into phases
- Spawn workers for each phase
- Read results from claude-flow memory after each phase
- Handle blockers with fix agents
- Escalate via hive-mind consensus when fix agents fail

## PROTOCOL:

### 1. INITIALIZE:
```bash
npx claude-flow@v3alpha hooks verify || exit 1
npx claude-flow@v3alpha hive-mind init \
  --topology hierarchical-mesh \
  --consensus raft

npx claude-flow@v3alpha memory store \
  --namespace "hive/queen" \
  --key "plan" \
  --value '[phased plan JSON]'
```

### 2. PHASE 1 (Plan):
- Spawn planning workers (Task tool, parallel, opus)
- Each worker self-gates (Ralph loop)
- Read results: `memory retrieve --namespace "swarm/[worker]" --key "deliverable"`
- Check blockers: `memory list --namespace "swarm/blockers/*"`
- If blocked: spawn fix agent, then consensus escalate if still blocked
- If complete: proceed to Phase 2

### 3. PHASE 2 (Build):
- Spawn implementation workers (Task tool, parallel, opus)
- Each worker self-gates with: tsc --noEmit && npm test
- Read results from memory
- Check blockers, fix if needed
- If complete: proceed to Phase 3

### 4. PHASE 3 (Validate):
- Spawn validation workers (Task tool, parallel, opus)
- Each worker self-gates with: npm test && npm run lint
- Read results from memory
- Check blockers, fix if needed
- If complete: run final validation

### 5. FINAL VALIDATION:
```bash
npx tsc --noEmit && npm test && npm run lint
```

### 6. ESCALATION (when fix agents fail):
```bash
npx claude-flow@v3alpha hive-mind consensus \
  --action propose \
  --type "escalate" \
  --value '{"phase": [N], "blocker": "[description]"}'
```
Store escalation report in memory for human.
```

---

## Worker Agent Template

Workers are the same as swarm agents — self-gating via Ralph loops:

```markdown
You are a WORKER agent in the [PROJECT] hive-mind.

## YOUR ROLE: [SPECIALIZATION]

## PROTOCOL (3-Step + Self-Gating):

### 1. READ assignments:
```bash
npx claude-flow@v3alpha hive-mind join --role worker
npx claude-flow@v3alpha memory retrieve --namespace "hive/queen" --key "plan"
```

### 2. WORK with self-gating:
- [Task 1]
- [Task 2]
- Verify: [VERIFY_CMD]
- Iterate until pass (max 10)
- If blocked after 10: store blocker in memory

### 3. PUBLISH deliverable:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "hive/workers/[ROLE]" \
  --key "deliverable" \
  --value "[RESULT]"

npx claude-flow@v3alpha hive-mind leave
```

Output [ROLE]_COMPLETE or [ROLE]_BLOCKED.
```

---

## Consensus for Decisions

Use raft consensus for coordination decisions:

```bash
# Queen proposes phase transition
npx claude-flow@v3alpha hive-mind consensus \
  --action propose \
  --type "phase-transition" \
  --value '{"from": 1, "to": 2, "blockers_resolved": true}'

# Queen proposes escalation
npx claude-flow@v3alpha hive-mind consensus \
  --action propose \
  --type "escalate" \
  --value '{"phase": 2, "agent": "coder", "attempts": 20}'

# Queen decides
npx claude-flow@v3alpha hive-mind consensus \
  --action decide \
  --proposal-id "[id]"
```

---

## Pre-Built Patterns

### Pattern A: Multi-Phase Feature

```
QUEEN
  │
  ├── PHASE 1: Design
  │   ├── Architect (self-gates: tsc --noEmit)
  │   ├── Researcher (self-gates: findings published)
  │   └── Queen reads memory, checks blockers
  │
  ├── PHASE 2: Build
  │   ├── Backend (self-gates: tsc + test)
  │   ├── Frontend (self-gates: tsc + test)
  │   ├── Tester (self-gates: npm test)
  │   └── Queen reads memory, checks blockers
  │
  └── PHASE 3: Validate
      ├── Reviewer (self-gates: lint)
      ├── Security (self-gates: audit checks)
      ├── Queen reads memory, checks blockers
      └── Final: tsc && test && lint
```

### Pattern B: Research + Implement

```
QUEEN
  │
  ├── RESEARCH PHASE
  │   ├── Pattern Scout (self-gates: findings complete)
  │   ├── API Analyst (self-gates: analysis published)
  │   └── Queen reads memory, checks blockers
  │
  └── IMPLEMENTATION PHASE
      ├── Architect (self-gates: contracts compile)
      ├── Coder (self-gates: tsc + test)
      ├── Tester (self-gates: all tests pass)
      ├── Queen reads memory, checks blockers
      └── Final: tsc && test && lint
```

---

## V3 Hive-Mind Commands

```bash
# Initialize (anti-drift + raft)
npx claude-flow@v3alpha hive-mind init \
  --topology hierarchical-mesh \
  --consensus raft

# Status
npx claude-flow@v3alpha hive-mind status --verbose

# Join/leave
npx claude-flow@v3alpha hive-mind join --role worker
npx claude-flow@v3alpha hive-mind leave

# Broadcast
npx claude-flow@v3alpha hive-mind broadcast --message "[message]"

# Consensus
npx claude-flow@v3alpha hive-mind consensus \
  --action propose --type "[type]" --value "[value]"
npx claude-flow@v3alpha hive-mind consensus \
  --action decide --proposal-id "[id]"

# Memory (for coordination)
npx claude-flow@v3alpha memory store --namespace "hive/..." --key "..." --value "..."
npx claude-flow@v3alpha memory retrieve --namespace "hive/..." --key "..."
npx claude-flow@v3alpha memory list --namespace "hive/..."
npx claude-flow@v3alpha memory search "[query]"
```

---

## Key Differences from v2.1

| v2.1 | v3.0 |
|------|------|
| External phase gates (gate run --phase N) | Workers self-gate, Queen reads memory |
| Gate commands between phases | Queen checks blocker namespace |
| Retry via gate re-run | Fix agents with Ralph loops |
| Custom escalation | Hive-mind consensus |
| Gate definitions in gates.md | Verification commands in agent prompts |

---

**Version**: 3.0 | **Last Updated**: 2026-01-27 | **Track**: B (Progressive)
