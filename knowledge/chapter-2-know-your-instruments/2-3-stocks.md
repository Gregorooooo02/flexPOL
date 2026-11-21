# 2.3 Stocks

**Chapter:** 2 — Know Your Instruments
**Sandbox instrument:** Volatile concentrated asset
**Goal of this subchapter:** the learner understands what owning a stock means, how stocks can earn money, and why single stocks are volatile.

---

## Lesson

### What a stock is

A **stock** (also called a *share*) is a small piece of ownership in a company. If a company is split into 1,000,000 shares and you own 100, you own 0.01% of it.

### How stocks can earn money

1. **Price growth:** if the company grows and becomes more valuable, its share price may rise.
2. **Dividends:** some companies pay part of their profits to shareholders.

### Why stock prices move

Prices change every day, driven by things like:

- company results (profits, losses, new products, scandals),
- the economy as a whole,
- news, expectations and the mood of other investors.

Because of this, a **single stock can be very volatile**. It can double in a year, or lose most of its value.

### Single stock vs. many stocks

| | One company | Many companies (see 2.4) |
|---|---|---|
| Possible return | Can be very high | Closer to the market average |
| Risk | Very high: one company's problems hit you fully | Lower: problems in one company are diluted |
| Effort | You have to follow the company closely | Much less effort |

Even professional investors often fail to pick the "winners" consistently.

### What stocks are best for

- **Long-term goals**, where there's time to recover from drops.
- Usually as **part of a diversified portfolio**, not as the whole plan.

### Key takeaways

- A stock is a piece of ownership in a company.
- It can earn money through price growth and dividends.
- Single stocks can be very volatile.
- They fit long horizons, ideally inside a diversified mix.

---

## Control questions

### Q1. What do you own when you buy a stock?
- A) A savings account at the company
- B) A loan to the company
- C) A small piece of ownership in the company ✅
- D) A guarantee of fixed interest

**Explanation:** shareholders are part-owners. Bond holders are lenders.

### Q2. You own 12 shares of Nova Robotics. It pays a dividend of 5 coins per share. How much arrives in your account?

```number
{
  "label": "Dividend paid",
  "unit": "coins",
  "answer": 60,
  "hint": "Each of your shares earns the same amount.",
  "dial": { "max": 140, "step": 5 }
}
```

**Explanation:** 12 shares × 5 coins per share = 60 coins.

### Q3. Sort the market news. Which events can hit just one company?

```assignment
{
  "mode": "SORT",
  "cards": [
    { "id": "card-1", "text": "Nova recalls its delivery robots" },
    { "id": "card-2", "text": "A recession cuts spending across the economy" },
    { "id": "card-3", "text": "Nova’s factory shuts for repairs" },
    { "id": "card-4", "text": "A broad sell-off hits most industries" }
  ],
  "targets": [
    { "id": "target-1", "text": "One company" },
    { "id": "target-2", "text": "Wider market" }
  ],
  "solution": {"card-1": "target-1", "card-2": "target-2", "card-3": "target-1", "card-4": "target-2"},
  "hint": "Look at who the headline directly affects."
}
```

**Explanation:** Holding many companies spreads the effect of company-specific news. A broad downturn can still hit the whole basket.

### Q4. A company you own announces a big product failure. What is the most likely short-term effect?
- A) The share price is guaranteed to stay the same.
- B) The share price falls. ✅
- C) The share price rises.
- D) The company must return your money.

**Explanation:** bad news usually lowers expectations of future profits, and the price drops.

### Q5. For which goal are stocks the most suitable?
- A) An emergency fund
- B) Rent due next month
- C) A holiday in 6 months
- D) Retirement in 30 years, as part of a diversified portfolio ✅

**Explanation:** a long horizon gives time to recover from the volatility.
