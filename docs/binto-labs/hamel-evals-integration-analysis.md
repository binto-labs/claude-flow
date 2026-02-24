# Hamel's Evals Methodology: Claude-Flow Integration Analysis

**Date**: 2025-11-25
**Purpose**: Deep analysis of how Hamel Husain's evaluation methodology could integrate with claude-flow workflows
**Related Documents**:
- `Hamels evals for claude-flow analysis.md` - Source analysis
- `multi-agent/swarm-templates.md` - Current swarm workflow
- `multi-agent/hive-mind-templates.md` - Current hive-mind workflow
- `project-reasoningbank-readme.md` - Pattern database for objective review

---

## Executive Summary

Claude-flow has strong orchestration and neural pattern learning but lacks systematic output evaluation. Hamel's methodology fills this gap by adding **Layer 2: Output Quality Evaluation** between traditional quality gates and orchestration optimization.

**Key Finding**: The integration doesn't require new tools—it requires **new practices encoded in templates**.

---

## The Core Insight

### Three Evaluation Layers

```
Layer 1: Traditional Quality Gates (claude-flow HAS)
├── TypeScript compilation (0 errors)
├── Test suite (100% passing)
└── ESLint (0 errors)
         ↓
Layer 2: Output Quality Evaluation (claude-flow NEEDS - Hamel's Focus)
├── Is code architecturally coherent?
├── Did agents coordinate contracts properly?
├── Were security patterns followed?
└── Does output match specifications?
         ↓
Layer 3: Orchestration Optimization (claude-flow HAS)
├── Was mesh better than hierarchical?
├── Did 5 agents outperform 3?
└── Should we allocate more time to testing phase?
```

**Current state**: Claude-flow optimizes Layer 3 using Layer 1 signals (pass/fail).

**Enhanced state**: Claude-flow optimizes Layer 3 using Layer 1 + Layer 2 signals (pass/fail + quality scores).

---

## Integration Strategy Options

### Option A: Error Analysis as a Dedicated Swarm Phase

**Current 6-step protocol:**
```
1️⃣ Pre-task → 2️⃣ Read context → 3️⃣ Execute → 4️⃣ Post-edit → 5️⃣ Publish → 6️⃣ Complete
```

**Enhanced 8-step protocol:**
```
1️⃣ Pre-task hooks
2️⃣ Read context
3️⃣ Execute tasks
4️⃣ Post-edit hooks
5️⃣ Traditional gates (TypeScript, tests, lint)
6️⃣ NEW: Output evaluation (Layer 2)
7️⃣ Publish results (including eval score)
8️⃣ Complete (neural learning now has richer signal)
```

**Key difference**: Step 6 evaluates WHAT was produced, not just IF it compiles/passes.

---

### Option B: ReasoningBank as Evaluation Pattern Store

**Current infrastructure:**
```
.reasoningbank/.swarm/memory.db  ← 2,600 universal patterns
.swarm/memory.db                 ← Project-specific decisions
```

**Gap**: ReasoningBank has generic patterns. Hamel insists criteria must emerge from observed failures in YOUR system.

**Enhanced structure:**
```
.reasoningbank/
  .swarm/
    memory.db           ← Universal patterns (2,600)
    project-patterns.db ← NEW: Patterns discovered through error analysis
```

**Feedback loop:**
```
Swarm runs → Failures occur → Human categorizes → Patterns stored →
Next swarm uses patterns → Better evaluation → Fewer failures
```

---

### Option C: Hive-Mind Queen as Error Analysis Coordinator

**Enhanced Queen Protocol:**

```markdown
## Error Analysis (After each phase)

After Phase A workers report:
1. Retrieve all worker reports
2. Analyze coordination quality:
   - Did workers use published contracts?
   - Were there type mismatches?
   - Any patterns from project-patterns violated?
3. Store analysis:

npx claude-flow@alpha memory store \
  --namespace "hive/queen" \
  --key "phase-A-eval" \
  --value "{
    coordination_score: 0.85,
    failures: ['Type mismatch: UserDTO vs User'],
    adaptation: 'Phase B workers must validate types before implementation'
  }"

4. Adjust Phase B based on findings
```

This makes the Queen a **learning coordinator** who accumulates domain expertise through observation—exactly Hamel's principle.

---

### Option D: Transition Failure Matrices

**Concept**: Track where agent handoffs fail.

```
                → Coder  → Tester  → Reviewer
Architect →       2 fail   0 fail    1 fail
Coder →           -        12 fail   2 fail
Tester →          -        -         1 fail

Insight: Focus on Coder→Tester handoffs (60% of failures)
```

**Implementation:**
```bash
npx claude-flow@alpha analyze-transitions \
  --sessions "swarm-*" \
  --timeframe "7d" \
  --output-format matrix
```

**Benefits:**
1. Template improvements: Add explicit type validation between Coder and Tester
2. Neural learning: Avoid topologies that produce high failure matrices
3. Queen intelligence: Prioritize contract validation when spawning workers

---

## Phased Implementation Approach

### Phase 1: Manual Foundation (Week 1-2)

**Goal**: Build error analysis discipline before automation

**Actions:**
1. Run 20 diverse swarm tasks using existing templates
2. After each swarm, manually review outputs with ReasoningBank (`rb-on`)
3. Document failures in structured format:

```markdown
# Error Analysis Log: swarm-[DATE]-[PROJECT]

## Task
[What the swarm was asked to do]

## Failures Found
| Category | Count | Examples |
|----------|-------|----------|
| Security | 2 | Hardcoded API key in config.ts:45 |
| Coordination | 1 | Frontend used v1 API, backend published v2 |
| Error handling | 3 | Missing try/catch on fetch calls |

## Root Cause
[Why did this happen? Agent miscommunication? Unclear requirements?]

## Pattern for Future Evals
"All public API endpoints must have rate limiting"
```

4. Store patterns in `.reasoningbank/project-patterns/`

**Why manual first**: Hamel's core principle—you can't write good eval criteria until you've seen the data.

---

### Phase 2: Template Enhancement (Week 3-4)

**Goal**: Embed error analysis into swarm/hive-mind templates

**Enhanced Swarm Template - Add Error Analyst Agent:**

```markdown
### Agent N+1: Error Analyst (reviewer)

**Tasks:**
- Wait for all other agents to complete
- Review outputs against project patterns
- Categorize any failures
- Store analysis in memory

**Coordination Protocol:**
# WAIT for all agents
while ! npx claude-flow@alpha memory retrieve --namespace "swarm/coder" --key "complete"; do sleep 10; done
while ! npx claude-flow@alpha memory retrieve --namespace "swarm/tester" --key "complete"; do sleep 10; done

# EVALUATE outputs against patterns
npx claude-flow@alpha eval run \
  --patterns ".reasoningbank/project-patterns/" \
  --outputs "src/**/*.ts" \
  --binary-only

# STORE analysis
npx claude-flow@alpha memory store \
  --namespace "swarm/error-analyst" \
  --key "evaluation" \
  --value "{
    passed: true/false,
    failures: [...],
    recommendations: [...]
  }"

# ONLY proceed to commit if evaluation passes
if [ evaluation.passed ]; then
  npx claude-flow@alpha hooks post-task --task-id "error-analyst"
else
  echo "❌ Evaluation failed. See failures in memory."
  exit 1
fi
```

---

### Phase 3: Automated Evaluation (Week 5-6)

**Goal**: Build validated LLM-as-Judge for common failure patterns

**Process:**
1. From 20 manual reviews, identify top 3 failure categories
2. Create LLM judge for each:

```bash
# Create judge from discovered patterns
npx claude-flow@alpha eval create-judge \
  --name "coordination-quality" \
  --criteria-from ".reasoningbank/project-patterns/coordination.json" \
  --binary-only

# Validate against human labels
npx claude-flow@alpha eval validate-judge \
  --judge "coordination-quality" \
  --human-labels "validation-set.json" \
  --required-agreement 0.80
```

3. Only deploy judges that achieve 80%+ agreement
4. Use in automated swarm pipeline

---

### Phase 4: Neural Learning Enhancement (Week 7-8)

**Goal**: Train neural patterns on eval data, not just success/fail

**Current neural learning:**
```javascript
learning_adapt({
  experience: {
    task_type: 'api_implementation',
    topology: 'mesh',
    agents: 5,
    success: true  // Binary - did gates pass?
  }
})
```

**Enhanced neural learning:**
```javascript
learning_adapt({
  experience: {
    task_type: 'api_implementation',
    topology: 'mesh',
    agents: 5,
    success: true,
    // NEW: Layer 2 eval data
    eval_scores: {
      coordination: 0.92,
      security: 0.88,
      error_handling: 0.75
    },
    transition_failures: {
      'architect_to_coder': 0,
      'coder_to_tester': 2
    }
  }
})
```

**Result**: Neural patterns learn richer signals:
> "Mesh + 5 agents achieves 90% success rate BUT has Coder→Tester coordination issues.
> Hierarchical + 5 agents achieves 85% success rate with better coordination scores."

---

## Key Tensions Resolved

| Tension | Resolution |
|---------|------------|
| **Automation vs Human Review** | Phase 1 is manual. Automation only after patterns discovered. |
| **Speed vs Quality** | Error analyst runs in parallel with final reviewer. Minimal overhead. |
| **Generic vs Domain-Specific** | ReasoningBank (generic) + project-patterns (discovered). Both layers. |
| **Hamel says "can't skip error analysis"** | Phase 1 enforces manual review. Templates encode the patterns. |

---

## Recommended Immediate Actions

### Without Code Changes to Claude-Flow

1. **Create error analysis log template** in `docs/binto-labs/templates/`
2. **Add Error Analyst agent** to `multi-agent/swarm-templates.md`
3. **Extend ReasoningBank** with `project-patterns/` directory
4. **Update hive-mind Queen protocol** to include phase evaluations

### With Code Changes to Claude-Flow

1. **`analyze-errors` command** - Structured error categorization
2. **`analyze-transitions` command** - Agent handoff failure matrices
3. **`eval` subcommands** - create-judge, validate-judge, run
4. **Enhanced `learning_adapt`** - Accept eval scores, not just success boolean

---

## The Meta-Insight

The templates (swarm-templates.md, hive-mind-templates.md) are the perfect place to encode Hamel's methodology because:

1. **Templates are instructions to Claude agents** - You can teach agents to do error analysis
2. **Memory system already persists patterns** - Just need to store eval criteria
3. **Neural learning already captures experience** - Just need richer signals
4. **ReasoningBank already provides objective review** - Just need project-specific extension

**The integration doesn't require new tools—it requires new practices encoded in templates.**

---

## Success Metrics

### Short-term (Weeks 1-4)
- [ ] Error analysis performed on 20+ swarm sessions
- [ ] Failure patterns categorized and documented
- [ ] Top 3 failure modes identified
- [ ] 5-10 test cases created from real failures

### Medium-term (Weeks 5-8)
- [ ] LLM judge created for top failure mode
- [ ] Judge validated: 80%+ agreement with humans
- [ ] Eval scores tracked alongside orchestration metrics

### Long-term (Months 3-6)
- [ ] Correlation analysis: eval scores predict production success
- [ ] Retrospective training includes quality metrics
- [ ] Team reports faster iteration due to better measurement

---

## References

- [Hamel's Evals FAQ](https://hamel.dev/blog/posts/evals-faq/) - Source methodology
- [Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) - Core philosophy
- [LLM-as-a-Judge](https://hamel.dev/blog/posts/llm-judge/) - Validation approach
- [Fuck You, Show Me The Prompt](https://hamel.dev/blog/posts/prompt/) - Avoiding accidental complexity

---

*Analysis prepared: 2025-11-25*
*Purpose: Integration strategy for Hamel's evaluation methodology into claude-flow workflows*
