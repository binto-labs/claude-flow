# Checkpoint Management

**Version:** Added in v2.0.0, enhanced in v2.7.0-alpha
**Status:** Production-ready

## Overview

The Checkpoint Management system provides state preservation and restoration capabilities for claude-flow workflows. It enables long-running tasks to save progress, recover from failures, and resume execution from specific points. Checkpoints capture the complete execution context including agent states, memory snapshots, file changes, and neural model states.

This system is critical for production workflows that need fault tolerance, debugging capabilities, and the ability to experiment with different execution paths from saved states.

## Architecture

### Checkpoint System Design

```
┌────────────────────────────────────────────────────────────┐
│                 Checkpoint Management System                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Checkpoint Coordinator                     │  │
│  │  - Create/restore checkpoints                       │  │
│  │  - Manage checkpoint lifecycle                      │  │
│  │  - Coordinate snapshot collection                   │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │                                    │
│       ┌───────────────┴───────────────┐                   │
│       │                               │                    │
│  ┌────▼──────┐                   ┌───▼────────┐          │
│  │ Snapshot  │                   │  Storage   │          │
│  │ Collector │                   │  Manager   │          │
│  └────┬──────┘                   └───┬────────┘          │
│       │                               │                    │
└───────┼───────────────────────────────┼────────────────────┘
        │                               │
   ┌────▼───────────────────────────────▼─────┐
   │        Checkpoint Components              │
   ├───────────────────────────────────────────┤
   │ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────┐│
   │ │ Agent  │ │ Memory │ │ Files  │ │Model││
   │ │ State  │ │Snapshot│ │ Diff   │ │State││
   │ └────────┘ └────────┘ └────────┘ └─────┘│
   └───────────────────────────────────────────┘
```

### Core Components

#### 1. Checkpoint Coordinator

Central controller for checkpoint operations:

```typescript
class CheckpointCoordinator {
  private storage: CheckpointStorage
  private collectors: SnapshotCollector[]
  private restorers: StateRestorer[]

  async createCheckpoint(
    sessionId: string,
    options: CheckpointOptions = {}
  ): Promise<Checkpoint> {
    const checkpointId = this.generateCheckpointId(sessionId)

    // Collect snapshots from all components
    const snapshots = await this.collectSnapshots({
      agents: options.includeAgents ?? true,
      memory: options.includeMemory ?? true,
      files: options.includeFiles ?? true,
      neural: options.includeNeural ?? true,
      metrics: options.includeMetrics ?? true
    })

    // Create checkpoint metadata
    const checkpoint: Checkpoint = {
      id: checkpointId,
      sessionId,
      timestamp: new Date(),
      description: options.description,
      snapshots,
      metadata: {
        version: this.version,
        creator: options.creator || 'system',
        tags: options.tags || [],
        size: this.calculateSize(snapshots)
      }
    }

    // Store checkpoint
    await this.storage.save(checkpoint)

    // Emit event
    this.events.emit('checkpoint-created', checkpoint)

    return checkpoint
  }

  async restoreCheckpoint(
    checkpointId: string,
    options: RestoreOptions = {}
  ): Promise<RestoredState> {
    // Load checkpoint
    const checkpoint = await this.storage.load(checkpointId)

    // Validate checkpoint
    await this.validateCheckpoint(checkpoint)

    // Restore each component
    const restored: RestoredState = {
      agents: {},
      memory: {},
      files: [],
      neural: {},
      metrics: {}
    }

    for (const restorer of this.restorers) {
      const component = await restorer.restore(
        checkpoint.snapshots,
        options
      )
      Object.assign(restored, component)
    }

    // Emit event
    this.events.emit('checkpoint-restored', {
      checkpointId,
      restored
    })

    return restored
  }
}
```

#### 2. Snapshot Collector

Collects state snapshots from various components:

```typescript
interface SnapshotCollector {
  component: ComponentType
  collect(context: ExecutionContext): Promise<Snapshot>
  validate(snapshot: Snapshot): boolean
}

class AgentStateCollector implements SnapshotCollector {
  component = 'agents'

  async collect(context: ExecutionContext): Promise<Snapshot> {
    const agents = context.activeAgents
    const states: Record<string, AgentState> = {}

    for (const agent of agents) {
      states[agent.id] = {
        type: agent.type,
        state: agent.state,
        currentTask: agent.currentTask,
        context: agent.context,
        resources: agent.allocatedResources,
        metrics: {
          tasksCompleted: agent.metrics.tasksCompleted,
          totalDuration: agent.metrics.totalDuration,
          errorCount: agent.metrics.errorCount
        }
      }
    }

    return {
      component: 'agents',
      timestamp: new Date(),
      data: states,
      size: JSON.stringify(states).length
    }
  }
}

class MemorySnapshotCollector implements SnapshotCollector {
  component = 'memory'

  async collect(context: ExecutionContext): Promise<Snapshot> {
    // Export all memory entries
    const memoryDump = await memory.export({
      namespace: context.sessionId,
      includeMetadata: true
    })

    return {
      component: 'memory',
      timestamp: new Date(),
      data: memoryDump,
      size: JSON.stringify(memoryDump).length
    }
  }
}

class FilesDiffCollector implements SnapshotCollector {
  component = 'files'

  async collect(context: ExecutionContext): Promise<Snapshot> {
    // Collect file changes since session start
    const changes = await git.diff({
      from: context.sessionStart,
      to: 'HEAD',
      includeUntracked: true
    })

    return {
      component: 'files',
      timestamp: new Date(),
      data: {
        modified: changes.modified,
        created: changes.created,
        deleted: changes.deleted,
        patches: changes.patches
      },
      size: changes.patches.reduce((sum, p) => sum + p.length, 0)
    }
  }
}

class NeuralModelCollector implements SnapshotCollector {
  component = 'neural'

  async collect(context: ExecutionContext): Promise<Snapshot> {
    // Save neural model states
    const models = await neural.listActiveModels()
    const states: Record<string, ModelState> = {}

    for (const model of models) {
      states[model.id] = {
        weights: await neural.exportWeights(model.id),
        optimizer: await neural.getOptimizerState(model.id),
        trainingProgress: model.trainingProgress,
        metrics: model.metrics
      }
    }

    return {
      component: 'neural',
      timestamp: new Date(),
      data: states,
      size: Object.values(states).reduce(
        (sum, s) => sum + s.weights.byteLength,
        0
      )
    }
  }
}
```

#### 3. Storage Manager

Manages checkpoint persistence:

```typescript
interface CheckpointStorage {
  save(checkpoint: Checkpoint): Promise<void>
  load(checkpointId: string): Promise<Checkpoint>
  list(filter?: CheckpointFilter): Promise<CheckpointMetadata[]>
  delete(checkpointId: string): Promise<void>
  compress(checkpointId: string): Promise<void>
}

class FileSystemStorage implements CheckpointStorage {
  private basePath: string = '.swarm/checkpoints'

  async save(checkpoint: Checkpoint): Promise<void> {
    const path = this.getCheckpointPath(checkpoint.id)

    // Create directory structure
    await fs.mkdir(path, { recursive: true })

    // Save metadata
    await fs.writeFile(
      `${path}/metadata.json`,
      JSON.stringify(checkpoint.metadata, null, 2)
    )

    // Save each snapshot
    for (const snapshot of checkpoint.snapshots) {
      await this.saveSnapshot(path, snapshot)
    }

    // Create index entry
    await this.updateIndex(checkpoint)
  }

  async load(checkpointId: string): Promise<Checkpoint> {
    const path = this.getCheckpointPath(checkpointId)

    // Load metadata
    const metadata = JSON.parse(
      await fs.readFile(`${path}/metadata.json`, 'utf-8')
    )

    // Load snapshots
    const snapshots: Snapshot[] = []
    for (const component of ['agents', 'memory', 'files', 'neural']) {
      const snapshot = await this.loadSnapshot(path, component)
      if (snapshot) snapshots.push(snapshot)
    }

    return {
      id: checkpointId,
      sessionId: metadata.sessionId,
      timestamp: new Date(metadata.timestamp),
      description: metadata.description,
      snapshots,
      metadata
    }
  }

  private async saveSnapshot(
    basePath: string,
    snapshot: Snapshot
  ): Promise<void> {
    const filename = `${basePath}/${snapshot.component}.json`

    // Compress large snapshots
    if (snapshot.size > 1024 * 1024) {  // >1MB
      const compressed = await this.compress(snapshot.data)
      await fs.writeFile(`${filename}.gz`, compressed)
    } else {
      await fs.writeFile(filename, JSON.stringify(snapshot.data, null, 2))
    }
  }
}
```

## Creating Checkpoints

### Manual Checkpoint Creation

```bash
# Create checkpoint with default settings
npx claude-flow@alpha checkpoint create \
  --session-id "session-123" \
  --description "Before major refactoring"

# Create checkpoint with specific components
npx claude-flow@alpha checkpoint create \
  --session-id "session-123" \
  --include agents,memory,files \
  --exclude neural \
  --tags "refactoring,pre-change"

# Create named checkpoint
npx claude-flow@alpha checkpoint create \
  --session-id "session-123" \
  --name "stable-v1" \
  --description "Stable state after authentication implementation"
```

### Automatic Checkpoint Creation

Configure automatic checkpoints via hooks:

```typescript
// Auto-checkpoint after major milestones
hooks.register('post-task', async (context) => {
  if (context.task.milestone) {
    await checkpoints.create(context.sessionId, {
      description: `After ${context.task.description}`,
      tags: ['auto', 'milestone'],
      creator: 'hooks-system'
    })
  }
})

// Auto-checkpoint before risky operations
hooks.register('pre-task', async (context) => {
  if (context.task.risk === 'high') {
    await checkpoints.create(context.sessionId, {
      description: `Before ${context.task.description}`,
      tags: ['auto', 'safety', 'pre-risky'],
      creator: 'safety-system'
    })
  }
})

// Periodic auto-checkpoints
setInterval(async () => {
  const activeSessions = await sessions.getActive()
  for (const session of activeSessions) {
    await checkpoints.create(session.id, {
      description: 'Periodic auto-checkpoint',
      tags: ['auto', 'periodic'],
      creator: 'scheduler'
    })
  }
}, 30 * 60 * 1000)  // Every 30 minutes
```

## Restoring Checkpoints

### Full Restoration

```bash
# Restore complete checkpoint
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --confirm

# Restore with verification
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --verify \
  --dry-run

# Restore specific components only
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --components memory,files \
  --skip-agents
```

### Partial Restoration

```typescript
// Restore only memory state
const restored = await checkpoints.restore('ckpt-abc123', {
  components: ['memory'],
  skipValidation: false
})

// Restore agents with custom configuration
const restored = await checkpoints.restore('ckpt-abc123', {
  components: ['agents'],
  agentConfig: {
    respawn: true,
    preserveResources: false,
    updateCapabilities: true
  }
})

// Restore files selectively
const restored = await checkpoints.restore('ckpt-abc123', {
  components: ['files'],
  fileFilter: (file) => file.path.startsWith('src/')
})
```

### Differential Restoration

Restore only changes between checkpoints:

```bash
# Show differences between checkpoints
npx claude-flow@alpha checkpoint diff \
  --from "ckpt-abc123" \
  --to "ckpt-xyz789"

# Restore only the differences
npx claude-flow@alpha checkpoint restore-diff \
  --from "ckpt-abc123" \
  --to "ckpt-xyz789" \
  --target current
```

## Session State Preservation

### Session Snapshots

Complete session state including all context:

```typescript
interface SessionSnapshot {
  sessionId: string
  startTime: Date
  currentTime: Date

  // Execution context
  activeAgents: AgentState[]
  taskQueue: Task[]
  completedTasks: TaskResult[]

  // Memory state
  memoryEntries: MemoryEntry[]
  cacheState: CacheSnapshot

  // File system state
  workingDirectory: string
  fileChanges: FileDiff[]
  gitState: GitState

  // Neural state
  activeModels: ModelState[]
  trainingJobs: TrainingJob[]
  predictions: PredictionHistory[]

  // Performance metrics
  metrics: SessionMetrics
  resourceUsage: ResourceSnapshot

  // Configuration
  config: SessionConfig
  environment: EnvironmentVariables
}

class SessionManager {
  async snapshot(sessionId: string): Promise<SessionSnapshot> {
    return {
      sessionId,
      startTime: this.getSessionStart(sessionId),
      currentTime: new Date(),
      activeAgents: await this.snapshotAgents(sessionId),
      taskQueue: await this.snapshotTasks(sessionId),
      completedTasks: await this.snapshotResults(sessionId),
      memoryEntries: await memory.export({ namespace: sessionId }),
      cacheState: await cache.snapshot(),
      workingDirectory: process.cwd(),
      fileChanges: await git.status(),
      gitState: await git.getState(),
      activeModels: await neural.snapshotModels(),
      trainingJobs: await neural.getActiveJobs(),
      predictions: await neural.getPredictionHistory(),
      metrics: await metrics.getSessionMetrics(sessionId),
      resourceUsage: await resources.snapshot(),
      config: this.getSessionConfig(sessionId),
      environment: this.snapshotEnvironment()
    }
  }

  async restore(snapshot: SessionSnapshot): Promise<void> {
    // Restore execution context
    await this.restoreAgents(snapshot.activeAgents)
    await this.restoreTasks(snapshot.taskQueue)

    // Restore memory
    await memory.import(snapshot.memoryEntries, {
      namespace: snapshot.sessionId
    })

    // Restore file system
    await this.restoreFiles(snapshot.fileChanges)
    await git.restore(snapshot.gitState)

    // Restore neural state
    await neural.restoreModels(snapshot.activeModels)
    await neural.restoreJobs(snapshot.trainingJobs)

    // Restore configuration
    await this.restoreConfig(snapshot.config)
  }
}
```

### Cross-Session Persistence

Share state between sessions:

```bash
# Export session for later use
npx claude-flow@alpha session export \
  --session-id "session-123" \
  --output session-123.json

# Import session in new environment
npx claude-flow@alpha session import \
  --input session-123.json \
  --new-session-id "session-456"

# Clone session state
npx claude-flow@alpha session clone \
  --source "session-123" \
  --target "session-124-experiment"
```

## Best Practices for Checkpoint Usage

### 1. Checkpoint Naming Strategy

```bash
# Use descriptive names with context
npx claude-flow@alpha checkpoint create \
  --name "auth-implementation-complete" \
  --description "Fully working authentication with tests passing"

# Include version numbers
npx claude-flow@alpha checkpoint create \
  --name "v1.2.0-release-candidate" \
  --tags "release,stable"

# Mark experimental checkpoints
npx claude-flow@alpha checkpoint create \
  --name "experiment-new-architecture" \
  --tags "experimental,temporary"
```

### 2. Checkpoint Cleanup

```bash
# Delete old checkpoints
npx claude-flow@alpha checkpoint cleanup \
  --older-than "30 days" \
  --keep-tagged "stable,release"

# Compress large checkpoints
npx claude-flow@alpha checkpoint compress \
  --checkpoint-id "ckpt-abc123"

# Archive to external storage
npx claude-flow@alpha checkpoint archive \
  --checkpoint-id "ckpt-abc123" \
  --destination "s3://my-bucket/checkpoints/"
```

### 3. Checkpoint Validation

```bash
# Verify checkpoint integrity
npx claude-flow@alpha checkpoint verify \
  --checkpoint-id "ckpt-abc123"

# Test restoration without applying
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --dry-run \
  --verbose

# Compare checkpoint to current state
npx claude-flow@alpha checkpoint compare \
  --checkpoint-id "ckpt-abc123" \
  --to current
```

### 4. Integration with Workflows

```typescript
// Checkpoint at workflow stages
class WorkflowExecutor {
  async executeStage(stage: Stage): Promise<StageResult> {
    // Create pre-stage checkpoint
    const preCheckpoint = await checkpoints.create(this.sessionId, {
      description: `Before ${stage.name}`,
      tags: ['workflow', 'pre-stage', stage.name]
    })

    try {
      const result = await stage.execute()

      // Create post-stage checkpoint on success
      await checkpoints.create(this.sessionId, {
        description: `After ${stage.name}`,
        tags: ['workflow', 'post-stage', stage.name, 'success']
      })

      return result
    } catch (error) {
      // Keep pre-stage checkpoint for recovery
      console.error(`Stage ${stage.name} failed, can restore from ${preCheckpoint.id}`)
      throw error
    }
  }
}
```

## Troubleshooting

### Issue: Checkpoint Creation Fails

**Symptoms:**
- Checkpoint creation timeouts
- Incomplete snapshots
- Storage errors

**Solutions:**
```bash
# 1. Check disk space
df -h .swarm/checkpoints

# 2. Reduce checkpoint size
npx claude-flow@alpha checkpoint create \
  --exclude neural \  # Exclude large components
  --compress

# 3. Increase timeout
export CLAUDE_FLOW_CHECKPOINT_TIMEOUT=300000  # 5 minutes

# 4. Use incremental checkpoints
npx claude-flow@alpha checkpoint create \
  --incremental \
  --since "ckpt-previous"
```

### Issue: Restoration Conflicts

**Symptoms:**
- File conflicts during restoration
- Agent state mismatches
- Memory inconsistencies

**Solutions:**
```bash
# 1. Check for conflicts before restoring
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --check-conflicts \
  --no-apply

# 2. Use merge strategy
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --conflict-resolution merge \
  --prefer current  # or 'checkpoint'

# 3. Selective restoration
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --components memory \  # Restore only non-conflicting parts
  --skip files

# 4. Clean restore (discard current state)
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --force \
  --clean
```

### Issue: Large Checkpoint Size

**Symptoms:**
- Checkpoints taking up too much disk space
- Slow checkpoint creation/restoration
- Storage quota exceeded

**Solutions:**
```bash
# 1. Compress existing checkpoints
npx claude-flow@alpha checkpoint compress-all

# 2. Exclude unnecessary components
npx claude-flow@alpha checkpoint create \
  --exclude "neural,metrics" \
  --files-ignore "node_modules,dist"

# 3. Use incremental checkpoints
npx claude-flow@alpha checkpoint create \
  --incremental \
  --base "ckpt-previous"

# 4. Archive old checkpoints
npx claude-flow@alpha checkpoint archive \
  --older-than "7 days" \
  --destination "/archive/checkpoints"
```

## Integration with Workflows

### Git Integration

```bash
# Create checkpoint tied to git commit
npx claude-flow@alpha checkpoint create \
  --git-commit HEAD \
  --description "Checkpoint at commit $(git rev-parse --short HEAD)"

# Restore to specific git state
npx claude-flow@alpha checkpoint restore \
  --checkpoint-id "ckpt-abc123" \
  --reset-git
```

### CI/CD Integration

```yaml
# .github/workflows/checkpoint.yml
name: Create Checkpoint
on:
  push:
    branches: [main]

jobs:
  checkpoint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Create checkpoint
        run: |
          npx claude-flow@alpha checkpoint create \
            --session-id "${{ github.run_id }}" \
            --name "ci-${{ github.sha }}" \
            --description "Automated checkpoint from CI" \
            --tags "ci,automated,stable"
```

## References

- [Session Management](./SESSION-MANAGEMENT.md)
- [Memory System](./MEMORY-SYSTEM.md)
- [Agent Execution Framework](./AGENT-EXECUTION-FRAMEWORK.md)
- [Git Integration](./GIT-INTEGRATION.md)
- [Workflow Automation](./WORKFLOW-AUTOMATION.md)

---

**Last Updated:** 2025-10-16
**Version:** 2.7.0-alpha
**Maintainer:** claude-flow team
