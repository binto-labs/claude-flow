---
status: keep
phase: complete
type: guide
version: 1.6
last-updated: 2025-12-05
title: Multi-Agent Workflow Guide
author: Claude Code + Human Developer
tags: [workflow, decision-tree, swarm, hive-mind, cleanup, patterns, sparc, tdd-london]
---

# Multi-Agent Workflow Guide

> **This is your decision driver.** Start here for any multi-agent task.
> For reference details on "how does X work?", see [claude-flow-guide.md](./claude-flow-guide.md).

---

## 📖 Table of Contents

- [Pre-Work: What Am I Building?](#pre-work-what-am-i-building)
- [Forming the Swarm](#forming-the-swarm)
- [Swarm Execution](#swarm-execution)
- [Post-Swarm Triage](#post-swarm-triage)
- [Cleanup Phase](#cleanup-phase)
- [Validation & Pattern Capture](#validation--pattern-capture)
- [Commit](#commit)
- [Continuous Improvement](#continuous-improvement)

---

## Pre-Work: What Am I Building?

### Default Methodology: SPARC

All **development tasks** (code changes, features, fixes, refactors) should use or form part of the SPARC process. Scale the depth to match task complexity:

| Task Type | SPARC Application |
|-----------|-------------------|
| Small fix (< 30 min) | Light spec → Implement → Verify |
| Feature (2-4 hours) | Full 5-phase cycle, each phase sized appropriately |
| Complex project | Full SPARC with formal quality gates between phases |
| Research/analysis/questions | SPARC not required - use appropriate approach |

**SPARC Phases (For Development Work):**
1. **Specification**: What are we building? What does "done" look like?
2. **Pseudocode**: How will the algorithm/logic work?
3. **Architecture**: How do components fit together?
4. **Refinement**: TDD implementation with iterative improvement
5. **Completion**: Integration, docs, deployment prep

### Capturing Architectural Decisions

During SPARC phases (especially Architecture), **store decisions in project memory** for consistency across swarms:

```bash
# Store architectural decisions
npx claude-flow@alpha memory store \
  --namespace "architecture/decisions" \
  --key "[decision-name]" \
  --value "[decision and rationale]"

# Store patterns adopted for this project
npx claude-flow@alpha memory store \
  --namespace "architecture/patterns" \
  --key "[pattern-name]" \
  --value "[how pattern is applied in this project]"
```

**What to capture:**
- **API design choices**: REST vs GraphQL, authentication approach, versioning strategy
- **Data patterns**: Database schema decisions, caching strategy, state management
- **Code conventions**: Naming conventions, file structure, module boundaries
- **Technology choices**: Libraries selected, frameworks, infrastructure decisions

**Why this matters:**
- Future swarms reference these decisions for consistency
- Prevents re-debating settled architectural questions
- New agents understand project context immediately
- Builds institutional knowledge that persists

**Example:**
```bash
npx claude-flow@alpha memory store \
  --namespace "architecture/decisions" \
  --key "auth-strategy" \
  --value "JWT with refresh tokens. Access token TTL: 15min. Refresh: 7 days. Redis for session blacklist. Rationale: Stateless scaling, quick revocation capability."
```

### Memory Schema for Swarm Coordination

Use standardized namespaces so all agents query the same structure:

| Namespace | Published By | Contains |
|-----------|--------------|----------|
| `architecture/contracts` | Architect | Module ownership, interface definitions, canonical types file path |
| `architecture/decisions` | Architect (+ any agent making significant choices) | Design decisions with rationale |
| `architecture/types` | Architect | Critical type structures (optional, for complex projects) |
| `swarm/[agent]/status` | Each agent | Progress, gate results, blockers |

**Architect publishes module contracts:**
```bash
npx claude-flow@alpha memory store \
  --namespace "architecture/contracts" \
  --key "modules" \
  --value '{
    "canonical_types_file": "src/contracts.ts",
    "modules": {
      "UserService": {
        "owns": ["user-service.ts", "__tests__/user-service.test.ts"],
        "interface": "IUserService",
        "depends_on": []
      },
      "OrderService": {
        "owns": ["order-service.ts", "__tests__/order-service.test.ts"],
        "interface": "IOrderService",
        "depends_on": ["UserService"]
      }
    }
  }'
```

**TDD agent queries before starting:**
```bash
# Get my module definition
npx claude-flow@alpha memory read \
  --namespace "architecture/contracts" \
  --key "modules" | jq '.modules.UserService'

# Get canonical types file
npx claude-flow@alpha memory read \
  --namespace "architecture/contracts" \
  --key "modules" | jq -r '.canonical_types_file'
```

**Agent publishes completion status:**
```bash
npx claude-flow@alpha memory store \
  --namespace "swarm/user-service" \
  --key "status" \
  --value '{"phase": "complete", "tests_passing": 12, "gate_passed": true}'
```

### Design Principles Checklist

Before finalizing architecture, explicitly consider these fundamentals. Not all apply to every task - but each should be consciously evaluated:

- [ ] **Separation of Concerns**: Should responsibilities be isolated into distinct components?
- [ ] **Modularity**: Can this be broken into independent, reusable units?
- [ ] **Single Responsibility**: Does each component/function do one thing well?
- [ ] **Testability**: Can components be tested in isolation?
- [ ] **Loose Coupling**: Are dependencies minimized and explicit?

**If deviating from a principle, document why:**
```bash
npx claude-flow@alpha memory store \
  --namespace "architecture/decisions" \
  --key "tight-coupling-rationale" \
  --value "Components X and Y tightly coupled intentionally. Rationale: Performance-critical path, <1ms latency requirement. Trade-off accepted."
```

**When to skip:** For quick scripts, single-purpose utilities, or prototypes, a simple "N/A - single-purpose utility" acknowledgment is sufficient.

**Available SPARC Agents:**
- `sparc-coord` - Full phase orchestration (`.claude/agents/templates/sparc-coordinator.md`)
- `specification`, `pseudocode`, `architecture`, `refinement` - Individual phases (`.claude/agents/sparc/`)
- SPARC skill: Invoke with `@sparc-methodology` (`.claude/skills/sparc-methodology/SKILL.md`)

### TDD Swarm Patterns

When using TDD in multi-agent swarms, **preserve the RED-GREEN-REFACTOR feedback loop** by keeping test writing and implementation within the same agent context.

#### The Anti-Pattern (Avoid)

```
❌ Separate Test Designer and Coder agents:
   TDD Designer → writes all tests (interprets requirements)
        ↓ (async handoff via memory)
   Coder → implements (re-interprets requirements)
        ↓ (no feedback until integration)
   Result: Type mismatches, late failures, broken TDD loop
```

#### The Correct Pattern: SOC-Bounded TDD

```
✅ One TDD agent per module (owns both tests AND implementation):

   Architect
      ↓ creates code-based contracts (TypeScript interfaces)
      ↓
   ┌─────────────┬─────────────┬─────────────┐
   ↓             ↓             ↓             ↓
TDD-Dev       TDD-Dev       TDD-Dev      (parallel)
Module A      Module B      Module C
(test+impl)   (test+impl)   (test+impl)
   ↓             ↓             ↓
   └─────────────┴─────────────┘
                 ↓
         Integration Tester
         (cross-module tests)
                 ↓
            Reviewer
```

#### Key Principles

1. **Code-Based Contracts**: Architect creates a contracts file with TypeScript interfaces - not prose descriptions in memory
2. **Module Ownership**: Each TDD agent owns specific files (`owns: [file.ts, file.test.ts]`)
3. **Compilation Gates**: Each phase must pass `tsc --noEmit` before next phase starts
4. **Preserved TDD Loop**: Same agent writes test → implements → verifies

#### Contract File Pattern

Architect creates a shared contracts file that all agents import from:

```typescript
// contracts.ts (created by Architect, read-only for TDD agents)

// Re-export canonical types - ALL agents use these
export type { GameState, User, Order } from '../types';

// Define module interfaces
export interface IUserService {
  createUser(data: CreateUserInput): Promise<User>;
  getUser(id: string): Promise<User | null>;
}

export interface IOrderService {
  createOrder(userId: string, items: OrderItem[]): Promise<Order>;
  getOrdersByUser(userId: string): Promise<Order[]>;
}
```

**Enforcement**: TDD agents must import types from contracts file, not define their own.

#### When to Use This Pattern

| Scenario | Pattern |
|----------|---------|
| Single module, single agent | Standard TDD (one agent does everything) |
| Multi-module feature | SOC-bounded TDD (one TDD agent per module) |
| Cross-cutting concerns | Integration Tester agent after module agents complete |

### Decision Tree: Task Complexity

```
What am I building?
├── Single, focused task (< 2 hours)
│   └── Single agent, no swarm needed
│       → Just use Claude Code directly
│
├── Multi-component feature (2-4 hours)
│   └── Swarm (3-6 agents)
│       → See: "Forming the Swarm" below
│       → Templates: swarm-templates.md
│
└── Complex project (days/weeks, uncertain scope)
    └── Hive-mind (Queen + workers)
        → See: hive-mind-templates.md
        → Queen coordinates phases, spawns workers as needed
```

### Decision Tree: Topology Selection

```
How do agents need to coordinate?
├── Sequential dependencies (A → B → C)
│   └── Hierarchical topology
│       Architect → Coder → Tester → Reviewer
│
├── Parallel with shared contracts
│   └── Mesh topology
│       Backend + Frontend work simultaneously, share via memory
│
└── Uncertain, let system decide
    └── Adaptive topology
        System adjusts based on task complexity
```

### Pre-Swarm Pattern Query (Optional but Recommended)

Before spawning, check what worked before:

```bash
# Find similar past swarms
npx claude-flow@alpha memory vector-search "[OBJECTIVE-KEYWORDS]" --k 3 --reasoningbank

# Example output:
# - "user-auth-swarm" (confidence: 0.92) - JWT + Redis session worked well
# - "login-feature" (confidence: 0.78) - OAuth had integration issues
# - "auth-refactor" (confidence: 0.65) - Needed extra tester agent
```

**Use this to inform:**
- Agent configuration (add specialists if past swarms struggled)
- Approach selection (avoid patterns that failed)
- Anticipate likely failure modes

[↑ Back to TOC](#-table-of-contents)

---

## Forming the Swarm

### ⚠️ CRITICAL: Single-Message Spawning

**ALL agents MUST be spawned in a SINGLE message using Claude Code's Task tool.**

```
❌ WRONG (agents may not coordinate):
   Message 1: Task('Architect', ...)
   Message 2: Task('Coder', ...)      // Separate message = broken swarm
   Message 3: Task('Tester', ...)

✅ CORRECT (one message, all agents):
   [Single Message]:
     Task('Architect', '[full prompt]', 'system-architect'),
     Task('Coder', '[full prompt]', 'coder'),
     Task('Tester', '[full prompt]', 'tdd-london-swarm'),
     Task('Reviewer', '[full prompt]', 'reviewer')
```

**Why this matters:**
- Claude Code's Task tool spawns agents in parallel when called in one message
- Separate messages = sequential execution = agents miss coordination windows
- Memory dependencies only work when all agents start together

### Checklist Before Spawning

- [ ] **Clear objective** (one sentence: what are we building?)
- [ ] **Success criteria** (measurable: what does "done" look like?)
- [ ] **Agent types needed** (architect? coder? tester? reviewer?)
- [ ] **Dependencies between agents** (who waits for whom?)
- [ ] **Quality gates** (TypeScript 0 errors, tests passing, coverage target)
- [ ] **Single message ready** (all Task() calls prepared for one message)

### Prompt Formula

```markdown
# Swarm Objective: [What to build]

## Context
[Current state, constraints, why we need this]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Quality Gates (MANDATORY)
- TypeScript: 0 errors
- Tests: 100% passing
- ESLint: 0 errors
- Coverage: 90%+ (if applicable)

## Agents Required
[See swarm-templates.md for full agent templates]

### Agent 1: [Role] ([agent-type])
**Tasks:** [specific tasks]
**Publishes:** [memory keys for other agents]
**Dependencies:** [what to wait for]

### Agent 2: ...

## Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] All quality gates pass
```

**Full templates:** → [swarm-templates.md](./swarm-templates.md)

[↑ Back to TOC](#-table-of-contents)

---

## Swarm Execution

### What Happens

1. **Agents spawn in parallel** (via Claude Code Task tool)
2. **Execute 6-step coordination protocol**:
   - Pre-task hooks → Read context → Execute → Post-edit → Publish → Complete
3. **Coordinate via memory** (producer-consumer patterns)
4. **Reviewer validates with CI** (TypeScript, tests, lint)

### Your Role During Execution

**Monitor, don't intervene** unless:
- An agent is blocked waiting for a dependency that won't come
- A fundamental approach issue is discovered early
- System errors (hooks failing, memory issues)

### Monitoring Commands

```bash
# Check swarm status
npx claude-flow@alpha swarm status

# Check memory for agent progress
npx claude-flow@alpha memory list --namespace "swarm/*"

# Check specific agent's published work
npx claude-flow@alpha memory read --namespace "swarm/[agent]" --key "[deliverable]"
```

**How the coordination works:** → [claude-flow-guide.md "Memory Coordination"](./claude-flow-guide.md#-memory-coordination)

[↑ Back to TOC](#-table-of-contents)

---

## Post-Swarm Triage

> **CRITICAL PHASE**: Most swarms complete with some CI failures. This is normal.
> The key is structured triage, not ad-hoc fixing.

### Step 1: Check CI Results

```bash
# What passed/failed?
npm run type-check   # TypeScript errors
npm test             # Test failures
npm run lint         # Lint errors
npm test -- --coverage  # Coverage gaps (if applicable)
```

### Step 2: Categorize Failures

```
Did CI pass?
├── YES → Skip to "Validation & Pattern Capture"
│
└── NO → Categorize failures:
    │
    ├── SINGLE CATEGORY (e.g., just TypeScript)
    │   └── Single fixer agent
    │       → See: "Cleanup: Single Fixer"
    │
    ├── MULTIPLE CATEGORIES, ISOLATED
    │   (e.g., TypeScript errors + unrelated test failures)
    │   └── Parallel fixer agents
    │       → See: "Cleanup: Parallel Fixers"
    │
    ├── MULTIPLE CATEGORIES, INTERCONNECTED
    │   (e.g., type changes broke tests, need coordinated fix)
    │   └── Mini-swarm (2-3 agents with coordination)
    │       → See: "Cleanup: Mini-Swarm"
    │
    └── FUNDAMENTAL ISSUE (wrong approach entirely)
        └── Re-plan, capture as major failure pattern
            → See: "Handling Major Failures"
```

[↑ Back to TOC](#-table-of-contents)

---

## Cleanup Phase

### Single Fixer Agent

**Use when:** One category of failures (e.g., just TypeScript errors)

```javascript
Task('[Category] Fixer',
  `You are a focused cleanup agent.

  🎯 YOUR ONLY JOB: Fix these [category] issues

  ISSUES TO FIX:
  [Paste CI output here]

  RULES:
  - Fix ONLY these issues, don't refactor
  - Preserve existing logic
  - Run verification after fixes

  WHEN DONE:
  [Run relevant CI check]
  npx claude-flow@alpha hooks post-task --task-id "[category]-fixer"
  `,
  'coder'  // or 'tester' for test fixes
);
```

### Fixer Types Quick Reference

| Category | Agent Type | Verification Command |
|----------|------------|---------------------|
| TypeScript errors | `coder` | `npm run type-check` |
| Test failures | `tester` | `npm test` |
| Coverage gaps | `tester` | `npm test -- --coverage` |
| Lint errors | `coder` | `npm run lint` (try `--fix` first) |

### Parallel Fixers

**Use when:** Multiple isolated failure categories

```javascript
// Spawn in ONE message for parallel execution
[
  Task('TypeScript Fixer',
    `Fix ONLY these TypeScript errors: [paste errors]
    Run: npm run type-check
    `,
    'coder'
  ),
  Task('Test Fixer',
    `Fix ONLY these test failures: [paste failures]
    Run: npm test
    `,
    'tester'
  )
]
```

### Mini-Swarm for Interconnected Issues

**Use when:** Type changes require test updates (or similar coordination)

```javascript
// Coordinated cleanup
[
  Task('Type Aligner',
    `Fix TypeScript errors. Publish interface changes to memory:
    npx claude-flow@alpha memory store \\
      --namespace "cleanup/types" \\
      --key "changes" \\
      --value "[describe changes made]"
    `,
    'coder'
  ),
  Task('Test Updater',
    `Wait for type changes:
    while ! npx claude-flow@alpha memory read \\
      --namespace "cleanup/types" \\
      --key "changes"; do sleep 5; done

    Then update tests to match the type changes.
    Run: npm test
    `,
    'tester'
  )
]
```

### Handling Major Failures

**Use when:** The entire approach was wrong

1. **Stop cleanup** - don't fix symptoms of a broken approach
2. **Capture the failure pattern** (see next section)
3. **Re-plan with lessons learned**
4. **Consider smaller scope** or different architecture

[↑ Back to TOC](#-table-of-contents)

---

## Validation & Pattern Capture

### After CI Passes

**1. Verify all gates pass:**

```bash
npm run type-check && npm test && npm run lint
```

**2. Capture failure pattern (30 seconds):**

> This is the key to continuous improvement. Every failure you capture
> becomes a pattern that helps future swarms avoid the same issue.

```bash
npx claude-flow@alpha memory store \
  --namespace "code-quality/failure-patterns" \
  --key "$(date +%Y%m%d)-[brief-description]" \
  --value '{
    "swarm_objective": "[what you were building]",
    "failure_category": "[coordination|types|tests|security|other]",
    "specific_issue": "[what went wrong]",
    "root_cause": "[why it happened]",
    "fix_applied": "[how you fixed it]",
    "prevention": "[how to prevent next time]"
  }'
```

**Example:**

```bash
npx claude-flow@alpha memory store \
  --namespace "code-quality/failure-patterns" \
  --key "20251127-type-mismatch-frontend-backend" \
  --value '{
    "swarm_objective": "User authentication API",
    "failure_category": "coordination",
    "specific_issue": "Frontend used UserDTO, backend exported User type",
    "root_cause": "Architect didnt publish type contract to memory",
    "fix_applied": "Added shared types package, both import from there",
    "prevention": "Add explicit type publishing step to architect agent template"
  }'
```

**3. Record outcome for learning:**

```bash
npx claude-flow@alpha memory feedback \
  --pattern "swarm/[PROJECT]/config" \
  --outcome success \
  --reasoningbank
```

This updates Bayesian confidence scores:
- Success: +20% confidence adjustment
- Failure: -15% confidence adjustment

[↑ Back to TOC](#-table-of-contents)

---

## Commit

### Document Classification

> **Full guide:** See [document-classification-guide.md](./document-classification-guide.md)

All markdown files created during swarms should have YAML frontmatter:

```yaml
---
status: keep | working | temp | archive
phase: planning | development | complete | deprecated
type: spec | design | report | reference | guide | analysis
version: X.Y
last-updated: YYYY-MM-DD
title: Document Title
---
```

**Quick classification for swarm outputs:**

| Output Type | Status | Phase | Type |
|-------------|--------|-------|------|
| API documentation | `keep` | `complete` | `reference` |
| Architecture decisions | `keep` | `complete` | `design` |
| Implementation specs | `keep` | `complete` | `spec` |
| Debug/investigation notes | `temp` | `development` | `report` |
| In-progress designs | `working` | `development` | `design` |

### Commit Message Formula

```
[type]: [what was built]

- [Key feature/change 1]
- [Key feature/change 2]

Cleanup: [what was fixed post-swarm]
Patterns captured: [any new failure patterns noted]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `docs`: Documentation

### Example

```
feat: Add user authentication with JWT

- Implement login/logout endpoints
- Add password hashing with bcrypt
- Create protected route middleware

Cleanup: Fixed TypeScript errors in session types
Patterns captured: coordination/type-mismatch-frontend-backend
```

[↑ Back to TOC](#-table-of-contents)

---

## Continuous Improvement

### Weekly Review (5 minutes)

```bash
# Review accumulated patterns
npx claude-flow@alpha memory list --namespace "code-quality/failure-patterns"

# Check pattern confidence scores
npx claude-flow@alpha memory list --namespace "patterns" --sort confidence
```

**Ask yourself:**
- What patterns repeat? → Update templates to prevent them
- What patterns are low confidence? → Need more data or should prune
- What worked well? → Document in templates

### Training Neural Patterns (Optional)

After 10+ swarms, train the neural module:

```bash
# Export swarm history
npx claude-flow@alpha memory export swarm-history.json \
  --namespace "swarm/*" \
  --since "7d"

# Train coordination patterns
npx claude-flow@alpha neural train \
  --data ./swarm-history.json \
  --pattern_type "coordination"

# Verify training
npx claude-flow@alpha neural status
```

**What this enables:**
- Anomaly detection (flag unusual agent behavior)
- Complexity prediction (estimate swarm duration)
- Routing optimization (match tasks to best agent types)

### Monthly Cleanup

```bash
# Review pattern confidence scores
npx claude-flow@alpha memory list --namespace "patterns" --sort confidence

# Prune low-confidence patterns (optional)
npx claude-flow@alpha memory prune --confidence-below 0.3
```

- Review which patterns improved swarm success
- Update templates based on repeated failures
- Archive or delete patterns that no longer apply

[↑ Back to TOC](#-table-of-contents)

---

## Code Quality Analysis (Optional)

> **When to use:** After significant swarms, when you want to catch issues CI misses.

### What It Catches That CI Doesn't

| Category | Examples |
|----------|----------|
| **Coordination Quality** | Did agents honor contracts? Type mismatches? |
| **Error Handling** | Consistent try/catch? Meaningful error messages? |
| **Security** | Hardcoded secrets? Input validation? |
| **Maintainability** | Over-engineering? Unclear naming? |
| **Test Quality** | Meaningful tests vs line-hitting? Edge cases? |

### Process

1. **LLM analyzes:** code diff + CI output + past patterns
2. **Produces:** categorized findings with confidence
3. **Human reviews:** (5 min) - confirm/reject findings
4. **Confirmed findings:** become new patterns

**How to use:** → [claude-flow-guide.md "Code Quality Evals"](./claude-flow-guide.md#-code-quality-evals)

[↑ Back to TOC](#-table-of-contents)

---

## Quick Reference: What Do I Do Now?

| Situation | Action |
|-----------|--------|
| Starting new task | → [Pre-Work: What Am I Building?](#pre-work-what-am-i-building) |
| Ready to spawn agents | → [Forming the Swarm](#forming-the-swarm) + [swarm-templates.md](./swarm-templates.md) |
| Swarm running | → [Swarm Execution](#swarm-execution) (monitor, don't intervene) |
| Swarm done, CI failing | → [Post-Swarm Triage](#post-swarm-triage) |
| Need to fix failures | → [Cleanup Phase](#cleanup-phase) |
| CI passing, ready to commit | → [Validation & Pattern Capture](#validation--pattern-capture) |
| Weekly maintenance | → [Continuous Improvement](#continuous-improvement) |

---

## Available Resources

> Claude Code should consider these resources when forming swarms and selecting agents.

### Specialized Agents

Location: `.claude/agents/`

| Category | Key Agents | Use For |
|----------|------------|---------|
| **SPARC** | `sparc-coord`, `specification`, `architecture`, `refinement` | Methodology orchestration |
| **Testing** | `tdd-london-swarm`, `production-validator` | Quality assurance (London School TDD) |
| **Coordination** | `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator` | Swarm topology |
| **GitHub** | `pr-manager`, `code-review-swarm`, `release-manager`, `issue-tracker` | Repository ops |
| **Development** | `backend-dev`, `system-architect`, `api-docs`, `ml-developer` | Specialized implementation |
| **Consensus** | `byzantine-coordinator`, `raft-manager`, `gossip-coordinator` | Distributed systems |

### Skills (Invoke with `@skill-name`)

Location: `.claude/skills/`

| Skill | Purpose |
|-------|---------|
| `sparc-methodology` | Full SPARC development modes (17+ modes) |
| `swarm-orchestration` | Multi-agent coordination patterns |
| `verification-quality` | Truth scoring & automatic rollback |
| `pair-programming` | Driver/navigator TDD sessions |
| `hive-mind-advanced` | Queen-led collective intelligence |

### Agent Discovery

When forming a swarm, Claude Code should:
1. Check `.claude/agents/` for specialized agents matching task needs
2. Consider `.claude/skills/` for methodology guidance
3. Default to SPARC phases for all development work
4. Use `tdd-london-swarm` for testing (London School TDD is the default)

---

## Related Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[swarm-templates.md](./swarm-templates.md)** | Agent templates, 6-step protocol | Spawning agents, need copy-paste prompts |
| **[hive-mind-templates.md](./hive-mind-templates.md)** | Queen coordination, multi-phase projects | Complex/uncertain scope tasks |
| **[claude-flow-guide.md](./claude-flow-guide.md)** | Reference: architecture, commands, troubleshooting | "How does X work?" questions |

---

**Version**: 1.6.0 | **Last Updated**: 2025-12-05
