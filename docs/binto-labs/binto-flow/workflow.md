---
status: keep
phase: complete
type: guide
version: 2.1
last-updated: 2026-01-27
title: Workflow Guide (Binto-Flow V3)
author: Claude Code + Human Developer
tags: [workflow, decision-tree, swarm, hive-mind, v3, binto-flow, anti-drift]
---

# Workflow Guide (Binto-Flow V3)

> **This is your decision driver.** Start here for any multi-agent task.
> **Track A: Conservative** - Manual review with V3 improvements
> For templates: [swarm-templates.md](./swarm-templates.md) | [hive-mind-templates.md](./hive-mind-templates.md)
> For reference: [reference.md](./reference.md)

---

## Pre-Flight Check (REQUIRED)

Before any swarm work, verify hooks are configured:

```bash
npx claude-flow@v3alpha hooks verify || {
  echo "❌ Hooks misconfigured. Run: npx claude-flow@v3alpha init --force"
  exit 1
}
```

**If this fails, swarms will not coordinate properly.**

---

## Two-Step Workflow (Core Pattern)

**Why this exists:** Claude Code skips steps without explicit instructions.

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: GENERATE PROMPT                                         │
│                                                                  │
│ "Generate a swarm prompt for [OBJECTIVE] using                   │
│  ./swarm-templates.md"                                           │
│                                                                  │
│ Claude creates a prompt file with all npx commands               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: REVIEW (Structured - See Checklist Below)                │
│                                                                  │
│ Verify the prompt includes:                                      │
│ ✓ Anti-drift config (hierarchical + specialized)                 │
│ ✓ npx claude-flow@v3alpha (not @alpha)                           │
│ ✓ Model routing (opus for all agents)                            │
│ ✓ 3-step protocol (READ → WORK → PUBLISH)                        │
│ ✓ Quality gates (TypeScript 0 errors, tests passing)             │
│ ✓ Single-message spawning (all agents in one message)            │
│ ✓ Dependency timeouts (not infinite loops)                       │
│ ✓ Memory read/store commands for coordination                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: EXECUTE                                                  │
│                                                                  │
│ "Spawn this swarm using the reviewed prompt"                     │
│                                                                  │
│ Claude executes with all commands included                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Structured Review Checklist

**Review for FACTS, not style. Do NOT be pedantic.**

### Must Have (Block if missing)
- [ ] Anti-drift swarm_init with hierarchical + specialized
- [ ] Hook health check at start
- [ ] Model parameter set to opus for all agents
- [ ] Clear objective defined
- [ ] Agents specified with roles
- [ ] Quality gates are measurable (not vague)
- [ ] Dependencies mapped with timeouts

### Should Not Have (Flag for discussion)
- [ ] Over-engineered solutions (YAGNI violations)
- [ ] Premature abstractions
- [ ] Scope creep beyond original task
- [ ] Infinite dependency wait loops

### Do NOT Review For
- Code style preferences (trust the agents)
- Library choices (unless security concern)
- "Better" ways to do things (if current way works)
- Comments, naming, formatting (agents handle this)

---

## 3-Step Protocol (Reduced from 6)

**Why only 3 steps?** The `.claude/settings.json` hooks handle the rest:

| What | How It's Handled |
|------|------------------|
| Pre-task assignment | ✅ **AUTOMATIC** via PreToolUse hooks |
| Session restore | ✅ **AUTOMATIC** via PreToolUse hooks |
| Post-edit memory updates | ✅ **AUTOMATIC** via PostToolUse hooks |
| Session end + metrics | ✅ **AUTOMATIC** via Stop hooks |

**Your agents only need:**

```bash
# 1️⃣ READ context (from other agents)
npx claude-flow@v3alpha memory retrieve --namespace "swarm/..." --key "..."

# 2️⃣ WORK (hooks fire automatically on every file op)
# - Implement features
# - Run tests
# - Fix errors

# 3️⃣ PUBLISH results (for other agents)
npx claude-flow@v3alpha memory store --namespace "swarm/..." --key "..." --value "..."
```

---

## Decision Tree: What Do I Need?

```
What am I building?
│
├── Simple task (< 2 hours, 1 focus area)
│   └── Just use Claude Code directly
│       No swarm needed
│
├── Multi-component feature (2-4 hours, 3-6 agents)
│   └── Use Swarm
│       → ./swarm-templates.md
│
├── Complex/uncertain scope (7+ agents, phases)
│   └── Use Hive-Mind (Queen coordinates)
│       → ./hive-mind-templates.md
│
└── Multi-day project
    └── Use GitHub Epic + Swarm/Hive-Mind
        Create Epic first, then execute issues with swarms
```

---

## Decision Tree: Swarm vs Hive-Mind

```
Is the work well-defined with clear phases?
│
├── YES → Are there 6 or fewer agents?
│         ├── YES → Use Swarm (./swarm-templates.md)
│         └── NO  → Use Hive-Mind (./hive-mind-templates.md)
│
└── NO  → Will scope likely change during execution?
          ├── YES → Use Hive-Mind (Queen can adapt)
          └── NO  → Use Swarm
```

---

## V3 Pre-Work: Model Routing

**All agents use opus by default.** Quality over cost optimization.

```javascript
// Every Task() call should include model: 'opus'
Task({
  description: 'Coder',
  prompt: '[prompt]',
  subagent_type: 'coder',
  model: 'opus'  // Quality matters
})
```

**When to consider alternatives:**
| Model | When |
|-------|------|
| opus | Default for all agents |
| sonnet | Explicit cost-saving mode only |
| haiku | Only Agent Booster transforms |

---

## V3 Pre-Work: Agent Routing (Optional)

Before manually selecting agents, use V3's Q-Learning routing:

```bash
# Get AI-recommended agent for your task
npx claude-flow@v3alpha route task "Build REST API with authentication"

# Output:
# Recommended Agent: backend-dev
# Confidence: 91%
# Domain Match: REST, API, authentication
# Historical Success: 15/17 similar tasks (88%)
```

Include this in your prompt generation to get better agent selection.

---

## Dependency Wait Pattern (With Timeout)

**Never use infinite loops.** Always include timeouts:

```bash
# Wait for architect's contracts WITH TIMEOUT
MAX_WAIT=60  # 10 minutes (60 × 10s)
WAIT_COUNT=0

while ! npx claude-flow@v3alpha memory retrieve \
  --namespace "swarm/architect" \
  --key "contracts"; do

  WAIT_COUNT=$((WAIT_COUNT + 1))

  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ TIMEOUT: Dependency not available after 10 minutes"
    npx claude-flow@v3alpha memory store \
      --namespace "swarm/$(whoami)" \
      --key "blocker" \
      --value '{"type": "dependency_timeout", "waiting_for": "architect/contracts"}'
    exit 1
  fi

  echo "Waiting for contracts... ($WAIT_COUNT/$MAX_WAIT)"
  sleep 10
done
```

---

## V3 Pre-Work: Check Existing Patterns

Query memory for what worked before:

```bash
# Search for similar past swarms
npx claude-flow@v3alpha memory search "authentication API"

# Check architectural decisions
npx claude-flow@v3alpha memory list --namespace "architecture/*"
```

---

## Quality Gates (Define Before Starting)

Every swarm needs explicit quality gates:

```
QUALITY GATES (MANDATORY):
- TypeScript: 0 errors (npx tsc --noEmit)
- Tests: 100% passing (npm test)
- ESLint: 0 errors (npm run lint)
- Coverage: 90%+ (if applicable)
```

Include these in every prompt. The Reviewer agent enforces them.

---

## Multi-Day Projects: GitHub Epics

For projects spanning multiple days, use GitHub as the persistent context layer:

```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT LAYER (GitHub)                           [Days/Weeks]   │
│ └── Epic = Project container                                    │
│     └── Issues = Discrete tasks with acceptance criteria        │
│         └── PRs = Deliverables with peer review                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                 Each Issue triggers...
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ TASK LAYER (Binto-Flow)                          [Hours]        │
│ └── Two-step workflow                                           │
│     └── Swarm or Hive-Mind execution                            │
│         └── Quality gates → PR                                  │
└─────────────────────────────────────────────────────────────────┘
```

### V3 Claims for Multi-Session

Use Claims to prevent duplicate work across sessions:

```bash
# Claim an issue before working
npx claude-flow@v3alpha issues claim #123 --agent coder

# Hand off to another agent
npx claude-flow@v3alpha issues handoff #123 --to security-architect

# Release when done
npx claude-flow@v3alpha issues release #123

# Check what's claimed
npx claude-flow@v3alpha issues list --claimed
```

---

## Post-Swarm Triage

Most swarms complete with some CI failures. This is normal.

```
Did CI pass?
├── YES → Commit and record success pattern
│
└── NO → Categorize failures:
    │
    ├── SINGLE CATEGORY (just TypeScript, or just tests)
    │   └── Single fixer agent
    │
    ├── MULTIPLE CATEGORIES, ISOLATED
    │   └── Parallel fixer agents (one message)
    │
    ├── INTERCONNECTED (type changes broke tests)
    │   └── Mini-swarm with coordination
    │
    └── FUNDAMENTAL ISSUE (wrong approach)
        └── Re-plan, capture failure pattern
```

See [swarm-templates.md "Cleanup Phase"](./swarm-templates.md#cleanup-phase-post-swarm-fixing) for fixer templates.

---

## Pattern Capture (After Success)

Record what worked for future swarms:

```bash
# Record success
npx claude-flow@v3alpha memory store \
  --namespace "patterns/swarm" \
  --key "$(date +%Y%m%d)-[brief-description]" \
  --value '{
    "objective": "[what you built]",
    "agents": ["architect", "coder", "tester"],
    "approach": "[what worked]",
    "lessons": "[what to remember]"
  }'
```

V3's SONA also auto-learns from hooks, but explicit capture is still valuable.

---

## Summary

| Phase | Action | Document |
|-------|--------|----------|
| Decide what to build | Decision trees | This file |
| Pre-work (optional) | Q-Learning routing, pattern search | This file |
| Generate prompt | Use templates | swarm-templates.md or hive-mind-templates.md |
| Review prompt | Verify 3-step protocol | This file |
| Execute | Run reviewed prompt | - |
| Triage failures | Categorize and fix | swarm-templates.md |
| Record patterns | Memory store | This file |

---

**Version**: 2.1 | **Last Updated**: 2026-01-27 | **Track**: A (Conservative)

