# 1.5 Diversification

**Chapter:** 1 — Why Invest?
**Goal of this subchapter:** the learner can explain how spreading money across investments reduces the damage of one bad event, and what diversification cannot do.

---

## Lesson

### Don't put all your eggs in one basket

If you carry all your eggs in one basket and drop it, you lose them all. Split them across several baskets and one fall breaks only some of them.

Investing works the same way. **Diversification** means spreading money across many investments so that one bad result doesn't ruin the whole plan.

### An example

Two learners each invest 10,000 coins. Then one fictional company, *Nova Robotics*, falls **60%**.

| | Portfolio A | Portfolio B |
|---|---|---|
| How it's invested | 100% in Nova Robotics | 20 companies, 5% each |
| Loss from Nova's drop | −6,000 coins | −300 coins |
| Portfolio change | **−60%** | **−3%** |

Same event, very different outcome. Portfolio A had **concentration risk**: its fate depended on a single company.

### Ways to diversify

- **Across companies:** many companies instead of one.
- **Across industries:** technology, healthcare, energy, food…
- **Across regions:** different countries and economies.
- **Across instrument types:** cash, locked-term instruments, market baskets.
- **Across time:** investing regularly instead of all at once.

In the sandbox, the **Diversified market basket** already holds many companies, which makes it a simple way to diversify.

### What diversification can't do

Diversification **reduces** risk. It doesn't **remove** it.

- If the **whole market** falls, a diversified portfolio falls too, though usually less than the worst single investment.
- It doesn't guarantee a profit.
- Owning 10 very similar things (for example, 10 tech companies) is less diversified than it looks.

### Key takeaways

- Diversification spreads risk so one bad event hurts less.
- Concentration in one asset ties your outcome to that single asset.
- Diversify across companies, industries, regions and instrument types.
- Diversification reduces risk but doesn't remove it.

---

## Control questions

### Q1. What is diversification?
- A) Keeping everything in cash
- B) Putting all your money into the best-performing stock
- C) Spreading money across many investments to reduce the impact of one bad result ✅
- D) Moving money between accounts often

**Explanation:** spreading money out means no single result decides your whole outcome.

### Q2. See how the same drop affects two portfolios.

```comparison
{
  "company": "Nova Robotics",
  "startingBalance": 10000,
  "dropPercent": 50,
  "portfolios": [
    { "id": "a", "name": "Portfolio A", "exposurePercent": 60, "description": "60% in Nova Robotics, 40% spread across other companies" },
    { "id": "b", "name": "Portfolio B", "exposurePercent": 10, "description": "10% in Nova Robotics, 90% spread across other companies" }
  ]
}
```

- A) Portfolio A started with more money.
- B) Nova Robotics made up a larger share of Portfolio A. ✅
- C) Nova Robotics fell by a different percentage in each portfolio.
- D) The other companies rose in Portfolio B.

**Explanation:** half of a 60% share is a 30% loss for the whole portfolio. Half of a 10% share is a 5% loss. The stock fell by the same amount in both portfolios.

### Q3. Which portfolio is most diversified?
- A) 100% in a locked-term instrument
- B) 10 companies, all in the same industry
- C) 100% in one volatile company
- D) A mix of cash, a broad market basket and a locked-term instrument ✅

**Explanation:** C spreads money across different types of instruments that react differently to events.

### Q4. The whole market falls 20%. What happens to a well-diversified portfolio?
- A) It always rises.
- B) It probably falls too, but usually less than the most concentrated portfolios. ✅
- C) Nothing, diversification fully protects it.
- D) It falls exactly 20%, always.

**Explanation:** diversification reduces risk from single events, not from market-wide drops.

### Q5. What is "concentration risk"?
- A) The risk of inflation
- B) The risk of high fees
- C) The risk of having too many investments
- D) The risk of depending heavily on one investment or one area ✅

**Explanation:** the more concentrated the portfolio, the more one event can hurt it.
