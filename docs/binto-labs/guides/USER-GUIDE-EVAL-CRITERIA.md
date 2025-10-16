# User Guide Evaluation Criteria

**Version:** 1.0.0 | **Date:** 2025-10-16
**Purpose:** Objective scoring system for evaluating user guide quality and accessibility

---

## Evaluation Philosophy

A great user guide is **accessible**, **actionable**, and **accelerates learning**. It should:
- Enable beginners to succeed quickly (5-10 minutes to first win)
- Provide depth for advanced users without overwhelming novices
- Use real-world scenarios, not academic examples
- Make copy-paste work out of the box
- Anticipate questions and pain points

---

## Scoring System (0-100 points)

### Category 1: Structure & Navigation (20 points)

**1.1 Table of Contents (5 points)**
- [ ] Comprehensive TOC with all sections (2 pts)
- [ ] Time estimates for examples (1 pt)
- [ ] Difficulty indicators (basic/intermediate/advanced) (1 pt)
- [ ] Direct links to sections (1 pt)

**1.2 Progressive Complexity (5 points)**
- [ ] Quick Start section (≤5 min examples) (2 pts)
- [ ] Clear progression: basic → intermediate → advanced (2 pts)
- [ ] Visual indicators of complexity level (1 pt)

**1.3 Search & Discovery (5 points)**
- [ ] Clear section headings (2 pts)
- [ ] Tags/labels for filtering examples (2 pts)
- [ ] Cross-references between related sections (1 pt)

**1.4 Visual Scanning (5 points)**
- [ ] Emoji or icons for quick scanning (1 pt)
- [ ] Consistent formatting across examples (2 pts)
- [ ] Code blocks properly highlighted (1 pt)
- [ ] Clear visual hierarchy (1 pt)

---

### Category 2: Example Quality (30 points)

**2.1 Completeness (10 points)**
- [ ] Every example has: Scenario, Goal, Command (3 pts)
- [ ] Expected output shown (2 pts)
- [ ] "How it works" explanation (2 pts)
- [ ] "Verify it worked" steps (2 pts)
- [ ] Prerequisites listed (1 pt)

**2.2 Real-World Relevance (10 points)**
- [ ] Scenarios based on actual use cases (3 pts)
- [ ] Production-ready code, not toy examples (3 pts)
- [ ] Addresses common pain points (2 pts)
- [ ] Time estimates are realistic (2 pts)

**2.3 Code Quality (10 points)**
- [ ] Copy-paste ready (no placeholders) (3 pts)
- [ ] Includes error handling (2 pts)
- [ ] Shows before/after comparisons (2 pts)
- [ ] Code is properly formatted (1 pt)
- [ ] Includes inline comments where helpful (2 pts)

---

### Category 3: Actionability (25 points)

**3.1 Immediate Wins (10 points)**
- [ ] Quick Start section gets user to success in 5 min (5 pts)
- [ ] First 3 examples are simple and confidence-building (3 pts)
- [ ] Clear success criteria for each example (2 pts)

**3.2 Customization Guidance (8 points)**
- [ ] "Customize it" variations provided (3 pts)
- [ ] Common modifications shown (2 pts)
- [ ] Parameter explanations (2 pts)
- [ ] Trade-off discussions (1 pt)

**3.3 Troubleshooting (7 points)**
- [ ] Dedicated troubleshooting section (2 pts)
- [ ] Common errors documented (2 pts)
- [ ] Verification commands provided (2 pts)
- [ ] "Related" links to deeper resources (1 pt)

---

### Category 4: Learning Path (15 points)

**4.1 Conceptual Progression (5 points)**
- [ ] Builds from simple to complex naturally (2 pts)
- [ ] Introduces concepts incrementally (2 pts)
- [ ] Revisits concepts with increasing depth (1 pt)

**4.2 Cross-References (5 points)**
- [ ] Links to related examples (2 pts)
- [ ] Links to technical deep-dives (2 pts)
- [ ] Links to troubleshooting for specific issues (1 pt)

**4.3 Multiple Learning Styles (5 points)**
- [ ] Visual learners: diagrams/screenshots (2 pts)
- [ ] Hands-on learners: copy-paste examples (2 pts)
- [ ] Conceptual learners: "How it works" explanations (1 pt)

---

### Category 5: Accessibility (10 points)

**5.1 Readability (5 points)**
- [ ] Conversational tone (not robotic) (2 pts)
- [ ] Short paragraphs (≤4 sentences) (1 pt)
- [ ] Avoids unnecessary jargon (1 pt)
- [ ] Uses active voice (1 pt)

**5.2 Inclusivity (5 points)**
- [ ] Assumes no prior expert knowledge (2 pts)
- [ ] Defines technical terms on first use (1 pt)
- [ ] Provides context for decisions (1 pt)
- [ ] Encourages experimentation (1 pt)

---

## Scoring Interpretation

**90-100 points: Exceptional** ⭐⭐⭐⭐⭐
- User guide is a reference-quality resource
- Accessible to beginners, valuable to experts
- Minimal friction from reading to doing

**80-89 points: Excellent** ⭐⭐⭐⭐
- Strong user guide with minor gaps
- Most users will succeed quickly
- Few improvements needed

**70-79 points: Good** ⭐⭐⭐
- Functional guide with some accessibility issues
- Intermediate users will succeed
- Beginners may struggle in places

**60-69 points: Adequate** ⭐⭐
- Covers basics but lacks polish
- Experienced users can extract value
- Beginners will need supplemental resources

**Below 60: Needs Improvement** ⭐
- Significant gaps in coverage or accessibility
- Users will struggle to succeed
- Major revision recommended

---

## Automated Evaluation Metrics

In addition to manual scoring, track these quantitative metrics:

### Content Metrics
- **Example Count**: Total number of working examples
- **Code Block Count**: Number of copy-paste code snippets
- **Cross-Reference Density**: Links per 1000 words
- **Time-to-First-Win**: Estimated time from "Quick Start" to first success

### Structure Metrics
- **TOC Depth**: Number of heading levels
- **Section Count**: Total sections/subsections
- **Word Count**: Total words (target: 10,000-20,000 for comprehensive guide)
- **Code-to-Text Ratio**: Balance of explanation vs. examples

### Accessibility Metrics
- **Readability Score**: Flesch Reading Ease (target: 60-70)
- **Average Paragraph Length**: Sentences per paragraph (target: ≤4)
- **Jargon Density**: Technical terms per 100 words (target: ≤5)
- **Visual Element Count**: Diagrams, screenshots, emoji (more is better)

---

## Evaluation Checklist Template

Use this checklist when evaluating a user guide:

```markdown
# User Guide Evaluation: [GUIDE NAME]

**Evaluator:** [Your Name]
**Date:** [YYYY-MM-DD]
**Version Evaluated:** [Version Number]

## Quick Assessment

- [ ] Can a beginner succeed in ≤10 minutes?
- [ ] Are all code examples copy-paste ready?
- [ ] Is there a clear learning progression?
- [ ] Are common errors addressed?
- [ ] Would I recommend this to a colleague?

## Detailed Scoring

### Structure & Navigation (/20)
- Table of Contents: __/5
- Progressive Complexity: __/5
- Search & Discovery: __/5
- Visual Scanning: __/5
**Total: __/20**

### Example Quality (/30)
- Completeness: __/10
- Real-World Relevance: __/10
- Code Quality: __/10
**Total: __/30**

### Actionability (/25)
- Immediate Wins: __/10
- Customization Guidance: __/8
- Troubleshooting: __/7
**Total: __/25**

### Learning Path (/15)
- Conceptual Progression: __/5
- Cross-References: __/5
- Multiple Learning Styles: __/5
**Total: __/15**

### Accessibility (/10)
- Readability: __/5
- Inclusivity: __/5
**Total: __/10**

## Overall Score: __/100

**Rating:** [Exceptional/Excellent/Good/Adequate/Needs Improvement]

## Strengths
1. [Key strength]
2. [Key strength]
3. [Key strength]

## Areas for Improvement
1. [Improvement needed]
2. [Improvement needed]
3. [Improvement needed]

## Recommendations
- **High Priority:** [Critical improvement]
- **Medium Priority:** [Nice-to-have improvement]
- **Low Priority:** [Polish item]
```

---

## Example: Evaluating "claude-flow-user-guide-2025-10-14.md"

**Expected Score: 92-96/100** (Exceptional)

**Strengths:**
- ✅ Outstanding example structure (Scenario/Goal/Command/Output)
- ✅ Copy-paste ready code throughout
- ✅ Excellent progressive complexity (5-min → 60-min)
- ✅ Strong cross-referencing
- ✅ Before/after code comparisons

**Minor Gaps:**
- ⚠️ Could use more visual diagrams (architecture examples)
- ⚠️ Some advanced examples could benefit from video walkthroughs
- ⚠️ Troubleshooting section referenced but not fully detailed

---

## Using This Evaluation System

### For Documentation Authors:
1. Use checklist during writing to ensure all criteria met
2. Aim for 85+ score before publishing
3. Iterate based on user feedback

### For Documentation Reviewers:
1. Score guide objectively using criteria
2. Provide specific, actionable feedback
3. Track scores over time to measure improvement

### For Documentation Consumers:
1. Use scoring to assess guide quality before deep-diving
2. Provide feedback on gaps you encounter
3. Contribute improvements via pull requests

---

## Continuous Improvement

Track these metrics over time:
- **User Success Rate**: % who complete first example successfully
- **Time-to-First-Win**: Average time from reading to first success
- **Return Rate**: % who return to guide for second/third use
- **Community Contributions**: Pull requests improving guide
- **Support Ticket Reduction**: Fewer questions about topics covered in guide

---

**Version History:**
- v1.0.0 (2025-10-16): Initial evaluation criteria based on claude-flow-user-guide-2025-10-14.md analysis
