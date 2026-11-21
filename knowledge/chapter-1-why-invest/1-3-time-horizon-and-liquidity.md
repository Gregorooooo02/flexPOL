# 1.3 Time Horizon and Liquidity

**Chapter:** 1 — Why Invest?
**Goal of this subchapter:** the learner can judge whether an instrument fits a goal based on when the money is needed and how quickly it can be accessed.

---

## Lesson

### Time horizon: how long until you need the money?

Your **time horizon** is the time between now and the moment you need the money.

- **Short horizon:** there is no time to recover if the value drops. Pick safer options.
- **Long horizon:** short-term drops matter less, because there are years for the value to recover. Growth-oriented options can make sense.

A 30% drop is painful at any age. It's a disaster if you need the money next month, and much easier to handle if you need it in 25 years.

### Liquidity: how quickly can you get it out?

**Liquidity** describes how fast and how cheaply you can turn an investment into cash.

| Liquidity | Example in the sandbox | What that means |
|---|---|---|
| **High** | Accessible Cash | Available any time, at no cost |
| **Medium** | Diversified market basket | Can be sold quickly, but the price on that day may be low |
| **Low** | Locked-term instrument | Money is tied up until the term ends; early withdrawal costs a penalty |

Low liquidity isn't bad in itself. Locked instruments often pay a bit more **because** you give up access. The problem starts when you lock away money you may need.

### The emergency fund

Life brings surprises: a broken car, a medical bill, a lost job. An **emergency fund** is money kept in a highly liquid, safe place, often 3–6 months of essential expenses.

Without one, a surprise can force you to:
- sell investments at a bad moment, at a loss, or
- break a locked-term instrument and pay a penalty.

The emergency fund is what lets your investments stay invested.

### Matching horizon and liquidity

> **Maya** needs 4,000 coins for a flat deposit in 8 months.
> - Locked-term instrument for 2 years? ❌ The money is locked when she needs it.
> - Volatile concentrated asset? ❌ It could be down 30% exactly when she needs it.
> - Accessible Cash? ✅ Safe and available; the growth is small, but the horizon is short.

### Key takeaways

- Time horizon: when you need the money.
- Liquidity: how fast and how cheaply you can get it.
- Short horizons need safe, liquid options.
- An emergency fund protects your investments from forced selling.

---

## Control questions

### Q1. What does "liquidity" mean?
- A) How much an investment earns
- B) How many people own an investment
- C) How quickly and cheaply an investment can be turned into cash ✅
- D) How risky an investment is

**Explanation:** liquidity is about access to your money, not about return or risk.

### Q2. Maya has 2,000 coins and a 1,000-coin bill in eight months. Lock away as much as you can for two years while keeping the bill covered.

```number
{
  "label": "Coins to lock away",
  "unit": "coins",
  "answer": 1000,
  "hint": "Find the last position where Maya’s pocket still covers the bill.",
  "lab": {
    "kind": "LOCKBOX",
    "max": 2000,
    "step": 100,
    "initial": 0,
    "balance": 2000,
    "bill": 1000
  }
}
```

**Explanation:** Locking 1,000 coins leaves exactly 1,000 available before the bill is due. The lockbox cannot help with the bill.

### Q3. Sort these headlines by the problem they describe.

```assignment
{
  "mode": "SORT",
  "cards": [
    { "id": "quote", "text": "The basket falls 12% in a week" },
    { "id": "term", "text": "The deposit unlocks after rent is due" },
    { "id": "jump", "text": "A share jumps and then falls back" },
    { "id": "fee", "text": "An early withdrawal costs 50 coins" }
  ],
  "targets": [
    { "id": "access", "text": "Getting the money out" },
    { "id": "price", "text": "Changes in the price" }
  ],
  "solution": {"quote": "price", "term": "access", "jump": "price", "fee": "access"},
  "hint": "Imagine you already need the money. Is the price changing, or is there something in the way of getting it?"
}
```

**Explanation:** A change in value is price risk. Having to wait or pay to get the money out is an access problem.

### Q4. Hedgie spends 300 coins a month on essentials. Fill an emergency jar that covers three months.

```number
{
  "label": "Emergency jar",
  "unit": "coins",
  "answer": 900,
  "hint": "Multiply one month of spending by the number of months you want covered.",
  "dial": { "max": 2000, "step": 100 }
}
```

**Explanation:** Three months of essential spending comes to 900 coins. An emergency fund buys time when something unexpected happens.

### Q5. Match each fictional instrument to how you can get your money back.

```assignment
{
  "mode": "MATCH",
  "cards": [
    { "id": "cash", "text": "Accessible Cash" },
    { "id": "basket", "text": "Diversified market basket" },
    { "id": "term", "text": "Locked-term instrument" }
  ],
  "targets": [
    { "id": "sell", "text": "Sell quickly at the current market price" },
    { "id": "penalty", "text": "Wait until the term ends or pay an early withdrawal penalty" },
    { "id": "available", "text": "Use immediately with no withdrawal cost" }
  ],
  "solution": {"cash": "available", "basket": "sell", "term": "penalty"},
  "hint": "Imagine a bill is due tomorrow. For each instrument, what would you have to do before you could pay it?"
}
```

**Explanation:** cash is already available. For the basket, you need to sell and accept the current price. The locked-term instrument trades immediate access for a higher rate.
