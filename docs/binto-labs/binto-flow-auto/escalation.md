---
status: keep
phase: complete
type: guide
version: 3.0
last-updated: 2026-01-27
title: Escalation Protocol (Binto-Flow-Auto)
author: Claude Code + Human Developer
tags: [escalation, consensus, hive-mind, memory, claude-flow, v3, binto-flow]
---

# Escalation Protocol (Binto-Flow-Auto)

> **Mechanism:** Claude-flow hive-mind consensus + structured memory
> **When:** Agent blocked after max iterations, or fix agent fails after max retries

---

## Escalation Flow

```
Agent hits max iterations (10)
  → Stores blocker in claude-flow memory
  → Outputs AGENT_BLOCKED
      ↓
Orchestrator reads blocker
  → Spawns targeted fix agent
  → Fix agent self-gates (Ralph loop, max 10)
      ↓
Fix agent succeeds? → Continue
Fix agent also blocked?
      ↓
Propose escalation via consensus
  → npx claude-flow@v3alpha hive-mind consensus \
      --action propose --type "escalate"
      ↓
Store escalation context in memory
  → Human reads structured escalation report
  → Human resolves and stores resolution pattern
```

---

## Step 1: Blocker in Memory

When an agent is blocked, it stores structured context:

```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/blockers" \
  --key "[AGENT]" \
  --value '{
    "agent": "[AGENT]",
    "issue": "[description]",
    "attempts": 10,
    "last_error": "[final error message]",
    "files": ["[affected files]"],
    "timestamp": "[ISO timestamp]"
  }'
```

---

## Step 2: Fix Agent Attempt

The orchestrator spawns a targeted fix agent:

```javascript
Task({
  description: 'Fix Agent',
  prompt: `Fix this specific issue:
    Agent: ${blocker.agent}
    Issue: ${blocker.issue}
    Error: ${blocker.last_error}
    Files: ${blocker.files.join(', ')}

    ONLY fix the issue described. Do NOT refactor.
    Verify: tsc --noEmit && npm test
    Iterate until pass (max 10).`,
  subagent_type: 'coder',
  model: 'opus'
})
```

---

## Step 3: Consensus Escalation

If the fix agent is also blocked, propose escalation via hive-mind:

```bash
npx claude-flow@v3alpha hive-mind consensus \
  --action propose \
  --type "escalate" \
  --value '{
    "original_agent": "[AGENT]",
    "fix_agent_attempted": true,
    "total_attempts": 20,
    "blocker": "[description]",
    "pattern": "[error pattern analysis]"
  }'
```

---

## Step 4: Structured Escalation Report

Store a human-readable escalation report in memory:

```bash
npx claude-flow@v3alpha memory store \
  --namespace "swarm/escalations" \
  --key "$(date +%Y%m%d)-[brief-description]" \
  --value '{
    "phase": "[which phase]",
    "agent": "[which agent]",
    "total_attempts": 20,
    "session": "[swarm session id]",
    "retry_history": [
      {"attempt": 1, "action": "[what was tried]", "result": "[what happened]"},
      {"attempt": 2, "action": "[what was tried]", "result": "[what happened]"},
      {"attempt": 3, "action": "[what was tried]", "result": "[what happened]"}
    ],
    "error_pattern": "[are errors circular? escalating? unrelated?]",
    "likely_root_cause": [
      "[possibility 1]",
      "[possibility 2]"
    ],
    "suggested_actions": [
      "[specific action 1]",
      "[specific action 2]"
    ],
    "affected_files": ["[file1]", "[file2]"],
    "resume_command": "npx claude-flow@v3alpha swarm resume --session [id]"
  }'
```

The human reads this from memory or it's output directly:

```bash
# Human can query escalation history
npx claude-flow@v3alpha memory retrieve \
  --namespace "swarm/escalations" --key "[key]"
```

---

## Example Escalation

### Circular Type Error

```json
{
  "phase": "build",
  "agent": "coder",
  "total_attempts": 20,
  "session": "auth-feature-20260127",
  "retry_history": [
    {"attempt": 1, "action": "Fixed TS2322 in auth.ts", "result": "New TS2339 in middleware.ts"},
    {"attempt": 2, "action": "Fixed TS2339 in middleware.ts", "result": "TS2322 returned in auth.ts"},
    {"attempt": 3, "action": "Fixed both simultaneously", "result": "Type conflict between modules"}
  ],
  "error_pattern": "Circular — fixing one breaks the other",
  "likely_root_cause": [
    "contracts.ts types don't match actual implementation needs",
    "Two modules have incompatible expectations of the same type"
  ],
  "suggested_actions": [
    "Review contracts.ts — are the types feasible?",
    "Check if AuthToken type needs revision"
  ],
  "affected_files": ["src/auth.ts", "src/middleware.ts", "src/contracts.ts"],
  "resume_command": "npx claude-flow@v3alpha swarm resume --session auth-feature-20260127"
}
```

---

## Post-Escalation: Record Resolution

After the human resolves the issue, store the pattern for future reference:

```bash
npx claude-flow@v3alpha memory store \
  --namespace "patterns/escalation-resolutions" \
  --key "$(date +%Y%m%d)-[brief-description]" \
  --value '{
    "error_pattern": "[what went wrong]",
    "root_cause": "[what actually caused it]",
    "resolution": "[how it was fixed]",
    "prevention": "[how to avoid in future]"
  }'
```

Future swarms can search for these patterns:

```bash
# Search for similar past escalations
npx claude-flow@v3alpha memory search "circular type error auth"
```

HNSW makes this search fast (150x faster than linear scan).

---

## Escalation Metrics

Track escalation frequency to improve the methodology:

```bash
# List all escalations
npx claude-flow@v3alpha memory list --namespace "swarm/escalations/*"

# List all resolutions
npx claude-flow@v3alpha memory list --namespace "patterns/escalation-resolutions/*"

# Search for patterns
npx claude-flow@v3alpha memory search "escalation root_cause"
```

**Target:** < 10% of swarms should require human escalation.

---

## Key Differences from v2.1

| v2.1 | v3.0 |
|------|------|
| Custom escalation template (markdown) | Structured JSON in claude-flow memory |
| Manual pattern recording | HNSW-searchable resolution patterns |
| Custom escalation protocol | Hive-mind consensus proposes action |
| Resume via CLI only | Memory + CLI resume |

---

**Version**: 3.0 | **Last Updated**: 2026-01-27 | **Track**: B (Progressive)
