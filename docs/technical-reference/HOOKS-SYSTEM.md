# Claude-Flow Hooks System: Technical Reference

**Version:** v2.5.0-alpha.140
**Last Updated:** 2025-10-15
**Audience:** Developers, architects, contributors

---

## Table of Contents

1. [Overview](#overview)
2. [Hook Architecture](#hook-architecture)
3. [Hook Lifecycle](#hook-lifecycle)
4. [Pre-Operation Hooks](#pre-operation-hooks)
5. [Post-Operation Hooks](#post-operation-hooks)
6. [MCP Integration Hooks](#mcp-integration-hooks)
7. [Session Management Hooks](#session-management-hooks)
8. [PreToolUse Modification Hooks](#pretooluse-modification-hooks)
9. [Memory Integration](#memory-integration)
10. [Neural Training Integration](#neural-training-integration)
11. [Performance Hooks](#performance-hooks)
12. [Custom Hook Creation](#custom-hook-creation)
13. [API Reference](#api-reference)
14. [Real-World Examples](#real-world-examples)
15. [Troubleshooting](#troubleshooting)

---

## Overview

Claude-Flow implements a **comprehensive hooks system** that automatically coordinates agent actions, persists state, trains neural patterns, and optimizes performance. The hooks system enables:

1. **Automatic Coordination**: Agents self-coordinate without manual intervention
2. **Persistent Memory**: All decisions and context stored across sessions
3. **Neural Learning**: Continuous improvement from operation patterns
4. **Performance Tracking**: Real-time metrics and bottleneck analysis
5. **Safety Validation**: Pre-execution checks prevent dangerous operations

### Key Design Principles

1. **Event-Driven Architecture**: Hooks trigger on specific lifecycle events
2. **Persistent State**: All hook data stored in SQLite (.swarm/memory.db)
3. **Zero Configuration**: Hooks work automatically when enabled
4. **Composable**: Hooks can be chained for complex workflows
5. **Extensible**: Custom hooks can be registered programmatically

---

## Hook Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Code Application                      │
│              (MCP Tools, Task Tool, File Operations)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────▼───────────────┐
         │     Claude Flow CLI           │
         │   `hooks <subcommand>`        │
         └───┬───────────────────────┬───┘
             │                       │
    ┌────────▼──────┐       ┌───────▼───────────┐
    │ Hook Manager   │       │  Memory Store     │
    │ (hook-types.ts)│       │  (sqlite-store.js)│
    └────┬───────────┘       └────────┬──────────┘
         │                            │
    ┌────▼────────────────────────────▼──────────┐
    │        Agentic Flow Hooks Manager          │
    │         (hook-manager.ts)                  │
    │  • Hook Registration & Execution           │
    │  • Pipeline Management                     │
    │  • Side Effect Processing                  │
    └──┬──────────────┬─────────────┬────────────┘
       │              │             │
  ┌────▼────┐   ┌────▼────┐   ┌───▼────────┐
  │ Memory  │   │ Neural  │   │ Workflow   │
  │ Hooks   │   │ Hooks   │   │ Hooks      │
  │ (TS)    │   │ (TS)    │   │ (TS)       │
  └─────────┘   └─────────┘   └────────────┘

Storage Layer:
┌────────────────────────────────────────┐
│      SQLite Database (.swarm/)         │
│  ├── memory_entries (key-value store)  │
│  ├── hook_executions (audit log)      │
│  └── neural_patterns (learned data)   │
└────────────────────────────────────────┘
```

### Hook Execution Flow

```
User Operation (Edit, Bash, Task, etc.)
    ↓
Pre-Hook Execution
    ├─→ Validate operation safety
    ├─→ Auto-assign agents by context
    ├─→ Load previous context from memory
    ├─→ Prepare resources automatically
    └─→ Store pre-operation state
    ↓
[OPERATION EXECUTES]
    ↓
Post-Hook Execution
    ├─→ Auto-format code (if enabled)
    ├─→ Train neural patterns
    ├─→ Update memory with results
    ├─→ Analyze performance metrics
    ├─→ Track token usage
    └─→ Store post-operation state
    ↓
Side Effects Processing
    ├─→ Memory updates
    ├─→ Neural training
    ├─→ Metric collection
    ├─→ Notifications
    └─→ Logging
```

---

## Hook Lifecycle

### Lifecycle States

**File:** `src/services/agentic-flow-hooks/hook-manager.ts:33-83`

All hooks follow a consistent lifecycle:

```typescript
interface HookRegistration {
  id: string;                    // Unique identifier
  type: AgenticHookType;         // pre-task, post-edit, etc.
  priority: number;              // Execution order (higher = earlier)
  handler: HookHandler;          // Function to execute
  filter?: HookFilter;           // Optional filtering criteria
  options?: HookOptions;         // Caching, retries, timeout, etc.
}
```

### Hook Execution Stages

**File:** `src/services/agentic-flow-hooks/hook-manager.ts:133-223`

```typescript
async function executeHooks(type, payload, context) {
  // 1. Filter applicable hooks using matcher (2-3x performance improvement)
  const matchedHooks = await this.hookMatcher.match(hook, context, payload);

  // 2. Execute hooks in priority order
  for (const hook of matchedHooks) {
    // 3. Execute individual hook with timeout/retry
    const result = await this.executeHook(hook, payload, context);

    // 4. Process side effects
    if (result.sideEffects) {
      await this.processSideEffects(result.sideEffects, context);
    }

    // 5. Update payload if modified
    if (result.modified && result.payload) {
      modifiedPayload = result.payload;
    }

    // 6. Check if execution should continue
    if (!result.continue) {
      break;
    }
  }

  return results;
}
```

### Hook Priority Levels

```typescript
const HOOK_PRIORITIES = {
  CRITICAL: 1000,    // Security, validation
  HIGH: 100,         // Core coordination
  NORMAL: 50,        // Standard processing
  LOW: 10,           // Optional enhancements
};
```

---

## Pre-Operation Hooks

### pre-task Hook

**File:** `src/cli/simple-commands/hooks.js:111-211`

**Purpose**: Initialize task execution with agent assignment and context loading

**Execution**: Before any major task begins

**Key Features**:
- Auto-generates task IDs
- Assigns agents based on task complexity
- Stores task metadata in memory
- Executes ruv-swarm hooks (if available)
- Forces process exit to prevent hanging

**Command Syntax**:
```bash
npx claude-flow@alpha hooks pre-task \
  --description "Task description" \
  --task-id "custom-id" \
  --agent-id "agent-name" \
  --auto-spawn-agents true
```

**Implementation**:
```javascript
async function preTaskCommand(subArgs, flags) {
  const taskId = options['task-id'] || generateId('task');
  const autoSpawnAgents = options['auto-spawn-agents'] !== 'false';

  // Store task data in memory
  await store.store(`task:${taskId}`, {
    taskId,
    description,
    agentId,
    autoSpawnAgents,
    status: 'started',
    startedAt: new Date().toISOString(),
  }, {
    namespace: 'hooks:pre-task',
    metadata: { hookType: 'pre-task', agentId }
  });

  // Execute ruv-swarm hook with timeout
  const isAvailable = await Promise.race([
    checkRuvSwarmAvailable(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 3000)
    )
  ]);

  // Force exit to prevent hanging
  setTimeout(() => process.exit(0), 100);
}
```

**Memory Storage**:
```
Namespace: hooks:pre-task
Key: task:{taskId}
Value: {
  taskId, description, agentId, autoSpawnAgents,
  status: "started", startedAt: ISO timestamp
}
```

---

### pre-edit Hook

**File:** `src/cli/simple-commands/hooks.js:213-338`

**Purpose**: Validate file operations and auto-assign agents by file type

**Execution**: Before any file read/write/edit operation

**Key Features**:
- Auto-assigns specialized agents based on file extension
- Loads file context (size, modification time, directory)
- Stores agent recommendations in memory
- Validates file permissions

**Agent Assignment Map**:
```javascript
const agentMapping = {
  '.js': 'javascript-developer',
  '.ts': 'typescript-developer',
  '.py': 'python-developer',
  '.go': 'golang-developer',
  '.rs': 'rust-developer',
  '.java': 'java-developer',
  '.cpp': 'cpp-developer',
  '.css': 'frontend-developer',
  '.html': 'frontend-developer',
  '.md': 'technical-writer',
  '.yml': 'devops-engineer',
  '.json': 'config-specialist',
  '.sql': 'database-expert',
  '.sh': 'system-admin',
  '.dockerfile': 'devops-engineer',
};
```

**Command Syntax**:
```bash
npx claude-flow@alpha hooks pre-edit \
  --file "src/app.js" \
  --operation "edit" \
  --auto-assign-agents true \
  --load-context true
```

**Context Loading**:
```javascript
// File exists
contextData = {
  fileExists: true,
  size: stats.size,
  modified: stats.mtime,
  directory: path.dirname(file),
  filename: path.basename(file),
  isDirectory: stats.isDirectory(),
};

// File will be created
contextData = {
  fileExists: false,
  willCreate: true,
  directory: path.dirname(file),
  filename: path.basename(file),
};
```

---

### pre-bash Hook

**File:** `src/cli/simple-commands/hooks.js:340-429`

**Purpose**: Safety validation for bash commands before execution

**Execution**: Before bash/terminal commands execute

**Key Features**:
- Validates command safety against dangerous patterns
- Prepares resources (creates directories, checks disk space)
- Blocks dangerous commands automatically
- Logs all commands to memory

**Safety Validation**:
```javascript
const dangerousCommands = [
  'rm -rf /',
  'rm -rf .',
  'rm -rf *',
  'format',
  'fdisk',
  'mkfs',
  'curl * | bash',
  'wget * | sh',
  'eval',
  'exec',
  'chmod 777',
];

const isDangerous = dangerousCommands.some(dangerous =>
  command.toLowerCase().includes(dangerous.toLowerCase())
);

if (isDangerous) {
  console.log('⚠️ Safety check: DANGEROUS COMMAND DETECTED');
  console.log('🚫 Command blocked for safety');
  return; // Command not executed
}
```

**Command Syntax**:
```bash
npx claude-flow@alpha hooks pre-bash \
  --command "npm test" \
  --validate-safety true \
  --prepare-resources true \
  --cwd "/project/path"
```

**Resource Preparation**:
```javascript
if (prepareResources) {
  // Create working directory if needed
  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir, { recursive: true });
    console.log(`📁 Created working directory: ${workingDir}`);
  }

  // Check available disk space
  const stats = fs.statSync(workingDir);
  console.log('💾 Working directory prepared');
}
```

---

## Post-Operation Hooks

### post-task Hook

**File:** `src/cli/simple-commands/hooks.js:433-478`

**Purpose**: Analyze task performance and store completion metrics

**Execution**: After task completion

**Key Features**:
- Calculates task duration
- Stores completion status
- Updates performance metrics
- Links with pre-task data

**Command Syntax**:
```bash
npx claude-flow@alpha hooks post-task \
  --task-id "task-123" \
  --analyze-performance true
```

**Duration Calculation**:
```javascript
// Retrieve pre-task data
const taskData = await store.retrieve(`task:${taskId}`, {
  namespace: 'hooks:pre-task'
});

// Calculate duration
const completedData = {
  ...taskData,
  status: 'completed',
  completedAt: new Date().toISOString(),
  duration: taskData ?
    Date.now() - new Date(taskData.startedAt).getTime() : null,
};

// Store metrics
if (analyzePerformance && completedData.duration) {
  const metrics = {
    taskId,
    duration: completedData.duration,
    durationHuman: `${(completedData.duration / 1000).toFixed(2)}s`,
    timestamp: new Date().toISOString(),
  };

  await store.store(`metrics:${taskId}`, metrics, {
    namespace: 'performance'
  });
}
```

---

### post-edit Hook

**File:** `src/cli/simple-commands/hooks.js:480-658`

**Purpose**: Auto-format code, update memory, and train neural patterns after edits

**Execution**: After file write/edit operations

**Key Features**:
- Auto-formats code using language-specific formatters
- Updates memory with edit context
- Trains neural patterns from edit behaviors
- Stores file history

**Command Syntax**:
```bash
npx claude-flow@alpha hooks post-edit \
  --file "src/app.js" \
  --memory-key "edit:app-js" \
  --format true \
  --update-memory true \
  --train-neural true
```

**Auto-Formatting**:
```javascript
const formatters = {
  '.js': 'prettier',
  '.ts': 'prettier',
  '.json': 'prettier',
  '.py': 'black',
  '.go': 'gofmt',
  '.rs': 'rustfmt',
  '.java': 'google-java-format',
  '.cpp': 'clang-format',
};

if (format && fs.existsSync(file)) {
  const ext = path.extname(file).toLowerCase();
  const formatter = formatters[ext];

  if (formatter) {
    console.log(`🎨 Auto-formatting with ${formatter}...`);
    formatResult = {
      formatter,
      extension: ext,
      attempted: true,
      timestamp: new Date().toISOString(),
    };
  }
}
```

**Memory Update**:
```javascript
if (updateMemory) {
  const editContext = {
    file,
    editedAt: new Date().toISOString(),
    editId: generateId('edit'),
    formatted: formatResult?.attempted || false,
    fileSize: fs.existsSync(file) ? fs.statSync(file).size : 0,
    directory: path.dirname(file),
    basename: path.basename(file),
  };

  // Store in coordination namespace
  await store.store(`edit-context:${editContext.editId}`, editContext, {
    namespace: 'coordination',
    metadata: { type: 'edit-context', file }
  });
}
```

**Neural Training**:
```javascript
if (trainNeural) {
  const patterns = {
    fileType: path.extname(file).toLowerCase(),
    fileName: path.basename(file),
    editTime: new Date().toISOString(),
    confidence: Math.random() * 0.5 + 0.5, // 50-100% confidence
    patterns: [
      `${ext}_edit_pattern`,
      `${basename}_modification`,
      `edit_${Date.now()}_sequence`,
    ],
  };

  await store.store(`neural-pattern:${generateId('pattern')}`, patterns, {
    namespace: 'neural-training',
    metadata: { type: 'edit-pattern', file, extension: ext }
  });
}
```

---

### post-bash Hook

**File:** `src/cli/simple-commands/hooks.js:660-779`

**Purpose**: Track command execution metrics and store results

**Execution**: After bash/terminal commands complete

**Key Features**:
- Tracks exit codes and output
- Calculates command success rate
- Stores detailed execution metrics
- Updates running averages

**Command Syntax**:
```bash
npx claude-flow@alpha hooks post-bash \
  --command "npm test" \
  --exit-code "0" \
  --output "..." \
  --duration "1500" \
  --track-metrics true \
  --store-results true
```

**Metrics Tracking**:
```javascript
if (trackMetrics) {
  const metrics = {
    commandLength: command.length,
    outputLength: output.length,
    success: parseInt(exitCode) === 0,
    duration: parseInt(duration) || 0,
    exitCode: parseInt(exitCode),
    timestamp: new Date().toISOString(),
    complexity: commandLength > 100 ? 'high' :
                commandLength > 50 ? 'medium' : 'low',
  };

  // Update running metrics
  const existingMetrics = await store.retrieve('command-metrics-summary', {
    namespace: 'performance-metrics'
  }) || { totalCommands: 0, successRate: 0, avgDuration: 0 };

  existingMetrics.totalCommands += 1;
  existingMetrics.successRate =
    (existingMetrics.successRate * (existingMetrics.totalCommands - 1) +
     (metrics.success ? 1 : 0)) / existingMetrics.totalCommands;
  existingMetrics.avgDuration =
    (existingMetrics.avgDuration * (existingMetrics.totalCommands - 1) +
     metrics.duration) / existingMetrics.totalCommands;
}
```

---

## MCP Integration Hooks

### mcp-initialized Hook

**File:** `src/cli/simple-commands/hooks.js:825-853`

**Purpose**: Persist MCP server configuration and session state

**Key Features**:
- Stores MCP server name and session ID
- Tracks initialization timestamp
- Enables session restoration

### agent-spawned Hook

**File:** `src/cli/simple-commands/hooks.js:855-896`

**Purpose**: Register agent spawning events

**Key Features**:
- Records agent type and name
- Tracks agent lifecycle
- Updates agent roster for coordination

### task-orchestrated Hook

**File:** `src/cli/simple-commands/hooks.js:898-928`

**Purpose**: Log task orchestration events

**Key Features**:
- Stores orchestration strategy
- Tracks task priority
- Enables workflow analysis

### neural-trained Hook

**File:** `src/cli/simple-commands/hooks.js:930-959`

**Purpose**: Persist neural training results

**Key Features**:
- Stores model accuracy
- Tracks patterns learned
- Enables performance comparison

---

## Session Management Hooks

### session-end Hook

**File:** `src/cli/simple-commands/hooks.js:963-1083`

**Purpose**: Generate session summary and persist state

**Execution**: At session termination

**Key Features**:
- Generates comprehensive session summary
- Exports performance metrics
- Persists full session state
- Calculates session statistics

**Command Syntax**:
```bash
npx claude-flow@alpha hooks session-end \
  --generate-summary true \
  --persist-state true \
  --export-metrics true
```

**Session Summary**:
```javascript
// Gather all session data
const tasks = await store.list({ namespace: 'task-index', limit: 1000 });
const edits = await store.list({ namespace: 'file-history', limit: 1000 });
const commands = await store.list({ namespace: 'command-history', limit: 1000 });
const agents = await store.list({ namespace: 'agent-roster', limit: 1000 });

// Calculate metrics
const sessionStart = Math.min(
  ...tasks.map(t => new Date(t.value.timestamp || now).getTime()),
  ...edits.map(e => new Date(e.value.timestamp || now).getTime()),
  ...commands.map(c => new Date(c.value.timestamp || now).getTime())
);

const duration = now.getTime() - sessionStart;
const successfulCommands = commands.filter(c => c.value.success !== false).length;
const commandSuccessRate = commands.length > 0 ?
  successfulCommands / commands.length : 1;

const metrics = {
  sessionDuration: duration,
  sessionDurationHuman: `${Math.round(duration / 1000 / 60)} minutes`,
  totalTasks: tasks.length,
  totalEdits: edits.length,
  totalCommands: commands.length,
  uniqueAgents: agents.length,
  commandSuccessRate: Math.round(commandSuccessRate * 100),
  avgTasksPerMinute: Math.round((tasks.length / (duration / 1000 / 60)) * 100) / 100,
  avgEditsPerMinute: Math.round((edits.length / (duration / 1000 / 60)) * 100) / 100,
  timestamp: now.toISOString(),
};
```

**State Persistence**:
```javascript
if (persistState) {
  const detailedState = {
    sessionId: sessionData.sessionId,
    tasks: tasks.slice(0, 100),  // Limit to prevent memory issues
    edits: edits.slice(0, 100),
    commands: commands.slice(0, 100),
    agents: agents.slice(0, 50),
    persistedAt: new Date().toISOString(),
    fullState: true,
  };

  await store.store(`session-state:${sessionData.sessionId}`, detailedState, {
    namespace: 'session-states',
    metadata: { type: 'full-state', sessionId: sessionData.sessionId }
  });
}
```

---

### session-restore Hook

**File:** `src/cli/simple-commands/hooks.js:1085-1129`

**Purpose**: Restore previous session state

**Execution**: At session start

**Key Features**:
- Finds latest or specific session
- Restores session context
- Tracks restoration events

**Command Syntax**:
```bash
# Restore latest session
npx claude-flow@alpha hooks session-restore --session-id "latest"

# Restore specific session
npx claude-flow@alpha hooks session-restore --session-id "session-123"
```

**Session Restoration**:
```javascript
// Find session to restore
let sessionData;
if (sessionId === 'latest') {
  const sessions = await store.list({ namespace: 'sessions', limit: 1 });
  sessionData = sessions[0]?.value;
} else {
  sessionData = await store.retrieve(`session:${sessionId}`, {
    namespace: 'sessions'
  });
}

if (sessionData) {
  console.log('\n📊 RESTORED SESSION:');
  console.log(`  🆔 ID: ${sessionData.sessionId || 'unknown'}`);
  console.log(`  📋 Tasks: ${sessionData.totalTasks || 0}`);
  console.log(`  ✏️  Edits: ${sessionData.totalEdits || 0}`);
  console.log(`  ⏰ Ended: ${sessionData.endedAt || 'unknown'}`);

  // Store restoration event
  await store.store(`session-restore:${Date.now()}`, {
    restoredSessionId: sessionData.sessionId || sessionId,
    restoredAt: new Date().toISOString(),
  }, { namespace: 'session-events' });
}
```

---

## PreToolUse Modification Hooks

**New in v2.0.10+**: These hooks modify tool inputs BEFORE execution by reading/writing JSON via stdin/stdout.

### modify-bash Hook

**File:** `src/cli/simple-commands/hooks.js:1171-1248`

**Purpose**: Modify bash commands for safety and convenience before execution

**Key Features**:
- **Safety**: Adds `-i` flag to `rm` commands for interactive confirmation
- **Aliases**: Expands `ll` → `ls -lah`, `la` → `ls -la`
- **Path Correction**: Redirects test files to `/tmp/`
- **Secret Detection**: Warns about sensitive keywords

**Usage with Claude Code v2.0.10+**:
```bash
echo '{"tool_input":{"command":"rm test.txt"}}' | \
  npx claude-flow@alpha hooks modify-bash
```

**Output**:
```json
{
  "tool_input": {
    "command": "rm -i test.txt"
  },
  "modification_notes": "[Safety: Added -i flag for interactive confirmation]"
}
```

**Implementation**:
```javascript
// 1. Safety: Add -i flag to rm commands
if (/^rm\s/.test(command) && !/-[iI]/.test(command)) {
  modifiedCommand = command.replace(/^rm /, 'rm -i ');
  notes.push('[Safety: Added -i flag for interactive confirmation]');
}

// 2. Aliases
if (/^ll(\s|$)/.test(command)) {
  modifiedCommand = command.replace(/^ll/, 'ls -lah');
  notes.push('[Alias: ll → ls -lah]');
}

// 3. Path correction: Redirect test files to /tmp
if (/>\s*test.*\.(txt|log|tmp|json|md)/.test(command) &&
    !/\/tmp\//.test(command)) {
  modifiedCommand = command.replace(
    />\s*(test[^/]*\.(txt|log|tmp|json|md))/,
    '> /tmp/$1'
  );
  notes.push('[Path: Redirected test file to /tmp/]');
}

// 4. Secret detection
if (/(password|secret|token|api[-_]?key|auth)/i.test(command) &&
    !/#\s*SECRETS_OK/.test(command)) {
  notes.push('[Security: Command contains sensitive keywords. Add "# SECRETS_OK" to bypass]');
}
```

---

### modify-file Hook

**File:** `src/cli/simple-commands/hooks.js:1250-1341`

**Purpose**: Organize files into proper directories before creation

**Key Features**:
- **Root Folder Protection**: Moves files from root to appropriate directories
- **Organization**: Tests → `/tests/`, Sources → `/src/`, Docs → `/docs/`
- **Format Hints**: Suggests appropriate formatters

**Usage**:
```bash
echo '{"tool_input":{"file_path":"test.js"}}' | \
  npx claude-flow@alpha hooks modify-file
```

**Output**:
```json
{
  "tool_input": {
    "file_path": "src/test.js"
  },
  "modification_notes": "[Organization: Moved source file to /src/]"
}
```

**Organization Rules**:
```javascript
// Test files → /tests/
if (/test.*\.(test|spec)\.|\.test\.|\.spec\./.test(filePath)) {
  modifiedPath = `tests/${filePath}`;
  notes.push('[Organization: Moved test file to /tests/]');
}

// Working docs → /docs/working/
else if (/test.*\.md|temp.*\.md|working.*\.md|scratch.*\.md/.test(filePath)) {
  modifiedPath = `docs/working/${filePath}`;
  notes.push('[Organization: Moved working document to /docs/working/]');
}

// Source files → /src/
else if (/\.(js|ts|jsx|tsx|py)$/.test(filePath)) {
  modifiedPath = `src/${filePath}`;
  notes.push('[Organization: Moved source file to /src/]');
}

// Temporary files → /tmp/
else if (/^(temp|tmp|scratch)/.test(filePath)) {
  modifiedPath = `/tmp/${filePath}`;
  notes.push('[Organization: Redirected temporary file to /tmp/]');
}
```

---

### modify-git-commit Hook

**File:** `src/cli/simple-commands/hooks.js:1343-1443`

**Purpose**: Format git commit messages with conventional commit style

**Key Features**:
- **Conventional Commits**: Auto-adds `[feat]`, `[fix]`, `[docs]`, etc.
- **Ticket Extraction**: Extracts JIRA tickets from branch names
- **Co-Author**: Adds Claude Flow co-author footer

**Usage**:
```bash
echo '{"tool_input":{"command":"git commit -m \"fix bug\""}}' | \
  npx claude-flow@alpha hooks modify-git-commit
```

**Output**:
```json
{
  "tool_input": {
    "command": "git commit -m \"$(cat <<'EOF'\n[fix] fix bug (PROJ-123)\n\n🤖 Generated with Claude Flow\nCo-Authored-By: claude-flow <noreply@ruv.io>\nEOF\n)\""
  },
  "modification_notes": "[Auto-formatted: fix type + PROJ-123]"
}
```

**Type Detection**:
```javascript
let type = 'chore';
if (/^(add|implement|create|new)/i.test(commitMsg)) type = 'feat';
else if (/^(fix|resolve|patch|correct)/i.test(commitMsg)) type = 'fix';
else if (/^(update|modify|change|improve)/i.test(commitMsg)) type = 'refactor';
else if (/^(doc|documentation|readme)/i.test(commitMsg)) type = 'docs';
else if (/^(test|testing|spec)/i.test(commitMsg)) type = 'test';
else if (/^(style|format|lint)/i.test(commitMsg)) type = 'style';
else if (/^(perf|optimize|speed)/i.test(commitMsg)) type = 'perf';

// Format message
let formattedMsg = ticket
  ? `[${type}] ${commitMsg} (${ticket})`
  : `[${type}] ${commitMsg}`;

// Add co-author
formattedMsg += `\n\n🤖 Generated with Claude Flow\nCo-Authored-By: claude-flow <noreply@ruv.io>`;
```

---

## Memory Integration

### SQLite Memory Store

**File:** `src/memory/sqlite-store.js:17-331`

All hooks use a **persistent SQLite database** for cross-session memory:

```
Location: .swarm/memory.db
Schema: memory_entries table with:
  - id: Primary key (auto-increment)
  - key: Unique identifier within namespace
  - value: JSON-serialized data
  - namespace: Logical grouping (hooks:pre-task, coordination, etc.)
  - metadata: Additional context
  - created_at, updated_at, accessed_at: Timestamps
  - access_count: Usage tracking
  - ttl, expires_at: Time-to-live
```

**Key Features**:
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Automatic TTL**: Expired entries cleaned up automatically
- **Prepared Statements**: 10-100x faster than dynamic SQL
- **Namespace Isolation**: Different hook types use separate namespaces

**Memory Namespaces**:
```javascript
const HOOK_NAMESPACES = {
  'hooks:pre-task': 'Task initialization data',
  'hooks:post-task': 'Task completion data',
  'hooks:pre-edit': 'Pre-edit validation',
  'hooks:post-edit': 'Post-edit processing',
  'hooks:pre-bash': 'Command validation',
  'hooks:post-bash': 'Command execution results',
  'coordination': 'Cross-agent coordination',
  'neural-training': 'Learned patterns',
  'performance': 'Metrics and analytics',
  'sessions': 'Session state',
};
```

**Usage Example**:
```javascript
// Store hook data
await store.store('task:task-123', taskData, {
  namespace: 'hooks:pre-task',
  metadata: { hookType: 'pre-task', agentId: 'agent-1' },
  ttl: 3600  // 1 hour
});

// Retrieve hook data
const taskData = await store.retrieve('task:task-123', {
  namespace: 'hooks:pre-task'
});

// List all tasks
const allTasks = await store.list({
  namespace: 'task-index',
  limit: 100
});

// Search for patterns
const editLogs = await store.search('edit', {
  namespace: 'coordination',
  limit: 50
});
```

---

## Neural Training Integration

### Neural Hooks Architecture

**File:** `src/services/agentic-flow-hooks/neural-hooks.ts:1-758`

Neural hooks enable **continuous learning** from agent operations:

### Pre-Neural Train Hook

**Purpose**: Validate and augment training data before neural training

**Key Features**:
- Validates training data format
- Augments with historical successful patterns
- Balances dataset to prevent bias
- Preprocesses inputs and outputs

**Implementation**:
```typescript
export const preNeuralTrainHook = {
  id: 'agentic-pre-neural-train',
  type: 'pre-neural-train',
  priority: 100,
  handler: async (payload, context) => {
    // Validate training data
    const validation = validateTrainingData(payload.trainingData);
    if (!validation.valid) {
      return { continue: false, sideEffects: [...errors] };
    }

    // Augment with historical patterns
    const augmentedData = await augmentTrainingData(
      payload.trainingData,
      payload.modelId,
      context
    );

    // Balance dataset
    const balancedData = balanceTrainingData(augmentedData);

    // Preprocess data
    const preprocessedData = preprocessTrainingData(balancedData);

    return {
      continue: true,
      modified: true,
      payload: { ...payload, trainingData: preprocessedData },
      sideEffects: [...]
    };
  }
};
```

### Post-Neural Train Hook

**Purpose**: Store training results and evaluate model promotion

**Key Features**:
- Stores training accuracy and metadata
- Updates model performance history
- Evaluates if model should be promoted to production
- Extracts learned patterns

**Model Promotion Logic**:
```typescript
async function evaluateModelPromotion(modelId, accuracy, context) {
  const perfKey = `model:performance:${modelId}`;
  const history = await context.memory.cache.get(perfKey) || [];

  if (history.length < 10) {
    return false; // Not enough history
  }

  // Calculate average accuracy over last 10 runs
  const recent = history.slice(-10);
  const avgAccuracy = recent.reduce((sum, h) =>
    sum + h.accuracy, 0
  ) / recent.length;

  // Promote if consistently above threshold
  return avgAccuracy > 0.85 && accuracy > 0.85;
}
```

### Neural Pattern Detection Hook

**Purpose**: Analyze detected patterns for significance and trigger adaptations

**Key Features**:
- Calculates pattern significance scores
- Stores high-significance patterns permanently
- Generates adaptations from patterns
- Finds pattern combinations

**Pattern Significance**:
```typescript
function calculatePatternSignificance(pattern) {
  const baseScore = pattern.confidence;
  const occurrenceBonus = Math.min(pattern.occurrences / 100, 0.2);

  return Math.min(baseScore + occurrenceBonus, 1.0);
}

// Store significant patterns
if (significance > 0.7) {
  sideEffects.push({
    type: 'memory',
    action: 'store',
    data: {
      key: `pattern:significant:${pattern.id}`,
      value: { pattern, significance, detectedAt: Date.now() },
      ttl: 0, // Permanent
    }
  });

  // Trigger adaptation
  const adaptation = await generateAdaptation(pattern, context);
  if (adaptation) {
    sideEffects.push({
      type: 'neural',
      action: 'adapt',
      data: { adaptation }
    });
  }
}
```

---

## Performance Hooks

### Performance Tracking Hooks

**File:** `src/cli/simple-commands/performance-hooks.js:1-173`

Performance hooks **automatically track** all operations for bottleneck analysis:

### Task Performance Tracking

```javascript
export function onTaskStart(taskId, taskType, metadata = {}) {
  activeOperations.set(taskId, {
    type: 'task',
    taskType,
    startTime: performance.now(),
    metadata
  });
}

export async function onTaskEnd(taskId, success = true, error = null) {
  const operation = activeOperations.get(taskId);
  if (!operation) return;

  const duration = performance.now() - operation.startTime;
  activeOperations.delete(taskId);

  await trackTaskExecution(
    taskId,
    operation.taskType,
    success,
    duration,
    {
      ...operation.metadata,
      error: error ? error.message : undefined
    }
  );
}
```

### Agent Activity Tracking

```javascript
export async function onAgentAction(agentId, agentType, action, success = true) {
  const key = `${agentId}:${action}`;
  const operation = activeOperations.get(key);

  if (operation) {
    const duration = performance.now() - operation.startTime;
    activeOperations.delete(key);

    await trackAgentActivity(
      agentId,
      agentType,
      action,
      duration,
      success
    );
  }
}
```

### Wrapper Functions

```javascript
// Automatically track task execution
export function wrapTaskExecution(taskId, taskType, fn, metadata = {}) {
  return async (...args) => {
    onTaskStart(taskId, taskType, metadata);
    try {
      const result = await fn(...args);
      await onTaskEnd(taskId, true);
      return result;
    } catch (error) {
      await onTaskEnd(taskId, false, error);
      throw error;
    }
  };
}

// Usage
const result = await wrapTaskExecution(
  'task-123',
  'data-processing',
  async () => {
    // Task implementation
  }
)();
```

---

## Custom Hook Creation

### Registering Custom Hooks

**File:** `src/services/agentic-flow-hooks/hook-manager.ts:53-84`

You can register custom hooks programmatically:

```typescript
import { agenticHookManager } from './hook-manager.js';

// Define custom hook
const myCustomHook = {
  id: 'my-custom-hook',
  type: 'post-edit',
  priority: 80,
  handler: async (payload, context) => {
    // Custom logic here
    console.log('Custom hook executed!');

    return {
      continue: true,
      modified: false,
      sideEffects: [
        {
          type: 'log',
          action: 'write',
          data: {
            level: 'info',
            message: 'Custom hook completed',
            data: payload
          }
        }
      ]
    };
  },
  filter: {
    // Optional: Only trigger for specific file types
    patterns: ['*.js', '*.ts']
  },
  options: {
    timeout: 5000,    // 5 second timeout
    retries: 2,       // Retry twice on failure
    cache: {
      enabled: true,
      ttl: 60000,     // Cache for 1 minute
      key: (payload) => `custom-${payload.file}`
    }
  }
};

// Register hook
agenticHookManager.register(myCustomHook);
```

### Hook Handler Return Type

```typescript
interface HookHandlerResult {
  continue: boolean;         // Should execution continue?
  modified?: boolean;        // Was payload modified?
  payload?: HookPayload;     // Modified payload (if applicable)
  sideEffects?: SideEffect[]; // Side effects to execute
}

interface SideEffect {
  type: 'memory' | 'neural' | 'metric' | 'notification' | 'log';
  action: string;
  data: any;
}
```

### Hook Pipeline

Create complex workflows with **hook pipelines**:

```typescript
const pipeline = agenticHookManager.createPipeline({
  id: 'deployment-pipeline',
  name: 'Deployment Workflow',
  stages: [
    {
      name: 'Validation',
      hooks: [preEditHook, preBashHook],
      parallel: true,  // Run hooks in parallel
    },
    {
      name: 'Execution',
      hooks: [executionHook],
      parallel: false,  // Sequential execution
      condition: (context) => context.validated === true,
    },
    {
      name: 'Post-Processing',
      hooks: [postEditHook, neuralTrainHook],
      parallel: true,
      transform: (result) => ({
        ...result,
        enriched: true
      })
    }
  ],
  errorStrategy: 'rollback',  // 'fail-fast', 'continue', 'rollback'
});

// Execute pipeline
const results = await agenticHookManager.executePipeline(
  pipeline.id,
  initialPayload,
  context
);
```

---

## API Reference

### Core Hook Commands

#### `hooks pre-task`

Initialize task execution with agent assignment

**Parameters:**
- `--description`: Task description (required)
- `--task-id`: Custom task ID (optional)
- `--agent-id`: Assigned agent ID (optional)
- `--auto-spawn-agents`: Auto-spawn agents (default: true)

**Example:**
```bash
npx claude-flow@alpha hooks pre-task \
  --description "Implement user authentication" \
  --auto-spawn-agents true
```

#### `hooks post-task`

Complete task and analyze performance

**Parameters:**
- `--task-id`: Task ID (required)
- `--analyze-performance`: Enable metrics (default: true)

**Example:**
```bash
npx claude-flow@alpha hooks post-task \
  --task-id "task-123" \
  --analyze-performance true
```

#### `hooks pre-edit`

Validate file operations and assign agents

**Parameters:**
- `--file`: File path (required)
- `--operation`: Operation type (read/write/edit/delete)
- `--auto-assign-agents`: Enable agent assignment (default: false)
- `--load-context`: Load file context (default: false)

**Example:**
```bash
npx claude-flow@alpha hooks pre-edit \
  --file "src/app.js" \
  --auto-assign-agents true \
  --load-context true
```

#### `hooks post-edit`

Auto-format and train neural patterns

**Parameters:**
- `--file`: File path (required)
- `--memory-key`: Memory key for storage (optional)
- `--format`: Enable auto-formatting (default: false)
- `--update-memory`: Update memory (default: false)
- `--train-neural`: Train neural patterns (default: false)

**Example:**
```bash
npx claude-flow@alpha hooks post-edit \
  --file "src/app.js" \
  --format true \
  --update-memory true \
  --train-neural true
```

#### `hooks pre-bash`

Validate command safety

**Parameters:**
- `--command`: Command to validate (required)
- `--validate-safety`: Enable safety checks (default: false)
- `--prepare-resources`: Prepare resources (default: false)
- `--cwd`: Working directory (optional)

**Example:**
```bash
npx claude-flow@alpha hooks pre-bash \
  --command "npm test" \
  --validate-safety true
```

#### `hooks post-bash`

Track command execution

**Parameters:**
- `--command`: Executed command (required)
- `--exit-code`: Exit code (default: 0)
- `--duration`: Duration in ms (optional)
- `--output`: Command output (optional)
- `--track-metrics`: Enable metrics (default: false)
- `--store-results`: Store detailed results (default: false)

**Example:**
```bash
npx claude-flow@alpha hooks post-bash \
  --command "npm test" \
  --exit-code "0" \
  --duration "1500" \
  --track-metrics true
```

#### `hooks session-end`

Generate session summary

**Parameters:**
- `--generate-summary`: Generate summary (default: true)
- `--persist-state`: Persist state (default: true)
- `--export-metrics`: Export metrics (default: false)

**Example:**
```bash
npx claude-flow@alpha hooks session-end \
  --generate-summary true \
  --export-metrics true
```

#### `hooks session-restore`

Restore previous session

**Parameters:**
- `--session-id`: Session ID (required, use "latest" for most recent)

**Example:**
```bash
npx claude-flow@alpha hooks session-restore --session-id "latest"
```

---

## Real-World Examples

### Example 1: Auto-Coordination Workflow

**Scenario**: Multiple agents working on a full-stack application

**Agent 1 - Backend Developer**:
```bash
# Before starting work
npx claude-flow@alpha hooks pre-task \
  --description "Implement REST API endpoints" \
  --agent-id "backend-dev-1"

# Before editing files
npx claude-flow@alpha hooks pre-edit \
  --file "src/routes/users.js" \
  --auto-assign-agents true

# [EDIT FILE]

# After editing
npx claude-flow@alpha hooks post-edit \
  --file "src/routes/users.js" \
  --memory-key "backend/routes/users" \
  --format true \
  --update-memory true

# Share progress
npx claude-flow@alpha hooks notify \
  --message "User routes implemented with CRUD operations" \
  --level "info"

# After completing task
npx claude-flow@alpha hooks post-task \
  --task-id "backend-dev-1-task" \
  --analyze-performance true
```

**Agent 2 - Frontend Developer** (reads Agent 1's memory):
```bash
# Check backend progress before starting
npx claude-flow@alpha hooks pre-search \
  --query "backend/routes/*" \
  --cache-results true

# Read coordination memory to see available routes
# Memory key: backend/routes/users
# Value: { routes: ["/api/users", "/api/users/:id"], ... }

# Implement frontend that uses those routes
npx claude-flow@alpha hooks pre-edit \
  --file "src/components/UserList.jsx"

# [IMPLEMENT COMPONENT]

npx claude-flow@alpha hooks post-edit \
  --file "src/components/UserList.jsx" \
  --memory-key "frontend/components/users" \
  --update-memory true
```

**Memory Coordination Flow**:
```
Backend Dev → stores routes → Memory
Frontend Dev → reads routes → implements UI → stores component → Memory
Test Dev → reads both → creates integration tests
```

---

### Example 2: Memory Auto-Save Example

**Scenario**: Automatically save all design decisions to memory

```bash
# Agent makes architectural decision
npx claude-flow@alpha hooks notify \
  --message "Decided to use PostgreSQL for database" \
  --level "info" \
  --persist true

# This automatically stores to memory:
# Namespace: coordination
# Key: decision:${timestamp}
# Value: { message: "...", timestamp, level }

# Later, another agent retrieves the decision
npx claude-flow@alpha hooks pre-search \
  --query "decision:*" \
  --cache-results true

# Result: All previous decisions loaded from memory
```

**Manual Memory Storage**:
```bash
# Store complex decision with structure
npx claude-flow@alpha hooks post-edit \
  --file "docs/architecture.md" \
  --memory-key "architecture/database" \
  --update-memory true

# Memory stored:
# Key: architecture/database
# Value: {
#   file: "docs/architecture.md",
#   decision: "PostgreSQL with replication",
#   reasoning: "ACID compliance, JSON support",
#   editedAt: "2025-10-15T...",
#   editId: "edit-123"
# }
```

---

### Example 3: Custom Hook Implementation

**Scenario**: Create a hook that validates API endpoint naming conventions

**Step 1: Define Custom Hook**:
```typescript
// custom-hooks/api-validator.ts
import { agenticHookManager } from 'claude-flow';

export const apiEndpointValidator = {
  id: 'api-endpoint-validator',
  type: 'pre-edit',
  priority: 90,
  handler: async (payload, context) => {
    const { file, operation } = payload;

    // Only validate API route files
    if (!file.includes('routes/')) {
      return { continue: true };
    }

    // Check if file follows naming convention
    const validPattern = /^routes\/[a-z]+\.js$/;
    if (!validPattern.test(file)) {
      return {
        continue: false,
        sideEffects: [
          {
            type: 'log',
            action: 'write',
            data: {
              level: 'error',
              message: `Invalid API route name: ${file}`,
              data: {
                expected: 'routes/{resource}.js',
                actual: file
              }
            }
          }
        ]
      };
    }

    // Validation passed
    return {
      continue: true,
      sideEffects: [
        {
          type: 'metric',
          action: 'increment',
          data: { name: 'api.validations.passed' }
        }
      ]
    };
  },
  filter: {
    patterns: ['routes/*.js']
  }
};

// Register hook
agenticHookManager.register(apiEndpointValidator);
```

**Step 2: Use Hook**:
```bash
# Hook automatically validates when editing route files
npx claude-flow@alpha hooks pre-edit --file "routes/user.js"
# ✅ Validation passed

npx claude-flow@alpha hooks pre-edit --file "routes/UserController.js"
# ❌ Error: Invalid API route name (expected lowercase)
```

---

### Example 4: Hook Chaining Example

**Scenario**: Chain multiple hooks to create a complete workflow

```typescript
// Create deployment pipeline
const deploymentPipeline = agenticHookManager.createPipeline({
  id: 'deploy-api',
  name: 'API Deployment Pipeline',
  stages: [
    {
      name: 'Pre-Deployment Validation',
      hooks: [
        preEditHook,      // Validate file access
        preBashHook,      // Validate commands
        apiValidatorHook  // Validate API naming
      ],
      parallel: true,     // Run all validations in parallel
    },
    {
      name: 'Build and Test',
      hooks: [
        buildHook,        // Build application
        testHook          // Run tests
      ],
      parallel: false,    // Sequential (test after build)
      condition: (context) => context.validated === true,
    },
    {
      name: 'Deploy',
      hooks: [
        deployHook        // Deploy to production
      ],
      parallel: false,
      condition: (context) => context.testsPassed === true,
    },
    {
      name: 'Post-Deployment',
      hooks: [
        postEditHook,     // Format and update memory
        neuralTrainHook,  // Learn from deployment
        metricsHook       // Track deployment metrics
      ],
      parallel: true,     // All post-processing in parallel
      transform: (result) => ({
        ...result,
        deployed: true,
        deployedAt: Date.now()
      })
    }
  ],
  errorStrategy: 'rollback'  // Rollback on any error
});

// Execute pipeline
const results = await agenticHookManager.executePipeline(
  'deploy-api',
  {
    file: 'src/app.js',
    command: 'npm run deploy',
    environment: 'production'
  },
  context
);

console.log('Deployment results:', results);
// [
//   { stage: 'validation', passed: true, duration: 150 },
//   { stage: 'build', passed: true, duration: 3200 },
//   { stage: 'test', passed: true, duration: 1800 },
//   { stage: 'deploy', passed: true, duration: 5000 },
//   { stage: 'post', passed: true, duration: 400 }
// ]
```

---

## Troubleshooting

### Hook Not Executing

**Symptom**: Hook command runs but no action is taken

**Diagnosis**:
```bash
# Check memory store initialization
npx claude-flow@alpha hooks pre-task --description "test" --verbose

# Look for:
# [memory-store] Initialized SQLite at: /path/to/.swarm/memory.db
```

**Solution**:
```bash
# Ensure .swarm directory exists
mkdir -p .swarm

# Check permissions
chmod 755 .swarm

# Verify SQLite database
sqlite3 .swarm/memory.db "SELECT count(*) FROM memory_entries;"
```

---

### Memory Not Persisting

**Symptom**: Hook data not available in subsequent commands

**Diagnosis**:
```bash
# List all stored memory
npx claude-flow@alpha hooks session-end --generate-summary true

# Check memory database directly
sqlite3 .swarm/memory.db "SELECT key, namespace FROM memory_entries LIMIT 10;"
```

**Solution**:
```bash
# Ensure hooks are using correct namespace
npx claude-flow@alpha hooks post-edit \
  --file "test.js" \
  --memory-key "test-key" \
  --update-memory true  # MUST be true!

# Verify storage
sqlite3 .swarm/memory.db "SELECT * FROM memory_entries WHERE namespace='coordination';"
```

---

### Hooks Timing Out

**Symptom**: Hook commands hang or timeout

**Diagnosis**:
```bash
# Check for hanging processes
ps aux | grep claude-flow

# Check ruv-swarm availability (common timeout source)
timeout 3s npx ruv-swarm --version
```

**Solution**:
```bash
# Hooks have built-in timeout for ruv-swarm (3 seconds)
# If hanging, kill and retry:
pkill -f claude-flow
npx claude-flow@alpha hooks pre-task --description "test"

# Disable ruv-swarm integration if problematic:
# (hooks will skip ruv-swarm hooks automatically on timeout)
```

---

### PreToolUse Hooks Not Modifying

**Symptom**: modify-bash, modify-file, modify-git-commit not working

**Diagnosis**:
```bash
# Test hook directly
echo '{"tool_input":{"command":"rm test.txt"}}' | \
  npx claude-flow@alpha hooks modify-bash

# Check output for modification_notes
```

**Solution**:
```bash
# These hooks require Claude Code v2.0.10+
# Ensure you're using stdin/stdout correctly

# Correct usage:
echo '{"tool_input":{"command":"rm test.txt"}}' | \
  npx claude-flow@alpha hooks modify-bash

# Incorrect (will show help):
npx claude-flow@alpha hooks modify-bash --command "rm test.txt"
```

---

### Performance Degradation

**Symptom**: Hooks slowing down operations

**Diagnosis**:
```bash
# Check memory database size
du -sh .swarm/memory.db

# Count entries
sqlite3 .swarm/memory.db "SELECT count(*) FROM memory_entries;"

# Check for expired entries
sqlite3 .swarm/memory.db "SELECT count(*) FROM memory_entries WHERE expires_at IS NOT NULL AND expires_at <= strftime('%s','now');"
```

**Solution**:
```bash
# Clean up expired entries
sqlite3 .swarm/memory.db "DELETE FROM memory_entries WHERE expires_at IS NOT NULL AND expires_at <= strftime('%s','now');"

# Vacuum database
sqlite3 .swarm/memory.db "VACUUM;"

# Set shorter TTL for temporary data
npx claude-flow@alpha hooks post-edit \
  --file "temp.js" \
  --memory-key "temp-key" \
  --update-memory true
# (default TTL is 1 hour for edit contexts)
```

---

## Related Documentation

- [Memory Architecture](MEMORY-ARCHITECTURE.md) - Detailed memory system documentation
- [Agent Coordination](ORCHESTRATION-PATTERNS.md) - Multi-agent coordination patterns
- [Neural Training](NEURAL-TRAINING.md) - Neural pattern learning
- [Performance Optimization](../claude-flow-practical-guide-2025.md) - Performance best practices
- [User Guide](../claude-flow-user-guide-2025-10-14.md) - High-level usage guide

---

**Last Updated:** 2025-10-15
**Authors:** Claude-Flow Team
**License:** MIT
