# User Guide Evaluation Tool

Automated evaluation system for user guides based on accessibility, actionability, and learning effectiveness.

## Quick Start

```bash
# Evaluate a user guide
npx tsx scripts/eval-user-guide.ts docs/binto-labs/guides/claude-flow-user-guide-2025-10-14.md

# Using npm script
npm run eval-guide docs/binto-labs/guides/your-guide.md
```

## What It Evaluates

The tool scores guides on **5 categories** (100 points total):

### 1. Structure & Navigation (20 points)
- Table of contents with time estimates
- Progressive complexity (Quick Start → Advanced)
- Visual scanning aids (emoji, tags)
- Cross-references and links

### 2. Example Quality (30 points)
- Complete examples (Scenario, Goal, Command, Output)
- Real-world scenarios (not toy examples)
- Production-ready code with error handling
- Before/after comparisons

### 3. Actionability (25 points)
- Quick wins (5-minute success)
- Customization guidance
- Verification steps
- Troubleshooting section

### 4. Learning Path (15 points)
- Natural concept progression
- Cross-references to related content
- Multiple learning styles (visual, hands-on, conceptual)

### 5. Accessibility (10 points)
- Conversational tone
- Short paragraphs (≤4 sentences)
- Beginner-friendly
- Encourages experimentation

## Scoring Interpretation

- **90-100**: ⭐⭐⭐⭐⭐ **Exceptional** - Reference-quality resource
- **80-89**: ⭐⭐⭐⭐ **Excellent** - Strong guide, minor improvements needed
- **70-79**: ⭐⭐⭐ **Good** - Functional but could be more accessible
- **60-69**: ⭐⭐ **Adequate** - Covers basics, needs polish
- **Below 60**: ⭐ **Needs Improvement** - Major revision recommended

## Output

The tool generates:

1. **Console Report**: Immediate feedback with scores and suggestions
2. **Markdown Report**: Saved as `[guide-name]-EVAL-REPORT.md`

### Example Report

```markdown
# User Guide Evaluation Report

**Guide:** claude-flow-user-guide-2025-10-14.md
**Date:** 2025-10-16

## Overall Score
**92/100** (92.0%)
**Rating:** ⭐⭐⭐⭐⭐ Exceptional

## Content Metrics
- Word Count: 9,212
- Examples: 20
- Code Blocks: 124
- Cross-References: 53
- Time to First Win: 1 minute

## Category Scores
### Structure & Navigation: 20/20 (100%)
✅ Perfect structure with TOC, time estimates, and visual aids

### Example Quality: 27/30 (90%)
✅ Complete examples with real-world scenarios
⚠️ Suggestion: Remove placeholder text from code

### Actionability: 25/25 (100%)
✅ Excellent quick start and customization guidance

### Learning Path: 13/15 (87%)
✅ Strong progression and cross-references
⚠️ Suggestion: Add architecture diagrams

### Accessibility: 7/10 (70%)
✅ Short paragraphs, beginner-friendly
⚠️ Suggestion: Use more conversational language

## Key Strengths
1. Comprehensive coverage (20 examples)
2. Rich code examples (124 blocks)
3. Excellent cross-referencing (53 links)
4. Quick wins (1-minute first success)

## Priority Improvements
1. Add architecture diagrams for complex examples
2. Use more conversational language (Let's, Here's how)
```

## Metrics Tracked

### Content Metrics
- **Word Count**: Total words in guide
- **Example Count**: Number of working examples
- **Code Block Count**: Copy-paste code snippets
- **Cross-Reference Count**: Internal links
- **Time to First Win**: Minutes from start to first success

### Quality Indicators
- **Readability**: Average paragraph length (target: ≤4 sentences)
- **Completeness**: Examples with all required sections
- **Real-World**: Production scenarios vs. toy examples
- **Actionability**: Quick Start section + verification steps

## Integration with CI/CD

Add to GitHub Actions workflow:

```yaml
- name: Evaluate User Guide
  run: |
    npx tsx scripts/eval-user-guide.ts docs/user-guide.md
    if [ $? -ne 0 ]; then
      echo "User guide quality below threshold (70%)"
      exit 1
    fi
```

## Evaluation Criteria

Full criteria documented in:
- [USER-GUIDE-EVAL-CRITERIA.md](../docs/binto-labs/guides/USER-GUIDE-EVAL-CRITERIA.md)

## Use Cases

### For Documentation Authors
✅ Check quality before publishing (aim for 85+)
✅ Identify gaps in coverage
✅ Track improvement over time

### For Reviewers
✅ Objective scoring for pull requests
✅ Specific, actionable feedback
✅ Compare guides consistently

### For Users
✅ Assess guide quality before investing time
✅ Find best resources quickly
✅ Contribute improvements

## Example: Improving a Guide from 72 → 92

**Initial Score: 72/100** ⭐⭐⭐ Good
- Missing Quick Start section
- No time estimates
- Incomplete examples (no verification steps)
- No cross-references

**Actions Taken:**
1. ✅ Added Quick Start (5 min to success)
2. ✅ Added time estimates to all examples
3. ✅ Added "Verify it worked" sections
4. ✅ Added 30+ cross-references
5. ✅ Split into progressive parts

**Final Score: 92/100** ⭐⭐⭐⭐⭐ Exceptional

## Tips for High Scores

### Structure (20 pts)
- ✅ Start with comprehensive TOC
- ✅ Add time estimates: `[10-min]`
- ✅ Add difficulty tags: `[basic]`, `[advanced]`
- ✅ Use emoji for visual scanning 🚀⚡🔒

### Examples (30 pts)
- ✅ Use template: **Scenario** → **Goal** → **Command** → **Output**
- ✅ Show expected output
- ✅ Explain "How it works"
- ✅ Add "Verify it worked" steps
- ✅ Use real-world scenarios
- ✅ Include before/after code

### Actionability (25 pts)
- ✅ Quick Start section (≤5 min examples)
- ✅ "Customize it" variations
- ✅ Troubleshooting section
- ✅ Cross-references to related topics

### Learning Path (15 pts)
- ✅ Progress from simple → complex
- ✅ Cross-reference related examples
- ✅ Link to deep-dives for advanced users

### Accessibility (10 pts)
- ✅ Conversational tone (Let's, Here's how)
- ✅ Short paragraphs (≤4 sentences)
- ✅ Define jargon on first use
- ✅ Encourage experimentation

## Comparison with Traditional Docs

| Traditional Documentation | This Evaluation System |
|--------------------------|------------------------|
| ❌ Academic tone | ✅ Conversational, accessible |
| ❌ Theory-heavy | ✅ Copy-paste examples first |
| ❌ Linear only | ✅ Multiple learning paths |
| ❌ No time estimates | ✅ Clear time expectations |
| ❌ No validation | ✅ "Verify it worked" steps |
| ❌ Toy examples | ✅ Real-world scenarios |

## Development

### Run Tests
```bash
# Evaluate multiple guides
npm run eval-guide docs/binto-labs/guides/*.md

# Compare scores
find docs -name "*-EVAL-REPORT.md" -exec grep "Overall Score" {} \;
```

### Customize Scoring
Edit `scripts/eval-user-guide.ts`:
- Adjust category weights
- Add new evaluation criteria
- Modify rating thresholds

### Extend Metrics
Add new metrics to `calculateMetrics()`:
- Readability scores (Flesch Reading Ease)
- Complexity analysis
- Sentiment analysis
- Video/screenshot count

## Future Enhancements

- [ ] Automated readability scoring (Flesch-Kincaid)
- [ ] Screenshot detection and counting
- [ ] Link validation (broken links)
- [ ] Code example syntax validation
- [ ] Comparative analysis (guide vs. guide)
- [ ] Historical tracking (scores over time)
- [ ] AI-powered suggestions (GPT-4)

## Reference

**Based on analysis of:**
- `claude-flow-user-guide-2025-10-14.md` (Score: 92/100)
- Best practices from technical writing research
- User feedback and success metrics

**Evaluation criteria:**
- [USER-GUIDE-EVAL-CRITERIA.md](../docs/binto-labs/guides/USER-GUIDE-EVAL-CRITERIA.md)

---

**Version:** 1.0.0
**Last Updated:** 2025-10-16
