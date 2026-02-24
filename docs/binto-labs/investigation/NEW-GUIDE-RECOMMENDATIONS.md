# Recommendations for New Claude-Flow Guide
## Evidence-Based Guidance for Accurate Documentation

**Based on:** Ground Truth Investigation (SYNTHESIS-GROUND-TRUTH.md)
**Target:** New comprehensive guide for claude-flow
**Principle:** Honesty over hype, utility over marketing

---

## 1. CRITICAL: Start with Honest Positioning

### ❌ DON'T Start With:
```markdown
# Claude-Flow: Enterprise-Grade Multi-Agent Orchestration
Transform Claude Code into a swarm of 50+ AI agents working in parallel...
```

### ✅ DO Start With:
```markdown
# Claude-Flow: Structured Development with Claude Code
Enhance Claude Code with intelligent organization, persistent memory, and workflow coordination.

Claude-Flow makes your single Claude instance:
- More organized (automatic file routing)
- More persistent (cross-session memory)
- More structured (workflow tracking)
- Safer (command validation)
```

---

## 2. Clear Feature Categories

Organize documentation into what ACTUALLY works:

### Tier 1: Proven Features (Lead With These)

#### A. PreToolUse Hooks (Plugin Mode)
```markdown
## File Organization (Plugin Mode)

**What it does:** Automatically routes files to proper directories BEFORE creation

**How it works:**
1. Install: `/plugin ruvnet/claude-flow`
2. Claude Code intercepts Write/Edit commands
3. Pipes through: `npx claude-flow@alpha hooks modify-file`
4. Returns modified path
5. File goes to correct location

**Example:**
┌─────────────────────────┬─────────────────────────┐
│ What You Type           │ Where File Goes         │
├─────────────────────────┼─────────────────────────┤
│ Write "test.js"         │ tests/test.js           │
│ Write "api.test.ts"     │ tests/api.test.ts       │
│ Write "temp-notes.md"   │ docs/working/temp.md    │
│ Write "src/app.js"      │ src/app.js (preserved)  │
└─────────────────────────┴─────────────────────────┘

**Value:** Clean project structure with zero effort
**Reliability:** ✅✅✅ Works consistently
```

#### B. Persistent Memory (MCP Mode)
```markdown
## Cross-Session Memory

**What it does:** Stores context that survives Claude Code restarts

**How it works:**
1. Add MCP server: `claude mcp add claude-flow npx claude-flow@alpha mcp start`
2. Use MCP tool: `mcp__claude-flow__memory_usage`
3. Data stored in SQLite: `.swarm/memory.db`
4. Persists across all sessions

**Example:**
// Monday - Store architecture decisions
mcp__claude-flow__memory_usage({
  action: "store",
  key: "project/architecture",
  value: { pattern: "microservices", auth: "JWT" }
})

// Tuesday - Retrieve in new session
mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "project/architecture"
})
// Returns: { pattern: "microservices", auth: "JWT" }

**Value:** Never lose context between sessions
**Reliability:** ✅✅✅ Works consistently
```

### Tier 2: Functional But Conceptual

#### C. Workflow Coordination (MCP Mode)
```markdown
## Workflow Organization

**What it does:** Helps Claude organize complex work into structured steps

**What it's NOT:** Multi-agent parallel execution

**How it works:**
1. Call `mcp__claude-flow__swarm_init` to create coordination metadata
2. Call `mcp__claude-flow__agent_spawn` to define workflow roles
3. Claude (single agent) uses this structure to organize work
4. Progress tracked in database

**Think of it as:**
- ✅ A project management tool for Claude's work
- ✅ Structured thinking framework
- ✅ Progress tracking system
- ❌ NOT multiple AI agents running in parallel
- ❌ NOT distributed computing
- ❌ NOT separate Claude instances

**Example:**
// Set up coordination structure
mcp__claude-flow__swarm_init({ topology: "hierarchical" })
mcp__claude-flow__agent_spawn({ type: "system-architect" })
mcp__claude-flow__agent_spawn({ type: "backend-dev" })
mcp__claude-flow__agent_spawn({ type: "tester" })

// Claude then organizes its work as:
// 1. System architecture phase (tracks as "system-architect")
// 2. Backend implementation (tracks as "backend-dev")
// 3. Testing (tracks as "tester")

// Result: Better structured development, NOT parallel agents

**Value:** Organized approach to complex tasks
**Reliability:** ✅✅ Works as organizational tool
```

### Tier 3: Limited/Placeholder Features

#### D. Neural Training
```markdown
## Pattern Learning (Beta)

**What it does:** Tracks patterns and basic learning

**Current status:** Basic statistics collection

**What works:**
- ✅ Pattern frequency tracking
- ✅ Performance metrics
- ✅ Basic trend analysis

**What doesn't work yet:**
- ⚠️ Advanced ML training
- ⚠️ Predictive optimization
- ⚠️ Neural network inference

**Use for:** Performance monitoring and basic analytics
**Not for:** Production ML workloads
```

---

## 3. Rewrite Misleading Sections

### Example 1: Agent Spawning

#### ❌ Current Documentation:
```markdown
### Spawn Specialized Agents

You: "Create three swarms to build user management, payment processing,
     and notifications in parallel"
[Claude orchestrates three independent swarms]

You: "Show me the progress of all three swarms"
[Claude provides real-time status]
```

#### ✅ Rewritten (Honest):
```markdown
### Organize Complex Work with Agent Metadata

You: "Use coordination tools to structure building user management,
     payment processing, and notifications"

[Claude creates coordination metadata for three workflow streams]
[Claude organizes its single-agent work into three tracked phases]

You: "Show me the workflow progress"
[Claude displays phase completion status from database tracking]

**Note:** This creates organizational structure, not separate AI agents.
Claude remains a single agent executing all work with better tracking.
```

### Example 2: Multi-Agent Development

#### ❌ Current Documentation:
```markdown
## Pattern 1: Parallel Feature Development

Create three swarms to build features in parallel. Each swarm
independently develops its feature with specialized agents,
then integration happens when all complete.
```

#### ✅ Rewritten (Honest):
```markdown
## Pattern 1: Structured Feature Development

Use coordination tools to organize feature development with clear phases:

1. **Setup coordination metadata** for three features
2. **Claude develops each sequentially** with clear context switching
3. **Progress tracked separately** in database for each feature
4. **Integration phase** planned after all features complete

**Reality check:** This is serial development with better organization,
not parallel execution. Value comes from structured approach and tracking.
```

### Example 3: Performance Claims

#### ❌ Current Documentation:
```markdown
## Performance Benefits

When using Claude Flow coordination with Claude Code:
- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
```

#### ✅ Rewritten (Honest):
```markdown
## Reported Benefits

Users report improvements from better organization:
- Fewer mistakes from file organization
- Better context preservation across sessions
- More structured approach to complex tasks
- Reduced time debugging file location issues

**Note:** Quantitative benchmarks are user-reported anecdotes,
not formal evaluations. Your results may vary.
```

---

## 4. Add Clear "What This Is NOT" Section

```markdown
## Important: What Claude-Flow IS NOT

To set clear expectations:

### ❌ NOT Multi-Agent Execution
Claude-Flow does NOT spawn multiple AI agents running in parallel.
The "agent spawning" creates organizational metadata, not separate processes.

**What happens:**
- One Claude instance (you) does all work
- Coordination tools help organize that work
- Database tracks different workflow phases
- No actual parallelism occurs

### ❌ NOT Distributed Computing
No distributed execution, message passing, or multi-process coordination exists.

**What happens:**
- Single Node.js process (MCP server)
- SQLite database (local file)
- No network communication between "agents"
- No container orchestration

### ❌ NOT Enterprise Orchestration
This is a development productivity tool, not a production deployment platform.

**What happens:**
- Helps individual developer stay organized
- Tracks workflow metadata locally
- No multi-tenant support
- No production-grade scaling

### ✅ What It Actually IS
A single-agent enhancement tool that provides:
- File organization automation
- Persistent memory across sessions
- Workflow tracking metadata
- Command safety improvements
```

---

## 5. Practical Examples That Work

Only include examples that demonstrate REAL functionality:

### Example 1: File Organization (Actually Works)

```markdown
## Real Example: Auto-Organizing Test Files

**Setup:**
```bash
/plugin ruvnet/claude-flow  # In Claude Code
```

**Session:**
```
You: "Write a test for the authentication module"

Claude: [Creates test file]

Result: tests/auth.test.js  ← Automatically routed
Not: auth.test.js in root   ← Would have been without plugin
```

**Why this matters:**
- No manual file moving
- Consistent project structure
- Works automatically every time
- Zero configuration needed
```

### Example 2: Memory Persistence (Actually Works)

```markdown
## Real Example: Remembering API Design Across Sessions

**Monday Morning:**
```javascript
You: "Let's design a REST API for user management"

Claude: [Designs API with endpoints, schemas, etc.]

// Store the design
mcp__claude-flow__memory_usage({
  action: "store",
  key: "api/users/design",
  value: {
    endpoints: [
      { method: "GET", path: "/users", auth: "required" },
      { method: "POST", path: "/users", auth: "admin" },
      { method: "PUT", path: "/users/:id", auth: "owner" }
    ],
    schema: { /* user schema */ },
    database: "PostgreSQL"
  }
})
```

**Wednesday Afternoon (New Session):**
```javascript
You: "Continue implementing the user API we designed"

Claude: "Let me retrieve our design..."

mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "api/users/design"
})

// Returns complete design from Monday
// Claude continues with full context
```

**Why this matters:**
- No copy-pasting from old sessions
- Consistent implementation
- Team knowledge sharing
- Survives computer restarts
```

### Example 3: Workflow Organization (Conceptual but Useful)

```markdown
## Real Example: Structuring Complex Refactoring

**Task:** Refactor authentication system with tests

**Without coordination tools:**
```
You: "Refactor the auth system"
Claude: [Tackles it all at once, might miss steps]
```

**With coordination tools:**
```javascript
// Setup workflow structure
mcp__claude-flow__swarm_init({ topology: "hierarchical" })
mcp__claude-flow__agent_spawn({ type: "code-analyzer", name: "Audit" })
mcp__claude-flow__agent_spawn({ type: "coder", name: "Refactor" })
mcp__claude-flow__agent_spawn({ type: "tester", name: "Validation" })

// Claude organizes work as:
// Phase 1: Audit current auth code (tracks as "Audit" agent)
// Phase 2: Refactor implementation (tracks as "Refactor" agent)
// Phase 3: Update all tests (tracks as "Validation" agent)

// Check progress anytime:
mcp__claude-flow__swarm_status()
// Shows: Audit ✅ | Refactor 🔄 60% | Validation ⏳
```

**Why this matters:**
- Clear phases prevent missing steps
- Progress tracking for complex tasks
- Better organization of large refactors
- Database tracks completion status
```

---

## 6. Installation Guide (Clear and Accurate)

```markdown
## Installation: Choose Your Mode

Claude-Flow has three modes. Choose based on what you need:

### Mode 1: Plugin Only (Recommended First Step)
**Get:** File organization + command safety
**Install:** 30 seconds
**Requires:** Claude Code only

```bash
# In Claude Code:
/plugin ruvnet/claude-flow
```

**Test it works:**
```
You: "Create a test file called temp-test.js"
Expected: File created at tests/temp-test.js ✅
```

### Mode 2: Plugin + MCP Server (For Memory)
**Get:** Everything from Mode 1 + persistent memory
**Install:** 2 minutes
**Requires:** Claude Code + node/npm

```bash
# Add MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Restart Claude Code
```

**Test it works:**
```javascript
// Store something
mcp__claude-flow__memory_usage({
  action: "store",
  key: "test/data",
  value: { test: "hello" }
})

// Verify storage
ls -la .swarm/memory.db  # Should exist
```

### Mode 3: Full Setup (For Advanced Features)
**Get:** Everything from Mode 2 + CLI access + neural features
**Install:** 5 minutes
**Requires:** Mode 2 + npm install

```bash
# Install globally
npm install -g claude-flow@alpha

# Verify installation
claude-flow --version
claude-flow health
```

**Troubleshooting:**
- Plugin not working? Check `.claude-plugin/hooks/hooks.json` exists
- MCP tools missing? Restart Claude Code after adding server
- Memory not persisting? Check `.swarm/memory.db` file permissions
```

---

## 7. Troubleshooting Section (Reality-Based)

```markdown
## Common Issues & Reality Checks

### "My agents aren't running in parallel"
**Reality:** There are no parallel agents. This is expected behavior.

**What's happening:**
- Agent metadata created in database ✅
- Claude (single agent) organizes work ✅
- No parallel execution occurs ✅ (by design)

**Solution:** None needed - working as designed

### "Swarm coordination seems slow"
**Reality:** "Swarm" is organizational metaphor, not parallel execution.

**What's happening:**
- Database writes for coordination tracking
- SQLite operations on every agent "spawn"
- Overhead from organizational structure

**Solution:**
- For simple tasks, don't use coordination tools
- Reserve for complex multi-phase work
- Overhead worthwhile for better organization

### "Memory not persisting"
**Reality:** This SHOULD work. If not, it's a bug.

**Debug steps:**
1. Check `.swarm/memory.db` exists
2. Verify file permissions (readable/writable)
3. Test with CLI: `npx claude-flow@alpha memory store test "hello"`
4. Test retrieval: `npx claude-flow@alpha memory retrieve test`

**If still broken:** File issue on GitHub (this is core functionality)

### "Files still going to root"
**Reality:** Plugin hooks not active.

**Debug steps:**
1. Check `.claude-plugin/hooks/hooks.json` exists
2. Restart Claude Code after plugin install
3. Verify hooks.json has PreToolUse entries
4. Test: Create "test.test.js" - should go to tests/

**If still broken:** Reinstall plugin: `/plugin ruvnet/claude-flow --force`
```

---

## 8. Use Case Guide (Practical)

```markdown
## When to Use Claude-Flow

### ✅ Good Use Cases

#### Solo Developer on Long Project
**Problem:** Lose context between sessions, messy file structure
**Solution:** Mode 2 (Plugin + MCP)
**Benefit:** Clean structure + persistent context

#### Team with Shared Knowledge Base
**Problem:** Each developer reinvents decisions
**Solution:** Mode 2 with shared memory namespace
**Benefit:** Team-wide context preservation

#### Complex Refactoring Project
**Problem:** Easy to lose track of progress
**Solution:** Mode 2 with coordination tools
**Benefit:** Clear phases and progress tracking

### ❌ Not Good Use Cases

#### Expecting Parallel AI Agents
**Problem:** Want actual multi-agent execution
**Solution:** Claude-Flow won't help
**Alternative:** Use actual parallel tools (multiple Claude Code instances)

#### Production Orchestration
**Problem:** Need enterprise agent management
**Solution:** Claude-Flow is development tool, not production platform
**Alternative:** Kubernetes, Docker Swarm, etc.

#### Real-Time Collaboration
**Problem:** Multiple developers coding simultaneously
**Solution:** Claude-Flow is single-user tool
**Alternative:** VS Code Live Share, real-time collaboration tools
```

---

## 9. Quick Reference Card (Accurate)

```markdown
## Claude-Flow Cheat Sheet

### What It Does
✅ Auto-organize files
✅ Persistent memory
✅ Workflow tracking
✅ Command safety
✅ Git commit formatting

### What It Doesn't Do
❌ Parallel AI agents
❌ Multi-process execution
❌ Distributed computing
❌ Production orchestration

### Essential Commands
```bash
# Plugin mode
/plugin ruvnet/claude-flow

# Memory storage
mcp__claude-flow__memory_usage({ action: "store", key, value })

# Memory retrieval
mcp__claude-flow__memory_usage({ action: "retrieve", key })

# Workflow setup (organizational only)
mcp__claude-flow__swarm_init({ topology })
mcp__claude-flow__agent_spawn({ type, name })

# Check status
mcp__claude-flow__swarm_status()
```

### File Organization Rules
```
test*.* → tests/
*.test.* → tests/
*.spec.* → tests/
*temp* → tmp/
*notes* → docs/working/
```

### When to Use Each Mode
- **Plugin:** Always (no downside)
- **MCP:** Multi-session projects
- **CLI:** Automation/scripting
```

---

## 10. Final Writing Guidelines

### Tone and Style

#### ✅ DO:
- Be honest about capabilities
- Explain what happens under the hood
- Use "organizational" instead of "multi-agent"
- Say "Claude (single agent)" explicitly
- Include "Reality check" boxes
- Show actual code/commands
- Admit limitations

#### ❌ DON'T:
- Imply parallel execution
- Use "swarm" without context
- Claim unverified benchmarks
- Hide that it's single-agent
- Oversell capabilities
- Skip technical details
- Make aspirational claims

### Structure Each Feature As:

```markdown
## Feature Name

**What it does:** One sentence description
**How it works:** Technical explanation
**Reality check:** What it's NOT
**Example:** Working code
**Value:** Why use it
**Limitations:** What doesn't work
```

### Include These Disclaimers:

```markdown
⚠️ **Important:** Claude-Flow enhances SINGLE-AGENT development.
All "agent spawning" creates organizational metadata, not separate processes.

✅ **What you get:** Better organization and persistence
❌ **What you don't get:** Parallel multi-agent execution
```

---

## 11. Testing the New Guide

### Before Publishing, Verify:

1. **New user test:**
   - Give guide to someone unfamiliar with claude-flow
   - Ask them to install and use
   - Do their expectations match reality?

2. **Feature accuracy test:**
   - Try every example in the guide
   - Does each one work as documented?
   - Are limitations accurate?

3. **Terminology test:**
   - Search for "agent" → Always qualified?
   - Search for "parallel" → Always clarified?
   - Search for "swarm" → Always explained?

4. **Honesty test:**
   - Could user sue for false advertising?
   - Would they feel deceived after using?
   - Are claims verifiable?

---

## Summary: The Golden Rules

1. **Honesty First:** Accurate over impressive
2. **Show, Don't Tell:** Working examples > marketing claims
3. **Clarify Constantly:** Explain what terms mean
4. **Set Expectations:** What it's NOT is as important as what it IS
5. **Test Everything:** Only document what actually works
6. **Admit Limitations:** Build trust with transparency
7. **Emphasize Value:** Organization and memory ARE valuable
8. **No Hype:** Let real features speak for themselves

---

**Remember:** The goal is happy users who get exactly what they expect. That's better than confused users who believed marketing hype.

Better to have 1000 satisfied users who understand the tool than 10,000 disappointed users who expected something else.
