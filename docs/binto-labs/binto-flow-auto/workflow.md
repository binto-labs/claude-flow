---
status: keep
phase: complete
type: guide
version: 3.0
last-updated: 2026-01-27
title: Workflow Guide (Binto-Flow-Auto)
author: Claude Code + Human Developer
tags: [workflow, automation, claude-flow, hooks, memory, consensus, v3, binto-flow]
---

# Workflow Guide (Binto-Flow-Auto)

> **Track B: Progressive** - Continuous validation using claude-flow primitives
> For templates: [swarm-templates.md](./swarm-templates.md) | [hive-mind-templates.md](./hive-mind-templates.md)
> For gating: [continuous-gating.md](./continuous-gating.md)
> For escalation: [escalation.md](./escalation.md)

---

## Pre-Flight Check (REQUIRED - Fails Loudly)

```bash
npx claude-flow@v3alpha hooks verify || {
  echo "FATAL: Hooks misconfigured. Refusing to proceed."
  echo "Run: npx claude-flow@v3alpha init --force"
  exit 1
}
```

**Track B requires working hooks.** No silent degradation.

---

## End-to-End Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: INITIALIZE                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  hooks verify ──→ swarm init ──→ route task                      │
│                                                                  │
│  Sets up: topology, memory namespaces, agent recommendations     │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: SPAWN AGENTS (single message, parallel)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Task(Architect) ──→ reads nothing, publishes contracts           │
│  Task(Coder)     ──→ reads contracts, publishes implementation    │
│  Task(Tester)    ──→ reads contracts, publishes tests             │
│  Task(Reviewer)  ──→ reads implementation, publishes review       │
│                                                                  │
│  Each agent:                                                     │
│    1. claude-flow memory retrieve (dependencies)                     │
│    2. Work + verify + iterate (Ralph loop)                       │
│    3. claude-flow memory store (results)                         │
│    4. Output COMPLETE or BLOCKED                                 │
│                                                                  │
│  PostToolUse hooks fire automatically on every edit:             │
│    - Memory updated                                              │
│    - Patterns trained                                            │
│    - Checkpoints created                                         │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: HANDLE RESULTS                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  All COMPLETE? ──→ Final validation ──→ Done                     │
│                                                                  │
│  Any BLOCKED?  ──→ Read blocker from memory                      │
│                    ──→ Spawn targeted fix agent                   │
│                    ──→ Fix agent self-gates (Ralph loop)          │
│                    ──→ Still blocked? ──→ Consensus escalation    │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: FINAL VALIDATION                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Run in main context:                                            │
│    npx tsc --noEmit && npm test && npm run lint                  │
│                                                                  │
│  Pass? ──→ Store learnings ──→ Complete                          │
│  Fail? ──→ Spawn fix agent ──→ Retry (max 3) ──→ Escalate       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Initialize

```bash
# Pre-flight
npx claude-flow@v3alpha hooks verify || exit 1

# Set up swarm coordination
npx claude-flow@v3alpha swarm init \
  --topology hierarchical \
  --strategy specialized

# Get agent recommendations for the task
npx claude-flow@v3alpha route task "[OBJECTIVE]"

# Store the plan in memory for all agents to read
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[PROJECT]" \
  --key "plan" \
  --value '{"objective": "[OBJECTIVE]", "agents": [...], "gates": [...]}'
```

---

## Step 2: Spawn Agents

All agents spawned in a **single message** for parallel execution:

```javascript
// Single message with all agents (opus model)
[
  Task({
    description: 'Architect',
    prompt: `[3-step protocol + Ralph loop]
      1. READ: memory retrieve --namespace "swarm/[PROJECT]" --key "plan"
      2. WORK: Design contracts. Verify: tsc --noEmit. Iterate until pass.
      3. PUBLISH: memory store --namespace "swarm/architect" --key "contracts"`,
    subagent_type: 'system-architect',
    model: 'opus'
  }),
  Task({
    description: 'Coder',
    prompt: `[3-step protocol + Ralph loop + dependency wait]
      1. READ: Wait for "swarm/architect/contracts", then read plan
      2. WORK: Implement. Verify: tsc --noEmit && npm test. Iterate max 10.
      3. PUBLISH: memory store --namespace "swarm/coder" --key "implementation"`,
    subagent_type: 'coder',
    model: 'opus'
  }),
  Task({
    description: 'Tester',
    prompt: `[3-step protocol + Ralph loop + dependency wait]
      1. READ: Wait for "swarm/architect/contracts", then read plan
      2. WORK: Write tests. Verify: npm test. Iterate max 10.
      3. PUBLISH: memory store --namespace "swarm/tester" --key "tests"`,
    subagent_type: 'tester',
    model: 'opus'
  }),
  Task({
    description: 'Reviewer',
    prompt: `[3-step protocol + Ralph loop + dependency wait]
      1. READ: Wait for "swarm/coder/implementation"
      2. WORK: Review. Verify: npm run lint. Iterate max 10.
      3. PUBLISH: memory store --namespace "swarm/reviewer" --key "review"`,
    subagent_type: 'reviewer',
    model: 'opus'
  })
]
```

Each agent's prompt includes:
- **Claude-flow memory** commands for reading dependencies and publishing results
- **Ralph iteration loop** with verification commands and max iterations
- **Blocker reporting** via memory if stuck after max iterations
- **Dependency wait** with timeout for cross-agent coordination

---

## Step 3: Handle Results

When agents return, check for blockers:

```bash
# Check if any agent reported a blocker
npx claude-flow@v3alpha memory retrieve \
  --namespace "swarm/blockers" --key "*"
```

### If blocked: spawn targeted fix agent

```javascript
// Read the specific blocker
const blocker = await exec(
  'npx claude-flow@v3alpha memory retrieve --namespace "swarm/blockers" --key "coder"'
);

// Spawn fix agent with blocker context
Task({
  description: 'Fix Agent',
  prompt: `Fix this specific issue:
    ${blocker}
    ONLY fix the issue described. Do NOT refactor.
    Verify: tsc --noEmit && npm test
    Iterate until pass (max 10).`,
  subagent_type: 'coder',
  model: 'opus'
})
```

### If still blocked: consensus escalation

```bash
npx claude-flow@v3alpha hive-mind consensus \
  --action propose \
  --type "escalate" \
  --value '{"blocker": "coder", "attempts": 10, "error": "[last error]"}'
```

See [escalation.md](./escalation.md) for the full protocol.

---

## Step 4: Final Validation

After all agents complete, run validation in the main context:

```bash
# Final gate — same commands agents used, run from main context
npx tsc --noEmit && npm test && npm run lint
```

### If final validation fails

```javascript
// Parse errors and spawn targeted fix agent
Task({
  description: 'Final Fixer',
  prompt: `Fix these errors from final validation:
    ${errors}
    ONLY fix errors listed. Run: tsc --noEmit && npm test && npm run lint`,
  subagent_type: 'coder',
  model: 'opus'
})

// Retry final validation (max 3 attempts)
```

### On success

```bash
# Store learnings for future swarms
npx claude-flow@v3alpha memory store \
  --namespace "patterns/success" \
  --key "$(date +%Y%m%d)-[project]" \
  --value '{"objective": "...", "agents": [...], "duration": "...", "retries": 0}'
```

---

## Dependency Wait Pattern (With Timeout)

Agents waiting for dependencies use this bounded pattern:

```bash
MAX_WAIT=60
WAIT_COUNT=0

while ! npx claude-flow@v3alpha memory retrieve \
  --namespace "swarm/architect" \
  --key "contracts"; do

  WAIT_COUNT=$((WAIT_COUNT + 1))

  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    # Store blocker and exit
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

## Model Routing (Opus-First)

All agents use opus by default:

| Model | When |
|-------|------|
| opus | Default for all agents |
| sonnet | Explicit cost-saving mode only |
| haiku | Only Agent Booster transforms |

---

## Key Differences from Phase-Gate Design

| Old design (v2.1) | New design (v3.0) |
|----|-----|
| 3 phase-boundary gates | Continuous self-gating per agent |
| External gate runner | Agents run their own verification |
| Daemon workers for intelligence | PostToolUse hooks (already running) |
| Custom escalation protocol | Hive-mind consensus |
| Pseudo-JavaScript gate definitions | Bash commands in agent prompts |
| Queen agent coordinates phases | Task tool returns handle results |

---

**Version**: 3.0 | **Last Updated**: 2026-01-27 | **Track**: B (Progressive)
