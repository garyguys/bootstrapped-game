# BOOTSTRAPPED — Game Design Document

**Current Version:** v0.17
**Repo:** https://github.com/garyguys/bootstrapped-game
**Stack:** Vanilla HTML/CSS/JavaScript (ES5 — `var`, `function(){}`, no arrow functions, no const/let)
**Aesthetic:** Dark terminal / hacker — Orbitron + Share Tech Mono fonts, green-on-black (#00ff41 accents), neon accents, scanline overlay
**Target:** Browser-based, mobile-first (iPhone Safari), responsive desktop

-----

## Concept

You are a solo founder with $500, a laptop, and a dream. Build your tech startup from a bedroom freelancer into a market-leading company. Hire talent, win clients, manage your energy, beat competitors, and don't go broke.

This is a **turn-based day simulation** with real strategic depth. Every day you have a limited number of actions. How you spend them determines whether you thrive or flame out.

-----

## Project Structure

```
bootstrapped-game/
├── index.html                          # Main entry point (3 screens: title, character creation, game)
├── design.md                           # This file
├── bootstrapped-sprite-system.html     # Standalone 48px character creator/preview tool
├── css/
│   └── style.css                       # All styles (terminal aesthetic, responsive, modals)
├── js/
│   ├── avatars.js      # 48px procedural sprite system (layer-based canvas rendering)
│   ├── state.js        # Global game state object (G) + save/load + migrations
│   ├── projects.js     # Project templates, pipeline generation, delivery, own products
│   ├── team.js         # Hiring, candidates, negotiation, payroll, roles, scouting
│   ├── market.js       # Competitors, partnerships, acquisitions, market share
│   ├── events.js       # Random events (day + overnight), event pools
│   ├── engine.js       # Core game loop, day/night cycle, energy, recaps, win/loss
│   ├── actions.js      # All player actions, AP/energy costs, food items, training
│   ├── ui.js           # All DOM rendering, tabs, modals, upgrades data, shop
│   └── main.js         # Game init, character creation screen, screen management
└── .claude/            # Claude Code session data
```

**Script load order:** avatars → state → projects → team → market → events → engine → actions → ui → main

**Architecture notes:**
- All game data lives in a single global `G` object (defined in state.js) for easy debugging and serialization
- No build tools, no npm, no bundler — pure vanilla browser JS
- Save/load via `localStorage` with automatic migrations for older saves
- No separate data files (projects.json, etc.) — all data is defined inline in JS files

-----

## Core Systems

-----

### 1. TIME — Day/Night Cycle

Time progresses **day by day**. The player takes actions during the day, then manually ends the day to sleep and advance.

**Day Structure:**
- Morning: Player wakes up, AP refreshed, overnight events resolved, weekly/monthly recaps shown
- Day: Player takes actions (see AP system). Clock advances ~90 min per action taken.
- Night: Player chooses to sleep (ends day) or push through the night

**Header Display:**
- Week number | Day of week (MON-SUN) | Time (e.g., `09:00`)
- Total days played shown in smaller text underneath
- Day starts at 09:00, advances 1.5 hours per action/time slot

**Visual Day/Night System:**
- Background color temperature shifts throughout the day via CSS class updates
- `night` → deep black | `dawn` → cold blue-grey | `morning` → neutral terminal green | `afternoon` → slightly warmer | `dusk` → amber tint | `night` → back to black
- Full-screen scanline wipe transition plays on day change

**Night Push option:**
- Before sleeping, player can choose "Push Through the Night"
- Grants 1 bonus action immediately
- Next day: AP cap reduced by 1, energy starts at ~30% of normal
- Second consecutive push further reduces recovery

-----

### 2. ACTION POINTS (AP)

Each day the player has **4 AP** by default. Actions cost varying AP amounts.

**AP Costs:**

| Action | AP Cost |
|---|---|
| Work on project (founder) | 1 |
| Accept pipeline project | 1 |
| Client call | 1 |
| Post job listing | 2 |
| Interview candidate | 1 |
| Hire employee | 1 |
| Scout competitor | 1 |
| Poach employee | 2 |
| Acquire company | 5 |
| Staff party | 1 |
| Train skill | 1 |
| Press release | 1 |
| Team training day | 2 |
| Open source contribution | 1 |
| Buy food/energy | 0 (free) |
| Buy upgrades | 1 |
| Invest AP in product greenlight | 1+ (selectable) |

**AP Modifiers:**
- Standing Desk upgrade: +1 AP cap
- Executive Suite upgrade: +2 AP cap
- Operations team members (PM, Sales, Marketer): +1 AP per 2 ops members (max +2 bonus)
- Push-through penalty: -1 AP next day
- Debt level 3+: random chance of losing 1 AP (stress)

-----

### 3. ENERGY SYSTEM

The founder has an **Energy meter** (0–100). It resets each morning based on sleep quality and modifiers.

**Energy Recovery (Sleep):**
- Base: 75
- Penalty: -10 per active project, -2 per team member
- Minimum recovery: 20 (clamped)
- Coffee Machine upgrade: +10
- Ping Pong Table upgrade: +5
- Rooftop Terrace upgrade: +20
- Weekend bonus: +10
- Push-through recovery: base 30 instead of 75
- Late Night Gaming event: 75% of normal recovery

**Energy Costs per Action:**

| Action | Energy |
|---|---|
| Work on project | 12 |
| Accept project | 8 |
| Client call | 8 |
| Post job | 10 |
| Interview | 10 |
| Hire | 8 |
| Browse shop | 5 |
| Order food | 0 |
| Acquire company | 15 |
| Scout | 8 |
| Poach | 12 |
| Staff party | 10 |
| Train skill | 10 |

**Energy Effects:**
- 80–100%: Normal
- 50–79%: Warning indicator
- 25–49%: Work speed reduced to 90%
- Below 25%: 20% chance of bug injection or progress loss per action
- Below 15%: Popup warning to player
- 0%: Day cannot continue — forced end day with notification popup

**Energy restoration creates a money sink** — players are encouraged to purchase food items and throw staff parties to manage energy, especially as team size and active projects grow.

-----

### 4. FOUNDER / PLAYER CHARACTER

**Character Creation (New Game):**
- Player name + company name
- 48px procedural pixel art avatar with customization:
  - Body type (male/female)
  - Skin tone (6 options)
  - Hair style (8 male / 4 female)
  - Hair color (12 options)
  - Shirt style (5) + color (12)
  - Pants style (5) + color (8)
  - Shoe color (6)
  - Accessory (8 options: none, glasses, headphones, cap, scarf, badge, phone, watch)
- 8 skill points to distribute across Technical, Communication, Reliability (max 8 per skill)

**Founder Capabilities:**
- Can personally work on any project regardless of requirements (1 AP per work action)
- Work progress: base 15% + (technical skill * 2%), modified by upgrades
- Skills slowly improve through work (XP system: +1 XP per work/client_call action, level up at 10 XP)
- Player avatar displayed in Company Overview modal under Founder section
- Training available in shop (costs scale exponentially: $650 for level 2, up to $130,000 for level 10)

-----

### 5. HIRING SYSTEM

**Roles (6 types):**
- Developer (primary: technical) — color: light blue (#60a0ff)
- Designer (primary: technical) — color: purple
- Marketer (primary: communication) — color: orange
- Sales Rep (primary: communication) — color: gold
- DevOps (primary: technical) — color: red
- PM (primary: reliability) — color: teal

**Skill System:**
- 3 skills: Technical (TEC), Communication (COM), Reliability (REL)
- Scale: 1-10 (was 1-5, changed in v3)
- Color display: red 1-3, yellow 4-7, green 8-9, light blue for perfect 10
- Tiers: Junior (skills 1-6), Mid-Level (2-8), Senior (3-10)
- Role skew: +1 to primary skill

**Hiring Flow:**
1. Post Job Listing (2 AP, 7-day cooldown) — candidates appear next day
2. Interview (1 AP per interview) — reveals hidden skills through fog-of-war system
3. Negotiate salary — patience bar system (hidden patience stat 1-5)
4. Hire (1 AP) — candidate joins team

**Candidate System:**
- Candidates withdraw interest after 3-5 days if not interviewed
- Quality of applicants scales with company market share/reputation
- 12 perks and 6 flaws randomly assigned
- "Diamond in the rough" feature (8% chance): high-skill character at a small company or in applicant pool, marked with light blue diamond, has 2x XP gain rate and 15% cheaper salary

**Salary Structure:**
- Junior: ~$200/week base
- Mid: ~$400/week base
- Senior: ~$700/week base
- High skill (8-9): $13,000-18,000/week
- Perfect 10 skill: $8,000-20,000/week
- Top salary cap: ~$20,000/week
- Market modifier from competitor salaries: 0.8x to 1.5x

**Negotiation:**
- Counter-offer with +/- buttons in $5% intervals
- Hidden patience stat determines tolerance
- At >= 100% of asking: auto-accept
- 85-99%: 50%+ chance
- 70-84%: lower chance + loyalty hit
- <70%: auto-reject + extra patience cost
- Exhausted patience = candidate withdraws permanently
- Only patience bar shown (no number) — creates tension

**Loyalty System:**
- Decay: base 1.5 - (reliability * 0.1) per day
- Employee Gym upgrade: -50% loyalty decay
- Food items boost loyalty for all team members
- Quit threshold: loyalty <= 10
- Missed payroll: major loyalty/morale hit, some may stay but most quit

**Team Display:**
- Team tab splits into "Your Team" and "Candidates" subtabs
- Team organized by role, ranked by Junior/Mid/Senior
- Clickable cards expand to show details, work history, skills
- Skills use fog-of-war for uninterviewed candidates

**Skill Growth:**
- Team members gain XP by working on projects (1 XP/day, diamonds get 2)
- Level-up threshold: 12 XP per +1 skill point
- Hidden from player — popup notification when skill increases

-----

### 6. PAYROLL

- Payroll due **every 7 days**
- 3-day, 2-day, 1-day advance warnings shown
- If cash is insufficient: debt accumulates, reputation loss
- Missed payroll consequences: loyalty-based — some may stay with reduced morale, others quit
- If unable to pay and debt exceeds $5,000: potential bankruptcy/game over
- "Pay a bill" random event does not fire the day before payday

-----

### 7. PROJECTS

**Pipeline:**
- 2-5 leads available at any time, scaling with reputation
- Leads expire after 3 days if not accepted
- First 7 days: always at least one solo-able project available
- 40% chance of repeat clients — rapport system tracks per-client relationships
- Higher rapport = more lenient on missed deadlines
- Pipeline projects scale with stage (higher stages see fewer low-value jobs)
- Projects can be declined to remove from pipeline

**22 Project Templates (selection):**

| Project | Value | Complexity | Deadline | Requirements |
|---|---|---|---|---|
| Landing Page | $600-900 | 1x | 3-4d | None |
| WordPress Site | $800-1,200 | 1x | 4-6d | None |
| Blog Platform | $1,000-1,800 | 1.5x | 5-8d | None |
| Mobile App | $3,000-5,500 | 2x | 8-14d | 1+ team |
| E-Commerce Store | $4,000-7,000 | 2x | 10-16d | 1+ team, 25 rep |
| SaaS Dashboard | $6,000-10,000 | 2.5x | 12-18d | 2+ team, 50 rep |
| Enterprise Portal | $10,000-18,000 | 3x | 16-24d | 3+ team, 75 rep |
| AI/ML Platform | $15,000-25,000 | 4x | 20-30d | 5+ team, 100 rep |
| White-Label Product | $20,000-30,000 | 5x | 25-40d | 7+ team, 150 rep |

**Complexity Gates by Stage:** freelancer max 1.5, home_office max 2, startup max 2.5, seed_stage max 3, series_a max 4, growth+ max 5.

**Team Assignment:**
- Any team member can be assigned to any project regardless of role
- Multiple team members can be assigned to the same project
- Team members can only be assigned to one project/product at a time
- Role contribution rates: Developer 2.5, Designer 2.0, DevOps 2.0, PM 0.5, Sales 0.5, Marketer 0.5
- Technical skill determines work speed — high tech = faster progress
- Auto-assign feature available via Automation Tools upgrade
- Actions dropdown on each project for assign, work, extend, etc.
- "Work 1AP" clarifies that the founder is personally working

**Deadlines & Extensions:**
- Extending a deadline: +2 days per extension
- Reputation cost: min 2, escalating up to 5 per additional extension
- Can extend at any point during project timeline
- 3+ days overdue: 70% cancel chance (reduced by client rapport), otherwise auto-extension

**Delivery:**
- When progress hits 100%, project completes same day (not next day)
- Popup shows: client happiness, team member who completed it, random outcome events
- Happiness: 0 extensions = Delighted (+2 rep), 1 = Satisfied, 2 = Neutral, 3+ = Disappointed (-3 rep)
- Completed projects viewable in Company Overview with details, outcome, team members

**Completed projects can be cleared from the list.**

-----

### 8. OWN PRODUCTS

Available at higher stage/reputation thresholds.

**Product Types (6):** SaaS Tool, Mobile App, Web Platform, B2B Software, Developer Tool, AI Product

**Product Scopes (4):**

| Scope | Investment | Dev Days | Revenue/Day |
|---|---|---|---|
| Small | $5,000 | 15-25 | $50-200 |
| Medium | $20,000 | 30-60 | $200-800 |
| Large | $75,000 | 60-120 | $800-3,000 |
| Enterprise | $200,000 | 90-180 | $2,000-10,000 |

**Product Lifecycle:**
1. **Greenlight** — Requires 12 AP investment (6 with Innovation Lab upgrade). Multi-AP selector (- invest AP +) instead of 1-at-a-time. Quality doesn't decay and team doesn't need to be assigned during this phase.
2. **Building** — Dev days worked by assigned team or founder manual work. One dev working = one dev day.
3. **Launch** — Product launch screen shows: quality, market interest, max revenue, projected daily income, team assigned, launch grade (S/A/B/C/D based on quality + interest average)
4. **Live** — Daily revenue based on quality * interest * maxRevenue. Quality decays: 0.5/day with team, 3/day without. Products become dated and need updating.
5. **Dead** — Quality 0 + interest <= 5

**Launch Quality:** Solo build = 70%, team = min(95, 60 + avgTech * 2)

**Revenue Modifiers:** Server Farm +25%, Cloud Infrastructure +50%

**Product Management:**
- Products show lifetime profit alongside investment
- Larger products (10k, 20k+) have higher upsell amounts in random events
- Updating a product restores quality
- Can upgrade product scope with $ cost (higher scale = new interest, higher returns, may need larger team)
- **Sell Product:** Lump sum equivalent to 10-30 days of current daily income. Permanent — product dies.

-----

### 9. RANDOM EVENTS

**Day Events:** 30% chance per action taken, weighted selection, 5-event cooldown between repeats.

**20+ Day Events include:**
- Critical Bug — fix (cost cash) or ignore (lose rep)
- Staff Poached — counter-offer or let them go
- Client Upsell — scope expansion opportunity (specifies which project + shows progress bar)
- Scope Creep — accept or decline additional work
- Big Client Opportunity — confirmation popup on outcome
- Donation Request — optional overnight event (not forced), costs scale with reputation/stage
- Tax Audit, Viral Tweet, Industry Award, Surprise Expense, Media Feature, Tech Conference, Office Break-in, Client Referral, Team Hackathon, Influencer Collab, Government Grant, Product Idea, and more

**Overnight Events:** 60% chance of 1 event, 40% chance of 2 events per night.

**20+ Overnight Events include:**
- Press Coverage — rep spike
- Client Reviews (good/bad) — rep gain or loss
- Market Slowdown — pipeline reduces
- Server Outage — must resolve
- Late Night Gaming — energy recovery reduced to 75% next morning
- Team Bonding, Competitor Intel, Passive Income, Team Conflict (reduced by high COM skill), Employee Burnout, Competitor Poach Attempt (shows which employee is targeted), Late Payment, Stock Market Bump, and more

**Overnight/morning display only shows events from that night/previous day. Older events remain in the activity log.**

-----

### 10. COMPETITORS & MARKET

**Market Structure:**
- 4-10 AI companies active at any time (always 1+ megacorp, 1+ VC-funded)
- Companies regularly fail, get acquired, or new ones appear
- Smaller companies fail more often (weekly/bi-weekly/sometimes multiple in a few days)
- System maintains 5-10 alive companies

**21 Competitor Archetypes:**
- 3 Megacorps: Nexus AI, Synthex Systems, OmniStack — highest skilled members, hardest to poach, highest salaries
- 4 VC-Funded: Apex Digital, Velocity Labs, ScaleForce, Horizon Ventures
- 2 Budget: Grindhaus, CutRate Code
- 12+ Niche Startups: various smaller companies

**Market Share:** `reputation / 12 + productBonus` (productBonus from live own products)

**Scouting:**
- Reveals competitor team members, skills, products
- Scouting effort scales with company size: niche 1-3 days, megacorp multiple weeks + AP
- Each scout action reveals more data (tiered reveal system)

**Poaching:**
- More scouting reveals traits, loyalty, willingness to negotiate
- Some members are simply not interested
- Base success chance: niche 40%, budget 55%, vc_funded 25%, megacorp 15%
- Reputation bonus up to +30%
- Salary multiplier: megacorp 1.4x, vc_funded 1.3x, other 1.2x
- Poached employees go directly to negotiation (not candidates)
- Work history reflects the company they were poached from

**Partnerships:**
- Benefits preview modal shown before attempting (benefits, cost, risk)
- Success chance: niche 70%, budget 60%, vc_funded 45%, megacorp 30% + reputation bonus
- Success: mutual no-poach, +reputation, market synergy
- Failure: no money spent, -3.5% reputation
- Expires after 14 days with overnight notification
- 7-day cooldown after expiry before re-partnering

**Acquisitions:**
- "Are you sure?" confirmation prompt (cannot be cancelled once committed)
- Cost: `80 * share^2 + 40000 + (daysActive * 100)`
- Multi-step modal: Step 1 — select products to acquire; Step 2 — select team members
- Team acquisition shows full list — negotiate each sequentially (multi-hire chain)
- Acquires selected products (can be scouted beforehand)
- Reputation gain: 1/3 of acquired company's reputation
- Startups below 10% market share always acquirable; above 10% must be below your share

**Competitor AI:** Weekly growth cycles, inter-competitor acquisitions (megacorps acquire niche every 14 days at ~35% chance)

-----

### 11. SHOP — Food, Upgrades, Training

Shop tab has 3 sections: Food & Energy, Upgrades, Training.

**Food & Energy Items (10):**
- Items do NOT cost AP (free to purchase)
- Each item can only be purchased once per day (per-item cooldown)
- Items with multi-day buff cooldowns must expire before repurchase of that specific item
- Other items remain available during another item's cooldown
- Costs scale with team size: `1 + team.length * 0.1`
- Private Chef upgrade: 50% food discount, +20% energy bonus

| Item | Cost | Energy | Cooldown | Extras |
|---|---|---|---|---|
| Energy Drink | $30 | +10 | 1d | Daily limit: 1 |
| Coffee Run | $50 | +15 | 1d | — |
| Lunch Delivery | $120 | +25 | 1d | — |
| Team Pizza | $200 | +20 | 2d | +3 loyalty all |
| Catered Lunch | $400 | +30 | 2d | +5 loyalty all |
| Meal Prep | $500 | +20 | 5d | 3 charges, +8 each |
| Team BBQ | $800 | +35 | 3d | +8 loyalty, +1 rep |
| Wellness Retreat | $1,200 | +50 | 7d | +10 loyalty, +2 rep |
| Sushi Catering | $1,500 | +60 | 5d | +12 loyalty, +3 rep |
| Corporate Retreat | $2,000 | +100 | 14d | +15 loyalty, +5 rep |

**Upgrades (16 total, 3 tiers):**
- Tier unlock is gatekept by stage progression (not previous purchases)
- Purchased upgrades removed from shop, visible in Company Overview

**Tier 1 — Available from Freelancer:**

| Upgrade | Cost | Effect |
|---|---|---|
| Coffee Machine | $2,500 | +10 energy recovery |
| Ping Pong Table | $3,500 | +5 energy recovery |
| Second Monitor | $4,000 | +20% work speed |
| Premium Software | $5,500 | +10% work speed, unlock advanced projects |
| Office Perks | $8,000 | +5 loyalty/day all team |
| Standing Desk | $12,000 | +1 max AP |

**Tier 2 — Available from Startup:**

| Upgrade | Cost | Effect |
|---|---|---|
| Rooftop Terrace | $22,000 | +20 energy recovery, +2 rep/week |
| Server Farm | $30,000 | +25% product revenue |
| Executive Suite | $45,000 | +2 max AP |
| Automation Tools | $38,000 | Auto-assign team to projects |
| Recording Studio | $20,000 | 2x press release effectiveness |

**Tier 3 — Available from Series A:**

| Upgrade | Cost | Effect |
|---|---|---|
| AI Copilot | $60,000 | +25% work speed |
| Employee Gym | $50,000 | -50% loyalty decay |
| Innovation Lab | $75,000 | Halve product greenlight AP cost |
| Cloud Infrastructure | $80,000 | +50% product revenue |
| Private Chef | $40,000 | 50% food discount, +20% food energy |

**Training (Player Skills):**
- Does not specify "(costs scale with level)" in UI
- Exponential cost scaling:

| Level | Cost |
|---|---|
| 1 → 2 | $650 |
| 2 → 3 | $1,600 |
| 3 → 4 | $3,200 |
| 4 → 5 | $6,500 |
| 5 → 6 | $13,000 |
| 6 → 7 | $26,000 |
| 7 → 8 | $52,000 |
| 8 → 9 | $78,000 |
| 9 → 10 | $130,000 |

-----

### 12. STAGE PROGRESSION

Progression is **reputation-based only**.

| Stage | Rep Required | Key Unlocks |
|---|---|---|
| Freelancer | 0 (start) | Solo work, 4 AP, tier 1 shop |
| Home Office | 25 | Hiring allowed, post job listings |
| Startup | 75 | Tier 2 upgrades, larger projects |
| Seed Stage | 150 | Team expansion, more project types |
| Series A | 300 | Tier 3 upgrades, large projects |
| Growth Company | 550 | Enterprise projects, major acquisitions |
| Enterprise | 1,000 | End-game content |
| Market Leader | 2,000 | **WIN CONDITION** |

-----

### 13. DEBT SYSTEM

| Debt Level | Range | Effects |
|---|---|---|
| Clean | $0 | No effects |
| Tier 1 | $1-$2,000 | 8% weekly interest |
| Tier 2 | $2,001-$5,000 | + Hiring quality degrades |
| Tier 3 | $5,001-$10,000 | + Collector events, chance of AP loss |
| Tier 4 | $10,001+ | + Morale tanks, game over risk if unpaid 7 days |

Bankruptcy threshold: $5,000 debt with inability to pay.

-----

### 14. WIN / LOSE CONDITIONS

**Win:** Reach Market Leader stage (2,000 reputation)

**Lose:**
- Cash hits $0 and debt is maxed
- Tier 4 debt unpaid for 7+ days
- Reputation hits 0
- Bankruptcy ($5,000+ debt, unable to pay)

-----

### 15. DASHBOARD & MANAGEMENT ACTIONS

Dashboard is the home screen each day. Shows: overnight events, status grid (cash, rep, AP, energy, stage, team count, active projects, products), action buttons, P&L section, activity log.

**Management Actions (on Dashboard):**
- Post Job Listing (2 AP, 7-day cooldown)
- Staff Party (1 AP, $200 + $80/member, 7-day cooldown — boosts morale)
- Press Release (1 AP, 14-day cooldown, cost scales $500-$40,000 by stage, +5 to +22 rep)
- Team Training Day (2 AP, 10-day cooldown, $200/member — +1 skill shown after confirmation)
- Open Source Contribution (1 AP, 7-day cooldown, +3 rep, extra pipeline lead)
- Vacation (1-7 days selectable — full rest, industry continues, bills still due)

**NOT on Dashboard:** Individual project actions (work, accept, extend) are on project cards in the Projects tab.

**Company Overview:** Clickable company name in header opens modal with: founder (with avatar + skills), owned upgrades, team (date hired), project history (clickable for details), best clients + lifetime value, and other company stats.

**P&L Ledger:** Shows all income and expenses on the dashboard.

-----

### 16. RECAPS

**Weekly Recap:** Every 7 days — summary of week's performance
**Monthly Recap:** Every 28 days — monthly P&L, market share, total projects completed, best customer, and other relevant stats

-----

### 17. 48px PROCEDURAL SPRITE SYSTEM (v0.16.2+)

All characters in the game have procedurally generated 48x48 pixel art avatars.

**Architecture:**
- Layer-based canvas rendering: body → shirt → pants → hair → accessory
- All sprites rendered left-facing (base is right-facing, horizontally flipped)
- `AvatarGen.generate(person, scale)` returns a canvas element
- `AvatarGen.generateAppearance(person)` resolves appearance via stored properties or hash-based deterministic fallback for NPCs

**Color Palettes:**
- 6 Skin Tones (Light → Dark)
- 12 Hair Colors (Black, Brown, Blonde, Red, Blue, Pink, Green, White, Purple, Teal, Orange, Gray)
- 12 Shirt Colors
- 8 Pants Colors
- 6 Shoe Colors
- Multi-tone palette entries (base/shadow/highlight/dark/rim)

**Style Options:**
- Male hair (8): short, long, mohawk, buzz, curly, bald, beanie, spiky
- Female hair (4): ponytail, long, short, bald
- Female hair weighted distribution: ponytail 40%, long 35%, short 18%, bald 7%
- Shirt styles (5): tee, hoodie, tank, buttonup, jacket
- Pants styles (5): jeans, shorts, cargo, skirt, sweats
- Accessories (8): none, glasses, headphones, cap, scarf, badge, phone, watch

**NPC Generation:**
- Ethnicity-based skin tone derived from last name mapping
- Role-based shirt color (developer=blue, designer=purple, marketer=orange, sales=gold, devops=red, PM=teal)
- Hash-based deterministic fallback ensures NPCs without stored appearance still render consistently

**Scale Factors:**
- Card avatars: scale 1 → 48x48px
- Character creation preview: scale 3 → 144x144px

**Standalone Creator:** `bootstrapped-sprite-system.html` — matches game aesthetic, left-facing preview only, no export/resize controls.

-----

### 18. HELP SECTION

Help tab (after Shop) explains all game systems, abbreviations, mechanics, and controls. Content rendered dynamically from ui.js.

-----

### 19. OPTIONAL TUTORIAL

An optional 8-step guided tutorial that walks new players through all major game systems.

**Activation:**
- Checkbox on character creation screen: "ENABLE TUTORIAL" (checked by default)
- Only triggers on new games — continuing a save never shows tutorial
- Can be skipped at any step via "SKIP TUTORIAL" button

**Tutorial Steps (8):**
1. Welcome — introduces premise ($500, goal of Market Leader)
2. Action Points — explains AP system, pips in header, costs
3. Energy — energy bar, low-energy penalties, food as recovery
4. Projects & Money — pipeline, accepting/working projects, deadlines
5. Hiring — stages, posting jobs, interviews, negotiation, loyalty
6. The Market — competitors, scouting, poaching, partnerships, acquisitions
7. Shop & Upgrades — food, upgrades, training sections
8. Your First Day — step-by-step game plan for day 1

**UI:**
- Dedicated tutorial modal with cyan "TUTORIAL" badge and step counter
- Each step can highlight a specific UI element (cyan pulse animation)
- Steps that reference specific tabs automatically switch to that tab
- NEXT / SKIP TUTORIAL navigation buttons
- Returns to Dashboard tab on completion

**State:**
- `G.tutorialEnabled` — whether tutorial is active
- `G.tutorialStep` — current step index (0-7)
- `G.tutorialComplete` — whether tutorial has been finished/skipped
- Tutorial progress persists across saves (if mid-tutorial save happens)

-----

### 20. DEV MODE

Separate tab (beside Help) for testing. Features:
- Set available cash
- Unlimited energy toggle
- Unlimited AP toggle
- Set reputation / change stage
- Set player skill levels
- Skip day

-----

### 21. SAVE SYSTEM

- Auto-save to `localStorage` at end of each day
- Save key: `bootstrapped_v3_save`
- "Continue" button on title screen if save exists
- Automatic migrations handle saves from any previous version
- Delete save available

-----

## UI / UX Notes

- **Mobile-first:** All tap targets minimum 44px. No hover-only interactions.
- **Fonts:** Orbitron (display/headers) + Share Tech Mono (body/data)
- **Color palette:** Dark terminal green theme — `#00ff41` primary, `#0a100a` background
- **Tabs:** Dashboard | Projects | Team | Market | Shop | Help | Dev
- **Top bar:** Scrollable/draggable to reveal all tabs
- **Persistent header:** Company name (clickable → overview), Week + Day counter, clock, AP pips, Energy bar
- **AP Pips:** Filled/empty dots showing remaining AP
- **End Day button:** Always visible, sticky footer
- **Animations:** Scanline wipe on day transition, slide-in for events, pulse on danger states
- **Modals:** event-modal (interactive day events), confirmation-modal, negotiation-modal, company-modal, assign-modal, product-create-modal, product-launch-modal
- **Skill bar colors:** Red (1-3), Yellow (4-7), Green (8-9), Light Blue (perfect 10)
- **Role colors in assign modal:** Developer blue, Designer purple, Marketer orange, Sales gold, DevOps red, PM teal
- **Notifications:** Popup when new candidates appear in hiring pipeline

-----

## Future Considerations

### AI Music & Sound Effects
Future updates may incorporate AI-generated music and sound effects to enhance the game experience. This could include:
- Background ambient music that shifts with time of day and game stage
- Sound effects for actions, events, and UI interactions
- Stage-specific music themes
- Event-specific sound stings (success, failure, alert)

### Potential Future Features
- VC funding rounds (Angel, Seed, Series A) with board pressure mechanics
- Company exit/valuation system
- More sophisticated competitor AI behavior
- Expanded end-game content beyond Market Leader
- Achievement/unlock system across runs

-----

## Version History

### v0.17 (Current)
- Optional 8-step tutorial system for new players
- Tutorial checkbox on character creation screen (enabled by default)
- Guided walkthrough covers: AP, Energy, Projects, Hiring, Market, Shop, and first-day strategy
- Tutorial modal with cyan badge, step counter, tab switching, and UI element highlighting
- Skippable at any step; progress saved across sessions
- State migration for existing saves (tutorial defaults to complete)

### v0.16.3
- Female hair distribution rebalanced: ponytail 40%, long 35%, short 18%, bald 7%
- Added 'short' to female hair styles
- Player character sprite displays in Company Overview modal under Founder section
- Fixed founder avatar vertical alignment and mobile rendering

### v0.16.2 — 48px HD Procedural Sprite System
- Complete rewrite of avatar system: replaced palette-indexed 24x32 arrays with 48x48 procedural layer-based canvas rendering
- Layers composited in order: body → shirt → pants → hair → accessory
- 2 body types (male/female with distinct features)
- 9 hair styles, 5 shirt styles, 5 pants styles, 7+ accessories
- Rich multi-tone color palettes
- All characters rendered left-facing
- Standalone character creator tool (bootstrapped-sprite-system.html) styled to match game
- Updated character creation with full customization pickers
- State migration for old hex-color saves to new index-based system
- Random NPC appearance generation for all team members/candidates

### v0.16.1 — Character Model Update
- HD character sprites — 24x32 grid with expanded shading palette

### v0.16 — Partnerships, Acquisitions, Products, Sprites
- Partnership rework: chance-based system with benefits preview, failure costs rep
- Partnership expiry (14 days) + 7-day cooldown
- Acquisition "are you sure" confirmation, cannot cancel once committed
- Multi-hire negotiation chain for acquisition team members
- "Late night gaming" overnight event (energy depleted to 3/4)
- Developer role color changed from green to blue (#60a0ff)
- Sell product for lump sum (10-30 days of income)
- Greenlight multi-AP investment selector (- invest AP +)
- Product launch screen with quality, interest, revenue, team grade
- Product outcome influenced by assigned team stats
- 16x24 HD character sprites (later superseded by v0.16.2)

### v0.15 — Salary Rebalancing, Acquisition Overhaul
- Top skill level salaries capped at ~$20,000/week
- Acquisition process window: choose products then team members
- MegaCorp acquisitions now multi-million dollar
- Small startup acquisitions ~$50-75k
- Scope-restricted products for smaller acquisitions

### v0.14 — Food Buffs, Partnerships, Diamond Hiring, Skill Growth
- Per-tier food buffs with individual cooldowns
- Strategic partnerships with competitors (+rep, no-poach)
- "Diamond in the rough" hiring feature (8% chance, marked with blue diamond, 2x XP)
- Employee skill growth system (hidden XP, popup on level up)
- Poaching system fully implemented
- Market news at top of market tab, clears daily
- Assign team modal: static layout, role-specific colors, clear assignment indicators
- Higher stages see fewer low-value jobs
- Actions tab for each competitor: acquire, partnership, scout

### v0.13 — Dev Mode, Character Creation, Team UI
- DEV mode tab with cash/energy/AP/rep/skill cheats
- Player character skills must be assigned before starting
- Team tab split: "Your Team" / "Candidates" subtab buttons
- Increased character customization options
- Energy drink daily limit of 1
- Food/energy items sorted by cost

### v0.12 — Bug Fixes, Auto-Assign, Acquisition Rules
- Food/Energy items moved above upgrades in shop
- Fixed company scouting targeting wrong company (unique identifiers)
- Fixed team assignment bug (members incorrectly linked together)
- Auto-assign button per project/product (not dashboard-wide)
- Acquisition rules: <10% share always acquirable, >10% must be below your share

### v0.11 — Operations Team Cap, Scouting Fix, Team Organization
- Maximum +2 AP from operations team members
- New candidate notification popup
- Fixed scouting bug targeting wrong company
- Team organized by role, ranked by tier

### v0.10 — Energy System, Auto-Assign, Acquisitions, Training
- Exit "sleep & end day" menu to return to current day
- Show targeted employee info during poach attempts
- Sort team by assigned projects in assign modal
- Low energy warning popup at 15%
- Zero energy forces end of day
- Upgrade unlock gatekept by stage (not previous purchases)
- Player skills properly upgrade from work actions
- Training day skill boosts shown after confirmation
- Weekly + monthly recap system
- Fix: double-selection bug in team assignment
- Purchased upgrades shown in company info
- Products show lifetime profit + investment
- Larger product upsell amounts
- Acquiring startups: poach staff, acquire products, gain 1/3 rep
- Auto-assign team feature
- Training day cooldown lowered to 10 days
- Quality doesn't decay during greenlight phase
- Expanded food/energy choices
- Expanded tier 3 upgrades
- Cheaper personal skill leveling

### v0.09 — Deep Gameplay Systems, Expanded Content
- Guaranteed solo-able project in first 7 days
- Per-item food purchase cooldowns
- Expanded random events and character names
- Payroll warning system (3, 2, 1 day advance)
- Missed payroll: some stay, some quit based on loyalty
- Streamlined salary negotiation (no secondary popup)
- Client rapport system with repeat clients
- Help section updated
- Product quality restoration and scope upgrades
- Energy system difficulty tuning
- Team members limited to one project/product at a time
- Monthly recap screen
- Week + Day of week display format
- Company name header click for overview
- New candidate notification
- AI startup churn (more common appearances, acquisitions, collapses)
- Technical skill affects project work speed (scaled by project difficulty)
- Expanded project template range

### v0.08 — Same-Day Delivery, Products, P&L, UX Polish
- Projects at 100% complete same day
- Job listing greyed out until Home Office
- Per-item food cooldowns with multi-day buff tracking
- Stage upgrade congratulations popup
- Salary negotiation: counter offer with -/+ buttons in 5% intervals
- Week counter above day counter
- Version display changed to v0.0X format
- Founder can work on all projects regardless of requirements
- Decline projects from pipeline
- Extend projects at any point
- P&L ledger on dashboard
- Training day shows per-member skill boosts
- Company overview: clickable past projects with details
- Own product development: 12 AP greenlight, dev-day based building
- Per-item food purchase system

### v7 — 8-Stage Progression, Roles, Character Creator
- Each day begins at dashboard
- All team members assignable to any project
- Founder contributes to all projects
- 6 role types with perk benefits
- Work history shows previous employment only
- Win condition increased to 2000 rep
- Home Office at 25 rep
- 8-stage progression system
- Higher-end shop upgrades (tier-gated)
- Basic character creation (hair, colors, skills, 8 skill points)

### v6 — Active Projects, Stage Progression, Win Condition
- Projects don't auto-progress without assigned team
- Stage progression based on total reputation only
- Win condition discussion (increased from 200 to 500, later to 2000)

### v5 — Products, Management, Company Overview
- Own product development unlocked at higher stages
- Work action streamlined (no confirmation popup, menu stays open)
- More startup random events
- Client call removed from dashboard actions
- Management operations: vacation system
- Completed projects clearable
- Company overview modal (employees, founder, history, clients)
- Perfect 10 skill characters: high 5-figure salary
- Applicant quality scales with market share
- Market share scales with product releases

### v4 — Pipeline, Upgrades, Energy, Salaries
- Day 1 pipeline always includes a startable job
- Upgrade prices increased (Coffee Machine $2,500 minimum, AP upgrades $10k+)
- Training costs scale exponentially
- Scouting scales with company size
- Donation costs scale with reputation/stage
- Large company salaries in 4-5 figure range
- Zero energy: no AP for the day, increased conflict chance
- Project completion popup with results
- Skill bar colors: red 1-3, yellow 4-7, green 8-9, blue 10
- Patience bar only (no number) in negotiations
- Per-project team assignment with actions dropdown

### v3 — Foundation Overhaul
- Deadline extension penalties (reputation loss)
- Random events specify affected projects with progress bars
- Donation as optional overnight event
- Food/energy free (no AP), upgrades cost AP, food scales $50-$1,000
- Temporary food buffs (1-3 days)
- Salary negotiation patience system (hidden stat)
- Overnight display limited to recent events
- Candidate withdrawal after 3-5 days
- Competitor scouting with fog-of-war reveals
- 4-10 AI companies, regular failures/acquisitions
- Team assignment to projects (technical skill = speed)
- Skills reworked: TEC (project speed), COM (less team conflict), REL (loyalty/consistency)
- Clickable character cards with expandable details
- 16-bit character images per person (gender/ethnicity-aware)
- Dashboard: management actions only (not project work)
- Energy system difficulty increase (food as money sink)
- Missed deadline consequences (cancel or extension)
- Competitor names avoid real company names
- Event confirmation popups
- Character creation + company naming
- Skills moved from 5-point to 10-point scale

-----

## Claude Code Development Notes

**When working on this repo:**
1. Read this design.md before making changes
2. Use vanilla ES5 JavaScript only — `var`, `function(){}`, no arrow functions, no const/let, no template literals
3. All game state lives in the global `G` object (state.js)
4. When adding new state fields, add them to `createDefaultState()` AND add a migration in `loadGame()` for existing saves
5. Test on mobile Safari — tap targets, scroll, no horizontal overflow
6. Script load order matters: avatars → state → projects → team → market → events → engine → actions → ui → main
7. Syntax validate with: `node --check js/filename.js`
8. The sprite system (`AvatarGen`) must be loaded before any file that references it
9. Food items and shop data are defined in `actions.js` (FOOD_ITEMS) and `ui.js` (UPGRADES) respectively — there are no separate JSON data files
10. Commit messages follow format: `vX.XX.X: Brief description`

-----

*Designed and developed in collaboration with Claude — Anthropic, 2025-2026*
