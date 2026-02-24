/**
 * Checkpoint Workflow Example
 * Demonstrates Git-like version control for AI sessions
 */

import { query } from '@anthropic-ai/claude-code';
import { RealCheckpointManager } from '../../../src/sdk/checkpoint-manager';

async function checkpointWorkflow() {
  console.log('🚀 Starting Checkpoint Workflow Demo\n');

  // Initialize checkpoint manager
  const manager = new RealCheckpointManager({
    persistPath: '.claude-flow/checkpoints',
    autoCheckpointInterval: 10, // Auto-checkpoint every 10 messages
    maxCheckpoints: 50 // Keep max 50 checkpoints per session
  });

  // Listen for checkpoint events
  manager.on('checkpoint:created', ({ checkpointId, description }) => {
    console.log(`✅ Checkpoint created: ${description}`);
    console.log(`   ID: ${checkpointId}`);
  });

  manager.on('checkpoint:rollback', ({ checkpointId, description }) => {
    console.log(`⏮️  Rolled back to: ${description}`);
  });

  // Create base query
  const sessionId = 'demo-coding-session';
  const baseQuery = query({
    prompt: `
      Build a REST API with the following features:
      1. User authentication with JWT
      2. CRUD operations for products
      3. PostgreSQL database integration
      4. Unit tests with 80% coverage
    `,
    options: {
      model: 'claude-sonnet-4',
      maxTurns: 100
    }
  });

  console.log('📝 Tracking session with auto-checkpointing...\n');

  // Track session with auto-checkpointing enabled
  const trackingPromise = manager.trackSession(sessionId, baseQuery, true);

  // Create manual checkpoint before authentication implementation
  setTimeout(async () => {
    const authCheckpoint = await manager.createCheckpoint(
      sessionId,
      'Before implementing JWT authentication'
    );
    console.log(`\n📌 Manual checkpoint: ${authCheckpoint}\n`);
  }, 5000);

  // Create checkpoint before database migration
  setTimeout(async () => {
    const dbCheckpoint = await manager.createCheckpoint(
      sessionId,
      'Before PostgreSQL schema migration'
    );
    console.log(`\n📌 Manual checkpoint: ${dbCheckpoint}\n`);
  }, 10000);

  // Wait for session to complete
  await trackingPromise;

  // List all checkpoints
  console.log('\n📋 Listing all checkpoints:\n');
  const checkpoints = manager.listCheckpoints(sessionId);

  checkpoints.forEach((cp, index) => {
    console.log(`${index + 1}. ${cp.description}`);
    console.log(`   Messages: ${cp.messageCount}, Tokens: ${cp.totalTokens}`);
    console.log(`   Files: ${cp.filesModified.join(', ')}`);
    console.log(`   Time: ${new Date(cp.timestamp).toLocaleString()}`);
    console.log('');
  });

  // Compare checkpoints
  if (checkpoints.length >= 2) {
    console.log('🔍 Comparing checkpoints:\n');
    const diff = manager.getCheckpointDiff(
      checkpoints[1].id,
      checkpoints[0].id
    );

    console.log(`Messages added: ${diff.messagesDiff}`);
    console.log(`Tokens used: ${diff.tokensDiff}`);
    console.log(`New files: ${diff.filesAdded.join(', ')}`);
    console.log(`Removed files: ${diff.filesRemoved.join(', ')}\n`);
  }

  // Simulate rollback scenario
  console.log('⚠️  Simulating issue - rolling back to previous checkpoint...\n');

  if (checkpoints.length > 0) {
    const targetCheckpoint = checkpoints[1] || checkpoints[0];

    const rolledBackQuery = await manager.rollbackToCheckpoint(
      targetCheckpoint.id,
      'Fix authentication issues and continue'
    );

    console.log('✅ Rollback successful! Continuing from checkpoint...\n');

    // Process rolled back query
    let messageCount = 0;
    for await (const message of rolledBackQuery) {
      messageCount++;
      console.log(`📨 Message ${messageCount}:`, message.type);

      if (messageCount >= 5) {
        console.log('   ... (truncated for demo)');
        break;
      }
    }
  }

  // Get checkpoint details
  if (checkpoints.length > 0) {
    console.log('\n📊 Checkpoint Details:\n');
    const checkpoint = manager.getCheckpoint(checkpoints[0].id);

    if (checkpoint) {
      console.log(JSON.stringify(checkpoint, null, 2));
    }
  }

  // Cleanup old checkpoints
  console.log('\n🧹 Cleaning up old checkpoints...\n');

  // Delete oldest checkpoint
  if (checkpoints.length > 3) {
    const oldestCheckpoint = checkpoints[checkpoints.length - 1];
    await manager.deleteCheckpoint(oldestCheckpoint.id);
    console.log(`Deleted: ${oldestCheckpoint.description}\n`);
  }

  // List persisted checkpoints
  const persistedIds = await manager.listPersistedCheckpoints();
  console.log(`💾 Persisted checkpoints: ${persistedIds.length}\n`);

  // Load all checkpoints from disk (useful after restart)
  const loaded = await manager.loadAllCheckpoints();
  console.log(`📂 Loaded ${loaded} checkpoints from disk\n`);

  console.log('✨ Checkpoint workflow demo complete!\n');
}

// Run the demo
if (require.main === module) {
  checkpointWorkflow()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { checkpointWorkflow };
