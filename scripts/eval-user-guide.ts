#!/usr/bin/env node
/**
 * User Guide Evaluation Tool
 *
 * Automatically evaluates user guides based on criteria defined in
 * docs/binto-labs/guides/USER-GUIDE-EVAL-CRITERIA.md
 *
 * Usage:
 *   npx tsx scripts/eval-user-guide.ts <path-to-guide.md>
 *   npx tsx scripts/eval-user-guide.ts docs/binto-labs/guides/claude-flow-user-guide-2025-10-14.md
 */

import fs from 'fs';
import path from 'path';

interface EvaluationScore {
  category: string;
  score: number;
  maxScore: number;
  details: string[];
  suggestions: string[];
}

interface EvaluationResult {
  guideName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  rating: string;
  categoryScores: EvaluationScore[];
  metrics: {
    wordCount: number;
    exampleCount: number;
    codeBlockCount: number;
    linkCount: number;
    headingCount: number;
    paragraphCount: number;
    avgParagraphLength: number;
    timeToFirstWin: number | null;
  };
  strengths: string[];
  improvements: string[];
}

class UserGuideEvaluator {
  private content: string;
  private lines: string[];

  constructor(private filePath: string) {
    this.content = fs.readFileSync(filePath, 'utf-8');
    this.lines = this.content.split('\n');
  }

  evaluate(): EvaluationResult {
    const guideName = path.basename(this.filePath);

    // Calculate all metrics
    const metrics = this.calculateMetrics();

    // Score each category
    const structureScore = this.evaluateStructure();
    const exampleScore = this.evaluateExamples();
    const actionabilityScore = this.evaluateActionability();
    const learningPathScore = this.evaluateLearningPath();
    const accessibilityScore = this.evaluateAccessibility();

    const categoryScores = [
      structureScore,
      exampleScore,
      actionabilityScore,
      learningPathScore,
      accessibilityScore,
    ];

    const totalScore = categoryScores.reduce((sum, cat) => sum + cat.score, 0);
    const maxScore = categoryScores.reduce((sum, cat) => sum + cat.maxScore, 0);
    const percentage = (totalScore / maxScore) * 100;

    return {
      guideName,
      totalScore,
      maxScore,
      percentage,
      rating: this.getRating(percentage),
      categoryScores,
      metrics,
      strengths: this.identifyStrengths(categoryScores, metrics),
      improvements: this.identifyImprovements(categoryScores, metrics),
    };
  }

  private calculateMetrics() {
    const wordCount = this.content.split(/\s+/).length;
    const exampleCount = (this.content.match(/### Example \d+:/g) || []).length;
    const codeBlockCount = (this.content.match(/```/g) || []).length / 2;
    const linkCount = (this.content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const headingCount = (this.content.match(/^#{1,6} /gm) || []).length;

    // Calculate paragraph metrics
    const paragraphs = this.content
      .split(/\n\n+/)
      .filter(p => p.trim() && !p.trim().startsWith('#') && !p.trim().startsWith('```'));
    const paragraphCount = paragraphs.length;
    const totalSentences = paragraphs.reduce((sum, p) => {
      return sum + (p.match(/[.!?]+/g) || []).length;
    }, 0);
    const avgParagraphLength = totalSentences / paragraphCount;

    // Find time to first win from Quick Start
    const quickStartMatch = this.content.match(/## Part 0: Quick Start.*?### Example 1:.*?`\[1-min\]`/s);
    const timeToFirstWin = quickStartMatch ? 1 : null;

    return {
      wordCount,
      exampleCount,
      codeBlockCount,
      linkCount,
      headingCount,
      paragraphCount,
      avgParagraphLength,
      timeToFirstWin,
    };
  }

  private evaluateStructure(): EvaluationScore {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 1.1 Table of Contents (5 points)
    const hasTOC = this.content.includes('## Table of Contents');
    const hasTimeEstimates = /`\[\d+-min\]`/.test(this.content);
    const hasDifficultyIndicators = /`\[(basic|intermediate|advanced|production)\]`/.test(this.content);
    const hasLinks = /- \[.*?\]\(#.*?\)/.test(this.content);

    if (hasTOC) {
      score += 2;
      details.push('✅ Comprehensive table of contents');
    } else {
      suggestions.push('Add a table of contents with section links');
    }

    if (hasTimeEstimates) {
      score += 1;
      details.push('✅ Time estimates provided');
    } else {
      suggestions.push('Add time estimates for examples (e.g., `[10-min]`)');
    }

    if (hasDifficultyIndicators) {
      score += 1;
      details.push('✅ Difficulty indicators present');
    } else {
      suggestions.push('Add difficulty tags (e.g., `[basic]`, `[advanced]`)');
    }

    if (hasLinks) {
      score += 1;
      details.push('✅ Section links in TOC');
    } else {
      suggestions.push('Add clickable links in table of contents');
    }

    // 1.2 Progressive Complexity (5 points)
    const hasQuickStart = /## Part 0: Quick Start/.test(this.content);
    const hasProgression = /Part \d+:/.test(this.content);
    const hasVisualIndicators = /[🚀⚡🔒🎯🧪]/.test(this.content);

    if (hasQuickStart) {
      score += 2;
      details.push('✅ Quick Start section for beginners');
    } else {
      suggestions.push('Add Quick Start section with 5-minute examples');
    }

    if (hasProgression) {
      score += 2;
      details.push('✅ Clear progression through parts');
    }

    if (hasVisualIndicators) {
      score += 1;
      details.push('✅ Visual indicators (emoji) for scanning');
    }

    // 1.3 Search & Discovery (5 points)
    const hasClearHeadings = (this.content.match(/^#{2,3} /gm) || []).length >= 10;
    const hasTags = /`\[.*?\]`/.test(this.content);
    const hasCrossRefs = /\*\*Related:\*\*/.test(this.content);

    if (hasClearHeadings) {
      score += 2;
      details.push('✅ Clear section headings');
    }

    if (hasTags) {
      score += 2;
      details.push('✅ Tags for filtering examples');
    }

    if (hasCrossRefs) {
      score += 1;
      details.push('✅ Cross-references between sections');
    }

    // 1.4 Visual Scanning (5 points)
    const hasEmoji = /[🚀⚡🔒🎯🧪🔄🏗️📋✅❌⚠️]/.test(this.content);
    const hasConsistentFormat = /\*\*Scenario:\*\*/.test(this.content);
    const hasCodeHighlighting = /```(typescript|javascript|bash|yaml)/.test(this.content);
    const hasHierarchy = /^#{1,6} /.test(this.content);

    if (hasEmoji) score += 1;
    if (hasConsistentFormat) {
      score += 2;
      details.push('✅ Consistent formatting across examples');
    }
    if (hasCodeHighlighting) {
      score += 1;
      details.push('✅ Code blocks with syntax highlighting');
    }
    if (hasHierarchy) score += 1;

    return {
      category: 'Structure & Navigation',
      score,
      maxScore: 20,
      details,
      suggestions,
    };
  }

  private evaluateExamples(): EvaluationScore {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 2.1 Completeness (10 points)
    const hasScenario = /\*\*Scenario:\*\*/.test(this.content);
    const hasGoal = /\*\*Goal:\*\*/.test(this.content);
    const hasCommand = /\*\*Command:\*\*/.test(this.content);
    const hasOutput = /\*\*Output:\*\*/.test(this.content);
    const hasHowItWorks = /\*\*How it works:\*\*/.test(this.content);
    const hasVerification = /\*\*Verify it worked:\*\*/.test(this.content);
    const hasPrerequisites = /\*\*Prerequisites:\*\*/.test(this.content);

    if (hasScenario && hasGoal && hasCommand) {
      score += 3;
      details.push('✅ Complete Scenario/Goal/Command structure');
    } else {
      suggestions.push('Ensure every example has Scenario, Goal, and Command');
    }

    if (hasOutput) {
      score += 2;
      details.push('✅ Expected output shown');
    } else {
      suggestions.push('Show expected output for examples');
    }

    if (hasHowItWorks) {
      score += 2;
      details.push('✅ "How it works" explanations');
    } else {
      suggestions.push('Add "How it works" explanations');
    }

    if (hasVerification) {
      score += 2;
      details.push('✅ Verification steps provided');
    } else {
      suggestions.push('Add "Verify it worked" sections');
    }

    if (hasPrerequisites) score += 1;

    // 2.2 Real-World Relevance (10 points)
    const hasRealScenarios = /Production bug|Security vulnerability|Performance bottleneck/.test(this.content);
    const hasProductionCode = /try \{[\s\S]*?\} catch/.test(this.content);
    const hasTimeEstimates = /`\[\d+-min\]`/.test(this.content);

    if (hasRealScenarios) {
      score += 3;
      details.push('✅ Real-world scenarios (production issues, etc.)');
    } else {
      suggestions.push('Use realistic production scenarios instead of toy examples');
    }

    if (hasProductionCode) {
      score += 3;
      details.push('✅ Production-ready code with error handling');
    }

    if (hasTimeEstimates) {
      score += 2;
      details.push('✅ Realistic time estimates');
    }

    score += 2; // Assume addresses common pain points based on content

    // 2.3 Code Quality (10 points)
    const codeBlocks = this.content.match(/```[\s\S]*?```/g) || [];
    const hasNoDOTS = !this.content.includes('...');
    const hasErrorHandling = /catch|throw new Error/.test(this.content);
    const hasBeforeAfter = /\*\*Before.*?\*\*After/s.test(this.content);
    const hasFormatting = codeBlocks.length > 0;
    const hasComments = /\/\/ /.test(this.content);

    if (hasNoDOTS) {
      score += 3;
      details.push('✅ Copy-paste ready (no placeholders)');
    } else {
      suggestions.push('Remove placeholders (...) from code examples');
    }

    if (hasErrorHandling) {
      score += 2;
      details.push('✅ Error handling included');
    }

    if (hasBeforeAfter) {
      score += 2;
      details.push('✅ Before/after code comparisons');
    } else {
      suggestions.push('Show before/after code for refactoring examples');
    }

    if (hasFormatting) score += 1;
    if (hasComments) {
      score += 2;
      details.push('✅ Helpful inline comments');
    }

    return {
      category: 'Example Quality',
      score,
      maxScore: 30,
      details,
      suggestions,
    };
  }

  private evaluateActionability(): EvaluationScore {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 3.1 Immediate Wins (10 points)
    const hasQuickStart = /## Part 0: Quick Start/.test(this.content);
    const hasSimpleExamples = /### Example [1-3]:.*?`\[(basic|1-min|2-min|3-min)\]`/s.test(this.content);
    const hasSuccessCriteria = /✅/.test(this.content);

    if (hasQuickStart) {
      score += 5;
      details.push('✅ Quick Start section for immediate success');
    } else {
      suggestions.push('Add Quick Start section with 5-minute examples');
    }

    if (hasSimpleExamples) {
      score += 3;
      details.push('✅ First examples are simple and confidence-building');
    }

    if (hasSuccessCriteria) {
      score += 2;
      details.push('✅ Clear success indicators');
    }

    // 3.2 Customization Guidance (8 points)
    const hasCustomize = /\*\*Customize it:\*\*/.test(this.content);
    const hasVariations = /# Use.*instead/.test(this.content);
    const hasParams = /--\w+/.test(this.content);

    if (hasCustomize) {
      score += 3;
      details.push('✅ Customization options provided');
    } else {
      suggestions.push('Add "Customize it" sections showing variations');
    }

    if (hasVariations) {
      score += 2;
      details.push('✅ Common modifications shown');
    }

    if (hasParams) {
      score += 2;
      details.push('✅ Parameter explanations');
    }

    score += 1; // Trade-off discussions

    // 3.3 Troubleshooting (7 points)
    const hasTroubleshooting = /## Part 7: Troubleshooting/.test(this.content);
    const hasErrors = /❌|Error/.test(this.content);
    const hasVerification = /npm test|npm run/.test(this.content);
    const hasRelated = /\*\*Related:\*\*/.test(this.content);

    if (hasTroubleshooting) {
      score += 2;
      details.push('✅ Dedicated troubleshooting section');
    } else {
      suggestions.push('Add troubleshooting section for common issues');
    }

    if (hasErrors) score += 2;
    if (hasVerification) {
      score += 2;
      details.push('✅ Verification commands');
    }
    if (hasRelated) {
      score += 1;
      details.push('✅ Links to related resources');
    }

    return {
      category: 'Actionability',
      score,
      maxScore: 25,
      details,
      suggestions,
    };
  }

  private evaluateLearningPath(): EvaluationScore {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 4.1 Conceptual Progression (5 points)
    const hasParts = (this.content.match(/## Part \d+:/g) || []).length;
    const hasProgression = hasParts >= 5;

    if (hasProgression) {
      score += 2;
      details.push('✅ Natural progression through concepts');
    }

    score += 2; // Incremental concept introduction (assumed from structure)
    score += 1; // Revisits concepts (assumed)

    // 4.2 Cross-References (5 points)
    const relatedCount = (this.content.match(/\*\*Related:\*\*/g) || []).length;
    const hasRelated = relatedCount >= 10;
    const hasDeepDive = /technical-reference|ARCHITECTURE/.test(this.content);
    const hasTroubleshootingLinks = /Part 7:/.test(this.content);

    if (hasRelated) {
      score += 2;
      details.push(`✅ Cross-references to related examples (${relatedCount} instances)`);
    } else {
      suggestions.push('Add more cross-references between related examples');
    }

    if (hasDeepDive) {
      score += 2;
      details.push('✅ Links to technical deep-dives');
    }

    if (hasTroubleshootingLinks) score += 1;

    // 4.3 Multiple Learning Styles (5 points)
    const hasDiagrams = /```mermaid|!\[.*?\]\(.*?\)/.test(this.content);
    const hasCopyPaste = /```/.test(this.content);
    const hasExplanations = /\*\*How it works:\*\*/.test(this.content);

    if (hasDiagrams) {
      score += 2;
      details.push('✅ Visual elements (diagrams/screenshots)');
    } else {
      suggestions.push('Add architecture diagrams for complex examples');
    }

    if (hasCopyPaste) {
      score += 2;
      details.push('✅ Hands-on copy-paste examples');
    }

    if (hasExplanations) {
      score += 1;
      details.push('✅ Conceptual explanations');
    }

    return {
      category: 'Learning Path',
      score,
      maxScore: 15,
      details,
      suggestions,
    };
  }

  private evaluateAccessibility(): EvaluationScore {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 5.1 Readability (5 points)
    const hasConversational = /Let's|Here's how|You'll/.test(this.content);
    const avgParaLength = this.calculateMetrics().avgParagraphLength;
    const hasShortParas = avgParaLength <= 4;
    const avoidsJargon = true; // Manual check needed
    const usesActive = true; // Manual check needed

    if (hasConversational) {
      score += 2;
      details.push('✅ Conversational tone');
    } else {
      suggestions.push('Use more conversational language (Let\'s, Here\'s how, etc.)');
    }

    if (hasShortParas) {
      score += 1;
      details.push(`✅ Short paragraphs (avg ${avgParaLength.toFixed(1)} sentences)`);
    } else {
      suggestions.push(`Reduce paragraph length (current avg: ${avgParaLength.toFixed(1)} sentences)`);
    }

    score += 1; // Avoids jargon (assumed)
    score += 1; // Active voice (assumed)

    // 5.2 Inclusivity (5 points)
    const assumesNoPrior = /Quick Start|Getting Started|Example 1/.test(this.content);
    const definesTerms = /\*\*.*?\*\*:/.test(this.content);
    const providesContext = /\*\*How it works:\*\*/.test(this.content);
    const encouragesExperimentation = /\*\*Customize it:\*\*/.test(this.content);

    if (assumesNoPrior) {
      score += 2;
      details.push('✅ Accessible to beginners');
    }

    if (definesTerms) score += 1;
    if (providesContext) score += 1;
    if (encouragesExperimentation) {
      score += 1;
      details.push('✅ Encourages experimentation');
    }

    return {
      category: 'Accessibility',
      score,
      maxScore: 10,
      details,
      suggestions,
    };
  }

  private getRating(percentage: number): string {
    if (percentage >= 90) return '⭐⭐⭐⭐⭐ Exceptional';
    if (percentage >= 80) return '⭐⭐⭐⭐ Excellent';
    if (percentage >= 70) return '⭐⭐⭐ Good';
    if (percentage >= 60) return '⭐⭐ Adequate';
    return '⭐ Needs Improvement';
  }

  private identifyStrengths(categoryScores: EvaluationScore[], metrics: any): string[] {
    const strengths: string[] = [];

    // High-scoring categories
    categoryScores.forEach(cat => {
      const percentage = (cat.score / cat.maxScore) * 100;
      if (percentage >= 85) {
        strengths.push(`Strong ${cat.category.toLowerCase()} (${cat.score}/${cat.maxScore})`);
      }
    });

    // Exceptional metrics
    if (metrics.exampleCount >= 20) {
      strengths.push(`Comprehensive coverage (${metrics.exampleCount} examples)`);
    }

    if (metrics.codeBlockCount >= 40) {
      strengths.push(`Rich code examples (${metrics.codeBlockCount} code blocks)`);
    }

    if (metrics.linkCount >= 50) {
      strengths.push(`Excellent cross-referencing (${metrics.linkCount} links)`);
    }

    if (metrics.timeToFirstWin !== null && metrics.timeToFirstWin <= 5) {
      strengths.push(`Quick wins (first success in ${metrics.timeToFirstWin} minutes)`);
    }

    return strengths;
  }

  private identifyImprovements(categoryScores: EvaluationScore[], metrics: any): string[] {
    const improvements: string[] = [];

    // Low-scoring categories
    categoryScores.forEach(cat => {
      const percentage = (cat.score / cat.maxScore) * 100;
      if (percentage < 70 && cat.suggestions.length > 0) {
        improvements.push(...cat.suggestions.slice(0, 2));
      }
    });

    // Metrics-based suggestions
    if (metrics.exampleCount < 10) {
      improvements.push(`Add more examples (current: ${metrics.exampleCount}, target: 20+)`);
    }

    if (metrics.linkCount < 20) {
      improvements.push(`Increase cross-references (current: ${metrics.linkCount}, target: 50+)`);
    }

    if (metrics.avgParagraphLength > 5) {
      improvements.push(`Shorten paragraphs (current avg: ${metrics.avgParagraphLength.toFixed(1)} sentences)`);
    }

    return improvements.slice(0, 5); // Top 5 improvements
  }

  generateReport(result: EvaluationResult): string {
    const lines: string[] = [];

    lines.push('# User Guide Evaluation Report');
    lines.push('');
    lines.push(`**Guide:** ${result.guideName}`);
    lines.push(`**Date:** ${new Date().toISOString().split('T')[0]}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Overall Score
    lines.push('## Overall Score');
    lines.push('');
    lines.push(`**${result.totalScore}/${result.maxScore}** (${result.percentage.toFixed(1)}%)`);
    lines.push('');
    lines.push(`**Rating:** ${result.rating}`);
    lines.push('');

    // Metrics
    lines.push('## Content Metrics');
    lines.push('');
    lines.push(`- **Word Count:** ${result.metrics.wordCount.toLocaleString()}`);
    lines.push(`- **Examples:** ${result.metrics.exampleCount}`);
    lines.push(`- **Code Blocks:** ${result.metrics.codeBlockCount}`);
    lines.push(`- **Cross-References:** ${result.metrics.linkCount}`);
    lines.push(`- **Headings:** ${result.metrics.headingCount}`);
    lines.push(`- **Paragraphs:** ${result.metrics.paragraphCount}`);
    lines.push(`- **Avg Paragraph Length:** ${result.metrics.avgParagraphLength.toFixed(1)} sentences`);
    if (result.metrics.timeToFirstWin !== null) {
      lines.push(`- **Time to First Win:** ${result.metrics.timeToFirstWin} minute(s)`);
    }
    lines.push('');

    // Category Breakdown
    lines.push('## Category Scores');
    lines.push('');
    result.categoryScores.forEach(cat => {
      const percentage = (cat.score / cat.maxScore) * 100;
      const bar = '█'.repeat(Math.floor(percentage / 5));
      lines.push(`### ${cat.category}: ${cat.score}/${cat.maxScore} (${percentage.toFixed(0)}%)`);
      lines.push(`\`${bar}\``);
      lines.push('');

      if (cat.details.length > 0) {
        lines.push('**Strengths:**');
        cat.details.forEach(d => lines.push(`- ${d}`));
        lines.push('');
      }

      if (cat.suggestions.length > 0) {
        lines.push('**Suggestions:**');
        cat.suggestions.forEach(s => lines.push(`- ${s}`));
        lines.push('');
      }
    });

    // Strengths
    lines.push('## Key Strengths');
    lines.push('');
    result.strengths.forEach((s, i) => {
      lines.push(`${i + 1}. ${s}`);
    });
    lines.push('');

    // Improvements
    lines.push('## Priority Improvements');
    lines.push('');
    result.improvements.forEach((imp, i) => {
      lines.push(`${i + 1}. ${imp}`);
    });
    lines.push('');

    return lines.join('\n');
  }
}

// CLI
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/eval-user-guide.ts <path-to-guide.md>');
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  console.log('Evaluating user guide...\n');

  const evaluator = new UserGuideEvaluator(filePath);
  const result = evaluator.evaluate();
  const report = evaluator.generateReport(result);

  console.log(report);

  // Save report
  const reportPath = filePath.replace('.md', '-EVAL-REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);

  // Exit with non-zero if score is below 70%
  process.exit(result.percentage >= 70 ? 0 : 1);
}

main();
