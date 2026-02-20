/* ============================================
   actions.js — All Player Actions (AP System)
   ============================================ */

// Energy costs by action type
var ENERGY_COSTS = {
  work_project:  12,
  accept_project: 8,
  client_call:   8,
  post_job:      10,
  interview:     10,
  hire:          8,
  browse_shop:   5,
  order_food:    5,
  acquire:       15,
  scout:         8,
  poach:         12,
};

// AP costs by action type
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
  order_food:    1,
};

function canAct(apNeeded) {
  apNeeded = apNeeded || 1;
  return G.apCurrent >= apNeeded && !G.gameOver;
}

// Post-action hook: check for events, energy failures, re-render
function afterAction() {
  checkEnergyProjectFailures();
  checkForDayEvent();
  UI.renderAll();
}

// Wrap action result in a confirmation, then fire afterAction
function confirmThenAfterAction(message, type) {
  showActionConfirmation(message, type || 'good', function() {
    afterAction();
  });
}

// --- Action: Work on a project ---

function actionWorkProject(projectId) {
  if (!canAct(AP_COSTS.work_project)) return;

  // Find project first to get name for confirmation
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
    addLog('Exhaustion caused a bug in the code... lost some progress.', 'bad');
    project.progress = Math.max(0, project.progress - 10);
  }

  confirmThenAfterAction('Worked on ' + project.name + ' — ' + Math.round(project.progress) + '% complete', 'good');
}

// --- Action: Accept a pipeline project ---

function actionAcceptProject(projectId) {
  if (!canAct(AP_COSTS.accept_project)) return;

  // Get project name before accepting
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

// --- Action: Client call (extend ACTIVE project deadline) ---

function actionClientCall(projectId) {
  if (!canAct(AP_COSTS.client_call)) return;

  var found = false;
  var clientName = '';
  for (var i = 0; i < G.activeProjects.length; i++) {
    if (G.activeProjects[i].id === projectId) {
      G.activeProjects[i].daysToComplete += 2;
      clientName = G.activeProjects[i].client;
      addLog('Called ' + clientName + ' — deadline extended by 2 days.', 'good');
      found = true;
      break;
    }
  }
  if (!found) return;

  spendAP(AP_COSTS.client_call);
  spendEnergy(ENERGY_COSTS.client_call);
  confirmThenAfterAction('Called ' + clientName + ' — deadline extended by 2 days.', 'good');
}

// --- Action: Post a job (2 AP) ---

function actionPostJob() {
  if (!canAct(AP_COSTS.post_job)) return;
  if (G.jobPosted) {
    addLog('You already have a job posting active.', 'warn');
    return;
  }
  if (!canPostJob()) {
    addLog('Can\'t post again yet. ' + daysUntilCanPost() + ' days until next posting.', 'warn');
    return;
  }

  G.jobPosted = true;
  G.lastJobPostDay = G.day;
  spendAP(AP_COSTS.post_job);
  spendEnergy(ENERGY_COSTS.post_job);
  addLog('Job listing posted. Candidates will apply by tomorrow. (Next posting available in 7 days.)', 'info');
  confirmThenAfterAction('Job listing posted! Candidates will apply tomorrow.', 'info');
}

// --- Action: Interview candidate ---

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

// --- Action: Hire candidate (opens negotiation) ---

function actionHire(candidateId) {
  if (!canAct(AP_COSTS.hire)) return;

  var c = findCandidate(candidateId);
  if (!c) return;

  // Show negotiation modal
  showNegotiationModal(c);
}

// Complete the hire after negotiation
function completeHire(candidateId, negotiatedSalary) {
  var c = findCandidate(candidateId);
  if (!c) return;

  if (negotiatedSalary !== undefined) {
    c.salary = negotiatedSalary;
  }

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

  confirmThenAfterAction('Scouted ' + (comp ? comp.name : 'competitor') + ' — team intel gathered.', 'info');
}

// --- Action: Poach employee from competitor ---

function actionPoach(competitorId, candidateId) {
  if (!canAct(AP_COSTS.poach)) return;

  var result = poachEmployee(competitorId, candidateId);

  spendAP(AP_COSTS.poach);
  spendEnergy(ENERGY_COSTS.poach);

  confirmThenAfterAction(result.message, result.success ? 'good' : 'bad');
}

// --- Action: Order Food (instant energy) ---

var FOOD_ITEMS = [
  { id: 'coffee',        name: 'Coffee',        cost: 8,  energy: 15, desc: '+15 energy' },
  { id: 'healthy_lunch', name: 'Healthy Lunch',  cost: 18, energy: 25, desc: '+25 energy' },
  { id: 'uber_eats',     name: 'Uber Eats',      cost: 35, energy: 40, desc: '+40 energy' },
  { id: 'matcha',        name: 'Matcha',          cost: 12, energy: 20, desc: '+20 energy' },
  { id: 'energy_drink',  name: 'Energy Drink',    cost: 6,  energy: 30, desc: '+30 energy, -10 tomorrow' },
];

function actionOrderFood(foodId) {
  if (!canAct(AP_COSTS.order_food)) return;

  var item = null;
  for (var i = 0; i < FOOD_ITEMS.length; i++) {
    if (FOOD_ITEMS[i].id === foodId) { item = FOOD_ITEMS[i]; break; }
  }
  if (!item) return;

  if (G.cash < item.cost) {
    addLog('Can\'t afford ' + item.name + '.', 'bad');
    return;
  }

  G.cash -= item.cost;
  G.energy = Math.min(G.energyMax, G.energy + item.energy);
  spendAP(AP_COSTS.order_food);

  addLog('Ordered ' + item.name + ' (-$' + item.cost + ', +' + item.energy + ' energy)', 'info');
  confirmThenAfterAction('Ordered ' + item.name + ' — +' + item.energy + ' energy', 'info');
}

// --- Negotiation Modal ---

function showNegotiationModal(candidate) {
  var modal = document.getElementById('negotiation-modal');
  var nameEl = document.getElementById('negotiation-name');
  var roleEl = document.getElementById('negotiation-role');
  var askingEl = document.getElementById('negotiation-asking');
  var offerInput = document.getElementById('negotiation-offer');
  var resultEl = document.getElementById('negotiation-result');
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

  btnOffer.style.display = '';
  btnAccept.style.display = '';
  btnClose.textContent = 'CANCEL';

  // Accept at asking price
  btnAccept.onclick = function() {
    modal.style.display = 'none';
    completeHire(candidate.id, candidate.askingSalary);
  };

  // Negotiate
  btnOffer.onclick = function() {
    var offered = parseInt(offerInput.value);
    if (isNaN(offered) || offered <= 0) return;

    var result = negotiateSalary(candidate.id, offered);
    resultEl.textContent = result.message;

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
      // Can still try again or accept at asking
    }
  };

  // Cancel
  btnClose.onclick = function() {
    modal.style.display = 'none';
  };

  modal.style.display = 'flex';
}

// --- Get available dashboard actions ---

function getDashboardActions() {
  var actions = [];

  // Work on active projects (founder can solo complexity <= 1.5)
  for (var i = 0; i < G.activeProjects.length; i++) {
    var p = G.activeProjects[i];
    if (p.complexity <= 1.5 && p.progress < 100) {
      actions.push({
        id: 'work_' + p.id,
        name: 'Work on: ' + p.name,
        desc: p.client + ' — ' + Math.round(p.progress) + '% done',
        cost: AP_COSTS.work_project + ' AP',
        enabled: canAct(AP_COSTS.work_project),
        action: (function(pid) {
          return function() { actionWorkProject(pid); };
        })(p.id)
      });
    }
  }

  // Accept pipeline projects
  for (var j = 0; j < G.pipeline.length; j++) {
    var lead = G.pipeline[j];
    var check = canAcceptProject(lead);
    var reqText = '';
    if (!check.ok) {
      reqText = ' [' + check.reason + ']';
    }
    if (lead.requiredRole || lead.minTeam > 0) {
      var reqParts = [];
      if (lead.minTeam > 0) reqParts.push(lead.minTeam + '+ team');
      if (lead.requiredRole) reqParts.push('needs ' + lead.requiredRole);
      reqText = reqText || (' [' + reqParts.join(', ') + ']');
    }
    actions.push({
      id: 'accept_' + lead.id,
      name: 'Accept: ' + lead.name,
      desc: lead.client + ' — $' + lead.payout.toLocaleString() + ' (expires in ' + lead.expiresIn + 'd)' + reqText,
      cost: AP_COSTS.accept_project + ' AP',
      enabled: canAct(AP_COSTS.accept_project) && check.ok,
      action: (function(pid) {
        return function() { actionAcceptProject(pid); };
      })(lead.id)
    });
  }

  // Client calls for ACTIVE projects approaching deadline
  for (var k = 0; k < G.activeProjects.length; k++) {
    var ap = G.activeProjects[k];
    var daysLeft = ap.daysToComplete - ap.daysActive;
    if (daysLeft <= 2 && ap.progress < 100) {
      actions.push({
        id: 'call_' + ap.id,
        name: 'Client Call: ' + ap.client,
        desc: 'Extend deadline by 2 days (' + ap.name + ')',
        cost: AP_COSTS.client_call + ' AP',
        enabled: canAct(AP_COSTS.client_call),
        action: (function(pid) {
          return function() { actionClientCall(pid); };
        })(ap.id)
      });
    }
  }

  // Post job (with cooldown) — costs 2 AP
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

  // Food ordering (just coffee on dashboard, full list in shop)
  actions.push({
    id: 'food_coffee',
    name: 'Order Coffee',
    desc: '+15 energy ($8)',
    cost: AP_COSTS.order_food + ' AP',
    enabled: canAct(AP_COSTS.order_food) && G.cash >= 8,
    action: function() { actionOrderFood('coffee'); },
  });

  return actions;
}
