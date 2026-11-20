# HedgeFlex — Sandbox Scenarios (Chapters 2 and 3)

**Status:** draft spec, not implemented yet. Chapter 1 keeps its own mission, "The Two-Year Goal" (see [learning-chapters.md](learning-chapters.md)), and is out of scope here.

> All people, instruments, prices, rates and events in this file are fictional and synthetic. They illustrate ideas from the lessons. They don't predict real returns and are not product recommendations.

**Structured data:** the machine-readable version of everything below (defaults, the instrument catalog and all 12 scenarios) is [sandbox-scenarios.json](sandbox-scenarios.json). That file is the source of truth for values. This file explains them for people. When you change a value, change both in the same commit. If they disagree, the JSON wins.

## 1. What a scenario is

A scenario is a "real-life" test. The learner meets a fictional person with a goal, a sum of money, a time horizon and a life situation. They choose instruments and the share of each one in the portfolio. The simulation runs, and the result is calculated from how the portfolio grew.

Every scenario has its **own horizon, its own starting amount and its own life situation**. No two scenarios share any of them.

### Flow

1. **Brief:** the person, their situation, the goal, the horizon and the known money needs along the way.
2. **Allocate:** pick instruments from the scenario's list and set the shares in 5% steps, adding up to 100%.
3. **Run:** the backend simulates the portfolio on a fixed set of market paths (see §4).
4. **Result:** growth (nominal and after inflation), whether the goal was reached, the bad-case outcome, and the score.
5. **Debrief:** Hedgie explains the result from the numbers the backend returns. It never invents outcomes or scoring rules.
6. **Retry:** the learner changes the allocation and compares the new result with the previous one.

### What the learner sees before allocating

- The person, their situation and their goal (target value and horizon)
- Any money needs along the way (amount and day)
- Each available instrument's properties: risk level, expected yearly return range, liquidity, lock term, early-withdrawal penalty and yearly fee

The learner doesn't see the reference allocation, the floor value or the scoring weights. These are used by the score and by Hedgie's debrief after the run.

## 2. Shared rules

| Rule | Value |
|---|---|
| Currency | EUR (fictional amounts) |
| Shares | 5% steps, total exactly 100%, at least one instrument |
| Start date | The date the run starts. Horizon end = `startDate.plusDays(durationDays)`, as in the current simulation API |
| Inflation | Fictional, fixed 3.0% a year, used for "real value" (in today's euros) |
| Fees | Each instrument's yearly fee, charged daily on its value |
| Tax | Off, except in scenario 3.6 (see there) |
| Money needs | Paid on the stated day, following the withdrawal order below |
| Rebalancing | None. Each holding grows on its own after day 0 (rebalancing is a later two-step scenario, see §8) |

### Withdrawal order for a money need

When a scenario needs money on a given day, the simulation takes it in this order until the amount is covered:

1. Savings account
2. Deposits that have already matured
3. Bond funds, at that day's price
4. Baskets, funds, stocks and HypeCoin, in proportion to their value, at that day's price (this is how a crash can force selling at a loss)
5. Deposits that haven't matured and the retirement account, with their early-withdrawal penalty

If the whole portfolio can't cover the need, the shortfall is recorded, and the goal counts as **not reached** on that path.

## 3. Instrument catalog (fictional)

These instruments replace the real ETFs and company stocks currently in `data.sql` for sandbox scenarios. Their parameters are illustrative starting values. They can be calibrated from the volatility and drift of the seeded instruments, but the names shown to learners stay fictional.

| Key | Name | Model | Expected yearly return | Volatility (σ) | Market correlation (ρ) | Yearly fee | Liquidity | Notes |
|---|---|---|---|---|---|---|---|---|
| `SAVINGS` | Easy Access Savings | FIXED_RATE | 2.0% | 0 | 0 | 0% | Any day, free | |
| `DEPOSIT_1Y` | Locked Deposit 1 year | FIXED_RATE | 3.0% | 0 | 0 | 0% | Locked 12 months | Penalty* |
| `DEPOSIT_2Y` | Locked Deposit 2 years | FIXED_RATE | 3.3% | 0 | 0 | 0% | Locked 24 months | Penalty* |
| `DEPOSIT_3Y` | Locked Deposit 3 years | FIXED_RATE | 3.5% | 0 | 0 | 0% | Locked 36 months | Penalty* |
| `DEPOSIT_5Y` | Locked Deposit 5 years | FIXED_RATE | 3.8% | 0 | 0 | 0% | Locked 60 months | Penalty* |
| `BOND_GOV` | Steady State Bond Fund | GBM | 3.0% | 4% | 0.0 | 0.15% | Any day, market price | Government bonds |
| `BOND_HY` | Rocket Corp High-Yield Fund | GBM | 5.5% | 10% | 0.5 | 0.5% | Any day, market price | Weaker borrowers, credit risk |
| `BASKET_WORLD` | World Market Basket | GBM | 7.0% | 15% | 1.0 | 0.2% | Any day, market price | Broad index basket; it *is* the market factor |
| `FUND_ACTIVE` | Premium Star Active Fund | GBM | 7.0% | 16% | 0.98 | 1.8% | Any day, market price | Same market as the basket, much higher fee |
| `BASKET_TECH` | Tech Leaders Basket | GBM | 8.5% | 22% | 0.85 | 0.4% | Any day, market price | Narrow theme, less diversified than it looks |
| `STOCK_NOVA` | Nova Robotics (single stock) | GBM | 9.0% | 35% | 0.6 | 0% | Any day, market price | Concentrated |
| `STOCK_HELIO` | Helio Foods (single stock) | GBM | 6.0% | 22% | 0.6 | 0% | Any day, market price | Concentrated |
| `HYPE` | HypeCoin | GBM | 0% | 90% | 0.3 | 1.0% | Any day, market price | Speculative, no underlying income |
| `HYPE_2X` | HypeCoin 2× Leveraged | GBM, knock-out | 0% | 180% | 0.3 | 3.0% | Any day, market price | Value is 0 for good once it falls 50% from start |
| `PENSION_WORLD` | Retirement Account: World Basket | GBM (as `BASKET_WORLD`) | 7.0% | 15% | 1.0 | 0.2% | Locked to scenario end | Tax-free growth; early withdrawal: 10% penalty and tax |
| `PENSION_BOND` | Retirement Account: Bond Mix | GBM (as `BOND_GOV`) | 3.0% | 4% | 0.0 | 0.15% | Locked to scenario end | Same wrapper rules |

\* **Deposit early-withdrawal penalty:** the withdrawn amount loses all interest it has earned so far, plus 1% of the amount. The rest of the deposit keeps running. After maturity a deposit stops growing (the FIXED_RATE engine's existing STOP-at-maturity behavior), so choosing a term much shorter than the horizon also has a cost.

**Correlated moves.** Each GBM instrument's daily log return uses one shared market draw `Zm` and its own draw `Zi`:

```
r_i = (μ_i − σ_i²/2)·dt + σ_i·(ρ_i·Zm + √(1 − ρ_i²)·Zi)·√dt
```

Without this, separate simulations would make instruments move independently and overstate diversification.

**Scripted shocks.** Some scenarios add a one-day shock on a given day, such as "markets −35%". It moves each GBM instrument by `shock × ρ_i` on top of its random path, and is the same on every path. An instrument-specific shock, such as Nova Robotics −50%, applies to that instrument only.

## 4. How the result is calculated

Growth is the result. Growth on a single random path would reward luck, and "100% stocks" would win almost every time. So each run is measured on many paths, and the outcome is read against the scenario's goal.

### Paths

- Each scenario has a fixed `scenarioSeed`. A run uses **N = 200 paths** with seeds `scenarioSeed + 0 … scenarioSeed + 199`, so every learner and every retry faces the same markets. This makes Quest Arena fair.
- One fixed path, the **story path** (seed `scenarioSeed + 0`), is returned with daily points so the frontend can draw a chart. The other 199 paths only return their final values.

### Metrics (all in the scenario's target unit: nominal or real)

| Metric | Meaning |
|---|---|
| `medianFinal` | Median final value across the 200 paths |
| `p5Final` / `p95Final` | Bad case / good case (5th and 95th percentile) |
| `medianGrowth` | `medianFinal / startAmount − 1`, after money needs are paid |
| `goalProbability` | Share of paths where final value ≥ `target` and no money need had a shortfall |
| `safetyProbability` | Share of paths where final value ≥ `floor` |

### Score (0–100)

```
GoalScore   = 100 × goalProbability
SafetyScore = 100 × safetyProbability
GrowthScore = 100 × clamp((medianFinal − floor) / (target − floor), 0, 1)

Score = wGoal × GoalScore + wSafety × SafetyScore + wGrowth × GrowthScore − rulePenalties
        (clamped to 0–100; the three weights add up to 1)
```

- **Weights** differ by scenario. Short horizons and fragile situations weight safety more, and long horizons weight growth more.
- **Rule penalties:** −15 points for each broken rule (for example HypeCoin above 5%). Rules are listed per scenario. Money costs, such as deposit penalties and forced sales, are not rule penalties: they already reduce the simulated value.
- **Calibration acceptance test:** for each scenario, the reference allocation must score **≥ 80**, and each listed trap must score **≤ 50**. If not, adjust `target` and `floor` (not the instruments) until it holds.

The targets and floors below are first estimates from the parameters in §3. Recheck them with the acceptance test once the engine exists.

## 5. Chapter 2 scenarios — Know Your Instruments

### 2.1 "Kuba's Safety Cushion"

| Field | Value |
|---|---|
| Lessons | 2.1 Cash and savings, 2.2 Deposits |
| Person | Kuba, 24, first job on a 6-month contract that may not be renewed, no savings cushion |
| Amount | €6,000 |
| Horizon | 1 year (365 days) |
| Money needs | €2,500 car repair on day 120 |
| Goal | Pay the repair without a loss and still have the cushion at the end |
| Target / floor | ≥ €3,550 nominal / €3,450 nominal |
| Weights | goal 0.35, safety 0.50, growth 0.15 |
| Instruments | `SAVINGS`, `DEPOSIT_1Y`, `DEPOSIT_3Y`, `BASKET_WORLD`, `STOCK_NOVA`, `HYPE` |
| Rules | None |
| Reference allocation | 70% `SAVINGS`, 30% `DEPOSIT_1Y` (100% `SAVINGS` also passes) |
| Traps | 100% `BASKET_WORLD` ("it grows more"): the repair may be paid from a falling basket. 100% `DEPOSIT_3Y`: penalty on the repair, and the rest still locked |
| Debrief points | An emergency fund needs liquidity first; a year is too short to recover from a drop; inflation is a smaller risk than a forced sale here |

### 2.2 "Lena and Tom's Wedding"

| Field | Value |
|---|---|
| Lessons | 2.2 Deposits and bonds |
| Person | Lena and Tom, both 29, wedding booked for a fixed date in 2 years, venue paid on that day |
| Amount | €18,000 |
| Horizon | 2 years (730 days) |
| Money needs | The whole amount on day 730 (end of horizon) |
| Goal | Have the full wedding budget on the day |
| Target / floor | ≥ €19,000 nominal / €18,500 nominal |
| Weights | goal 0.45, safety 0.45, growth 0.10 |
| Instruments | `SAVINGS`, `DEPOSIT_2Y`, `DEPOSIT_3Y`, `BOND_GOV`, `BOND_HY`, `BASKET_WORLD` |
| Rules | None |
| Reference allocation | 70% `DEPOSIT_2Y`, 20% `BOND_GOV`, 10% `BASKET_WORLD` |
| Traps | 100% `DEPOSIT_3Y` (higher rate, but it matures after the wedding: penalty). 60% `BOND_HY` ("higher interest"): credit risk, with prices that can be down on the day |
| Debrief points | Match the term to the date; a higher rate usually means a riskier borrower or less access |

### 2.3 "Marek's Favourite Company"

| Field | Value |
|---|---|
| Lessons | 2.3 Stocks, 2.4 Funds and ETFs |
| Person | Marek, 33, engineer with a stable job and an emergency fund already in place. A big fan of Nova Robotics and wants to "go all in" |
| Amount | €25,000 |
| Horizon | 10 years (3,650 days) |
| Events | Day 1,500: Nova Robotics −50% (product recall, Nova only) |
| Goal | Long-term growth |
| Target / floor | ≥ €31,000 real / €20,000 real |
| Weights | goal 0.35, safety 0.30, growth 0.35 |
| Instruments | `SAVINGS`, `BOND_GOV`, `BASKET_WORLD`, `BASKET_TECH`, `STOCK_NOVA`, `STOCK_HELIO` |
| Rules | Single stocks above 20% in total: −15 |
| Reference allocation | 75% `BASKET_WORLD`, 10% `BOND_GOV`, 10% `STOCK_NOVA`, 5% `SAVINGS` |
| Traps | 100% `STOCK_NOVA`. 50% `BASKET_TECH` + 50% `STOCK_NOVA` (looks spread, but it is one theme) |
| Debrief points | A single stock carries the full damage of one company's problems; a narrow basket is less diversified than it looks; a stock fits as a small part of a long-term mix |

### 2.4 "Zofia and the Premium Fund"

| Field | Value |
|---|---|
| Lessons | 2.4 Funds, 2.5 Costs and fees |
| Person | Zofia, 45, inherited money. An adviser recommends the "Premium Star" active fund with glossy marketing |
| Amount | €80,000 |
| Horizon | 20 years (7,300 days) |
| Money needs | None |
| Goal | Grow the inheritance for later life |
| Target / floor | ≥ €120,000 real / €70,000 real |
| Weights | goal 0.35, safety 0.25, growth 0.40 |
| Instruments | `SAVINGS`, `BOND_GOV`, `BASKET_WORLD`, `FUND_ACTIVE`, `STOCK_HELIO` |
| Rules | None |
| Reference allocation | 75% `BASKET_WORLD`, 20% `BOND_GOV`, 5% `SAVINGS` |
| Traps | 80% `FUND_ACTIVE` + 20% `BOND_GOV` (same market, about 1.6% a year more in fees). 100% `SAVINGS` (inflation) |
| Result extra | Show the total fees paid on the story path, per instrument |
| Debrief points | Fees compound against you; the active fund moves like the basket but keeps less; ask what the extra cost buys |

### 2.5 "Olek's Group-Chat Tip"

| Field | Value |
|---|---|
| Lessons | 2.6 High-risk and speculative assets |
| Person | Olek, 21, student with savings from a summer job. A group chat says HypeCoin "can't lose" and "will 10× by spring". Next semester's tuition comes out of this money |
| Amount | €4,000 |
| Horizon | 18 months (548 days) |
| Money needs | €2,000 tuition on day 270 |
| Goal | Pay the tuition and keep the rest |
| Target / floor | ≥ €2,050 nominal / €1,950 nominal |
| Weights | goal 0.35, safety 0.50, growth 0.15 |
| Instruments | `SAVINGS`, `DEPOSIT_1Y`, `BASKET_WORLD`, `HYPE`, `HYPE_2X` |
| Events | Hype cycle on `HYPE` and `HYPE_2X` only: +120% spread over days 30–150, then −80% over days 151–240 (on every path, on top of the random moves) |
| Rules | `HYPE` above 5%: −15. Any `HYPE_2X`: −15 |
| Reference allocation | 65% `SAVINGS`, 30% `DEPOSIT_1Y`, 5% `HYPE` (0% `HYPE` also passes) |
| Traps | 100% `HYPE`. 50% `HYPE_2X` + 50% `SAVINGS` |
| Debrief points | Speculation is a bet on price; never with money needed soon; leverage multiplies losses; the hype cycle peaks before the crash, and late buyers lose most |

### 2.6 "Nina's Home Deposit"

| Field | Value |
|---|---|
| Lessons | 2.7 Comparing instruments (chapter wrap-up) |
| Person | Nina, 40, renting, steady job, emergency fund in place, plans to buy a flat in 5 years |
| Amount | €40,000 |
| Horizon | 5 years (1,826 days) |
| Money needs | The whole amount at the end of the horizon |
| Goal | €46,000 for the home deposit |
| Target / floor | ≥ €46,000 nominal / €40,000 nominal |
| Weights | goal 0.40, safety 0.35, growth 0.25 |
| Instruments | All chapter 2 instruments: `SAVINGS`, `DEPOSIT_1Y`, `DEPOSIT_2Y`, `DEPOSIT_3Y`, `DEPOSIT_5Y`, `BOND_GOV`, `BOND_HY`, `BASKET_WORLD`, `FUND_ACTIVE`, `BASKET_TECH`, `STOCK_NOVA`, `STOCK_HELIO`, `HYPE` |
| Rules | `HYPE` above 5%: −15 |
| Reference allocation | 40% `BOND_GOV`, 35% `BASKET_WORLD`, 25% `DEPOSIT_5Y` |
| Traps | 100% `SAVINGS` (misses the target). 100% `BASKET_WORLD` (a drawdown just before the purchase can break the floor) |
| Debrief points | A medium horizon needs a balance of growth and safety; use the five questions (risk, return, liquidity, cost, horizon) on each pick |

## 6. Chapter 3 scenarios — Investing Through Life

### 3.1 "Paula's Uneven Income"

| Field | Value |
|---|---|
| Lessons | 3.1 Your life stage changes your plan |
| Person | Paula, 31, single parent, freelance designer with irregular income. Saving for a child's school costs |
| Amount | €12,000 |
| Horizon | 7 years (2,557 days) |
| Money needs | €3,000 on day 900 (two quiet months with no clients) |
| Goal | A school fund that survives a bad year |
| Target / floor | ≥ €9,800 real / €8,000 real |
| Weights | goal 0.35, safety 0.45, growth 0.20 |
| Instruments | `SAVINGS`, `DEPOSIT_3Y`, `BOND_GOV`, `BASKET_WORLD`, `STOCK_NOVA` |
| Rules | None |
| Reference allocation | 15% `SAVINGS`, 50% `BOND_GOV`, 35% `BASKET_WORLD` |
| Traps | 100% `BASKET_WORLD` ("7 years is long"): the income gap can force a sale in a drop. 100% `DEPOSIT_3Y`: penalty on day 900 |
| Debrief points | Age and horizon aren't the whole picture: unstable income and dependents lower risk capacity |

### 3.2 "Ewa's First Salary"

| Field | Value |
|---|---|
| Lessons | 3.2 Starting out (18–30) |
| Person | Ewa, 23, first full-time job, no expensive debt, emergency fund already built. Investing the first savings for retirement |
| Amount | €5,000 |
| Horizon | 30 years (10,950 days, the API maximum) |
| Events | Day 1,100: markets −30% |
| Goal | Grow as much as possible for retirement |
| Target / floor | ≥ €11,000 real / €2,500 real |
| Weights | goal 0.35, safety 0.15, growth 0.50 |
| Instruments | `SAVINGS`, `DEPOSIT_5Y`, `BOND_GOV`, `BASKET_WORLD`, `FUND_ACTIVE`, `HYPE` |
| Rules | `HYPE` above 5%: −15 |
| Reference allocation | 90% `BASKET_WORLD`, 10% `BOND_GOV` |
| Traps | 100% `SAVINGS` ("safe"): loses about a quarter of its real value. 100% `FUND_ACTIVE` (the fee drag over 30 years) |
| Debrief points | A long horizon and human capital allow growth; the year-3 crash is recovered; starting early is the biggest advantage |

### 3.3 "Sam's University Fund"

| Field | Value |
|---|---|
| Lessons | 3.3 Building up (30–50) |
| Person | Sam, 38, steady income, two children. Saving for the eldest's university |
| Amount | €60,000 |
| Horizon | 15 years (5,475 days) |
| Money needs | €5,000 on day 2,190 (house repair) |
| Goal | €75,000 in today's euros when the eldest starts university |
| Target / floor | ≥ €75,000 real / €50,000 real |
| Weights | goal 0.40, safety 0.25, growth 0.35 |
| Instruments | `SAVINGS`, `DEPOSIT_5Y`, `BOND_GOV`, `BOND_HY`, `BASKET_WORLD`, `BASKET_TECH`, `STOCK_NOVA`, `STOCK_HELIO` |
| Rules | Single stocks above 20% in total: −15 |
| Reference allocation | 65% `BASKET_WORLD`, 30% `BOND_GOV`, 5% `SAVINGS` |
| Traps | 40% `STOCK_NOVA` + 40% `STOCK_HELIO` + 20% `SAVINGS` (concentrated). 100% `DEPOSIT_5Y` (stops at year 5, then flat for 10 years) |
| Debrief points | Each goal gets its own horizon and mix; a small cash part covers surprises so the investments can stay put |

### 3.4 "Danuta's Glide Path"

| Field | Value |
|---|---|
| Lessons | 3.4 Approaching retirement (50+) |
| Person | Danuta, 55, savings at their largest, plans to retire at 67. Has been 100% in the market basket for 20 years |
| Amount | €250,000 |
| Horizon | 12 years (4,383 days) |
| Events | Day 3,650 (age 65): markets −35% |
| Goal | Protect what's been built and keep growing with inflation |
| Target / floor | ≥ €260,000 real / €200,000 real |
| Weights | goal 0.35, safety 0.45, growth 0.20 |
| Instruments | `SAVINGS`, `DEPOSIT_5Y`, `BOND_GOV`, `BOND_HY`, `BASKET_WORLD`, `BASKET_TECH` |
| Rules | None |
| Reference allocation | 55% `BASKET_WORLD`, 40% `BOND_GOV`, 5% `SAVINGS` (the lesson's glide path at 55, rounded to 5% steps) |
| Traps | 100% `BASKET_WORLD` ("it worked so far"): the age-65 crash hits the largest balance. 100% `SAVINGS`: inflation over 12 years |
| Debrief points | Shift from growing to protecting gradually; even near retirement part of the money stays invested for growth |

### 3.5 "Henryk Retires Next Year"

| Field | Value |
|---|---|
| Lessons | 3.4 Approaching retirement (sequence risk) |
| Person | Henryk, 64, retires in a year and will live on these savings for the first years |
| Amount | €400,000 |
| Horizon | 3 years (1,095 days) |
| Money needs | €32,000 on day 365 and €32,000 on day 730 (yearly spending) |
| Events | Day 200: markets −30% |
| Goal | Fund both years of spending and keep the rest for later retirement |
| Target / floor | ≥ €340,000 nominal / €300,000 nominal |
| Weights | goal 0.35, safety 0.50, growth 0.15 |
| Instruments | `SAVINGS`, `DEPOSIT_1Y`, `DEPOSIT_2Y`, `BOND_GOV`, `BOND_HY`, `BASKET_WORLD` |
| Rules | None |
| Reference allocation | 10% `SAVINGS`, 10% `DEPOSIT_1Y`, 40% `BOND_GOV`, 40% `BASKET_WORLD` (about two years of spending kept safe) |
| Traps | 100% `BASKET_WORLD`: both withdrawals are paid by selling after the crash. 100% `DEPOSIT_2Y`: the day-365 withdrawal pays a penalty |
| Debrief points | Sequence risk: the same drop hurts more when withdrawals start; a 1–3 year cash buffer avoids selling at the bottom |

### 3.6 "Ola Minds the Gap"

| Field | Value |
|---|---|
| Lessons | 3.5 Why invest for a pension, 3.6 Pension vehicles |
| Person | Ola, 40, expects a public pension of €1,800 a month against €3,000 needed: a gap of about €288,000 over 20 years of retirement. Has no separate emergency fund |
| Amount | €30,000 |
| Horizon | 25 years (9,131 days) |
| Money needs | €4,000 on day 1,000 (an emergency) |
| Tax | On: a fictional 20% tax on gains when the money leaves a non-pension instrument at the end. `PENSION_*` growth is tax-free if the money stays in until the end |
| Goal | Close as much of the retirement gap as possible |
| Target / floor | ≥ €70,000 real (after tax) / €30,000 real |
| Weights | goal 0.35, safety 0.20, growth 0.45 |
| Instruments | `SAVINGS`, `BOND_GOV`, `BASKET_WORLD`, `PENSION_WORLD`, `PENSION_BOND` |
| Rules | None |
| Reference allocation | 15% `SAVINGS`, 70% `PENSION_WORLD`, 15% `PENSION_BOND` |
| Traps | 100% `PENSION_WORLD` (the day-1,000 emergency breaks the account: penalty and tax). 100% `SAVINGS` (the gap barely moves) |
| Result extra | Show how much of the €288,000 gap the median result covers, in today's euros |
| Debrief points | Tax advantages come with lock-up rules; the emergency fund stays outside the pension account; time and compounding shrink the gap |

## 7. Data contract (proposal)

### Scenario definition

The definitions live in [sandbox-scenarios.json](sandbox-scenarios.json), which has three top-level parts:

| Part | Contents |
|---|---|
| `defaults` | Currency, inflation, share step, path count, rule penalty points, withdrawal order, deposit early-withdrawal penalty, calibration thresholds |
| `instruments` | The §3 catalog: `key`, `name`, `group` (`SAVINGS`, `DEPOSIT`, `BOND_FUND`, `MARKET`, `PENSION`; used by the withdrawal order), `riskLevel`, `model`, `expectedReturn`, `volatility`, `marketCorrelation`, `yearlyFee`, `liquidity` (`ANY_DAY`, `LOCKED_TERM`, `LOCKED_TO_END`), `termMonths`, learner-facing `description`, and optional `knockOutDrawdown`, `taxFree`, `earlyWithdrawal` |
| `scenarios` | One object per scenario, with the fields below |

Scenario fields:

- `id` (stable slug, for example `lena-tom-wedding`), `code` (the number used in this file, `2.2`), `chapterId`, `lessonCodes`, `title`
- `persona` (`name`, `age`, `situation`) and `goal`
- `startAmount`, `durationDays`, `taxOnGains` (`null` = off), optional `retirementGap`
- `target` and `floor`, each `{ "value", "unit" }` with `unit` `NOMINAL` or `REAL`
- `weights` (`goal`, `safety`, `growth`; they add up to 1)
- `moneyNeeds`: `{ "day", "amount", "kind", "label" }`. `kind` is `WITHDRAWAL` (taken out on that day, following the withdrawal order) or `AVAILABILITY_CHECK` (the money must be there and accessible on that day, without a penalty; nothing is taken out, so the final value is the portfolio at the end)
- `events`: `MARKET_SHOCK` (`day`, `change`; scaled by each instrument's `marketCorrelation`), `INSTRUMENT_SHOCK` (`day`, `instrumentKeys`, `change`) or `HYPE_CYCLE` (`instrumentKeys`, `phases` with `fromDay`, `toDay`, `change`)
- `instrumentKeys`: the instruments the learner may pick
- `rules`: `MAX_TOTAL_SHARE` (`instrumentKeys`, `maxShare`, `label`); each broken rule costs `defaults.rulePenaltyPoints`
- `scenarioSeed`, `referenceAllocation`, `alsoAcceptable`, `traps` (`label`, `allocation`, `why`), `resultExtras` (`FEES_PAID`, `GAP_COVERED`) and `debriefPoints`

`floor`, `weights`, `scenarioSeed`, `referenceAllocation`, `alsoAcceptable`, `traps` and `debriefPoints` are not sent to the frontend before the run, like the correct quiz answers. After the run, the traps and debrief points go to the AI coach as context.

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/scenarios?chapterId=2` | Scenario briefs: persona, amount, horizon, goal, money needs, available instruments with their properties |
| `GET /api/scenarios/{scenarioId}` | One scenario brief |
| `POST /api/scenarios/{scenarioId}/runs` | Runs an allocation and returns the result. With `X-User-Email` the run is saved, so retries can be compared and Quest Arena can rank them |

Run request:

```json
{ "allocations": [ { "instrumentKey": "DEPOSIT_2Y", "share": 0.70 }, { "instrumentKey": "BOND_GOV", "share": 0.20 }, { "instrumentKey": "BASKET_WORLD", "share": 0.10 } ] }
```

400 if shares are not in 5% steps, don't add up to 100%, or use an instrument outside the scenario.

Run response:

```json
{
  "runId": 12,
  "score": 86,
  "scoreParts": { "goal": 93.0, "safety": 97.5, "growth": 68.0, "rulePenalties": 0 },
  "brokenRules": [],
  "metrics": {
    "medianFinal": 19180.40, "p5Final": 18720.10, "p95Final": 19650.80,
    "medianGrowth": 0.0656, "medianRealGrowth": 0.0045,
    "goalProbability": 0.93, "safetyProbability": 0.975,
    "shortfallProbability": 0.0
  },
  "storyPath": {
    "points": [ { "date": "2026-11-21", "total": 18000.00, "byInstrument": { "DEPOSIT_2Y": 12600.00, "BOND_GOV": 3600.00, "BASKET_WORLD": 1800.00 } } ],
    "moneyNeeds": [ { "day": 730, "amount": 18000.00, "covered": true, "paidFrom": null, "penalties": 0.00 } ],
    "feesPaid": { "BOND_GOV": 11.20, "BASKET_WORLD": 7.30 }
  },
  "previousRun": { "runId": 11, "score": 41 }
}
```

The AI coach gets the scenario brief, the learner's allocation and this response as context. It explains the result from these numbers only.

## 8. Backend changes needed

1. **Fictional instruments:** seed the §3 catalog. Deposits use the existing FIXED_RATE engine (with `termMonths`); they must become selectable through the API, which they aren't yet.
2. **Portfolio engine:** one simulation over all holdings with the shared market draw (§3), daily fees, scripted shocks, money needs with the withdrawal order and penalties (§2), knock-out for `HYPE_2X`, and tax for 3.6.
3. **Multi-path runs and scoring:** 200 seeded paths, metrics and score (§4). Only the story path returns daily points; to keep responses small, it can return weekly points.
4. **Scenarios and runs:** tables for instruments, scenario definitions and saved runs, plus the endpoints in §7. Seed them from `sandbox-scenarios.json` by extending `scripts/generate-content-sql.mjs`, so the generated block in `data.sql` gets the scenario rows too, the same way lessons are generated from the Markdown. The script should fail on invalid data (see the checks in §7's field list: 5% steps, shares and weights adding up to 1, unknown instrument keys).
5. **Tests:** the calibration acceptance test from §4 for every scenario (reference ≥ 80, each trap ≤ 50), and exact results for fixed seeds.

## 9. Later

- **Rebalancing (lesson 3.7):** a two-step scenario. The run pauses at a set day (for example after the portfolio drifts to 70/30), the learner rebalances or holds, then the run continues. A "Sell everything" button during a −20% drop would test panic selling.
- **Monthly contributions** (lessons 3.2 "Start at 25 vs 35" and 3.3 "Don't pause retirement"): add a `monthlyContribution` to scenarios once the engine supports it.
- **Quest Arena:** rank saved runs per scenario by score, with safety as the tie-breaker. Label demo users as fictional.
