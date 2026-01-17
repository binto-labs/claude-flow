---
status: keep
phase: complete
type: reference
version: 2.0
last-updated: 2026-01-17
title: Hive-Mind Templates (Binto-Flow V3)
author: Claude Code + Human Developer
tags: [hive-mind, queen, swarm, multi-phase, v3, binto-flow]
---

# Hive-Mind Templates (Binto-Flow V3)

> **When to use Hive-Mind:** 7+ agents, uncertain scope, multi-phase projects
> **For simpler swarms (3-6 agents):** [swarm-templates.md](./swarm-templates.md)
> **For workflow decisions:** [workflow.md](./workflow.md)

---

## What Is Hive-Mind?

Hive-Mind is a **Queen-coordinated** swarm pattern where:

1. **Queen** = Strategic coordinator that breaks down work, assigns agents, handles adaptation
2. **Workers** = Specialized agents that execute tasks and report back
3. **Collective Memory** = Shared context via memory namespace

**Use when:**
- Scope is uncertain and may change during execution
- 7+ agents needed
- Work has multiple phases that depend on each other
- Strategic decisions needed mid-execution

---

## Hive-Mind Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HIVE-MIND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      ┌─────────────┐                             │
│                      │   QUEEN     │                             │
│                      │ Coordinator │                             │
│                      └──────┬──────┘                             │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐                │
│         │                   │                   │                │
│    ┌────┴────┐        ┌─────┴─────┐       ┌────┴────┐            │
│    │ Phase 1 │        │  Phase 2  │       │ Phase 3 │            │
│    │ Workers │   ──▶  │  Workers  │  ──▶  │ Workers │            │
│    └────┬────┘        └─────┬─────┘       └────┬────┘            │
│         │                   │                  │                 │
│         └───────────────────┴──────────────────┘                 │
│                             │                                    │
│                    ┌────────┴────────┐                           │
│                    │ Collective      │                           │
│                    │ Memory          │                           │
│                    └─────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Queen Agent

**The Queen coordinates everything:**

```markdown
You are the QUEEN agent for the [PROJECT] hive-mind.

## YOUR ROLE:
- Break down the objective into phases
- Assign workers to each phase
- Monitor progress via memory
- Adapt strategy based on results
- Make decisions when workers are blocked

## PROTOCOL (3-Step + Coordination):

### 1️⃣ READ & INITIALIZE:
```bash
# Initialize hive
npx claude-flow@v3alpha hive-mind init --topology mesh
```

### 2️⃣ STRATEGIC WORK:
- Analyze the objective
- Break into phases with clear deliverables
- Identify dependencies between phases
- Store plan in memory:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "hive/queen" \
  --key "plan" \
  --value '{"phases": [...], "workers": [...], "quality_gates": [...]}'
```

### MONITORING:
```bash
# Check worker progress
npx claude-flow@v3alpha memory list --namespace "hive/workers/*"

# Broadcast instructions
npx claude-flow@v3alpha hive-mind broadcast --message "[instruction]"
```

### ADAPTATION:
If workers encounter blockers:
- Read their memory reports
- Make strategic decisions
- Update plan in memory
- Notify affected workers

### 3️⃣ PUBLISH completion status:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "hive/queen" \
  --key "status" \
  --value '{"phase": "complete", "results": [...]}'
```

(Session end handled automatically by hooks!)
```

---

## Worker Agent Template

```markdown
You are a WORKER agent in the [PROJECT] hive-mind.

## YOUR ROLE: [SPECIALIZATION]
- Report to the Queen
- Execute assigned tasks
- Coordinate with other workers via memory
- Escalate blockers to Queen

## PROTOCOL (3-Step):

### 1️⃣ READ assignments:
```bash
# Join hive
npx claude-flow@v3alpha hive-mind join --role worker

# Get Queen's plan
npx claude-flow@v3alpha memory read --namespace "hive/queen" --key "plan"

# Get your specific assignment
npx claude-flow@v3alpha memory read --namespace "hive/workers/[ROLE]" --key "assignment"
```

### 2️⃣ EXECUTE TASKS:
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

(Hooks handle post-edit automatically on every file operation!)

### PROGRESS REPORTING (during work):
```bash
# After each significant milestone
npx claude-flow@v3alpha memory store \
  --namespace "hive/workers/[ROLE]" \
  --key "progress" \
  --value '{"status": "in_progress", "completed": [...], "blockers": [...]}'

npx claude-flow@v3alpha hooks notify --message "[ROLE]: [progress update]"
```

### BLOCKER ESCALATION (if needed):
```bash
npx claude-flow@v3alpha memory store \
  --namespace "hive/workers/[ROLE]" \
  --key "blocker" \
  --value '{"issue": "...", "need": "...", "suggestion": "..."}'

npx claude-flow@v3alpha hive-mind consensus --action propose \
  --type "blocker-resolution" \
  --value '{"from": "[ROLE]", "issue": "..."}'
```

### 3️⃣ PUBLISH deliverable:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "hive/workers/[ROLE]" \
  --key "deliverable" \
  --value "[RESULT]"

npx claude-flow@v3alpha hive-mind leave
```

(Session end handled automatically by hooks!)
```

---

## Pre-Built Hive-Mind Patterns

### Pattern A: Multi-Phase Feature

```
┌─────────────────────────────────────────────────────────────────┐
│ MULTI-PHASE HIVE-MIND                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        QUEEN                                     │
│                          │                                       │
│    ┌─────────────────────┼─────────────────────┐                 │
│    │                     │                     │                 │
│    ↓                     ↓                     ↓                 │
│  PHASE 1              PHASE 2              PHASE 3               │
│  ┌──────┐             ┌──────┐             ┌──────┐              │
│  │Arch  │             │API   │             │Review│              │
│  │Design│    ──▶      │UI    │    ──▶      │Test  │              │
│  │Spec  │             │DB    │             │Secure│              │
│  └──────┘             └──────┘             └──────┘              │
│                                                                  │
│  Deliverable:         Deliverable:         Deliverable:          │
│  contracts.ts         implementation       validated PR          │
│  decisions.md         tests                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern B: Research + Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│ RESEARCH → IMPLEMENT HIVE-MIND                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        QUEEN                                     │
│                          │                                       │
│         ┌────────────────┴────────────────┐                      │
│         ↓                                 ↓                      │
│    RESEARCH PHASE                  IMPLEMENTATION PHASE          │
│    ┌───────────────┐               ┌───────────────┐             │
│    │ Pattern Scout │               │ Architect     │             │
│    │ API Analyst   │    ──▶        │ Coder         │             │
│    │ Security Audit│               │ Tester        │             │
│    └───────────────┘               │ Reviewer      │             │
│                                    └───────────────┘             │
│    Deliverable:                    Deliverable:                  │
│    research_report.md              working feature               │
│    recommendations                 + tests                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern C: Exploratory (Uncertain Scope)

```
┌─────────────────────────────────────────────────────────────────┐
│ EXPLORATORY HIVE-MIND                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        QUEEN                                     │
│                    (adaptive strategy)                           │
│                          │                                       │
│         ┌────────────────┼────────────────┐                      │
│         ↓                ↓                ↓                      │
│     SCOUT 1          SCOUT 2          SCOUT 3                    │
│   (explore A)      (explore B)      (explore C)                  │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                          │                                       │
│                    QUEEN DECISION:                               │
│                    "Path B looks best"                           │
│                          │                                       │
│                          ↓                                       │
│                 IMPLEMENTATION WORKERS                           │
│                 (based on Scout 2 findings)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Hive-Mind Spawn Prompt

```markdown
# [PROJECT] Hive-Mind

## OBJECTIVE:
[Describe the goal]

## AGENTS (spawn in ONE message):

### QUEEN (unified-coordinator)
Role: Strategic coordination
- Break objective into phases
- Assign workers
- Monitor progress via memory
- Handle blockers and adaptation
- Make strategic decisions
Protocol: Full Queen template from ./hive-mind-templates.md

### PHASE 1 WORKERS:

#### Architect (system-architect)
Role: Design and contracts
Wait for: Queen's plan
Deliver: contracts.ts, decisions.md
Protocol: 3-step worker template, report to Queen

#### Researcher (researcher)
Role: Pattern discovery
Wait for: Queen's plan
Deliver: research_report.md
Protocol: 3-step worker template, report to Queen

### PHASE 2 WORKERS:

#### Backend Developer (backend-dev)
Role: API implementation
Wait for: Architect contracts, Queen signal
Deliver: src/api/*
Protocol: 3-step worker template, report to Queen

#### Frontend Developer (coder)
Role: UI implementation
Wait for: Architect contracts, Queen signal
Deliver: src/ui/*
Protocol: 3-step worker template, report to Queen

#### TDD Developer (tdd-london-swarm)
Role: Test implementation
Wait for: Architect contracts
Deliver: tests/*
Protocol: 3-step worker template, report to Queen

### PHASE 3 WORKERS:

#### Reviewer (reviewer)
Role: Quality validation
Wait for: All implementation complete
Deliver: approval or fix requests
Protocol: 3-step worker template, report to Queen

#### Security Auditor (security-architect)
Role: Security review
Wait for: All implementation complete
Deliver: security_report.md
Protocol: 3-step worker template, report to Queen

## QUALITY GATES:
- TypeScript: 0 errors
- Tests: 100% passing, 90% coverage
- ESLint: 0 errors
- Security: No high/critical findings

## MEMORY NAMESPACE:
hive/[PROJECT]/

## PROTOCOL:
- All agents use 3-step protocol
- All @v3alpha commands
- Single-message spawning
- Queen coordinates phases
- Workers report progress to memory
```

---

## V3 Hive-Mind Commands

```bash
# Initialize hive
npx claude-flow@v3alpha hive-mind init --topology mesh

# Check hive status
npx claude-flow@v3alpha hive-mind status --verbose

# Join hive as worker
npx claude-flow@v3alpha hive-mind join --role worker

# Leave hive
npx claude-flow@v3alpha hive-mind leave

# Broadcast message to all
npx claude-flow@v3alpha hive-mind broadcast --message "..."

# Consensus voting
npx claude-flow@v3alpha hive-mind consensus --action propose --type "decision" --value "..."
npx claude-flow@v3alpha hive-mind consensus --action vote --proposal-id "..." --vote true

# Shared memory
npx claude-flow@v3alpha hive-mind memory --action set --key "..." --value "..."
npx claude-flow@v3alpha hive-mind memory --action get --key "..."
```

---

## When to Use Hive-Mind vs Swarm

| Scenario | Use |
|----------|-----|
| Well-defined feature, 3-6 agents | **Swarm** |
| Multi-phase with dependencies | **Hive-Mind** |
| Scope may change during work | **Hive-Mind** |
| 7+ agents | **Hive-Mind** |
| Need strategic adaptation | **Hive-Mind** |
| One-shot parallel execution | **Swarm** |

---

**Version**: 2.0 | **Last Updated**: 2026-01-17

