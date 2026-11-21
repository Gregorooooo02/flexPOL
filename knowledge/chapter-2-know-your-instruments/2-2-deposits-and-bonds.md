# 2.2 Deposits and Bonds

**Chapter:** 2 — Know Your Instruments
**Sandbox instrument:** Locked-term instrument
**Goal of this subchapter:** the learner understands fixed-term deposits and bonds as lending money for interest, including lock-in and credit risk.

---

## Lesson

### Term deposits

A **term deposit** is money you leave with a bank for a fixed period, for example 6 months, 1 year or 3 years. In return you get a **fixed interest rate**, usually a bit higher than a regular savings account.

The catch: if you take the money out **before the term ends**, you usually lose some or all of the interest. That's the **early withdrawal penalty**.

### Bonds

A **bond** is a loan you give to a government or a company. They promise to:

1. pay you **interest** (called a *coupon*) at regular intervals, and
2. pay back the **original amount** when the bond **matures** (at the end of its term).

| Issuer | Typical risk | Typical interest |
|---|---|---|
| Stable government | Low | Lower |
| Large, stable company | Low to medium | Medium |
| Weaker company | Higher | Higher |

### Risks to know

- **Credit risk:** the borrower might fail to pay you back. Riskier borrowers pay more interest to make up for it.
- **Liquidity risk:** your money is tied up until the end of the term. Some bonds can be sold early, but possibly at a lower price.
- **Interest rate risk:** if rates in the market go up, older bonds with lower rates become less attractive, and their price can fall.
- **Inflation risk:** a fixed rate may end up below inflation.

### What they're best for

- Goals with a **known date** that the term fits: "I need this money in exactly 2 years."
- The **steadier part** of a portfolio, to balance out more volatile investments.

### Key takeaways

- Deposits and bonds mean lending money in exchange for interest.
- They're usually steadier than stocks, but the money is locked for a period.
- Higher interest usually means a riskier borrower.
- Match the term to when you'll need the money.

---

## Control questions

### Q1. Link each term to what happens behind the scenes.

```assignment
{
  "mode": "MATCH",
  "cards": [
    { "id": "card-1", "text": "Term deposit" },
    { "id": "card-2", "text": "Bond" },
    { "id": "card-3", "text": "Bond issuer" }
  ],
  "targets": [
    { "id": "target-1", "text": "The organisation that borrows" },
    { "id": "target-2", "text": "A loan you make to an issuer" },
    { "id": "target-3", "text": "Money you leave with a bank until a set date" }
  ],
  "solution": {"card-1": "target-3", "card-2": "target-2", "card-3": "target-1"},
  "hint": "Find the borrower first. Then compare the loan and the bank agreement."
}
```

**Explanation:** Issuers borrow through bonds. A deposit is an agreement with the bank for a set term.

### Q2. What usually happens if you withdraw from a term deposit early?
- A) You lose some or all of the interest. ✅
- B) The term gets longer.
- C) Nothing changes.
- D) You get a bonus.

**Explanation:** the early withdrawal penalty is the price of breaking the agreement.

### Q3. Why does a weaker company pay more interest on its bonds than a stable government?
- A) It doesn't; they pay the same.
- B) Because it's more generous
- C) Because the law requires it
- D) To make up lenders for the higher risk of not being paid back ✅

**Explanation:** higher credit risk requires higher interest to attract lenders.

### Q4. You need 5,000 coins in exactly 1 year. Which choice fits best?
- A) A 10-year bond
- B) A 1-year term deposit ✅
- C) A volatile single stock
- D) A 5-year locked-term instrument

**Explanation:** the term matches the date the money is needed.

### Q5. A fictional deposit pays out 2,080 coins at maturity. If you leave early, you get your original 2,000 back. How much do you give up?

```number
{
  "label": "Interest given up",
  "unit": "coins",
  "answer": 80,
  "hint": "Subtract what you get today from what you would get at maturity.",
  "dial": { "max": 250, "step": 10 }
}
```

**Explanation:** The 80-coin difference is the interest you forgo to get immediate access.
