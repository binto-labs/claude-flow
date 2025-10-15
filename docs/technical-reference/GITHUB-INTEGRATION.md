# Claude-Flow GitHub Integration & Automation: Technical Reference

**Version:** v2.5.0-alpha.140
**Last Updated:** 2025-10-15
**Audience:** Developers, DevOps engineers, architects

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [GitHub API Integration](#github-api-integration)
4. [Safety & Security](#safety--security)
5. [Workflow Coordination](#workflow-coordination)
6. [PR Swarm Coordination](#pr-swarm-coordination)
7. [Issue Triage Automation](#issue-triage-automation)
8. [Release Coordination](#release-coordination)
9. [Multi-Repo Synchronization](#multi-repo-synchronization)
10. [GitHub Actions Integration](#github-actions-integration)
11. [Checkpoint System](#checkpoint-system)
12. [API Reference](#api-reference)
13. [Real-World Examples](#real-world-examples)
14. [Troubleshooting](#troubleshooting)

---

## Overview

Claude-Flow's GitHub integration provides **production-ready automation** for GitHub workflows, combining swarm intelligence with GitHub's API and CLI. Unlike traditional GitHub automation tools, Claude-Flow coordinates **multiple AI agents** to handle complex workflows like PR reviews, issue triage, and release management.

### Key Design Principles

1. **Safety First:** Comprehensive injection attack prevention and input validation
2. **Swarm Coordination:** Multi-agent collaboration for complex workflows
3. **Checkpoint-Based Recovery:** Git-based rollback for all operations
4. **Rate Limit Awareness:** Intelligent request throttling and retry logic
5. **Dual API Support:** Both REST API and GitHub CLI integration

### Key Features

- **🔒 Security:** Command injection prevention, input sanitization, timeout handling
- **🐝 Swarm Intelligence:** Multi-agent coordination via ruv-swarm integration
- **📸 Checkpoints:** Automatic git checkpoints with GitHub releases
- **⚡ Rate Limiting:** Automatic throttling (50 requests/minute default)
- **🔄 Retry Logic:** Exponential backoff for failed operations
- **🎯 Workflow Automation:** CI/CD pipeline orchestration
- **📊 Status Tracking:** Real-time monitoring and progress reporting

---

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│         (GitHub Commands, Workflow Coordination)             │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   GitHub Coordinator   │  ← Workflow orchestration
         │  (gh-coordinator.js)   │     Swarm integration
         └───┬─────────────────┬──┘
             │                 │
    ┌────────▼─────┐   ┌──────▼────────┐
    │  GitHub API  │   │ GitHub CLI    │
    │  Client      │   │ Safe Wrapper  │
    │  (REST)      │   │ (gh CLI)      │
    └──────┬───────┘   └───────┬───────┘
           │                   │
    ┌──────▼───────────────────▼──────┐
    │      GitHub.com API/CLI          │
    │   (Rate Limited, Authenticated)  │
    └──────────────────────────────────┘

         LAYER 1: Coordination
         LAYER 2: Safety & API Abstraction
         LAYER 3: GitHub Services
```

### Component Architecture

**File:** `src/cli/simple-commands/github/gh-coordinator.js:11-71`

```javascript
class GitHubCoordinator {
  constructor() {
    this.api = githubAPI;                    // REST API client
    this.workflows = new Map();              // Workflow registry
    this.activeCoordinations = new Map();    // Active workflow tracking
    this.currentRepo = null;                 // Repository context
    this.swarmEnabled = false;               // Swarm integration status
  }

  async initialize(options = {}) {
    // 1. Authenticate with GitHub
    await this.api.authenticate(options.token);

    // 2. Detect repository context
    const remoteUrl = execSync('git config --get remote.origin.url');
    this.currentRepo = { owner, repo };  // Parse from URL

    // 3. Initialize swarm integration
    await this.initializeSwarmIntegration();
  }
}
```

---

## GitHub API Integration

### REST API Client

**File:** `src/cli/simple-commands/github/github-api.js:17-129`

The GitHubAPIClient provides a comprehensive wrapper around GitHub's REST API with:
- Automatic rate limiting
- Request queuing
- Header-based rate limit tracking
- Exponential backoff retry logic

#### Core API Request Method

```javascript
async request(endpoint, options = {}) {
  await this.checkRateLimit();  // Block if rate limit exceeded

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${GITHUB_API_BASE}${endpoint}`;

  const headers = {
    Authorization: `token ${this.token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Claude-Flow-GitHub-Integration',
    ...options.headers,
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Update rate limit tracking from response headers
  this.rateLimitRemaining = parseInt(
    response.headers.get('x-ratelimit-remaining') || '0'
  );
  this.rateLimitResetTime = new Date(
    parseInt(response.headers.get('x-ratelimit-reset')) * 1000
  );

  return {
    success: response.ok,
    data: await response.json(),
    headers: response.headers,
    status: response.status,
  };
}
```

#### Rate Limiting Strategy

**File:** `src/cli/simple-commands/github/github-api.js:64-80`

```javascript
async checkRateLimit() {
  if (this.rateLimitRemaining <= 1) {
    const resetTime = new Date(this.rateLimitResetTime);
    const now = new Date();
    const waitTime = resetTime.getTime() - now.getTime();

    if (waitTime > 0) {
      console.warn(`⏳ Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await this.sleep(waitTime);
    }
  }
}

updateRateLimitInfo(headers) {
  this.rateLimitRemaining = parseInt(headers['x-ratelimit-remaining'] || '0');
  this.rateLimitResetTime = new Date(
    (parseInt(headers['x-ratelimit-reset']) || 0) * 1000
  );
}
```

**Rate limit behavior:**
- **5000 API calls/hour** for authenticated requests
- **60 API calls/hour** for unauthenticated requests
- Automatic sleep until rate limit resets
- Header-based tracking (no extra API calls)

### Repository Operations

**File:** `src/cli/simple-commands/github/github-api.js:134-156`

```javascript
// Get repository information
async getRepository(owner, repo) {
  return await this.request(`/repos/${owner}/${repo}`);
}

// List repositories with pagination
async listRepositories(options = {}) {
  const params = new URLSearchParams({
    sort: options.sort || 'updated',
    direction: options.direction || 'desc',
    per_page: options.perPage || 30,
    page: options.page || 1,
  });
  return await this.request(`/user/repos?${params}`);
}

// Create new repository
async createRepository(repoData) {
  return await this.request('/user/repos', {
    method: 'POST',
    body: repoData,
  });
}
```

### Pull Request Operations

**File:** `src/cli/simple-commands/github/github-api.js:159-198`

```javascript
// List pull requests with filters
async listPullRequests(owner, repo, options = {}) {
  const params = new URLSearchParams({
    state: options.state || 'open',
    sort: options.sort || 'created',
    direction: options.direction || 'desc',
    per_page: options.perPage || 30,
    page: options.page || 1,
  });
  return await this.request(`/repos/${owner}/${repo}/pulls?${params}`);
}

// Create pull request
async createPullRequest(owner, repo, prData) {
  return await this.request(`/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: prData,
  });
}

// Merge pull request
async mergePullRequest(owner, repo, prNumber, mergeData) {
  return await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    body: mergeData,
  });
}

// Request PR review
async requestPullRequestReview(owner, repo, prNumber, reviewData) {
  return await this.request(
    `/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`,
    { method: 'POST', body: reviewData }
  );
}
```

---

## Safety & Security

### GitHub CLI Safety Wrapper

**File:** `src/utils/github-cli-safety-wrapper.js:120-535`

The `GitHubCliSafe` class provides **production-ready** protection against:
- Command injection attacks
- Process timeout issues
- Memory leaks from unmanaged processes
- Rate limit violations
- Invalid input data

#### Security Configuration

```javascript
const CONFIG = {
  DEFAULT_TIMEOUT: 30000,          // 30 seconds
  MAX_TIMEOUT: 300000,             // 5 minutes
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 1000,          // 1 second
  MAX_BODY_SIZE: 1024 * 1024,      // 1MB
  RATE_LIMIT_WINDOW: 60000,        // 1 minute
  MAX_REQUESTS_PER_WINDOW: 50,
  TEMP_FILE_PREFIX: 'gh-safe-',
  ALLOWED_COMMANDS: [
    'auth', 'repo', 'issue', 'pr', 'release', 'gist', 'run',
    'workflow', 'api', 'browse', 'config', 'extension',
    'gpg-key', 'label', 'project', 'secret', 'ssh-key',
    'status', 'variable', 'cache', 'codespace'
  ],
  DANGEROUS_PATTERNS: [
    /\$\([^)]*\)/g,      // Command substitution $(...)
    /`[^`]*`/g,          // Backtick execution
    /&&|\|\||;|&/g,      // Command chaining
    /<\(/g,              // Process substitution
    />\s*\/dev\/null/g,  // Output redirection
    /\|\s*sh/g,          // Pipe to shell
    /eval\s*\(/g,        // eval() calls
    /exec\s*\(/g,        // exec() calls
  ]
};
```

#### Input Validation & Sanitization

**File:** `src/utils/github-cli-safety-wrapper.js:146-192`

```javascript
validateCommand(command) {
  if (typeof command !== 'string' || !command.trim()) {
    throw new GitHubCliValidationError(
      'Command must be a non-empty string',
      'command',
      command
    );
  }

  const parts = command.trim().split(' ');
  const mainCommand = parts[0];

  // Whitelist-based validation
  if (!CONFIG.ALLOWED_COMMANDS.includes(mainCommand)) {
    throw new GitHubCliValidationError(
      `Command '${mainCommand}' is not allowed`,
      'command',
      mainCommand
    );
  }

  return command;
}

sanitizeInput(input) {
  if (typeof input !== 'string') {
    input = String(input);
  }

  // Check for dangerous patterns
  for (const pattern of CONFIG.DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      throw new GitHubCliValidationError(
        `Input contains potentially dangerous pattern: ${pattern}`,
        'input',
        input
      );
    }
  }

  return input;
}

validateBodySize(body) {
  if (Buffer.byteLength(body, 'utf8') > CONFIG.MAX_BODY_SIZE) {
    throw new GitHubCliValidationError(
      `Body size exceeds maximum allowed size of ${CONFIG.MAX_BODY_SIZE} bytes`,
      'body',
      body.length
    );
  }
}
```

**Security features:**
- ✅ **Whitelist-based** command validation (only 22 allowed commands)
- ✅ **Pattern matching** to block injection attempts
- ✅ **Size limits** on input data (1MB max)
- ✅ **No shell execution** (`shell: false` in spawn)
- ✅ **Secure temp files** (600 permissions, cryptographic filenames)

#### Process Management with Timeout

**File:** `src/utils/github-cli-safety-wrapper.js:223-322`

```javascript
async executeWithTimeout(command, args, options = {}) {
  const timeout = Math.min(
    options.timeout || this.options.timeout,
    CONFIG.MAX_TIMEOUT
  );
  const processId = randomBytes(8).toString('hex');

  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,  // Critical: prevent shell injection
      env: { ...process.env, ...options.env },
      cwd: options.cwd || process.cwd()
    });

    this.activeProcesses.set(processId, child);

    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    // Timeout handler with graceful cleanup
    const timer = setTimeout(() => {
      if (!isResolved) {
        isTimedOut = true;
        this.killProcess(child, processId);
        this.stats.timeoutRequests++;
        reject(new GitHubCliTimeoutError(timeout, `gh ${args.join(' ')}`));
      }
    }, timeout);

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      this.activeProcesses.delete(processId);

      if (code !== 0) {
        reject(new GitHubCliError(
          `Command failed with exit code ${code}: ${stderr}`,
          'COMMAND_FAILED',
          { code, stderr, stdout }
        ));
        return;
      }

      resolve({ stdout: stdout.trim(), stderr, code });
    });
  });
}

killProcess(child, processId) {
  try {
    // Graceful termination first
    child.kill('SIGTERM');

    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (this.activeProcesses.has(processId)) {
        child.kill('SIGKILL');
        this.activeProcesses.delete(processId);
      }
    }, 5000);
  } catch (error) {
    console.warn(`Failed to kill process ${processId}:`, error.message);
  }
}
```

**Process safety guarantees:**
- ✅ **Timeout enforcement** (30s default, 5min max)
- ✅ **Graceful shutdown** (SIGTERM → SIGKILL)
- ✅ **Process tracking** (Map of active processes)
- ✅ **Leak prevention** (automatic cleanup on timeout)

#### Retry Logic with Exponential Backoff

**File:** `src/utils/github-cli-safety-wrapper.js:346-378`

```javascript
async withRetry(operation, maxRetries = this.options.maxRetries) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        this.stats.retriedRequests++;
        const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }

      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors or rate limits
      if (error instanceof GitHubCliValidationError ||
          error instanceof GitHubCliRateLimitError) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      console.warn(`Attempt ${attempt + 1} failed, retrying:`, error.message);
    }
  }

  throw lastError;
}
```

**Retry behavior:**
```
Attempt 1: Immediate execution
Attempt 2: Wait 1 second   (1000ms * 2^0)
Attempt 3: Wait 2 seconds  (1000ms * 2^1)
Attempt 4: Wait 4 seconds  (1000ms * 2^2)
Total max delay: ~7 seconds for 3 retries
```

#### Secure Temporary File Handling

**File:** `src/utils/github-cli-safety-wrapper.js:197-218`

```javascript
async createSecureTempFile(content, suffix = '.tmp') {
  // Cryptographically secure filename
  const filename = `${CONFIG.TEMP_FILE_PREFIX}${randomBytes(16).toString('hex')}${suffix}`;
  const filepath = resolve(this.options.tempDir, filename);

  // Validate content size
  this.validateBodySize(content);

  // Create file with restricted permissions (600 - owner read/write only)
  await fs.writeFile(filepath, content, { mode: 0o600 });

  return filepath;
}

async cleanupTempFile(filepath) {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.warn(`Failed to cleanup temp file ${filepath}:`, error.message);
  }
}
```

**Security features:**
- ✅ **Cryptographic filenames** (randomBytes for uniqueness)
- ✅ **Restricted permissions** (600 = owner only)
- ✅ **Automatic cleanup** (always in finally block)
- ✅ **Size validation** (1MB limit)

---

## Workflow Coordination

### Swarm-Based Coordination

**File:** `src/cli/simple-commands/github/gh-coordinator.js:50-70`

Claude-Flow integrates with ruv-swarm to enable multi-agent coordination for complex GitHub workflows:

```javascript
async initializeSwarmIntegration() {
  try {
    // Check if ruv-swarm is available
    execSync('npx ruv-swarm --version', { stdio: 'pipe' });

    // Initialize swarm for GitHub coordination
    const swarmInit = execSync(
      'npx ruv-swarm hook pre-task --description "GitHub workflow coordination"',
      { encoding: 'utf8' }
    );

    if (swarmInit.includes('continue')) {
      printSuccess('🐝 Swarm integration initialized for GitHub coordination');
      this.swarmEnabled = true;
    }
  } catch (error) {
    printWarning('Swarm integration not available - continuing without swarm features');
    this.swarmEnabled = false;
  }
}
```

### Coordination Plan Structure

**File:** `src/cli/simple-commands/github/gh-coordinator.js:76-114`

```javascript
async coordinateCIPipeline(options = {}) {
  const coordinationPlan = {
    id: `ci-setup-${Date.now()}`,
    type: 'ci_pipeline_setup',
    repository: `${owner}/${repo}`,
    pipeline: options.pipeline || 'nodejs',
    steps: [
      'analyze_repository_structure',
      'create_workflow_files',
      'setup_environment_secrets',
      'configure_branch_protection',
      'test_pipeline_execution',
      'setup_notifications',
    ],
    status: 'planning',
  };

  this.activeCoordinations.set(coordinationPlan.id, coordinationPlan);

  // Execute coordination with swarm if available
  if (this.swarmEnabled) {
    await this.executeWithSwarm(coordinationPlan);
  } else {
    await this.executeCoordination(coordinationPlan);
  }

  return coordinationPlan;
}
```

### Swarm Execution with Memory Integration

**File:** `src/cli/simple-commands/github/gh-coordinator.js:119-148`

```javascript
async executeWithSwarm(coordinationPlan) {
  console.log('🐝 Executing coordination with swarm...');

  // Store coordination plan in swarm memory
  const memoryKey = `github-coordination/${coordinationPlan.id}`;
  execSync(
    `npx ruv-swarm hook notification --message "GitHub Coordination: ${coordinationPlan.type} started" --telemetry true`
  );

  // Execute each step with swarm coordination
  for (const step of coordinationPlan.steps) {
    console.log(`Executing step: ${step}`);

    // Pre-step hook for resource preparation
    execSync(`npx ruv-swarm hook pre-task --description "GitHub step: ${step}"`);

    // Execute step logic
    await this.executeCoordinationStep(coordinationPlan, step);

    // Post-step hook for memory persistence
    execSync(
      `npx ruv-swarm hook post-edit --file "github-coordination" --memory-key "${memoryKey}/${step}"`
    );
  }

  // Final coordination notification
  execSync(
    `npx ruv-swarm hook notification --message "GitHub Coordination: ${coordinationPlan.type} completed" --telemetry true`
  );
}
```

**Swarm coordination benefits:**
- ✅ **Memory persistence** across steps
- ✅ **Distributed execution** across agents
- ✅ **Progress tracking** via hooks
- ✅ **Telemetry collection** for metrics

---

## PR Swarm Coordination

### Multi-Agent PR Review Workflow

```
┌─────────────────────────────────────────────────┐
│           PR Creation Trigger                    │
│     (New PR or PR update via webhook)            │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────▼────────┐
         │  PR Coordinator  │  ← Spawns review agents
         │   (Leader)       │     Assigns responsibilities
         └────┬────────┬────┘
              │        │
    ┌─────────▼──┐  ┌─▼──────────┐
    │  Security  │  │   Code      │
    │  Reviewer  │  │  Reviewer   │
    │  Agent     │  │  Agent      │
    └─────┬──────┘  └──┬──────────┘
          │            │
    ┌─────▼────────────▼──────┐
    │   Performance Analyzer   │
    │   Agent                  │
    └─────┬────────────────────┘
          │
    ┌─────▼────────────────────┐
    │  Consensus Aggregation   │  ← Merge all reviews
    │  (Approve/Request Changes)│
    └──────────────────────────┘
```

### PR Review Example

```javascript
// 1. Initialize GitHub coordinator
const coordinator = new GitHubCoordinator();
await coordinator.initialize({ token: process.env.GITHUB_TOKEN });

// 2. Coordinate PR review
const prReview = {
  id: `pr-review-${Date.now()}`,
  type: 'pr_review',
  prNumber: 123,
  steps: [
    'security_review',    // Check for vulnerabilities
    'code_quality',       // Linting, complexity analysis
    'test_coverage',      // Ensure adequate testing
    'performance_check',  // Identify bottlenecks
    'consensus_decision', // Aggregate reviews
  ]
};

// 3. Execute with swarm coordination
if (coordinator.swarmEnabled) {
  // Spawn specialized review agents
  await coordinator.executeWithSwarm(prReview);
} else {
  await coordinator.executeCoordination(prReview);
}
```

---

## Issue Triage Automation

### Intelligent Issue Classification

**File:** `src/cli/simple-commands/github/github-api.js:203-245`

```javascript
// List issues with filtering
async listIssues(owner, repo, options = {}) {
  const params = new URLSearchParams({
    state: options.state || 'open',
    sort: options.sort || 'created',
    direction: options.direction || 'desc',
    per_page: options.perPage || 30,
    page: options.page || 1,
  });

  if (options.labels) {
    params.append('labels', options.labels);
  }

  return await this.request(`/repos/${owner}/${repo}/issues?${params}`);
}

// Create issue
async createIssue(owner, repo, issueData) {
  return await this.request(`/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    body: issueData,
  });
}

// Update issue with labels and assignees
async updateIssue(owner, repo, issueNumber, issueData) {
  return await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
    method: 'PATCH',
    body: issueData,
  });
}

// Add labels to issue
async addIssueLabels(owner, repo, issueNumber, labels) {
  return await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
    method: 'POST',
    body: { labels },
  });
}

// Assign issue to team members
async assignIssue(owner, repo, issueNumber, assignees) {
  return await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/assignees`, {
    method: 'POST',
    body: { assignees },
  });
}
```

### Issue Triage Workflow Example

```javascript
// Automated issue triage with swarm coordination
const issueTriageWorkflow = {
  id: `issue-triage-${Date.now()}`,
  type: 'issue_triage',
  steps: [
    'classify_issue',       // Bug, feature, question, etc.
    'priority_assessment',  // Critical, high, medium, low
    'team_assignment',      // Route to appropriate team
    'label_application',    // Apply classification labels
    'milestone_linking',    // Link to relevant milestone
  ]
};

// Execute triage
await coordinator.executeWithSwarm(issueTriageWorkflow);

// Example classification result:
// Issue #456: "App crashes on startup"
// → Labels: ['bug', 'priority:high', 'area:mobile']
// → Assignee: mobile-team-lead
// → Milestone: v2.1.0 Stability Release
```

---

## Release Coordination

### Multi-Stage Release Pipeline

**File:** `src/cli/simple-commands/github/gh-coordinator.js:496-533`

```javascript
async coordinateRelease(options = {}) {
  console.log('🚀 Coordinating release process...');

  const { owner, repo } = this.currentRepo;
  const version = options.version || 'auto';
  const prerelease = options.prerelease || false;

  const coordinationPlan = {
    id: `release-${Date.now()}`,
    type: 'release_coordination',
    repository: `${owner}/${repo}`,
    version,
    prerelease,
    steps: [
      'prepare_release_notes',
      'create_release_branch',
      'run_release_tests',
      'create_release_tag',
      'publish_release',
      'notify_stakeholders',
    ],
    status: 'planning',
  };

  this.activeCoordinations.set(coordinationPlan.id, coordinationPlan);

  if (this.swarmEnabled) {
    await this.executeWithSwarm(coordinationPlan);
  } else {
    await this.executeCoordination(coordinationPlan);
  }

  return coordinationPlan;
}
```

### Release Creation via CLI

**File:** `src/utils/github-cli-safety-wrapper.js:486-497`

```javascript
async createRelease({ tag, title, body, prerelease = false, draft = false, ...options }) {
  const flags = { tag };
  if (prerelease) flags.prerelease = true;
  if (draft) flags.draft = true;

  return await this.execute('release create', {
    title,
    body,
    flags,
    ...options
  });
}
```

### Release Workflow Example

```javascript
// Comprehensive release workflow
const releaseWorkflow = {
  version: 'v2.1.0',
  steps: [
    {
      name: 'prepare_release_notes',
      action: async () => {
        // Aggregate commits since last release
        const commits = await githubAPI.request(`/repos/${owner}/${repo}/commits`);
        const releaseNotes = generateReleaseNotes(commits.data);
        return releaseNotes;
      }
    },
    {
      name: 'create_release_branch',
      action: async () => {
        await githubAPI.createBranch(owner, repo, 'release/v2.1.0', mainSha);
      }
    },
    {
      name: 'run_release_tests',
      action: async () => {
        // Trigger GitHub Actions workflow
        await githubAPI.triggerWorkflow(owner, repo, 'release-tests.yml', 'release/v2.1.0');
      }
    },
    {
      name: 'create_release_tag',
      action: async () => {
        await githubCli.execute('release create v2.1.0 --title "Release v2.1.0"');
      }
    },
    {
      name: 'publish_release',
      action: async () => {
        await githubAPI.createRelease(owner, repo, {
          tag_name: 'v2.1.0',
          name: 'Release v2.1.0',
          body: releaseNotes,
          draft: false,
          prerelease: false
        });
      }
    },
    {
      name: 'notify_stakeholders',
      action: async () => {
        // Post to Slack, email, etc.
      }
    }
  ]
};
```

---

## Multi-Repo Synchronization

### Cross-Repository Dependency Management

```
┌────────────────────────────────────────────────┐
│        Sync Coordinator (Leader Agent)          │
│    Detects version mismatches across repos     │
└─────────────┬──────────────────────────────────┘
              │
     ┌────────▼────────┐
     │  Repository Map  │
     │  (Dependencies)  │
     └─┬──────┬────────┬┘
       │      │        │
   ┌───▼──┐ ┌▼────┐ ┌─▼───┐
   │Repo A│ │Repo B│ │Repo C│
   │v1.0.0│ │v1.2.0│ │v1.0.0│  ← Version mismatch detected!
   └──────┘ └──────┘ └──────┘
       │      │        │
   ┌───▼──────▼────────▼───┐
   │  Dependency Analyzer   │
   │  (Identifies conflicts)│
   └───────────┬────────────┘
               │
   ┌───────────▼────────────┐
   │  Version Alignment PR  │
   │  (Automated update)    │
   └────────────────────────┘
```

### Synchronization Example

```javascript
// Multi-repo package.json synchronization
const syncCoordination = {
  id: `sync-${Date.now()}`,
  type: 'multi_repo_sync',
  repositories: [
    'org/frontend-app',
    'org/backend-api',
    'org/shared-library'
  ],
  targetDependencies: {
    'lodash': '^4.17.21',
    'express': '^4.18.2',
    'typescript': '^5.0.0'
  },
  steps: [
    'scan_all_repositories',
    'detect_version_mismatches',
    'create_update_branches',
    'update_package_json_files',
    'run_dependency_tests',
    'create_sync_pull_requests',
  ]
};

// Execute synchronization
await coordinator.executeWithSwarm(syncCoordination);
```

---

## GitHub Actions Integration

### Workflow File Generation

**File:** `src/cli/simple-commands/github/gh-coordinator.js:236-267`

```javascript
async createWorkflowFiles(owner, repo, pipeline) {
  console.log('📝 Creating workflow files...');

  const workflowContent = this.generateWorkflowContent(pipeline);
  const workflowPath = `.github/workflows/${pipeline}-ci.yml`;

  // Create workflow file content
  const createFileData = {
    message: `Add ${pipeline} CI workflow`,
    content: Buffer.from(workflowContent).toString('base64'),
    path: workflowPath,
  };

  // Check if file exists
  const existingFile = await this.api.request(
    `/repos/${owner}/${repo}/contents/${workflowPath}`
  );

  if (existingFile.success) {
    // Update existing file
    createFileData.sha = existingFile.data.sha;
    createFileData.message = `Update ${pipeline} CI workflow`;
  }

  const response = await this.api.request(
    `/repos/${owner}/${repo}/contents/${workflowPath}`,
    { method: 'PUT', body: createFileData }
  );

  if (response.success) {
    console.log(`✅ Workflow file created: ${workflowPath}`);
  }
}
```

### Node.js CI Template

**File:** `src/cli/simple-commands/github/gh-coordinator.js:273-321`

```yaml
name: Node.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Run linter
      run: npm run lint

    - name: Build project
      run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Run security audit
      run: npm audit --audit-level moderate

    - name: Check for vulnerabilities
      run: npm audit --audit-level high
```

### Workflow Triggering

**File:** `src/cli/simple-commands/github/github-api.js:282-307`

```javascript
// List workflows in repository
async listWorkflows(owner, repo) {
  return await this.request(`/repos/${owner}/${repo}/actions/workflows`);
}

// Trigger workflow with inputs
async triggerWorkflow(owner, repo, workflowId, ref = 'main', inputs = {}) {
  return await this.request(
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: 'POST',
      body: { ref, inputs },
    }
  );
}

// List workflow runs with status filtering
async listWorkflowRuns(owner, repo, options = {}) {
  const params = new URLSearchParams({
    per_page: options.perPage || 30,
    page: options.page || 1,
  });

  if (options.status) {
    params.append('status', options.status);
  }

  return await this.request(`/repos/${owner}/${repo}/actions/runs?${params}`);
}
```

---

## Checkpoint System

### Git-Based Checkpoint Automation

**File:** `src/cli/simple-commands/github/init.js:17-243`

Claude-Flow's checkpoint system provides automatic rollback capabilities using Git tags and GitHub releases:

#### Pre-Edit Checkpoints

```bash
#!/bin/bash
# Function: pre_edit_checkpoint (lines 25-55)

pre_edit_checkpoint() {
    local tool_input="$1"
    local file=$(echo "$tool_input" | jq -r '.file_path // empty')

    if [ -n "$file" ]; then
        local checkpoint_branch="checkpoint/pre-edit-$(date +%Y%m%d-%H%M%S)"
        local current_branch=$(git branch --show-current)

        # Create checkpoint
        git add -A
        git stash push -m "Pre-edit checkpoint for $file"
        git branch "$checkpoint_branch"

        # Store metadata
        mkdir -p .claude/checkpoints
        cat > ".claude/checkpoints/$(date +%s).json" <<EOF
{
  "branch": "$checkpoint_branch",
  "file": "$file",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "pre-edit",
  "original_branch": "$current_branch"
}
EOF

        # Restore working directory
        git stash pop --quiet

        echo "✅ Created checkpoint: $checkpoint_branch for $file"
    fi
}
```

#### Post-Edit Checkpoints with GitHub Releases

**File:** `src/cli/simple-commands/github/init.js:58-109`

```bash
post_edit_checkpoint() {
    local tool_input="$1"
    local file=$(echo "$tool_input" | jq -r '.file_path // empty')

    if [ -n "$file" ] && [ -f "$file" ]; then
        # Check if file was modified
        if ! git diff --quiet "$file" 2>/dev/null; then
            local tag_name="checkpoint-$(date +%Y%m%d-%H%M%S)"
            local current_branch=$(git branch --show-current)

            # Create commit
            git add "$file"
            git commit -m "🔖 Checkpoint: Edit $file

Automatic checkpoint created by Claude
- File: $file
- Branch: $current_branch
- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)

[Auto-checkpoint]"

            # Create tag
            git tag -a "$tag_name" -m "Checkpoint after editing $file"

            # Store metadata
            mkdir -p .claude/checkpoints
            cat > ".claude/checkpoints/$(date +%s).json" <<EOF
{
  "tag": "$tag_name",
  "file": "$file",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "post-edit",
  "branch": "$current_branch"
}
EOF

            echo "✅ Created checkpoint: $tag_name for $file"
        fi
    fi
}
```

#### Task Checkpoints with GitHub Releases

**File:** `src/cli/simple-commands/github/init.js:112-157`

```bash
task_checkpoint() {
    local user_prompt="$1"
    local task=$(echo "$user_prompt" | head -c 100 | tr '\n' ' ')

    if [ -n "$task" ]; then
        local checkpoint_name="task-$(date +%Y%m%d-%H%M%S)"

        # Commit current state
        git add -A
        git commit -m "🔖 Task checkpoint: $task..." --quiet

        # Create GitHub release if gh CLI is available
        if command -v gh &> /dev/null; then
            echo "🚀 Creating GitHub release for checkpoint..."
            gh release create "$checkpoint_name" \
                --title "Checkpoint: $(date +'%Y-%m-%d %H:%M')" \
                --notes "Task: $task

## Checkpoint Details
- Branch: $(git branch --show-current)
- Commit: $(git rev-parse HEAD)
- Files changed: $(git diff HEAD~1 --stat | wc -l) files

## Rollback Instructions
\`\`\`bash
# To rollback to this checkpoint:
git checkout $checkpoint_name
\`\`\`" \
                --prerelease
        fi

        echo "✅ Created task checkpoint: $checkpoint_name"
    fi
}
```

### Session End Summary

**File:** `src/cli/simple-commands/github/init.js:160-218`

```bash
session_end_checkpoint() {
    local session_id="session-$(date +%Y%m%d-%H%M%S)"
    local summary_file=".claude/checkpoints/summary-$session_id.md"

    mkdir -p .claude/checkpoints

    # Create detailed summary
    cat > "$summary_file" <<EOF
# Session Summary - $(date +'%Y-%m-%d %H:%M:%S')

## Checkpoints Created
$(find .claude/checkpoints -name '*.json' -mtime -1 -exec basename {} \;)

## Files Modified
$(git diff --name-only $(git log --format=%H -n 1 --before="1 hour ago" 2>/dev/null))

## Recent Commits
$(git log --oneline -10 --grep="Checkpoint")

## GitHub Releases Created
$(gh release list --limit 10 | grep "checkpoint-")

## Rollback Instructions
To rollback to a specific checkpoint:
\`\`\`bash
# List all checkpoints
git tag -l 'checkpoint-*' | sort -r

# List GitHub releases
gh release list

# Rollback to a checkpoint
git checkout checkpoint-YYYYMMDD-HHMMSS

# Or download release
gh release download checkpoint-YYYYMMDD-HHMMSS

# Or reset to a checkpoint (destructive)
git reset --hard checkpoint-YYYYMMDD-HHMMSS
\`\`\`
EOF

    # Create final checkpoint
    git add -A
    git commit -m "🏁 Session end checkpoint: $session_id" --quiet
    git tag -a "session-end-$session_id" -m "End of Claude session"

    # Create GitHub session summary if gh is available
    if command -v gh &> /dev/null; then
        gh release create "session-$session_id" \
            --title "Session Summary: $(date +'%Y-%m-%d %H:%M')" \
            --notes-file "$summary_file" \
            --prerelease
    fi

    echo "✅ Session summary saved to: $summary_file"
}
```

---

## API Reference

### GitHubAPIClient Methods

#### Authentication
```javascript
await githubAPI.authenticate(token)
// Returns: boolean (success status)
```

#### Repository Methods
```javascript
await githubAPI.getRepository(owner, repo)
await githubAPI.listRepositories({ sort, direction, perPage, page })
await githubAPI.createRepository(repoData)
```

#### Pull Request Methods
```javascript
await githubAPI.listPullRequests(owner, repo, { state, sort, direction })
await githubAPI.createPullRequest(owner, repo, { title, body, head, base })
await githubAPI.updatePullRequest(owner, repo, prNumber, prData)
await githubAPI.mergePullRequest(owner, repo, prNumber, { commit_title, merge_method })
await githubAPI.requestPullRequestReview(owner, repo, prNumber, { reviewers })
```

#### Issue Methods
```javascript
await githubAPI.listIssues(owner, repo, { state, labels, sort })
await githubAPI.createIssue(owner, repo, { title, body, labels, assignees })
await githubAPI.updateIssue(owner, repo, issueNumber, { state, title, body })
await githubAPI.addIssueLabels(owner, repo, issueNumber, labels)
await githubAPI.assignIssue(owner, repo, issueNumber, assignees)
```

#### Release Methods
```javascript
await githubAPI.listReleases(owner, repo, { perPage, page })
await githubAPI.createRelease(owner, repo, { tag_name, name, body, draft, prerelease })
await githubAPI.updateRelease(owner, repo, releaseId, releaseData)
await githubAPI.deleteRelease(owner, repo, releaseId)
```

#### Workflow Methods
```javascript
await githubAPI.listWorkflows(owner, repo)
await githubAPI.triggerWorkflow(owner, repo, workflowId, ref, inputs)
await githubAPI.listWorkflowRuns(owner, repo, { status, perPage, page })
```

### GitHubCliSafe Methods

#### High-Level Operations
```javascript
await githubCli.createIssue({ title, body, labels, assignees })
await githubCli.createPR({ title, body, base, head, draft })
await githubCli.addIssueComment(issueNumber, body)
await githubCli.addPRComment(prNumber, body)
await githubCli.createRelease({ tag, title, body, prerelease, draft })
```

#### Utility Methods
```javascript
await githubCli.checkGitHubCli()     // Returns: boolean
await githubCli.checkAuthentication() // Returns: boolean
githubCli.getStats()                  // Returns: { totalRequests, successfulRequests, ... }
githubCli.getActiveProcessCount()     // Returns: number
await githubCli.cleanup()             // Cleanup all active processes
```

### GitHubCoordinator Methods

#### Initialization
```javascript
const coordinator = new GitHubCoordinator();
await coordinator.initialize({ token: 'ghp_xxx' });
```

#### Workflow Coordination
```javascript
await coordinator.coordinateCIPipeline({ pipeline: 'nodejs', autoApprove: false })
await coordinator.coordinateRelease({ version: 'v2.0.0', prerelease: false })
```

#### Coordination Management
```javascript
coordinator.getCoordinationStatus(coordinationId)
coordinator.listActiveCoordinations()
coordinator.cancelCoordination(coordinationId)
```

---

## Real-World Examples

### Example 1: Automated PR Review Workflow

```javascript
#!/usr/bin/env node
import { GitHubCoordinator } from './github/gh-coordinator.js';

async function automatedPRReview() {
  const coordinator = new GitHubCoordinator();
  await coordinator.initialize({ token: process.env.GITHUB_TOKEN });

  // Define PR review workflow
  const prReviewPlan = {
    id: `pr-review-${Date.now()}`,
    type: 'pr_review_automation',
    prNumber: 456,
    repository: 'org/project',
    steps: [
      'fetch_pr_changes',
      'static_code_analysis',
      'security_vulnerability_scan',
      'test_coverage_analysis',
      'performance_impact_check',
      'generate_review_comments',
      'post_review_summary',
    ],
    reviewers: [
      { type: 'security', agent: 'security-agent' },
      { type: 'performance', agent: 'perf-agent' },
      { type: 'code_quality', agent: 'quality-agent' },
    ],
  };

  // Execute with swarm coordination
  await coordinator.executeWithSwarm(prReviewPlan);

  // Aggregate reviews
  const reviews = prReviewPlan.reviewers.map(r => r.comments);
  const consensus = aggregateReviews(reviews);

  // Post consolidated review
  await coordinator.api.addPRComment(456, consensus.summary);

  console.log('✅ PR review completed:', consensus);
}

// Run workflow
automatedPRReview().catch(console.error);
```

**Output:**
```
🐝 Swarm integration initialized for GitHub coordination
Connected to repository: org/project
🐝 Executing coordination with swarm...
Executing step: fetch_pr_changes
Executing step: static_code_analysis
  ✅ No critical issues found
Executing step: security_vulnerability_scan
  ⚠️  1 medium severity issue detected
Executing step: test_coverage_analysis
  ✅ Coverage: 87% (target: 80%)
Executing step: performance_impact_check
  ✅ No performance degradation detected
✅ PR review completed: APPROVED_WITH_COMMENTS
```

### Example 2: Issue Triage with Automatic Assignment

```javascript
#!/usr/bin/env node
import { githubAPI } from './github/github-api.js';

async function intelligentIssueTriage() {
  // Authenticate
  await githubAPI.authenticate(process.env.GITHUB_TOKEN);

  // Fetch open issues
  const response = await githubAPI.listIssues('org', 'project', {
    state: 'open',
    labels: 'needs-triage',
    perPage: 50,
  });

  const issues = response.data;

  for (const issue of issues) {
    console.log(`\n📋 Triaging issue #${issue.number}: ${issue.title}`);

    // Classify issue
    const classification = await classifyIssue(issue.body);

    // Apply labels
    await githubAPI.addIssueLabels('org', 'project', issue.number, [
      classification.type,        // bug, feature, question
      classification.priority,    // critical, high, medium, low
      classification.area,        // frontend, backend, api
    ]);

    // Assign to team
    const team = determineTeam(classification.area);
    await githubAPI.assignIssue('org', 'project', issue.number, [team.lead]);

    // Link to milestone
    if (classification.priority === 'critical') {
      await githubAPI.updateIssue('org', 'project', issue.number, {
        milestone: 'Current Sprint',
      });
    }

    console.log(`  ✅ Classified as: ${classification.type} (${classification.priority})`);
    console.log(`  👤 Assigned to: ${team.lead}`);
  }
}

function classifyIssue(body) {
  // Simple classification logic (can be enhanced with ML)
  const isBug = body.toLowerCase().includes('error') || body.toLowerCase().includes('crash');
  const isFeature = body.toLowerCase().includes('feature') || body.toLowerCase().includes('add');

  return {
    type: isBug ? 'bug' : isFeature ? 'feature' : 'question',
    priority: isBug ? 'high' : 'medium',
    area: body.includes('API') ? 'backend' : 'frontend',
  };
}

function determineTeam(area) {
  const teams = {
    frontend: { lead: 'frontend-lead', members: ['dev1', 'dev2'] },
    backend: { lead: 'backend-lead', members: ['dev3', 'dev4'] },
    api: { lead: 'api-lead', members: ['dev5', 'dev6'] },
  };
  return teams[area] || teams.backend;
}

// Run triage
intelligentIssueTriage().catch(console.error);
```

### Example 3: Release Coordination with Multi-Stage Testing

```javascript
#!/usr/bin/env node
import { GitHubCoordinator } from './github/gh-coordinator.js';
import { githubAPI } from './github/github-api.js';

async function coordinatedRelease() {
  const coordinator = new GitHubCoordinator();
  await coordinator.initialize({ token: process.env.GITHUB_TOKEN });

  const releaseVersion = 'v2.1.0';

  // Define comprehensive release workflow
  const releasePlan = {
    id: `release-${releaseVersion}-${Date.now()}`,
    type: 'production_release',
    version: releaseVersion,
    steps: [
      {
        name: 'version_bump',
        action: async () => {
          console.log('📝 Bumping version in package.json...');
          // Update version files
        },
      },
      {
        name: 'changelog_generation',
        action: async () => {
          console.log('📋 Generating changelog...');
          const commits = await githubAPI.request('/repos/org/project/commits');
          const changelog = generateChangelog(commits.data);
          return changelog;
        },
      },
      {
        name: 'create_release_branch',
        action: async () => {
          console.log('🌿 Creating release branch...');
          await githubAPI.createBranch('org', 'project', `release/${releaseVersion}`, mainSha);
        },
      },
      {
        name: 'run_integration_tests',
        action: async () => {
          console.log('🧪 Running integration tests...');
          await githubAPI.triggerWorkflow('org', 'project', 'integration-tests.yml', `release/${releaseVersion}`);
          // Wait for workflow completion
          await waitForWorkflow('integration-tests.yml');
        },
      },
      {
        name: 'run_performance_tests',
        action: async () => {
          console.log('⚡ Running performance tests...');
          await githubAPI.triggerWorkflow('org', 'project', 'perf-tests.yml', `release/${releaseVersion}`);
          await waitForWorkflow('perf-tests.yml');
        },
      },
      {
        name: 'security_scan',
        action: async () => {
          console.log('🔒 Running security scan...');
          await githubAPI.triggerWorkflow('org', 'project', 'security-scan.yml', `release/${releaseVersion}`);
          await waitForWorkflow('security-scan.yml');
        },
      },
      {
        name: 'create_github_release',
        action: async (context) => {
          console.log('🚀 Creating GitHub release...');
          await githubAPI.createRelease('org', 'project', {
            tag_name: releaseVersion,
            name: `Release ${releaseVersion}`,
            body: context.changelog,
            draft: false,
            prerelease: false,
          });
        },
      },
      {
        name: 'deploy_to_production',
        action: async () => {
          console.log('🌐 Deploying to production...');
          await githubAPI.triggerWorkflow('org', 'project', 'deploy-production.yml', releaseVersion);
        },
      },
      {
        name: 'notify_stakeholders',
        action: async () => {
          console.log('📢 Notifying stakeholders...');
          // Send notifications via Slack, email, etc.
        },
      },
    ],
  };

  // Execute release coordination
  const context = {};
  for (const step of releasePlan.steps) {
    try {
      const result = await step.action(context);
      if (result) context[step.name] = result;
    } catch (error) {
      console.error(`❌ Step ${step.name} failed:`, error.message);
      console.log('🔄 Rolling back release...');
      await rollbackRelease(releaseVersion);
      throw error;
    }
  }

  console.log(`✅ Release ${releaseVersion} completed successfully!`);
}

async function waitForWorkflow(workflowName) {
  // Poll workflow status until completion
  let attempts = 0;
  while (attempts < 60) {
    const runs = await githubAPI.listWorkflowRuns('org', 'project', { perPage: 1 });
    const latestRun = runs.data.workflow_runs[0];

    if (latestRun.conclusion === 'success') {
      console.log(`  ✅ ${workflowName} completed successfully`);
      return;
    } else if (latestRun.conclusion === 'failure') {
      throw new Error(`${workflowName} failed`);
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
    attempts++;
  }
  throw new Error(`${workflowName} timed out`);
}

async function rollbackRelease(version) {
  console.log(`🔙 Rolling back release ${version}...`);
  // Delete release branch, tag, GitHub release
  // Restore previous state
}

// Run release
coordinatedRelease().catch(console.error);
```

### Example 4: Multi-Repo Dependency Synchronization

```javascript
#!/usr/bin/env node
import { GitHubCoordinator } from './github/gh-coordinator.js';
import { githubAPI } from './github/github-api.js';
import { readFile, writeFile } from 'fs/promises';

async function syncDependenciesAcrossRepos() {
  const coordinator = new GitHubCoordinator();
  await coordinator.initialize({ token: process.env.GITHUB_TOKEN });

  const repos = [
    'org/frontend-app',
    'org/backend-api',
    'org/mobile-app',
    'org/shared-utils',
  ];

  const targetDependencies = {
    'react': '^18.2.0',
    'typescript': '^5.0.0',
    'eslint': '^8.40.0',
  };

  console.log('🔍 Scanning repositories for dependency mismatches...\n');

  const mismatchedRepos = [];

  for (const repoFullName of repos) {
    const [owner, repo] = repoFullName.split('/');

    // Fetch package.json
    const response = await githubAPI.request(`/repos/${owner}/${repo}/contents/package.json`);
    const packageJson = JSON.parse(Buffer.from(response.data.content, 'base64').toString());

    // Check for mismatches
    const mismatches = [];
    for (const [dep, targetVersion] of Object.entries(targetDependencies)) {
      const currentVersion = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
      if (currentVersion && currentVersion !== targetVersion) {
        mismatches.push({ dep, current: currentVersion, target: targetVersion });
      }
    }

    if (mismatches.length > 0) {
      console.log(`⚠️  ${repoFullName}:`);
      mismatches.forEach(m => console.log(`  - ${m.dep}: ${m.current} → ${m.target}`));
      mismatchedRepos.push({ owner, repo, mismatches, packageJson, sha: response.data.sha });
    }
  }

  if (mismatchedRepos.length === 0) {
    console.log('✅ All repositories are synchronized!');
    return;
  }

  console.log(`\n🔄 Creating synchronization PRs for ${mismatchedRepos.length} repositories...\n`);

  for (const repoData of mismatchedRepos) {
    // Update package.json
    for (const mismatch of repoData.mismatches) {
      if (repoData.packageJson.dependencies?.[mismatch.dep]) {
        repoData.packageJson.dependencies[mismatch.dep] = mismatch.target;
      }
      if (repoData.packageJson.devDependencies?.[mismatch.dep]) {
        repoData.packageJson.devDependencies[mismatch.dep] = mismatch.target;
      }
    }

    // Create sync branch
    const branchName = `deps/sync-dependencies-${Date.now()}`;
    const mainBranch = await githubAPI.request(`/repos/${repoData.owner}/${repoData.repo}/git/ref/heads/main`);
    await githubAPI.createBranch(repoData.owner, repoData.repo, branchName, mainBranch.data.object.sha);

    // Commit updated package.json
    const updatedContent = Buffer.from(JSON.stringify(repoData.packageJson, null, 2)).toString('base64');
    await githubAPI.request(`/repos/${repoData.owner}/${repoData.repo}/contents/package.json`, {
      method: 'PUT',
      body: {
        message: 'chore: sync dependencies across repositories',
        content: updatedContent,
        sha: repoData.sha,
        branch: branchName,
      },
    });

    // Create PR
    const prBody = `## Dependency Synchronization

This PR updates dependencies to match the organization's standard versions:

${repoData.mismatches.map(m => `- **${m.dep}**: \`${m.current}\` → \`${m.target}\``).join('\n')}

### Testing Checklist
- [ ] Run \`npm install\`
- [ ] Run tests: \`npm test\`
- [ ] Check for breaking changes
- [ ] Update lockfile if needed

*This PR was automatically created by Claude-Flow dependency sync.*`;

    await githubAPI.createPullRequest(repoData.owner, repoData.repo, {
      title: 'chore: sync dependencies across repositories',
      body: prBody,
      head: branchName,
      base: 'main',
    });

    console.log(`✅ Created PR for ${repoData.owner}/${repoData.repo}`);
  }

  console.log('\n✅ Dependency synchronization completed!');
}

// Run synchronization
syncDependenciesAcrossRepos().catch(console.error);
```

### Example 5: GitHub Checkpoint Recovery

```bash
#!/bin/bash
# Rollback to a specific checkpoint

# List available checkpoints
echo "📋 Available checkpoints:"
git tag -l 'checkpoint-*' | sort -r | head -10

echo ""
echo "📋 Available GitHub releases:"
gh release list --limit 10 | grep "checkpoint-"

echo ""
read -p "Enter checkpoint tag to rollback to: " CHECKPOINT

# Verify checkpoint exists
if ! git rev-parse "$CHECKPOINT" >/dev/null 2>&1; then
    echo "❌ Checkpoint not found: $CHECKPOINT"
    exit 1
fi

# Show checkpoint details
echo ""
echo "📊 Checkpoint details:"
git show "$CHECKPOINT" --stat

echo ""
read -p "Confirm rollback to $CHECKPOINT? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

# Create safety checkpoint before rollback
SAFETY_TAG="pre-rollback-$(date +%Y%m%d-%H%M%S)"
git tag -a "$SAFETY_TAG" -m "Safety checkpoint before rollback to $CHECKPOINT"
echo "✅ Created safety checkpoint: $SAFETY_TAG"

# Perform rollback
echo "🔄 Rolling back to $CHECKPOINT..."
git checkout "$CHECKPOINT"

echo "✅ Rollback completed!"
echo ""
echo "📌 To undo rollback, checkout safety tag:"
echo "   git checkout $SAFETY_TAG"
```

---

## Troubleshooting

### Rate Limit Issues

**Problem:** `Rate limit exceeded. Try again in XXX seconds`

**Solution:**
```javascript
// Increase rate limit window
const githubAPI = new GitHubAPIClient();
githubAPI.rateLimiter = new RateLimiter(
  100,    // maxRequests (increase from 50)
  120000  // windowMs (2 minutes)
);

// Or use GitHub CLI for local operations
await githubCli.createIssue({ title, body }); // No rate limit for local git operations
```

### Authentication Failures

**Problem:** `Authentication failed: 401 Unauthorized`

**Solution:**
```bash
# Check GitHub token permissions
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Verify GitHub CLI authentication
gh auth status

# Re-authenticate GitHub CLI
gh auth login

# Check token scopes (must include repo, workflow)
# Generate new token at: https://github.com/settings/tokens
```

### Timeout Issues

**Problem:** `Command timed out after 30000ms`

**Solution:**
```javascript
// Increase timeout for long-running operations
const githubCli = new GitHubCliSafe({
  timeout: 120000,  // 2 minutes (default: 30s)
  maxRetries: 5     // More retries (default: 3)
});

// Or use async operations
await githubAPI.triggerWorkflow(owner, repo, workflowId);
// Don't wait for completion - poll status separately
```

### Process Cleanup Issues

**Problem:** Processes remain active after script termination

**Solution:**
```javascript
// Always cleanup before exit
process.on('SIGINT', async () => {
  await githubCli.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await githubCli.cleanup();
  process.exit(0);
});

// Or use try-finally
try {
  await githubCli.createPR({ title, body });
} finally {
  await githubCli.cleanup();
}
```

### Swarm Integration Issues

**Problem:** `Swarm integration not available`

**Solution:**
```bash
# Install ruv-swarm
npm install -g ruv-swarm

# Verify installation
npx ruv-swarm --version

# Initialize swarm manually
npx ruv-swarm hook pre-task --description "GitHub coordination"

# Check swarm status
npx ruv-swarm hook status
```

### Checkpoint Restore Failures

**Problem:** Cannot restore checkpoint due to conflicts

**Solution:**
```bash
# Stash current changes
git stash push -m "Before checkpoint restore"

# Force checkout checkpoint
git checkout -f checkpoint-YYYYMMDD-HHMMSS

# Or use hard reset (destructive)
git reset --hard checkpoint-YYYYMMDD-HHMMSS

# Restore stashed changes if needed
git stash pop
```

### GitHub API Response Errors

**Problem:** `GitHub API error: Resource not accessible by integration`

**Solution:**
```javascript
// Check repository permissions
const repo = await githubAPI.getRepository(owner, repo);
console.log('Permissions:', repo.data.permissions);

// Verify required permissions:
// - admin: true (for branch protection)
// - push: true (for creating files)
// - pull: true (for reading data)

// Request additional permissions via GitHub App settings
```

---

## Performance Optimization

### Batch API Requests

```javascript
// ❌ BAD: Sequential requests
for (const repo of repos) {
  await githubAPI.getRepository(owner, repo);
}

// ✅ GOOD: Parallel requests
await Promise.all(
  repos.map(repo => githubAPI.getRepository(owner, repo))
);
```

### Cache Repository Data

```javascript
const repoCache = new Map();

async function getCachedRepository(owner, repo) {
  const key = `${owner}/${repo}`;

  if (repoCache.has(key)) {
    return repoCache.get(key);
  }

  const data = await githubAPI.getRepository(owner, repo);
  repoCache.set(key, data);

  // Expire cache after 5 minutes
  setTimeout(() => repoCache.delete(key), 300000);

  return data;
}
```

### Use Conditional Requests

```javascript
// Store ETags for conditional requests
const etagCache = new Map();

async function listIssuesWithETag(owner, repo) {
  const cacheKey = `${owner}/${repo}/issues`;
  const etag = etagCache.get(cacheKey);

  const response = await githubAPI.request(`/repos/${owner}/${repo}/issues`, {
    headers: etag ? { 'If-None-Match': etag } : {}
  });

  if (response.status === 304) {
    console.log('⚡ Using cached data (304 Not Modified)');
    return cachedIssues;
  }

  etagCache.set(cacheKey, response.headers.get('etag'));
  return response.data;
}
```

---

## Related Documentation

- [Memory Architecture](MEMORY-ARCHITECTURE.md) - Swarm memory integration
- [User Guide](../claude-flow-user-guide-2025-10-14.md) - High-level usage
- [Architecture Deep Dive](../investigation/ARCHITECTURE-DEEP-DIVE.md) - System architecture
- [API Reference](API-REFERENCE.md) - Complete API documentation

---

## References

### Source Files
- **GitHub API Client:** `src/cli/simple-commands/github/github-api.js`
- **GitHub CLI Safety Wrapper:** `src/utils/github-cli-safety-wrapper.js`
- **GitHub Coordinator:** `src/cli/simple-commands/github/gh-coordinator.js`
- **Checkpoint System:** `src/cli/simple-commands/github/init.js`
- **GitHub Command:** `src/cli/simple-commands/github.js`

### External Resources
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)

---

**Last Updated:** 2025-10-15
**Authors:** Claude-Flow Team
**License:** MIT
