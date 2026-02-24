---
status: draft
phase: recommendation
type: methodology-evolution
version: 1.1
last-updated: 2026-01-27
title: Binto-Flow V3 Methodology - Two Track Approach
author: Claude Code
tags: [binto-flow, v3, recommendations, conservative, progressive, tracks]
---

# Binto-Flow V3: Two Track Approach

> **Purpose:** Define two implementation tracks for binto-flow V3 evolution
> **Status:** Draft for review
> **Created:** 2026-01-27

---

## Track Overview

| Track | Philosophy | Risk | Adoption Speed |
|-------|------------|------|----------------|
| **Track A: Conservative** | Like-for-like with V3 improvements | Low | Fast |
| **Track B: Progressive** | Full automation with multi-phase gates | Medium | Gradual |

Users can start with Track A and migrate to Track B when ready.

---

## Track A: Conservative (Like-for-Like)

### What Changes

| Area | Current | Track A |
|------|---------|---------|
| **Workflow** | Two-step (generate → review → execute) | **Keep** two-step, improve review prompts |
| **Hooks** | Assumed configured | **Add** pre-flight verification |
| **Model Routing** | Not specified | **Add** ADR-026 integration |
| **Default Topology** | mesh | **Change** to anti-drift |
| **Dependencies** | Infinite wait | **Add** timeouts |
| **Human Review** | Required | **Keep** required |

### What Stays the Same

- Manual human review between generate and execute
- 3-step protocol (READ → WORK → PUBLISH)
- Single-message spawning pattern
- Quality gates concept
- Ralph integration (iteration loops)

### Key Improvements

#### 1. Anti-Drift Default
```javascript
// NEW DEFAULT (replaces mesh)
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})
```

#### 2. Model Routing (Opus-First)
```javascript
// Quality over cost - opus for all agents by default
Task({
  description: 'Architect',
  prompt: '[prompt]',
  subagent_type: 'system-architect',
  model: 'opus'
})

Task({
  description: 'Coder',
  prompt: '[prompt]',
  subagent_type: 'coder',
  model: 'opus'  // Quality code matters
})

Task({
  description: 'Tester',
  prompt: '[prompt]',
  subagent_type: 'tester',
  model: 'opus'  // Quality tests matter EQUALLY
})
```

#### 3. Hook Health Check
```bash
# Add to start of every swarm
npx claude-flow@v3alpha hooks verify || {
  echo "❌ Hooks misconfigured. Run: npx claude-flow@v3alpha init --force"
  exit 1
}
```

#### 4. Dependency Timeouts
```bash
# Replace infinite loops with bounded waits
MAX_WAIT=60
WAIT_COUNT=0
while ! npx claude-flow@v3alpha memory retrieve ...; do
  WAIT_COUNT=$((WAIT_COUNT + 1))
  [ $WAIT_COUNT -ge $MAX_WAIT ] && exit 1
  sleep 10
done
```

#### 5. Better Review Prompts

Instead of letting review be "pedantic", provide structured review criteria:

```markdown
## Human Review Checklist (Track A)

Review the generated swarm prompt for:

### Must Have (Block if missing)
- [ ] Clear objective defined
- [ ] Agents specified with roles
- [ ] Quality gates are measurable (not vague)
- [ ] Dependencies mapped

### Should Not Have (Flag for discussion)
- [ ] Over-engineered solutions (YAGNI violations)
- [ ] Premature abstractions
- [ ] Scope creep beyond original task

### Do NOT review for
- Code style preferences (trust the agents)
- Library choices (unless security concern)
- "Better" ways to do things (if current way works)
```

---

## Track B: Progressive (Full Automation)

### What Changes

| Area | Current | Track B |
|------|---------|---------|
| **Workflow** | Two-step | **Multi-phase** with automated gates |
| **Hooks** | Assumed configured | **Fail loudly** if missing |
| **Model Routing** | Not specified | **Full** ADR-026 integration |
| **Default Topology** | mesh | **Anti-drift** default |
| **Dependencies** | Infinite wait | **Timeouts** with escalation |
| **Human Review** | Required | **Automated** (human on failure) |

### Multi-Phase Workflow

```
PHASE 1: PLAN
  Generate → Auto-Validate → Gate 1 (pass/fail)
                                ↓ fail? → Retry (max 3)
                                          ↓ still fail? → Human

PHASE 2: BUILD
  Swarm Execute → Auto-Validate → Gate 2 (pass/fail)
                                     ↓ fail? → Targeted fix agent
                                               ↓ still fail? → Human

PHASE 3: VALIDATE
  Tests + Lint → Auto-Validate → Gate 3 (pass/fail)
                                    ↓ fail? → Fix agent
                                              ↓ still fail? → Human

PHASE 4: COMPLETE
  All gates passed → Done
```

### Auto-Gate Definitions

**Gate 1 (Plan)** - Structural validation only:
```javascript
const gate1 = {
  checks: [
    "has_objective",           // Boolean: objective string exists
    "has_agents",              // Boolean: agents array not empty
    "has_quality_gates",       // Boolean: gates defined
    "agents_have_roles"        // Boolean: each agent has type
  ],
  // NO style checks, NO "better approach" suggestions
};
```

**Gate 2 (Build)** - Compilation validation:
```javascript
const gate2 = {
  checks: [
    "compiles",                // Exit code 0 from compiler
    "no_syntax_errors",        // Parser succeeds
    "files_exist"              // Expected deliverables present
  ],
  // NO refactoring suggestions, NO code review
};
```

**Gate 3 (Validate)** - Test validation:
```javascript
const gate3 = {
  checks: [
    "tests_pass",              // All tests green
    "lint_clean",              // No lint errors (warnings OK)
    "coverage_met"             // If threshold set, meets it
  ],
  // NO "add more tests", NO "improve names"
};
```

### Escalation Path

```
Gate Failure
    ↓
Retry 1 (same agent, specific error context)
    ↓ fail
Retry 2 (same agent, expanded context)
    ↓ fail
Retry 3 (different model - upgrade to opus)
    ↓ fail
Human Escalation
    ↓
Human provides guidance
    ↓
Resume from current phase
```

---

## Migration Path: A → B

Users can migrate incrementally:

### Stage 1: Track A (Baseline)
- Manual review
- Anti-drift config
- Model routing
- Hook verification
- Timeouts

### Stage 2: Partial Automation
- Auto-validate Gate 2 (build) - most objective
- Keep manual review for Gate 1 (plan)
- Keep manual review for Gate 3 (validate)

### Stage 3: More Automation
- Auto-validate Gate 2 + Gate 3
- Keep manual review for Gate 1 (plan)

### Stage 4: Full Track B
- Auto-validate all gates
- Human only on escalation

---

## My Recommendations on Open Questions

### 1. Retry Limits

**Recommendation: 3 retries per gate**

Rationale:
- 1 retry: Too aggressive, genuine issues may need multiple attempts
- 5 retries: Too lenient, wastes resources on stuck issues
- 3 retries: Sweet spot - enough to handle transient issues, fast enough to escalate real problems

```javascript
const RETRY_CONFIG = {
  gate1_plan: 3,
  gate2_build: 3,
  gate3_validate: 3,
  total_max: 9  // Cap total retries across all gates
};
```

### 2. Human Escalation Path

**Recommendation: Structured escalation with context**

When escalating to human, provide:

```markdown
## 🚨 Human Escalation Required

**Phase**: Build (Gate 2)
**Retry Count**: 3/3 exhausted
**Duration**: 12 minutes

### What Happened
- Initial attempt: TypeScript error TS2322 (type mismatch)
- Retry 1: Fixed TS2322, new error TS2339 (property doesn't exist)
- Retry 2: Fixed TS2339, TS2322 returned (circular fix)
- Retry 3: Same pattern, likely architectural issue

### Agent Analysis
The type system is fighting the implementation. This may indicate:
1. Contracts need revision
2. Implementation approach incompatible with types
3. Third-party type definitions outdated

### Suggested Human Actions
- [ ] Review contracts.ts for feasibility
- [ ] Check if type definitions need updating
- [ ] Consider alternative approach

### Resume Command
After fixing, run:
```bash
npx claude-flow@v3alpha swarm resume --phase build --session [id]
```
```

### 3. Model Cost Tracking

**Recommendation: Yes, add cost awareness (but don't optimize prematurely)**

Track costs for visibility, but don't let cost override correctness:

```javascript
const MODEL_COSTS = {
  haiku: { input: 0.00025, output: 0.00125 },   // per 1K tokens
  sonnet: { input: 0.003, output: 0.015 },
  opus: { input: 0.015, output: 0.075 }
};

// Log costs but don't downgrade critical tasks
function selectModel(task, agentType) {
  const model = determineOptimalModel(task, agentType);

  console.log(`[Cost] ${agentType}: ${model} (est. $${estimateCost(task, model)})`);

  // NEVER downgrade security-architect from opus to save money
  return model;
}
```

**Cost summary at end of swarm:**
```
Swarm Complete: auth-feature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Duration: 8m 32s
Agents: 6
Model Usage:
  - opus: 6 agents (all) - $1.26
Total Cost: $1.26

Note: Opus-first approach prioritizes quality.
Fewer retries and better output = lower effective cost.
```

### 4. Template Versioning

**Recommendation: Yes, use semver compatibility markers**

```yaml
# In template header
---
template: coder-agent
version: 2.1.0
requires:
  claude-flow: ">=3.0.0-alpha.50"
  hooks: ["PreToolUse", "PostToolUse", "Stop"]
  features: ["model-routing", "anti-drift"]
deprecated_by: null
---
```

Benefits:
- Clear which templates work with which claude-flow versions
- Can warn users if template is outdated
- Enables automated template updates

---

## Document Summary

| Document | Track A Changes | Track B Changes |
|----------|-----------------|-----------------|
| **README.md** | Add V3 defaults, anti-drift note | Add automation overview |
| **workflow.md** | Add hook check, timeouts, model routing | Replace two-step with multi-phase |
| **reference.md** | Fix @alpha→@v3alpha, add 12 workers, CLI commands | Add gate definitions |
| **swarm-templates.md** | Anti-drift default, model params, better review prompts | Auto-gate integration |
| **hive-mind-templates.md** | Raft consensus default | Automated consensus validation |
| **ralph-integration.md** | Add model params (minor) | Same |

---

## Recommended Approach

1. **Create Track A first** - Lower risk, immediate value
2. **Test Track A in production** - Gather data on where manual review adds value
3. **Implement Track B incrementally** - Start with Gate 2 (most objective)
4. **Full Track B optional** - Some teams may prefer to stay on Track A

---

**Document Version**: 1.1 | **Created**: 2026-01-27 | **Status**: Ready for Review
