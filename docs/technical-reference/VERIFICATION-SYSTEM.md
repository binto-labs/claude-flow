# Claude-Flow Verification & Truth System: Technical Reference

**Version:** v2.5.0-alpha.140
**Last Updated:** 2025-10-15
**Audience:** Developers, architects, contributors

---

## Table of Contents

1. [Overview](#overview)
2. [Verification Check Catalog](#verification-check-catalog)
3. [Verification Modes](#verification-modes)
4. [Truth Scoring Algorithm](#truth-scoring-algorithm)
5. [Per-Agent Reliability Tracking](#per-agent-reliability-tracking)
6. [Auto-Rollback Mechanism](#auto-rollback-mechanism)
7. [Progressive Debugging System](#progressive-debugging-system)
8. [Custom Verification Checks](#custom-verification-checks)
9. [Training Integration](#training-integration)
10. [API Reference](#api-reference)
11. [Real-World Examples](#real-world-examples)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Claude-Flow implements a **comprehensive verification and truth enforcement system** designed to solve the critical problem of unreliable AI-generated code and conflicting agent outputs. Unlike traditional AI coding assistants that blindly accept agent claims, Claude-Flow verifies every operation against objective metrics and maintains a **truth scoring system** to track agent reliability over time.

### Key Design Principles

1. **Trust but Verify:** All agent outputs undergo objective verification
2. **Truth over Claims:** Measured results override agent self-reporting
3. **Continuous Learning:** Verification results feed back into agent training
4. **Automatic Recovery:** Failed verifications trigger intelligent rollback
5. **Graduated Strictness:** Three verification modes balance speed vs. accuracy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Operations                       │
│         (Code Generation, Testing, Analysis)             │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼─────────────┐
         │  Verification Middleware │
         │  (Pre/Post Task Hooks)   │
         └───┬─────────────────┬────┘
             │                 │
    ┌────────▼─────┐   ┌──────▼────────┐
    │  Pre-Task    │   │  Post-Task    │
    │  Checks      │   │  Verification │
    │  • Git Clean │   │  • Typecheck  │
    │  • Deps OK   │   │  • Tests Pass │
    └──────────────┘   │  • Lint Clean │
                       │  • Coverage   │
                       └───┬───────────┘
                           │
              ┌────────────▼──────────────┐
              │   Truth Scoring System    │
              │   (Reliability Tracking)  │
              └────────────┬──────────────┘
                           │
              ┌────────────▼──────────────┐
              │  Training Integration     │
              │  (Neural Pattern Learning)│
              └───────────────────────────┘
```

**File:** `src/cli/simple-commands/verification-integration.js:1-472`

---

## Verification Check Catalog

Claude-Flow implements **13 comprehensive verification checks** categorized by agent type. Each check produces a score (0.0-1.0) and pass/fail status.

### 1. Compile Check

**Type:** `compile`
**Applies to:** `coder`, `reviewer`
**Description:** Verifies code compiles without syntax errors

**Implementation:** `src/cli/simple-commands/verification.js:117-124`

```javascript
'compile': async () => {
  try {
    const { stdout } = await execAsync('npm run typecheck 2>&1 || true');
    return {
      score: stdout.includes('error') ? 0.5 : 1.0,
      passed: !stdout.includes('error')
    };
  } catch {
    return { score: 0.5, passed: false };
  }
}
```

**Scoring:**
- **1.0:** No compilation errors
- **0.5:** Compilation errors detected
- **0.5:** Compilation check failed to run

**Example Output:**
```
✅ compile: 1.00 (No errors)
❌ compile: 0.50 (3 type errors detected)
```

---

### 2. Test Check

**Type:** `test`
**Applies to:** `coder`, `tester`
**Description:** Executes test suite and verifies pass rate

**Implementation:** `src/cli/simple-commands/verification.js:125-132`

```javascript
'test': async () => {
  try {
    const { stdout } = await execAsync('npm test 2>&1 || true');
    return {
      score: stdout.includes('PASS') ? 1.0 : 0.6,
      passed: stdout.includes('PASS')
    };
  } catch {
    return { score: 0.6, passed: false };
  }
}
```

**Scoring:**
- **1.0:** All tests passing
- **0.6:** Tests exist but failing
- **0.6:** Test execution failed

**Example Output:**
```
✅ test: 1.00 (42 tests passed)
❌ test: 0.60 (15/42 tests failed)
```

---

### 3. Lint Check

**Type:** `lint`
**Applies to:** `coder`, `reviewer`
**Description:** Validates code style and quality standards

**Implementation:** `src/cli/simple-commands/verification.js:133-140`

```javascript
'lint': async () => {
  try {
    const { stdout } = await execAsync('npm run lint 2>&1 || true');
    return {
      score: stdout.includes('warning') ? 0.8 : 1.0,
      passed: true
    };
  } catch {
    return { score: 0.7, passed: false };
  }
}
```

**Scoring:**
- **1.0:** No errors or warnings
- **0.8:** Warnings present (not errors)
- **0.7:** Lint check failed to run

**Example Output:**
```
✅ lint: 1.00 (Clean)
✅ lint: 0.80 (5 warnings, 0 errors)
```

---

### 4. Typecheck

**Type:** `typecheck`
**Applies to:** `coder`, `reviewer`
**Description:** TypeScript/JavaScript type safety verification

**Implementation:** `src/cli/simple-commands/verification.js:141-148`

```javascript
'typecheck': async () => {
  try {
    const { stdout } = await execAsync('npm run typecheck 2>&1 || true');
    return {
      score: stdout.includes('error') ? 0.6 : 1.0,
      passed: !stdout.includes('error')
    };
  } catch {
    return { score: 0.6, passed: false };
  }
}
```

**Scoring:**
- **1.0:** No type errors
- **0.6:** Type errors detected
- **0.6:** Typecheck failed to run

---

### 5. Unit Tests Check

**Type:** `unit-tests`
**Applies to:** `tester`
**Description:** Verifies unit test coverage and execution

**Implementation:** `src/cli/simple-commands/verification-hooks.js:104-119`

```javascript
if (pkg.scripts && pkg.scripts.test) {
  const result = execSync('npm test 2>&1 || true', { encoding: 'utf8' });
  const passed = result.includes('PASS') || result.includes('passing');
  checks.push({
    name: 'tests',
    passed,
    score: passed ? 1.0 : 0.4
  });
}
```

**Scoring:**
- **1.0:** Unit tests passing
- **0.4:** Unit tests failing
- **0.2:** Test execution error

---

### 6. Integration Tests Check

**Type:** `integration-tests`
**Applies to:** `tester`
**Description:** Validates integration test suite

**Implementation:** Similar to unit tests but targets integration test scripts

**Scoring:**
- **1.0:** All integration tests pass
- **0.5:** Some integration tests fail
- **0.2:** Integration test suite unavailable

---

### 7. Coverage Check

**Type:** `coverage-check`
**Applies to:** `tester`
**Description:** Verifies test coverage meets threshold

**Implementation:** `src/cli/simple-commands/verification-integration.js:301-310`

```javascript
async checkTestCoverage() {
  try {
    const { stdout } = await execAsync('npm run coverage 2>&1 || true');
    const match = stdout.match(/(\d+(\.\d+)?)\s*%/);
    const percentage = match ? parseFloat(match[1]) : 0;
    return { percentage };
  } catch {
    return { percentage: 0 };
  }
}
```

**Scoring:**
- **1.0:** Coverage >= 80%
- **0.0-0.99:** Proportional to coverage percentage / 100

**Example Output:**
```
✅ coverage-check: 0.85 (85% coverage)
❌ coverage-check: 0.65 (65% coverage < 80% threshold)
```

---

### 8. Code Analysis Check

**Type:** `code-analysis`
**Applies to:** `reviewer`, `architect`
**Description:** Static code analysis for quality metrics

**Scoring:**
- **1.0:** No critical issues
- **0.7:** Minor issues detected
- **0.4:** Major issues detected

---

### 9. Security Scan Check

**Type:** `security-scan`
**Applies to:** `reviewer`
**Description:** Security vulnerability detection

**Scoring:**
- **1.0:** No vulnerabilities
- **0.5:** Low/medium vulnerabilities
- **0.0:** Critical vulnerabilities

---

### 10. Performance Check

**Type:** `performance-check`
**Applies to:** `reviewer`, `optimizer`
**Description:** Performance benchmark validation

**Scoring:**
- **1.0:** Performance meets targets
- **0.6:** Performance within acceptable range
- **0.3:** Performance below acceptable range

---

### 11. Task Decomposition Check

**Type:** `task-decomposition`
**Applies to:** `planner`
**Description:** Validates task breakdown quality

**Scoring:**
- **1.0:** Well-structured task decomposition
- **0.7:** Acceptable decomposition
- **0.4:** Poor decomposition

---

### 12. Dependency Check

**Type:** `dependency-check`
**Applies to:** `planner`, `architect`
**Description:** Validates dependencies are resolvable

**Implementation:** `src/cli/simple-commands/verification-hooks.js:50-58`

```javascript
if (fs.existsSync('package.json')) {
  try {
    execSync('npm ls --depth=0', { stdio: 'ignore' });
    checks.push({ name: 'npm-deps', passed: true, score: 1.0 });
  } catch {
    checks.push({ name: 'npm-deps', passed: false, score: 0.5 });
  }
}
```

**Scoring:**
- **1.0:** All dependencies satisfied
- **0.5:** Dependency conflicts detected

---

### 13. Design Validation Check

**Type:** `design-validation`
**Applies to:** `architect`
**Description:** Validates architectural decisions

**Scoring:**
- **1.0:** Design meets all criteria
- **0.8:** Design meets most criteria
- **0.5:** Design has significant gaps

---

### Agent-Specific Check Requirements

**File:** `src/cli/simple-commands/verification.js:22-28`

```javascript
const AGENT_VERIFICATION = {
  coder: ['compile', 'test', 'lint', 'typecheck'],
  reviewer: ['code-analysis', 'security-scan', 'performance-check'],
  tester: ['unit-tests', 'integration-tests', 'coverage-check'],
  planner: ['task-decomposition', 'dependency-check', 'feasibility'],
  architect: ['design-validation', 'scalability-check', 'pattern-compliance']
};
```

---

## Verification Modes

Claude-Flow supports **3 verification modes** with different strictness levels and behavior.

**File:** `src/cli/simple-commands/verification.js:15-19`

```javascript
const VERIFICATION_MODES = {
  strict: { threshold: 0.95, autoRollback: true, requireConsensus: true },
  moderate: { threshold: 0.85, autoRollback: false, requireConsensus: true },
  development: { threshold: 0.75, autoRollback: false, requireConsensus: false }
};
```

### Mode 1: Strict

**Threshold:** 0.95 (95%)
**Auto-Rollback:** Enabled
**Consensus:** Required

**Use Cases:**
- Production deployments
- Critical infrastructure changes
- Security-sensitive operations
- Financial transaction code

**Behavior:**
- Requires 95% verification score
- Automatically rolls back failed verifications
- Requires multi-agent consensus for ambiguous results
- Zero tolerance for test failures

**Example:**
```bash
npx claude-flow@alpha verify init strict

# Task execution
✅ compile: 1.00
✅ test: 1.00
✅ lint: 0.96
✅ typecheck: 1.00

📊 Verification Score: 0.99/0.95
   Status: ✅ PASSED

# Failed verification triggers rollback
❌ test: 0.60
📊 Verification Score: 0.85/0.95
   Status: ❌ FAILED
🔄 Auto-rollback triggered
✅ Rollback completed
```

---

### Mode 2: Moderate (Default)

**Threshold:** 0.85 (85%)
**Auto-Rollback:** Disabled
**Consensus:** Required

**Use Cases:**
- Regular development workflows
- Feature development
- Refactoring operations
- Code reviews

**Behavior:**
- Requires 85% verification score
- Reports failures but doesn't auto-rollback
- Requires consensus for critical decisions
- Allows minor test failures

**Example:**
```bash
npx claude-flow@alpha verify init moderate

# More permissive scoring
✅ compile: 1.00
✅ test: 0.80  # Some tests failing
✅ lint: 0.85
✅ typecheck: 1.00

📊 Verification Score: 0.91/0.85
   Status: ✅ PASSED
```

---

### Mode 3: Development

**Threshold:** 0.75 (75%)
**Auto-Rollback:** Disabled
**Consensus:** Not Required

**Use Cases:**
- Experimental features
- Rapid prototyping
- Debugging sessions
- Local development

**Behavior:**
- Requires only 75% verification score
- No automatic rollback
- Individual agent decisions (no consensus)
- Tolerates test and lint failures

**Example:**
```bash
npx claude-flow@alpha verify init development

# Most permissive
✅ compile: 1.00
❌ test: 0.60  # Tests failing but acceptable
✅ lint: 0.75
✅ typecheck: 0.80

📊 Verification Score: 0.79/0.75
   Status: ✅ PASSED (development mode)
```

---

### Mode Switching

```bash
# Set mode via environment variable
export VERIFICATION_MODE=strict
npx claude-flow@alpha swarm ...

# Set mode via CLI flag
npx claude-flow@alpha verify init --mode=moderate

# Query current mode
npx claude-flow@alpha verify status
# Output:
# Mode: moderate
# Threshold: 0.85
# Auto-rollback: false
```

---

## Truth Scoring Algorithm

The **Truth Scoring System** calculates an objective score (0.0-1.0) representing the reliability of agent outputs.

### Score Calculation

**File:** `src/cli/simple-commands/verification.js:71-112`

```javascript
async verifyTask(taskId, agentType, claims) {
  const requirements = AGENT_VERIFICATION[agentType] || ['basic-check'];
  const results = [];
  let totalScore = 0;

  // Execute all required checks
  for (const check of requirements) {
    const result = await this.runVerification(check, claims);
    results.push(result);
    totalScore += result.score;
  }

  // Calculate average score
  const averageScore = totalScore / requirements.length;
  const threshold = VERIFICATION_MODES[this.mode].threshold;
  const passed = averageScore >= threshold;

  return {
    taskId,
    agentType,
    score: averageScore,
    passed,
    threshold,
    timestamp: new Date().toISOString(),
    results
  };
}
```

### Scoring Formula

```
Truth Score = Σ(check_score_i) / n

where:
  check_score_i = Score from verification check i (0.0-1.0)
  n = Total number of verification checks

Pass Condition:
  Truth Score >= Mode Threshold
```

### Example Calculation

```javascript
// Coder agent in moderate mode
Checks:
  compile:   1.00
  test:      0.85
  lint:      0.90
  typecheck: 1.00

Truth Score = (1.00 + 0.85 + 0.90 + 1.00) / 4
            = 3.75 / 4
            = 0.9375

Threshold (moderate): 0.85
Result: 0.9375 >= 0.85 → PASSED ✅
```

### Weighted Scoring (Advanced)

For critical operations, checks can be weighted:

```javascript
// Custom weighted scoring
const weights = {
  compile: 1.5,    // Critical
  test: 1.3,       // Very important
  lint: 0.8,       // Less critical
  typecheck: 1.2   // Important
};

const weightedScore =
  Σ(check_score_i × weight_i) / Σ(weight_i)

// Example:
weightedScore = (1.00×1.5 + 0.85×1.3 + 0.90×0.8 + 1.00×1.2) / (1.5+1.3+0.8+1.2)
              = (1.50 + 1.105 + 0.72 + 1.20) / 4.8
              = 4.525 / 4.8
              = 0.943
```

---

## Per-Agent Reliability Tracking

Claude-Flow tracks **individual agent reliability** over time, creating a reputation system.

### Agent Reliability Metrics

**File:** `src/cli/simple-commands/verification.js:167-173`

```javascript
async getAgentReliability(agentId) {
  const agentHistory = this.verificationHistory.filter(
    v => v.agentType === agentId
  );
  if (agentHistory.length === 0) return 1.0;

  const totalScore = agentHistory.reduce((sum, v) => sum + v.score, 0);
  return totalScore / agentHistory.length;
}
```

### Reliability Score

```
Agent Reliability = Σ(verification_score_i) / n

where:
  verification_score_i = Truth score from verification i
  n = Total verifications for this agent
```

### Reliability Tracking Storage

**File:** `.swarm/verification-memory.json`

```json
{
  "scores": [
    ["coder", 0.92],
    ["tester", 0.88],
    ["reviewer", 0.95],
    ["architect", 0.87],
    ["planner", 0.90]
  ],
  "history": [
    {
      "taskId": "task-123",
      "agentType": "coder",
      "score": 0.94,
      "passed": true,
      "timestamp": "2025-10-15T10:30:00Z"
    }
  ]
}
```

### Training Integration

Agent reliability feeds into the training system for continuous improvement.

**File:** `src/cli/simple-commands/verification-training-integration.js:89-132`

```javascript
async incrementalLearn(trainingData) {
  const model = await this.loadModel();
  const agentType = trainingData.input.agentType;

  // Exponential moving average for reliability
  const currentReliability = model.agentReliability[agentType] || 0.5;
  const newScore = trainingData.output.score;

  model.agentReliability[agentType] =
    currentReliability * (1 - this.learningRate) +
    newScore * this.learningRate;

  // Update verification patterns
  const patternKey = `${agentType}_${trainingData.output.passed ? 'success' : 'failure'}`;

  if (!model.patterns[patternKey]) {
    model.patterns[patternKey] = {
      count: 0,
      avgScore: 0,
      checks: {}
    };
  }

  const pattern = model.patterns[patternKey];
  pattern.count++;
  pattern.avgScore = (pattern.avgScore * (pattern.count - 1) + newScore) / pattern.count;

  await this.saveModel(model);
}
```

### Reliability Trends

**File:** `src/cli/simple-commands/verification-training-integration.js:278-292`

```javascript
// Calculate performance trend (last 10 vs previous 10)
if (agentModel.scoreHistory.length >= 20) {
  const recent10 = agentModel.scoreHistory.slice(-10);
  const previous10 = agentModel.scoreHistory.slice(-20, -10);

  const recentAvg = recent10.reduce((sum, h) => sum + h.score, 0) / 10;
  const previousAvg = previous10.reduce((sum, h) => sum + h.score, 0) / 10;

  agentModel.trend = {
    direction: recentAvg > previousAvg ? 'improving' : 'declining',
    change: recentAvg - previousAvg,
    recentAverage: recentAvg,
    previousAverage: previousAvg
  };
}
```

### Viewing Agent Reliability

```bash
# View all agent reliability scores
npx claude-flow@alpha verify truth

# Output:
📊 Truth Scoring Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: moderate
Threshold: 0.85
Total Verifications: 157
Passed: 142
Average Score: 0.907

🤖 Agent Reliability:
   coder: 92.0%
   tester: 88.0%
   reviewer: 95.0%
   architect: 87.0%
   planner: 90.0%

# View specific agent details
npx claude-flow@alpha verify truth --agent coder --detailed

# Output:
🤖 coder Agent Details:
   Reliability: 92.0%
   Total Tasks: 45
   Passed: 42
   Failed: 3

📋 Verification History:
   ✅ [10:30:15] task-123: 0.940
   ✅ [11:45:22] task-124: 0.920
   ❌ [13:20:10] task-125: 0.810
   ✅ [14:05:30] task-126: 0.950

📊 Score Distribution:
   Min Score: 0.810
   Max Score: 0.980
   Average: 0.920

📈 Performance Trend:
   Recent Average: 0.935 ↑
   Previous Average: 0.905
   Change: +3.0%
```

---

## Auto-Rollback Mechanism

When verification fails in **strict mode**, Claude-Flow automatically rolls back changes using Git.

### Rollback Process

**File:** `src/cli/simple-commands/verification-integration.js:210-230`

```javascript
async rollbackTask(taskId, context) {
  console.log(`🔄 Rolling back task ${taskId}...`);

  try {
    // If we have a git checkpoint, rollback to it
    if (context.gitCheckpoint) {
      await execAsync(`git reset --hard ${context.gitCheckpoint}`);
      console.log(`✅ Rolled back to checkpoint ${context.gitCheckpoint}`);
    } else {
      // Otherwise just reset to last commit
      await execAsync('git reset --hard HEAD');
      console.log(`✅ Rolled back to last commit`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    return false;
  }
}
```

### Git Checkpoint Creation

**File:** `src/cli/simple-commands/verification-integration.js:436-444`

```javascript
async function createGitCheckpoint() {
  try {
    // Get current commit hash as checkpoint
    const { stdout } = await execAsync('git rev-parse HEAD');
    return stdout.trim();
  } catch {
    return null;
  }
}
```

### Rollback Workflow

```
Task Execution → Verification → Failed?
                                   │
                                   ├─→ Mode = strict?
                                   │      │
                                   │      ├─→ Yes: Auto-rollback
                                   │      │     │
                                   │      │     ├─→ Has checkpoint?
                                   │      │     │     │
                                   │      │     │     ├─→ Yes: git reset --hard <checkpoint>
                                   │      │     │     └─→ No: git reset --hard HEAD
                                   │      │     │
                                   │      │     └─→ Report rollback status
                                   │      │
                                   │      └─→ No: Report failure (no rollback)
                                   │
                                   └─→ Return failure result
```

### Example Rollback

```bash
# Enable strict mode with auto-rollback
npx claude-flow@alpha verify init strict

# Execute task that fails verification
🔍 Verifying task task-1729075858277-abc123 (Agent: coder)
   ✅ compile: 1.00
   ❌ test: 0.60      # Tests failing
   ✅ lint: 0.90
   ✅ typecheck: 1.00

📊 Verification Score: 0.88/0.95
   Status: ❌ FAILED

🔄 Auto-rollback triggered due to verification failure
🔄 Rolling back task task-1729075858277-abc123...
✅ Rolled back to checkpoint a7f3c2b

# Working directory restored to pre-task state
```

### Manual Rollback

```bash
# Rollback can be triggered manually
npx claude-flow@alpha verify rollback --task-id task-123

# Or via verification hooks
node src/cli/simple-commands/verification-hooks.js post task-123 coder
# Checks VERIFICATION_ROLLBACK environment variable
```

### Environment Configuration

```bash
# Enable rollback in any mode
export VERIFICATION_ROLLBACK=true

# Disable rollback in strict mode
export VERIFICATION_ROLLBACK=false

# Check rollback status
npx claude-flow@alpha verify status
# Output:
# Mode: strict
# Auto-rollback: true
```

---

## Progressive Debugging System

Claude-Flow implements a **4-step progressive debugging workflow** for failed verifications.

### Step 1: Check-Level Analysis

Identify which specific checks failed and their scores.

```bash
npx claude-flow@alpha verify truth --agent coder --detailed

# Output:
📋 Verification History:
   ❌ [13:20:10] task-125: 0.810
      • compile: ✓ (1.00)
      • test: ✗ (0.50)      ← Failed check
      • lint: ✓ (0.90)
      • typecheck: ✓ (1.00)
```

**Action:** Focus on the failed check (test: 0.50)

---

### Step 2: Failure Pattern Analysis

Analyze patterns across multiple failures.

```bash
npx claude-flow@alpha verify truth --analyze

# Output:
🔍 Failure Pattern Analysis:
   Failures by Agent:
   • coder: 8 failures (62%)
   • tester: 3 failures (23%)
   • reviewer: 2 failures (15%)

   Average Failure Score: 0.782
   Score Gap to Threshold: 0.068

💡 Recommendations:
   • Moderate: Close to threshold but needs improvement
   • Focus on failing agents: coder, tester
   • Consider adjusting verification requirements
```

**Action:** Identify systematic issues with specific agents

---

### Step 3: Agent-Specific Investigation

Deep dive into specific agent performance.

```bash
npx claude-flow@alpha verify truth --agent coder --detailed --verbose

# Output:
🤖 coder Agent Details:
   Reliability: 87.5%
   Total Tasks: 45
   Passed: 40
   Failed: 5

📋 Recent Failures:
   ❌ [13:20:10] task-125: 0.810
      Checks:
      • compile: ✓ (1.00)
      • test: ✗ (0.50) ← Primary failure
      • lint: ✓ (0.90)
      • typecheck: ✓ (1.00)

   ❌ [14:30:22] task-130: 0.825
      Checks:
      • compile: ✓ (1.00)
      • test: ✗ (0.60) ← Primary failure
      • lint: ✓ (0.95)
      • typecheck: ✓ (0.95)

Common Pattern: Test check consistently failing
```

**Action:** Identified root cause (test failures)

---

### Step 4: Training Recommendations

Get AI-driven recommendations for improvement.

**File:** `src/cli/simple-commands/verification-training-integration.js:308-363`

```javascript
async generateTrainingRecommendations() {
  const model = await this.loadModel();
  const recommendations = [];

  // Check agent reliability
  if (model.agentReliability) {
    for (const [agent, reliability] of Object.entries(model.agentReliability)) {
      if (reliability < 0.7) {
        recommendations.push({
          type: 'retrain_agent',
          agent,
          currentReliability: reliability,
          action: `Retrain ${agent} agent - reliability below 70%`
        });
      }
    }
  }

  // Check patterns for common failures
  if (model.patterns) {
    for (const [pattern, data] of Object.entries(model.patterns)) {
      if (pattern.includes('failure') && data.count > 10) {
        const [agentType] = pattern.split('_');

        // Find most common failing checks
        const failingChecks = Object.entries(data.checks || {})
          .filter(([, stats]) => stats.failure > stats.success)
          .map(([check]) => check);

        if (failingChecks.length > 0) {
          recommendations.push({
            type: 'improve_checks',
            agent: agentType,
            checks: failingChecks,
            action: `Focus training on ${failingChecks.join(', ')} for ${agentType}`
          });
        }
      }
    }
  }

  return recommendations;
}
```

```bash
npx claude-flow@alpha training recommendations

# Output:
💡 Training Recommendations:
   • Retrain coder agent - reliability below 70% (68.5%)
   • Focus training on test, lint for coder
   • Collect more data - only 42 data points available
```

**Action:** Apply training improvements to fix issues

---

### Complete Debugging Example

```bash
# Step 1: Identify failure
npx claude-flow@alpha verify truth --agent coder
# Result: coder agent has 87.5% reliability

# Step 2: Analyze patterns
npx claude-flow@alpha verify truth --analyze
# Result: test check failing consistently

# Step 3: Deep investigation
npx claude-flow@alpha verify truth --agent coder --detailed
# Result: 5 out of 5 failures were test check failures

# Step 4: Get recommendations
npx claude-flow@alpha training recommendations
# Result: Focus training on test checks for coder agent

# Apply fix: Retrain agent with focus on test generation
npx claude-flow@alpha training feed
npx claude-flow@alpha training train

# Verify improvement
npx claude-flow@alpha verify truth --agent coder
# Result: coder agent reliability improved to 92.0%
```

---

## Custom Verification Checks

Developers can create **custom verification checks** to extend the system.

### Custom Check Template

**File:** `src/cli/simple-commands/verification.js:114-158`

```javascript
// Add to verificationChecks object
const verificationChecks = {
  'custom-check': async () => {
    try {
      // Your custom verification logic here
      const result = await yourCustomVerification();

      return {
        score: result.success ? 1.0 : 0.5,
        passed: result.success,
        metadata: result.details  // Optional
      };
    } catch (error) {
      return {
        score: 0.0,
        passed: false,
        error: error.message
      };
    }
  }
};
```

### Example 1: Custom Security Check

```javascript
'security-audit': async () => {
  try {
    // Run npm audit
    const { stdout } = await execAsync('npm audit --json');
    const auditResult = JSON.parse(stdout);

    const criticalVulns = auditResult.metadata.vulnerabilities.critical || 0;
    const highVulns = auditResult.metadata.vulnerabilities.high || 0;

    // Calculate score based on vulnerabilities
    let score = 1.0;
    if (criticalVulns > 0) score = 0.0;  // Critical = fail
    else if (highVulns > 5) score = 0.3;
    else if (highVulns > 0) score = 0.7;

    return {
      score,
      passed: score >= 0.7,
      metadata: {
        critical: criticalVulns,
        high: highVulns,
        total: auditResult.metadata.vulnerabilities.total
      }
    };
  } catch (error) {
    return { score: 0.5, passed: false, error: error.message };
  }
}
```

### Example 2: Custom Performance Check

```javascript
'performance-benchmark': async () => {
  try {
    // Run performance benchmark
    const startTime = performance.now();
    await execAsync('npm run benchmark');
    const duration = performance.now() - startTime;

    // Score based on execution time
    let score = 1.0;
    if (duration > 10000) score = 0.3;       // > 10s = poor
    else if (duration > 5000) score = 0.7;   // > 5s = acceptable
    else if (duration > 2000) score = 0.9;   // > 2s = good

    return {
      score,
      passed: score >= 0.7,
      metadata: {
        duration_ms: duration,
        threshold_ms: 5000
      }
    };
  } catch (error) {
    return { score: 0.5, passed: false, error: error.message };
  }
}
```

### Example 3: Custom Code Complexity Check

```javascript
'complexity-check': async () => {
  try {
    // Run complexity analysis (using ESLint complexity rule)
    const { stdout } = await execAsync('npx eslint . --format json --rule "complexity: [error, 10]"');
    const results = JSON.parse(stdout);

    // Count complexity violations
    const violations = results.reduce((sum, file) =>
      sum + file.messages.filter(m => m.ruleId === 'complexity').length, 0
    );

    // Score inversely proportional to violations
    const score = Math.max(0, 1.0 - (violations * 0.1));

    return {
      score,
      passed: score >= 0.7,
      metadata: {
        violations,
        files_analyzed: results.length
      }
    };
  } catch (error) {
    return { score: 0.7, passed: true, error: error.message };
  }
}
```

### Registering Custom Checks

```javascript
// Add to agent verification requirements
const AGENT_VERIFICATION = {
  coder: ['compile', 'test', 'lint', 'typecheck', 'complexity-check'],
  reviewer: ['code-analysis', 'security-audit', 'performance-benchmark'],
  // ... other agents
};
```

### Testing Custom Checks

```bash
# Test custom check in isolation
npx claude-flow@alpha verify verify task-test --agent coder

# View results
npx claude-flow@alpha verify truth --detailed

# Export for analysis
npx claude-flow@alpha verify truth --export custom-check-results.json
```

---

## Training Integration

Verification results automatically feed into the **neural training system** for continuous improvement.

### Training Data Flow

```
Verification Result → Training Integration → Neural Model Update
                            │
                            ├─→ Agent Reliability Update
                            ├─→ Pattern Recognition
                            ├─→ Check Performance Tracking
                            └─→ Predictive Modeling
```

### Feeding Verification Data

**File:** `src/cli/simple-commands/verification-training-integration.js:48-84`

```javascript
async feedVerificationToTraining(verification) {
  // Extract training features
  const trainingData = {
    input: {
      taskId: verification.taskId,
      agentType: verification.agentType,
      timestamp: verification.timestamp,
      mode: verification.mode || 'moderate',
      checksPerformed: verification.results?.map(r => r.name) || []
    },
    output: {
      score: verification.score,
      passed: verification.passed,
      threshold: verification.threshold
    },
    metadata: {
      sessionId: process.env.SESSION_ID || 'default',
      timestamp: new Date().toISOString()
    }
  };

  // Append to training data file
  await this.appendTrainingData(trainingData);

  // Update agent-specific model
  await this.updateAgentModel(verification.agentType, verification);

  // Trigger incremental learning
  await this.incrementalLearn(trainingData);

  // Update performance metrics
  await this.updatePerformanceMetrics(verification);

  return trainingData;
}
```

### Training Data Format

**File:** `.claude-flow/training/verification-data.jsonl`

```jsonl
{"input":{"taskId":"task-123","agentType":"coder","timestamp":"2025-10-15T10:30:00Z","mode":"moderate","checksPerformed":["compile","test","lint","typecheck"]},"output":{"score":0.94,"passed":true,"threshold":0.85},"metadata":{"sessionId":"session-abc","timestamp":"2025-10-15T10:30:15Z"}}
{"input":{"taskId":"task-124","agentType":"tester","timestamp":"2025-10-15T11:15:00Z","mode":"strict","checksPerformed":["unit-tests","integration-tests","coverage-check"]},"output":{"score":0.88,"passed":false,"threshold":0.95},"metadata":{"sessionId":"session-abc","timestamp":"2025-10-15T11:15:20Z"}}
```

### Predictive Verification

**File:** `src/cli/simple-commands/verification-training-integration.js:137-180`

```javascript
async predictVerificationOutcome(taskType, agentType) {
  const model = await this.loadModel();

  // Get agent reliability
  const reliability = model.agentReliability?.[agentType] || 0.5;

  // Get pattern statistics
  const successPattern = model.patterns?.[`${agentType}_success`];
  const failurePattern = model.patterns?.[`${agentType}_failure`];

  if (!successPattern && !failurePattern) {
    return {
      predictedScore: reliability,
      confidence: 0.1,
      recommendation: 'insufficient_data'
    };
  }

  // Calculate prediction
  const totalCount = (successPattern?.count || 0) + (failurePattern?.count || 0);
  const successRate = (successPattern?.count || 0) / totalCount;

  const predictedScore = reliability * 0.7 + successRate * 0.3;
  const confidence = Math.min(totalCount / 100, 1.0);

  // Generate recommendation
  let recommendation = 'proceed';
  if (predictedScore < 0.5) {
    recommendation = 'use_different_agent';
  } else if (predictedScore < 0.75) {
    recommendation = 'add_additional_checks';
  } else if (confidence < 0.3) {
    recommendation = 'low_confidence_proceed_with_caution';
  }

  return {
    predictedScore,
    confidence,
    recommendation,
    agentReliability: reliability,
    historicalSuccessRate: successRate,
    dataPoints: totalCount
  };
}
```

### Using Predictions

```bash
# Predict verification outcome before task execution
npx claude-flow@alpha training predict default coder

# Output:
🔮 Verification Prediction:
   Predicted Score: 0.912
   Confidence: 85.0%
   Recommendation: proceed
   Historical Success Rate: 92.0%
   Data Points: 85

# Get agent recommendation for a task
npx claude-flow@alpha training recommend "implement-auth"

# Output:
🤖 Agent Recommendation:
   Recommended: coder
   Reliability: 92.0%
   Reason: highest_reliability_score
   Alternatives:
     • reviewer: 95.0%
     • architect: 87.0%
```

### Manual Training Trigger

```bash
# Feed all verification data to training
npx claude-flow@alpha training feed

# Output:
📊 Feeding 157 verification records to training...
✅ Training data updated

# Trigger neural network training
npx claude-flow@alpha training train

# Output:
🧠 Training neural patterns from verification data...
✅ Neural training completed
```

---

## API Reference

### CLI Commands

#### Initialize Verification

```bash
npx claude-flow@alpha verify init [mode]

# Examples:
npx claude-flow@alpha verify init strict
npx claude-flow@alpha verify init moderate
npx claude-flow@alpha verify init development

# Flags:
--mode <mode>     Verification mode (strict/moderate/development)
```

#### Verify Task

```bash
npx claude-flow@alpha verify verify [taskId]

# Examples:
npx claude-flow@alpha verify verify task-123
npx claude-flow@alpha verify verify --agent coder
npx claude-flow@alpha verify verify --success false

# Flags:
--task-id <id>    Task identifier
--agent <type>    Agent type (coder/tester/reviewer/planner/architect)
--success         Claim success status (default: true)
```

#### View Truth Scores

```bash
npx claude-flow@alpha verify truth

# Flags:
--agent <type>      Filter by agent type
--task-id <id>      Filter by task ID
--threshold <n>     Show scores below threshold
--json              JSON output only
--detailed          Show detailed breakdown
--verbose           Include check-level details
--report            Full report with metrics
--analyze           Failure pattern analysis
--export <path>     Export to file

# Examples:
npx claude-flow@alpha verify truth --agent coder
npx claude-flow@alpha verify truth --agent coder --detailed
npx claude-flow@alpha verify truth --analyze
npx claude-flow@alpha verify truth --export report.json
```

#### Verification Status

```bash
npx claude-flow@alpha verify status

# Output:
🔍 Verification System Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: moderate
Verifications: 157
Recent: 5 verifications

📜 Recent Verifications:
   ✅ task-789 (coder): 0.94
   ✅ task-788 (tester): 0.88
   ❌ task-787 (coder): 0.82
   ✅ task-786 (reviewer): 0.96
   ✅ task-785 (architect): 0.89
```

#### Pair Programming Mode

```bash
npx claude-flow@alpha pair --start

# Output:
👥 Pair Programming with Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Verification-First Development Mode Activated
   • All changes require verification
   • Truth threshold: 0.95
   • Real-time validation enabled
   • Auto-rollback on failures

🚀 Starting pair programming session...
   Monitoring file changes...
   Running continuous verification...

[Verification cycles run automatically]
```

---

### Programmatic API

#### VerificationSystem Class

**File:** `src/cli/simple-commands/verification.js:30-199`

```javascript
import { VerificationSystem } from './cli/simple-commands/verification.js';

// Initialize
const verificationSystem = new VerificationSystem();
await verificationSystem.initialize('moderate');

// Verify a task
const result = await verificationSystem.verifyTask(
  'task-123',
  'coder',
  { success: true }
);

console.log(result);
// {
//   taskId: 'task-123',
//   agentType: 'coder',
//   score: 0.94,
//   passed: true,
//   threshold: 0.85,
//   timestamp: '2025-10-15T10:30:00.000Z',
//   results: [...]
// }

// Get agent reliability
const reliability = await verificationSystem.getAgentReliability('coder');
console.log(`Coder reliability: ${reliability * 100}%`);

// Generate report
const report = await verificationSystem.generateTruthReport();
console.log(report);
```

#### VerificationMiddleware Class

**File:** `src/cli/simple-commands/verification-integration.js:18-329`

```javascript
import { VerificationMiddleware } from './cli/simple-commands/verification-integration.js';

const middleware = new VerificationMiddleware(verificationSystem);

// Execute task with verification
const result = await middleware.executeWithVerification(
  async () => {
    // Your task logic
    return { success: true, data: '...' };
  },
  'task-123',
  'coder',
  {
    requiresCleanState: true,
    dependencies: ['node', 'npm'],
    language: 'typescript',
    hasTests: true
  }
);

if (result.success) {
  console.log('Task verified successfully');
} else if (result.rollback) {
  console.log('Task failed verification and was rolled back');
}
```

#### VerificationTrainingIntegration Class

**File:** `src/cli/simple-commands/verification-training-integration.js:14-515`

```javascript
import { VerificationTrainingIntegration } from './cli/simple-commands/verification-training-integration.js';

const training = new VerificationTrainingIntegration();
await training.initialize();

// Feed verification to training
await training.feedVerificationToTraining(verificationResult);

// Predict outcome
const prediction = await training.predictVerificationOutcome('feature', 'coder');
console.log(`Predicted score: ${prediction.predictedScore}`);

// Get agent recommendation
const recommendation = await training.recommendAgent('feature');
console.log(`Recommended agent: ${recommendation.recommended}`);

// Generate training recommendations
const recommendations = await training.generateTrainingRecommendations();
console.log(recommendations);
```

---

### REST API

**File:** `src/verification/api/routes/verification.js:1-772`

#### GET /api/verification/status

Get verification system status.

```bash
curl http://localhost:3000/api/verification/status

# Response:
{
  "success": true,
  "data": {
    "status": "operational",
    "metrics": {
      "total_verifications": 157,
      "successful_verifications": 142,
      "failed_verifications": 15,
      "pending_verifications": 0,
      "success_rate": 90.4,
      "average_confidence": 0.907
    },
    "recent_events": [...],
    "active_verifications": [...]
  }
}
```

#### POST /api/verification/verify

Create new verification.

```bash
curl -X POST http://localhost:3000/api/verification/verify \
  -H "Content-Type: application/json" \
  -d '{
    "source": "agent-coder-1",
    "target": "task-123",
    "metadata": {
      "agent_type": "coder",
      "mode": "moderate"
    },
    "priority": "high",
    "timeout": 30000
  }'

# Response:
{
  "success": true,
  "data": {
    "id": "ver_abc123",
    "timestamp": 1729075858277,
    "status": "pending",
    "source": "agent-coder-1",
    "target": "task-123"
  }
}
```

#### GET /api/verification/verify/:id

Get specific verification.

```bash
curl http://localhost:3000/api/verification/verify/ver_abc123

# Response:
{
  "success": true,
  "data": {
    "id": "ver_abc123",
    "status": "verified",
    "confidence": 0.94,
    "completed_at": 1729075860123
  }
}
```

#### GET /api/verification/metrics

Get detailed metrics.

```bash
curl http://localhost:3000/api/verification/metrics?timeframe=24h

# Response:
{
  "success": true,
  "data": {
    "total_verifications": 157,
    "success_rate": 90.4,
    "average_confidence": 0.907,
    "timeframe": "24h",
    "trends": {...},
    "error_distribution": {...}
  }
}
```

---

### WebSocket API

**File:** `src/verification/api/websocket/truth-monitor.js:1-520`

#### Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to truth monitoring server');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

#### Subscribe to Events

```javascript
// Subscribe to verification events
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: {
    filter: {
      event_types: ['verification_update', 'truth_change'],
      severity_levels: ['medium', 'high', 'critical'],
      confidence_min: 0.7
    }
  },
  id: 'sub-123'
}));

// Subscription confirmation
{
  "type": "subscription_created",
  "payload": {
    "subscription_id": "sub_abc123",
    "filter": {...}
  },
  "id": "sub-123"
}

// Receive real-time verification events
{
  "type": "truth_event",
  "payload": {
    "id": "event_xyz789",
    "type": "verification_update",
    "timestamp": 1729075858277,
    "data": {
      "taskId": "task-123",
      "agentType": "coder",
      "score": 0.94,
      "passed": true
    },
    "severity": "medium",
    "confidence": 0.94
  }
}
```

---

## Real-World Examples

### Example 1: Full-Stack Development with Verification

```bash
# Initialize verification in moderate mode
npx claude-flow@alpha verify init moderate

# Start swarm with integrated verification
npx claude-flow@alpha swarm "Build REST API with authentication"

# Verification runs automatically after each agent task
🔍 Verifying task task-123 (Agent: coder)
   ✅ compile: 1.00
   ✅ test: 0.95
   ✅ lint: 0.92
   ✅ typecheck: 1.00

📊 Verification Score: 0.97/0.85
   Status: ✅ PASSED

# View cumulative truth scores
npx claude-flow@alpha verify truth

# Output:
📊 Truth Scoring Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: moderate
Threshold: 0.85
Total Verifications: 8
Passed: 8
Average Score: 0.935

🤖 Agent Reliability:
   coder: 97.0%
   tester: 92.0%
   reviewer: 94.0%
```

---

### Example 2: Failed Verification Debugging Walkthrough

```bash
# Task fails verification
🔍 Verifying task task-125 (Agent: coder)
   ✅ compile: 1.00
   ❌ test: 0.50        # Tests failing
   ✅ lint: 0.90
   ✅ typecheck: 1.00

📊 Verification Score: 0.85/0.85
   Status: ❌ FAILED (exactly at threshold)

# Step 1: Investigate failure
npx claude-flow@alpha verify truth --agent coder --detailed

# Output:
🤖 coder Agent Details:
   Reliability: 87.5%
   Total Tasks: 45
   Passed: 40
   Failed: 5

📋 Recent Failures:
   ❌ [13:20:10] task-125: 0.850
      • test: ✗ (0.50) ← Issue identified

# Step 2: Analyze pattern
npx claude-flow@alpha verify truth --analyze

# Output:
🔍 Failure Pattern Analysis:
   Common failure: test check
   Average Failure Score: 0.825

💡 Recommendations:
   • Focus training on test checks for coder agent
   • Review test generation strategy

# Step 3: Get training recommendations
npx claude-flow@alpha training recommendations

# Output:
💡 Training Recommendations:
   • Focus training on test for coder
   • Retrain coder agent - reliability at 87.5%

# Step 4: Apply fix
npx claude-flow@alpha training feed
npx claude-flow@alpha training train

# Step 5: Verify improvement
npx claude-flow@alpha verify truth --agent coder
# Result: Reliability improved to 94.0%
```

---

### Example 3: Custom Security Verification Check

**File:** `custom-checks/security-check.js`

```javascript
// Custom security verification check
export async function securityAuditCheck() {
  try {
    // Run npm audit
    const auditResult = await execAsync('npm audit --json');
    const audit = JSON.parse(auditResult.stdout);

    const criticalVulns = audit.metadata.vulnerabilities.critical || 0;
    const highVulns = audit.metadata.vulnerabilities.high || 0;
    const moderateVulns = audit.metadata.vulnerabilities.moderate || 0;

    // Calculate weighted score
    let score = 1.0;
    score -= criticalVulns * 0.3;  // Critical = -30% per vuln
    score -= highVulns * 0.1;      // High = -10% per vuln
    score -= moderateVulns * 0.03; // Moderate = -3% per vuln
    score = Math.max(0, score);

    return {
      name: 'security-audit',
      score,
      passed: score >= 0.7,
      metadata: {
        vulnerabilities: {
          critical: criticalVulns,
          high: highVulns,
          moderate: moderateVulns,
          low: audit.metadata.vulnerabilities.low || 0
        },
        total: audit.metadata.vulnerabilities.total
      }
    };
  } catch (error) {
    return {
      name: 'security-audit',
      score: 0.5,
      passed: false,
      error: error.message
    };
  }
}

// Register with verification system
import { AGENT_VERIFICATION } from './src/cli/simple-commands/verification.js';

AGENT_VERIFICATION.reviewer.push('security-audit');
```

**Usage:**

```bash
# Run verification with custom check
npx claude-flow@alpha verify verify task-security --agent reviewer

# Output:
🔍 Verifying task task-security (Agent: reviewer)
   ✅ code-analysis: 0.95
   ❌ security-audit: 0.40    # Custom check
      • Critical vulnerabilities: 2
      • High vulnerabilities: 5
      • Moderate vulnerabilities: 8
   ✅ performance-check: 0.88

📊 Verification Score: 0.74/0.85
   Status: ❌ FAILED

💡 Fix critical vulnerabilities and re-run verification
```

---

### Example 4: Trend Analysis Over Time

```bash
# View agent performance trend
npx claude-flow@alpha verify truth --agent coder --detailed

# Output:
📈 Performance Trend:
   Recent Average: 0.935 ↑
   Previous Average: 0.905
   Change: +3.0%

# Detailed trend data
📊 Score Distribution (last 20 verifications):
   [Recent 10]  : 0.94, 0.96, 0.93, 0.95, 0.92, 0.94, 0.96, 0.93, 0.94, 0.95
   [Previous 10]: 0.88, 0.90, 0.92, 0.91, 0.89, 0.90, 0.91, 0.92, 0.90, 0.91

   Min Score: 0.88
   Max Score: 0.96
   Current Average: 0.935
   Improvement: +5.5% over previous period

# Export trend data
npx claude-flow@alpha verify truth --agent coder --export trends.json

# Analyze with external tools
cat trends.json | jq '.filteredHistory[].score' | \
  python -c "import sys; scores = [float(x) for x in sys.stdin]; \
  print(f'Trend: {\"↑\" if scores[-5:] > scores[-10:-5] else \"↓\"}')"
```

---

### Example 5: Multi-Agent Verification Workflow

```bash
# Complex task requiring multiple agents
npx claude-flow@alpha swarm "Implement user authentication with tests and docs"

# Agent 1: Architect designs system
🔍 Verifying task arch-task-1 (Agent: architect)
   ✅ design-validation: 0.95
   ✅ scalability-check: 0.92
   ✅ pattern-compliance: 0.88

📊 Verification Score: 0.92/0.85
   Status: ✅ PASSED

# Agent 2: Coder implements
🔍 Verifying task code-task-1 (Agent: coder)
   ✅ compile: 1.00
   ✅ test: 0.95
   ✅ lint: 0.94
   ✅ typecheck: 1.00

📊 Verification Score: 0.97/0.85
   Status: ✅ PASSED

# Agent 3: Tester validates
🔍 Verifying task test-task-1 (Agent: tester)
   ✅ unit-tests: 0.98
   ✅ integration-tests: 0.92
   ✅ coverage-check: 0.86

📊 Verification Score: 0.92/0.85
   Status: ✅ PASSED

# View complete workflow verification
npx claude-flow@alpha verify truth --json | jq '.report'

# Output:
{
  "totalVerifications": 3,
  "passedVerifications": 3,
  "averageScore": 0.937,
  "agentReliability": {
    "architect": 0.92,
    "coder": 0.97,
    "tester": 0.92
  }
}
```

---

## Troubleshooting

### Issue 1: Low Verification Scores

**Symptom:**
```
📊 Verification Score: 0.72/0.85
   Status: ❌ FAILED
```

**Diagnosis:**
```bash
npx claude-flow@alpha verify truth --agent <agent> --detailed
```

**Common Causes:**
1. **Test failures:** Tests not updated after code changes
2. **Lint errors:** Code style violations
3. **Type errors:** TypeScript type mismatches
4. **Missing dependencies:** `npm install` not run

**Solution:**
```bash
# Fix tests
npm test -- --updateSnapshot

# Fix lint errors
npm run lint -- --fix

# Fix type errors
npm run typecheck

# Install dependencies
npm install

# Re-run verification
npx claude-flow@alpha verify verify <task-id>
```

---

### Issue 2: Agent Reliability Declining

**Symptom:**
```
📉 Agent coder is declining (-5.2%)
```

**Diagnosis:**
```bash
npx claude-flow@alpha verify truth --agent coder --detailed
npx claude-flow@alpha training recommendations
```

**Common Causes:**
1. **Pattern shift:** Code patterns changed, agent not adapted
2. **Increased complexity:** Tasks becoming more difficult
3. **Outdated training:** Agent needs retraining

**Solution:**
```bash
# Feed recent verification data to training
npx claude-flow@alpha training feed

# Retrain agent
npx claude-flow@alpha training train

# Verify improvement
npx claude-flow@alpha verify truth --agent coder
```

---

### Issue 3: Verification Checks Not Running

**Symptom:**
```
⚠️  Pre-task verification failed
❌ Rollback failed: git not initialized
```

**Diagnosis:**
```bash
# Check Git status
git status

# Check verification system
npx claude-flow@alpha verify status
```

**Common Causes:**
1. **No Git repository:** Verification requires Git
2. **Missing scripts:** `package.json` missing required scripts
3. **Wrong mode:** Verification disabled in development mode

**Solution:**
```bash
# Initialize Git if needed
git init
git add .
git commit -m "Initial commit"

# Add missing scripts to package.json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "lint": "eslint .",
    "coverage": "jest --coverage"
  }
}

# Enable verification
export VERIFICATION_MODE=moderate
npx claude-flow@alpha verify init moderate
```

---

### Issue 4: Verification Too Strict

**Symptom:**
```
📊 Verification Score: 0.93/0.95
   Status: ❌ FAILED (strict mode)
```

**Diagnosis:**
```bash
npx claude-flow@alpha verify status
# Mode: strict (threshold: 0.95)
```

**Solution:**
```bash
# Switch to moderate mode
npx claude-flow@alpha verify init moderate

# Or adjust threshold temporarily
export VERIFICATION_MODE=moderate

# For development
npx claude-flow@alpha verify init development
```

---

### Issue 5: WebSocket Connection Issues

**Symptom:**
```
Error: WebSocket connection failed
```

**Diagnosis:**
```bash
# Check if server is running
curl http://localhost:8080/health

# Check WebSocket logs
tail -f .swarm/websocket.log
```

**Solution:**
```bash
# Start WebSocket server
npx claude-flow@alpha api start --websocket

# Or manually start
node src/verification/api/websocket/truth-monitor.js

# Verify connection
wscat -c ws://localhost:8080
```

---

## Related Documentation

- [Memory Architecture](MEMORY-ARCHITECTURE.md) - Verification result persistence
- [User Guide](../claude-flow-user-guide-2025-10-14.md) - High-level usage patterns
- [Architecture Deep Dive](../investigation/ARCHITECTURE-DEEP-DIVE.md) - System architecture
- [Training Pipeline](../investigation/NEURAL-TRAINING.md) - Neural training details

---

**Last Updated:** 2025-10-15
**Authors:** Claude-Flow Team
**License:** MIT
