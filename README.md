# HedgeFlex

## Project Name

HedgeFlex

## One-Line Summary

HedgeFlex is a gamified app that takes beginner self-directed investors from bite-sized lessons to AI-coached practice with virtual money in realistic life scenarios.

## Technology Stack

Spring Boot, Spring Data JPA, Spring AI, React, React Router, Tailwind CSS, shadcn/ui on Base UI, Three.js, react-markdown, Flyway, Terraform, OpenAI API.

## Project Overview

### THE PROBLEM

Many beginner self-directed investors know the vocabulary (risk, diversification, ETFs, bonds) but freeze when they have to make an actual decision: how much to put where, for which goal, and for how long. Courses and articles stay theoretical, trading apps reward speculation and short-term returns, and learning by losing real money is expensive and discouraging. The gap between knowing a concept and confidently applying it affects people at every life stage, from a first job to the year before retirement, and it leads to money left idle in cash or put into products that don't fit the goal.

### YOUR SOLUTION

HedgeFlex is a safe place to go from knowledge to action. It combines three things:

- **Duolingo-style learning path**: short lessons with interactive practice and a final test per chapter.
- **Hedgie, an AI learning coach** that sees what the learner sees (the lesson, the question, their checked answer, their plan and their run result) and gives hints before answers.
- **A virtual-money sandbox** where learners plan investments for fictional personas at different life stages (a young investor, a home deposit, a child's university fund, retirement next year).

What makes it different is how plans are judged. A plan is not ranked by how much money it made but by how well it fits the persona's goal, time horizon and cash needs. Every learner gets the same simulated market, and the 1–5 star rating explains each star: growth, reaching the goal, suitable instruments, sensible shares. A lucky gamble still scores badly, and a well-built plan is rewarded even in a weak market. The learner is rated on the quality of the plan, not on luck.

### THE WORKING PROTOTYPE

Everything below is implemented and running on Google Cloud Run:

- **Guest login** (mock, no password) and a Home page with the course overview.
- **Learning path**: 3 chapters (*Why Invest?*, *Know Your Instruments*, *Investing Through Life*), 19 lessons and 117 questions. Question types include multiple choice, card sorting and matching, number dials, slider "labs" (Time machine, The lockbox, Crash test) and what-if portfolio comparisons where the learner predicts which portfolio loses more before revealing it. Practice quizzes allow retries with hints; chapter tests are scored with a pass mark. Quiz attempts are saved per learner. A 3D Hedgie mascot celebrates finished lessons and reacts to wrong answers.
- **Scenarios (Sandbox mode)**: 4 personas, each with a brief (budget, horizon, money needs on given days, allowed instruments, rules). The learner allocates the budget, runs the plan, watches it replay in the scenario's simulated market while planned bills are paid, and gets a star rating with the reason for every star. **Change plan** lets them retry on the same market and compare with the previous run.
- **AI coach**: available in a resizable sidebar on desktop and a drawer on mobile. It explains concepts, gives hints without giving away the answer, and after a scenario run debriefs the result with ideas to test.
- **Playground**: EUR 10,000 and a catalogue of 20 real instruments (12 stocks, 8 ETFs) with historical charts, replayed on a synthetic future, with trading during the replay and no scoring.
- Light and dark theme, responsive layout for desktop and mobile.

### BEHIND THE BUILD

**Architecture.** A React 19 + TypeScript (Vite) frontend and a Spring Boot 4 (Java 25) REST API are built into one Docker image and deployed to Google Cloud Run. Data lives in Supabase PostgreSQL (with Flyway migrations); locally the app runs on in-memory H2. The Google Cloud resources (Cloud Run, Secret Manager, Artifact Registry, Workload Identity Federation for GitHub Actions) are managed with Terraform.

**Key decisions:**

- **The server is the source of truth.** Correct answers, explanations, market seeds and scoring data never reach the browser before the learner submits. Simulations (geometric Brownian motion with reproducible seeds) and star scoring run on the server, so every learner and retry gets the same market.
- **An honest AI coach.** The coach uses Spring AI with the OpenAI API. Instead of asking the model to compute anything, the backend builds its context from server-side data: the question as shown on screen, how much it may reveal at this moment, and for scenarios the actual run result recomputed on the server. The model explains numbers but never invents them. Conversations are stored in the database and belong to the learner.
- **Verified scoring.** A checker script runs every scenario on many random markets and confirms that good reference plans score at least 80, trap plans at most 50, and that breaking a rule always costs a star.

**Built upon:** Spring Boot, Spring Data JPA, Spring AI, React, React Router, Tailwind CSS, shadcn/ui on Base UI, Three.js, react-markdown, Flyway, Terraform and the OpenAI API.

**Created by our team during the hackathon:** all learning content and scenarios, the content pipeline, the simulation and scenario evaluation engine, the star rating, the quiz and exercise system, the coach's context and safety logic, the investing workspace (Sandbox and Playground), the Hedgie mascot and its art, and the cloud infrastructure.

### CHALLENGES AND DISCOVERIES

- **Rewarding the right behaviour.** Our first idea was to rank plans by return, but that simply rewarded gambling on the riskiest asset. We switched to transparent star criteria based on fit to the goal, and wrote a checker that tests them on many random markets. The ranges are deliberately a spectrum, so there is no single "correct" answer to memorise.
- **Keeping the AI truthful.** Longer prompts did not stop the model from guessing results or doing arithmetic wrong. Giving it exact, server-computed numbers and the precise state of the screen worked far better than any instruction.
- **Hints, not answers.** The coach had to be helpful without spoiling quizzes. We defined, per question type and per moment (before an answer, after a wrong one, after a correct one), exactly what the coach is allowed to reveal.

### RESULTS AND NEXT STEPS

**Achieved:** a complete, deployed learning loop: lesson → interactive quiz → scenario plan → simulated market → star rating → AI debrief → improved plan.

**Validation:** JUnit tests for the backend services (content, quiz attempts, simulations, scenario runs and star boundaries, the coach's context), the scenario checker script that proves the scoring rewards good plans and punishes trap plans, frontend type checking and linting on every build, and manual testing on desktop and mobile.

**Most proud of:** an AI coach that knows exactly what the learner sees, gives hints before answers, and never invents a number, combined with a rating that teaches that a good plan matters more than a lucky result.

**Current limitations:** mock login without passwords; learning-path progress is not restored after a refresh; instruments in a simulation move independently (no correlation); four scenarios only; no testing with real learners yet.

**Next:** real accounts and saved progress, the Quest Arena and leaderboard, more scenarios and life stages, correlated market simulation, and user testing with beginner investors to measure how their confidence and decisions change.
