---
status: keep
phase: complete
type: reference
version: 2.0
last-updated: 2026-01-17
title: Swarm Templates (Binto-Flow V3)
author: Claude Code + Human Developer
tags: [swarm, templates, agents, v3, binto-flow, protocol]
---

# Swarm Templates (Binto-Flow V3)

> **For workflow decisions:** [workflow.md](./workflow.md)
> **For hive-mind (7+ agents):** [hive-mind-templates.md](./hive-mind-templates.md)
> **For V3 reference:** [reference.md](./reference.md)

---

## The 3-Step Protocol (V3)

**Why only 3 steps?** The `.claude/settings.json` hooks handle the rest automatically:
- **PreToolUse hooks** → Auto-assign agents, load context on every Write/Edit
- **PostToolUse hooks** → Auto-format, update memory on every Write/Edit
- **Stop hooks** → Auto session-end, export metrics on completion

**Every agent prompt needs just 3 steps:**

```bash
# ═══════════════════════════════════════════════════════════════
# 3-STEP PROTOCOL (V3) - COPY INTO EVERY AGENT PROMPT
# ═══════════════════════════════════════════════════════════════

# 1️⃣ READ context from swarm memory:
npx claude-flow@v3alpha memory read --namespace "swarm/[PROJECT]" --key "plan" || true
# [For dependent agents: wait loop for dependencies - see Dependency Pattern below]

# 2️⃣ YOUR TASKS:
# - [Specific, measurable task 1]
# - [Specific, measurable task 2]
# - Run tests: npm test -- [test-pattern]
# (Hooks run automatically on every file operation!)

# 3️⃣ PUBLISH results for other agents:
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[AGENT-NAME]" \
  --key "[DELIVERABLE-NAME]" \
  --value "[RESULT-OR-SUMMARY]"
```

**What happens automatically (via `.claude/settings.json` hooks):**
- ✅ Pre-task assignment and context loading
- ✅ Post-edit memory updates and formatting
- ✅ Session end with metrics export

---

## Dependency Wait Pattern

When an agent depends on another agent's output:

```bash
# Wait for architect's contracts before coding
echo "Waiting for contracts..."
while ! npx claude-flow@v3alpha memory read \
  --namespace "swarm/architect" \
  --key "contracts"; do
  echo "Contracts not ready, waiting 10s..."
  sleep 10
done
echo "Contracts received, proceeding..."
```

---

## Agent Spawn Template

**Copy and customize for each agent:**

```markdown
You are the [AGENT-NAME] agent for the [PROJECT-NAME] swarm.

## 🔧 COORDINATION PROTOCOL (3-STEP)

### 1️⃣ READ context:
[First agent reads requirements/design doc]
[Dependent agents wait for dependencies:]
```bash
while ! npx claude-flow@v3alpha memory read \
  --namespace "swarm/[DEPENDENCY-AGENT]" \
  --key "[DEPENDENCY-KEY]"; do
  sleep 10
done
```

### 2️⃣ YOUR TASKS:
- [ ] [Specific task 1 with acceptance criteria]
- [ ] [Specific task 2 with acceptance criteria]
- [ ] [Specific task 3 with acceptance criteria]
- [ ] Run tests: `npm test -- [test-pattern]`

(Hooks handle post-edit automatically on every file operation!)

### 3️⃣ PUBLISH results:
```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/[AGENT-NAME]" \
  --key "[DELIVERABLE]" \
  --value "[SUMMARY-OR-CONTENT]"
```

## QUALITY GATES (MANDATORY):
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Tests: 100% passing (`npm test`)
- ESLint: 0 errors (`npm run lint`)
```

---

## V3 Agent Types

| Agent Type | Purpose | V3 Notes |
|------------|---------|----------|
| `unified-coordinator` | All coordination patterns | **Replaces** hierarchical/mesh/ring/star |
| `system-architect` | Design, contracts, decisions | SONA-enhanced |
| `coder` | Implementation | Q-Learning optimized routing |
| `tdd-london-swarm` | TDD (owns test + implementation) | Vitest integration |
| `tester` | Testing only | Vitest (10x faster) |
| `reviewer` | Validation, quality gates | AIDefence security scanning |
| `security-architect` | Security-focused design | **V3 NEW** |
| `backend-dev` | Backend/API implementation | REST, GraphQL, auth |
| `mobile-dev` | React Native mobile | iOS/Android |

---

## Single-Message Spawning (CRITICAL)

**All agents MUST be spawned in ONE message:**

```javascript
// ✅ CORRECT: Single message with all Task() calls
[
  Task('Architect', '[full prompt with 3-step protocol]', 'system-architect'),
  Task('Backend', '[full prompt with 3-step protocol]', 'backend-dev'),
  Task('Frontend', '[full prompt with 3-step protocol]', 'coder'),
  Task('Tester', '[full prompt with 3-step protocol]', 'tdd-london-swarm'),
  Task('Reviewer', '[full prompt with 3-step protocol]', 'reviewer'),
]

// ❌ WRONG: Multiple messages breaks coordination
Message 1: Task('Architect', ...)
Message 2: Task('Coder', ...)  // Agent can't coordinate!
```

---

## Pre-Built Swarm Patterns

### Pattern A: Feature Development (3-4 agents)

```
┌─────────────────────────────────────────────────────────────┐
│ FEATURE DEVELOPMENT SWARM                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [1] Architect ──publishes──→ contracts                     │
│         │                                                    │
│         ├──────────────┬──────────────┐                      │
│         ↓              ↓              ↓                      │
│   [2] Coder      [2] Tester    [2] Security                  │
│     (waits)       (waits)       (waits)                      │
│         │              │              │                      │
│         └──────────────┴──────────────┘                      │
│                        ↓                                     │
│                  [3] Reviewer                                │
│                   (validates)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Spawn prompt:**
```
Generate a feature development swarm for [FEATURE].

Agents:
1. Architect - Creates contracts.ts with shared types
2. Coder - Implements feature (waits for contracts)
3. Tester - Writes tests (waits for contracts)
4. Reviewer - Validates quality gates

Use 3-step protocol from ./swarm-templates.md.
Quality gates: TypeScript 0 errors, tests passing, lint clean.
```

### Pattern B: Full-Stack (5-6 agents)

```
┌─────────────────────────────────────────────────────────────┐
│ FULL-STACK SWARM                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [1] System Architect ──publishes──→ design + contracts     │
│              │                                               │
│   ┌──────────┼──────────┬──────────┬──────────┐              │
│   ↓          ↓          ↓          ↓          ↓              │
│ [2]API    [2]DB      [2]UI      [2]Auth    [2]Tests          │
│   │          │          │          │          │              │
│   └──────────┴──────────┴──────────┴──────────┘              │
│                         ↓                                    │
│                   [3] Reviewer                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern C: Bug Fix (2-3 agents)

```
┌─────────────────────────────────────────────────────────────┐
│ BUG FIX SWARM                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [1] Analyst ──publishes──→ root cause + fix approach       │
│         │                                                    │
│         ├─────────────────────┐                              │
│         ↓                     ↓                              │
│   [2] Fixer             [2] Test Writer                      │
│     (implements)         (regression tests)                  │
│         │                     │                              │
│         └─────────────────────┘                              │
│                   ↓                                          │
│             [3] Reviewer                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Cleanup Phase (Post-Swarm Fixing)

Most swarms complete with some CI failures. Use these patterns:

### Single Category Fix

```bash
# TypeScript errors only
Task('TS Fixer', 'Fix all TypeScript errors. Run npx tsc --noEmit until 0 errors.', 'coder')

# Test failures only
Task('Test Fixer', 'Fix failing tests. Run npm test until all pass.', 'tester')

# Lint errors only
Task('Lint Fixer', 'Fix all ESLint errors. Run npm run lint until clean.', 'coder')
```

### Multi-Category Fix (Parallel)

```javascript
// Single message with parallel fixers
[
  Task('TS Fixer', 'Fix TypeScript errors...', 'coder'),
  Task('Test Fixer', 'Fix test failures...', 'tester'),
  Task('Lint Fixer', 'Fix lint errors...', 'coder'),
]
```

### Interconnected Fix (Mini-Swarm)

When type changes broke tests:

```
Task('Coordinator', 'Coordinate fix for interconnected TS and test failures.
1. Read the errors
2. Fix types first, store in memory
3. Signal tester to update tests
4. Verify all passing', 'unified-coordinator')
```

---

## V3 Optional Enhancements

### Pre-Swarm: Q-Learning Agent Routing

```bash
# Get AI-recommended agent for task
npx claude-flow@v3alpha route task "Build REST API with authentication"
# → Recommended: backend-dev (91% confidence)
```

### Multi-Session: Claims System

```bash
# Claim issue at start
npx claude-flow@v3alpha issues claim #123 --agent coder

# Hand off to another agent
npx claude-flow@v3alpha issues handoff #123 --to security-architect

# Release when done
npx claude-flow@v3alpha issues release #123
```

### Check Existing Patterns

```bash
# Search for similar past work
npx claude-flow@v3alpha memory search "authentication API"
```

---

## Verification After Swarm

```bash
# Check all agent outputs in memory
npx claude-flow@v3alpha memory list --namespace "swarm/*"

# Run quality gates
npm run type-check && npm test && npm run lint

# Check SONA learned from this swarm
npx claude-flow@v3alpha hooks intelligence --showStatus
```

---

## Complete Example: Auth Feature Swarm

```markdown
# Auth Feature Swarm Prompt

Generate a swarm for: User authentication with JWT

## AGENTS (spawn in ONE message):

### 1. System Architect
- Design auth flow
- Create contracts.ts with User, Token, AuthResponse types
- Document decisions in memory

### 2. Backend Developer (waits for contracts)
- Implement /auth/login, /auth/register, /auth/refresh
- JWT token generation and validation
- Password hashing with bcrypt

### 3. TDD Developer (waits for contracts)
- Write tests BEFORE implementation patterns
- Cover: valid login, invalid password, token refresh, expired token
- Target: 90% coverage

### 4. Security Reviewer (waits for all)
- Validate no security vulnerabilities
- Check: SQL injection, XSS, CSRF, token security
- Approve or request fixes

## QUALITY GATES:
- TypeScript: 0 errors
- Tests: 100% passing
- ESLint: 0 errors
- Security: No high/critical findings

## PROTOCOL:
Use 3-step protocol from ./swarm-templates.md
All agents use @v3alpha commands
Single-message spawning
```

---

**Version**: 2.0 | **Last Updated**: 2026-01-17

