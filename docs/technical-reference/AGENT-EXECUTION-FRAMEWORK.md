# Agent Execution Framework

**Version:** Added in v2.0.0, enhanced in v2.7.0-alpha
**Status:** Production-ready

## Overview

The Agent Execution Framework is the core runtime system that manages agent lifecycle, execution strategies, and performance optimization in claude-flow. It provides a pluggable provider architecture supporting multiple execution backends (Claude Code, MCP tools, custom providers) with intelligent routing, parallel execution, and adaptive performance tuning.

The framework handles everything from agent spawning and task distribution to result aggregation and error recovery, ensuring efficient multi-agent coordination at scale.

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Execution Framework                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Execution Coordinator                      │    │
│  │  - Task routing and scheduling                         │    │
│  │  - Agent lifecycle management                          │    │
│  │  - Performance monitoring                              │    │
│  └───────────────────┬────────────────────────────────────┘    │
│                      │                                          │
│      ┌───────────────┼───────────────┐                         │
│      │               │               │                          │
│  ┌───▼──────┐  ┌────▼─────┐  ┌─────▼────┐                    │
│  │ Provider │  │ Strategy │  │ Monitor  │                     │
│  │ Manager  │  │ Selector │  │ & Metrics│                     │
│  └───┬──────┘  └────┬─────┘  └─────┬────┘                    │
│      │              │               │                          │
└──────┼──────────────┼───────────────┼──────────────────────────┘
       │              │               │
   ┌───▼──────────────▼───────────────▼────┐
   │         Execution Providers            │
   ├────────────────────────────────────────┤
   │  ┌──────────┐  ┌──────────┐  ┌──────┐ │
   │  │  Claude  │  │   MCP    │  │Custom│ │
   │  │   Code   │  │  Tools   │  │ API  │ │
   │  └──────────┘  └──────────┘  └──────┘ │
   └────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Execution Coordinator

The central orchestrator managing all agent executions:

```typescript
class ExecutionCoordinator {
  private providers: Map<string, Provider>
  private strategies: Map<string, Strategy>
  private activeAgents: Map<string, Agent>
  private taskQueue: PriorityQueue<Task>
  private metrics: MetricsCollector

  async execute(task: Task, options: ExecutionOptions): Promise<Result> {
    // 1. Select optimal provider
    const provider = await this.selectProvider(task)

    // 2. Choose execution strategy
    const strategy = await this.selectStrategy(task, options)

    // 3. Spawn agents as needed
    const agents = await this.spawnAgents(task, provider)

    // 4. Execute with chosen strategy
    const result = await strategy.execute(agents, task)

    // 5. Collect metrics
    await this.metrics.record(result)

    return result
  }
}
```

#### 2. Provider Manager

Manages multiple execution providers with fallback support:

```typescript
interface Provider {
  name: string
  capabilities: Capability[]
  priority: number

  spawn(agentType: string, config: AgentConfig): Promise<Agent>
  execute(agent: Agent, task: Task): Promise<Result>
  terminate(agent: Agent): Promise<void>
  healthCheck(): Promise<HealthStatus>
}

class ProviderManager {
  private providers: Provider[] = []

  register(provider: Provider): void {
    this.providers.push(provider)
    this.providers.sort((a, b) => b.priority - a.priority)
  }

  async select(task: Task): Promise<Provider> {
    for (const provider of this.providers) {
      if (await provider.canHandle(task)) {
        const health = await provider.healthCheck()
        if (health.status === 'healthy') {
          return provider
        }
      }
    }
    throw new Error('No healthy provider available')
  }
}
```

#### 3. Strategy Selector

Chooses optimal execution strategy based on task characteristics:

```typescript
type ExecutionStrategy =
  | 'parallel'      // All agents execute simultaneously
  | 'sequential'    // One agent at a time
  | 'adaptive'      // Dynamic based on performance
  | 'pipeline'      // Staged execution with handoffs
  | 'competitive'   // Multiple agents, best result wins

interface Strategy {
  name: ExecutionStrategy
  execute(agents: Agent[], task: Task): Promise<Result>
  optimize(metrics: Metrics): void
}

class StrategySelector {
  async select(task: Task, options: ExecutionOptions): Promise<Strategy> {
    // Neural model prediction
    const prediction = await neural.predict({
      model: 'orchestration-v2',
      input: {
        taskComplexity: task.complexity,
        agentCount: task.agents.length,
        dependencies: task.dependencies,
        priority: task.priority
      }
    })

    return this.strategies.get(prediction.recommendedStrategy)
  }
}
```

## Provider System

### Built-in Providers

#### 1. Claude Code Provider (Primary)

Executes agents using Claude Code's native Task tool:

```typescript
class ClaudeCodeProvider implements Provider {
  name = 'claude-code'
  priority = 100  // Highest priority

  async spawn(agentType: string, config: AgentConfig): Promise<Agent> {
    return {
      id: generateId(),
      type: agentType,
      provider: 'claude-code',
      capabilities: AGENT_CAPABILITIES[agentType],
      state: 'ready'
    }
  }

  async execute(agent: Agent, task: Task): Promise<Result> {
    // Use Claude Code's Task tool
    const result = await claudeCode.task({
      agent: agent.type,
      instructions: task.instructions,
      context: task.context,
      hooks: {
        preTask: true,
        postTask: true,
        memory: task.useMemory
      }
    })

    return result
  }
}
```

#### 2. MCP Tools Provider

Coordinates agent behavior using MCP tools:

```typescript
class MCPProvider implements Provider {
  name = 'mcp'
  priority = 50  // Secondary to Claude Code

  async spawn(agentType: string, config: AgentConfig): Promise<Agent> {
    // Use MCP to define agent coordination
    await mcp.call('mcp__claude-flow__agent_spawn', {
      type: agentType,
      capabilities: config.capabilities
    })

    return {
      id: generateId(),
      type: agentType,
      provider: 'mcp',
      state: 'ready'
    }
  }

  async execute(agent: Agent, task: Task): Promise<Result> {
    // MCP orchestrates, Claude Code executes
    return await mcp.call('mcp__claude-flow__task_orchestrate', {
      task: task.description,
      strategy: task.strategy,
      priority: task.priority
    })
  }
}
```

#### 3. Custom Provider

Allows integration with external agent systems:

```typescript
class CustomProvider implements Provider {
  constructor(private config: CustomProviderConfig) {}

  async spawn(agentType: string, config: AgentConfig): Promise<Agent> {
    // Call external API
    const response = await fetch(this.config.endpoint + '/spawn', {
      method: 'POST',
      body: JSON.stringify({ type: agentType, config })
    })

    return response.json()
  }

  async execute(agent: Agent, task: Task): Promise<Result> {
    // Delegate to external system
    const response = await fetch(this.config.endpoint + '/execute', {
      method: 'POST',
      body: JSON.stringify({ agent: agent.id, task })
    })

    return response.json()
  }
}
```

## Execution Strategies

### Parallel Execution

Execute all agents simultaneously for maximum speed:

```typescript
class ParallelStrategy implements Strategy {
  name = 'parallel'

  async execute(agents: Agent[], task: Task): Promise<Result> {
    // Spawn all agents concurrently
    const promises = agents.map(agent =>
      this.executeAgent(agent, task)
    )

    // Wait for all to complete
    const results = await Promise.all(promises)

    // Aggregate results
    return this.aggregate(results)
  }

  private async executeAgent(agent: Agent, task: Task): Promise<AgentResult> {
    const startTime = Date.now()

    try {
      const result = await agent.provider.execute(agent, task)
      return {
        agent: agent.id,
        success: true,
        result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        agent: agent.id,
        success: false,
        error,
        duration: Date.now() - startTime
      }
    }
  }
}
```

### Sequential Execution

Execute agents one at a time, passing context between them:

```typescript
class SequentialStrategy implements Strategy {
  name = 'sequential'

  async execute(agents: Agent[], task: Task): Promise<Result> {
    let context = task.initialContext
    const results: AgentResult[] = []

    for (const agent of agents) {
      // Execute with accumulated context
      const result = await agent.provider.execute(agent, {
        ...task,
        context
      })

      results.push(result)

      // Pass output to next agent
      context = { ...context, ...result.output }
    }

    return this.aggregate(results)
  }
}
```

### Adaptive Execution

Dynamically adjust strategy based on runtime performance:

```typescript
class AdaptiveStrategy implements Strategy {
  name = 'adaptive'
  private performanceHistory: PerformanceMetrics[] = []

  async execute(agents: Agent[], task: Task): Promise<Result> {
    // Start with predicted strategy
    let strategy: Strategy = await this.predictBestStrategy(task)

    // Execute in batches, adapting as we go
    const batches = this.createBatches(agents, strategy)
    const results: AgentResult[] = []

    for (const batch of batches) {
      const batchStart = Date.now()
      const batchResults = await strategy.execute(batch, task)
      const batchDuration = Date.now() - batchStart

      results.push(...batchResults)

      // Analyze performance and adapt if needed
      const shouldAdapt = this.analyzePerformance(
        batchResults,
        batchDuration
      )

      if (shouldAdapt) {
        strategy = await this.adaptStrategy(strategy, batchResults)
      }
    }

    return this.aggregate(results)
  }

  private async predictBestStrategy(task: Task): Promise<Strategy> {
    // Use neural model to predict
    const prediction = await neural.predict({
      model: 'orchestration-v2',
      input: {
        taskType: task.type,
        agentCount: task.agents.length,
        historicalPerformance: this.performanceHistory
      }
    })

    return this.strategies.get(prediction.strategy)
  }
}
```

### Pipeline Execution

Staged execution with specialized agents at each stage:

```typescript
class PipelineStrategy implements Strategy {
  name = 'pipeline'

  async execute(agents: Agent[], task: Task): Promise<Result> {
    // Define pipeline stages
    const stages = this.definePipelineStages(task)

    let artifact = task.initialInput

    for (const stage of stages) {
      // Get agents for this stage
      const stageAgents = agents.filter(a =>
        stage.agentTypes.includes(a.type)
      )

      // Execute stage (can be parallel within stage)
      const stageResult = await this.executeStage(
        stageAgents,
        artifact,
        stage
      )

      // Stage output becomes next stage input
      artifact = stageResult.output

      // Checkpoint progress
      await this.checkpoint(stage.name, artifact)
    }

    return { output: artifact }
  }

  private definePipelineStages(task: Task): Stage[] {
    // Example: Software development pipeline
    return [
      {
        name: 'research',
        agentTypes: ['researcher'],
        parallel: false
      },
      {
        name: 'design',
        agentTypes: ['architect', 'system-architect'],
        parallel: true
      },
      {
        name: 'implementation',
        agentTypes: ['coder', 'backend-dev', 'mobile-dev'],
        parallel: true
      },
      {
        name: 'testing',
        agentTypes: ['tester'],
        parallel: true
      },
      {
        name: 'review',
        agentTypes: ['reviewer', 'security-auditor'],
        parallel: true
      }
    ]
  }
}
```

### Competitive Execution

Multiple agents race, best result wins:

```typescript
class CompetitiveStrategy implements Strategy {
  name = 'competitive'

  async execute(agents: Agent[], task: Task): Promise<Result> {
    // Spawn all agents with same task
    const promises = agents.map(agent =>
      this.executeAgent(agent, task)
    )

    // Race to completion
    const results = await Promise.allSettled(promises)

    // Select best result based on quality metrics
    const best = this.selectBestResult(results, task.qualityMetric)

    // Terminate remaining agents
    await this.terminateOthers(agents, best.agentId)

    return best
  }

  private selectBestResult(
    results: PromiseSettledResult<AgentResult>[],
    qualityMetric: QualityMetric
  ): AgentResult {
    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)

    if (successful.length === 0) {
      throw new Error('All agents failed')
    }

    // Score each result
    const scored = successful.map(result => ({
      result,
      score: qualityMetric.evaluate(result)
    }))

    // Return highest scoring result
    return scored.sort((a, b) => b.score - a.score)[0].result
  }
}
```

## Agent Lifecycle Management

### Lifecycle States

```typescript
enum AgentState {
  CREATED = 'created',       // Agent defined but not spawned
  SPAWNING = 'spawning',     // Spawn in progress
  READY = 'ready',           // Ready to accept tasks
  EXECUTING = 'executing',   // Currently executing task
  WAITING = 'waiting',       // Waiting for dependencies
  PAUSED = 'paused',         // Temporarily paused
  TERMINATING = 'terminating', // Shutdown in progress
  TERMINATED = 'terminated',  // Fully terminated
  FAILED = 'failed'          // Encountered fatal error
}
```

### Lifecycle Hooks

```typescript
class AgentLifecycleManager {
  private hooks: Map<string, LifecycleHook[]> = new Map()

  // Register lifecycle hooks
  onStateChange(
    fromState: AgentState,
    toState: AgentState,
    handler: LifecycleHook
  ): void {
    const key = `${fromState}->${toState}`
    const hooks = this.hooks.get(key) || []
    hooks.push(handler)
    this.hooks.set(key, hooks)
  }

  // Transition agent state
  async transition(
    agent: Agent,
    toState: AgentState
  ): Promise<void> {
    const fromState = agent.state
    const key = `${fromState}->${toState}`

    // Execute pre-transition hooks
    const hooks = this.hooks.get(key) || []
    for (const hook of hooks) {
      await hook.before(agent, fromState, toState)
    }

    // Update state
    agent.state = toState
    agent.lastStateChange = new Date()

    // Execute post-transition hooks
    for (const hook of hooks) {
      await hook.after(agent, fromState, toState)
    }

    // Emit event
    this.events.emit('state-change', {
      agent: agent.id,
      from: fromState,
      to: toState,
      timestamp: new Date()
    })
  }
}
```

### Resource Management

```typescript
class ResourceManager {
  private limits: ResourceLimits
  private usage: Map<string, ResourceUsage> = new Map()

  async allocate(agent: Agent): Promise<Resources> {
    // Check if resources available
    if (!this.hasCapacity(agent.requirements)) {
      // Wait or scale
      await this.waitForCapacity(agent.requirements)
    }

    // Allocate resources
    const resources: Resources = {
      memory: agent.requirements.memory,
      cpu: agent.requirements.cpu,
      disk: agent.requirements.disk,
      network: agent.requirements.network
    }

    this.usage.set(agent.id, {
      allocated: resources,
      used: { memory: 0, cpu: 0, disk: 0, network: 0 },
      timestamp: new Date()
    })

    return resources
  }

  async release(agent: Agent): Promise<void> {
    const usage = this.usage.get(agent.id)
    if (usage) {
      // Return resources to pool
      this.limits.available.memory += usage.allocated.memory
      this.limits.available.cpu += usage.allocated.cpu
      this.limits.available.disk += usage.allocated.disk

      this.usage.delete(agent.id)
    }
  }

  monitor(agent: Agent): ResourceUsage {
    return this.usage.get(agent.id) || {
      allocated: { memory: 0, cpu: 0, disk: 0, network: 0 },
      used: { memory: 0, cpu: 0, disk: 0, network: 0 },
      timestamp: new Date()
    }
  }
}
```

## Performance Optimization Patterns

### 1. Agent Pooling

Reuse agents across tasks to avoid spawn overhead:

```typescript
class AgentPool {
  private pools: Map<string, Agent[]> = new Map()
  private config: PoolConfig

  async acquire(agentType: string): Promise<Agent> {
    const pool = this.pools.get(agentType) || []

    // Return existing agent if available
    if (pool.length > 0) {
      const agent = pool.pop()!
      agent.state = AgentState.READY
      return agent
    }

    // Spawn new agent if under max pool size
    if (pool.length < this.config.maxPoolSize) {
      return await this.spawnAgent(agentType)
    }

    // Wait for agent to become available
    return await this.waitForAvailableAgent(agentType)
  }

  async release(agent: Agent): Promise<void> {
    // Reset agent state
    agent.task = null
    agent.context = {}
    agent.state = AgentState.READY

    // Return to pool
    const pool = this.pools.get(agent.type) || []

    if (pool.length < this.config.maxPoolSize) {
      pool.push(agent)
      this.pools.set(agent.type, pool)
    } else {
      // Pool full, terminate agent
      await agent.provider.terminate(agent)
    }
  }
}
```

### 2. Batch Processing

Process multiple tasks with single agent spawn:

```typescript
class BatchProcessor {
  async processBatch(
    tasks: Task[],
    agentType: string
  ): Promise<Result[]> {
    // Spawn single agent
    const agent = await this.spawnAgent(agentType)
    const results: Result[] = []

    try {
      // Process all tasks with same agent
      for (const task of tasks) {
        const result = await agent.execute(task)
        results.push(result)
      }
    } finally {
      // Always terminate agent
      await agent.terminate()
    }

    return results
  }
}
```

### 3. Lazy Loading

Spawn agents only when needed:

```typescript
class LazyAgentLoader {
  private agents: Map<string, Promise<Agent>> = new Map()

  async get(agentType: string): Promise<Agent> {
    // Return existing promise if spawning
    if (this.agents.has(agentType)) {
      return this.agents.get(agentType)!
    }

    // Start spawning
    const promise = this.spawnAgent(agentType)
    this.agents.set(agentType, promise)

    // Clean up after spawn
    promise.then(() => {
      this.agents.delete(agentType)
    })

    return promise
  }
}
```

### 4. Result Caching

Cache results for idempotent operations:

```typescript
class ResultCache {
  private cache: Map<string, CacheEntry> = new Map()

  async execute(
    agent: Agent,
    task: Task
  ): Promise<Result> {
    const cacheKey = this.generateKey(agent, task)

    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && !this.isExpired(cached)) {
      return cached.result
    }

    // Execute and cache
    const result = await agent.execute(task)

    this.cache.set(cacheKey, {
      result,
      timestamp: new Date(),
      ttl: task.cacheTTL || 3600000  // 1 hour default
    })

    return result
  }

  private generateKey(agent: Agent, task: Task): string {
    return `${agent.type}:${hashObject(task)}`
  }

  private isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp.getTime()
    return age > entry.ttl
  }
}
```

## Usage Examples

### Example 1: Basic Agent Execution

```typescript
import { ExecutionCoordinator } from 'claude-flow'

const coordinator = new ExecutionCoordinator()

// Execute single agent
const result = await coordinator.execute({
  type: 'coder',
  task: {
    description: 'Implement user authentication',
    files: ['src/auth/'],
    requirements: ['JWT tokens', 'bcrypt hashing']
  }
})

console.log(result)
```

### Example 2: Parallel Multi-Agent Execution

```typescript
// Spawn multiple agents in parallel
const result = await coordinator.executeMulti({
  agents: [
    { type: 'researcher', task: 'Research best practices' },
    { type: 'architect', task: 'Design system architecture' },
    { type: 'coder', task: 'Implement core features' },
    { type: 'tester', task: 'Write test suite' }
  ],
  strategy: 'parallel'
})
```

### Example 3: Custom Provider

```typescript
// Register custom provider
coordinator.registerProvider(new CustomProvider({
  endpoint: 'https://my-agent-system.com/api',
  apiKey: process.env.CUSTOM_PROVIDER_KEY
}))

// Use custom provider
const result = await coordinator.execute({
  type: 'specialized-agent',
  provider: 'custom',
  task: { /* ... */ }
})
```

### Example 4: Adaptive Execution

```bash
#!/bin/bash
# CLI usage with adaptive strategy

npx claude-flow@alpha execute \
  --agents "coder,reviewer,tester" \
  --task "Refactor authentication module" \
  --strategy adaptive \
  --max-duration 3600 \
  --quality-threshold 0.9
```

## Troubleshooting

### Issue: Agent Spawn Failures

**Symptoms:**
- Agents fail to spawn
- Timeout errors
- Provider unavailable

**Solutions:**
```bash
# 1. Check provider health
npx claude-flow@alpha providers status

# 2. Verify resource availability
npx claude-flow@alpha resources check

# 3. Try different provider
npx claude-flow@alpha execute \
  --agent coder \
  --task "..." \
  --provider mcp  # Fallback to MCP

# 4. Increase timeout
export CLAUDE_FLOW_SPAWN_TIMEOUT=60000  # 60 seconds
```

### Issue: Poor Performance

**Symptoms:**
- Slow execution times
- High resource usage
- Bottlenecks

**Solutions:**
```bash
# 1. Analyze performance
npx claude-flow@alpha performance analyze

# 2. Use parallel strategy
npx claude-flow@alpha execute \
  --strategy parallel \
  --max-concurrency 5

# 3. Enable agent pooling
export CLAUDE_FLOW_AGENT_POOL=true
export CLAUDE_FLOW_POOL_SIZE=10

# 4. Optimize with neural model
npx claude-flow@alpha neural optimize \
  --target execution-performance
```

### Issue: Memory Leaks

**Symptoms:**
- Growing memory usage
- Agents not terminating
- Resource exhaustion

**Solutions:**
```bash
# 1. Monitor resource usage
npx claude-flow@alpha resources monitor --live

# 2. Force cleanup
npx claude-flow@alpha agents cleanup --force

# 3. Set resource limits
export CLAUDE_FLOW_MAX_MEMORY=4096  # 4GB
export CLAUDE_FLOW_MAX_AGENTS=20

# 4. Enable auto-cleanup
export CLAUDE_FLOW_AUTO_CLEANUP=true
export CLAUDE_FLOW_CLEANUP_INTERVAL=300000  # 5 minutes
```

## Best Practices

1. **Provider Selection**: Use Claude Code as primary, MCP as fallback
2. **Strategy Choice**: Adaptive for complex tasks, parallel for simple tasks
3. **Resource Management**: Set limits and monitor usage
4. **Error Handling**: Implement retries and fallbacks
5. **Performance**: Enable pooling and caching
6. **Monitoring**: Track metrics and analyze bottlenecks
7. **Cleanup**: Always terminate agents when done

## References

- [Provider API Documentation](./PROVIDER-API.md)
- [Execution Strategies Guide](./EXECUTION-STRATEGIES.md)
- [Performance Tuning](./PERFORMANCE-TUNING.md)
- [Resource Management](./RESOURCE-MANAGEMENT.md)
- [ReasoningBank Integration](./REASONINGBANK-INTEGRATION.md)

---

**Last Updated:** 2025-10-16
**Version:** 2.7.0-alpha
**Maintainer:** claude-flow team
