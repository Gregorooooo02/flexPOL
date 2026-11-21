# Milestone 3 — Goal Planner and Emergency Buffer

Status: implemented (M3 scope). Fees and completion-screen handoffs are covered separately by M4–M5; persistence/export remains M6.

Parent plan: [Financial Roadmap and Practical Tools](financial-roadmap-plan.md).
Numerical source of truth: [Calculation contract](financial-tools-calculation-contract.md).

## 1. Outcome and scope

Replace the goal-planner and emergency-buffer previews with useful, deterministic calculators that work without completing the course or creating a roadmap first.

**Enter your own figures → calculate → understand the assumptions → explicitly apply chosen facts to the roadmap or select a practical action.**

Included:

- Working `/tools/goal-planner` and `/tools/emergency-buffer` pages.
- Validated inputs and documented date/rounding conventions.
- Contributions-only goal planning, with optional user-selected return/inflation illustrations.
- Accessible-savings buffer calculation with separate expense shortfall and buffer gap.
- Session-only tool drafts that survive internal navigation.
- Explicit loading of saved goal facts; no silent overwriting of either tool drafts or the roadmap.
- Confirmed roadmap application, unsaved-worksheet conflict protection, and an attached buffer summary.
- Existing related lesson/source links and explicit task selection.
- Accurate active-versus-preview messaging throughout the app.

Excluded:

- Fee calculator (M5); it remains an honest preview.
- Chapter/sandbox completion-screen buttons and Home redesign (M4).
- Bank/broker integrations, real-product data, recommendations, tax modelling, or forecasts.
- Persistent storage, export, reminders, multiple goals, or a full household budgeting engine.
- Passing personal figures to Hedgie or changing backend APIs/simulation behaviour.
- New chart/testing/state/form dependencies. Numerical cards and comparison tables are sufficient for M3; a chart is not required.

## 2. Existing code and integration constraints

- `tools/types.ts` already has discriminated raw drafts for all three calculators; `JourneySessionState.toolDrafts` and `set-tool-draft` already provide session storage.
- `App.tsx` currently routes both tools to `ToolPageShell`. Replace those two route elements only; leave `fee-impact` on its shell.
- M2 stores saved goal/profile separately from `setupDraft`. A calculator must not overwrite unfinished worksheet edits or manufacture a new saved goal with a placeholder name.
- `GoalBrief` already has target/date/saved/contribution facts. It has no place for expenses or a separate buffer plan; do not repurpose its target as an emergency target for an unrelated goal.
- `roadmap/calendar.ts` already provides local date-only helpers and clamped monthly addition. Reuse these, without changing M2's profile date semantics.
- `workspace/portfolio/money.ts` already provides cent parsing/formatting. Do not duplicate or change that parser's grouping and half-even rounding behaviour.
- `JourneyPage` currently describes active pages as a personal roadmap; make the active label configurable for standalone calculators.
- Roadmap task cards, Tools, and tool descriptions currently say Preview for every calculator. Availability must have one shared definition so the new tools are not still labelled unfinished.

## 3. User journeys

### A. Standalone goal planning

1. Open Goal planner from Tools; no roadmap setup is required.
2. Enter target, date, starting savings, and monthly contribution. Explicit zero is supported; blank is not silently zero.
3. Select **Calculate**.
4. See the contributions-only result, contribution dates/count, gap, and monthly contribution needed without assumed returns.
5. Change contribution or date and calculate again to compare the tradeoff. Never recommend a required investment return.
6. Optionally enable an illustrative return/inflation comparison; the baseline stays visible.
7. Optionally use the entered facts in a roadmap, or follow a related lesson.

### B. Plan using an existing goal

- Offer **Load my saved goal**, listing the fields that can be copied.
- Copy only existing saved facts, not an unsaved worksheet or profile answers. Missing saved values remain blank.
- If a tool draft already has edits, confirm before replacing it.
- Tool edits remain exploratory until **Use these inputs in my roadmap** is confirmed.
- Confirmation shows old/new goal values and preserves goal ID, title, profile, source, task statuses, and reflections.

### C. Standalone buffer check

1. Enter monthly essential expenses, accessible money designated for the buffer, separately earmarked expenses, and a chosen target in months.
2. Calculate and see available buffer, coverage where defined, target, gap, and any immediate expense shortfall separately.
3. Read the access/double-counting limitations.
4. Optionally keep the input facts as a buffer check alongside the active roadmap goal. This does not replace that goal's target/date/savings.
5. Optionally add **Check how you can access your money** to the existing task list.

No goal is needed to calculate. Keeping facts/tasks in a roadmap requires a goal; offer the real setup flow rather than silently creating one. Tool drafts survive that detour.

## 4. Input and numerical contract

Keep the existing contract authoritative. Resolve its wording “1–600 monthly periods” explicitly: zero completed contribution periods is a supported goal-planner edge case, while the maximum remains 600. Update that line in the same implementation change; do not leave contradictory documentation.

### Shared validation

- Inputs are raw strings in session drafts; parsed amounts are integer cents.
- EUR amounts: explicit values from 0 to EUR 1 billion, inclusive. Use the existing parser and a bounded raw-input length.
- Reject malformed, negative, nonfinite, or unsupported values. Show per-field errors and focus the first invalid control on Calculate.
- Native date `badInput` must be tracked, as M2 does, so an incomplete calendar edit is not mistaken for an intentionally blank date.
- Rate inputs use a separate documented decimal parser, not the money parser. Permit a decimal point or decimal comma, no grouping, a leading minus only for return, and at most four fractional digits.
- Return: −90% to +50% effective annual rate. Inflation: 0–50% annually. These are model limits, not recommended choices.
- No default positive return, no default buffer-month recommendation. Optional assumptions are disabled initially and require explicit values when enabled.
- Input bounds and derived-output bounds are distinct: valid large inputs with long positive compounding can exceed safe numerical precision.
- Refuse an advanced illustration if its values cannot be safely represented/displayed in cents; do not emit Infinity, silently clip, or round an unsafe integer. A valid contributions-only baseline should remain usable even when the optional illustration fails.

### Goal planner

Required for calculation: target amount, goal date, already-saved amount, monthly contribution. An explicit zero completes a monetary input; a blank does not.

- Calculation date is the user's current local calendar date, supplied explicitly to pure functions.
- Goal dates are today/future and no later than the clamped 600-month anniversary. A past date retained by M2 is allowed in the saved roadmap but must be updated before calculation.
- Count monthly contribution anniversaries from the original calculation date, clamping each independently. Do not advance repeatedly from a previously clamped date.
- First contribution is one calendar month after the calculation date, at period end. No time-zero contribution and no partial-month growth/contribution.
- Display the calculation date, goal date, first/last contribution dates where any, and number of included monthly periods.

Baseline:

```text
endingValue = savedCents + months × monthlyContributionCents
gap = max(0, targetCents - endingValue)
remainingBeforeContributions = max(0, targetCents - savedCents)
monthlyNeeded = ceil(remainingBeforeContributions / months)  // cents
```

Calculate the rounded-up required contribution with integer-safe arithmetic. For zero periods and an unfunded target it is unavailable, not Infinity. For an already-funded/zero target it is zero, including at a zero-period horizon. Clearly distinguish “no contribution date before this goal” from “no further contribution required”.

Optional illustrations:

- Convert effective annual return with `(1 + rate) ** (1 / 12) - 1` or an equivalent numerically stable expression.
- Each period grows the existing balance and then adds the contribution, without per-period cent rounding.
- Zero return must reproduce the baseline. Negative return is valid within bounds.
- Keep the required-contribution figure a contributions-only number; do not replace it with a risk-dependent recommendation.
- Inflation shows ending value in today's money separately. The entered target remains nominal at the goal date. Use the contract's `months / 12` adjustment and explain that fractional months are omitted.
- Show a comparison labelled **Contributions only** versus **Illustration using your assumptions**, not “expected” or “predicted”.

### Emergency buffer

Required for calculation: essential monthly expenses, accessible savings designated for this buffer, separately earmarked expenses, target months (whole number 0–60). An explicit zero is valid in every field.

Use the contract exactly:

```text
netAccessible = accessibleSavings - earmarkedExpenses
availableBuffer = max(0, netAccessible)
expenseShortfall = max(0, -netAccessible)
monthsCovered = availableBuffer / monthlyExpenses
targetAmount = targetMonths × monthlyExpenses
bufferGap = max(0, targetAmount - availableBuffer)
```

- Zero monthly expenses gives an undefined coverage ratio, not infinite coverage or proof of financial safety.
- Expense shortfall and buffer gap are separate and can both be positive.
- A zero-month target is a learner choice, not a recommendation; zero target/gap must not hide an expense shortfall.
- Show coverage with a consistent decimal precision, while target/gap calculations remain cent-exact.
- Do not model sustainable retirement withdrawals or assess whether a particular emergency target is suitable.

## 5. Calculation state and result freshness

Use explicit Calculate/Recalculate actions rather than showing results for half-entered inputs.

- Session provider owns raw tool drafts; calculated results stay local to the tool page and are derived from a validated input snapshot.
- Editing any relevant input immediately clears the previous result and its apply/save buttons. Do not display stale numbers under new inputs.
- Results include the calculation date. Before applying goal facts, validate against the current local date again; if the date has rolled over, ask the learner to recalculate.
- Returning to a tool restores its raw draft and asks for calculation again; do not imply that a stored result was restored.
- Loading saved goal values is explicit and also invalidates a prior result.
- Optional advanced inputs can be retained when disabled, but disabled assumptions are ignored and cannot block the baseline calculation.
- Refresh/logout/account change retains the current M2 clearing behaviour. **Clear my roadmap** also clears tool drafts; there is no separate hidden persistent tool cache.

## 6. Roadmap application and conflict protection

### Applying goal inputs

For an existing goal:

1. Show an old/new comparison of target, date, saved amount, and planned monthly contribution.
2. Clearly distinguish the learner-entered contribution from the calculated contributions-only amount needed. Apply entered facts by default; do not silently substitute the latter. If a separate **Try this monthly amount** action is offered, it first edits the draft and requires a fresh calculation/confirmation.
3. Apply only the four validated goal fields, not projected balances, assumed returns, inflation, title, profile, task statuses, or reflections.
4. Preserve goal ID/source and all existing task history. Recompute M2 observations from the updated saved facts.

For no saved goal:

- **Create a roadmap from these inputs** starts the real setup draft with the four facts prefilled and a stable new local ID.
- Require the learner to supply the goal name and use the normal review/save flow. Do not fabricate a name or auto-save a goal.

If any unsaved `setupDraft` exists, block tool-to-roadmap application and explain how to resume/save/discard that worksheet first. Keep calculations available. Never silently merge into or discard the draft.

Introduce a narrow reducer command for tool application, rather than passing a replacement object to generic `set-goal`. Guard expected active goal ID and absence of an unsaved worksheet at confirmation, not only when the dialog opens.

### Keeping a buffer check

Add a separate session-only `BufferPlan` attached to the active goal ID, holding its validated input facts and original source. Store no derived coverage/gap values.

- **Keep this buffer check in my roadmap** shows the facts to be kept and explicitly says it will not change the main goal.
- With no active goal, link to setup; keep the tool draft and require an explicit return/save after goal creation.
- Use the same unfinished-worksheet conflict protection.
- Roadmap shows a compact buffer section under constraints, calculated from the saved input facts, with **Edit buffer check** and a known-state distinction between “not added” and “zero”.
- Saving new goal facts/profile must preserve an existing buffer check for the same goal. Personal clear resets it; a different goal ID must never inherit it.

### Money separation

Do not automatically load goal savings into the emergency-buffer field. Label buffer money as excluding money assigned to other goals, and explain separately earmarked bills to avoid deducting an expense twice.

Before saving a buffer check alongside a goal, require an explicit self-reported confirmation that its money is not also counted toward that goal. Show the goal's currently recorded savings, including “Not provided” where appropriate. Numerical equality/inequality cannot establish whether funds overlap.

Record the goal-savings value known at that confirmation. If the goal's saved amount later changes, the roadmap marks the separation statement **Needs review** until the learner checks it again; never silently claim disjoint funds. This is a reminder, not bank verification or an aggregate budgeting system.

### Practical actions

- Goal planner offers the existing `define-one-goal` action; buffer offers `check-withdrawal-conditions`.
- Selecting a task is a separate explicit action, using existing goal/action deduplication and original source preservation.
- Calculating, reaching a numerical target, or applying facts never marks a task Checked, completes a lesson, changes quiz results, or awards sandbox stars.
- Real-world task instructions remain usable independently of tool results.

## 7. Implementation structure

Suggested new files:

```text
frontend/src/tools/
  GoalPlannerPage.tsx
  EmergencyBufferPage.tsx
  validation.ts
  calculations/
    goalPlanner.ts
    emergencyBuffer.ts
  components/
    GoalPlannerFields.tsx
    GoalPlannerResult.tsx
    EmergencyBufferFields.tsx
    EmergencyBufferResult.tsx
    GoalApplyDialog.tsx
    BufferApplyDialog.tsx
    RelatedLearning.tsx
```

Use small pure functions with typed validated inputs, results, and explicit error states. Reuse the existing date helpers and cent parsing. A small shared validation helper can be extracted from M2 if it removes genuine duplication, but do not change unrelated workspace logic.

State/type changes:

- Extend tool drafts with enabled-assumption flags, native date validity, and only the source/metadata needed for explicit loading/application. Keep the fee draft compatible for M5.
- Add `BufferPlan` and its saved-input/separation-review selector to roadmap/session types.
- Add narrow apply/save commands, while keeping existing M2 task and learning semantics unchanged.
- Derived outputs are never canonical session records; a saved buffer summary recomputes from its saved facts.

Existing files to update:

- `App.tsx`: route working pages for the two tools.
- `ToolsPage.tsx` / `toolDefinitions.ts`: shared availability; **Open** for working tools, **Preview** for fees.
- `ToolPageShell.tsx`: retain fee preview and extract reusable related-learning navigation where appropriate.
- `JourneyPage.tsx`: configurable active-tool label and accurate session-only wording.
- `roadmap/components/RoadmapActionCard.tsx`: correct related-tool action label by availability.
- `RoadmapPage.tsx`: working tool entry and buffer summary; stop describing all calculators as previews.
- `JourneySourceNotice.tsx`: retain validated contextual relevance/return links, with no numerical data in URLs.
- `knowledge/` and its generators: any new educational tool explanations/actions stay grounded in the authored content; never put assumptions into scenario scoring.

Reuse existing shadcn/Base UI controls (`Field`, `Input`, `ToggleGroup`, `Dialog`, `Card`, `Table` only if already installed), semantic tokens, and responsive container conventions. Check installed controls/current docs before implementation; avoid adding dependencies for simple output presentation.

## 8. Delivery sequence

| Step | Work | Acceptance |
|---|---|---|
| 1 | Clarify calculation contract edge cases; extend types, validation and result errors | Zero-period horizons and safe output bounds are unambiguous |
| 2 | Implement pure goal/buffer arithmetic and contribution-calendar construction | Reference arithmetic and month-end boundaries agree with the contract |
| 3 | Build standalone Goal planner, assumptions and result freshness | Useful baseline without returns; blanks/invalid inputs never masquerade as zero |
| 4 | Build standalone Emergency buffer | Shortfall, gap and undefined coverage remain distinct |
| 5 | Add explicit goal loading/application, buffer saving and conflict guards | Drafts/tasks/profile cannot be overwritten accidentally |
| 6 | Add roadmap buffer summary, money-separation review and explicit tasks | No automatic cash transfer, target replacement or completion claim |
| 7 | Update availability/copy, verify navigation/responsiveness/privacy and document | Two working tools, one fee preview, no backend/persistence changes |

## 9. Verification

Follow the repository testing policy: no new frontend runner/dependency and no backend tests unless implementation changes backend behaviour (none is planned).

Run production build, frontend lint, generated-content check, existing SQL generation after knowledge edits, and `git diff --check`. Update `AGENTS.md` with the working routes, draft/application rules, saved buffer representation, numerical conventions and remaining preview scope.

Manually check numerical reference cases from the calculation contract, plus:

- Calculation date 2026-01-31 → goal 2026-03-30 includes one contribution (February 28); → March 31 includes two. Clamping must not drift March to the 28th.
- January 31, 2028 → February 29 includes one; same-day/before-first-anniversary goal includes zero.
- EUR 2,000 target / EUR 1,000 saved / three periods → EUR 333.34 monthly needed.
- Already-funded and zero targets, explicit zero contributions, and maximum horizon.
- Zero return reproduces baseline; negative return works; optional-output overflow produces a clear error without destroying a valid baseline.
- Zero inflation gives unchanged real/nominal labels; nominal target is not silently inflated.
- EUR 6,000 accessible / EUR 1,000 earmarked / EUR 1,000 monthly / six-month target → five months covered and EUR 1,000 gap.
- EUR 500 accessible / EUR 800 earmarked → EUR 300 expense shortfall; a positive buffer target can still have a separate gap.
- Zero expenses → undefined coverage, never Infinity; zero target months does not hide a shortfall.

Manual journey checks:

- [ ] Both calculators work without a roadmap and accept explicit zeros without inventing missing inputs.
- [ ] Invalid grouping, negative/too-large amounts, partial/impossible/past dates, rates and target-month bounds are explained/focused.
- [ ] Results identify assumptions/date; edits invalidate results and apply actions; return navigation restores inputs without pretending to restore a calculation.
- [ ] Saved goal loading does not erase an exploratory draft without confirmation.
- [ ] Applying goal facts shows old/new values and preserves ID, title, profile, tasks, status and reflections.
- [ ] No-goal application uses real setup; unsaved worksheet conflicts cannot lose edits.
- [ ] Buffer saving never replaces a different goal's target/date or automatically copies its savings.
- [ ] Separation confirmation is explicit; changing goal savings prompts review rather than silently assuming no overlap.
- [ ] Task selection remains idempotent and never auto-completes a task/lesson/scenario.
- [ ] Narrow screens, dark mode, keyboard/focus, open coach sidebar, long values, refresh/logout/account clearing work as documented.
- [ ] No personal figures in URLs, logs, network payloads, local storage, or automatic coach context.
- [ ] Fees remains a preview, while every link to the two implemented tools uses accurate availability wording.

## 10. Definition of done

A learner can calculate a goal plan or buffer check with their own figures, understand the limits, compare a changed input, and explicitly keep appropriate facts or a next action in their existing roadmap—without a forecast, personalised investment recommendation, data loss, or double-counting being silently assumed away.

## Verification record

- Production build and frontend lint pass with existing chunk-size/Fast Refresh warnings only; no dependency or backend behaviour changes.
- Browser checks cover blank validation/focus, standalone goal/buffer results, optional assumptions, invalidating stale results on edit, restored drafts without cached calculations, explicit saved-goal loading/cancellation, genuine no-goal setup, entered-versus-required contribution, roadmap confirmation, task selection, unfinished-worksheet protection, and keeping profile/task data intact.
- Buffer checks cover explicit separation before saving, a summary separate from the main goal, review after goal savings change, the sticky review flag even if savings change back, explicit rechecking, and separate shortfall/gap/undefined coverage cases.
- Manual pure-function checks cover calendar clamping/leap dates, zero periods, upward cent rounding, zero/negative return, inflation semantics, advanced precision overflow retaining the baseline, validation bounds, guarded goal/buffer commands, sticky separation, and personal reset preserving learning.
- Narrow-screen layouts and theme/sidebar behaviour were inspected; no page-level horizontal overflow. Tool availability labels distinguish working goal/buffer tools from the fee preview.
- Personal figures remain in browser session memory, not URLs, API payloads, local storage or automatic coach context. No new test runner was added.
