/* ============================================
   projects.js — Project Generation & Delivery
   ============================================ */

var PROJECT_TEMPLATES = [
  { name: 'Landing Page',     payMin: 600,   payMax: 900,   complexity: 1,   daysMin: 3, daysMax: 4, repGain: 3  },
  { name: 'UX Audit',         payMin: 800,   payMax: 1200,  complexity: 1,   daysMin: 2, daysMax: 3, repGain: 4  },
  { name: 'Brand Identity',   payMin: 1200,  payMax: 1800,  complexity: 1.5, daysMin: 4, daysMax: 5, repGain: 5  },
  { name: 'API Integration',  payMin: 1500,  payMax: 2200,  complexity: 2,   daysMin: 5, daysMax: 6, repGain: 6  },
  { name: 'E-comm Store',     payMin: 2000,  payMax: 3000,  complexity: 2,   daysMin: 6, daysMax: 8, repGain: 8  },
  { name: 'Web App MVP',      payMin: 3500,  payMax: 5000,  complexity: 3,   daysMin: 8, daysMax: 12, repGain: 12 },
  { name: 'Mobile App',       payMin: 5000,  payMax: 8000,  complexity: 4,   daysMin: 12, daysMax: 18, repGain: 16 },
  { name: 'SaaS Platform',    payMin: 8000,  payMax: 12000, complexity: 5,   daysMin: 18, daysMax: 28, repGain: 22 },
];

// Client name parts for random generation
var CLIENT_FIRST = ['Acme', 'Bright', 'Core', 'Nova', 'Edge', 'Peak', 'Flux', 'Zen', 'Pixel', 'Bolt', 'Nexus', 'Atlas',
                    'Lunar', 'Tide', 'Forge', 'Mint', 'Slate', 'Prism', 'Wren', 'Hive'];
var CLIENT_LAST = ['Corp', 'Labs', 'Media', 'Tech', 'Studio', 'Digital', 'Co', 'Works', 'Group', 'HQ', 'AI', 'Ventures'];

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
  // Filter templates by stage
  var maxComplexity = 1.5;
  if (G.stage === 'home_office') maxComplexity = 2;
  else if (G.stage === 'micro') maxComplexity = 3;
  else if (G.stage === 'boutique') maxComplexity = 4;
  else if (G.stage === 'scaleup' || G.stage === 'leader') maxComplexity = 5;

  var available = PROJECT_TEMPLATES.filter(function(t) {
    return t.complexity <= maxComplexity;
  });

  var template = randomChoice(available);
  var payout = randomInt(template.payMin, template.payMax);
  payout = Math.round(payout / 50) * 50;

  return {
    id: G.nextProjectId++,
    name: template.name,
    client: generateClientName(),
    payout: payout,
    complexity: template.complexity,
    daysToComplete: randomInt(template.daysMin, template.daysMax),
    repGain: template.repGain,
    progress: 0,
    daysActive: 0,
    expiresIn: 3,
    assignedTeam: [],
    founderWorking: false,
  };
}

function generatePipelineLeads() {
  var count = randomInt(2, 3);
  for (var i = 0; i < count; i++) {
    if (G.pipeline.length < 5) {
      G.pipeline.push(generateProject());
    }
  }
}

function acceptProject(projectId) {
  var idx = -1;
  for (var i = 0; i < G.pipeline.length; i++) {
    if (G.pipeline[i].id === projectId) { idx = i; break; }
  }
  if (idx === -1) return false;

  var project = G.pipeline.splice(idx, 1)[0];
  project.expiresIn = -1;
  G.activeProjects.push(project);
  addLog('Accepted project: ' + project.name + ' for ' + project.client, 'good');
  return true;
}

function workOnProject(projectId) {
  var project = null;
  for (var i = 0; i < G.activeProjects.length; i++) {
    if (G.activeProjects[i].id === projectId) {
      project = G.activeProjects[i];
      break;
    }
  }
  if (!project) return false;

  if (project.complexity > 1.5) {
    addLog('This project is too complex to work on solo.', 'bad');
    return false;
  }

  var advance = 25;
  if (G.upgrades.indexOf('second_monitor') !== -1) {
    advance = 30;
  }

  project.progress = Math.min(100, project.progress + advance);
  project.founderWorking = true;

  addLog('Worked on ' + project.name + ' — ' + Math.round(project.progress) + '% complete', 'good');
  return true;
}

function advanceProjects() {
  for (var i = 0; i < G.activeProjects.length; i++) {
    var p = G.activeProjects[i];
    p.daysActive += 1;

    // Team auto-work: sum contributions from team members
    var teamBonus = getTeamProjectBonus(p);
    if (teamBonus > 0) {
      p.progress = Math.min(100, p.progress + teamBonus);
    }

    // Faster internet upgrade
    if (G.upgrades.indexOf('faster_internet') !== -1) {
      p.progress = Math.min(100, p.progress + 2);
    }

    // Check overdue
    if (p.daysActive > p.daysToComplete && p.progress < 100) {
      // Overdue penalty: rep loss
      if (p.daysActive === p.daysToComplete + 1) {
        addLog(p.name + ' for ' + p.client + ' is OVERDUE! Reputation at risk.', 'bad');
      }
    }
  }
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

    // Referral partner perk: -15% on revenue
    var refPerk = G.perks.find(function(p) { return p.id === 'referral_partner'; });
    if (refPerk) {
      payout = Math.round(payout * 0.85);
    }

    var repGain = d.repGain;

    // Perfectionist perk on team: +2 rep
    var hasPerfectionist = G.team.some(function(e) { return e.perk && e.perk.id === 'perfectionist'; });
    if (hasPerfectionist) {
      repGain += 2;
    }

    G.cash += payout;
    G.reputation += repGain;
    G.totalRevenue += payout;
    G.completedProjects.push(d);
    addLog('Delivered: ' + d.name + ' for ' + d.client + ' — +$' + payout + ', +' + repGain + ' rep', 'good');
    G.overnightEvents.push('Delivered ' + d.name + ' to ' + d.client + ' (+$' + payout + ')');
  }
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
