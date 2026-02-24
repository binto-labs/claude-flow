# SDK API Reference - Claude Flow v2.5-alpha.130+

## Table of Contents

1. [Checkpoint Manager](#checkpoint-manager)
2. [Session Forking](#session-forking)
3. [Query Control](#query-control)
4. [MCP Integration](#mcp-integration)
5. [In-Process MCP](#in-process-mcp)
6. [Agent Executor](#agent-executor)
7. [Provider Manager](#provider-manager)

---

## Checkpoint Manager

### Class: `RealCheckpointManager`

Git-like checkpoint management using SDK message UUIDs.

#### Constructor

```typescript
constructor(options?: CheckpointManagerOptions)
```

**Parameters:**
- `options.persistPath?` (string): Directory for checkpoint files. Default: `.claude-flow/checkpoints`
- `options.autoCheckpointInterval?` (number): Messages between auto-checkpoints. Default: `10`
- `options.maxCheckpoints?` (number): Maximum checkpoints per session. Default: `50`

**Example:**
```typescript
const manager = new RealCheckpointManager({
  persistPath: '.claude-flow/checkpoints',
  autoCheckpointInterval: 10,
  maxCheckpoints: 50
});
```

---

#### Method: `trackSession()`

Track messages for a session to enable checkpointing.

```typescript
async trackSession(
  sessionId: string,
  queryGenerator: Query,
  autoCheckpoint?: boolean
): Promise<void>
```

**Parameters:**
- `sessionId` (string): Unique session identifier
- `queryGenerator` (Query): SDK Query generator to track
- `autoCheckpoint?` (boolean): Enable auto-checkpointing. Default: `false`

**Returns:** Promise<void>

**Events Emitted:**
- `message:tracked` - { sessionId, messageCount, messageType, messageUuid }

**Example:**
```typescript
const query = query({ prompt: 'Task description' });

await manager.trackSession('my-session', query, true);
// Automatically creates checkpoints every 10 messages
```

---

#### Method: `createCheckpoint()`

Create a manual checkpoint at the current session state.

```typescript
async createCheckpoint(
  sessionId: string,
  description: string
): Promise<string>
```

**Parameters:**
- `sessionId` (string): Session identifier
- `description` (string): Human-readable checkpoint description

**Returns:** Promise<string> - Checkpoint ID (message UUID)

**Throws:** Error if session not tracked

**Events Emitted:**
- `checkpoint:created` - { checkpointId, sessionId, description, messageCount }

**Example:**
```typescript
const checkpointId = await manager.createCheckpoint(
  'my-session',
  'Before database migration'
);

console.log('Checkpoint created:', checkpointId);
// Output: "msg-uuid-abc-123"
```

---

#### Method: `rollbackToCheckpoint()`

Rollback session to a specific checkpoint using SDK's `resumeSessionAt`.

```typescript
async rollbackToCheckpoint(
  checkpointId: string,
  continuePrompt?: string
): Promise<Query>
```

**Parameters:**
- `checkpointId` (string): Checkpoint ID to rollback to
- `continuePrompt?` (string): Prompt for continuation. Default: `"Continue from checkpoint"`

**Returns:** Promise<Query> - New Query instance from checkpoint state

**Throws:** Error if checkpoint not found

**Events Emitted:**
- `checkpoint:rollback` - { checkpointId, sessionId, description }

**Example:**
```typescript
const rolledBackQuery = await manager.rollbackToCheckpoint(
  checkpointId,
  'Fix issues and continue'
);

// Process rolled back query
for await (const message of rolledBackQuery) {
  console.log('Message from checkpoint:', message);
}
```

---

#### Method: `listCheckpoints()`

List all checkpoints for a session, sorted by timestamp (newest first).

```typescript
listCheckpoints(sessionId: string): Checkpoint[]
```

**Parameters:**
- `sessionId` (string): Session identifier

**Returns:** Checkpoint[] - Array of checkpoint objects

**Example:**
```typescript
const checkpoints = manager.listCheckpoints('my-session');

checkpoints.forEach(cp => {
  console.log(`${cp.description} - ${cp.messageCount} messages, ${cp.totalTokens} tokens`);
});
```

---

#### Method: `getCheckpoint()`

Get detailed information about a specific checkpoint.

```typescript
getCheckpoint(checkpointId: string): Checkpoint | undefined
```

**Parameters:**
- `checkpointId` (string): Checkpoint identifier

**Returns:** Checkpoint | undefined

**Example:**
```typescript
const checkpoint = manager.getCheckpoint('msg-uuid-abc-123');

if (checkpoint) {
  console.log('Files modified:', checkpoint.filesModified);
  console.log('Total tokens:', checkpoint.totalTokens);
  console.log('Message count:', checkpoint.messageCount);
}
```

---

#### Method: `deleteCheckpoint()`

Delete a checkpoint and remove it from persistence.

```typescript
async deleteCheckpoint(checkpointId: string): Promise<void>
```

**Parameters:**
- `checkpointId` (string): Checkpoint to delete

**Returns:** Promise<void>

**Events Emitted:**
- `checkpoint:deleted` - { checkpointId, sessionId }

**Example:**
```typescript
await manager.deleteCheckpoint('old-checkpoint-id');
```

---

#### Method: `getCheckpointDiff()`

Calculate differences between two checkpoints.

```typescript
getCheckpointDiff(fromId: string, toId: string): {
  messagesDiff: number;
  tokensDiff: number;
  filesAdded: string[];
  filesRemoved: string[];
}
```

**Parameters:**
- `fromId` (string): Starting checkpoint ID
- `toId` (string): Ending checkpoint ID

**Returns:** Object with diff statistics

**Throws:** Error if either checkpoint not found

**Example:**
```typescript
const diff = manager.getCheckpointDiff('checkpoint-1', 'checkpoint-2');

console.log('Messages added:', diff.messagesDiff);
console.log('Tokens used:', diff.tokensDiff);
console.log('New files:', diff.filesAdded);
console.log('Removed files:', diff.filesRemoved);
```

---

#### Method: `listPersistedCheckpoints()`

List all checkpoint IDs persisted to disk.

```typescript
async listPersistedCheckpoints(): Promise<string[]>
```

**Returns:** Promise<string[]> - Array of checkpoint IDs

**Example:**
```typescript
const persistedIds = await manager.listPersistedCheckpoints();
console.log('Persisted checkpoints:', persistedIds.length);
```

---

#### Method: `loadAllCheckpoints()`

Load all persisted checkpoints from disk into memory.

```typescript
async loadAllCheckpoints(): Promise<number>
```

**Returns:** Promise<number> - Count of loaded checkpoints

**Events Emitted:**
- `checkpoints:loaded` - { count }

**Example:**
```typescript
const loaded = await manager.loadAllCheckpoints();
console.log('Loaded checkpoints:', loaded);
```

---

### Interface: `Checkpoint`

```typescript
interface Checkpoint {
  id: string;              // Message UUID (checkpoint identifier)
  sessionId: string;       // Session this checkpoint belongs to
  description: string;     // Human-readable description
  timestamp: number;       // Creation timestamp (milliseconds)
  messageCount: number;    // Number of messages at checkpoint
  totalTokens: number;     // Total tokens used up to checkpoint
  filesModified: string[]; // Files modified up to this checkpoint
}
```

---

### Events

The CheckpointManager extends EventEmitter and emits the following events:

#### `message:tracked`
Emitted when a message is tracked in a session.

**Payload:**
```typescript
{
  sessionId: string;
  messageCount: number;
  messageType: string;
  messageUuid: string;
}
```

#### `checkpoint:created`
Emitted when a checkpoint is created.

**Payload:**
```typescript
{
  checkpointId: string;
  sessionId: string;
  description: string;
  messageCount: number;
}
```

#### `checkpoint:rollback`
Emitted when rolling back to a checkpoint.

**Payload:**
```typescript
{
  checkpointId: string;
  sessionId: string;
  description: string;
}
```

#### `checkpoint:deleted`
Emitted when a checkpoint is deleted.

**Payload:**
```typescript
{
  checkpointId: string;
  sessionId: string;
}
```

#### `checkpoint:limit_enforced`
Emitted when old checkpoints are auto-deleted due to limit.

**Payload:**
```typescript
{
  sessionId: string;
  deleted: number;
}
```

#### `persist:saved` / `persist:loaded` / `persist:deleted`
Emitted during disk persistence operations.

**Payload:**
```typescript
{
  checkpointId: string;
  filePath?: string;
}
```

---

## Session Forking

### Class: `ParallelSwarmExecutor`

Spawns agents in parallel using session forking for 10-20x performance gain.

#### Constructor

```typescript
constructor()
```

**Example:**
```typescript
const executor = new ParallelSwarmExecutor();
```

---

#### Method: `spawnParallelAgents()`

Spawn multiple agents in parallel batches.

```typescript
async spawnParallelAgents(
  agentConfigs: ParallelAgentConfig[],
  options?: SessionForkOptions
): Promise<ParallelExecutionResult>
```

**Parameters:**
- `agentConfigs` (ParallelAgentConfig[]): Array of agent configurations
- `options?` (SessionForkOptions): Execution options

**Returns:** Promise<ParallelExecutionResult>

**Events Emitted:**
- `session:forked` - { sessionId, agentId }
- `session:message` - { sessionId, message }
- `parallel:complete` - { result }

**Example:**
```typescript
const agents: ParallelAgentConfig[] = [
  {
    agentId: 'backend-1',
    agentType: 'backend-dev',
    task: 'Build REST API',
    capabilities: ['nodejs', 'express'],
    priority: 'high'
  },
  {
    agentId: 'frontend-1',
    agentType: 'coder',
    task: 'Create React UI',
    capabilities: ['react', 'typescript'],
    priority: 'high'
  }
];

const result = await executor.spawnParallelAgents(agents, {
  maxParallelAgents: 5,
  model: 'claude-sonnet-4'
});

console.log('Performance gain:', result.performanceGain, 'x');
console.log('Successful agents:', result.successfulAgents.length);
```

---

#### Method: `getActiveSessions()`

Get all currently active forked sessions.

```typescript
getActiveSessions(): Map<string, ForkedSession>
```

**Returns:** Map<string, ForkedSession>

**Example:**
```typescript
const sessions = executor.getActiveSessions();

for (const [sessionId, session] of sessions.entries()) {
  console.log(`${sessionId}: ${session.status}`);
}
```

---

#### Method: `getSessionHistory()`

Get message history for a specific session.

```typescript
getSessionHistory(sessionId: string): SDKMessage[] | undefined
```

**Parameters:**
- `sessionId` (string): Session identifier

**Returns:** SDKMessage[] | undefined

**Example:**
```typescript
const history = executor.getSessionHistory('fork-session-123');

if (history) {
  console.log('Messages:', history.length);
}
```

---

#### Method: `getMetrics()`

Get performance metrics for parallel execution.

```typescript
getMetrics(): {
  totalAgentsSpawned: number;
  parallelExecutions: number;
  avgSpawnTime: number;
  performanceGain: number;
}
```

**Returns:** Performance metrics object

**Example:**
```typescript
const metrics = executor.getMetrics();

console.log('Total agents spawned:', metrics.totalAgentsSpawned);
console.log('Average spawn time:', metrics.avgSpawnTime, 'ms');
console.log('Performance gain:', metrics.performanceGain, 'x');
```

---

#### Method: `cleanupSessions()`

Remove completed sessions older than specified time.

```typescript
cleanupSessions(olderThan?: number): void
```

**Parameters:**
- `olderThan?` (number): Age in milliseconds. Default: `3600000` (1 hour)

**Example:**
```typescript
// Clean up sessions older than 30 minutes
executor.cleanupSessions(30 * 60 * 1000);
```

---

### Interface: `ParallelAgentConfig`

```typescript
interface ParallelAgentConfig {
  agentId: string;                                  // Unique agent identifier
  agentType: string;                                // Agent type/role
  task: string;                                     // Task description
  capabilities?: string[];                          // Agent capabilities
  priority?: 'low' | 'medium' | 'high' | 'critical'; // Execution priority
  timeout?: number;                                 // Timeout in milliseconds
}
```

---

### Interface: `SessionForkOptions`

```typescript
interface SessionForkOptions {
  maxParallelAgents?: number;     // Max agents to spawn concurrently (default: 10)
  baseSessionId?: string;         // Base session to fork from
  resumeFromMessage?: string;     // Message UUID to resume from
  sharedMemory?: boolean;         // Enable shared memory
  timeout?: number;               // Timeout per agent
  model?: string;                 // Model to use
  mcpServers?: Record<string, any>; // MCP servers configuration
}
```

---

### Interface: `ParallelExecutionResult`

```typescript
interface ParallelExecutionResult {
  success: boolean;               // True if all agents succeeded
  agentResults: Map<string, {     // Results per agent
    agentId: string;
    output: string;
    messages: SDKMessage[];
    duration: number;
    status: 'completed' | 'failed' | 'terminated';
    error?: Error;
  }>;
  totalDuration: number;          // Total execution time
  failedAgents: string[];         // IDs of failed agents
  successfulAgents: string[];     // IDs of successful agents
}
```

---

## Query Control

### Class: `RealTimeQueryController`

Real-time control of running queries (pause, resume, terminate, model changes).

#### Constructor

```typescript
constructor(options?: QueryControlOptions)
```

**Parameters:**
- `options.allowPause?` (boolean): Enable pause control. Default: `true`
- `options.allowModelChange?` (boolean): Enable model switching. Default: `true`
- `options.allowPermissionChange?` (boolean): Enable permission changes. Default: `true`
- `options.monitoringInterval?` (number): Status update interval (ms). Default: `1000`

**Example:**
```typescript
const controller = new RealTimeQueryController({
  allowPause: true,
  allowModelChange: true,
  monitoringInterval: 1000
});
```

---

#### Method: `registerQuery()`

Register a query for real-time control.

```typescript
registerQuery(queryId: string, agentId: string, query: Query): ControlledQuery
```

**Parameters:**
- `queryId` (string): Unique query identifier
- `agentId` (string): Agent identifier
- `query` (Query): SDK Query instance

**Returns:** ControlledQuery

**Events Emitted:**
- `query:registered` - { queryId, agentId }

**Example:**
```typescript
const myQuery = query({ prompt: 'Long task' });
const controlled = controller.registerQuery('q1', 'agent-1', myQuery);
```

---

#### Method: `pauseQuery()`

Pause a running query.

```typescript
async pauseQuery(queryId: string, reason?: string): Promise<boolean>
```

**Parameters:**
- `queryId` (string): Query to pause
- `reason?` (string): Optional pause reason

**Returns:** Promise<boolean> - True if paused successfully

**Throws:** Error if pause not allowed or query not found

**Events Emitted:**
- `query:paused` - { queryId, reason }

**Example:**
```typescript
await controller.pauseQuery('q1', 'Need to check logs');
```

---

#### Method: `resumeQuery()`

Resume a paused query.

```typescript
async resumeQuery(queryId: string): Promise<boolean>
```

**Parameters:**
- `queryId` (string): Query to resume

**Returns:** Promise<boolean> - True if resumed successfully

**Events Emitted:**
- `query:resumed` - { queryId }

**Example:**
```typescript
await controller.resumeQuery('q1');
```

---

#### Method: `terminateQuery()`

Terminate a query immediately.

```typescript
async terminateQuery(queryId: string, reason?: string): Promise<boolean>
```

**Parameters:**
- `queryId` (string): Query to terminate
- `reason?` (string): Optional termination reason

**Returns:** Promise<boolean> - True if terminated successfully

**Events Emitted:**
- `query:terminated` - { queryId, reason }

**Example:**
```typescript
await controller.terminateQuery('q1', 'Timeout exceeded');
```

---

#### Method: `changeModel()`

Change the model for a running query.

```typescript
async changeModel(queryId: string, model: string): Promise<boolean>
```

**Parameters:**
- `queryId` (string): Query to modify
- `model` (string): New model name

**Returns:** Promise<boolean> - True if changed successfully

**Throws:** Error if model change not allowed or query not running

**Events Emitted:**
- `query:modelChanged` - { queryId, model }

**Example:**
```typescript
await controller.changeModel('q1', 'claude-haiku-4');
```

---

#### Method: `changePermissionMode()`

Change permission mode for a running query.

```typescript
async changePermissionMode(queryId: string, mode: PermissionMode): Promise<boolean>
```

**Parameters:**
- `queryId` (string): Query to modify
- `mode` (PermissionMode): New permission mode

**Returns:** Promise<boolean> - True if changed successfully

**Events Emitted:**
- `query:permissionChanged` - { queryId, mode }

**Example:**
```typescript
await controller.changePermissionMode('q1', 'acceptEdits');
```

---

#### Method: `getSupportedModels()`

Get list of supported models for a query.

```typescript
async getSupportedModels(queryId: string): Promise<ModelInfo[]>
```

**Parameters:**
- `queryId` (string): Query identifier

**Returns:** Promise<ModelInfo[]>

**Example:**
```typescript
const models = await controller.getSupportedModels('q1');

models.forEach(model => {
  console.log(`${model.name}: ${model.description}`);
});
```

---

#### Method: `executeCommand()`

Execute a control command.

```typescript
async executeCommand(command: QueryControlCommand): Promise<boolean>
```

**Parameters:**
- `command` (QueryControlCommand): Command to execute

**Returns:** Promise<boolean>

**Example:**
```typescript
await controller.executeCommand({
  type: 'changeModel',
  queryId: 'q1',
  params: { model: 'claude-opus-4' }
});
```

---

#### Method: `queueCommand()`

Queue a command for later execution.

```typescript
queueCommand(command: QueryControlCommand): void
```

**Parameters:**
- `command` (QueryControlCommand): Command to queue

**Events Emitted:**
- `command:queued` - command

**Example:**
```typescript
controller.queueCommand({
  type: 'pause',
  queryId: 'q1',
  params: { reason: 'Schedule maintenance' }
});
```

---

#### Method: `processQueuedCommands()`

Process all queued commands for a query.

```typescript
async processQueuedCommands(queryId: string): Promise<void>
```

**Parameters:**
- `queryId` (string): Query identifier

**Example:**
```typescript
await controller.processQueuedCommands('q1');
```

---

#### Method: `getQueryStatus()`

Get current status of a query.

```typescript
getQueryStatus(queryId: string): ControlledQuery | undefined
```

**Parameters:**
- `queryId` (string): Query identifier

**Returns:** ControlledQuery | undefined

**Example:**
```typescript
const status = controller.getQueryStatus('q1');

if (status) {
  console.log('Status:', status.status);
  console.log('Duration:', Date.now() - status.startTime, 'ms');
}
```

---

#### Method: `getAllQueries()`

Get all controlled queries.

```typescript
getAllQueries(): Map<string, ControlledQuery>
```

**Returns:** Map<string, ControlledQuery>

**Example:**
```typescript
const queries = controller.getAllQueries();

for (const [id, query] of queries.entries()) {
  console.log(`${id}: ${query.status}`);
}
```

---

#### Method: `unregisterQuery()`

Remove a query from control.

```typescript
unregisterQuery(queryId: string): void
```

**Parameters:**
- `queryId` (string): Query to unregister

**Events Emitted:**
- `query:unregistered` - { queryId }

**Example:**
```typescript
controller.unregisterQuery('q1');
```

---

#### Method: `cleanup()`

Remove completed/terminated queries older than specified time.

```typescript
cleanup(olderThan?: number): void
```

**Parameters:**
- `olderThan?` (number): Age in milliseconds. Default: `3600000` (1 hour)

**Example:**
```typescript
controller.cleanup(30 * 60 * 1000); // 30 minutes
```

---

#### Method: `shutdown()`

Shutdown controller and clean up all resources.

```typescript
shutdown(): void
```

**Example:**
```typescript
controller.shutdown();
```

---

### Interface: `ControlledQuery`

```typescript
interface ControlledQuery {
  queryId: string;
  agentId: string;
  query: Query;
  status: 'running' | 'paused' | 'terminated' | 'completed' | 'failed';
  isPaused: boolean;
  canControl: boolean;
  startTime: number;
  pausedAt?: number;
  resumedAt?: number;
  terminatedAt?: number;
  currentModel?: string;
  permissionMode?: PermissionMode;
}
```

---

### Interface: `QueryControlCommand`

```typescript
interface QueryControlCommand {
  type: 'pause' | 'resume' | 'terminate' | 'changeModel' | 'changePermissions';
  queryId: string;
  params?: {
    model?: string;
    permissionMode?: PermissionMode;
    reason?: string;
  };
}
```

---

## MCP Integration

### Class: `IntegratedClaudeFlowSession`

Combines SDK features with Claude Flow MCP tools.

#### Constructor

```typescript
constructor(config?: ClaudeFlowIntegrationConfig)
```

**Parameters:**
- `config?` (ClaudeFlowIntegrationConfig): Integration configuration

**Example:**
```typescript
const session = new IntegratedClaudeFlowSession({
  enableSessionForking: true,
  enableQueryControl: true,
  enableCheckpoints: true,
  checkpointInterval: 10,
  mcpToolsConfig: {
    swarmTopology: 'mesh',
    maxAgents: 8
  },
  inProcessServers: {
    math: true,
    checkpoint: true
  }
});
```

---

#### Method: `createIntegratedQuery()`

Create a query with SDK + MCP capabilities.

```typescript
async createIntegratedQuery(
  prompt: string,
  sessionId: string,
  options?: Partial<Options>
): Promise<Query>
```

**Parameters:**
- `prompt` (string): Task prompt
- `sessionId` (string): Session identifier
- `options?` (Partial<Options>): Additional SDK options

**Returns:** Promise<Query>

**Example:**
```typescript
const query = await session.createIntegratedQuery(
  'Initialize mesh swarm and calculate factorial(10)',
  'my-session'
);
```

---

#### Method: `forkWithMcpCoordination()`

Fork session with MCP coordination and checkpoint.

```typescript
async forkWithMcpCoordination(
  baseSessionId: string,
  forkDescription: string
): Promise<Fork>
```

**Parameters:**
- `baseSessionId` (string): Base session to fork from
- `forkDescription` (string): Fork description

**Returns:** Promise<Fork>

**Example:**
```typescript
const fork = await session.forkWithMcpCoordination(
  'main-session',
  'Try hierarchical topology'
);
```

---

#### Method: `pauseWithCheckpoint()`

Pause query and create checkpoint at pause point.

```typescript
async pauseWithCheckpoint(
  activeQuery: Query,
  sessionId: string,
  originalPrompt: string,
  checkpointDescription: string
): Promise<string>
```

**Parameters:**
- `activeQuery` (Query): Running query
- `sessionId` (string): Session identifier
- `originalPrompt` (string): Original prompt
- `checkpointDescription` (string): Checkpoint description

**Returns:** Promise<string> - Pause point ID

**Example:**
```typescript
const pauseId = await session.pauseWithCheckpoint(
  query,
  'session-1',
  'Build API',
  'Before deployment'
);
```

---

#### Method: `resumeFromCheckpoint()`

Resume from a checkpoint.

```typescript
async resumeFromCheckpoint(
  checkpointId: string,
  continuePrompt?: string
): Promise<Query>
```

**Parameters:**
- `checkpointId` (string): Checkpoint to resume from
- `continuePrompt?` (string): Continuation prompt

**Returns:** Promise<Query>

**Example:**
```typescript
const resumed = await session.resumeFromCheckpoint(
  checkpointId,
  'Continue from saved point'
);
```

---

#### Method: `getMetrics()`

Get comprehensive metrics from all components.

```typescript
getMetrics(): {
  queryControl: any;
  activeSessions: any;
  checkpoints: { enabled: boolean };
}
```

**Returns:** Metrics object

**Example:**
```typescript
const metrics = session.getMetrics();
console.log('Metrics:', metrics);
```

---

### Interface: `ClaudeFlowIntegrationConfig`

```typescript
interface ClaudeFlowIntegrationConfig {
  // SDK features
  enableSessionForking?: boolean;
  enableQueryControl?: boolean;
  enableCheckpoints?: boolean;
  checkpointInterval?: number;

  // MCP tool configuration
  mcpToolsConfig?: {
    swarmTopology?: 'hierarchical' | 'mesh' | 'ring' | 'star';
    maxAgents?: number;
    enableNeural?: boolean;
    enableMemory?: boolean;
  };

  // In-process MCP servers
  inProcessServers?: {
    math?: boolean;
    session?: boolean;
    checkpoint?: boolean;
    queryControl?: boolean;
  };
}
```

---

## In-Process MCP

### Function: `createMathMcpServer()`

Create in-process math operations MCP server.

```typescript
function createMathMcpServer(): McpSdkServerConfigWithInstance
```

**Returns:** McpSdkServerConfigWithInstance

**Tools Provided:**
- `add` - Add two numbers
- `multiply` - Multiply two numbers
- `factorial` - Calculate factorial

**Example:**
```typescript
import { createMathMcpServer } from './sdk/in-process-mcp';

const query = query({
  prompt: 'Calculate factorial(10)',
  options: {
    mcpServers: {
      math: createMathMcpServer()
    }
  }
});
```

---

### Function: `createSessionMcpServer()`

Create in-process session management MCP server.

```typescript
function createSessionMcpServer(): McpSdkServerConfigWithInstance
```

**Returns:** McpSdkServerConfigWithInstance

**Tools Provided:**
- `session_create` - Create new session
- `session_get` - Get session data
- `session_update` - Update session
- `session_delete` - Delete session
- `session_list` - List all sessions

**Example:**
```typescript
import { createSessionMcpServer } from './sdk/in-process-mcp';

const query = query({
  prompt: 'Create session and store results',
  options: {
    mcpServers: {
      session: createSessionMcpServer()
    }
  }
});
```

---

### Function: `createCheckpointMcpServer()`

Create in-process checkpoint management MCP server.

```typescript
function createCheckpointMcpServer(): McpSdkServerConfigWithInstance
```

**Returns:** McpSdkServerConfigWithInstance

**Tools Provided:**
- `checkpoint_create` - Create checkpoint
- `checkpoint_list` - List checkpoints
- `checkpoint_get` - Get checkpoint details
- `checkpoint_delete` - Delete checkpoint
- `checkpoint_diff` - Compare checkpoints

**Example:**
```typescript
import { createCheckpointMcpServer } from './sdk/in-process-mcp';

const query = query({
  prompt: 'Create checkpoint before changes',
  options: {
    mcpServers: {
      checkpoint: createCheckpointMcpServer()
    }
  }
});
```

---

### Function: `createQueryControlMcpServer()`

Create in-process query control MCP server.

```typescript
function createQueryControlMcpServer(): McpSdkServerConfigWithInstance
```

**Returns:** McpSdkServerConfigWithInstance

**Tools Provided:**
- `query_pause_request` - Request pause
- `query_pause_cancel` - Cancel pause
- `query_paused_list` - List paused queries
- `query_paused_get` - Get paused state
- `query_metrics` - Get metrics

**Example:**
```typescript
import { createQueryControlMcpServer } from './sdk/in-process-mcp';

const query = query({
  prompt: 'Manage query execution',
  options: {
    mcpServers: {
      queryControl: createQueryControlMcpServer()
    }
  }
});
```

---

## Agent Executor

### Class: `AgentExecutor`

Executes agents using agentic-flow with hooks and memory integration.

#### Constructor

```typescript
constructor(hooksManager?: any)
```

**Parameters:**
- `hooksManager?` (any): Optional hooks manager for coordination

**Example:**
```typescript
const executor = new AgentExecutor(hooksManager);
```

---

#### Method: `initializeMemory()`

Initialize ReasoningBank memory database.

```typescript
async initializeMemory(dbPath?: string): Promise<void>
```

**Parameters:**
- `dbPath?` (string): Database path. Default: `.swarm/memory.db`

**Example:**
```typescript
await executor.initializeMemory('.swarm/memory.db');
```

---

#### Method: `execute()`

Execute an agent with options.

```typescript
async execute(options: AgentExecutionOptions): Promise<AgentExecutionResult>
```

**Parameters:**
- `options` (AgentExecutionOptions): Execution configuration

**Returns:** Promise<AgentExecutionResult>

**Example:**
```typescript
const result = await executor.execute({
  agent: 'coder',
  task: 'Build REST API',
  provider: 'anthropic',
  model: 'claude-sonnet-4',
  enableMemory: true,
  memoryRetrievalK: 5
});
```

---

#### Method: `listAgents()`

List available agents.

```typescript
async listAgents(source?: 'all' | 'package' | 'local'): Promise<string[]>
```

**Parameters:**
- `source?` ('all' | 'package' | 'local'): Filter source

**Returns:** Promise<string[]>

**Example:**
```typescript
const agents = await executor.listAgents('package');
console.log('Available agents:', agents);
```

---

#### Method: `getAgentInfo()`

Get information about a specific agent.

```typescript
async getAgentInfo(agentName: string): Promise<any>
```

**Parameters:**
- `agentName` (string): Agent name

**Returns:** Promise<any>

**Example:**
```typescript
const info = await executor.getAgentInfo('coder');
console.log('Agent capabilities:', info);
```

---

#### Method: `getMemoryStats()`

Get ReasoningBank memory statistics.

```typescript
async getMemoryStats(): Promise<any>
```

**Returns:** Promise<any>

**Example:**
```typescript
const stats = await executor.getMemoryStats();
console.log('Memory stats:', stats);
```

---

#### Method: `consolidateMemories()`

Run memory consolidation (deduplication and pruning).

```typescript
async consolidateMemories(): Promise<void>
```

**Example:**
```typescript
await executor.consolidateMemories();
```

---

### Interface: `AgentExecutionOptions`

```typescript
interface AgentExecutionOptions {
  agent: string;
  task: string;
  provider?: 'anthropic' | 'openrouter' | 'onnx' | 'gemini';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  outputFormat?: 'text' | 'json' | 'markdown';
  stream?: boolean;
  verbose?: boolean;
  timeout?: number;

  // ReasoningBank options
  enableMemory?: boolean;
  memoryDatabase?: string;
  memoryRetrievalK?: number;
  memoryLearning?: boolean;
  memoryDomain?: string;
  memoryMinConfidence?: number;
  memoryTaskId?: string;
}
```

---

### Interface: `AgentExecutionResult`

```typescript
interface AgentExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  provider: string;
  model: string;
  tokens?: number;
  cost?: number;
  duration: number;
  agent: string;
  task: string;

  // Memory metrics
  memoryEnabled?: boolean;
  memoriesRetrieved?: number;
  memoriesUsed?: string[];
  memoryLearned?: boolean;
  memoryVerdict?: 'success' | 'failure';
  memoryConfidence?: number;
  newMemoryIds?: string[];
}
```

---

## Provider Manager

### Class: `ProviderManager`

Manages multi-provider configuration and selection.

#### Constructor

```typescript
constructor()
```

**Example:**
```typescript
const manager = new ProviderManager();
```

---

#### Method: `getDefaultProvider()`

Get the default provider.

```typescript
getDefaultProvider(): string
```

**Returns:** string

**Example:**
```typescript
const provider = manager.getDefaultProvider();
console.log('Default provider:', provider);
```

---

#### Method: `setDefaultProvider()`

Set the default provider.

```typescript
async setDefaultProvider(provider: string): Promise<void>
```

**Parameters:**
- `provider` (string): Provider name

**Example:**
```typescript
await manager.setDefaultProvider('openrouter');
```

---

#### Method: `getProviderConfig()`

Get configuration for a specific provider.

```typescript
getProviderConfig(provider: string): ProviderConfig | null
```

**Parameters:**
- `provider` (string): Provider name

**Returns:** ProviderConfig | null

**Example:**
```typescript
const config = manager.getProviderConfig('anthropic');
console.log('Model:', config.model);
```

---

#### Method: `configureProvider()`

Configure a provider.

```typescript
async configureProvider(
  provider: string,
  config: Partial<ProviderConfig>
): Promise<void>
```

**Parameters:**
- `provider` (string): Provider name
- `config` (Partial<ProviderConfig>): Configuration

**Example:**
```typescript
await manager.configureProvider('anthropic', {
  model: 'claude-opus-4',
  priority: 'quality'
});
```

---

#### Method: `listProviders()`

List all configured providers.

```typescript
listProviders(): ProviderConfig[]
```

**Returns:** ProviderConfig[]

**Example:**
```typescript
const providers = manager.listProviders();

providers.forEach(p => {
  console.log(`${p.name}: ${p.model} (${p.priority})`);
});
```

---

#### Method: `getOptimizationStrategy()`

Get current optimization strategy.

```typescript
getOptimizationStrategy(): string
```

**Returns:** string

**Example:**
```typescript
const strategy = manager.getOptimizationStrategy();
console.log('Strategy:', strategy);
```

---

### Interface: `ProviderConfig`

```typescript
interface ProviderConfig {
  name: 'anthropic' | 'openrouter' | 'onnx' | 'gemini';
  model?: string;
  apiKey?: string;
  enabled: boolean;
  priority?: 'cost' | 'quality' | 'speed' | 'privacy';
}
```

---

### Interface: `ExecutionConfig`

```typescript
interface ExecutionConfig {
  defaultProvider: string;
  providers: Record<string, ProviderConfig>;
  optimization?: {
    strategy: 'balanced' | 'cost' | 'quality' | 'speed' | 'privacy';
    maxCostPerTask?: number;
  };
}
```

---

*Generated: 2025-10-16*
*Version: v2.5-alpha.130+*
