---
status: keep
phase: complete
type: reference
version: 1.0
last-updated: 2025-11-12
title: Document Classification Guide
---

# Document Classification Guide

**Standard for organizing project documentation with YAML frontmatter**

---

## Overview

This project uses **YAML frontmatter** (a widely-adopted standard) to classify and manage documentation. This allows:

- ✅ Programmatic filtering and organization
- ✅ Easy identification of document purpose
- ✅ Automated cleanup of temporary files
- ✅ Version tracking and lifecycle management
- ✅ Compatible with GitHub, static site generators, and markdown editors

---

## YAML Frontmatter Format

**Every markdown document should start with**:

```yaml
---
status: keep | working | temp | archive
phase: planning | development | complete | deprecated
type: spec | design | report | reference | guide | analysis
version: X.Y
last-updated: YYYY-MM-DD
title: Document Title
author: [optional] Name or Team
tags: [optional] [keyword1, keyword2]
---
```

**Example**:

```yaml
---
status: keep
phase: complete
type: spec
version: 2.1
last-updated: 2025-11-12
title: Combat System Technical Specification
author: SPARC Development Swarm
tags: [combat, core-mechanics, warlords]
---
# Combat System Technical Specification

Document content starts here...
```

---

## Classification Fields

### 1. Status (REQUIRED)

Determines document lifecycle and retention policy.

**`keep`**: Permanent documentation

- Core specifications
- Architecture documentation
- User guides
- API references
- Important design decisions

**Examples**:

- `GAMEPLAY-SPEC.md` → status: keep
- `API-DOCUMENTATION.md` → status: keep
- `ARCHITECTURE.md` → status: keep

**`working`**: Active development documents

- In-progress specs
- Current iteration planning
- Active investigation reports
- Draft documentation

**Examples**:

- `FEATURE-X-DESIGN.md` → status: working (becomes 'keep' when finalized)
- `CURRENT-SPRINT-PLAN.md` → status: working

**`temp`**: Temporary files (auto-delete after phase)

- Debug logs
- Experimental code
- Quick investigation notes
- Throwaway prototypes

**Examples**:

- `debug/temp-investigation.md` → status: temp
- `scratch/prototype-notes.md` → status: temp

**Retention**: Delete after current development phase

**`archive`**: Historical reference (move to /archive)

- Superseded specifications
- Old design docs
- Completed investigation reports
- Previous iteration plans

**Examples**:

- `OLD-COMBAT-SPEC-V1.md` → status: archive
- `2024-11-01-INVESTIGATION.md` → status: archive

**Retention**: Keep for historical reference, move to archive folder

---

### 2. Phase (REQUIRED)

Indicates document's development stage.

**`planning`**: Requirements and specifications

- Feature specifications
- Technical design docs
- Requirements analysis

**`development`**: Active implementation

- In-progress documentation
- Implementation notes
- Developer guides

**`complete`**: Finished and finalized

- Completed specifications
- Final documentation
- Stable API docs

**`deprecated`**: No longer relevant

- Superseded by newer docs
- Obsolete features
- Retired systems

---

### 3. Type (REQUIRED)

Document category/purpose.

**`spec`**: Formal specification

- Technical specifications
- Feature requirements
- System design docs

**`design`**: Design documentation

- Architecture diagrams
- UX/UI designs
- Database schemas

**`report`**: Analysis or investigation

- Performance reports
- Bug analysis
- Research findings

**`reference`**: Reference material

- API documentation
- Lookup tables
- Constant definitions

**`guide`**: How-to documentation

- User guides
- Developer guides
- Tutorials

**`analysis`**: Deep-dive analysis

- Code quality reports
- Performance analysis
- Security audits

---

### 4. Version (RECOMMENDED)

Semantic versioning for document tracking.

**Format**: `X.Y` or `X.Y.Z`

- X = Major changes (incompatible updates)
- Y = Minor changes (additions, clarifications)
- Z = Patches (typos, formatting)

**Example**:

```yaml
version: 2.1
```

---

### 5. Last-Updated (REQUIRED)

ISO date format: `YYYY-MM-DD`

**Example**:

```yaml
last-updated: 2025-11-12
```

---

### 6. Title (RECOMMENDED)

Human-readable document title.

**Example**:

```yaml
title: Live Terminal Game - Technical Specification
```

---

### 7. Author (OPTIONAL)

Creator or team responsible.

**Examples**:

```yaml
author: SPARC Development Swarm
author: Combat System Team
author: Claude Code + Human Developer
```

---

### 8. Tags (OPTIONAL)

Keywords for searching and filtering.

**Example**:

```yaml
tags: [combat, gameplay, warlords, simulation]
```

---

## File Organization

### Directory Structure

```
/docs
├── specs/              # status: keep, type: spec
│   ├── GAMEPLAY-SPEC.md
│   ├── COMBAT-SPEC.md
│   └── MAP-SCENARIOS-SPEC.md
│
├── guides/             # status: keep, type: guide
│   ├── DEVELOPER-GUIDE.md
│   └── USER-GUIDE.md
│
├── reports/            # status: working/archive, type: report
│   ├── CODE-QUALITY-REPORT.md
│   └── PERFORMANCE-ANALYSIS.md
│
├── design/             # status: keep/working, type: design
│   ├── ARCHITECTURE.md
│   └── DATABASE-SCHEMA.md
│
├── archive/            # status: archive
│   ├── 2024-11-01/
│   └── deprecated/
│
└── working/            # status: working/temp
    ├── current-sprint.md
    └── investigation-notes.md
```

### Naming Conventions

**Permanent Docs** (status: keep):

- ALL-CAPS for visibility
- Descriptive names
- No dates

**Examples**:

- `GAMEPLAY-SPEC.md`
- `COMBAT-SYSTEM.md`
- `API-REFERENCE.md`

**Temporary/Working Docs** (status: temp/working):

- lowercase or kebab-case
- Include dates if time-sensitive
- Prefix with category

**Examples**:

- `debug/test-results-2025-11-12.md`
- `working/feature-x-design.md`
- `temp/investigation-notes.md`

**Archive Docs** (status: archive):

- Organize by date or version
- Preserve original names
- Add context in folders

**Examples**:

- `archive/2024-11-01/OLD-COMBAT-SPEC.md`
- `archive/v1.0/DEPRECATED-API.md`

---

## Automated Cleanup Scripts

### Find Temp Files (for deletion)

```bash
# Find all temp status docs
grep -l "^status: temp$" **/*.md

# Delete temp files older than 7 days
find . -name "*.md" -mtime +7 -exec grep -l "^status: temp$" {} \; | xargs rm
```

### Find Working Files (for review)

```bash
# Find working status docs
grep -l "^status: working$" **/*.md

# List working docs older than 30 days (may need archiving)
find . -name "*.md" -mtime +30 -exec grep -l "^status: working$" {} \;
```

### Archive Old Docs

```bash
# Find archive status docs not in archive folder
grep -l "^status: archive$" **/*.md | grep -v "^archive/"

# Move to archive
mkdir -p archive/$(date +%Y-%m-%d)
grep -l "^status: archive$" **/*.md | grep -v "^archive/" | xargs -I {} mv {} archive/$(date +%Y-%m-%d)/
```

---

## Git Hooks (Optional)

### Pre-Commit Hook: Validate Frontmatter

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check all staged .md files have valid frontmatter
for file in $(git diff --cached --name-only | grep '\.md$'); do
  if ! grep -q "^---$" "$file"; then
    echo "ERROR: $file missing YAML frontmatter"
    exit 1
  fi

  if ! grep -q "^status:" "$file"; then
    echo "ERROR: $file missing 'status' field"
    exit 1
  fi
done
```

---

## Example Documents

### Example 1: Permanent Specification

```yaml
---
status: keep
phase: complete
type: spec
version: 2.0
last-updated: 2025-11-12
title: Combat System Specification
author: Combat Team
tags: [combat, core-mechanics, warlords]
---
# Combat System Specification

This document defines...
```

### Example 2: Working Design Doc

```yaml
---
status: working
phase: development
type: design
version: 0.5
last-updated: 2025-11-12
title: New Map Generator Design
author: Map Team
tags: [map-generation, terrain]
---

# New Map Generator Design

**Note**: This is a draft. Will be finalized by 2025-11-20.

## Proposed Approach
...
```

### Example 3: Temporary Debug Log

```yaml
---
status: temp
phase: development
type: report
version: 1.0
last-updated: 2025-11-12
title: Combat Bug Investigation - Nov 12
author: Debug Session
tags: [bug, combat, debug]
---

# Combat Bug Investigation

**Delete after fix merged**

## Symptoms
...
```

### Example 4: Archived Old Spec

```yaml
---
status: archive
phase: deprecated
type: spec
version: 1.0
last-updated: 2024-10-01
title: Combat System Specification (Old)
author: Original Team
tags: [combat, deprecated, v1]
---

# Combat System Specification (Version 1)

**DEPRECATED**: See COMBAT-SPEC.md v2.0

This document has been superseded by...
```

---

## Best Practices

### DO ✅

- Add frontmatter to every markdown file
- Update `last-updated` when editing
- Bump `version` on significant changes
- Move completed working docs to keep status
- Archive superseded docs instead of deleting
- Use descriptive titles
- Add relevant tags

### DON'T ❌

- Leave docs without frontmatter
- Keep temp files indefinitely
- Delete archive-worthy docs
- Use vague status/type combinations
- Forget to update dates
- Mix working and keep status inappropriately

---

## Migration Guide

### Adding Frontmatter to Existing Docs

**Step 1**: Identify document purpose

- Is it permanent or temporary?
- What phase is it in?
- What type of document?

**Step 2**: Add frontmatter

```yaml
---
status: keep
phase: complete
type: spec
version: 1.0
last-updated: 2025-11-12
title: [Document Title]
---
```

**Step 3**: Move to appropriate directory

**Step 4**: Update any references

---

## Quick Reference

| Status    | Retention     | Location         | Example           |
| --------- | ------------- | ---------------- | ----------------- |
| `keep`    | Permanent     | `/docs/specs/`   | GAMEPLAY-SPEC.md  |
| `working` | Current phase | `/docs/working/` | feature-design.md |
| `temp`    | Delete after  | `/debug/`        | test-results.md   |
| `archive` | Historical    | `/docs/archive/` | OLD-SPEC-V1.md    |

| Phase         | Meaning            |
| ------------- | ------------------ |
| `planning`    | Requirements stage |
| `development` | Active coding      |
| `complete`    | Finished           |
| `deprecated`  | Obsolete           |

| Type        | Purpose              |
| ----------- | -------------------- |
| `spec`      | Formal specification |
| `design`    | Architecture/design  |
| `report`    | Analysis findings    |
| `reference` | Lookup documentation |
| `guide`     | How-to tutorial      |
| `analysis`  | Deep investigation   |

---

## Tools & Integrations

### Compatible With

- ✅ GitHub (renders frontmatter)
- ✅ Jekyll, Hugo, Gatsby (static sites)
- ✅ Obsidian (note-taking app)
- ✅ MkDocs (documentation generator)
- ✅ VSCode (with extensions)
- ✅ `grep`, `awk`, `sed` (for scripting)

### Recommended VSCode Extensions

- **Front Matter CMS**: GUI for editing frontmatter
- **YAML**: Syntax highlighting
- **Markdown All in One**: Enhanced markdown support

---

## FAQ

**Q: What if I'm not sure about status?**
A: Start with `working`, promote to `keep` when finalized.

**Q: Can I have multiple statuses?**
A: No, pick the most appropriate one.

**Q: Do I need frontmatter for code files?**
A: No, only markdown documentation files.

**Q: What about README files?**
A: Yes, add frontmatter to maintain consistency.

**Q: How do I handle docs that are both keep and archive?**
A: If superseded but historically important, use `archive`. If still current, use `keep`.

---

**End of Document Classification Guide**