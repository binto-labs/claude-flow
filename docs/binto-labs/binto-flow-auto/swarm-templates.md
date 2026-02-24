---
status: keep
phase: complete
type: reference
version: 3.0
last-updated: 2026-01-27
title: Swarm Templates (Binto-Flow-Auto)
author: Claude Code + Human Developer
tags: [swarm, templates, agents, v3, binto-flow, automation, claude-flow, memory, hooks]
---

# Swarm Templates (Binto-Flow-Auto)

> **Track B: Progressive** - Continuous validation using claude-flow primitives
> For workflow: [workflow.md](./workflow.md)
> For gating: [continuous-gating.md](./continuous-gating.md)
> For escalation: [escalation.md](./escalation.md)
> For hive-mind (7+ agents): [hive-mind-templates.md](./hive-mind-templates.md)

---

## Anti-Drift Default Configuration (REQUIRED)

```bash
# Pre-flight check (fails loudly)
npx claude-flow@v3alpha hooks verify || exit 1

# Initialize with anti-drift config
npx claude-flow@v3alpha swarm init \
  --topology hierarchical \
  --strategy specialized

# Route task for agent recommendations
npx claude-flow@v3alpha route task "[OBJECTIVE]"

# Store plan in memory for all agents
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[PROJECT]" \
  --key "plan" \
  --value '[plan JSON]'
```

---

## The 3-Step Protocol (V3) + Self-Gating

Each agent follows the 3-step protocol with embedded Ralph iteration:

```markdown
## PROTOCOL

### 1. READ context from claude-flow memory:
npx claude-flow@v3alpha memory retrieve --namespace "swarm/[PROJECT]" --key "plan"

### 2. WORK with self-gating (Ralph loop):
- Implement task
- Run verification: [VERIFY_CMD]
- If errors: fix and re-verify (max 10 iterations)
- If pass: continue to PUBLISH
- If blocked after 10 iterations: store blocker and exit

### 3. PUBLISH results to claude-flow memory:
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[AGENT]" \
  --key "[DELIVERABLE]" \
  --value "[RESULT]"
```

---

## Complete Agent Prompt Template

```markdown
You are the [AGENT-NAME] agent for the [PROJECT] swarm.

## YOUR ROLE: [SPECIALIZATION]

## PROTOCOL

### 1. READ context:
```bash
npx claude-flow@v3alpha memory retrieve \
  --namespace "swarm/[PROJECT]" --key "plan"
```

### 2. WORK with self-gating:

#### Task
[SPECIFIC DELIVERABLE DESCRIPTION]

#### Verification Command
```bash
VERIFY="[tsc --noEmit && npm test -- src/[module]]"
```

#### Iteration Loop
1. Implement the task
2. Run: $VERIFY
3. Check output for errors

If errors exist:
  - Read each error carefully
  - Fix the root cause (not symptoms)
  - Run: $VERIFY again
  - Repeat until pass

If no errors:
  - Output: [AGENT]_COMPLETE
  - Proceed to PUBLISH step

MAX ITERATIONS: 10

If still failing after 10 iterations:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/blockers" \
  --key "[AGENT]" \
  --value '{"issue": "[description]", "attempts": 10, "last_error": "[error]"}'
```
  Output: [AGENT]_BLOCKED

Do NOT output [AGENT]_COMPLETE until you have RUN the verification
and confirmed it passes.

### 3. PUBLISH results:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[AGENT]" \
  --key "[DELIVERABLE]" \
  --value "[summary]"
```
```

---

## Dependency Wait Pattern (With Timeout)

Agents waiting for another agent's output:

```bash
MAX_WAIT=60
WAIT_COUNT=0

while ! npx claude-flow@v3alpha memory retrieve \
  --namespace "swarm/architect" \
  --key "contracts"; do

  WAIT_COUNT=$((WAIT_COUNT + 1))

  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    npx claude-flow@v3alpha memory store \
      --namespace "swarm/blockers" \
      --key "[AGENT]" \
      --value '{"issue": "Dependency timeout waiting for architect/contracts"}'
    exit 1
  fi

  sleep 10
done
```

---

## V3 Agent Types

| Agent Type | Model | Purpose |
|------------|-------|---------|
| `system-architect` | opus | Design, contracts |
| `coder` | opus | Implementation |
| `tester` | opus | Quality tests |
| `reviewer` | opus | Validation |
| `security-architect` | opus | Security review |
| `hierarchical-coordinator` | opus | Anti-drift coordination |

**All agents use opus.** Quality over cost.

---

## Spawning (Single Message, Parallel)

All agents spawned in ONE message with opus model:

```javascript
[
  Task({
    description: 'Architect',
    prompt: `You are the ARCHITECT agent for the [PROJECT] swarm.

## PROTOCOL

### 1. READ:
npx claude-flow@v3alpha memory retrieve --namespace "swarm/[PROJECT]" --key "plan"

### 2. WORK (self-gating):
Design contracts for [OBJECTIVE].
Verify: npx tsc --noEmit
Iterate until contracts compile (max 10).

### 3. PUBLISH:
npx claude-flow@v3alpha memory store \\
  --namespace "swarm/architect" --key "contracts" --value "[contracts summary]"

Output ARCHITECT_COMPLETE or ARCHITECT_BLOCKED.`,
    subagent_type: 'system-architect',
    model: 'opus'
  }),
  Task({
    description: 'Coder',
    prompt: `You are the CODER agent for the [PROJECT] swarm.

## PROTOCOL

### 1. READ (with dependency wait):
Wait for: npx claude-flow@v3alpha memory retrieve --namespace "swarm/architect" --key "contracts"
Timeout: 60 checks x 10s = 10 minutes. Store blocker if timeout.

### 2. WORK (self-gating):
Implement [OBJECTIVE] per contracts.
Verify: npx tsc --noEmit && npm test -- src/[module]
Iterate until pass (max 10).

### 3. PUBLISH:
npx claude-flow@v3alpha memory store \\
  --namespace "swarm/coder" --key "implementation" --value "[summary]"

Output CODER_COMPLETE or CODER_BLOCKED.`,
    subagent_type: 'coder',
    model: 'opus'
  }),
  Task({
    description: 'Tester',
    prompt: `You are the TESTER agent for the [PROJECT] swarm.

## PROTOCOL

### 1. READ (with dependency wait):
Wait for: npx claude-flow@v3alpha memory retrieve --namespace "swarm/architect" --key "contracts"
Timeout: 60 checks x 10s = 10 minutes.

### 2. WORK (self-gating):
Write tests for [OBJECTIVE] per contracts.
Verify: npm test
Iterate until all tests pass (max 10).

### 3. PUBLISH:
npx claude-flow@v3alpha memory store \\
  --namespace "swarm/tester" --key "tests" --value "[summary]"

Output TESTER_COMPLETE or TESTER_BLOCKED.`,
    subagent_type: 'tester',
    model: 'opus'
  }),
  Task({
    description: 'Reviewer',
    prompt: `You are the REVIEWER agent for the [PROJECT] swarm.

## PROTOCOL

### 1. READ (with dependency wait):
Wait for: npx claude-flow@v3alpha memory retrieve --namespace "swarm/coder" --key "implementation"
Timeout: 60 checks x 10s = 10 minutes.

### 2. WORK (self-gating):
Review implementation for lint errors.
Verify: npm run lint
Iterate until clean (max 10).

### 3. PUBLISH:
npx claude-flow@v3alpha memory store \\
  --namespace "swarm/reviewer" --key "review" --value "[summary]"

Output REVIEWER_COMPLETE or REVIEWER_BLOCKED.`,
    subagent_type: 'reviewer',
    model: 'opus'
  })
]
```

---

## Fix Agent Templates

When agents are blocked or final validation fails:

### TypeScript Fix

```javascript
Task({
  description: 'TS Fixer',
  prompt: `Fix these TypeScript errors:
${errors}

ONLY fix errors listed. Do NOT refactor.
Verify: npx tsc --noEmit
Iterate until pass (max 10).

Publish result:
npx claude-flow@v3alpha memory store \\
  --namespace "swarm/fixes" --key "ts-fix" --value "[summary]"`,
  subagent_type: 'coder',
  model: 'opus'
})
```

### Test Fix

```javascript
Task({
  description: 'Test Fixer',
  prompt: `Fix these test failures:
${failures}

ONLY fix failing tests. Do NOT add tests.
Verify: npm test
Iterate until pass (max 10).

Publish result:
npx claude-flow@v3alpha memory store \\
  --namespace "swarm/fixes" --key "test-fix" --value "[summary]"`,
  subagent_type: 'tester',
  model: 'opus'
})
```

---

## Pre-Built Patterns

### Pattern A: Feature Development

```
INIT: swarm init + route task + memory store plan

SPAWN (parallel):
  Architect → contracts (self-gating: tsc)
  Coder → implementation (waits for contracts, self-gating: tsc + test)
  Tester → tests (waits for contracts, self-gating: test)
  Reviewer → review (waits for implementation, self-gating: lint)

HANDLE: Check blockers in memory, spawn fix agents if needed

FINAL: tsc --noEmit && npm test && npm run lint
```

### Pattern B: Bug Fix

```
INIT: swarm init + route task + memory store plan

SPAWN (parallel):
  Analyst → root cause (self-gating: reproduces bug)
  Fixer → implementation (waits for analysis, self-gating: tsc + test)
  Test Writer → regression tests (waits for analysis, self-gating: test)

HANDLE: Check blockers, fix agents if needed

FINAL: tsc --noEmit && npm test && npm run lint
```

---

## Completion Promises

| Agent | Complete | Blocked |
|-------|----------|---------|
| Architect | `ARCHITECT_COMPLETE` | `ARCHITECT_BLOCKED` |
| Coder | `CODER_COMPLETE` | `CODER_BLOCKED` |
| Tester | `TESTER_COMPLETE` | `TESTER_BLOCKED` |
| Reviewer | `REVIEWER_COMPLETE` | `REVIEWER_BLOCKED` |

---

**Version**: 3.0 | **Last Updated**: 2026-01-27 | **Track**: B (Progressive)
