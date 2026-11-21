# 1.2 Setting Goals

**Chapter:** 1 — Why Invest?
**Goal of this subchapter:** the learner can turn a vague wish into a clear financial goal and sort goals by time horizon.

---

## Lesson

### Start with "why", not "what"

Many beginners start by asking "What should I buy?" A better first question is: **"What is this money for?"**

The goal decides which instruments make sense. The same 5,000 coins should be handled very differently if they're meant for a holiday next summer or for retirement in 35 years.

![Hedgie squints as his dart flies toward the bullseye.](/lesson-illustrations/hedgie-target-practice.svg)

### Vague wishes vs. clear goals

| Vague wish | Clear goal |
|---|---|
| "I want to be rich." | "I want 20,000 coins for a home deposit in 5 years." |
| "I want to save for later." | "I want an emergency fund worth 3 months of expenses within 1 year." |
| "I want a nice retirement." | "I want to add 200 coins a month to my retirement savings until age 65." |

A clear goal answers three questions:

1. **What** is it for?
2. **How much** do I need?
3. **When** do I need it?

### Three kinds of goals by time horizon

| Horizon | Typical time | Examples | What matters most |
|---|---|---|---|
| **Short-term** | Under 2 years | Holiday, new laptop, emergency fund | Safety and access to the money |
| **Medium-term** | 2–10 years | Car, home deposit, studies | Balance between growth and safety |
| **Long-term** | Over 10 years | Retirement, a child's future | Growth; there's time to recover from drops |

### Order of goals

Most people have several goals at once. A sensible order is:

1. **Emergency fund first.** It protects you from selling investments at a bad moment.
2. **Short-term needs** you already know about.
3. **Long-term goals**, where investing does the most work.

### Key takeaways

- The goal comes before the instrument.
- A clear goal names what, how much and when.
- The time horizon sorts goals into short-, medium- and long-term.
- An emergency fund usually comes first.

---

## Control questions

### Q1. Which of these is a clear financial goal?
- A) "I want more money."
- B) "I want to invest in something good."
- C) "I want 6,000 coins for a car in 3 years." ✅
- D) "I want to be financially free someday."

**Explanation:** only C names what the money is for, how much and when.

### Q2. Sort each goal by when you will need the money.

```assignment
{
  "mode": "SORT",
  "cards": [
    { "id": "holiday", "text": "Holiday in 8 months" },
    { "id": "retirement", "text": "Retirement in 30 years" },
    { "id": "home", "text": "Home deposit in 6 years" },
    { "id": "laptop", "text": "Laptop in 18 months" }
  ],
  "targets": [
    { "id": "short", "text": "Short-term" },
    { "id": "medium", "text": "Medium-term" },
    { "id": "long", "text": "Long-term" }
  ],
  "solution": {"holiday": "short", "retirement": "long", "home": "medium", "laptop": "short"},
  "hint": "Start with the time left until you need the money. Try comparing all the deadlines in years."
}
```

**Explanation:** under 2 years is short-term, 2–10 years is medium-term, over 10 years is long-term.

### Q3. Hedgie wants a 1,200-coin bike in eight months. How much goes in the bike jar each month if it starts empty?

```number
{
  "label": "Monthly deposit",
  "unit": "coins",
  "answer": 150,
  "hint": "Divide the price by the number of deposits.",
  "dial": { "max": 400, "step": 25 }
}
```

**Explanation:** Eight deposits of 150 coins reach the goal. A price and a deadline turn a wish into a plan.

### Q4. Match each plan to the part of the goal it makes clear.

```assignment
{
  "mode": "MATCH",
  "cards": [
    { "id": "target", "text": "Save for a new bike" },
    { "id": "cost", "text": "Set aside 1,200 coins" },
    { "id": "deadline", "text": "Have the money by August" }
  ],
  "targets": [
    { "id": "when", "text": "When I need the money" },
    { "id": "why", "text": "What I’m saving for" },
    { "id": "howmuch", "text": "How much I need" }
  ],
  "solution": {"target": "why", "cost": "howmuch", "deadline": "when"},
  "hint": "Look for a purpose, a price, and a deadline."
}
```

**Explanation:** A usable goal says what you want, how much it costs, and when the money will be needed.
