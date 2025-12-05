---
status: keep
phase: complete
type: reference
version: 1.5
last-updated: 2025-12-05
title: Swarm Templates
author: Claude Code + Human Developer
tags: [swarm, templates, agents, coordination, cleanup, patterns, tdd-london, sparc]
---

# Swarm Templates

Complete guide for spawning coordinated swarms with quality gates.

> **When to use these templates:** See [workflow.md](./workflow.md) for decision guidance.
> **For reference details:** See [claude-flow-guide.md](./claude-flow-guide.md) for architecture and commands.

---

## Quick Reference

### When to Use Swarms

Use swarms for **complex tasks requiring 3+ specialized agents** working in coordination:

- Multi-component features (backend + frontend + tests + docs)
- Large refactors across many files
- Full-stack implementations
- CI/CD fixes requiring multiple specialists

**Don't use swarms** for simple tasks one agent can handle.

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

### Two-Step Workflow

**Step 1 - Generate Prompt:**

```
Generate a swarm prompt for [OBJECTIVE] using ./swarm-templates.md
```

**Step 2 - Review & Spawn:**

```
Spawn this swarm using ./swarm-templates.md
```

**For topology decisions, agent types, and command options:**
See ./claude-flow-guide.md

---

## The 6-Step Coordination Protocol

**CRITICAL**: Every agent spawned via Claude Code's Task tool MUST execute these steps.

```bash
# ═══════════════════════════════════════════════════════════════
# 6-STEP PROTOCOL - COPY INTO EVERY AGENT PROMPT
# ═══════════════════════════════════════════════════════════════

# 1️⃣ BEFORE starting ANY work:
npx claude-flow@alpha hooks pre-task --description "[AGENT-ROLE] work"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[PROJECT-NAME]"

# 2️⃣ READ context from swarm memory:
npx claude-flow@alpha memory read --namespace "swarm/[PROJECT]" --key "plan" || true
# Also read any dependency keys you're waiting for

# 3️⃣ YOUR TASKS:
# [List specific, measurable tasks here]

# 4️⃣ AFTER EVERY file you create/edit:
npx claude-flow@alpha hooks post-edit --file "[FILE-PATH]" --memory-key "swarm/[AGENT]/progress"

# 📋 FOR DOCUMENTATION FILES: Add YAML frontmatter per ./document-classification-guide.md
# All .md files MUST have this header:
# ---
# status: keep | working | temp | archive
# phase: planning | development | complete | deprecated
# type: spec | design | report | reference | guide | analysis
# version: 1.0
# last-updated: YYYY-MM-DD
# title: Document Title
# ---

# 5️⃣ PUBLISH results for other agents:
npx claude-flow@alpha memory store \
  --namespace "swarm/[AGENT-NAME]" \
  --key "[DELIVERABLE-NAME]" \
  --value "[RESULT-OR-FILE-CONTENT]"

# 🚨 CRITICAL: If you make architectural decisions, PUBLISH them:
# Examples of decisions to publish:
# - API design choices (class vs function, REST vs GraphQL)
# - File structure changes (moved files, renamed modules)
# - Breaking changes (changed function signatures, renamed types)
# - Technology choices (switched libraries, changed frameworks)

# 6️⃣ AFTER completing ALL tasks:
npx claude-flow@alpha hooks post-task --task-id "[AGENT-ROLE]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

---

## Agent Spawn Template

Use this template when spawning agents with Claude Code's Task tool.

```markdown
You are the [AGENT-NAME] agent for [PROJECT-NAME] swarm.

🔧 COORDINATION PROTOCOL (CRITICAL - EXECUTE EVERY STEP):

1️⃣ BEFORE starting ANY work:
npx claude-flow@alpha hooks pre-task --description "[AGENT-ROLE] work"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[PROJECT]"

2️⃣ READ context:
[For first agent]: Read design doc or requirements
[For dependent agents]: Wait for dependency:
while ! npx claude-flow@alpha memory read \
 --namespace "swarm/[DEPENDENCY-AGENT]" \
 --key "[DEPENDENCY-KEY]"; do
echo "Waiting for [dependency]..."
sleep 10
done

3️⃣ YOUR TASKS:

- [Specific task 1]
- [Specific task 2]
- [Specific task 3]
- Run tests: npm test -- [test-pattern]

4️⃣ AFTER EVERY file you edit:
npx claude-flow@alpha hooks post-edit --file "[file-path]" --memory-key "swarm/[agent]/progress"

📋 FOR ANY .md FILES YOU CREATE:
Add YAML frontmatter at the top:
---
status: keep
phase: complete
type: [spec|design|report|reference|guide]
version: 1.0
last-updated: [TODAY'S DATE]
title: [Document Title]
---

5️⃣ PUBLISH results:
npx claude-flow@alpha memory store \
 --namespace "swarm/[AGENT-NAME]" \
 --key "[DELIVERABLE]" \
 --value "[RESULT]"

6️⃣ AFTER completing ALL tasks:
npx claude-flow@alpha hooks post-task --task-id "[AGENT-ROLE]"
npx claude-flow@alpha hooks session-end --export-metrics true

QUALITY GATES (hooks will enforce):

- TypeScript: 0 errors allowed
- Tests: Must pass before proceeding
- ESLint: 0 errors allowed
- No @ts-nocheck, no @ts-ignore, no ': any' types
```

---

## Prompt Generation Template

Use this format when generating complete swarm prompts.

```markdown
# Swarm Objective: [OBJECTIVE]

## Context

[Brief description of current state and why swarm is needed]

## Requirements

- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Quality Gates (MANDATORY)

- TypeScript: 0 errors
- Tests: 100% passing
- **TDD Compliance**: Tests written using London School approach (mocks, behavior verification)
- ESLint: 0 errors
- All .md files have YAML frontmatter (see document-classification-guide.md)
- [Project-specific gates]

## Agents Required

### Agent 1: [Role] ([agent-type])

**Tasks:**

- [Task 1]
- [Task 2]
- [Task 3]

**Publishes to Memory:**

- `swarm/[agent]/[key-1]` - [Description]

**Dependencies:**

- None (or list what to wait for)

**Coordination Protocol:**
[Full 6-step protocol here]

---

### Agent 2: [Next Role] ([agent-type])

[Same structure...]

---

## Success Criteria

- [ ] All agents complete
- [ ] All quality gates pass
- [ ] All deliverables in memory
```

---

## Common Agent Configurations

### Architect Agent

```javascript
Task(
  'Architecture Design',
  `
You are the architect agent for [PROJECT] swarm.

[FULL 6-STEP PROTOCOL HERE]

# First, check existing architectural decisions for consistency
npx claude-flow@alpha memory list --namespace "architecture/*"
npx claude-flow@alpha memory read --namespace "architecture/decisions" --key "*" || true

YOUR TASKS:
- Design system architecture
- Define module boundaries (one module = one TDD agent)
- Create CODE-BASED CONTRACTS file (see below)
- Create directory structure
- Write architecture README

📜 CODE-BASED CONTRACTS (CRITICAL):
Create a contracts file with TypeScript interfaces that ALL other agents will import:

// contracts.ts
export type { User, Order, ... } from '../types';  // Re-export canonical types

export interface IUserService {
  createUser(data: CreateUserInput): Promise<User>;
  // ... define ALL module interfaces
}

This file is the SINGLE SOURCE OF TRUTH for types.
Other agents MUST import from here, not define their own types.

VERIFICATION GATE:
npx tsc --noEmit contracts.ts  # Must pass before other agents start

CAPTURE DECISIONS (for future swarm consistency):
npx claude-flow@alpha memory store \\
  --namespace "architecture/decisions" \\
  --key "[decision-name]" \\
  --value "[decision + rationale]"

npx claude-flow@alpha memory store \\
  --namespace "architecture/patterns" \\
  --key "[pattern-name]" \\
  --value "[how applied in this project]"

PUBLISHES:
- swarm/architect/contracts (path to contracts file)
- swarm/architect/modules (list of modules with ownership)
- swarm/architect/decisions (list of decisions stored)
- swarm/architect/complete
`,
  'system-architect'
);
```

### Coder Agent (with dependency)

```javascript
Task(
  'Feature Implementation',
  `
You are the coder agent for [PROJECT] swarm.

[FULL 6-STEP PROTOCOL HERE]

WAIT FOR:
while ! npx claude-flow@alpha memory read \\
  --namespace "swarm/architect" \\
  --key "interfaces"; do
  sleep 10
done

# Check for test contracts from tester agent (if available)
npx claude-flow@alpha memory read \\
  --namespace "swarm/tester" \\
  --key "contracts" || true

YOUR TASKS:
- Implement feature based on interfaces
- Write unit tests using London School TDD approach:
  * Mock collaborators to isolate units
  * Verify behavior/interactions, not just state
  * Reference: .claude/agents/testing/unit/tdd-london-swarm.md
- Ensure 0 TypeScript errors

PUBLISHES:
- swarm/coder/implementation-complete
`,
  'coder'
);
```

### Tester Agent (London School TDD)

```javascript
Task(
  'Test Suite',
  `
You are the tester agent for [PROJECT] swarm.

🧪 TESTING METHODOLOGY: London School TDD
Reference: .claude/agents/testing/unit/tdd-london-swarm.md

Follow the London School approach:
1. Write tests from OUTSIDE-IN (user behavior → implementation)
2. Use MOCKS to define collaborator contracts
3. Verify BEHAVIOR (how objects interact), not just state
4. Share mock contracts with other agents via memory

[FULL 6-STEP PROTOCOL HERE]

WAIT FOR:
while ! npx claude-flow@alpha memory read \\
  --namespace "swarm/coder" \\
  --key "implementation-complete"; do
  sleep 10
done

YOUR TASKS:
- Write tests BEFORE implementation where possible (true TDD)
- Use mocks to isolate units and define contracts
- Achieve 90%+ coverage
- Publish test contracts to swarm memory

Mock Contract Format:
npx claude-flow@alpha memory store \\
  --namespace "swarm/tester" \\
  --key "contracts" \\
  --value '{"ServiceName": {"method": {"input": "type", "output": "type"}}}'

PUBLISHES:
- swarm/tester/contracts (mock definitions for other agents)
- swarm/tester/tests-passing
`,
  'tdd-london-swarm'
);
```

### TDD-Dev Agent (SOC-Bounded - Recommended for Multi-Module)

Use this template when you need parallel TDD agents that each own a module. This preserves the RED-GREEN-REFACTOR loop within each agent.

```javascript
Task(
  'TDD Development - [MODULE-NAME]',
  `
You are a TDD-Dev agent for [PROJECT] swarm.
You OWN both tests AND implementation for [MODULE-NAME].

📁 YOUR FILES (you own these exclusively):
owns: [src/[module].ts, src/__tests__/[module].test.ts]

[FULL 6-STEP PROTOCOL HERE]

WAIT FOR Architect:
while ! npx claude-flow@alpha memory read \\
  --namespace "swarm/architect" \\
  --key "contracts"; do
  sleep 10
done

📜 IMPORT FROM CONTRACTS (CRITICAL):
// You MUST import types from the contracts file
import type { [Types] } from './contracts';
// DO NOT define your own types - use the architect's contracts

🔴🟢🔄 TDD CYCLE (within YOUR context):
1. RED: Write a failing test for one behavior
2. GREEN: Write minimal code to pass
3. REFACTOR: Improve while keeping green
4. REPEAT until module complete

YOUR TASKS:
- Import types from contracts.ts (never define your own)
- Write tests for [MODULE-NAME] interface (London School TDD)
- Implement to pass tests
- Verify: npm test -- [module-pattern]
- Verify: npx tsc --noEmit

VERIFICATION GATE (must pass before marking complete):
npm test -- [module] && npx tsc --noEmit

PUBLISHES:
- swarm/[module]/tests-passing
- swarm/[module]/implementation-complete
`,
  'tdd-london-swarm'
);
```

### Integration Tester Agent

Use after all TDD-Dev agents complete. Tests cross-module interactions.

```javascript
Task(
  'Integration Testing',
  `
You are the integration tester for [PROJECT] swarm.
You test CROSS-MODULE interactions after individual modules are complete.

[FULL 6-STEP PROTOCOL HERE]

WAIT FOR ALL module agents:
while ! npx claude-flow@alpha memory read --namespace "swarm/module-a" --key "implementation-complete"; do sleep 10; done
while ! npx claude-flow@alpha memory read --namespace "swarm/module-b" --key "implementation-complete"; do sleep 10; done
# ... wait for all modules

📜 IMPORT FROM CONTRACTS:
import type { [Types] } from './contracts';

YOUR TASKS:
- Write integration tests for cross-module workflows
- Test that modules work together correctly
- Verify end-to-end scenarios
- Do NOT test individual module internals (TDD-Dev agents did that)

VERIFICATION GATE:
npm test -- integration && npx tsc --noEmit

PUBLISHES:
- swarm/integration/tests-passing
`,
  'tdd-london-swarm'
);
```

### Reviewer/Validator Agent

```javascript
Task(
  'Final Validation',
  `
You are the reviewer agent for [PROJECT] swarm.

[FULL 6-STEP PROTOCOL HERE]

WAIT FOR ALL:
while ! npx claude-flow@alpha memory read --namespace "swarm/architect" --key "complete"; do sleep 10; done
while ! npx claude-flow@alpha memory read --namespace "swarm/coder" --key "implementation-complete"; do sleep 10; done
while ! npx claude-flow@alpha memory read --namespace "swarm/tester" --key "tests-passing"; do sleep 10; done

YOUR TASKS:
- Run FULL validation: ../../scripts/validate.sh
- Exit code MUST be 0 (all checks pass)
- If validation fails:
  * Report which checks failed
  * DO NOT commit
  * Exit with error
- If validation passes:
  * Create validation report
  * Commit changes with message

PUBLISHES:
- swarm/reviewer/validation-result
- swarm/reviewer/ci-green (only if passed)
`,
  'reviewer'
);
```

---

## Spawning Pattern

> **⚠️ REMINDER**: See [Single-Message Spawning](#️-critical-single-message-spawning) above.
> ALL agents MUST be spawned in ONE message. Separate messages = broken swarm.

```javascript
// ✅ CORRECT: One message with all Task() calls
[
  Task('Architect', '[full prompt]', 'system-architect'),
  Task('Backend', '[full prompt]', 'coder'),
  Task('Tester', '[full prompt]', 'tdd-london-swarm'),
  Task('Reviewer', '[full prompt]', 'reviewer'),

  // Also batch TodoWrite in the same message:
  TodoWrite([
    { content: 'Design architecture', status: 'in_progress', activeForm: 'Designing' },
    { content: 'Implement feature', status: 'pending', activeForm: 'Implementing' },
    { content: 'Write tests', status: 'pending', activeForm: 'Writing tests' },
    { content: 'Validate and commit', status: 'pending', activeForm: 'Validating' },
  ])
]
```

**Common mistake**: Spawning agents across multiple messages because prompts are long. Instead:
1. Prepare all agent prompts first (in your head or notes)
2. Send ONE message with ALL Task() calls
3. Include TodoWrite in the same message

---

## Validation Strategy

**Goal**: Prevent "passes locally but fails CI" issues.

### The Scripts

**`scripts/validate.sh`** - Full validation matching CI exactly:

- TypeScript type checking (0 errors)
- ESLint (0 errors)
- Prettier format check
- Full test suite (100% passing)

**`scripts/test.sh`** - Flexible scoped testing:

- `--package engine` - Test specific package
- `--lint --type --test` - Choose specific checks
- `--fix` - Auto-fix issues
- Useful during development, not for final validation

### Strategy A: Single Reviewer Pattern (DEFAULT)

**Use when**: Small swarms (2-4 agents), single package, or simplicity preferred

**How it works**:

- Individual agents: Focus on their work, don't run full validation
- Final Reviewer agent: Runs `../../scripts/validate.sh` after all agents complete
- ✅ No conflicts (serial execution)
- ✅ Simple coordination
- ⚠️ Agents don't get immediate feedback

**Example**: See "Reviewer/Validator Agent" template above

### When to Use Advanced Patterns

**If you have**:

- Large swarms (5+ agents)
- Agents want immediate validation feedback
- Single package (can't use scoped validation)

**Then consider**: Strategy C (Validation Lock) - See "Advanced Patterns" section below

---

## Common Agent Types

| Type               | Use For                       |
| ------------------ | ----------------------------- |
| `system-architect` | Design, structure, code-based contracts |
| `coder`            | Implementation (single module, no TDD ownership) |
| `tdd-london-swarm` | TDD-Dev agent: owns BOTH tests AND impl for a module |
| `tester`           | Generic testing (prefer `tdd-london-swarm` instead) |
| `reviewer`         | Validation, QA, commits       |
| `researcher`       | Analysis, investigation       |
| `backend-dev`      | API, database work            |
| `sparc-coord`      | SPARC methodology orchestration |

> **Multi-Module TDD**: For swarms with multiple modules, use `tdd-london-swarm` as TDD-Dev agents - each owns both tests AND implementation for their module. This preserves the RED-GREEN-REFACTOR loop. See "TDD-Dev Agent" template above.

---

## Verification

After swarm completes:

```bash
# Check memory coordination
npx claude-flow@alpha memory list --namespace "swarm/*"

# Check quality gates
npm run type-check && npm test && npm run lint

# Check hook logs
ls -la .swarm/hooks/*/logs/
```

---

## Troubleshooting

**Agents not waiting?** Add wait loop to prompt.
**Hooks not running?** Check `.claude/settings.json`.
**Quality bypassed?** Ensure 6-step protocol in every agent.

---

## Advanced Patterns

**Most projects should use Strategy A (Single Reviewer).** These patterns are for specific scenarios.

### Decision Tree

```
Do you have multiple packages (backend, frontend, mobile)?
├─ YES → Use Strategy B (Scoped Validation)
│         Each agent validates their package in parallel
│
└─ NO (single package)
    │
    ├─ Small swarm (2-4 agents)?
    │  └─ YES → Use Strategy A (Single Reviewer) ✅ RECOMMENDED
    │           Simple, no conflicts
    │
    └─ Large swarm (5+ agents) AND need immediate feedback?
       └─ YES → Use Strategy C (Validation Lock)
                More complex, but agents validate during work
```

---

### Strategy B: Scoped Validation (Multi-Package Monorepos)

**Use when**:

- Multi-package monorepo (backend + frontend + mobile + shared libs)
- Each agent works on a different package
- Want parallel validation without conflicts

**How it works**:

- Each agent validates ONLY their package using scoped commands
- No conflicts because different packages = different directories
- Final Reviewer still runs full `validate.sh`

**Example**:

```javascript
Task(
  'Backend Developer',
  `
YOUR TASKS:
- Implement API endpoints
- After work: ../../scripts/test.sh --package backend --all
- Exit code MUST be 0 before reporting done
`,
  'backend-dev'
);

Task(
  'Frontend Developer',
  `
YOUR TASKS:
- Implement UI components
- After work: ../../scripts/test.sh --package frontend --all
- Exit code MUST be 0 before reporting done
`,
  'coder'
);

Task(
  'Reviewer',
  `
WAIT FOR ALL agents to complete
YOUR TASKS:
- Run FULL validation: ../../scripts/validate.sh (all packages)
- Commit if passed
`,
  'reviewer'
);
```

**Pros**:

- ✅ No conflicts (different directories)
- ✅ Fast parallel validation
- ✅ Agents get immediate feedback

**Cons**:

- ❌ Only works with multiple packages
- ❌ Current project has 1 package (game-engine only)

---

### Strategy C: Validation Lock (The "Roll-Cage")

**⚠️ ADVANCED**: Use only when you need parallel agents to validate during their work.

**Use when**:

- Large swarms (5+ agents working in parallel)
- Single package (can't use scoped validation)
- Agents need immediate validation feedback (not willing to wait for final Reviewer)

**The Problem**: Multiple agents running `../../scripts/validate.sh` simultaneously causes conflicts:

- Test cache directories (`.vitest/`)
- Coverage reports (`coverage/`)
- Temp files

**The Solution**: Validation Lock - ensures only ONE agent validates at a time.

#### Implementation

**Add to each agent's task list**:

```bash
# After completing your work, BEFORE reporting done:

# 1. Acquire validation lock (wait if someone else has it)
echo "Acquiring validation lock..."
while ! npx claude-flow@alpha memory store \
  --namespace "swarm/validation" \
  --key "lock" \
  --value "[AGENT-ID]" \
  --ttl 600; do
  echo "Waiting for validation lock (another agent validating)..."
  sleep 10
done

# 2. Run full validation
echo "Running validation (lock acquired)..."
../../scripts/validate.sh
VALIDATION_RESULT=$?

# 3. Release lock
npx claude-flow@alpha memory delete \
  --namespace "swarm/validation" \
  --key "lock"

# 4. Check result
if [ $VALIDATION_RESULT -eq 0 ]; then
  echo "✅ Validation passed!"
  # Publish success
  npx claude-flow@alpha memory store \
    --namespace "swarm/[AGENT-ID]" \
    --key "validation-passed" \
    --value "true"
else
  echo "❌ Validation failed! Exit code: $VALIDATION_RESULT"
  # DO NOT proceed, DO NOT commit
  exit 1
fi
```

#### Trade-offs

**Pros**:

- ✅ Agents get immediate feedback during work
- ✅ No file conflicts (serialized validation)
- ✅ Works with single package

**Cons**:

- ❌ More complex coordination
- ❌ Agents wait for each other (serialized)
- ❌ If lock expires (TTL 600s), another agent can take it

#### When NOT to Use This

- Small swarms (2-4 agents) → Use Strategy A instead
- Multi-package monorepo → Use Strategy B (scoped validation) instead
- Prefer simplicity → Use Strategy A instead

**Default recommendation**: Start with Strategy A. Add Strategy C only when you actually experience the need for parallel validation.

---

---

## Post-Swarm: Cleanup Protocol

> **For triage decision tree:** See [workflow.md "Post-Swarm Triage"](./workflow.md#post-swarm-triage)

After swarm completes, most will have some CI failures. This is normal.

### Triage First

```bash
# Check what failed
npm run type-check   # TypeScript
npm test             # Tests
npm run lint         # Lint
```

### Cleanup Agent Templates

#### TypeScript Fixer

```javascript
Task('TypeScript Fixer',
  `You are a focused cleanup agent.

  🎯 YOUR ONLY JOB: Fix these TypeScript errors

  ISSUES TO FIX:
  [Paste TypeScript errors here]

  RULES:
  - Fix ONLY these TypeScript errors
  - Don't refactor or "improve" other code
  - Preserve existing logic
  - Add types, don't use 'any'

  WHEN DONE:
  npm run type-check  # Must exit 0
  npx claude-flow@alpha hooks post-task --task-id "typescript-fixer"
  `,
  'coder'
);
```

#### Test Fixer

```javascript
Task('Test Fixer',
  `You are a focused cleanup agent.

  🎯 YOUR ONLY JOB: Fix these test failures

  FAILING TESTS:
  [Paste test failures here]

  RULES:
  - Fix ONLY these failing tests
  - Update test expectations if implementation is correct
  - Fix implementation if test expectation is correct
  - Don't add new tests (unless needed for the fix)

  WHEN DONE:
  npm test  # Must exit 0
  npx claude-flow@alpha hooks post-task --task-id "test-fixer"
  `,
  'tester'
);
```

#### Coverage Fixer

```javascript
Task('Coverage Fixer',
  `You are a focused cleanup agent.

  🎯 YOUR ONLY JOB: Increase test coverage

  COVERAGE GAPS:
  [Paste coverage report here]

  TARGET: 90% coverage

  RULES:
  - Add tests for uncovered lines
  - Focus on meaningful tests, not line-hitting
  - Test edge cases and error paths
  - Don't modify implementation code

  WHEN DONE:
  npm test -- --coverage  # Must show 90%+ coverage
  npx claude-flow@alpha hooks post-task --task-id "coverage-fixer"
  `,
  'tester'
);
```

#### Lint Fixer

```javascript
Task('Lint Fixer',
  `You are a focused cleanup agent.

  🎯 YOUR ONLY JOB: Fix these lint errors

  LINT ERRORS:
  [Paste lint errors here]

  FIRST TRY AUTO-FIX:
  npm run lint -- --fix

  THEN FIX REMAINING MANUALLY:
  - Fix ONLY lint issues
  - Don't refactor other code

  WHEN DONE:
  npm run lint  # Must exit 0
  npx claude-flow@alpha hooks post-task --task-id "lint-fixer"
  `,
  'coder'
);
```

### Mini-Swarm Coordination Pattern

**Use when:** Type changes require test updates (interconnected failures)

```javascript
// Spawn in ONE message for coordination
[
  Task('Type Aligner',
    `Fix TypeScript errors. After fixing, publish interface changes:

    npx claude-flow@alpha memory store \\
      --namespace "cleanup/types" \\
      --key "changes" \\
      --value "[describe what interfaces/types changed]"

    ISSUES TO FIX:
    [Paste TypeScript errors]
    `,
    'coder'
  ),
  Task('Test Updater',
    `Wait for type changes, then update tests:

    # Wait for Type Aligner
    while ! npx claude-flow@alpha memory read \\
      --namespace "cleanup/types" \\
      --key "changes"; do
      echo "Waiting for type changes..."
      sleep 5
    done

    # Read what changed
    npx claude-flow@alpha memory read \\
      --namespace "cleanup/types" \\
      --key "changes"

    # Update tests to match type changes
    [Paste test failures here]
    `,
    'tester'
  )
]
```

### Pattern Capture (After Cleanup)

> **Critical:** Capturing failure patterns enables continuous improvement.

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

### Outcome Recording (After Success)

Add to Reviewer agent or run manually after swarm succeeds:

```bash
# Record successful swarm completion
npx claude-flow@alpha memory feedback \
  --pattern "swarm/[PROJECT]/config" \
  --outcome success \
  --reasoningbank

# This enables:
# - Bayesian confidence updates on this approach
# - Future swarms prioritize high-confidence patterns
# - System learns which agent configurations work best
```

---

## Adding to Your Project

1. Copy the `/docs/multi-agent/` folder to your project
2. See CLAUDE-FLOW-GUIDE.md "Project Setup" section for CLAUDE.md instructions

**This file is self-contained. Copy to any project.**
