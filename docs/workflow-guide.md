# Claude-Flow Development Workflow

## For Claude Code: How to Use This Guide

When this file is loaded into context (via CLAUDE.md reference, session start, or user request), you **should** call the MCP tools described below at the appropriate moments during development. The user should never need to type MCP tool names or CLI commands - they just describe what they want and you handle the orchestration.

**Rule: Every phase boundary = MCP calls should happen behind the scenes.**

---

## Architecture

```
User (natural language) --> Claude Code (execution) --> claude-flow MCP (brain)
                                                          |
                                            memory / routing / learning
```

- **User says** what they want in plain English
- **Claude Code** does all file editing, code generation, test execution, agent spawning
- **claude-flow MCP** provides persistent memory, intelligent routing, and learning

---

## Workflow Monitor

The workflow monitor (`.claude/helpers/workflow-monitor.cjs`) tracks whether claude-flow MCP tools are actually being used during a session. It counts MCP calls and file edits, and nudges the LLM when it drifts from the workflow.

**What it does:**
- Counts every `mcp__claude-flow__*` tool call (via PostToolUse hook)
- Counts every file edit (via PreToolUse hook)
- Warns or blocks when edits happen without MCP calls
- Reports a compliance score (0-100) at session end

**What it does NOT do:**
- Enforce specific MCP calls in a specific order
- Guarantee the right tool was called at the right phase
- Prevent gaming (one throwaway MCP call unblocks edits in gate mode)

It's a behavioral nudge, not a state machine. The LLM chooses to follow the workflow; the monitor catches when it forgets.

**Modes** (set via `CLAUDE_FLOW_ENFORCE` env var in `.claude/settings.json`):

| Mode | Edits | Commits | Effect |
|------|-------|---------|--------|
| `off` | Allow all | Allow all | No monitoring |
| `warn` (default) | Allow + warn after 5 edits with 0 MCP calls | Allow all | Text nudge in context window |
| `gate` | Block after 3 edits with 0 MCP calls | Block with 0 MCP calls | Real friction — edit fails until an MCP call is made |
| `strict` | Block first edit with 0 MCP calls | Block with <2 MCP calls | Strongest nudge — must use MCP before any file work |

**Compliance score** (printed at session end):
- Starts at 100
- -40 if zero MCP calls all session
- -20 if <3 MCP calls
- -5 per drift warning, -3 per blocked edit
- -20 if >10 edits before first MCP call

---

## Audit Trail

The monitor is a fuzzy behavioral signal. Git is the concrete audit trail.

**Recommended session pattern:**
1. Start a git worktree (`"start a worktree for [feature]"`) — creates an isolated branch
2. Work on the branch — monitor nudges MCP usage along the way
3. Commits accumulate on the branch — concrete record of what changed
4. Review the branch when done — `git log`, `git diff main`, or a PR
5. Merge or discard — clean history on main

| Layer | Tracks | Reliability |
|-------|--------|-------------|
| Git (worktrees/branches) | What code changed, when, by which agent | 100% concrete |
| Workflow monitor | Were MCP tools used during the session | Best-effort nudge |
| MCP memory | What was stored/searched/retrieved | Real data, but only if calls were made |

Together: git proves what happened, the monitor encouraged good process, and memory preserves context for next time.

---

## The Workflow

```
IDEATE --> RESEARCH --> SPECIFY --> ARCHITECT --> BUILD (TDD) --> REVIEW --> COMPLETE
```

### What Claude Code should call at each phase:

| Phase | MCP Calls (behind the scenes) | User Experience |
|-------|-------------------------------|-----------------|
| **Start** | `hooks_session-start`, `memory_search` | "Let's build X" |
| **Ideate** | `hooks_route`, `hooks_pre-task` | Gets agent + model recommendation |
| **Research** | `memory_search`, spawn researcher agent | Findings reported back |
| **Specify** | `memory_store` (spec) | Requirements confirmed |
| **Architect** | `memory_retrieve` (spec), `memory_store` (design) | Design shared |
| **Build** | `hooks_pre-task`, `hooks_post-edit` per file | Code + tests written |
| **Review** | spawn reviewer agent, `memory_store` (findings) | Issues flagged |
| **Complete** | `hooks_post-task`, `memory_store` (patterns), `hooks_session-end` | Done, learned |

---

## Phase Details

### Phase 0: Session Start

**User says:** "Let's work on [project]" or starts a new conversation

**Claude Code does:**
```
mcp__claude-flow__hooks_session-start({})
mcp__claude-flow__memory_search({ query: "[project topic]", limit: 5 })
```

**Why:** Restores previous context. If there are stored specs, architecture decisions, or patterns from past sessions, surface them to the user: "I found previous work on this - here's where we left off."

---

### Phase 1: Ideation & Routing

**User says:** "Build a URL shortener with analytics" or any task description

**Claude Code does:**
```
mcp__claude-flow__hooks_route({ task: "[user's description]" })
mcp__claude-flow__hooks_pre-task({ taskId: "[project]-ideate", description: "[user's description]" })
mcp__claude-flow__memory_store({
  key: "project/idea",
  namespace: "[project]",
  value: { name: "...", goal: "...", scope: "..." }
})
```

**What you learn from routing:**
- `primaryAgent.type` = which agent type to spawn (architect, coder, etc.)
- `modelRouting.model` = which model tier (haiku/sonnet/opus)
- `estimatedMetrics.complexity` = task complexity

**Tell the user:** "Routing suggests [agent type] at [confidence]%. Estimated [duration]. I'll use [model] for this."

---

### Phase 2: Research

**User says:** "What patterns should we use?" or Claude Code initiates automatically for complex tasks

**Claude Code does:**
```
mcp__claude-flow__memory_search({ query: "[relevant patterns]", limit: 5 })
mcp__claude-flow__hooks_pre-task({ taskId: "[project]-research", description: "research [topic]" })
```

Then spawn a researcher if needed:
```
Task({
  prompt: "Research [topic]. Analyze existing code patterns in this repo. Report findings.",
  subagent_type: "researcher",
  model: "sonnet",
  description: "Research phase"
})
```

After research completes:
```
mcp__claude-flow__memory_store({
  key: "project/research",
  namespace: "[project]",
  value: { patterns: [...], risks: [...], recommendations: [...] }
})
mcp__claude-flow__hooks_post-task({ taskId: "[project]-research", success: true })
```

**Tell the user:** Summarize findings. "Based on research, I recommend [approach]. Risks to watch: [risks]."

---

### Phase 3: Specification

**User says:** "What exactly are we building?" or confirms requirements from research

**Claude Code does:** Define requirements, then persist them:
```
mcp__claude-flow__memory_store({
  key: "project/spec",
  namespace: "[project]",
  value: {
    requirements: [...],
    constraints: [...],
    acceptance: [...],
    api: [...]
  }
})
```

**Tell the user:** Present the spec for confirmation. "Here's what I'll build: [requirements]. Does this look right?"

---

### Phase 4: Architecture

**User says:** "Go ahead" or "Design it"

**Claude Code does:**
```
mcp__claude-flow__hooks_route({ task: "design architecture for [project]" })
mcp__claude-flow__hooks_pre-task({ taskId: "[project]-arch", description: "design [project] architecture" })
mcp__claude-flow__memory_retrieve({ key: "project/spec", namespace: "[project]" })
```

Spawn architect if complex, or design directly:
```
Task({
  prompt: "Design architecture for [project]. Spec: [from memory]. Define modules, interfaces, data flow, file structure.",
  subagent_type: "system-architect",
  model: "opus",
  description: "Architecture phase"
})
```

Store the design:
```
mcp__claude-flow__memory_store({
  key: "project/architecture",
  namespace: "[project]",
  value: { modules: [...], files: [...], dataFlow: "...", interfaces: [...] }
})
mcp__claude-flow__hooks_post-task({ taskId: "[project]-arch", success: true })
```

**Tell the user:** "Architecture: [modules] with [data flow]. Files: [list]. Ready to build?"

---

### Phase 5: Build (TDD Iterations)

**User says:** "Build it" or "Start coding"

For each module in the architecture:

**Claude Code does:**
```
mcp__claude-flow__hooks_pre-task({
  taskId: "[project]-build-[module]",
  description: "implement [module] with TDD"
})
mcp__claude-flow__memory_retrieve({ key: "project/architecture", namespace: "[project]" })
mcp__claude-flow__memory_retrieve({ key: "project/spec", namespace: "[project]" })
```

**Option A: Single agent per module (sequential)**
```
Task({
  prompt: "Implement [module] using TDD. Write failing tests first, then implement.
           Architecture: [from memory]. Spec: [from memory].
           Test file: tests/[module].test.ts. Source: src/[module].ts",
  subagent_type: "coder",
  model: "sonnet",
  description: "TDD: [module]"
})
```

**Option B: Parallel agents across modules (for larger builds)**
```
// ALL in ONE message for parallel execution
Task({ prompt: "TDD for module A...", subagent_type: "coder", run_in_background: true })
Task({ prompt: "TDD for module B...", subagent_type: "coder", run_in_background: true })
Task({ prompt: "TDD for module C...", subagent_type: "coder", run_in_background: true })
```

After each module completes:
```
mcp__claude-flow__hooks_post-edit({ filePath: "src/[module].ts" })
mcp__claude-flow__hooks_post-edit({ filePath: "tests/[module].test.ts" })
mcp__claude-flow__memory_store({
  key: "project/build/[module]",
  namespace: "[project]",
  value: { status: "complete", tests: N, passing: N, files: [...] }
})
mcp__claude-flow__hooks_post-task({ taskId: "[project]-build-[module]", success: true })
```

**Tell the user:** "[Module] done: [N] tests passing. Moving to [next module]." or "All modules built: [summary]."

---

### Phase 6: Review

**User says:** "Review it" or Claude Code initiates after build completes

**Claude Code does:**
```
mcp__claude-flow__hooks_route({ task: "security and quality review" })
mcp__claude-flow__hooks_pre-task({ taskId: "[project]-review", description: "review [project]" })
```

Spawn reviewer:
```
Task({
  prompt: "Review [project] implementation. Check: code quality, security, test coverage, performance.
           Files: [list from architecture memory]",
  subagent_type: "reviewer",
  model: "opus",
  description: "Code review"
})
```

Store findings:
```
mcp__claude-flow__memory_store({
  key: "project/review",
  namespace: "[project]",
  value: { score: "X/10", issues: [...], strengths: [...], approved: true/false }
})
mcp__claude-flow__hooks_post-task({ taskId: "[project]-review", success: true })
```

**Tell the user:** "Review: [score]. Issues: [list]. Strengths: [list]." Fix issues if needed, re-review.

---

### Phase 7: Completion

**User says:** "Ship it" or "We're done" or Claude Code detects all phases complete

**Claude Code does:**
```
// Capture successful patterns for future projects
mcp__claude-flow__memory_store({
  key: "pattern/[project-type]",
  namespace: "patterns",
  value: {
    approach: "spec->arch->tdd->review",
    agents: "[which agents worked]",
    model: "[which models for which phases]",
    duration: "[how long it took]",
    lessons: "[what worked, what didn't]"
  }
})

mcp__claude-flow__hooks_post-task({ taskId: "[project]-complete", success: true })
mcp__claude-flow__hooks_session-end({ saveState: true, exportMetrics: true })
```

**Tell the user:** "Done. [Summary of what was built, test results, review score]. I've stored the patterns from this project - next time I'll route similar tasks more accurately."

---

## SPARC Mode

The phases above map directly to SPARC:

| SPARC | Phase | What Gets Stored |
|-------|-------|-----------------|
| **S**pecification | Research + Spec | `project/spec` |
| **P**seudocode | Architecture | `project/architecture` |
| **A**rchitecture | Architecture | `project/architecture` |
| **R**efinement | Build (TDD) | `project/build/[module]` per iteration |
| **C**ompletion | Review + Complete | `project/review`, `pattern/[type]` |

To load the full SPARC reference (17 modes, 1100 lines) into context: `/sparc-methodology`

---

## Memory Namespace Convention

All project data lives under a single namespace for easy retrieval:

| Key Pattern | Content |
|------------|---------|
| `project/idea` | Initial concept, scope |
| `project/research` | Findings, patterns, risks |
| `project/spec` | Requirements, constraints, acceptance criteria |
| `project/architecture` | Modules, files, interfaces, data flow |
| `project/build/[module]` | Per-module build status, test counts |
| `project/review` | Quality score, issues, approval |
| `pattern/[type]` | Reusable patterns (stored in `patterns` namespace) |

---

## Agent & Model Quick Reference

| Phase | Agent Type | Model | Why |
|-------|-----------|-------|-----|
| Research | `researcher` | sonnet | Breadth over depth |
| Specification | (direct) | - | Usually a conversation, not an agent |
| Architecture | `system-architect` | opus | Needs strong reasoning |
| Build | `coder` | sonnet (simple) / opus (complex) | Follows pre-task recommendation |
| Tests | `tester` or `coder` | sonnet | Test writing is structured |
| Review | `reviewer` | opus | Needs careful analysis |

The `hooks_pre-task` response includes a `modelRouting.model` recommendation - use it.

---

## What The User Actually Says

The whole point is the user never thinks about MCP tools. Examples:

| User Says | Claude Code Does Behind The Scenes |
|-----------|-----------------------------------|
| "Let's build a REST API for bookmarks" | route, pre-task, memory search, store idea |
| "What should the architecture look like?" | retrieve spec, route to architect, store design |
| "Build it" | pre-task per module, spawn coder agents, post-edit, post-task |
| "How does it look?" | route to reviewer, spawn reviewer, store findings |
| "We're done" | store patterns, post-task, session-end |
| "Remember that we prefer Hono over Express" | memory store in patterns namespace |
| "What did we do last time for auth?" | memory search for auth patterns |

---

## What Actually Works (Honest List)

**Real computation, real I/O:**
- `memory_store / search / retrieve / list` - sql.js + 384-dim HNSW vectors
- `hooks_route` - HNSW cosine similarity routing (0.2ms)
- `hooks_pre-task / post-task` - task registration + learning
- `hooks_pre-edit / post-edit` - file context + learning
- `hooks_model-route` - complexity-based model selection
- `hooks_session-start / session-end` - state persistence
- `config_get / set / list` - persistent config
- `claims_*` - work item ownership
- `analyze_diff / file-risk` - real git operations
- `embeddings_generate / compare / search` - real vectors
- `performance_benchmark / metrics` - real OS metrics
- `workflow-monitor.cjs` - MCP usage tracking, drift detection, compliance scoring (via Claude Code hooks)

**Stubs (metadata only, no real execution):**
- `swarm_init / status / health` - returns hardcoded JSON, no persistence
- `terminal_execute` - records commands, doesn't run them
- `github_*` - local state only, no GitHub API
- `coordination_*` - local state only
- `neural_train` - simulated training
- `workflow_execute` - marks steps complete immediately
