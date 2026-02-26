#!/usr/bin/env node
/**
 * Workflow Monitor (ADR-051)
 * Tracks claude-flow MCP usage and nudges the LLM when it drifts
 * from the intended workflow (editing files without MCP coordination).
 *
 * Modes: off | warn (default) | gate | strict
 * Set via CLAUDE_FLOW_ENFORCE env var.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.join(process.cwd(), '.claude-flow', 'sessions');
const SESSION_FILE = path.join(SESSION_DIR, 'current.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJSON(p) {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null; }
  catch { return null; }
}

function writeJSON(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function getMode() {
  var env = (process.env.CLAUDE_FLOW_ENFORCE || '').toLowerCase();
  if (['off', 'warn', 'gate', 'strict'].indexOf(env) !== -1) return env;
  return 'warn';
}

function getState() {
  var session = readJSON(SESSION_FILE);
  if (!session) return null;
  if (!session.context) session.context = {};
  if (!session.context.enforcement) {
    session.context.enforcement = {
      mcpCalls: 0,
      mcpToolsSeen: [],
      edits: 0,
      editsBeforeFirstMcp: 0,
      editsSinceLastMcp: 0,
      driftWarnings: 0,
      blockedEdits: 0,
      lastMcpAt: null,
      lastEditAt: null
    };
    writeJSON(SESSION_FILE, session);
  }
  return { session: session, enforcement: session.context.enforcement };
}

function saveState(sessionData) {
  writeJSON(SESSION_FILE, sessionData);
}

/**
 * Record an MCP tool call. Resets edit-since-last-mcp counter.
 */
function recordMcpCall(toolName) {
  var s = getState();
  if (!s) return;
  var e = s.enforcement;
  e.mcpCalls++;
  e.editsSinceLastMcp = 0;
  e.lastMcpAt = new Date().toISOString();
  if (toolName && e.mcpToolsSeen.indexOf(toolName) === -1) {
    e.mcpToolsSeen.push(toolName);
  }
  saveState(s.session);
  console.log('[ENFORCE] MCP call recorded: ' + (toolName || 'unknown'));
}

/**
 * Check whether a file edit should be allowed.
 * Returns { allow: boolean, reason: string }
 */
function checkEdit() {
  var s = getState();
  if (!s) return { allow: true, reason: 'no session' };
  var e = s.enforcement;
  var mode = getMode();
  e.edits++;
  e.editsSinceLastMcp++;
  e.lastEditAt = new Date().toISOString();
  if (e.mcpCalls === 0) {
    e.editsBeforeFirstMcp = e.edits;
  }

  var result = { allow: true, reason: '' };

  if (mode === 'off') {
    saveState(s.session);
    return result;
  }

  if (mode === 'strict' && e.mcpCalls === 0) {
    e.blockedEdits++;
    result = {
      allow: false,
      reason: '[ENFORCE] BLOCKED: No claude-flow MCP calls yet (strict mode).\n[ENFORCE] Run mcp__claude-flow__hooks_pre-task first.'
    };
  } else if (mode === 'gate' && e.editsSinceLastMcp >= 3 && e.mcpCalls === 0) {
    e.blockedEdits++;
    result = {
      allow: false,
      reason: '[ENFORCE] BLOCKED: ' + e.editsSinceLastMcp + '+ edits with no claude-flow MCP calls.\n[ENFORCE] Run mcp__claude-flow__hooks_pre-task first.'
    };
  } else if (mode === 'warn' && e.editsSinceLastMcp >= 5 && e.mcpCalls === 0) {
    e.driftWarnings++;
    result = {
      allow: true,
      reason: '[ENFORCE] DRIFT: ' + e.edits + ' edits with 0 claude-flow MCP calls this session.\n[ENFORCE] Call hooks_pre-task or memory_store to stay on workflow.'
    };
  }

  saveState(s.session);
  return result;
}

/**
 * Check whether a git commit should be allowed.
 * Returns { allow: boolean, reason: string }
 */
function checkCommit() {
  var s = getState();
  if (!s) return { allow: true, reason: 'no session' };
  var e = s.enforcement;
  var mode = getMode();

  if (mode === 'off' || mode === 'warn') {
    return { allow: true, reason: '' };
  }

  if (mode === 'strict' && e.mcpCalls < 2) {
    return {
      allow: false,
      reason: '[ENFORCE] BLOCKED: Commit requires >=2 MCP calls in strict mode (have ' + e.mcpCalls + ').\n[ENFORCE] Use hooks_pre-task and memory_store before committing.'
    };
  }

  if (mode === 'gate' && e.mcpCalls === 0) {
    return {
      allow: false,
      reason: '[ENFORCE] BLOCKED: Commit requires >=1 MCP call in gate mode.\n[ENFORCE] Use hooks_pre-task before committing.'
    };
  }

  return { allow: true, reason: '' };
}

/**
 * Check for workflow drift. Returns warning string or null.
 */
function checkDrift() {
  var s = getState();
  if (!s) return null;
  var e = s.enforcement;
  var mode = getMode();
  if (mode === 'off') return null;

  if (e.edits > 0 && e.mcpCalls === 0 && e.edits >= 3) {
    e.driftWarnings++;
    saveState(s.session);
    return '[ENFORCE] DRIFT: ' + e.edits + ' edits with 0 claude-flow MCP calls this session.\n[ENFORCE] Call hooks_pre-task or memory_store to stay on workflow.';
  }

  if (e.editsSinceLastMcp >= 5) {
    e.driftWarnings++;
    saveState(s.session);
    return '[ENFORCE] DRIFT: ' + e.editsSinceLastMcp + ' edits since last MCP call.\n[ENFORCE] Consider calling hooks_post-task or memory_store.';
  }

  return null;
}

/**
 * Compute and print compliance score at session end.
 */
function auditSession() {
  var s = getState();
  if (!s) {
    console.log('[ENFORCE] No session data for audit.');
    return null;
  }
  var e = s.enforcement;
  var score = 100;

  if (e.mcpCalls === 0 && e.edits > 0) score -= 40;
  else if (e.mcpCalls < 3 && e.edits > 0) score -= 20;

  score -= e.driftWarnings * 5;
  score -= e.blockedEdits * 3;

  if (e.editsBeforeFirstMcp > 10) score -= 20;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  var tools = e.mcpToolsSeen.length > 0 ? e.mcpToolsSeen.join(', ') : 'none';
  console.log('[ENFORCE] Session Compliance: ' + score + '/100');
  console.log('[ENFORCE] MCP calls: ' + e.mcpCalls + ' | Tools: ' + tools + ' | Edits: ' + e.edits + ' | Drift warnings: ' + e.driftWarnings);

  return { score: score, state: e };
}

module.exports = {
  recordMcpCall: recordMcpCall,
  checkEdit: checkEdit,
  checkCommit: checkCommit,
  checkDrift: checkDrift,
  auditSession: auditSession,
  getMode: getMode
};
