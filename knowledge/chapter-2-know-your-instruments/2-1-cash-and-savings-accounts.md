# 2.1 Cash and Savings Accounts

**Chapter:** 2 — Know Your Instruments
**Sandbox instrument:** Accessible Cash
**Goal of this subchapter:** the learner knows what cash and savings accounts are good for, and what their hidden cost is.

---

## Lesson

### What it is

Cash means money in your wallet, in a current account or in a **savings account**. A savings account usually pays a small amount of **interest** and lets you withdraw money at any time.

### Strengths

- **Very low risk:** the balance doesn't swing up and down like stock prices.
- **High liquidity:** available immediately, usually at no cost.
- **Predictable:** you know what you have.

### Weaknesses

- **Low return:** interest is usually small.
- **Inflation risk:** if inflation is higher than the interest rate, the money loses purchasing power every year, even though the balance grows.

> Your savings account pays 2% a year. Inflation is 4%. Your balance grows, but what it can buy shrinks by roughly 2% a year.

### What it's best for

- The **emergency fund**
- **Short-term goals**, under about 2 years
- Money waiting to be invested

### What it's not good for

- **Long-term goals** like retirement. Over decades, inflation can quietly eat a large part of the value.

### Key takeaways

- Cash is safe and liquid, but grows slowly.
- Its hidden risk is inflation.
- It's the right home for emergency funds and short-term goals.

---

## Control questions

### Q1. What is the main strength of a savings account?
- A) High returns
- B) Ownership of a company
- C) Safety and quick access to the money ✅
- D) Protection against inflation

**Explanation:** low risk and high liquidity are what make cash useful.

### Q2. Your 100-coin savings balance earns 1 coin. A grocery basket that used to cost 100 now costs 103. How many coins are you short?

```number
{
  "label": "Shortfall",
  "unit": "coins",
  "answer": 2,
  "hint": "Find the new balance, then compare it with the new price.",
  "dial": { "max": 8, "step": 1 }
}
```

**Explanation:** The account now has 101 coins. You need 2 more coins for the same groceries.

### Q3. Which goal fits cash best?
- A) Retirement in 35 years
- B) Building wealth over 20 years
- C) A child's studies in 18 years
- D) An emergency fund ✅

**Explanation:** an emergency fund needs safety and immediate access.

### Q4. Which jobs fit an accessible cash stash?

```assignment
{
  "mode": "SORT",
  "cards": [
    { "id": "card-1", "text": "Rent next week" },
    { "id": "card-2", "text": "Retirement in 35 years" },
    { "id": "card-3", "text": "Repair bill due today" },
    { "id": "card-4", "text": "A child’s future in 18 years" }
  ],
  "targets": [
    { "id": "target-1", "text": "Needs accessible cash" },
    { "id": "target-2", "text": "Has years to grow" }
  ],
  "solution": {"card-1": "target-1", "card-2": "target-2", "card-3": "target-1", "card-4": "target-2"},
  "hint": "Look at when each expense could arrive."
}
```

**Explanation:** Cash helps with imminent spending. Over many years, rising prices can eat into its buying power.
