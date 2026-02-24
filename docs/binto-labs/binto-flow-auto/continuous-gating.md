---
status: keep
phase: complete
type: reference
version: 3.0
last-updated: 2026-01-27
title: Continuous Gating (Binto-Flow-Auto)
author: Claude Code + Human Developer
tags: [gating, validation, hooks, self-gating, ralph, claude-flow, v3, binto-flow]
---

# Continuous Gating (Binto-Flow-Auto)

> **Replaces:** gates.md (v2.1 phase-boundary gates)
> **Key change:** Gates move from phase boundaries into agents and hooks
> **Principle:** Gates check **facts**, not **opinions**

---

## Why Continuous Over Phase-Boundary?

The v2.1 design ran gates between phases (Plan → Gate 1 → Build → Gate 2 → Validate → Gate 3).
This had two problems:

1. **Errors caught late.** A type error introduced in the first file edit wasn't caught until
   the entire build phase completed.
2. **Depended on broken infrastructure.** Phase gates relied on daemon workers (audit, testgaps)
   that have 100% failure rates.

Continuous gating catches errors **per edit** (via hooks) and **per agent** (via Ralph loops),
using only working claude-flow primitives.

---

## Three Layers of Gating

```
LAYER 1: HOOK-BASED (automatic, every edit)
  PostToolUse fires on Write/Edit/MultiEdit
  ├── Memory update (claude-flow hooks post-edit)
  ├── Pattern training (--train-patterns true)
  └── Checkpoint (auto-commit)

LAYER 2: AGENT SELF-GATING (per agent, Ralph loop)
  Agent runs verification commands after implementation
  ├── tsc --noEmit (TypeScript)
  ├── npm test -- src/[module] (tests)
  ├── npm run lint (lint)
  └── Iterate until pass or max iterations

LAYER 3: FINAL VALIDATION (once, after all agents complete)
  Main context runs full validation suite
  ├── tsc --noEmit (full project)
  ├── npm test (all tests)
  ├── npm run lint (full lint)
  └── Spawn fix agent if needed, retry max 3
```

---

## Layer 1: Hook-Based Gating

Already configured in `.claude/settings.json`. Fires automatically on every file operation:

```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write|MultiEdit",
    "hooks": [
      {
        "command": "npx claude-flow@v3alpha hooks post-edit --file $FILE --train-patterns true"
      }
    ]
  }]
}
```

**What this does:**
- Updates memory with edit metadata
- Trains patterns from successful/failed edits
- Creates checkpoint (auto-commit)

**What this does NOT do:**
- Run compilation or tests (too slow for every edit)
- Block the edit (hooks are non-blocking with `|| true`)

Layer 1 is **observability**, not enforcement. It records what happened so other layers
can use that context.

---

## Layer 2: Agent Self-Gating

Each agent includes a Ralph iteration loop in its prompt. The agent runs verification
commands itself and iterates until pass.

### Verification Commands by Role

| Agent | Verification Command | What It Checks |
|-------|---------------------|----------------|
| Architect | `npx tsc --noEmit` | Contracts compile |
| Coder | `npx tsc --noEmit && npm test -- src/[module]` | Code compiles + tests pass |
| Tester | `npm test` | All tests pass |
| Reviewer | `npm run lint` | No lint errors |

### Self-Gating Prompt Pattern

```markdown
## ITERATION PROTOCOL (CRITICAL)

You MUST iterate until verification passes.

### Verification Command
VERIFY="npx tsc --noEmit && npm test -- src/[module]"

### Loop
1. Implement the task
2. Run: $VERIFY
3. Check output for errors

If errors:
  - Read each error carefully
  - Fix the root cause (not symptoms)
  - Run: $VERIFY again
  - Repeat until pass

If pass:
  - Output: AGENT_COMPLETE
  - Proceed to PUBLISH step

MAX ITERATIONS: 10

If still failing after 10 iterations:
  - Store blocker in memory:
    npx claude-flow@v3alpha memory store \
      --namespace "swarm/blockers" \
      --key "[AGENT]" \
      --value '{"issue": "[description]", "attempts": 10, "last_error": "[error]"}'
  - Output: AGENT_BLOCKED

Do NOT output AGENT_COMPLETE until you have RUN the verification
and confirmed it passes.
```

### What Self-Gating Validates

| Check | Type | Agent |
|-------|------|-------|
| TypeScript compiles | **Fact** (exit code) | Architect, Coder |
| Tests pass | **Fact** (exit code) | Coder, Tester |
| Lint clean | **Fact** (exit code) | Reviewer |
| Files exist | **Fact** (file check) | All |

### What Self-Gating Does NOT Validate

- "Is this good code?"
- "Should we use X library?"
- "Architecture could be better"
- Code style preferences

Facts, not opinions. Same as before.

---

## Layer 3: Final Validation

After all agents complete, the orchestrator (main Claude Code context) runs a full
validation:

```bash
npx tsc --noEmit && npm test && npm run lint
```

This catches integration issues that individual agents couldn't see — like two modules
compiling independently but breaking when combined.

### Fix Agent for Final Validation Failures

```javascript
// TypeScript failures
Task({
  description: 'TS Fixer',
  prompt: `Fix these TypeScript errors:
    ${tscOutput}

    ONLY fix errors listed. Do NOT refactor.
    Verify: npx tsc --noEmit
    Iterate until pass (max 10).`,
  subagent_type: 'coder',
  model: 'opus'
})

// Test failures
Task({
  description: 'Test Fixer',
  prompt: `Fix these test failures:
    ${testOutput}

    ONLY fix failing tests. Do NOT add tests.
    Verify: npm test
    Iterate until pass (max 10).`,
  subagent_type: 'tester',
  model: 'opus'
})

// Lint failures
Task({
  description: 'Lint Fixer',
  prompt: `Fix these lint errors:
    ${lintOutput}

    ONLY fix errors (not warnings). Do NOT refactor.
    Verify: npm run lint
    Iterate until pass (max 10).`,
  subagent_type: 'coder',
  model: 'opus'
})
```

### Retry Logic

```
Final validation fails
  → Spawn fix agent (with specific errors)
  → Fix agent self-gates (Ralph loop, max 10 iterations)
  → Re-run final validation
  → Still fails? Retry (max 3 fix agents total)
  → Still fails? Escalate via consensus
```

---

## Blocker Reporting via Memory

When an agent can't pass verification after max iterations, it stores a structured
blocker in claude-flow memory:

```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/blockers" \
  --key "coder" \
  --value '{
    "agent": "coder",
    "issue": "JWT middleware type mismatch with Express types",
    "attempts": 10,
    "last_error": "TS2322: Type Express.Request not assignable to AuthRequest",
    "files": ["src/auth/middleware.ts"],
    "timestamp": "2026-01-27T06:00:00Z"
  }'
```

The orchestrator reads blockers after agents complete:

```bash
npx claude-flow@v3alpha memory list --namespace "swarm/blockers/*"
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

## Comparison: Phase Gates vs Continuous Gating

| Aspect | Phase gates (v2.1) | Continuous gating (v3.0) |
|--------|-------------------|-------------------------|
| When checked | Between phases | Every edit (hooks) + per agent (Ralph) + final |
| Who runs gates | External daemon workers | Agents themselves + hooks |
| Error detection | End of phase | During work |
| Dependencies | Headless executor (broken) | Bash commands (working) |
| Retry scope | Re-run entire phase | Fix specific error |
| Escalation | Custom protocol | Hive-mind consensus |

---

**Version**: 3.0 | **Last Updated**: 2026-01-27 | **Track**: B (Progressive)
