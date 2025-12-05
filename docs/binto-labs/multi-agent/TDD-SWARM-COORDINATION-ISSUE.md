---
status: archive
type: enhancement-request
target: multi-agent/workflow.md
created: 2025-12-05
resolved: 2025-12-05
title: TDD Swarm Coordination Gap - Proposed Solution
resolution: Incorporated into workflow.md and swarm-templates.md v1.4
---

# TDD Swarm Coordination Issue

## Problem Statement

When executing a swarm with separate TDD Designer and Coder agents, we discovered a fundamental coordination gap that violates the core principle of Test-Driven Development.

### What Happened

During Phase 1 of our architecture refactor, we spawned agents per the swarm spec:

1. **TDD Test Designer** (tdd-london-swarm) - Designed test contracts
2. **Coder Agents** (coder) - Implemented against those contracts

The TDD Designer created tests using `SimulationGameState` type (with `players` Map structure):
```typescript
// TDD Designer's test
function createMockGameState(): SimulationGameState {
  return {
    players: new Map([['sirians', { armies: [], cities: [] }]]),
    // ...
  };
}
```

The Coder implemented using `GameState` type (with flat arrays):
```typescript
// Coder's implementation
export function executeTurn(state: GameState, decisions: PlayerDecisions) {
  // Expects state.cities, state.armies as arrays
}
```

**Result**: 18 test failures at integration time due to type mismatch between test fixtures and implementation.

### Root Cause

The separation of "test design" and "implementation" across different agents breaks the TDD feedback loop:

```
Traditional TDD (single developer):
  RED → write failing test
  GREEN → write code to pass
  REFACTOR → improve while green
  (tight feedback loop, same person holds context)

Swarm TDD (as implemented):
  Agent A → writes tests (interprets requirements)
       ↓ (async handoff via memory)
  Agent B → implements (re-interprets requirements)
       ↓ (no feedback until integration)
  Mismatch discovered late
```

The agents had no shared enforcement mechanism for type contracts. Each interpreted the architecture document independently.

---

## Proposed Solution: SOC-Bounded TDD Agents

### Principle

**One agent per module performs BOTH test writing AND implementation.**

This preserves the TDD feedback loop within a single agent's context while still enabling parallel execution across module boundaries.

### Swarm Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCHITECT AGENT                         │
│  - Defines module boundaries (SOC)                         │
│  - Creates type contracts (shared source of truth)         │
│  - Publishes interface specifications                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTRACT FILE                             │
│  orchestration/contracts.ts                                │
│  - Canonical type imports                                  │
│  - Interface definitions                                   │
│  - All agents MUST import from here                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ TDD-Dev-Agent │ │ TDD-Dev-Agent │ │ TDD-Dev-Agent │
│ Module A      │ │ Module B      │ │ Module C      │
│               │ │               │ │               │
│ - Writes test │ │ - Writes test │ │ - Writes test │
│ - Implements  │ │ - Implements  │ │ - Implements  │
│ - Verifies    │ │ - Verifies    │ │ - Verifies    │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 INTEGRATION TESTER                          │
│  - Cross-module integration tests                          │
│  - Tests contracts between modules                         │
│  - Runs AFTER all TDD-Dev agents complete                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     REVIEWER                                │
│  - Quality gates                                           │
│  - CI verification                                         │
│  - Final approval                                          │
└─────────────────────────────────────────────────────────────┘
```

### Key Changes from Current Pattern

| Current Pattern | Proposed Pattern |
|-----------------|------------------|
| TDD Designer writes all tests | Each TDD-Dev agent writes tests for their module only |
| Coders implement against memory-stored contracts | TDD-Dev agents implement their own tests |
| Type contracts are prose in memory | Type contracts are code in shared file |
| Integration tests written by TDD Designer | Integration tests written by dedicated Integration Tester |
| No compilation gate between agents | Explicit compilation gates at each stage |

### Contract Enforcement Mechanism

The Architect creates a contracts file that serves as the single source of truth:

```typescript
// orchestration/contracts.ts (created by Architect, read-only for others)

// Re-export canonical types - ALL agents use these
export type { GameState, Empire, Army, City } from '../types';

// Define module interfaces
export interface IStateManager {
  cloneState(state: GameState): GameState;
  validateState(state: unknown): asserts state is GameState;
  updateArmy(state: GameState, armyId: string, updates: Partial<Army>): GameState;
}

export interface ITurnExecutor {
  executeStartTurnPhase(state: GameState, empire: Empire): StartTurnResult;
  executeMovementPhase(state: GameState, decisions: MovementDecision[]): MovementResult;
  executeTurn(state: GameState, decisions: PlayerDecisions): TurnExecutionResult;
}

export interface IGameOrchestrator {
  createGame(config: GameConfig): IGameOrchestrator;
  executePlayerTurn(decisions: PlayerDecisions): TurnExecutionResult;
}

// Result types
export interface StartTurnResult {
  state: GameState;
  events: TurnEvent[];
  productionCompletions: ProductionCompletion[];
}

// ... etc
```

**Enforcement**: TDD-Dev agents must:
1. Import types from contracts file (not define their own)
2. Implement the interface exactly as specified
3. Run `tsc --noEmit` before marking complete

### Dependency Gates

```
Architect completes
    ↓
contracts.ts compiles (tsc --noEmit)
    ↓
TDD-Dev agents can start (parallel)
    ↓
Each module: tests + impl + verification
    ↓
All modules compile together (tsc --noEmit on full module)
    ↓
Integration Tester can start
    ↓
Full test suite passes
    ↓
Reviewer can start
```

### Agent Spawn Pattern

```typescript
// Example swarm spec for Phase 1

agents:
  - name: Architect
    type: system-architect
    tasks:
      - Create contracts.ts with canonical types and interfaces
      - Define module boundaries
      - Publish architecture to memory
    gate: contracts.ts compiles

  - name: TDD-Dev-StateManager
    type: tdd-london-swarm
    depends_on: [Architect]
    owns: [state-manager.ts, __tests__/state-manager.test.ts]
    tasks:
      - Import types from contracts.ts
      - Write tests for StateManager interface
      - Implement to pass tests
      - Verify: npm test -- state-manager
    gate: all StateManager tests pass

  - name: TDD-Dev-TurnExecutor
    type: tdd-london-swarm
    depends_on: [Architect, TDD-Dev-StateManager]
    owns: [turn-executor.ts, __tests__/turn-executor.test.ts]
    tasks:
      - Import types from contracts.ts
      - Write tests for TurnExecutor interface
      - Implement to pass tests
      - Verify: npm test -- turn-executor
    gate: all TurnExecutor tests pass

  - name: Integration-Tester
    type: tdd-london-swarm
    depends_on: [TDD-Dev-StateManager, TDD-Dev-TurnExecutor, TDD-Dev-Orchestrator]
    owns: [__tests__/integration.test.ts]
    tasks:
      - Write cross-module integration tests
      - Verify full workflow works end-to-end
    gate: all integration tests pass

  - name: Reviewer
    type: reviewer
    depends_on: [Integration-Tester]
    tasks:
      - Run CI (type-check, test, lint)
      - Verify quality gates
      - Approve or request fixes
```

---

## Benefits

1. **Preserves TDD Feedback Loop**: Same agent writes test and implementation, maintaining tight RED-GREEN-REFACTOR cycle

2. **Enables Parallelism**: Different modules can be developed in parallel by different TDD-Dev agents

3. **Enforces Contracts**: Shared contracts file prevents type drift between agents

4. **Clear Ownership**: Each agent owns specific files, reducing merge conflicts and ambiguity

5. **Explicit Gates**: Compilation and test gates at each stage catch issues early

6. **Separation of Concerns**: Module boundaries align with agent boundaries

---

## Implementation Recommendation

### Updates to workflow.md

1. Add new section: "TDD Swarm Patterns"
2. Define `tdd-dev` agent type that combines test writing and implementation
3. Add contract enforcement requirements to SPARC Architecture phase
4. Add compilation gates to dependency specifications

### Updates to Agent Templates

1. Create `tdd-dev.md` agent template that includes:
   - Contract import requirements
   - RED-GREEN-REFACTOR cycle instructions
   - Module ownership clarity
   - Verification gate commands

2. Modify `tdd-london-swarm.md` to clarify it's for integration testing, not unit test design

### New Swarm Spec Fields

```yaml
agents:
  - name: AgentName
    type: tdd-dev
    owns: [file1.ts, file2.ts]  # Explicit file ownership
    imports_from: contracts.ts   # Contract enforcement
    gate: npm test -- pattern    # Verification gate
```

---

## Example: How Phase 1 Would Have Worked

With proposed pattern:

1. **Architect** creates `contracts.ts`:
   ```typescript
   export type { GameState } from '../types';
   export interface ITurnExecutor {
     executeTurn(state: GameState, decisions: PlayerDecisions): TurnExecutionResult;
   }
   ```

2. **TDD-Dev-TurnExecutor** agent:
   - Imports `GameState` from contracts (not SimulationGameState)
   - Writes test using correct type
   - Implements using same type
   - No mismatch possible

3. **Integration Tester** tests cross-module workflows
4. **Reviewer** verifies all gates pass

**Result**: No type mismatch, no 18 failing tests.

---

## Summary

| Issue | Solution |
|-------|----------|
| Test/impl type mismatch | Shared contracts file with canonical types |
| Broken TDD feedback loop | Single TDD-Dev agent per module |
| Late integration failures | Compilation gates between phases |
| Ambiguous module ownership | Explicit `owns` field in agent spec |
| Memory-based contracts (prose) | Code-based contracts (TypeScript interfaces) |

---

## Request

Please consider incorporating this pattern into the multi-agent workflow documentation:

1. Add "TDD Swarm Patterns" section to workflow.md
2. Create `tdd-dev` agent template
3. Add contract enforcement mechanism to swarm specs
4. Document compilation gates as dependency requirements

This will help future swarms avoid the coordination gap we encountered.
