/**
 * Integrated Session Example
 * Combines SDK features with Claude Flow MCP tools
 */

import { IntegratedClaudeFlowSession } from '../../../src/sdk/claude-flow-mcp-integration';

async function integratedSessionDemo() {
  console.log('🚀 Starting Integrated Session Demo\n');

  // Create integrated session with all features enabled
  const session = new IntegratedClaudeFlowSession({
    // SDK features
    enableSessionForking: true,
    enableQueryControl: true,
    enableCheckpoints: true,
    checkpointInterval: 10,

    // MCP tool configuration
    mcpToolsConfig: {
      swarmTopology: 'mesh',
      maxAgents: 8,
      enableNeural: true,
      enableMemory: true
    },

    // In-process MCP servers (zero overhead)
    inProcessServers: {
      math: true,
      session: true,
      checkpoint: true,
      queryControl: true
    }
  });

  console.log('✅ Integrated session configured\n');

  // Create integrated query with ALL capabilities
  console.log('📝 Creating integrated query...\n');

  const mainQuery = await session.createIntegratedQuery(
    `
    # Multi-Agent Task Orchestration with SDK + MCP Integration

    ## Phase 1: Swarm Initialization (Claude Flow MCP)
    Use mcp__claude-flow__swarm_init to create a mesh topology swarm with 8 agents.

    ## Phase 2: Mathematical Operations (In-Process MCP)
    Use the math MCP server to:
    - Calculate factorial(20)
    - Multiply result by 2
    - Add 1000 to final result

    ## Phase 3: Session Management (In-Process MCP)
    Use session MCP server to:
    - Create new session with ID "math-results"
    - Store calculation results
    - Update session with metadata (timestamp, agent count)

    ## Phase 4: Checkpoint Creation (In-Process MCP)
    Use checkpoint MCP server to:
    - Create checkpoint "after-calculations"
    - List all checkpoints
    - Get checkpoint details

    ## Phase 5: Neural Training (Claude Flow MCP)
    Use mcp__claude-flow__neural_train to train coordination patterns based on:
    - Swarm communication efficiency
    - Task distribution optimization
    - Agent performance metrics

    ## Phase 6: Memory Storage (Claude Flow MCP)
    Use mcp__claude-flow__memory_usage to:
    - Store results in cross-session memory
    - Retrieve previous calculation patterns
    - Update knowledge base

    Report all results in structured format.
    `,
    'integrated-demo-session',
    {
      model: 'claude-sonnet-4',
      maxTurns: 50
    }
  );

  console.log('✅ Query created with SDK + MCP capabilities\n');

  // Process query asynchronously
  console.log('🔄 Processing integrated query...\n');

  let messageCount = 0;
  const messages = [];

  for await (const message of mainQuery) {
    messageCount++;
    messages.push(message);

    console.log(`📨 Message ${messageCount}: ${message.type}`);

    // Show tool usage
    if (message.type === 'assistant' && 'message' in message) {
      const content = message.message.content;

      for (const block of content) {
        if (block.type === 'tool_use') {
          console.log(`   🔧 Tool: ${block.name}`);
          console.log(`   📥 Input: ${JSON.stringify(block.input).substring(0, 100)}...`);
        } else if (block.type === 'text') {
          const text = block.text.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   💬 Text: ${text}...`);
        }
      }
    }

    // Pause demonstration after 10 messages
    if (messageCount === 10) {
      console.log('\n⏸️  Pausing query and creating checkpoint...\n');

      await session.pauseWithCheckpoint(
        mainQuery,
        'integrated-demo-session',
        'Integrated task',
        'Checkpoint after 10 messages'
      );

      console.log('✅ Query paused with checkpoint\n');
      break;
    }
  }

  // Fork session to try different approach
  console.log('🔀 Forking session to try hierarchical topology...\n');

  const fork = await session.forkWithMcpCoordination(
    'integrated-demo-session',
    'Try hierarchical topology instead of mesh'
  );

  console.log(`✅ Fork created: ${fork.sessionId}\n`);

  // Get comprehensive metrics
  console.log('📊 Session Metrics:\n');

  const metrics = session.getMetrics();

  console.log('Query Control:');
  console.log(JSON.stringify(metrics.queryControl, null, 2));

  console.log('\nActive Sessions:');
  console.log(JSON.stringify(metrics.activeSessions, null, 2));

  console.log('\nCheckpoints:');
  console.log(JSON.stringify(metrics.checkpoints, null, 2));

  console.log('\n✨ Integrated session demo complete!\n');
}

// Run the demo
if (require.main === module) {
  integratedSessionDemo()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { integratedSessionDemo };
