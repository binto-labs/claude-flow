---
status: proposal
type: structure
version: 1.0
last-updated: 2026-01-27
title: Binto-Flow Folder Structure Proposal
---

# Binto-Flow Folder Structure Proposal

## Proposed Structure

```
docs/binto-labs/
├── binto-flow/                    # Track A: Conservative (Manual Review)
│   ├── README.md                  # Overview + "manual review" philosophy
│   ├── workflow.md                # Two-step workflow (improved prompts)
│   ├── reference.md               # V3 CLI commands, hooks, agents
│   ├── swarm-templates.md         # Anti-drift defaults, model routing
│   ├── hive-mind-templates.md     # Raft consensus default
│   └── ralph-integration.md       # Iteration loops (unchanged)
│
├── binto-flow-auto/               # Track B: Progressive (Automated Gates)
│   ├── README.md                  # Overview + "automation" philosophy
│   ├── workflow.md                # Multi-phase gates (Plan→Build→Validate)
│   ├── gates.md                   # NEW: Gate definitions and validation rules
│   ├── escalation.md              # NEW: Human escalation protocol
│   ├── reference.md               # Same as Track A (symlink or copy)
│   ├── swarm-templates.md         # Auto-gate integrated templates
│   ├── hive-mind-templates.md     # Auto-consensus validation
│   └── ralph-integration.md       # Same as Track A (symlink or copy)
│
├── shared/                        # Shared between both tracks
│   ├── model-routing.md           # ADR-026 model selection (both use)
│   ├── anti-drift.md              # Anti-drift config (both use)
│   ├── hook-health.md             # Hook verification (both use)
│   └── quality-gates.md           # Gate definitions (Track B extends)
│
├── alignment-plan.md              # Gap analysis (existing)
├── v3-methodology-recommendations.md           # Initial recs (existing)
└── v3-methodology-recommendations-mv-feedback.md  # Two-track recs (existing)
```

## Encapsulation Strategy

### Option 1: Fully Self-Contained (Recommended)
Each folder is complete and standalone. Some duplication, but:
- No cross-folder dependencies
- Users only need one folder
- Easier to understand

### Option 2: Shared References
Use `shared/` folder for common elements:
- Less duplication
- Risk of confusion ("which shared doc do I read?")
- Harder to evolve independently

**Recommendation: Option 1** - Keep folders self-contained with minimal duplication.

## What's Shared vs Different

| Document | binto-flow (A) | binto-flow-auto (B) | Shared? |
|----------|----------------|---------------------|---------|
| README.md | Manual review philosophy | Automation philosophy | Different |
| workflow.md | Two-step + improved prompts | Multi-phase gates | Different |
| reference.md | V3 commands | V3 commands | **Same** |
| swarm-templates.md | Anti-drift, model routing | + auto-gates | Extends |
| hive-mind-templates.md | Raft default | + auto-validation | Extends |
| ralph-integration.md | Iteration loops | Iteration loops | **Same** |
| gates.md | N/A | Gate definitions | B only |
| escalation.md | N/A | Human escalation | B only |

## Implementation Plan

### Phase 1: Upgrade binto-flow/ to Track A
1. Update README.md - Add V3 context, anti-drift default
2. Update workflow.md - Add hook check, timeouts, structured review
3. Update reference.md - Fix @alpha→@v3alpha, add 12 workers, full CLI
4. Update swarm-templates.md - Anti-drift default, model routing
5. Update hive-mind-templates.md - Raft consensus default
6. ralph-integration.md - Minor model param additions

### Phase 2: Create binto-flow-auto/ for Track B
1. Create folder structure
2. Copy base documents from binto-flow/
3. Create README.md - Automation philosophy
4. Replace workflow.md - Multi-phase gates
5. Create gates.md - Gate definitions
6. Create escalation.md - Human escalation protocol
7. Update swarm-templates.md - Auto-gate integration
8. Update hive-mind-templates.md - Auto-validation

### Phase 3: Cross-Reference
1. Add "See also: binto-flow-auto/" to Track A README
2. Add "See also: binto-flow/" to Track B README
3. Document migration path between tracks

## Naming Alternatives

| Current Proposal | Alternative 1 | Alternative 2 |
|------------------|---------------|---------------|
| binto-flow | binto-flow-manual | binto-flow-v3 |
| binto-flow-auto | binto-flow-v3-auto | binto-flow-progressive |

**Recommendation:** Keep `binto-flow` for Track A (it's the established name, just upgraded). Use `binto-flow-auto` for Track B (clear distinction).

---

**Approve this structure?** Then I'll implement Phase 1 (upgrade binto-flow/) followed by Phase 2 (create binto-flow-auto/).

---

## Template File Analysis

### swarm-templates.md - Current Issues

| Line | Issue | Track A Fix | Track B Fix |
|------|-------|-------------|-------------|
| 65-71 | Infinite dependency wait | Add timeout (10 min) | Add timeout + auto-retry |
| 124 | `unified-coordinator` "replaces all" | Clarify: option, not replacement | Same |
| 143-153 | Task() calls have no model | Add model parameter | Add model + gate reference |
| - | No swarm_init call | Add anti-drift config | Add anti-drift + gate hooks |
| - | No hook health check | Add pre-flight verify | Add fail-loud verify |

### swarm-templates.md - Topology Change

**Current (no topology specified):**
```javascript
// Just spawns agents, no coordination init
Task('Architect', '...', 'system-architect')
Task('Coder', '...', 'coder')
```

**Track A (anti-drift default):**
```javascript
// 1. Initialize with anti-drift
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

// 2. Hook health check
// npx claude-flow@v3alpha hooks verify || exit 1

// 3. Spawn with models
Task({
  description: 'Architect',
  prompt: '...',
  subagent_type: 'system-architect',
  model: 'opus'
})
Task({
  description: 'Coder',
  prompt: '...',
  subagent_type: 'coder',
  model: 'sonnet'
})
```

**Track B (adds gate integration):**
```javascript
// Same as Track A, plus:
// 4. Gate 1 validation after plan
// 5. Gate 2 validation after build
// 6. Gate 3 validation after tests
// See gates.md for definitions
```

### hive-mind-templates.md - Current Issues

| Line | Issue | Track A Fix | Track B Fix |
|------|-------|-------------|-------------|
| 86 | `--topology mesh` | Change to `hierarchical-mesh` | Same + consensus |
| 372 | Same mesh default | Change to `hierarchical-mesh` | Same |
| - | No consensus strategy | Add `--consensus raft` | Add auto-consensus |
| - | No model routing | Add model to Queen/workers | Same |
| - | No hook health check | Add pre-flight verify | Add fail-loud |

### hive-mind-templates.md - Topology Change

**Current:**
```bash
npx claude-flow@v3alpha hive-mind init --topology mesh
```

**Track A:**
```bash
# Hook health check first
npx claude-flow@v3alpha hooks verify || exit 1

# Anti-drift hive-mind init
npx claude-flow@v3alpha hive-mind init \
  --topology hierarchical-mesh \
  --consensus raft
```

**Track B:**
```bash
# Same as Track A, plus:
# Auto-validation at phase boundaries
# Automated consensus for blockers
# See gates.md for phase gate definitions
```

### Template File Naming Decision

**Keep the same file names in both folders:**

| File | Purpose | Same in both tracks? |
|------|---------|---------------------|
| `swarm-templates.md` | 3-6 agent patterns | ✅ Yes (content differs) |
| `hive-mind-templates.md` | 7+ agent multi-phase | ✅ Yes (content differs) |

**Rationale:**
- Folder name (`binto-flow` vs `binto-flow-auto`) = which track
- File name = which complexity level
- Users pick a folder, then pick a complexity
- Consistent naming reduces cognitive load

---

### Model Routing for Templates (Opus-First)

**Philosophy:** Quality over cost optimization. Testing is as important as production code. Opus is more capable and less likely to drift or require retries.

**Default: Opus for all agents:**
```javascript
// Queen/Coordinator
Task({ ..., subagent_type: 'unified-coordinator', model: 'opus' })

// Architect
Task({ ..., subagent_type: 'system-architect', model: 'opus' })

// Coder - quality code matters
Task({ ..., subagent_type: 'coder', model: 'opus' })

// Tester - quality tests matter EQUALLY
Task({ ..., subagent_type: 'tester', model: 'opus' })

// Reviewer
Task({ ..., subagent_type: 'reviewer', model: 'opus' })

// Security
Task({ ..., subagent_type: 'security-architect', model: 'opus' })

// Researcher
Task({ ..., subagent_type: 'researcher', model: 'opus' })
```

**When to consider alternatives:**
| Model | When to use |
|-------|-------------|
| **opus** | Default for all agents (quality first) |
| **sonnet** | Explicit cost-saving mode, or genuinely simple isolated fixes |
| **haiku** | Only for Agent Booster-eligible transforms (var→const, add-types, etc.) |

**Anti-drift alignment:** Opus is less likely to make mistakes → fewer retries → actually costs less in the long run.

### Pre-Built Pattern Updates

All patterns (Feature Development, Full-Stack, Bug Fix, etc.) need:

1. **Anti-drift init block** at the start
2. **Hook health check** before spawning
3. **Model parameters** on each Task()
4. **Timeout on dependency waits**

**Track B additionally:**
5. **Gate checkpoints** between phases
6. **Auto-retry logic** references
7. **Escalation path** references

---

## Summary: Template Changes

| Change | swarm-templates.md | hive-mind-templates.md |
|--------|-------------------|------------------------|
| Add anti-drift init | ✅ Required | ✅ Required |
| Change topology default | N/A → hierarchical | mesh → hierarchical-mesh |
| Add consensus | N/A | ✅ Add raft |
| Add model routing | ✅ All Task() calls | ✅ Queen + workers |
| Add hook health check | ✅ Pre-flight | ✅ Pre-flight |
| Add dependency timeout | ✅ 10 min max | ✅ 10 min max |
| Clarify unified-coordinator | ✅ Option not replacement | N/A |
| Track B: Add gates | ✅ Gate references | ✅ Phase gates |
