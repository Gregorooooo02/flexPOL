# M4–M5 — Completion Handoffs and Fee Comparison

Status: implemented. M6 persistence/export remains out of scope.

## M4: theory to practical action

- Successful real lessons and tests offer authored next steps, one primary destination and at most two alternatives. The completion footer can focus the handoff without navigating away.
- Earned chapter completion requires all lessons plus the final quiz, excluding demo shortcuts. Failed tests keep retry/review; a passed final test after demo prerequisites can explore a concept but is not labelled an earned chapter.
- Both Sandbox result surfaces expose **Apply this to your life** only after replay finishes, independent of stars. The handoff warns before leaving and never transfers fictional financial facts.
- **Save next step and stay here** does not change the run. It saves a To do task for an existing goal, or a session-only public action/source entry if no goal exists. Roadmap offers explicit adoption after setup, preserving source and deduplicating without resetting checked tasks/reflections.
- Home has a public planning CTA with login return and a session resume card. Only public task labels/counts appear, never personal goal names/figures/notes.
- Incoming validated context can explain a new lesson/scenario connection while existing tool figures and unfinished worksheet data stay untouched.

## M5: fees and complete connections

- `/tools/fee-impact` implements two fee structures on one shared timeline with user-entered starting amount, contribution, years, gross return and fees. Required fields distinguish blank from zero.
- Each month grows the balance, deducts the effective monthly proportional fee, then adds a contribution. No per-period rounding. Results show each ending value, summed deductions, zero-fee reference, end-value gaps and signed A-minus-B difference separately.
- Rates/horizons follow the calculation contract; overflow is a recoverable full-comparison error. No product winner/suitability claim, transaction costs, spreads, fixed charges, entry/exit fees or taxes.
- The generator validates effective handoffs for all current lessons, chapters and scenarios (26 sources). Ordered overrides are authored in knowledge, not inferred from titles or numeric database IDs.
- All three tools offer generic Hedgie help with public-only scope and fixed prompts. Numeric tool fields/results and personal roadmap data are not added to coach context.

## Verification

- Frontend build/lint, generated-content check and diff checks pass with existing warnings only. The existing SQL generator runs with unchanged seed output.
- Manual pure checks cover fee reference arithmetic, equal/zero fees, negative return, contribution timing, precision errors, input boundaries, all source coverage, ordered chapter destinations and idempotent pending-step/task adoption.
- Browser walkthrough covers public Home login return, fee validation/results/stale-result clearing/overflow, real lesson completion and contextual navigation, demo exclusion, failed final-test retry, and no false earned-chapter claim after demo prerequisites.
- An actual all-cash scenario run covered result and persistent-card handoffs, one active dialog, save-and-stay without a goal, explicit leave warning/cancel, preserved result controls, topic-only tool navigation, Home resume and explicit pending-step adoption.
- Generic coach request was inspected and deliberately blocked before model/network execution: no financial figures, output, numeric answer or scenario allocation was included.
- Mobile/dark fee results were inspected without horizontal page overflow. Existing tool calculations, profile/task retention, mock login and simulation scoring remain unchanged.
- Follow-up checks covered new incoming context with an existing tool/worksheet draft (figures/edits preserved), context-aware continuation, a mobile sandbox handoff, save-and-stay with an existing goal, and focus into/out of the leave warning.
- No frontend test runner, dependency, backend endpoint/entity/migration, persistent storage or automatic redirect was added.
