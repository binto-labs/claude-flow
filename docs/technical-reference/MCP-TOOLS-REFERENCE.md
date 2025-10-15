# Claude-Flow MCP Tool Ecosystem: Technical Reference

**Version:** v2.5.0-alpha.140
**Last Updated:** 2025-10-15
**Audience:** Developers, architects, MCP server operators

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Architecture](#mcp-architecture)
3. [Server Comparison](#server-comparison)
4. [Tool Catalog](#tool-catalog)
5. [Tool Categories](#tool-categories)
6. [Usage Patterns](#usage-patterns)
7. [Custom Tool Creation](#custom-tool-creation)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Claude-Flow implements the **Model Context Protocol (MCP)** to provide a standardized interface for Claude AI to interact with swarm orchestration, agent management, neural capabilities, and workflow automation. The ecosystem consists of **3 MCP servers** providing **112+ specialized tools** across 15 functional categories.

### Key Design Principles

1. **Protocol Standardization**: All tools follow MCP 2024-11-05 specification
2. **Zero IPC Overhead**: In-process execution mode (10-100x faster than stdio)
3. **Dynamic Tool Discovery**: Runtime capability negotiation
4. **Graceful Degradation**: Fallback mechanisms when services unavailable
5. **Performance Monitoring**: Built-in metrics and bottleneck detection

---

## MCP Architecture

### Dual-Execution Model

**File:** `src/mcp/sdk-integration.ts:1-450`

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude AI Agent                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
            ┌──────────▼─────────┐
            │  SDK Integration   │  ← Phase 6: In-Process Mode
            │  (Query Handler)   │
            └──────┬───────┬─────┘
                   │       │
     ┌─────────────▼───┐   │
     │ In-Process MCP  │   │ (10-100x faster)
     │ Server (Phase 6)│   │
     └─────────┬───────┘   │
               │           │
     ┌─────────▼───────┐   │
     │ stdio/HTTP MCP  │◄──┘ (Fallback)
     │ Server          │
     └─────────┬───────┘
               │
     ┌─────────▼────────────────────────────────┐
     │  Claude-Flow MCP Tools (28 tools)        │
     │  - agents/spawn, agents/list             │
     │  - tasks/create, tasks/status            │
     │  - memory/query, memory/store            │
     │  - system/status, system/metrics         │
     └──────────────────────────────────────────┘
```

### Server Architecture Layers

**File:** `src/mcp/server.ts:59-646`

```javascript
export class MCPServer implements IMCPServer {
  private transport: ITransport;          // stdio or HTTP
  private toolRegistry: ToolRegistry;     // Tool discovery
  private router: RequestRouter;          // Request routing
  private sessionManager: ISessionManager;// Session tracking
  private authManager: IAuthManager;      // Authentication
  private loadBalancer?: ILoadBalancer;   // Rate limiting

  // Component references
  private orchestrator?: any;             // Agent orchestration
  private swarmCoordinator?: any;         // Swarm coordination
  private agentManager?: any;             // Agent lifecycle
  private resourceManager?: any;          // Resource allocation
  private messagebus?: any;               // Inter-agent messaging
  private monitor?: any;                  // Real-time monitoring
}
```

**Key features:**
- **Transport abstraction:** stdio (development) or HTTP (production)
- **Session management:** Persistent sessions with timeout
- **Load balancing:** Rate limiting and circuit breakers
- **Component injection:** Dynamic tool registration based on available services

---

## Server Comparison

### 1. Claude-Flow MCP Server (Core)

**Package:** `claude-flow@alpha`
**Install:** `claude mcp add claude-flow npx claude-flow@alpha mcp start`
**Tools:** 28 core tools
**Source:** `src/mcp/claude-flow-tools.ts:48-1564`

**Primary Categories:**
- **Agent Management** (5 tools): spawn, spawn_parallel, list, terminate, info
- **Task Orchestration** (5 tools): create, list, status, cancel, assign
- **Memory Operations** (5 tools): query, store, delete, export, import
- **System Monitoring** (3 tools): status, metrics, health
- **Configuration** (3 tools): get, update, validate
- **Workflows** (3 tools): execute, create, list
- **Terminal Management** (3 tools): execute, list, create
- **Query Control** (2 tools): control, list

**Unique Features:**
- **agents/spawn_parallel:** 10-20x faster multi-agent spawning
- **query/control:** Real-time model switching and permission changes
- **In-process execution:** Microsecond latency via SDK integration

**Usage:**
```javascript
// Spawn multiple agents in parallel
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "researcher", name: "Research Agent", priority: "high" },
    { type: "coder", name: "Backend Dev", priority: "high" },
    { type: "tester", name: "QA Engineer", priority: "medium" }
  ],
  maxConcurrency: 3
});
// Result: 3 agents spawned in ~150ms vs 750ms sequential (5x faster)
```

---

### 2. ruv-swarm MCP Server (Enhanced Coordination)

**Package:** `ruv-swarm`
**Install:** `claude mcp add ruv-swarm npx ruv-swarm mcp start`
**Tools:** 17 advanced tools
**Source:** `src/mcp/ruv-swarm-tools.ts:113-568`

**Primary Categories:**
- **Swarm Lifecycle** (3 tools): swarm_init, swarm_status, swarm_monitor
- **Agent Management** (3 tools): agent_spawn, agent_list, agent_metrics
- **Task Orchestration** (3 tools): task_orchestrate, task_status, task_results
- **Neural Capabilities** (3 tools): neural_status, neural_train, neural_patterns
- **Performance** (3 tools): benchmark_run, features_detect, memory_usage
- **DAA Integration** (2 tools): daa_init, daa_workflow_execute

**Unique Features:**
- **WASM acceleration:** SIMD-optimized neural training
- **Neural patterns:** 7 cognitive thinking patterns
- **Byzantine consensus:** Fault-tolerant agent coordination
- **Real-time monitoring:** Live swarm activity streaming

**Usage:**
```javascript
// Initialize neural-enabled swarm
mcp__ruv-swarm__swarm_init({
  topology: "mesh",
  maxAgents: 8,
  strategy: "adaptive"
});

// Train neural patterns
mcp__ruv-swarm__neural_train({
  agentId: "neural-agent-1",
  iterations: 50
});
```

---

### 3. flow-nexus MCP Server (Cloud Platform)

**Package:** `flow-nexus@latest`
**Install:** `claude mcp add flow-nexus npx flow-nexus@latest mcp start`
**Tools:** 67+ cloud tools
**Requires:** Registration at https://flow-nexus.ruv.io
**Source:** External package

**Primary Categories:**
- **Swarm & Agents** (8 tools): swarm_init, swarm_scale, agent_spawn, task_orchestrate
- **Sandboxes** (7 tools): sandbox_create, sandbox_execute, sandbox_configure
- **Templates** (4 tools): template_list, template_get, template_deploy
- **Neural AI** (10 tools): neural_train, neural_predict, neural_cluster_init
- **GitHub Integration** (6 tools): github_repo_analyze, github_pr_manage
- **Real-time** (3 tools): execution_stream_subscribe, realtime_subscribe
- **Storage** (4 tools): storage_upload, storage_list, storage_get_url
- **Payments** (4 tools): check_balance, create_payment_link, configure_auto_refill
- **User Management** (8 tools): user_register, user_login, user_upgrade
- **Challenges** (4 tools): challenges_list, challenge_submit, leaderboard_get
- **App Store** (4 tools): app_store_list_templates, app_store_publish_app
- **Queen Seraphina** (1 tool): seraphina_chat (AI assistant)

**Unique Features:**
- **E2B sandboxes:** Cloud-based isolated code execution
- **Distributed neural networks:** Multi-sandbox neural training
- **GitHub automation:** PR review and issue triage swarms
- **Real-time streaming:** Live execution monitoring
- **Marketplace:** Template publishing and monetization

**Usage:**
```javascript
// Create cloud sandbox with environment variables
mcp__flow-nexus__sandbox_create({
  template: "claude-code",
  env_vars: {
    ANTHROPIC_API_KEY: "sk-ant-xxx"
  }
});

// Deploy distributed neural cluster
mcp__flow-nexus__neural_cluster_init({
  name: "prod-neural-cluster",
  topology: "mesh",
  daaEnabled: true,
  wasmOptimization: true
});
```

---

## Tool Catalog

### Complete Tool List (112 Total)

#### Claude-Flow Server (28 tools)

**File:** `src/mcp/claude-flow-tools.ts`

```typescript
// AGENT MANAGEMENT (5 tools)
agents/spawn                    // Spawn single agent
agents/spawn_parallel           // Spawn multiple agents in parallel (10-20x faster)
agents/list                     // List active agents with filtering
agents/terminate                // Gracefully terminate agent
agents/info                     // Get detailed agent information

// QUERY CONTROL (2 tools) - Phase 6
query/control                   // Pause/resume/terminate queries, change model
query/list                      // List active queries with status

// TASK ORCHESTRATION (5 tools)
tasks/create                    // Create new task with dependencies
tasks/list                      // List tasks with filtering
tasks/status                    // Get task execution status
tasks/cancel                    // Cancel pending/running task
tasks/assign                    // Assign task to specific agent

// MEMORY OPERATIONS (5 tools)
memory/query                    // Query memory with filters and search
memory/store                    // Store new memory entry
memory/delete                   // Delete memory entry by ID
memory/export                   // Export memories to JSON/CSV/Markdown
memory/import                   // Import memories from file

// SYSTEM MONITORING (3 tools)
system/status                   // Comprehensive system health status
system/metrics                  // Performance metrics (1h/6h/24h/7d)
system/health                   // Deep health check with component tests

// CONFIGURATION (3 tools)
config/get                      // Get current system configuration
config/update                   // Update configuration with optional restart
config/validate                 // Validate configuration object

// WORKFLOWS (3 tools)
workflow/execute                // Execute workflow from file or definition
workflow/create                 // Create new workflow definition
workflow/list                   // List available workflows

// TERMINAL MANAGEMENT (3 tools)
terminal/execute                // Execute command in terminal session
terminal/list                   // List all terminal sessions
terminal/create                 // Create new terminal session
```

#### ruv-swarm Server (17 tools)

**File:** `src/mcp/ruv-swarm-tools.ts`

```typescript
// SWARM LIFECYCLE (3 tools)
mcp__ruv-swarm__swarm_init              // Initialize swarm with topology
mcp__ruv-swarm__swarm_status            // Get swarm status and agent info
mcp__ruv-swarm__swarm_monitor           // Real-time swarm activity monitoring

// AGENT MANAGEMENT (3 tools)
mcp__ruv-swarm__agent_spawn             // Spawn agent with type/capabilities
mcp__ruv-swarm__agent_list              // List agents with status filtering
mcp__ruv-swarm__agent_metrics           // Get agent performance metrics

// TASK ORCHESTRATION (3 tools)
mcp__ruv-swarm__task_orchestrate        // Orchestrate task across swarm
mcp__ruv-swarm__task_status             // Check task progress
mcp__ruv-swarm__task_results            // Retrieve task results

// NEURAL CAPABILITIES (3 tools)
mcp__ruv-swarm__neural_status           // Neural agent status/metrics
mcp__ruv-swarm__neural_train            // Train neural agents
mcp__ruv-swarm__neural_patterns         // Get cognitive pattern info

// PERFORMANCE (3 tools)
mcp__ruv-swarm__benchmark_run           // Execute performance benchmarks
mcp__ruv-swarm__features_detect         // Detect runtime capabilities
mcp__ruv-swarm__memory_usage            // Get memory statistics

// DAA (2 tools)
mcp__ruv-swarm__daa_init                // Initialize DAA service
mcp__ruv-swarm__daa_workflow_execute    // Execute DAA workflow
```

#### flow-nexus Server (67 tools)

**Note:** Full catalog available at https://flow-nexus.ruv.io/docs/mcp-tools

**Key Categories:**
- Swarm & Agents (8 tools)
- Sandboxes (7 tools)
- Neural AI (10 tools)
- GitHub Integration (6 tools)
- Storage & Real-time (7 tools)
- User Management (8 tools)
- Challenges & Gamification (4 tools)
- App Store & Templates (8 tools)
- Payments & Credits (4 tools)
- Seraphina AI Assistant (1 tool)
- System Utilities (4 tools)

---

## Tool Categories

### 1. Agent Management

**Purpose:** Spawn, monitor, and manage autonomous AI agents

**Core Operations:**
```javascript
// Sequential spawning (SLOW)
for (const type of ["researcher", "coder", "tester"]) {
  await agents.spawn({ type });
}
// Time: ~750ms for 3 agents

// Parallel spawning (FAST) - Phase 6
await agents.spawn_parallel({
  agents: [
    { type: "researcher", name: "Research Agent" },
    { type: "coder", name: "Backend Dev" },
    { type: "tester", name: "QA Engineer" }
  ],
  maxConcurrency: 3
});
// Time: ~150ms for 3 agents (5x faster)
```

**File References:**
- **spawn:** `src/mcp/claude-flow-tools.ts:104-180`
- **spawn_parallel:** `src/mcp/claude-flow-tools.ts:1318-1405`
- **list:** `src/mcp/claude-flow-tools.ts:182-227`
- **terminate:** `src/mcp/claude-flow-tools.ts:229-272`
- **info:** `src/mcp/claude-flow-tools.ts:274-307`

**Performance:**
- Single agent spawn: ~250ms
- Parallel spawn (5 agents): ~150ms total (16x faster than sequential)
- Agent listing: <10ms (cached)

---

### 2. Task Orchestration

**Purpose:** Manage task lifecycle with dependencies and priorities

**Dependency Graph:**
```javascript
// Create task with dependencies
await tasks.create({
  type: "integration_test",
  description: "Run integration tests",
  dependencies: ["build-backend", "build-frontend"],
  priority: 8,
  assignToAgentType: "tester"
});

// System automatically waits for dependencies
```

**File References:**
- **create:** `src/mcp/claude-flow-tools.ts:309-387`
- **list:** `src/mcp/claude-flow-tools.ts:389-443`
- **status:** `src/mcp/claude-flow-tools.ts:445-478`
- **cancel:** `src/mcp/claude-flow-tools.ts:480-515`
- **assign:** `src/mcp/claude-flow-tools.ts:517-552`

**Status Flow:**
```
pending → queued → assigned → running → completed
                                     → failed
                                     → cancelled
```

---

### 3. Memory Operations

**Purpose:** Persistent cross-session memory with versioning

**Memory Types:**
- **observation:** Raw sensor data (TTL: 1 hour)
- **insight:** Analyzed patterns (permanent)
- **decision:** Architectural choices (permanent)
- **artifact:** Code/documents (permanent)
- **error:** Error logs (TTL: 24 hours)

**Usage:**
```javascript
// Store architectural decision
await memory.store({
  agentId: "architect-1",
  sessionId: "session-abc",
  type: "decision",
  content: "Use PostgreSQL for ACID compliance",
  tags: ["database", "architecture"],
  context: {
    alternativesConsidered: ["MongoDB", "MySQL"],
    reasoning: "Strong relational integrity required"
  }
});

// Query with full-text search
const results = await memory.query({
  search: "database architecture",
  type: "decision",
  tags: ["architecture"],
  limit: 10
});
```

**File References:**
- **query:** `src/mcp/claude-flow-tools.ts:554-634`
- **store:** `src/mcp/claude-flow-tools.ts:636-704`
- **delete:** `src/mcp/claude-flow-tools.ts:706-736`
- **export:** `src/mcp/claude-flow-tools.ts:738-792`
- **import:** `src/mcp/claude-flow-tools.ts:794-839`

---

### 4. Neural Capabilities

**Purpose:** WASM-accelerated neural pattern training

**Cognitive Patterns:**
```javascript
// Train convergent thinking pattern (problem-solving)
await neural.train({
  agentId: "neural-agent-1",
  pattern: "convergent",
  iterations: 50
});

// Available patterns:
// - convergent:  Problem-solving, optimization
// - divergent:   Creative brainstorming
// - lateral:     Innovative connections
// - systems:     Holistic system thinking
// - critical:    Analysis and evaluation
// - abstract:    Pattern recognition
```

**File References:**
- **neural_status:** `src/mcp/ruv-swarm-tools.ts:440-460`
- **neural_train:** `src/mcp/ruv-swarm-tools.ts:462-492`
- **neural_patterns:** `src/mcp/ruv-swarm-tools.ts:494-512`

**Performance:**
- WASM SIMD enabled: 3-5x faster than JavaScript
- Training 50 iterations: ~2-3 seconds
- Pattern inference: <10ms

---

### 5. Workflow Automation

**Purpose:** Event-driven task automation

**Example: CI/CD Pipeline**
```javascript
await workflow.create({
  name: "Full CI/CD Pipeline",
  description: "Build, test, and deploy application",
  tasks: [
    {
      id: "lint",
      type: "code_quality",
      description: "Run ESLint and Prettier",
      dependencies: []
    },
    {
      id: "unit-test",
      type: "testing",
      description: "Run unit tests with Jest",
      dependencies: ["lint"]
    },
    {
      id: "build",
      type: "compilation",
      description: "Build production bundle",
      dependencies: ["unit-test"]
    },
    {
      id: "integration-test",
      type: "testing",
      description: "Run integration tests",
      dependencies: ["build"]
    },
    {
      id: "deploy",
      type: "deployment",
      description: "Deploy to production",
      dependencies: ["integration-test"]
    }
  ]
});
```

**File References:**
- **workflow_create:** `src/mcp/implementations/workflow-tools.js:15-35`
- **workflow_execute:** `src/mcp/implementations/workflow-tools.js:38-78`
- **parallel_execute:** `src/mcp/implementations/workflow-tools.js:80-121`
- **batch_process:** `src/mcp/implementations/workflow-tools.js:123-172`

---

### 6. DAA (Decentralized Autonomous Agents)

**Purpose:** Self-organizing agent coordination without central control

**Capability Matching:**
```javascript
// Create DAA agents with specific capabilities
await daa.agent_create({
  agent_type: "ml_specialist",
  capabilities: ["pytorch", "tensorflow", "scikit-learn"],
  resources: { cpu: 4, memory: 8192, gpu: 1 }
});

// Match agents to task requirements
const matches = await daa.capability_match({
  task_requirements: ["pytorch", "computer_vision"],
  available_agents: ["agent-1", "agent-2", "agent-3"]
});
// Returns: Ranked list by capability score
```

**Consensus Voting:**
```javascript
// Byzantine-tolerant consensus
const consensus = await daa.consensus({
  agents: ["agent-1", "agent-2", "agent-3", "agent-4", "agent-5"],
  proposal: {
    decision: "Use microservices architecture",
    reasoning: "Better scalability and fault isolation"
  }
});
// Result: { approved: true, votes: { agent-1: true, agent-2: true, ... }}
```

**File References:**
- **daa_agent_create:** `src/mcp/implementations/daa-tools.js:26-58`
- **daa_capability_match:** `src/mcp/implementations/daa-tools.js:60-98`
- **daa_resource_alloc:** `src/mcp/implementations/daa-tools.js:100-144`
- **daa_lifecycle_manage:** `src/mcp/implementations/daa-tools.js:146-201`
- **daa_communication:** `src/mcp/implementations/daa-tools.js:204-259`
- **daa_consensus:** `src/mcp/implementations/daa-tools.js:261-310`

---

## Usage Patterns

### Pattern 1: Parallel Multi-Agent System

**Goal:** Spawn 5 specialized agents concurrently

```javascript
// ❌ WRONG: Sequential spawning (slow)
const agents = [];
for (const type of ["researcher", "architect", "coder", "tester", "reviewer"]) {
  const agent = await claudeFlow.agents.spawn({ type, name: `${type}-1` });
  agents.push(agent);
}
// Time: ~1250ms (5 × 250ms)

// ✅ CORRECT: Parallel spawning (fast)
const result = await claudeFlow.agents.spawn_parallel({
  agents: [
    { type: "researcher", name: "Research Lead", priority: "high" },
    { type: "architect", name: "System Architect", priority: "high" },
    { type: "coder", name: "Backend Dev", priority: "high" },
    { type: "tester", name: "QA Engineer", priority: "medium" },
    { type: "reviewer", name: "Code Reviewer", priority: "medium" }
  ],
  maxConcurrency: 5,
  batchSize: 3
});
// Time: ~180ms (7x faster)
```

---

### Pattern 2: Memory-Coordinated Workflow

**Goal:** Agents share decisions via memory

```javascript
// Architect stores decision
await memory.store({
  agentId: "architect-1",
  sessionId: "project-alpha",
  type: "decision",
  content: "REST API design: /api/v1/resources pattern",
  tags: ["api", "architecture", "rest"],
  context: {
    endpoints: ["/users", "/posts", "/comments"],
    authentication: "JWT"
  }
});

// Coder retrieves architectural decisions
const archDecisions = await memory.query({
  search: "API architecture",
  type: "decision",
  tags: ["api", "architecture"],
  limit: 10
});

// Coder implements based on decisions
for (const decision of archDecisions.entries) {
  console.log(`Implementing: ${decision.content}`);
  // Generate code following architectural pattern
}
```

---

### Pattern 3: Neural Pattern Training Pipeline

**Goal:** Train agents with different cognitive patterns

```javascript
// Initialize neural-enabled swarm
await ruvSwarm.swarm_init({
  topology: "mesh",
  maxAgents: 6,
  strategy: "adaptive"
});

// Spawn agents with distinct cognitive patterns
const neuralAgents = await cloudFlow.agents.spawn_parallel({
  agents: [
    { type: "researcher", name: "Divergent Thinker" },   // Creative
    { type: "analyst", name: "Convergent Solver" },     // Problem-solving
    { type: "architect", name: "Systems Thinker" },     // Holistic
    { type: "reviewer", name: "Critical Evaluator" }    // Analytical
  ]
});

// Train each agent with specific pattern
await ruvSwarm.neural_train({
  agentId: neuralAgents.sessions[0].agentId,
  pattern: "divergent",
  iterations: 50
});

await ruvSwarm.neural_train({
  agentId: neuralAgents.sessions[1].agentId,
  pattern: "convergent",
  iterations: 50
});

// Check neural status
const status = await ruvSwarm.neural_status({});
console.log(`Trained models: ${status.data.trainedModels}`);
```

---

### Pattern 4: Query Control for Long-Running Tasks

**Goal:** Monitor and control Claude execution in real-time

```javascript
// Start long-running query
const queryId = "query-123";

// Monitor progress
const status = await claudeFlow.query.control({
  action: "pause",
  queryId
});

// Switch to faster model for remaining work
await claudeFlow.query.control({
  action: "change_model",
  queryId,
  model: "claude-3-5-haiku-20241022"
});

// Resume execution
await claudeFlow.query.control({
  action: "resume",
  queryId
});

// List all active queries
const queries = await claudeFlow.query.list({
  includeHistory: false
});
```

---

### Pattern 5: Distributed Neural Cluster (flow-nexus)

**Goal:** Train neural networks across multiple cloud sandboxes

```javascript
// Initialize distributed cluster
await flowNexus.neural_cluster_init({
  name: "production-neural-cluster",
  topology: "mesh",
  daaEnabled: true,
  wasmOptimization: true,
  consensus: "proof-of-learning"
});

// Deploy neural nodes in E2B sandboxes
const nodes = await Promise.all([
  flowNexus.neural_node_deploy({
    cluster_id: "cluster-abc",
    node_type: "worker",
    model: "large",
    autonomy: 0.8
  }),
  flowNexus.neural_node_deploy({
    cluster_id: "cluster-abc",
    node_type: "parameter_server",
    model: "base",
    autonomy: 0.6
  }),
  flowNexus.neural_node_deploy({
    cluster_id: "cluster-abc",
    node_type: "aggregator",
    model: "base",
    autonomy: 0.7
  })
]);

// Start distributed training
await flowNexus.neural_train_distributed({
  cluster_id: "cluster-abc",
  dataset: "training-data-v1",
  epochs: 100,
  batch_size: 64,
  federated: true
});

// Monitor training progress
const clusterStatus = await flowNexus.neural_cluster_status({
  cluster_id: "cluster-abc"
});
```

---

## Custom Tool Creation

### Tool Registry Architecture

**File:** `src/mcp/tools.ts:45-553`

```typescript
export class ToolRegistry extends EventEmitter {
  private tools = new Map<string, MCPTool>();
  private capabilities = new Map<string, ToolCapability>();
  private metrics = new Map<string, ToolMetrics>();

  /**
   * Register a tool with capability information
   */
  register(tool: MCPTool, capability?: ToolCapability): void {
    this.validateTool(tool);
    this.tools.set(tool.name, tool);

    // Initialize metrics tracking
    this.metrics.set(tool.name, {
      totalInvocations: 0,
      successfulInvocations: 0,
      failedInvocations: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
    });
  }
}
```

### Creating a Custom Tool

**Step 1: Define Tool Schema**

```typescript
import type { MCPTool, MCPContext } from '../utils/types.js';
import type { ILogger } from '../core/logger.js';

export function createCustomDataProcessingTool(logger: ILogger): MCPTool {
  return {
    name: 'data/process',
    description: 'Process large datasets with configurable transformations',
    inputSchema: {
      type: 'object',
      properties: {
        datasetId: {
          type: 'string',
          description: 'ID of the dataset to process'
        },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['filter', 'map', 'reduce', 'aggregate']
              },
              config: { type: 'object' }
            }
          },
          description: 'Transformation pipeline'
        },
        batchSize: {
          type: 'number',
          default: 1000,
          minimum: 100,
          maximum: 10000,
          description: 'Records per batch'
        }
      },
      required: ['datasetId', 'transformations']
    },
    handler: async (input: any, context?: MCPContext) => {
      logger.info('Processing dataset', {
        datasetId: input.datasetId,
        transformations: input.transformations.length
      });

      const startTime = Date.now();

      try {
        // Load dataset
        const dataset = await loadDataset(input.datasetId);

        // Apply transformations
        let result = dataset;
        for (const transform of input.transformations) {
          result = await applyTransformation(result, transform, input.batchSize);
        }

        const processingTime = Date.now() - startTime;

        return {
          success: true,
          datasetId: input.datasetId,
          recordsProcessed: result.length,
          processingTime,
          throughput: result.length / (processingTime / 1000),
          result: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        logger.error('Dataset processing failed', error);
        throw error;
      }
    }
  };
}

// Helper functions
async function loadDataset(datasetId: string): Promise<any[]> {
  // Implementation
  return [];
}

async function applyTransformation(
  data: any[],
  transform: any,
  batchSize: number
): Promise<any[]> {
  // Implementation
  return data;
}
```

**Step 2: Register Tool**

```typescript
// In MCP server initialization
import { createCustomDataProcessingTool } from './custom-tools.js';

const customTool = createCustomDataProcessingTool(logger);
mcpServer.registerTool(customTool);

logger.info('Custom tool registered', { name: customTool.name });
```

**Step 3: Use Tool**

```javascript
// From Claude AI
const result = await mcp.data.process({
  datasetId: "sales-2024-q1",
  transformations: [
    { type: "filter", config: { field: "status", value: "completed" } },
    { type: "aggregate", config: { groupBy: "region", sum: "revenue" } }
  ],
  batchSize: 5000
});

console.log(`Processed ${result.recordsProcessed} records in ${result.processingTime}ms`);
```

---

## Performance Considerations

### 1. In-Process vs stdio Latency

**File:** `src/mcp/in-process-server.ts:1-300`

```
┌─────────────────────────────────────────────────────────────┐
│                   Execution Mode Comparison                  │
├─────────────────────────────────────────────────────────────┤
│ Operation         │ stdio/HTTP    │ In-Process │ Speedup     │
├─────────────────────────────────────────────────────────────┤
│ Tool Call         │ 10-50ms       │ 0.1-1ms    │ 10-100x     │
│ Agent Spawn       │ 250ms         │ 25ms       │ 10x         │
│ Memory Query      │ 15ms          │ 0.5ms      │ 30x         │
│ Task Create       │ 8ms           │ 0.3ms      │ 27x         │
│ System Status     │ 5ms           │ 0.2ms      │ 25x         │
└─────────────────────────────────────────────────────────────┘

Total for 100 tool calls:
- stdio: 1000-5000ms
- In-process: 10-100ms (50x faster)
```

### 2. Parallel Spawning Performance

**File:** `src/mcp/claude-flow-tools.ts:1318-1405`

```javascript
// Benchmark: Spawn 10 agents
const benchmark = {
  sequential: {
    time: 2500,  // 10 × 250ms
    method: "for loop with await"
  },
  parallel: {
    time: 180,   // Single batch
    method: "spawn_parallel with maxConcurrency: 10",
    speedup: 13.9  // 2500ms / 180ms
  }
};

// Real-world measurements
const measurements = [
  { agents: 1,  sequential: 250,  parallel: 250,  speedup: 1.0 },
  { agents: 3,  sequential: 750,  parallel: 150,  speedup: 5.0 },
  { agents: 5,  sequential: 1250, parallel: 180,  speedup: 6.9 },
  { agents: 10, sequential: 2500, parallel: 180,  speedup: 13.9 }
];
```

### 3. Memory Query Optimization

**Caching Strategy:**
```javascript
// Tool registry with LRU cache
this.cache = new Map();  // maxSize: 1000, maxMemoryMB: 50

// Cache hit rate: 70-90%
const stats = toolRegistry.getMetrics();
console.log(`Cache hit rate: ${stats.cacheHitRate}%`);

// Query performance
const queryPerf = {
  cacheHit: "0.5ms",    // 90% of queries
  cacheMiss: "15ms",    // 10% of queries (database lookup)
  average: "2ms"        // Weighted average
};
```

### 4. Load Balancing Metrics

**File:** `src/mcp/load-balancer.ts:1-300`

```javascript
// Circuit breaker settings
const circuitBreaker = {
  errorThreshold: 0.5,        // Open after 50% failure rate
  timeoutMs: 30000,           // 30 second timeout
  resetTimeout: 60000,        // 1 minute cooldown
  halfOpenRequests: 5         // Test requests before closing
};

// Rate limiting
const rateLimiter = {
  maxRequestsPerSecond: 100,
  maxConcurrentRequests: 50,
  queueSize: 1000,
  queueTimeout: 30000
};

// Performance monitoring
const metrics = loadBalancer.getMetrics();
// {
//   rateLimitedRequests: 12,
//   averageResponseTime: 45.3,
//   requestsPerSecond: 87.4,
//   circuitBreakerTrips: 0
// }
```

---

## Troubleshooting

### Common Issues

#### 1. Tool Not Found Error

**Symptom:**
```
Error: Tool not found: agents/spawn_parallel
```

**Cause:** Claude-Flow MCP server not registered or not running

**Solution:**
```bash
# Check MCP server status
claude mcp list

# Add server if missing
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Restart Claude Desktop
```

---

#### 2. ruv-swarm Tools Unavailable

**Symptom:**
```
Error: mcp__ruv-swarm__swarm_init not available
```

**Cause:** ruv-swarm package not installed

**Solution:**
```bash
# Install ruv-swarm globally
npm install -g ruv-swarm

# Add to Claude MCP
claude mcp add ruv-swarm npx ruv-swarm mcp start

# Verify availability
npx ruv-swarm --version
```

---

#### 3. Slow Tool Execution

**Symptom:**
```
Tool calls taking 50-100ms (should be <1ms)
```

**Cause:** Using stdio transport instead of in-process mode

**Solution:**
```typescript
// Enable in-process mode
import { initializeInProcessMCP } from './mcp/index.js';

const integration = await initializeInProcessMCP(orchestratorContext);

// Verify in-process is active
const status = integration.isInProcessAvailable();
console.log(`In-process: ${status}`);  // Should be true
```

---

#### 4. Memory Query Returns Empty

**Symptom:**
```javascript
const results = await memory.query({ search: "architecture" });
// results.entries = []
```

**Causes:**
1. No memories stored yet
2. Wrong session ID
3. Memory expired (check TTL)

**Solution:**
```javascript
// Debug: List all memories
const all = await memory.query({ limit: 100 });
console.log(`Total memories: ${all.count}`);

// Check session ID matches
console.log(`Current session: ${context.sessionId}`);

// Store with correct session
await memory.store({
  sessionId: context.sessionId,
  type: "decision",
  content: "Test content"
});
```

---

#### 5. Neural Training Fails

**Symptom:**
```
Error: WASM module not initialized
```

**Cause:** WASM SIMD not supported or not initialized

**Solution:**
```javascript
// Check WASM support
const features = await ruvSwarm.features_detect({
  category: "wasm"
});

if (!features.data.wasmSupported) {
  console.error("WASM not supported on this platform");
}

if (!features.data.simdSupported) {
  console.warn("SIMD not available, training will be slower");
}

// Initialize WASM before training
await ruvSwarm.swarm_init({ topology: "mesh" });
await ruvSwarm.neural_train({ iterations: 10 });
```

---

#### 6. High Memory Usage

**Symptom:**
```
Memory usage: 85% (heap: 850MB / 1000MB)
```

**Cause:** Too many cached memories or large workflows

**Solution:**
```javascript
// Check memory analytics
const analytics = await system.memory_analytics({ timeframe: "1h" });
console.log(`Heap usage: ${analytics.usage_percentage}%`);

// Trigger garbage collection
await memory.consolidate();

// Export and clear old memories
await memory.export({
  format: "json",
  startTime: "2025-01-01",
  endTime: "2025-09-01"
});

// Delete old memories
const oldMemories = await memory.query({
  endTime: "2025-09-01"
});

for (const entry of oldMemories.entries) {
  await memory.delete({ entryId: entry.id });
}
```

---

### Debugging Tools

```javascript
// 1. System health check
const health = await system.health({ deep: true });
console.log(JSON.stringify(health, null, 2));

// 2. Performance report
const report = await performance.report({
  timeframe: "24h",
  format: "detailed"
});

// 3. Bottleneck analysis
const bottlenecks = await performance.bottleneck_analyze({
  component: "system",
  metrics: ["cpu", "memory", "io"]
});

// 4. Agent metrics
const agentMetrics = await agents.metrics({
  agentId: "agent-123",
  metric: "all"
});

// 5. Tool registry stats
const toolStats = toolRegistry.getRegistryStats();
console.log(`Success rate: ${toolStats.successRate}%`);
```

---

## Related Documentation

- **User Guide:** [claude-flow-user-guide-2025-10-14.md](../claude-flow-user-guide-2025-10-14.md) - High-level usage
- **Memory Architecture:** [MEMORY-ARCHITECTURE.md](MEMORY-ARCHITECTURE.md) - Memory system deep dive
- **Architecture Deep Dive:** [ARCHITECTURE-DEEP-DIVE.md](../investigation/ARCHITECTURE-DEEP-DIVE.md) - System design
- **API Reference:** [API-REFERENCE.md](API-REFERENCE.md) - Complete API documentation

---

**Last Updated:** 2025-10-15
**Authors:** Claude-Flow Team
**License:** MIT
