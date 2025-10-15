# Claude-Flow Memory Architecture: Technical Reference

**Version:** v2.5.0-alpha.140
**Last Updated:** 2025-10-15
**Audience:** Developers, architects, contributors

---

## Table of Contents

1. [Overview](#overview)
2. [Storage Architecture](#storage-architecture)
3. [Persistence Model](#persistence-model)
4. [Conflict Resolution Mechanisms](#conflict-resolution-mechanisms)
5. [Memory Lifecycle](#memory-lifecycle)
6. [Performance Optimizations](#performance-optimizations)
7. [API Reference](#api-reference)

---

## Overview

Claude-Flow implements a **dual-layer persistent memory system** designed to solve the critical problem of document proliferation and conflicting decisions in AI-assisted development. Unlike traditional AI coding assistants that create multiple versions of documents (`design-v1.md`, `design-v2.md`, `design-final-REAL.md`), Claude-Flow maintains a **single source of truth** through sophisticated conflict resolution and consensus mechanisms.

### Key Design Principles

1. **Upsert over Append:** Updates existing keys instead of creating new documents
2. **Consensus over Chaos:** Multi-agent voting resolves conflicting decisions
3. **Byzantine Tolerance:** Automatic detection and quarantine of unreliable agents
4. **Automatic Consolidation:** Merges similar memories to prevent redundancy
5. **Cross-Session Persistence:** Memory survives process restarts and system reboots

---

## Storage Architecture

### Dual-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│              (Agents, SPARC, Verification)               │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   Memory Coordinator    │
         │   (Conflict Resolution) │
         └───┬─────────────────┬───┘
             │                 │
    ┌────────▼─────┐   ┌──────▼────────┐
    │  LRU Cache   │   │ SQLite DB     │
    │  (Hot Keys)  │   │ (Persistence) │
    │  ~50MB RAM   │   │ .hive-mind/   │
    │  1000 entries│   │ hive.db       │
    └──────────────┘   └───────────────┘
         LAYER 1           LAYER 2
       (Speed)          (Durability)
```

### Layer 1: LRU Cache (In-Memory)

**File:** `src/cli/simple-commands/hive-mind/memory.js:68-159`

```javascript
class OptimizedLRUCache {
  constructor(maxSize = 1000, maxMemoryMB = 50) {
    this.maxSize = maxSize;
    this.maxMemory = maxMemoryMB * 1024 * 1024;
    this.cache = new Map();  // Insertion order = LRU order
    this.currentMemory = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      this.hits++;
      return value.data;
    }
    this.misses++;
    return null;
  }

  set(key, data) {
    // Evict LRU entries if memory pressure
    if (this.currentMemory + size > this.maxMemory) {
      this._evictByMemoryPressure(size);
    }

    // Evict oldest entry if size limit reached
    if (this.cache.size >= this.maxSize) {
      this._evictLRU();  // Remove first entry (oldest)
    }

    this.cache.set(key, { data, size, timestamp });
  }
}
```

**Characteristics:**
- **Hit rate:** 70-90% for typical workloads
- **Eviction policy:** Least Recently Used (LRU)
- **Memory pressure:** Automatic eviction when approaching 50MB limit
- **Entry size tracking:** Estimates JSON serialized size

### Layer 2: SQLite Database (Persistent)

**File:** `src/cli/simple-commands/hive-mind/memory.js:233-285`

```sql
CREATE TABLE collective_memory (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value BLOB,
  type TEXT DEFAULT 'knowledge',
  confidence REAL DEFAULT 1.0,
  created_by TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  accessed_at INTEGER DEFAULT (strftime('%s','now')),
  access_count INTEGER DEFAULT 0,
  compressed INTEGER DEFAULT 0,
  size INTEGER DEFAULT 0,
  FOREIGN KEY (swarm_id) REFERENCES swarms(id)
);

-- Optimized indexes
CREATE UNIQUE INDEX idx_memory_swarm_key
ON collective_memory(swarm_id, key);

CREATE INDEX idx_memory_type_accessed
ON collective_memory(type, accessed_at DESC);

CREATE INDEX idx_memory_size_compressed
ON collective_memory(size, compressed);
```

**Optimizations:**
```javascript
// Performance pragmas
this.db.pragma('journal_mode = WAL');         // Write-Ahead Logging
this.db.pragma('synchronous = NORMAL');       // Fast commits
this.db.pragma('cache_size = -64000');        // 64MB cache
this.db.pragma('temp_store = MEMORY');        // Temp tables in RAM
this.db.pragma('mmap_size = 268435456');      // 256MB memory mapping
```

**Persistence guarantees:**
- **Durability:** WAL mode ensures writes survive crashes
- **Auto-sync interval:** 30 seconds (configurable)
- **Graceful shutdown:** Final sync before process exit
- **Crash recovery:** WAL checkpoint on startup

---

## Persistence Model

### Memory Retention by Type

**File:** `src/cli/simple-commands/hive-mind/memory.js:13-24`

```javascript
const MEMORY_TYPES = {
  knowledge:  { priority: 1, ttl: null,      compress: false },  // PERMANENT
  consensus:  { priority: 1, ttl: null,      compress: false },  // PERMANENT
  system:     { priority: 1, ttl: null,      compress: false },  // PERMANENT
  result:     { priority: 2, ttl: null,      compress: true  },  // PERMANENT

  error:      { priority: 1, ttl: 86400000,  compress: false },  // 24 hours
  context:    { priority: 2, ttl: 3600000,   compress: false },  // 1 hour
  task:       { priority: 3, ttl: 1800000,   compress: true  },  // 30 minutes
  metric:     { priority: 3, ttl: 3600000,   compress: true  },  // 1 hour
};
```

### Key-Based Upsert Pattern

**File:** `src/cli/simple-commands/hive-mind/memory.js:449-500`

```javascript
async store(key, value, type = 'knowledge', metadata = {}) {
  // Check if key already exists
  const existing = this.db.prepare(`
    SELECT id FROM collective_memory
    WHERE swarm_id = ? AND key = ?
  `).get(this.config.swarmId, key);

  if (existing) {
    // UPDATE existing entry (NO NEW DOCUMENT)
    this.db.prepare(`
      UPDATE collective_memory
      SET value = ?, type = ?, confidence = ?,
          accessed_at = CURRENT_TIMESTAMP,
          access_count = access_count + 1,
          compressed = ?, size = ?
      WHERE swarm_id = ? AND key = ?
    `).run(storedValue, type, metadata.confidence || 1.0,
           compressed, size, this.config.swarmId, key);
  } else {
    // Only INSERT if key truly doesn't exist
    this.db.prepare(`
      INSERT INTO collective_memory
      (id, swarm_id, key, value, type, confidence, created_by, compressed, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, this.config.swarmId, key, storedValue,
           type, metadata.confidence || 1.0,
           metadata.createdBy || 'system', compressed, size);
  }

  // Update cache for fast retrieval
  this.cache.set(key, { value, type, timestamp: Date.now(), size });
}
```

**Key insight:** The same memory key is **UPDATED**, not **APPENDED**. This prevents proliferation of `architecture/auth-v1`, `architecture/auth-v2`, etc.

### Versioning Without File Duplication

**File:** `src/hive-mind/memory.js:159-202`

```javascript
const entry = {
  key: fullKey,
  value: storedValue,
  version: 1,                    // Version counter
  createdAt: Date.now(),
  updatedAt: Date.now(),

  accessCount: 0,
  accessHistory: [],             // WHO accessed WHEN

  // Preserve history when updating
  const existingEntry = this.memory.get(fullKey);
  if (existingEntry) {
    entry.version = existingEntry.version + 1;  // Increment
    entry.createdAt = existingEntry.createdAt;  // Original timestamp
    entry.accessHistory = existingEntry.accessHistory;
  }
};
```

**Version history tracking:**
```bash
# Evolution of a decision over time
architecture/auth:
  v1 (2025-10-14 10:00): {decision: "JWT"}
  v2 (2025-10-15 14:30): {decision: "JWT + refresh tokens"}
  v3 (2025-10-16 09:15): {decision: "JWT + refresh + OAuth2"}  ← CURRENT
```

**File system impact:**
- **Traditional AI coder:** 3 files created (`auth-v1.md`, `auth-v2.md`, `auth-v3.md`)
- **Claude-Flow:** 1 database row with version counter (3 versions tracked, 0 file proliferation)

---

## Conflict Resolution Mechanisms

### 1. Multi-Agent Consensus Voting

**File:** `src/hive-mind/consensus.js:62-104`

When multiple agents propose conflicting decisions, the system triggers a **consensus vote** instead of storing multiple contradictory memories.

#### Consensus Algorithms

```javascript
// 1. Weighted Majority (Default)
weightedMajorityConsensus(proposal) {
  const { positiveVotes, negativeVotes, totalWeight } = this.calculateVotes(proposal);
  const ratio = totalWeight > 0 ? positiveVotes / totalWeight : 0;
  const consensus = ratio >= proposal.threshold;  // Default: 0.6 (60%)

  return { consensus, ratio, positiveVotes, negativeVotes, totalWeight };
}

// 2. Byzantine Tolerant (Security-Critical Decisions)
byzantineTolerantConsensus(proposal) {
  // Only count votes from trusted agents (no Byzantine flags, reputation > 0.7)
  const trustedVotes = votes.filter(v => {
    const agent = this.agents.get(v.agentId);
    return agent && agent.byzantineFlags === 0 && agent.reputation > 0.7;
  });

  const ratio = positiveVotes / totalTrusted;
  const byzantineThreshold = Math.max(proposal.threshold, 0.67);  // Min 67%
  const consensus = ratio >= byzantineThreshold;

  return { consensus, ratio, trustedVotesOnly: true };
}

// 3. Unanimous (Mission-Critical Decisions)
unanimousConsensus(proposal) {
  const votes = Array.from(proposal.votes.values());
  const allAgree = votes.every(v => v.vote) || votes.every(v => !v.vote);
  const consensus = allAgree && votes.length > 0;

  return { consensus, ratio: consensus ? 1.0 : 0.0 };
}

// 4. Simple Majority (Democratic)
simpleMajorityConsensus(proposal) {
  const positiveVotes = votes.filter(v => v.vote).length;
  const totalVotes = votes.length;
  const ratio = totalVotes > 0 ? positiveVotes / totalVotes : 0;
  const consensus = ratio >= proposal.threshold;

  return { consensus, ratio };
}
```

#### Real-World Example

```javascript
// Scenario: 5 architects disagree on database choice

// Step 1: Create consensus proposal
const proposalId = await consensus.createProposal({
  type: 'architecture_decision',
  content: {
    key: 'architecture/database',
    options: ['PostgreSQL', 'MongoDB', 'MySQL']
  },
  threshold: 0.6,              // Need 60% agreement
  algorithm: 'weighted_majority',
  requiredCapabilities: ['database_design']
});

// Step 2: Agents vote with reasoning
await consensus.submitVote(proposalId, 'architect-1', 'PostgreSQL',
  'ACID compliance for financial transactions');
await consensus.submitVote(proposalId, 'architect-2', 'PostgreSQL',
  'Strong relational integrity');
await consensus.submitVote(proposalId, 'architect-3', 'MongoDB',
  'Document flexibility');
await consensus.submitVote(proposalId, 'architect-4', 'PostgreSQL',
  'JSON support + ACID');
await consensus.submitVote(proposalId, 'architect-5', 'PostgreSQL',
  'Better query optimizer');

// Step 3: Consensus reached (4/5 = 80% voted PostgreSQL)
const result = await consensus.finalizeProposal(proposalId);
// result = {
//   consensus: true,
//   finalRatio: 0.8,
//   positiveVotes: 4,
//   negativeVotes: 1,
//   algorithm: 'weighted_majority'
// }

// Step 4: SINGLE memory entry stored
await memory.store('architecture/database', {
  decision: 'PostgreSQL',
  reasoning: 'ACID compliance, relational integrity, JSON support',
  consensus: true,
  votes: { PostgreSQL: 4, MongoDB: 1 },
  confidence: 0.8,
  participants: 5
}, 'knowledge');
```

**Result:** ONE decision stored, not 3 conflicting documents.

### 2. Byzantine Fault Detection

**File:** `src/hive-mind/consensus.js:198-265`

Automatically detects and quarantines unreliable agents using three detection patterns:

#### Detection Patterns

```javascript
detectByzantineBehavior(proposal, voteRecord) {
  const { agentId, vote, confidence } = voteRecord;
  const agent = this.agents.get(agentId);

  // Pattern 1: Vote Flipping (Inconsistency)
  // Agent changes their vote frequently
  const recentVotes = this.getRecentVotes(agentId, last_hour);
  const voteChanges = this.countVoteChanges(recentVotes);

  if (voteChanges >= 2) {
    this.flagByzantineAgent(agentId, 'vote_flipping', proposal.id);
  }

  // Pattern 2: Confidence Mismatch (Overconfidence)
  // Agent has low confidence but votes definitively
  if (confidence < 0.3 && Math.abs(vote ? 1 : 0) === 1) {
    this.flagByzantineAgent(agentId, 'confidence_mismatch', proposal.id);
  }

  // Pattern 3: Contrarian Pattern (Always Disagrees)
  // Agent consistently votes against consensus
  const agentHistory = this.getVoteHistory(agentId, last_10_votes);
  const minorityVotes = agentHistory.filter(v =>
    v.vote !== consensus_result
  ).length;

  if (minorityVotes / agentHistory.length > 0.8) {  // >80% minority votes
    this.flagByzantineAgent(agentId, 'contrarian_pattern', proposal.id);
  }
}
```

#### Agent Reputation System

```javascript
flagByzantineAgent(agentId, reason, proposalId) {
  const agent = this.agents.get(agentId);

  agent.byzantineFlags++;
  agent.weight *= 0.95;              // Reduce voting power by 5%
  agent.reputation *= 0.95;

  console.warn(`Byzantine behavior detected: ${agentId}, Reason: ${reason}`);

  // Quarantine after 5 flags
  if (agent.byzantineFlags >= 5) {
    agent.isOnline = false;          // Remove from voting pool
    agent.weight = 0;                // Zero voting power
    this.emit('agent:quarantined', { agentId, flags: 5 });
  }
}

updateAgentReputations(proposal) {
  if (!proposal.consensus) return;

  const majorityVote = proposal.finalRatio >= 0.5;

  for (const [agentId, vote] of proposal.votes) {
    const votedWithMajority = vote.vote === majorityVote;

    if (votedWithMajority) {
      agent.reputation = Math.min(2.0, agent.reputation * 1.05);  // +5%
      agent.weight = Math.min(2.0, agent.weight * 1.02);          // +2%
      agent.correctVotes++;
    } else {
      agent.reputation *= 0.98;      // -2%
      agent.weight *= 0.99;          // -1%
    }
  }
}
```

#### Real-World Scenario

```
Timeline: Bad agent gets progressively penalized

Vote 1: Agent proposes MongoDB for auth system
  → Minority (3/5 disagree)
  → Flag: contrarian_pattern
  → Reputation: 1.0 → 0.98
  → Weight: 1.0 → 0.99

Vote 2: Agent changes to PostgreSQL
  → Then changes back to MongoDB (vote flipping)
  → Flag: vote_flipping
  → Reputation: 0.98 → 0.93
  → Weight: 0.99 → 0.94

Vote 3: Agent proposes NoSQL with 0.2 confidence
  → Flag: confidence_mismatch
  → Reputation: 0.93 → 0.88
  → Weight: 0.94 → 0.89

Vote 4: Agent disagrees with consensus again
  → Flag: contrarian_pattern
  → Reputation: 0.88 → 0.84
  → Weight: 0.89 → 0.85

Vote 5: Agent disagrees with consensus again
  → Flag: contrarian_pattern (5th flag!)
  → agent.isOnline = false
  → agent.weight = 0
  → STATUS: QUARANTINED

Result: Agent removed from all future voting
```

### 3. Automatic Memory Consolidation

**File:** `src/cli/simple-commands/hive-mind/memory.js:700-800`

Periodically merges similar memories to prevent redundancy and conflicting information.

#### Consolidation Process

```javascript
async consolidate() {
  // Step 1: Find memories eligible for consolidation
  const memories = this.db.prepare(`
    SELECT key, value, type, confidence, access_count
    FROM collective_memory
    WHERE swarm_id = ?
    AND type IN ('knowledge', 'result')
    ORDER BY created_at DESC
    LIMIT 1000
  `).all(this.config.swarmId);

  // Step 2: Group by similarity
  const consolidated = new Map();

  memories.forEach((memory) => {
    const value = JSON.parse(memory.value);
    const category = this._categorizeMemory(value);

    if (!consolidated.has(category)) {
      consolidated.set(category, []);
    }
    consolidated.get(category).push({ ...memory, value });
  });

  // Step 3: Merge similar memories
  let mergeCount = 0;
  consolidated.forEach((group, category) => {
    if (group.length > 1) {
      const merged = this._mergeMemories(group);

      // Store consolidated memory
      this.store(`consolidated:${category}`, merged, 'knowledge', {
        confidence: merged.confidence,
        createdBy: 'consolidation'
      });

      mergeCount++;
    }
  });

  return { categories: consolidated.size, merged: mergeCount };
}

_categorizeMemory(value) {
  // Categorize by object structure
  if (typeof value === 'string') return 'text';

  if (typeof value === 'object') {
    const keys = Object.keys(value).sort().join(':');
    return `object:${keys.substring(0, 50)}`;
  }

  return 'other';
}

_mergeMemories(memories) {
  // Calculate weighted average confidence
  let totalWeight = 0;
  let weightedConfidence = 0;
  const mergedValue = {};

  memories.forEach((memory) => {
    const weight = memory.access_count + 1;  // More accessed = higher weight
    totalWeight += weight;
    weightedConfidence += memory.confidence * weight;

    // Merge object values (later values override earlier)
    Object.assign(mergedValue, memory.value);
  });

  return {
    value: mergedValue,
    confidence: weightedConfidence / totalWeight,
    sourceCount: memories.length
  };
}
```

#### Example Consolidation

```javascript
// Before consolidation: 3 similar entries
Memory 1: architecture/auth-v1 (access_count: 10, confidence: 0.85)
  → {type: "JWT", expiry: "1h"}

Memory 2: architecture/auth-impl (access_count: 15, confidence: 0.90)
  → {type: "JWT", expiry: "1h", refresh: true}

Memory 3: architecture/authentication (access_count: 5, confidence: 0.80)
  → {type: "JWT", expiry: "2h", refresh: true}

// After consolidation: 1 merged entry
consolidated:auth (sourceCount: 3, confidence: 0.87)
  → {
      type: "JWT",
      expiry: "2h",         // Latest value wins
      refresh: true,        // Latest value wins
      confidence: 0.87,     // Weighted average: (10*0.85 + 15*0.90 + 5*0.80) / 30
      sourceCount: 3
    }

// Original entries marked with consolidation reference
Memory 1: {consolidated_into: "consolidated:auth"}
Memory 2: {consolidated_into: "consolidated:auth"}
Memory 3: {consolidated_into: "consolidated:auth"}
```

**Consolidation triggers:**
- **Automatic:** Runs during garbage collection (every 5 minutes)
- **Memory pressure:** Triggered when memory usage exceeds threshold
- **Manual:** `npx claude-flow@alpha memory consolidate`

---

## Memory Lifecycle

### 1. Write Path

```
User/Agent
    │
    ├─▶ memory.store(key, value, type)
    │       │
    │       ├─▶ Check if key exists
    │       │     │
    │       │     ├─▶ EXISTS: UPDATE (version++, access_count++)
    │       │     └─▶ NEW: INSERT
    │       │
    │       ├─▶ Update LRU cache (instant access)
    │       │
    │       ├─▶ Queue for persistence (30s sync)
    │       │
    │       └─▶ Check memory limits
    │             └─▶ Trigger consolidation if needed
    │
    └─▶ Returns: {success: true, key, size}
```

### 2. Read Path

```
User/Agent
    │
    ├─▶ memory.retrieve(key)
    │       │
    │       ├─▶ Check LRU cache
    │       │     │
    │       │     ├─▶ CACHE HIT: Return immediately (70-90% of requests)
    │       │     └─▶ CACHE MISS: Continue to database
    │       │
    │       ├─▶ Query SQLite database
    │       │     │
    │       │     ├─▶ FOUND: Load into cache
    │       │     └─▶ NOT FOUND: Return null
    │       │
    │       ├─▶ Decompress if needed
    │       │
    │       ├─▶ Update access metadata
    │       │     ├─▶ access_count++
    │       │     ├─▶ accessed_at = now
    │       │     └─▶ accessHistory.push({agent, timestamp})
    │       │
    │       └─▶ Returns: value
```

### 3. Conflict Resolution Path

```
Multiple Agents → Conflicting Proposals
    │
    ├─▶ consensus.createProposal({key, options, threshold})
    │       │
    │       ├─▶ Determine eligible agents (capabilities + reputation)
    │       │
    │       ├─▶ Agents submit votes
    │       │     │
    │       │     ├─▶ Byzantine detection runs per vote
    │       │     │     ├─▶ Vote flipping check
    │       │     │     ├─▶ Confidence mismatch check
    │       │     │     └─▶ Contrarian pattern check
    │       │     │
    │       │     └─▶ Update agent reputation
    │       │
    │       ├─▶ Apply consensus algorithm
    │       │     ├─▶ weighted_majority (default)
    │       │     ├─▶ byzantine_tolerant (security)
    │       │     ├─▶ unanimous (critical)
    │       │     └─▶ simple_majority (democratic)
    │       │
    │       ├─▶ Finalize proposal
    │       │     ├─▶ consensus: true/false
    │       │     ├─▶ finalRatio: 0.0-1.0
    │       │     └─▶ participationRate
    │       │
    │       └─▶ Store SINGLE decision in memory
    │             └─▶ memory.store(key, consensus_result)
```

### 4. Garbage Collection Path

```
Background Timer (every 5 minutes)
    │
    ├─▶ _garbageCollect()
    │       │
    │       ├─▶ Delete expired memories by TTL
    │       │     ├─▶ context: >1 hour
    │       │     ├─▶ task: >30 minutes
    │       │     ├─▶ metric: >1 hour
    │       │     └─▶ error: >24 hours
    │       │
    │       ├─▶ Clear stale cache entries (>5 minutes)
    │       │
    │       ├─▶ Trigger consolidation if needed
    │       │
    │       └─▶ Update statistics
    │
    └─▶ Emit: 'memory:gc' event
```

---

## Performance Optimizations

### 1. Prepared Statements (10-100x faster)

**File:** `src/cli/simple-commands/hive-mind/memory.js:318-397`

```javascript
_prepareStatements() {
  // Prepare once, execute many times
  this.statements.set('insert', this.db.prepare(`
    INSERT OR REPLACE INTO collective_memory
    (id, swarm_id, key, value, type, confidence, created_by, compressed, size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `));

  this.statements.set('select', this.db.prepare(`
    SELECT value, type, compressed, confidence, access_count
    FROM collective_memory
    WHERE swarm_id = ? AND key = ?
  `));

  this.statements.set('updateAccess', this.db.prepare(`
    UPDATE collective_memory
    SET accessed_at = strftime('%s','now'), access_count = access_count + 1
    WHERE swarm_id = ? AND key = ?
  `));
}

// Usage: 10-100x faster than dynamic SQL
const result = this.statements.get('select').get(swarmId, key);
```

**Performance impact:**
- First execution: 10ms (statement preparation + execution)
- Subsequent executions: 0.1ms (execution only)
- **100x speedup** for repeated queries

### 2. Object Pooling (Reduces GC pressure)

**File:** `src/cli/simple-commands/hive-mind/memory.js:29-63`

```javascript
class MemoryPool {
  constructor(createFn, resetFn, maxSize = 1000) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.pool = [];
    this.allocated = 0;
    this.reused = 0;
  }

  acquire() {
    if (this.pool.length > 0) {
      this.reused++;
      return this.pool.pop();  // Reuse existing object
    }
    this.allocated++;
    return this.createFn();  // Create new object
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);       // Reset to initial state
      this.pool.push(obj);     // Return to pool
    }
  }
}

// Usage
this.pools = {
  queryResults: new MemoryPool(
    () => ({ results: [], metadata: {} }),
    (obj) => {
      obj.results.length = 0;
      Object.keys(obj.metadata).forEach(k => delete obj.metadata[k]);
    }
  ),
  memoryEntries: new MemoryPool(
    () => ({ id: '', key: '', value: '', metadata: {} }),
    (obj) => {
      obj.id = obj.key = obj.value = '';
      Object.keys(obj.metadata).forEach(k => delete obj.metadata[k]);
    }
  )
};

// Typical reuse rate: 50-80%
// Reduces garbage collection pauses by 30-50%
```

### 3. Write-Ahead Logging (WAL)

```javascript
this.db.pragma('journal_mode = WAL');

// Comparison:
// DELETE mode (default):
//   - Locks entire database during write
//   - Readers block writers, writers block readers
//   - Write throughput: ~100 writes/sec

// WAL mode (claude-flow):
//   - Readers and writers don't block each other
//   - Append-only write pattern (fast sequential writes)
//   - Write throughput: ~1000 writes/sec
//   - 10x improvement for concurrent workloads
```

### 4. Memory Mapping (mmap)

```javascript
this.db.pragma('mmap_size = 268435456');  // 256MB

// Benefit:
// - Operating system manages page cache
// - Reduces system calls for hot data
// - 20-40% faster reads for large datasets
```

### 5. Sharding (Distributes load)

**File:** `src/hive-mind/memory.js:92-123`

```javascript
initializeShards() {
  for (let i = 0; i < this.config.shardCount; i++) {  // Default: 16 shards
    this.shards.set(i, {
      id: i,
      keys: new Set(),
      size: 0,
      lastAccess: Date.now(),
      hotness: 0
    });
  }
}

getShardForKey(key) {
  const hash = this.hashKey(key);
  return hash % this.config.shardCount;
}

// Benefit:
// - Reduces lock contention
// - Enables parallel processing
// - Isolates hot keys to specific shards
```

---

## API Reference

### Core Operations

#### `memory.store(key, value, type, metadata)`

Stores or updates a memory entry.

**Parameters:**
- `key` (string): Unique identifier within namespace
- `value` (any): Data to store (will be JSON serialized)
- `type` (string): Memory type ('knowledge', 'context', 'task', etc.)
- `metadata` (object): Optional metadata
  - `confidence` (number): Confidence score 0.0-1.0
  - `createdBy` (string): Agent identifier
  - `ttl` (number): Time-to-live in milliseconds

**Returns:** `{success: true, id, size}`

**Example:**
```javascript
await memory.store('architecture/auth', {
  decision: 'JWT with refresh tokens',
  reasoning: 'Stateless, scalable, secure'
}, 'knowledge', {
  confidence: 0.95,
  createdBy: 'architect-agent-1'
});
```

#### `memory.retrieve(key)`

Retrieves a memory entry by key.

**Parameters:**
- `key` (string): Memory key to retrieve

**Returns:** Value or `null` if not found

**Example:**
```javascript
const authDecision = await memory.retrieve('architecture/auth');
// Returns: {decision: 'JWT with refresh tokens', reasoning: '...'}
```

#### `memory.search(pattern, options)`

Searches memory entries by pattern.

**Parameters:**
- `pattern` (string): Search pattern (supports wildcards)
- `options` (object):
  - `limit` (number): Max results (default: 50)
  - `type` (string): Filter by memory type
  - `minConfidence` (number): Minimum confidence threshold
  - `sortBy` (string): 'relevance', 'recent', 'created', 'access'

**Returns:** Array of `{key, value, score, metadata}`

**Example:**
```javascript
const archDecisions = await memory.search('architecture/*', {
  limit: 10,
  minConfidence: 0.8,
  sortBy: 'relevance'
});
```

#### `memory.consolidate()`

Manually triggers memory consolidation.

**Returns:** `{categories: number, merged: number}`

**Example:**
```javascript
const result = await memory.consolidate();
// Returns: {categories: 5, merged: 12}
// Merged 12 similar memories across 5 categories
```

### Consensus Operations

#### `consensus.createProposal(data)`

Creates a consensus proposal for voting.

**Parameters:**
- `data` (object):
  - `type` (string): Proposal type
  - `content` (any): Proposal content
  - `threshold` (number): Consensus threshold 0.0-1.0 (default: 0.6)
  - `algorithm` (string): 'weighted_majority', 'byzantine_tolerant', 'unanimous', 'simple_majority'
  - `requiredCapabilities` (array): Required agent capabilities
  - `timeout` (number): Voting deadline in milliseconds

**Returns:** Proposal ID

**Example:**
```javascript
const proposalId = await consensus.createProposal({
  type: 'architecture_decision',
  content: {
    key: 'architecture/database',
    options: ['PostgreSQL', 'MongoDB', 'MySQL']
  },
  threshold: 0.67,
  algorithm: 'byzantine_tolerant',
  requiredCapabilities: ['database_design'],
  timeout: 60000  // 1 minute
});
```

#### `consensus.submitVote(proposalId, agentId, vote, reasoning)`

Submits a vote on a proposal.

**Parameters:**
- `proposalId` (string): Proposal ID
- `agentId` (string): Agent identifier
- `vote` (boolean): true = approve, false = reject
- `reasoning` (string): Vote justification

**Returns:** `{status: 'recorded', proposal: proposalId}`

**Example:**
```javascript
await consensus.submitVote(
  proposalId,
  'architect-1',
  true,
  'PostgreSQL provides ACID guarantees needed for financial transactions'
);
```

#### `consensus.finalizeProposal(proposalId)`

Finalizes a proposal and calculates consensus.

**Returns:** Proposal object with result

**Example:**
```javascript
const result = await consensus.finalizeProposal(proposalId);
// Returns:
// {
//   id: 'proposal-123',
//   status: 'finalized',
//   consensus: true,
//   finalRatio: 0.8,
//   participationRate: 0.9,
//   result: {
//     consensus: true,
//     ratio: 0.8,
//     positiveVotes: 4,
//     negativeVotes: 1,
//     algorithm: 'byzantine_tolerant'
//   }
// }
```

### Statistics & Monitoring

#### `memory.getStatistics()`

Returns memory system statistics.

**Example:**
```javascript
const stats = memory.getStatistics();
// Returns:
// {
//   swarmId: 'swarm-abc123',
//   entryCount: 1542,
//   totalSize: 15728640,  // bytes
//   maxSize: 104857600,   // 100MB
//   utilizationPercent: 15.0,
//   avgConfidence: 0.87,
//   compressionRatio: 0.6,
//   cacheSize: 834,
//   lastGC: '2025-10-15T10:30:00.000Z',
//   accessPatterns: 234,
//   optimization: {
//     cacheOptimized: true,
//     poolingEnabled: true,
//     asyncOperations: true,
//     compressionRatio: 0.6,
//     performanceMetrics: {
//       avgQueryTime: 1.2,      // ms
//       cacheHitRate: 87.5,     // %
//       memoryEfficiency: 15.0  // %
//     }
//   }
// }
```

#### `consensus.getMetrics()`

Returns consensus engine metrics.

**Example:**
```javascript
const metrics = consensus.getMetrics();
// Returns:
// {
//   totalProposals: 157,
//   successfulConsensus: 142,
//   failedConsensus: 15,
//   byzantineDetected: 3,
//   avgVotingTime: 18500,       // ms
//   activeProposals: 2,
//   totalAgents: 12,
//   onlineAgents: 11,
//   byzantineAgents: 1,
//   successRate: 0.90,
//   avgParticipationRate: 0.85
// }
```

---

## File System Layout

```
project-root/
├── .hive-mind/
│   ├── hive.db              # Main SQLite database (permanent)
│   ├── hive.db-wal          # Write-Ahead Log (durability)
│   └── hive.db-shm          # Shared memory file
│
├── .claude-flow/
│   ├── metrics/
│   │   ├── performance.json
│   │   ├── system-metrics.json
│   │   └── task-metrics.json
│   └── sessions/
│       └── session-*.json
│
└── data/
    └── hive-memory/         # Fallback JSON storage
        ├── default_0.json   # Shard 0
        ├── default_1.json   # Shard 1
        └── ...
```

---

## Configuration Options

```javascript
const memory = new CollectiveMemory({
  swarmId: 'my-swarm',
  dbPath: '.hive-mind/hive.db',
  maxSize: 100,                  // MB
  compressionThreshold: 1024,    // bytes
  gcInterval: 300000,            // 5 minutes
  cacheSize: 1000,               // entries
  cacheMemoryMB: 50,             // MB
  enablePooling: true,
  enableAsyncOperations: true,
  shardCount: 16,
  syncInterval: 30000            // 30 seconds
});

const consensus = new ConsensusEngine({
  defaultThreshold: 0.6,         // 60% agreement
  byzantineTolerance: 0.33,      // Max 33% Byzantine actors
  quorumSize: 0.75,              // Min 75% participation
  votingTimeout: 30000,          // 30 seconds
  maxRetries: 3,
  weightDecay: 0.95              // 5% decay per Byzantine flag
});
```

---

## Best Practices

### 1. Memory Key Naming

**Use hierarchical namespacing:**
```javascript
// ✅ GOOD: Hierarchical, specific
'architecture/auth/jwt-config'
'specs/requirements/security'
'code/auth/jwt-service'
'tests/unit/auth-service'

// ❌ BAD: Flat, ambiguous
'auth'
'config'
'jwt'
```

### 2. Memory Types

**Choose appropriate types for retention:**
```javascript
// Architectural decisions: PERMANENT
memory.store('architecture/database', {...}, 'knowledge');

// Task context: 30 minutes
memory.store('task/current-feature', {...}, 'task');

// Temporary metrics: 1 hour
memory.store('metrics/build-time', {...}, 'metric');

// Error logs: 24 hours
memory.store('errors/build-failure', {...}, 'error');
```

### 3. Consensus for Critical Decisions

**Use Byzantine-tolerant consensus for security-critical decisions:**
```javascript
// Security decision: Byzantine-tolerant
await consensus.createProposal({
  type: 'security_decision',
  content: {...},
  algorithm: 'byzantine_tolerant',  // Requires 67% trusted agents
  threshold: 0.75                   // Higher threshold
});

// Architecture decision: Weighted majority
await consensus.createProposal({
  type: 'architecture_decision',
  content: {...},
  algorithm: 'weighted_majority',   // Default
  threshold: 0.6
});
```

### 4. Regular Consolidation

**Run consolidation after major development phases:**
```bash
# After Architecture phase
npx claude-flow@alpha memory consolidate

# After Refinement phase
npx claude-flow@alpha memory consolidate

# Weekly maintenance
npx claude-flow@alpha memory consolidate
```

---

## Troubleshooting

### High Memory Usage

```bash
# Check memory statistics
npx claude-flow@alpha memory status

# Trigger garbage collection
npx claude-flow@alpha memory gc

# Consolidate similar memories
npx claude-flow@alpha memory consolidate
```

### Low Cache Hit Rate

```javascript
// Increase cache size
const memory = new CollectiveMemory({
  cacheSize: 2000,      // Increase from 1000
  cacheMemoryMB: 100    // Increase from 50MB
});
```

### Byzantine Agent Issues

```bash
# List quarantined agents
npx claude-flow@alpha consensus list-quarantined

# View agent reputation
npx claude-flow@alpha consensus agent-info <agent-id>

# Reset agent reputation (admin only)
npx claude-flow@alpha consensus reset-agent <agent-id>
```

---

## Related Documentation

- [User Guide](../claude-flow-user-guide-2025-10-14.md) - High-level usage
- [Architecture Deep Dive](ARCHITECTURE-DEEP-DIVE.md) - System architecture
- [ADR System](../adr/README.md) - Architecture Decision Records
- [API Documentation](API-REFERENCE.md) - Complete API reference

---

**Last Updated:** 2025-10-15
**Authors:** Claude-Flow Team
**License:** MIT
