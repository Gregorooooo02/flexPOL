# Milestone 1 — Roadmap Foundation: Implementation Plan

Status: implemented (foundation scope). Verification is recorded below; subsequent milestone status is tracked in the parent plan.

Parent plan: [Financial Roadmap and Practical Tools](financial-roadmap-plan.md).

## Objective

Establish reliable routes, learner-scoped session state, learning continuity, and authored connections before implementing profile forms and calculators.

**Acceptance journey:** complete a lesson → navigate to a tool shell → follow a contextual return link → retain course completion and locks. Sign out or switch learner → previous personal session state disappears.

## Scope

Include:

- Typed contracts for roadmap data, tool drafts, navigation sources, and learning completion provenance.
- Authenticated roadmap/tool page shells with explicit unavailable-feature messaging.
- Session-only shared state surviving route changes.
- Refactor existing learning progress out of the route-local component.
- Validated lesson/chapter deep links and safe contextual return links.
- Authored public connection catalogue and its generator/validator.
- Documented calculator conventions for M3/M5.
- Application convention updates in AGENTS.md.

Exclude:

- Working profile forms, calculators, recommendations, task editor, persistent storage, export.
- Chapter/sandbox completion CTAs and Home resume redesign: these belong to M4.
- Backend/API/schema changes, new packages, AI context changes, saved replay restoration.
- Cross-refresh or cross-device learning restoration.

## Current implementation constraints

- `LearningPathDemo.tsx` owns its reducer inside `LearningPathView`; leaving `/learning` discards completions.
- That reducer also owns transient banner messages and demo complete-chapter/reset controls.
- `LessonModal.tsx` reports `onComplete(node.id)` after successful practice/final tests. Practice retries are allowed, while saved attempts preserve first answers.
- `RequireAuth.tsx` already supports returning after login; reuse it for all new routes.
- `AuthProvider.tsx` can refresh the same learner after a backend restart, potentially receiving a new numeric user ID. Identify the session owner by normalised email, not database ID or display name.
- `AppLayout` owns the main landmark, header, and coach shell. New pages render content, not a second main element.
- Source scenario JSON uses string `id`; the public API exposes that as `Scenario.slug`. Numeric API IDs must be resolved from fetched briefs, not embedded in authored mappings.
- Existing catalogue/history/portfolio state stays where it is. This milestone does not create a global store for the entire application.

## Execution order

### Step 1 — Define contracts and model conventions

Add:

- `frontend/src/roadmap/types.ts`
- `frontend/src/tools/types.ts`
- `frontend/src/journey/types.ts`
- `notes/financial-tools-calculation-contract.md`

Contracts:

| Type | Required behaviour |
|---|---|
| `GoalBrief` | Stable local ID; optional user title, target cents, ISO date, saved cents, monthly contribution cents; incomplete is valid |
| `GoalProfile` | Separate liquidity, capacity, willingness, and knowledge answers; unanswered/unknown remain distinct from low risk |
| `ToolId` | Closed union: `goal-planner`, `emergency-buffer`, `fee-impact` |
| `ToolDrafts` | Discriminated, tool-specific drafts; raw editable values may be incomplete and are not saved goal facts |
| `RoadmapAction` | Stable authored action ID plus goal ID; `todo`, `checked`, `later`, `stuck`; optional reflection and provenance |
| `JourneySource` | Discriminated `home`, `roadmap`, `lesson`, `chapter`, `scenario`, `tools`; only public identifiers |
| `LearningCompletion` | Node ID plus `practice`, `final-quiz`, or `demo` provenance; demo unlocks are not real completion evidence |
| `LearningSessionState` | Completed-node map and optional resume node; no quiz UI, question answers, or sandbox results |

Use the existing TypeScript style; no validation/state dependency. Do not duplicate backend response DTOs in `src/model/` for client-only state.

Document before calculator coding:

- EUR amounts, existing cent parser/formatter, empty versus zero inputs, supported limits.
- Monthly contribution timing, goal-date month calculation, first contribution date.
- Contributions-only baseline; optional annual return as an explicit assumption.
- Conversion of an effective annual rate to monthly rates; inflation adjustment basis and labels.
- Fee deduction timing and basis, annual-fee conversion convention, and consistent A/B assumptions.
- Internal projection precision versus rounded display values.
- Zero/negative return domains and validation; no division by zero for buffer coverage.
- Distinguish fee deductions from the reduction in ending value, which also includes forgone growth.

M1 deliverable is the agreed written contract, not calculator logic or arbitrary outputs in page shells.

### Step 2 — Establish authenticated session lifetime

Add:

- `frontend/src/journey/AuthenticatedJourneyLayout.tsx`
- `frontend/src/journey/JourneySessionProvider.tsx`
- `frontend/src/journey/journeySessionContext.ts`
- `frontend/src/journey/journeySessionReducer.ts`

Update `frontend/src/App.tsx`:

1. Retain the outer `AppLayout` and existing `RequireAuth` boundary.
2. Nest a pathless `AuthenticatedJourneyLayout` above `AppLayout`, keeping `RequireAuth` around the existing and new protected routes. The session must survive visiting public Home while signed in.
3. In that layout, key the session provider by trimmed, lower-cased learner email and render an `Outlet` inside it.
4. Logout unmounts the protected provider. Different-email login remounts it immediately, without an effect-based one-render data leak.
5. Same-email automatic re-login preserves state even when the numeric user ID changes.

State owns only roadmap drafts, selected actions, and learning session metadata. Define the reducer API needed by later milestones without inventing functional forms now. Keep transient learning banners, animations, dialogs, fetched path data, and in-progress quiz state local.

No localStorage/sessionStorage writes, no automatic coach publishing, no backend writes. Refresh deliberately resets this new state.

**Check:** navigate between existing protected routes without provider remounts; logout/account change resets state; public Home/login continue to render without requiring this provider.

### Step 3 — Extract learning session progress

Update:

- `frontend/src/demo/LearningPathDemo.tsx`
- `frontend/src/demo/learningPath.ts` only where a small pure selector is needed.

Implementation:

1. Replace local completion storage with session-context selectors/actions.
2. Keep banner computation in the demo module; use existing path helpers rather than duplicating course ordering/lock rules.
3. Derive a unique completed-node set from the shared map for existing progress counts and `getNodeStatus` calls.
4. Record normal completion provenance from the node kind. Completing a demo-unlocked node normally upgrades provenance; repeated demo shortcuts never downgrade real evidence.
5. `completeTopic` preserves current demo unlock behaviour but marks only newly added nodes as `demo`.
6. Preserve reset, complete-current-chapter, celebration, retry, and banner behaviour. Course reset clears learning state only, not a personal goal or tasks.
7. Intersect stored node IDs with the current API path for selectors/counts. Stale IDs must not inflate progress or unlock content after a reload of course data.
8. Store a valid resume node, but do not claim to resume a question, attempt, or prior result screen. Reopening a lesson restarts its view normally.

Do not reconstruct course completion from attempt `passed`: practice-first-answer scoring does not match the current retry-until-correct experience.

**Check:** complete one practice lesson, leave and return, verify the next node is still unlocked; repeat with the demo controls and reset.

### Step 4 — Add validated route helpers and deep links

Add:

- `frontend/src/journey/routes.ts`
- `frontend/src/journey/learningLinks.ts`
- `frontend/src/tools/routes.ts`

Update `LearningPathDemo.tsx` to consume React Router location/search parameters after the path has loaded.

URL contract:

- `/learning?lesson=1.3`: resolve an exact subchapter code against the fetched path.
- `/learning?chapter=2`: resolve chapter order/number and focus its path section; do not imply that chapter 2 is database ID 2.
- `/learning?test=1`: address the existing final-test node by chapter number, subject to the same locks; never use a database quiz ID in this contract.
- Supplying both, repeated conflicting values, malformed codes, or unknown targets produces a non-blocking message and the normal path.
- A locked lesson stays closed and explains its prerequisite, with a link to the next available learning step.
- Completed/unlocked lesson links open the lesson normally.
- Path/lesson transitions keep URL state consistent: **Back to the path** removes the lesson selector, so rerenders cannot immediately reopen it.
- Handle browser Back/Forward and same-component search changes; avoid a one-time-mount-only parser and effect navigation loops.
- No selector means the ordinary path view; retain the resume target as an explicit continuation option rather than unexpectedly auto-opening a lesson.

Source links use a small allowlisted query contract, for example `from=lesson&ref=1.3` or `from=scenario&ref=nina-home-deposit`. Parse and validate against known public content before displaying labels or building links.

Return destinations are derived from valid source types. There is no arbitrary `returnTo` parameter. Scenario return links target a brief, not a claim to restore a discarded run. A source URL is navigation context, never proof that a chapter or scenario was completed.

**Check:** direct link while signed out → login → intended route; invalid/locked targets → useful fallback; browser Back → no reopening loop.

### Step 5 — Author and generate the connection catalogue

Add:

- `knowledge/practical-actions.json`
- `scripts/generate-practical-actions.mjs`
- `frontend/src/journey/connections.generated.ts`
- `frontend/src/journey/connections.ts`

The source contains versioned action IDs, concepts, plain-language relevance copy, lesson codes, chapter numbers, scenario slugs, tool destinations, and generic real-world task text. It does not contain personal data, scoring, answers, or allocation recommendations.

Initial authored scenario connections, based on the current catalogue:

| Source slug | Relevant connection | Practical destination |
|---|---|---|
| `marek-favourite-company` | Concentration and understanding holdings | Diversification research action and profile knowledge section |
| `nina-home-deposit` | Near-term goal and access needs | Goal planner and liquidity profile |
| `sam-university-fund` | Dated goal and planning contributions | Goal planner and goal brief |
| `henryk-retires-next-year` | Withdrawals and access to money | Access/buffer worksheet, explicitly not a pension adequacy calculation |

Re-read the relevant lesson files and scenario briefs before finalising action wording. For Henryk, explain that a simple months-of-expenses calculator does not model sustainable retirement withdrawals.

Generator responsibilities:

1. Read authored actions and existing source content using repository script conventions.
2. Validate unique IDs, known destination/profile-section IDs, existing lesson codes/chapter numbers, and scenario string IDs.
3. Permit only the expected public fields and reject unsupported fields/invalid references.
4. Produce a deterministic, typed client-safe module; support `--check` to detect stale generated output without rewriting it.
5. Never emit or directly import the raw sandbox source JSON into the frontend.

Runtime resolution uses fetched chapters/scenario briefs to find current numeric route IDs. Missing content hides the unavailable connection or falls back to the appropriate catalogue with an explanation; it never guesses an ID.

After changing `knowledge/`, run the existing `node scripts/generate-content-sql.mjs` as required by AGENTS.md and inspect the resulting diff. The new actions do not require new SQL tables or changes to seeded scoring content. Commit any actual generated changes, but do not hand-edit SQL.

**Check:** generation is repeatable, `--check` passes, and emitted fields contain no hidden scenario information.

### Step 6 — Add honest page shells and contextual navigation

Add:

- `frontend/src/roadmap/RoadmapPage.tsx`
- `frontend/src/roadmap/RoadmapSetupPage.tsx`
- `frontend/src/tools/ToolsPage.tsx`
- `frontend/src/tools/ToolPageShell.tsx`
- `frontend/src/journey/JourneySourceNotice.tsx`

Register protected routes in `App.tsx`:

| Route | M1 content |
|---|---|
| `/roadmap` | Purpose, session/privacy notice, links to setup/tools/learning |
| `/roadmap/setup` | Explain upcoming goal/profile flow; no fake save button |
| `/tools` | Tool purposes, availability labels, links to shells |
| `/tools/goal-planner` | Planned inputs/outputs, assumptions, contextual return link |
| `/tools/emergency-buffer` | Planned inputs/outputs and access caveats |
| `/tools/fee-impact` | Planned comparison and excluded costs |

Use explicit route entries, not an unrestricted tool slug that renders an invented tool. Unknown routes retain the app's normal fallback.

Add **My Roadmap** to `AppLayout.tsx` navigation for desktop and mobile through the existing shared item array. Keep public/auth behaviour consistent with the existing Learning link. Tools is discoverable from the roadmap, not a second new primary navigation item.

Shells say the tool is not implemented yet; no projected numbers, successful-save toasts, readiness scores, or disabled controls masquerading as a working flow. A valid source shows an authored explanation and safe return link. Direct entry needs no source.

Reuse existing shadcn/Base UI components and theme tokens. Before coding components, check installed controls and load their current shadcn docs. Keep headings, keyboard navigation, and the shared main/coach layout intact.

**Check:** all six pages load via URL and internal links, with the coach open/closed and on mobile; no unsupported action appears functional.

### Step 7 — Documentation and verification

Update `AGENTS.md` frontend conventions to describe:

- New routes/module boundaries and the authenticated provider lifetime.
- Learning progress surviving internal navigation but not refresh/logout.
- New deep-link parameters and demo-versus-real completion metadata.
- Session-only privacy behaviour and the connection generation/check commands.

Do not update dependency tables with fictional changes: no package additions are planned. Do not change the existing Playground/Sandbox page-local state conventions.

Run:

```text
node scripts/generate-practical-actions.mjs
node scripts/generate-practical-actions.mjs --check
node scripts/generate-content-sql.mjs
npm run build                         (frontend/)
npm run lint                          (frontend/)
```

Inspect the final diff for unrelated edits, hidden content in generated output, and accidental personal-data persistence. No frontend runner or new automated test dependency. Backend tests are unnecessary if backend behaviour remains unchanged.

## Manual acceptance checklist

- [ ] Complete practice → tool shell → Learning retains completion and expected locks.
- [ ] Complete final test → navigate away/back retains completion, without restoring a fake result screen.
- [ ] Demo complete-chapter still unlocks nodes and is labelled internally as demo evidence.
- [ ] Real completion upgrades demo provenance; duplicates do not inflate counts.
- [ ] Learning reset leaves roadmap drafts alone.
- [ ] Same-email recovery login preserves session state; logout/different learner clears it.
- [ ] Refresh resets memory and the UI has not promised persistence.
- [ ] Direct lesson/chapter links work after loading and through login return.
- [ ] Locked/unknown/ambiguous links do not bypass course rules.
- [ ] Back/Forward and Back to path do not reopen a consumed lesson unexpectedly.
- [ ] Scenario sources return to the correct brief resolved by slug; no replay restoration promise.
- [ ] Invalid/external return parameters cannot navigate outside known app destinations.
- [ ] Only navigation-safe identifiers appear in URLs; no private fields reach storage/network/chat.
- [ ] Shells accurately identify unfinished features and work at narrow widths/in dark mode.
- [ ] Existing Learning, Scenarios, Playground, login, and coach entry points still work.

## Completion boundary

M1 is complete when these contracts and navigation foundations are implemented and verified. The next deliverable, M2, builds the actual goal/profile forms and roadmap task interactions on top; M3 implements calculations; M4 adds chapter/sandbox completion handoffs. Do not expand M1 into those features merely to make the shells look complete.

## Verification record

- Frontend production build passes; Vite reports the existing large-chunk advisory.
- Frontend lint passes with existing Fast Refresh export warnings in shared UI files; no new warnings.
- Practical-action generation/check and the existing content SQL generator pass. SQL output is unchanged.
- Browser verification against the local backend covers login return to a contextual tool URL, locked/invalid/ambiguous learning links, chapter scrolling, final-test navigation, learning progress through Tools/Roadmap/Home, reset and refresh semantics, safe scenario brief resolution, preview-only forms, ignored arbitrary return destinations, and absence of new browser persistence.
- Desktop and narrow dark-mode tool previews were inspected; the narrow page has no horizontal page overflow. No browser/test dependency was added.
- Additional checks covered the individual lesson demo shortcut, actual browser Back/Forward, the mobile Roadmap menu, and a long display name at the 1100px navigation breakpoint. Session reducer checks confirmed demo-to-earned upgrade/no downgrade, idempotent completions/actions, and learning-only reset.
