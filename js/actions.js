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
  acquire:       10,
};

function canAct() {
  return G.apCurrent > 0 && !G.gameOver;
}

// Post-action hook: check for events, energy failures, re-render
function afterAction() {
  checkEnergyProjectFailures();
  checkForDayEvent();
  UI.renderAll();
}

// --- Action: Work on a project ---

function actionWorkProject(projectId) {
  if (!canAct()) return;

  var success = workOnProject(projectId);
  if (!success) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.work_project);

  if (checkExhaustedMistake()) {
    addLog('Exhaustion caused a bug in the code... lost some progress.', 'bad');
    for (var i = 0; i < G.activeProjects.length; i++) {
      if (G.activeProjects[i].id === projectId) {
        G.activeProjects[i].progress = Math.max(0, G.activeProjects[i].progress - 10);
        break;
      }
    }
  }

  afterAction();
}

// --- Action: Accept a pipeline project ---

function actionAcceptProject(projectId) {
  if (!canAct()) return;

  var success = acceptProject(projectId);
  if (!success) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.accept_project);
  afterAction();
}

// --- Action: Client call (extend ACTIVE project deadline) ---

function actionClientCall(projectId) {
  if (!canAct()) return;

  var found = false;
  for (var i = 0; i < G.activeProjects.length; i++) {
    if (G.activeProjects[i].id === projectId) {
      G.activeProjects[i].daysToComplete += 2;
      addLog('Called ' + G.activeProjects[i].client + ' — deadline extended by 2 days.', 'good');
      found = true;
      break;
    }
  }
  if (!found) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.client_call);
  afterAction();
}

// --- Action: Post a job ---

function actionPostJob() {
  if (!canAct()) return;
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
  spendAP(1);
  spendEnergy(ENERGY_COSTS.post_job);
  addLog('Job listing posted. Candidates will apply by tomorrow. (Next posting available in 7 days.)', 'info');
  afterAction();
}

// --- Action: Interview candidate ---

function actionInterview(candidateId) {
  if (!canAct()) return;

  var success = interviewCandidate(candidateId);
  if (!success) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.interview);
  afterAction();
}

// --- Action: Hire candidate ---

function actionHire(candidateId) {
  if (!canAct()) return;

  var success = hireCandidate(candidateId);
  if (!success) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.hire);
  afterAction();
}

// --- Action: Fire employee ---

function actionFire(employeeId) {
  fireEmployee(employeeId);
  UI.renderAll();
}

// --- Action: Acquire startup ---

function actionAcquire(competitorId) {
  if (!canAct()) return;

  var success = acquireStartup(competitorId);
  if (!success) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.acquire);
  afterAction();
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
  if (!canAct()) return;

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
  spendAP(1);

  addLog('Ordered ' + item.name + ' (-$' + item.cost + ', +' + item.energy + ' energy)', 'info');
  afterAction();
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
        cost: '1 AP',
        enabled: canAct(),
        action: (function(pid) {
          return function() { actionWorkProject(pid); };
        })(p.id)
      });
    }
  }

  // Accept pipeline projects
  for (var j = 0; j < G.pipeline.length; j++) {
    var lead = G.pipeline[j];
    actions.push({
      id: 'accept_' + lead.id,
      name: 'Accept: ' + lead.name,
      desc: lead.client + ' — $' + lead.payout + ' (expires in ' + lead.expiresIn + 'd)',
      cost: '1 AP',
      enabled: canAct(),
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
        cost: '1 AP',
        enabled: canAct(),
        action: (function(pid) {
          return function() { actionClientCall(pid); };
        })(ap.id)
      });
    }
  }

  // Post job (with cooldown)
  if (!G.jobPosted && canPostJob()) {
    actions.push({
      id: 'post_job',
      name: 'Post Job Listing',
      desc: 'Candidates arrive next day',
      cost: '1 AP',
      enabled: canAct(),
      action: actionPostJob,
    });
  } else if (!G.jobPosted && !canPostJob()) {
    actions.push({
      id: 'post_job_cd',
      name: 'Post Job Listing',
      desc: 'Cooldown: ' + daysUntilCanPost() + ' day(s) remaining',
      cost: '1 AP',
      enabled: false,
      action: function() {},
    });
  }

  // Food ordering (just coffee on dashboard, full list in shop)
  actions.push({
    id: 'food_coffee',
    name: 'Order Coffee',
    desc: '+15 energy ($8)',
    cost: '1 AP',
    enabled: canAct() && G.cash >= 8,
    action: function() { actionOrderFood('coffee'); },
  });

  return actions;
}
