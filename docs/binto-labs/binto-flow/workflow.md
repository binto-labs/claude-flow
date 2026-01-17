---
status: keep
phase: complete
type: guide
version: 1.0
last-updated: 2026-01-17
title: Workflow Guide (Binto-Flow V3)
author: Claude Code + Human Developer
tags: [workflow, decision-tree, swarm, hive-mind, v3, binto-flow]
---

# Workflow Guide (Binto-Flow V3)

> **This is your decision driver.** Start here for any multi-agent task.
> For templates: [swarm-templates.md](./swarm-templates.md) | [hive-mind-templates.md](./hive-mind-templates.md)
> For reference: [reference.md](./reference.md)

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
│ STEP 2: REVIEW                                                   │
│                                                                  │
│ Verify the prompt includes:                                      │
│ ✓ npx claude-flow@v3alpha (not @alpha)                           │
│ ✓ 6-step protocol (pre-task → post-task)                         │
│ ✓ Quality gates (TypeScript 0 errors, tests passing)             │
│ ✓ Single-message spawning (all agents in one message)            │
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

See [swarm-templates.md "Cleanup Phase"](./swarm-templates.md#cleanup-phase) for fixer templates.

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
| Review prompt | Verify 6-step protocol | This file |
| Execute | Run reviewed prompt | - |
| Triage failures | Categorize and fix | swarm-templates.md |
| Record patterns | Memory store | This file |

---

**Version**: 1.0 | **Last Updated**: 2026-01-17
