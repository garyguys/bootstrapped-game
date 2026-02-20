/* ============================================
   market.js — Competitors, Market Share, Acquisitions
   ============================================ */

var COMPETITOR_ARCHETYPES = [
  // Large established players
  { name: 'Nexus AI',          style: 'megacorp',   desc: 'Enterprise AI giant. Massive budget, slow to pivot.',
    shareBase: 25, growthRate: 0.3, failChance: 0.01, canAcquire: true, focus: 'Enterprise AI solutions' },
  { name: 'Anthropic Systems', style: 'megacorp',   desc: 'Leading AI safety research lab turned product company.',
    shareBase: 20, growthRate: 0.4, failChance: 0.01, canAcquire: true, focus: 'Safe AI infrastructure' },
  { name: 'OmniStack',        style: 'megacorp',   desc: 'Cloud-everything platform. Acquires aggressively.',
    shareBase: 22, growthRate: 0.35, failChance: 0.02, canAcquire: true, focus: 'Full-stack cloud services' },

  // VC-funded aggressors
  { name: 'Apex Digital',      style: 'vc_funded',  desc: 'Well-funded, poaches talent, wins big contracts.',
    shareBase: 12, growthRate: 0.8, failChance: 0.05, canAcquire: true, focus: 'Premium digital agencies' },
  { name: 'Velocity Labs',     style: 'vc_funded',  desc: 'Move fast, break things. Series B funded.',
    shareBase: 10, growthRate: 1.0, failChance: 0.08, canAcquire: false, focus: 'Rapid MVP development' },
  { name: 'ScaleForce',       style: 'vc_funded',  desc: 'Growth-at-all-costs mentality. Burns cash.',
    shareBase: 8,  growthRate: 1.2, failChance: 0.12, canAcquire: false, focus: 'Growth marketing tools' },

  // Scrappy underbidders
  { name: 'Grindhaus',        style: 'budget',     desc: 'Budget underbidder. Steals leads, low quality.',
    shareBase: 6,  growthRate: 0.5, failChance: 0.06, canAcquire: false, focus: 'Cheap web development' },
  { name: 'CutRate Code',     style: 'budget',     desc: 'Offshore team, rock-bottom prices.',
    shareBase: 5,  growthRate: 0.4, failChance: 0.08, canAcquire: false, focus: 'Budget outsourcing' },

  // Niche startups (acquirable)
  { name: 'PixelCraft AI',    style: 'niche',      desc: 'AI-powered design tools. Small but innovative.',
    shareBase: 3,  growthRate: 0.6, failChance: 0.10, canAcquire: false, focus: 'AI design automation' },
  { name: 'DataForge',        style: 'niche',      desc: 'Data pipeline specialists. Niche but profitable.',
    shareBase: 3,  growthRate: 0.3, failChance: 0.08, canAcquire: false, focus: 'Data engineering' },
  { name: 'BotWorks',         style: 'niche',      desc: 'Chatbot and automation startup. Finding PMF.',
    shareBase: 2,  growthRate: 0.7, failChance: 0.15, canAcquire: false, focus: 'Conversational AI' },
  { name: 'Momentum Labs',    style: 'niche',      desc: 'Fast-burn startup. Grows explosively or implodes.',
    shareBase: 4,  growthRate: 1.5, failChance: 0.15, canAcquire: false, focus: 'Rapid prototyping' },
  { name: 'TinyML Co',        style: 'niche',      desc: 'Edge AI for IoT devices. Very specialized.',
    shareBase: 2,  growthRate: 0.4, failChance: 0.12, canAcquire: false, focus: 'Edge computing AI' },
  { name: 'EthicAI',          style: 'niche',      desc: 'AI ethics consulting. Growing demand.',
    shareBase: 2,  growthRate: 0.5, failChance: 0.10, canAcquire: false, focus: 'AI governance' },
];

var _nextCompetitorId = 1;

function initMarket() {
  G.competitors = [];
  G.acquiredStartups = [];
  G.marketEvents = [];

  // Start with 4-5 competitors: 1 megacorp, 1 vc-funded, 1 budget, 1-2 niche
  var megacorps = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'megacorp'; });
  var vcFunded = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'vc_funded'; });
  var budgets = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'budget'; });
  var niches = COMPETITOR_ARCHETYPES.filter(function(a) { return a.style === 'niche'; });

  addCompetitor(randomChoice(megacorps));
  addCompetitor(randomChoice(vcFunded));
  addCompetitor(randomChoice(budgets));
  addCompetitor(randomChoice(niches));
  if (Math.random() < 0.5) {
    addCompetitor(randomChoice(niches));
  }
}

function addCompetitor(archetype) {
  // Check we don't already have this one
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].name === archetype.name) return;
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
  });
}

function getPlayerMarketShare() {
  // Player share = based on rep and revenue relative to competitors
  var totalCompShare = 0;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].alive) totalCompShare += G.competitors[i].share;
  }
  // Player share is reputation-driven, starts tiny
  var playerShare = Math.max(1, Math.floor(G.reputation / 3));
  // Total pie = player + competitors
  return { player: playerShare, competitors: totalCompShare, total: playerShare + totalCompShare };
}

function tickMarket() {
  var deadCompetitors = [];

  for (var i = 0; i < G.competitors.length; i++) {
    var c = G.competitors[i];
    if (!c.alive) continue;

    c.daysActive += 1;

    // Weekly growth tick (every 7 days)
    if (c.daysActive % 7 === 0) {
      // Growth
      var growth = c.growthRate * (1 + Math.random() * 0.5);
      c.share = Math.max(1, c.share + growth);

      // Failure check
      if (Math.random() < c.failChance) {
        c.alive = false;
        deadCompetitors.push(c);
      }

      // Megacorps can acquire niche startups
      if (c.canAcquire && c.daysActive % 21 === 0) {
        var nicheTargets = G.competitors.filter(function(x) {
          return x.alive && x.style === 'niche' && x.id !== c.id;
        });
        if (nicheTargets.length > 0 && Math.random() < 0.3) {
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

  // Handle dead competitors
  for (var j = 0; j < deadCompetitors.length; j++) {
    var dead = deadCompetitors[j];
    var msg = dead.name + ' has collapsed! Their clients are flooding the market.';
    addLog(msg, 'good');
    G.overnightEvents.push(msg);
    G.marketEvents.push({ day: G.day, text: msg });

    // Boost player pipeline
    if (G.pipeline.length < 5) {
      generatePipelineLeads();
    }
  }

  // Periodically spawn new competitors to replace dead ones
  var aliveCount = G.competitors.filter(function(c) { return c.alive; }).length;
  if (aliveCount < 3 && G.day % 7 === 0) {
    spawnNewCompetitor();
  }
}

function spawnNewCompetitor() {
  // Pick an archetype not already in the market
  var existingNames = G.competitors.map(function(c) { return c.name; });
  var available = COMPETITOR_ARCHETYPES.filter(function(a) {
    return existingNames.indexOf(a.name) === -1;
  });
  if (available.length === 0) return;

  var arch = randomChoice(available);
  addCompetitor(arch);
  var msg = 'New competitor enters the market: ' + arch.name + ' (' + arch.focus + ')';
  addLog(msg, 'warn');
  G.overnightEvents.push(msg);
  G.marketEvents.push({ day: G.day, text: msg });
}

// --- Acquisition System (player acquires startups) ---

function getAcquirableStartups() {
  return G.competitors.filter(function(c) {
    return c.alive && c.style === 'niche' && c.share <= 8;
  });
}

function getAcquisitionCost(competitor) {
  // Cost based on their market share and days active
  return Math.round(competitor.share * 500 + competitor.daysActive * 20);
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

  // Gain their market share
  G.reputation += Math.floor(target.share * 2);

  // Gain a bonus based on their focus
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
