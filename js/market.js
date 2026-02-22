/* ============================================
   market.js — Competitors, Market Share, Acquisitions
   Now 4-10 companies. Weekly failures/acquisitions.
   Renamed Anthropic Systems to Synthex Systems.
   ============================================ */

var COMPETITOR_ARCHETYPES = [
  // Large established players
  { name: 'Nexus AI',          style: 'megacorp',   desc: 'Enterprise AI giant. Massive budget, slow to pivot.',
    shareBase: 200, growthRate: 0.3, failChance: 0.01, canAcquire: true, focus: 'Enterprise AI solutions',
    acqPerks: ['Access to enterprise client list (+8 rep)', 'Established sales pipeline (+3 leads)'],
    acqRisks: ['Major culture clash (-15 loyalty to team)', 'Legacy tech debt (1 project slows down)'] },
  { name: 'Synthex Systems',   style: 'megacorp',   desc: 'Leading AI safety research lab turned product company.',
    shareBase: 175, growthRate: 0.4, failChance: 0.01, canAcquire: true, focus: 'Safe AI infrastructure',
    acqPerks: ['Top-tier research talent (+10 rep)', 'Safety certification prestige'],
    acqRisks: ['Expensive team expectations (+20% payroll)', 'Slow integration process'] },
  { name: 'OmniStack',        style: 'megacorp',   desc: 'Cloud-everything platform. Acquires aggressively.',
    shareBase: 185, growthRate: 0.35, failChance: 0.02, canAcquire: true, focus: 'Full-stack cloud services',
    acqPerks: ['Cloud infrastructure access (+5 rep)', 'Platform synergies (projects +10% faster)'],
    acqRisks: ['Bloated org structure (-10 loyalty)', 'Platform lock-in concerns'] },

  // VC-funded aggressors
  { name: 'Apex Digital',      style: 'vc_funded',  desc: 'Well-funded, poaches talent, wins big contracts.',
    shareBase: 90, growthRate: 0.8, failChance: 0.05, canAcquire: true, focus: 'Premium digital agencies',
    acqPerks: ['Premium client relationships (+6 rep)', 'Talented design team'],
    acqRisks: ['High burn rate expectations', 'Some clients may leave'] },
  { name: 'Velocity Labs',     style: 'vc_funded',  desc: 'Move fast, break things. Series B funded.',
    shareBase: 75, growthRate: 1.0, failChance: 0.08, canAcquire: false, focus: 'Rapid MVP development',
    acqPerks: ['Rapid development methodology (+5 rep)', 'Strong engineering culture'],
    acqRisks: ['Technical debt from rushing', 'Team culture friction'] },
  { name: 'ScaleForce',       style: 'vc_funded',  desc: 'Growth-at-all-costs mentality. Burns cash.',
    shareBase: 65, growthRate: 1.2, failChance: 0.12, canAcquire: false, focus: 'Growth marketing tools',
    acqPerks: ['Growth marketing expertise (+4 rep)', 'Large user base data'],
    acqRisks: ['Unsustainable costs', 'Possible legal issues'] },
  { name: 'Horizon Ventures',  style: 'vc_funded',  desc: 'Enterprise SaaS play. Big sales team.',
    shareBase: 70, growthRate: 0.7, failChance: 0.07, canAcquire: false, focus: 'Enterprise SaaS',
    acqPerks: ['Enterprise sales playbook (+5 rep)', 'CRM data'],
    acqRisks: ['Long sales cycles', 'High overhead'] },

  // Scrappy underbidders
  { name: 'Grindhaus',        style: 'budget',     desc: 'Budget underbidder. Steals leads, low quality.',
    shareBase: 40, growthRate: 0.5, failChance: 0.06, canAcquire: false, focus: 'Cheap web development',
    acqPerks: ['Large client list (many small clients)', 'Low overhead operations'],
    acqRisks: ['Quality reputation concerns (-3 rep)', 'Client expectations very low'] },
  { name: 'CutRate Code',     style: 'budget',     desc: 'Offshore team, rock-bottom prices.',
    shareBase: 35, growthRate: 0.4, failChance: 0.08, canAcquire: false, focus: 'Budget outsourcing',
    acqPerks: ['Offshore team connections', 'Cost-efficient processes'],
    acqRisks: ['Communication challenges', 'Quality standards mismatch'] },

  // Niche startups (acquirable)
  { name: 'PixelCraft AI',    style: 'niche',      desc: 'AI-powered design tools. Small but innovative.',
    shareBase: 20, growthRate: 0.6, failChance: 0.10, canAcquire: false, focus: 'AI design automation',
    acqPerks: ['AI design technology (+5 rep)', 'Innovative IP portfolio'],
    acqRisks: ['Niche market only', 'Key talent may leave'] },
  { name: 'DataForge',        style: 'niche',      desc: 'Data pipeline specialists. Niche but profitable.',
    shareBase: 18, growthRate: 0.3, failChance: 0.08, canAcquire: false, focus: 'Data engineering',
    acqPerks: ['Data expertise (+4 rep)', 'Profitable contracts transfer'],
    acqRisks: ['Very specialized team', 'Limited scalability'] },
  { name: 'BotWorks',         style: 'niche',      desc: 'Chatbot and automation startup. Finding PMF.',
    shareBase: 14, growthRate: 0.7, failChance: 0.15, canAcquire: false, focus: 'Conversational AI',
    acqPerks: ['Chatbot technology (+3 rep)', 'Growing market segment'],
    acqRisks: ['Pre-PMF risk', 'Small client base'] },
  { name: 'Momentum Labs',    style: 'niche',      desc: 'Fast-burn startup. Grows explosively or implodes.',
    shareBase: 22, growthRate: 1.5, failChance: 0.15, canAcquire: false, focus: 'Rapid prototyping',
    acqPerks: ['Speed methodology (+4 rep)', 'Hot brand recognition'],
    acqRisks: ['Unstable team', 'Might implode during acquisition'] },
  { name: 'TinyML Co',        style: 'niche',      desc: 'Edge AI for IoT devices. Very specialized.',
    shareBase: 12, growthRate: 0.4, failChance: 0.12, canAcquire: false, focus: 'Edge computing AI',
    acqPerks: ['IoT expertise (+3 rep)', 'Hardware partnerships'],
    acqRisks: ['Very niche market', 'Specialized hardware needs'] },
  { name: 'EthicAI',          style: 'niche',      desc: 'AI ethics consulting. Growing demand.',
    shareBase: 15, growthRate: 0.5, failChance: 0.10, canAcquire: false, focus: 'AI governance',
    acqPerks: ['Ethics certification (+5 rep)', 'Government contracts access'],
    acqRisks: ['Regulatory complexity', 'Slow-moving clients'] },
  { name: 'NeuraBridge',      style: 'niche',      desc: 'Brain-computer interface startup. Very early stage.',
    shareBase: 13, growthRate: 0.8, failChance: 0.18, canAcquire: false, focus: 'Neural interfaces',
    acqPerks: ['Cutting-edge research (+6 rep)', 'Patent portfolio'],
    acqRisks: ['Extremely experimental', 'Regulatory uncertainty'] },
  { name: 'GreenBit',         style: 'niche',      desc: 'Sustainable computing startup. Carbon-neutral AI.',
    shareBase: 16, growthRate: 0.5, failChance: 0.09, canAcquire: false, focus: 'Green AI infrastructure',
    acqPerks: ['ESG credentials (+4 rep)', 'Government grants access'],
    acqRisks: ['Higher operating costs', 'Limited compute budget'] },
  // v0.09: More AI-focused niche archetypes
  { name: 'SynthMind',        style: 'niche',      desc: 'Synthetic data and LLM fine-tuning startup.',
    shareBase: 18, growthRate: 0.7, failChance: 0.12, canAcquire: false, focus: 'Synthetic data & LLMs',
    acqPerks: ['LLM expertise (+5 rep)', 'Training data pipeline'],
    acqRisks: ['GPU cost dependency', 'Rapidly shifting landscape'] },
  { name: 'CodePilot AI',     style: 'niche',      desc: 'AI-powered developer tools. Coding copilot for teams.',
    shareBase: 20, growthRate: 0.9, failChance: 0.11, canAcquire: false, focus: 'AI developer tools',
    acqPerks: ['Dev productivity tech (+5 rep)', 'Strong developer community'],
    acqRisks: ['Crowded market', 'Big tech competitors'] },
  { name: 'VisionArc',        style: 'niche',      desc: 'Computer vision for retail and logistics.',
    shareBase: 15, growthRate: 0.6, failChance: 0.13, canAcquire: false, focus: 'Computer vision',
    acqPerks: ['Vision AI IP (+4 rep)', 'Retail partnerships'],
    acqRisks: ['Hardware dependency', 'Privacy regulations'] },
  { name: 'AgentFlow',        style: 'niche',      desc: 'Autonomous AI agents for business automation.',
    shareBase: 17, growthRate: 1.1, failChance: 0.14, canAcquire: false, focus: 'AI agent orchestration',
    acqPerks: ['Agent framework tech (+6 rep)', 'Enterprise pilot contracts'],
    acqRisks: ['Immature technology', 'High customer expectations'] },
];

// Legacy counter removed — now using uid() from state.js

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

  var share = archetype.shareBase + randomInt(-2, 2);
  var products = (typeof generateCompetitorProducts === 'function') ? generateCompetitorProducts(archetype.style) : [];
  G.competitors.push({
    id: uid('comp'),
    name: archetype.name,
    style: archetype.style,
    desc: archetype.desc,
    focus: archetype.focus,
    share: share,
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
    scoutProgress: 0,
    scoutedTeam: null,
    products: products,
    reputation: Math.round(share * 4),
  });
  return true;
}

function getPlayerMarketShare() {
  var totalCompShare = 0;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].alive) totalCompShare += G.competitors[i].share;
  }
  // Reputation alone is very slow (÷12 instead of ÷3)
  // Products provide meaningful boosts via getProductMarketBonus()
  var repShare = Math.max(0, Math.floor(G.reputation / 12));
  var productBonus = typeof getProductMarketBonus === 'function' ? getProductMarketBonus() : 0;
  var playerShare = Math.max(1, repShare + productBonus);
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

  // Maintain 5-10 alive companies — spawn new ones if below 5 (v0.09: more frequent)
  var aliveCount = G.competitors.filter(function(c) { return c.alive; }).length;
  if (aliveCount < 5 && G.day % 4 === 0) {
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

  // v0.09: 60% bias toward AI/niche archetypes
  var arch;
  var aiNiche = available.filter(function(a) { return a.style === 'niche'; });
  if (aiNiche.length > 0 && Math.random() < 0.6) {
    arch = randomChoice(aiNiche);
  } else {
    arch = randomChoice(available);
  }
  addCompetitor(arch);
  var msg = 'New competitor enters the market: ' + arch.name + ' (' + arch.focus + ')';
  addLog(msg, 'warn');
  G.overnightEvents.push(msg);
  G.marketEvents.push({ day: G.day, text: msg });
}

// --- Acquisition System ---

function getAcquirableStartups() {
  var playerShare = getPlayerMarketShare();
  return G.competitors.filter(function(c) {
    if (!c.alive) return false;
    if (c.share < 10) return true;
    return c.share < playerShare;
  });
}

function getAcquisitionCost(competitor) {
  // Quadratic scaling: niche ~$50-75k, budget ~$150k, VC ~$500k, megacorp ~$3M
  var share = competitor.share || 1;
  var ageCost = (competitor.daysActive || 0) * 100;
  return Math.round(80 * share * share + 40000 + ageCost);
}

// --- Multi-Step Acquisition Process ---

// Generate team for due diligence if not already scouted
function _generateAcqTeam(comp) {
  comp.scoutedTeam = [];
  var teamSize = Math.min(10, Math.max(2, Math.floor(comp.share / 2.5)));
  for (var j = 0; j < teamSize; j++) {
    var member = generateCandidate();
    if (comp.style === 'megacorp') {
      member.technical = Math.min(10, member.technical + 3);
      member.communication = Math.min(10, member.communication + 2);
      var megaSalary;
      if (member.technical >= 8) megaSalary = randomInt(13000, 20000);
      else if (member.technical >= 6) megaSalary = randomInt(5000, 13000);
      else megaSalary = randomInt(1000, 5000);
      member.salary = Math.round(megaSalary / 100) * 100;
      member.askingSalary = member.salary;
    } else if (comp.style === 'vc_funded') {
      member.technical = Math.min(10, member.technical + 1);
      var vcSalary = randomInt(1000, 4000);
      member.salary = Math.round(vcSalary / 100) * 100;
      member.askingSalary = member.salary;
    }
    member.willingToLeave = Math.random() < (comp.style === 'megacorp' ? 0.3 : comp.style === 'vc_funded' ? 0.5 : 0.7);
    member.scoutLevel = 2;
    comp.scoutedTeam.push(member);
  }
}

// Open the acquisition process modal (Step 1: Products)
function showAcquisitionProcessModal(competitorId) {
  var target = null;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].id === competitorId) { target = G.competitors[i]; break; }
  }
  if (!target || !target.alive) return;

  var cost = getAcquisitionCost(target);
  if (G.cash < cost) {
    addLog('Can\'t afford to acquire ' + target.name + '. Need $' + cost.toLocaleString() + '.', 'bad');
    return;
  }

  // Due diligence: generate team if not scouted
  if (!target.scoutedTeam || target.scoutedTeam.length === 0) {
    _generateAcqTeam(target);
  }

  _showAcqStep1(target);
}

// Step 1: Company overview + product selection
function _showAcqStep1(target) {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');
  var cost = getAcquisitionCost(target);

  title.textContent = 'ACQUIRE ' + target.name.toUpperCase();

  var styleLabels = { megacorp: 'MEGACORP', vc_funded: 'VC-FUNDED', budget: 'BUDGET', niche: 'NICHE' };
  var html = '<div style="margin-bottom:8px;">' +
    '<span style="color:var(--grey)">' + (styleLabels[target.style] || target.style) + '</span>' +
    ' &mdash; Share: ' + Math.round(target.share) + ' &mdash; Focus: ' + escHtml(target.focus) +
    '</div>' +
    '<div style="color:var(--amber);margin-bottom:12px;">Acquisition Cost: <strong>$' + cost.toLocaleString() + '</strong></div>';

  var hasProducts = target.products && target.products.length > 0;
  if (hasProducts) {
    html += '<div style="color:var(--cyan);margin-bottom:6px;">SELECT PRODUCTS TO ACQUIRE:</div>';
    for (var i = 0; i < target.products.length; i++) {
      var p = target.products[i];
      var scopeLabel = p.scope.charAt(0).toUpperCase() + p.scope.slice(1);
      html += '<label style="display:block;padding:5px 4px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);">' +
        '<input type="checkbox" checked data-acq-product="' + i + '" style="margin-right:8px;">' +
        escHtml(p.name) + ' <span style="color:var(--grey)">(' + scopeLabel + ', Q:' + (p.quality || 0) + '%)</span>' +
        '</label>';
    }
  } else {
    html += '<div style="color:var(--grey);margin-bottom:8px;">No products to acquire.</div>';
  }

  desc.innerHTML = html;
  choices.innerHTML = '';

  var hasTeam = target.scoutedTeam && target.scoutedTeam.length > 0;
  if (hasTeam) {
    var btnNext = document.createElement('button');
    btnNext.className = 'btn btn-primary';
    btnNext.textContent = 'NEXT \u2192 TEAM';
    btnNext.onclick = function() {
      var selectedProducts = [];
      var checks = desc.querySelectorAll('input[data-acq-product]');
      for (var c = 0; c < checks.length; c++) {
        if (checks[c].checked) selectedProducts.push(parseInt(checks[c].getAttribute('data-acq-product')));
      }
      _showAcqStep2(target, selectedProducts);
    };
    choices.appendChild(btnNext);
  } else {
    var btnConfirm = document.createElement('button');
    btnConfirm.className = 'btn btn-primary';
    btnConfirm.textContent = 'CONFIRM ACQUISITION';
    btnConfirm.onclick = function() {
      var selectedProducts = [];
      var checks = desc.querySelectorAll('input[data-acq-product]');
      for (var c = 0; c < checks.length; c++) {
        if (checks[c].checked) selectedProducts.push(parseInt(checks[c].getAttribute('data-acq-product')));
      }
      modal.style.display = 'none';
      executeAcquisition(target, selectedProducts, []);
    };
    choices.appendChild(btnConfirm);
  }

  modal.style.display = 'flex';
}

// Step 2: Team member selection
function _showAcqStep2(target, selectedProducts) {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = 'ACQUIRE ' + target.name.toUpperCase() + ' \u2014 TEAM';

  var html = '<div style="color:var(--cyan);margin-bottom:6px;">SELECT TEAM MEMBERS TO HIRE:</div>' +
    '<div style="color:var(--grey);font-size:0.7rem;margin-bottom:8px;">Selected members will be added to your candidate pool for negotiation.</div>';

  for (var i = 0; i < target.scoutedTeam.length; i++) {
    var emp = target.scoutedTeam[i];
    var willing = emp.willingToLeave !== false;
    var opacity = willing ? '1' : '0.5';
    var willingText = willing ? ' <span style="color:var(--green);font-size:0.65rem;">Available</span>' : ' <span style="color:var(--red);font-size:0.65rem;">Reluctant</span>';
    html += '<label style="display:block;padding:5px 4px;cursor:' + (willing ? 'pointer' : 'default') + ';border-bottom:1px solid rgba(255,255,255,0.05);opacity:' + opacity + ';">' +
      '<input type="checkbox"' + (willing ? ' checked' : ' disabled') + ' data-acq-team="' + i + '" style="margin-right:8px;">' +
      escHtml(emp.name) + ' <span style="color:var(--grey)">(' + emp.levelName + ' ' + emp.role.name + ')</span> ' +
      'TEC:' + emp.technical + ' COM:' + emp.communication + ' REL:' + emp.reliability +
      ' <span style="color:var(--amber)">$' + emp.salary.toLocaleString() + '/wk</span>' +
      willingText +
      '</label>';
  }

  desc.innerHTML = html;
  choices.innerHTML = '';

  var btnConfirm = document.createElement('button');
  btnConfirm.className = 'btn btn-primary';
  btnConfirm.textContent = 'CONFIRM ACQUISITION';
  btnConfirm.onclick = function() {
    var selectedTeam = [];
    var checks = desc.querySelectorAll('input[data-acq-team]');
    for (var c = 0; c < checks.length; c++) {
      if (checks[c].checked) selectedTeam.push(parseInt(checks[c].getAttribute('data-acq-team')));
    }
    modal.style.display = 'none';
    executeAcquisition(target, selectedProducts, selectedTeam);
  };
  choices.appendChild(btnConfirm);

  var btnBack = document.createElement('button');
  btnBack.className = 'btn btn-secondary';
  btnBack.textContent = '\u2190 BACK';
  btnBack.onclick = function() { _showAcqStep1(target); };
  choices.appendChild(btnBack);

  modal.style.display = 'flex';
}

// Execute the acquisition with selected products and team
function executeAcquisition(target, selectedProductIndices, selectedTeamIndices) {
  var cost = getAcquisitionCost(target);
  if (G.cash < cost) {
    addLog('Can\'t afford to acquire ' + target.name + '.', 'bad');
    return;
  }

  // Spend resources
  G.cash -= cost;
  spendAP(AP_COSTS.acquire);
  spendEnergy(ENERGY_COSTS.acquire);
  target.alive = false;
  if (typeof recordTransaction === 'function') {
    recordTransaction('expense', 'acquisition', cost, 'Acquired ' + target.name);
  }

  // Rep gain = 1/3 of competitor's reputation
  var targetRep = target.reputation || Math.round(target.share * 4);
  var repGain = Math.round(targetRep / 3);
  G.reputation += repGain;

  // Transfer selected products
  var transferredProducts = [];
  if (target.products && selectedProductIndices.length > 0) {
    for (var j = 0; j < selectedProductIndices.length; j++) {
      var idx = selectedProductIndices[j];
      if (idx < 0 || idx >= target.products.length) continue;
      var cp = target.products[idx];
      var scope = OWN_PRODUCT_SCOPES ? OWN_PRODUCT_SCOPES.find(function(s) { return s.id === cp.scope; }) : null;
      var transferredProduct = {
        id: G.nextProductId++,
        name: cp.name + ' (acq.)',
        type: cp.type,
        typeName: cp.name,
        scope: cp.scope,
        scopeName: scope ? scope.name : cp.scope,
        investment: 0,
        devDaysRequired: 0,
        devDaysWorked: 0,
        apInvested: 0,
        apRequired: 0,
        quality: Math.round((cp.quality || 50) * 0.8),
        maxRevenue: scope ? randomInt(scope.revenueMin, scope.revenueMax) : 200,
        status: 'live',
        assignedTeam: [],
        daysLive: 1,
        totalRevenue: 0,
        marketInterest: 50,
      };
      G.ownedProducts.push(transferredProduct);
      transferredProducts.push(transferredProduct.name);
      addLog('Acquired product: "' + transferredProduct.name + '" (Quality: ' + transferredProduct.quality + '%)', 'good');
    }
  }

  // Add selected team members to candidates
  var hiredTeam = [];
  if (target.scoutedTeam && selectedTeamIndices.length > 0) {
    for (var k = 0; k < selectedTeamIndices.length; k++) {
      var ti = selectedTeamIndices[k];
      if (ti < 0 || ti >= target.scoutedTeam.length) continue;
      var member = target.scoutedTeam[ti];
      member.skillsRevealed = 2;
      member.isBeingPoached = true;
      member.patienceUsed = 0;
      member.patience = randomInt(2, 4);
      member.salary = Math.round(member.salary * 0.9 / 25) * 25;
      member.askingSalary = member.salary;
      G.candidates.push(member);
      hiredTeam.push(member);
      addLog(member.name + ' added to candidates from ' + target.name + ' acquisition.', 'good');
    }
  }

  G.acquiredStartups.push({
    name: target.name,
    focus: target.focus,
    day: G.day,
    cost: cost,
    shareGained: target.share,
  });

  var msg = 'Acquired ' + target.name + '! +' + repGain + ' rep.';
  if (transferredProducts.length > 0) msg += ' Gained ' + transferredProducts.length + ' product(s).';
  if (hiredTeam.length > 0) msg += ' ' + hiredTeam.length + ' team member(s) available for hire.';
  msg += ' Their ' + target.focus + ' expertise is now yours.';
  addLog(msg, 'good');
  G.overnightEvents.push(msg);

  showActionConfirmation(msg, 'good', function() {
    if (hiredTeam.length > 0) {
      G._acqHireQueue = hiredTeam;
      showAcqTeamList(target.name);
    }
    afterAction();
  });
}

// v0.16: Show acquired team list for sequential negotiation
function showAcqTeamList(companyName) {
  if (!G._acqHireQueue || G._acqHireQueue.length === 0) return;

  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = 'ACQUIRED TEAM \u2014 ' + companyName.toUpperCase();

  var html = '<div style="color:var(--cyan);margin-bottom:8px;">Negotiate with acquired team members:</div>';
  for (var i = 0; i < G._acqHireQueue.length; i++) {
    var emp = G._acqHireQueue[i];
    var alreadyHired = G.team.some(function(t) { return t.id === emp.id; });
    var status = alreadyHired ? '<span style="color:var(--green)">HIRED</span>' : '<span style="color:var(--amber)">In candidates</span>';
    html += '<div class="negotiation-row">' +
      '<span>' + escHtml(emp.name) + ' (' + emp.levelName + ' ' + emp.role.name + ')</span>' +
      '<span>' + status + '</span></div>';
  }

  desc.innerHTML = html;
  choices.innerHTML = '';

  // Add NEGOTIATE buttons for un-hired members
  for (var j = 0; j < G._acqHireQueue.length; j++) {
    var member = G._acqHireQueue[j];
    var isHired = G.team.some(function(t) { return t.id === member.id; });
    if (isHired) continue;

    var btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-small';
    btn.textContent = 'NEGOTIATE \u2014 ' + member.name;
    btn.onclick = (function(m, cName) {
      return function() {
        modal.style.display = 'none';
        if (typeof showNegotiationModal === 'function') {
          showNegotiationModal(m);
        }
        // Poll for negotiation modal close, then re-show team list
        var negModal = document.getElementById('negotiation-modal');
        var pollId = setInterval(function() {
          if (!negModal || negModal.style.display === 'none' || negModal.style.display === '') {
            clearInterval(pollId);
            // Re-show team list if more members remain
            var remaining = (G._acqHireQueue || []).filter(function(q) {
              return !G.team.some(function(t) { return t.id === q.id; });
            });
            if (remaining.length > 0) {
              showAcqTeamList(cName);
            } else {
              G._acqHireQueue = null;
            }
          }
        }, 200);
      };
    })(member, companyName);
    choices.appendChild(btn);
  }

  var btnDone = document.createElement('button');
  btnDone.className = 'btn btn-secondary';
  btnDone.textContent = 'DONE';
  btnDone.onclick = function() {
    modal.style.display = 'none';
    G._acqHireQueue = null;
  };
  choices.appendChild(btnDone);

  modal.style.display = 'flex';
}

// --- Strategic Partnership ---
function getPartnershipCost(competitor) {
  return Math.round(competitor.share * 1000 + 5000);
}

function getPartnershipChance(competitor) {
  var baseChance = { niche: 70, budget: 60, vc_funded: 45, megacorp: 30 };
  var chance = baseChance[competitor.style] || 50;
  // +0.5% per player reputation, capped at +20%
  chance += Math.min(20, Math.round(G.reputation * 0.5));
  return Math.min(95, chance);
}

function canPartnerWith(competitor) {
  if (competitor.isPartner) return false;
  if (competitor.partnerExpiredDay && G.day - competitor.partnerExpiredDay < 7) return false;
  return true;
}

function getPartnershipCooldown(competitor) {
  if (!competitor.partnerExpiredDay) return 0;
  var remaining = 7 - (G.day - competitor.partnerExpiredDay);
  return remaining > 0 ? remaining : 0;
}

// Show partnership preview + attempt modal
function showPartnershipPreview(competitorId) {
  var target = null;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].id === competitorId) { target = G.competitors[i]; break; }
  }
  if (!target || !target.alive) return;

  var cost = getPartnershipCost(target);
  var targetRep = target.reputation || Math.round(target.share * 4);
  var repGain = Math.max(3, Math.round(targetRep / 5));

  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = 'PARTNERSHIP — ' + target.name.toUpperCase();

  var html = '<div style="color:var(--cyan);margin-bottom:8px;">PARTNERSHIP BENEFITS:</div>' +
    '<div class="negotiation-row"><span>Mutual no-poach agreement</span><span style="color:var(--green)">14 days</span></div>' +
    '<div class="negotiation-row"><span>Reputation gain</span><span style="color:var(--green)">+' + repGain + ' rep</span></div>' +
    '<div class="negotiation-row"><span>Market synergy</span><span style="color:var(--green)">Shared presence</span></div>' +
    '<div style="margin-top:10px;color:var(--amber);margin-bottom:4px;">COST: $' + cost.toLocaleString() + '</div>' +
    '<div style="color:var(--red);font-size:0.7rem;margin-top:8px;">Partnership attempts are not guaranteed. Failed attempts cost no money but lose 3.5% of your reputation.</div>';

  desc.innerHTML = html;
  choices.innerHTML = '';

  var btnAttempt = document.createElement('button');
  btnAttempt.className = 'btn btn-primary';
  btnAttempt.textContent = 'ATTEMPT PARTNERSHIP';
  btnAttempt.disabled = G.cash < cost || !canAct(2);
  btnAttempt.onclick = function() {
    modal.style.display = 'none';
    attemptPartnership(competitorId);
  };
  choices.appendChild(btnAttempt);

  var btnCancel = document.createElement('button');
  btnCancel.className = 'btn btn-secondary';
  btnCancel.textContent = 'CANCEL';
  btnCancel.onclick = function() { modal.style.display = 'none'; };
  choices.appendChild(btnCancel);

  modal.style.display = 'flex';
}

function attemptPartnership(competitorId) {
  var target = null;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].id === competitorId) { target = G.competitors[i]; break; }
  }
  if (!target || !target.alive) return false;

  if (!canPartnerWith(target)) {
    addLog('Cannot partner with ' + target.name + ' right now.', 'warn');
    return false;
  }

  var cost = getPartnershipCost(target);
  if (G.cash < cost) {
    addLog('Can\'t afford partnership with ' + target.name + '.', 'bad');
    return false;
  }

  spendAP(2);
  spendEnergy(10);

  var chance = getPartnershipChance(target);
  var roll = Math.random() * 100;

  if (roll < chance) {
    // Success
    G.cash -= cost;
    if (typeof recordTransaction === 'function') {
      recordTransaction('expense', 'operations', cost, 'Partnership: ' + target.name);
    }
    var targetRep = target.reputation || Math.round(target.share * 4);
    var repGain = Math.max(3, Math.round(targetRep / 5));
    G.reputation += repGain;
    target.isPartner = true;
    target.partnerDay = G.day;
    addLog('Strategic partnership with ' + target.name + '! +' + repGain + ' rep. Mutual no-poach agreement.', 'good');
    G.marketEvents.push({ day: G.day, text: 'New partnership: You + ' + target.name });
    showActionConfirmation('Partnership formed with ' + target.name + '! +' + repGain + ' rep.', 'good', function() {
      afterAction();
    });
    return true;
  } else {
    // Failed — no money spent, lose 3.5% reputation
    var repLoss = Math.max(1, Math.round(G.reputation * 0.035));
    G.reputation = Math.max(0, G.reputation - repLoss);
    addLog('Partnership attempt with ' + target.name + ' failed. -' + repLoss + ' rep.', 'bad');
    showActionConfirmation('Partnership attempt with ' + target.name + ' failed. -' + repLoss + ' reputation.', 'bad', function() {
      afterAction();
    });
    return false;
  }
}
