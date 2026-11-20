# Finance Quest

## Learn investing. Practice safely. Build confidence.

## 1. Concept

**Finance Quest is a gamified financial-learning application that combines Duolingo-style lessons, an AI learning coach, and a fictional investing sandbox.**

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

> **Finance Quest turns financial learning into an interactive adventure. Learn the basics, test your decisions with virtual money, get guidance from an AI coach, and compete on the quality of your plan, not just your luck.**

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
| Testing | Spring Boot test (Web MVC), JUnit Jupiter | `spring-boot-starter-webmvc-test`; transitively includes JUnit Jupiter 6.1.3, parameterized tests, and its engine |
| Build | Maven, through the wrapper | `./mvnw` (`mvnw.cmd` on Windows) |

- Base package: `com.flexpol.backend`, with `model/`, `model/enums/`, `repository/`, `dto/`, `service/`, `simulation/`, and `controller/` subpackages. There is no `entity/` package or user model.
- `dto/` contains only records directly used as endpoint requests/responses; supporting records belong in `model/`.
- The schema is recreated on every startup (`ddl-auto=create-drop`), and `src/main/resources/data.sql` seeds it.
- The H2 console is at `http://localhost:8080/h2-console`.
- Commands: `./mvnw spring-boot:run` starts the app; `./mvnw test` runs the tests.
- Instrument catalog/detail/history GET endpoints and `POST /api/simulations` are implemented. Simulations run on demand without persistence; `GBM` uses configured drift/volatility and a reproducible seed, and `FIXED_RATE` supports ACT/365 accrual with STOP-at-maturity behavior. The current seed contains only market instruments; no deposit fixture is API-selectable yet.
- Simulation requests and responses use `durationDays` (1–10,950 calendar days, approximately 30 years) and support positive investments up to EUR 1,000,000,000,000, rounded to cents. Requested end dates use `startDate.plusDays(durationDays)`; fixed-rate product maturity still uses `termMonths`. Unknown instruments return 404; undefined/out-of-bounds inputs return 400. Model/configuration failures do not silently fall back to another engine.
- GBM uses a calendar-day horizon but emits the initial point and weekday points, skipping intermediate weekend dates. If the end date is a weekend, one terminal carry-forward point is included without a random draw. A 10-day request from 20 November 2026 ends on 30 November and returns 7 points, not 10 or 11.
- Run `bash mvnw test` from `backend/`. The current tests cover application startup, the calendar-day `durationDays` endpoint contract, sparse weekday output, weekend endpoints, the exact seed-67 example, horizon bounds, and rejection of the obsolete month-only request format.

## Frontend (`frontend/`)

| Area | Technology | Version / notes |
|---|---|---|
| UI library | React + React DOM | ^19.3 |
| Language | TypeScript | ~7.0 |
| Build tool / dev server | Vite with `@vitejs/plugin-react` | Vite ^8.3, plugin ^6.1 |
| Linting | oxlint | ^1.90, configured in `.oxlintrc.json` |
| Package manager | npm | Keep `package-lock.json` committed |

- Commands: `npm run dev`, `npm run build` (runs `tsc -b` then `vite build`), `npm run lint`, `npm run preview`.

## Keeping this section up to date

**Whenever the user asks you to add, remove, upgrade or replace a dependency, update this Tech stack chapter in the same change.** Follow these steps:

1. Change the dependency in the right manifest: `backend/pom.xml`, or `frontend/package.json` through `npm install` so that `package-lock.json` is updated too.
2. Add, edit or remove its row in the matching table above, with the version (or version range) and a short note on what it's for.
3. If the dependency brings new configuration, commands, ports or conventions (for example a new `application.properties` key or an npm script), record them in the bullet list under that table.
4. Mention the AGENTS.md update when you summarize the change for the user.

Treat a dependency change as unfinished until this chapter matches the manifests.
