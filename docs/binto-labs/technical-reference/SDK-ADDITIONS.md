# SDK Programmatic Access - Binto Labs Additions

> **Note:** This document contains fork-specific additions to SDK documentation.
>
> For complete upstream documentation, see the main `docs/` directory from [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow).

## Checkpoint Management (Added by Fork)

**Version:** Added in v2.7.0-alpha
**Source:** `src/sdk/checkpoint-manager.ts`

### Quick Summary

Git-like checkpoint system for session state management using Claude Code SDK message UUIDs.

- **Auto-checkpointing** every N messages (configurable)
- **Git-like rollback** using `resumeSessionAt: messageId`
- **5-10ms overhead** for checkpoint creation
- **100-200ms rollback time**
- **Max 50 checkpoints** per session with automatic cleanup

### Architecture

```
┌────────────────────────────────────────┐
│  RealCheckpointManager                 │
│  • createCheckpoint(label, metadata)   │
│  • listCheckpoints()                   │
│  • rollbackTo(checkpointId)            │
│  • EventEmitter lifecycle              │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Claude Code SDK                       │
│  • resumeSessionAt(messageId)          │
│  • getCurrentSessionId()               │
│  • Persistent message storage          │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Checkpoint Storage                    │
│  Location: .claude-flow/checkpoints/   │
│  Format: JSON                          │
│  • checkpoint metadata                 │
│  • message UUID reference              │
└────────────────────────────────────────┘
```

### Key Features

1. **SDK-Native Rollback:**
   - Uses Claude Code SDK's `resumeSessionAt: messageId`
   - No custom state management required
   - Leverages SDK's persistent message storage

2. **Auto-Checkpointing:**
   ```typescript
   const manager = new RealCheckpointManager(client, {
     autoCheckpoint: true,
     autoCheckpointInterval: 10  // Every 10 messages
   });
   ```

3. **Event-Driven Lifecycle:**
   ```typescript
   manager.on('checkpoint:created', (checkpoint) => {
     console.log(`Checkpoint ${checkpoint.id} created`);
   });

   manager.on('checkpoint:restored', (checkpoint) => {
     console.log(`Rolled back to ${checkpoint.label}`);
   });
   ```

### Usage

**Create Checkpoint:**
```typescript
const checkpoint = await manager.createCheckpoint('after-api-impl', {
  feature: 'REST API',
  status: 'tested'
});
// Returns: { id, label, messageId, timestamp, metadata }
```

**Rollback:**
```typescript
await manager.rollbackTo(checkpointId);
// Session continues from that exact message
```

**List Checkpoints:**
```typescript
const checkpoints = manager.listCheckpoints();
// Returns array sorted by newest first
```

### Performance

| Operation | Latency | Notes |
|-----------|---------|-------|
| Create checkpoint | 5-10ms | Metadata write only |
| List checkpoints | <1ms | In-memory cache |
| Rollback | 100-200ms | SDK session restore |

### Configuration Options

```typescript
interface CheckpointConfig {
  maxCheckpoints: number;        // Default: 50
  autoCheckpoint: boolean;       // Default: false
  autoCheckpointInterval: number; // Default: 10 messages
  persistPath: string;           // Default: '.claude-flow/checkpoints'
}
```

### Integration with MCP

```typescript
// Combined SDK + MCP session with checkpointing
const client = await initializeClaudeFlowMCP({
  sessionId: 'my-session',
  checkpointEnabled: true,
  checkpointInterval: 15
});

// Checkpoint automatically created every 15 messages
// MCP coordination + SDK checkpointing work together
```

### Best Practices

1. **Checkpoint Before Risky Operations:**
   ```typescript
   await manager.createCheckpoint('before-refactor');
   // ... perform risky refactoring ...
   ```

2. **Label Descriptively:**
   ```typescript
   await manager.createCheckpoint('tests-passing-v1.2.0', {
     testsPassed: true,
     version: '1.2.0'
   });
   ```

3. **Cleanup Old Checkpoints:**
   ```typescript
   await manager.cleanup(10);  // Keep only last 10
   ```

### Differences from Traditional Checkpoints

| Traditional | SDK-Based (This Implementation) |
|-------------|--------------------------------|
| Custom state serialization | Uses SDK message storage |
| Restore = load state | Restore = resume at message |
| Complex state management | Simple UUID reference |
| Need state validation | SDK handles consistency |

### References

- **Full Documentation:** `docs/binto-labs/technical-reference/CHECKPOINT-MANAGEMENT.md`
- **Implementation:** `src/sdk/checkpoint-manager.ts` (404 lines)
- **API Reference:** `docs/binto-labs/sdk/API-REFERENCE.md`
- **Example:** `docs/binto-labs/sdk/examples/checkpoint-workflow.ts`

---

**For complete SDK documentation, refer to the upstream docs in the main `docs/` directory.**
