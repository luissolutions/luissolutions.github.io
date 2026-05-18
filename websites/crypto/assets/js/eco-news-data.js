// eco-news-data.js — Eco Lou site news posts
// Categories: "market" | "investing" | "economy"

const ECO_NEWS = [
    {
        id: "dividend-kings-2026",
        title: "2026 Dividend Kings: 50+ Years of Consecutive Increases",
        category: "investing",
        date: "2026-05-15",
        summary: "A look at standout Dividend Kings heading into mid-2026 — companies that have raised dividends for 50+ consecutive years.",
        tags: ["dividend", "kings", "income"],
        content: `
<p>Dividend Kings are companies that have increased their dividend every year for at least 50 consecutive years. As of mid-2026, the list includes roughly 50 names — all of them tested through recessions, inflation spikes, and rate cycles.</p>

<h4>Notable Names Worth Screening</h4>
<p><strong>Coca-Cola (KO)</strong> — 60+ years of increases, 3.1% yield. Defensive, global distribution, pricing power.<br>
<strong>Procter &amp; Gamble (PG)</strong> — 68 years. Consumer staples anchor. Low beta, consistent buybacks.<br>
<strong>Johnson &amp; Johnson (JNJ)</strong> — 60+ years. Healthcare diversification across pharma and medtech.<br>
<strong>Colgate-Palmolive (CL)</strong> — 60 years. High margins, global brand moat.<br>
<strong>3M (MMM)</strong> — Under restructuring pressure but still raising. Watch payout ratio carefully.</p>

<h4>How to Screen Them</h4>
<p>Use a screener filtering for: consecutive dividend growth &ge; 50 years, payout ratio &lt; 65%, free cash flow coverage &gt; 1.2x, debt-to-equity &lt; 1.5. These four filters eliminate the Kings most at risk of a cut.</p>

<h4>What to Avoid</h4>
<p>A high yield on a King is a warning sign, not a bonus. If a King is yielding 6%+, the market is pricing in risk. Check the most recent earnings call for free cash flow commentary before buying.</p>
        `
    },
    {
        id: "drip-compounding-2026",
        title: "DRIP at $500/mo: A 20-Year Projection",
        category: "investing",
        date: "2026-05-12",
        summary: "Running the numbers on consistent $500/month DRIP investing across a diversified dividend portfolio over 20 years.",
        tags: ["drip", "compounding", "projection"],
        content: `
<p>DRIP — Dividend Reinvestment Plan — means every dividend payment automatically buys more shares instead of sitting in cash. At scale, this creates a compounding loop: more shares produce more dividends, which buy more shares.</p>

<h4>The Base Case: $500/mo, 4% yield, 8% total return</h4>
<p>Starting with $0, adding $500/month, assuming a 4% dividend yield with dividends reinvested and 4% price appreciation (8% total return):</p>
<p><strong>Year 5:</strong> ~$37,000 portfolio, ~$1,480/yr in dividends<br>
<strong>Year 10:</strong> ~$92,000 portfolio, ~$3,680/yr in dividends<br>
<strong>Year 15:</strong> ~$175,000 portfolio, ~$7,000/yr in dividends<br>
<strong>Year 20:</strong> ~$300,000 portfolio, ~$12,000/yr in dividends (~$1,000/mo passive)</p>

<h4>Enabling DRIP on M1 Finance</h4>
<p>In M1 Finance, navigate to your pie, select a holding, and enable "Auto-Invest" with dividends set to reinvest. Alternatively, use the platform's Smart Transfer feature to funnel dividends back into your target allocation automatically.</p>

<h4>When to Turn DRIP Off</h4>
<p>If you reach retirement or need income, disable DRIP and let dividends pay to cash. The transition point is when your monthly dividend income approaches your monthly expense target — typically at or above a 4% safe withdrawal rate on your total portfolio.</p>
        `
    },
    {
        id: "fed-rates-2026",
        title: "Fed Rate Outlook: What Mid-2026 Means for Dividend Investors",
        category: "economy",
        date: "2026-05-10",
        summary: "With rates stabilizing, the environment for dividend growth stocks is shifting. Here's how to position.",
        tags: ["fed", "rates", "macro"],
        content: `
<p>After the rate hiking cycle of 2022-2023 and the hold period through 2024-2025, mid-2026 sees the Fed in a cautious easing posture. The federal funds rate has moderated from its peak, and the yield curve is normalizing.</p>

<h4>What This Means for Dividend Stocks</h4>
<p>Lower rates reduce the appeal of money market funds and CDs, pushing income-seeking capital back into dividend equities. Consumer staples, utilities, and healthcare — all dividend-heavy sectors — typically benefit in this environment.</p>

<h4>Risk: Duration Sensitivity</h4>
<p>High-yield dividend stocks with bond-like characteristics (REITs, utilities) carry duration risk. If the market prices in fewer cuts than expected, these names can sell off even as fundamentals hold. Stick to dividend growers over pure yield plays.</p>

<h4>Positioning</h4>
<p>Favor: Consumer Staples (KO, PG, CL), Tech Dividend Growers (MSFT, AAPL, TXN), Healthcare (JNJ, ABT). These names grow dividends through cycles rather than just paying high static yields.</p>
        `
    },
    {
        id: "roth-ira-limits-2026",
        title: "2026 Roth IRA Contribution Limits and Phase-Outs",
        category: "investing",
        date: "2026-05-01",
        summary: "Updated limits for Roth IRA contributions in 2026 — what changed, who qualifies, and the backdoor option.",
        tags: ["roth", "ira", "tax"],
        content: `
<p>For 2026, the Roth IRA contribution limit is <strong>$7,000</strong> ($8,000 if you're 50 or older — the $1,000 catch-up remains). This is unchanged from 2025.</p>

<h4>Income Phase-Out Ranges</h4>
<p>Single filers: phase-out begins at $146,000, eliminated at $161,000.<br>
Married filing jointly: phase-out begins at $230,000, eliminated at $240,000.</p>

<h4>Over the Limit? Use the Backdoor</h4>
<p>If your income exceeds the limit, contribute to a traditional IRA (non-deductible) then immediately convert to Roth. This "backdoor Roth" is legal, IRS-acknowledged, and the standard workaround for high earners. Watch for the pro-rata rule if you have other pre-tax IRA balances.</p>

<h4>Timing</h4>
<p>You can contribute for 2026 any time between January 1, 2026 and April 15, 2027 (tax deadline). Front-loading in January maximizes your tax-free growth window.</p>
        `
    },
    {
        id: "consumer-staples-sector",
        title: "Consumer Staples in 2026: Still the Defensive Anchor",
        category: "market",
        date: "2026-04-28",
        summary: "Consumer Staples continue to outperform during volatility. Here's why they stay core to the Eco Lou Market framework.",
        tags: ["staples", "defensive", "sector"],
        content: `
<p>Consumer Staples — food, household products, personal care — are the first category in the Eco Lou Market framework for a reason: they generate consistent cash flow regardless of economic conditions. People buy toothpaste and breakfast cereal in recessions.</p>

<h4>Key ETFs for Exposure</h4>
<p><strong>XLP</strong> — Consumer Staples Select Sector SPDR. Top 40 S&amp;P 500 staples names. Low-cost, liquid.<br>
<strong>VDC</strong> — Vanguard Consumer Staples. Slightly broader, similar holdings. Lower expense ratio than XLP.<br>
<strong>FSTA</strong> — Fidelity MSCI Consumer Staples. Near-zero expense ratio, solid for long-term holders.</p>

<h4>What to Watch</h4>
<p>Input costs (commodity prices, packaging, labor) compress margins during inflationary periods. Pricing power — the ability to pass costs to consumers — separates the durable names (KO, PG) from the weaker ones. Check gross margin trends over 3-5 years, not just the most recent quarter.</p>
        `
    },
    {
        id: "m1-finance-setup",
        title: "M1 Finance Setup Guide: Building Your First Dividend Pie",
        category: "investing",
        date: "2026-04-20",
        summary: "Step-by-step walkthrough for setting up an M1 Finance pie aligned with the Eco Lou Market framework.",
        tags: ["m1", "setup", "portfolio"],
        content: `
<p>M1 Finance uses a "pie" system — you define allocations by percentage and M1 automatically buys and rebalances. It's ideal for the Eco Lou framework because it enforces discipline without requiring manual rebalancing.</p>

<h4>Suggested Pie Structure (Eco Lou Market)</h4>
<p><strong>Consumer Staples (40%):</strong> XLP or VDC<br>
<strong>Tech Dividend Growers (35%):</strong> MSFT, AAPL, TXN, QCOM<br>
<strong>High Dividend Income (25%):</strong> SCHD or individual Dividend Kings</p>

<h4>Step-by-Step Setup</h4>
<p>1. Create account at m1.com — no fees for standard accounts.<br>
2. Click "New Portfolio" → "Expert Pie" → add your tickers with the percentages above.<br>
3. Set "Auto-Invest" to weekly or per deposit.<br>
4. Enable dividend reinvestment in account settings.<br>
5. Set a recurring transfer from your bank (even $50/week compounds significantly over time).</p>

<h4>What M1 Does Not Do</h4>
<p>M1 does not allow limit orders — all trades execute at a fixed daily window. This is a feature, not a bug: it removes the temptation to time the market. If you need intraday control, use a traditional brokerage for that portion of your portfolio.</p>
        `
    }
];
