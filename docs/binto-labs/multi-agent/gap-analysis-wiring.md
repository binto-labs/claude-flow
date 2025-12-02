---
status: keep
phase: complete
type: analysis
version: 1.0
last-updated: 2025-12-02
title: Gap Analysis - SPARC and TDD London Wiring
author: Claude Code + Human Developer
tags: [gap-analysis, sparc, tdd, london-school, wiring, methodology]
---

# Gap Analysis: SPARC & TDD London Integration

> **Purpose**: This document analyzes gaps between the binto-labs multi-agent docs and the available claude-flow constructs (agents, skills), with specific recommendations for wiring SPARC and London School TDD into the workflow.

---

## Executive Summary

### Current State
The multi-agent docs provide an excellent "prompt interface" for orchestrating claude-flow, but they:
1. **Don't explicitly wire in SPARC methodology** - It's available but not default
2. **Reference London TDD by name only** - Don't point to the actual agent
3. **Don't reference available skills/agents** - Claude Code doesn't know what's available

### Recommended Changes
1. **Make SPARC the default for development tasks** - Phases sized to task complexity
2. **Wire `tdd-london-swarm` agent into tester templates** - Explicit reference
3. **Add "Available Resources" guidance** - Point to `.claude/skills/` and `.claude/agents/`

---

## Gap 1: SPARC Not Wired as Default

### Current State in workflow.md

The decision tree in workflow.md (lines 36-51) focuses on **task size** to determine approach:
- Single task → Single agent
- Multi-component → Swarm
- Complex project → Hive-mind

**Missing**: SPARC methodology should inform **how** agents work, regardless of swarm size.

### Available Constructs (Not Referenced)

| Construct | Location | Purpose |
|-----------|----------|---------|
| `sparc-coord` agent | `.claude/agents/templates/sparc-coordinator.md` | Orchestrates all SPARC phases with quality gates |
| `specification` agent | `.claude/agents/sparc/specification.md` | Requirements gathering, acceptance criteria |
| `pseudocode` agent | `.claude/agents/sparc/pseudocode.md` | Algorithm design, complexity analysis |
| `architecture` agent | `.claude/agents/sparc/architecture.md` | System design, interface contracts |
| `refinement` agent | `.claude/agents/sparc/refinement.md` | TDD implementation, optimization |
| SPARC skill | `.claude/skills/sparc-methodology/SKILL.md` | 17+ modes including `tdd`, `api`, `ui`, `refactor` |

### Recommended Wiring

**Add to workflow.md "Pre-Work" section:**

```markdown
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

**Available SPARC Agents:**
- `sparc-coord` - Full phase orchestration
- `specification`, `pseudocode`, `architecture`, `refinement` - Individual phases
- SPARC skill: `@.claude/skills/sparc-methodology/SKILL.md`
```

---

## Gap 2: TDD London Not Explicitly Wired

### Current State in swarm-templates.md

Line 279 mentions "London School TDD" in the Coder Agent example:
```javascript
// Line 279: "Write unit tests (London School TDD)"
```

**Problem**: This is a passing mention. It doesn't:
- Reference the actual `tdd-london-swarm` agent
- Explain what London School TDD means
- Make it the default testing approach

### Available Construct (Not Referenced)

| Construct | Location | Capabilities |
|-----------|----------|--------------|
| `tdd-london-swarm` | `.claude/agents/testing/unit/tdd-london-swarm.md` | Outside-in TDD, mock-driven development, behavior verification, swarm test coordination |

### The London School Approach (from agent definition)

1. **Outside-In Development**: Start from user behavior, drive down to implementation
2. **Mock-First**: Define collaborator contracts through mocks
3. **Behavior Verification**: Focus on HOW objects collaborate, not internal state
4. **Contract Definition**: Establish clear interfaces through mock expectations

### Recommended Wiring

**Update Tester Agent template in swarm-templates.md:**

```javascript
Task(
  'Test Suite',
  `
You are the tester agent for [PROJECT] swarm.

🧪 TESTING METHODOLOGY: London School TDD
Reference: @.claude/agents/testing/unit/tdd-london-swarm.md

Follow the London School approach:
1. Write tests from OUTSIDE-IN (user behavior → implementation)
2. Use MOCKS to define collaborator contracts
3. Verify BEHAVIOR (how objects interact), not just state
4. Share mock contracts with other agents via memory

[FULL 6-STEP PROTOCOL HERE]

YOUR TASKS:
- Write tests BEFORE implementation (true TDD)
- Use mocks to isolate units and define contracts
- Achieve 90%+ coverage
- Publish test contracts to swarm memory

Mock Contract Format:
npx claude-flow@alpha memory store \\
  --namespace "swarm/tester" \\
  --key "contracts" \\
  --value '{"UserService": {"register": {"input": {...}, "output": {...}}}}'

PUBLISHES:
- swarm/tester/contracts (mock definitions for other agents)
- swarm/tester/tests-passing
`,
  'tdd-london-swarm'  // ← Use the actual London TDD agent type
);
```

**Add to Quality Gates section:**

```markdown
## Quality Gates (MANDATORY)

- TypeScript: 0 errors
- Tests: 100% passing
- **TDD Compliance**: Tests written BEFORE implementation
- **London School Verification**: Mocks verify behavior, not state
- ESLint: 0 errors
```

---

## Gap 3: Available Resources Not Referenced

### Current State

The multi-agent docs don't tell Claude Code what skills and agents are available. This means:
- Claude Code may not know about specialized agents
- Users don't know what's possible
- The "prompt interface" is incomplete

### Available Resources

**76 Agents in `.claude/agents/`:**
```
├── coordination/     (hierarchical, mesh, adaptive coordinators)
├── sparc/           (specification, pseudocode, architecture, refinement)
├── testing/         (tdd-london-swarm, integration testers)
├── templates/       (sparc-coordinator, task-orchestrator)
├── consensus/       (byzantine, raft, gossip coordinators)
├── github/          (pr-manager, code-review, issue-tracker)
└── specialized/     (backend-dev, ml-developer, cicd-engineer)
```

**26 Skills in `.claude/skills/`:**
```
├── sparc-methodology/     (17+ development modes)
├── swarm-orchestration/   (parallel task execution)
├── verification-quality/  (truth scoring, rollback)
├── pair-programming/      (driver/navigator modes)
└── ... (see full list)
```

### Recommended Wiring

**Add new section to workflow.md:**

```markdown
## Available Resources

> Claude Code should consider these resources when forming swarms and selecting agents.

### Specialized Agents
Location: `.claude/agents/`

| Category | Key Agents | Use For |
|----------|------------|---------|
| **SPARC** | `sparc-coord`, `specification`, `architecture`, `refinement` | Methodology orchestration |
| **Testing** | `tdd-london-swarm`, `production-validator` | Quality assurance |
| **Coordination** | `hierarchical-coordinator`, `mesh-coordinator` | Swarm topology |
| **GitHub** | `pr-manager`, `code-review-swarm`, `release-manager` | Repository ops |
| **Development** | `backend-dev`, `system-architect`, `api-docs` | Specialized implementation |

### Skills (Invoke with `@skill-name`)
Location: `.claude/skills/`

| Skill | Purpose |
|-------|---------|
| `sparc-methodology` | Full SPARC development modes |
| `swarm-orchestration` | Multi-agent coordination |
| `verification-quality` | Truth scoring & validation |
| `pair-programming` | Driver/navigator TDD |

### Agent Discovery

When forming a swarm, Claude Code should:
1. Check `.claude/agents/` for specialized agents matching task needs
2. Consider `.claude/skills/` for methodology guidance
3. Default to SPARC phases for all development work
4. Use `tdd-london-swarm` for testing unless Chicago School is specifically requested
```

---

## Gap 4: Document Classification Confirmation

### Current State: ✅ Already Integrated

The document classification guide IS properly referenced in:
- `workflow.md` line 393-406 (Commit section)
- `swarm-templates.md` lines 76-85 (6-step protocol)

**No changes needed** - this is working as intended.

---

## Implementation Checklist

### workflow.md Updates

- [ ] Add "Default Methodology: SPARC" section after task complexity decision tree
- [ ] Add "Available Resources" section with agent/skill tables
- [ ] Update success criteria to include TDD compliance

### swarm-templates.md Updates

- [ ] Update Tester Agent template to reference `tdd-london-swarm` explicitly
- [ ] Add mock contract publishing pattern to Tester Agent
- [ ] Change agent type from `'tester'` to `'tdd-london-swarm'` in examples
- [ ] Add London School verification to Quality Gates

### New Patterns to Add

- [ ] SPARC-aware swarm formation pattern
- [ ] Mock contract coordination pattern between tester and coder agents
- [ ] Phase-appropriate SPARC scaling guidance

---

## Example: Fully Wired Swarm Prompt

Here's what a swarm prompt looks like with all gaps addressed:

```markdown
# Swarm Objective: Implement User Authentication API

## Methodology: SPARC (Full Cycle)
Reference: @.claude/skills/sparc-methodology/SKILL.md

### Phase 1: Specification
Agent: `specification`
- Define authentication requirements
- Document edge cases (rate limiting, lockout)
- Acceptance criteria for each endpoint

### Phase 2: Pseudocode
Agent: `pseudocode`
- JWT token flow algorithm
- Password hashing approach
- Session management logic

### Phase 3: Architecture
Agent: `system-architect`
- Component diagram
- Interface contracts (publish to memory)
- Database schema

### Phase 4: Refinement (TDD)
Agents: `coder` + `tdd-london-swarm`
- **Tester writes tests FIRST (London School)**
- Coder implements to pass tests
- Mock contracts shared via memory
- Iterate until 90%+ coverage

### Phase 5: Completion
Agent: `reviewer` + `production-validator`
- Integration tests
- Security audit
- Documentation
- CI/CD pipeline

## Quality Gates (MANDATORY)
- TypeScript: 0 errors
- Tests: 100% passing (London School TDD)
- ESLint: 0 errors
- Coverage: 90%+
- SPARC phases: All complete
```

---

## Summary of Changes

| Document | Section | Change |
|----------|---------|--------|
| `workflow.md` | Pre-Work | Add SPARC as default for development tasks |
| `workflow.md` | New section | Add "Available Resources" with agent/skill tables |
| `swarm-templates.md` | Tester Agent | Reference `tdd-london-swarm` explicitly |
| `swarm-templates.md` | Quality Gates | Add TDD compliance and London School verification |
| `swarm-templates.md` | Agent types | Change `'tester'` to `'tdd-london-swarm'` |

---

**Version**: 1.0.0 | **Last Updated**: 2025-12-02
