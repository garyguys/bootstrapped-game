/* ============================================
   projects.js — Project Generation & Delivery
   Team assignment system. Deadline penalties.
   ============================================ */

var PROJECT_TEMPLATES = [
  // Solo-able projects (complexity <= 1.5)
  { name: 'Landing Page',     payMin: 600,   payMax: 900,   complexity: 1,   daysMin: 3, daysMax: 4, repGain: 3,  requiredRole: null, minTeam: 0, minRep: 0 },
  { name: 'UX Audit',         payMin: 800,   payMax: 1200,  complexity: 1,   daysMin: 2, daysMax: 3, repGain: 4,  requiredRole: null, minTeam: 0, minRep: 0 },
  { name: 'Brand Identity',   payMin: 1200,  payMax: 1800,  complexity: 1.5, daysMin: 4, daysMax: 5, repGain: 5,  requiredRole: 'designer', minTeam: 0, minRep: 0 },

  // Team projects
  { name: 'API Integration',  payMin: 1500,  payMax: 2200,  complexity: 2,   daysMin: 5, daysMax: 6, repGain: 6,  requiredRole: 'developer', minTeam: 1, minRep: 0 },
  { name: 'E-comm Store',     payMin: 2000,  payMax: 3000,  complexity: 2,   daysMin: 6, daysMax: 8, repGain: 8,  requiredRole: null, minTeam: 1, minRep: 0 },
  { name: 'Web App MVP',      payMin: 3500,  payMax: 5000,  complexity: 3,   daysMin: 8, daysMax: 12, repGain: 12, requiredRole: 'developer', minTeam: 2, minRep: 20 },
  { name: 'Mobile App',       payMin: 5000,  payMax: 8000,  complexity: 4,   daysMin: 12, daysMax: 18, repGain: 16, requiredRole: 'developer', minTeam: 3, minRep: 40 },
  { name: 'SaaS Platform',    payMin: 8000,  payMax: 12000, complexity: 5,   daysMin: 18, daysMax: 28, repGain: 22, requiredRole: 'developer', minTeam: 4, minRep: 60 },

  // Premium reputation-gated projects
  { name: 'Enterprise Portal',   payMin: 10000, payMax: 15000, complexity: 4,  daysMin: 14, daysMax: 20, repGain: 20, requiredRole: 'developer', minTeam: 4, minRep: 50 },
  { name: 'AI Integration',      payMin: 12000, payMax: 18000, complexity: 5,  daysMin: 16, daysMax: 24, repGain: 25, requiredRole: 'devops',    minTeam: 5, minRep: 80 },
  { name: 'Platform Migration',  payMin: 15000, payMax: 22000, complexity: 5,  daysMin: 20, daysMax: 30, repGain: 28, requiredRole: 'devops',    minTeam: 5, minRep: 100 },
  { name: 'Full Rebrand Suite',  payMin: 8000,  payMax: 12000, complexity: 3,  daysMin: 10, daysMax: 16, repGain: 18, requiredRole: 'designer',  minTeam: 3, minRep: 50 },
  { name: 'Marketing Campaign',  payMin: 6000,  payMax: 10000, complexity: 3,  daysMin: 8,  daysMax: 14, repGain: 15, requiredRole: 'marketer',  minTeam: 2, minRep: 40 },
  { name: 'Security Audit',      payMin: 18000, payMax: 25000, complexity: 5,  daysMin: 22, daysMax: 35, repGain: 30, requiredRole: 'devops',    minTeam: 6, minRep: 120 },
  { name: 'White-Label Product', payMin: 20000, payMax: 30000, complexity: 5,  daysMin: 25, daysMax: 40, repGain: 35, requiredRole: 'developer', minTeam: 7, minRep: 150 },

  // v0.09 additions
  { name: 'Email Template Set',    payMin: 400,   payMax: 700,   complexity: 1,   daysMin: 2, daysMax: 3, repGain: 2,  requiredRole: null, minTeam: 0, minRep: 0 },
  { name: 'SEO Optimization',      payMin: 900,   payMax: 1400,  complexity: 1,   daysMin: 3, daysMax: 4, repGain: 4,  requiredRole: null, minTeam: 0, minRep: 0 },
  { name: 'Social Media Kit',      payMin: 700,   payMax: 1100,  complexity: 1.5, daysMin: 3, daysMax: 5, repGain: 4,  requiredRole: 'marketer', minTeam: 0, minRep: 0 },
  { name: 'CRM Integration',       payMin: 2500,  payMax: 3800,  complexity: 2.5, daysMin: 6, daysMax: 9, repGain: 8,  requiredRole: 'developer', minTeam: 1, minRep: 10 },
  { name: 'Analytics Dashboard',   payMin: 3000,  payMax: 4500,  complexity: 2.5, daysMin: 7, daysMax: 10, repGain: 10, requiredRole: 'developer', minTeam: 1, minRep: 15 },
  { name: 'Design System',         payMin: 4000,  payMax: 6000,  complexity: 3,   daysMin: 10, daysMax: 15, repGain: 12, requiredRole: 'designer', minTeam: 2, minRep: 30 },
  { name: 'Data Pipeline',         payMin: 12000, payMax: 18000, complexity: 4,   daysMin: 14, daysMax: 22, repGain: 18, requiredRole: 'devops', minTeam: 3, minRep: 60 },
  { name: 'Microservices Rewrite', payMin: 22000, payMax: 35000, complexity: 5,   daysMin: 28, daysMax: 45, repGain: 32, requiredRole: 'developer', minTeam: 6, minRep: 130 },
];

var CLIENT_FIRST = ['Acme', 'Bright', 'Core', 'Nova', 'Edge', 'Peak', 'Flux', 'Zen', 'Pixel', 'Bolt', 'Nexus', 'Atlas',
                    'Lunar', 'Tide', 'Forge', 'Mint', 'Slate', 'Prism', 'Wren', 'Hive',
                    'Apex', 'Drift', 'Echo', 'Aura', 'Kite', 'Orca', 'Quill', 'Spark', 'Vibe', 'Zero'];
var CLIENT_LAST = ['Corp', 'Labs', 'Media', 'Tech', 'Studio', 'Digital', 'Co', 'Works', 'Group', 'HQ', 'AI', 'Ventures',
                   'Systems', 'Cloud', 'Solutions', 'IO', 'Industries'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateClientName() {
  return randomChoice(CLIENT_FIRST) + ' ' + randomChoice(CLIENT_LAST);
}

function generateProject() {
  var maxComplexity = 1.5;
  var minComplexity = 0;
  if (G.stage === 'home_office') { maxComplexity = 2; minComplexity = 0; }
  else if (G.stage === 'startup')    { maxComplexity = 2.5; minComplexity = 1; }
  else if (G.stage === 'seed_stage') { maxComplexity = 3; minComplexity = 1.5; }
  else if (G.stage === 'series_a')   { maxComplexity = 4; minComplexity = 2; }
  else if (G.stage === 'growth')     { maxComplexity = 5; minComplexity = 2.5; }
  else if (G.stage === 'enterprise' || G.stage === 'leader') { maxComplexity = 5; minComplexity = 3; }

  var available = PROJECT_TEMPLATES.filter(function(t) {
    return t.complexity <= maxComplexity && G.reputation >= t.minRep;
  });

  // Weight toward higher-complexity projects at later stages
  // 30% chance to allow a below-minimum project through (keeps some variety)
  if (minComplexity > 0 && available.length > 1) {
    var preferred = available.filter(function(t) { return t.complexity >= minComplexity; });
    if (preferred.length > 0 && Math.random() > 0.3) {
      available = preferred;
    }
  }

  var template = randomChoice(available);
  var payout = randomInt(template.payMin, template.payMax);
  payout = Math.round(payout / 50) * 50;

  // 40% chance to be a repeat client if we have past clients
  var clientKeys = G.clients ? Object.keys(G.clients) : [];
  var client;
  if (clientKeys.length > 0 && Math.random() < 0.4) {
    client = randomChoice(clientKeys);
  } else {
    client = generateClientName();
  }

  return {
    id: G.nextProjectId++,
    name: template.name,
    client: client,
    payout: payout,
    complexity: template.complexity,
    daysToComplete: randomInt(template.daysMin, template.daysMax),
    repGain: template.repGain,
    progress: 0,
    daysActive: 0,
    expiresIn: 3,
    assignedTeam: [],
    founderWorking: false,
    requiredRole: template.requiredRole,
    minTeam: template.minTeam,
    deadlineExtensions: 0,
  };
}

function generatePipelineLeads(guaranteeStartable) {
  var count = randomInt(2, 3);
  for (var i = 0; i < count; i++) {
    if (G.pipeline.length < 5) {
      G.pipeline.push(generateProject());
    }
  }
  // On day 1 or when requested, ensure at least one solo-able, no-team-required project
  if (guaranteeStartable) {
    var hasStartable = G.pipeline.some(function(p) {
      return p.complexity <= 1.5 && p.minTeam === 0 && !p.requiredRole;
    });
    if (!hasStartable && G.pipeline.length < 5) {
      var startable = {
        id: G.nextProjectId++,
        name: 'Landing Page',
        client: generateClientName(),
        payout: randomInt(600, 900),
        complexity: 1,
        daysToComplete: randomInt(3, 4),
        repGain: 3,
        progress: 0,
        daysActive: 0,
        expiresIn: 3,
        assignedTeam: [],
        founderWorking: false,
        requiredRole: null,
        minTeam: 0,
        deadlineExtensions: 0,
      };
      startable.payout = Math.round(startable.payout / 50) * 50;
      G.pipeline.unshift(startable); // Put it first
    }
  }
}

function canAcceptProject(project) {
  if (project.minTeam > 0 && G.team.length < project.minTeam) {
    return { ok: false, reason: 'Need at least ' + project.minTeam + ' team member(s)' };
  }
  if (project.requiredRole) {
    var hasRole = G.team.some(function(e) { return e.role.id === project.requiredRole; });
    if (!hasRole) {
      var roleName = project.requiredRole.charAt(0).toUpperCase() + project.requiredRole.slice(1);
      return { ok: false, reason: 'Requires a ' + roleName + ' on your team' };
    }
  }
  return { ok: true, reason: '' };
}

function acceptProject(projectId) {
  var idx = -1;
  for (var i = 0; i < G.pipeline.length; i++) {
    if (G.pipeline[i].id === projectId) { idx = i; break; }
  }
  if (idx === -1) return false;

  var project = G.pipeline[idx];
  var check = canAcceptProject(project);
  if (!check.ok) {
    addLog('Cannot accept ' + project.name + ': ' + check.reason, 'bad');
    return false;
  }

  G.pipeline.splice(idx, 1);
  project.expiresIn = -1;
  G.activeProjects.push(project);
  addLog('Accepted project: ' + project.name + ' for ' + project.client, 'good');
  return true;
}

function workOnProject(projectId) {
  var project = null;
  for (var i = 0; i < G.activeProjects.length; i++) {
    if (G.activeProjects[i].id === projectId) { project = G.activeProjects[i]; break; }
  }
  if (!project) return false;

  // Player technical skill affects progress (now 1-10 scale)
  var playerTech = G.player ? G.player.technical : 0;
  var advance = 15 + (playerTech * 2); // 15% at TEC 0, 35% at TEC 10
  if (G.upgrades.indexOf('second_monitor') !== -1) {
    advance = Math.round(advance * 1.2);
  }
  if (G.upgrades.indexOf('ai_copilot') !== -1) {
    advance = Math.round(advance * 1.25);
  }

  if (G.energy < 25) advance = Math.round(advance * 0.75);
  else if (G.energy < 50) advance = Math.round(advance * 0.9);

  project.progress = Math.min(100, project.progress + advance);
  project.founderWorking = true;
  if (project.complexity > 2) {
    addLog('Worked on ' + project.name + ' — complex project, solo progress is slow. ' + Math.round(project.progress) + '%', 'good');
  } else {
    addLog('Worked on ' + project.name + ' — ' + Math.round(project.progress) + '% complete', 'good');
  }
  return true;
}

function advanceProjects() {
  for (var i = 0; i < G.activeProjects.length; i++) {
    var p = G.activeProjects[i];
    p.daysActive += 1;

    // Team auto-work
    var teamBonus = getTeamProjectBonus(p);
    if (teamBonus > 0) {
      p.progress = Math.min(100, p.progress + teamBonus);
      // Award skill XP to assigned team members
      if (p.assignedTeam) {
        for (var xi = 0; xi < p.assignedTeam.length; xi++) {
          var xEmp = findEmployee(p.assignedTeam[xi]);
          if (xEmp) grantWorkXP(xEmp);
        }
      }
    }

    // Check overdue warnings
    if (p.daysActive > p.daysToComplete && p.progress < 100) {
      if (p.daysActive === p.daysToComplete + 1) {
        addLog(p.name + ' for ' + p.client + ' is OVERDUE! Reputation at risk.', 'bad');
      }
    }
  }

  // Automation Tools upgrade: random active project gets +5% progress daily
  if (G.upgrades && G.upgrades.indexOf('automation_tools') !== -1 && G.activeProjects.length > 0) {
    var idx = Math.floor(Math.random() * G.activeProjects.length);
    G.activeProjects[idx].progress = Math.min(100, G.activeProjects[idx].progress + 5);
  }
}

// Check for missed deadlines — project cancellation or extension
function checkMissedDeadlines() {
  var remaining = [];
  for (var i = 0; i < G.activeProjects.length; i++) {
    var p = G.activeProjects[i];
    var overdueDays = p.daysActive - p.daysToComplete;

    if (overdueDays >= 3 && p.progress < 100) {
      // Rapport reduces cancellation chance (70% base, down to 20% with high rapport)
      var rapport = (G.clientRapport && G.clientRapport[p.client]) ? G.clientRapport[p.client].rapport : 0;
      var cancelChance = Math.max(0.20, 0.70 - (rapport * 0.02));
      if (Math.random() < cancelChance) {
        var repLoss = p.repGain;
        G.reputation = Math.max(0, G.reputation - repLoss);
        addLog(p.client + ' cancelled ' + p.name + ' due to missed deadline! -' + repLoss + ' rep.', 'bad');
        G.overnightEvents.push(p.client + ' cancelled ' + p.name + ' (-' + repLoss + ' rep)');
        // Don't add to remaining — project is gone
        continue;
      } else if (!p._extensionGranted) {
        p._extensionGranted = true;
        p.daysToComplete += 3;
        addLog(p.client + ' is giving you 3 more days on ' + p.name + '. Don\'t blow it.', 'warn');
        G.overnightEvents.push(p.client + ' extended deadline on ' + p.name + ' by 3 days');
      }
    }
    remaining.push(p);
  }
  G.activeProjects = remaining;
}

function checkProjectDeliveries() {
  var delivered = [];
  var remaining = [];

  for (var i = 0; i < G.activeProjects.length; i++) {
    var p = G.activeProjects[i];
    if (p.progress >= 100) {
      delivered.push(p);
    } else {
      remaining.push(p);
    }
  }

  G.activeProjects = remaining;

  for (var j = 0; j < delivered.length; j++) {
    var d = delivered[j];
    var payout = d.payout;

    var refPerk = G.perks.find(function(p) { return p.id === 'referral_partner'; });
    if (refPerk) payout = Math.round(payout * 0.85);

    var repGain = d.repGain;
    var hasPerfectionist = G.team.some(function(e) { return e.perk && e.perk.id === 'perfectionist'; });
    if (hasPerfectionist) repGain += 2;

    // Determine client happiness based on extensions
    var extensions = d.deadlineExtensions || 0;
    var happiness, happinessBonus = 0;
    if (extensions === 0) {
      happiness = 'Delighted';
      happinessBonus = 2;
      repGain += happinessBonus;
    } else if (extensions === 1) {
      happiness = 'Satisfied';
    } else if (extensions === 2) {
      happiness = 'Neutral';
    } else {
      happiness = 'Disappointed';
      repGain = Math.max(0, repGain - 3);
    }

    G.cash += payout;
    G.reputation += repGain;
    G.totalRevenue += payout;
    recordTransaction('income', 'project', payout, d.name + ' delivered to ' + d.client);

    // Get names of workers for this project
    var workerNames = [];
    for (var k = 0; k < G.team.length; k++) {
      var emp = G.team[k];
      if (d.assignedTeam && d.assignedTeam.indexOf(emp.id) !== -1) {
        workerNames.push(emp.name);
      }
      if (emp.assignedProjectId === d.id) {
        emp.assignedProjectId = null;
      }
    }
    if (d.founderWorking) workerNames.unshift(G.player ? G.player.name : 'You');

    d.workerNames = workerNames.slice();
    d.repGained = repGain;
    d.happinessLabel = happiness;
    G.completedProjects.push(d);

    // Random outcome event
    var outcomeEvent = null;
    var roll = Math.random();
    if (happiness === 'Delighted' && roll < 0.4) {
      var referralBonus = randomInt(1, 3) * 100;
      G.cash += referralBonus;
      outcomeEvent = d.client + ' referred a new contact! +$' + referralBonus + ' bonus.';
    } else if (happiness === 'Disappointed' && roll < 0.5) {
      G.reputation = Math.max(0, G.reputation - 2);
      outcomeEvent = d.client + ' left a negative review. -2 rep.';
    } else if (roll < 0.2) {
      outcomeEvent = d.client + ' asked for a follow-up project!';
      if (G.pipeline.length < 5) G.pipeline.push(generateProject());
    }

    // Sales assigned — 25% chance of scope expansion bonus
    if (d._hasSalesAssigned && Math.random() < 0.25) {
      var salesBonus = randomInt(200, 600);
      payout += salesBonus;
      G.cash += salesBonus;
      if (!outcomeEvent) outcomeEvent = d.client + ' approved a scope expansion! +$' + salesBonus + ' bonus.';
    }

    // Marketer assigned — +3 rep bonus
    if (d._hasMarketerAssigned) {
      repGain += 3;
    }

    // Track client lifetime value
    if (!G.clients) G.clients = {};
    if (!G.clients[d.client]) G.clients[d.client] = { totalSpent: 0, projectCount: 0 };
    G.clients[d.client].totalSpent += payout;
    G.clients[d.client].projectCount += 1;

    // Track client rapport
    if (!G.clientRapport) G.clientRapport = {};
    if (!G.clientRapport[d.client]) G.clientRapport[d.client] = { rapport: 0, projectsCompleted: 0 };
    G.clientRapport[d.client].rapport += 5;
    G.clientRapport[d.client].projectsCompleted += 1;

    // Queue the delivery popup
    G.deliveryQueue.push({
      name: d.name,
      client: d.client,
      payout: payout,
      repGain: repGain,
      happiness: happiness,
      workers: workerNames,
      outcomeEvent: outcomeEvent,
    });

    addLog('Delivered: ' + d.name + ' for ' + d.client + ' — +$' + payout + ', +' + repGain + ' rep', 'good');
    G.overnightEvents.push('Delivered ' + d.name + ' to ' + d.client + ' (+$' + payout + ')');
  }
}

// ============================================================
//   PLAYER PRODUCT DEVELOPMENT SYSTEM
// ============================================================

var OWN_PRODUCT_TYPES = [
  { id: 'saas_tool',     name: 'SaaS Tool',       desc: 'Subscription software for businesses' },
  { id: 'mobile_app',   name: 'Mobile App',        desc: 'Consumer mobile application' },
  { id: 'web_platform', name: 'Web Platform',      desc: 'Online platform or marketplace' },
  { id: 'b2b_software', name: 'B2B Software',      desc: 'Business operations software' },
  { id: 'dev_tool',     name: 'Developer Tool',    desc: 'Tools and libraries for developers' },
  { id: 'ai_product',   name: 'AI Product',        desc: 'AI-powered product or service' },
];

var OWN_PRODUCT_SCOPES = [
  { id: 'small',      name: 'Small',      investment: 5000,   devDaysMin: 15, devDaysMax: 25,  revenueMin: 50,   revenueMax: 200  },
  { id: 'medium',     name: 'Medium',     investment: 20000,  devDaysMin: 30, devDaysMax: 60,  revenueMin: 200,  revenueMax: 800  },
  { id: 'large',      name: 'Large',      investment: 75000,  devDaysMin: 60, devDaysMax: 120, revenueMin: 800,  revenueMax: 3000 },
  { id: 'enterprise', name: 'Enterprise', investment: 200000, devDaysMin: 90, devDaysMax: 180, revenueMin: 2000, revenueMax: 10000 },
];

function createOwnProduct(typeId, scopeId, productName) {
  var type = OWN_PRODUCT_TYPES.find(function(t) { return t.id === typeId; });
  var scope = OWN_PRODUCT_SCOPES.find(function(s) { return s.id === scopeId; });
  if (!type || !scope) return null;
  if (G.cash < scope.investment) {
    addLog('Not enough cash to develop a ' + scope.name + ' product. Need $' + scope.investment.toLocaleString() + '.', 'bad');
    return null;
  }

  G.cash -= scope.investment;
  var devDays = randomInt(scope.devDaysMin, scope.devDaysMax);
  var maxRevenue = randomInt(scope.revenueMin, scope.revenueMax);

  var product = {
    id: G.nextProductId++,
    name: productName || type.name + ' v1.0',
    type: typeId,
    typeName: type.name,
    scope: scopeId,
    scopeName: scope.name,
    investment: scope.investment,
    devDaysRequired: devDays,
    devDaysWorked: 0,
    apInvested: 0,
    apRequired: (G.upgrades.indexOf('innovation_lab') !== -1) ? 6 : 12,
    quality: 0,       // 0-100 quality once live
    maxRevenue: maxRevenue,
    status: 'greenlight', // 'greenlight' | 'building' | 'live' | 'dead'
    assignedTeam: [],
    daysLive: 0,
    totalRevenue: 0,
    marketInterest: 60, // 0-100
  };

  G.ownedProducts.push(product);
  recordTransaction('expense', 'product', scope.investment, 'Product investment: ' + product.name);
  addLog('Started "' + product.name + '"! Invested $' + scope.investment.toLocaleString() + '. Contribute 12 AP to greenlight it.', 'good');
  return product;
}

function workOnOwnProduct(productId) {
  var product = null;
  for (var i = 0; i < G.ownedProducts.length; i++) {
    if (G.ownedProducts[i].id === productId) { product = G.ownedProducts[i]; break; }
  }
  if (!product || product.status !== 'building') return false;

  var devAdvance = 1;
  if (G.upgrades.indexOf('ai_copilot') !== -1) devAdvance = Math.round(devAdvance * 1.25 * 100) / 100;
  product.devDaysWorked = (product.devDaysWorked || 0) + devAdvance;
  addLog('Worked on "' + product.name + '" — ' + Math.floor(product.devDaysWorked) + '/' + product.devDaysRequired + ' dev days.', 'good');

  if (product.devDaysWorked >= product.devDaysRequired) {
    product.status = 'live';
    product.quality = 75;
    addLog('"' + product.name + '" launched! It\'s live and generating revenue.', 'good');
    G.reputation += 5;
    G.overnightEvents.push('"' + product.name + '" is live on the market!');
  }
  return true;
}

function updateOwnProduct(productId) {
  // Spend money to restore quality
  var product = null;
  for (var i = 0; i < G.ownedProducts.length; i++) {
    if (G.ownedProducts[i].id === productId) { product = G.ownedProducts[i]; break; }
  }
  if (!product || product.status !== 'live') return false;

  var updateCost = Math.round(product.investment * 0.2);
  if (G.cash < updateCost) {
    addLog('Need $' + updateCost.toLocaleString() + ' to update "' + product.name + '".', 'bad');
    return false;
  }
  G.cash -= updateCost;
  product.quality = Math.min(100, product.quality + 40);
  product.marketInterest = Math.min(100, product.marketInterest + 15);
  addLog('Updated "' + product.name + '"! Quality restored. -$' + updateCost.toLocaleString() + '.', 'good');
  return true;
}

function upgradeOwnProduct(productId) {
  var product = null;
  for (var i = 0; i < G.ownedProducts.length; i++) {
    if (G.ownedProducts[i].id === productId) { product = G.ownedProducts[i]; break; }
  }
  if (!product || product.status !== 'live') return false;

  var scaleOrder = ['small', 'medium', 'large', 'enterprise'];
  var currentIdx = scaleOrder.indexOf(product.scope);
  if (currentIdx === -1 || currentIdx >= scaleOrder.length - 1) {
    addLog('"' + product.name + '" is already at maximum scale.', 'warn');
    return false;
  }
  var nextScope = OWN_PRODUCT_SCOPES.find(function(s) { return s.id === scaleOrder[currentIdx + 1]; });
  if (!nextScope) return false;

  var upgradeCost = Math.round(nextScope.investment * 0.6);
  if (G.cash < upgradeCost) {
    addLog('Need $' + upgradeCost.toLocaleString() + ' to upgrade "' + product.name + '".', 'bad');
    return false;
  }

  G.cash -= upgradeCost;
  product.scope = nextScope.id;
  product.scopeName = nextScope.name;
  product.investment = nextScope.investment;
  product.maxRevenue = randomInt(nextScope.revenueMin, nextScope.revenueMax);
  product.marketInterest = Math.min(100, product.marketInterest + 25);
  product.quality = Math.min(100, product.quality + 20);
  recordTransaction('expense', 'product', upgradeCost, 'Product upgrade: ' + product.name + ' to ' + nextScope.name);
  addLog('Upgraded "' + product.name + '" to ' + nextScope.name + ' scale! New revenue potential, increased interest. -$' + upgradeCost.toLocaleString(), 'good');
  return true;
}

function tickProducts() {
  if (!G.ownedProducts || G.ownedProducts.length === 0) return;

  for (var i = 0; i < G.ownedProducts.length; i++) {
    var p = G.ownedProducts[i];
    if (p.status === 'dead') continue;

    if (p.status === 'greenlight') {
      continue; // waiting for AP investment via Invest AP action
    }

    if (p.status === 'building') {
      if (p.assignedTeam && p.assignedTeam.length > 0) {
        p.devDaysWorked = (p.devDaysWorked || 0) + p.assignedTeam.length;
        // Award skill XP to product team
        for (var bxi = 0; bxi < p.assignedTeam.length; bxi++) {
          var bxEmp = findEmployee(p.assignedTeam[bxi]);
          if (bxEmp) grantWorkXP(bxEmp);
        }
        if (p.devDaysWorked >= p.devDaysRequired) {
          p.status = 'live';
          p.quality = 75;
          addLog('"' + p.name + '" launched by your team! It\'s live.', 'good');
          G.reputation += 5;
          G.overnightEvents.push('"' + p.name + '" is now live!');
        }
      }
      continue;
    }

    if (p.status === 'live') {
      p.daysLive += 1;

      // Quality decay
      var hasTeam = p.assignedTeam && p.assignedTeam.some(function(id) {
        return G.team.some(function(emp) { return emp.id === id; });
      });
      if (hasTeam) {
        p.quality = Math.max(0, p.quality - 0.5);
        p.marketInterest = Math.min(100, p.marketInterest + 0.2);
        // Award skill XP to live product team
        for (var lxi = 0; lxi < p.assignedTeam.length; lxi++) {
          var lxEmp = findEmployee(p.assignedTeam[lxi]);
          if (lxEmp) grantWorkXP(lxEmp);
        }
      } else {
        p.quality = Math.max(0, p.quality - 3);
        p.marketInterest = Math.max(0, p.marketInterest - 1);
      }

      // Daily revenue
      if (p.quality > 0) {
        var revenue = Math.round((p.quality / 100) * (p.marketInterest / 100) * p.maxRevenue);
        if (G.upgrades && G.upgrades.indexOf('server_farm') !== -1) revenue = Math.round(revenue * 1.25);
        if (G.upgrades && G.upgrades.indexOf('cloud_infra') !== -1) revenue = Math.round(revenue * 1.5);
        G.cash += revenue;
        G.totalRevenue += revenue;
        p.totalRevenue += revenue;
        recordTransaction('income', 'product', revenue, p.name + ' daily revenue');
        if (p.daysLive % 7 === 0) {
          addLog('"' + p.name + '" earned $' + revenue + '/day this week. Quality: ' + Math.round(p.quality) + '%.', 'good');
        }
      }

      // Death check
      if (p.quality <= 0 && p.marketInterest <= 5) {
        p.status = 'dead';
        addLog('"' + p.name + '" lost all market interest and shut down.', 'bad');
        G.overnightEvents.push('"' + p.name + '" is no longer viable and has shut down.');
        // Unassign team
        for (var k = 0; k < G.team.length; k++) {
          if (p.assignedTeam && p.assignedTeam.indexOf(G.team[k].id) !== -1) {
            G.team[k].assignedProductId = null;
          }
        }
      }
    }
  }
}

function assignToProduct(employeeId, productId) {
  var emp = findEmployee(employeeId);
  if (!emp) return false;
  var product = null;
  for (var i = 0; i < G.ownedProducts.length; i++) {
    if (G.ownedProducts[i].id === productId) { product = G.ownedProducts[i]; break; }
  }
  if (!product) return false;
  if (!product.assignedTeam) product.assignedTeam = [];
  // Remove from other products
  for (var j = 0; j < G.ownedProducts.length; j++) {
    if (G.ownedProducts[j].assignedTeam) {
      G.ownedProducts[j].assignedTeam = G.ownedProducts[j].assignedTeam.filter(function(id) { return id !== employeeId; });
    }
  }
  // Remove from any project assignment (exclusivity: project OR product)
  for (var jp = 0; jp < G.activeProjects.length; jp++) {
    if (G.activeProjects[jp].assignedTeam) {
      G.activeProjects[jp].assignedTeam = G.activeProjects[jp].assignedTeam.filter(function(id) { return id !== employeeId; });
    }
  }
  emp.assignedProjectId = null;

  product.assignedTeam.push(employeeId);
  emp.assignedProductId = productId;
  addLog(emp.name + ' assigned to "' + product.name + '".', 'info');
  return true;
}

function unassignFromProduct(employeeId) {
  var emp = findEmployee(employeeId);
  if (!emp) return;
  for (var j = 0; j < G.ownedProducts.length; j++) {
    if (G.ownedProducts[j].assignedTeam) {
      G.ownedProducts[j].assignedTeam = G.ownedProducts[j].assignedTeam.filter(function(id) { return id !== employeeId; });
    }
  }
  emp.assignedProductId = null;
}

// Market share bonus from live player products
function getProductMarketBonus() {
  var bonus = 0;
  if (!G.ownedProducts) return 0;
  for (var i = 0; i < G.ownedProducts.length; i++) {
    var p = G.ownedProducts[i];
    if (p.status === 'live') {
      bonus += Math.floor((p.quality * p.marketInterest) / 1000);
    }
  }
  return bonus;
}

// Generate products for a competitor based on their style
function generateCompetitorProducts(style) {
  var countByStyle = { niche: [1, 2], vc_funded: [1, 3], megacorp: [2, 4], budget: [0, 1] };
  // Scope restriction: small companies only have small products
  var scopesByStyle = {
    niche:     ['small'],
    budget:    ['small', 'medium'],
    vc_funded: ['small', 'medium', 'large'],
    megacorp:  ['small', 'medium', 'large', 'enterprise']
  };
  var allowedScopes = scopesByStyle[style] || ['small'];
  var filteredScopes = OWN_PRODUCT_SCOPES.filter(function(s) {
    return allowedScopes.indexOf(s.id) !== -1;
  });
  var range = countByStyle[style] || [1, 2];
  var count = randomInt(range[0], range[1]);
  var products = [];
  for (var i = 0; i < count; i++) {
    var type = randomChoice(OWN_PRODUCT_TYPES);
    var scope = randomChoice(filteredScopes);
    products.push({
      name: type.name + ' ' + (i + 1),
      type: type.id,
      scope: scope.id,
      quality: randomInt(30, 80),
    });
  }
  return products;
}

function agePipelineLeads() {
  var kept = [];
  for (var i = 0; i < G.pipeline.length; i++) {
    G.pipeline[i].expiresIn -= 1;
    if (G.pipeline[i].expiresIn > 0) {
      kept.push(G.pipeline[i]);
    } else {
      addLog(G.pipeline[i].client + ' went with a competitor.', 'bad');
    }
  }
  G.pipeline = kept;
}
