# Survey Analytics SaaS: Evaluation Deep Dive

**Date**: 2025-11-27
**Context**: Applying Hamel's evaluation methodology to a conversational survey analytics product
**Related**: `hamel-evals-integration-analysis.md`

---

## Overview

This document provides detailed guidance on three critical evaluation components for building a survey analytics SaaS with conversational data exploration:

1. **Golden Dataset Structure** - Ground truth for verification
2. **Conversational AI Eval Criteria** - How to evaluate the NL interface
3. **Statistical Accuracy Validation** - Ensuring numerical correctness

---

## 1. Structuring the Golden Dataset for Survey Analytics

### The Purpose

A golden dataset is your **ground truth** - surveys with known characteristics where you can verify if the system's answers are correct. Without this, you're evaluating vibes, not accuracy.

### Dataset Design Principles

**Principle 1: Cover the data types you'll encounter**

| Survey Type | Why Include It | Tricky Aspects |
|-------------|----------------|----------------|
| **Likert scale (1-5)** | Most common format | Mean vs median debate, treating as interval vs ordinal |
| **NPS (0-10)** | Common in SaaS | Promoter/Detractor bucketing logic |
| **Multiple choice** | Categorical analysis | Can't average, need mode/frequency |
| **Open-ended text** | Sentiment analysis | Subjective interpretation |
| **Matrix questions** | Complex structure | Parsing, cross-tabulation |
| **Ranking questions** | Preference order | Statistical tests differ from ratings |

**Principle 2: Embed known patterns the system should find**

Don't use random data. Deliberately construct patterns:

```
Golden Dataset #1: "Employee Satisfaction Survey"
- 500 responses
- KNOWN PATTERN: Engineering dept satisfaction is 2.1 std devs below company mean
- KNOWN PATTERN: Tenure >5 years correlates with higher satisfaction (r=0.72)
- KNOWN PATTERN: Q3 scores dropped 15% vs Q2 (seasonal? layoffs context?)
- KNOWN EDGE CASE: 12 responses have missing department field
- KNOWN EDGE CASE: 3 responses have satisfaction=0 (should these be excluded?)
```

```
Golden Dataset #2: "Customer NPS Survey"
- 1,200 responses
- KNOWN PATTERN: NPS score is 34 (verify promoter/passive/detractor math)
- KNOWN PATTERN: Enterprise customers NPS=52, SMB customers NPS=18
- KNOWN PATTERN: No statistical difference between regions (p=0.43)
- KNOWN EDGE CASE: 200 responses have no segment field
- KNOWN EDGE CASE: One response has comment but no score
```

```
Golden Dataset #3: "Market Research Survey"
- 2,000 responses
- KNOWN PATTERN: Price sensitivity differs by age (under 30 more sensitive)
- KNOWN PATTERN: Feature A and Feature B preferences are negatively correlated
- KNOWN PATTERN: Small sample size for 65+ demographic (n=23, unreliable)
- KNOWN EDGE CASE: Duplicate respondent IDs (did someone submit twice?)
- KNOWN EDGE CASE: Impossible combinations (age=25, retired=yes)
```

**Principle 3: Write verified Q&A pairs**

For each dataset, create 20+ questions with verified correct answers:

```yaml
# golden-dataset-1-qa.yaml

- question: "What's the overall satisfaction score?"
  correct_answer: "3.72 out of 5"
  verification: "=AVERAGE(satisfaction_column) in source data"
  common_errors:
    - "Excluding nulls changes it to 3.78 - must document approach"
    - "Median is 4.0 - wrong metric but valid alternative"

- question: "Which department has the lowest satisfaction?"
  correct_answer: "Engineering at 2.89"
  verification: "AVERAGEIF by department"
  common_errors:
    - "Facilities has lower but n=4, not statistically significant"
    - "Must not hallucinate departments that don't exist"

- question: "Is there a correlation between tenure and satisfaction?"
  correct_answer: "Yes, moderate positive correlation (r=0.72, p<0.001)"
  verification: "CORREL function + significance test"
  common_errors:
    - "Saying 'strong' correlation - 0.72 is moderate"
    - "Not mentioning p-value/significance"
    - "Implying causation"

- question: "Why did Q3 scores drop?"
  correct_answer: "The data shows a 15% decline but doesn't indicate cause. Would need additional context."
  verification: "This tests hallucination resistance"
  common_errors:
    - "Making up reasons (layoffs, management change)"
    - "Claiming certainty about causation"
```

### Golden Dataset File Structure

```
/golden-datasets/
  /employee-satisfaction/
    data.csv                    # The raw survey data
    metadata.yaml               # Known patterns, edge cases
    qa-pairs.yaml               # Questions with verified answers
    statistical-summary.json    # Pre-computed correct statistics

  /customer-nps/
    data.csv
    metadata.yaml
    qa-pairs.yaml
    statistical-summary.json

  /market-research/
    data.csv
    metadata.yaml
    qa-pairs.yaml
    statistical-summary.json
```

### Evaluation Approach

```python
# Pseudo-code for golden dataset evaluation

def evaluate_against_golden(system_response, qa_pair):
    checks = {
        "numerical_accuracy": verify_numbers_match(
            system_response,
            qa_pair.correct_answer,
            tolerance=0.01  # Allow 1% rounding difference
        ),
        "no_hallucination": verify_no_fabricated_data(
            system_response,
            qa_pair.dataset_schema
        ),
        "uncertainty_appropriate": verify_hedging_when_needed(
            system_response,
            qa_pair.requires_uncertainty
        ),
        "cites_evidence": verify_data_references(
            system_response,
            qa_pair.required_citations
        )
    }
    return all(checks.values()), checks
```

---

## 2. Conversational AI Agent Eval Criteria

This is the trickiest component - the natural language interface that translates questions into queries and formats responses.

### Failure Taxonomy for Conversational Survey Analytics

**Category 1: Hallucination (CRITICAL - Binary Pass/Fail)**

| Subcategory | Example | Detection Method |
|-------------|---------|------------------|
| **Fabricated data points** | "45% said X" when no such data exists | Parse percentages, verify against dataset |
| **Invented questions** | "In response to Q12..." when survey has 10 questions | Extract question references, validate |
| **Made-up segments** | "The West Coast region shows..." when no region field | Extract segment references, validate schema |
| **False correlations** | "X correlates with Y" without statistical basis | Require correlation coefficient + p-value |

**Eval implementation:**

```yaml
# hallucination-eval.yaml
name: "Hallucination Detection"
type: binary  # Pass/Fail, no partial credit
criteria:
  - rule: "Every percentage cited must exist in dataset or be derivable"
    check: extract_percentages_and_verify
  - rule: "Every question reference must match actual survey questions"
    check: extract_question_refs_and_verify
  - rule: "Every segment/demographic must exist in schema"
    check: extract_segments_and_verify
  - rule: "Every claimed correlation must have statistical backing"
    check: verify_correlation_claims
```

**Category 2: Statistical Accuracy (CRITICAL - Scored)**

| Subcategory | Example | Tolerance |
|-------------|---------|-----------|
| **Calculation errors** | Says 52% when actual is 48% | ±1% for percentages |
| **Wrong aggregation** | Uses mean on ordinal data | Binary - wrong method |
| **Sample size blindness** | Draws conclusions from n=5 | Must flag if n<30 |
| **Significance claims** | "Significant difference" without test | Must cite p-value |

**Eval implementation:**

```yaml
# statistical-accuracy-eval.yaml
name: "Statistical Accuracy"
type: scored  # 0-100 based on error magnitude
checks:
  - name: "Numerical accuracy"
    weight: 40
    method: |
      Extract all numbers from response
      Compare to verified values
      Score = 100 - (sum of % errors)

  - name: "Appropriate method"
    weight: 30
    method: |
      If data is ordinal and response uses mean: -30
      If small sample and no caveat: -30
      If claims significance without test: -30

  - name: "Uncertainty quantification"
    weight: 30
    method: |
      If sample size < 30 and response is confident: -30
      If asked about causation and response implies it: -30
```

**Category 3: Response Quality (IMPORTANT - Scored)**

| Subcategory | Good | Bad |
|-------------|------|-----|
| **Clarity** | "3.72 out of 5, based on 488 valid responses" | "The score is around 3.7ish" |
| **Appropriate depth** | Answers the question, offers relevant context | Dumps entire analysis or one-word answer |
| **Actionability** | "Engineering is 2 std devs below - worth investigating" | "Some departments are lower than others" |
| **Cites sources** | "Based on Q7 responses..." | Makes claims without reference |

**Eval implementation:**

```yaml
# response-quality-eval.yaml
name: "Response Quality"
type: scored
checks:
  - name: "Precision"
    criteria: "Specific numbers with context, not vague language"
    positive_signals: ["exact percentages", "sample sizes", "confidence intervals"]
    negative_signals: ["around", "approximately", "some", "many"]

  - name: "Evidence citation"
    criteria: "References specific questions or data points"
    positive_signals: ["Q7 responses", "the satisfaction column", "respondents who selected X"]
    negative_signals: ["the data shows", "results indicate" without specifics]

  - name: "Appropriate hedging"
    criteria: "Expresses uncertainty when warranted"
    positive_signals: ["sample size is small", "correlation not causation", "would need more data"]
    negative_signals: [confident claims on n<30, causal language without experiments]
```

**Category 4: Conversation Coherence (IMPORTANT - Scored)**

For multi-turn conversations:

| Subcategory | Good | Bad |
|-------------|------|-----|
| **Context retention** | Remembers previous filters/segments | "Which department?" after user specified |
| **Clarification** | Asks when ambiguous | Guesses and gets it wrong |
| **Follow-up handling** | "The same metric for Q2" works | Requires re-stating everything |

### Eval Criteria Summary for Conversational Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONVERSATIONAL AI EVAL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GATE (Must Pass)                                               │
│  ├── No hallucinated data points                                │
│  ├── No fabricated survey questions                             │
│  └── No invented segments/demographics                          │
│                                                                  │
│  SCORED (Target: 80%+)                                          │
│  ├── Statistical accuracy (40%)                                 │
│  │   ├── Numerical precision (±1%)                              │
│  │   ├── Appropriate statistical methods                        │
│  │   └── Sample size awareness                                  │
│  │                                                               │
│  ├── Response quality (35%)                                     │
│  │   ├── Precision and specificity                              │
│  │   ├── Evidence citation                                      │
│  │   └── Appropriate uncertainty                                │
│  │                                                               │
│  └── Conversation coherence (25%)                               │
│      ├── Context retention                                      │
│      ├── Clarification when needed                              │
│      └── Follow-up handling                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### LLM-as-Judge for Conversational Agent

After you've manually labeled 50+ responses, create a judge:

```markdown
# Conversational Agent Judge Prompt

You are evaluating a conversational AI that helps users analyze survey data.

## Context
- Survey schema: {schema}
- User question: {question}
- System response: {response}
- Verified correct answer: {correct_answer}

## Evaluation Criteria

### 1. Hallucination Check (BINARY)
Does the response contain ANY fabricated information?
- Made-up percentages not in data
- References to questions that don't exist
- Segments/demographics not in schema
- Correlations without statistical basis

Answer: PASS or FAIL

### 2. Statistical Accuracy (0-100)
How accurate are the numerical claims?
- Compare stated numbers to verified answer
- Check if appropriate statistical methods used
- Verify sample size caveats where needed

Score: [0-100]
Reasoning: [explain scoring]

### 3. Response Quality (0-100)
Is the response clear, specific, and well-evidenced?
- Specific numbers with context
- Cites data sources
- Appropriate confidence level

Score: [0-100]
Reasoning: [explain scoring]

## Final Verdict
{
  "hallucination": "PASS/FAIL",
  "statistical_accuracy": [0-100],
  "response_quality": [0-100],
  "overall_pass": true/false,
  "critical_issues": ["list any blocking problems"]
}
```

**Validation requirement**: This judge must achieve 80%+ agreement with your human labels before deployment.

---

## 3. Statistical Accuracy Validation

This is where many conversational analytics products fail silently. The response sounds confident, but the math is wrong.

### The Problem Space

**Survey data has tricky statistical properties:**

| Data Type | Correct Approach | Common Errors |
|-----------|------------------|---------------|
| **Likert (1-5)** | Median, mode, or treat as interval with caveats | Mean without acknowledgment of debate |
| **NPS (0-10)** | % Promoters - % Detractors | Averaging raw scores |
| **Multiple choice** | Frequencies, chi-square for comparisons | Trying to "average" categories |
| **Rankings** | Kendall's tau, Spearman | Treating as interval |
| **Open-ended** | Thematic analysis, sentiment | Over-precise sentiment scores |

### Validation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 STATISTICAL VALIDATION PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT: System response containing statistical claims            │
│                                                                  │
│  STEP 1: Extract Claims                                         │
│  ├── Parse percentages: "45% of respondents..."                 │
│  ├── Parse aggregations: "average score of 3.7"                 │
│  ├── Parse comparisons: "Group A scored higher than B"          │
│  └── Parse correlations: "X correlates with Y"                  │
│                                                                  │
│  STEP 2: Verify Each Claim                                      │
│  ├── Percentages: Recalculate from source data                  │
│  ├── Aggregations: Verify method + result                       │
│  ├── Comparisons: Run appropriate statistical test              │
│  └── Correlations: Calculate r, p-value                         │
│                                                                  │
│  STEP 3: Check Statistical Validity                             │
│  ├── Sample size sufficient? (n≥30 for CLT assumptions)         │
│  ├── Correct test for data type?                                │
│  ├── Multiple comparisons corrected?                            │
│  └── Effect size meaningful?                                    │
│                                                                  │
│  STEP 4: Score                                                  │
│  ├── Accuracy: How close to true values?                        │
│  ├── Validity: Were appropriate methods used?                   │
│  └── Completeness: Were necessary caveats included?             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation: Deterministic Validators

Unlike LLM-as-Judge (which requires validation), these are **deterministic code checks**:

```python
# statistical_validators.py

class PercentageValidator:
    """Verify any percentage claims against source data."""

    def validate(self, response: str, dataset: pd.DataFrame) -> ValidationResult:
        # Extract all percentage claims from response
        claims = self.extract_percentage_claims(response)
        # e.g., [("45%", "satisfied", "engineering")]

        results = []
        for claimed_pct, metric, segment in claims:
            # Calculate actual percentage
            if segment:
                actual = dataset[dataset.segment == segment][metric].mean() * 100
            else:
                actual = dataset[metric].mean() * 100

            # Compare with tolerance
            error = abs(claimed_pct - actual)
            results.append({
                "claim": f"{claimed_pct}% {metric} ({segment})",
                "actual": actual,
                "error": error,
                "pass": error <= 1.0  # 1% tolerance
            })

        return ValidationResult(
            all_pass=all(r["pass"] for r in results),
            details=results
        )


class AggregationValidator:
    """Verify aggregation claims use appropriate methods."""

    def validate(self, response: str, dataset: pd.DataFrame, schema: dict) -> ValidationResult:
        claims = self.extract_aggregation_claims(response)
        # e.g., [("average", "satisfaction", 3.72)]

        results = []
        for method, field, claimed_value in claims:
            field_type = schema[field]["type"]  # "ordinal", "interval", "nominal"

            # Check if method is appropriate for data type
            method_valid = self.is_valid_method(method, field_type)

            # Calculate actual value
            if method == "average":
                actual = dataset[field].mean()
            elif method == "median":
                actual = dataset[field].median()
            # ... etc

            results.append({
                "claim": f"{method} of {field} = {claimed_value}",
                "method_appropriate": method_valid,
                "actual_value": actual,
                "value_accurate": abs(claimed_value - actual) < 0.01,
                "warning": None if method_valid else f"'{method}' may not be appropriate for {field_type} data"
            })

        return ValidationResult(results=results)

    def is_valid_method(self, method: str, data_type: str) -> bool:
        valid_methods = {
            "nominal": ["mode", "frequency"],
            "ordinal": ["median", "mode", "frequency"],  # mean is debated
            "interval": ["mean", "median", "mode", "std"],
            "ratio": ["mean", "median", "mode", "std", "geometric_mean"]
        }
        return method in valid_methods.get(data_type, [])


class ComparisonValidator:
    """Verify group comparison claims are statistically valid."""

    def validate(self, response: str, dataset: pd.DataFrame) -> ValidationResult:
        claims = self.extract_comparison_claims(response)
        # e.g., [("engineering", "sales", "satisfaction", "higher")]

        results = []
        for group_a, group_b, metric, direction in claims:
            # Get group data
            a_data = dataset[dataset.group == group_a][metric]
            b_data = dataset[dataset.group == group_b][metric]

            # Check sample sizes
            if len(a_data) < 30 or len(b_data) < 30:
                results.append({
                    "claim": f"{group_a} {direction} than {group_b} on {metric}",
                    "valid": False,
                    "reason": f"Sample sizes too small (n={len(a_data)}, {len(b_data)})"
                })
                continue

            # Run appropriate test
            stat, p_value = stats.ttest_ind(a_data, b_data)

            # Verify direction claim
            actual_direction = "higher" if a_data.mean() > b_data.mean() else "lower"
            direction_correct = actual_direction == direction

            # Verify significance
            significant = p_value < 0.05

            results.append({
                "claim": f"{group_a} {direction} than {group_b} on {metric}",
                "direction_correct": direction_correct,
                "statistically_significant": significant,
                "p_value": p_value,
                "valid": direction_correct and significant
            })

        return ValidationResult(results=results)


class CorrelationValidator:
    """Verify correlation claims have statistical basis."""

    def validate(self, response: str, dataset: pd.DataFrame) -> ValidationResult:
        claims = self.extract_correlation_claims(response)
        # e.g., [("tenure", "satisfaction", "positive")]

        results = []
        for var_a, var_b, claimed_direction in claims:
            # Calculate actual correlation
            r, p_value = stats.pearsonr(dataset[var_a], dataset[var_b])

            # Determine actual direction and strength
            if abs(r) < 0.3:
                strength = "weak"
            elif abs(r) < 0.7:
                strength = "moderate"
            else:
                strength = "strong"

            actual_direction = "positive" if r > 0 else "negative"

            results.append({
                "claim": f"{claimed_direction} correlation between {var_a} and {var_b}",
                "actual_r": r,
                "actual_p": p_value,
                "direction_correct": actual_direction == claimed_direction,
                "significant": p_value < 0.05,
                "strength": strength,
                "valid": p_value < 0.05 and actual_direction == claimed_direction
            })

        return ValidationResult(results=results)
```

### Integration with Claude-Flow Swarm

Add a **Statistical Validation Agent** to your swarm:

```markdown
### Agent: Statistical Validator (code-analyzer type)

**Purpose**: Verify all statistical claims in conversational responses

**Runs**: After Conversational AI agent produces response

**Protocol**:
1. Parse response for statistical claims
2. Run deterministic validators:
   - PercentageValidator
   - AggregationValidator
   - ComparisonValidator
   - CorrelationValidator
3. Store results in memory:

npx claude-flow@alpha memory store \
  --namespace "swarm/statistical-validator" \
  --key "validation-results" \
  --value "{
    percentages: { pass: true, claims_verified: 3 },
    aggregations: { pass: true, warnings: ['mean on ordinal data'] },
    comparisons: { pass: false, failures: ['insufficient sample size'] },
    correlations: { pass: true }
  }"

4. If any critical failures:
   - Block response from being returned
   - Send back to Conversational AI for correction

5. If warnings only:
   - Append caveats to response
   - Log for review
```

### The Validation Hierarchy

```
BLOCKING (Response cannot be returned)
├── Fabricated percentages (hallucination)
├── Claims about non-existent data
├── Incorrect direction of difference/correlation
└── Statistical claims with p > 0.05 stated as significant

WARNING (Response returned with caveats)
├── Mean used on ordinal data (add "treating as interval" caveat)
├── Small sample size (add "n=X, interpret with caution" caveat)
├── Multiple comparisons without correction (add caveat)
└── Correlation stated without r and p values (add them)

INFO (Logged for review, no user impact)
├── Using median instead of mean (valid choice, just log)
├── Excluding missing values (document approach)
└── Rounding to reasonable precision
```

---

## 4. Bringing It All Together: Survey Analytics Swarm

### Swarm Composition

```markdown
## Survey Analytics SaaS - Swarm Composition

### Phase A: Core Infrastructure
| Agent | Type | Eval Focus |
|-------|------|------------|
| Architect | system-architect | Clean data pipeline design |
| Data Engineer | coder | Statistical function correctness |
| Backend | coder | API robustness, error handling |

### Phase B: Intelligence Layer
| Agent | Type | Eval Focus |
|-------|------|------------|
| Conversational AI | coder | Hallucination resistance, clarity |
| Statistical Validator | code-analyzer | Numerical accuracy |
| Visualization | coder | Appropriate chart selection |

### Phase C: Eval & Hardening
| Agent | Type | Eval Focus |
|-------|------|------------|
| Golden Dataset Runner | tester | Run against known Q&A pairs |
| Error Analyst | reviewer | Categorize failures |
| Queen | coordinator | Decide if ready for production |
```

### Eval Criteria Summary

| Criteria | Target | Type |
|----------|--------|------|
| Golden Dataset Q&A | 80%+ correct | Scored |
| Hallucination | 0 fabricated data points | Binary gate |
| Statistical Accuracy | 95%+ numerical precision | Scored |
| Response Quality | 80%+ clarity/evidence/hedging | Scored |
| Edge Cases | Graceful handling | Binary gate |

---

## 5. Implementation Roadmap

### Immediate (Before building)
1. Create 3 golden datasets with known patterns
2. Write 20 Q&A pairs per dataset with verified answers
3. Define your hallucination detection rules

### Week 1-2 (Minimal build)
1. Build basic CSV → query → response pipeline
2. Run 50 questions manually
3. Document every failure in error analysis log

### Week 3-4 (Eval infrastructure)
1. Implement deterministic statistical validators
2. Create LLM judge for response quality
3. Validate judge against your 50 labeled examples

### Week 5+ (Full build with confidence)
1. Build full app with eval gates in CI
2. Every PR runs against golden datasets
3. Statistical validators block bad responses

---

## References

- `hamel-evals-integration-analysis.md` - Integration strategy
- `multi-agent/swarm-templates.md` - Swarm coordination patterns
- `multi-agent/hive-mind-templates.md` - Queen-coordinated workflows
- [Hamel's Evals FAQ](https://hamel.dev/blog/posts/evals-faq/) - Source methodology

---

*Document created: 2025-11-27*
*Purpose: Deep-dive evaluation guidance for survey analytics SaaS*
