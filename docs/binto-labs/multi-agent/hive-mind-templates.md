---
status: keep
phase: complete
type: reference
version: 1.1
last-updated: 2025-11-27
title: Hive-Mind Templates
author: Claude Code + Human Developer
tags: [hive-mind, queen, workers, templates, coordination, phases]
---

# Hive-Mind Templates

Complete guide for spawning Queen-coordinated hive-mind swarms.

> **When to use hive-mind vs swarm:** See [workflow.md](./workflow.md) decision tree.
> **For reference details:** See [claude-flow-guide.md](./claude-flow-guide.md) for architecture and commands.

---

## Quick Reference

### When to Use Hive-Mind (vs Regular Swarm)

**Use Hive-Mind when:**

- Complex tasks requiring runtime decisions
- Multi-phase work where later phases depend on findings
- Need central coordinator to adapt strategy
- Research-heavy tasks with uncertain scope
- Large efforts (7+ agents)
- Tasks may need reassignment based on results

**Use Regular Swarm when:**

- Tasks are well-defined upfront
- Clear, fixed dependencies
- 3-6 agents with predetermined work

### Two-Step Workflow

**Step 1 - Generate Prompt:**

```
Generate a hive-mind prompt for [OBJECTIVE] using ./hive-mind-templates.md
```

**Step 2 - Review & Spawn:**

```
Spawn this hive-mind using ./hive-mind-templates.md
```

**For full agent type list and command reference:**
See ./claude-flow-guide.md

---

## Hive-Mind Architecture

```
                    ┌─────────────┐
                    │   QUEEN     │
                    │ Coordinator │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
        │  Worker 1 │ │ Worker 2│ │  Worker N │
        │  (Phase A)│ │(Phase A)│ │ (Phase B) │
        └─────┬─────┘ └────┬────┘ └─────┬─────┘
              │            │            │
              └────────────┴────────────┘
                    Report to Queen
```

**Flow:**

1. Queen analyzes task → creates plan
2. Queen spawns workers (Phase A)
3. Workers execute → report to Queen
4. Queen evaluates → spawns Phase B workers
5. Repeat until objective complete
6. Queen validates final result

---

## The Queen Protocol

**CRITICAL**: Queen is spawned FIRST and coordinates all workers.

```bash
# ═══════════════════════════════════════════════════════════════
# QUEEN PROTOCOL - THE COORDINATOR
# ═══════════════════════════════════════════════════════════════

# 1️⃣ INITIALIZE hive-mind:
npx claude-flow@alpha hooks pre-task --description "Queen coordinator"
npx claude-flow@alpha hooks session-restore --session-id "hive-[PROJECT]"

# 2️⃣ ANALYZE objective and CREATE plan:
# - Break down into phases
# - Identify worker types needed
# - Define success criteria per phase
# - Publish plan to memory

npx claude-flow@alpha memory store \
  --namespace "hive/[PROJECT]" \
  --key "plan" \
  --value "[PHASE_BREAKDOWN_AND_WORKER_ASSIGNMENTS]"

# 3️⃣ SPAWN Phase A workers:
# Use Claude Code Task tool to spawn workers
# Give each worker their assignments and Queen reporting instructions

# 4️⃣ MONITOR worker progress:
# Poll memory for worker reports
while true; do
  npx claude-flow@alpha memory read --namespace "hive/worker-*" --key "report"
  # Evaluate reports, decide if phase complete
  # If phase complete, proceed to spawn Phase B
  sleep 15
done

# 5️⃣ EVALUATE and ADAPT:
# - If worker failed: reassign or spawn replacement
# - If scope changed: update plan, spawn new workers
# - If phase complete: spawn next phase workers

npx claude-flow@alpha memory store \
  --namespace "hive/queen" \
  --key "phase-[N]-evaluation" \
  --value "[FINDINGS_AND_NEXT_STEPS]"

# 6️⃣ VALIDATE completion:
# - Run all quality gates
# - Verify all success criteria met
# - Create final report
# - Commit changes

npx claude-flow@alpha memory store \
  --namespace "hive/queen" \
  --key "mission-complete" \
  --value "[FINAL_STATUS_AND_DELIVERABLES]"

npx claude-flow@alpha hooks post-task --task-id "queen"
npx claude-flow@alpha hooks session-end --export-metrics true
```

---

## The Worker Protocol

**CRITICAL**: Workers report TO the Queen, not to each other.

```bash
# ═══════════════════════════════════════════════════════════════
# WORKER PROTOCOL - EXECUTE AND REPORT
# ═══════════════════════════════════════════════════════════════

# 1️⃣ BEFORE starting:
npx claude-flow@alpha hooks pre-task --description "[WORKER-ROLE] work"
npx claude-flow@alpha hooks session-restore --session-id "hive-[PROJECT]"

# 2️⃣ READ Queen's plan and your assignment:
npx claude-flow@alpha memory read --namespace "hive/[PROJECT]" --key "plan"
npx claude-flow@alpha memory read --namespace "hive/queen" --key "[YOUR-ASSIGNMENT]"

# 3️⃣ EXECUTE your tasks:
# [Specific work here]
# Call post-edit hooks after each file
# FOR ANY .md FILES: Add YAML frontmatter per document-classification-guide.md

# 4️⃣ REPORT to Queen:
npx claude-flow@alpha memory store \
  --namespace "hive/[WORKER-ID]" \
  --key "report" \
  --value "{
    status: 'complete|blocked|needs-help',
    deliverables: [...],
    findings: [...],
    blockers: [...],
    recommendations: [...]
  }"

# 5️⃣ WAIT for Queen's response (if needed):
# Queen may give additional tasks or signal completion

# 6️⃣ AFTER completion:
npx claude-flow@alpha hooks post-task --task-id "[WORKER-ID]"
```

---

## Queen Spawn Template

```markdown
You are the QUEEN coordinator for [PROJECT] hive-mind.

🔧 QUEEN PROTOCOL (CRITICAL - YOU ARE THE COORDINATOR):

1️⃣ INITIALIZE:
npx claude-flow@alpha hooks pre-task --description "Queen coordinator"
npx claude-flow@alpha hooks session-restore --session-id "hive-[PROJECT]"

2️⃣ ANALYZE objective:

- Read requirements/context
- Break down into phases (Phase A, B, C...)
- Identify worker types needed per phase
- Define success criteria

3️⃣ CREATE and PUBLISH plan:
npx claude-flow@alpha memory store \
 --namespace "hive/[PROJECT]" \
 --key "plan" \
 --value "[YOUR_PHASE_BREAKDOWN]"

4️⃣ SPAWN Phase A workers:
Use Claude Code Task tool to spawn workers with:

- Their specific assignments
- Worker protocol instructions
- Report format

5️⃣ MONITOR progress:

- Poll memory for worker reports
- Evaluate completion/blockers
- Adapt plan if needed

6️⃣ SPAWN subsequent phases:
Based on Phase A results, spawn Phase B workers
Continue until all phases complete

7️⃣ VALIDATE and COMPLETE:

- Run quality gates (type-check, test, lint)
- Verify all success criteria
- Create final report
- Commit changes

npx claude-flow@alpha memory store \
 --namespace "hive/queen" \
 --key "mission-complete" \
 --value "[FINAL_STATUS]"

npx claude-flow@alpha hooks post-task --task-id "queen"

YOUR OBJECTIVE:
[DETAILED OBJECTIVE HERE]

SUCCESS CRITERIA:

- [Criterion 1]
- [Criterion 2]
- [Quality gates: 0 TS errors, tests passing, 0 ESLint errors]
```

---

## Worker Spawn Template

```markdown
You are [WORKER-ID] for [PROJECT] hive-mind.

🔧 WORKER PROTOCOL (CRITICAL - REPORT TO QUEEN):

1️⃣ INITIALIZE:
npx claude-flow@alpha hooks pre-task --description "[WORKER-ROLE]"
npx claude-flow@alpha hooks session-restore --session-id "hive-[PROJECT]"

2️⃣ READ assignment:
npx claude-flow@alpha memory read --namespace "hive/[PROJECT]" --key "plan"

3️⃣ EXECUTE your tasks:

- [Task 1]
- [Task 2]
- [Task 3]

After each file edit:
npx claude-flow@alpha hooks post-edit --file "[file]"

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

4️⃣ REPORT to Queen:
npx claude-flow@alpha memory store \
 --namespace "hive/[WORKER-ID]" \
 --key "report" \
 --value "{
status: 'complete',
deliverables: ['file1.ts', 'file2.ts'],
findings: ['discovered X needs Y'],
blockers: [],
recommendations: ['suggest Z for next phase']
}"

5️⃣ AFTER completion:
npx claude-flow@alpha hooks post-task --task-id "[WORKER-ID]"

QUALITY GATES:

- TypeScript: 0 errors
- Tests: Must pass
- Report must include status + deliverables
```

---

## Prompt Generation Template

```markdown
# Hive-Mind Objective: [OBJECTIVE]

## Context

[Current state and why hive-mind coordination is needed]

## Requirements

- [Requirement 1]
- [Requirement 2]

## Quality Gates

- TypeScript: 0 errors
- Tests: 100% passing
- ESLint: 0 errors
- All .md files have YAML frontmatter (see document-classification-guide.md)

## Hive-Mind Structure

### Queen: [Role] (queen-coordinator or hierarchical-coordinator)

**Responsibilities:**

- Analyze objective and create phased plan
- Spawn and coordinate workers
- Evaluate reports and adapt strategy
- Validate final completion

**Phases:**

- Phase A: [Description] - [Worker types needed]
- Phase B: [Description] - [Worker types needed]
- Phase C: [Description] - [Worker types needed]

**Coordination Protocol:**
[Full Queen protocol here]

---

### Workers (spawned by Queen)

**Phase A Workers:**

Worker A1: [Role] ([agent-type])

- Tasks: [...]
- Reports: findings, blockers, recommendations

Worker A2: [Role] ([agent-type])

- Tasks: [...]
- Reports: findings, blockers, recommendations

**Phase B Workers:** (spawned after Phase A evaluation)
[Queen decides based on Phase A results]

---

## Success Criteria

- [ ] All phases complete
- [ ] All quality gates pass
- [ ] Queen validates mission complete
```

---

## Spawning Pattern

**CRITICAL**: Spawn Queen FIRST, then Queen spawns workers.

```javascript
// Step 1: Spawn Queen (coordinates everything)
Task(
  'Queen Coordinator',
  `
You are the QUEEN coordinator for [PROJECT] hive-mind.

[FULL QUEEN PROTOCOL HERE]

YOUR OBJECTIVE: [objective]

PHASES:
- Phase A: Research and design
- Phase B: Implementation
- Phase C: Testing and validation

SUCCESS CRITERIA: [criteria]

SPAWN YOUR WORKERS using Claude Code Task tool with worker protocol.
`,
  'hierarchical-coordinator'
);

// Step 2: TodoWrite to track phases
TodoWrite([
  {
    content: 'Queen analyzes and creates plan',
    status: 'in_progress',
    activeForm: 'Queen planning',
  },
  { content: 'Phase A: Research and design', status: 'pending', activeForm: 'Executing Phase A' },
  { content: 'Phase B: Implementation', status: 'pending', activeForm: 'Executing Phase B' },
  {
    content: 'Phase C: Testing and validation',
    status: 'pending',
    activeForm: 'Executing Phase C',
  },
  { content: 'Queen validates completion', status: 'pending', activeForm: 'Queen validating' },
]);
```

The Queen will then spawn workers as needed for each phase.

---

## Common Hive-Mind Patterns

### Research → Design → Implement Pattern

```
Phase A (Research):
  - researcher-worker: Analyze codebase
  - researcher-worker: Find patterns
  → Report findings to Queen

Phase B (Design):
  - architect-worker: Design based on findings
  → Report design to Queen

Phase C (Implement):
  - coder-worker: Implement design
  - coder-worker: Write tests
  → Report completion to Queen

Phase D (Validate):
  - reviewer-worker: Final validation
  → Report to Queen

Queen validates and commits
```

### Parallel Investigation Pattern

```
Phase A (Parallel research):
  - worker-1: Investigate area A
  - worker-2: Investigate area B
  - worker-3: Investigate area C
  → All report to Queen

Phase B (Synthesis):
  Queen synthesizes findings
  Spawns workers based on combined knowledge

Phase C (Execution):
  Workers implement with full context
```

### Iterative Refinement Pattern

```
Phase A: Initial implementation
  → Workers report

Phase B: Queen evaluates, identifies gaps
  → Spawns refinement workers

Phase C: Refinement
  → Workers report

Phase D: Queen evaluates again
  → Repeat until quality met
```

---

## Queen Agent Types

| Type                                  | Use For                        |
| ------------------------------------- | ------------------------------ |
| `hierarchical-coordinator`            | General hive-mind coordination |
| `queen-coordinator`                   | Strategic decision-making      |
| `collective-intelligence-coordinator` | Consensus-based decisions      |

## Worker Agent Types

Same as regular swarm: `coder`, `tester`, `researcher`, `system-architect`, etc.

---

## Memory Namespace Convention

```
hive/[project]/plan          - Queen's master plan
hive/queen/phase-[N]-eval    - Phase evaluations
hive/queen/mission-complete  - Final status

hive/worker-[id]/report      - Worker reports to Queen
hive/worker-[id]/deliverable - Worker outputs
```

---

## Verification

```bash
# Check Queen's plan
npx claude-flow@alpha memory read --namespace "hive/[project]" --key "plan"

# Check worker reports
npx claude-flow@alpha memory list --namespace "hive/worker-*"

# Check Queen's evaluations
npx claude-flow@alpha memory list --namespace "hive/queen"

# Verify completion
npx claude-flow@alpha memory read --namespace "hive/queen" --key "mission-complete"
```

---

## Swarm vs Hive-Mind Decision Tree

```
Is the task well-defined with clear phases?
├─ YES → Are there 6 or fewer agents?
│        ├─ YES → Use Regular Swarm
│        └─ NO  → Use Hive-Mind
└─ NO  → Will scope likely change during execution?
         ├─ YES → Use Hive-Mind (Queen can adapt)
         └─ NO  → Use Regular Swarm
```

---

---

## Queen: Record Hive Outcome

> **For full workflow:** See [workflow.md "Validation & Pattern Capture"](./workflow.md#validation--pattern-capture)

After all phases complete and validation passes, Queen records outcomes:

### Success Recording

```bash
# Record successful hive completion
npx claude-flow@alpha memory feedback \
  --pattern "hive/[NAMESPACE]/config" \
  --outcome success \
  --reasoningbank

# Include metadata about what worked
npx claude-flow@alpha memory store \
  --namespace "hive/[NAMESPACE]" \
  --key "learnings" \
  --value '{
    "phases_completed": 4,
    "total_workers": 12,
    "duration_hours": 8,
    "key_decisions": [
      "used hierarchical for phase 1",
      "added security reviewer in phase 3",
      "parallel workers for phase 2 research"
    ],
    "what_worked": "Breaking research into parallel tracks",
    "what_to_improve": "Earlier type contract publishing"
  }'
```

### Failure Pattern Capture

If phases failed or required significant cleanup:

```bash
npx claude-flow@alpha memory store \
  --namespace "code-quality/failure-patterns" \
  --key "$(date +%Y%m%d)-hive-[brief-description]" \
  --value '{
    "hive_objective": "[what the hive was building]",
    "failure_phase": "[which phase failed]",
    "failure_category": "[coordination|types|tests|security|other]",
    "specific_issue": "[what went wrong]",
    "root_cause": "[why - was it Queen decision? worker execution? coordination?]",
    "fix_applied": "[how you fixed it]",
    "prevention": "[how to prevent: prompt change? phase structure? worker types?]"
  }'
```

### Add to Queen Protocol

Include in Queen's completion phase:

```markdown
7️⃣ RECORD OUTCOME (after successful validation):

# Record hive completion
npx claude-flow@alpha memory feedback \
  --pattern "hive/[NAMESPACE]/config" \
  --outcome success \
  --reasoningbank

# Store learnings for future hives
npx claude-flow@alpha memory store \
  --namespace "hive/[NAMESPACE]" \
  --key "learnings" \
  --value "{
    phases: [phases completed],
    workers: [total spawned],
    key_decisions: [what worked],
    improvements: [what to do better]
  }"
```

---

## Adding to Your Project

1. Copy the `/docs/multi-agent/` folder to your project
2. See CLAUDE-FLOW-GUIDE.md "Project Setup" section for CLAUDE.md instructions

**This file is self-contained. Copy to any project for Queen-coordinated hive-minds.**
