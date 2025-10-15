# Claude-Flow Agent Orchestration Patterns: Technical Reference

**Version:** v2.5.0-alpha.140
**Last Updated:** 2025-10-15
**Audience:** Developers, architects, DevOps engineers

---

## Table of Contents

1. [Overview](#overview)
2. [Coordination Modes](#coordination-modes)
3. [Strategy-Based Agent Spawning](#strategy-based-agent-spawning)
4. [Parallel Execution Patterns](#parallel-execution-patterns)
5. [Task Dependency Management](#task-dependency-management)
6. [Load Balancing & Work Stealing](#load-balancing--work-stealing)
7. [Fault Tolerance](#fault-tolerance)
8. [Agent Communication](#agent-communication)
9. [Real-World Examples](#real-world-examples)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Claude-Flow implements a **multi-mode orchestration system** that coordinates AI agents across distributed workloads. Unlike traditional task schedulers that operate on static task graphs, Claude-Flow's orchestration adapts in real-time based on agent performance, workload imbalance, and task dependencies.

### Key Design Principles

1. **Topology-Aware Coordination:** Different coordination modes optimize for different workload patterns
2. **Adaptive Load Balancing:** Automatic work stealing prevents bottlenecks
3. **Fault Isolation:** Circuit breakers protect against cascading failures
4. **Dependency-Driven Execution:** Tasks execute as soon as dependencies are satisfied
5. **Decentralized Communication:** Agents coordinate via memory and message passing

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│            (SPARC, Verification, User Code)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────▼──────────────┐
         │  SwarmCoordinator        │
         │  (Orchestration Core)    │
         └───┬──────────────────┬───┘
             │                  │
    ┌────────▼────────┐   ┌────▼──────────────┐
    │  LoadBalancer   │   │  DependencyGraph  │
    │  (Work Dist.)   │   │  (Task Ordering)  │
    └────┬────────────┘   └────┬──────────────┘
         │                     │
    ┌────▼─────────────────────▼───────┐
    │     Agent Pool (Mesh/Ring/Star)  │
    │  ┌──────┐  ┌──────┐  ┌──────┐   │
    │  │Agent1│──│Agent2│──│Agent3│   │
    │  └───┬──┘  └───┬──┘  └───┬──┘   │
    └──────┼─────────┼─────────┼───────┘
           │         │         │
    ┌──────▼─────────▼─────────▼───────┐
    │    Memory Manager (Coordination)  │
    │    Circuit Breaker (Fault Guard)  │
    │    Message Router (Communication) │
    └───────────────────────────────────┘
```

**File:** Core coordination: `src/coordination/swarm-coordinator.ts:69-760`

---

## Coordination Modes

Claude-Flow supports 5 coordination modes, each optimized for specific workload characteristics.

### 1. Centralized Mode

**When to use:** Simple workflows, single point of control, debugging

**Architecture:**
```
        ┌─────────────┐
        │ Coordinator │
        └─────┬───────┘
              │
      ┌───────┼───────┐
      │       │       │
   ┌──▼──┐ ┌─▼──┐ ┌─▼──┐
   │Agt1 │ │Agt2│ │Agt3│
   └─────┘ └────┘ └────┘
```

**Implementation:** `src/cli/simple-commands/swarm-executor.js:16-189`

```javascript
const coordinator = new SwarmCoordinator({
  mode: 'centralized',
  maxAgents: 5,
  strategy: 'auto'
});

await coordinator.initialize();

// Coordinator assigns all tasks
await coordinator.addAgent('coder', 'Backend Developer');
await coordinator.addAgent('tester', 'QA Engineer');

// Centralized task assignment
await coordinator.executeTask('Build REST API');
```

**Characteristics:**
- **Pros:** Simple, predictable, easy debugging
- **Cons:** Single point of failure, coordinator bottleneck
- **Scalability:** Up to ~10 agents
- **Latency:** Low (direct assignment)

---

### 2. Distributed Mode

**When to use:** High-throughput workloads, peer-to-peer coordination, fault tolerance

**Architecture:**
```
   ┌─────┐     ┌─────┐
   │Agt1 │────┤Agt2 │
   └──┬──┘     └──┬──┘
      │           │
   ┌──▼──┐     ┌─▼───┐
   │Agt3 │────┤Agt4 │
   └─────┘     └─────┘
     (Mesh Topology)
```

**Implementation:** `src/coordination/hive-orchestrator.ts:35-421`

```javascript
const orchestrator = new HiveOrchestrator({
  topology: 'mesh',
  consensusThreshold: 0.6
});

// Register agent capabilities for peer matching
orchestrator.registerAgentCapabilities('agent-1', ['coding', 'testing']);
orchestrator.registerAgentCapabilities('agent-2', ['architecture', 'design']);

// Decompose objective into distributed tasks
const tasks = await orchestrator.decomposeObjective(
  'Build microservices architecture'
);

// Agents vote on task assignments
const decision = await orchestrator.proposeTaskAssignment(
  tasks[0].id,
  'agent-1'
);

// Other agents submit votes
orchestrator.submitVote(decision.id, 'agent-2', true);
orchestrator.submitVote(decision.id, 'agent-3', true);
```

**File:** `src/coordination/hive-orchestrator.ts:202-264`

**Characteristics:**
- **Pros:** No single point of failure, scales horizontally
- **Cons:** Consensus overhead, eventual consistency
- **Scalability:** Up to ~50 agents
- **Latency:** Medium (consensus delay)

---

### 3. Hierarchical Mode

**When to use:** Large-scale deployments, multi-tier workflows, organizational structure

**Architecture:**
```
        ┌─────────────┐
        │Coordinator  │
        │  (Root)     │
        └─────┬───────┘
              │
      ┌───────┼───────┐
      │               │
   ┌──▼──────┐   ┌───▼─────┐
   │Manager1 │   │Manager2 │
   └───┬─────┘   └────┬────┘
       │              │
   ┌───┼───┐      ┌───┼───┐
   │   │   │      │   │   │
  A1  A2  A3     A4  A5  A6
```

**Implementation:** `src/coordination/hive-orchestrator.ts:159-198`

```javascript
const orchestrator = new HiveOrchestrator({
  topology: 'hierarchical',
  consensusThreshold: 0.6
});

// Hierarchical task decomposition
const tasks = await orchestrator.decomposeObjective(
  'Enterprise application deployment'
);

// Tasks are automatically ordered by priority
// Critical tasks assigned to top-tier agents
// Lower-priority tasks cascade down hierarchy
```

**File:** Priority-based ordering: `src/coordination/hive-orchestrator.ts:162-168`

```typescript
case 'hierarchical':
  // Priority-based ordering with dependency respect
  return tasks.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
```

**Characteristics:**
- **Pros:** Natural organizational structure, clear responsibility
- **Cons:** Middle-manager overhead, coordination complexity
- **Scalability:** Up to ~100 agents
- **Latency:** Variable (depends on tree depth)

---

### 4. Mesh Mode

**When to use:** Maximum parallelism, independent tasks, research workflows

**Architecture:**
```
   ┌─────┐────┌─────┐
   │Agt1 │────│Agt2 │
   └─┬┬──┘    └──┬┬─┘
     ││          ││
   ┌─▼▼──┐    ┌─▼▼─┐
   │Agt3 │────│Agt4│
   └─────┘    └─────┘
   (Every agent connected)
```

**Implementation:** `src/coordination/hive-orchestrator.ts:178-182`

```javascript
const orchestrator = new HiveOrchestrator({
  topology: 'mesh'
});

// Parallel-friendly ordering - minimize dependencies
const tasks = await orchestrator.decomposeObjective(
  'Parallel data processing pipeline'
);

// Tasks with fewest dependencies execute first
// Maximum parallel execution opportunities
```

**File:** Dependency minimization: `src/coordination/hive-orchestrator.ts:179-181`

```typescript
case 'mesh':
  // Parallel-friendly ordering - minimize dependencies
  return tasks.sort((a, b) => a.dependencies.length - b.dependencies.length);
```

**Characteristics:**
- **Pros:** Maximum parallelism, any-to-any communication
- **Cons:** O(n²) connections, communication overhead
- **Scalability:** Up to ~20 agents (connection limit)
- **Latency:** Lowest (direct peer-to-peer)

---

### 5. Hybrid Mode (Recommended)

**When to use:** Production systems, adaptive workloads, general-purpose orchestration

**Architecture:**
```
   Centralized Coordinator
          │
   ┌──────┼──────┐
   │             │
Mesh Group    Ring Group
┌─────────┐  ┌─────────┐
│A1──A2─A3│  │A4→A5→A6→│
└─────────┘  └─────────┘
```

**Implementation:** `src/coordination/swarm-coordinator.ts:83-131`

```javascript
const coordinator = new SwarmCoordinator({
  coordinationStrategy: 'hybrid',
  maxAgents: 10,
  enableWorkStealing: true,
  enableCircuitBreaker: true,
  enableMonitoring: true
});

await coordinator.start();

// Register agents with different capabilities
await coordinator.registerAgent('Backend', 'coder', ['nodejs', 'sql']);
await coordinator.registerAgent('Frontend', 'coder', ['react', 'css']);
await coordinator.registerAgent('Tester', 'tester', ['jest', 'cypress']);

// Create objective (automatically decomposes into tasks)
const objectiveId = await coordinator.createObjective(
  'Build full-stack application',
  'development'
);

// Execute (hybrid strategy automatically applies)
await coordinator.executeObjective(objectiveId);

// Monitor progress
const status = coordinator.getSwarmStatus();
console.log(status);
```

**File:** Configuration defaults: `src/coordination/swarm-coordinator.ts:86-100`

**Characteristics:**
- **Pros:** Best of all modes, adaptive to workload
- **Cons:** Most complex to configure
- **Scalability:** Up to ~50 agents
- **Latency:** Adaptive (optimizes per task)

---

## Strategy-Based Agent Spawning

Claude-Flow automatically spawns agents based on the selected strategy.

### Strategy Types

**File:** Strategy implementation: `src/cli/simple-commands/swarm-executor.js:224-238`

```javascript
// 1. DEVELOPMENT STRATEGY
if (config.strategy === 'development' || config.strategy === 'auto') {
  await coordinator.addAgent('architect', 'System Architect');
  await coordinator.addAgent('coder', 'Backend Developer');
  await coordinator.addAgent('coder', 'Frontend Developer');
  await coordinator.addAgent('tester', 'QA Engineer');
  await coordinator.addAgent('reviewer', 'Code Reviewer');
}

// 2. RESEARCH STRATEGY
else if (config.strategy === 'research') {
  await coordinator.addAgent('researcher', 'Lead Researcher');
  await coordinator.addAgent('analyst', 'Data Analyst');
  await coordinator.addAgent('researcher', 'Research Assistant');
}

// 3. TESTING STRATEGY
else if (config.strategy === 'testing') {
  await coordinator.addAgent('tester', 'Test Lead');
  await coordinator.addAgent('tester', 'Integration Tester');
  await coordinator.addAgent('tester', 'Performance Tester');
}

// 4. ANALYSIS STRATEGY
else if (config.strategy === 'analysis') {
  await coordinator.addAgent('analyst', 'Data Analyst');
  await coordinator.addAgent('researcher', 'Research Analyst');
  await coordinator.addAgent('analyst', 'Business Analyst');
}
```

### Task Decomposition by Strategy

**File:** `src/coordination/swarm-coordinator.ts:270-318`

```typescript
private async decomposeObjective(objective: SwarmObjective): Promise<SwarmTask[]> {
  const tasks: SwarmTask[] = [];

  switch (objective.strategy) {
    case 'research':
      tasks.push(
        this.createTask('research', 'Gather information and research materials', 1),
        this.createTask('analysis', 'Analyze research findings', 2, ['research']),
        this.createTask('synthesis', 'Synthesize insights and create report', 3, ['analysis']),
      );
      break;

    case 'development':
      tasks.push(
        this.createTask('planning', 'Plan architecture and design', 1),
        this.createTask('implementation', 'Implement core functionality', 2, ['planning']),
        this.createTask('testing', 'Test and validate implementation', 3, ['implementation']),
        this.createTask('documentation', 'Create documentation', 3, ['implementation']),
        this.createTask('review', 'Peer review and refinement', 4,
          ['testing', 'documentation']),
      );
      break;

    case 'analysis':
      tasks.push(
        this.createTask('data-collection', 'Collect and prepare data', 1),
        this.createTask('analysis', 'Perform detailed analysis', 2, ['data-collection']),
        this.createTask('visualization', 'Create visualizations', 3, ['analysis']),
        this.createTask('reporting', 'Generate final report', 4,
          ['analysis', 'visualization']),
      );
      break;

    default: // auto
      tasks.push(
        this.createTask('exploration', 'Explore and understand requirements', 1),
        this.createTask('planning', 'Create execution plan', 2, ['exploration']),
        this.createTask('execution', 'Execute main tasks', 3, ['planning']),
        this.createTask('validation', 'Validate and test results', 4, ['execution']),
        this.createTask('completion', 'Finalize and document', 5, ['validation']),
      );
  }

  return tasks;
}
```

---

## Parallel Execution Patterns

### BatchTool Pattern (Claude Code)

Claude Code's Task tool enables TRUE parallel agent execution:

**File:** This is implemented in Claude Code's runtime, not in source files

```javascript
// ✅ CORRECT: Batch spawn all agents in single message
[Single Message - Parallel Execution]:
  Task("Architect", "Design system architecture. Store in memory/architecture/*",
       "system-architect")
  Task("Backend Dev", "Build REST API with Express. Check memory for architecture",
       "coder")
  Task("Frontend Dev", "Create React UI. Coordinate via memory/ui/*",
       "coder")
  Task("Database", "Design PostgreSQL schema. Store in memory/database/*",
       "code-analyzer")
  Task("Tester", "Write Jest tests. Check memory for API contracts",
       "tester")
  Task("DevOps", "Setup Docker and CI/CD. Document in memory/deployment/*",
       "cicd-engineer")

// ALL agents spawn simultaneously
// Coordination happens via memory namespace
```

### Memory-Based Coordination

**File:** `src/coordination/swarm-coordinator.ts:667-699`

```typescript
private async syncMemoryState(): Promise<void> {
  try {
    // Sync current state to memory for agent coordination
    const state = {
      objectives: Array.from(this.objectives.values()),
      tasks: Array.from(this.tasks.values()),
      agents: Array.from(this.agents.values()),
      timestamp: new Date(),
    };

    await this.memoryManager.store({
      id: 'swarm:state',
      agentId: 'swarm-coordinator',
      type: 'swarm-state',
      content: JSON.stringify(state),
      namespace: this.config.memoryNamespace,
      timestamp: new Date(),
      metadata: {
        type: 'swarm-state',
        objectiveCount: state.objectives.length,
        taskCount: state.tasks.length,
        agentCount: state.agents.length,
      },
    });
  } catch (error) {
    this.logger.error('Error syncing memory state:', error);
  }
}
```

**Usage Pattern:**
```bash
# Agent 1 stores decision
npx claude-flow@alpha memory store swarm/architecture/database "PostgreSQL"

# Agent 2 retrieves decision (no direct messaging needed)
npx claude-flow@alpha memory retrieve swarm/architecture/database
# Returns: "PostgreSQL"
```

---

## Task Dependency Management

### Dependency Graph

**File:** `src/coordination/dependency-graph.ts:1-474`

Claude-Flow builds a **directed acyclic graph (DAG)** of task dependencies:

```
┌──────────┐
│ Planning │
└────┬─────┘
     │
     ├──────────┬──────────┐
     │          │          │
┌────▼────┐ ┌──▼────┐ ┌───▼────┐
│Backend  │ │Frontend│ │Database│
└────┬────┘ └───┬───┘ └───┬────┘
     │          │          │
     └──────────┼──────────┘
                │
         ┌──────▼──────┐
         │   Testing   │
         └──────┬──────┘
                │
         ┌──────▼────────┐
         │ Documentation │
         └───────────────┘
```

### Adding Tasks to Graph

**File:** `src/coordination/dependency-graph.ts:34-69`

```typescript
addTask(task: Task): void {
  if (this.nodes.has(task.id)) {
    this.logger.warn('Task already exists in dependency graph', { taskId: task.id });
    return;
  }

  const node: DependencyNode = {
    taskId: task.id,
    dependencies: new Set(task.dependencies),
    dependents: new Set(),
    status: 'pending',
  };

  // Validate dependencies exist
  for (const depId of task.dependencies) {
    if (!this.nodes.has(depId) && !this.completedTasks.has(depId)) {
      throw new TaskDependencyError(task.id, [depId]);
    }
  }

  // Add node
  this.nodes.set(task.id, node);

  // Update dependents for dependencies
  for (const depId of task.dependencies) {
    const depNode = this.nodes.get(depId);
    if (depNode) {
      depNode.dependents.add(task.id);
    }
  }

  // Check if task is ready
  if (this.isTaskReady(task.id)) {
    node.status = 'ready';
  }
}
```

### Detecting Circular Dependencies

**File:** `src/coordination/dependency-graph.ts:226-272`

```typescript
detectCycles(): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  const hasCycle = (taskId: string): boolean => {
    visited.add(taskId);
    recursionStack.add(taskId);
    currentPath.push(taskId);

    const node = this.nodes.get(taskId);
    if (!node) return false;

    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        if (hasCycle(depId)) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        // Found cycle
        const cycleStart = currentPath.indexOf(depId);
        const cycle = currentPath.slice(cycleStart);
        cycle.push(depId); // Complete the cycle
        cycles.push(cycle);
        return true;
      }
    }

    currentPath.pop();
    recursionStack.delete(taskId);
    return false;
  };

  for (const taskId of this.nodes.keys()) {
    if (!visited.has(taskId)) {
      hasCycle(taskId);
    }
  }

  return cycles;
}
```

### Topological Sorting

**File:** `src/coordination/dependency-graph.ts:277-317`

```typescript
topologicalSort(): string[] | null {
  // Check for cycles first
  const cycles = this.detectCycles();
  if (cycles.length > 0) {
    this.logger.error('Cannot perform topological sort due to cycles', { cycles });
    return null;
  }

  const sorted: string[] = [];
  const visited = new Set<string>();

  const visit = (taskId: string) => {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const node = this.nodes.get(taskId);
    if (!node) return;

    // Visit dependencies first (depth-first)
    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        visit(depId);
      }
    }

    sorted.push(taskId);
  };

  // Visit all nodes
  for (const taskId of this.nodes.keys()) {
    if (!visited.has(taskId)) {
      visit(taskId);
    }
  }

  return sorted;
}
```

**Example:**
```javascript
import { DependencyGraph } from './coordination/dependency-graph.js';
import { Logger } from './core/logger.js';

const graph = new DependencyGraph(new Logger('DependencyGraph'));

// Add tasks with dependencies
graph.addTask({ id: 'planning', dependencies: [] });
graph.addTask({ id: 'backend', dependencies: ['planning'] });
graph.addTask({ id: 'frontend', dependencies: ['planning'] });
graph.addTask({ id: 'testing', dependencies: ['backend', 'frontend'] });

// Get execution order
const order = graph.topologicalSort();
console.log(order);
// Output: ['planning', 'backend', 'frontend', 'testing']

// Get ready tasks (can execute now)
const ready = graph.getReadyTasks();
console.log(ready);
// Output: ['planning']

// Mark task complete
const newReady = graph.markCompleted('planning');
console.log(newReady);
// Output: ['backend', 'frontend'] (both ready now)
```

---

## Load Balancing & Work Stealing

### Load Balancing Strategies

**File:** `src/coordination/load-balancer.ts:1-1005`

Claude-Flow supports **7 load balancing strategies**:

```typescript
export type LoadBalancingStrategy =
  | 'load-based'        // Least loaded agent
  | 'performance-based' // Best performing agent
  | 'capability-based'  // Best capability match
  | 'affinity-based'    // Task affinity / locality
  | 'cost-based'        // Lowest cost
  | 'hybrid'            // Weighted combination (RECOMMENDED)
  | 'random';           // Random selection
```

### Hybrid Strategy (Recommended)

**File:** `src/coordination/load-balancer.ts:486-498`

```typescript
private calculateHybridScore(
  agent: AgentState,
  task: TaskDefinition,
  load: AgentLoad
): number {
  const loadScore = this.calculateLoadScore(agent, load);
  const performanceScore = this.calculatePerformanceScore(agent, load);
  const capabilityScore = this.calculateCapabilityScore(agent, task);
  const affinityScore = this.calculateAffinityScore(agent, task);

  return (
    loadScore * this.config.loadWeight +              // 25%
    performanceScore * this.config.performanceWeight + // 30%
    capabilityScore * this.config.affinityWeight +    // 30%
    affinityScore * this.config.latencyWeight         // 15%
  );
}
```

### Work Stealing Algorithm

**File:** `src/coordination/work-stealing.ts:29-218`

**When to steal:**
1. Overloaded agent: `utilization > 80%` AND `queueDepth > threshold`
2. Underloaded agent: `utilization < 30%` AND `queueDepth < 2`
3. Load difference: `maxLoad - minLoad >= stealThreshold` (default: 3)

```typescript
export class WorkStealingCoordinator {
  async checkAndSteal(): Promise<void> {
    const workloads = Array.from(this.workloads.values());
    if (workloads.length < 2) return;

    // Sort by task count
    workloads.sort((a, b) => a.taskCount - b.taskCount);

    const minLoaded = workloads[0];
    const maxLoaded = workloads[workloads.length - 1];

    // Check if stealing is warranted
    const difference = maxLoaded.taskCount - minLoaded.taskCount;
    if (difference < this.config.stealThreshold) {
      return;
    }

    // Calculate tasks to steal
    const tasksToSteal = Math.min(
      Math.floor(difference / 2),
      this.config.maxStealBatch
    );

    this.logger.info('Initiating work stealing', {
      from: maxLoaded.agentId,
      to: minLoaded.agentId,
      tasksToSteal,
      difference,
    });

    // Emit steal request
    this.eventBus.emit('workstealing:request', {
      sourceAgent: maxLoaded.agentId,
      targetAgent: minLoaded.agentId,
      taskCount: tasksToSteal,
    });
  }
}
```

### Work Stealing Execution

**File:** `src/coordination/load-balancer.ts:509-584`

```typescript
private async executeWorkStealing(
  sourceAgentId: string,
  targetAgentId: string,
  taskCount: number,
): Promise<void> {
  const operationId = `steal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const operation: WorkStealingOperation = {
    id: operationId,
    sourceAgent: { id: sourceAgentId },
    targetAgent: { id: targetAgentId },
    tasks: [],
    reason: 'load_imbalance',
    status: 'planned',
    startTime: new Date(),
    metrics: {
      tasksStolen: 0,
      loadReduction: 0,
      latencyImprovement: 0,
    },
  };

  try {
    operation.status = 'executing';

    // Get source queue
    const sourceQueue = this.taskQueues.get(sourceAgentId) || [];

    // Select tasks to steal (lowest priority first)
    const tasksToSteal = sourceQueue
      .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'low' ? -1 : 1))
      .slice(0, Math.min(taskCount, this.config.maxStealBatch));

    // Move tasks
    for (const task of tasksToSteal) {
      this.updateTaskQueue(sourceAgentId, task, 'remove');
      this.updateTaskQueue(targetAgentId, task, 'add');
      operation.tasks.push(task.id);
    }

    // Update metrics
    operation.metrics.tasksStolen = tasksToSteal.length;
    operation.metrics.loadReduction = this.calculateLoadReduction(
      sourceAgentId,
      tasksToSteal.length
    );
    operation.status = 'completed';
    operation.endTime = new Date();

    this.emit('workstealing:completed', { operation });
  } catch (error) {
    operation.status = 'failed';
    this.emit('workstealing:failed', { operation, error });
  }
}
```

**Example:**
```javascript
import { LoadBalancer } from './coordination/load-balancer.js';

const balancer = new LoadBalancer({
  strategy: 'hybrid',
  enableWorkStealing: true,
  stealThreshold: 3,
  maxStealBatch: 5,
  rebalanceInterval: 10000, // 10 seconds
}, logger, eventBus);

await balancer.initialize();

// Select best agent for task
const decision = await balancer.selectAgent(task, availableAgents);
console.log(decision);
// Output:
// {
//   selectedAgent: 'agent-2',
//   reason: 'hybrid:0.85,pred:0.90',
//   confidence: 0.87,
//   alternatives: [
//     { agent: 'agent-1', score: 0.75 },
//     { agent: 'agent-3', score: 0.65 }
//   ],
//   loadBefore: { 'agent-1': 0.8, 'agent-2': 0.3, 'agent-3': 0.9 },
//   predictedLoadAfter: { 'agent-1': 0.8, 'agent-2': 0.4, 'agent-3': 0.9 }
// }

// Force rebalance
await balancer.forceRebalance();
```

---

## Fault Tolerance

### Circuit Breaker Pattern

**File:** `src/coordination/circuit-breaker.ts:1-367`

Claude-Flow implements the **Circuit Breaker pattern** to prevent cascading failures:

```
CLOSED ──failures─→ OPEN ──timeout─→ HALF_OPEN ──success─→ CLOSED
  ↑                                        │
  └────────────────failures────────────────┘
```

### Circuit States

**File:** `src/coordination/circuit-breaker.ts:15-19`

```typescript
export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Rejecting all requests
  HALF_OPEN = 'half-open' // Testing recovery
}
```

### Circuit Breaker Implementation

**File:** `src/coordination/circuit-breaker.ts:35-277`

```typescript
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if we should execute
    if (!this.canExecute()) {
      this.rejectedRequests++;
      throw new Error(`Circuit breaker '${this.name}' is OPEN`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if we should transition to half-open
        if (this.nextAttempt && new Date() >= this.nextAttempt) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Allow limited requests
        return this.halfOpenRequests < this.config.halfOpenLimit;
    }
  }

  private onSuccess(): void {
    this.lastSuccessTime = new Date();

    switch (this.state) {
      case CircuitState.CLOSED:
        this.failures = 0; // Reset
        break;

      case CircuitState.HALF_OPEN:
        this.successes++;
        if (this.successes >= this.config.successThreshold) {
          this.transitionTo(CircuitState.CLOSED);
        }
        break;
    }
  }

  private onFailure(): void {
    this.lastFailureTime = new Date();

    switch (this.state) {
      case CircuitState.CLOSED:
        this.failures++;
        if (this.failures >= this.config.failureThreshold) {
          this.transitionTo(CircuitState.OPEN);
        }
        break;

      case CircuitState.HALF_OPEN:
        // Single failure reopens circuit
        this.transitionTo(CircuitState.OPEN);
        break;

      case CircuitState.OPEN:
        this.nextAttempt = new Date(Date.now() + this.config.timeout);
        break;
    }
  }
}
```

**Example:**
```javascript
import { CircuitBreakerManager } from './coordination/circuit-breaker.js';

const breaker = new CircuitBreakerManager({
  failureThreshold: 5,    // Open after 5 failures
  successThreshold: 3,    // Close after 3 successes
  timeout: 30000,         // 30 seconds
  halfOpenLimit: 5,       // Max 5 requests in half-open
}, logger, eventBus);

// Execute with protection
try {
  const result = await breaker.execute('agent-1', async () => {
    return await agentTask();
  });
} catch (error) {
  if (error.message.includes('Circuit breaker')) {
    console.log('Agent is temporarily unavailable');
  }
}

// Check circuit state
const metrics = breaker.getAllMetrics();
console.log(metrics);
// Output:
// {
//   'agent-1': {
//     state: 'open',
//     failures: 5,
//     successes: 0,
//     totalRequests: 100,
//     rejectedRequests: 20
//   }
// }

// Force reset if needed
breaker.resetBreaker('agent-1');
```

### Retry Strategy

**File:** `src/coordination/swarm-coordinator.ts:496-532`

```typescript
private async handleTaskFailed(taskId: string, error: any): Promise<void> {
  const task = this.tasks.get(taskId);
  if (!task) return;

  const agent = task.assignedTo ? this.agents.get(task.assignedTo) : null;

  task.error = String(error);
  task.retryCount++;

  if (agent) {
    agent.status = 'idle';
    agent.metrics.tasksFailed++;

    if (this.circuitBreaker) {
      this.circuitBreaker.recordFailure(agent.id);
    }
  }

  // Retry logic with exponential backoff
  if (task.retryCount < task.maxRetries) {
    task.status = 'pending';
    task.assignedTo = undefined;

    // Exponential backoff: 2^retryCount * 1000ms
    const backoffDelay = Math.pow(this.config.backoffMultiplier, task.retryCount) * 1000;

    setTimeout(() => {
      this.logger.warn(`Retrying task ${taskId} (${task.retryCount}/${task.maxRetries})`);
      this.emit('task:retry', { task, error });
    }, backoffDelay);
  } else {
    task.status = 'failed';
    task.completedAt = new Date();
    this.logger.error(`Task ${taskId} failed after ${task.retryCount} retries`);
    this.emit('task:failed', { task, error });
  }
}
```

---

## Agent Communication

Claude-Flow supports **two communication patterns**:

### 1. Memory-Based Communication (Recommended)

**File:** `src/coordination/swarm-coordinator.ts:667-699`

Agents coordinate via shared memory namespace:

```javascript
// Agent 1: Store decision
await memory.store('swarm/architecture/api', {
  framework: 'Express',
  version: '4.18.2',
  middleware: ['cors', 'helmet', 'compression']
}, 'knowledge');

// Agent 2: Retrieve decision
const apiDecision = await memory.retrieve('swarm/architecture/api');
console.log(apiDecision.framework); // "Express"

// Agent 3: Update decision
await memory.store('swarm/architecture/api', {
  ...apiDecision,
  authentication: 'JWT'
}, 'knowledge');
```

**Advantages:**
- ✅ No direct coupling between agents
- ✅ Survives process restarts (persistent)
- ✅ Supports consensus mechanisms
- ✅ Automatic consolidation prevents conflicts

**Disadvantages:**
- ❌ Eventual consistency (not immediate)
- ❌ No delivery guarantees

---

### 2. Direct Messaging (Low-Latency)

**File:** `src/coordination/messaging.ts:1-282`

For real-time coordination:

```typescript
export class MessageRouter {
  async send(from: string, to: string, payload: unknown): Promise<void> {
    const message: Message = {
      id: generateId('msg'),
      type: 'agent-message',
      payload,
      timestamp: new Date(),
      priority: 0,
    };

    await this.sendMessage(from, to, message);
  }

  async sendWithResponse<T = unknown>(
    from: string,
    to: string,
    payload: unknown,
    timeoutMs?: number,
  ): Promise<T> {
    const message: Message = {
      id: generateId('msg'),
      type: 'agent-request',
      payload,
      timestamp: new Date(),
      priority: 1,
    };

    // Create response promise
    const responsePromise = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(message.id);
        reject(new Error(`Message response timeout: ${message.id}`));
      }, timeoutMs || this.config.messageTimeout);

      this.pendingResponses.set(message.id, { resolve, reject, timeout });
    });

    await this.sendMessage(from, to, message);
    return await responsePromise;
  }

  async broadcast(from: string, payload: unknown): Promise<void> {
    const agents = Array.from(this.queues.keys()).filter((id) => id !== from);
    await Promise.all(agents.map((to) => this.send(from, to, payload)));
  }
}
```

**Example:**
```javascript
import { MessageRouter } from './coordination/messaging.js';

const router = new MessageRouter(config, eventBus, logger);
await router.initialize();

// One-way message
await router.send('agent-1', 'agent-2', {
  type: 'update',
  data: { status: 'completed' }
});

// Request-response
const response = await router.sendWithResponse('agent-1', 'agent-2', {
  type: 'query',
  query: 'What is the API status?'
}, 5000);

console.log(response); // { status: 'healthy', uptime: 12345 }

// Broadcast to all agents
await router.broadcast('coordinator', {
  type: 'shutdown',
  reason: 'maintenance'
});
```

---

## Real-World Examples

### Example 1: Full-Stack Application Development

```javascript
import { SwarmCoordinator } from './coordination/swarm-coordinator.js';
import { DependencyGraph } from './coordination/dependency-graph.js';

const coordinator = new SwarmCoordinator({
  coordinationStrategy: 'hybrid',
  maxAgents: 6,
  enableWorkStealing: true,
  enableCircuitBreaker: true
});

await coordinator.start();

// Step 1: Create objective
const objectiveId = await coordinator.createObjective(
  'Build production-ready e-commerce platform',
  'development'
);

// Step 2: Register specialized agents
await coordinator.registerAgent('System Architect', 'coordinator',
  ['architecture', 'design', 'planning']);
await coordinator.registerAgent('Backend Developer', 'coder',
  ['nodejs', 'express', 'postgresql']);
await coordinator.registerAgent('Frontend Developer', 'coder',
  ['react', 'typescript', 'tailwind']);
await coordinator.registerAgent('Database Specialist', 'analyst',
  ['postgresql', 'redis', 'migrations']);
await coordinator.registerAgent('QA Engineer', 'tester',
  ['jest', 'cypress', 'playwright']);
await coordinator.registerAgent('DevOps Engineer', 'coder',
  ['docker', 'kubernetes', 'cicd']);

// Step 3: Execute (automatic task decomposition)
await coordinator.executeObjective(objectiveId);

// Step 4: Monitor in real-time
setInterval(async () => {
  const status = coordinator.getSwarmStatus();
  console.log(`
    Agents: ${status.agents.idle} idle / ${status.agents.busy} busy
    Tasks: ${status.tasks.completed} / ${status.tasks.total} completed
    Runtime: ${Math.floor(status.uptime / 60)} minutes
  `);
}, 10000);

// Step 5: Wait for completion
coordinator.on('objective:completed', async (objective) => {
  console.log('✅ Objective completed!');
  await coordinator.stop();
});
```

**Output:**
```
🚀 Swarm initialized: swarm_1nz9x2a_4k5j7b8
📋 Objective: Build production-ready e-commerce platform
🎯 Strategy: development
🏗️  Mode: hybrid

🤖 Agent spawned: System Architect (coordinator)
🤖 Agent spawned: Backend Developer (coder)
🤖 Agent spawned: Frontend Developer (coder)
🤖 Agent spawned: Database Specialist (analyst)
🤖 Agent spawned: QA Engineer (tester)
🤖 Agent spawned: DevOps Engineer (coder)

📌 Task: Plan architecture and design [priority: critical]
  ✅ Completed in 45s

📌 Task: Implement backend API [priority: high]
  ⏳ Dependencies: [planning]
  ✅ Completed in 3m 12s

📌 Task: Implement frontend UI [priority: high]
  ⏳ Dependencies: [planning]
  ✅ Completed in 4m 38s

📌 Task: Design database schema [priority: high]
  ⏳ Dependencies: [planning]
  ✅ Completed in 2m 5s

[Work stealing triggered: backend-developer → qa-engineer (3 tasks)]

📌 Task: Testing and validation [priority: high]
  ⏳ Dependencies: [backend, frontend, database]
  ✅ Completed in 5m 42s

✅ Objective completed!
📊 Summary:
  • Total Agents: 6
  • Tasks Completed: 8
  • Tasks Failed: 0
  • Runtime: 16m 23s
```

---

### Example 2: Research Paper Analysis

```javascript
const coordinator = new SwarmCoordinator({
  coordinationStrategy: 'mesh', // Parallel processing
  maxAgents: 4,
  strategy: 'research'
});

await coordinator.start();

const objectiveId = await coordinator.createObjective(
  'Analyze 50 research papers on quantum computing',
  'research'
);

// Register research agents
await coordinator.registerAgent('Lead Researcher', 'researcher',
  ['research', 'analysis', 'physics']);
await coordinator.registerAgent('Data Analyst', 'analyst',
  ['statistics', 'visualization', 'python']);
await coordinator.registerAgent('Research Assistant 1', 'researcher',
  ['literature-review', 'summarization']);
await coordinator.registerAgent('Research Assistant 2', 'researcher',
  ['literature-review', 'summarization']);

await coordinator.executeObjective(objectiveId);

// Mesh topology enables all 4 agents to work in parallel
// No central bottleneck for independent paper analysis
```

---

### Example 3: Fault Recovery Scenario

```javascript
import { CircuitBreakerManager } from './coordination/circuit-breaker.js';

const breaker = new CircuitBreakerManager({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  halfOpenLimit: 3
}, logger, eventBus);

const coordinator = new SwarmCoordinator({
  coordinationStrategy: 'hierarchical',
  enableCircuitBreaker: true,
  maxRetries: 3,
  backoffMultiplier: 2
});

// Scenario: Agent fails repeatedly
coordinator.on('task:failed', async (data) => {
  const { task, error } = data;
  console.log(`❌ Task ${task.id} failed: ${error}`);

  // Check if agent is circuit-broken
  const agent = coordinator.getAgentStatus(task.assignedTo);
  if (agent && !breaker.getBreaker(agent.id).canExecute()) {
    console.log(`🚫 Agent ${agent.id} circuit breaker OPEN`);

    // Reassign to backup agent
    const availableAgents = Array.from(coordinator.agents.values())
      .filter(a => a.status === 'idle' && a.id !== agent.id);

    if (availableAgents.length > 0) {
      await coordinator.assignTask(task.id, availableAgents[0].id);
      console.log(`🔄 Task reassigned to ${availableAgents[0].id}`);
    }
  }
});

// Automatic recovery
coordinator.on('agent:recovered', async (data) => {
  const { agentId } = data;
  breaker.resetBreaker(agentId);
  console.log(`✅ Agent ${agentId} recovered`);
});
```

---

## Troubleshooting

### Issue: Tasks Not Executing

**Symptoms:**
- Tasks stuck in `pending` status
- No agents assigned

**Diagnosis:**
```bash
# Check dependency graph
npx claude-flow@alpha swarm status --verbose

# Look for:
# - Circular dependencies
# - Missing dependencies
# - Agent unavailability
```

**Solution:**
```javascript
// Detect circular dependencies
const graph = coordinator.getDependencyGraph();
const cycles = graph.detectCycles();

if (cycles.length > 0) {
  console.log('Circular dependencies detected:', cycles);
  // Remove or reorder problematic dependencies
}

// Check agent availability
const agents = coordinator.getSwarmStatus().agents;
if (agents.idle === 0 && agents.busy === 0) {
  console.log('No agents available! Spawn more agents.');
  await coordinator.registerAgent('Backup Agent', 'coder', ['general']);
}
```

---

### Issue: Load Imbalance

**Symptoms:**
- Some agents overloaded (utilization > 90%)
- Other agents idle (utilization < 10%)
- High task latency

**Diagnosis:**
```javascript
const balancer = coordinator.getLoadBalancer();
const stats = balancer.getLoadStatistics();

console.log(stats);
// Output:
// {
//   averageUtilization: 0.45,
//   overloadedAgents: 2,
//   underloadedAgents: 3,
//   totalStealOperations: 5,
//   successfulSteals: 4
// }
```

**Solution:**
```javascript
// Enable work stealing
const coordinator = new SwarmCoordinator({
  enableWorkStealing: true,
  stealThreshold: 2,        // Lower threshold
  maxStealBatch: 10,        // Larger batches
  rebalanceInterval: 5000   // More frequent checks
});

// Or force rebalance immediately
await balancer.forceRebalance();
```

---

### Issue: Agent Circuit Breaker Open

**Symptoms:**
- Error: "Circuit breaker 'agent-X' is OPEN"
- Tasks failing immediately
- Agent unavailable

**Diagnosis:**
```javascript
const breaker = coordinator.getCircuitBreakerManager();
const metrics = breaker.getAllMetrics();

console.log(metrics['agent-1']);
// Output:
// {
//   state: 'open',
//   failures: 5,
//   successes: 0,
//   lastFailureTime: '2025-10-15T10:30:00.000Z',
//   totalRequests: 100,
//   rejectedRequests: 20
// }
```

**Solution:**
```javascript
// Option 1: Wait for automatic recovery (half-open state)
// Circuit will automatically attempt recovery after timeout

// Option 2: Force reset (use with caution)
breaker.resetBreaker('agent-1');

// Option 3: Increase thresholds
const breaker = new CircuitBreakerManager({
  failureThreshold: 10,  // Increase from 5
  timeout: 30000         // Reduce from 60000
}, logger, eventBus);
```

---

### Issue: Memory Leaks / High Memory Usage

**Symptoms:**
- Memory usage steadily increasing
- Eventually crashes with OOM

**Diagnosis:**
```bash
# Check memory statistics
npx claude-flow@alpha memory status

# Output:
# Total entries: 15420
# Total size: 247MB
# Utilization: 247%  ← PROBLEM!
```

**Solution:**
```javascript
// Enable garbage collection
const coordinator = new SwarmCoordinator({
  memoryNamespace: 'swarm',
  gcInterval: 60000,  // Every 60 seconds
  maxMemoryMB: 100    // Limit memory usage
});

// Manual cleanup
await coordinator.memoryManager.gc();

// Check for memory leaks in task queues
const queues = coordinator.getTaskQueues();
for (const [agentId, queue] of queues) {
  if (queue.length > 100) {
    console.log(`Agent ${agentId} has ${queue.length} queued tasks!`);
    // Clear stale tasks
    coordinator.clearTaskQueue(agentId);
  }
}
```

---

### Issue: Slow Task Execution

**Symptoms:**
- Tasks taking much longer than expected
- Low throughput

**Diagnosis:**
```javascript
const stats = graph.getStats();
console.log(stats);
// {
//   avgDependencies: 5.2,  ← HIGH!
//   maxDependencies: 15,   ← VERY HIGH!
//   criticalPath: 8 tasks  ← LONG CHAIN!
// }
```

**Solution:**
```javascript
// Reduce dependencies - enable more parallelism
// Before (sequential):
const tasks = [
  { id: 't1', dependencies: [] },
  { id: 't2', dependencies: ['t1'] },
  { id: 't3', dependencies: ['t2'] },
  { id: 't4', dependencies: ['t3'] }
];
// Critical path: 4 tasks (serial execution)

// After (parallel):
const tasks = [
  { id: 't1', dependencies: [] },
  { id: 't2', dependencies: ['t1'] },  // Parallel with t3, t4
  { id: 't3', dependencies: ['t1'] },
  { id: 't4', dependencies: ['t1'] }
];
// Critical path: 2 tasks (3x faster)

// Use mesh topology for maximum parallelism
const orchestrator = new HiveOrchestrator({ topology: 'mesh' });
```

---

### Issue: Agent Not Receiving Tasks

**Symptoms:**
- Specific agent always idle
- Tasks assigned to other agents

**Diagnosis:**
```javascript
const balancer = coordinator.getLoadBalancer();

// Check agent compatibility
const agent = coordinator.getAgentStatus('agent-1');
const task = coordinator.getTask('task-1');

console.log('Agent capabilities:', agent.capabilities);
console.log('Task requirements:', task.requirements.capabilities);

// Check if compatible
const compatible = balancer.isAgentCompatible(agent, task);
console.log('Compatible:', compatible); // false ← PROBLEM!
```

**Solution:**
```javascript
// Option 1: Add missing capabilities
coordinator.updateAgentCapabilities('agent-1', [
  ...agent.capabilities,
  'nodejs',  // Add required capability
  'testing'
]);

// Option 2: Adjust task requirements
task.requirements.capabilities = ['general']; // Less restrictive

// Option 3: Use 'coordinator' type agents (can do any task)
await coordinator.registerAgent('Generalist', 'coordinator', ['general']);
```

---

## Related Documentation

- [Memory Architecture](MEMORY-ARCHITECTURE.md) - Shared memory coordination
- [User Guide](../claude-flow-user-guide-2025-10-14.md) - High-level usage
- [Architecture Deep Dive](../investigation/ARCHITECTURE-DEEP-DIVE.md) - System design
- [SPARC Methodology](../docs/claude-flow-practical-guide-2025.md) - Development workflow

---

**Last Updated:** 2025-10-15
**Authors:** Claude-Flow Team
**License:** MIT
