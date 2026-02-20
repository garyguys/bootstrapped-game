/* ============================================
   market.js — Competitors, Market Share, Acquisitions
   Now 4-10 companies. Weekly failures/acquisitions.
   Renamed Anthropic Systems to Synthex Systems.
   ============================================ */

var COMPETITOR_ARCHETYPES = [
  // Large established players
  { name: 'Nexus AI',          style: 'megacorp',   desc: 'Enterprise AI giant. Massive budget, slow to pivot.',
    shareBase: 25, growthRate: 0.3, failChance: 0.01, canAcquire: true, focus: 'Enterprise AI solutions',
    acqPerks: ['Access to enterprise client list (+8 rep)', 'Established sales pipeline (+3 leads)'],
    acqRisks: ['Major culture clash (-15 loyalty to team)', 'Legacy tech debt (1 project slows down)'] },
  { name: 'Synthex Systems',   style: 'megacorp',   desc: 'Leading AI safety research lab turned product company.',
    shareBase: 20, growthRate: 0.4, failChance: 0.01, canAcquire: true, focus: 'Safe AI infrastructure',
    acqPerks: ['Top-tier research talent (+10 rep)', 'Safety certification prestige'],
    acqRisks: ['Expensive team expectations (+20% payroll)', 'Slow integration process'] },
  { name: 'OmniStack',        style: 'megacorp',   desc: 'Cloud-everything platform. Acquires aggressively.',
    shareBase: 22, growthRate: 0.35, failChance: 0.02, canAcquire: true, focus: 'Full-stack cloud services',
    acqPerks: ['Cloud infrastructure access (+5 rep)', 'Platform synergies (projects +10% faster)'],
    acqRisks: ['Bloated org structure (-10 loyalty)', 'Platform lock-in concerns'] },

  // VC-funded aggressors
  { name: 'Apex Digital',      style: 'vc_funded',  desc: 'Well-funded, poaches talent, wins big contracts.',
    shareBase: 12, growthRate: 0.8, failChance: 0.05, canAcquire: true, focus: 'Premium digital agencies',
    acqPerks: ['Premium client relationships (+6 rep)', 'Talented design team'],
    acqRisks: ['High burn rate expectations', 'Some clients may leave'] },
  { name: 'Velocity Labs',     style: 'vc_funded',  desc: 'Move fast, break things. Series B funded.',
    shareBase: 10, growthRate: 1.0, failChance: 0.08, canAcquire: false, focus: 'Rapid MVP development',
    acqPerks: ['Rapid development methodology (+5 rep)', 'Strong engineering culture'],
    acqRisks: ['Technical debt from rushing', 'Team culture friction'] },
  { name: 'ScaleForce',       style: 'vc_funded',  desc: 'Growth-at-all-costs mentality. Burns cash.',
    shareBase: 8,  growthRate: 1.2, failChance: 0.12, canAcquire: false, focus: 'Growth marketing tools',
    acqPerks: ['Growth marketing expertise (+4 rep)', 'Large user base data'],
    acqRisks: ['Unsustainable costs', 'Possible legal issues'] },
  { name: 'Horizon Ventures',  style: 'vc_funded',  desc: 'Enterprise SaaS play. Big sales team.',
    shareBase: 9,  growthRate: 0.7, failChance: 0.07, canAcquire: false, focus: 'Enterprise SaaS',
    acqPerks: ['Enterprise sales playbook (+5 rep)', 'CRM data'],
    acqRisks: ['Long sales cycles', 'High overhead'] },

  // Scrappy underbidders
  { name: 'Grindhaus',        style: 'budget',     desc: 'Budget underbidder. Steals leads, low quality.',
    shareBase: 6,  growthRate: 0.5, failChance: 0.06, canAcquire: false, focus: 'Cheap web development',
    acqPerks: ['Large client list (many small clients)', 'Low overhead operations'],
    acqRisks: ['Quality reputation concerns (-3 rep)', 'Client expectations very low'] },
  { name: 'CutRate Code',     style: 'budget',     desc: 'Offshore team, rock-bottom prices.',
    shareBase: 5,  growthRate: 0.4, failChance: 0.08, canAcquire: false, focus: 'Budget outsourcing',
    acqPerks: ['Offshore team connections', 'Cost-efficient processes'],
    acqRisks: ['Communication challenges', 'Quality standards mismatch'] },

  // Niche startups (acquirable)
  { name: 'PixelCraft AI',    style: 'niche',      desc: 'AI-powered design tools. Small but innovative.',
    shareBase: 3,  growthRate: 0.6, failChance: 0.10, canAcquire: false, focus: 'AI design automation',
    acqPerks: ['AI design technology (+5 rep)', 'Innovative IP portfolio'],
    acqRisks: ['Niche market only', 'Key talent may leave'] },
  { name: 'DataForge',        style: 'niche',      desc: 'Data pipeline specialists. Niche but profitable.',
    shareBase: 3,  growthRate: 0.3, failChance: 0.08, canAcquire: false, focus: 'Data engineering',
    acqPerks: ['Data expertise (+4 rep)', 'Profitable contracts transfer'],
    acqRisks: ['Very specialized team', 'Limited scalability'] },
  { name: 'BotWorks',         style: 'niche',      desc: 'Chatbot and automation startup. Finding PMF.',
    shareBase: 2,  growthRate: 0.7, failChance: 0.15, canAcquire: false, focus: 'Conversational AI',
    acqPerks: ['Chatbot technology (+3 rep)', 'Growing market segment'],
    acqRisks: ['Pre-PMF risk', 'Small client base'] },
  { name: 'Momentum Labs',    style: 'niche',      desc: 'Fast-burn startup. Grows explosively or implodes.',
    shareBase: 4,  growthRate: 1.5, failChance: 0.15, canAcquire: false, focus: 'Rapid prototyping',
    acqPerks: ['Speed methodology (+4 rep)', 'Hot brand recognition'],
    acqRisks: ['Unstable team', 'Might implode during acquisition'] },
  { name: 'TinyML Co',        style: 'niche',      desc: 'Edge AI for IoT devices. Very specialized.',
    shareBase: 2,  growthRate: 0.4, failChance: 0.12, canAcquire: false, focus: 'Edge computing AI',
    acqPerks: ['IoT expertise (+3 rep)', 'Hardware partnerships'],
    acqRisks: ['Very niche market', 'Specialized hardware needs'] },
  { name: 'EthicAI',          style: 'niche',      desc: 'AI ethics consulting. Growing demand.',
    shareBase: 2,  growthRate: 0.5, failChance: 0.10, canAcquire: false, focus: 'AI governance',
    acqPerks: ['Ethics certification (+5 rep)', 'Government contracts access'],
    acqRisks: ['Regulatory complexity', 'Slow-moving clients'] },
  { name: 'NeuraBridge',      style: 'niche',      desc: 'Brain-computer interface startup. Very early stage.',
    shareBase: 2,  growthRate: 0.8, failChance: 0.18, canAcquire: false, focus: 'Neural interfaces',
    acqPerks: ['Cutting-edge research (+6 rep)', 'Patent portfolio'],
    acqRisks: ['Extremely experimental', 'Regulatory uncertainty'] },
  { name: 'GreenBit',         style: 'niche',      desc: 'Sustainable computing startup. Carbon-neutral AI.',
    shareBase: 3,  growthRate: 0.5, failChance: 0.09, canAcquire: false, focus: 'Green AI infrastructure',
    acqPerks: ['ESG credentials (+4 rep)', 'Government grants access'],
    acqRisks: ['Higher operating costs', 'Limited compute budget'] },
];

var _nextCompetitorId = 1;

function initMarket() {
  G.competitors = [];
  G.acquiredStartups = [];
  G.marketEvents = [];

  // Start with 4-10 companies
  var targetCount = randomInt(4, 10);

  var megacorps = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'megacorp'; });
  var vcFunded = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'vc_funded'; });
  var budgets = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'budget'; });
  var niches = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'niche'; });

  // Always at least 1 megacorp and 1 VC-funded
  addCompetitor(randomChoice(megacorps));
  addCompetitor(randomChoice(vcFunded));

  var remaining = targetCount - 2;

  // Add 0-1 more megacorp
  if (remaining > 0 && Math.random() < 0.4) {
    var m2 = randomChoice(megacorps);
    if (addCompetitor(m2)) remaining--;
  }

  // Add 0-1 budget
  if (remaining > 0 && Math.random() < 0.5) {
    if (addCompetitor(randomChoice(budgets))) remaining--;
  }

  // Add 0-1 more VC-funded
  if (remaining > 0 && Math.random() < 0.4) {
    var v2 = randomChoice(vcFunded);
    if (addCompetitor(v2)) remaining--;
  }

  // Fill rest with niches
  var shuffledNiches = niches.slice().sort(function() { return Math.random() - 0.5; });
  for (var i = 0; i < remaining && i < shuffledNiches.length; i++) {
    addCompetitor(shuffledNiches[i]);
  }
}

function addCompetitor(archetype) {
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].name === archetype.name) return false;
  }

  G.competitors.push({
    id: _nextCompetitorId++,
    name: archetype.name,
    style: archetype.style,
    desc: archetype.desc,
    focus: archetype.focus,
    share: archetype.shareBase + randomInt(-2, 2),
    growthRate: archetype.growthRate,
    failChance: archetype.failChance,
    canAcquire: archetype.canAcquire,
    alive: true,
    daysActive: 0,
    acquisitions: 0,
    acqPerks: archetype.acqPerks || [],
    acqRisks: archetype.acqRisks || [],
    scouted: false,
    scoutLevel: 0,
    scoutedTeam: null,
  });
  return true;
}

function getPlayerMarketShare() {
  var totalCompShare = 0;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].alive) totalCompShare += G.competitors[i].share;
  }
  var playerShare = Math.max(1, Math.floor(G.reputation / 3));
  return { player: playerShare, competitors: totalCompShare, total: playerShare + totalCompShare };
}

function tickMarket() {
  var deadCompetitors = [];

  for (var i = 0; i < G.competitors.length; i++) {
    var c = G.competitors[i];
    if (!c.alive) continue;

    c.daysActive += 1;

    // Weekly growth and failure check
    if (c.daysActive % 7 === 0) {
      var growth = c.growthRate * (1 + Math.random() * 0.5);
      c.share = Math.max(1, c.share + growth);

      // Failure check — smaller companies fail more often
      if (Math.random() < c.failChance) {
        c.alive = false;
        deadCompetitors.push(c);
      }

      // Megacorps and VC-funded can acquire niche startups
      if (c.canAcquire && c.daysActive % 14 === 0) {
        var nicheTargets = G.competitors.filter(function(x) {
          return x.alive && (x.style === 'niche' || (x.style === 'budget' && x.share < 4)) && x.id !== c.id;
        });
        if (nicheTargets.length > 0 && Math.random() < 0.35) {
          var target = randomChoice(nicheTargets);
          c.share += Math.floor(target.share * 0.7);
          target.alive = false;
          c.acquisitions += 1;
          var msg = c.name + ' acquired ' + target.name + '! Market consolidating.';
          addLog(msg, 'warn');
          G.overnightEvents.push(msg);
          G.marketEvents.push({ day: G.day, text: msg });
        }
      }
    }
  }

  // Process dead competitors
  for (var j = 0; j < deadCompetitors.length; j++) {
    var dead = deadCompetitors[j];
    var msg2 = dead.name + ' has collapsed! Their clients are flooding the market.';
    addLog(msg2, 'good');
    G.overnightEvents.push(msg2);
    G.marketEvents.push({ day: G.day, text: msg2 });

    if (G.pipeline.length < 5) {
      generatePipelineLeads();
    }
  }

  // Maintain 4-10 alive companies — spawn new ones if below 4
  var aliveCount = G.competitors.filter(function(c) { return c.alive; }).length;
  if (aliveCount < 4 && G.day % 5 === 0) {
    spawnNewCompetitor();
  }

  // Cap at 10 alive — no new spawns if at 10
  // Additional market events: random VC funding rounds, pivots
  if (G.day % 14 === 0 && Math.random() < 0.4) {
    var aliveVc = G.competitors.filter(function(c) { return c.alive && c.style === 'vc_funded'; });
    if (aliveVc.length > 0) {
      var funded = randomChoice(aliveVc);
      funded.share += randomInt(2, 5);
      var fundMsg = funded.name + ' raised a new funding round! They\'re growing faster.';
      G.marketEvents.push({ day: G.day, text: fundMsg });
      G.overnightEvents.push(fundMsg);
    }
  }
}

function spawnNewCompetitor() {
  var existingNames = G.competitors.map(function(c) { return c.name; });
  var available = COMPETITOR_ARCHETYPES.filter(function(a) {
    return existingNames.indexOf(a.name) === -1;
  });
  if (available.length === 0) return;

  var aliveCount = G.competitors.filter(function(c) { return c.alive; }).length;
  if (aliveCount >= 10) return;

  var arch = randomChoice(available);
  addCompetitor(arch);
  var msg = 'New competitor enters the market: ' + arch.name + ' (' + arch.focus + ')';
  addLog(msg, 'warn');
  G.overnightEvents.push(msg);
  G.marketEvents.push({ day: G.day, text: msg });
}

// --- Acquisition System ---

function getAcquirableStartups() {
  return G.competitors.filter(function(c) {
    return c.alive && c.style === 'niche' && c.share <= 8;
  });
}

function getAcquisitionCost(competitor) {
  var baseCost = 50000;
  var shareCost = competitor.share * 5000;
  var ageCost = competitor.daysActive * 200;
  return Math.max(baseCost, Math.round(baseCost + shareCost + ageCost));
}

function acquireStartup(competitorId) {
  var target = null;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].id === competitorId) { target = G.competitors[i]; break; }
  }
  if (!target || !target.alive) return false;

  var cost = getAcquisitionCost(target);
  if (G.cash < cost) {
    addLog('Can\'t afford to acquire ' + target.name + '. Need $' + cost.toLocaleString() + '.', 'bad');
    return false;
  }

  G.cash -= cost;
  target.alive = false;

  G.reputation += Math.floor(target.share * 2);
  var bonusRep = Math.floor(target.share * 1.5);
  G.reputation += bonusRep;

  G.acquiredStartups.push({
    name: target.name,
    focus: target.focus,
    day: G.day,
    cost: cost,
    shareGained: target.share,
  });

  var msg = 'Acquired ' + target.name + '! +' + (Math.floor(target.share * 2) + bonusRep) + ' rep. Their ' + target.focus + ' expertise is now yours.';
  addLog(msg, 'good');
  G.overnightEvents.push(msg);

  return true;
}
