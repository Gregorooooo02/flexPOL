# 2.7 Comparing Instruments

**Chapter:** 2 — Know Your Instruments
**Goal of this subchapter:** the learner can compare instruments on risk, return, liquidity, cost and suitable horizon, and pick a fitting mix for a goal.

---

## Lesson

### Five questions for any instrument

Before choosing any instrument, ask:

1. **Risk:** how much can its value drop?
2. **Return:** how much can it realistically grow?
3. **Liquidity:** how quickly can I get my money out?
4. **Cost:** what fees will I pay?
5. **Horizon:** what time frame does it suit?

### The comparison table

| Instrument | Risk | Possible return | Liquidity | Typical cost | Suits horizon |
|---|---|---|---|---|---|
| **Cash / savings** | Very low | Low (may trail inflation) | Very high | Very low | Short |
| **Term deposit** | Low | Low to medium | Low until the term ends | Low | Matches the term |
| **Bonds** | Low to medium | Low to medium | Medium | Low to medium | Medium |
| **Broad index fund / ETF** | Medium | Medium to high over long periods | High | Low | Long |
| **Single stock** | High | High, or a large loss | High | Low to medium | Long, small share only |
| **Speculative assets** | Very high | Very uncertain | Varies | Often high or hidden | Money you can afford to lose |

### There's no "best" instrument

Each instrument is a **tool**. A hammer isn't better than a screwdriver; it depends on the job. The right choice depends on:

- your **goal** and when you need the money,
- how much risk you can **afford** (risk capacity),
- what else you already own.

### Mixing instruments: an allocation

Most plans combine several instruments. That mix is called an **allocation**.

> **Example:** a goal in 15 years, with an emergency fund already in place
> - 70% broad market basket for growth
> - 20% bonds or locked-term instruments for stability
> - 10% cash for flexibility
>
> **Example:** a goal in 1 year
> - 80–100% cash or a short-term deposit
> - little or nothing in volatile assets

### Key takeaways

- Compare instruments on risk, return, liquidity, cost and horizon.
- No instrument is best for every goal.
- An allocation mixes instruments to fit one goal.

---

## Control questions

### Q1. Which instrument has the highest liquidity?
- A) A 10-year bond
- B) A pension account locked until 65
- C) Cash in a savings account ✅
- D) A 3-year term deposit

**Explanation:** cash is available immediately, at no cost.

### Q2. Which statement is true?
- A) The right instrument depends on the goal, horizon and risk capacity. ✅
- B) Cash is always the safest choice for every goal.
- C) Index funds are always the best choice.
- D) Higher return always means a better instrument.

**Explanation:** each tool fits some jobs better than others.

### Q3. Pair each goal with the best fit among these three fictional instruments.

```assignment
{
  "mode": "MATCH",
  "cards": [
    { "id": "card-1", "text": "An emergency fund" },
    { "id": "card-2", "text": "Retirement in 30 years" },
    { "id": "card-3", "text": "A deposit due in two years" }
  ],
  "targets": [
    { "id": "target-1", "text": "Broad market basket" },
    { "id": "target-2", "text": "Instrument that unlocks in two years" },
    { "id": "target-3", "text": "Accessible Cash" }
  ],
  "solution": {"card-1": "target-3", "card-2": "target-1", "card-3": "target-2"},
  "hint": "Which goal could force you to withdraw tomorrow?"
}
```

**Explanation:** Check the deadline and access needs of each goal before picking the instrument.

### Q4. What is an "allocation"?
- A) A fee charged by a fund
- B) The way your money is split across different instruments ✅
- C) A type of bond
- D) A government benefit

**Explanation:** an allocation is the mix of instruments in a plan.

### Q5. Hedgie starts with 2,000 coins, puts 25% in a basket and 15% in bonds. How much is left in cash?

```number
{
  "label": "Cash left",
  "unit": "coins",
  "answer": 1200,
  "hint": "Subtract the two allocated shares from 100%.",
  "dial": { "max": 3000, "step": 100 }
}
```

**Explanation:** 60% of 2,000 coins remains in cash, or 1,200 coins.
