# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for claude-flow documentation and architecture decisions.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help teams:

- **Preserve context:** Why was this decision made?
- **Document alternatives:** What else was considered?
- **Track consequences:** What are the tradeoffs?
- **Enable review:** Can we revisit this decision later?

## Quick Links

- 📋 [ADR Template](./TEMPLATE.md) - Use this for new ADRs
- 📊 [All ADRs](#all-adrs) - Complete list below

---

## All ADRs

| Number | Title | Status | Date | Quality Score |
|--------|-------|--------|------|---------------|
| [001](./001-user-guide-architecture-workflow-first.md) | User Guide Architecture - Developer Workflow First | ✅ Accepted | 2025-10-14 | 0.94/0.90 ✅ |

---

## How to Create a New ADR

### Option 1: Manual Creation

```bash
# 1. Copy the template
cp docs/adr/TEMPLATE.md docs/adr/002-your-decision-title.md

# 2. Fill in all sections
# 3. Get review/approval
# 4. Commit
git add docs/adr/002-*.md
git commit -m "docs: Add ADR-002 for [decision]"
```

### Option 2: Using Claude-Flow (Recommended)

```bash
# During SPARC workflow - Architecture phase stores decisions in memory
npx claude-flow@alpha swarm "Design authentication microservice architecture" \
  --strategy development \
  --sparc \
  --quality-threshold 0.90

# After Architecture phase, generate ADR from memory
npx claude-flow@alpha swarm "Create ADR from memory keys 'architecture/*' using template docs/adr/TEMPLATE.md. Save to docs/adr/002-authentication-architecture.md" \
  --agents api-docs,system-architect

# Review and commit
git add docs/adr/002-*.md
git commit -m "docs: Add ADR-002 for authentication architecture"
```

### Option 3: Extract from Existing Memory

If you've already completed a SPARC workflow and want to create an ADR retroactively:

```bash
# View available architectural decisions in memory
npx claude-flow@alpha memory search "architecture/*"

# Generate ADR from specific memory key
npx claude-flow@alpha swarm "Extract architectural decision from memory key 'architecture/auth-service' and create ADR using template docs/adr/TEMPLATE.md" \
  --agents api-docs,system-architect
```

---

## ADR Status Lifecycle

```
🔵 Proposed
   ↓
🟡 In Review
   ↓
✅ Accepted ────→ 📦 Deprecated
   ↓              ↓
❌ Rejected    🔄 Superseded by ADR-XXX
```

**Status Meanings:**
- **🔵 Proposed:** Initial draft, under discussion
- **🟡 In Review:** Being reviewed by stakeholders/agents
- **✅ Accepted:** Decision is final and being implemented
- **❌ Rejected:** Decision was considered but not accepted
- **📦 Deprecated:** Decision is no longer relevant but kept for historical context
- **🔄 Superseded:** Replaced by a newer ADR (link to the new one)

---

## ADR Naming Convention

**Format:** `NNN-short-kebab-case-title.md`

**Examples:**
- ✅ `001-user-guide-architecture-workflow-first.md`
- ✅ `002-authentication-microservice-design.md`
- ✅ `003-database-migration-strategy.md`
- ❌ `my-adr.md` (no number)
- ❌ `1-auth.md` (number not zero-padded)
- ❌ `004-This Has Spaces.md` (use kebab-case)

---

## Quality Scores (Claude-Flow Specific)

ADRs created during SPARC workflows include verification scores:

| Check | Description | Threshold |
|-------|-------------|-----------|
| **design-validation** | Does the design meet requirements? | ≥0.90 |
| **scalability-check** | Can it handle growth? | ≥0.90 |
| **pattern-compliance** | Follows best practices? | ≥0.90 |
| **Overall** | Average of all checks | ≥0.90 |

**Example from ADR-001:**
```
design-validation:    0.95 ✅
scalability-check:    0.93 ✅
pattern-compliance:   0.94 ✅
Overall:              0.94 ✅ (+4.4% margin)
```

---

## Integration with SPARC Workflow

ADRs naturally fit into the **A (Architecture)** phase of SPARC:

```
S (Specification) → Gather requirements
P (Pseudocode)    → Design algorithms
A (Architecture)  → Make architectural decisions ← CREATE ADR HERE
R (Refinement)    → Implement with TDD
C (Completion)    → Finalize and deploy
```

**During Architecture phase:**
1. Architect agents design the system
2. Run verification checks (design-validation, scalability-check, pattern-compliance)
3. Store decisions in memory: `architecture/*`
4. **Generate ADR from memory decisions** ← Automatic documentation
5. Continue to Refinement phase

**Memory keys typically used:**
```
architecture/decisions/[domain]     - Core architectural decisions
architecture/risks/[domain]         - Risk assessments
architecture/alternatives/[domain]  - Alternatives considered
specs/requirements/[domain]         - Original requirements (context)
```

---

## When to Create an ADR

**DO create an ADR when:**
- ✅ Making architectural decisions that affect system design
- ✅ Choosing between significant alternatives (frameworks, patterns, technologies)
- ✅ Establishing standards or conventions
- ✅ Making decisions that are hard/expensive to reverse
- ✅ Documenting multi-agent consensus from SPARC Architecture phase
- ✅ Decisions with quality scores ≥0.90 (production-grade)

**DON'T create an ADR when:**
- ❌ Making small, easily reversible implementation details
- ❌ Following established patterns without modification
- ❌ Temporary workarounds or experiments
- ❌ Obvious decisions with no real alternatives

---

## Reviewing ADRs

### Review Checklist

Before accepting an ADR, verify:

- [ ] **Clear context:** Problem is well-defined
- [ ] **Explicit decision:** What we're doing is stated clearly
- [ ] **Alternatives considered:** At least 2-3 alternatives documented
- [ ] **Consequences documented:** Both positive and negative
- [ ] **Risks identified:** With mitigation strategies
- [ ] **Quality score included:** (If using claude-flow verification)
- [ ] **References provided:** Links to docs, code, discussions
- [ ] **Approval recorded:** Consensus among stakeholders/agents

### Review Process

1. **Propose:** Create ADR with status 🔵 Proposed
2. **Review:** Share with team, gather feedback
3. **Iterate:** Update based on review comments
4. **Approve:** Get consensus from stakeholders/agents
5. **Accept:** Change status to ✅ Accepted
6. **Implement:** Build the solution
7. **Validate:** Verify the decision worked as expected

---

## Best Practices

### Writing Good ADRs

1. **Be concise:** ADRs are decision records, not design documents
2. **Be specific:** Include actual code/config examples where relevant
3. **Show your work:** Document why you chose A over B
4. **Link liberally:** Reference related ADRs, docs, code
5. **Keep current:** Update the Status field as it changes
6. **Stay immutable:** Don't edit accepted ADRs - create new ones that supersede them

### Organizing ADRs

**By domain/service:**
```
001-user-guide-architecture.md
002-authentication-service.md
003-payment-service.md
```

**By feature:**
```
001-user-guide-architecture.md
010-authentication-architecture.md
020-payment-processing-architecture.md
```

**Tip:** Leave gaps in numbering (001, 010, 020) to insert related ADRs later.

---

## Tools and Resources

### Claude-Flow Commands

```bash
# View architectural decisions in memory
npx claude-flow@alpha memory search "architecture/*"

# Retrieve specific decision
npx claude-flow@alpha memory retrieve "architecture/auth-service"

# Check verification scores
npx claude-flow@alpha truth --agent architect --detailed

# Generate ADR from memory
npx claude-flow@alpha swarm "Create ADR from architecture decisions" \
  --agents api-docs,system-architect
```

### External Resources

- [ADR GitHub Org](https://adr.github.io/) - ADR best practices and examples
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR concept by Michael Nygard
- [ADR Tools](https://github.com/npryce/adr-tools) - Command-line tools for managing ADRs

---

## Template Reference

See [TEMPLATE.md](./TEMPLATE.md) for the full ADR template with:
- Standard sections (Context, Decision, Consequences, Alternatives)
- Claude-flow verification score tables
- SPARC workflow integration notes
- Memory key documentation
- Approval/consensus tracking
- Risk assessment tables

---

## Questions?

- **How many ADRs should I have?** As many as you have significant architectural decisions. Quality over quantity.
- **Can I update an ADR?** Only if it's still 🔵 Proposed or 🟡 In Review. Once ✅ Accepted, create a new ADR that supersedes it.
- **What if a decision was wrong?** Create a new ADR that supersedes the old one. Explain what changed and why.
- **Do I need approval?** Yes, at minimum from the team/person responsible for the decision. Multi-agent consensus is even better.

---

**Last Updated:** 2025-10-14
**Maintained by:** Documentation team
**Questions:** Open an issue or discussion
