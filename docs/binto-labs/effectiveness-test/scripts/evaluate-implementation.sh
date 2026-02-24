#!/bin/bash
# Automated Code Evaluation Rubric
# Evaluates both baseline and claude-flow implementations objectively

IMPLEMENTATION_DIR="$1"
REPORT_FILE="$2"

if [ -z "$IMPLEMENTATION_DIR" ] || [ -z "$REPORT_FILE" ]; then
    echo "Usage: $0 <implementation-dir> <output-report>"
    exit 1
fi

cd "$IMPLEMENTATION_DIR" || exit 1

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Automated Implementation Evaluation                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Evaluating: $IMPLEMENTATION_DIR"
echo "Report: $REPORT_FILE"
echo ""

# Initialize scores
TOTAL_SCORE=0
MAX_SCORE=0

cat > "$REPORT_FILE" << 'EOF'
# Implementation Evaluation Report

**Directory**: IMPLEMENTATION_DIR
**Date**: TIMESTAMP

## Evaluation Rubric (100 points total)

EOF

# Replace placeholders
sed -i "s|IMPLEMENTATION_DIR|$IMPLEMENTATION_DIR|g" "$REPORT_FILE"
sed -i "s|TIMESTAMP|$(date)|g" "$REPORT_FILE"

# ============================================================
# 1. FILE STRUCTURE (10 points)
# ============================================================
echo "📁 Evaluating file structure..."

cat >> "$REPORT_FILE" << 'EOF'
### 1. File Structure & Organization (10 points)

EOF

SCORE_STRUCTURE=0

# Check for source directory
if [ -d "src" ]; then
    SCORE_STRUCTURE=$((SCORE_STRUCTURE + 2))
    echo "  ✅ src/ directory exists (+2)"
    echo "- ✅ src/ directory exists (+2)" >> "$REPORT_FILE"
fi

# Check for database schema
if [ -f "database/schema.sql" ] || [ -f "src/database/schema.sql" ]; then
    SCORE_STRUCTURE=$((SCORE_STRUCTURE + 2))
    echo "  ✅ Database schema exists (+2)"
    echo "- ✅ Database schema exists (+2)" >> "$REPORT_FILE"
fi

# Check for tests
if [ -d "src/__tests__" ] || [ -d "tests" ] || [ -d "src/tests" ]; then
    SCORE_STRUCTURE=$((SCORE_STRUCTURE + 2))
    echo "  ✅ Tests directory exists (+2)"
    echo "- ✅ Tests directory exists (+2)" >> "$REPORT_FILE"
fi

# Check for frontend
if [ -d "src/frontend" ] || [ -d "frontend" ] || [ -d "client" ]; then
    SCORE_STRUCTURE=$((SCORE_STRUCTURE + 2))
    echo "  ✅ Frontend directory exists (+2)"
    echo "- ✅ Frontend directory exists (+2)" >> "$REPORT_FILE"
fi

# Check for config files
if [ -f "tsconfig.json" ] && [ -f "package.json" ]; then
    SCORE_STRUCTURE=$((SCORE_STRUCTURE + 2))
    echo "  ✅ Config files exist (+2)"
    echo "- ✅ Config files exist (+2)" >> "$REPORT_FILE"
fi

echo "- **Score**: $SCORE_STRUCTURE/10" >> "$REPORT_FILE"
echo ""
TOTAL_SCORE=$((TOTAL_SCORE + SCORE_STRUCTURE))
MAX_SCORE=$((MAX_SCORE + 10))

# ============================================================
# 2. CODE COMPLETENESS (20 points)
# ============================================================
echo "📝 Evaluating code completeness..."

cat >> "$REPORT_FILE" << 'EOF'

### 2. Code Completeness (20 points)

EOF

SCORE_COMPLETENESS=0

# Count backend files
BACKEND_FILES=$(find src -name "*.ts" -not -path "*/node_modules/*" -not -path "*/__tests__/*" -not -path "*/frontend/*" 2>/dev/null | wc -l)
if [ "$BACKEND_FILES" -ge 10 ]; then
    SCORE_COMPLETENESS=$((SCORE_COMPLETENESS + 5))
    echo "  ✅ Backend implementation ($BACKEND_FILES files) (+5)"
    echo "- ✅ Backend implementation ($BACKEND_FILES files) (+5)" >> "$REPORT_FILE"
elif [ "$BACKEND_FILES" -ge 5 ]; then
    SCORE_COMPLETENESS=$((SCORE_COMPLETENESS + 3))
    echo "  ⚠️ Partial backend ($BACKEND_FILES files) (+3)"
    echo "- ⚠️ Partial backend ($BACKEND_FILES files) (+3)" >> "$REPORT_FILE"
fi

# Count frontend files
FRONTEND_FILES=$(find src/frontend -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)
if [ "$FRONTEND_FILES" -ge 5 ]; then
    SCORE_COMPLETENESS=$((SCORE_COMPLETENESS + 5))
    echo "  ✅ Frontend implementation ($FRONTEND_FILES files) (+5)"
    echo "- ✅ Frontend implementation ($FRONTEND_FILES files) (+5)" >> "$REPORT_FILE"
elif [ "$FRONTEND_FILES" -ge 2 ]; then
    SCORE_COMPLETENESS=$((SCORE_COMPLETENESS + 3))
    echo "  ⚠️ Partial frontend ($FRONTEND_FILES files) (+3)"
    echo "- ⚠️ Partial frontend ($FRONTEND_FILES files) (+3)" >> "$REPORT_FILE"
fi

# Count test files
TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" 2>/dev/null | wc -l)
if [ "$TEST_FILES" -ge 10 ]; then
    SCORE_COMPLETENESS=$((SCORE_COMPLETENESS + 5))
    echo "  ✅ Comprehensive tests ($TEST_FILES files) (+5)"
    echo "- ✅ Comprehensive tests ($TEST_FILES files) (+5)" >> "$REPORT_FILE"
elif [ "$TEST_FILES" -ge 5 ]; then
    SCORE_COMPLETENESS=$((SCORE_COMPLETENESS + 3))
    echo "  ⚠️ Partial tests ($TEST_FILES files) (+3)"
    echo "- ⚠️ Partial tests ($TEST_FILES files) (+3)" >> "$REPORT_FILE"
fi

# Check for Stripe integration
if grep -r "stripe" src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    SCORE_COMPLETENESS=$((SCORE_COMPLETENESS + 5))
    echo "  ✅ Stripe integration present (+5)"
    echo "- ✅ Stripe integration present (+5)" >> "$REPORT_FILE"
fi

echo "- **Score**: $SCORE_COMPLETENESS/20" >> "$REPORT_FILE"
echo ""
TOTAL_SCORE=$((TOTAL_SCORE + SCORE_COMPLETENESS))
MAX_SCORE=$((MAX_SCORE + 20))

# ============================================================
# 3. TYPESCRIPT QUALITY (15 points)
# ============================================================
echo "🔍 Evaluating TypeScript quality..."

cat >> "$REPORT_FILE" << 'EOF'

### 3. TypeScript Quality (15 points)

EOF

SCORE_TYPESCRIPT=0

# Run TypeScript compiler
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo 0)

if [ "$TS_ERRORS" -eq 0 ]; then
    SCORE_TYPESCRIPT=$((SCORE_TYPESCRIPT + 10))
    echo "  ✅ No TypeScript errors (+10)"
    echo "- ✅ No TypeScript errors (+10)" >> "$REPORT_FILE"
elif [ "$TS_ERRORS" -le 5 ]; then
    SCORE_TYPESCRIPT=$((SCORE_TYPESCRIPT + 7))
    echo "  ⚠️ Minor TypeScript errors ($TS_ERRORS) (+7)"
    echo "- ⚠️ Minor TypeScript errors ($TS_ERRORS) (+7)" >> "$REPORT_FILE"
elif [ "$TS_ERRORS" -le 15 ]; then
    SCORE_TYPESCRIPT=$((SCORE_TYPESCRIPT + 4))
    echo "  ⚠️ Some TypeScript errors ($TS_ERRORS) (+4)"
    echo "- ⚠️ Some TypeScript errors ($TS_ERRORS) (+4)" >> "$REPORT_FILE"
else
    echo "  ❌ Many TypeScript errors ($TS_ERRORS) (+0)"
    echo "- ❌ Many TypeScript errors ($TS_ERRORS) (+0)" >> "$REPORT_FILE"
fi

# Check for type definitions
TYPE_DEFS=$(find src -name "*.d.ts" 2>/dev/null | wc -l)
if [ "$TYPE_DEFS" -ge 3 ]; then
    SCORE_TYPESCRIPT=$((SCORE_TYPESCRIPT + 5))
    echo "  ✅ Custom type definitions ($TYPE_DEFS files) (+5)"
    echo "- ✅ Custom type definitions ($TYPE_DEFS files) (+5)" >> "$REPORT_FILE"
elif [ "$TYPE_DEFS" -ge 1 ]; then
    SCORE_TYPESCRIPT=$((SCORE_TYPESCRIPT + 3))
    echo "  ⚠️ Some type definitions ($TYPE_DEFS files) (+3)"
    echo "- ⚠️ Some type definitions ($TYPE_DEFS files) (+3)" >> "$REPORT_FILE"
fi

echo "- **Score**: $SCORE_TYPESCRIPT/15" >> "$REPORT_FILE"
echo ""
TOTAL_SCORE=$((TOTAL_SCORE + SCORE_TYPESCRIPT))
MAX_SCORE=$((MAX_SCORE + 15))

# ============================================================
# 4. CODE QUALITY (ESLint) (10 points)
# ============================================================
echo "✨ Evaluating code quality..."

cat >> "$REPORT_FILE" << 'EOF'

### 4. Code Quality - ESLint (10 points)

EOF

SCORE_ESLINT=0

# Run ESLint
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || grep -q "eslintConfig" package.json; then
    ESLINT_ERRORS=$(npx eslint . --ext .ts,.tsx 2>&1 | grep -c "error" || echo 0)

    if [ "$ESLINT_ERRORS" -eq 0 ]; then
        SCORE_ESLINT=$((SCORE_ESLINT + 10))
        echo "  ✅ No ESLint errors (+10)"
        echo "- ✅ No ESLint errors (+10)" >> "$REPORT_FILE"
    elif [ "$ESLINT_ERRORS" -le 10 ]; then
        SCORE_ESLINT=$((SCORE_ESLINT + 6))
        echo "  ⚠️ Minor ESLint issues ($ESLINT_ERRORS) (+6)"
        echo "- ⚠️ Minor ESLint issues ($ESLINT_ERRORS) (+6)" >> "$REPORT_FILE"
    elif [ "$ESLINT_ERRORS" -le 30 ]; then
        SCORE_ESLINT=$((SCORE_ESLINT + 3))
        echo "  ⚠️ Some ESLint issues ($ESLINT_ERRORS) (+3)"
        echo "- ⚠️ Some ESLint issues ($ESLINT_ERRORS) (+3)" >> "$REPORT_FILE"
    fi
else
    echo "  ⚠️ No ESLint config (+0)"
    echo "- ⚠️ No ESLint config (+0)" >> "$REPORT_FILE"
fi

echo "- **Score**: $SCORE_ESLINT/10" >> "$REPORT_FILE"
echo ""
TOTAL_SCORE=$((TOTAL_SCORE + SCORE_ESLINT))
MAX_SCORE=$((MAX_SCORE + 10))

# ============================================================
# 5. TEST COVERAGE (20 points)
# ============================================================
echo "🧪 Evaluating test coverage..."

cat >> "$REPORT_FILE" << 'EOF'

### 5. Test Coverage (20 points)

EOF

SCORE_TESTS=0

# Try to run tests
if npm run test:coverage >/dev/null 2>&1; then
    COVERAGE=$(npm run test:coverage 2>&1 | grep "All files" | awk '{print $4}' | sed 's/%//')

    if [ ! -z "$COVERAGE" ]; then
        if [ "$COVERAGE" -ge 90 ]; then
            SCORE_TESTS=$((SCORE_TESTS + 20))
            echo "  ✅ Excellent coverage (${COVERAGE}%) (+20)"
            echo "- ✅ Excellent coverage (${COVERAGE}%) (+20)" >> "$REPORT_FILE"
        elif [ "$COVERAGE" -ge 75 ]; then
            SCORE_TESTS=$((SCORE_TESTS + 15))
            echo "  ✅ Good coverage (${COVERAGE}%) (+15)"
            echo "- ✅ Good coverage (${COVERAGE}%) (+15)" >> "$REPORT_FILE"
        elif [ "$COVERAGE" -ge 50 ]; then
            SCORE_TESTS=$((SCORE_TESTS + 10))
            echo "  ⚠️ Moderate coverage (${COVERAGE}%) (+10)"
            echo "- ⚠️ Moderate coverage (${COVERAGE}%) (+10)" >> "$REPORT_FILE"
        else
            SCORE_TESTS=$((SCORE_TESTS + 5))
            echo "  ⚠️ Low coverage (${COVERAGE}%) (+5)"
            echo "- ⚠️ Low coverage (${COVERAGE}%) (+5)" >> "$REPORT_FILE"
        fi
    fi
else
    # Count test files as fallback
    if [ "$TEST_FILES" -ge 10 ]; then
        SCORE_TESTS=$((SCORE_TESTS + 10))
        echo "  ⚠️ Tests exist but coverage unknown (+10)"
        echo "- ⚠️ Tests exist but coverage unknown (+10)" >> "$REPORT_FILE"
    fi
fi

echo "- **Score**: $SCORE_TESTS/20" >> "$REPORT_FILE"
echo ""
TOTAL_SCORE=$((TOTAL_SCORE + SCORE_TESTS))
MAX_SCORE=$((MAX_SCORE + 20))

# ============================================================
# 6. DOCUMENTATION (10 points)
# ============================================================
echo "📚 Evaluating documentation..."

cat >> "$REPORT_FILE" << 'EOF'

### 6. Documentation (10 points)

EOF

SCORE_DOCS=0

# Check for README
if [ -f "README.md" ]; then
    README_SIZE=$(wc -l < README.md)
    if [ "$README_SIZE" -ge 50 ]; then
        SCORE_DOCS=$((SCORE_DOCS + 4))
        echo "  ✅ Comprehensive README (+4)"
        echo "- ✅ Comprehensive README ($README_SIZE lines) (+4)" >> "$REPORT_FILE"
    elif [ "$README_SIZE" -ge 20 ]; then
        SCORE_DOCS=$((SCORE_DOCS + 2))
        echo "  ⚠️ Basic README (+2)"
        echo "- ⚠️ Basic README ($README_SIZE lines) (+2)" >> "$REPORT_FILE"
    fi
fi

# Check for API documentation
if [ -f "API.md" ] || [ -f "docs/API.md" ] || grep -r "swagger" src >/dev/null 2>&1; then
    SCORE_DOCS=$((SCORE_DOCS + 3))
    echo "  ✅ API documentation exists (+3)"
    echo "- ✅ API documentation exists (+3)" >> "$REPORT_FILE"
fi

# Check for setup instructions
if [ -f "SETUP.md" ] || grep -i "setup\|installation" README.md >/dev/null 2>&1; then
    SCORE_DOCS=$((SCORE_DOCS + 3))
    echo "  ✅ Setup instructions exist (+3)"
    echo "- ✅ Setup instructions exist (+3)" >> "$REPORT_FILE"
fi

echo "- **Score**: $SCORE_DOCS/10" >> "$REPORT_FILE"
echo ""
TOTAL_SCORE=$((TOTAL_SCORE + SCORE_DOCS))
MAX_SCORE=$((MAX_SCORE + 10))

# ============================================================
# 7. FEATURE COMPLETENESS (15 points)
# ============================================================
echo "⚙️  Evaluating feature completeness..."

cat >> "$REPORT_FILE" << 'EOF'

### 7. Feature Completeness (15 points)

EOF

SCORE_FEATURES=0

# Check for cart functionality
if grep -r "addToCart\|addItem" src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    SCORE_FEATURES=$((SCORE_FEATURES + 2))
    echo "  ✅ Cart add/remove (+2)"
    echo "- ✅ Cart add/remove (+2)" >> "$REPORT_FILE"
fi

# Check for tax calculation
if grep -r "tax\|TAX" src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    SCORE_FEATURES=$((SCORE_FEATURES + 2))
    echo "  ✅ Tax calculation (+2)"
    echo "- ✅ Tax calculation (+2)" >> "$REPORT_FILE"
fi

# Check for discount codes
if grep -r "discount\|coupon" src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    SCORE_FEATURES=$((SCORE_FEATURES + 2))
    echo "  ✅ Discount codes (+2)"
    echo "- ✅ Discount codes (+2)" >> "$REPORT_FILE"
fi

# Check for shipping address
if grep -r "shipping\|address" src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    SCORE_FEATURES=$((SCORE_FEATURES + 2))
    echo "  ✅ Shipping address (+2)"
    echo "- ✅ Shipping address (+2)" >> "$REPORT_FILE"
fi

# Check for Stripe payment
if grep -r "stripe\|payment" src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    SCORE_FEATURES=$((SCORE_FEATURES + 4))
    echo "  ✅ Stripe payment integration (+4)"
    echo "- ✅ Stripe payment integration (+4)" >> "$REPORT_FILE"
fi

# Check for order confirmation
if grep -r "order.*confirm\|confirmation" src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    SCORE_FEATURES=$((SCORE_FEATURES + 3))
    echo "  ✅ Order confirmation (+3)"
    echo "- ✅ Order confirmation (+3)" >> "$REPORT_FILE"
fi

echo "- **Score**: $SCORE_FEATURES/15" >> "$REPORT_FILE"
echo ""
TOTAL_SCORE=$((TOTAL_SCORE + SCORE_FEATURES))
MAX_SCORE=$((MAX_SCORE + 15))

# ============================================================
# FINAL SCORE
# ============================================================
PERCENTAGE=$((TOTAL_SCORE * 100 / MAX_SCORE))

cat >> "$REPORT_FILE" << EOF

---

## Final Score

**Total**: $TOTAL_SCORE / $MAX_SCORE points ($PERCENTAGE%)

### Grade
EOF

if [ "$PERCENTAGE" -ge 90 ]; then
    echo "**A (Excellent)** - Production-ready implementation" >> "$REPORT_FILE"
    echo "  🏆 Grade: A (Excellent)"
elif [ "$PERCENTAGE" -ge 80 ]; then
    echo "**B (Good)** - Solid implementation with minor improvements needed" >> "$REPORT_FILE"
    echo "  ✅ Grade: B (Good)"
elif [ "$PERCENTAGE" -ge 70 ]; then
    echo "**C (Satisfactory)** - Functional but needs improvement" >> "$REPORT_FILE"
    echo "  ⚠️ Grade: C (Satisfactory)"
else
    echo "**D (Needs Work)** - Incomplete or significant issues" >> "$REPORT_FILE"
    echo "  ❌ Grade: D (Needs Work)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Final Score: $TOTAL_SCORE/$MAX_SCORE ($PERCENTAGE%)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📄 Full report saved to: $REPORT_FILE"
