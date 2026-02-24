/**
 * Parallel Agent Spawning Example
 * Demonstrates 10-20x performance gain with session forking
 */

import { ParallelSwarmExecutor, ParallelAgentConfig } from '../../../src/sdk/session-forking';

async function parallelAgentsDemo() {
  console.log('🚀 Starting Parallel Agent Spawning Demo\n');

  const executor = new ParallelSwarmExecutor();

  // Listen for events
  executor.on('session:forked', ({ sessionId, agentId }) => {
    console.log(`✅ Agent spawned: ${agentId} (${sessionId})`);
  });

  executor.on('parallel:complete', (result) => {
    console.log('\n🎉 All agents completed!');
    console.log(`Performance gain: ${result.performanceGain.toFixed(1)}x faster\n`);
  });

  // Define agent team
  const agents: ParallelAgentConfig[] = [
    {
      agentId: 'backend-1',
      agentType: 'backend-dev',
      task: 'Build Express REST API with authentication (JWT), authorization middleware, and user management endpoints',
      capabilities: ['nodejs', 'express', 'jwt', 'passport', 'bcrypt'],
      priority: 'critical',
      timeout: 300000 // 5 minutes
    },
    {
      agentId: 'frontend-1',
      agentType: 'coder',
      task: 'Create React dashboard with login flow, protected routes, user profile page, and responsive design',
      capabilities: ['react', 'typescript', 'react-router', 'tailwind'],
      priority: 'high'
    },
    {
      agentId: 'database-1',
      agentType: 'code-analyzer',
      task: 'Design PostgreSQL schema with users, sessions, and audit tables. Include migrations and seed data.',
      capabilities: ['postgresql', 'sequelize', 'migrations'],
      priority: 'critical'
    },
    {
      agentId: 'tester-1',
      agentType: 'tester',
      task: 'Write comprehensive Jest test suite with unit tests, integration tests, and 80% code coverage',
      capabilities: ['jest', 'supertest', 'testing-library'],
      priority: 'high'
    },
    {
      agentId: 'devops-1',
      agentType: 'cicd-engineer',
      task: 'Setup Docker multi-stage build, Docker Compose for local dev, and GitHub Actions CI/CD pipeline',
      capabilities: ['docker', 'docker-compose', 'github-actions'],
      priority: 'medium'
    },
    {
      agentId: 'security-1',
      agentType: 'reviewer',
      task: 'Security audit: review authentication, check for SQL injection, validate input sanitization, test CORS',
      capabilities: ['security', 'owasp', 'code-review'],
      priority: 'high'
    },
    {
      agentId: 'docs-1',
      agentType: 'api-docs',
      task: 'Generate OpenAPI 3.0 specification, write API usage examples, create deployment guide',
      capabilities: ['openapi', 'swagger', 'documentation'],
      priority: 'low'
    },
    {
      agentId: 'performance-1',
      agentType: 'perf-analyzer',
      task: 'Add Redis caching, implement connection pooling, optimize database queries, setup monitoring',
      capabilities: ['redis', 'performance', 'optimization'],
      priority: 'medium'
    }
  ];

  console.log(`📊 Spawning ${agents.length} agents in parallel...\n`);

  const startTime = Date.now();

  // Spawn all agents in parallel
  const result = await executor.spawnParallelAgents(agents, {
    maxParallelAgents: 5, // Spawn 5 at a time
    model: 'claude-sonnet-4',
    timeout: 300000 // 5 minutes per agent
  });

  const totalTime = Date.now() - startTime;

  // Display results
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📈 RESULTS\n');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total Duration: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Successful Agents: ${result.successfulAgents.length}`);
  console.log(`Failed Agents: ${result.failedAgents.length}`);
  console.log(`Performance Gain: ${result.performanceGain.toFixed(1)}x faster\n`);

  // Show individual agent results
  console.log('📋 Agent Results:\n');

  for (const [agentId, agentResult] of result.agentResults.entries()) {
    const statusIcon = agentResult.status === 'completed' ? '✅' : '❌';

    console.log(`${statusIcon} ${agentId}`);
    console.log(`   Status: ${agentResult.status}`);
    console.log(`   Duration: ${(agentResult.duration / 1000).toFixed(2)}s`);
    console.log(`   Messages: ${agentResult.messages.length}`);

    if (agentResult.status === 'completed') {
      const preview = agentResult.output.substring(0, 100).replace(/\n/g, ' ');
      console.log(`   Output: ${preview}...`);
    } else if (agentResult.error) {
      console.log(`   Error: ${agentResult.error.message}`);
    }

    console.log('');
  }

  // Show failed agents (if any)
  if (result.failedAgents.length > 0) {
    console.log('⚠️  Failed Agents:\n');
    result.failedAgents.forEach(agentId => {
      const agentResult = result.agentResults.get(agentId);
      console.log(`- ${agentId}: ${agentResult?.error?.message || 'Unknown error'}`);
    });
    console.log('');
  }

  // Get active sessions
  console.log('🔄 Active Sessions:\n');
  const sessions = executor.getActiveSessions();

  for (const [sessionId, session] of sessions.entries()) {
    console.log(`- ${sessionId}: ${session.status} (${session.agentType})`);
  }

  console.log('');

  // Get performance metrics
  const metrics = executor.getMetrics();

  console.log('📊 Performance Metrics:\n');
  console.log(`Total Agents Spawned: ${metrics.totalAgentsSpawned}`);
  console.log(`Parallel Executions: ${metrics.parallelExecutions}`);
  console.log(`Average Spawn Time: ${metrics.avgSpawnTime.toFixed(2)}ms`);
  console.log(`Performance Gain: ${metrics.performanceGain.toFixed(1)}x\n`);

  // Cleanup old sessions
  console.log('🧹 Cleaning up old sessions...\n');
  executor.cleanupSessions(3600000); // 1 hour

  console.log('✨ Parallel agent demo complete!\n');
}

// Run the demo
if (require.main === module) {
  parallelAgentsDemo()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { parallelAgentsDemo };
