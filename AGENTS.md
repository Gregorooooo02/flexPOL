# HedgeFlex (Finance Quest challenge)

## Learn investing. Practice safely. Build confidence.

## 1. Concept

**HedgeFlex is our entry for the Finance Quest challenge: a gamified financial-learning application that combines Duolingo-style lessons, an AI learning coach, and a fictional investing sandbox.**

Users follow a learning path, complete short quizzes and practical missions, then unlock an open sandbox where they can experiment freely or compete in goal-based challenges.

The aim is to help people move from knowing financial concepts to confidently applying them. This matches the official challenge's focus on bridging financial knowledge and action for self-directed investors. [Challenge...Quest.pdf | PDF]

## 2. Target learner and learning objective

**Proposed initial learner:** a beginner self-directed investor who understands some terminology but is unsure how to make an investment decision.

**First mission's learning objective:**

> Given a fictional goal, investment horizon, and liquidity needs, the learner can choose an allocation and explain its tradeoffs.

Across the broader product, scenarios can reflect different life stages, goals, circumstances, and experience levels, as required by the challenge's generational theme. [Challenge...Quest.pdf | PDF]

## 3. User journey

| Stage | User experience |
|---|---|
| **Start** | Select experience level and a fictional goal. |
| **Learn** | Complete short explanations and interactive questions about investing concepts. |
| **Practice** | Allocate virtual money among fictional instruments in a guided mission. |
| **Experience consequences** | Encounter a simulated market change or unexpected need for money. |
| **Reflect** | Get an AI explanation of the tradeoffs and answer a reasoning question. |
| **Improve** | Adjust the allocation and compare the alternative outcome. |
| **Unlock** | Enter Free Play or a competitive Quest Arena. |

## 4. Main features

### Learning path

- Short chapters covering concepts such as risk, diversification, time horizon, and liquidity.
- Quizzes with explanations, not just correct/incorrect feedback.
- Progress indicators, XP, and mastery badges.

**Chapter plan and lesson content:** all learning content lives in the [knowledge/](knowledge/) folder. Start with the overview, [knowledge/learning-chapters.md](knowledge/learning-chapters.md), which lists chapters, subchapters and missions. Each chapter has its own folder with one file per subchapter, holding the lesson for the user and control questions with answers. Read these before working on lesson content, quizzes or missions. Sandbox scenarios for Chapters 2 and 3 (seeded into the database, listed on `/scenarios` with a brief page each, playable at `/scenarios/{id}/play`) are in [knowledge/sandbox-scenarios.md](knowledge/sandbox-scenarios.md); their values (instruments, amounts, horizons, targets, scoring weights) are in [knowledge/sandbox-scenarios.json](knowledge/sandbox-scenarios.json), the source of truth when the two differ. Scenarios are built for the Playground workspace and the batch simulation (catalogue instruments plus 0% cash, horizons up to 3,650 days); after changing the JSON, run `node scripts/check-sandbox-scenarios.mjs`, which validates it and checks on many seeds that each reference allocation scores at least 80 and each trap at most 50, then `node scripts/generate-content-sql.mjs` to update the seed.

### AI coach

- Explains unfamiliar concepts in accessible language.
- Gives hints before revealing an answer.
- Discusses the learner's choices in the context of the mission.
- Helps the learner reflect and improve.

**Boundary:** the AI is an educational coach, not a personal investment adviser. It should not invent simulation outcomes or scoring rules.

### Investing sandbox

A small set of fictional instruments with clearly stated properties, such as:

- Accessible cash.
- A diversified market basket.
- A volatile concentrated asset.
- A locked-term instrument.

All prices, events, and outcomes are explicitly synthetic. Choices are evaluated against the goal and constraints, rather than teaching that one instrument is universally "right."

### Two sandbox modes

- **Free Play:** experiment, replay scenarios, and consult the coach without ranking.
- **Quest Arena:** compete using the same starting budget, mission, constraints, and simulated events.

### Goal-based leaderboard

Reward **goal alignment, resilience, concept application, and improvement**, rather than simply the highest return. Use transparent rules for scoring, with the AI explaining the result.

## 5. Recommended hackathon MVP

The official brief requires a prototype demonstrating **one complete learning mission**, plus a clear target learner, learning objective, and evidence of understanding and engagement. [Challenge...Quest.pdf | PDF]

**Build this complete vertical slice:**

> One short lesson → quiz → portfolio allocation → simulated event → AI debrief → retry → score → sandbox unlock.

| Include in MVP | Leave for later |
|---|---|
| **One learner scenario and learning objective** | Full personalized curriculum |
| **One complete chapter** | Many chapters and instruments |
| **A few fictional instruments** | Real products or live market data |
| **One authored simulation scenario** | Complex market simulation |
| **Context-aware AI coaching** | Fully autonomous AI-generated lessons |
| **Simple scoring and leaderboard** | Seasons, leagues, and social features |
| **Basic Free Play using the same engine** | Extensive sandbox customization |

If leaderboard entries are fictional demo users, label them clearly.

## 6. Suggested workstreams

| Workstream | Main deliverables |
|---|---|
| **Learning content and UX** | Mission story, lesson, questions, explanations, screen flow, accessible language. |
| **Frontend** | Learning screens, allocation controls, results, coach interface, progress, leaderboard. |
| **Simulation and backend** | Instrument definitions, scenario events, balance calculations, scoring, saved progress. |
| **AI integration** | Coach prompts, structured mission context, grounded explanations, fallback responses. |
| **Testing and demo** | End-to-end walkthrough, calculation checks, AI boundary tests, presentation story. |

**First shared dependency:** agree on the mission and data contract before building independently. Define the goal, instruments, learner choices, simulated events, scoring rules, and information passed to the AI.

## 7. What success looks like

By the end of the demo, the learner should be able to:

- Explain why their allocation fits, or does not fit, the mission.
- Recognize a tradeoff revealed by the simulation.
- Improve their decision after feedback.
- Identify what they still need to understand before taking a real-world step.

**Pitch:**

> **HedgeFlex turns financial learning into an interactive adventure. Learn the basics, test your decisions with virtual money, get guidance from an AI coach, and compete on the quality of your plan, not just your luck.**

This summary keeps your original learning-path and sandbox idea intact, while narrowing the prototype to one complete experience and making the competition support learning rather than speculation.

---

# Tech stack

The repository is a monorepo with two apps: `backend/` and `frontend/`.

## Backend (`backend/`)

| Area | Technology | Version / notes |
|---|---|---|
| Language | Java | 25 |
| Framework | Spring Boot | 4.2.0 (`spring-boot-starter-parent`) |
| Web | Spring Web MVC | `spring-boot-starter-webmvc` |
| Persistence | Spring Data JPA (Hibernate) | `spring-boot-starter-data-jpa` |
| Database | H2, in-memory | `jdbc:h2:mem:flexpol`; console via `spring-boot-h2console` |
| Boilerplate | Lombok | Annotation processor configured in `maven-compiler-plugin` |
| AI | Spring AI + OpenAI | 2.1.0 (`spring-ai-bom`, `spring-ai-starter-model-openai`; uses the official `openai-java` SDK). Powers the AI coach through `ChatClient` |
| AI chat memory | Spring AI JDBC chat memory | 2.1.0 (`spring-ai-starter-model-chat-memory-repository-jdbc`, version from the BOM). Stores coach conversations in the app database, table `SPRING_AI_CHAT_MEMORY` |
| Testing | Spring Boot test (Web MVC), JUnit Jupiter | `spring-boot-starter-webmvc-test`; transitively includes JUnit Jupiter 6.1.3, parameterized tests, and its engine |
| Build | Maven, through the wrapper | `./mvnw` (`mvnw.cmd` on Windows) |

- Base package: `com.flexpol.backend`. Layers: `controller/` (REST endpoints, no logic) → `service/` (read-only `@Transactional` business logic, maps entities to DTOs) → `repository/` (Spring Data JPA). Also `entity/` (JPA entities), `dto/` (response records with static `from(...)` mappers; controllers never return entities) and `exception/` (`ResourceNotFoundException` and `BadRequestException`, mapped to 404 and 400 RFC 9457 problem details by `ApiExceptionHandler`).
- REST API (JSON):

  | Endpoint | Returns |
  |---|---|
  | `GET /api/chapters` | All chapters in order, each with subchapter summaries and `finalQuizId` |
  | `GET /api/chapters/{chapterId}` | One chapter |
  | `GET /api/chapters/{chapterId}/subchapters` | Subchapter summaries of a chapter (no lesson body) |
  | `GET /api/chapters/{chapterId}/final-quiz` | The chapter's final quiz |
  | `GET /api/subchapters/{subchapterId}` | One subchapter with `lessonMarkdown` and `controlQuizId` |
  | `GET /api/subchapters/{subchapterId}/control-quiz` | The subchapter's control quiz |
  | `GET /api/quizzes/{quizId}` | Any quiz by id |
  | `POST /api/questions/{questionId}/answer` | Submit `optionId` for a choice or `assignments` (a card ID to destination ID map) for matching or sorting. Choice results include `correctOptionId` and `explanation`. Assignment results include a retry `hint` or the explanation after a correct answer. Optional `attemptId` saves the first answer (needs the owner's `X-User-Email`) |
  | `POST /api/quizzes/{quizId}/attempts` | Needs `X-User-Email`. Starts a quiz attempt and returns it (201): `id`, `quizId`, `startedAt`, `completedAt`, `answeredCount`, `questionCount`, `score`, `passed` |
  | `GET /api/quiz-attempts/{attemptId}` | Needs `X-User-Email`. One of the learner's attempts (404 for someone else's) |
  | `POST /api/coach/messages` | Body `{ "message": "...", "subchapterId": 1, "questionId": 1, "selectedOptionId": 3, "conversationId": "<uuid>" }` (all but `message` optional; `selectedOptionId` needs `questionId`). Returns the AI coach's `reply`, `aiAvailable` and `conversationId`. With `X-User-Email` the conversation belongs to that learner |
  | `GET /api/scenarios` | All sandbox scenarios in JSON order (chapter 2, then 3): the brief only (`slug`, `code`, chapter, `title`, `persona`, `goal`, `currency`, `budget`, `durationDays`, `moneyNeeds`, allowed `instruments`, `rules`, `scoring`, `retirementGap`, `lessons`, `notSimulated`) |
  | `GET /api/scenarios/{scenarioId}` | One scenario (404 if unknown) |
  | `POST /api/scenarios/{scenarioId}/runs` | Body `{ "allocations": [ { "instrumentId": 1013, "amount": 1200.00 } ] }` (euros, whole cents; the rest is cash, so `[]` means all cash). Simulates the allocation in the scenario's own market and returns the evaluation: `points` (`date`, `value`, `cash`), each instrument's `values`, `finalValue` and `contribution`, how each money need was paid (`paidFromCash`, `paidFromHoldings`, `shortfall`, `pointIndex`), `finalValue`, `paidOut`, `totalReturn`, `largestDrop`, `goalMet` and `score` (`total`, `growth`, `stability`, weights, `rulePenalty`, `brokenRules`). 400 for an instrument outside the scenario, a repeated instrument, a non-positive or sub-cent amount, or more than the budget; 404 for an unknown scenario. Runs are not saved |
  | `POST /api/users/login` | Mock login, no password. Body `{ "username": "Ada", "email": "ada@example.com" }`. Finds the user by email (trimmed, lower-cased) or creates one, updates the display name, and returns `id`, `username`, `email`. 400 for a blank username (max 50 chars) or an invalid email |

  Quiz responses contain question prompts, A–D options, and any public exercise data. Assignment solutions and explanations are held on the server. A portfolio comparison provides its inputs, and the learner reveals the calculated results before answering the follow-up choice.
- Current learner (mock login, no real authentication): requests name the learner with the `X-User-Email` header (`controller/UserHeader`), matched case-insensitively. `UserService.findCurrentUser` / `requireCurrentUser` resolve it inside the caller's transaction; an email with no user returns 401 ("log in again"), and so does a missing header where a learner is required (`UnauthorizedException`, mapped by `ApiExceptionHandler`). The header proves nothing, so anyone can act as any email: fine for the demo only.
- Quiz attempts (`QuizAttemptService`): the frontend starts an attempt when the learner begins a quiz's questions and sends its `attemptId` with each answer. Only the first answer to each question is saved (`attempt_answer` is unique per attempt and question), so practice retries don't change the score. When every question has an answer the attempt is completed: `score` counts correct first answers and `passed` is `score >= passMark`, or always true for quizzes without a pass mark (control quizzes). Later answers are still checked but not saved. Another learner's attempt returns 404, and a question from a different quiz returns 400.
- The schema is recreated on every startup (`ddl-auto=create-drop`), and `src/main/resources/data.sql` seeds it.
- Learning content tables: `chapter`, `subchapter` (lesson body in `lesson_markdown`), `quiz` (`CONTROL` per subchapter, `FINAL` per chapter), `question`, `answer_option`. Learners: `USER` (`UserService`; `email` is unique and identifies the learner, `username` is only a display name and may repeat; three demo users are seeded in `data.sql`). Learner results: `quiz_attempt`, `attempt_answer`. Coach conversation owners: `coach_conversation`. Sandbox scenarios (`ScenarioService`): `scenario` (brief, scoring parameters and `scenario_seed`), `scenario_lesson`, `scenario_instrument`, `scenario_money_need` (`day_offset`, since `DAY` is reserved in H2), `scenario_rule` + `scenario_rule_instrument`, `scenario_allocation` (`REFERENCE`, `ACCEPTABLE`, `TRAP`, with `cash_share`) + `scenario_allocation_share`, `scenario_debrief_point`, `scenario_not_simulated`. Never send `answer_option.is_correct` to the frontend before the learner answers, and never send a scenario's seed, allocations or debrief points before the learner has submitted (`ScenarioResponse` leaves them out).
- **`knowledge/` is the source of truth for content.** The block between the `GENERATED CONTENT` markers in `data.sql` is generated from it: after changing anything in `knowledge/`, run `node scripts/generate-content-sql.mjs` from the repository root and commit the updated `data.sql`. Don't edit that block by hand. The script validates each choice question's A–D options and single ✅, and validates `assignment` and `comparison` blocks in practice quizzes. The same script writes `knowledge/sandbox-scenarios.json` into the `GENERATED SCENARIOS` block at the end of `data.sql`, after the instrument seed, because scenarios reference instruments; it fails on an unknown chapter, lesson code, instrument id or rule type.
- The H2 console is at `http://localhost:8080/h2-console`.
- AI coach (`CoachService`): set the `OPENAI_API_KEY` environment variable to enable it, and optionally `OPENAI_MODEL` (default `gpt-5-mini`). Never commit the key. Without a key, or when the OpenAI call fails, the app still starts and the endpoint returns a fixed fallback reply with `aiAvailable: false`. The system prompt is `src/main/resources/prompts/coach-system.md`; it keeps the coach educational (no personal advice, no invented simulation results or scoring). When `subchapterId` is given, that lesson's Markdown is added to the system prompt as a template parameter. Only chat is used: embedding, image, audio and moderation models are turned off with `spring.ai.model.*=none`. Tests replace OpenAI with a stub `ChatModel` bean (`CoachControllerTests`), so they never call the network.
- Coach conversation memory: the first message without `conversationId` starts a conversation and the response returns its new UUID; sending it back continues the conversation. Ids that are not UUIDs return 400; an unknown UUID just starts empty. `MessageChatMemoryAdvisor` adds the last 20 messages (Spring AI's `MessageWindowChatMemory` default) to each prompt and saves the new question and reply. Only learner and coach messages are stored; the system prompt and lesson context are added fresh on each call. Storage is the JDBC chat memory in the same database (table `SPRING_AI_CHAT_MEMORY`, created by Spring AI's own schema script on embedded databases), so with in-memory H2 conversations are lost on restart. Ownership (`CoachConversationService`, table `coach_conversation`): a conversation started with `X-User-Email` belongs to that learner, and anyone else, or a request without the header, gets 404 for it. An unknown UUID sent by a learner is claimed by them and starts empty. Conversations started without the header stay unowned, as before the mock login.
- Coach question context (`CoachContextService`, read-only transaction so the model call holds none): with `questionId`, the system prompt gets the question, available options or card destinations, and rules for how much the coach may reveal. It mirrors what the quiz screen shows: before an answer, hints only in practice (`CONTROL`); after a correct answer, the explanation; after a wrong practice answer, guidance for a retry; after a wrong test answer, the correct option and explanation. The frontend sends `selectedOptionId` or `assignments` once the learner checks their answer.
- Commands: `./mvnw spring-boot:run` starts the app; `./mvnw test` runs the tests.
- Instrument catalog/detail/history GET endpoints and `POST /api/simulations` are implemented. Simulations run on demand without persistence; `GBM` uses configured drift/volatility and a reproducible seed, and `FIXED_RATE` supports ACT/365 accrual with STOP-at-maturity behavior. The current seed contains only market instruments; no deposit fixture is API-selectable yet.
- Simulation requests and responses use `durationDays` (1–10,950 calendar days, approximately 30 years) and support positive investments up to EUR 1,000,000,000,000, rounded to cents. Requested end dates use `startDate.plusDays(durationDays)`; fixed-rate product maturity still uses `termMonths`. Unknown instruments return 404; undefined/out-of-bounds inputs return 400. Model/configuration failures do not silently fall back to another engine.
- GBM uses a calendar-day horizon but emits the initial point and weekday points, skipping intermediate weekend dates. If the end date is a weekend, one terminal carry-forward point is included without a random draw. A 10-day request from 20 November 2026 ends on 30 November and returns 7 points, not 10 or 11.
- `POST /api/simulations/batch` simulates several instruments over one shared timeline (used by the planned Playground workspace). The body is a JSON array of the same `SimulationRequest` (1–50 items, distinct `instrumentId`s, one shared `durationDays` of 1–3,650); the response is an array of `SimulationResult` in request order, and all results must share the same start and end date or the call fails. An item without `randomSeed` gets an independent seed: `SeedMixer` (SplitMix64, masked to 53 bits so it is exact in JavaScript) derives it from a per-request master seed and the instrument ID. An explicit seed is used as given, so the same seed on two items gives them identical shocks, which means perfect correlation. Every result returns the seed actually used, so one item can be replayed through `POST /api/simulations`. Instruments move independently (no correlation). A 20-instrument, 5-year batch is about 1.3 MB of JSON.
- Error mapping: unknown instruments return 404 (`ApiExceptionHandler`), and invalid simulation input (`IllegalArgumentException`) returns 400 through a handler scoped to `SimulationController`.
- Run `bash mvnw test` from `backend/`. The current tests cover application startup, learning content and its repository, the quiz answer endpoint, the AI coach, batch simulation (`SimulationServiceTests`: independent and replayable seeds, shared timeline and order, explicit seeds, invalid batches), the seeded scenarios (`ScenarioServiceTests`: order and brief, rules, unknown id), and scenario runs (`ScenarioRunServiceTests`: all-cash run paying a need from cash, same market on every run and needs sold from holdings, the rule limit boundary, rejected allocations).
- Scenario runs (`ScenarioRunService`, not transactional; `ScenarioService.getRunSpec` reads the brief plus the server-only seed in its own read-only transaction): each invested instrument goes through `SimulationService.simulateBatch` with seed `scenarioSeed + instrumentId`, so every learner and retry gets the same market (an all-cash run simulates one allowed instrument only for the timeline). The evaluation follows `knowledge/sandbox-scenarios.md` §4 and mirrors `scripts/check-sandbox-scenarios.mjs`: money needs are paid at the first point on or after their day, from cash first, then by selling the same fraction of every holding; the largest drop is measured on value plus money paid out (the money actually paid, so a shortfall doesn't soften it); growth is 0 after a shortfall; rules are checked exactly (`amount > maxShare × budget` breaks a rule, the limit itself doesn't). The seed and the reference/trap allocations are never returned.

## Frontend (`frontend/`)

| Area | Technology | Version / notes |
|---|---|---|
| UI library | React + React DOM | ^19.3 |
| Routing | React Router (`react-router`) | ^8.5.2, declarative client-side routing with `BrowserRouter` |
| Language | TypeScript | ~7.0 |
| Build tool / dev server | Vite with `@vitejs/plugin-react` | Vite ^8.3, plugin ^6.1 |
| 3D mascot | Three.js | 0.187.0, loads on demand and renders Hedgie after each completed lesson |
| HTTP client | axios | ^1.21, shared instance and `ApiError` in `src/config/axios.ts` |
| Markdown | react-markdown + remark-gfm | ^10.1 / ^4.0, render lesson Markdown (including GFM tables) in `src/demo/LessonMarkdown.tsx` and coach replies |
| UI components | shadcn/ui (`base-sera` style) on Base UI, Tailwind CSS v4, Hugeicons | `shadcn` ^4.23, `@base-ui/react` ^1.9, `tailwindcss` ^4.3, `@hugeicons/react` ^1.1. Components live in `src/components/ui/`; add more with `npx shadcn@latest add <name>` from `frontend/` |
| Resizable layout | `react-resizable-panels` | ^4.24.1, powers the resizable desktop content and AI coach sidebar through shadcn's `ResizablePanelGroup` |
| Chat scrolling | `@shadcn/react` | ^0.3, powers the shadcn `MessageScroller` used by the coach chat |
| Linting | oxlint | ^1.90, configured in `.oxlintrc.json` |
| Package manager | npm | Keep `package-lock.json` committed |

- Commands: `npm run dev`, `npm run build` (runs `tsc -b` then `vite build`), `npm run lint`, `npm run preview`.
- Routing: `src/main.tsx` mounts `AuthProvider` and `BrowserRouter`; `src/App.tsx` defines routes. `/login` renders `src/pages/LoginPage.tsx` on its own, without the app shell. All other routes sit behind `src/auth/RequireAuth.tsx` (signed-out visitors go to `/login` and come back afterwards) and under the shared `src/layouts/AppLayout.tsx` shell. `/` renders the blank `src/pages/HomePage.tsx`, `/learning` renders `src/pages/DemoPage.tsx` (the entry point for `LearningPathDemo`, labelled "Learning" in the navigation; the old `/demo` redirects there), `/scenarios` renders `src/scenarios/ScenariosPage.tsx`, `/scenarios/:scenarioId` renders `src/scenarios/ScenarioPage.tsx`, `/scenarios/:scenarioId/play` renders `src/sandbox/SandboxPage.tsx`, and unknown paths redirect to `/`. Use `Link`/`NavLink` for internal navigation. `AppLayout` owns the single `<main>` landmark, full-viewport sizing, and sticky navigation; pages render content only. Its `--app-header-height` CSS variable defines both the navigation height and the sticky offset for demo toolbars. Below the `md` breakpoint the main navigation, username and log-out button move into a hamburger menu (a panel under the header that closes on navigation, Escape or a tap outside); the header is also slightly shorter there (`--app-header-height` 4rem instead of 4.5rem). The demo keeps its local `activeView` navigation; leaving `/learning` unmounts it and resets its in-memory progress. Production hosts must fall back to `index.html` for client-side routes without rewriting `/api` requests.
- Mock login (hackathon only, no real authentication): the login page shows disabled social sign-in buttons (Google, Apple, Facebook) and a "Continue as guest" button that opens a username + email form. Submitting it calls `POST /api/users/login` (`userApi.loginUser`), which finds or creates the user by email; there is no password or token. `src/auth/AuthProvider.tsx` keeps the returned `User` (`id`, `username`, `email`) in memory and in `localStorage` (key `financeQuest.mockUser`). It passes the email to `setApiUserEmail` in `src/config/axios.ts`, whose request interceptor adds the `X-User-Email` header to every API call. The in-memory database forgets users on restart, so on a 401 the client calls the handler `AuthProvider` registers with `setUnauthorizedHandler`: it logs the same learner in again and the request is retried once. If that login fails, the learner is logged out. Read the user with `useAuth()` from `src/auth/authContext.ts` (`user`, `login`, `logout`; `login` rejects with `ApiError`). `AppLayout` shows the username and a log-out button.
- Backend connection: the frontend calls relative `/api/...` URLs, and the Vite dev server proxies `/api` to the backend at `http://localhost:8080` (`server.proxy` in `vite.config.ts`), so no CORS setup is needed. Set `VITE_API_BASE_URL` to point at a different backend.
- Light/dark theme: `src/theme/ThemeProvider.tsx` (mounted in `main.tsx`) toggles the `dark` class on `<html>`, which shadcn's `dark` variant and the `.dark` token block in `index.css` use; `:root` holds the light palette. The choice (`light`, `dark` or `system`, default `system`) is kept in `localStorage` under `financeQuest.theme`, and an inline script in `index.html` applies it before first paint. Read it with `useTheme()` from `src/theme/themeContext.ts`; `ThemeToggle.tsx` sits in the `AppLayout` header and on the login page. Use theme tokens rather than hard-coded hex colours. The learning path's chapter colours are `--topic-N-*` variables in `index.css` (light and dark values); `accentHex` is a fill behind dark text and `accentTextHex` is for text, and `withAlpha` in `learningPath.ts` makes translucent versions with `color-mix`.
- `src/model/` holds TypeScript types that mirror the backend's response DTOs in `backend/.../dto/`. When a DTO changes, update the matching type in the same change. `src/config/axios.ts` holds the axios setup (base URL, timeout, the `X-User-Email` request header, retry after re-login on 401, and an error interceptor that turns failures into `ApiError`). `src/api/` holds only endpoint functions, one module per resource (`chapterApi`, `subchapterApi`, `quizApi`, `questionApi`, `coachApi`, `userApi`, `instrumentApi`, `simulationApi`, `scenarioApi`), built on that client; components call these functions instead of using axios directly, and import `ApiError` from `@/config/axios` for error handling.
- `src/demo/` holds the learning-path demo. `DemoToolbar.tsx` owns its course progress display and complete-chapter/reset controls, separate from the shared application header. `learningPath.ts` builds the path from `GET /api/chapters` (each chapter's subchapters, then its final quiz as a test node) and gives each chapter a colour theme in chapter order. The final test is the last stop of each chapter (centred on mobile, where the pipe leads on to the next chapter); the path has no sandboxes. `LessonModal.tsx` loads a lesson and its control quiz, or a final quiz, and checks answers through `questionApi`: control quizzes let the learner retry until correct, and final quizzes allow one answer per question and pass at `passMark`. When the learner starts the questions (and again on "try again") it starts a saved attempt (`quizApi.startQuizAttempt`) and sends its id with each answer; if the attempt can't be started, answers are still checked, just not saved. The path's progress (completed nodes) is still kept in memory only and is not restored from saved attempts yet.
- `src/workspace/` is the mode-agnostic investing workspace and must never import from `src/playground/` (plan: `notes/investment-workspace-plan.md`). `WorkspaceLayout.tsx` has slots for header, notice, instruments, portfolio and action bar: two columns from `lg`, with an `aria-pressed` section switch below that. `components/` contains the controlled instrument list and filters, allocation dialog (`InstrumentPanel` / `AmountField`; a centred `Dialog` from `md`, a swipeable bottom `Drawer` below it, chosen with `useMediaQuery` from `src/hooks/`), holdings, allocation bar and SVG history charts. Reuse the existing shadcn/Base UI controls, including `Field`, `Select`, `Skeleton` and `ToggleGroup`; `Slider` accepts optional `thumbProps` for accessible thumb labels. `index.css` has `--gain` and `--loss` tokens; pair them with signs/arrows, never colour alone.
- `src/workspace/portfolio/` holds pure functions: `money.ts` formats integer cents and parses amounts with half-even rounding, rejecting malformed grouping (a single separator followed by exactly three digits means thousands); `portfolioReducer.ts` sets target position sizes, uses `planPosition` to describe/validate trades, and keeps a trade log (`unitsAfter`, cash delta, instrument and replay index). Amount is canonical and percentages are derived. Before replay, each relative price is 1 so units are cents; never use historical index levels as allocation prices. During replay, units are valued at the current simulated relative price; zero-valued positions can be removed without creating cash but cannot be bought at zero. `performance.ts` calculates each instrument's net contribution from its trade cash flows plus remaining value, so closed positions still count. Overall P/L is total value minus the starting budget; holding P/L is unrealised against remaining average cost.
- `/playground` implements the M3 portfolio builder and M4 replay: start with EUR 10,000, browse/search/filter the real catalogue, allocate by amount/percentage, and select 1/3/5/10 years (default 5). `src/playground/PlaygroundPage.tsx` owns **all application state in the page**, including catalogue/history caches, portfolio, filters, dialog/draft/chart selections, horizon, market data and clock. Components receive props; there is no provider, global store, persistence or URL state. Leaving or refreshing loses the run. `src/api/instrumentApi.ts` supplies catalogue and lazy/deduplicated history requests; failed histories can be retried without blocking allocations. `workspace/history.ts` uses original source dates and UTC formatting. Historical indices and the synthetic **This simulation** chart are separate views; neither is an executable real-world EUR price.
- Playground market loading uses `src/api/simulationApi.ts` → `POST /api/simulations/batch`: every available EUR instrument is simulated at base EUR 10,000, with the selected horizon and no explicit seeds. `playground/marketTape.ts` validates the requested instrument set, currency, dates, horizon, base, values and seed precision; invalid responses become retryable load errors, never fallback prices. `equityCurve.ts` reconstructs total value from the trade log through the current step. `workspace/components/ValueChart.tsx` receives only revealed generic date/value data, not Playground types. Full futures exist in the page for this unranked mode; future scored modes must keep them server-side until submission.
- Playground replay state is `idle` / `playing` / `finished`, with a step index. Start requires at least one holding and locks the horizon. Every selected horizon plays completely in **10 real seconds** (`SIMULATION_DURATION_MS` in `playground/config.ts`); there are no Pause, Resume, stepping, speed or mid-run reset controls. `playground/replay.ts` maps absolute elapsed time to market points. The clock, deadline timeout and synchronous refs remain in the page; dialogs, trades and hidden tabs do not pause or extend the deadline. Visibility/focus changes catch up after browser throttling; timers/listeners are cleaned up on unmount. Mid-run trading remains available: confirmation/removal samples the current time and price and revalidates the order, never executing a late trade after the deadline. At the final point, positions become read-only and `ReplaySummary.tsx` shows final value, overall return and largest gain/loss contributions including closed positions. **Start over** restores EUR 10,000 cash, clears trades, returns to step 0, and fetches fresh seeds while retaining horizon, filters, catalogue and history cache. Navigating away still discards page-local state. No Duel mode or coach integration is implemented here; the Sandbox mode lives in `src/sandbox/`.
- M5 responsive/state polish is complete, excluding the accessibility review at the user's request. The workspace header scrolls normally on viewports 650 px high or shorter so it cannot cover the controls together with the sticky footer. The header/action bar are compact on narrow screens; dialogs keep viewport margins and a scrollable body. Long names, error details and large monetary values wrap rather than overflow. Catalogue loading, failure, empty and no-simulatable-instrument states have specific header/footer messages; they never offer a non-functional market retry. Only an actual batch failure offers **Retry market**, and allocations survive retries. The history chart reserves space while loading and remains independent from the allocation editor. Formatting stays in EUR with cents and consistent percentages. Existing roles/focus behaviour remain; no accessibility audit or new frontend testing infrastructure was added.
- `/scenarios` (`src/scenarios/`) lists the sandbox scenarios from `GET /api/scenarios` (`scenarioApi.getScenarios`) as tiles grouped by chapter. A tile shows only the code, lessons, title, persona and goal (the goal box sits at the bottom so goals line up across a row); budget, horizon, instruments, money needs and rules are left for the scenario's own screen. `ScenariosPage.tsx` owns the load state (skeleton tiles, error with retry, empty); `ScenarioTile.tsx` renders one `Card` wrapped in a `Link` to `/scenarios/{id}` (the link is named by the code and title and described by the goal). The grid uses container queries (`@2xl` two columns, `@5xl` three) because the coach sidebar changes the content width.
- `/scenarios/:scenarioId` (`ScenarioPage.tsx`) loads one scenario with `scenarioApi.getScenario` and shows its full brief: persona, goal, a facts strip (budget, horizon, money needed, then instrument count or the retirement gap when there is one), money needs by day, allowed instruments plus cash, rules with the instruments they cover, how the score works (growth and stability weights, target/floor, max drop, rule penalty), the lessons it practises and what isn't simulated. Non-numeric ids and 404s show "Scenario not found"; other failures offer a retry. `format.ts` turns scenario amounts (euros) into the shared cent formatting and day counts into words ("about 9 months", "3 years"); `routes.ts` has `parseScenarioId` and the brief/play paths. The **Start scenario** link opens `/scenarios/{id}/play`.
- `/scenarios/:scenarioId/play` (`src/sandbox/`) is the workspace's **Sandbox mode**, built from the Playground's parts: `WorkspaceLayout`, `InstrumentList`, `InstrumentPanel`, `PortfolioList`, `AllocationBar`, `ValueChart` and `portfolioReducer` from `src/workspace/`, plus `replay.ts` and `SIMULATION_DURATION_MS` from `src/playground/` (`workspace/` still never imports either mode). `SandboxPage.tsx` loads the scenario, then `SandboxWorkspace` owns all state in the page like the Playground: the catalogue limited to the scenario's instruments in its order, the scenario's budget, no horizon picker. Phases: `planning` (allocate at price 1; `SandboxBrief.tsx` shows the goal, money needs and a live rules checklist from `rules.ts`, which uses the server's exact comparison in cents), `submitting` (`scenarioApi.runScenario`, 30 s timeout), `playing` (plan locked; the returned path replays in the same 10 seconds, revealing each money need as it is paid) and `finished` (`SandboxResult.tsx`: score and its parts, goal reached or not, final value, gain including money paid out, largest drop against the limit, money needs, and the previous run's score after a retry). An empty plan is allowed and runs as all cash. **Change plan** unlocks the same allocation for another run on the same market; a failed run keeps the plan and offers **Try again**. `runTimeline.ts` turns the response into cents and throws on misaligned series, so a bad response becomes a retryable error. `SandboxHeader.tsx` adds money paid out back into the change, so a planned bill isn't shown as a loss. `InstrumentPanel` takes an optional `readOnlyMessage` so each mode explains its own lock. Runs aren't saved and there is no coach debrief yet.
- `src/components/coach/CoachPanel.tsx` is the reusable AI coach chat, built from shadcn chat parts (`MessageScroller`, `Message`, `Bubble`, `Marker`), `InputGroup`, `Empty`, `Badge` and `Card`. Props, all optional: `subchapterId`, `questionId`, `selectedOptionId` (sent with every message as context), `answerCorrect` (only picks Hedgie's face), `contextLabel` (shown as "Hedgie sees: …"), `chat`, `title`, `description`, `suggestions`, and `className` for layout; it fills the height it is given. Fallback replies (`aiAvailable: false`) are marked "AI coach offline". Hedgie's faces are the SVGs in `public/` (`hedgie-powitanie`, `-wskazowka`, `-otucha`, `-radosc`), mapped in `src/components/coach/hedgie.ts` and shown with `HedgieAvatar.tsx`: greeting on the start screen, general replies and the floating button; hint while thinking and for an unanswered question; encouragement after a wrong answer and for offline or error replies; joy after a correct answer. Each reply keeps the face it got when it was sent.
- `src/components/coach/useCoachChat.ts` holds one conversation: entries, pending state and the `conversationId` from the first reply, sent back with every later message (the backend remembers the conversation; `askCoach` waits 60 s instead of the client's 10 s). Clearing drops the id. `CoachPanel` uses its own unless given `chat`; pass one from a component that outlives the panel (e.g. outside a dialog) to keep the conversation while the panel is closed, and remount that component (`key`) to start a new one.
- Coach focus: screens tell the coach what the learner is looking at through `src/components/coach/coachFocus.ts` (`usePublishCoachFocus` to publish, `useCoachFocus` to read) and the `CoachFocusProvider` in `AppLayout`. `LessonPage` (`LessonModal.tsx`) publishes the lesson, the current question, and the selected option and whether it was correct once its answer is checked. Its node id is the `scopeId`, so each lesson or test gets its own conversation.
- `src/components/coach/CoachSidebar.tsx` is mounted by `AppLayout` on every route. On desktop it pairs route content and the coach in a resizable horizontal panel group; the content pane owns vertical scrolling (it scrolls back to the top whenever the route's path changes), and the sidebar stays at viewport height. The sidebar starts collapsed, opens with a short slide/fade and panel resize, and can be resized or closed. On smaller screens (below `lg`) the Ask Hedgie button opens the same conversation in a bottom drawer (shadcn `Drawer` on Base UI, swipe down or tap outside to close). The floating Ask Hedgie buttons move up above a workspace action bar (`WorkspaceLayout` marks it `data-workspace-action-bar`; the sidebar root is `group/coach`), so they never cover Start or Run. Changing coach focus starts a new conversation without resetting the sidebar layout.

## Testing policy

Keep testing minimal unless the user asks for more.

- **Default: test the service layer only.** When adding or changing backend behaviour, write JUnit tests for the affected `service/` classes. Do not add controller, repository, MockMvc/integration or frontend tests unless the user explicitly asks for them.
- **Keep test cases few and focused.** Cover the happy path and the key edge cases of each changed method (for example a boundary value, a rejected input, or an invariant the code must keep). Do not write exhaustive matrices, many near-duplicate cases, or tests of trivial getters and mappings.
- **The frontend has no test runner and gets no tests by default.** Verify frontend changes with `npm run build`, `npm run lint` and a manual check. Do not add a test dependency unless the user asks.
- **When the user asks for more testing, do exactly what they specify** (for example more cases, a different layer, or a new tool), and update the Tech stack tables if a dependency is added.
- Existing tests stay in place and must keep passing; this policy governs new work.

## Keeping this section up to date

**Whenever the user asks you to add, remove, upgrade or replace a dependency, update this Tech stack chapter in the same change.** Follow these steps:

1. Change the dependency in the right manifest: `backend/pom.xml`, or `frontend/package.json` through `npm install` so that `package-lock.json` is updated too.
2. Add, edit or remove its row in the matching table above, with the version (or version range) and a short note on what it's for.
3. If the dependency brings new configuration, commands, ports or conventions (for example a new `application.properties` key or an npm script), record them in the bullet list under that table.
4. Mention the AGENTS.md update when you summarize the change for the user.

Treat a dependency change as unfinished until this chapter matches the manifests.
