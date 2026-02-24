# Auto-Index Setup Guide

> Auto-index project documentation (ADRs, specs, requirements) into claude-flow memory at session start.

---

## Quick Setup (2 Steps)

### Step 1: Copy the Hook

```bash
# Create .claude/helpers directory if needed
mkdir -p .claude/helpers

# Copy the hook script
curl -sL https://raw.githubusercontent.com/ruvnet/claude-flow/main/.claude/helpers/autoindex-docs.sh \
  > .claude/helpers/autoindex-docs.sh

chmod +x .claude/helpers/autoindex-docs.sh
```

### Step 2: Wire into Settings

Add to `.claude/settings.json` under `hooks.SessionStart`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "timeout": 10000,
            "command": ".claude/helpers/autoindex-docs.sh 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

Or append to existing SessionStart hooks:

```json
{
  "type": "command",
  "timeout": 10000,
  "command": ".claude/helpers/autoindex-docs.sh 2>/dev/null || true"
}
```

---

## What Gets Indexed

| Location | Type | Memory Namespace |
|----------|------|------------------|
| `docs/adrs/*.md` | `decision` | `project/adrs` |
| `docs/decisions/*.md` | `decision` | `project/adrs` |
| `adrs/*.md` | `decision` | `project/adrs` |
| `decisions/*.md` | `decision` | `project/adrs` |
| `SPEC.md` | `artifact` | `project/specs` |
| `REQUIREMENTS.md` | `artifact` | `project/specs` |
| `docs/spec.md` | `artifact` | `project/specs` |
| `docs/requirements.md` | `artifact` | `project/specs` |
| `CLAUDE.md` | `artifact` | `project/config` |

---

## Memory Entry Structure

```json
{
  "namespace": "project/adrs",
  "key": "adr-001",
  "type": "decision",        // permanent
  "value": {
    "title": "Use JWT for Auth",
    "status": "accepted",
    "context": "[first 200 chars of context section]",
    "file": "/path/to/adr-001.md",   // source of truth
    "hash": "abc123def456",           // for staleness detection
    "indexed_at": "2026-01-29T03:37:10+00:00"
  },
  "tags": ["adr", "accepted"]
}
```

---

## Usage in Agents

### Search for Relevant ADRs

```bash
# CLI
npx claude-flow@alpha memory search -q "authentication" --namespace project/adrs

# MCP
mcp__claude-flow_alpha__memory_search({
  query: "authentication",
  namespace: "project/adrs",
  limit: 5
})
```

### In Agent Prompts

```markdown
## CONTEXT RETRIEVAL (Before Implementation)

1. Check for relevant ADRs:
   npx claude-flow@alpha memory search -q "[your task keywords]" --namespace project/adrs

2. If results found, read the referenced file:
   The `file` field contains the full path - use Read tool to get full content

This ensures you follow existing architectural decisions.
```

---

## Configuration

Environment variables (optional):

```bash
# Custom namespace prefix (default: "project")
export CLAUDE_FLOW_NAMESPACE="myapp"

# Custom CLI path (default: "npx claude-flow@alpha")
export CLAUDE_FLOW_CLI="npx @claude-flow/cli@latest"
```

---

## How It Works

1. **SessionStart** hook triggers at conversation start
2. Script scans known documentation locations
3. For each file:
   - Calculates MD5 hash
   - Checks if already indexed with same hash (skip if unchanged)
   - Extracts title, status, context summary
   - Stores in memory with file reference
4. Subsequent sessions skip unchanged files (hash match)

---

## Staleness Detection

The `hash` field enables automatic re-indexing when files change:

```
Session 1: Index adr-001.md (hash: abc123)
Session 2: hash matches → skip
Session 3: File edited → hash differs → re-index
```

---

## Troubleshooting

### Hook Not Running

```bash
# Test manually
.claude/helpers/autoindex-docs.sh

# Check memory is working
npx claude-flow@alpha memory stats
```

### Nothing Indexed

```bash
# Check for expected files
ls -la docs/adrs/ SPEC.md REQUIREMENTS.md CLAUDE.md

# The hook only indexes files that exist
```

### Memory Full/Slow

```bash
# Check memory stats
npx claude-flow@alpha memory stats

# Clean old entries if needed
npx claude-flow@alpha memory list --namespace project
```

---

## Version
- **Version**: 1.0
- **Date**: 2026-01-29
- **Requires**: claude-flow v3.0.0-alpha+
