# HedgeFlex — Sandbox Scenarios (Chapters 2 and 3)

**Status:** draft spec, not implemented yet. Chapter 1 keeps its own mission, "The Two-Year Goal" (see [learning-chapters.md](learning-chapters.md)), and is out of scope here.

> People, goals, amounts and events are fictional. Instruments come from the app's catalogue, but every price path is synthetic. Outcomes illustrate ideas from the lessons. They don't predict real returns and are not product recommendations.

**Structured data:** the machine-readable version of everything below is [sandbox-scenarios.json](sandbox-scenarios.json). That file is the source of truth for values; this file explains them for people. When you change a value, change both in the same commit. If they disagree, the JSON wins. After any change, run the checker (§4): `node scripts/check-sandbox-scenarios.mjs`.

## 1. What a scenario is

A scenario is a "real-life" test in the **Sandbox mode** of the investing workspace, the same workspace the `/playground` uses (`frontend/src/workspace/`, plan in `notes/investment-workspace-plan.md`). The learner meets a fictional person with a goal, a budget, a fixed horizon and a life situation. They split the budget between cash and instruments from the catalogue, then submit. The server simulates the portfolio, and the result is calculated from how the portfolio grew.

Every scenario has its **own horizon, its own budget and its own life situation**. No two scenarios share any of them.

### Flow

1. **Brief:** the person, their situation, the goal and any money needed along the way (amount and day).
2. **Allocate:** set an amount (or percentage) for each allowed instrument; whatever isn't allocated stays as cash. The rules checklist shows which advisory rules are met.
3. **Submit:** one decision. The allocation is locked; there's no trading during the run.
4. **Run:** the server calls the batch simulation (§4) and evaluates the result.
5. **Result:** the replay of the portfolio's value, final value, growth, largest drop, money needs paid, and the score with its parts.
6. **Debrief:** Hedgie explains the result from the returned numbers only.
7. **Retry:** the learner changes the allocation and compares the new result with the previous one.

## 2. What the sandbox can and can't do

The first draft of this spec assumed a new portfolio engine. These scenarios are adjusted to what the existing tools already do:

| Capability | Today (`/playground` + `POST /api/simulations/batch`) | How the scenarios use it |
|---|---|---|
| Instruments | The real catalogue: 12 single stocks and 8 equity ETFs, all EUR, all GBM | Each scenario allows a subset by `instrumentId` |
| Expected return and risk | Every instrument has the same 6% expected return; only the volatility differs (≈13% for broad ETFs, up to ≈41% for single stocks) | Taking more risk isn't rewarded with more expected return here, so concentration is clearly punished |
| Safe asset | Uninvested cash, which earns 0% | Cash is the only safe and liquid option (emergency funds, near dates) |
| Budget | Fixed €10,000 in `/playground` | Sandbox mode uses the scenario's budget (planned as "Scenario budget and allowed instruments" in the workspace plan). The batch endpoint accepts any amount |
| Horizon | Picker with 1, 3, 5 or 10 years; the batch endpoint accepts 1–3,650 days | The scenario fixes `durationDays` (≤ 3,650) and the picker isn't shown |
| Path | One path per instrument, with seeds that can be set; weekday points | The server sets each item's seed from the scenario, so every learner gets the same market |
| Correlation | None: instruments move independently | Mixes look more diversified than in reality (see §6) |
| Fees, taxes, inflation, interest | None | Not part of any scenario's result |
| Events, deposits, bonds, pension accounts | None | Removed from the scenarios; listed as `notSimulated` for the coach |
| Withdrawals | None in the engine | Applied by the evaluator to the returned path (cash first, then holdings pro rata) |

### Changes from the first draft

- The fictional instruments (savings, deposits, bond funds, the active fund, HypeCoin, pension accounts) are replaced by catalogue instruments plus cash.
- Horizons longer than 10 years (Sam 15, Danuta 12, Zofia 20, Ola 25, Ewa 30) are shortened. Every horizon is still unique.
- Inflation, fees, tax, scripted shocks, the hype cycle and the multi-path score are removed. The score now uses the one server-seeded path the learner sees.
- Scenario 2.4 changes theme from fees (not simulated) to regional diversification. Scenario 3.6 keeps the retirement gap but drops pension-account rules.

## 3. Shared rules

| Rule | Value |
|---|---|
| Currency | EUR |
| Allocation | Amounts in cents; for checks and reference allocations, shares in 5% steps; unallocated money is cash |
| Cash | Earns 0%, never moves |
| Decision | One allocation at the start, held to the end (no mid-run trades) |
| Horizon | `durationDays` from the scenario, end date = `startDate.plusDays(durationDays)` |
| Money needs | Paid at the first simulated point on or after the stated day: cash first, then holdings sold pro rata at that point's value |
| Rules | Advisory: shown as a checklist, each broken rule costs 15 points |

## 4. How the result is calculated

### Running the simulation

The server builds one `POST /api/simulations/batch` request per submission:

- one item per invested instrument, with `initialInvestment` = the allocated amount and the scenario's `durationDays`;
- `randomSeed` = `scenarioSeed + instrumentId`, so the market is the same for everyone and for every retry, and different instruments get different shocks.

The seeds and results stay on the server until the learner has submitted, as the workspace plan requires for scored modes.

### Evaluating the path

From the returned points (all items share the same dates):

1. **Portfolio value** at each point = cash + the sum of the item values, after money needs paid so far. Paying a need from holdings scales every holding down by the same fraction.
2. **Money needs:** if cash plus holdings can't cover a need, it's a shortfall.
3. **Final value** = the portfolio value at the last point.
4. **Largest drop** (max drawdown) is measured on portfolio value plus the money already withdrawn, so paying a planned bill doesn't count as a loss.

### Score (0–100)

```
GrowthScore    = 100 × clamp((finalValue − floor) / (target − floor), 0, 1)    (0 after a shortfall)
StabilityScore = 100 × clamp(1 − max(0, largestDrop − maxDrawdown) / maxDrawdown, 0, 1)

Score = wGrowth × GrowthScore + wStability × StabilityScore − 15 × brokenRules    (clamped to 0–100)
```

- `target`: the final value that fully meets the goal. `floor`: the value at which the growth score is 0. For cash-only allocations without money needs, `floor` is usually the budget, so doing nothing earns no growth points.
- `maxDrawdown`: the largest drop the person can live with. Up to it, stability is 100; at twice that drop, stability is 0.
- The weights add up to 1. Short horizons and fragile situations weight stability more; long horizons weight growth more.

### Checker (acceptance test)

One path means luck plays a part: an all-in single stock can win a single run. Scenarios are therefore calibrated on average over many seeds. `scripts/check-sandbox-scenarios.mjs`:

- validates the JSON (unique ids, budgets, horizons, people and seeds; horizons within 1–3,650 days; known instrument ids; shares in 5% steps adding up to 1; weights adding up to 1; floor below or equal to target, and so on);
- reimplements the GBM engine's math (same parameters from `data.sql`, one step per weekday, `dt = 1/periodsPerYear`) and the evaluation above, then checks that over 1,000 seeds each scenario's **reference allocation scores ≥ 80 on average** and **each trap scores ≤ 50**.

It uses JavaScript's random numbers, not Java's, so it checks the statistics, not exact results. Current results (2,000 seeds):

| Scenario | Reference | Best trap |
|---|---|---|
| 2.1 Kuba | 92 | 44 |
| 2.2 Lena and Tom | 95 | 47 |
| 2.3 Marek | 91 | 44 |
| 2.4 Zofia | 88 | 41 |
| 2.5 Olek | 94 | 19 |
| 2.6 Nina | 87 | 50 |
| 3.1 Paula | 91 | 48 |
| 3.2 Ewa | 93 | 26 |
| 3.3 Sam | 92 | 40 |
| 3.4 Danuta | 94 | 50 |
| 3.5 Henryk | 87 | 45 |
| 3.6 Ola | 89 | 44 |

## 5. Scenarios

Instruments are listed by catalogue id. Cash is always available. Percentages are shares of the budget.

| Id | Instrument | Volatility in the simulation |
|---|---|---|
| 1013 | Vanguard FTSE All-World | ≈13% |
| 1014 | iShares Core MSCI World | ≈13% |
| 1015 | iShares Core S&P 500 | ≈14% |
| 1016 | iShares NASDAQ 100 | ≈19% |
| 1017 | iShares Core EURO STOXX 50 | ≈15% |
| 1018 | iShares Core MSCI EM IMI | ≈18% |
| 1019 | iShares MSCI World Small Cap | ≈15% |
| 1020 | Vanguard ESG Global All Cap | ≈14% |
| 1001–1012 | Single stocks (SAP, Siemens, Allianz, Deutsche Telekom, Airbus, Schneider Electric, TotalEnergies, LVMH, L'Oréal, ASML, ING, Santander) | ≈18% (Allianz) to ≈41% (ASML) |

### Chapter 2 — Know Your Instruments

#### 2.1 "Kuba's Safety Cushion"

| Field | Value |
|---|---|
| Lessons | 2.1 Cash and savings accounts |
| Person | Kuba, 24, first job on a 6-month contract that may not be renewed, no savings cushion |
| Budget / horizon | €6,000 / 1 year (365 days) |
| Money needs | €2,500 car repair on day 120 |
| Target / floor / max drop | €3,500 / €3,200 / 4% |
| Weights | growth 0.5, stability 0.5 |
| Instruments | 1013, 1015, 1001, 1010 |
| Rules | None |
| Reference | 80% cash, 20% 1013 (100% cash also passes) |
| Traps | 100% 1013 (the repair may be paid by selling after a drop). 100% 1010 (one volatile stock) |
| Debrief | An emergency fund needs to be available and stable; one year is too short to recover; here safety matters more than growth |

#### 2.2 "Lena and Tom's Wedding"

| Field | Value |
|---|---|
| Lessons | 2.2 Deposits and bonds (matching money to a date), 2.4 Funds |
| Person | Lena and Tom, both 29, wedding on a fixed date in 2 years, venue paid on that day |
| Budget / horizon | €18,000 / 2 years (730 days) |
| Money needs | None (the target is the budget on the day) |
| Target / floor / max drop | €18,000 / €17,000 / 4% |
| Weights | growth 0.5, stability 0.5 |
| Instruments | 1013, 1015, 1017, 1018 |
| Rules | None |
| Reference | 85% cash, 15% 1013 (100% cash also passes) |
| Traps | 40% 1015 + 30% 1017 + 30% 1018 (diversified, but all shares, two years ahead of a fixed date). 100% 1017 (one region) |
| Debrief | A fixed date close ahead needs money that keeps its value; diversification lowers risk but doesn't remove it |
| Not simulated | Term deposits and bonds |

#### 2.3 "Marek's Favourite Company"

| Field | Value |
|---|---|
| Lessons | 2.3 Stocks, 2.4 Funds and ETFs |
| Person | Marek, 33, stable job, emergency fund in place, a big fan of one chip-equipment company |
| Budget / horizon | €25,000 / 6 years (2,190 days) |
| Money needs | None |
| Target / floor / max drop | €31,000 / €23,000 / 30% |
| Weights | growth 0.6, stability 0.4 |
| Instruments | 1013, 1015, 1016, 1017, 1018, 1001, 1006, 1010 |
| Rules | No single stock above 10% |
| Reference | 35% 1015, 25% 1017, 20% 1018, 10% 1010, 10% cash (also passes: 90% 1013, 10% 1010) |
| Traps | 100% 1010. 50% 1016 + 50% 1010 (one theme) |
| Debrief | A single stock carries one company's full damage; a fund spreads it; a favourite stock fits as a small part |

#### 2.4 "Zofia Only Buys What She Knows"

| Field | Value |
|---|---|
| Lessons | 2.4 Funds and ETFs, 2.7 Comparing instruments |
| Person | Zofia, 45, inherited money; a relative says to only buy big local European names |
| Budget / horizon | €80,000 / 8 years (2,920 days) |
| Money needs | None |
| Target / floor / max drop | €105,000 / €80,000 / 25% |
| Weights | growth 0.75, stability 0.25 |
| Instruments | 1013, 1015, 1017, 1018, 1003, 1004 |
| Rules | No single stock above 10% |
| Reference | 40% 1015, 25% 1017, 25% 1018, 10% cash |
| Traps | 100% 1004 (one familiar name). 90% cash + 10% 1017 (too cautious, one region) |
| Debrief | Diversify across companies and regions; a familiar name isn't a lower risk |
| Not simulated | Fund fees |

#### 2.5 "Olek's Group-Chat Tip"

| Field | Value |
|---|---|
| Lessons | 2.6 High-risk and speculative assets |
| Person | Olek, 21, student; a group chat says one tech stock can't lose; tuition is paid from this money in 6 months |
| Budget / horizon | €4,000 / 9 months (274 days) |
| Money needs | €2,000 tuition on day 180 |
| Target / floor / max drop | €2,000 / €1,800 / 5% |
| Weights | growth 0.5, stability 0.5 |
| Instruments | 1013, 1001, 1006, 1010 |
| Rules | No single stock above 5% |
| Reference | 95% cash, 5% 1010 (100% cash also passes) |
| Traps | 100% 1010. 50% 1010 + 50% cash |
| Debrief | A tip is a bet on price; never with money needed soon; if at all, keep it small |
| Not simulated | Crypto, leverage, a hype-then-crash pattern |

#### 2.6 "Nina's Home Deposit"

| Field | Value |
|---|---|
| Lessons | 2.7 Comparing instruments (chapter wrap-up) |
| Person | Nina, 40, renting, steady job, emergency fund in place, buying a flat in 4 years |
| Budget / horizon | €40,000 / 4 years (1,461 days) |
| Money needs | None |
| Target / floor / max drop | €43,000 / €40,000 / 10% |
| Weights | growth 0.5, stability 0.5 |
| Instruments | The whole catalogue (1001–1020) |
| Rules | No single stock above 10% |
| Reference | 50% cash, 20% 1015, 15% 1017, 15% 1018 |
| Traps | 100% cash (no growth). 100% 1013 (a drop before the purchase) |
| Debrief | A medium horizon needs a balance of growth and safety; use the five questions on each pick |
| Not simulated | Bonds and deposits |

### Chapter 3 — Investing Through Life

#### 3.1 "Paula's Uneven Income"

| Field | Value |
|---|---|
| Lessons | 3.1 Your life stage changes your plan |
| Person | Paula, 31, single parent, freelance designer with irregular income, saving for a child's school costs |
| Budget / horizon | €12,000 / 5 years (1,825 days) |
| Money needs | €3,000 on day 900 (two quiet months with no clients) |
| Target / floor / max drop | €10,000 / €8,800 / 12% |
| Weights | growth 0.3, stability 0.7 |
| Instruments | 1013, 1015, 1017, 1018, 1008 |
| Rules | No single stock above 10% |
| Reference | 35% cash, 25% 1015, 20% 1017, 20% 1018 |
| Traps | 100% 1013 ("5 years is long"). 50% 1008 + 50% 1013 |
| Debrief | Age and horizon aren't everything; unstable income and dependents lower risk capacity |

#### 3.2 "Ewa's First Salary"

| Field | Value |
|---|---|
| Lessons | 3.2 Starting out (18–30) |
| Person | Ewa, 23, first full-time job, no expensive debt, emergency fund built |
| Budget / horizon | €5,000 / 10 years (3,650 days, the batch maximum) |
| Money needs | None |
| Target / floor / max drop | €7,500 / €5,000 / 40% |
| Weights | growth 0.8, stability 0.2 |
| Instruments | 1013, 1015, 1016, 1018, 1019, 1010 |
| Rules | No single stock above 10% |
| Reference | 30% 1015, 25% 1018, 25% 1019, 20% 1013 (also passes: 100% 1013) |
| Traps | 100% cash. 100% 1010 |
| Debrief | A long horizon allows a growth mix; starting early gives compounding the most time |
| Not simulated | Monthly contributions, horizons over 10 years |

#### 3.3 "Sam's University Fund"

| Field | Value |
|---|---|
| Lessons | 3.3 Building up (30–50) |
| Person | Sam, 38, steady income, two children, an older house that may need repairs |
| Budget / horizon | €60,000 / 7 years (2,555 days) |
| Money needs | €5,000 house repair on day 1,000 |
| Target / floor / max drop | €68,000 / €55,000 / 25% |
| Weights | growth 0.6, stability 0.4 |
| Instruments | 1013, 1015, 1017, 1018, 1002, 1012 |
| Rules | Single stocks above 20% in total |
| Reference | 15% cash, 35% 1015, 25% 1017, 25% 1018 |
| Traps | 50% 1002 + 50% 1012. 100% cash |
| Debrief | Each goal gets its own horizon and mix; a cash part covers surprises |
| Not simulated | Several goals in separate buckets |

#### 3.4 "Danuta's Glide Path"

| Field | Value |
|---|---|
| Lessons | 3.4 Approaching retirement (50+) |
| Person | Danuta, 58, savings at their largest, retiring at 67, everything in a tech fund for years |
| Budget / horizon | €250,000 / 9 years (3,285 days) |
| Money needs | None |
| Target / floor / max drop | €290,000 / €250,000 / 15% |
| Weights | growth 0.5, stability 0.5 |
| Instruments | 1013, 1015, 1016, 1017, 1018 |
| Rules | None |
| Reference | 40% cash, 25% 1015, 20% 1017, 15% 1018 |
| Traps | 100% 1016 ("it worked so far"). 100% cash |
| Debrief | Shift from growing to protecting gradually; part of the money stays invested |
| Not simulated | A year-by-year glide path and bonds |

#### 3.5 "Henryk Retires Next Year"

| Field | Value |
|---|---|
| Lessons | 3.4 Approaching retirement (sequence risk) |
| Person | Henryk, 64, retires in a year and lives on these savings at first |
| Budget / horizon | €400,000 / 3 years (1,095 days) |
| Money needs | €32,000 on day 365 and €32,000 on day 730 |
| Target / floor / max drop | €340,000 / €310,000 / 8% |
| Weights | growth 0.3, stability 0.7 |
| Instruments | 1013, 1015, 1017, 1018 |
| Rules | None |
| Reference | 40% cash, 25% 1015, 20% 1017, 15% 1018 |
| Traps | 100% 1013. 50% 1015 + 50% 1018 (no cash buffer) |
| Debrief | The same drop hurts more when withdrawals start; a cash buffer avoids selling at the bottom |
| Not simulated | A scripted crash (paths are random) |

#### 3.6 "Ola Minds the Gap"

| Field | Value |
|---|---|
| Lessons | 3.5 Why invest for a pension |
| Person | Ola, 45, expects 1,800 a month of public pension against 3,000 needed: a gap of about 288,000 over 20 years |
| Budget / horizon | €30,000 / 9½ years (3,468 days) |
| Money needs | None |
| Target / floor / max drop | €45,000 / €30,000 / 35% |
| Weights | growth 0.8, stability 0.2 |
| Instruments | 1013, 1015, 1018, 1019, 1020 |
| Rules | None |
| Reference | 10% cash, 30% 1015, 20% 1018, 20% 1019, 20% 1020 |
| Traps | 100% cash. 80% cash + 20% 1013 |
| Result extra | The part of the €288,000 gap that the final value covers |
| Debrief | Public pensions often cover only part; cash alone can't close a large gap |
| Not simulated | Pension accounts (lesson 3.6): tax advantages, employer contributions, lock-up rules |

## 6. Known limits of these results

- **Independent instruments exaggerate diversification.** Two funds that overlap heavily in reality (for example 1013 All-World and 1014 MSCI World) move independently here, so a mix of several ETFs looks safer than one broad fund. The reference allocations spread across regions that overlap little in reality (US, eurozone, emerging markets, small caps) so they stay sensible advice. One broad world fund is a good real-world choice, even if it scores a little lower here. Hedgie should say so when it comes up.
- **One path per run.** A single result can be lucky or unlucky; the score's stability part and the retry help, and the checker makes sure the scenario rewards the right idea on average.
- **Real names.** The catalogue uses real company and fund names with synthetic prices. AGENTS.md asks for fictional instruments in the sandbox. Either show fictional display names in Sandbox mode, or keep the disclaimer prominent and make sure Hedgie never frames a pick as a recommendation.
- **Lessons not covered** (each scenario's `notSimulated` lists them for Hedgie): inflation and interest, fees, deposits and bonds, taxes and pension accounts, crypto and leverage, monthly contributions, rebalancing.

## 7. Data contract

### Scenario file

[sandbox-scenarios.json](sandbox-scenarios.json) has four top-level parts:

| Part | Contents |
|---|---|
| `defaults` | Currency, share step, `cash` (key `CASH`, 0% interest), rule penalty points, `evaluation` (endpoint, seed rule, money-need point, withdrawal order, drawdown basis) and `acceptance` thresholds |
| `catalogue` | The catalogue ids the scenarios may use, with name, asset class and risk level (copied from `data.sql`, for validation and for people reading the file) |
| `scenarios` | One object per scenario |
| `version`, `disclaimer` | File version (2) and the learner-facing disclaimer |

Scenario fields:

- `id` (stable slug), `code` (the number used in this file), `chapterId`, `lessonCodes`, `title`
- `persona` (`name`, `age`, `situation`) and `goal`
- `budget`, `durationDays` (1–3,650)
- `target`, `floor`, `maxDrawdown`, `weights` (`growth`, `stability`)
- `moneyNeeds`: `{ "day", "amount", "label" }`
- `instrumentIds`: catalogue ids the learner may pick (cash is always available)
- `rules`: `MAX_SHARE_EACH` (no listed instrument above `maxShare`) or `MAX_TOTAL_SHARE` (the listed instruments together at most `maxShare`), each with `instrumentIds` and `label`
- `scenarioSeed`, `referenceAllocation`, `alsoAcceptable`, `traps` (`label`, `allocation`, `why`), `debriefPoints`, `notSimulated`, optional `retirementGap`

Allocations are maps from `"CASH"` or a catalogue id (as a string) to a share. `scenarioSeed`, `referenceAllocation`, `alsoAcceptable`, `traps` and `debriefPoints` aren't sent to the frontend before submission, like the correct quiz answers. After the run they go to the AI coach as context.

### Endpoints (proposal)

| Endpoint | Purpose |
|---|---|
| `GET /api/scenarios?chapterId=2` | Scenario briefs: persona, goal, budget, horizon, money needs, target, max drop, rules, allowed instruments |
| `GET /api/scenarios/{scenarioId}` | One brief |
| `POST /api/scenarios/{scenarioId}/runs` | Body `{ "allocations": [ { "instrumentId": 1015, "amount": 7000.00 } ] }`; the rest is cash. Runs the batch and returns the evaluation. With `X-User-Email` the run is saved, so retries can be compared and Quest Arena can rank them |

400 if the amounts exceed the budget or use an instrument the scenario doesn't allow. The response contains the score and its parts, broken rules, final value, growth, largest drop, money needs (paid from cash / from holdings, shortfall), the weekday value path for the replay chart, each instrument's contribution, and the previous run's score.

## 8. What's needed to build it

1. **Backend:** scenario and run tables, seeded from the JSON by extending `scripts/generate-content-sql.mjs`; the evaluator (§4) on top of `SimulationService`'s batch; the endpoints in §7. No engine changes are needed.
2. **Frontend:** a Sandbox mode for the workspace, as described in the workspace plan's extension points: scenario budget and allowed instruments, rules checklist, briefing, "Review and submit", and a result page that replays the returned path (the Playground's `ValueChart` and `ReplaySummary` can be reused).
3. **Tests:** the checker runs in CI or before each content change; the backend gets exact-result tests for fixed seeds.

## 9. Later

When the engine gains a cash or deposit instrument with interest, fees, inflation, correlation or scripted events, scenarios can return to the first draft's richer versions (bond and deposit choices, the fee trap, the hype cycle, pension accounts). Mid-run decisions (the Playground already supports trading during a replay) would allow rebalancing and panic-selling scenarios for lesson 3.7.
