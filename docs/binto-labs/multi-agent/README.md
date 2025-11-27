---
status: keep
phase: complete
type: guide
version: 1.0
last-updated: 2025-11-27
title: Multi-Agent Documentation - README
author: Claude Code + Human Developer
tags: [readme, setup, portability, multi-agent]
---

# Multi-Agent Documentation

**Self-contained folder for multi-agent swarm coordination methodology.**

## 📋 What's In This Folder

| Document | Purpose |
|----------|---------|
| **workflow.md** | Decision driver - "What do I do now?" |
| **claude-flow-guide.md** | Reference manual - "How does X work?" |
| **swarm-templates.md** | Agent templates for regular swarms (3-6 agents) |
| **hive-mind-templates.md** | Templates for Queen-coordinated hive-minds (7+ agents) |
| **document-classification-guide.md** | YAML frontmatter standards for documentation |

## 🚀 Using In Your Project

### Option 1: Copy Entire Folder

```bash
# Copy to your project
cp -r multi-agent/ /path/to/your-project/docs/multi-agent/
```

### Option 2: Reference from CLAUDE.md

Add to your project's `CLAUDE.md`:

```markdown
## Multi-Agent Coordination

For complex tasks requiring 3+ agents, use the multi-agent methodology:

- **Start here:** ./docs/multi-agent/workflow.md
- **Regular swarms:** ./docs/multi-agent/swarm-templates.md
- **Complex projects:** ./docs/multi-agent/hive-mind-templates.md
- **Reference:** ./docs/multi-agent/claude-flow-guide.md
```

## ⚙️ Prerequisites

This methodology requires:

1. **Claude Code** installed globally
2. **claude-flow** package (alpha channel)

```bash
npm install -g @anthropic-ai/claude-code
npm install -g claude-flow@alpha
npx claude-flow@alpha init --force
```

## 📝 Customization

### Project-Specific Scripts

The templates reference validation scripts like `../../scripts/validate.sh`. Update these paths for your project structure:

- `validate.sh` - Full CI validation (TypeScript, tests, lint)
- `test.sh` - Scoped testing with options

### Quality Gates

Default quality gates in templates:
- TypeScript: 0 errors
- Tests: 100% passing
- ESLint: 0 errors
- Coverage: 90%+ (optional)

Adjust these in the templates for your project requirements.

### Document Classification

All markdown files should use YAML frontmatter per `document-classification-guide.md`. This enables:
- Automated cleanup of temp files
- Document lifecycle tracking
- Programmatic filtering

## 🔄 Workflow Overview

```
1. Pre-Work     → workflow.md decision trees
2. Form Swarm   → swarm-templates.md or hive-mind-templates.md
3. Execute      → Agents coordinate via memory
4. Triage       → workflow.md post-swarm section
5. Cleanup      → Fixer agent templates
6. Validate     → Pattern capture
7. Commit       → With classification
8. Improve      → Weekly/monthly review
```

## 📚 Document Relationships

```
workflow.md (start here)
    ↓
    ├── swarm-templates.md (regular swarms)
    │       ↓
    │   claude-flow-guide.md (reference)
    │
    └── hive-mind-templates.md (complex projects)
            ↓
        claude-flow-guide.md (reference)

All docs → document-classification-guide.md (standards)
```

## 🆘 Troubleshooting

See `claude-flow-guide.md` Troubleshooting section for:
- Agents not coordinating
- Memory queries returning empty
- Hooks not running

---

**Version**: 1.0.0 | **Portable**: Yes - copy entire folder to any project
