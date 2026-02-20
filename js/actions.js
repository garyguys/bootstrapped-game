/* ============================================
   actions.js — All Player Actions (AP System)
   Food: NO AP cost. Upgrades: cost AP, pricier.
   Staff party action. Management-focused dashboard.
   Food scales $50-$1000 with temp buffs.
   Extending deadlines costs reputation.
   ============================================ */

var ENERGY_COSTS = {
  work_project:  12,
  accept_project: 8,
  client_call:   8,
  post_job:      10,
  interview:     10,
  hire:          8,
  browse_shop:   5,
  order_food:    0,  // No energy cost for food (it gives energy)
  acquire:       15,
  scout:         8,
  poach:         12,
  staff_party:   10,
  train_skill:   10,
};

var AP_COSTS = {
  work_project:  1,
  accept_project: 1,
  client_call:   1,
  post_job:      2,
  interview:     1,
  hire:          1,
  acquire:       5,
  scout:         1,
  poach:         2,
  order_food:    0,  // NO AP cost for food
  staff_party:   1,
  train_skill:   1,
};

function canAct(apNeeded) {
  apNeeded = apNeeded || 1;
  return G.apCurrent >= apNeeded && !G.gameOver;
}

function afterAction() {
  checkEnergyProjectFailures();
  checkForDayEvent();
  UI.renderAll();
}

function confirmThenAfterAction(message, type) {
  showActionConfirmation(message, type || 'good', function() {
    afterAction();
  });
}

// --- Action: Work on a project ---

function actionWorkProject(projectId) {
  if (!canAct(AP_COSTS.work_project)) return;

  var project = null;
  for (var i = 0; i < G.activeProjects.length; i++) {
    if (G.activeProjects[i].id === projectId) { project = G.activeProjects[i]; break; }
  }
  if (!project) return;

  var success = workOnProject(projectId);
  if (!success) return;

  spendAP(AP_COSTS.work_project);
  spendEnergy(ENERGY_COSTS.work_project);

  if (checkExhaustedMistake()) {
    addLog('Exhaustion caused a bug... lost some progress.', 'bad');
    project.progress = Math.max(0, project.progress - 10);
  }

  confirmThenAfterAction('Worked on ' + project.name + ' — ' + Math.round(project.progress) + '% complete', 'good');
}

// --- Action: Accept a pipeline project ---

function actionAcceptProject(projectId) {
  if (!canAct(AP_COSTS.accept_project)) return;

  var projName = '';
  for (var i = 0; i < G.pipeline.length; i++) {
    if (G.pipeline[i].id === projectId) { projName = G.pipeline[i].name; break; }
  }

  var success = acceptProject(projectId);
  if (!success) return;

  spendAP(AP_COSTS.accept_project);
  spendEnergy(ENERGY_COSTS.accept_project);
  confirmThenAfterAction('Accepted project: ' + projName, 'good');
}

// --- Action: Client call (extend deadline) — now costs reputation ---

function actionClientCall(projectId) {
  if (!canAct(AP_COSTS.client_call)) return;

  var found = false;
  var clientName = '';
  var projName = '';
  for (var i = 0; i < G.activeProjects.length; i++) {
    if (G.activeProjects[i].id === projectId) {
      var p = G.activeProjects[i];
      p.daysToComplete += 2;
      p.deadlineExtensions = (p.deadlineExtensions || 0) + 1;
      clientName = p.client;
      projName = p.name;

      // Reputation penalty for extending deadlines
      var repCost = Math.min(5, p.deadlineExtensions * 2);
      G.reputation = Math.max(0, G.reputation - repCost);
      addLog('Called ' + clientName + ' — deadline extended by 2 days. -' + repCost + ' rep.', 'warn');
      found = true;
      break;
    }
  }
  if (!found) return;

  spendAP(AP_COSTS.client_call);
  spendEnergy(ENERGY_COSTS.client_call);

  var extensions = 0;
  for (var j = 0; j < G.activeProjects.length; j++) {
    if (G.activeProjects[j].id === projectId) {
      extensions = G.activeProjects[j].deadlineExtensions || 0;
      break;
    }
  }
  var repLoss = Math.min(5, extensions * 2);
  confirmThenAfterAction('Extended ' + projName + ' deadline (+2 days, -' + repLoss + ' rep)', 'warn');
}

// --- Action: Post a job (2 AP) ---

function actionPostJob() {
  if (!canAct(AP_COSTS.post_job)) return;
  if (G.jobPosted) {
    addLog('You already have a job posting active.', 'warn');
    return;
  }
  if (!canPostJob()) {
    addLog('Can\'t post again yet. ' + daysUntilCanPost() + ' days until next.', 'warn');
    return;
  }

  G.jobPosted = true;
  G.lastJobPostDay = G.day;
  spendAP(AP_COSTS.post_job);
  spendEnergy(ENERGY_COSTS.post_job);
  addLog('Job listing posted. Candidates will apply tomorrow.', 'info');
  confirmThenAfterAction('Job listing posted! Candidates will apply tomorrow.', 'info');
}

// --- Action: Interview ---

function actionInterview(candidateId) {
  if (!canAct(AP_COSTS.interview)) return;

  var success = interviewCandidate(candidateId);
  if (!success) return;

  var c = findCandidate(candidateId);
  var msg = c ? 'Interviewed ' + c.name : 'Interview complete';

  spendAP(AP_COSTS.interview);
  spendEnergy(ENERGY_COSTS.interview);
  confirmThenAfterAction(msg, 'info');
}

// --- Action: Hire (opens negotiation) ---

function actionHire(candidateId) {
  if (!canAct(AP_COSTS.hire)) return;
  var c = findCandidate(candidateId);
  if (!c) return;
  showNegotiationModal(c);
}

function completeHire(candidateId, negotiatedSalary) {
  var c = findCandidate(candidateId);
  if (!c) return;

  if (negotiatedSalary !== undefined) c.salary = negotiatedSalary;

  var success = hireCandidate(candidateId);
  if (!success) return;

  spendAP(AP_COSTS.hire);
  spendEnergy(ENERGY_COSTS.hire);
  confirmThenAfterAction('Hired ' + c.name + ' at $' + c.salary + '/wk!', 'good');
}

// --- Action: Fire employee ---

function actionFire(employeeId) {
  fireEmployee(employeeId);
  UI.renderAll();
}

// --- Action: Acquire startup (5 AP) ---

function actionAcquire(competitorId) {
  if (!canAct(AP_COSTS.acquire)) return;

  var success = acquireStartup(competitorId);
  if (!success) return;

  spendAP(AP_COSTS.acquire);
  spendEnergy(ENERGY_COSTS.acquire);

  var lastAcq = G.acquiredStartups[G.acquiredStartups.length - 1];
  var compName = lastAcq ? lastAcq.name : 'startup';
  confirmThenAfterAction('Acquired ' + compName + '!', 'good');
}

// --- Action: Scout competitor ---

function actionScout(competitorId) {
  if (!canAct(AP_COSTS.scout)) return;

  var success = scoutCompetitor(competitorId);
  if (!success) return;

  spendAP(AP_COSTS.scout);
  spendEnergy(ENERGY_COSTS.scout);

  var comp = null;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].id === competitorId) { comp = G.competitors[i]; break; }
  }

  var level = comp ? (comp.scoutLevel || 1) : 1;
  var levelText = level === 1 ? 'Basic intel gathered.' : level === 2 ? 'Skills and salaries revealed.' : 'Deep intel: loyalty and willingness revealed.';
  confirmThenAfterAction('Scouted ' + (comp ? comp.name : 'competitor') + ' — ' + levelText, 'info');
}

// --- Action: Poach employee ---

function actionPoach(competitorId, candidateId) {
  if (!canAct(AP_COSTS.poach)) return;

  var result = poachEmployee(competitorId, candidateId);

  spendAP(AP_COSTS.poach);
  spendEnergy(ENERGY_COSTS.poach);

  confirmThenAfterAction(result.message, result.success ? 'good' : 'bad');
}

// --- Food Items (NO AP cost, scales $50-$1000, expensive = temp buffs) ---

var FOOD_ITEMS = [
  { id: 'street_coffee',    name: 'Street Coffee',       baseCost: 50,   energy: 15,  desc: '+15 energy',                     buff: null },
  { id: 'lunch_delivery',   name: 'Lunch Delivery',      baseCost: 100,  energy: 25,  desc: '+25 energy',                     buff: null },
  { id: 'healthy_catering', name: 'Healthy Catering',    baseCost: 200,  energy: 35,  desc: '+35 energy, +5% project speed 1d', buff: { id: 'food_speed', name: 'Well Fed', desc: '+5% project speed', value: 5, daysLeft: 1 } },
  { id: 'team_dinner',      name: 'Team Dinner',         baseCost: 350,  energy: 45,  desc: '+45 energy, +5 team loyalty',     buff: null, loyaltyBonus: 5 },
  { id: 'premium_catering', name: 'Premium Catering',    baseCost: 600,  energy: 60,  desc: '+60 energy, +10% speed 2d',       buff: { id: 'food_speed', name: 'Gourmet Boost', desc: '+10% project speed', value: 10, daysLeft: 2 } },
  { id: 'executive_dining', name: 'Executive Dining',    baseCost: 1000, energy: 80,  desc: '+80 energy, +15% speed 3d, +2 rep', buff: { id: 'food_speed', name: 'Executive Fuel', desc: '+15% project speed', value: 15, daysLeft: 3 }, repBonus: 2 },
];

function getFoodCost(item) {
  // Scale cost with company size
  var sizeMult = 1 + (G.team.length * 0.1);
  return Math.round(item.baseCost * sizeMult / 10) * 10;
}

function actionOrderFood(foodId) {
  // No AP cost for food!
  var item = null;
  for (var i = 0; i < FOOD_ITEMS.length; i++) {
    if (FOOD_ITEMS[i].id === foodId) { item = FOOD_ITEMS[i]; break; }
  }
  if (!item) return;

  var cost = getFoodCost(item);
  if (G.cash < cost) {
    addLog('Can\'t afford ' + item.name + '.', 'bad');
    return;
  }

  G.cash -= cost;
  G.energy = Math.min(G.energyMax, G.energy + item.energy);

  // Apply temporary buff
  if (item.buff) {
    // Remove existing food buff
    G.perks = G.perks.filter(function(p) { return p.id !== 'food_speed'; });
    G.perks.push({
      id: item.buff.id,
      name: item.buff.name,
      desc: item.buff.desc,
      value: item.buff.value,
      daysLeft: item.buff.daysLeft,
    });
    addLog(item.buff.name + ' active for ' + item.buff.daysLeft + ' day(s).', 'good');
  }

  // Apply loyalty bonus
  if (item.loyaltyBonus && G.team.length > 0) {
    for (var j = 0; j < G.team.length; j++) {
      G.team[j].loyalty = Math.min(100, G.team[j].loyalty + item.loyaltyBonus);
    }
    addLog('Team enjoyed the meal! Loyalty +' + item.loyaltyBonus + '.', 'good');
  }

  // Apply rep bonus
  if (item.repBonus) {
    G.reputation += item.repBonus;
  }

  addLog('Ordered ' + item.name + ' (-$' + cost + ', +' + item.energy + ' energy)', 'info');
  // No AP spent, just re-render
  UI.renderAll();
}

// --- Action: Staff Party (costs AP + money, boosts energy & loyalty) ---

function actionStaffParty() {
  if (!canAct(AP_COSTS.staff_party)) return;
  if (!canThrowParty()) {
    addLog('Can\'t throw a party right now.', 'warn');
    return;
  }

  var cost = 200 + (G.team.length * 80);
  if (G.cash < cost) {
    addLog('Can\'t afford a staff party. Need $' + cost + '.', 'bad');
    return;
  }

  G.cash -= cost;
  G.lastPartyDay = G.day;
  G.energy = Math.min(G.energyMax, G.energy + 20);

  for (var i = 0; i < G.team.length; i++) {
    G.team[i].loyalty = Math.min(100, G.team[i].loyalty + 15);
  }

  spendAP(AP_COSTS.staff_party);
  spendEnergy(ENERGY_COSTS.staff_party);

  addLog('Threw a staff party! -$' + cost + ', +20 energy, +15 loyalty for all.', 'good');
  confirmThenAfterAction('Staff party! -$' + cost + '. Team morale boosted!', 'good');
}

// --- Action: Train Player Skill ---

function getTrainingCost(currentLevel) {
  return 300 + (currentLevel * 200);
}

function actionTrainSkill(skillName) {
  if (!canAct(AP_COSTS.train_skill)) return;
  if (!G.player) return;

  var currentLevel = G.player[skillName];
  if (currentLevel >= 10) {
    addLog('Already at maximum ' + skillName + ' skill.', 'warn');
    return;
  }

  var cost = getTrainingCost(currentLevel);
  if (G.cash < cost) {
    addLog('Can\'t afford training. Need $' + cost + '.', 'bad');
    return;
  }

  G.cash -= cost;
  G.player[skillName] += 1;
  spendAP(AP_COSTS.train_skill);
  spendEnergy(ENERGY_COSTS.train_skill);

  var skillLabels = { technical: 'Technical', communication: 'Communication', reliability: 'Reliability' };
  addLog('Training complete! ' + skillLabels[skillName] + ' is now ' + G.player[skillName] + '/10.', 'good');
  confirmThenAfterAction(skillLabels[skillName] + ' improved to ' + G.player[skillName] + '/10!', 'good');
}

// --- Negotiation Modal with Patience Bar ---

function showNegotiationModal(candidate) {
  var modal = document.getElementById('negotiation-modal');
  var nameEl = document.getElementById('negotiation-name');
  var roleEl = document.getElementById('negotiation-role');
  var askingEl = document.getElementById('negotiation-asking');
  var offerInput = document.getElementById('negotiation-offer');
  var resultEl = document.getElementById('negotiation-result');
  var patienceEl = document.getElementById('negotiation-patience');
  var btnOffer = document.getElementById('negotiation-submit');
  var btnAccept = document.getElementById('negotiation-accept');
  var btnClose = document.getElementById('negotiation-close');

  nameEl.textContent = candidate.name;
  roleEl.textContent = candidate.levelName + ' ' + candidate.role.name;
  askingEl.textContent = '$' + candidate.askingSalary + '/wk';
  offerInput.value = candidate.askingSalary;
  offerInput.min = Math.round(candidate.askingSalary * 0.5);
  offerInput.max = Math.round(candidate.askingSalary * 1.5);
  resultEl.textContent = '';
  resultEl.className = 'negotiation-result';

  // Render patience bar
  updatePatienceBar(candidate);

  btnOffer.style.display = '';
  btnAccept.style.display = '';
  btnClose.textContent = 'CANCEL';

  btnAccept.onclick = function() {
    modal.style.display = 'none';
    completeHire(candidate.id, candidate.askingSalary);
  };

  btnOffer.onclick = function() {
    var offered = parseInt(offerInput.value);
    if (isNaN(offered) || offered <= 0) return;

    var result = negotiateSalary(candidate.id, offered);
    resultEl.textContent = result.message;

    if (result.withdrawn) {
      resultEl.className = 'negotiation-result text-red';
      btnOffer.style.display = 'none';
      btnAccept.style.display = 'none';
      btnClose.textContent = 'CLOSE';
      btnClose.onclick = function() {
        modal.style.display = 'none';
        UI.renderAll();
      };
      return;
    }

    // Update patience bar
    updatePatienceBar(candidate);

    if (result.accepted) {
      resultEl.className = 'negotiation-result text-green';
      btnOffer.style.display = 'none';
      btnAccept.style.display = 'none';
      btnClose.textContent = 'HIRE';
      btnClose.onclick = function() {
        modal.style.display = 'none';
        completeHire(candidate.id, offered);
      };
    } else {
      resultEl.className = 'negotiation-result text-red';
    }
  };

  btnClose.onclick = function() {
    modal.style.display = 'none';
  };

  modal.style.display = 'flex';
}

function updatePatienceBar(candidate) {
  var patienceEl = document.getElementById('negotiation-patience');
  if (!patienceEl) return;

  var remaining = Math.max(0, candidate.patience - candidate.patienceUsed);
  var pct = Math.round((remaining / candidate.patience) * 100);
  var color = pct > 60 ? 'var(--green)' : pct > 30 ? 'var(--amber)' : 'var(--red)';

  patienceEl.innerHTML =
    '<div class="patience-label">Patience</div>' +
    '<div class="patience-bar-track">' +
      '<div class="patience-bar-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
    '</div>';
}

// --- Dashboard Actions (Management focused — no project work/accept) ---

function getDashboardActions() {
  var actions = [];

  // Post job
  if (!G.jobPosted && canPostJob()) {
    actions.push({
      id: 'post_job',
      name: 'Post Job Listing',
      desc: 'Candidates arrive next day',
      cost: AP_COSTS.post_job + ' AP',
      enabled: canAct(AP_COSTS.post_job),
      action: actionPostJob,
    });
  } else if (!G.jobPosted && !canPostJob()) {
    actions.push({
      id: 'post_job_cd',
      name: 'Post Job Listing',
      desc: 'Cooldown: ' + daysUntilCanPost() + ' day(s) remaining',
      cost: AP_COSTS.post_job + ' AP',
      enabled: false,
      action: function() {},
    });
  }

  // Staff Party
  if (G.team.length > 0) {
    var partyCost = 200 + (G.team.length * 80);
    if (canThrowParty()) {
      actions.push({
        id: 'staff_party',
        name: 'Throw Staff Party',
        desc: '+20 energy, +15 loyalty for all ($' + partyCost + ')',
        cost: AP_COSTS.staff_party + ' AP',
        enabled: canAct(AP_COSTS.staff_party) && G.cash >= partyCost,
        action: actionStaffParty,
      });
    } else {
      actions.push({
        id: 'staff_party_cd',
        name: 'Throw Staff Party',
        desc: 'Available in ' + Math.max(0, 7 - (G.day - G.lastPartyDay)) + ' day(s)',
        cost: AP_COSTS.staff_party + ' AP',
        enabled: false,
        action: function() {},
      });
    }
  }

  // Client calls for approaching deadlines
  for (var k = 0; k < G.activeProjects.length; k++) {
    var ap = G.activeProjects[k];
    var daysLeft = ap.daysToComplete - ap.daysActive;
    if (daysLeft <= 2 && ap.progress < 100) {
      var repCost = Math.min(5, ((ap.deadlineExtensions || 0) + 1) * 2);
      actions.push({
        id: 'call_' + ap.id,
        name: 'Client Call: ' + ap.client,
        desc: 'Extend ' + ap.name + ' +2 days (-' + repCost + ' rep)',
        cost: AP_COSTS.client_call + ' AP',
        enabled: canAct(AP_COSTS.client_call),
        action: (function(pid) {
          return function() { actionClientCall(pid); };
        })(ap.id)
      });
    }
  }

  return actions;
}
