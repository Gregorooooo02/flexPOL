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

### Q1. Connect each portfolio to what it mostly depends on.

```assignment
{
  "mode": "MATCH",
  "cards": [
    { "id": "one", "text": "Shares of one robot company" },
    { "id": "sector", "text": "Ten energy companies" },
    { "id": "broad", "text": "Stocks from several industries" }
  ],
  "targets": [
    { "id": "market", "text": "The wider stock market" },
    { "id": "business", "text": "One company" },
    { "id": "industry", "text": "One industry" }
  ],
  "solution": {"one": "business", "sector": "industry", "broad": "market"},
  "hint": "Look for what all the holdings have in common."
}
```

**Explanation:** Different baskets spread risk in different ways. Holding many shares from one industry still leaves a common risk.

### Q2. Predict the bigger hit, then work out the gap between the two losses.

```comparison
{
  "company": "Nova Robotics",
  "startingBalance": 10000,
  "dropPercent": 50,
  "portfolios": [
    {
      "id": "a",
      "name": "Portfolio A",
      "exposurePercent": 60,
      "description": "60% Nova Robotics · 40% other companies"
    },
    {
      "id": "b",
      "name": "Portfolio B",
      "exposurePercent": 10,
      "description": "10% Nova Robotics · 90% other companies"
    }
  ]
}
```

```number
{
  "label": "Difference between the two losses",
  "unit": "percentage points",
  "answer": 25,
  "hint": "Subtract the smaller loss percentage from the larger one.",
  "dial": { "max": 100, "step": 5 }
}
```

**Explanation:** Portfolio A lost 30% and B lost 5%. The gap is 25 percentage points.

### Q3. Nova Robotics drops 50%. Give it the biggest share you can while limiting the loss on your portfolio to 10%. Everything else holds steady.

```number
{
  "label": "Share in Nova Robotics",
  "unit": "%",
  "answer": 20,
  "hint": "Try reducing the share until the portfolio loss is no more than 10%.",
  "lab": {
    "kind": "SHOCK",
    "max": 100,
    "step": 5,
    "initial": 60,
    "balance": 10000,
    "rate": 50
  }
}
```

**Explanation:** A 20% stake losing half its value costs 10% of the total portfolio. A bigger stake would break the limit.

### Q4. The whole market falls 20%. What happens to a well-diversified portfolio?
- A) It always rises.
- B) It probably falls too, but usually less than the most concentrated portfolios. ✅
- C) Nothing, diversification fully protects it.
- D) It falls exactly 20%, always.

**Explanation:** diversification reduces risk from single events, not from market-wide drops.

### Q5. Spot the baskets that still depend heavily on a single bet.

```assignment
{
  "mode": "SORT",
  "cards": [
    { "id": "robot", "text": "100% in Nova Robotics" },
    { "id": "world", "text": "A basket covering several markets" },
    { "id": "banks", "text": "Eight banks in one country" },
    { "id": "mix", "text": "Cash, a broad basket, and bonds" }
  ],
  "targets": [
    { "id": "spread", "text": "Risk spread out" },
    { "id": "concentrated", "text": "Risk concentrated" }
  ],
  "solution": {"robot": "concentrated", "world": "spread", "banks": "concentrated", "mix": "spread"},
  "hint": "Many names can still be one bet if they all depend on the same thing."
}
```

**Explanation:** A single stock or one sector leaves you exposed to common surprises. A mix of companies, industries or instrument types spreads those risks.
