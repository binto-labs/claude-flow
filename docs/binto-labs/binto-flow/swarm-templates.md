---
status: keep
phase: complete
type: reference
version: 4.0
last-updated: 2026-01-29
title: Swarm Templates (Binto-Flow + MCP)
author: Claude Code + Human Developer
tags: [swarm, templates, agents, v3, binto-flow, protocol, mcp, auditability]
---

# Swarm Templates (Binto-Flow + MCP) v4.0

> **Always Full**: Quality prompts + MCP persistence for EVERY task
> **Why**: Auditability, searchable history, debugging, pattern building

---

## The Binto-Flow Standard

**Every task, big or small, follows this pattern:**

```
┌─────────────────────────────────────────────────────────────┐
│                    BINTO-FLOW STANDARD                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. INIT ──→ Track the task                                 │
│  2. PROMPT ──→ Quality deliverables + constraints + gates   │
│  3. PERSIST ──→ Store outcomes for future reference         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Benefits of always using MCP:**
| Benefit | Example |
|---------|---------|
| Auditability | "What did the coder agent produce?" |
| Searchable | "How did we implement auth before?" |
| Debugging | "Why did this swarm fail?" |
| Patterns | "What approaches worked for API design?" |
| Consistency | One approach for everything |

---

## The 3-Phase Protocol

### Phase 1: INIT (Track the Task)

```javascript
// Always init swarm tracking (even for single agent)
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 4,
  strategy: "specialized"
})

// Always store task context
mcp__claude-flow_alpha__memory_store({
  namespace: "project-name",
  key: "task-context",
  value: {
    task: "Implement user authentication",
    started: new Date().toISOString(),
    agents: ["architect", "coder", "tester"],
    spec: "/path/to/spec.md"
  },
  tags: ["auth", "feature", "api"]
})
```

### Phase 2: PROMPT (Quality Deliverables)

**This is what drives output quality:**

```javascript
Task({
  description: 'Implement auth feature',
  prompt: `You are implementing user authentication.

## CONTEXT
JWT-based auth with refresh tokens for the API.

## YOUR SPECIFIC DELIVERABLES
1. [ ] src/auth/jwt.ts - Token generation and validation
2. [ ] src/auth/middleware.ts - Auth middleware for routes
3. [ ] src/routes/auth.ts - Login, register, refresh endpoints
4. [ ] tests/auth.test.ts - 15+ tests covering all flows

## CONSTRAINTS
- Use bcrypt for password hashing (cost factor 12)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Store refresh tokens in httpOnly cookies
- Do NOT store tokens in localStorage

## QUALITY GATES (MANDATORY)
Before marking complete:
1. npx tsc --noEmit → 0 errors
2. npm test -- auth → all passing
3. npm run lint → 0 errors

## VERIFICATION
After implementation, this must work:
curl -X POST localhost:3000/auth/login -d '{"email":"test@test.com","password":"test"}'
# Returns: { "accessToken": "...", "expiresIn": 900 }`,
  subagent_type: 'coder',
  model: 'opus'
})
```

**Key elements that drive quality:**
1. **Specific deliverables** with exact file paths
2. **Explicit constraints** (what to do AND what NOT to do)
3. **Mandatory quality gates** with exact commands
4. **Verification** with concrete test command

### Phase 3: PERSIST (Store Outcomes)

```javascript
// Always store the outcome
mcp__claude-flow_alpha__memory_store({
  namespace: "project-name",
  key: "task-outcome",
  value: {
    completed: new Date().toISOString(),
    deliverables: [
      "src/auth/jwt.ts",
      "src/auth/middleware.ts",
      "src/routes/auth.ts",
      "tests/auth.test.ts"
    ],
    tests: { total: 18, passed: 18, failed: 0 },
    learnings: "Used RS256 for JWT signing, refresh rotation on each use",
    issues: []
  },
  tags: ["auth", "completed", "jwt"]
})
```

---

## Single Agent Template

**Even single agents get full tracking:**

```javascript
// 1. INIT
mcp__ruv-swarm__swarm_init({ topology: "hierarchical", maxAgents: 1 })
mcp__claude-flow_alpha__memory_store({
  namespace: "bugfix-123",
  key: "context",
  value: { task: "Fix login timeout", issue: "#123" }
})

// 2. PROMPT
Task({
  description: 'Fix login timeout bug',
  prompt: `Fix the login timeout issue (#123).

## CONTEXT
Users report login fails after 30 seconds. Server logs show connection timeout.

## YOUR SPECIFIC DELIVERABLES
1. [ ] Identify root cause in src/api/auth.ts
2. [ ] Implement fix (increase timeout or fix underlying issue)
3. [ ] Add regression test in tests/auth.test.ts

## CONSTRAINTS
- Minimal change (don't refactor unrelated code)
- Must not break existing tests
- Document the root cause in code comment

## QUALITY GATES
1. npm test → all passing
2. Manual test: login completes in < 5 seconds

## ROOT CAUSE DOCUMENTATION
Add comment above fix explaining why this happened.`,
  subagent_type: 'coder',
  model: 'opus'
})

// 3. PERSIST
mcp__claude-flow_alpha__memory_store({
  namespace: "bugfix-123",
  key: "outcome",
  value: {
    rootCause: "Database connection pool exhausted",
    fix: "Increased pool size from 5 to 20",
    tests: { added: 1, total_passed: 47 }
  }
})
```

---

## Multi-Agent Swarm Template

```javascript
// 1. INIT
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 6,
  strategy: "specialized"
})

mcp__claude-flow_alpha__memory_store({
  namespace: "feature-payments",
  key: "context",
  value: {
    task: "Implement payment processing",
    agents: ["architect", "backend", "frontend", "tester", "security"],
    spec: "/docs/payments-spec.md"
  }
})

// 2. PROMPT (all agents in ONE message)
[
  Task({
    description: 'Architect: Payment design',
    prompt: `Design the payment system architecture.

## YOUR SPECIFIC DELIVERABLES
1. [ ] docs/payment-architecture.md - System design
2. [ ] src/types/payment.ts - Type definitions
3. [ ] docs/api-contracts.md - API specifications

## CONSTRAINTS
- PCI DSS compliance considerations
- Never store raw card numbers
- Use Stripe as payment processor

## QUALITY GATES
- Types compile: npx tsc --noEmit
- Docs complete: all sections filled

## PUBLISH FOR OTHER AGENTS
After completing, store your design:
npx claude-flow@alpha memory store \\
  --namespace feature-payments \\
  --key architect-output \\
  --value '[summary of design decisions]'`,
    subagent_type: 'system-architect',
    model: 'opus'
  }),

  Task({
    description: 'Backend: Payment API',
    prompt: `Implement the payment API.

## DEPENDENCY
First, retrieve architect's design:
npx claude-flow@alpha memory retrieve \\
  --namespace feature-payments \\
  --key architect-output

## YOUR SPECIFIC DELIVERABLES
1. [ ] src/routes/payments.ts - Payment endpoints
2. [ ] src/services/stripe.ts - Stripe integration
3. [ ] src/services/payment.ts - Payment business logic

## CONSTRAINTS
- Follow architect's type definitions
- Use Stripe SDK (already installed)
- Implement idempotency keys
- Log all payment attempts (no PII)

## QUALITY GATES
1. npx tsc --noEmit → 0 errors
2. npm test -- payments → all passing

## PUBLISH
npx claude-flow@alpha memory store \\
  --namespace feature-payments \\
  --key backend-output \\
  --value '[implementation summary]'`,
    subagent_type: 'backend-dev',
    model: 'opus'
  }),

  Task({
    description: 'Tester: Payment tests',
    prompt: `Write comprehensive payment tests.

## DEPENDENCIES
Retrieve designs and implementation status:
npx claude-flow@alpha memory retrieve --namespace feature-payments --key architect-output
npx claude-flow@alpha memory retrieve --namespace feature-payments --key backend-output

## YOUR SPECIFIC DELIVERABLES
1. [ ] tests/payments/unit.test.ts - Unit tests (15+)
2. [ ] tests/payments/integration.test.ts - Integration tests (10+)
3. [ ] tests/payments/edge-cases.test.ts - Edge cases (10+)

## TEST COVERAGE REQUIREMENTS
- Happy path: successful payment
- Validation: invalid card, expired card, insufficient funds
- Edge cases: network timeout, duplicate submission, refund
- Security: SQL injection, XSS in payment notes

## QUALITY GATES
1. npm test -- payments → all passing
2. Coverage > 80%

## PUBLISH
npx claude-flow@alpha memory store \\
  --namespace feature-payments \\
  --key tester-output \\
  --value '[test summary with counts]'`,
    subagent_type: 'tester',
    model: 'opus'
  }),

  Task({
    description: 'Security: Payment audit',
    prompt: `Security review of payment implementation.

## DEPENDENCIES
Wait for implementation:
npx claude-flow@alpha memory retrieve --namespace feature-payments --key backend-output
npx claude-flow@alpha memory retrieve --namespace feature-payments --key tester-output

## YOUR SPECIFIC DELIVERABLES
1. [ ] docs/security-audit.md - Security findings
2. [ ] Fix any critical/high issues found

## REVIEW CHECKLIST
- [ ] No PII in logs
- [ ] No raw card data stored
- [ ] Proper input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting on endpoints
- [ ] Idempotency implementation

## QUALITY GATES
- No critical findings unresolved
- No high findings unresolved

## PUBLISH
npx claude-flow@alpha memory store \\
  --namespace feature-payments \\
  --key security-output \\
  --value '[audit summary]'`,
    subagent_type: 'security-architect',
    model: 'opus'
  })
]

// 3. PERSIST (after all agents complete)
mcp__claude-flow_alpha__memory_store({
  namespace: "feature-payments",
  key: "outcome",
  value: {
    completed: new Date().toISOString(),
    agents: {
      architect: "Design complete, 3 docs created",
      backend: "API implemented, 5 endpoints",
      tester: "35 tests, all passing",
      security: "Audit passed, 0 critical findings"
    },
    deliverables: 12,
    tests: { total: 35, passed: 35 },
    learnings: "Stripe webhooks need idempotency handling"
  }
})
```

---

## Quality Prompt Template

**Copy this structure for every agent:**

```markdown
You are the [ROLE] for [PROJECT].

## CONTEXT
[Why this task matters, background info]

## YOUR SPECIFIC DELIVERABLES
1. [ ] [Exact file path] - [What it contains]
2. [ ] [Exact file path] - [What it contains]
3. [ ] [Exact file path] - [What it contains]

## CONSTRAINTS
- [What to use]
- [What NOT to do]
- [Specific requirements]

## QUALITY GATES (MANDATORY)
Before marking complete:
1. [Command] → [Expected output]
2. [Command] → [Expected output]

## VERIFICATION
[Concrete test that proves it works]

## PUBLISH (for multi-agent swarms)
After completing:
npx claude-flow@alpha memory store \
  --namespace [project] \
  --key [agent]-output \
  --value '[summary]'
```

---

## Namespace Convention

Organize memory by project and task:

```
Namespace Pattern: {project}/{task-type}

Examples:
- myapp/auth-feature
- myapp/bugfix-123
- myapp/refactor-api
- myapp/security-audit

Keys per namespace:
- context      → Task setup and requirements
- architect-output → Design decisions
- coder-output     → Implementation summary
- tester-output    → Test results
- outcome          → Final results
```

---

## Searching Past Work

```javascript
// Find similar past work
mcp__claude-flow_alpha__memory_search({
  query: "authentication JWT implementation",
  limit: 5
})

// List all entries for a project
mcp__claude-flow_alpha__memory_list({
  namespace: "myapp"
})

// Get specific outcome
mcp__claude-flow_alpha__memory_retrieve({
  namespace: "myapp/auth-feature",
  key: "outcome"
})
```

---

## Cleanup and Fix Patterns

**Even fixes get full tracking:**

```javascript
// 1. INIT
mcp__claude-flow_alpha__memory_store({
  namespace: "myapp/fix-ts-errors",
  key: "context",
  value: { task: "Fix TypeScript errors", count: 23 }
})

// 2. PROMPT
Task({
  description: 'Fix TypeScript errors',
  prompt: `Fix all TypeScript errors.

## DELIVERABLES
1. [ ] All files with TS errors fixed

## PROCESS
1. Run: npx tsc --noEmit
2. Fix each error
3. Repeat until 0 errors

## CONSTRAINTS
- Fix types only, don't change behavior
- Don't use 'any' type
- Add proper type definitions

## QUALITY GATE
npx tsc --noEmit → 0 errors`,
  subagent_type: 'coder',
  model: 'opus'
})

// 3. PERSIST
mcp__claude-flow_alpha__memory_store({
  namespace: "myapp/fix-ts-errors",
  key: "outcome",
  value: { fixed: 23, remaining: 0 }
})
```

---

## Pre-Flight Check

Before any swarm, verify MCP is working:

```javascript
// Quick verification
mcp__claude-flow_alpha__memory_store({
  namespace: "test",
  key: "preflight",
  value: { check: "ok", time: new Date().toISOString() }
})
// Should return: success: true

mcp__ruv-swarm__swarm_status({})
// Should return: swarm data
```

If either fails, see `/docs/PREFLIGHT-CHECKS.md` for troubleshooting.

---

## Summary

**Binto-Flow v4.0: Always Full**

| Phase | Action | Why |
|-------|--------|-----|
| INIT | Track task + store context | Auditability |
| PROMPT | Quality deliverables + constraints + gates | Output quality |
| PERSIST | Store outcomes + learnings | Searchable history |

**Every task, big or small, follows this pattern.**

The ~50ms overhead per memory operation is negligible compared to:
- Minutes of agent execution time
- Hours of debugging without audit trail
- Days of re-discovering past solutions

---

**Version**: 4.0 | **Last Updated**: 2026-01-29 | **Approach**: Always Full (Binto-Flow + MCP)
