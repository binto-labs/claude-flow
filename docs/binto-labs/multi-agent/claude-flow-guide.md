---
status: keep
phase: complete
type: reference
version: 2.7.1
last-updated: 2025-11-27
title: Claude-Flow Reference Guide
author: Claude Code + Human Developer
tags: [claude-flow, reference, architecture, commands, agents, memory]
---

# 🌊 Claude-Flow Reference Guide

**Version**: 2.7.0-alpha.10 | **Last Updated**: 2025-11-27

> **This is a reference manual.** For workflow guidance and decision trees,
> see [workflow.md](./workflow.md).

---

> **Revolutionary AI Coordination**: Execute multi-agent swarms from Claude Code with intelligent coordination, persistent memory, and neural pattern learning.

---

## 📖 Table of Contents

**Workflow & Decision Making** → See [workflow.md](./workflow.md)

**Getting Started**

- [Quick Start](#quick-start) - Installation and first command
- [Core Architecture](#core-architecture) - How the three layers work together

**Executing Swarms**

- [Agent Instruction Patterns](#agent-instruction-patterns) - How to write agent instructions with hooks
- [Memory Coordination](#memory-coordination) - Agent-to-agent coordination patterns
- [Complete Execution Flow](#complete-execution-flow) - Step-by-step swarm execution

**Command Reference**

- [Command Decision Tree](#command-decision-tree) - When to use swarm vs hive-mind
- [Essential Commands](#essential-commands) - swarm, hive-mind, memory

**Practical Examples**

- [E-Commerce Example](#e-commerce-example) - Complete checkout flow implementation
- [Template-Based Execution](#template-based-execution) - Reusable task templates

**Quality & Improvement**

- [Code Quality Evals](#-code-quality-evals) - LLM + CI/CD analysis
- [Continuous Improvement](#-continuous-improvement) - Pattern capture and learning

**Reference**

- [Agent Types](#agent-types) - 54 specialized agents
- [Troubleshooting](#troubleshooting) - Common issues and solutions
- [Performance](#performance) - Benchmarks and optimization

---

## 🚀 Quick Start

### Installation

```bash
# 1. Install Claude Code globally (required)
npm install -g @anthropic-ai/claude-code

# 2. Install claude-flow (alpha channel)
npm install -g claude-flow@alpha

# 3. Initialize in your project
cd your-project
npx claude-flow@alpha init --force
```

### First Command

```bash
# Simple task execution
npx claude-flow swarm "Build user authentication" --claude

# Complex multi-feature project
npx claude-flow hive-mind spawn "Build e-commerce platform" --claude
```

### Execution Templates

For spawning swarms with Claude Code's Task tool and guaranteed quality gates:

- **Regular swarms** (3-6 agents, fixed plan): ./swarm-templates.md
- **Queen-coordinated** (7+ agents, adaptive): ./hive-mind-templates.md

These templates provide the 6-step coordination protocol and spawn patterns.

### Key Concepts

**Three Execution Layers**:

1. **MCP Tools** - Set up coordination infrastructure (topology, memory, hooks)
2. **Claude Code Task Tool** - Spawn actual working agents with full tool access
3. **Hooks** - Agents manually call hooks via Bash for coordination

**The Pattern**: MCP coordinates → Task tool executes → Hooks enable memory sharing

[↑ Back to TOC](#-table-of-contents)

---

## 🏗️ Core Architecture

### How Claude-Flow Works

```
User runs: npx claude-flow swarm "task" --claude
         ↓
Claude-Flow sets up:
  ✅ Swarm infrastructure (topology, memory, hooks system)
  ✅ Opens Claude Code CLI with full context
         ↓
Claude Code spawns agents via Task tool:
  Task("Backend Dev", "Build API. Use hooks for coordination.", "backend-dev")
  Task("Tester", "Write tests. Coordinate via memory.", "tester")
         ↓
Agents execute and coordinate:
  ✅ Call hooks via Bash (npx claude-flow hooks pre-task/post-task)
  ✅ Share state via memory system
  ✅ Track performance and learn patterns
```

### Layer 1: MCP Coordination Infrastructure

**Purpose**: Set up swarm metadata, hooks system, and shared memory

```javascript
// MCP tools initialize coordination (optional but recommended)
mcp__claude-flow__swarm_init({ topology: "hierarchical", maxAgents: 8 })
mcp__claude-flow__agent_spawn({ type: "coder", name: "backend-dev" })
mcp__claude-flow__memory_usage({
  action: "store",
  namespace: "swarm/project",
  key: "plan",
  value: JSON.stringify({ objective: "Build API", features: [...] })
})
```

**What this does**:

- Creates swarm metadata for monitoring
- Sets up hooks infrastructure (enabled by `--claude` flag)
- Initializes shared memory namespaces
- Configures coordination topology

**What this does NOT do**: Spawn working agents, execute code, modify files

### Layer 2: Claude Code Task Tool (Actual Execution)

**Purpose**: Spawn real working agents with full tool access (Read, Write, Edit, Bash)

```javascript
// Claude Code's Task tool spawns ACTUAL working agents
Task(
  'Backend API Specialist',
  `You are backend-api agent.

  🔧 COORDINATION PROTOCOL (CRITICAL):

  1. BEFORE starting work:
     npx claude-flow hooks pre-task --description "Backend API implementation"
     npx claude-flow hooks session-restore --session-id "swarm-project"

  2. READ context from memory:
     npx claude-flow memory read --namespace "swarm/project" --key "plan"

  3. YOUR TASKS:
     - Implement REST API endpoints
     - Add authentication middleware
     - Write unit tests (90%+ coverage)

  4. AFTER each file edit:
     npx claude-flow hooks post-edit --file "api/routes/users.js"

  5. PUBLISH results to memory:
     npx claude-flow memory store \\
       --namespace "swarm/backend-api" \\
       --key "api-contract" \\
       --value "$(cat api/docs/API.md)"

  6. AFTER completing all tasks:
     npx claude-flow hooks post-task --task-id "backend-api"`,
  'backend-dev'
);
```

**Key Point**: Agents have access to ALL tools and execute hooks manually via Bash commands.

### Layer 3: Hooks Integration

**Purpose**: Enable memory sharing, progress tracking, and neural learning

**Hook Types**:

| Hook              | When to Call          | What It Does                                               |
| ----------------- | --------------------- | ---------------------------------------------------------- |
| `pre-task`        | Before starting work  | Validates agent, restores context, loads memory            |
| `post-edit`       | After modifying files | Auto-formats code, stores changes, trains patterns         |
| `post-task`       | After completing work | Publishes completion, exports metrics, triggers dependents |
| `session-restore` | At task start         | Loads previous session context                             |
| `session-end`     | At task completion    | Exports final metrics and summary                          |

**Example Hook Execution**:

```bash
# Agents manually execute these via Bash tool
npx claude-flow hooks pre-task --description "API implementation"
npx claude-flow hooks post-edit --file "api/routes/users.js" --memory-key "swarm/backend/progress"
npx claude-flow hooks post-task --task-id "backend-api"
```

[↑ Back to TOC](#-table-of-contents)

---

## 📋 Agent Instruction Patterns

### Complete Agent Instruction Template

**Every agent instruction should include these 6 steps**:

```javascript
Task(
  'Agent Name',
  `You are [agent-role] agent for [project].

  🔧 COORDINATION PROTOCOL (CRITICAL):

  1. BEFORE starting work:
     npx claude-flow hooks pre-task --description "[task description]"
     npx claude-flow hooks session-restore --session-id "[swarm-id]"

  2. READ context from swarm memory:
     npx claude-flow memory read --namespace "[namespace]" --key "[key]"
     # Example: --namespace "swarm/project" --key "plan"

  3. YOUR TASKS:
     - [Specific task 1 with measurable outcome]
     - [Specific task 2 with measurable outcome]
     - [Specific task 3 with measurable outcome]

  4. AFTER each file edit:
     npx claude-flow hooks post-edit \\
       --file "[file-path]" \\
       --memory-key "[namespace]/[agent-name]/progress"

  5. PUBLISH your work to memory (if other agents depend on it):
     npx claude-flow memory store \\
       --namespace "[namespace]/[agent-name]" \\
       --key "[what-you-built]" \\
       --value "$(cat [path-to-contract-or-doc])"

  6. AFTER completing all tasks:
     npx claude-flow hooks post-task --task-id "[task-id]"
     npx claude-flow hooks session-end --export-metrics true`,
  'agent-type'
);
```

### Best Practices

✅ **Always batch operations** - Spawn all agents in a single message
✅ **Include all 6 coordination steps** - Pre-task, read, tasks, post-edit, publish, post-task
✅ **Use specific task descriptions** - "Implement user auth with JWT" not "build stuff"
✅ **Publish contracts to memory** - Other agents wait for/consume these
✅ **Execute hooks via Bash** - Agents manually call `npx claude-flow hooks [command]`

[↑ Back to TOC](#-table-of-contents)

---

## 🔗 Memory Coordination

Agents coordinate via shared memory without direct communication.

### Pattern 1: Producer-Consumer

**Backend Agent** (produces API contract):

```bash
# After completing API implementation
npx claude-flow memory store \
  --namespace "swarm/backend" \
  --key "api-contract" \
  --value "$(cat api/docs/API_CONTRACT.md)"

# Contract published! Other agents can now consume it.
```

**Frontend Agent** (consumes API contract):

```bash
# Wait for backend to publish contract (dependency waiting)
while ! npx claude-flow memory read \
  --namespace "swarm/backend" \
  --key "api-contract" > /tmp/api-contract.md; do
  echo "Waiting for backend API contract..."
  sleep 10
done

# Contract received! Now implement frontend
cat /tmp/api-contract.md  # Read the contract
# ... implement React components based on API contract
```

### Pattern 2: Progress Broadcasting

**Any Agent** (broadcasts progress):

```bash
# After completing milestone
npx claude-flow memory store \
  --namespace "swarm/my-agent" \
  --key "milestone-1-done" \
  --value "Completed user authentication with 40 tests passing (95% coverage)"
```

**QA/Coordinator Agent** (monitors all progress):

```bash
# Check all agents' progress
npx claude-flow memory query "*-done" --namespace "swarm/*"

# Output shows which agents completed which milestones
```

### Pattern 3: Dependency Waiting

**Dependent Agent** (waits for upstream work):

```bash
# Wait for upstream agent to signal completion
while ! npx claude-flow memory read \
  --namespace "swarm/upstream-agent" \
  --key "completion-signal"; do
  echo "Waiting for upstream agent to finish..."
  sleep 10
done

# Dependency satisfied, proceed with work
echo "Upstream completed. Starting my tasks."
```

[↑ Back to TOC](#-table-of-contents)

---

## 🚀 Complete Execution Flow

### Step 1: Initialize MCP Coordination (Optional)

```javascript
// Single message - set up coordination infrastructure
[Message 1]:
  mcp__claude-flow__swarm_init({
    topology: "hierarchical",  // or "mesh", "ring", "star"
    maxAgents: 6
  })

  mcp__claude-flow__agent_spawn({ type: "coder", name: "backend-dev" })
  mcp__claude-flow__agent_spawn({ type: "coder", name: "frontend-dev" })
  mcp__claude-flow__agent_spawn({ type: "tester", name: "qa-specialist" })

  mcp__claude-flow__memory_usage({
    action: "store",
    namespace: "swarm/project",
    key: "plan",
    value: JSON.stringify({
      objective: "User authentication system",
      features: ["login", "registration", "password reset"],
      quality: "90% test coverage, 0 mypy errors"
    })
  })
```

### Step 2: Spawn Working Agents via Task Tool

```javascript
// Single message - spawn ALL agents in parallel
[Message 2]:

  // Batch all todos together
  TodoWrite { todos: [
    {content: "Backend authentication service", status: "in_progress", activeForm: "Implementing backend authentication service"},
    {content: "Frontend login UI", status: "pending", activeForm: "Implementing frontend login UI"},
    {content: "Password reset flow", status: "pending", activeForm: "Implementing password reset flow"},
    {content: "Integration tests", status: "pending", activeForm: "Writing integration tests"},
    {content: "Security review", status: "pending", activeForm: "Performing security review"}
  ]}

  // Spawn all agents concurrently
  Task("Backend Authentication Specialist",
    `You are backend-auth agent.

    🔧 COORDINATION PROTOCOL:
    1. BEFORE: npx claude-flow hooks pre-task --description "Backend authentication"
    2. READ: npx claude-flow memory read --namespace "swarm/project" --key "plan"
    3. TASKS:
       - Implement JWT authentication
       - Password hashing with bcrypt
       - Session management with Redis
       - Unit tests (90%+ coverage)
    4. AFTER EDITS: npx claude-flow hooks post-edit --file [file]
    5. PUBLISH API: npx claude-flow memory store --namespace "swarm/backend" --key "auth-api" --value "$(cat api/docs/AUTH_API.md)"
    6. COMPLETE: npx claude-flow hooks post-task --task-id "backend-auth"`,
    "backend-dev"
  )

  Task("Frontend Login Specialist",
    `You are frontend-login agent.

    🔧 COORDINATION PROTOCOL:
    1. BEFORE: npx claude-flow hooks pre-task --description "Frontend login"
    2. WAIT for backend API:
       while ! npx claude-flow memory read --namespace "swarm/backend" --key "auth-api"; do sleep 10; done
    3. TASKS:
       - React login form with validation
       - JWT token storage
       - Protected route components
       - Jest tests (90%+ coverage)
    4. AFTER EDITS: npx claude-flow hooks post-edit --file [file]
    5. COMPLETE: npx claude-flow hooks post-task --task-id "frontend-login"`,
    "coder"
  )

  Task("QA Integration Specialist",
    `You are qa-integration agent.

    🔧 COORDINATION PROTOCOL:
    1. BEFORE: npx claude-flow hooks pre-task --description "Integration testing"
    2. WAIT for both agents:
       while ! npx claude-flow memory read --namespace "swarm/backend" --key "auth-api"; do sleep 10; done
       while ! npx claude-flow memory read --namespace "swarm/frontend" --key "login-ui-done"; do sleep 10; done
    3. TASKS:
       - End-to-end login flow tests
       - Security validation tests
       - Performance tests
    4. AFTER EDITS: npx claude-flow hooks post-edit --file [file]
    5. COMPLETE: npx claude-flow hooks post-task --task-id "qa-integration"`,
    "tester"
  )
```

### Step 3: Monitor Progress (While Agents Work)

```javascript
// Check swarm status
mcp__claude - flow__swarm_status({ verbose: true });

// Check agent metrics
mcp__claude - flow__agent_metrics({ metric: 'all' });

// Check memory to see what agents published
mcp__claude -
  flow__memory_usage({
    action: 'search',
    namespace: 'swarm/project',
    pattern: '*',
  });
```

### Step 4: Collect Results

```javascript
// Get task results
mcp__claude - flow__task_results({ taskId: 'backend-auth', format: 'detailed' });
mcp__claude - flow__task_results({ taskId: 'frontend-login', format: 'detailed' });

// Generate performance report
mcp__claude - flow__performance_report({ format: 'summary', timeframe: '24h' });
```

[↑ Back to TOC](#-table-of-contents)

---

## 🎯 Command Decision Tree

### When to Use What?

```
Need to continue previous work?
  YES → npx claude-flow hive-mind resume <session-id>
  NO  → Continue

Multi-day project with persistent memory?
  YES → npx claude-flow hive-mind spawn "task" --claude
  NO  → Continue

Single feature or bug fix?
  YES → npx claude-flow swarm "task" --claude
```

### Quick Comparison

| Criteria      | `swarm`                 | `hive-mind`                |
| ------------- | ----------------------- | -------------------------- |
| **Duration**  | Single session          | Multi-day project          |
| **Memory**    | Task-scoped             | Persistent (SQLite)        |
| **Team Size** | 1-5 agents              | 5-15 agents                |
| **Resume**    | No                      | Yes                        |
| **Use Case**  | Bug fix, single feature | Full application, research |

[↑ Back to TOC](#-table-of-contents)

---

## 🔧 Essential Commands

### `swarm` - Quick Task Execution

**Syntax**:

```bash
npx claude-flow swarm <objective> [options]
```

**Key Options**:

- `--claude`: Open new Claude Code window (ALWAYS USE THIS)
- `--strategy <type>`: development | research | testing | optimization
- `--mode <type>`: hierarchical | mesh | ring | star
- `--max-agents <n>`: Maximum agents (default: 5)
- `--parallel`: Enable parallel execution (2.8-4.4x faster)

**Examples**:

```bash
# Simple feature
npx claude-flow swarm "Add user profile page" --claude

# With strategy
npx claude-flow swarm "Fix authentication bug" \
  --strategy development \
  --mode hierarchical \
  --parallel \
  --claude

# With template file
npx claude-flow swarm "$(cat docs/prompts/feature.md)" --claude
```

**When to Use**: Single feature, bug fix, quick prototype

---

### `hive-mind spawn` - Complex Projects

**Syntax**:

```bash
npx claude-flow hive-mind spawn <objective> [options]
```

**Key Options**:

- `--claude`: Open Claude Code (REQUIRED)
- `--namespace <name>`: Organize memory by feature
- `--continue-session`: Resume from previous hive
- `--agents <types>`: Comma-separated agent types
- `--queen-type <type>`: strategic | tactical | adaptive

**Examples**:

```bash
# Start complex project
npx claude-flow hive-mind spawn "Build e-commerce platform" --claude

# Continue previous work
npx claude-flow hive-mind spawn "Add payment integration" \
  --namespace payments \
  --continue-session \
  --claude

# Specific agents
npx claude-flow hive-mind spawn "Research microservices" \
  --agents researcher,analyst,architect \
  --claude
```

**When to Use**: Multi-day projects, needs persistent memory, session resumption

---

### `memory` - Persistent Memory Management

**Syntax**:

```bash
npx claude-flow memory <action> [key] [value] [options]
```

**Common Actions**:

```bash
# Store decision
npx claude-flow memory store "api_pattern" "REST with pagination" \
  --namespace backend

# Query memories
npx claude-flow memory query "authentication" --namespace backend

# Semantic search (AgentDB - 96x faster)
npx claude-flow memory vector-search "user login flow" --k 10

# List all
npx claude-flow memory list --namespace backend

# Export backup
npx claude-flow memory export backup.json
```

**Options**:

- `--namespace <name>`: Memory namespace (organize by feature)
- `--ttl <seconds>`: Time to live
- `--k <number>`: Results to return (vector search)
- `--threshold <float>`: Similarity threshold (0-1)

[↑ Back to TOC](#-table-of-contents)

---

## 💡 E-Commerce Example

### Scenario: Abandoned Cart Recovery

**User Request**: "Add abandoned cart recovery with email notifications"

### Step 1: Create Task Template

Save to `docs/prompts/abandoned-cart.md`:

```markdown
# Task: Abandoned Cart Recovery

## Objective

Email notification system for abandoned carts with discount recovery

## Requirements

- Detect cart abandonment (30 min inactivity)
- Send personalized email with cart contents
- Include 10% discount code
- Track email opens and recovery rate

## Technical Stack

- Express + Bull (queue) + Nodemailer + PostgreSQL
- London School TDD, 90%+ coverage

## Success Criteria

- [ ] Abandonment detected within 30 min
- [ ] Email sent with cart + discount
- [ ] Click tracking operational
- [ ] Recovery metrics dashboard
```

### Step 2: Execute with Claude-Flow

```bash
npx claude-flow swarm "$(cat docs/prompts/abandoned-cart.md)" \
  --strategy development \
  --mode hierarchical \
  --max-agents 6 \
  --parallel \
  --claude
```

### Step 3: Claude Code Spawns Agents

Claude-Flow opens Claude Code, which spawns:

```javascript
Task(
  'Backend Cart Monitor',
  `🔧 COORDINATION PROTOCOL:
  1. BEFORE: npx claude-flow hooks pre-task --description "Cart monitoring service"
  2. TASKS:
     - Implement cart abandonment detection (30 min)
     - Bull queue for email jobs
     - PostgreSQL schema for tracking
  3. AFTER EDITS: npx claude-flow hooks post-edit --file [file]
  4. PUBLISH: npx claude-flow memory store --namespace "swarm/cart" --key "monitoring-api" --value "$(cat api/docs/CART_API.md)"
  5. COMPLETE: npx claude-flow hooks post-task --task-id "cart-monitor"`,
  'backend-dev'
);

Task(
  'Email Service',
  `🔧 COORDINATION PROTOCOL:
  1. BEFORE: npx claude-flow hooks pre-task --description "Email service"
  2. WAIT: while ! npx claude-flow memory read --namespace "swarm/cart" --key "monitoring-api"; do sleep 10; done
  3. TASKS:
     - Email templates (Handlebars)
     - Nodemailer integration
     - Discount code generation
  4. AFTER EDITS: npx claude-flow hooks post-edit --file [file]
  5. COMPLETE: npx claude-flow hooks post-task --task-id "email-service"`,
  'backend-dev'
);

Task(
  'QA Specialist',
  `🔧 COORDINATION PROTOCOL:
  1. WAIT for both services to complete
  2. TASKS:
     - Integration tests (cart → email flow)
     - Unit tests (90%+ coverage)
     - Performance tests (1000 concurrent carts)
  3. COMPLETE: npx claude-flow hooks post-task --task-id "qa-integration"`,
  'tester'
);
```

### Result

- ✅ Cart abandonment detection operational (30 min threshold)
- ✅ Email service sends personalized emails with discount
- ✅ Click tracking via URL parameters
- ✅ Metrics dashboard showing recovery rate
- ✅ 92% test coverage, 0 mypy errors

[↑ Back to TOC](#-table-of-contents)

---

## 📝 Template-Based Execution

### Why Use Templates?

Templates provide consistent structure for complex tasks, making them:

- ✅ **Reusable** - Save for similar future tasks
- ✅ **Shareable** - Team uses same patterns
- ✅ **Version-controlled** - Track template evolution in git
- ✅ **AI-optimized** - Claude knows exactly what you need

### Template Structure

Create templates in `docs/prompts/[feature-name].md`:

```markdown
# Task: [Feature Name]

## Objective

[Clear, concise description of what to build]

## Requirements

- Specific requirement 1
- Specific requirement 2
- Specific requirement 3

## Technical Stack

- **Stack**: [Technologies, frameworks]
- **Methodology**: SPARC + London School TDD
- **Quality**: 90%+ test coverage

## Swarm Configuration

- **Strategy**: development | research | testing | optimization
- **Agents**: [Number and types needed]
- **Coordination**: hierarchical | mesh | ring | star

## Success Criteria

- [ ] Measurable outcome 1
- [ ] Measurable outcome 2
- [ ] All tests pass with 90%+ coverage
```

### Using Templates with Commands

```bash
# Execute template directly
npx claude-flow swarm "$(cat docs/prompts/auth-feature.md)" \
  --strategy development \
  --mode hierarchical \
  --max-agents 6 \
  --parallel \
  --claude

# For complex projects
npx claude-flow hive-mind spawn "$(cat docs/prompts/microservices.md)" \
  --namespace services \
  --claude
```

### Example: Simple Feature Template

**File**: `docs/prompts/password-reset.md`

```markdown
# Task: Add Password Reset

## Objective

Password reset flow with email verification

## Requirements

- Email with reset link (1-hour expiry)
- Secure token generation (JWT)
- Password strength validation
- Rate limiting (3 attempts per hour)

## Technical Stack

- **Stack**: Express + Nodemailer + JWT + Redis
- **Quality**: 90%+ coverage, security audit passed

## Swarm Configuration

- **Strategy**: development
- **Agents**: 4 agents (1 backend, 1 test, 1 security, 1 docs)
- **Coordination**: mesh

## Success Criteria

- [ ] Email sent with valid token
- [ ] Token expires after 1 hour
- [ ] Password meets strength requirements (8+ chars, mixed case, numbers)
- [ ] Rate limiting prevents abuse
- [ ] 90%+ test coverage
- [ ] No PII leakage in logs/emails
```

**Execute**:

```bash
npx claude-flow swarm "$(cat docs/prompts/password-reset.md)" --claude
```

### Example: Complex Project Template

**File**: `docs/prompts/e-commerce-platform.md`

```markdown
# Task: E-Commerce Platform

## Objective

Build complete e-commerce platform with modern architecture

## Requirements

- User authentication & authorization (JWT + OAuth)
- Product catalog with search & filters
- Shopping cart & checkout flow
- Order management & tracking
- Admin dashboard
- Payment integration (Stripe)

## Technical Stack

- **Backend**: Express + PostgreSQL + Redis
- **Frontend**: React + TypeScript + Tailwind
- **Testing**: Jest + Cypress
- **Quality**: 90%+ coverage, load tested for 1000+ concurrent users

## Swarm Configuration

- **Strategy**: development
- **Agents**: 8 agents
  - 2 backend-dev (API + database)
  - 2 coder (frontend components)
  - 2 tester (unit + integration)
  - 1 cicd-engineer (deployment)
  - 1 reviewer (security + quality)
- **Coordination**: hierarchical

## Success Criteria

- [ ] All user flows working end-to-end
- [ ] Payment processing operational (Stripe)
- [ ] 90%+ test coverage (unit + integration)
- [ ] Load tested for 1000 concurrent users
- [ ] Security audit passed
- [ ] Mobile-responsive design
```

**Execute**:

```bash
npx claude-flow hive-mind spawn "$(cat docs/prompts/e-commerce-platform.md)" \
  --namespace ecommerce \
  --claude
```

### Template Best Practices

1. **Be Specific** - "Implement JWT authentication with refresh tokens" not "add auth"
2. **Include Quality Metrics** - Always specify test coverage, performance requirements
3. **List Dependencies** - What APIs/services must be integrated?
4. **Define Success** - Measurable, testable outcomes only
5. **Choose Right Command** - Simple feature → `swarm`, Complex project → `hive-mind`

[↑ Back to TOC](#-table-of-contents)

---

## 🤖 Agent Types

### Development (8 agents)

`coder`, `backend-dev`, `frontend-dev`, `mobile-dev`, `ml-developer`, `sparc-coder`, `base-template-generator`, `cicd-engineer`

### Architecture & Design (4 agents)

`system-architect`, `code-analyzer`, `api-docs`, `specification`, `pseudocode`, `architecture`, `refinement`

### Testing & Quality (4 agents)

`tester`, `production-validator`, `tdd-london-swarm`, `reviewer`, `code-review-swarm`

### Coordination (8 agents)

`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `queen-coordinator`, `worker-specialist`, `scout-explorer`, `swarm-memory-manager`

### Consensus & Distributed (6 agents)

`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance (5 agents)

`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository (7 agents)

`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `repo-architect`, `multi-repo-swarm`

### Planning & Strategy (4 agents)

`planner`, `researcher`, `analyst`, `goal-planner`, `migration-planner`, `swarm-init`

**Total**: 54 specialized agents

[↑ Back to TOC](#-table-of-contents)

---

## 🔍 Troubleshooting

### Issue: `--claude` flag doesn't spawn agents

**Symptoms**: Command runs but no Claude Code instance opens

**Solutions**:

```bash
# 1. Verify Claude Code is installed
which claude
# Should show: /usr/local/bin/claude (or similar)

# 2. Check claude-flow version
npx claude-flow@alpha --version
# Should be v2.7.0-alpha.10+

# 3. Run with explicit npx
npx claude-flow@alpha swarm "task" --claude
```

---

### Issue: Agents not coordinating (working in isolation)

**Symptoms**: Agents duplicate work, don't share state, no memory entries

**Diagnosis**:

```bash
# Check if hooks are running
npx claude-flow hooks status

# Check memory database
sqlite3 .swarm/memory.db "SELECT COUNT(*) FROM memory_entries;"
# Should show entries > 0
```

**Solutions**:

1. ✅ Ensure you used `--claude` flag (sets up hooks infrastructure)
2. ✅ Verify agents are calling hooks manually via Bash:
   ```bash
   # Agents must execute these via Bash tool
   npx claude-flow hooks pre-task --description "my task"
   npx claude-flow hooks post-edit --file "path/to/file.js"
   npx claude-flow hooks post-task --task-id "task-123"
   ```
3. ✅ Check agent instructions include all 6 coordination steps (see [Agent Instruction Patterns](#agent-instruction-patterns))
4. ✅ Verify swarm initialization: `npx claude-flow swarm status`

---

### Issue: Memory queries return 0 results

**Symptoms**: `npx claude-flow memory query "pattern"` returns nothing

**Solutions**:

```bash
# 1. Check which backend is active
npx claude-flow memory status

# 2. Try semantic search (AgentDB - 96x faster)
npx claude-flow memory vector-search "pattern" --k 10

# 3. List all memories to verify storage
npx claude-flow memory list --namespace default

# 4. Check database directly
sqlite3 .swarm/memory.db "SELECT key, namespace FROM memory_entries LIMIT 10;"
```

[↑ Back to TOC](#-table-of-contents)

---

## 📈 Performance

### Claimed Benchmarks (Unable to Verify Independently)

The following performance metrics are **claimed by the project** but have **not been independently verified**:

- **84.8% SWE-Bench solve rate** - Claimed industry-leading problem-solving (unverified)
- **Note**: Independent testing attempts could not reproduce SWE-Bench results due to infrastructure limitations

### Verified Real-World Performance

The following metrics have been **confirmed through testing**:

- **32.3% token reduction** - Efficient context management via memory reuse ✅
- **2.8-4.4x speed improvement** - Parallel agent execution with `--parallel` flag ✅
- **96x faster vector search** - AgentDB vs traditional search (<0.1ms queries) ✅
- **90%+ pattern recognition** - Neural training accuracy after 100 epochs ✅

### AgentDB Performance Improvements (Verified)

- **Vector Search**: 96x faster (9.6ms → <0.1ms) ✅
- **Batch Operations**: 125x faster ✅
- **Large Queries**: 164x faster ✅
- **Memory Usage**: 4-32x reduction via quantization ✅

### Hook Execution Stats (7,927 operations analyzed)

- **Hook Latency**: 2-3ms average ✅
- **Memory Queries**: <100ms for 19K+ entries ✅
- **Neural Training**: 100 epochs on 7K entries in ~2 minutes ✅

[↑ Back to TOC](#-table-of-contents)

---

## 🎓 Best Practices

### For AI Assistants (Claude Code)

1. ✅ **Batch all operations** - TodoWrite + all Task calls in single message
2. ✅ **Include 6-step coordination protocol** - Every agent instruction needs hooks
3. ✅ **Show memory coordination** - Explain producer-consumer patterns
4. ✅ **Use concrete examples** - "Implement JWT auth" not "build authentication"
5. ✅ **Publish contracts to memory** - API contracts, schemas, decisions
6. ✅ **Publish architectural decisions** - API changes, file restructuring, technology choices

### For Humans

1. ✅ **Start with `swarm`** - Simple tasks first
2. ✅ **Upgrade to `hive-mind`** - When you need persistence
3. ✅ **Use namespaces** - Organize multi-feature projects
4. ✅ **Train neural patterns** - After successful completions
5. ✅ **Export memories** - Backup before major changes

### General Guidelines

- **One command per task** - Use templates + `--claude` flag
- **Let hooks run** - Don't disable automatic coordination
- **Check memory** - Query what the system learned
- **Monitor performance** - Use bottleneck detection
- **Resume sessions** - Don't restart multi-day projects from scratch

[↑ Back to TOC](#-table-of-contents)

---

## 🔧 Project Setup

### Adding to a New Project

1. **Copy the claude-flow folder**:

   ```bash
   cp -r docs/multi-agent/ /path/to/your-project/docs/multi-agent/
   ```

2. **Add to your CLAUDE.md**:

   ```markdown
   ## Multi-Agent Coordination

   ### When to Use Swarms

   Use multi-agent swarms for complex tasks requiring 3+ specialized agents.

   **Regular Swarm** (3-6 agents, fixed plan):

   - Well-defined tasks with clear dependencies
   - Use ./swarm-templates.md

   **Hive-Mind** (7+ agents, adaptive):

   - Complex tasks requiring runtime decisions
   - Queen coordinator spawns workers in phases
   - Use ./hive-mind-templates.md

   **For topology decisions, agent types, and command reference:**

   - See ./claude-flow-guide.md

   ### Two-Step Workflow

   **Step 1 - Generate Prompt:**
   ```

   Generate a swarm prompt for [OBJECTIVE] using ./swarm-templates.md

   ```

   **Step 2 - Review & Spawn:**
   ```

   Spawn this swarm using ./swarm-templates.md

   ```

   ```

3. **Install claude-flow** (if not already):
   ```bash
   npm install -g claude-flow@alpha
   npx claude-flow@alpha init --force
   ```

[↑ Back to TOC](#-table-of-contents)

---

## 🔬 Code Quality Evals

> **When to use:** After significant swarms to catch issues CI misses.
> **For workflow guidance:** See [workflow.md "Code Quality Analysis"](./workflow.md#code-quality-analysis-optional)

### What CI Misses

Traditional CI (TypeScript, tests, lint) validates syntax and functionality. Code Quality Evals catch:

| Category | What CI Catches | What Evals Catch |
|----------|-----------------|------------------|
| **Types** | Compilation errors | Type design quality, over-complexity |
| **Tests** | Pass/fail | Meaningful assertions vs line-hitting |
| **Coordination** | Nothing | Contract violations between agents |
| **Security** | Nothing (usually) | Hardcoded secrets, input validation gaps |
| **Maintainability** | Lint rules | Over-engineering, unclear naming |

### LLM + CI/CD Acceleration

Traditional error analysis requires reviewing 20+ outputs manually. LLM + CI/CD accelerates this:

```
Traditional (30+ min per swarm):
  Human reviews code diff manually
  Human reads through all files
  Human categorizes issues
  Human documents patterns

Accelerated (5 min per swarm):
  LLM analyzes: code diff + CI output + past patterns
  LLM produces: categorized findings with confidence
  Human validates: confirm/reject findings (5 min)
  Confirmed findings → new patterns
```

### Code Quality Analyzer Agent

Add this agent to significant swarms for automated quality analysis:

```javascript
Task('Code Quality Analyzer',
  `You are a code quality analyzer.

  INPUTS:
  1. Code diff (git diff from this swarm)
  2. CI output (TypeScript, test, lint results)
  3. Past patterns: npx claude-flow@alpha memory list --namespace "code-quality/failure-patterns"

  ANALYZE FOR:
  - Coordination issues (did agents honor contracts? type mismatches?)
  - Error handling (consistent patterns? meaningful messages?)
  - Security (secrets? validation? injection risks?)
  - Maintainability (over-engineering? unclear naming? magic numbers?)
  - Test quality (meaningful assertions? edge cases? mocking patterns?)

  OUTPUT FORMAT:
  {
    "findings": [
      {
        "category": "coordination|security|error-handling|maintainability|test-quality",
        "severity": "high|medium|low",
        "location": "file:line",
        "issue": "what's wrong",
        "suggestion": "how to fix",
        "confidence": 0.0-1.0
      }
    ],
    "summary": "Overall quality assessment",
    "recommended_patterns": ["patterns to capture from this analysis"]
  }

  RULES:
  - Only flag issues with confidence > 0.7
  - Reference past patterns when relevant
  - Don't duplicate what CI already caught
  `,
  'code-analyzer'
);
```

### Human Review Process (5 minutes)

After LLM analysis:

1. **Review high-confidence findings** (> 0.8) - usually accurate
2. **Validate medium-confidence** (0.7-0.8) - may need context
3. **Skip low-confidence** (< 0.7) - too noisy
4. **Confirm valid findings** → they become patterns
5. **Reject false positives** → improves future analysis

### Pattern Capture From Findings

```bash
# For each confirmed finding
npx claude-flow@alpha memory store \
  --namespace "code-quality/failure-patterns" \
  --key "$(date +%Y%m%d)-[category]-[brief-description]" \
  --value '{
    "category": "[from finding]",
    "pattern": "[generalized version of the issue]",
    "detection": "[how to detect this in future]",
    "prevention": "[how to prevent in prompts/templates]"
  }'
```

[↑ Back to TOC](#-table-of-contents)

---

## 🧠 Continuous Improvement

> **For workflow integration:** See [workflow.md "Continuous Improvement"](./workflow.md#continuous-improvement)

### Recording Outcomes

Every swarm generates learnings. Record outcomes automatically to enable:

- **Confidence accumulation** - Successful patterns gain confidence over time
- **Failure avoidance** - Failed approaches deprioritized in future queries
- **Configuration optimization** - Learn which agent types work best together

```bash
# After successful swarm completion
npx claude-flow@alpha memory feedback \
  --pattern "swarm/[PROJECT]/config" \
  --outcome success \
  --reasoningbank
# Confidence: 0.87 → 0.90 (+20% adjustment)

# After failed swarm
npx claude-flow@alpha memory feedback \
  --pattern "swarm/[PROJECT]/config" \
  --outcome failure \
  --reasoningbank
# Confidence: 0.87 → 0.74 (-15% adjustment)
```

### Weekly: Train Neural Patterns

After accumulating 10+ swarms, train the neural module:

```bash
# Export swarm history
npx claude-flow@alpha memory export swarm-history.json \
  --namespace "swarm/*" \
  --since "7d"

# Train coordination patterns
npx claude-flow@alpha neural train \
  --data ./swarm-history.json \
  --pattern_type "coordination"

# Verify training
npx claude-flow@alpha neural status
```

**What this enables:**
- Anomaly detection (flag unusual agent behavior)
- Complexity prediction (estimate swarm duration)
- Routing optimization (match tasks to best agent types)

### Monthly: Review Pattern Confidence

```bash
# List patterns by confidence
npx claude-flow@alpha memory list --namespace "patterns" --sort confidence

# Prune low-confidence patterns (optional)
npx claude-flow@alpha memory prune --confidence-below 0.3
```

### The Feedback Loop

```
Swarm produces code
    ↓
CI fails (or Code Quality Analyzer flags issues)
    ↓
Cleanup fixes issues
    ↓
Pattern captured: "What went wrong and why"
    ↓
Pattern informs future swarm prompts
    ↓
Next swarm has fewer issues
    ↓
Repeat → Continuous improvement
```

[↑ Back to TOC](#-table-of-contents)

---

## 📚 Additional Resources

### Skills System

Claude-Flow includes **25 specialized skills** that activate automatically via natural language:

```bash
# Just describe what you want - skills activate automatically
"Let's pair program"              → pair-programming skill
"Review this PR"                  → github-code-review skill
"Use vector search"               → agentdb-vector-search skill
"Create a swarm"                  → swarm-orchestration skill
```

📚 See `.claude/skills/` directory for complete documentation

### Community & Support

- **GitHub**: [Report issues or request features](https://github.com/ruvnet/claude-flow/issues)
- **Discord**: [Join Agentics Foundation](https://discord.com/invite/dfxmpwkG2D)
- **Documentation**: [Complete guides](https://github.com/ruvnet/claude-flow/wiki)
- **Examples**: [Real-world patterns](https://github.com/ruvnet/claude-flow/tree/main/examples)

### External Documentation Files

For deeper dives, see:

- **CLAUDE-CODE-SWARM-INTEGRATION.md** - Deprecated (content merged into this guide)
- **CLAUDE.md** - Project-specific configuration and rules
- `.claude/commands/` - Slash command documentation
- `.claude/skills/` - Skill capability details

[↑ Back to TOC](#-table-of-contents)

---

**Built with ❤️ for AI-Human collaboration**
**Claude-Flow v2.7.0-alpha.10** | **MIT License**
