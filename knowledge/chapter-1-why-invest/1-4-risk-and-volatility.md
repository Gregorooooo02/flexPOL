# 1.4 Risk and Volatility

**Chapter:** 1 — Why Invest?
**Goal of this subchapter:** the learner understands that volatility means price swings, that higher possible returns come with higher risk, and the difference between risk tolerance and risk capacity.

---

## Lesson

### What is volatility?

**Volatility** describes how much and how often a price moves up and down.

- **Low volatility:** a calm line with small moves. Example: Accessible Cash.
- **Medium volatility:** a line that wobbles but usually trends somewhere. Example: Diversified market basket.
- **High volatility:** a jagged line with big jumps and big drops. Example: Volatile concentrated asset.

Volatility isn't the same as losing money. A volatile investment can end up higher than where it started. The danger is that it might be **down at the moment you need the money**.

### Risk and return go together

In general, investments with **higher possible returns** also carry **higher risk**. If something promises high returns with no risk, be very careful. That combination doesn't exist.

| Instrument (sandbox) | Possible return | Risk |
|---|---|---|
| Accessible Cash | Low | Very low |
| Locked-term instrument | Low to medium | Low (but low liquidity) |
| Diversified market basket | Medium | Medium |
| Volatile concentrated asset | High | High |

### Losses hurt more than they look

If an investment falls **50%**, it has to rise **100%** to get back to where it started.

> 1,000 → falls 50% → 500 → needs +100% → 1,000

Avoiding large losses matters a lot, even for long-term investors.

### Risk tolerance vs. risk capacity

- **Risk tolerance:** how much ups and downs you can handle **emotionally**. Would you panic and sell after a 20% drop?
- **Risk capacity:** how much risk you can **afford**, given your goal, horizon and finances.

They don't always match. Someone may love excitement (high tolerance) while needing the money next year (low capacity). In that case, **capacity wins**: the plan should follow what you can afford.

### Key takeaways

- Volatility means price swings, not automatically losses.
- Higher possible returns come with higher risk.
- A 50% loss needs a 100% gain to recover.
- Risk capacity, not only risk tolerance, should shape your plan.

---

## Control questions

### Q1. What does high volatility mean?
- A) The investment always loses money.
- B) The investment pays a fixed rate.
- C) The price moves up and down a lot. ✅
- D) The investment can't be sold.

**Explanation:** volatility is about the size and frequency of price moves, in both directions.

### Q2. A portfolio falls from 1,000 to 500 coins. What percentage gain from 500 gets it back to 1,000?

```number
{
  "label": "Gain needed to recover",
  "unit": "%",
  "answer": 100,
  "hint": "Calculate the gain relative to the smaller balance you have left.",
  "dial": { "max": 200, "step": 5 }
}
```

**Explanation:** You need another 500 coins, which is 100% of the new 500-coin balance.

### Q3. Help Hedgie sort these investment pitches.

```assignment
{
  "mode": "SORT",
  "cards": [
    { "id": "promise", "text": "Guaranteed high returns, no risk" },
    { "id": "fee", "text": "This fund charges 0.5% a year" },
    { "id": "rush", "text": "Buy in the next 10 minutes" },
    { "id": "loss", "text": "Your balance may fall" }
  ],
  "targets": [
    { "id": "information", "text": "Information you can use" },
    { "id": "flag", "text": "Red flag" }
  ],
  "solution": {"promise": "flag", "fee": "information", "rush": "flag", "loss": "information"},
  "hint": "Look for urgency or promises too good to be true."
}
```

**Explanation:** Promises of big guaranteed returns and pressure to buy immediately are warning signs. Describing fees or the possibility of losses gives you information you can check.

### Q4. Alex enjoys risk but needs the money in 10 months. What should guide the plan?
- A) Risk tolerance, because Alex enjoys risk
- B) Risk capacity, because the short horizon can't absorb large drops ✅
- C) Whatever was popular last month
- D) The highest past return

**Explanation:** what you can afford matters more than what you'd enjoy.

### Q5. Match each fictional price chart to its level of volatility.

```assignment
{
  "mode": "MATCH",
  "cards": [
    { "id": "a", "text": "Chart A", "prices": [100, 117, 82, 120, 84, 100] },
    { "id": "b", "text": "Chart B", "prices": [100, 100, 100, 100, 100, 100] },
    { "id": "c", "text": "Chart C", "prices": [100, 105, 96, 106, 95, 100] }
  ],
  "targets": [
    { "id": "low", "text": "Low volatility" },
    { "id": "medium", "text": "Medium volatility" },
    { "id": "high", "text": "High volatility" }
  ],
  "solution": {"a": "high", "b": "low", "c": "medium"},
  "hint": "All three charts end where they started. Compare the size of the moves between those points."
}
```

**Explanation:** all three had the same final return. Chart A had the biggest price swings, Chart C had smaller swings, and Chart B stayed flat.
