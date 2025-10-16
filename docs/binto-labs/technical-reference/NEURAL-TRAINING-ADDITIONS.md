# Neural Training - Binto Labs Additions

> **Note:** This document contains fork-specific additions to neural training documentation.
>
> For complete upstream documentation, see the main `docs/` directory from [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow).

## ReasoningBank Integration (Added by Fork)

**Version:** Added in v2.7.0-alpha
**Integration:** agentic-flow@1.5.13

### Quick Summary

ReasoningBank adds AI-powered semantic memory to claude-flow using SQLite backend with vector embeddings.

- **27+ neural reasoning models** (convergent, divergent, lateral, systems thinking, etc.)
- **11,000+ pre-trained patterns** ready for immediate use
- **2-3ms semantic queries** (100-600x faster than traditional AI APIs)
- **$0 cost** with hash embeddings (vs $365/year for LLM APIs)

### Architecture Overview

```
┌─────────────────────────────────────┐
│   claude-flow CLI                   │
│   └─> memory --reasoningbank flag  │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  reasoningbank-adapter.js            │
│  • Store/Query/List operations       │
│  • Semantic search with MMR ranking  │
│  • Query caching (LRU: 100, 60s TTL)│
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  SQLite Database                     │
│  Location: .swarm/memory.db          │
│  • patterns table                    │
│  • pattern_embeddings (vector)       │
│  • task_trajectories                 │
│  • pattern_links                     │
└──────────────────────────────────────┘
```

### Memory Model Mapping

| claude-flow | ReasoningBank Pattern |
|-------------|----------------------|
| key | title (user-friendly key) |
| value | content (main content) |
| namespace | namespace (default: "default") |
| type | components.reliability |

### Usage

**Store Memory:**
```bash
npx claude-flow@alpha memory store "api_design" \
  '{"endpoint": "/users", "method": "GET"}' \
  --reasoningbank \
  --namespace my-project
```

**Semantic Query:**
```bash
npx claude-flow@alpha memory query "user authentication patterns" \
  --rb \
  --namespace my-project \
  --limit 5
```

**List All Memories:**
```bash
npx claude-flow@alpha memory list \
  --reasoningbank \
  --namespace my-project
```

### Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Store memory | 5-8ms | With embedding generation |
| Semantic query | 2-3ms | Cached queries 30-60x faster |
| List memories | 1-2ms | Direct database query |
| MMR ranking | 1ms | Multi-factor scoring |

### Database Schema

**4 Core Tables:**
1. `patterns` - Core memory storage
2. `pattern_embeddings` - text-embedding-3-small (1536-dim)
3. `task_trajectories` - Task execution history
4. `pattern_links` - Relationships between patterns

**3 Views:**
- `v_patterns_with_embeddings` - Joined pattern + embedding data
- `v_recent_patterns` - Last 100 patterns
- `v_pattern_usage_stats` - Usage analytics

### Integration Points

**MCP Tools:**
```javascript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "pattern",
  value: "data",
  mode: "reasoningbank"  // Enable ReasoningBank
})
```

**Hooks Integration:**
```bash
# Pre-task: Retrieve relevant memories
npx claude-flow@alpha hooks pre-task --description "Build API"

# Post-task: Learn from execution
npx claude-flow@alpha hooks post-task --task-id "task-001"
```

### References

- **Full Documentation:** `docs/binto-labs/technical-reference/REASONINGBANK-INTEGRATION.md`
- **Implementation:** `src/reasoningbank/reasoningbank-adapter.js` (404 lines)
- **Upstream:** Part of v2.7.0-alpha merge from ruvnet/claude-flow

---

**For complete neural training documentation, refer to the upstream docs in the main `docs/` directory.**
