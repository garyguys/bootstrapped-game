# BOOTSTRAPPED — Game Design Document

**Version:** 2.0  
**Repo:** https://github.com/garyguys/bootstrapped-game  
**Stack:** Vanilla HTML/CSS/JavaScript — single file or modular, browser-based, mobile-first (iPhone Safari)  
**Aesthetic:** Dark terminal / hacker — monospace fonts, green-on-black, neon accents, scanline overlay

-----

## Concept

You are a solo founder with $500, a laptop, and a dream. Build your tech startup from a bedroom freelancer into a market-leading company. Hire talent, win clients, manage your energy, beat competitors, and don’t go broke.

This is a **turn-based day simulation** with real strategic depth. Every day you have a limited number of actions. How you spend them determines whether you thrive or flame out.

-----

## Project Structure

```
bootstrapped-game/
├── index.html          # Main entry point
├── css/
│   └── style.css       # All styles
├── js/
│   ├── main.js         # Game init, screen management
│   ├── state.js        # Game state object + save/load
│   ├── engine.js       # Core game loop, day/night cycle
│   ├── actions.js      # All player actions (AP system)
│   ├── projects.js     # Project generation + delivery
│   ├── team.js         # Hiring, interviews, payroll
│   ├── events.js       # Random events (day + overnight)
│   ├── market.js       # Competitors + market share
│   ├── debt.js         # Debt tiers + consequences
│   ├── shop.js         # Office upgrades store
│   └── ui.js           # All DOM updates + rendering
├── data/
│   ├── projects.json   # Project templates
│   ├── events.json     # Random event pool
│   ├── candidates.json # Candidate name/trait pool
│   └── upgrades.json   # Shop items
└── DESIGN.md           # This file
```

-----

## Core Systems

-----

### 1. TIME — Day/Night Cycle

Time progresses **day by day**. The player takes actions during the day, then manually ends the day to sleep and advance.

**Day Structure:**

- Morning: Player wakes up, AP refreshed, overnight events resolved
- Day: Player takes actions (see AP system)
- Night: Player chooses to sleep (ends day) or push through

**Visual Day/Night System:**

- Background color temperature shifts throughout the day as actions are taken
- `NIGHT` → deep black (`#080c08`)
- `DAWN` → cold blue-grey tint
- `MORNING` → neutral terminal green
- `AFTERNOON` → slightly warmer green
- `DUSK` → amber tint overlay
- `NIGHT` → back to black
- The clock in the header shows: `MON 09:00` and advances ~90min per action taken
- When the player clicks “Sleep & End Day,” a full-screen scanline wipe transition plays, the clock fast-forwards to the next morning, and overnight event notifications appear

**Day Counter:** Displayed as `DAY 1` in the header. Track day of week (Mon–Sun) for flavor.

-----

### 2. ACTION POINTS (AP)

Each day the player has **4 AP** by default. Every meaningful action costs 1 AP.

**AP-costing actions include:**

- Work on a project (founder only, small projects)
- Post a job listing
- Interview a candidate (1 AP = reveal 1 skill; 2 AP total = reveal all 3 skills)
- Hire an employee (after interview)
- Negotiate salary/benefits with a candidate
- Accept a pipeline project
- Make a client call (nurture a lead, prevents it expiring)
- Browse the shop / purchase an upgrade
- Order food (Uber Eats, restores energy)
- Push through the night (see Energy system)

**AP Modifiers:**

- Low energy: AP cap reduced (see Energy system)
- Office upgrade — Standing Desk: +1 AP cap (5 total)
- Debt level 3+: random chance of losing 1 AP per day (distraction/stress)

-----

### 3. ENERGY SYSTEM

The founder has an **Energy meter** (0–100). It resets each morning based on how well they slept.

**Energy drain:**

- Each action taken costs ~8–12 energy (varies by action type)
- Working a project costs more energy than admin tasks

**Energy restore:**

- Sleep (end day normally): restores to 100%
- Push through the night: restores to only 40% next morning, and AP cap is 3 instead of 4
- Food items restore energy mid-day (see Shop)

**Energy effects:**

- 80–100%: Normal. No effect.
- 50–79%: Slight warning indicator. No mechanical effect.
- 25–49%: Actions take longer. UI shows fatigue flavor text.
- 0–24%: **Exhausted.** Each action has 20% chance of a mistake event (bug in code, missed email, wrong invoice sent).

**Night Push option:**

- Before sleeping, player can choose “Push Through the Night”
- Grants 1 bonus action immediately
- Next day: AP cap = 3, energy starts at 40%
- Flavor: clock shows `03:47`, background goes very dark, red-tinged

-----

### 4. FOUNDER CAPABILITIES

The founder can work on projects solo, but only **small/low-complexity ones.**

|Project Complexity         |Founder Solo?                |
|---------------------------|-----------------------------|
|1x (Landing page, UX audit)|✅ Yes                        |
|1.5x (Brand identity)      |✅ Yes                        |
|2x+                        |❌ Requires hired dev/designer|

Working on a project as founder costs 1 AP and advances it by ~25% per action. So a complexity-1 project takes ~4 founder actions to complete.

This gives the player something to do on day 1 without hiring anyone.

-----

### 5. HIRING SYSTEM

**Step 1 — Post a Job (1 AP)**
A job listing goes live. Next day, 2–4 candidates appear in your pipeline.

**Step 2 — Interview (1–2 AP)**

- Spend 1 AP: See candidate’s name, role, level, and salary ask. One skill revealed.
- Spend 2 AP total: All three skills revealed. Full picture.
- Skip interview: Hire blind. Risk of hidden weak skills or low reliability.

**Candidate Skills (rated 1–5 each):**

- **Technical** — speed and quality of project work
- **Communication** — client satisfaction score boost
- **Reliability** — chance of showing up, meeting deadlines, not quitting suddenly

**Step 3 — Negotiate (optional, 1 AP)**

- Propose a lower salary: candidate may accept, counter, or walk
- Offer a benefit instead (equity, remote flexibility, extra PTO): reduces salary ask
- Benefits have real game effects (equity reduces your exit value, flexibility boosts loyalty)

**Step 4 — Hire (1 AP)**

- Candidate joins the team
- First paycheck due at end of week 2 (biweekly payroll)

**Loyalty System:**
Each employee has a hidden loyalty score (0–100). Loyalty decays if:

- Payroll is late
- Morale is low
- Competitor poach events occur
- They’re underutilized (no projects assigned)

At loyalty < 20, they quit with 1-day notice.

-----

### 6. PAYROLL

Employees are paid **every 2 weeks (every 14 days).**

- Payroll due dates are shown in a persistent footer notice
- If cash is short on payroll day, you can go into debt (see Debt system)
- Missing payroll tanks morale by 25 points and loyalty by 30 for all employees
- Repeated missed payroll causes mass walkouts

-----

### 7. PROJECTS

**Pipeline:**

- 2–5 leads appear in your pipeline at any time
- Leads expire after 3 days if not accepted (competitor steals them)
- Making a “client call” (1 AP) extends a lead by 2 days
- Pipeline volume scales with reputation

**Project Types:**

|Project          |Payout      |Complexity|Duration  |Rep Gain|
|-----------------|------------|----------|----------|--------|
|Landing Page     |$600–900    |1x        |3–4 days  |+3      |
|UX Audit         |$800–1200   |1x        |2–3 days  |+4      |
|Brand Identity   |$1200–1800  |1.5x      |4–5 days  |+5      |
|API Integration  |$1500–2200  |2x        |5–6 days  |+6      |
|E-comm Store     |$2000–3000  |2x        |6–8 days  |+8      |
|Web App MVP      |$3500–5000  |3x        |8–12 days |+12     |
|Mobile App       |$5000–8000  |4x        |12–18 days|+16     |
|SaaS Platform    |$8000–12000 |5x        |18–28 days|+22     |
|Enterprise Portal|$15000–25000|8x        |30–45 days|+40     |

**Project Progress:**

- Each day a project is active, assigned team members advance it automatically
- Employee skill (Technical rating) affects daily progress speed
- Founder working on a project (1 AP) adds a manual progress boost

**Delivery:**

- When progress hits 100%, project auto-delivers at start of next day
- Cash + rep awarded
- Client satisfaction score (affected by Communication skill) determines bonus rep

-----

### 8. RANDOM EVENTS

Events fire between actions or overnight. Max 1 per day.

**Day events** (appear between actions, require player choice):

- 🐛 Critical Bug — fix it (cost cash) or ignore (lose rep)
- 🏃 Staff Poached — counter-offer or let them go
- 📞 Client Call — upsell opportunity or complaint
- 💡 Feature Request — scope creep warning, accept or decline
- 🤝 Partnership Offer — referral partner wants a cut for leads

**Overnight events** (surface as notifications when player wakes up):

- 📰 Press Coverage — rep spike
- ⭐ Client Review — rep gain or loss
- 📉 Market Slowdown — pipeline reduces for 3 days
- 🌙 Late Night Idea — optional: spend 1 AP on it tomorrow for a bonus project
- 💻 Server Outage — client angry, must spend AP to resolve
- 🏆 Award Nomination — accept for rep boost, costs 1 AP tomorrow

-----

### 9. DEBT SYSTEM

The player can take on debt via a “Line of Credit” option available from day 3 onward.

**Debt Tiers & Consequences:**

|Debt Level|Range         |Effects                                                                |
|----------|--------------|-----------------------------------------------------------------------|
|Clean     |$0            |No effects                                                             |
|Tier 1    |$1–$2,000     |8% weekly interest                                                     |
|Tier 2    |$2,001–$5,000 |+ Credit score drops. Hiring quality degrades (fewer senior candidates)|
|Tier 3    |$5,001–$10,000|+ “Collector Call” random events. Chance of 1 AP loss per day (stress) |
|Tier 4    |$10,001+      |+ Loan shark events. Morale tanks. Game over risk if unpaid for 7 days |

**Debt mechanics:**

- Line of credit max: $15,000
- Interest compounds weekly
- Paying down debt requires a manual “Pay Debt” action (free AP)
- At Tier 4 for 7+ days: game over — “The collectors came for everything.”

-----

### 10. VC FUNDING

Once reputation milestones are hit, VC opportunities appear as overnight notifications.

**Rounds:**

|Round   |Cash    |Equity|Board Pressure|Rep Required|
|--------|--------|------|--------------|------------|
|Angel   |$15,000 |8%    |Low           |40 rep      |
|Seed    |$75,000 |20%   |Medium        |80 rep      |
|Series A|$400,000|30%   |High          |150 rep     |

**Board Pressure:**

- VC funding introduces a board pressure meter
- Board sets quarterly revenue targets
- Miss targets: forced pivot event, lose 1 team member, or give up 5% more equity
- Hit targets: offered follow-on round

**Bootstrapped exit multiplier:**

- If you reach Market Leader without VC: exit value = revenue × 5 × 100% equity
- With VC: exit value = revenue × 5 × remaining equity %
- Staying bootstrapped is harder but more rewarding

-----

### 11. COMPETITORS

Three AI competitor companies exist in the market.

|Competitor     |Style              |Behavior                                                    |
|---------------|-------------------|------------------------------------------------------------|
|🔨 Grindhaus    |Budget underbidder |Steals pipeline leads if you wait too long. Low rep ceiling.|
|🦅 Apex Digital |VC-funded aggressor|Poaches your staff. Wins big contracts. Grows consistently. |
|🚀 Momentum Labs|Fast-burn startup  |Grows explosively but has 15% chance per week of imploding  |

**Competitor effects:**

- Steal pipeline leads after 3 days (Grindhaus most likely)
- Poach employees (Apex, targets high-skill staff)
- Market share tracked on a visual bar chart
- If Momentum implodes: their clients flood your pipeline for 1 week

-----

### 12. OFFICE UPGRADES SHOP

Accessible via a “Shop” tab. Purchases cost cash and sometimes 1 AP.

|Upgrade            |Cost   |Effect                            |
|-------------------|-------|----------------------------------|
|☕ Coffee Machine   |$200   |+10 energy every morning          |
|🪑 Standing Desk    |$400   |+1 AP per day cap (5 total)       |
|🖥️ Second Monitor   |$350   |Founder project work is 20% faster|
|📡 Faster Internet  |$150/mo|Projects complete 10% faster      |
|🏢 Rent Office Space|$800/mo|Unlocks team of 5+, +morale       |
|🎮 Office Perks     |$600   |+15 morale, +loyalty for all staff|
|📣 Marketing Package|$1000  |Pipeline volume +2 for 30 days    |
|🍕 Catered Lunch    |$300/wk|+energy, +morale weekly           |

**Food / Energy items (consumables):**

|Item           |Cost|Effect                                                |
|---------------|----|------------------------------------------------------|
|☕ Coffee       |$8  |+15 energy                                            |
|🥗 Healthy Lunch|$18 |+25 energy                                            |
|🍕 Uber Eats    |$35 |+40 energy, delivered next action                     |
|🍵 Matcha       |$12 |+20 energy, +1 focus (next action costs 5 less energy)|
|⚡ Energy Drink |$6  |+30 energy, -10 energy next morning                   |

-----

### 13. PROGRESSION MILESTONES

|Stage            |Requirements                        |Unlocks                                  |
|-----------------|------------------------------------|-----------------------------------------|
|🧑‍💻 Freelancer     |Start                               |Founder solo work, 3 AP                  |
|🏠 Home Office    |Day 7 + $1,000                      |4 AP, hire 1st employee                  |
|🏢 Micro Agency   |3 staff + $5,000 cash + 30 rep      |VC angel eligibility, shop expands       |
|🚀 Boutique Studio|$25,000 revenue + 70 rep            |Larger projects unlock, 2nd office option|
|📈 Scale-Up       |8+ staff + 130 rep + $75,000 revenue|Series A eligibility                     |
|👑 Market Leader  |200 rep + dominant market share     |WIN                                      |

-----

### 14. WIN / LOSE CONDITIONS

**Lose:**

- Cash hits $0 and debt is maxed
- Tier 4 debt unpaid for 7 days
- Reputation hits 0
- All employees quit simultaneously

**Win:**

- Reach Market Leader stage
- Optional: sell the company (exit event triggers, shows final valuation)

-----

### 15. SAVE SYSTEM

- Auto-save to `localStorage` at end of each day
- “Continue” option on title screen if save exists
- Manual save available in settings

-----

## UI / UX Notes

- **Mobile-first:** All tap targets minimum 44px. No hover-only interactions.
- **Font:** Orbitron (display/headers) + Share Tech Mono (body/data)
- **Color palette:** See v1 CSS variables — keep exactly
- **Tabs:** Dashboard · Projects · Team · Market · Shop
- **Persistent header:** Company name, Day counter, clock, AP pips (filled/empty dots), Energy bar
- **AP Pips:** Show remaining AP as dots e.g. `●●●○` for 3/4 remaining
- **End Day button:** Always visible, sticky footer
- **Animations:** Scanline wipe on day transition, slide-in for events, pulse on danger states

-----

## Claude Code Kickoff Instructions

When starting a Claude Code session on this repo:

1. Read this DESIGN.md fully before writing any code
1. Start with `index.html` + `css/style.css` + `js/state.js` + `js/main.js`
1. Get a playable day-1 loop working first: wake up → take actions → sleep → wake up
1. Then layer in systems in this order: Projects → Hiring → Payroll → Events → Debt → Shop → Competitors → VC
1. Test on iPhone Safari at every major milestone — tap targets, scroll, no horizontal overflow
1. Keep all game data in `state.js` as a single `G` object for easy debugging
1. Reference v1 (bootstrapped.html in repo root) for aesthetic — match it exactly

-----

*Designed in collaboration with Claude — Anthropic, 2026*
