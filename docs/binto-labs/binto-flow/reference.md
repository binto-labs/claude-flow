---
status: keep
phase: complete
type: reference
version: 2.0
last-updated: 2026-01-17
title: V3 Reference (Binto-Flow)
author: Claude Code + Human Developer
tags: [reference, v3, commands, architecture, binto-flow]
---

# V3 Reference (Binto-Flow)

> Quick reference for claude-flow V3 commands and architecture.
> For templates: [swarm-templates.md](./swarm-templates.md) | [hive-mind-templates.md](./hive-mind-templates.md)

---

## Package Version

```bash
# V3 (current)
npx claude-flow@v3alpha [command]

# V2 (deprecated for new work)
npx claude-flow@alpha [command]
```

---

## Core Commands

### Initialization

```bash
# Initialize V3 in project
npx claude-flow@v3alpha init --force

# Start background daemon (optional)
npx claude-flow@v3alpha daemon start

# Check daemon status
npx claude-flow@v3alpha daemon status

# Stop daemon
npx claude-flow@v3alpha daemon stop
```

### Agent Routing (V3 NEW)

```bash
# Get AI-recommended agent for task
npx claude-flow@v3alpha route task "Build REST API with authentication"
# Output: Recommended Agent: backend-dev (91% confidence)

# Route with domain hints
npx claude-flow@v3alpha route task "Add OAuth2 login" --domain auth
```

### Hooks (Mostly Automatic in V3)

**The `.claude/settings.json` handles most hooks automatically:**

| Hook | When | Configured In |
|------|------|---------------|
| `pre-edit` | Before Write/Edit | PreToolUse |
| `post-edit` | After Write/Edit | PostToolUse |
| `session-end` | On Stop | Stop |

**Manual hooks (optional, for explicit control):**

```bash
# Notify other agents
npx claude-flow@v3alpha hooks notify --message "[message]"

# Manual session export (rarely needed)
npx claude-flow@v3alpha hooks session-end --export-metrics true
```

### Memory

```bash
# Store value
npx claude-flow@v3alpha memory store \
  --namespace "[namespace]" \
  --key "[key]" \
  --value "[value or JSON]"

# Read value
npx claude-flow@v3alpha memory read \
  --namespace "[namespace]" \
  --key "[key]"

# List namespace
npx claude-flow@v3alpha memory list --namespace "[namespace/*]"

# Search (HNSW - 150x faster in V3)
npx claude-flow@v3alpha memory search "[query]"
```

### Claims (V3 NEW - Multi-Session)

```bash
# Claim issue
npx claude-flow@v3alpha issues claim #[issue-number] --agent [agent-type]

# Check claims
npx claude-flow@v3alpha issues list --claimed

# Status update
npx claude-flow@v3alpha issues status #[issue-number]

# Hand off
npx claude-flow@v3alpha issues handoff #[issue-number] --to [agent-type]

# Release
npx claude-flow@v3alpha issues release #[issue-number]
```

### Swarm

```bash
# Initialize swarm
npx claude-flow@v3alpha swarm init --topology mesh

# Swarm status
npx claude-flow@v3alpha swarm status

# Monitor
npx claude-flow@v3alpha swarm monitor
```

### Hive-Mind

```bash
# Initialize hive
npx claude-flow@v3alpha hive-mind init --topology mesh

# Status
npx claude-flow@v3alpha hive-mind status --verbose

# Join as worker
npx claude-flow@v3alpha hive-mind join --role worker

# Leave
npx claude-flow@v3alpha hive-mind leave

# Broadcast
npx claude-flow@v3alpha hive-mind broadcast --message "[message]"

# Consensus
npx claude-flow@v3alpha hive-mind consensus --action propose --type "[type]" --value "[value]"
```

### Skills (V3 NEW)

```bash
# List skills
npx claude-flow@v3alpha skill list

# Execute skill
npx claude-flow@v3alpha skill execute sparc-methodology

# Common skills:
# /sparc:specification, /sparc:architect, /sparc:tdd, /sparc:reviewer
# /github:code-review, /github:release-manager
```

### Intelligence (SONA)

```bash
# Check learning status
npx claude-flow@v3alpha hooks intelligence --showStatus

# Force learning cycle
npx claude-flow@v3alpha hooks intelligence --forceTraining

# Pattern search
npx claude-flow@v3alpha hooks intelligence_pattern-search --query "[query]"
```

---

## V3 Architecture

### Hook Configuration (`.claude/settings.json`)

V3 hooks are pre-configured to run automatically:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "command": "npx claude-flow@alpha hooks pre-edit --file '{}' --auto-assign-agents true --load-context true"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "command": "npx claude-flow@alpha hooks post-edit --file '{}' --format true --update-memory true"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "command": "npx claude-flow@alpha hooks session-end --generate-summary true --persist-state true --export-metrics true"
      }]
    }]
  }
}
```

**This means:**
- Every file operation triggers context loading and memory updates
- Session metrics are exported automatically on completion
- Agents don't need to manually call these hooks

### Unified Coordinator

V3 consolidates all coordinator types into `unified-coordinator`:

| V2 | V3 |
|----|----|
| `hierarchical-coordinator` | `unified-coordinator` |
| `mesh-coordinator` | `unified-coordinator` |
| `ring-coordinator` | `unified-coordinator` |
| `star-coordinator` | `unified-coordinator` |

The unified coordinator auto-selects optimal topology.

### Memory Architecture

```
┌─────────────────────────────────────────┐
│           V3 MEMORY STACK               │
├─────────────────────────────────────────┤
│  HNSW Index (150x faster search)        │
│           ↓                             │
│  Namespace/Key Store                    │
│           ↓                             │
│  Persistent SQLite (cross-session)      │
└─────────────────────────────────────────┘
```

Namespacing pattern:
```
swarm/[project]/plan          # Swarm-wide plan
swarm/[agent]/progress        # Agent progress
swarm/[agent]/deliverable     # Agent output
hive/queen/plan               # Queen's strategy
hive/workers/[role]/status    # Worker status
```

---

## Agent Types

### Coordination

| Type | Purpose |
|------|---------|
| `unified-coordinator` | All coordination (replaces hierarchical/mesh/ring/star) |
| `queen-coordinator` | Hive-mind strategic coordination |

### Development

| Type | Purpose |
|------|---------|
| `system-architect` | Design, contracts, decisions |
| `coder` | General implementation |
| `backend-dev` | Backend/API/auth |
| `mobile-dev` | React Native |
| `tdd-london-swarm` | TDD (owns test + impl) |
| `tester` | Testing only |

### Review & Security

| Type | Purpose |
|------|---------|
| `reviewer` | Quality gates, validation |
| `security-architect` | Security-focused review |
| `code-analyzer` | Code quality analysis |

### Research & Planning

| Type | Purpose |
|------|---------|
| `researcher` | Investigation, patterns |
| `planner` | Task breakdown |

---

## Quality Gates

**Always specify in prompts:**

```bash
# TypeScript
npx tsc --noEmit
# Target: 0 errors

# Tests
npm test
# Target: 100% passing

# Lint
npm run lint
# Target: 0 errors

# Coverage (optional)
npm test -- --coverage
# Target: 90%+
```

---

## V3 Requirements

- **Node.js**: 20+ (required for V3)
- **npm**: 10+
- **Claude Code**: Latest version

---

## Migration from V2

| Change | Action |
|--------|--------|
| Package | `@alpha` → `@v3alpha` |
| Coordinators | Use `unified-coordinator` for all |
| **Protocol** | **6-step → 3-step** (hooks are automatic) |
| Agent routing | Consider `route task` before spawning |
| Multi-session | Use Claims System |
| Templates | Still required (two-step workflow) |

---

## Troubleshooting

### Hooks Not Running

1. Check `.claude/settings.json`:
```bash
cat .claude/settings.json | jq '.hooks'
```

2. Verify hooks are configured for Write/Edit operations

### Memory Not Found

```bash
# Verify namespace exists
npx claude-flow@v3alpha memory list --namespace "[namespace]/*"
```

### Daemon Not Starting

```bash
# Check for port conflicts
npx claude-flow@v3alpha daemon status

# Force restart
npx claude-flow@v3alpha daemon stop
npx claude-flow@v3alpha daemon start
```

### Claims Conflicts

```bash
# Check who has claim
npx claude-flow@v3alpha issues status #[issue]

# Force release (with caution)
npx claude-flow@v3alpha issues release #[issue] --force
```

---

## Links

- [Binto-Flow README](./README.md)
- [Workflow Guide](./workflow.md)
- [Swarm Templates](./swarm-templates.md)
- [Hive-Mind Templates](./hive-mind-templates.md)
- [Ralph Integration](./ralph-integration.md)

---

**Version**: 2.0 | **Last Updated**: 2026-01-17

