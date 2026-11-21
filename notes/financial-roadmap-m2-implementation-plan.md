# Milestone 2 — Goal, Profile, and Actionable Roadmap

Status: implemented. M2 is session-only; calculators and completion-screen handoff buttons remain later milestones.

Parent plan: [Financial Roadmap and Practical Tools](financial-roadmap-plan.md).

## 1. Outcome and scope

Turn the existing `/roadmap` and `/roadmap/setup` previews into a working, session-only personal planning flow:

**Define one goal → describe constraints → review observations → choose practical actions → record discoveries.**

At the end of M2 a learner can create/edit a partial goal, understand tensions or unanswered questions in their profile, select up to any number of authored actions over time, change task status, and add an optional reflection. Suggestions are limited to three at a time; saved actions are not limited to three.

Included:

- One active goal and a short goal-specific profile.
- Editable setup draft that survives internal navigation separately from the saved plan.
- A useful roadmap summary, distinct profile observations, and deterministic next-step suggestions.
- Task selection, deduplication, status changes, reopening, and optional reflection.
- Relevant existing lesson links and source attribution using M1 connections.
- Accurate privacy/availability messages now that personal fields exist.
- Clear personal-roadmap control, without resetting course progress.

Excluded:

- Calculators/projections/goal-gap calculations: M3 and M5.
- New chapter/sandbox result handoff buttons and Home resume redesign: M4.
- Device/server persistence, export, reminders: M6 or later.
- Bank/broker integrations, real-product recommendations, allocation recommendations, readiness scores.
- New AI personal-data context, backend endpoints/entities, or dependencies.

## 2. Current code to build on

- `roadmap/types.ts` already defines `GoalBrief`, `GoalProfile`, `RoadmapAction`, and known profile sections.
- `journey/journeySessionReducer.ts` already stores one goal, profile, tool drafts, actions, and learning metadata. It has separate `set-goal`/`set-profile` actions but no setup draft, atomic setup save, or personal-roadmap reset.
- Task selection already deduplicates by goal ID + action ID. Preserve that identity and original source when revisiting a suggestion.
- `knowledge/practical-actions.json` already supplies six actions and relevance copy. Reuse those IDs; do not make a second competing task catalogue.
- `connections.generated.ts`, `connections.ts`, `routes.ts`, and `learningLinks.ts` already supply safe public context and lesson destinations.
- `JourneyPage.tsx` currently forces preview badges and says no financial figures are collected. That must become page-specific before enabling forms.
- Tools remain previews. A suggested real-world action must remain usable without a working calculator; a calculator link must say **Preview**, not **Calculate**.

## 3. User journeys

### New learner

1. `/roadmap` shows a clear empty state and **Create my goal**.
2. Setup presents three short steps: **Goal**, **Constraints**, **Review**.
3. Only a goal name is required to save. Amount/date/savings/contribution and profile answers can remain unknown.
4. Review shows the entered facts, explicit missing information, and educational observations.
5. **Save for this session** saves goal/profile together and returns to the roadmap.
6. Roadmap offers up to three relevant actions, each with a reason and **Add to my next steps**.

### Edit an existing goal

- **Edit goal/profile** opens the saved values under the same goal ID.
- Draft edits do not change the roadmap's saved facts or suggestions until saved.
- Navigating to Learning/Tools and back retains both saved state and the unsaved draft. Roadmap offers **Continue editing** when a draft exists.
- **Discard changes** restores the last saved facts; for a never-saved goal it clears the draft and returns to the empty state. Confirm if there are edits.
- Saving edits recomputes observations/suggestions but never silently removes selected actions, statuses, or reflections.

### Enter through a contextual link

- Keep `?section=risk&from=lesson&ref=1.4` and other allowlisted M1 sources working.
- Map `goal` to the Goal step; `liquidity`, `risk`, and `knowledge` to their fields in Constraints; `review` to Review.
- Focus/scroll to the requested section once it is rendered, without resetting a draft or repeatedly stealing focus.
- Unknown/repeated section selectors fall back to the normal setup entry, never arbitrary content.
- Source context is attribution, not proof of passing a lesson or completing a sandbox. No fictional amounts or allocations are imported.

### Act and reflect

- Adding a suggestion creates a user-selected task; merely viewing it does not.
- Task states: **To do**, **Checked**, **Later**, **I got stuck**.
- A checked task can be reopened. Statuses are reversible and self-reported.
- Optional **What did you discover?** note has explicit save/cancel and can be cleared.
- **I got stuck** exposes related lessons and the authored task instructions. It must not depend on AI or an unfinished calculator.

## 4. Form contract and validation

Use the existing Base UI/shadcn `Field`, `FieldGroup`, `FieldSet`, `Input`, `Textarea`, `ToggleGroup`, `Button`, and `Dialog`. Consult current component docs at implementation time. Use native date input rather than adding a date-picker dependency.

### Goal step

| Field | Rule |
|---|---|
| Goal name | Required to save; trimmed, 1–80 characters |
| Target amount | Optional; EUR, nonnegative integer cents after parsing, maximum EUR 1 billion |
| Target date | Optional; actual ISO calendar date, not a normalised impossible date |
| Already set aside | Optional; same amount rules; only money designated for this goal |
| Monthly contribution | Optional; same amount rules; no contribution recommendation |

Reuse `parseAmountInput`/`formatMoney` from `workspace/portfolio/money.ts`, without modifying their existing semantics. Raw text lives in the draft; validated facts live in `GoalBrief`.

- Blank is unknown; explicit `0` is a valid known amount. Do not turn blanks or malformed input into zero.
- Show a short formatting hint consistent with the shared parser, including the thousands-separator behaviour.
- New/changed dates must be today or later and within the existing 50-year tool horizon. Use local calendar dates, not timestamp parsing that shifts dates across time zones.
- A previously saved date becoming past does not erase the goal or break the page. Offer a review observation; allow unchanged old dates during unrelated edits with a warning.
- Saving with a known target smaller than current savings is allowed; do not calculate a gap in M2.
- Malformed entered values block save; missing optional values do not.

### Constraints step

Keep the existing separate profile dimensions:

- **Access:** could some money be needed earlier? (`early-access`, `no-early-access`, `unknown`).
- **Capacity:** would losses affect essential needs, delay the goal, or be absorbable within a flexible plan? (`essential-needs`, `delay-goal`, `flexible`, `unknown`).
- **Willingness:** response to a hypothetical decline (`uncomfortable`, `uncertain`, `comfortable`, `unknown`). Clearly label the example hypothetical; this is not a validated risk questionnaire.
- **Knowledge:** self-described familiarity (`starting`, `some`, `experienced`, `unknown`). Do not infer topic-specific mastery from this one answer.
- **Questions to revisit:** optional plain-text note, maximum 500 characters; add `reviewNotes` to `GoalProfile`.

All profile questions are optional. Provide an explicit **Not sure** answer distinct from unanswered, and a way to clear an existing answer. Do not use age as a proxy for risk capacity.

### Review step

Show entered facts, unknown values, and separate observations. Use **Not provided** for blanks and **Not sure** for explicit unknown answers. Include **Edit** links to the corresponding steps and **Save for this session**.

Block completion only for malformed inputs or the missing goal name. Announce validation errors and focus the first invalid field. Let users move backward without validating unrelated fields; optional questions must not become hidden gates.

## 5. State changes and save semantics

Update `roadmap/types.ts` with a `RoadmapSetupDraft`: stable local goal ID, raw goal field strings, profile selections, review note, and the original validated source. Keep all personal fields out of query strings and route `state` objects.

Update `JourneySessionState`/reducer:

1. Add `setupDraft: RoadmapSetupDraft | null`.
2. Add explicit start/resume, update-draft, discard-draft, and atomic `save-roadmap` actions.
3. Generate a local ID once when starting a new draft; the reducer remains pure. Repeated initialisation under Strict Mode must not replace an existing draft.
4. Save parsed goal/profile together for that ID, then clear the draft. The review must not briefly display a new goal with the old profile.
5. Retain `set-goal`/`set-profile` only where their behaviour remains useful for later tool application; M2 setup submits through the atomic action.
6. Keep task insertion idempotent and preserve source/status/reflection on duplicate add.
7. Restrict task edits to the active goal. Make updating status independent from updating reflection, so either can change without wiping the other. Explicit `''` must clear a reflection.
8. Add `clear-roadmap`: clear goal, profile, draft, selected tasks, and personal tool drafts; preserve all learning completion/resume metadata.

The provider remains keyed by normalised email. Same-email recovery login retains state; logout/account change destroys it immediately. Neither drafts nor saved plans survive a refresh in M2.

## 6. Deterministic observations and suggestions

Add pure modules:

- `roadmap/profileObservations.ts`: saved/draft goal + profile + explicit `today` calendar date → plain observation IDs/severity categories.
- `roadmap/roadmapSuggestions.ts`: observations + known facts + validated source + already selected task IDs → up to three authored actions with reason IDs.
- `roadmap/validation.ts`: parse/validate drafts without React or side effects.

Do not build a generic expression/rules engine. Use a short, typed set of explicit conditions. Derive results when facts change; do not store observations or suggestions as canonical state.

Initial rules:

| Known facts | Observation / next step |
|---|---|
| Missing target/date | Clarify what is still unknown; offer `define-one-goal` |
| Early access may be needed | Explain access conditions; offer `check-withdrawal-conditions` |
| Comfortable with fluctuations + essential-needs/delay-goal loss capacity | Explain willingness versus capacity; offer `review-goal-risk` |
| Comfortable with fluctuations + known date less than 24 calendar months away | Explain the timing tension without recommending an asset; offer `review-goal-risk` |
| Explicit “Not sure” or starting knowledge | Offer a relevant question/lesson, not a confident conclusion about capacity or competence |
| Goal date passed or review note present | Invite review; offer `review-after-life-change` where relevant |
| Contextual lesson/scenario has a matching action | Prefer that authored connection among otherwise equally relevant suggestions |

The short-horizon rule uses calendar-month comparison and the lesson's under-two-years boundary, not a fabricated risk score. Unknown capacity/access answers must never be treated as evidence of flexibility or safety.

Ordering: concerns supported by answers → missing foundational facts → contextual actions → general research actions. Use stable IDs as tie-breakers. Prefer distinct actions; exclude already selected actions in every status, including Later/Checked/Stuck, rather than suggesting duplicates.

Show one sentence explaining each suggestion. No recommendation is automatically selected. If fewer than three actions are relevant, show fewer. Provide **Browse practical actions** for access to the rest of the small catalogue.

Authored observation/reason strings belong in a new `knowledge/roadmap-guidance.json`; conditions stay in TypeScript. Extend the existing generator to validate allowed guidance IDs and referenced action IDs and to emit a separate client-safe guidance module. Do not include private fields, quiz answers, or scenario evaluation data. Re-read the relevant source lessons before finalising the educational wording.

### No readiness score

Show separate observations, not a summed investor type or risk band. No “ready to invest” badge. In M2, checklist counts such as **2 actions checked** are enough; do not introduce a percentage that could be mistaken for financial readiness.

## 7. Roadmap screen

Replace the placeholder cards in `RoadmapPage.tsx` with:

1. **My goal:** entered facts with Edit; missing values labelled explicitly; draft-resume notice when applicable.
2. **My constraints and questions:** separate profile observations and optional learner note.
3. **Suggested next steps:** at most three authored actions with a reason and Add button.
4. **My next steps:** selected tasks grouped by status, with instructions, state controls, reflection, and related learning.
5. **Explore further:** Learning/Scenarios links and honestly labelled calculator previews.

If no goal exists, show the setup CTA and optional explanation of the tools. Do not require a completed chapter, passed quiz, sandbox run, or score to create a goal or choose a task.

Suggested components:

- `roadmap/components/GoalSummary.tsx`
- `roadmap/components/ProfileObservations.tsx`
- `roadmap/components/SuggestedActions.tsx`
- `roadmap/components/RoadmapActionCard.tsx`
- `roadmap/components/GoalFields.tsx`
- `roadmap/components/ProfileFields.tsx`
- `roadmap/components/SetupReview.tsx`

Keep components controlled by props where practical. The existing session provider owns durable-in-session data, not each card. Local state is appropriate for open dialogs and transient focus/error UI.

## 8. Connections and availability

- Use action `lessonCodes` and existing `lessonPath` helpers for **Review this concept**. Locks remain enforced by M1; self-reported experience never unlocks lessons.
- Retain incoming `from`/`ref` through setup/review navigation and capture the original source on task selection. An existing unsaved draft keeps its source rather than being silently overwritten by a new link.
- Lesson/scenario source metadata cannot mark an action Checked or a learning node completed. All task completion remains user-driven.
- Show research/checklist instructions as a useful action even when the action's associated calculator is a preview. Do not put an unfinished calculator ahead of the task itself.
- Do not add a per-task coach call that embeds personal facts or reflection text. Existing general coach access can remain, but no new data is automatically shared.
- Fix `JourneySourceNotice` matching for setup destinations: compare the validated requested profile section as well as pathname, so a `section=knowledge` link does not show the first unrelated profile reason.

M2 only consumes existing sources and exposes links within Roadmap. Buttons on chapter/sandbox result screens remain M4 work.

## 9. Privacy and accurate copy

Make `JourneyPage` accept explicit preview/active status and page-specific privacy content. Update Roadmap/setup and Tools copy together:

- Roadmap/setup: remove “forms are not available” and blanket “Preview only”. Explain that the feature works for the current session.
- Tools/calculator shells: retain their preview status and unavailable-calculator explanation.
- Replace the global “No financial figures are collected” statement with accurate wording: entries stay in browser memory, reset on refresh/logout/account change, and are not automatically sent to the server or Hedgie.
- **Save for this session** must not imply a database save or future login restoration.
- Add **Clear my roadmap** with a confirmation dialog. Explain that this clears personal drafts/tasks/tool drafts but keeps session learning progress. Do not offer an export or device-saving control before M6.
- No balances, goal titles, answers, or notes in URLs, logs, analytics, coach prompts, or API payloads. React-rendered plain text only; no Markdown/HTML interpretation of user notes.

## 10. Delivery sequence and file changes

| Step | Work | Main files |
|---|---|---|
| 1 | Extend contracts, draft lifecycle, atomic save, and personal-data reset | `roadmap/types.ts`, `journey/journeySessionReducer.ts` |
| 2 | Author observation/reason copy and generate validated guidance | `knowledge/roadmap-guidance.json`, `scripts/generate-practical-actions.mjs`, new generated guidance module |
| 3 | Implement pure validation, observations, and suggestion selection | new `roadmap/validation.ts`, `profileObservations.ts`, `roadmapSuggestions.ts` |
| 4 | Build the three-step create/edit/review form | `RoadmapSetupPage.tsx`, new setup components |
| 5 | Build live summary, suggestions, selected tasks and reflections | `RoadmapPage.tsx`, new roadmap components |
| 6 | Correct contextual section matching and active/preview/privacy copy | `JourneyPage.tsx`, `JourneySourceNotice.tsx`, Tools pages |
| 7 | Verify and document behaviour | `AGENTS.md`, this plan, parent roadmap plan |

No changes to backend entities/DTOs/API, existing quiz rules, sandbox scoring, or workspace state ownership. No dependency changes planned.

## 11. Verification

Follow the repository policy: no new frontend runner/test dependency, no new backend tests when backend behaviour is unchanged.

Run:

```text
node scripts/generate-practical-actions.mjs
node scripts/generate-practical-actions.mjs --check
node scripts/generate-content-sql.mjs
npm run build                         (frontend/)
npm run lint                          (frontend/)
git diff --check
```

Manual acceptance checks:

- [ ] Save a goal with only a name; missing fields remain unknown and the roadmap is useful.
- [ ] Enter invalid amounts/dates; validation explains errors and focuses the first invalid field. Explicit zeros remain zeros.
- [ ] Leave optional profile fields unanswered, select Not sure, and clear a previous answer; these states stay distinct.
- [ ] Comfortable-with-losses plus essential-needs risk or a near date produces a tension explanation, not an allocation or investor label.
- [ ] Start editing, visit Learning/Tools, return, and resume the unsaved draft; saved suggestions remain unchanged until save.
- [ ] Discard changes restores saved facts; save keeps the goal ID and existing task history.
- [ ] Repeatedly add the same task from different sources; one task remains with its original source/status/reflection.
- [ ] Change/reopen every task status; write, cancel, save, and clear a reflection without losing status.
- [ ] Change profile answers; selected tasks remain, recommendations update, and already selected tasks are not suggested again.
- [ ] Follow each `section` deep link and invalid/repeated selectors; correct focus/relevance without losing draft edits.
- [ ] Clear personal roadmap; goal/profile/tasks/drafts clear, but learning completion remains.
- [ ] Refresh/logout/account switch clears personal session data as advertised; same-email recovery login preserves it.
- [ ] Verify desktop/mobile, open coach sidebar, dark mode, keyboard navigation, validation focus, and wrapping of long text/amounts.
- [ ] Inspect network, storage and URLs: no new personal-data writes or automatic AI context. Existing public content fetches remain allowed.
- [ ] Calculator pages still say Preview and never pretend to calculate.

## 12. Definition of done

A learner can create a partial goal, save a goal-specific profile for the session, understand separate observations and unknowns, choose a practical action, leave and return, edit the plan without losing tasks, and record a discovery—all without AI, calculators, a sandbox score, or persistent sensitive-data storage.

The next milestone implements goal/buffer arithmetic on this state. It does not need to rebuild setup, task identity, or personal-data ownership.

## Verification record

- Production build and frontend lint pass, with existing large-chunk/Fast Refresh warnings only; no new dependencies or backend behaviour changes.
- The extended practical-action/guidance generator and `--check` pass. The existing SQL generator completes with unchanged SQL output.
- Browser walkthrough covered name-only save, malformed amount validation/focus, unanswered versus Not sure, explicit zeros, separate timing/capacity observations, session draft navigation, discard versus atomic save, and preserving selected tasks while editing profile answers.
- Task checks covered every status, focus after moving between groups, duplicate selection, reflection save/cancel/clear, stuck guidance, and learning-only preservation when personal data is cleared.
- Mobile/dark-mode Roadmap and the actual constraints form were inspected without horizontal page overflow. Existing source/deep links, section focus/relevance, and honest calculator-preview messaging were checked.
- Follow-up session checks verified every profile-section deep link, repeated-selector fallback, diversification-specific relevance, refresh clearing a saved personal goal, and logout/login as another learner without exposing the previous roadmap.
- Manual pure-function checks covered inclusive cent/date bounds, impossible/leap dates, unchanged saved past dates, the strict 24-calendar-month boundary, unknown answers, suggestion exclusion, idempotent draft creation, goal-scoped task changes, atomic save, and personal reset preserving learning.
- No frontend test runner, persistent personal-data storage, personal-data API endpoint, or AI context was introduced.
