#!/bin/bash
# Run Baseline Test (Control - Standard Claude Code)

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║             BASELINE TEST (Control Group)                    ║"
echo "║          Standard Claude Code - No claude-flow               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd ~/checkout-baseline

# Record start time
START_TIME=$(date +%s)
echo "⏱️  Start time: $(date)"
echo ""

# Get script directory to find requirements.md
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy requirements
cp "$SCRIPT_DIR/test-requirements.md" ./requirements.md

echo "📋 Task: Build e-commerce checkout flow"
echo ""
echo "Requirements are in: ./requirements.md"
echo ""
echo "🎯 Now run Claude Code and give it this prompt:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Build an e-commerce checkout flow based on requirements.md"
echo ""
echo "Use standard Claude Code (no swarm coordination, no claude-flow)."
echo "Work as a single agent."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "When done, press ENTER to record completion time..."
read

# Record end time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "✅ Baseline test complete!"
echo "⏱️  Duration: ${MINUTES}m ${SECONDS}s"
echo ""

# Create results template
cat > results-baseline.md << EOF
# Baseline Test Results

**Date**: $(date)
**Duration**: ${MINUTES}m ${SECONDS}s

## Code Quality Metrics

### Test Coverage
\`\`\`bash
npm run test:coverage
\`\`\`
- Overall coverage: ____%
- Line coverage: ____%
- Branch coverage: ____%

### TypeScript Errors
\`\`\`bash
npx tsc --noEmit
\`\`\`
- Errors: ____

### ESLint Issues
\`\`\`bash
npx eslint . --ext .ts,.tsx
\`\`\`
- Errors: ____
- Warnings: ____

## Functionality Test

| Feature | Working? | Notes |
|---------|----------|-------|
| Add to cart | [ ] | |
| Remove from cart | [ ] | |
| Update quantity | [ ] | |
| Calculate totals | [ ] | |
| Apply discount | [ ] | |
| Shipping address | [ ] | |
| Payment method | [ ] | |
| Stripe payment | [ ] | |
| Order confirmation | [ ] | |

## Bugs Found

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | ____ | |
| Major | ____ | |
| Minor | ____ | |

## Notes
- Coordination issues observed:
- Missing features:
- Code quality observations:
EOF

echo "📝 Results template created: results-baseline.md"
echo ""
echo "📊 Next steps:"
echo "  1. Run test coverage: npm run test:coverage"
echo "  2. Check TypeScript: npx tsc --noEmit"
echo "  3. Check ESLint: npx eslint . --ext .ts,.tsx"
echo "  4. Fill out results-baseline.md"
