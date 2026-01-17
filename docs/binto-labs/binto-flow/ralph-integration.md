---
status: keep
phase: complete
type: guide
version: 2.0
last-updated: 2026-01-17
title: Ralph Integration for Binto-Flow Agents
author: Claude Code + Human Developer
tags: [ralph-wiggum, binto-flow, integration, agents, iteration, v3]
---

# Ralph Integration for Binto-Flow Agents

> **Purpose:** Make each agent iterate until actually done, not just "say done."
> **Prerequisite:** [swarm-templates.md](./swarm-templates.md) for base agent patterns.

---

## The Problem

Current binto-flow agents do **one pass and hope**:

```
Agent spawned → Does work → Says "done" → Maybe actually done (60%)
```

With Ralph integration, agents **loop until verified complete**:

```
Agent spawned → Does work → Verifies → Fails? → Fix → Verify → Pass → Actually done (95%)
```

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ BINTO-FLOW SWARM (unchanged outer structure)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐                  │
│  │ AGENT: Coder         │  │ AGENT: Tester        │                  │
│  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │                  │
│  │ │ RALPH INNER LOOP │ │  │ │ RALPH INNER LOOP │ │                  │
│  │ │                  │ │  │ │                  │ │                  │
│  │ │ while !verified: │ │  │ │ while !verified: │ │                  │
│  │ │   implement      │ │  │ │   write tests    │ │                  │
│  │ │   run tsc        │ │  │ │   run tests      │ │                  │
│  │ │   check errors   │ │  │ │   check coverage │ │                  │
│  │ │   fix if needed  │ │  │ │   fix if needed  │ │                  │
│  │ └──────────────────┘ │  │ └──────────────────┘ │                  │
│  │         ↓            │  │         ↓            │                  │
│  │ <promise>DONE</promise>│  │ <promise>DONE</promise>│                  │
│  └──────────────────────┘  └──────────────────────┘                  │
│                                                                      │
│  Memory coordination unchanged (3-step protocol still applies)       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Option 1: Claude Code Ralph Plugin (Recommended)

If the Ralph plugin is available in Claude Code:

### Agent Prompt Template

```markdown
You are the [AGENT-NAME] agent for the [PROJECT] swarm.

## 🔧 COORDINATION PROTOCOL (3-step)

### 1️⃣ READ context:
```bash
npx claude-flow@v3alpha memory read --namespace "swarm/[PROJECT]" --key "contracts"
```

## 🔁 RALPH LOOP (iterate until done)

Use the Ralph plugin to ensure completion:

```bash
/ralph-loop "
Implement [SPECIFIC DELIVERABLE] following contracts.ts.

VERIFICATION (must ALL pass before done):
- npx tsc --noEmit returns 0 errors
- npm test -- src/[module] all passing
- Files created: [list expected files]

After EACH attempt:
1. Run verification commands
2. If failures: read errors, fix, retry
3. Only output <promise>CODER_COMPLETE</promise> when ALL pass
" --max-iterations 10 --completion-promise "CODER_COMPLETE"
```

### 3️⃣ PUBLISH results:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[AGENT]" \
  --key "deliverable" \
  --value "[summary]"
```

(Hooks handle post-edit and session-end automatically!)
```

---

## Option 2: Prompt-Based Self-Loop (No Plugin Required)

Embed iteration logic directly in the agent prompt:

### Agent Prompt Template

```markdown
You are the [AGENT-NAME] agent for the [PROJECT] swarm.

## 🔧 COORDINATION PROTOCOL (3-step)

### 1️⃣ READ context:
```bash
npx claude-flow@v3alpha memory read --namespace "swarm/[PROJECT]" --key "contracts"
```

## 🔁 ITERATION PROTOCOL (CRITICAL - DO NOT SKIP)

You MUST iterate until verification passes. Do NOT say "done" prematurely.

### Your Task
[SPECIFIC DELIVERABLE DESCRIPTION]

### Verification Commands
```bash
VERIFY_CMD="npx tsc --noEmit && npm test -- src/[module]"
```

### Iteration Loop (execute this pattern)

```
ITERATION 1:
  1. Implement the task
  2. Run: $VERIFY_CMD
  3. Check output for errors

  If errors exist:
    - Read each error carefully
    - Fix the root cause (not symptoms)
    - Go to ITERATION 2

  If no errors:
    - Output: <promise>[AGENT]_COMPLETE</promise>
    - Proceed to publish results

ITERATION 2-N:
  1. Review previous errors
  2. Apply fixes
  3. Run: $VERIFY_CMD
  4. Repeat until pass or max iterations

MAX ITERATIONS: 10
If still failing after 10 iterations:
  - Document what's blocking
  - Store blocker in memory for Queen/human
  - Output: <blocker>[AGENT]_BLOCKED</blocker>
```

### Completion Criteria (ALL must be true)
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `npm test -- src/[module]` all tests pass
- [ ] Expected files exist: [list files]

⚠️ Do NOT output the completion promise until you have RUN the verification
and confirmed it passes. "I think it works" is NOT verification.

### 3️⃣ PUBLISH results:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[AGENT]" \
  --key "deliverable" \
  --value "[summary]"
```

(Hooks handle post-edit and session-end automatically!)
```

---

## Option 3: AGENTS.md + Verification Script

Create project-level files that all agents reference:

### `AGENTS.md` (in project root)

```markdown
# Agent Operations Guide

## Build Commands
- Build: `npm run build`
- Typecheck: `npx tsc --noEmit`
- Test: `npm test`
- Lint: `npm run lint`

## Verification Protocol

ALL agents must verify before claiming completion:

### Coder Verification
```bash
npx tsc --noEmit && npm test -- src/
```

### Tester Verification
```bash
npm test && npm run coverage -- --threshold 80
```

### Reviewer Verification
```bash
npm run lint && npm run type-check && npm test
```

## Iteration Pattern

1. Attempt task
2. Run verification command for your role
3. If exit code != 0: fix and retry
4. Max 10 iterations before escalating
5. Only claim done when verification passes
```

### Agent Prompt (references AGENTS.md)

```markdown
You are the [AGENT-NAME] agent.

## CRITICAL: Read AGENTS.md First

Before starting, read ./AGENTS.md for:
- Verification commands for your role
- Iteration pattern you MUST follow
- Completion criteria

## Your Task

[TASK DESCRIPTION]

## Protocol (3-step)

1️⃣ READ: Check contracts from architect
2️⃣ WORK: Implement with Ralph iteration loop from AGENTS.md
3️⃣ PUBLISH: Store results in memory

Only output <promise>[AGENT]_COMPLETE</promise> after:
1. Running verification command from AGENTS.md
2. Confirming 0 errors/failures
3. All expected files exist
```

---

## Complete Example: Ralph-Enhanced Coder Agent

```markdown
You are the CODER agent for the auth-feature swarm.

## 🔧 COORDINATION (3-step protocol)

### 1️⃣ READ contracts:
```bash
# Wait for architect
while ! npx claude-flow@v3alpha memory read \
  --namespace "swarm/architect" \
  --key "contracts"; do
  sleep 10
done
```

## 🔁 RALPH ITERATION LOOP

### Task
Implement authentication module per contracts.ts:
- src/auth/login.ts - Login endpoint
- src/auth/register.ts - Registration endpoint
- src/auth/middleware.ts - JWT validation middleware

### Verification Command
```bash
VERIFY="npx tsc --noEmit && npm test -- src/auth/"
```

### Loop Pattern
```
ATTEMPT 1:
  → Create src/auth/login.ts with login logic
  → Create src/auth/register.ts with registration
  → Create src/auth/middleware.ts with JWT validation
  → Run: npx tsc --noEmit && npm test -- src/auth/
  → Check results...

IF ERRORS:
  → Read TypeScript errors carefully
  → Fix type mismatches with contracts.ts
  → Run verification again
  → Repeat until pass

IF TESTS FAIL:
  → Read test output
  → Fix implementation to match expected behavior
  → Run verification again
  → Repeat until pass
```

### Max Iterations: 10

If still failing after 10 attempts:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/coder" \
  --key "blocker" \
  --value '{"issue": "[description]", "attempts": 10, "last_error": "[error]"}'
```
Output: <blocker>CODER_BLOCKED</blocker>

### Completion Criteria (ALL required)
- [ ] `npx tsc --noEmit` → exit code 0
- [ ] `npm test -- src/auth/` → all passing
- [ ] Files exist: login.ts, register.ts, middleware.ts

Only when ALL pass, output: <promise>CODER_COMPLETE</promise>

### 3️⃣ PUBLISH (after completion promise)
```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/coder" \
  --key "auth-module" \
  --value "Implemented: login, register, middleware. Tests passing."
```

(Hooks handle post-edit and session-end automatically!)
```

---

## Swarm Spawn with Ralph Agents

When spawning the swarm, each agent gets Ralph-enhanced prompt:

```javascript
// Single message with all Ralph-enhanced agents
[
  Task('Architect', '[3-step + publishes contracts]', 'system-architect'),
  Task('Coder', '[3-step + Ralph loop + CODER_COMPLETE promise]', 'coder'),
  Task('Tester', '[3-step + Ralph loop + TESTER_COMPLETE promise]', 'tester'),
  Task('Reviewer', '[3-step + Ralph loop + REVIEWER_COMPLETE promise]', 'reviewer'),
]
```

---

## Completion Promise Reference

| Agent | Promise | Blocker |
|-------|---------|---------|
| Architect | `<promise>ARCHITECT_COMPLETE</promise>` | `<blocker>ARCHITECT_BLOCKED</blocker>` |
| Coder | `<promise>CODER_COMPLETE</promise>` | `<blocker>CODER_BLOCKED</blocker>` |
| Tester | `<promise>TESTER_COMPLETE</promise>` | `<blocker>TESTER_BLOCKED</blocker>` |
| Reviewer | `<promise>REVIEWER_COMPLETE</promise>` | `<blocker>REVIEWER_BLOCKED</blocker>` |

---

## Expected Improvement

| Metric | Without Ralph | With Ralph |
|--------|---------------|------------|
| First-pass completion | ~60% | ~95% |
| Manual cleanup needed | Always | Rarely |
| Agent-reported "done" accuracy | Low | High |
| Post-swarm CI failures | Common | Uncommon |

---

## Integration Checklist

- [ ] Choose integration option (Plugin, Prompt-based, or AGENTS.md)
- [ ] Update agent templates with Ralph loop pattern
- [ ] Define completion promises for each agent type
- [ ] Set appropriate max-iterations (10 is good default)
- [ ] Add blocker handling for stuck agents
- [ ] Test with simple swarm first

---

## Sources

- [ghuntley/how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum) - Original methodology
- [anthropics/claude-code/plugins/ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) - Official Claude Code plugin

---

**Version**: 2.0 | **Last Updated**: 2026-01-17

