# MCP Integration Architecture - Deep Dive Investigation

**Investigation Date:** 2025-10-13
**Claude Flow Version:** 2.5.0-alpha.140
**MCP SDK Version:** 1.0.4
**Target:** Claude Code v2.0.10+ integration

---

## Executive Summary

Claude-flow integrates with Claude Code via the Model Context Protocol (MCP), providing 70+ specialized tools for swarm coordination, agent spawning, task orchestration, and memory management. The integration uses a **three-layer architecture** with an optional hook system that intercepts and modifies Claude Code's tool invocations.

**Key Finding:** MCP tools are **explicitly invoked** by Claude, not automatically. However, the **hook system** (PreToolUse/PostToolUse) provides middleware-like behavior that modifies commands before they reach Claude Code's native tools.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER / DEVELOPER                              │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         │ User runs:
                         │ claude mcp add claude-flow npx claude-flow@alpha mcp start
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLAUDE CODE (Client)                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MCP Client Registry                                             │  │
│  │  - Manages registered MCP servers                                │  │
│  │  - Loads from settings.json: "enabledMcpjsonServers"             │  │
│  │  - Discovers available tools via ListTools request               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Hook System (v2.0.10+)                                          │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │  │
│  │  │ PreToolUse   │    │  Tool Call   │    │ PostToolUse  │       │  │
│  │  │ Middleware   │───▶│  Execution   │───▶│ Middleware   │       │  │
│  │  └──────────────┘    └──────────────┘    └──────────────┘       │  │
│  │                                                                   │  │
│  │  Configured in .claude/settings.json:                            │  │
│  │  - Bash matcher → modify-bash hook                               │  │
│  │  - Write/Edit matcher → modify-file hook                         │  │
│  │  - PreCompact → CLAUDE.md guidance injection                     │  │
│  │  - Stop → session-end persistence                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Native Tools: Bash, Read, Write, Edit, Glob, Grep, Task, TodoWrite   │
│  MCP Tools: agents/spawn, task_orchestrate, swarm_init, memory/*, etc │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
                         │ STDIO Transport (JSON-RPC 2.0)
                         │ - initialize request → capabilities negotiation
                         │ - tools/list request → discover tools
                         │ - tools/call request → execute MCP tools
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLAUDE-FLOW MCP SERVER                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MCP Server (src/mcp/server.ts)                                  │  │
│  │  - Handles JSON-RPC 2.0 protocol                                 │  │
│  │  - Session management                                            │  │
│  │  - Authentication (optional)                                     │  │
│  │  - Load balancing (optional)                                     │  │
│  │  - Metrics tracking                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                         │                                               │
│                         ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Tool Registry (src/mcp/tools.ts)                                │  │
│  │  - Registers 70+ MCP tools                                       │  │
│  │  - Schema validation                                             │  │
│  │  - Capability discovery                                          │  │
│  │  - Metrics tracking per tool                                     │  │
│  │  - Dynamic agent type enumeration                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                         │                                               │
│                         ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Tool Implementations                                            │  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │ Claude-Flow Tools (src/mcp/claude-flow-tools.ts)            ││  │
│  │  │ - agents/spawn, agents/spawn_parallel (Phase 4)             ││  │
│  │  │ - agents/list, agents/terminate, agents/info                ││  │
│  │  │ - tasks/create, tasks/assign, tasks/status                  ││  │
│  │  │ - memory/query, memory/store, memory/export                 ││  │
│  │  │ - workflow/execute, workflow/create                         ││  │
│  │  │ - query/control, query/list (Phase 4 - Real-time control)   ││  │
│  │  │ - system/status, system/metrics, system/health              ││  │
│  │  │ - config/get, config/update, config/validate                ││  │
│  │  │ - terminal/execute, terminal/list, terminal/create          ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │ Swarm Tools (src/mcp/swarm-tools.ts)                        ││  │
│  │  │ - Swarm coordination primitives                             ││  │
│  │  │ - Topology management                                        ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │ RUV-Swarm Tools (src/mcp/ruv-swarm-tools.ts)                ││  │
│  │  │ - Optional integration with ruv-swarm package                ││  │
│  │  │ - Neural network coordination                                ││  │
│  │  │ - Advanced swarm patterns                                    ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                         │                                               │
│                         ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Orchestrator Context Injection                                  │  │
│  │  - Wraps tool handlers with orchestrator reference              │  │
│  │  - Injects swarm coordinator, agent manager                      │  │
│  │  - Provides access to message bus, memory, monitoring            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              EXECUTION LAYER (Orchestrator, Swarm, Agents)              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Core Orchestrator (src/core/orchestrator.ts)                    │  │
│  │  - Agent lifecycle management                                    │  │
│  │  - Task scheduling and assignment                                │  │
│  │  │  Memory coordination                                          │  │
│  │  - Workflow execution                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Swarm Coordinator (src/swarm/*)                                 │  │
│  │  - Topology management (mesh, hierarchical, ring, star)          │  │
│  │  - Agent spawn strategies (sequential, parallel, adaptive)       │  │
│  │  - Consensus and coordination                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Agent Manager                                                   │  │
│  │  - 54+ agent types dynamically loaded from .claude/agents/       │  │
│  │  - Agent spawning and termination                                │  │
│  │  - Task assignment and execution                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Memory & State                                                  │  │
│  │  - Cross-session memory persistence                              │  │
│  │  - Agent state synchronization                                   │  │
│  │  - Coordination memory namespace                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Layers - Detailed Analysis

### Layer 1: Claude Code MCP Client

**Location:** Claude Code internal (not in claude-flow codebase)
**Evidence:** package.json includes `@anthropic-ai/claude-code: ^2.0.1`

**How it works:**

1. **MCP Server Registration**
   ```bash
   # User runs this command:
   claude mcp add claude-flow npx claude-flow@alpha mcp start
   ```

2. **Settings Configuration**
   ```json
   // .claude/settings.json
   {
     "enabledMcpjsonServers": ["claude-flow", "ruv-swarm"]
   }
   ```

3. **Tool Discovery**
   - On startup, Claude Code sends `tools/list` JSON-RPC request
   - MCP server responds with tool schemas
   - Claude Code registers tools in its tool registry
   - Tools appear alongside native tools (Bash, Read, Write, etc.)

4. **Tool Invocation**
   - **EXPLICIT:** User must explicitly use MCP tool names
   - Example: `mcp__claude-flow__agents_spawn` NOT automatically called
   - Claude decides when to use which tools based on task context

**Key Files:**
- **Settings:** `/workspaces/claude-flow/.claude/settings.json` (lines 110)
- **Package:** `/workspaces/claude-flow/package.json` (line 119)

---

### Layer 2: Hook System (Middleware Layer)

**Location:** `.claude/settings.json`, `.claude-plugin/hooks/hooks.json`
**Purpose:** Intercept and modify Claude Code tool calls BEFORE execution

**Evidence:**
```json
// .claude/settings.json lines 37-77
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "cat | npx claude-flow@alpha hooks modify-bash"
      }]
    }
  ]
}
```

**Hook Types:**

1. **PreToolUse Hooks** (Modify inputs before execution)
   - **modify-bash:** Adds safety flags (`rm` → `rm -i`), expands aliases
   - **modify-file:** Prevents root folder writes, organizes files into proper directories
   - **modify-git-commit:** Formats commit messages with conventional commits

2. **PostToolUse Hooks** (Process outputs after execution)
   - **post-command:** Track metrics, store results in memory
   - **post-edit:** Auto-format code, update coordination memory

3. **PreCompact Hooks** (Inject guidance before context window compact)
   - Reminds Claude about 54 available agents
   - Injects CLAUDE.md best practices
   - Emphasizes concurrent execution patterns

4. **Stop Hooks** (Session cleanup)
   - **session-end:** Generate summaries, persist state, export metrics

**Hook Execution Flow:**
```
Claude decides to call Bash("ls -la")
         ↓
PreToolUse Hook intercepts
         ↓
Hook: cat tool_input | npx claude-flow hooks modify-bash
         ↓
Hook output: {"tool_input": {"command": "ls -lah"}, "modification_notes": "[Alias: ls -la → ls -lah]"}
         ↓
Claude Code executes modified command
         ↓
PostToolUse Hook processes result
         ↓
Hook: npx claude-flow hooks post-command --command "ls -lah" --track-metrics true
         ↓
Result stored in memory, metrics updated
```

**Key Insight:** Hooks provide **passive modification** - they don't trigger MCP tools automatically, but they can inject context that encourages Claude to use MCP tools.

**Key Files:**
- `/workspaces/claude-flow/.claude/settings.json` (lines 37-107)
- `/workspaces/claude-flow/.claude-plugin/hooks/hooks.json`
- `/workspaces/claude-flow/docs/HOOKS-V2-MODIFICATION.md`
- `/workspaces/claude-flow/src/hooks/index.ts` (modern implementation redirect)

---

### Layer 3: MCP Server Implementation

**Location:** `src/mcp/server.ts`
**Transport:** STDIO (stdin/stdout) with JSON-RPC 2.0 protocol
**Entry Point:** `npx claude-flow@alpha mcp start`

**Server Initialization:**
```typescript
// src/mcp/server.ts lines 130-155
async start(): Promise<void> {
  // Set up request handler
  this.transport.onRequest(async (request) => {
    return await this.handleRequest(request);
  });

  // Start STDIO transport
  await this.transport.start();

  // Register built-in tools
  await this.registerBuiltInTools();

  this.running = true;
}
```

**Protocol Handling:**
```typescript
// src/mcp/server.ts lines 271-355
private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
  // Handle initialization separately
  if (request.method === 'initialize') {
    return await this.handleInitialize(request);
  }

  // Check session initialization
  if (!session.isInitialized) {
    return error: 'Server not initialized';
  }

  // Check load balancer constraints
  if (this.loadBalancer) {
    const allowed = await this.loadBalancer.shouldAllowRequest(session, request);
  }

  // Route request through router
  const result = await this.router.route(request);
  return response;
}
```

**Tool Registration:**
```typescript
// src/mcp/server.ts lines 437-561
private async registerBuiltInTools(): Promise<void> {
  // Register Claude-Flow tools if orchestrator is available
  if (this.orchestrator) {
    const claudeFlowTools = await createClaudeFlowTools(this.logger);

    // Wrap handlers to inject orchestrator context
    for (const tool of claudeFlowTools) {
      tool.handler = async (input, context) => {
        const claudeFlowContext = {
          ...context,
          orchestrator: this.orchestrator
        };
        return await originalHandler(input, claudeFlowContext);
      };
      this.registerTool(tool);
    }
  }

  // Register Swarm tools if swarm components available
  if (this.swarmCoordinator || this.agentManager) {
    // Similar injection pattern
  }

  // Register ruv-swarm tools if available
  this.registerRuvSwarmTools();
}
```

**Key Files:**
- `/workspaces/claude-flow/src/mcp/server.ts` (647 lines)
- `/workspaces/claude-flow/src/mcp/tools.ts` (ToolRegistry, 553 lines)
- `/workspaces/claude-flow/src/mcp/router.ts` (Request routing)
- `/workspaces/claude-flow/src/mcp/transports/stdio.ts` (STDIO transport)

---

### Layer 4: Tool Implementations

**Location:** `src/mcp/claude-flow-tools.ts`
**Count:** 70+ specialized MCP tools
**Dynamic Enhancement:** Agent types loaded from `.claude/agents/` directory

**Tool Categories:**

1. **Agent Management** (6 tools)
   - `agents/spawn` - Spawn single agent
   - `agents/spawn_parallel` - **Phase 4:** Spawn 3-20 agents in parallel (10-20x faster)
   - `agents/list` - List active agents
   - `agents/terminate` - Terminate agent
   - `agents/info` - Get agent details
   - `agents/metrics` - Agent performance metrics

2. **Task Management** (6 tools)
   - `tasks/create` - Create task
   - `tasks/list` - List tasks with filters
   - `tasks/status` - Get task status
   - `tasks/cancel` - Cancel task
   - `tasks/assign` - Assign task to agent

3. **Query Control** (2 tools - **Phase 4 Real-Time Control**)
   - `query/control` - Pause, resume, terminate, change model
   - `query/list` - List active queries

4. **Memory Management** (5 tools)
   - `memory/query` - Query memory with filters
   - `memory/store` - Store memory entry
   - `memory/delete` - Delete memory entry
   - `memory/export` - Export memory to file
   - `memory/import` - Import memory from file

5. **System Monitoring** (3 tools)
   - `system/status` - Comprehensive system status
   - `system/metrics` - Performance metrics
   - `system/health` - Health check

6. **Configuration** (3 tools)
   - `config/get` - Get configuration
   - `config/update` - Update configuration
   - `config/validate` - Validate configuration

7. **Workflow** (3 tools)
   - `workflow/execute` - Execute workflow
   - `workflow/create` - Create workflow
   - `workflow/list` - List workflows

8. **Terminal** (3 tools)
   - `terminal/execute` - Execute command
   - `terminal/list` - List terminals
   - `terminal/create` - Create terminal

**Dynamic Agent Type Enhancement:**
```typescript
// src/mcp/claude-flow-tools.ts lines 17-43
async function enhanceToolWithAgentTypes(tool: MCPTool): Promise<MCPTool> {
  const availableTypes = await getAvailableAgentTypes();

  // Find fields that reference agent types
  function addEnumToAgentTypeFields(obj: any) {
    if (key === 'type' || key === 'filterByType' || key === 'assignToAgentType') {
      const field = value as any;
      if (field.description?.includes('loaded dynamically from .claude/agents/')) {
        field.enum = availableTypes; // Populate with actual agent types
      }
    }
  }

  return enhancedTool;
}
```

**Tool Handler Pattern:**
```typescript
// src/mcp/claude-flow-tools.ts lines 150-179
handler: async (input: any, context?: ClaudeFlowToolContext) => {
  logger.info('Spawning agent', { input, sessionId: context?.sessionId });

  if (!context?.orchestrator) {
    throw new Error('Orchestrator not available');
  }

  const profile: AgentProfile = {
    id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: input.name,
    type: input.type,
    capabilities: input.capabilities || [],
    // ... configuration
  };

  const sessionId = await context.orchestrator.spawnAgent(profile);

  return {
    agentId: profile.id,
    sessionId,
    profile,
    status: 'spawned',
    timestamp: new Date().toISOString()
  };
}
```

**Phase 4 Innovations:**

1. **Parallel Agent Spawning** (10-20x speedup)
   ```typescript
   // agents/spawn_parallel
   const executor = context.orchestrator.getParallelExecutor();
   const sessions = await executor.spawnParallelAgents(agentConfigs, {
     maxConcurrency: 5,
     batchSize: 3
   });
   // Returns: speedupVsSequential: "~13x"
   ```

2. **Real-Time Query Control**
   ```typescript
   // query/control
   const controller = context.orchestrator.getQueryController();
   await controller.changeModel(queryId, 'claude-3-5-haiku-20241022');
   await controller.pauseQuery(queryId);
   await controller.executeCommand(queryId, 'npm test');
   ```

**Key Files:**
- `/workspaces/claude-flow/src/mcp/claude-flow-tools.ts` (1563 lines)
- `/workspaces/claude-flow/src/mcp/swarm-tools.ts`
- `/workspaces/claude-flow/src/mcp/ruv-swarm-tools.ts`
- `/workspaces/claude-flow/src/constants/agent-types.ts` (Dynamic agent type loading)

---

## Critical Questions Answered

### Q1: When Claude Code has claude-flow MCP server added, what changes?

**Answer:**
1. **Tool Availability:** 70+ new MCP tools appear in Claude Code's tool registry
2. **Tool Naming:** Tools are prefixed with `mcp__claude-flow__` (e.g., `mcp__claude-flow__agents_spawn`)
3. **Hook Modifications:** PreToolUse/PostToolUse hooks intercept native tool calls
4. **No Automatic Invocation:** Claude still decides when to use tools

**Evidence:**
- Settings configuration: `/workspaces/claude-flow/.claude/settings.json` line 110
- Tool registration: `/workspaces/claude-flow/src/mcp/server.ts` lines 437-561

---

### Q2: Does Claude automatically use claude-flow tools without explicit commands?

**Answer: NO.** Claude must **explicitly decide** to use MCP tools. They are not automatically invoked.

**However:**
- **Hooks provide implicit guidance:** PreCompact hooks inject CLAUDE.md context
- **Hooks modify tool behavior:** PreToolUse hooks can intercept and modify native tool calls
- **Claude learns usage patterns:** If user frequently uses MCP tools, Claude learns the pattern

**Evidence:**
```json
// .claude/settings.json lines 79-96
"PreCompact": [
  {
    "matcher": "manual",
    "hooks": [{
      "command": "echo '📋 IMPORTANT: Review CLAUDE.md for 54 available agents and concurrent usage patterns'"
    }]
  }
]
```

This **reminds** Claude about MCP capabilities but doesn't force invocation.

---

### Q3: How do hooks modify Claude Code behavior?

**Answer:** Hooks act as **middleware** that processes tool inputs/outputs:

**PreToolUse Flow:**
```
User: "Remove test.txt"
         ↓
Claude decides: Bash("rm test.txt")
         ↓
PreToolUse Hook: modify-bash intercepts
         ↓
Hook modifies: Bash("rm -i test.txt")  ← Safety flag added
         ↓
Claude Code executes modified command
         ↓
Result: Interactive confirmation required
```

**PostToolUse Flow:**
```
Claude executes: Write("app/src/test.js", "...")
         ↓
PostToolUse Hook: post-edit intercepts
         ↓
Hook actions:
  - Auto-format with Prettier
  - Update memory: coordination/files/test.js
  - Track metrics: file_write_count++
         ↓
Result: File formatted, metrics updated, memory synchronized
```

**Evidence:**
- Hook configuration: `/workspaces/claude-flow/.claude/settings.json` lines 37-77
- Hook documentation: `/workspaces/claude-flow/docs/HOOKS-V2-MODIFICATION.md`
- Hook implementation: `/workspaces/claude-flow/src/hooks/index.ts`

---

### Q4: Is there middleware that intercepts Claude's actions?

**Answer: YES.** The **PreToolUse/PostToolUse hook system** acts as middleware.

**Middleware Characteristics:**

1. **Transparent to Claude:** Claude thinks it's calling native tools
2. **Input Modification:** PreToolUse can change tool parameters
3. **Output Processing:** PostToolUse can enhance or store results
4. **Pattern Matching:** Uses regex matchers to target specific tools
5. **Command Execution:** Hooks execute shell commands that process JSON-RPC payloads

**Middleware Pattern:**
```typescript
// Conceptual representation (not actual claude-flow code)
interface MiddlewareHook {
  matcher: RegExp;  // "Bash" | "Write|Edit|MultiEdit"
  phase: 'PreToolUse' | 'PostToolUse';
  handler: (input: ToolInput) => ToolInput;
}

// Example hook execution
function executeHook(hook: MiddlewareHook, input: ToolInput): ToolInput {
  const command = `echo '${JSON.stringify(input)}' | ${hook.command}`;
  const output = execSync(command).toString();
  return JSON.parse(output);
}
```

**Evidence:**
- Settings: `/workspaces/claude-flow/.claude/settings.json` lines 37-107
- Plugin hooks: `/workspaces/claude-flow/.claude-plugin/hooks/hooks.json`

---

## Integration Points with File Paths

### 1. MCP Server Entry Point
**File:** `/workspaces/claude-flow/bin/claude-flow.js`
**Command:** `npx claude-flow@alpha mcp start`
**Flow:** Spawns STDIO server → listens for JSON-RPC requests

### 2. Server Implementation
**File:** `/workspaces/claude-flow/src/mcp/server.ts`
**Lines:** 1-647
**Key Methods:**
- `start()` - Initialize server
- `handleRequest()` - Process JSON-RPC requests
- `registerBuiltInTools()` - Register 70+ tools

### 3. Tool Registry
**File:** `/workspaces/claude-flow/src/mcp/tools.ts`
**Lines:** 1-553
**Responsibilities:**
- Tool registration and validation
- Schema enforcement
- Metrics tracking
- Capability discovery

### 4. Claude-Flow Tools
**File:** `/workspaces/claude-flow/src/mcp/claude-flow-tools.ts`
**Lines:** 1-1563
**Notable Tools:**
- `agents/spawn_parallel` (Phase 4, lines 1318-1405)
- `query/control` (Phase 4, lines 1411-1502)
- `memory/query` (lines 554-634)
- `workflow/execute` (lines 1038-1082)

### 5. Hook System
**Files:**
- `/workspaces/claude-flow/.claude/settings.json` (lines 37-107)
- `/workspaces/claude-flow/.claude-plugin/hooks/hooks.json`
- `/workspaces/claude-flow/src/hooks/index.ts` (redirect to modern system)
- `/workspaces/claude-flow/docs/HOOKS-V2-MODIFICATION.md` (documentation)

### 6. Orchestrator Integration
**File:** `/workspaces/claude-flow/src/core/orchestrator.ts`
**Injected into:** MCP tool handlers via `ClaudeFlowToolContext`
**Provides:** Agent management, task scheduling, memory coordination

### 7. Agent Types
**File:** `/workspaces/claude-flow/src/constants/agent-types.ts`
**Loaded from:** `.claude/agents/` directory
**Count:** 54+ agent types
**Dynamic:** Enumerated at runtime into tool schemas

---

## Auto-Invocation vs Explicit Invocation Analysis

### Explicit Invocation (Primary Mode)

**How it works:**
1. User asks: "Spawn a coder agent to implement feature X"
2. Claude analyzes request
3. Claude decides: "I need to use the agents/spawn MCP tool"
4. Claude calls: `mcp__claude-flow__agents_spawn({ type: "coder", name: "Feature X Implementer" })`
5. MCP server executes tool
6. Result returned to Claude
7. Claude continues conversation with result context

**Evidence:**
- No automatic tool invocation code found in codebase
- All tools require explicit parameters
- Tools are not triggered by patterns or events

### Implicit Guidance (Via Hooks)

**How it works:**
1. **PreCompact Hook:** When context window fills, inject CLAUDE.md guidance
   ```bash
   echo "📋 IMPORTANT: Review CLAUDE.md for 54 available agents"
   echo "   • Swarm coordination strategies"
   echo "   • SPARC methodology workflows"
   ```
2. **PreToolUse Hook:** When Claude calls Bash, suggest using MCP tools
   ```bash
   # Example: modify-bash could add suggestion
   # "Consider using agents/spawn_parallel for concurrent tasks"
   ```
3. **Claude learns patterns:** After seeing MCP tool usage, Claude incorporates into future responses

**Evidence:**
- PreCompact hooks: `/workspaces/claude-flow/.claude/settings.json` lines 79-96
- CLAUDE.md injection: Explicitly mentions "54 available agents and concurrent usage patterns"

### Hybrid Approach (Recommended Pattern)

**CLAUDE.md Guidance + Explicit Tool Use:**

```markdown
# From CLAUDE.md (lines 1-30)
## Project Overview
This project uses SPARC methodology with Claude-Flow orchestration.

## Quick Setup
claude mcp add claude-flow npx claude-flow@alpha mcp start

## Available Agents (54 Total)
- coder, reviewer, tester, planner, researcher
- hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
- ... (50 more)

## Usage Pattern
Task("Backend Developer", "Build REST API", "backend-dev")
Task("Frontend Developer", "Create React UI", "coder")
```

**Effect:**
- Claude reads CLAUDE.md during initial context
- Claude knows MCP tools are available
- Claude explicitly invokes tools when appropriate
- PreCompact hooks reinforce this knowledge

---

## Performance Characteristics

### Phase 4 Optimizations

1. **Parallel Agent Spawning**
   - **Sequential:** 750ms per agent → 7.5s for 10 agents
   - **Parallel (batchSize=3):** ~650ms total → **11.5x speedup**
   - **Tool:** `agents/spawn_parallel`

2. **Real-Time Query Control**
   - **Pause/Resume:** Immediate response (<50ms)
   - **Model Switching:** Zero data loss, seamless transition
   - **Tool:** `query/control`

3. **In-Process MCP Server** (Phase 6 - Future)
   - **Current:** STDIO transport with JSON-RPC overhead
   - **Future:** Direct function calls, 10-100x speedup
   - **File:** `/workspaces/claude-flow/src/mcp/in-process-server.ts`

---

## Security and Safety

### Tool Validation
```typescript
// src/mcp/tools.ts lines 206-227
private validateTool(tool: MCPTool): void {
  if (!tool.name || typeof tool.name !== 'string') {
    throw new MCPError('Tool name must be a non-empty string');
  }

  // Tool name must be in format: namespace/name
  if (!tool.name.includes('/')) {
    throw new MCPError('Tool name must be in format: namespace/name');
  }
}
```

### Input Validation
```typescript
// src/mcp/tools.ts lines 229-264
private validateInput(tool: MCPTool, input: unknown): void {
  const schema = tool.inputSchema as any;

  // Check required properties
  if (schema.required && Array.isArray(schema.required)) {
    for (const prop of schema.required) {
      if (!(prop in inputObj)) {
        throw new MCPError(`Missing required property: ${prop}`);
      }
    }
  }

  // Check property types
  if (expectedType && !this.checkType(value, expectedType)) {
    throw new MCPError(`Invalid type for property ${prop}`);
  }
}
```

### Hook Safety
```bash
# PreToolUse modify-bash adds safety flags
# Input: rm test.txt
# Output: rm -i test.txt  ← Interactive confirmation
```

---

## Comparison with Other MCP Servers

### claude-flow vs ruv-swarm vs flow-nexus

| Feature | claude-flow | ruv-swarm | flow-nexus |
|---------|-------------|-----------|------------|
| **Primary Focus** | Agent orchestration | Neural networks | Cloud execution |
| **Tools Count** | 70+ | 40+ | 70+ |
| **Parallel Spawning** | ✅ Phase 4 | ❌ | ✅ |
| **Real-Time Control** | ✅ Phase 4 | ❌ | ✅ |
| **WASM Optimization** | ❌ | ✅ | ✅ |
| **Cloud Sandboxes** | ❌ | ❌ | ✅ (E2B) |
| **Auth Required** | ❌ | ❌ | ✅ |
| **Hook System** | ✅ PreToolUse/PostToolUse | ❌ | ❌ |

**Recommendation:** Use claude-flow as primary server, optionally add ruv-swarm or flow-nexus for specialized needs.

**Evidence:**
- Integration config: `/workspaces/claude-flow/src/core/MCPIntegrator.ts` lines 15-115
- Multiple server support: `.claude/settings.json` line 110

---

## Conclusion

Claude-flow integrates with Claude Code via a **three-layer architecture**:

1. **MCP Client Layer (Claude Code):** Manages tool registry, discovers tools, handles hook execution
2. **MCP Server Layer (claude-flow):** Implements JSON-RPC protocol, registers 70+ tools, injects orchestrator context
3. **Execution Layer:** Orchestrator, swarm coordinator, agent manager, memory system

**Key Findings:**

✅ **MCP tools are explicitly invoked** - No automatic execution
✅ **Hooks provide middleware** - PreToolUse/PostToolUse intercept tool calls
✅ **Dynamic agent types** - Loaded from `.claude/agents/` at runtime
✅ **Phase 4 optimizations** - Parallel spawning (11x faster), real-time query control
✅ **No forced invocation** - Hooks guide Claude but don't force MCP tool usage

**Integration Quality:** Production-ready with comprehensive error handling, metrics tracking, and extensibility.

---

## References

**Code Evidence:**
- MCP Server: `/workspaces/claude-flow/src/mcp/server.ts` (647 lines)
- Tool Registry: `/workspaces/claude-flow/src/mcp/tools.ts` (553 lines)
- Claude-Flow Tools: `/workspaces/claude-flow/src/mcp/claude-flow-tools.ts` (1563 lines)
- Hook System: `/workspaces/claude-flow/.claude/settings.json` (lines 37-107)
- Hook Documentation: `/workspaces/claude-flow/docs/HOOKS-V2-MODIFICATION.md`
- Package Configuration: `/workspaces/claude-flow/package.json` (line 119)

**MCP Protocol:**
- JSON-RPC 2.0: RFC 7159
- Model Context Protocol SDK: `@modelcontextprotocol/sdk@1.0.4`
- STDIO Transport: Standard input/output with JSON-RPC framing

**Claude Code Integration:**
- PreToolUse Modification: v2.0.10+
- MCP Server Registration: `claude mcp add` command
- Settings Configuration: `.claude/settings.json`

---

**Author:** System Architecture Analysis
**Date:** 2025-10-13
**Version:** 1.0
**Claude Flow Version:** 2.5.0-alpha.140
