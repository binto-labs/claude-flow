# Claude Flow Practical Builder's Guide
## The Complete, Up-to-Date Guide for v2.5.0+ (January 2025)

**Last Updated**: January 2025
**Version**: 2.5.0-alpha.140+
**For**: Builders who want practical, working examples

---

## 🎯 What This Guide Is

This is a **practical, no-nonsense guide** for developers who want to use Claude Flow effectively with Claude Code. Everything here is based on the **current codebase** (v2.5.0-alpha.140), not outdated concepts.

**What you'll learn:**
- How Claude Flow actually works today (not theory)
- Working CLI commands you can copy-paste
- Real integration patterns with Claude Code
- Practical examples from actual usage
- Troubleshooting real problems

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
```bash
# You need:
- Node.js 20+
- Claude Code installed: npm install -g @anthropic-ai/claude-code
- That's it!
```

### Three Ways to Use Claude Flow

**1. As CLI Tool (Recommended - Direct Execution)**
```bash
# Use without installation
npx claude-flow@alpha <command>

# Or install globally
npm install -g claude-flow@alpha
claude-flow <command>

# Initialize project with hooks
npx claude-flow@alpha init --force
# This creates .claude-plugin/hooks/ with PreToolUse hooks that automatically:
# - Make rm commands safer (adds -i)
# - Organize files properly (tests → /tests/)
# - Format git commits with conventions
```

**2. As MCP Server (Advanced - 112 Orchestration Tools)**
```bash
# Add MCP server to Claude Code
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Optionally add ruv-swarm for advanced features
claude mcp add ruv-swarm npx ruv-swarm mcp start

# Now you can use MCP tools like:
mcp__claude-flow__swarm_init
mcp__claude-flow__memory_usage
mcp__claude-flow__agent_spawn
```

**3. As Claude Code Plugin (Experimental - Not Fully Supported)**
```bash
# NOTE: The /plugin add command is not yet fully supported by Claude Code
# See: docs/PLUGIN_SYSTEM_INVESTIGATION_REPORT.md for details
#
# For now, use Method 1 (CLI with npx claude-flow@alpha init) to get hooks
# The plugin infrastructure exists but requires manual setup via init command
```

---

## 💡 Core Concepts (What's Actually Implemented)

### 1. Claude Code Integration

Claude Flow is designed to **enhance Claude Code**, not replace it:

```
┌─────────────────┐
│   Claude Code   │  ← You work here
│  (Your editor)  │
└────────┬────────┘
         │
         ├── Plugin Mode: PreToolUse hooks modify commands automatically
         ├── MCP Mode: 112 orchestration tools available
         └── CLI Mode: Direct command execution

         ↓
┌─────────────────┐
│  Claude Flow    │  ← Provides coordination, memory, agents
│   (Background)  │
└─────────────────┘
```

### 2. PreToolUse Modification Hooks (The Killer Feature)

**What they do**: Automatically modify tool inputs BEFORE Claude Code executes them.

**Three hooks available:**

#### `modify-bash` - Safety & Productivity
```bash
# What Claude Code wants to run → What actually runs

rm test.txt                    → rm -i test.txt        # Safety
ll                            → ls -lah               # Alias
echo "secret" > api-keys.txt  → [BLOCKED - sensitive] # Security
```

#### `modify-file` - Organization
```bash
# What Claude Code wants → What actually happens

Write "test.js"                   → Write "src/test.js"           # Auto-organize
Write "temp-notes.md"             → Write "docs/working/temp.md"  # No root clutter
Write "auth.test.js"              → Write "tests/auth.test.js"    # Tests folder
```

#### `modify-git-commit` - Convention
```bash
# What you type → What gets committed

git commit -m "fix bug"  → git commit -m "[fix] fix bug\n\nCo-Authored-By: claude-flow <noreply@ruv.io>"
git commit -m "add feature" → git commit -m "[feat] add feature\n\nCo-Authored-By: claude-flow <noreply@ruv.io>"
```

**How to enable**: Initialize with CLI:
```bash
# Initialize project (creates hooks automatically)
npx claude-flow@alpha init --force

# Verify it's working:
ls -la .claude-plugin/hooks/hooks.json
```

### 3. MCP Tools (112 Total)

When you add the MCP server, you get access to 112 tools for orchestration:

**Core categories:**
- **Swarm Coordination** (12 tools): Initialize swarms, spawn agents, orchestrate tasks
- **Memory & Persistence** (12 tools): Store/retrieve data across sessions
- **Neural Networks** (15 tools): AI learning and pattern recognition
- **GitHub Integration** (8 tools): PR management, code review, releases
- **Analysis & Monitoring** (13 tools): Performance tracking, bottlenecks
- **Workflow & Automation** (11 tools): SPARC methodology, pipelines
- **System & Utilities** (8 tools): Config, backup, diagnostics
- **DAA (Dynamic Agents)** (8 tools): Adaptive agent architecture
- **Ruv-Swarm Advanced** (25 tools): Collective intelligence, consensus, prediction

**Example MCP usage in Claude Code:**
```javascript
// Initialize a swarm for complex task
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "auto"
})

// Store knowledge persistently
mcp__claude-flow__memory_usage({
  action: "store",
  key: "project/architecture",
  value: { pattern: "microservices", db: "postgres" },
  namespace: "my-project"
})

// Spawn specialized agent
mcp__claude-flow__agent_spawn({
  type: "backend-dev",
  name: "API-Builder",
  capabilities: ["nodejs", "database", "api-design"]
})
```

### 4. CLI Commands (Direct Control)

```bash
# Core commands that actually work:

# Initialize project
npx claude-flow@alpha init --force

# MCP server management
npx claude-flow@alpha mcp start
npx claude-flow@alpha mcp tools --list

# Hook management
npx claude-flow@alpha hooks modify-bash
npx claude-flow@alpha hooks modify-file
npx claude-flow@alpha hooks modify-git-commit

# Memory operations
npx claude-flow@alpha memory store <key> <value>
npx claude-flow@alpha memory retrieve <key>
npx claude-flow@alpha memory stats

# Health & diagnostics
npx claude-flow@alpha health
npx claude-flow@alpha version
```

---

## 📖 Practical Examples (Copy-Paste Ready)

### Example 1: File Organization (Plugin Mode)

**Without Claude Flow:**
```
your-project/
├── test.js ❌ (cluttered root)
├── notes.md ❌ (working file in root)
├── temp.py ❌ (temp file in root)
└── src/
```

**With Claude Flow Plugin:**
```
your-project/
├── src/
│   └── test.js ✅ (auto-organized)
├── docs/
│   └── working/
│       └── notes.md ✅ (auto-organized)
├── tmp/
│   └── temp.py ✅ (auto-organized)
└── tests/ ✅ (tests auto-routed)
```

**How**: Just install the plugin. It happens automatically.

### Example 2: Safe Commands (Plugin Mode)

```bash
# You type in Claude Code:
"Delete all test files"

# Without Claude Flow:
# → rm test*.txt  ⚠️ (dangerous, no confirmation)

# With Claude Flow:
# → rm -i test*.txt  ✅ (interactive confirmation)
```

### Example 3: Persistent Memory (MCP Mode)

**Scenario**: Building an API across multiple sessions

**Session 1 (Monday):**
```javascript
// Store architecture decisions
mcp__claude-flow__memory_usage({
  action: "store",
  key: "api/architecture",
  value: {
    pattern: "REST",
    auth: "JWT",
    database: "PostgreSQL",
    caching: "Redis"
  },
  namespace: "my-api-project",
  type: "knowledge"
})
```

**Session 2 (Tuesday):**
```javascript
// Retrieve previous decisions
mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "api/architecture",
  namespace: "my-api-project"
})

// Returns: { pattern: "REST", auth: "JWT", ... }
// ✅ Context preserved across sessions!
```

### Example 4: Multi-Agent Coordination (MCP Mode)

**Complex task**: "Build a complete REST API"

```javascript
// 1. Initialize swarm
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 6,
  strategy: "auto"
})

// 2. Spawn specialized agents
mcp__claude-flow__agent_spawn({ type: "backend-dev", name: "API-Lead" })
mcp__claude-flow__agent_spawn({ type: "coder", name: "Implementer" })
mcp__claude-flow__agent_spawn({ type: "tester", name: "QA" })
mcp__claude-flow__agent_spawn({ type: "reviewer", name: "CodeReviewer" })

// 3. Orchestrate task
mcp__claude-flow__task_orchestrate({
  task: "Build REST API with auth, CRUD operations, tests",
  strategy: "parallel",
  priority: 8
})

// 4. Monitor progress
mcp__claude-flow__swarm_status({ includeMetrics: true })
```

### Example 5: Git Workflow Enhancement (Plugin Mode)

```bash
# Normal flow:
git add .
git commit -m "fixed the auth bug"

# With Claude Flow plugin:
# Automatically becomes:
git commit -m "[fix] fixed the auth bug

Co-Authored-By: claude-flow <noreply@ruv.io>"

# ✅ Conventional commits + attribution
```

### Example 6: Truth Verification System (CLI Mode)

**Scenario**: Ensuring quality with automated verification

**The Philosophy**: "Truth is enforced, not assumed" - Every agent claim is verified with a 0.95 threshold.

**Three verification modes:**
```bash
# Production: Strict verification (95% accuracy)
npx claude-flow@alpha verify init strict

# Development: Moderate verification (85% accuracy)
npx claude-flow@alpha verify init moderate

# Testing: Lenient verification (75% accuracy)
npx claude-flow@alpha verify init development
```

**Basic verification workflow:**
```bash
# 1. Initialize verification system
npx claude-flow@alpha verify init moderate
# ✅ Verification system initialized in moderate mode
#    Threshold: 0.85
#    Auto-rollback: false
#    Consensus required: true

# 2. Verify a completed task
npx claude-flow@alpha verify verify task-123 --agent coder --success
# 🔍 Verifying task task-123 (Agent: coder)
#    ✅ compile: 1.00
#    ❌ test: 0.60
#    ✅ lint: 0.80
#    ✅ typecheck: 1.00
# 📊 Verification Score: 0.85/0.85
#    Status: ✅ PASSED

# 3. View truth scores and reliability
npx claude-flow@alpha truth
# 📊 Truth Scoring Report
# Mode: moderate
# Threshold: 0.85
# Total Verifications: 1
# Passed: 1
# Average Score: 0.850
# 🤖 Agent Reliability:
#    coder: 85.0%

# 4. Detailed agent analysis
npx claude-flow@alpha truth --agent coder --detailed
# Shows verification history, score distribution, performance trends

# 5. Generate comprehensive report
npx claude-flow@alpha truth --report --analyze
# Shows pass rates, failure patterns, recommendations
```

**Agent-specific verification requirements:**
```javascript
// Each agent type has custom verification checks:

coder: ['compile', 'test', 'lint', 'typecheck']
reviewer: ['code-analysis', 'security-scan', 'performance-check']
tester: ['unit-tests', 'integration-tests', 'coverage-check']
planner: ['task-decomposition', 'dependency-check', 'feasibility']
architect: ['design-validation', 'scalability-check', 'pattern-compliance']
```

**Advanced verification features:**
```bash
# Filter by threshold (find failing tasks)
npx claude-flow@alpha truth --threshold 0.9

# Export detailed report
npx claude-flow@alpha truth --export report.json

# Analyze failure patterns
npx claude-flow@alpha truth --analyze
# 🔍 Failure Pattern Analysis:
#    Failures by Agent:
#    • coder: 3 failures (60%)
#    • tester: 2 failures (40%)
#    Average Failure Score: 0.723
#    Score Gap to Threshold: 0.127
#    💡 Recommendations: ...

# JSON output for automation
npx claude-flow@alpha truth --json | jq '.averageScore'

# Check system status
npx claude-flow@alpha verify status
```

**Real-world use case:**
```bash
# Pair programming with verification
npx claude-flow@alpha pair --start
# 👥 Pair Programming with Verification
# 🎯 Verification-First Development Mode Activated
#    • All changes require verification
#    • Truth threshold: 0.95
#    • Real-time validation enabled
#    • Auto-rollback on failures
```

**Benefits:**
- **Accountability**: Every agent action is scored (0.0-1.0)
- **Quality Gates**: Automatic rollback below threshold
- **Trend Analysis**: Track improvement over time
- **Agent Reliability**: Identify which agents perform best
- **Failure Diagnosis**: Pattern analysis for common issues

**Verification storage:**
```
.swarm/verification-memory.json  ← All verification history
{
  "scores": [...],
  "history": [
    {
      "taskId": "task-123",
      "agentType": "coder",
      "score": 0.85,
      "passed": true,
      "timestamp": "2025-01-13T08:22:32.000Z",
      "results": {
        "compile": { "passed": true, "score": 1.0 },
        "test": { "passed": false, "score": 0.6 },
        "lint": { "passed": true, "score": 0.8 },
        "typecheck": { "passed": true, "score": 1.0 }
      }
    }
  ]
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Solo Developer on New Project

**Goal**: Build a Node.js API quickly with good practices

**Setup:**
```bash
# 1. Initialize project (includes hooks for auto-enhancement)
mkdir my-api && cd my-api
npx claude-flow@alpha init --force
npm init -y
```

**Development flow:**
```bash
# Work normally in Claude Code
# - Files auto-organize to src/
# - Tests auto-route to tests/
# - Commits auto-format
# - rm commands auto-safe

# That's it! The plugin handles organization.
```

### Use Case 2: Team Project with Persistent Context

**Goal**: Multiple developers, shared knowledge base

**Setup:**
```bash
# Add MCP server for memory features
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Initialize shared memory namespace
npx claude-flow@alpha init --project-name "team-project"
```

**Usage:**
```javascript
// Store team decisions
mcp__claude-flow__memory_usage({
  action: "store",
  key: "decisions/architecture",
  value: { /* architecture decisions */ },
  namespace: "team-project"
})

// Any team member can retrieve
mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "decisions/architecture",
  namespace: "team-project"
})
```

### Use Case 3: Complex Multi-Service Project

**Goal**: Microservices with coordinated development

**Use MCP mode with full orchestration:**
```javascript
// Initialize hierarchical swarm
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 12,
  strategy: "auto"
})

// Spawn service-specific agents
mcp__claude-flow__agent_spawn({
  type: "backend-dev",
  name: "UserService",
  capabilities: ["nodejs", "postgres", "auth"]
})

mcp__claude-flow__agent_spawn({
  type: "backend-dev",
  name: "PaymentService",
  capabilities: ["nodejs", "stripe", "transactions"]
})

// Orchestrate parallel development
mcp__claude-flow__task_orchestrate({
  task: "Build user-service and payment-service in parallel",
  strategy: "parallel"
})
```

### Use Case 4: Production-Grade Quality Assurance

**Goal**: Ensure code quality with automated verification

**Setup:**
```bash
# Initialize verification in strict mode for production
npx claude-flow@alpha verify init strict

# Configure quality gates
# - 95% accuracy threshold
# - Auto-rollback on failures
# - Consensus required from multiple checks
```

**Development flow:**
```bash
# Developer works on feature
# When task completes, verify:
npx claude-flow@alpha verify verify task-auth-feature --agent coder

# 🔍 Verifying task task-auth-feature (Agent: coder)
#    ✅ compile: 1.00
#    ✅ test: 0.95
#    ✅ lint: 1.00
#    ✅ typecheck: 1.00
# 📊 Verification Score: 0.98/0.95
#    Status: ✅ PASSED

# Track team quality over time
npx claude-flow@alpha truth --report --analyze

# Weekly quality review
npx claude-flow@alpha truth --export weekly-$(date +%Y%m%d).json

# Identify agents needing improvement
npx claude-flow@alpha truth --agent tester --detailed
```

**Benefits:**
- Consistent quality standards across team
- Automated rollback prevents bad code
- Historical tracking of quality trends
- Agent-specific performance metrics
- Data-driven improvement decisions

**Quality gates in CI/CD:**
```yaml
# .github/workflows/quality.yml
- name: Verify Quality
  run: |
    npx claude-flow@alpha verify verify ${{ github.sha }} --agent coder
    npx claude-flow@alpha truth --json > quality-report.json

- name: Check Quality Threshold
  run: |
    score=$(jq '.averageScore' quality-report.json)
    if (( $(echo "$score < 0.95" | bc -l) )); then
      echo "Quality below threshold: $score"
      exit 1
    fi
```

---

## 🛠️ Configuration

### Plugin Configuration (`.claude-plugin/hooks/hooks.json`)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "cat | npx claude-flow@alpha hooks modify-bash"
        }]
      },
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [{
          "type": "command",
          "command": "cat | npx claude-flow@alpha hooks modify-file"
        }]
      }
    ]
  }
}
```

### MCP Configuration

**In Claude Code settings:**
```json
{
  "mcpServers": {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"]
    },
    "ruv-swarm": {
      "command": "npx",
      "args": ["ruv-swarm", "mcp", "start"]
    }
  }
}
```

### Project Configuration (`.claude-flow/config.json`)

```json
{
  "version": "2.5.0",
  "project": {
    "name": "my-project",
    "namespace": "my-project"
  },
  "memory": {
    "backend": "sqlite",
    "path": ".swarm/memory.db",
    "compression": true
  },
  "orchestration": {
    "defaultTopology": "hierarchical",
    "maxAgents": 50,
    "autoScaling": true
  }
}
```

---

## 🔧 Troubleshooting

### Problem: Plugin Not Working

**Symptoms**: Files still going to root, rm not getting -i flag

**Solution**:
```bash
# 1. Check plugin is installed
ls -la .claude-plugin/

# 2. Verify hooks.json exists
cat .claude-plugin/hooks/hooks.json

# 3. Reinitialize if needed
npx claude-flow@alpha init --force
```

### Problem: MCP Tools Not Available

**Symptoms**: `mcp__claude-flow__*` tools don't work

**Solution**:
```bash
# 1. Check MCP server status
npx claude-flow@alpha mcp status

# 2. Restart MCP server
npx claude-flow@alpha mcp restart

# 3. Verify in Claude Code
# Type "mcp__" and check autocomplete
```

### Problem: Memory Not Persisting

**Symptoms**: Data disappears between sessions

**Solution**:
```bash
# 1. Check memory database exists
ls -la .swarm/memory.db

# 2. Verify memory stats
npx claude-flow@alpha memory stats

# 3. Check namespace
npx claude-flow@alpha memory list
```

### Problem: Slow Performance

**Symptoms**: Commands taking too long

**Solution**:
```bash
# 1. Check system health
npx claude-flow@alpha health

# 2. Reduce max agents
npx claude-flow@alpha config set orchestrator.maxConcurrentAgents 20

# 3. Enable caching
npx claude-flow@alpha config set memory.cacheSizeMB 512
```

### Problem: Verification Failing

**Symptoms**: Tasks consistently failing verification checks

**Solution**:
```bash
# 1. Check current verification mode
npx claude-flow@alpha verify status

# 2. View truth scores to identify issues
npx claude-flow@alpha truth --report --analyze

# 3. Check specific agent reliability
npx claude-flow@alpha truth --agent coder --detailed

# 4. Lower threshold for development
npx claude-flow@alpha verify init development  # 0.75 threshold

# 5. Review recent failures
npx claude-flow@alpha truth --threshold 0.85

# 6. Export report for deeper analysis
npx claude-flow@alpha truth --export verification-report.json
```

### Problem: Auto-Rollback Issues

**Symptoms**: Unexpected rollbacks happening

**Solution**:
```bash
# 1. Check verification mode (strict has auto-rollback)
npx claude-flow@alpha verify status

# 2. Switch to moderate mode (no auto-rollback)
npx claude-flow@alpha verify init moderate

# 3. View rollback history in truth report
npx claude-flow@alpha truth --report

# 4. Manually trigger rollback if needed
npx claude-flow@alpha verify rollback --checkpoint last
```

---

## 📚 Real-World Workflows

### Workflow: API Development

```bash
# Day 1: Setup and architecture
npx claude-flow@alpha init --force  # Creates hooks automatically

# Work in Claude Code:
# "Design a REST API for user management with auth"
# → Files auto-organize, commits auto-format

# Store architecture decisions
# Use MCP: mcp__claude-flow__memory_usage to store

# Day 2: Implementation
# "Implement the user service based on yesterday's design"
# → Memory retrieved automatically from namespace
# → Code goes to src/, tests to tests/

# Day 3: Testing and deployment
# "Create comprehensive tests and Docker setup"
# → All organized properly, git commits formatted
```

### Workflow: Multi-Developer Team

```bash
# Team lead setup:
claude mcp add claude-flow npx claude-flow@alpha mcp start
npx claude-flow@alpha init --project-name "team-project" --force

# Store team standards
mcp__claude-flow__memory_usage({
  action: "store",
  key: "standards/coding",
  value: { style: "airbnb", formatter: "prettier", tests: "jest" },
  namespace: "team-project"
})

# Each developer:
npx claude-flow@alpha init --force  # Setup hooks for auto-enforcement
# Standards automatically applied to all code

# Benefits:
# - Consistent file organization
# - Unified commit style
# - Shared knowledge base
# - Safe commands across team
```

### Workflow: Legacy Code Refactoring

```bash
# Setup
npx claude-flow@alpha init --force  # Creates hooks
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Analyze codebase
mcp__claude-flow__agent_spawn({
  type: "code-analyzer",
  name: "LegacyAnalyzer"
})

# Store findings in memory
mcp__claude-flow__memory_usage({
  action: "store",
  key: "refactor/analysis",
  value: { issues: [...], priorities: [...] },
  namespace: "refactor-project"
})

# Iterative refactoring
# Each session:
# 1. Retrieve previous progress
# 2. Refactor next module
# 3. Tests auto-organized
# 4. Git commits auto-formatted
# 5. Store new progress
```

---

## 🎓 Learning Path

### Beginner (Week 1)

**Goal**: Basic file organization and safety

1. Initialize hooks: `npx claude-flow@alpha init --force`
2. Build something small (API, app, whatever)
3. Notice files auto-organizing
4. Notice git commits auto-formatting
5. Notice rm commands getting safer

**Outcome**: Cleaner project structure without thinking about it

### Intermediate (Week 2-3)

**Goal**: Persistent memory across sessions

1. Add MCP server: `claude mcp add claude-flow ...`
2. Store architecture decisions in memory
3. Retrieve them in next session
4. Notice context preservation

**Outcome**: Multi-session project coherence

### Advanced (Week 4+)

**Goal**: Multi-agent orchestration

1. Learn swarm initialization
2. Spawn specialized agents
3. Orchestrate complex tasks
4. Monitor and optimize

**Outcome**: Coordinated development on complex projects

---

## 📊 Quick Reference

### Essential Commands

```bash
# Setup
npx claude-flow@alpha init --force  # Creates hooks
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Memory
npx claude-flow@alpha memory store <key> <value>
npx claude-flow@alpha memory retrieve <key>
npx claude-flow@alpha memory stats

# Verification & Truth
npx claude-flow@alpha verify init <mode>      # Initialize verification system
npx claude-flow@alpha verify verify <taskId>  # Verify specific task
npx claude-flow@alpha verify status           # Show verification status
npx claude-flow@alpha truth                   # View truth scores
npx claude-flow@alpha truth --report          # Detailed report
npx claude-flow@alpha truth --analyze         # Failure analysis
npx claude-flow@alpha pair --start            # Pair programming with verification

# Health
npx claude-flow@alpha health
npx claude-flow@alpha version

# MCP
npx claude-flow@alpha mcp start
npx claude-flow@alpha mcp tools --list
```

### Essential MCP Tools

```javascript
// Swarm
mcp__claude-flow__swarm_init({ topology, maxAgents })
mcp__claude-flow__agent_spawn({ type, name, capabilities })
mcp__claude-flow__task_orchestrate({ task, strategy })

// Memory
mcp__claude-flow__memory_usage({ action, key, value, namespace })
mcp__claude-flow__memory_search({ pattern, namespace })

// Monitoring
mcp__claude-flow__swarm_status({ includeMetrics })
mcp__claude-flow__performance_report({ timeframe })
```

### File Organization Rules (Plugin)

```
test*.* → tests/
*.test.* → tests/
*.spec.* → tests/
src/** → src/ (preserved)
*.md (working) → docs/working/
*.tmp, *.temp → tmp/
```

---

## 🚀 What's Next?

### Immediate Next Steps

1. **Install the plugin** - Get auto-organization working today
2. **Try one MCP command** - Store something in memory
3. **Build something real** - Let the tools help you

### Going Deeper

- **MCP Tools Reference**: `/workspaces/claude-flow/docs/reference/MCP_TOOLS.md`
- **Agent Reference**: `/workspaces/claude-flow/docs/reference/AGENTS.md`
- **Examples**: `/workspaces/claude-flow/examples/`
- **GitHub**: https://github.com/ruvnet/claude-flow

### Community

- **Issues**: https://github.com/ruvnet/claude-flow/issues
- **Discord**: (Check README for latest link)

---

## 🎯 Key Takeaways

1. **Start Simple**: Install plugin, get auto-organization
2. **Add Memory**: Use MCP for persistent context
3. **Scale Up**: Use multi-agent for complex projects
4. **Stay Practical**: Use what you need, ignore what you don't

**Remember**: Claude Flow enhances Claude Code, not replaces it. Start with the plugin, add features as you need them.

---

**Version**: 2.5.0-alpha.140
**Last Updated**: January 2025
**Maintained by**: Claude Flow Community

**This guide focuses on what actually works today, not theoretical features.**
