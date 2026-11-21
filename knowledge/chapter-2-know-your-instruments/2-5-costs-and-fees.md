# 2.5 Costs and Fees

**Chapter:** 2 — Know Your Instruments
**Goal of this subchapter:** the learner recognizes the main types of investment costs and understands how small yearly fees add up over decades.

---

## Lesson

### Why fees matter

Every coin you pay in fees is a coin that no longer grows for you. Fees look small, often just 1% or 2% a year, but they are charged **every year**, on your **whole balance**, and they **compound** against you.

### Common types of costs

| Cost | What it is |
|---|---|
| **Management fee** | A yearly percentage a fund charges for running it, often called the *expense ratio* |
| **Transaction fee** | A fee for each buy or sell |
| **Entry / exit fee** | A fee for joining or leaving a fund or product |
| **Account fee** | A fixed fee for keeping an account open |
| **Spread** | The small difference between the buying and selling price |
| **Taxes** | Taxes on gains or income, depending on the rules where you live |

### The power of 1%

10,000 coins invested for 30 years, with a fictional 6% yearly return before fees:

| Yearly fee | Return after fees | Value after 30 years |
|---|---|---|
| 0% | 6% | ~57,400 coins |
| 1% | 5% | ~43,200 coins |
| 2% | 4% | ~32,400 coins |

A 1% fee cost about **14,200 coins**, roughly a quarter of the final value. A 2% fee cost about 25,000 coins.

### How to keep costs low

- **Compare fees** before choosing a fund. Similar funds can charge very different amounts.
- **Trade less often.** Frequent buying and selling adds transaction costs.
- **Watch for hidden costs** in complex products.
- Ask: "Is the extra cost buying me something I actually need?"

### Key takeaways

- Fees are charged every year and compound against you.
- A 1% difference can cost a large part of long-term growth.
- Always compare costs before choosing an instrument.
- Trading often increases costs.

---

## Control questions

### Q1. Why do small yearly fees have a big effect over time?
- A) They don't; small fees never matter.
- B) They're charged once, at the start.
- C) They're charged every year on the whole balance and compound. ✅
- D) They only apply to large investors.

**Explanation:** a fee taken every year reduces the base that compounding works on.

### Q2. A fictional fund earns 6% a year before a fee that knocks off two percentage points. Find the first year 1,000 coins doubles at the resulting 4% rate.

```number
{
  "label": "Years with the fee",
  "unit": "years",
  "answer": 18,
  "hint": "Find when the net balance crosses 2,000. Try one year earlier to check.",
  "lab": {"kind": "COMPOUNDING", "max": 30, "step": 1, "initial": 0, "balance": 1000, "rate": 4}
}
```

**Explanation:** At 4%, the balance first reaches 2,000 in year 18. At 6% in the same toy example it would cross that mark in year 12.

### Q3. Unpack the fees in three receipts.

```assignment
{
  "mode": "MATCH",
  "cards": [
    { "id": "card-1", "text": "Management fee" },
    { "id": "card-2", "text": "Transaction fee" },
    { "id": "card-3", "text": "Spread" }
  ],
  "targets": [
    { "id": "target-1", "text": "Buy for 101 or sell for 99" },
    { "id": "target-2", "text": "Coins charged each time you place a trade" },
    { "id": "target-3", "text": "A percentage of the fund charged each year" }
  ],
  "solution": {"card-1": "target-3", "card-2": "target-2", "card-3": "target-1"},
  "hint": "Watch whether the cost shows up every year, with each trade, or in the quoted prices."
}
```

**Explanation:** A management fee charges for running the fund. Transaction fees apply to trades. A spread is the gap between buy and sell prices.

### Q4. Which habit increases costs the most?
- A) Buying an index fund and holding it for years
- B) Buying and selling many times a month ✅
- C) Investing a fixed amount every month in one fund
- D) Comparing fees before investing

**Explanation:** each trade can carry transaction fees and spreads.
