---
status: keep
phase: complete
type: report
version: 1.0
last-updated: 2025-12-01
title: Upstream Merge Summary - December 2025
tags: [merge, upstream, changelog, v2.7.35-v2.7.41]
---

# Upstream Merge Summary - December 2025

**Merge Date**: 2025-12-01
**Upstream Repository**: ruvnet/claude-flow
**Fork Repository**: binto-labs/claude-flow
**Version Range**: v2.7.34 → v2.7.41

---

## Executive Summary

This merge brings 24 commits from the upstream repository, covering **major improvements** in three key areas:

1. **Automatic Error Recovery System** (v2.7.35) - New intelligent error handling for WSL/SQLite issues
2. **GitHub Actions CI/CD Fixes** (PR #886) - Comprehensive workflow reliability improvements
3. **Agent Creation & SQLite Fixes** (v2.7.41) - Enhanced initialization and database handling

---

## New Features

### 1. Automatic Error Recovery System (v2.7.35)

**New Module**: `src/utils/error-recovery.ts`

A comprehensive error recovery system that handles common installation issues **automatically**:

- **WSL Environment Detection**: Automatically detects Windows Subsystem for Linux
- **ENOTEMPTY Error Handling**: Recovers from npm cache corruption errors
- **Retry Logic with Exponential Backoff**: 1s → 2s → 4s → 8s → 16s
- **SQLite Fallback**: Automatically switches to JSON storage if SQLite fails
- **npm/npx Cache Cleanup**: Automated cache cleaning on errors

**Key Functions**:
```typescript
isNpmCacheError(error): boolean
isWSL(): boolean
cleanNpmCache(): Promise<RecoveryResult>
retryWithRecovery<T>(fn, options): Promise<T>
recoverWSLErrors(): Promise<RecoveryResult>
recoverInitErrors(error): Promise<RecoveryResult>
```

**Usage**:
```bash
npx claude-flow@alpha init --force
# Automatic error recovery is enabled with --force flag
```

### 2. Multi-Platform Builds

**New CI/CD Capability**: Native builds for Linux, macOS, and Windows added to the pipeline.

---

## Bug Fixes

### GitHub Actions Workflow Fixes (PR #886)

A comprehensive overhaul of the CI/CD pipeline addressing 15+ critical issues:

| Issue | Fix Applied |
|-------|-------------|
| Duplicate `test` key in package.json | Removed duplicate, npm test now works |
| ESLint errors blocking builds | Resolved all linting errors |
| TypeScript compiler crashes | Made typecheck non-blocking |
| Jest teardown errors | Added worker limits and forceExit |
| Test import path errors | Corrected paths to `tests/` directory |
| Security audit failures | Made audit non-blocking |
| Performance test failures | Made performance tests non-blocking |
| Coverage generation failures | Made coverage non-blocking |
| Peer dependency conflicts | Added `--legacy-peer-deps` |
| truth-scoring workflow | Removed (non-critical) |
| Verification pipeline | Fixed report permissions |

**Results**:
- Before: 14% success rate (5/30+ checks passing)
- After: 67% success rate (20/30 checks passing)
- **+300% improvement in passing checks**

### Agent Creation Fixes (v2.7.41)

- Fixed agent creation path validation in `init --force` command
- Added SQLite binding validation
- Graceful handling of native binding errors in memory/hive-mind commands

### DatabaseManager Improvements

- Added `initializeSQLiteWithRecovery()` method
- Automatic fallback from SQLite to JSON on errors
- Retry counter (max 3 attempts per provider)
- Enhanced error logging with recovery suggestions

---

## Breaking Changes

### Removed Files

The following files/directories were **deleted** in upstream:

| Path | Reason |
|------|--------|
| `.github/workflows/test.yml` | Consolidated into ci.yml |
| `.github/workflows/truth-scoring.yml` | Non-critical, removed |
| `docs/technical-reference/VERIFICATION-SYSTEM.md` | Restructured |
| `scripts/setup-project-reasoningbank.sh` | Deprecated |
| `tests/reasoningbank-setup-validation.sh` | Deprecated |
| `full-stack-expert.json` | Removed |

### Relocated Files

Several documentation files were reorganized:

| From | To |
|------|-----|
| `docs/binto-labs/sdk/*.md` | `docs/sdk/*.md` |

---

## New Documentation from Upstream

The following documentation was added from upstream (kept in original format without fork-specific frontmatter):

### Error Recovery Documentation
- `docs/features/automatic-error-recovery.md`
- `docs/troubleshooting/wsl-better-sqlite3-error.md`
- `docs/AUTOMATIC_ERROR_RECOVERY_v2.7.35.md`
- `docs/CONFIRMATION_AUTOMATIC_ERROR_RECOVERY.md`
- `docs/DOCKER_TEST_RESULTS_v2.7.35.md`
- `DOCKER_TEST_CONFIRMATION.md`

### Workflow Documentation
- `docs/WORKFLOW_FIXES.md`
- `docs/WORKFLOW_FIXES_FINAL_STATUS.md`
- `docs/workflow-fixes-action-plan.md`
- `docs/github-workflows-analysis-report.md`

### Architecture Documentation
- `docs/architecture/README.md`
- `docs/architecture/github-workflows-optimization-strategy.md`
- `docs/architecture/workflow-architecture-diagram.md`
- `docs/architecture/workflow-optimization-implementation-guide.md`

### GitHub Issues Templates
- `docs/github-issues/README.md`
- `docs/github-issues/wsl-enotempty-automatic-recovery.md`

---

## New Scripts & Tools

| Script | Purpose |
|--------|---------|
| `scripts/create-github-issue.sh` | Automate GitHub issue creation |
| `scripts/test-docker-wsl.sh` | Test Docker/WSL compatibility |
| `docker-test/v2.7.40/*` | Docker test suite for v2.7.40 |

---

## Test Improvements

### New Test Files
- `tests/unit/utils/error-recovery.test.ts` - Error recovery unit tests
- `tests/test.utils.ts` - Enhanced test utilities

### Test Configuration Updates
- Jest worker limits added to prevent teardown errors
- Test paths updated from `src/__tests__/` to `tests/`
- Import paths corrected in 6+ test files

---

## Package Updates

### package.json Changes
- Version bumped through v2.7.35 → v2.7.41
- Duplicate `test` script removed
- New dependencies for error recovery

### New Lock Files
- `pnpm-lock.yaml` added for pnpm compatibility

---

## Commits Included

```
51fc7269 fix: Agent creation path and SQLite binding validation - v2.7.41
b90590f3 fix: Handle native binding errors gracefully in memory and hive-mind commands
4c86993b fix: Fix agent creation in init --force command (v2.7.41)
1f16a834 Merge pull request #886 from ruvnet/fix/github-workflow-build-issues
90dba05c feat: Add multi-platform builds (Linux, macOS, Windows) to CI/CD pipeline
1531603d fix: Remove non-critical truth-scoring workflow and fix Verification Report dependency
345d6e50 fix: Resolve remaining 4 workflow failures (Build Verification, report permissions)
4f136b0a fix: Make coverage generation non-blocking in verification-pipeline (ubuntu Node 20)
635c1dc0 fix: Make performance tests non-blocking for ubuntu Node 20
4db38382 fix: Make format checking and coverage generation non-blocking
32bdf103 fix: Correct test.utils import paths in 6 remaining test files
bf21ee66 fix: Make test failures non-blocking (Jest teardown issue workaround)
7b55ddfc docs: Add comprehensive final status report for workflow fixes
42729351 fix: Add Jest worker limits and forceExit to prevent teardown errors
95c6d833 fix: Make TypeScript typecheck non-blocking (compiler crash workaround)
5efad422 fix: Update test script paths to use tests/ directory instead of src/__tests__/
3254e5a1 fix: Initialize ConflictResolver with proper dependencies in coordination-system.test.ts
d1cd7e1e fix: Make security audit non-blocking in CI/CD pipeline
39b97f4b fix: Add --legacy-peer-deps to truth-scoring, verification-pipeline, and rollback-manager workflows
a9437b43 fix: Resolve ALL remaining ESLint errors for CI/CD builds
53ab6014 fix: Resolve all critical linting and test import errors
1fcd6603 fix: Add --legacy-peer-deps to resolve typescript-eslint peer dependency conflict
ac8b8dcc fix: Resolve critical GitHub Actions workflow failures
eb5bb940 feat: Automatic error recovery for WSL better-sqlite3 ENOTEMPTY errors (v2.7.35)
```

---

## Merge Conflicts Resolved

| File | Resolution |
|------|------------|
| `.claude-flow/metrics/performance.json` | Accepted upstream |
| `.claude-flow/metrics/system-metrics.json` | Accepted upstream |
| `.claude-flow/metrics/task-metrics.json` | Accepted upstream |
| `.github/workflows/test.yml` | Deleted (per upstream) |
| `.github/workflows/truth-scoring.yml` | Deleted (per upstream) |

---

## Fork-Specific Notes

### Preserved in Fork
The `docs/binto-labs/` directory structure is **preserved in this fork** for fork-specific documentation, despite being removed in upstream.

### Document Classification Policy
YAML frontmatter per the Document Classification Guide is only applied to **fork-created documents** (like this summary), not to upstream documentation.

---

## Next Steps

1. Run `npm install` to update dependencies
2. Run `npm run build` to rebuild with new changes
3. Run `npm test` to verify all tests pass
4. Review CI/CD pipeline runs for stability

---

**End of Upstream Merge Summary**
