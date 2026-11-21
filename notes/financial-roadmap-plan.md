# Financial Roadmap and Practical Tools — Implementation Plan

Status: M1 foundation and M2 goal/profile roadmap implemented. M3–M6 remain planned; calculators, persistent storage, and completion handoff CTAs are not implemented yet.

## 1. Product decision

Combine contextual practical tools (option 1) with a goal-led personal roadmap (option 2).

**Learn → practise safely → understand your own situation → choose a real-world action → reflect.**

The roadmap is the organising feature; calculators are useful independently and feed into it. Learners can enter from Home, a chapter result, a sandbox result, or the tools catalogue. Completing a course is not a prerequisite for using a tool.

Navigation after completion is explicit, not automatic: show **Apply this to your life**, explain the destination, and keep **Continue learning**, **Change plan**, and **Back** available. Never move a learner away before they can read their result.

## 2. Scope and boundaries

### Included

- One active personal goal, editable throughout the journey.
- Short, goal-specific investing profile: horizon, liquidity, loss capacity, willingness, knowledge.
- Goal planner, emergency buffer calculator, and fee impact calculator.
- Roadmap with authored suggestions and user-selected practical tasks.
- Contextual links in both directions between tools, lessons, and existing sandboxes.
- Chapter and sandbox completion handoffs.
- Home-page entry and resume cards.
- Explicit local-data controls and an exportable summary.
- Useful non-AI explanations and optional links to Hedgie.

### Not included

- Product recommendations, recommended allocations, brokerage/bank connections, transactions.
- A single investor-type label, suitability certification, or personal readiness score.
- New simulation engines, personalised sandbox markets, or altered scenario scoring.
- Multiple simultaneous goals, automated reminders, live product data, document uploads.
- Server storage of personal finances behind the current mock authentication.
- Full persistence of sandbox portfolios/replays or a general rewrite of saved course progress.

## 3. Information architecture

Add one primary navigation item: **My Roadmap**. Keep Tools accessible from the roadmap and Home rather than overcrowding the header with two new items.

Proposed authenticated routes:

| Route | Purpose |
|---|---|
| `/roadmap` | Summary, next suggested step, selected actions, links to tools |
| `/roadmap/setup` | Short goal and profile flow; also supports editing |
| `/tools` | Three tool cards and entry to the profile builder |
| `/tools/goal-planner` | Goal timeline and contribution calculator |
| `/tools/emergency-buffer` | Accessible savings versus essential expenses |
| `/tools/fee-impact` | Illustrative comparison of two fee structures |

Reuse existing learning and scenario routes. Add validated learning deep links, e.g. `/learning?lesson=1.3` and `/learning?chapter=2`, because the current learning screen uses internal `activeView` rather than addressable lesson routes.

Only non-sensitive context belongs in URLs: tool ID, lesson code, scenario slug, and a known source type. Never put goal names, amounts, profile answers, or notes in URLs. Use allowlisted internal destinations for return links, not arbitrary `returnTo` URLs.

## 4. Core user experiences

### A. Start from Home

1. Select **Plan your next financial step**.
2. Name one goal, enter its target/date, and optionally current savings/contributions.
3. Answer a small number of profile questions; support **Not sure** and skipping nonessential questions.
4. See a goal summary, clearly explained tensions, and up to three suggested next steps.
5. Choose an action or open the most relevant calculator.

For returning learners, Home shows **Continue my roadmap** and one unfinished action, without exposing financial amounts in the home card.

### B. Finish a chapter

1. Keep the existing final-test result visible.
2. When the chapter is genuinely complete, show one contextual application card.
3. Offer the relevant tool or profile section, plus **Continue learning**.
4. Carry the source chapter into the destination so it can explain the connection.
5. If there is no goal yet, offer a short setup or **Use the tool without a goal**.

Failed tests retain retry/review as their primary actions. Tools remain accessible but do not imply that the chapter was passed. Demo complete-chapter/skip controls must not be presented as evidence of real learning completion.

### C. Finish a sandbox

1. Wait until replay is finished; do not introduce a navigation action while submitting/playing.
2. Add **Apply this to your life** to the result dialog and persistent result card.
3. Select an authored connection based on the scenario's public topic/lesson metadata.
4. Open a relevant tool/profile section, without copying fictional balances or allocations into a personal plan.
5. Let the learner save a related real-world task.

Do not require a high star score to use practical tools. Low scores can also offer **Review this concept**. Stars and scenario share ranges never become personal financial guidance.

Sandbox state currently disappears on navigation: state this clearly before a handoff, offer **Save next step and stay here**, and keep **Change plan** available. A return link can reopen the brief or a fresh run, but must not claim to restore the previous replay.

### D. Return and reflect

- Task states: **To do**, **Checked**, **Later**, **I got stuck**.
- Checking a task is self-reported, not independently verified.
- Optional short note: **What did you discover?**
- **I got stuck** offers the relevant lesson, tool help, or a generic question for Hedgie.
- Completed tasks remain editable/reopenable; no reward depends on investing money.

## 5. Profile builder

Keep the profile attached to the active goal rather than treating risk preferences as a permanent identity.

| Dimension | Example input | Educational output |
|---|---|---|
| Horizon | Goal date | How timing affects the relevance of price fluctuations |
| Liquidity | Could some money be needed earlier? | Questions about access and withdrawal conditions |
| Loss capacity | Would a loss affect essential needs or delay this goal? | A constraint to investigate, not an allocation recommendation |
| Willingness | Reaction to a hypothetical decline | Distinguish emotional comfort from ability to absorb losses |
| Knowledge | Familiarity with fees, diversification, and access | Suggested lessons; self-report is distinct from quiz evidence |

Use separate plain-language observations, not a weighted risk score. Explicitly support incomplete answers and avoid inferring financial resilience from age alone.

Example: **You are comfortable with fluctuations, but you may need this money soon. Explore what a fall near your goal date could mean.**

## 6. Tool specifications

### Goal planner

- Inputs: target amount, goal date, amount already set aside, monthly contribution.
- Default output: contributions-only projection, gap, required monthly contribution, and timeline alternatives.
- Optional advanced illustration: user-chosen annual return and inflation assumptions, prominently labelled as assumptions, not forecasts.
- Specify end-of-month contributions and the first contribution date; show nominal versus today's-money values separately if inflation is enabled.
- Handle already-funded goals, zero contributions, missing inputs, and invalid/past dates explicitly.
- Do not infer a required investment return or suggest taking more risk to close a gap.
- CTA: **Use this in my roadmap** and **Choose a practical next step**.

### Emergency buffer calculator

- Inputs: essential monthly expenses, accessible savings, unavoidable near-term expenses not already included in monthly expenses, learner-selected target months.
- Outputs: available buffer after earmarked expenses, months covered, target amount, and gap.
- Explain excluded/earmarked money and avoid double-counting expenses or assigning the same savings automatically to the goal and buffer.
- Handle zero expenses without division by zero; distinguish an undefined coverage ratio from a zero-sized buffer. Show any expense shortfall separately rather than hiding it by clamping all outputs to zero.
- Explain target choices without prescribing a universal target.
- CTA: **Check withdrawal conditions** or **Set a savings milestone**.

### Fee impact calculator

- Inputs: starting amount, monthly contribution, years, one shared illustrative gross return, annual percentage fees for A and B.
- Initial scope: annual percentage fees only. Explicitly list excluded transaction fees, spreads, fixed charges, entry/exit fees, and taxes.
- Define the percentage-fee timing and contribution convention before implementation; label outputs as a simplified model.
- Outputs: end values, modeled fees deducted, and difference in end value. Distinguish fees actually deducted from lost compounded growth.
- Use neutral A/B labels; lower modeled fees do not establish that one product is better or suitable.
- CTA: **Find the fees in an official document** and **Save a comparison task**.

### Shared numerical rules

- EUR only initially, consistent with the current workspace.
- Reuse existing cent parsing/formatting where suitable; validate bounds and reject malformed amounts.
- Specify compounding, rounding, rate bounds, and timeline limits centrally. Zero and negative illustrative returns must not break the model; reject unsupported domains explicitly.
- Keep full internal precision for projections and round displayed currency consistently. Starting amounts and contributions use integer cents.
- All results come from deterministic functions, never an AI response or a sandbox path.
- Tool drafts are isolated from the saved goal until the learner selects **Use this in my roadmap**. Editing the saved goal invalidates/recomputes derived results.

## 7. Connections catalogue

Create one explicit, versioned catalogue for concept → lesson → tool → scenario → action connections. Use stable lesson codes and scenario slugs, resolving database IDs from API responses. Do not scatter numeric IDs or title matching across components.

Initial concept mapping:

| Learning topic | Practical destination | Example real-world action |
|---|---|---|
| 1.1 Why invest | Goal planner, optional inflation illustration | Compare contributions under two timelines |
| 1.2 Setting goals | Goal brief and goal planner | Write down one amount and date |
| 1.3 Horizon and liquidity | Buffer calculator and access profile | Check withdrawal timing and penalties |
| 1.4 Risk | Goal-and-risk profile | Record what a loss would mean for this goal |
| 1.5 Diversification | Profile and diversification checklist | Find where a product discloses its holdings |
| 2.1–2.2 Cash, deposits, bonds | Buffer/access sections | Check term and early-access conditions |
| 2.5 Fees | Fee calculator | Find annual charges in an official document |
| 2.6–2.7 Speculation/comparison | Risk profile and research checklist | Record risks and unanswered questions |
| 3.1–3.4 Life stages | Review goal, horizon, and access needs | Revisit the plan after a life change |
| 3.5–3.7 Retirement and review | Long-horizon goal planner and review task | Gather information about existing pension provision |

Chapter handoffs: Chapter 1 → goal/profile; Chapter 2 → fees and product-research checklist; Chapter 3 → review goal/timeline and a future review task. A generic goal planner is not presented as a pension adequacy calculator.

Scenario handoffs must be authored against the actual scenarios present at implementation time. The current documented set is 2.3 Marek, 2.6 Nina, 3.3 Sam, and 3.5 Henryk; inspect their current JSON briefs/lesson links before assigning destinations. Do not invent missing scenarios based on older chapter-overview mission ideas.

Every suggestion explains **why this is relevant**. Provide one primary destination and at most two alternatives; do not show every tool after every completion.

Store educational action copy and mappings under `knowledge/` as their source of truth, with a small build-time generator producing a frontend module. Validate referenced lesson codes/scenario slugs against the source content. Do not ship evaluation answers, hidden seeds, reference allocations, or the full scenario JSON to the client.

## 8. Roadmap behaviour and state

Organise the roadmap into:

1. **Define my goal** — goal brief and open questions.
2. **Understand my constraints** — profile and buffer.
3. **Explore the tradeoffs** — relevant learning and fictional practice links.
4. **Take a practical step** — selected tasks and reflections.
5. **Review** — revisit a goal or completed task.

These are navigable sections, not mandatory locked stages. A progress indicator measures completed preparation steps, not investment competence or financial safety.

Use deterministic authored rules to suggest up to three next steps. Incomplete profile answers remain unknown. Suggestions are distinct from tasks the user has accepted.

Deduplicate selected tasks by stable action ID plus goal ID; revisiting a result must not create duplicates or reset a checked task. Retain the original source and optionally record additional sources. If updated answers change suggestions, do not silently delete previously chosen tasks.

Suggested state types: `GoalBrief`, `GoalProfile`, `ToolDrafts`, `RoadmapAction`, `JourneySource`, `JourneyProgress`, and a versioned storage envelope. Keep derived calculations and suggestions out of canonical stored data.

## 9. Persistence, privacy, and navigation continuity

### Initial storage model

- Default: memory scoped to the current signed-in learner and surviving internal route changes.
- Optional **Remember on this device**: explicit opt-in browser storage with a shared-device warning, versioning, validation, and a clear-data control.
- Browser persistence is not secure storage or real account isolation. Do not put personal financial data into the backend with the current email-header mock login.
- Logout/account change clears in-memory personal state immediately. Never show another learner's draft; opt-in saved data is loaded only for its matching local learner scope.
- Explain whether refresh will discard the draft before opting in; export provides a non-server alternative.
- No balances, goal titles, profile answers, or notes in URLs, analytics, console logs, or automatic coach context.
- Handle unavailable/full/corrupt browser storage with a clear fallback to memory, not a broken page.

### Learning continuity

Before adding outbound chapter links, move the current session's learning progress above the `/learning` route so visiting tools does not reset/unlock the path incorrectly. Preserve completed nodes and a resume target; do not keep the entire lesson UI mounted.

Existing backend attempts can still be saved as today, but do not claim cross-device progress restoration. Control attempts save first answers while practice permits retries, so `passed` alone is not a reliable reconstruction of practice completion. Any future server-restored progress needs an explicit completion contract.

Deep links must respect the current course locks: locked lessons explain their prerequisite and link to it. Unknown/stale links fall back to the learning path. Existing demo reset semantics remain explicit and separate from clearing a personal roadmap.

## 10. Hedgie integration

Initial release: authored result explanations and generic **Explain this concept** links using existing lesson context where available. Tools, profiles, and suggestions work fully without AI.

Do not send personal calculator fields via chat text behind the scenes. If result-specific coaching is added later, introduce explicit consent, structured validated inputs, server-side recomputation of the modeled result, matching DTO/TypeScript updates, and focused coach service tests. Do not let the model invent numbers or a suitable portfolio.

Keep scenario conversations unchanged and do not silently mix personal goal data into existing scenario chat memory.

## 11. Implementation structure

Proposed frontend modules:

- `src/roadmap/`: pages, profile flow, reducer/provider, persistence adapter, deterministic suggestion rules.
- `src/tools/`: catalogue, tool pages, pure calculator functions and help copy bindings.
- `src/journey/`: connection catalogue bindings, shared contextual CTA, validated source/deep-link helpers, session learning continuity.
- `knowledge/practical-actions.json`: authored action/connection source, with generated client-safe output.

Primary existing integration points:

- `src/App.tsx`: routes and authenticated state lifetime.
- `src/layouts/AppLayout.tsx`: navigation; retain its single main landmark and coach shell.
- `src/pages/HomePage.tsx`: entry/resume CTA and tools discovery.
- `src/demo/LearningPathDemo.tsx`: shared session progress and deep-link resolution.
- `src/demo/LessonModal.tsx`: contextual lesson/chapter completion cards.
- `src/sandbox/SandboxResultDialog.tsx` and `SandboxResult.tsx`: finished-run handoffs.

Reuse existing shadcn/Base UI components, theme tokens, Hugeicons, cent-formatting utilities, and suitable generic chart primitives. Keep `src/workspace/` mode-agnostic; no roadmap-specific imports there. Adapt charts only if they can clearly distinguish hypothetical projections from synthetic simulation histories.

No new dependency is planned. Any dependency later proposed needs approval and the matching AGENTS.md tech-stack update. Update application conventions/documentation when implementing the feature.

## 12. Delivery milestones

### M1 — Contracts, content, and navigation foundation

Detailed execution plan: [Milestone 1 implementation plan](financial-roadmap-m1-implementation-plan.md).

- Finalise field definitions, numerical conventions, action catalogue, privacy copy, and scenario mappings.
- Add roadmap/tool routes and shared learner-scoped state.
- Preserve learning session progress across navigation and add validated lesson/chapter deep links.
- Establish source attribution and return-destination rules.

Acceptance: a learner can leave Learning, open a placeholder tool, and return without losing completed nodes; account changes do not expose the previous draft.

### M2 — Goal and profile roadmap

Detailed execution plan: [Milestone 2 implementation plan](financial-roadmap-m2-implementation-plan.md).

- Build short setup/edit flow and roadmap summary.
- Add separate profile observations and a small set of deterministic suggestions.
- Add task selection, deduplication, status changes, and optional reflection.

Acceptance: an incomplete or conflicting profile produces understandable questions, not an investor label or recommended allocation; selected actions survive internal navigation.

### M3 — Goal planner and emergency buffer

- Implement pure calculations, validation, result explanations, and roadmap save/apply actions.
- Support standalone use without goal setup.
- Keep savings allocation explicit to prevent double-counting between tools.

Acceptance: changing a timeline or expense input predictably updates results, zero/boundary cases are safe, and no market return is required to produce a useful goal plan.

### M4 — Connect Learning and Sandbox

- Add chapter completion cards and selected lesson-level links.
- Add sandbox result links, leave-state explanation, and save-and-stay action.
- Show source-specific introductions in destination tools and useful reverse links.
- Add Home and primary-navigation entry/resume experiences.

Acceptance: both chapter → tool → action and sandbox → profile/tool → roadmap are complete journeys, with no forced navigation, fictional-data transfer, or misleading return-state promise.

**First demonstrable release: M1–M4.** This is a vertical slice, not the end of the agreed scope.

### M5 — Fee calculator and full connection coverage

- Add the simplified annual-fee comparison and research action.
- Complete mappings for all three chapters and current sandboxes.
- Add generic concept-help links for Hedgie without sharing personal figures.

Acceptance: fee assumptions/exclusions are visible and the app never equates cheapest with best or suitable.

### M6 — Local persistence, export, and polish

- Add explicit device-save opt-in, clear-data controls, and a readable downloadable/printable summary.
- Add version/corruption/storage-failure handling and clear refresh/privacy messaging.
- Polish mobile layouts, keyboard/focus behaviour, loading/error/empty states, and dark mode.
- Document the new routes, storage conventions, and calculation assumptions.

Acceptance: saving is optional and understandable; exported data is intentional; the app works when persistence or AI is unavailable.

## 13. Verification

Follow the repository testing policy: no new frontend runner or dependency by default.

- Run `npm run build` and `npm run lint` after each frontend milestone.
- Verify calculator reference examples manually, including zero-return/contribution cases, already-funded goals, zero expenses, equal fees, and rate/timeline boundaries. Record expected arithmetic alongside calculation documentation.
- Validate generated connection references and ensure only public authored content enters the client bundle.
- Manually walk chapter success/failure, demo shortcut, sandbox low/high stars, save-and-stay, repeat handoffs, locked/unknown deep links, refresh, back navigation, logout/account switching, and unavailable storage.
- Check narrow screens, open coach sidebar, dark mode, keyboard navigation, validation focus, and no personal data in URLs/network requests.
- If implementation changes backend behaviour, add only a few focused affected-service JUnit tests and run `bash mvnw test` from `backend/`; no new controller/integration test scope by default.

## 14. Definition of done

A learner can finish a real chapter or fictional sandbox, understand why a practical tool is relevant, use their own inputs without receiving a product recommendation, save a useful next action to a personal roadmap, return without losing session learning progress, and later record what they discovered.

All three tools and the profile builder are accessible independently. No part of the core journey requires AI, real-money activity, sensitive server storage, or a high sandbox score.
