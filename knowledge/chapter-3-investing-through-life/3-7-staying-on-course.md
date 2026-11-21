# 3.7 Staying on Course

**Chapter:** 3 — Investing Through Life
**Goal of this subchapter:** the learner can rebalance a drifted portfolio, knows when to review a plan, and recognizes common behavioral traps.

---

## Lesson

### Portfolios drift

You set an allocation of **60% market basket / 40% bonds**. After a strong year for the market, it has become **70% / 30%**. Nobody changed anything, but the portfolio is now **riskier than planned**.

This is called **drift**.

### Rebalancing

**Rebalancing** means bringing the portfolio back to its target mix.

> **Example:** a target of 60/40, total value 10,000 coins.
> After a good market year: basket 7,000 (70%), bonds 3,000 (30%).
> **Rebalance:** move 1,000 from the basket to bonds → 6,000 / 4,000 = 60/40.

Two ways to rebalance:

- **Sell and buy:** move money from what grew to what fell behind.
- **Redirect new money:** put new contributions into the part that's below target. This is often cheaper.

Rebalancing naturally makes you **sell a bit high and buy a bit low**, the opposite of what emotions push you to do.

### When to review the plan

- **On a schedule**, for example once a year
- **When the drift is large**, for example more than 5–10 percentage points
- **When life changes:** a new job, a child, buying a home, illness, nearing retirement

### Behavioral traps

| Trap | What happens | Antidote |
|---|---|---|
| **Panic selling** | Selling after a big drop, locking in losses | Remember your horizon; have an emergency fund |
| **Loss aversion** | Losses feel about twice as painful as gains feel good | Judge decisions against the goal, not daily prices |
| **Recency bias** | Expecting the last few months to continue forever | Look at long periods, not only recent ones |
| **Herd behavior** | Doing what everyone else does | Stick to your written plan |
| **Overchecking** | Looking at the portfolio every day and reacting to noise | Check on a schedule |

### Write it down

A short written plan makes it easier to stay calm:

- my goal and horizon,
- my target allocation,
- when I rebalance,
- what I'll do if the market falls 20%.

### Key takeaways

- Portfolios drift as markets move.
- Rebalancing restores your intended level of risk.
- Review the plan regularly and when life changes.
- A written plan protects you from emotional decisions.

---

## Control questions

### Q1. What is portfolio drift?
- A) Moving money between banks
- B) Selling everything in a crash
- C) The allocation changing away from its target because some investments grow faster than others ✅
- D) A type of fee

**Explanation:** different returns slowly change the mix.

### Q2. Your 10,000-coin portfolio is 75% basket and 25% bonds. Move it back to 60% basket and 40% bonds. How much should move?

```number
{
  "label": "Coins to move from the basket",
  "unit": "coins",
  "answer": 1500,
  "hint": "Find the current and target values of the basket, then subtract.",
  "dial": { "max": 5000, "step": 250 }
}
```

**Explanation:** The basket holds 7,500. Its target is 6,000, so 1,500 moves to bonds.

### Q3. What is a cheap way to rebalance without selling?
- A) Buy a speculative asset.
- B) Open a new account.
- C) Stop investing.
- D) Direct new contributions to the part that's below target. ✅

**Explanation:** new money fixes the mix without transaction costs from selling.

### Q4. The market drops 25% and your horizon is 20 years. What does panic selling do?
- A) Lowers your fees
- B) Locks in the loss and may make you miss the recovery ✅
- C) Protects your gains
- D) Rebalances your portfolio

**Explanation:** selling turns a temporary drop into a permanent loss.

### Q5. Which updates change the plan itself?

```assignment
{
  "mode": "SORT",
  "cards": [
    { "id": "card-1", "text": "A goal moves from five years away to next year" },
    { "id": "card-2", "text": "A stock jumps on a rumour today" },
    { "id": "card-3", "text": "A job loss changes your income" },
    { "id": "card-4", "text": "A market index falls 1% this afternoon" }
  ],
  "targets": [
    { "id": "target-1", "text": "Review the plan" },
    { "id": "target-2", "text": "Day-to-day noise" }
  ],
  "solution": {"card-1": "target-1", "card-2": "target-2", "card-3": "target-1", "card-4": "target-2"},
  "hint": "Did the goal, deadline or budget change?"
}
```

**Explanation:** A new deadline or changed income can change the plan. Daily prices and headlines can usually wait until the next planned review.
