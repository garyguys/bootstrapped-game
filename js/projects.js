/* ============================================
   projects.js — Project Generation & Delivery
   ============================================ */

var PROJECT_TEMPLATES = [
  { name: 'Landing Page',     payMin: 600,   payMax: 900,   complexity: 1,   daysMin: 3, daysMax: 4, repGain: 3  },
  { name: 'UX Audit',         payMin: 800,   payMax: 1200,  complexity: 1,   daysMin: 2, daysMax: 3, repGain: 4  },
  { name: 'Brand Identity',   payMin: 1200,  payMax: 1800,  complexity: 1.5, daysMin: 4, daysMax: 5, repGain: 5  },
  { name: 'API Integration',  payMin: 1500,  payMax: 2200,  complexity: 2,   daysMin: 5, daysMax: 6, repGain: 6  },
  { name: 'E-comm Store',     payMin: 2000,  payMax: 3000,  complexity: 2,   daysMin: 6, daysMax: 8, repGain: 8  },
];

// Client name parts for random generation
var CLIENT_FIRST = ['Acme', 'Bright', 'Core', 'Nova', 'Edge', 'Peak', 'Flux', 'Zen', 'Pixel', 'Bolt', 'Nexus', 'Atlas'];
var CLIENT_LAST = ['Corp', 'Labs', 'Media', 'Tech', 'Studio', 'Digital', 'Co', 'Works', 'Group', 'HQ'];

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
  // Filter templates by what the player can handle at current stage
  var available = PROJECT_TEMPLATES.filter(function(t) {
    // Early game: only complexity <= 1.5 in pipeline
    if (G.stage === 'freelancer' || G.stage === 'home_office') {
      return t.complexity <= 1.5;
    }
    return true;
  });

  var template = randomChoice(available);
  var payout = randomInt(template.payMin, template.payMax);

  // Round payout to nearest 50
  payout = Math.round(payout / 50) * 50;

  return {
    id: G.nextProjectId++,
    name: template.name,
    client: generateClientName(),
    payout: payout,
    complexity: template.complexity,
    daysToComplete: randomInt(template.daysMin, template.daysMax),
    repGain: template.repGain,
    progress: 0,          // 0-100
    daysActive: 0,
    expiresIn: 3,         // Pipeline leads expire in 3 days
    assignedTeam: [],     // Employee IDs assigned
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
  project.expiresIn = -1; // No longer expiring
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

  // Founder can only work on complexity <= 1.5
  if (project.complexity > 1.5) {
    addLog('This project is too complex to work on solo.', 'bad');
    return false;
  }

  // Advance progress ~25% per founder action
  var advance = 25;

  // Second monitor upgrade: 20% faster
  if (G.upgrades.indexOf('second_monitor') !== -1) {
    advance = 30;
  }

  project.progress = Math.min(100, project.progress + advance);
  project.founderWorking = true;

  addLog('Worked on ' + project.name + ' — ' + Math.round(project.progress) + '% complete', 'good');
  return true;
}

function advanceProjects() {
  // Team members auto-advance assigned projects each day
  for (var i = 0; i < G.activeProjects.length; i++) {
    var p = G.activeProjects[i];
    p.daysActive += 1;

    // Team auto-work would go here when team system is built
    // For now, projects only advance via founder actions
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
    G.cash += d.payout;
    G.reputation += d.repGain;
    G.totalRevenue += d.payout;
    G.completedProjects.push(d);
    addLog('Delivered: ' + d.name + ' for ' + d.client + ' — +$' + d.payout + ', +' + d.repGain + ' rep', 'good');
    G.overnightEvents.push('Delivered ' + d.name + ' to ' + d.client + ' (+$' + d.payout + ')');
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
