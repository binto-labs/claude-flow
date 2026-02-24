# Hive-Mind Technical Reference Guide

**User-Centric Command Reference for Claude-Flow Hive-Mind System**

> This guide focuses on **what users type** to get results. It documents all CLI options, parameters, topologies, strategies, and agent types with practical examples and powerful option combinations ("prompt constructs").

---

## Table of Contents

- [Quick Start](#quick-start)
- [CLI Commands Reference](#cli-commands-reference)
- [Topology Types](#topology-types)
- [Strategy Types](#strategy-types)
- [Agent Types](#agent-types)
- [Prompt Constructs](#prompt-constructs-powerful-combinations)
- [Performance Guide](#performance-guide)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Initialize a hive-mind swarm
npx claude-flow hive-mind init --topology mesh --max-agents 5

# Spawn agents
npx claude-flow hive-mind spawn --type researcher --name "DataExplorer"

# Submit a task
npx claude-flow hive-mind task "Analyze codebase patterns" --priority high

# Check status
npx claude-flow hive-mind status --detailed

# Stop swarm
npx claude-flow hive-mind stop --session swarm_123
```

---

## CLI Commands Reference

### 1. `hive-mind init` - Initialize New Swarm

**Purpose**: Create a new hive-mind swarm with specified configuration.

**Syntax**:
```bash
npx claude-flow hive-mind init [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--topology <type>` | string | No | `hierarchical` | Swarm topology: mesh, hierarchical, ring, star, specs-driven |
| `--max-agents <n>` | number | No | `5` | Maximum number of agents in swarm (1-100) |
| `--name <name>` | string | No | auto-generated | Custom swarm name/identifier |
| `--queen-mode` | boolean | No | `false` | Enable Queen coordinator for centralized control |
| `--memory-ttl <ms>` | number | No | `3600000` | Memory time-to-live in milliseconds (1 hour default) |
| `--consensus-threshold <n>` | number | No | `0.67` | Consensus threshold for decision-making (0.0-1.0) |
| `--auto-spawn` | boolean | No | `false` | Automatically spawn agents based on task requirements |

**Examples**:
```bash
# Basic initialization with defaults
npx claude-flow hive-mind init

# High-performance mesh with 10 agents
npx claude-flow hive-mind init --topology mesh --max-agents 10

# Queen-led hierarchical swarm for complex tasks
npx claude-flow hive-mind init --topology hierarchical --queen-mode --max-agents 15

# Research swarm with consensus voting
npx claude-flow hive-mind init --topology mesh --consensus-threshold 0.75 --max-agents 8
```

**What It Does**:
- Creates swarm coordination structure
- Initializes shared memory pool
- Establishes agent communication channels
- Sets up coordination topology

---

### 2. `hive-mind spawn` - Spawn Agents

**Purpose**: Create specialized agents within the swarm.

**Syntax**:
```bash
npx claude-flow hive-mind spawn [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--type <agent>` | string | Yes | - | Agent type (see Agent Types section) |
| `--name <name>` | string | No | auto-generated | Custom agent name |
| `--capabilities <list>` | array | No | type defaults | Comma-separated capabilities |
| `--swarm-id <id>` | string | No | active swarm | Target swarm identifier |
| `--interactive` | boolean | No | `false` | Interactive agent configuration |
| `--batch <count>` | number | No | `1` | Spawn multiple agents (1-10) |
| `--auto-assign` | boolean | No | `false` | Automatically assign tasks to agent |

**Agent Types** (19 predefined types):
- `coordinator` - Task coordination and orchestration
- `researcher` - Research and information gathering
- `coder` - Code implementation
- `analyst` - Data analysis and insights
- `optimizer` - Performance optimization
- `tester` - Testing and validation
- `reviewer` - Code review and quality
- `architect` - System architecture design
- `backend-dev` - Backend development
- `frontend-dev` - Frontend development
- `ml-developer` - Machine learning
- `devops` - DevOps and CI/CD
- `security` - Security auditing
- `documenter` - Documentation generation
- `planner` - Strategic planning
- `scout` - Information reconnaissance
- `worker` - General task execution
- `guardian` - Quality assurance
- `integrator` - System integration

**Examples**:
```bash
# Spawn single researcher
npx claude-flow hive-mind spawn --type researcher --name "CodeAnalyst"

# Spawn 3 coders in batch
npx claude-flow hive-mind spawn --type coder --batch 3

# Spawn custom analyst with specific capabilities
npx claude-flow hive-mind spawn --type analyst --capabilities "data-mining,pattern-recognition,visualization"

# Spawn coordinator with auto-assignment
npx claude-flow hive-mind spawn --type coordinator --auto-assign
```

**What It Does**:
- Creates agent instance with specified type
- Assigns predefined or custom capabilities
- Connects agent to swarm topology
- Registers agent for task coordination

---

### 3. `hive-mind task` - Task Management

**Purpose**: Submit, manage, and monitor tasks in the swarm.

**Syntax**:
```bash
npx claude-flow hive-mind task "<description>" [options]
# OR
npx claude-flow hive-mind task --list
npx claude-flow hive-mind task --cancel <task-id>
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--priority <level>` | string | No | `medium` | Task priority: low, medium, high, critical |
| `--strategy <type>` | string | No | `adaptive` | Execution strategy: parallel, sequential, adaptive, consensus |
| `--dependencies <ids>` | array | No | `[]` | Comma-separated task IDs that must complete first |
| `--assign-to <agent>` | string | No | auto | Specific agent ID or type to assign |
| `--require-consensus` | boolean | No | `false` | Require swarm consensus before execution |
| `--max-agents <n>` | number | No | `5` | Maximum agents to use for this task |
| `--interactive` | boolean | No | `false` | Interactive task refinement |
| `--watch` | boolean | No | `false` | Watch task progress in real-time |
| `--list` | boolean | No | `false` | List all tasks |
| `--cancel <id>` | string | No | - | Cancel specific task |
| `--retry <id>` | string | No | - | Retry failed task |
| `--timeout <ms>` | number | No | `600000` | Task timeout in milliseconds (10 min default) |

**Examples**:
```bash
# Submit high-priority task
npx claude-flow hive-mind task "Refactor authentication module" --priority high

# Parallel execution with 8 agents
npx claude-flow hive-mind task "Analyze performance bottlenecks" --strategy parallel --max-agents 8

# Sequential workflow with dependencies
npx claude-flow hive-mind task "Run integration tests" --dependencies "task-123,task-456" --strategy sequential

# Consensus-driven decision
npx claude-flow hive-mind task "Select optimal architecture" --require-consensus --strategy consensus

# Watch task execution
npx claude-flow hive-mind task "Deploy to staging" --watch --priority critical

# List all tasks
npx claude-flow hive-mind task --list

# Cancel task
npx claude-flow hive-mind task --cancel task-789
```

**Task Strategies Explained**:
- `parallel` - Execute subtasks concurrently for speed
- `sequential` - Execute subtasks in order for dependencies
- `adaptive` - Automatically choose best approach (default)
- `consensus` - Require agent agreement before proceeding

**What It Does**:
- Decomposes task into subtasks
- Assigns work to available agents
- Coordinates execution based on strategy
- Tracks progress and handles failures

---

### 4. `hive-mind status` - Status Monitoring

**Purpose**: Monitor swarm health, agent activity, and task progress.

**Syntax**:
```bash
npx claude-flow hive-mind status [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--swarm-id <id>` | string | No | active swarm | Specific swarm to monitor |
| `--detailed` | boolean | No | `false` | Show detailed agent information |
| `--memory` | boolean | No | `false` | Include memory usage statistics |
| `--tasks` | boolean | No | `false` | Show task queue and progress |
| `--performance` | boolean | No | `false` | Display performance metrics |
| `--watch` | boolean | No | `false` | Continuous monitoring mode |
| `--json` | boolean | No | `false` | Output in JSON format |

**Examples**:
```bash
# Basic status
npx claude-flow hive-mind status

# Detailed view with all info
npx claude-flow hive-mind status --detailed --memory --tasks --performance

# Watch mode for real-time updates
npx claude-flow hive-mind status --watch

# JSON output for scripting
npx claude-flow hive-mind status --json
```

**What It Shows**:
- Active agents and their states
- Task queue and execution status
- Memory usage and coordination health
- Performance metrics and bottlenecks
- Network topology visualization

---

### 5. `hive-mind stop` - Stop Sessions

**Purpose**: Gracefully stop swarm sessions.

**Syntax**:
```bash
npx claude-flow hive-mind stop [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--session <id>` | string | No | active | Specific session ID to stop |
| `--all` | boolean | No | `false` | Stop all active sessions |
| `--force` | boolean | No | `false` | Force stop without cleanup |

**Examples**:
```bash
# Stop current session
npx claude-flow hive-mind stop

# Stop specific session
npx claude-flow hive-mind stop --session swarm_abc123

# Stop all sessions
npx claude-flow hive-mind stop --all

# Force stop without waiting
npx claude-flow hive-mind stop --force
```

---

### 6. `hive-mind pause` - Pause Sessions

**Purpose**: Temporarily pause swarm execution.

**Syntax**:
```bash
npx claude-flow hive-mind pause [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--session <id>` | string | No | active | Session to pause |

**Examples**:
```bash
# Pause current session
npx claude-flow hive-mind pause

# Pause specific session
npx claude-flow hive-mind pause --session swarm_xyz789
```

---

### 7. `hive-mind resume` - Resume Sessions

**Purpose**: Resume paused swarm execution.

**Syntax**:
```bash
npx claude-flow hive-mind resume [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--session <id>` | string | No | active | Session to resume |

**Examples**:
```bash
# Resume current session
npx claude-flow hive-mind resume

# Resume specific session
npx claude-flow hive-mind resume --session swarm_xyz789
```

---

### 8. `hive-mind ps` - List Processes

**Purpose**: List all active swarm processes.

**Syntax**:
```bash
npx claude-flow hive-mind ps [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--all` | boolean | No | `false` | Show all processes (including stopped) |
| `--verbose` | boolean | No | `false` | Show detailed process information |

**Examples**:
```bash
# List active processes
npx claude-flow hive-mind ps

# Show all processes
npx claude-flow hive-mind ps --all

# Verbose output
npx claude-flow hive-mind ps --verbose
```

---

### 9. `hive-mind wizard` - Interactive Setup

**Purpose**: Guided interactive setup for new users.

**Syntax**:
```bash
npx claude-flow hive-mind wizard [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--skip-intro` | boolean | No | `false` | Skip introduction messages |

**Wizard Actions** (8 guided workflows):
1. **Initialize New Swarm** - Create configured swarm
2. **Spawn Agents** - Add agents interactively
3. **Submit Task** - Create and submit task
4. **Monitor Status** - View swarm health
5. **Optimize Memory** - Memory management
6. **Manage Sessions** - Session control
7. **View Help** - Documentation
8. **Exit Wizard** - Return to CLI

**Examples**:
```bash
# Start wizard
npx claude-flow hive-mind wizard

# Skip introduction
npx claude-flow hive-mind wizard --skip-intro
```

---

### 10. `hive-mind optimize-memory` - Memory Optimization

**Purpose**: Analyze and optimize swarm memory usage.

**Syntax**:
```bash
npx claude-flow hive-mind optimize-memory [options]
```

**Options**:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--analyze` | boolean | No | `false` | Analyze current memory patterns |
| `--optimize` | boolean | No | `false` | Apply optimization strategies |
| `--monitor` | boolean | No | `false` | Real-time memory monitoring |
| `--report` | boolean | No | `false` | Generate memory usage report |
| `--cleanup` | boolean | No | `false` | Clean up expired memory entries |
| `--cache-size <mb>` | number | No | `128` | Maximum cache size in MB |
| `--cache-memory` | boolean | No | `false` | Enable in-memory caching |
| `--compression-threshold <kb>` | number | No | `10` | Compress entries larger than threshold |

**Examples**:
```bash
# Analyze memory usage
npx claude-flow hive-mind optimize-memory --analyze --report

# Optimize and clean up
npx claude-flow hive-mind optimize-memory --optimize --cleanup

# Real-time monitoring
npx claude-flow hive-mind optimize-memory --monitor

# Configure cache
npx claude-flow hive-mind optimize-memory --cache-size 256 --cache-memory
```

**What It Does**:
- Analyzes memory usage patterns
- Identifies memory leaks and inefficiencies
- Applies compression to large entries
- Cleans up expired or unused data
- Optimizes cache configuration

---

## Topology Types

Topologies define how agents communicate and coordinate. Choose based on your use case and scale.

### 1. **Mesh Topology** 🕸️

**Structure**: All agents connected to all others (full peer-to-peer)

**CLI**: `--topology mesh`

**Characteristics**:
- ✅ **Reliability**: 95% (highest)
- ✅ **Redundancy**: Maximum - multiple paths between agents
- ✅ **Consensus**: Excellent for voting and agreement
- ⚠️ **Scalability**: Poor - connections grow quadratically O(N²)
- ⚠️ **Resource Usage**: High - N(N-1)/2 connections

**Best For**:
- Critical decisions requiring high reliability
- Collaborative tasks needing peer coordination
- Small swarms (2-8 agents)
- Consensus-driven workflows
- Distributed decision-making

**Communication Pattern**:
```
Agent A ←→ Agent B
   ↓  ⤢    ↓  ⤡
Agent C ←→ Agent D
```
Every agent connects to every other agent.

**Example**:
```bash
npx claude-flow hive-mind init --topology mesh --max-agents 6 --consensus-threshold 0.67
```

**Latency**: 5-15ms per connection

---

### 2. **Hierarchical Topology** 🏛️ (DEFAULT)

**Structure**: Tree-like with coordinators and workers

**CLI**: `--topology hierarchical`

**Characteristics**:
- ✅ **Scalability**: Excellent - logarithmic growth O(log N)
- ✅ **Organization**: Clear hierarchy and delegation
- ✅ **Reliability**: 85%
- ✅ **Throughput**: √N (logarithmic scaling)
- ⚠️ **Latency**: 2-7ms worker-to-coordinator, 3-11ms coordinator chain
- ⚠️ **Single Point of Failure**: Coordinators are critical

**Best For**:
- Complex tasks requiring clear delegation
- Multi-phase projects with distinct roles
- Large swarms (8+ agents)
- Top-down task distribution
- Queen-led coordination

**Communication Pattern**:
```
    Coordinator
   /     |     \
Worker Worker Worker
        |
   Sub-Coordinator
      /    \
  Worker  Worker
```
Every 4th agent becomes a coordinator.

**Example**:
```bash
npx claude-flow hive-mind init --topology hierarchical --max-agents 15 --queen-mode
```

**Latency**: 2-11ms depending on hierarchy depth

---

### 3. **Ring Topology** 🔄

**Structure**: Agents connected in circular pattern

**CLI**: `--topology ring`

**Characteristics**:
- ✅ **Simplicity**: Minimal connections (N connections)
- ✅ **Resource Efficiency**: Lowest overhead
- ⚠️ **Reliability**: 75% (lowest)
- ⚠️ **Latency**: 3-9ms per hop, O(N) to traverse ring
- ⚠️ **Throughput**: 0.7N (reduced due to bottlenecks)
- ❌ **Fault Tolerance**: Poor - broken link disrupts ring

**Best For**:
- Sequential processing workflows
- Pipeline-style data transformation
- Round-robin task distribution
- Token-passing coordination
- Low-resource environments

**Communication Pattern**:
```
Agent A → Agent B
   ↑         ↓
Agent D ← Agent C
```
Each agent connects only to next agent in circle.

**Example**:
```bash
npx claude-flow hive-mind init --topology ring --max-agents 8
```

**Latency**: 3-9ms per hop

---

### 4. **Star Topology** ⭐

**Structure**: All agents connect to single central hub

**CLI**: `--topology star`

**Characteristics**:
- ✅ **Centralized Control**: Simple coordination through hub
- ✅ **Low Latency**: 2-6ms hub connections
- ✅ **Easy Monitoring**: Hub sees all activity
- ⚠️ **Reliability**: 70% (low)
- ⚠️ **Throughput**: min(N, 10) - limited by hub capacity
- ❌ **Hub Bottleneck**: Single point of failure

**Best For**:
- Centralized hub architectures
- Simple coordination patterns
- Rapid prototyping and testing
- Urgent/critical tasks requiring fast coordination
- Small swarms (3-5 agents)

**Communication Pattern**:
```
    Agent B
       |
Agent A - HUB - Agent C
       |
    Agent D
```
All communication routes through central hub.

**Example**:
```bash
npx claude-flow hive-mind init --topology star --max-agents 5 --priority critical
```

**Latency**: 2-6ms hub connections

---

### Topology Comparison Matrix

| Topology | Reliability | Throughput | Latency | Scalability | Connections | Best Agent Count |
|----------|------------|-----------|---------|-------------|-------------|------------------|
| **Mesh** | 95% ⭐⭐⭐⭐⭐ | N | 5-15ms | Poor (N²) | N(N-1)/2 | 2-8 |
| **Hierarchical** | 85% ⭐⭐⭐⭐ | √N | 2-11ms | Excellent (log N) | ~1.5N | 8-50+ |
| **Ring** | 75% ⭐⭐⭐ | 0.7N | 3-9ms | Good (N) | N | 4-12 |
| **Star** | 70% ⭐⭐⭐ | min(N,10) | 2-6ms | Limited (hub) | N-1 | 3-10 |

---

### Topology Selection Guide

**Decision Flow**:
```
Start
  |
  ├─ Need high reliability & consensus? → MESH
  ├─ Large scale (15+ agents)? → HIERARCHICAL
  ├─ Sequential pipeline workflow? → RING
  ├─ Rapid prototyping / urgent task? → STAR
  └─ Default / unsure? → HIERARCHICAL
```

---

## Strategy Types

Strategies determine how tasks are broken down and executed. They affect work distribution and agent coordination.

### 1. **Auto Strategy** (DEFAULT)

**CLI**: `--strategy auto`

**Description**: ML-inspired intelligent strategy that automatically determines the best approach.

**Work Distribution**:
- Uses machine learning heuristics to analyze tasks
- Parallel pattern detection and task type analysis
- Intelligent task decomposition with batching
- Dynamic agent allocation based on performance history

**Best For**:
- Unknown or complex objectives
- Mixed workloads requiring flexibility
- When optimal strategy is unclear
- General-purpose development tasks

**Behavior Impact**:
- Adaptive task breakdown based on complexity
- Capability-based agent matching (40% weight)
- Performance history consideration (30% weight)
- Current workload balancing (20% weight)
- ML heuristics adjustment (10% weight)

**Example**:
```bash
npx claude-flow hive-mind task "Build user authentication" --strategy auto
```

**Features**:
- Decomposition caching for repeated patterns
- Predictive scheduling with bottleneck detection
- Dynamic complexity estimation
- Agent performance scoring and tracking

---

### 2. **Research Strategy**

**CLI**: `--strategy research`

**Description**: Optimized for research tasks with parallel processing, semantic clustering, and caching.

**Work Distribution** (5 phases):
1. **Query Planning** (5 min) → Create optimized search queries
2. **Parallel Web Search** (10 min) → Execute multiple searches concurrently
3. **Data Extraction** (8 min) → Process sources in parallel
4. **Semantic Clustering** (6 min) → Group related findings
5. **Synthesis & Reporting** (7 min) → Generate comprehensive report

**Best For**:
- Information gathering and research
- Literature reviews and market analysis
- Fact-checking and validation
- Knowledge synthesis from multiple sources

**Behavior Impact**:
- **Connection pooling** for efficient network usage
- **Rate limiting** with exponential backoff
- **Semantic analysis** for result clustering
- **Caching** with 1-hour TTL for repeated queries
- **Credibility scoring** for source ranking

**Example**:
```bash
npx claude-flow hive-mind task "Research AI trends 2024" --strategy research --max-agents 8
```

**Optimizations**:
- Parallel query execution (2.8-4.4x speed improvement)
- Deduplication of results
- Intelligent source ranking by credibility
- Real-time credibility assessment

---

### 3. **Development Strategy**

**CLI**: `--strategy development`

**Description**: Focused on building, implementing, and testing software solutions.

**Work Distribution** (4 phases):
1. **Analysis & Planning** (complexity × 3 min) → Requirements analysis
2. **Parallel Implementation** → Multiple components if possible
3. **Comprehensive Testing** (complexity × 4 min) → Test suite creation
4. **Documentation** (complexity × 2 min) → Documentation generation

**Best For**:
- Software development projects
- API and service creation
- Feature implementation
- Code refactoring and optimization

**Behavior Impact**:
- Parallel implementation if complexity ≥3 and components identified
- Component identification from objective description
- Sequential testing after implementation
- Concurrent documentation generation

**Example**:
```bash
npx claude-flow hive-mind task "Build REST API with auth" --strategy development --max-agents 10
```

**Component Parallelization**:
- Looks for keywords: "components", "modules", "services", "layers"
- Can split into: Core Logic, UI, Data Layer, API Layer, Database
- Limited to 3 parallel components for optimal coordination

---

### 4. **Analysis Strategy**

**CLI**: `--strategy analysis`

**Description**: Specialized for data analysis and insight generation.

**Work Distribution** (3 phases):
1. **Data Collection** (complexity × 4 min) → Research and gather data
2. **Data Analysis** (complexity × 5 min) → Generate insights
3. **Reporting** (complexity × 3 min) → Create analysis report

**Best For**:
- Data analysis tasks
- Performance metrics analysis
- Statistical analysis and modeling
- Business intelligence reporting

**Example**:
```bash
npx claude-flow hive-mind task "Analyze app performance metrics" --strategy analysis
```

---

### 5. **Parallel Strategy**

**CLI**: `--strategy parallel`

**Description**: Maximize concurrency by executing all subtasks simultaneously.

**Best For**:
- Independent subtasks
- When speed is critical
- Tasks that can be split cleanly

**Example**:
```bash
npx claude-flow hive-mind task "Test all API endpoints" --strategy parallel --max-agents 12
```

---

### 6. **Sequential Strategy**

**CLI**: `--strategy sequential`

**Description**: Execute subtasks one after another in order.

**Best For**:
- Strong dependencies between steps
- When order matters
- Pipeline workflows

**Example**:
```bash
npx claude-flow hive-mind task "Deploy with migrations" --strategy sequential
```

---

### 7. **Consensus Strategy**

**CLI**: `--strategy consensus`

**Description**: Require agent agreement before proceeding with execution.

**Best For**:
- Critical decisions
- When multiple perspectives needed
- Validation and approval workflows

**Example**:
```bash
npx claude-flow hive-mind task "Select database architecture" --strategy consensus --require-consensus
```

---

### Strategy Comparison

| Strategy | Best For | Parallelization | Speed | Reliability |
|----------|---------|-----------------|-------|-------------|
| **Auto** | General tasks | Adaptive | Fast | High |
| **Research** | Information gathering | High | Very Fast | Medium |
| **Development** | Software building | Medium | Medium | High |
| **Analysis** | Data insights | Low | Medium | High |
| **Parallel** | Independent tasks | Maximum | Very Fast | Medium |
| **Sequential** | Dependent tasks | None | Slow | Very High |
| **Consensus** | Critical decisions | Low | Slow | Very High |

---

## Agent Types

The hive-mind system supports **112 specialized agent types** organized into categories.

### Core Development Agents (Essential 5)

#### 1. **coder**
- **Type**: developer
- **Specialization**: Writing production-quality code
- **Capabilities**: code_generation, refactoring, optimization, api_design, error_handling
- **Use Cases**: Feature implementation, API development, bug fixes, refactoring
- **CLI**: `--type coder`

**Example**:
```bash
npx claude-flow hive-mind spawn --type coder --name "FeatureBuilder"
```

---

#### 2. **researcher**
- **Type**: analyst
- **Specialization**: Deep investigation and information gathering
- **Capabilities**: code_analysis, pattern_recognition, documentation_research, dependency_tracking
- **Use Cases**: Codebase analysis, dependency mapping, pattern discovery
- **CLI**: `--type researcher`

**Example**:
```bash
npx claude-flow hive-mind spawn --type researcher --capabilities "pattern-recognition,dependency-analysis"
```

---

#### 3. **planner**
- **Type**: coordinator
- **Specialization**: Strategic planning and task decomposition
- **Capabilities**: task_decomposition, dependency_analysis, resource_allocation, timeline_estimation
- **Use Cases**: Project planning, task orchestration, resource management
- **CLI**: `--type planner`

**Example**:
```bash
npx claude-flow hive-mind spawn --type planner --auto-assign
```

---

#### 4. **tester**
- **Type**: quality-assurance
- **Specialization**: Comprehensive testing and validation
- **Capabilities**: unit_testing, integration_testing, e2e_testing, performance_testing, security_testing
- **Use Cases**: Test suite creation, quality validation, performance testing
- **CLI**: `--type tester`

**Example**:
```bash
npx claude-flow hive-mind spawn --type tester --name "QAValidator"
```

---

#### 5. **reviewer**
- **Type**: quality-control
- **Specialization**: Code review and quality assurance
- **Capabilities**: code_review, quality_assessment, security_audit, standards_enforcement
- **Use Cases**: PR reviews, security audits, standards enforcement
- **CLI**: `--type reviewer`

**Example**:
```bash
npx claude-flow hive-mind spawn --type reviewer --name "CodeAuditor"
```

---

### Specialized Agent Categories

#### **Architecture & Design**
- `system-architect` - System architecture and design patterns
- `architecture` - Architectural planning and decisions
- `repo-architect` - Repository structure optimization

#### **Analysis & Performance**
- `code-analyzer` - Code quality and complexity analysis
- `analyst` - General analysis and insights
- `perf-analyzer` - Performance analysis and optimization
- `performance-benchmarker` - Benchmark execution

#### **Development Specializations**
- `backend-dev` - Backend API development
- `mobile-dev` - Mobile application development (iOS/Android)
- `ml-developer` - Machine learning model development
- `api-docs` - API documentation generation

#### **DevOps & CI/CD**
- `cicd-engineer` - CI/CD pipeline management
- `release-manager` - Release coordination
- `production-validator` - Production readiness validation

#### **Swarm Coordination**
- `hierarchical-coordinator` - Tree-based coordination
- `mesh-coordinator` - Peer-to-peer coordination
- `adaptive-coordinator` - Self-adapting coordination
- `collective-intelligence-coordinator` - Group decision making
- `swarm-memory-manager` - Swarm-wide memory management

#### **Consensus & Distributed**
- `byzantine-coordinator` - Byzantine fault-tolerant consensus
- `raft-manager` - Raft consensus protocol
- `gossip-coordinator` - Gossip-based coordination
- `quorum-manager` - Quorum-based decisions
- `crdt-synchronizer` - CRDT data synchronization

#### **SPARC Methodology**
- `sparc-coord` - SPARC methodology coordinator
- `sparc-coder` - SPARC implementation specialist
- `specification` - Requirements specification
- `pseudocode` - Algorithm design
- `refinement` - Code refinement and optimization

#### **GitHub Integration**
- `github-modes` - GitHub workflow modes
- `pr-manager` - Pull request management
- `issue-tracker` - Issue tracking and triage
- `code-review-swarm` - Collaborative code review
- `release-swarm` - Release management swarm
- `multi-repo-swarm` - Multi-repository coordination

#### **Testing & Validation**
- `tdd-london-swarm` - TDD London school approach
- `production-validator` - Production validation

#### **Flow-Nexus Cloud Agents**
- `flow-nexus-swarm` - Cloud swarm orchestration
- `flow-nexus-sandbox` - Cloud sandbox management
- `flow-nexus-neural` - Neural network training
- `flow-nexus-auth` - Authentication management
- `flow-nexus-workflow` - Event-driven workflows

#### **Neural & AI**
- `safla-neural` - SAFLA neural network agent
- `queen-coordinator` - Hive mind queen orchestrator
- `worker-specialist` - Hive mind worker
- `scout-explorer` - Hive mind scout (reconnaissance)

#### **Memory & Optimization**
- `memory-coordinator` - Memory management specialist
- `task-orchestrator` - Task distribution orchestration
- `smart-agent` - Auto-selecting smart agent

#### **Goal Planning**
- `goal-planner` - High-level goal planning
- `code-goal-planner` - Code-specific goal decomposition

---

### Agent Capability Matrix

| Agent | Code | Review | Test | Research | Analysis | Coord |
|-------|------|--------|------|----------|----------|-------|
| coder | ⭐⭐⭐ | ⭐ | ⭐ | ❌ | ⭐ | ❌ |
| researcher | ❌ | ❌ | ❌ | ⭐⭐⭐ | ⭐⭐⭐ | ❌ |
| planner | ❌ | ❌ | ❌ | ⭐ | ⭐ | ⭐⭐⭐ |
| tester | ⭐ | ⭐ | ⭐⭐⭐ | ❌ | ⭐ | ❌ |
| reviewer | ❌ | ⭐⭐⭐ | ⭐ | ❌ | ⭐ | ❌ |
| architect | ❌ | ⭐ | ❌ | ⭐ | ⭐⭐ | ⭐ |
| coordinator | ❌ | ❌ | ❌ | ⭐ | ⭐ | ⭐⭐⭐ |

---

### Agent Coordination Patterns

**Full-Stack Development**:
```
planner → [researcher, architect] → coder → tester → reviewer
```

**Research-Heavy**:
```
researcher → planner → [code-analyzer, architect] → coder → tester
```

**GitHub Integration**:
```
issue-tracker → pr-manager → code-review-swarm → release-manager
```

**Swarm Coordination**:
```
swarm-init → [hierarchical-coordinator, memory-coordinator] → [workers] → collective-intelligence-coordinator
```

---

## Prompt Constructs (Powerful Combinations)

These are battle-tested option combinations that create powerful workflows. Based on performance benchmarks showing measurable improvements.

### 1. **High-Performance Parallel Execution**

**Goal**: Maximum speed with self-organizing agents

**Options**:
```bash
--topology mesh \
--strategy adaptive \
--max-agents 10 \
--auto-spawn
```

**Achieves**:
- 21.4% faster initialization with adaptive scaling
- Self-organizing agent coordination
- Maximum parallel execution

**Best For**:
- Large-scale independent tasks
- When speed is critical
- Tasks that can be fully parallelized

**Complete Example**:
```bash
npx claude-flow hive-mind init --topology mesh --max-agents 10
npx claude-flow hive-mind task "Test all 50 API endpoints" \
  --strategy adaptive \
  --max-agents 10
```

**Performance**: O(log n) scaling, 94-98% success rate with 5-20 agents

---

### 2. **Centralized Strategic Coordination**

**Goal**: Clear chain of command with queen leadership

**Options**:
```bash
--topology hierarchical \
--queen-mode \
--strategy development \
--max-agents 15
```

**Achieves**:
- 38.7% faster decisions with queen coordination (152ms vs 198ms)
- Clear delegation and task distribution
- Scalable to large teams

**Best For**:
- Complex multi-phase projects
- When clear hierarchy is needed
- Enterprise-scale development

**Complete Example**:
```bash
npx claude-flow hive-mind init --topology hierarchical --queen-mode --max-agents 15
npx claude-flow hive-mind task "Build microservices platform" \
  --strategy development \
  --priority high
```

**Performance**: 38.7% faster than distributed consensus

---

### 3. **Distributed Fault-Tolerant Resilience**

**Goal**: Maximum reliability with fault tolerance

**Options**:
```bash
--topology mesh \
--consensus-threshold 0.75 \
--strategy consensus \
--max-agents 8
```

**Achieves**:
- 99.89% availability with Byzantine consensus
- Fault tolerance with redundant paths
- Consensus-driven decision making

**Best For**:
- Critical production systems
- When reliability is paramount
- Decision-making requiring multiple perspectives

**Complete Example**:
```bash
npx claude-flow hive-mind init --topology mesh --consensus-threshold 0.75 --max-agents 8
npx claude-flow hive-mind task "Select database architecture" \
  --strategy consensus \
  --require-consensus \
  --priority critical
```

**Performance**: 99.89% availability, 95% reliability

---

### 4. **Rapid Prototyping Sprint**

**Goal**: Fast iteration for MVPs and prototypes

**Options**:
```bash
--topology star \
--strategy development \
--max-agents 3 \
--auto-spawn
```

**Achieves**:
- 98.2% success rate with 3-5 agents
- Low latency (2-6ms)
- Simple coordination for quick results

**Best For**:
- MVP development
- Rapid prototyping
- Proof-of-concept builds

**Complete Example**:
```bash
npx claude-flow hive-mind init --topology star --max-agents 3
npx claude-flow hive-mind spawn --type coder --batch 2 --auto-assign
npx claude-flow hive-mind task "Build user login MVP" --strategy development
```

**Performance**: 2-6ms latency, optimal for 3-5 agents

---

### 5. **Enterprise-Scale Production**

**Goal**: Large-scale coordination with monitoring

**Options**:
```bash
--topology hierarchical \
--max-agents 20 \
--queen-mode \
--strategy development
```

**Achieves**:
- 92.3% memory efficiency with SQLite storage (15.2x better than in-memory)
- Logarithmic scaling O(log N)
- Enterprise monitoring and control

**Best For**:
- Large development teams (15+ agents)
- Production deployments
- Long-running complex projects

**Complete Example**:
```bash
npx claude-flow hive-mind init --topology hierarchical --max-agents 20 --queen-mode
npx claude-flow hive-mind task "Refactor entire backend" \
  --strategy development \
  --max-agents 20
npx claude-flow hive-mind status --watch --performance
```

**Performance**: 92.3% memory efficiency, scales to 50+ agents

---

### 6. **Research & Analysis Deep Dive**

**Goal**: Comprehensive research with semantic analysis

**Options**:
```bash
--topology mesh \
--strategy research \
--max-agents 8 \
--consensus-threshold 0.67
```

**Achieves**:
- Parallel query execution (2.8-4.4x speed)
- Semantic clustering of findings
- Credibility scoring and ranking

**Best For**:
- Literature reviews
- Market research
- Competitive analysis
- Knowledge synthesis

**Complete Example**:
```bash
npx claude-flow hive-mind init --topology mesh --max-agents 8 --consensus-threshold 0.67
npx claude-flow hive-mind spawn --type researcher --batch 4
npx claude-flow hive-mind task "Research AI safety best practices" \
  --strategy research \
  --max-agents 8
```

**Performance**: 2.8-4.4x speed improvement with parallel queries

---

### 7. **Quality-First Development**

**Goal**: Maximum quality with rigorous testing

**Options**:
```bash
--topology hierarchical \
--strategy development \
--max-agents 12 \
--require-consensus
```

**Achieves**:
- 0.98 reliability with guardian validation
- Comprehensive testing at every phase
- Code review and quality gates

**Best For**:
- Mission-critical systems
- When quality is non-negotiable
- Regulated industries (healthcare, finance)

**Complete Example**:
```bash
npx claude-flow hive-mind init --topology hierarchical --max-agents 12
npx claude-flow hive-mind spawn --type coder --name "MainDev"
npx claude-flow hive-mind spawn --type tester --name "QA" --auto-assign
npx claude-flow hive-mind spawn --type reviewer --name "Guardian" --auto-assign
npx claude-flow hive-mind task "Implement payment processing" \
  --strategy development \
  --require-consensus \
  --priority critical
```

**Performance**: 0.98 reliability score

---

### Prompt Construct Quick Reference

| Construct | Topology | Strategy | Agents | Key Benefit | Performance |
|-----------|----------|----------|--------|-------------|-------------|
| **High-Performance** | mesh | adaptive | 10 | Speed | 21.4% faster init |
| **Centralized** | hierarchical | development | 15 | Clear hierarchy | 38.7% faster decisions |
| **Fault-Tolerant** | mesh | consensus | 8 | Reliability | 99.89% availability |
| **Rapid Prototype** | star | development | 3 | Quick results | 2-6ms latency |
| **Enterprise** | hierarchical | development | 20 | Scale | 92.3% efficiency |
| **Research** | mesh | research | 8 | Deep analysis | 2.8-4.4x speed |
| **Quality-First** | hierarchical | development | 12 | Quality | 0.98 reliability |

---

## Performance Guide

### Optimal Agent Counts

Based on benchmark data:

| Agent Count | Success Rate | Scaling | Best For |
|-------------|--------------|---------|----------|
| 1-2 | 87.5% | N/A | Single tasks |
| 3-5 | 98.2% | Linear | Rapid prototyping |
| 5-20 | 94-98% | O(log n) | **SWEET SPOT** - Most tasks |
| 20-50 | 89-94% | O(log n) | Enterprise scale |
| 50+ | 89.3% | O(log n) | Specialized only |

**Recommendation**: Use 5-20 agents for optimal balance of speed, reliability, and resource usage.

---

### Coordination Performance

**Queen vs Distributed**:
- Queen-led: 152ms average (38.7% faster)
- Distributed: 198ms average
- **Recommendation**: Use queen-mode for faster decisions

**Storage Performance**:
- SQLite: 92.3% efficiency (15.2x better)
- In-memory: 87.1% efficiency
- **Recommendation**: Use SQLite for production (default)

---

### Topology Performance

**Initialization Times** (average):
- Hierarchical: 0.150ms (21.4% faster)
- Mesh: 0.173ms
- Ring: 0.165ms
- Star: 0.142ms (fastest, but limited scale)

**Reliability**:
- Mesh: 95% ⭐⭐⭐⭐⭐
- Hierarchical: 85% ⭐⭐⭐⭐
- Ring: 75% ⭐⭐⭐
- Star: 70% ⭐⭐⭐

---

### Anti-Patterns to Avoid

❌ **Don't**:
1. Use 50+ agents without hierarchical topology (success drops to 89.3%)
2. Use distributed consensus at large scale (28.7% coordination delay)
3. Use in-memory storage for long tasks (only 87.1% efficiency)
4. Use mesh topology with 15+ agents (quadratic connection growth)
5. Use star topology for more than 10 agents (hub bottleneck)

✅ **Do**:
1. Use hierarchical topology for 8+ agents
2. Use queen-mode for 38.7% faster decisions
3. Use SQLite storage (default) for 92.3% efficiency
4. Use mesh topology only for 2-8 agents
5. Use adaptive strategy when unsure

---

## Troubleshooting

### Common Issues

#### Issue: "Swarm failed to initialize"
**Solution**:
```bash
# Check for existing sessions
npx claude-flow hive-mind ps

# Stop conflicting sessions
npx claude-flow hive-mind stop --all

# Retry initialization
npx claude-flow hive-mind init --topology hierarchical
```

---

#### Issue: "Agent spawn failed"
**Solution**:
```bash
# Check swarm status
npx claude-flow hive-mind status

# Verify max-agents not exceeded
npx claude-flow hive-mind status --detailed

# Try with explicit swarm-id
npx claude-flow hive-mind spawn --type coder --swarm-id <id>
```

---

#### Issue: "Task stuck in pending"
**Solution**:
```bash
# Check agent availability
npx claude-flow hive-mind status --tasks

# Spawn more agents if needed
npx claude-flow hive-mind spawn --type worker --batch 3 --auto-assign

# Cancel and retry task
npx claude-flow hive-mind task --cancel <task-id>
npx claude-flow hive-mind task --retry <task-id>
```

---

#### Issue: "High memory usage"
**Solution**:
```bash
# Analyze memory patterns
npx claude-flow hive-mind optimize-memory --analyze --report

# Clean up expired entries
npx claude-flow hive-mind optimize-memory --cleanup

# Optimize cache
npx claude-flow hive-mind optimize-memory --optimize --cache-size 256
```

---

#### Issue: "Poor performance / slow execution"
**Solutions**:

1. **Check agent count** (optimal: 5-20):
```bash
npx claude-flow hive-mind status --detailed
```

2. **Switch to queen-mode** (38.7% faster):
```bash
npx claude-flow hive-mind init --topology hierarchical --queen-mode
```

3. **Use hierarchical topology** for scale:
```bash
npx claude-flow hive-mind init --topology hierarchical --max-agents 15
```

4. **Enable auto-spawn** for dynamic scaling:
```bash
npx claude-flow hive-mind init --auto-spawn
```

---

### Debug Commands

```bash
# View detailed status
npx claude-flow hive-mind status --detailed --memory --tasks --performance

# Watch real-time
npx claude-flow hive-mind status --watch

# Get JSON output for scripting
npx claude-flow hive-mind status --json

# Check all processes
npx claude-flow hive-mind ps --all --verbose

# Memory analysis
npx claude-flow hive-mind optimize-memory --analyze --report
```

---

## Quick Reference Card

### Most Common Commands

```bash
# Initialize swarm
npx claude-flow hive-mind init --topology hierarchical --max-agents 10

# Spawn agents
npx claude-flow hive-mind spawn --type coder --batch 3
npx claude-flow hive-mind spawn --type researcher

# Submit task
npx claude-flow hive-mind task "Your objective" --priority high

# Monitor
npx claude-flow hive-mind status --watch

# Stop
npx claude-flow hive-mind stop
```

---

### Best Practice Defaults

**For most tasks**:
```bash
npx claude-flow hive-mind init --topology hierarchical --max-agents 10 --queen-mode
npx claude-flow hive-mind task "objective" --strategy auto --priority medium
```

**For research**:
```bash
npx claude-flow hive-mind init --topology mesh --max-agents 8
npx claude-flow hive-mind task "research query" --strategy research
```

**For rapid prototyping**:
```bash
npx claude-flow hive-mind init --topology star --max-agents 3
npx claude-flow hive-mind task "build MVP" --strategy development
```

---

## Additional Resources

- **Main Documentation**: [claude-flow README](https://github.com/ruvnet/claude-flow)
- **Binto Labs Guides**: [Documentation Index](../INDEX.md)
- **GitHub Issues**: [Report bugs/features](https://github.com/ruvnet/claude-flow/issues)
- **Performance Benchmarks**: See benchmark data in codebase

---

## Version Information

- **Document Version**: 1.0.0
- **Claude-Flow Version**: 2.0.0+
- **Last Updated**: 2025-10-16
- **Maintainer**: Binto Labs Documentation Team

---

**End of Hive-Mind Technical Reference Guide**
