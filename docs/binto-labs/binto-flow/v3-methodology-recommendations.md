---
status: draft
phase: recommendation
type: methodology-evolution
version: 1.0
last-updated: 2026-01-26
title: Binto-Flow V3 Methodology Recommendations
author: Claude Code (Researcher Analysis + User Input)
tags: [binto-flow, v3, recommendations, methodology, evolution]
---

# Binto-Flow V3 Methodology Recommendations

> **Purpose:** Recommended changes to evolve binto-flow methodology based on claude-flow V3 capabilities and user feedback.
> **Status:** Draft for review - DO NOT EDIT EXISTING DOCS until approved
> **Created:** 2026-01-26

---

## User-Directed Changes

Based on direct input, these changes are **confirmed requirements**:

| Decision | User Direction | Impact |
|----------|----------------|--------|
| Two-Step Workflow | **Automate if reliable** + multi-phase reviews | Major restructure |
| Hook Misconfiguration | **Fail loudly** (error out) | Add health checks |
| Model Routing (ADR-026) | **Integrate fully** | Add to all templates |
| Anti-Drift Config | **New default** | Replace mesh everywhere |

---

## Recommendation 1: Multi-Phase Review Workflow

### Current State
```
Generate Prompt → Human Review → Execute
```

**Problem:** Reviews are "too pedantic and over-engineer the solution."

### Recommended State: Iterative Phase Gates

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MULTI-PHASE WORKFLOW (Replaces Two-Step)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 1: PLAN                                                           │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐                      │
│  │ Generate │ ──▶ │ Auto-Validate│ ──▶ │  Gate 1  │                      │
│  │   Plan   │     │    Plan      │     │  Pass?   │                      │
│  └──────────┘     └──────────────┘     └────┬─────┘                      │
│                                              │                           │
│                   ┌──────────────────────────┴──────────────────────┐    │
│                   ↓ YES                                        NO ↓     │
│                                                                          │
│  PHASE 2: BUILD                                                          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐                      │
│  │  Build   │ ──▶ │ Auto-Validate│ ──▶ │  Gate 2  │                      │
│  │  (Swarm) │     │   Build      │     │  Pass?   │                      │
│  └──────────┘     └──────────────┘     └────┬─────┘                      │
│                                              │                           │
│                   ┌──────────────────────────┴──────────────────────┐    │
│                   ↓ YES                                        NO ↓     │
│                                                                          │
│  PHASE 3: VALIDATE                                                       │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐                      │
│  │  Tests   │ ──▶ │ Auto-Validate│ ──▶ │  Gate 3  │                      │
│  │  Lint    │     │   Results    │     │  Pass?   │                      │
│  └──────────┘     └──────────────┘     └────┬─────┘                      │
│                                              │                           │
│                   ┌──────────────────────────┴──────────────────────┐    │
│                   ↓ YES                                        NO ↓     │
│                                                                          │
│  PHASE 4: FINALIZE                                                       │
│  ┌──────────┐                                                            │
│  │ Complete │                                                            │
│  └──────────┘                                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Auto-Validation Rules (Not Pedantic)

**Gate 1 (Plan Validation):**
```javascript
// Validate plan has required elements, NOT style
const planGate = {
  required: [
    "objective_defined",      // Has clear goal
    "agents_specified",       // Lists agents to spawn
    "quality_gates_defined",  // Has measurable success criteria
    "dependencies_mapped"     // Shows what depends on what
  ],
  forbidden: [
    // NO style enforcement
    // NO "should use X library" opinions
    // NO architecture micro-management
  ]
};
```

**Gate 2 (Build Validation):**
```javascript
// Validate build succeeded, NOT code style
const buildGate = {
  required: [
    "typescript_compiles",    // npx tsc --noEmit = 0 errors
    "no_syntax_errors",       // Files parse correctly
    "expected_files_exist"    // Deliverables created
  ],
  forbidden: [
    // NO "refactor this function" suggestions
    // NO "add more comments" opinions
    // NO "use different pattern" recommendations
  ]
};
```

**Gate 3 (Validate Validation):**
```javascript
// Validate functionality, NOT perfection
const validateGate = {
  required: [
    "tests_pass",             // npm test = all green
    "lint_clean",             // npm run lint = 0 errors (not warnings)
    "coverage_threshold"      // If specified, meets threshold
  ],
  forbidden: [
    // NO "add more tests" unless coverage fails
    // NO "improve test names" suggestions
  ]
};
```

### Failure Handling

When a gate fails:
1. **Identify specific failures** (not vague "needs improvement")
2. **Spawn targeted fixer agent** for that specific failure
3. **Re-run same gate** (not escalate to human unless max retries)
4. **Max 3 retries per gate** before human escalation

```javascript
// Example: Gate 2 fails on TypeScript errors
if (!gate2.typescript_compiles) {
  Task({
    prompt: `Fix these specific TypeScript errors:
      ${tscOutput}

      ONLY fix the errors listed. Do NOT:
      - Refactor unrelated code
      - Add "improvements"
      - Change working code

      Run npx tsc --noEmit after fixes.`,
    subagent_type: "coder",
    model: "haiku"  // Simple fix = haiku
  });
}
```

---

## Recommendation 2: Fail-Loud Hook Health Checks

### Current State
Hooks assumed to be configured. Silent degradation if missing.

### Recommended State: Pre-Flight Hook Verification

Add to every swarm spawn, BEFORE agents start:

```javascript
// Hook Health Check (MUST pass before spawning agents)
const hookHealthCheck = async () => {
  const required = [
    { hook: "PreToolUse", matcher: "Write|Edit|MultiEdit" },
    { hook: "PostToolUse", matcher: "Write|Edit|MultiEdit" },
    { hook: "Stop", matcher: null }
  ];

  // Check .claude/settings.json
  const settings = await readSettings();

  for (const req of required) {
    const configured = settings.hooks?.[req.hook]?.some(
      h => !req.matcher || h.matcher?.includes(req.matcher.split("|")[0])
    );

    if (!configured) {
      throw new Error(`
        ❌ HOOK MISCONFIGURATION DETECTED

        Required hook "${req.hook}" ${req.matcher ? `for "${req.matcher}"` : ""} is not configured.

        Swarm coordination will NOT work correctly without this hook.

        To fix:
        1. Run: npx claude-flow@v3alpha init --force
        2. Or manually add to .claude/settings.json

        REFUSING TO PROCEED.
      `);
    }
  }

  console.log("✅ Hook health check passed");
};
```

### Agent Prompt Addition

Every agent prompt should include:

```markdown
## ⚠️ PRE-FLIGHT CHECK (Run First)

Before starting work, verify hooks are configured:

```bash
npx claude-flow@v3alpha hooks verify || exit 1
```

If this fails, STOP and report the error. Do not proceed without working hooks.
```

---

## Recommendation 3: Integrated Model Routing (ADR-026)

### Current State
Templates don't specify models. All agents use default (Sonnet).

### Recommended State: Task-Appropriate Model Selection

#### Agent Type to Model Mapping (Opus-First)

**Philosophy:** Quality over cost optimization. Testing is as important as production code. Opus is more capable and less likely to drift or require costly retries.

| Agent Type | Recommended Model | Rationale |
|------------|-------------------|-----------|
| `unified-coordinator` | **opus** | Strategic decisions, orchestration |
| `system-architect` | **opus** | Complex reasoning, design decisions |
| `security-architect` | **opus** | Critical analysis, can't miss things |
| `coder` | **opus** | Quality code matters |
| `tester` | **opus** | Quality tests matter EQUALLY |
| `reviewer` | **opus** | Thorough review required |
| `researcher` | **opus** | Deep analysis |

**When to consider alternatives:**
| Model | When to use |
|-------|-------------|
| **opus** | Default for all agents |
| **sonnet** | Explicit cost-saving mode only |
| **haiku** | Only for Agent Booster transforms (var→const, etc.) |

#### Updated Spawn Pattern

```javascript
// BEFORE (model-agnostic)
Task('Coder', '[prompt]', 'coder')

// AFTER (model-aware)
Task({
  description: 'Coder',
  prompt: '[prompt]',
  subagent_type: 'coder',
  model: determineModel(taskComplexity, agentType)
})
```

#### Model Determination Logic (Opus-First)

```javascript
function determineModel(task, agentType) {
  // Check for Agent Booster eligibility first (skip LLM entirely)
  if (isAgentBoosterEligible(task)) {
    return null; // Skip LLM, use Edit tool directly
  }

  // Explicit cost-saving mode requested?
  if (task.costMode === 'optimize') {
    return 'sonnet';
  }

  // Default: opus for all agents (quality first)
  return 'opus';
}

function isAgentBoosterEligible(task) {
  const boosterIntents = [
    'var-to-const',
    'add-types',
    'add-error-handling',
    'async-await',
    'add-logging',
    'remove-console'
  ];
  return boosterIntents.includes(task.intent);
}
```

#### Template Update Example

**Current swarm-templates.md:**
```javascript
Task('Architect', '[prompt]', 'system-architect')
Task('Coder', '[prompt]', 'coder')
Task('Tester', '[prompt]', 'tester')
```

**Recommended (Opus-First):**
```javascript
// All agents use opus by default - quality matters
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
  model: 'opus'  // Quality code
})

Task({
  description: 'Tester',
  prompt: '[prompt]',
  subagent_type: 'tester',
  model: 'opus'  // Quality tests matter EQUALLY
})
```

---

## Recommendation 4: Anti-Drift as Default Configuration

### Current State
Templates show various topologies (mesh, hierarchical, ring, star).

### Recommended State: Anti-Drift Default Everywhere

#### New Default Configuration

```javascript
// THE NEW DEFAULT for all coding swarms
const ANTI_DRIFT_CONFIG = {
  topology: "hierarchical",    // Coordinator validates against goal
  maxAgents: 8,                // Smaller team = less drift
  strategy: "specialized",     // Clear roles, no overlap
  consensus: "raft"            // Leader maintains authoritative state
};
```

#### When to Use What

| Scenario | Configuration | Rationale |
|----------|---------------|-----------|
| **Coding (default)** | Anti-drift | Code requires precision, drift is costly |
| **Research/exploration** | mesh + balanced | Needs flexibility, divergent thinking OK |
| **Documentation** | mesh + balanced | Creative writing, less rigid |
| **Refactoring** | Anti-drift | Must maintain exact behavior |
| **Security audit** | Anti-drift | Cannot miss things, strict |

#### Template Updates

**All swarm-templates.md patterns should change:**

**Before:**
```javascript
mcp__ruv-swarm__swarm_init({
  topology: "mesh",
  maxAgents: 6
})
```

**After:**
```javascript
// DEFAULT: Anti-drift configuration (recommended for coding)
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",  // Prevents drift via central coordination
  maxAgents: 8,              // Smaller team = easier alignment
  strategy: "specialized"    // Clear boundaries per agent
})

// For hive-mind, use raft consensus
npx claude-flow@v3alpha hive-mind init --topology hierarchical-mesh --consensus raft
```

---

## Recommendation 5: Dependency Wait Timeouts

### Current State (Weakness Found)
```bash
# Current: Infinite loop risk
while ! npx claude-flow@v3alpha memory retrieve ...; do
  sleep 10
done
```

### Recommended State: Bounded Waits

```bash
# NEW: Timeout after 10 minutes (60 iterations × 10s)
MAX_WAIT=60
WAIT_COUNT=0

while ! npx claude-flow@v3alpha memory retrieve \
  --namespace "swarm/architect" \
  --key "contracts"; do

  WAIT_COUNT=$((WAIT_COUNT + 1))

  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ TIMEOUT: Dependency 'architect/contracts' not available after 10 minutes"
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

## Recommendation 6: Context Budget Awareness

### Current State (Weakness Found)
No mention of context window limits for large swarms.

### Recommended State: Budget-Aware Prompts

Add to swarm templates:

```markdown
## Context Budget Guidelines

| Swarm Size | Max Prompt Size | Strategy |
|------------|-----------------|----------|
| 2-4 agents | Full prompts OK | Standard templates |
| 5-8 agents | Medium prompts | Compress instructions |
| 9+ agents | Minimal prompts | Reference external docs |

### Large Swarm Strategy

For 5+ agents, use external reference pattern:

```javascript
// Instead of embedding full protocol in each prompt
Task({
  prompt: `You are the Coder agent.

    Read protocol from: ./AGENTS.md#coder-protocol
    Read contracts from memory: swarm/architect/contracts

    Your task: [specific task only]`,
  subagent_type: 'coder',
  model: 'sonnet'
})
```

### Memory as Context Extension

Use memory to extend effective context:

```bash
# Store verbose instructions in memory (persists across agents)
npx claude-flow@v3alpha memory store \
  --namespace "swarm/protocols" \
  --key "coder-full" \
  --value "[full protocol details]"

# Agent prompts reference memory
"Read your full protocol: npx claude-flow@v3alpha memory retrieve --namespace swarm/protocols --key coder-full"
```
```

---

## Recommendation 7: Multi-Language Templates

### Current State (Weakness Found)
All examples are Node.js/TypeScript.

### Recommended State: Language-Agnostic + Specific Templates

#### Quality Gate Templates by Language

**Python:**
```bash
# Python quality gates
VERIFY_CMD="python -m py_compile src/*.py && pytest && ruff check src/"
```

**Go:**
```bash
# Go quality gates
VERIFY_CMD="go build ./... && go test ./... && golangci-lint run"
```

**Rust:**
```bash
# Rust quality gates
VERIFY_CMD="cargo check && cargo test && cargo clippy"
```

#### Language Detection in Templates

```javascript
// Auto-detect language and set appropriate gates
function getQualityGates(projectRoot) {
  if (fs.existsSync(`${projectRoot}/package.json`)) {
    return {
      typecheck: "npx tsc --noEmit",
      test: "npm test",
      lint: "npm run lint"
    };
  }
  if (fs.existsSync(`${projectRoot}/pyproject.toml`)) {
    return {
      typecheck: "mypy src/",
      test: "pytest",
      lint: "ruff check src/"
    };
  }
  if (fs.existsSync(`${projectRoot}/go.mod`)) {
    return {
      typecheck: "go build ./...",
      test: "go test ./...",
      lint: "golangci-lint run"
    };
  }
  // ... etc
}
```

---

## Recommendation 8: Error Recovery Protocol

### Current State (Weakness Found)
Silent failures in memory operations not handled.

### Recommended State: Explicit Error Handling

```bash
# BEFORE
npx claude-flow@v3alpha memory store --namespace "..." --key "..." --value "..."

# AFTER
if ! npx claude-flow@v3alpha memory store \
  --namespace "swarm/coder" \
  --key "deliverable" \
  --value "[result]"; then

  echo "❌ MEMORY STORE FAILED"

  # Retry once
  sleep 2
  if ! npx claude-flow@v3alpha memory store ...; then
    echo "❌ MEMORY STORE FAILED (retry)"
    echo "Falling back to file-based coordination"
    echo "[result]" > /tmp/swarm-coder-deliverable.txt
  fi
fi
```

---

## Summary of Changes

| Area | Current | Recommended |
|------|---------|-------------|
| **Workflow** | Two-step (generate → review → execute) | Multi-phase with automated gates |
| **Hooks** | Assumed configured | Pre-flight verification, fail loudly |
| **Model Routing** | Not specified | Full ADR-026 integration |
| **Default Topology** | mesh | Anti-drift (hierarchical + specialized) |
| **Dependencies** | Infinite wait | 10-minute timeout with escalation |
| **Context** | Unlimited assumption | Budget-aware, memory extension |
| **Languages** | Node.js only | Multi-language templates |
| **Errors** | Silent | Explicit handling with fallbacks |

---

## Implementation Priority

### Phase 1: Core Changes (Do First)
1. ✅ Multi-phase workflow definition
2. ✅ Hook health check requirement
3. ✅ Anti-drift as default

### Phase 2: Routing Integration
4. ✅ Model routing in all templates
5. ✅ Agent-to-model mapping

### Phase 3: Robustness
6. ✅ Dependency timeouts
7. ✅ Error recovery protocol

### Phase 4: Expansion
8. ✅ Multi-language templates
9. ✅ Context budget guidelines

---

## Questions for Further Refinement

1. **Retry limits**: Should gate failures allow 3, 5, or configurable retries?
2. **Human escalation**: When gates fail max retries, what's the escalation path?
3. **Model cost tracking**: Should we add cost awareness to model selection?
4. **Template versioning**: Should templates have version compatibility with claude-flow versions?

---

**Document Version**: 1.0 | **Created**: 2026-01-26 | **Status**: Draft for Review
