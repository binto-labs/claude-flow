# ADR-XXX: [Short Title - Max 10 Words]

**Date:** YYYY-MM-DD
**Status:** [🔵 Proposed | 🟡 In Review | ✅ Accepted | ❌ Rejected | 🔄 Superseded | 📦 Deprecated]
**Deciders:** [List of people/agents who made the decision]
**Quality Score:** X.XX/0.90 [✅ PASSED | ❌ FAILED] [(+/- X.X% margin)]

---

## Context

**Background:** What is the issue we're facing? What forces are at play?

**Key Requirements:**
- Requirement 1
- Requirement 2
- Requirement 3

**Problem Statement:**
[Describe the problem in 2-3 sentences. What needs to be decided? Why is this decision important?]

**Constraints:**
- Technical constraints (e.g., must use existing stack)
- Business constraints (e.g., deadline, budget)
- Quality constraints (e.g., verification threshold ≥0.90)

---

## Decision

**We will [decision statement in active voice].**

### Architecture Design

[Describe the architecture/solution in detail. Use diagrams, code blocks, or structured lists.]

```
Example structure:
├── Component A: Purpose and responsibility
├── Component B: Purpose and responsibility
└── Component C: Purpose and responsibility
```

### Key Design Principles

1. **Principle 1:** Explanation
2. **Principle 2:** Explanation
3. **Principle 3:** Explanation

### Implementation Details

[Specific implementation decisions, patterns, or approaches to be used]

---

## Architecture Validation

[If using claude-flow SPARC methodology with verification]

### Verification Scores

| Check | Score | Status | Evidence |
|-------|-------|--------|----------|
| **design-validation** | X.XX | [✅/❌] | [Evidence/rationale] |
| **scalability-check** | X.XX | [✅/❌] | [Evidence/rationale] |
| **pattern-compliance** | X.XX | [✅/❌] | [Evidence/rationale] |
| **[custom-check]** | X.XX | [✅/❌] | [Evidence/rationale] |
| **Overall** | **X.XX** | **[✅/❌]** | [Meets/Fails threshold] |

**Calculation:** `(score1 + score2 + score3 + ...) / N = X.XX`

### Additional Metrics

[Any domain-specific metrics relevant to this decision]

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| [Metric name] | X.XX | ≥X.XX | [✅/❌] |
| [Metric name] | X.XX | ≥X.XX | [✅/❌] |

---

## Consequences

### Positive Outcomes

1. **[Benefit 1]**
   - Impact: [Describe positive impact]
   - Measurement: [How will we measure this benefit?]

2. **[Benefit 2]**
   - Impact: [Describe positive impact]
   - Measurement: [How will we measure this benefit?]

3. **[Benefit 3]**
   - Impact: [Describe positive impact]
   - Measurement: [How will we measure this benefit?]

### Negative Consequences

1. **[Drawback 1]**
   - **Impact:** [Describe negative impact]
   - **Mitigation:** [How are we addressing this?]
   - **Severity:** [Low | Medium | High]

2. **[Drawback 2]**
   - **Impact:** [Describe negative impact]
   - **Mitigation:** [How are we addressing this?]
   - **Severity:** [Low | Medium | High]

### Risks and Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| **AR-001** | [Risk description] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |
| **AR-002** | [Risk description] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |
| **AR-003** | [Risk description] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |

---

## Alternatives Considered

### Alternative 1: [Name] ❌ REJECTED

**Description:** [Brief description of the alternative]

**Pros:**
- Pro 1
- Pro 2
- Pro 3

**Cons:**
- Con 1
- Con 2
- Con 3

**Why rejected:** [Specific reason why this alternative was not chosen]

**Verification score (if applicable):** X.XX/0.90 [✅/❌]

---

### Alternative 2: [Name] ❌ REJECTED

[Same structure as Alternative 1]

---

### Alternative 3: [Name] ⚠️ CONSIDERED

**Description:** [Brief description]

**Why not selected:** [Reason - may be "Close second choice, could revisit if primary fails"]

**Relationship to chosen approach:** [How does this relate to the decision we made?]

---

## Implementation Notes

### SPARC Workflow (If Applicable)

[If this ADR was created during a SPARC workflow, document the process]

**S (Specification):** [What was analyzed/specified]
**P (Pseudocode):** [What algorithms/logic were designed]
**A (Architecture):** [What architectural decisions were made - THIS ADR]
**R (Refinement):** [What was implemented]
**C (Completion):** [What was finalized/deployed]

**Meta-lesson:** [What did we learn from this process?]

### Memory Keys Used

[If using claude-flow memory coordination, list the memory keys]

```bash
architecture/[domain]/[decision]  - [Description]
specs/[requirement-area]          - [Description]
code/[implementation-area]        - [Description]
```

**How to retrieve:**
```bash
npx claude-flow@alpha memory search "architecture/*"
npx claude-flow@alpha memory retrieve "architecture/[key]"
```

### Dependencies

**Required before implementation:**
- [ ] Dependency 1
- [ ] Dependency 2
- [ ] Dependency 3

**Required after implementation:**
- [ ] Follow-up task 1
- [ ] Follow-up task 2
- [ ] Follow-up task 3

### Rollback Plan

[If this decision fails or needs to be reversed]

1. **Detection:** [How will we know if this decision was wrong?]
2. **Trigger criteria:** [What metrics/signals would trigger rollback?]
3. **Rollback steps:**
   - Step 1: [Action]
   - Step 2: [Action]
   - Step 3: [Action]
4. **Data preservation:** [What data needs to be migrated/preserved?]

---

## Related Decisions

- **Supersedes:** [ADR-XXX: Previous decision that this replaces]
- **Superseded by:** [ADR-XXX: Future decision that replaced this one]
- **Related to:** [ADR-XXX: Related architectural decision]
- **Depends on:** [ADR-XXX: Decision that this builds upon]
- **Enables:** [ADR-XXX: Decision that this makes possible]

---

## References

- **Documentation:** [Links to relevant docs]
- **Code:** [Links to implementation]
- **Discussions:** [Links to GitHub issues, RFCs, meeting notes]
- **Research:** [Links to blog posts, papers, benchmarks]
- **Tools:** [Links to tools, libraries, frameworks used]
- **Memory Keys:** [claude-flow memory keys with architectural decisions]
- **Version:** [Relevant software/tool versions]

---

## Approval

| Role | Name | Decision | Date | Comments |
|------|------|----------|------|----------|
| **[Role]** | [Name/Agent] | [✅/❌/🔄] | YYYY-MM-DD | [Optional comments] |
| **[Role]** | [Name/Agent] | [✅/❌/🔄] | YYYY-MM-DD | [Optional comments] |
| **[Role]** | [Name/Agent] | [✅/❌/🔄] | YYYY-MM-DD | [Optional comments] |

**Consensus:** X/Y approvals (XX% agreement)

---

## Timeline

| Date | Event | Notes |
|------|-------|-------|
| YYYY-MM-DD | Proposed | Initial draft created |
| YYYY-MM-DD | In Review | Under discussion |
| YYYY-MM-DD | Accepted | Decision finalized |
| YYYY-MM-DD | Implemented | Changes deployed |
| YYYY-MM-DD | Reviewed | Post-implementation review |

---

## Metrics and Success Criteria

**Success defined as:**
- [ ] Criterion 1: [Measurable outcome]
- [ ] Criterion 2: [Measurable outcome]
- [ ] Criterion 3: [Measurable outcome]

**How we'll measure success:**
- Metric 1: [How to measure] - Target: [Value]
- Metric 2: [How to measure] - Target: [Value]
- Metric 3: [How to measure] - Target: [Value]

**Review schedule:**
- First review: [Date/Milestone]
- Ongoing reviews: [Frequency]
- Final assessment: [Date/Milestone]

---

**Last Updated:** YYYY-MM-DD
**Next Review:** [Date or milestone]
**Owner:** [Team/Person responsible for this decision]
**Status Changes:**
- YYYY-MM-DD: [Status] → [New Status] ([Reason])

---

## Notes for Using This Template

### When to Create an ADR

Create an ADR when:
- Making architectural decisions that affect system design
- Choosing between significant alternatives (frameworks, patterns, technologies)
- Establishing standards or conventions
- Making decisions that are hard/expensive to reverse
- Documenting decisions made during SPARC Architecture phase

### How to Use with Claude-Flow

**During SPARC workflow:**
```bash
# Step 1: Run SPARC Architecture phase (stores decisions in memory)
npx claude-flow@alpha swarm "Your architectural task" \
  --strategy development \
  --sparc \
  --quality-threshold 0.90

# Step 2: After Architecture phase completes, create ADR
npx claude-flow@alpha swarm "Create ADR from memory key 'architecture/*' using template docs/adr/TEMPLATE.md" \
  --agents api-docs,system-architect

# Step 3: Review and commit
git add docs/adr/XXX-*.md
git commit -m "docs: Add ADR-XXX for [decision]"
```

### ADR Numbering

- Use sequential numbers: 001, 002, 003, etc.
- Include number in filename: `001-short-title.md`
- Reference ADRs by number: "As documented in ADR-003..."

### Status Lifecycle

```
🔵 Proposed → 🟡 In Review → ✅ Accepted → [📦 Deprecated | 🔄 Superseded]
                ↓
              ❌ Rejected
```

### Quality Scores (Claude-Flow Specific)

If using claude-flow verification system, include:
- **design-validation:** 0-1.0 (how well the design meets requirements)
- **scalability-check:** 0-1.0 (can it handle growth?)
- **pattern-compliance:** 0-1.0 (follows best practices?)
- **Overall threshold:** Usually 0.90 for production decisions

### Tips

1. **Be concise:** ADRs are decision records, not design docs
2. **Be specific:** Include actual code/config examples where relevant
3. **Show alternatives:** Document why you chose A over B
4. **Link liberally:** Reference related ADRs, docs, code
5. **Update status:** Keep the Status field current
6. **Immutable:** Don't edit accepted ADRs - create new ones that supersede them
