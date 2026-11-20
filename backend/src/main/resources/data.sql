INSERT INTO USER (username, email) VALUES ('jkowalski', 'jan.kowalski@example.com');
INSERT INTO USER (username, email) VALUES ('anowak', 'anna.nowak@example.com');
INSERT INTO USER (username, email) VALUES ('pwisniewski', 'piotr.wisniewski@example.com');

-- BEGIN GENERATED CONTENT (scripts/generate-content-sql.mjs, do not edit by hand)

-- Chapter 1: Why Invest?
INSERT INTO chapter (id, sort_order, title, objective, mission_title, mission_description) VALUES (1, 1, 'Why Invest?', 'The learner can explain why investing matters and match a goal to a time horizon and a level of risk.', 'The Two-Year Goal', 'The learner allocates fictional money across the sandbox instruments. Then an event hits: the volatile asset drops and an unexpected bill arrives. The AI debriefs, the learner retries, gets a score, and Free Play unlocks.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (1, 1, 1, '1.1', 'Why Investing Is Worth It', 'The learner understands why keeping all their money in cash loses value over time, and how compounding helps invested money grow.', NULL, '### Money that sits still slowly shrinks

Imagine you keep 1,000 coins under your mattress. Ten years later you still have 1,000 coins, but they buy less than they used to. That''s **inflation**: prices rise over time, so each coin buys a little less every year.

With 3% inflation a year, 1,000 coins today buy only about as much as **744 coins** would in 10 years. Nothing was stolen. The money simply lost **purchasing power**.

### Saving vs. investing

- **Saving** means putting money aside somewhere safe and easy to reach, like a savings account. It protects you against surprises, but it often grows more slowly than inflation.
- **Investing** means putting money into assets that can grow, like shares of companies or funds. It can grow faster, but its value goes up and down along the way.

You need both. Saving covers the short term. Investing serves long-term goals.

### Compounding: growth on top of growth

When an investment earns a return, that return can earn returns too. This is called **compounding**.

Say 1,000 coins grow by a fictional 5% a year, with no money added:

| After | Value |
|---|---|
| 10 years | ~1,629 coins |
| 20 years | ~2,653 coins |
| 30 years | ~4,322 coins |

The growth speeds up over time. In the last 10 years the money grew by more than in the first 20 years combined. **Time is the most powerful ingredient**, which is why starting early matters.

> **Rule of 72:** divide 72 by the yearly return to estimate how many years it takes money to double. At 6%, that''s 72 ÷ 6 ≈ 12 years.

### But nothing is free

Higher possible growth comes with **risk**. Investments can fall in value, sometimes sharply. You''ll learn about this in 1.4. Investing is worth it when it fits your goals and your time horizon, not because it always goes up.

### Key takeaways

- Inflation slowly reduces what cash can buy.
- Saving protects. Investing grows, with ups and downs.
- Compounding makes time your biggest advantage.
- Investing involves risk. It is not a guaranteed win.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (2, 1, 2, '1.2', 'Setting Goals', 'The learner can turn a vague wish into a clear financial goal and sort goals by time horizon.', NULL, '### Start with "why", not "what"

Many beginners start by asking "What should I buy?" A better first question is: **"What is this money for?"**

The goal decides which instruments make sense. The same 5,000 coins should be handled very differently if they''re meant for a holiday next summer or for retirement in 35 years.

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
| **Long-term** | Over 10 years | Retirement, a child''s future | Growth; there''s time to recover from drops |

### Order of goals

Most people have several goals at once. A sensible order is:

1. **Emergency fund first.** It protects you from selling investments at a bad moment.
2. **Short-term needs** you already know about.
3. **Long-term goals**, where investing does the most work.

### Key takeaways

- The goal comes before the instrument.
- A clear goal names what, how much and when.
- The time horizon sorts goals into short-, medium- and long-term.
- An emergency fund usually comes first.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (3, 1, 3, '1.3', 'Time Horizon and Liquidity', 'The learner can judge whether an instrument fits a goal based on when the money is needed and how quickly it can be accessed.', NULL, '### Time horizon: how long until you need the money?

Your **time horizon** is the time between now and the moment you need the money.

- **Short horizon:** there is no time to recover if the value drops. Pick safer options.
- **Long horizon:** short-term drops matter less, because there are years for the value to recover. Growth-oriented options can make sense.

A 30% drop is painful at any age. It''s a disaster if you need the money next month, and much easier to handle if you need it in 25 years.

### Liquidity: how quickly can you get it out?

**Liquidity** describes how fast and how cheaply you can turn an investment into cash.

| Liquidity | Example in the sandbox | What that means |
|---|---|---|
| **High** | Accessible Cash | Available any time, at no cost |
| **Medium** | Diversified market basket | Can be sold quickly, but the price on that day may be low |
| **Low** | Locked-term instrument | Money is tied up until the term ends; early withdrawal costs a penalty |

Low liquidity isn''t bad in itself. Locked instruments often pay a bit more **because** you give up access. The problem starts when you lock away money you may need.

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
- An emergency fund protects your investments from forced selling.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (4, 1, 4, '1.4', 'Risk and Volatility', 'The learner understands that volatility means price swings, that higher possible returns come with higher risk, and the difference between risk tolerance and risk capacity.', NULL, '### What is volatility?

**Volatility** describes how much and how often a price moves up and down.

- **Low volatility:** a calm line with small moves. Example: Accessible Cash.
- **Medium volatility:** a line that wobbles but usually trends somewhere. Example: Diversified market basket.
- **High volatility:** a jagged line with big jumps and big drops. Example: Volatile concentrated asset.

Volatility isn''t the same as losing money. A volatile investment can end up higher than where it started. The danger is that it might be **down at the moment you need the money**.

### Risk and return go together

In general, investments with **higher possible returns** also carry **higher risk**. If something promises high returns with no risk, be very careful. That combination doesn''t exist.

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

They don''t always match. Someone may love excitement (high tolerance) while needing the money next year (low capacity). In that case, **capacity wins**: the plan should follow what you can afford.

### Key takeaways

- Volatility means price swings, not automatically losses.
- Higher possible returns come with higher risk.
- A 50% loss needs a 100% gain to recover.
- Risk capacity, not only risk tolerance, should shape your plan.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (5, 1, 5, '1.5', 'Diversification', 'The learner can explain how spreading money across investments reduces the damage of one bad event, and what diversification cannot do.', NULL, '### Don''t put all your eggs in one basket

If you carry all your eggs in one basket and drop it, you lose them all. Split them across several baskets and one fall breaks only some of them.

Investing works the same way. **Diversification** means spreading money across many investments so that one bad result doesn''t ruin the whole plan.

### An example

Two learners each invest 10,000 coins. Then one fictional company, *Nova Robotics*, falls **60%**.

| | Portfolio A | Portfolio B |
|---|---|---|
| How it''s invested | 100% in Nova Robotics | 20 companies, 5% each |
| Loss from Nova''s drop | −6,000 coins | −300 coins |
| Portfolio change | **−60%** | **−3%** |

Same event, very different outcome. Portfolio A had **concentration risk**: its fate depended on a single company.

### Ways to diversify

- **Across companies:** many companies instead of one.
- **Across industries:** technology, healthcare, energy, food…
- **Across regions:** different countries and economies.
- **Across instrument types:** cash, locked-term instruments, market baskets.
- **Across time:** investing regularly instead of all at once.

In the sandbox, the **Diversified market basket** already holds many companies, which makes it a simple way to diversify.

### What diversification can''t do

Diversification **reduces** risk. It doesn''t **remove** it.

- If the **whole market** falls, a diversified portfolio falls too, though usually less than the worst single investment.
- It doesn''t guarantee a profit.
- Owning 10 very similar things (for example, 10 tech companies) is less diversified than it looks.

### Key takeaways

- Diversification spreads risk so one bad event hurts less.
- Concentration in one asset ties your outcome to that single asset.
- Diversify across companies, industries, regions and instrument types.
- Diversification reduces risk but doesn''t remove it.');

-- Chapter 2: Know Your Instruments
INSERT INTO chapter (id, sort_order, title, objective, mission_title, mission_description) VALUES (2, 2, 'Know Your Instruments', 'The learner can describe the main instrument types by risk, return, liquidity and cost, and pick the right tool for a goal.', 'Pick the Right Tool', 'The learner gets three fictional goals with different horizons and assigns each one an instrument mix. The coach challenges any mismatch, for example a locked-term instrument for an emergency fund. Quest Arena unlocks.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (6, 2, 1, '2.1', 'Cash and Savings Accounts', 'The learner knows what cash and savings accounts are good for, and what their hidden cost is.', 'ACCESSIBLE_CASH', '### What it is

Cash means money in your wallet, in a current account or in a **savings account**. A savings account usually pays a small amount of **interest** and lets you withdraw money at any time.

### Strengths

- **Very low risk:** the balance doesn''t swing up and down like stock prices.
- **High liquidity:** available immediately, usually at no cost.
- **Predictable:** you know what you have.

### Weaknesses

- **Low return:** interest is usually small.
- **Inflation risk:** if inflation is higher than the interest rate, the money loses purchasing power every year, even though the balance grows.

> Your savings account pays 2% a year. Inflation is 4%. Your balance grows, but what it can buy shrinks by roughly 2% a year.

### What it''s best for

- The **emergency fund**
- **Short-term goals**, under about 2 years
- Money waiting to be invested

### What it''s not good for

- **Long-term goals** like retirement. Over decades, inflation can quietly eat a large part of the value.

### Key takeaways

- Cash is safe and liquid, but grows slowly.
- Its hidden risk is inflation.
- It''s the right home for emergency funds and short-term goals.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (7, 2, 2, '2.2', 'Deposits and Bonds', 'The learner understands fixed-term deposits and bonds as lending money for interest, including lock-in and credit risk.', 'LOCKED_TERM', '### Term deposits

A **term deposit** is money you leave with a bank for a fixed period, for example 6 months, 1 year or 3 years. In return you get a **fixed interest rate**, usually a bit higher than a regular savings account.

The catch: if you take the money out **before the term ends**, you usually lose some or all of the interest. That''s the **early withdrawal penalty**.

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

### What they''re best for

- Goals with a **known date** that the term fits: "I need this money in exactly 2 years."
- The **steadier part** of a portfolio, to balance out more volatile investments.

### Key takeaways

- Deposits and bonds mean lending money in exchange for interest.
- They''re usually steadier than stocks, but the money is locked for a period.
- Higher interest usually means a riskier borrower.
- Match the term to when you''ll need the money.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (8, 2, 3, '2.3', 'Stocks', 'The learner understands what owning a stock means, how stocks can earn money, and why single stocks are volatile.', 'VOLATILE_ASSET', '### What a stock is

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
| Risk | Very high: one company''s problems hit you fully | Lower: problems in one company are diluted |
| Effort | You have to follow the company closely | Much less effort |

Even professional investors often fail to pick the "winners" consistently.

### What stocks are best for

- **Long-term goals**, where there''s time to recover from drops.
- Usually as **part of a diversified portfolio**, not as the whole plan.

### Key takeaways

- A stock is a piece of ownership in a company.
- It can earn money through price growth and dividends.
- Single stocks can be very volatile.
- They fit long horizons, ideally inside a diversified mix.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (9, 2, 4, '2.4', 'Funds and ETFs', 'The learner understands how funds bundle many investments, and the difference between index and actively managed funds.', 'MARKET_BASKET', '### What a fund is

A **fund** pools money from many investors and spreads it across many investments, such as dozens or hundreds of stocks, bonds or both. When you buy a piece of the fund, you indirectly own a small slice of everything in it.

It''s like buying a fruit basket instead of a single apple.

### ETFs

An **ETF** (*exchange-traded fund*) is a fund that can be bought and sold on a stock exchange during the day, like a single stock. Many ETFs follow an **index**.

### What is an index?

An **index** is a list of companies that represents a market or a part of it, for example "the 500 largest companies in a country" or "companies from around the world". An **index fund** simply buys everything in that list.

### Index funds vs. actively managed funds

| | Index (passive) fund | Actively managed fund |
|---|---|---|
| How it works | Copies an index | A manager picks investments, trying to beat the market |
| Cost | Usually low | Usually higher |
| Goal | Match the market''s return | Beat the market''s return |
| Reality | Gets about the market return, minus small fees | Many active funds fail to beat their index over the long term, especially after fees |

### Strengths of funds

- **Instant diversification**, even with a small amount of money
- **Less effort** than picking individual stocks
- Index funds are often **low-cost**

### Limits

- A fund still falls when its whole market falls.
- Fees vary a lot, so check them (see 2.5).
- A fund focused on one narrow theme (for example, only one industry) is less diversified.

### Key takeaways

- A fund bundles many investments into one.
- An ETF is a fund traded on an exchange.
- Index funds copy a market and are usually cheap.
- Funds give easy diversification, but don''t remove market risk.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (10, 2, 5, '2.5', 'Costs and Fees', 'The learner recognizes the main types of investment costs and understands how small yearly fees add up over decades.', NULL, '### Why fees matter

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
- Trading often increases costs.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (11, 2, 6, '2.6', 'High-Risk and Speculative Assets', 'The learner can recognize speculative assets and hype-driven decisions, and understands why they should stay a small part of a plan, if any.', NULL, '### Investing vs. speculating

- **Investing:** putting money into assets that are expected to produce value over time, like company profits or interest.
- **Speculating:** buying mainly because you hope the **price** will rise and someone will pay more later, often without any underlying income.

Speculation isn''t always wrong, but it is closer to a bet than a plan.

### Examples of high-risk assets

| Asset | Why it''s risky |
|---|---|
| **Cryptocurrencies** | Extreme volatility, no underlying income, prices driven largely by sentiment |
| **Leveraged products** | You invest with borrowed money, so gains **and losses** are multiplied; you can lose more than you put in |
| **Small or unknown companies** ("penny stocks") | Little information, easy to manipulate, can collapse to zero |
| **"Hot tips"** from social media | Often late, biased or part of a scheme |

### The hype cycle

1. A price starts rising, and stories spread.
2. More people buy because others are buying (**fear of missing out**, or FOMO).
3. The price goes far above any reasonable value.
4. Early buyers sell, the mood turns, and the price crashes.
5. Late buyers are left with large losses.

### Warning signs

- "Guaranteed" or "risk-free" high returns
- Pressure to "act now before it''s too late"
- Returns that rely only on new buyers joining
- No clear explanation of how the asset produces value
- Influencers paid to promote it

### If you want to speculate anyway

- Only use money you can **afford to lose completely**.
- Keep it a **small part** of your portfolio.
- Never use your **emergency fund** or money for near-term goals.
- Never borrow to speculate.

### Key takeaways

- Speculation is a bet on price, not a plan built on value.
- Leverage multiplies losses as well as gains.
- Hype and FOMO lead people to buy high and sell low.
- Keep speculative bets small and separate from important goals.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (12, 2, 7, '2.7', 'Comparing Instruments', 'The learner can compare instruments on risk, return, liquidity, cost and suitable horizon, and pick a fitting mix for a goal.', NULL, '### Five questions for any instrument

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

### There''s no "best" instrument

Each instrument is a **tool**. A hammer isn''t better than a screwdriver; it depends on the job. The right choice depends on:

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
- An allocation mixes instruments to fit one goal.');

-- Chapter 3: Investing Through Life
INSERT INTO chapter (id, sort_order, title, objective, mission_title, mission_description) VALUES (3, 3, 'Investing Through Life', 'The learner can adapt a plan to their life stage and explain why retirement investing starts early.', 'One Life, Four Decisions', 'The learner follows one fictional character across four life stages and adjusts the allocation at each one, with an event at each stage. The score rewards adapting the plan, not only the final balance.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (13, 3, 1, '3.1', 'Your Life Stage Changes Your Plan', 'The learner understands that a good plan changes over a lifetime, as horizon, income, responsibilities and risk capacity change.', NULL, '### One plan doesn''t last a lifetime

A plan that''s perfect at 25 may be wrong at 60. Not because investing rules change, but because **you** change: your goals, income, family and time horizon.

### What shifts with each life stage

| Factor | Early career | Mid-life | Near retirement |
|---|---|---|---|
| **Time horizon to retirement** | Very long (30–40 years) | Medium (15–30 years) | Short (under 10–15 years) |
| **Income** | Often lower, growing | Often at its highest | Stable, then ending |
| **Responsibilities** | Fewer | Family, home, several goals | Fewer dependents, health costs |
| **Savings built up** | Small | Growing | At its largest |
| **Risk capacity** | Usually higher | Medium | Usually lower |

### Human capital

When you''re young, your biggest asset is often your **future earning power**, called *human capital*. You may have little money saved, but decades of income ahead. That income can absorb investment losses and rebuild savings.

Near retirement, the money you''ve saved has to replace your salary. A large loss is much harder to recover from.

### Not only age

Age is a starting point, not a rule. Other things matter just as much:

- **Job stability:** a stable job allows more risk than an unpredictable income.
- **Dependents:** children or family who rely on you call for more safety.
- **Health** and other personal circumstances.
- **Several goals at once:** each goal can have its own horizon and its own allocation.

### Key takeaways

- A good plan adapts as your life changes.
- Risk capacity is usually higher when young and lower near retirement.
- Future earning power (human capital) helps young people absorb losses.
- Age matters, but so do job stability, dependents and personal goals.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (14, 3, 2, '3.2', 'Starting Out (18–30)', 'The learner understands the priorities of early adulthood and the large advantage of starting to invest early, even with small amounts.', NULL, '### Priorities in order

1. **Get control of spending.** Know what comes in and what goes out.
2. **Avoid or pay off expensive debt.** High-interest debt, like credit cards, often costs more than investments earn.
3. **Build an emergency fund.** Start small, for example one month of expenses, then grow it.
4. **Start investing regularly**, even small amounts.

### Starting early beats investing more later

Two fictional people invest 100 coins a month until age 65, with an illustrative 6% yearly return:

| | Starts at 25 | Starts at 35 |
|---|---|---|
| Years investing | 40 | 30 |
| Total paid in | 48,000 coins | 36,000 coins |
| Value at 65 | **~199,000 coins** | **~100,000 coins** |

Ten extra years and only 12,000 coins more paid in nearly **doubled** the result. That is compounding at work.

> Returns are fictional and fixed to keep the example simple. Real returns go up and down.

### Habits that make it easy

- **Pay yourself first:** move money to savings and investments right after payday, not with whatever is left at the end of the month.
- **Automate it:** a standing monthly transfer removes the need for willpower.
- **Increase contributions** when your income grows, instead of only increasing spending.
- **Keep it simple:** a broad, low-cost index fund is a common starting point.

### Typical mistakes

- Waiting until "having enough money" to start
- Chasing hype with savings meant for later
- Having no emergency fund, then selling investments in a crisis
- Ignoring an employer''s retirement plan, especially when the employer adds money

### Key takeaways

- Order: spending under control, expensive debt, emergency fund, then investing.
- Starting early matters more than starting big.
- Automating contributions builds the habit.
- A long horizon allows a growth-oriented allocation.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (15, 3, 3, '3.3', 'Building Up (30–50)', 'The learner can balance several goals with different horizons and keep long-term investing going while life gets busier.', NULL, '### Many goals at once

Mid-life often brings several financial goals at the same time:

- a home or a larger home,
- children and their education,
- a car, travel, caring for parents,
- and still: **retirement**.

Each goal has its **own horizon**, so each can have its **own allocation**.

### One person, three "buckets"

> **Sam, 38**, earns a steady income and wants to:
>
> | Goal | Horizon | Possible allocation |
> |---|---|---|
> | Emergency fund | Any time | 100% cash |
> | Home renovation | 3 years | Mostly deposits and bonds, little or no stocks |
> | Retirement | 27 years | Mostly a broad market basket |
>
> Thinking in buckets stops short-term goals from taking too much risk, and long-term goals from taking too little.

### Protecting the plan

With more people depending on you, protection matters more:

- **Emergency fund:** often 3–6 months of essential expenses, or more if income is unstable.
- **Insurance:** life, health and income protection can stop one event from ruining the whole plan.
- **Avoid lifestyle inflation:** when income rises, raise savings too, not only spending.

### Don''t pause retirement

A common mistake is stopping retirement contributions "for a few years" to fund other goals. Those years are valuable compounding time. Even a smaller monthly amount is better than stopping completely.

### Key takeaways

- Mid-life often means juggling several goals at once.
- Give each goal its own horizon and allocation.
- Protect the plan with an emergency fund and insurance.
- Keep retirement contributions going, even if smaller.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (16, 3, 4, '3.4', 'Approaching Retirement (50+)', 'The learner understands why risk is usually reduced near retirement, what a glide path is, and what sequence risk means.', NULL, '### From growing to protecting

For decades, the main job of retirement savings is to **grow**. As retirement gets close, the job gradually shifts to **protecting** what''s been built, and later to **providing income**.

### The glide path

A **glide path** is a plan that slowly shifts an allocation from growth-oriented to steadier as the target date approaches.

| Age | Market basket | Bonds / deposits | Cash |
|---|---|---|---|
| 30 | 85% | 10% | 5% |
| 45 | 70% | 25% | 5% |
| 55 | 55% | 38% | 7% |
| 65 | 40% | 50% | 10% |

*Illustrative example only. Real plans depend on the person.*

Note that even at 65, part of the money stays invested for growth. Retirement can last 20–30 years, and that money still needs to keep up with inflation.

### Sequence risk: when a crash hits matters

**Sequence risk** is the danger that markets fall **right before or early in retirement**, just when you start withdrawing money.

> **Crash at age 30:** savings are still small, contributions continue, there are decades to recover, and new contributions buy at lower prices.
>
> **Crash at age 64:** savings are at their largest, withdrawals are about to start, and selling at low prices locks in the losses.

The same percentage drop can have a much bigger effect late in the journey.

### Ways to reduce sequence risk

- Gradually **lower risk** in the years before retirement (the glide path).
- Keep **1–3 years of planned spending** in cash or short-term deposits, so you don''t have to sell investments during a crash.
- Stay **flexible**: spend a bit less in bad years if possible.

### Key takeaways

- Near retirement, the focus shifts from growth to protection.
- A glide path lowers risk gradually, not all at once.
- Sequence risk means a crash near retirement hurts the most.
- A cash buffer helps avoid selling at the worst moment.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (17, 3, 5, '3.5', 'Why Invest for a Pension', 'The learner understands why public pensions may not be enough and can estimate a fictional retirement gap.', NULL, '### Retirement is a long, expensive goal

Retirement can last **20–30 years**. For that whole period, your salary is replaced by a mix of:

1. a **public (state) pension**,
2. **employer pension schemes**, if you have one,
3. your **own savings and investments**.

### Why the public pension may not be enough

In many countries:

- People live **longer**, so pensions must last more years.
- There are **fewer workers** paying in for each retiree.
- Public pensions often replace only **part of your former salary**.

The difference between what you''ll need and what you''ll get is called the **retirement gap**.

### Estimating a fictional retirement gap

> **Ola** expects to need **3,000 coins a month** in retirement.
> Her expected public pension: **1,800 coins a month**.
>
> **Gap:** 3,000 − 1,800 = **1,200 coins a month**
> Over 20 years: 1,200 × 12 × 20 = **288,000 coins**
>
> *This simple version ignores inflation and investment returns. A real estimate is more complex, but the idea is the same: the gap has to be filled by your own savings.*

### Why investing, not just saving

Filling a gap of hundreds of thousands of coins with cash alone is very hard, and inflation makes it harder. Investing over decades lets **compounding** do much of the work (see 3.2).

### Your responsibility

Your pension is one of the **longest-term goals** you''ll have. Nobody will care about it as much as you. The earlier you:

- **check** what pension you can expect,
- **estimate** your gap,
- **start** filling it,

the smaller the monthly amount you''ll need.

### Key takeaways

- Retirement may last 20–30 years and needs its own plan.
- Public pensions often cover only part of your needs.
- The retirement gap is what you need minus what you''ll receive.
- Investing early turns a huge gap into manageable monthly amounts.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (18, 3, 6, '3.6', 'Pension Vehicles', 'The learner can recognize the main types of retirement accounts and their typical features: tax advantages, employer contributions and lock-up rules.', NULL, '### The three pillars

Many pension systems are described as three "pillars":

| Pillar | What it is | Who pays in |
|---|---|---|
| **1. Public pension** | The state pension system | Mandatory contributions from workers and employers |
| **2. Employer schemes** | Workplace pension plans | Often both the employee and the employer |
| **3. Personal retirement accounts** | Accounts you open yourself | You |

### Employer schemes

- Contributions are often taken **automatically from your salary**.
- Many employers **add their own money** on top. That''s part of your pay: skipping it can mean leaving free money behind.
- Some countries enroll workers **automatically**, and you have to opt out actively.

### Personal retirement accounts

- You choose how much to put in, often within a **yearly limit**.
- Inside the account you can usually choose **instruments**, such as funds, bonds and deposits.
- They often come with **tax advantages**.

### Typical tax advantages

Depending on the account and the country, tax benefits may include:

- **Tax relief on contributions:** what you pay in lowers your taxable income today.
- **Tax-free growth:** no tax on gains while the money stays in the account.
- **Lower or no tax on withdrawal**, if the rules are followed.

### The trade-off: lock-up rules

Tax advantages usually come with **conditions**:

- Money is meant to stay in until a **minimum age**.
- Early withdrawals may mean **losing the tax benefit** or paying a **penalty**.

That makes pension accounts **low-liquidity** instruments, similar to the Locked-term instrument in the sandbox. That''s why the **emergency fund stays outside** the pension account.

### Key takeaways

- Retirement income often comes from three pillars: public, employer and personal.
- Employer contributions are effectively extra pay.
- Personal pension accounts often offer tax advantages.
- In exchange, the money is usually locked until retirement age.');
INSERT INTO subchapter (id, chapter_id, sort_order, code, title, goal, sandbox_instrument, lesson_markdown) VALUES (19, 3, 7, '3.7', 'Staying on Course', 'The learner can rebalance a drifted portfolio, knows when to review a plan, and recognizes common behavioral traps.', NULL, '### Portfolios drift

You set an allocation of **60% market basket / 40% bonds**. After a strong year for the market, it has become **70% / 30%**. Nobody changed anything, but the portfolio is now **riskier than planned**.

This is called **drift**.

### Rebalancing

**Rebalancing** means bringing the portfolio back to its target mix.

> **Example:** a target of 60/40, total value 10,000 coins.
> After a good market year: basket 7,000 (70%), bonds 3,000 (30%).
> **Rebalance:** move 1,000 from the basket to bonds → 6,000 / 4,000 = 60/40.

Two ways to rebalance:

- **Sell and buy:** move money from what grew to what fell behind.
- **Redirect new money:** put new contributions into the part that''s below target. This is often cheaper.

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
- what I''ll do if the market falls 20%.

### Key takeaways

- Portfolios drift as markets move.
- Rebalancing restores your intended level of risk.
- Review the plan regularly and when life changes.
- A written plan protects you from emotional decisions.');

-- Control questions: 1.1 Why Investing Is Worth It
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (1, 1, 1, 'CONTROL', '1.1 Why Investing Is Worth It — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (1, 1, 1, 'You keep 1,000 coins in cash for 10 years while prices rise 3% a year. What happens?', 'The number of coins stays the same, but inflation reduces their purchasing power.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (1, 1, 'A', 'Nothing changes.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (2, 1, 'B', 'Your coins buy more.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (3, 1, 'C', 'You have the same number of coins, but they buy less.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (4, 1, 'D', 'You have fewer coins.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (2, 1, 2, 'What is compounding?', 'With compounding, growth builds on earlier growth, so the effect gets stronger over time.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (5, 2, 'A', 'Earning returns on your earlier returns', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (6, 2, 'B', 'Moving money from savings into investments', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (7, 2, 'C', 'Paying fees on your investments', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (8, 2, 'D', 'Splitting money between several investments', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (3, 1, 3, 'Using the Rule of 72, how long does money take to double at an 8% yearly return?', '72 ÷ 8 = 9 years.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (9, 3, 'A', 'About 6 years', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (10, 3, 'B', 'About 9 years', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (11, 3, 'C', 'About 12 years', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (12, 3, 'D', 'About 18 years', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (4, 1, 4, 'Which statement best describes the difference between saving and investing?', 'They do different jobs. Most people need both.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (13, 4, 'A', 'Saving is always better than investing.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (14, 4, 'B', 'Saving keeps money safe and accessible; investing aims for growth but goes up and down.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (15, 4, 'C', 'There is no difference.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (16, 4, 'D', 'Investing is always better than saving.', FALSE);

-- Control questions: 1.2 Setting Goals
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (2, 1, 2, 'CONTROL', '1.2 Setting Goals — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (5, 2, 1, 'Which of these is a clear financial goal?', 'Only C names what the money is for, how much and when.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (17, 5, 'A', '"I want more money."', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (18, 5, 'B', '"I want to invest in something good."', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (19, 5, 'C', '"I want 6,000 coins for a car in 3 years."', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (20, 5, 'D', '"I want to be financially free someday."', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (6, 2, 2, 'Sort the goals: a holiday in 8 months, a home deposit in 6 years, retirement in 30 years.', 'Under 2 years is short-term, 2–10 years is medium-term, over 10 years is long-term.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (21, 6, 'A', 'Short, medium, long', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (22, 6, 'B', 'Medium, long, long', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (23, 6, 'C', 'Long, medium, short', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (24, 6, 'D', 'Short, short, long', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (7, 2, 3, 'Why should the goal come before choosing an instrument?', 'Money needed soon can''t wait out a drop in value; money needed in 30 years can.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (25, 7, 'A', 'It doesn''t matter which comes first.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (26, 7, 'B', 'Because instruments change every year', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (27, 7, 'C', 'Because goals are required by law', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (28, 7, 'D', 'Because the goal''s timing and amount decide how much risk the money can take', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (8, 2, 4, 'For a short-term goal, what matters most?', 'With little time, there is no room to recover from losses or to wait for a locked term to end.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (29, 8, 'A', 'Owning one exciting stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (30, 8, 'B', 'Safety and being able to access the money', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (31, 8, 'C', 'The highest possible return', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (32, 8, 'D', 'Locking the money away for a long time', FALSE);

-- Control questions: 1.3 Time Horizon and Liquidity
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (3, 1, 3, 'CONTROL', '1.3 Time Horizon and Liquidity — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (9, 3, 1, 'What does "liquidity" mean?', 'Liquidity is about access to your money, not about return or risk.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (33, 9, 'A', 'How much an investment earns', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (34, 9, 'B', 'How many people own an investment', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (35, 9, 'C', 'How quickly and cheaply an investment can be turned into cash', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (36, 9, 'D', 'How risky an investment is', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (10, 3, 2, 'Maya needs money in 8 months. Which instrument fits **worst**?', 'The locked term ends after she needs the money, so she would pay a penalty or miss the deadline.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (37, 10, 'A', 'A 2-year Locked-term instrument', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (38, 10, 'B', 'A mix of mostly cash with a small basket share', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (39, 10, 'C', 'Accessible Cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (40, 10, 'D', 'None of them; all fit equally.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (11, 3, 3, 'Why can a long time horizon handle more volatility?', 'Long horizons don''t remove risk, but they give time for recovery.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (41, 11, 'A', 'Because inflation stops over time', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (42, 11, 'B', 'Because long-term investments have no risk', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (43, 11, 'C', 'Because prices only go up over long periods', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (44, 11, 'D', 'Because there are more years to recover from temporary drops', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (12, 3, 4, 'What is the main job of an emergency fund?', 'It''s a safety net that protects the rest of your plan.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (45, 12, 'A', 'Replacing a pension', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (46, 12, 'B', 'Covering surprise costs so you don''t have to sell investments at a bad moment', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (47, 12, 'C', 'Paying for holidays', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (48, 12, 'D', 'Earning the highest return', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (13, 3, 5, 'Why do locked-term instruments often pay slightly more than cash?', 'You trade liquidity for a higher rate.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (49, 13, 'A', 'They are always risk-free.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (50, 13, 'B', 'They don''t; they always pay less.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (51, 13, 'C', 'The bank likes long-term customers.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (52, 13, 'D', 'They reward you for giving up access to your money for a period.', TRUE);

-- Control questions: 1.4 Risk and Volatility
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (4, 1, 4, 'CONTROL', '1.4 Risk and Volatility — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (14, 4, 1, 'What does high volatility mean?', 'Volatility is about the size and frequency of price moves, in both directions.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (53, 14, 'A', 'The investment always loses money.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (54, 14, 'B', 'The investment pays a fixed rate.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (55, 14, 'C', 'The price moves up and down a lot.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (56, 14, 'D', 'The investment can''t be sold.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (15, 4, 2, 'An investment falls 50%. How much does it need to rise to return to its starting value?', 'From 500 back to 1,000 is a 100% gain.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (57, 15, 'A', '50%', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (58, 15, 'B', '75%', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (59, 15, 'C', '100%', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (60, 15, 'D', '150%', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (16, 4, 3, 'Someone offers an investment with "high returns and no risk". What should you think?', 'Risk and return go together. A "no-risk, high-return" promise is a warning sign.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (61, 16, 'A', 'It''s normal for funds.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (62, 16, 'B', 'Great deal, invest quickly.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (63, 16, 'C', 'It''s only risky for beginners.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (64, 16, 'D', 'Be very skeptical; higher returns always come with higher risk.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (17, 4, 4, 'Alex enjoys risk but needs the money in 10 months. What should guide the plan?', 'What you can afford matters more than what you''d enjoy.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (65, 17, 'A', 'Risk tolerance, because Alex enjoys risk', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (66, 17, 'B', 'Risk capacity, because the short horizon can''t absorb large drops', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (67, 17, 'C', 'Whatever was popular last month', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (68, 17, 'D', 'The highest past return', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (18, 4, 5, 'Match each chart to an instrument: a flat line, a wavy line, a jagged line.', 'Cash barely moves, the basket wobbles, and the concentrated asset swings hard.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (69, 18, 'A', 'Basket, cash, volatile asset', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (70, 18, 'B', 'Volatile asset, basket, cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (71, 18, 'C', 'Cash, volatile asset, basket', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (72, 18, 'D', 'Cash, basket, volatile asset', TRUE);

-- Control questions: 1.5 Diversification
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (5, 1, 5, 'CONTROL', '1.5 Diversification — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (19, 5, 1, 'What is diversification?', 'Spreading money out means no single result decides your whole outcome.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (73, 19, 'A', 'Keeping everything in cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (74, 19, 'B', 'Putting all your money into the best-performing stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (75, 19, 'C', 'Spreading money across many investments to reduce the impact of one bad result', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (76, 19, 'D', 'Moving money between accounts often', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (20, 5, 2, 'One company in your portfolio falls 50%. It made up 10% of your money. Roughly how much does your total portfolio fall from this?', '50% of a 10% share = 5% of the total.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (77, 20, 'A', '0%', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (78, 20, 'B', '5%', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (79, 20, 'C', '10%', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (80, 20, 'D', '50%', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (21, 5, 3, 'Which portfolio is most diversified?', 'C spreads money across different types of instruments that react differently to events.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (81, 21, 'A', '100% in a locked-term instrument', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (82, 21, 'B', '10 companies, all in the same industry', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (83, 21, 'C', '100% in one volatile company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (84, 21, 'D', 'A mix of cash, a broad market basket and a locked-term instrument', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (22, 5, 4, 'The whole market falls 20%. What happens to a well-diversified portfolio?', 'Diversification reduces risk from single events, not from market-wide drops.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (85, 22, 'A', 'It always rises.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (86, 22, 'B', 'It probably falls too, but usually less than the most concentrated portfolios.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (87, 22, 'C', 'Nothing, diversification fully protects it.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (88, 22, 'D', 'It falls exactly 20%, always.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (23, 5, 5, 'What is "concentration risk"?', 'The more concentrated the portfolio, the more one event can hurt it.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (89, 23, 'A', 'The risk of inflation', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (90, 23, 'B', 'The risk of high fees', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (91, 23, 'C', 'The risk of having too many investments', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (92, 23, 'D', 'The risk of depending heavily on one investment or one area', TRUE);

-- Final quiz: Chapter 1
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (6, 1, NULL, 'FINAL', 'Chapter 1 — Final Quiz: Why Invest?', 7);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (24, 6, 1, 'Prices rise 4% a year, and your savings account pays 1%. What happens to your money over time?', 'Interest below inflation means each year the money buys a little less.', 1);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (93, 24, 'A', 'It''s fully protected from inflation.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (94, 24, 'B', 'It grows in real terms.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (95, 24, 'C', 'Its purchasing power slowly shrinks.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (96, 24, 'D', 'It stays exactly the same in value.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (25, 6, 2, 'Which effect makes money grow faster the longer it stays invested?', 'Returns earn their own returns, so growth speeds up with time.', 1);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (97, 25, 'A', 'Compounding', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (98, 25, 'B', 'Diversification', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (99, 25, 'C', 'Liquidity', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (100, 25, 'D', 'Volatility', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (26, 6, 3, 'Which of these is a clear financial goal?', 'A clear goal names what, how much and when.', 2);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (101, 26, 'A', '"I want to invest smarter."', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (102, 26, 'B', '"I want to have more money than my friends."', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (103, 26, 'C', '"I want to save something every now and then."', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (104, 26, 'D', '"I want 3,000 coins for a new laptop in 10 months."', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (27, 6, 4, 'Jan wants to save for retirement in 35 years, a car in 4 years and a holiday in 6 months. Which list gives their horizons in the same order as the goals above?', 'Over 10 years is long, 2–10 years is medium, under 2 years is short.', 2);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (105, 27, 'A', 'Long, short, short', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (106, 27, 'B', 'Long, medium, short', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (107, 27, 'C', 'Medium, medium, long', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (108, 27, 'D', 'Short, medium, long', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (28, 6, 5, 'What should usually be in place before you start investing for long-term goals?', 'An emergency fund prevents forced selling or penalties when surprises happen.', 2);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (109, 28, 'A', 'A single stock you believe in', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (110, 28, 'B', 'A leveraged product', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (111, 28, 'C', 'A 10-year locked-term instrument', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (112, 28, 'D', 'An emergency fund', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (29, 6, 6, 'Lena puts her whole emergency fund into a 3-year Locked-term instrument because it pays more than cash. What''s the main problem?', 'An emergency fund needs high liquidity; locking it defeats its purpose.', 3);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (113, 29, 'A', 'She may not be able to get the money when an emergency happens.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (114, 29, 'B', 'Locked-term instruments are very volatile.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (115, 29, 'C', 'The return is too high.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (116, 29, 'D', 'There is no problem.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (30, 6, 7, 'Which statement about volatility is correct?', 'Volatility is about swings in both directions, not a guaranteed loss.', 4);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (117, 30, 'A', 'Cash is the most volatile instrument.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (118, 30, 'B', 'A volatile investment always ends in a loss.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (119, 30, 'C', 'Volatility describes how much a price swings up and down.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (120, 30, 'D', 'Volatility only matters for long-term goals.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (31, 6, 8, 'Your investment of 2,000 coins falls to 1,000. How much must it now rise to get back to 2,000?', '1,000 has to double, which is a 100% gain.', 4);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (121, 31, 'A', '50%', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (122, 31, 'B', '75%', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (123, 31, 'C', '100%', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (124, 31, 'D', '200%', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (32, 6, 9, 'Kai feels relaxed about big price swings, but needs his money in 9 months for university fees. How much risk should his plan take?', 'Risk capacity (what you can afford) should guide the plan, not only risk tolerance.', 4);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (125, 32, 'A', 'Low risk, because his short horizon limits his risk capacity', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (126, 32, 'B', 'It doesn''t matter.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (127, 32, 'C', 'Only speculative assets', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (128, 32, 'D', 'High risk, because he''s relaxed about swings', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (33, 6, 10, 'Portfolio A is 100% in one company. Portfolio B is spread across a broad market basket, some bonds and some cash. The single company drops 70%. Which statement is true?', 'Diversification limits the damage from one bad event, though it can''t remove all risk.', 5);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (129, 33, 'A', 'Portfolio B can never lose money.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (130, 33, 'B', 'Both portfolios fall 70%.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (131, 33, 'C', 'Portfolio A is safer because it''s simpler.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (132, 33, 'D', 'Portfolio B falls much less, because no single company decides its outcome.', TRUE);

-- Control questions: 2.1 Cash and Savings Accounts
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (7, 2, 6, 'CONTROL', '2.1 Cash and Savings Accounts — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (34, 7, 1, 'What is the main strength of a savings account?', 'Low risk and high liquidity are what make cash useful.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (133, 34, 'A', 'High returns', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (134, 34, 'B', 'Ownership of a company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (135, 34, 'C', 'Safety and quick access to the money', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (136, 34, 'D', 'Protection against inflation', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (35, 7, 2, 'Your savings pay 1% interest and inflation is 3%. What happens to your purchasing power?', 'The real return is roughly interest minus inflation: 1% − 3% = −2%.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (137, 35, 'A', 'It shrinks by about 2% a year.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (138, 35, 'B', 'It grows by 1% a year.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (139, 35, 'C', 'It grows by 3% a year.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (140, 35, 'D', 'It stays the same.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (36, 7, 3, 'Which goal fits cash best?', 'An emergency fund needs safety and immediate access.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (141, 36, 'A', 'Retirement in 35 years', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (142, 36, 'B', 'Building wealth over 20 years', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (143, 36, 'C', 'A child''s studies in 18 years', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (144, 36, 'D', 'An emergency fund', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (37, 7, 4, 'Why is cash a weak choice for a 30-year goal?', 'Low growth plus inflation adds up to a large loss of purchasing power over decades.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (145, 37, 'A', 'It''s too risky.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (146, 37, 'B', 'Over long periods, inflation can eat much of its value.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (147, 37, 'C', 'It can''t be withdrawn.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (148, 37, 'D', 'It''s illegal to hold cash that long.', FALSE);

-- Control questions: 2.2 Deposits and Bonds
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (8, 2, 7, 'CONTROL', '2.2 Deposits and Bonds — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (38, 8, 1, 'What is a bond?', 'A bond holder is a lender, not an owner.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (149, 38, 'A', 'A share of ownership in a company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (150, 38, 'B', 'A savings account with no term', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (151, 38, 'C', 'A loan you give to a government or company in exchange for interest', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (152, 38, 'D', 'A type of fund', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (39, 8, 2, 'What usually happens if you withdraw from a term deposit early?', 'The early withdrawal penalty is the price of breaking the agreement.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (153, 39, 'A', 'You lose some or all of the interest.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (154, 39, 'B', 'The term gets longer.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (155, 39, 'C', 'Nothing changes.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (156, 39, 'D', 'You get a bonus.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (40, 8, 3, 'Why does a weaker company pay more interest on its bonds than a stable government?', 'Higher credit risk requires higher interest to attract lenders.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (157, 40, 'A', 'It doesn''t; they pay the same.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (158, 40, 'B', 'Because it''s more generous', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (159, 40, 'C', 'Because the law requires it', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (160, 40, 'D', 'To make up lenders for the higher risk of not being paid back', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (41, 8, 4, 'You need 5,000 coins in exactly 1 year. Which choice fits best?', 'The term matches the date the money is needed.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (161, 41, 'A', 'A 10-year bond', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (162, 41, 'B', 'A 1-year term deposit', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (163, 41, 'C', 'A volatile single stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (164, 41, 'D', 'A 5-year locked-term instrument', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (42, 8, 5, 'What is the main trade-off with locked-term instruments?', 'You give up liquidity to earn a better rate.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (165, 42, 'A', 'Ownership in exchange for dividends', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (166, 42, 'B', 'High risk for high return', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (167, 42, 'C', 'No interest at all', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (168, 42, 'D', 'A somewhat higher rate in exchange for less access to your money', TRUE);

-- Control questions: 2.3 Stocks
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (9, 2, 8, 'CONTROL', '2.3 Stocks — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (43, 9, 1, 'What do you own when you buy a stock?', 'Shareholders are part-owners. Bond holders are lenders.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (169, 43, 'A', 'A savings account at the company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (170, 43, 'B', 'A loan to the company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (171, 43, 'C', 'A small piece of ownership in the company', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (172, 43, 'D', 'A guarantee of fixed interest', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (44, 9, 2, 'What is a dividend?', 'Dividends share profits with owners, though not all companies pay them.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (173, 44, 'A', 'Part of a company''s profit paid to shareholders', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (174, 44, 'B', 'A fee for buying stocks', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (175, 44, 'C', 'A tax on investments', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (176, 44, 'D', 'A type of bond', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (45, 9, 3, 'Why is a single stock riskier than a market basket?', 'With one company, any bad news hits your whole investment.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (177, 45, 'A', 'It''s not; they''re the same.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (178, 45, 'B', 'Single stocks can''t be sold.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (179, 45, 'C', 'Single stocks have higher fees by law.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (180, 45, 'D', 'The outcome depends entirely on one company.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (46, 9, 4, 'A company you own announces a big product failure. What is the most likely short-term effect?', 'Bad news usually lowers expectations of future profits, and the price drops.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (181, 46, 'A', 'The share price is guaranteed to stay the same.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (182, 46, 'B', 'The share price falls.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (183, 46, 'C', 'The share price rises.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (184, 46, 'D', 'The company must return your money.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (47, 9, 5, 'For which goal are stocks the most suitable?', 'A long horizon gives time to recover from the volatility.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (185, 47, 'A', 'An emergency fund', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (186, 47, 'B', 'Rent due next month', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (187, 47, 'C', 'A holiday in 6 months', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (188, 47, 'D', 'Retirement in 30 years, as part of a diversified portfolio', TRUE);

-- Control questions: 2.4 Funds and ETFs
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (10, 2, 9, 'CONTROL', '2.4 Funds and ETFs — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (48, 10, 1, 'What does a fund do?', 'Pooling lets small investors own a slice of many assets.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (189, 48, 'A', 'Keeps your money in cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (190, 48, 'B', 'Lends your money to a single company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (191, 48, 'C', 'Pools money from many investors and spreads it across many investments', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (192, 48, 'D', 'Guarantees a fixed return', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (49, 10, 2, 'What does an index fund do?', 'Index funds follow an index instead of trying to beat it.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (193, 49, 'A', 'It copies a list of companies that represents a market.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (194, 49, 'B', 'It invests only in cash.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (195, 49, 'C', 'It invests in a single company.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (196, 49, 'D', 'A manager picks the best stocks.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (50, 10, 3, 'Why are index funds usually cheaper than actively managed funds?', 'Following a list costs much less than active research and trading.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (197, 50, 'A', 'They are smaller.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (198, 50, 'B', 'They are subsidized by the government.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (199, 50, 'C', 'They aren''t; they''re always more expensive.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (200, 50, 'D', 'They don''t need a team researching and picking investments.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (51, 10, 4, 'The whole market falls 15%. What happens to a broad index fund?', 'An index fund mirrors its market, in both directions.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (201, 51, 'A', 'It rises 15%.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (202, 51, 'B', 'It falls roughly in line with the market.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (203, 51, 'C', 'It''s protected and stays flat.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (204, 51, 'D', 'It closes.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (52, 10, 5, 'Which gives the most diversification for a small amount of money?', 'One purchase gives exposure to hundreds or thousands of companies.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (205, 52, 'A', 'Buying two stocks in the same industry', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (206, 52, 'B', 'Buying one stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (207, 52, 'C', 'A single bond from one company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (208, 52, 'D', 'Buying a broad global index fund', TRUE);

-- Control questions: 2.5 Costs and Fees
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (11, 2, 10, 'CONTROL', '2.5 Costs and Fees — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (53, 11, 1, 'Why do small yearly fees have a big effect over time?', 'A fee taken every year reduces the base that compounding works on.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (209, 53, 'A', 'They don''t; small fees never matter.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (210, 53, 'B', 'They''re charged once, at the start.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (211, 53, 'C', 'They''re charged every year on the whole balance and compound.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (212, 53, 'D', 'They only apply to large investors.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (54, 11, 2, 'Two identical index funds: Fund A charges 0.2% a year, Fund B charges 1.5%. Which is likely better over 30 years?', 'If they hold the same investments, the cheaper one keeps more of the same return.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (213, 54, 'A', 'Fund A', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (214, 54, 'B', 'Fund B', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (215, 54, 'C', 'They''ll end up the same.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (216, 54, 'D', 'It''s impossible to say.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (55, 11, 3, 'What is a management fee?', 'It''s usually shown as the fund''s expense ratio.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (217, 55, 'A', 'A penalty for selling early', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (218, 55, 'B', 'A tax on dividends', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (219, 55, 'C', 'A one-time fee for opening an account', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (220, 55, 'D', 'A yearly percentage charged for running a fund', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (56, 11, 4, 'Which habit increases costs the most?', 'Each trade can carry transaction fees and spreads.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (221, 56, 'A', 'Buying an index fund and holding it for years', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (222, 56, 'B', 'Buying and selling many times a month', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (223, 56, 'C', 'Investing a fixed amount every month in one fund', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (224, 56, 'D', 'Comparing fees before investing', FALSE);

-- Control questions: 2.6 High-Risk and Speculative Assets
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (12, 2, 11, 'CONTROL', '2.6 High-Risk and Speculative Assets — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (57, 12, 1, 'What is the main difference between investing and speculating?', 'Speculation is a bet on price, usually without underlying income.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (225, 57, 'A', 'There is none.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (226, 57, 'B', 'Investing is only for professionals.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (227, 57, 'C', 'Investing relies on value produced over time; speculating relies mostly on price going up.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (228, 57, 'D', 'Speculating is always illegal.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (58, 12, 2, 'What does leverage do?', 'Borrowed money makes every move bigger, in both directions.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (229, 58, 'A', 'It multiplies both gains and losses.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (230, 58, 'B', 'It removes fees.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (231, 58, 'C', 'It guarantees a profit.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (232, 58, 'D', 'It lowers your risk.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (59, 12, 3, 'A social media post says: "This coin will 10x next week, buy NOW!" Which is the best reaction?', 'Urgency, huge promises and anonymous tips are classic warning signs.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (233, 59, 'A', 'Buy immediately before you miss out.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (234, 59, 'B', 'Put your emergency fund into it.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (235, 59, 'C', 'Borrow money to buy more.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (236, 59, 'D', 'Treat it as a warning sign and don''t act on pressure.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (60, 12, 4, 'If you choose to speculate, which rule is the most important?', 'Speculation can go to zero, so it should never threaten important goals.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (237, 60, 'A', 'Use borrowed money to increase gains.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (238, 60, 'B', 'Only use a small amount you can afford to lose completely.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (239, 60, 'C', 'Put all your savings in to maximize the chance of winning.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (240, 60, 'D', 'Use your emergency fund.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (61, 12, 5, 'What is FOMO?', 'FOMO is an emotion, not a reason to invest.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (241, 61, 'A', 'A type of bond', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (242, 61, 'B', 'A tax rule', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (243, 61, 'C', 'A fund strategy', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (244, 61, 'D', 'The fear of missing out, which pushes people to buy because others are buying', TRUE);

-- Control questions: 2.7 Comparing Instruments
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (13, 2, 12, 'CONTROL', '2.7 Comparing Instruments — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (62, 13, 1, 'Which instrument has the highest liquidity?', 'Cash is available immediately, at no cost.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (245, 62, 'A', 'A 10-year bond', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (246, 62, 'B', 'A pension account locked until 65', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (247, 62, 'C', 'Cash in a savings account', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (248, 62, 'D', 'A 3-year term deposit', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (63, 13, 2, 'Which statement is true?', 'Each tool fits some jobs better than others.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (249, 63, 'A', 'The right instrument depends on the goal, horizon and risk capacity.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (250, 63, 'B', 'Cash is always the safest choice for every goal.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (251, 63, 'C', 'Index funds are always the best choice.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (252, 63, 'D', 'Higher return always means a better instrument.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (64, 13, 3, 'Match the goal to the instrument: an emergency fund, retirement in 30 years, a home deposit needed in exactly 2 years.', 'Each goal''s horizon and liquidity needs point to a different tool.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (253, 64, 'A', 'Index fund, cash, single stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (254, 64, 'B', 'Speculative asset, cash, index fund', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (255, 64, 'C', 'Single stock, term deposit, cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (256, 64, 'D', 'Cash, broad index fund, 2-year term deposit', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (65, 13, 4, 'What is an "allocation"?', 'An allocation is the mix of instruments in a plan.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (257, 65, 'A', 'A fee charged by a fund', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (258, 65, 'B', 'The way your money is split across different instruments', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (259, 65, 'C', 'A type of bond', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (260, 65, 'D', 'A government benefit', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (66, 13, 5, 'Which instrument fits a goal in 1 year the worst?', 'A big drop right before the deadline would leave no time to recover.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (261, 66, 'A', 'A 1-year term deposit', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (262, 66, 'B', 'Cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (263, 66, 'C', 'A short-term savings account', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (264, 66, 'D', 'A single volatile stock', TRUE);

-- Final quiz: Chapter 2
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (14, 2, NULL, 'FINAL', 'Chapter 2 — Final Quiz: Know Your Instruments', 7);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (67, 14, 1, 'What is the hidden risk of keeping long-term savings in cash?', 'Cash is stable and liquid, but over decades inflation eats its purchasing power.', 6);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (265, 67, 'A', 'Cash pays very high fees.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (266, 67, 'B', 'The money can''t be withdrawn.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (267, 67, 'C', 'Inflation can slowly reduce what the money can buy.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (268, 67, 'D', 'The balance swings up and down a lot.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (68, 14, 2, 'When you buy a bond, what are you doing?', 'Bond holders are lenders who receive interest and get the original amount back at maturity.', 7);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (269, 68, 'A', 'Lending money to a government or company in exchange for interest', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (270, 68, 'B', 'Buying a basket of stocks', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (271, 68, 'C', 'Opening a savings account', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (272, 68, 'D', 'Buying part of a company', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (69, 14, 3, 'Two bonds have the same term. Bond X pays 3% and is issued by a stable government. Bond Y pays 9% and is issued by a struggling company. Why does Bond Y pay more?', 'Higher credit risk has to be compensated with higher interest.', 7);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (273, 69, 'A', 'The company is more generous.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (274, 69, 'B', 'Bond Y has a shorter term.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (275, 69, 'C', 'Governments aren''t allowed to pay more than 3%.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (276, 69, 'D', 'There''s a higher risk the company won''t pay the money back.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (70, 14, 4, 'What are the two main ways a stock can make money for its owner?', 'Shareholders can gain when the price rises and when the company shares profits.', 8);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (277, 70, 'A', 'Coupons and deposits', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (278, 70, 'B', 'Price growth and dividends', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (279, 70, 'C', 'Fees and penalties', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (280, 70, 'D', 'Interest and maturity', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (71, 14, 5, 'Which is the easiest way for a beginner with a small amount of money to own hundreds of companies?', 'One fund purchase gives a slice of everything the fund holds.', 9);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (281, 71, 'A', 'Buy shares in one large company.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (282, 71, 'B', 'Keep the money in a savings account.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (283, 71, 'C', 'Buy a single bond.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (284, 71, 'D', 'Buy a broad index fund or ETF.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (72, 14, 6, 'What does an index fund try to do?', 'Index funds follow a list of companies instead of trying to beat it, which keeps costs low.', 9);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (285, 72, 'A', 'Match the return of a market by copying an index', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (286, 72, 'B', 'Guarantee a fixed interest rate', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (287, 72, 'C', 'Invest only in cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (288, 72, 'D', 'Beat the market by picking the best stocks', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (73, 14, 7, '10,000 coins are invested for 30 years at a fictional 6% a year. Fund A charges 0% in fees, Fund B charges 1%. Roughly how much less does Fund B end with?', 'Roughly 57,400 vs. 43,200 coins. A 1% yearly fee compounds against you for 30 years.', 10);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (289, 73, 'A', 'About 140 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (290, 73, 'B', 'About 1,400 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (291, 73, 'C', 'About 14,000 coins', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (292, 73, 'D', 'Exactly the same amount', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (74, 14, 8, 'Which of these is a typical warning sign of a hype-driven investment?', 'Guaranteed high returns and urgency are classic signs of speculation or a scheme.', 11);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (293, 74, 'A', 'A long track record and broad diversification', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (294, 74, 'B', 'A promise of guaranteed high returns and pressure to "buy now"', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (295, 74, 'C', 'Low, transparent fees', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (296, 74, 'D', 'A clear explanation of how the asset produces value', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (75, 14, 9, 'Why can leveraged products be especially dangerous?', 'Borrowed money makes every price move bigger, in both directions.', 11);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (297, 75, 'A', 'They multiply losses as well as gains, and you can lose more than you put in.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (298, 75, 'B', 'They have no risk.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (299, 75, 'C', 'They pay no returns.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (300, 75, 'D', 'They can only be held for one day.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (76, 14, 10, 'Match the goals to the best-fitting instruments: an emergency fund, a home deposit needed in exactly 3 years, retirement in 30 years.', 'Each goal''s horizon and liquidity needs point to a different tool. There is no single "best" instrument.', 12);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (301, 76, 'A', 'Broad index fund, cash, 3-year term deposit', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (302, 76, 'B', 'Speculative asset, cash, 3-year term deposit', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (303, 76, 'C', '3-year term deposit, single stock, cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (304, 76, 'D', 'Cash, 3-year term deposit, broad index fund', TRUE);

-- Control questions: 3.1 Your Life Stage Changes Your Plan
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (15, 3, 13, 'CONTROL', '3.1 Your Life Stage Changes Your Plan — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (77, 15, 1, 'Why do younger investors usually have a higher risk capacity for retirement savings?', 'Time and future income give room to recover.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (305, 77, 'A', 'They know more about investing.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (306, 77, 'B', 'Young people''s investments can''t lose value.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (307, 77, 'C', 'They have a long horizon and future income to recover from losses.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (308, 77, 'D', 'They pay no fees.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (78, 15, 2, 'What is "human capital"?', 'Your ability to earn income is an asset, often the biggest one when young.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (309, 78, 'A', 'The value of your future earning power', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (310, 78, 'B', 'A type of fund', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (311, 78, 'C', 'Money in a savings account', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (312, 78, 'D', 'The number of employees at a company', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (79, 15, 3, 'Two 35-year-olds: one has a stable job and no dependents, the other has unpredictable income and three children. Who likely has the higher risk capacity?', 'Age is only one factor; stability and responsibilities matter too.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (313, 79, 'A', 'Neither can invest.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (314, 79, 'B', 'The one with three children', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (315, 79, 'C', 'They''re the same, because they''re the same age.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (316, 79, 'D', 'The one with the stable job and no dependents', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (80, 15, 4, 'Why is a large loss more dangerous near retirement?', 'With a short horizon, savings need to be used soon, and there is no salary to rebuild them.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (317, 80, 'A', 'It isn''t more dangerous.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (318, 80, 'B', 'There''s less time and less future income to recover.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (319, 80, 'C', 'Markets fall more for older investors.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (320, 80, 'D', 'Fees are higher for older people.', FALSE);

-- Control questions: 3.2 Starting Out (18–30)
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (16, 3, 14, 'CONTROL', '3.2 Starting Out (18–30) — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (81, 16, 1, 'In the example, why does the person who starts at 25 end up with about twice as much?', 'They paid in only 12,000 coins more, but compounding had more time to work.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (321, 81, 'A', 'They paid lower taxes.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (322, 81, 'B', 'They had a better fund.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (323, 81, 'C', 'Their money had 10 more years to compound.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (324, 81, 'D', 'They paid in twice as much money.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (82, 16, 2, 'What should usually come before investing?', 'Expensive debt and the lack of a safety net undermine any investment plan.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (325, 82, 'A', 'Paying off expensive debt and building an emergency fund', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (326, 82, 'B', 'Buying a car', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (327, 82, 'C', 'Picking a hot stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (328, 82, 'D', 'Waiting until age 30', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (83, 16, 3, 'What does "pay yourself first" mean?', 'Saving first, then spending what''s left, makes saving consistent.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (329, 83, 'A', 'Paying yourself a salary from your investments', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (330, 83, 'B', 'Paying off friends'' debts first', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (331, 83, 'C', 'Spending on yourself before paying bills', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (332, 83, 'D', 'Setting money aside for savings and investments right after receiving income', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (84, 16, 4, 'A 23-year-old has a stable job, an emergency fund and a 40-year horizon for retirement. Which allocation fits best?', 'A long horizon allows growth, and diversification controls the risk.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (333, 84, 'A', '100% cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (334, 84, 'B', 'Mostly a broad market basket, with a smaller steady part', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (335, 84, 'C', 'Nothing, they''re too young.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (336, 84, 'D', '100% in one trending stock', FALSE);

-- Control questions: 3.3 Building Up (30–50)
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (17, 3, 15, 'CONTROL', '3.3 Building Up (30–50) — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (85, 17, 1, 'Why should different goals have different allocations?', 'Money needed in 3 years and money needed in 27 years face different risks.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (337, 85, 'A', 'To make the plan look complicated', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (338, 85, 'B', 'Because the law requires it', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (339, 85, 'C', 'Because each goal has its own horizon and risk capacity', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (340, 85, 'D', 'They shouldn''t; one allocation fits everything.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (86, 17, 2, 'Sam needs money for a renovation in 3 years. Which allocation fits best?', 'A short-to-medium horizon needs stability and access on time.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (341, 86, 'A', 'Mostly deposits and bonds, with little or no stocks', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (342, 86, 'B', '100% in one volatile stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (343, 86, 'C', '100% in a 10-year locked instrument', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (344, 86, 'D', 'Speculative assets', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (87, 17, 3, 'What is "lifestyle inflation"?', 'If spending grows as fast as income, there''s nothing extra to invest.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (345, 87, 'A', 'The cost of insurance', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (346, 87, 'B', 'A type of investment fund', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (347, 87, 'C', 'Rising prices in shops', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (348, 87, 'D', 'Spending more every time income rises, so savings don''t grow', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (88, 17, 4, 'Money is tight because of a new child. What''s usually better for retirement savings?', 'Keeping even a small amount invested preserves compounding time and the habit.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (349, 88, 'A', 'Stop all contributions for 10 years.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (350, 88, 'B', 'Lower contributions for a while, but keep them going.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (351, 88, 'C', 'Move everything into a speculative asset to catch up.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (352, 88, 'D', 'Sell all investments.', FALSE);

-- Control questions: 3.4 Approaching Retirement (50+)
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (18, 3, 16, 'CONTROL', '3.4 Approaching Retirement (50+) — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (89, 18, 1, 'What is a glide path?', 'It lowers risk step by step over many years.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (353, 89, 'A', 'A fee schedule', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (354, 89, 'B', 'A sudden switch from stocks to cash at retirement', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (355, 89, 'C', 'A gradual shift from growth-oriented to steadier investments as a target date approaches', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (356, 89, 'D', 'A type of pension', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (90, 18, 2, 'A 30% crash hits at age 30 and again at age 64. When does it usually hurt the plan more?', 'At 64 the savings are larger, withdrawals are near, and there''s little time to recover.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (357, 90, 'A', 'At 64', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (358, 90, 'B', 'At 30', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (359, 90, 'C', 'It never matters.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (360, 90, 'D', 'Equally at both ages', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (91, 18, 3, 'Why does part of the money stay invested in the market basket even at 65?', 'A retirement of 20–30 years is still a long horizon for part of the money.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (361, 91, 'A', 'By mistake', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (362, 91, 'B', 'It can''t be moved.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (363, 91, 'C', 'Bonds are not allowed after 65.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (364, 91, 'D', 'Retirement can last decades, and the money still needs to grow and beat inflation.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (92, 18, 4, 'How does a cash buffer of 1–3 years of spending help in retirement?', 'Spending comes from the buffer while investments recover.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (365, 92, 'A', 'It replaces a pension.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (366, 92, 'B', 'It lets you avoid selling investments during a market drop.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (367, 92, 'C', 'It earns the highest return.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (368, 92, 'D', 'It removes all risk.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (93, 18, 5, 'What is sequence risk?', 'The timing of losses, not only their size, shapes the outcome.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (369, 93, 'A', 'The risk of paying fees in sequence', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (370, 93, 'B', 'The risk of choosing funds in the wrong order', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (371, 93, 'C', 'The risk of inflation over many years', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (372, 93, 'D', 'The risk that poor returns happen right before or early in retirement', TRUE);

-- Control questions: 3.5 Why Invest for a Pension
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (19, 3, 17, 'CONTROL', '3.5 Why Invest for a Pension — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (94, 19, 1, 'What is the "retirement gap"?', 'It''s the shortfall your own savings must cover.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (373, 94, 'A', 'The fee for a pension account', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (374, 94, 'B', 'The time between leaving school and starting work', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (375, 94, 'C', 'The difference between the income you''ll need in retirement and the income you''ll receive', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (376, 94, 'D', 'The age difference between retirees', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (95, 19, 2, 'Why might public pensions provide less in the future?', 'Demographic change puts pressure on public pension systems.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (377, 95, 'A', 'Because people live longer and there are fewer workers per retiree', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (378, 95, 'B', 'Because pensions are being abolished everywhere', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (379, 95, 'C', 'They will always provide more.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (380, 95, 'D', 'Because inflation is gone', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (96, 19, 3, 'You''ll need 2,500 coins a month and expect a 1,500 coin pension. What is the monthly gap?', '2,500 − 1,500 = 1,000.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (381, 96, 'A', '500 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (382, 96, 'B', '1,000 coins', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (383, 96, 'C', '1,500 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (384, 96, 'D', '4,000 coins', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (97, 19, 4, 'Why is investing usually better than cash savings for closing a retirement gap?', 'Long horizons are exactly where investment growth helps most.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (385, 97, 'A', 'Investing has no risk.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (386, 97, 'B', 'Over decades, compounding can do much of the work and help beat inflation.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (387, 97, 'C', 'Cash is not allowed for retirement.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (388, 97, 'D', 'Investing has no fees.', FALSE);

-- Control questions: 3.6 Pension Vehicles
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (20, 3, 18, 'CONTROL', '3.6 Pension Vehicles — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (98, 20, 1, 'What are the three pillars of a typical pension system?', 'Retirement income usually combines these three sources.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (389, 98, 'A', 'Savings, spending and debt', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (390, 98, 'B', 'Cash, stocks and bonds', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (391, 98, 'C', 'Public pension, employer schemes and personal retirement accounts', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (392, 98, 'D', 'Young, middle-aged and retired', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (99, 20, 2, 'Your employer offers to add money to your workplace pension if you contribute too. What does skipping it usually mean?', 'Employer contributions are effectively extra pay you only get by taking part.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (393, 99, 'A', 'Leaving part of your pay unused', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (394, 99, 'B', 'Avoiding all risk', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (395, 99, 'C', 'Nothing important', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (396, 99, 'D', 'Getting a higher salary instead', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (100, 20, 3, 'What is a common trade-off of tax-advantaged pension accounts?', 'Tax benefits are given in return for keeping the money invested for retirement.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (397, 100, 'A', 'They can only hold cash.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (398, 100, 'B', 'They have no fees.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (399, 100, 'C', 'They''re only available to the rich.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (400, 100, 'D', 'The money is usually locked until a certain age, with penalties for early withdrawal.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (101, 20, 4, 'Why should your emergency fund not be kept inside a pension account?', 'An emergency fund needs high liquidity, and pension accounts have low liquidity.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (401, 101, 'A', 'Emergency funds should be invested in stocks.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (402, 101, 'B', 'The money may not be accessible without penalties when an emergency happens.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (403, 101, 'C', 'Pension accounts are too safe.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (404, 101, 'D', 'Pension accounts don''t allow cash.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (102, 20, 5, 'Which is a possible tax advantage of a pension account?', 'Tax-free or tax-deferred growth is a common benefit.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (405, 102, 'A', 'No need to ever withdraw', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (406, 102, 'B', 'Free insurance', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (407, 102, 'C', 'Guaranteed returns', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (408, 102, 'D', 'Gains growing without being taxed while the money stays in the account', TRUE);

-- Control questions: 3.7 Staying on Course
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (21, 3, 19, 'CONTROL', '3.7 Staying on Course — Control questions', NULL);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (103, 21, 1, 'What is portfolio drift?', 'Different returns slowly change the mix.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (409, 103, 'A', 'Moving money between banks', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (410, 103, 'B', 'Selling everything in a crash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (411, 103, 'C', 'The allocation changing away from its target because some investments grow faster than others', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (412, 103, 'D', 'A type of fee', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (104, 21, 2, 'Target 60/40, current value 10,000 coins, currently 75% basket / 25% bonds. How much should move from the basket to bonds?', 'The basket is 7,500 and the target is 6,000, so 1,500 coins move to bonds.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (413, 104, 'A', '500 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (414, 104, 'B', '1,000 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (415, 104, 'C', '1,500 coins', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (416, 104, 'D', '2,500 coins', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (105, 21, 3, 'What is a cheap way to rebalance without selling?', 'New money fixes the mix without transaction costs from selling.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (417, 105, 'A', 'Buy a speculative asset.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (418, 105, 'B', 'Open a new account.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (419, 105, 'C', 'Stop investing.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (420, 105, 'D', 'Direct new contributions to the part that''s below target.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (106, 21, 4, 'The market drops 25% and your horizon is 20 years. What does panic selling do?', 'Selling turns a temporary drop into a permanent loss.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (421, 106, 'A', 'Lowers your fees', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (422, 106, 'B', 'Locks in the loss and may make you miss the recovery', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (423, 106, 'C', 'Protects your gains', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (424, 106, 'D', 'Rebalances your portfolio', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (107, 21, 5, 'Which event is a good reason to review your plan?', 'Life changes affect goals, horizon and risk capacity.', NULL);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (425, 107, 'A', 'One bad day in the market', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (426, 107, 'B', 'A celebrity tweet about a stock', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (427, 107, 'C', 'A friend''s new car', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (428, 107, 'D', 'The birth of a child', TRUE);

-- Final quiz: Chapter 3
INSERT INTO quiz (id, chapter_id, subchapter_id, quiz_type, title, pass_mark) VALUES (22, 3, NULL, 'FINAL', 'Chapter 3 — Final Quiz: Investing Through Life', 7);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (108, 22, 1, 'Besides age, which factor matters most for how much risk someone can afford?', 'Age is a starting point, but stability and responsibilities shape risk capacity too.', 13);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (429, 108, 'A', 'Their favorite type of company', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (430, 108, 'B', 'Which bank they use', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (431, 108, 'C', 'Job stability and whether others depend on their income', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (432, 108, 'D', 'What their friends invest in', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (109, 22, 2, 'Why is "human capital" an advantage for young investors?', 'Future earning power gives young people room to recover from setbacks.', 13);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (433, 109, 'A', 'Decades of future income can help absorb losses and rebuild savings.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (434, 109, 'B', 'It removes the need for an emergency fund.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (435, 109, 'C', 'It lowers investment fees.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (436, 109, 'D', 'It guarantees investment returns.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (110, 22, 3, 'Ana starts investing 100 coins a month at 25, and Ben starts the same amount at 35. Both stop at 65. Why does Ana likely end with much more?', 'Starting early gives compounding more time, which matters more than the extra amount paid in.', 14);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (437, 110, 'A', 'Ben''s contributions were taxed more.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (438, 110, 'B', 'She paid lower fees.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (439, 110, 'C', 'She chose riskier investments.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (440, 110, 'D', 'Her money had 10 more years to compound.', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (111, 22, 4, 'A 24-year-old has high-interest credit card debt and no savings. What is usually the best first step?', 'Expensive debt often costs more than investments earn, and a safety net protects the plan.', 14);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (441, 111, 'A', 'Open a 10-year locked-term instrument.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (442, 111, 'B', 'Pay off the expensive debt and start an emergency fund.', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (443, 111, 'C', 'Invest everything in a stock index fund.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (444, 111, 'D', 'Buy a speculative asset to earn money quickly.', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (112, 22, 5, 'Sam, 40, has an emergency fund, a renovation in 2 years and retirement in 25 years. What''s the best way to organize this?', 'Each goal has its own horizon, so each deserves its own level of risk.', 15);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (445, 112, 'A', 'Everything in cash until retirement', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (446, 112, 'B', 'One aggressive allocation for all goals', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (447, 112, 'C', 'Pause retirement saving until the renovation is done, then invest everything in stocks', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (448, 112, 'D', 'A separate allocation per goal: cash, a steady mix for the renovation, growth for retirement', TRUE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (113, 22, 6, 'What is a glide path?', 'A glide path lowers risk step by step, rather than all at once.', 16);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (449, 113, 'A', 'A plan that gradually reduces risk as the target date approaches', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (450, 113, 'B', 'Increasing risk to catch up before retirement', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (451, 113, 'C', 'A type of pension account', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (452, 113, 'D', 'Switching everything to cash on the day you retire', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (114, 22, 7, 'A 30% market crash happens right before Eva retires and starts withdrawing money. What is this risk called?', 'Losses right before or early in retirement hurt most, because withdrawals lock them in.', 16);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (453, 114, 'A', 'Liquidity risk', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (454, 114, 'B', 'Credit risk', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (455, 114, 'C', 'Sequence risk', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (456, 114, 'D', 'Concentration risk', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (115, 22, 8, 'Leo expects to need 2,800 coins a month in retirement and to receive a 1,600 coin public pension. What is his monthly retirement gap?', '2,800 − 1,600 = 1,200 coins a month to cover from his own savings.', 17);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (457, 115, 'A', '600 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (458, 115, 'B', '1,200 coins', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (459, 115, 'C', '1,600 coins', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (460, 115, 'D', '4,400 coins', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (116, 22, 9, 'What is the usual trade-off of a tax-advantaged personal pension account?', 'Tax advantages usually come with lock-up rules and penalties for early withdrawal.', 18);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (461, 116, 'A', 'Tax benefits in exchange for keeping the money locked until a certain age', TRUE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (462, 116, 'B', 'There is no trade-off.', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (463, 116, 'C', 'Higher fees in exchange for guaranteed returns', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (464, 116, 'D', 'Free insurance in exchange for no investment choice', FALSE);
INSERT INTO question (id, quiz_id, sort_order, prompt, explanation, source_subchapter_id) VALUES (117, 22, 10, 'Your target is 70% market basket / 30% bonds. After a strong year you hold 80% / 20%. What does rebalancing mean here?', 'Rebalancing restores your intended level of risk after the market makes the portfolio drift.', 19);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (465, 117, 'A', 'Selling everything and holding cash', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (466, 117, 'B', 'Doing nothing, since the portfolio grew', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (467, 117, 'C', 'Buying more of the basket because it''s doing well', FALSE);
INSERT INTO answer_option (id, question_id, label, text, is_correct) VALUES (468, 117, 'D', 'Moving money from the basket to bonds (or directing new money to bonds) to return to 70/30', TRUE);

-- Let rows inserted by the application continue after the seeded ids
ALTER TABLE chapter ALTER COLUMN id RESTART WITH 4;
ALTER TABLE subchapter ALTER COLUMN id RESTART WITH 20;
ALTER TABLE quiz ALTER COLUMN id RESTART WITH 23;
ALTER TABLE question ALTER COLUMN id RESTART WITH 118;
ALTER TABLE answer_option ALTER COLUMN id RESTART WITH 469;

-- END GENERATED CONTENT
