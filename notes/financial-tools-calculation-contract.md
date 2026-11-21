# Financial Tools — Calculation Contract

Status: foundation contract for M3 (goal/buffer) and M5 (fees). No calculations run in M1 previews.

## Shared conventions

- EUR only. Validated starting amounts/contributions/expenses are integer cents, parsed and displayed through `workspace/portfolio/money.ts`. Empty input is unknown, not zero. Reject negative amounts, malformed grouping, nonfinite values, and amounts outside the tool's documented bounds.
- Initial implementation bounds: each amount EUR 0–1,000,000,000; horizons 1–600 monthly periods; annual return −90% to +50%; annual inflation 0–50%; annual percentage fee 0–20%. These are modeling limits, not recommended assumptions. No default positive return is required for a useful result.
- Use effective annual rates entered as percentages. For calculations convert them to fractions. A monthly rate is `(1 + annualRate) ** (1 / 12) - 1`, not `annualRate / 12`.
- Contributions are made at the end of each monthly period. Each period first grows/charges the existing balance and then adds that period's contribution. No contribution is made at time zero.
- Keep full floating-point precision for modeled growth, fees, and inflation; round monetary displays consistently to cents using the shared formatting boundary. Do not repeatedly round every period. Validate all derived values are finite and display a clear range error rather than Infinity/NaN.
- The displayed ending-value difference is calculated from unrounded modeled values, not the difference between already-rounded labels. State that rounding can produce a cent difference in displayed totals.
- These are deterministic arithmetic illustrations, not probabilities, forecasts, or synthetic market histories. AI must never provide their numeric outputs.

## Goal planner

Required facts: target amount and target date. Current savings and contribution are optional until a calculation is requested; ask for an explicit zero rather than silently treating a blank as zero.

Use the user's local calendar date as the calculation date. Compute completed monthly contribution anniversaries up to and including the goal date: add each month to the original calculation date, clamp the original day to that month's last day, and never let clamping drift subsequent anniversaries. The first contribution is one calendar month after the calculation date. A goal before the first anniversary has zero periods; show current savings, remaining gap, and explain that there is no monthly contribution date before the goal.

The baseline assumes zero investment return:

```text
contributionsOnly = currentSavings + months × monthlyContribution
gap = max(0, target - contributionsOnly)
monthlyNeeded = max(0, target - currentSavings) / months
```

Round `monthlyNeeded` upward to the next cent so a contributions-only plan does not undershoot the target. For zero periods it is undefined, never a division by zero. A zero target/already-funded goal has no remaining contribution requirement. Past dates are invalid.

Optional advanced illustrations use a user-selected annual return. Run the same monthly recurrence as the baseline with monthly growth before each contribution; zero return must reproduce the baseline. Do not reverse-solve a required investment return or suggest more risk to close a gap.

If inflation is enabled, the entered target remains a nominal amount at the target date. Show ending value in today's money separately as `nominalEndingValue / (1 + inflation) ** (months / 12)`. Do not silently reinterpret the target or mix nominal and real values. Explain omitted partial-month growth at the horizon boundary. A future option for a target expressed in today's prices would require an explicit input mode.

## Emergency buffer

Inputs: monthly essential expenses, accessible savings, separately earmarked unavoidable expenses, learner-selected target months (0–60, whole months).

```text
netAccessible = accessibleSavings - earmarkedExpenses
availableBuffer = max(0, netAccessible)
expenseShortfall = max(0, -netAccessible)
monthsCovered = availableBuffer / monthlyEssentialExpenses
targetAmount = targetMonths × monthlyEssentialExpenses
bufferGap = max(0, targetAmount - availableBuffer)
```

For zero monthly expenses, the coverage ratio is undefined: display “Enter essential monthly expenses to estimate coverage”, not infinite months. Show earmarked-expense shortfall separately from the buffer gap. Both can exist, and must not be hidden in a single clamped number.

Explain that earmarked expenses must not already be included in the monthly-expense estimate. Never import all savings from the goal into the buffer automatically: the learner must designate which money belongs to each purpose to avoid double-counting.

Target months are a learner choice, not a universal recommendation. This calculation does not assess insurance, debts, future income, pension adequacy, or sustainable withdrawal rates.

## Fee impact

Inputs: starting amount, end-of-month contribution, whole horizon years (1–50), shared effective annual gross return, annual percentage fees for A and B. Model annual fees as an effective annual proportional deduction, converted to a monthly deduction rate `1 - (1 - annualFee) ** (1 / 12)`.

For each monthly period and each option:

```text
afterGrowth = priorBalance × (1 + monthlyGrossReturn)
feeDeducted = afterGrowth × monthlyFeeRate
endingBalance = afterGrowth - feeDeducted + monthlyContribution
```

Also run the same timeline with zero fees. Keep a sum of actual modeled fee deductions for each option.

Display separately:

- Ending value of A and B.
- Sum of modeled fees deducted for each.
- Difference between the ending values.
- Optional fee impact versus the zero-fee model, explicitly including forgone compounding, not labelled “fees paid”.

Equal fees must produce equal values; zero fees must produce no deductions. Negative gross returns remain supported within the shared limits. Options share all assumptions except the annual fee. Exclude transaction fees, spreads, fixed charges, entry/exit fees, and taxes prominently.

Lower modeled fees do not imply better risk, returns, service, protection, or suitability.

## Reference arithmetic for manual verification during implementation

- EUR 1,000 saved + EUR 100/month for 12 periods, zero return → EUR 2,200.
- EUR 2,500 target, EUR 1,000 saved, 12 periods → EUR 125/month needed.
- EUR 2,000 target, EUR 1,000 saved, 3 periods → EUR 333.34/month needed.
- EUR 6,000 accessible, EUR 1,000 earmarked, EUR 1,000 essential expenses/month → 5 months covered; a 6-month target leaves EUR 1,000 buffer gap.
- EUR 500 accessible and EUR 800 earmarked → zero available buffer plus EUR 300 expense shortfall, regardless of the separately calculated buffer gap.
- EUR 10,000, no contributions, zero gross return, 1% annual effective fee, 12 periods → EUR 9,900 ending value, EUR 100 modeled fees deducted (within floating-point tolerance).
- Same assumptions and fee for A/B → zero difference. Annual fees of zero → zero deductions.

These are documented manual calculation checks, not a new test runner. Revisit this contract explicitly if implementation needs to change an assumption.
