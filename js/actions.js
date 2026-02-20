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
};

function canAct() {
  return G.apCurrent > 0 && !G.gameOver;
}

// --- Action: Work on a project ---

function actionWorkProject(projectId) {
  if (!canAct()) return;

  var success = workOnProject(projectId);
  if (!success) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.work_project);

  // Check for exhaustion mistake
  if (checkExhaustedMistake()) {
    addLog('Exhaustion caused a bug in the code... lost some progress.', 'bad');
    // Find the project and remove some progress
    for (var i = 0; i < G.activeProjects.length; i++) {
      if (G.activeProjects[i].id === projectId) {
        G.activeProjects[i].progress = Math.max(0, G.activeProjects[i].progress - 10);
        break;
      }
    }
  }

  UI.renderAll();
}

// --- Action: Accept a pipeline project ---

function actionAcceptProject(projectId) {
  if (!canAct()) return;

  var success = acceptProject(projectId);
  if (!success) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.accept_project);
  UI.renderAll();
}

// --- Action: Client call (extend a lead) ---

function actionClientCall(projectId) {
  if (!canAct()) return;

  var found = false;
  for (var i = 0; i < G.pipeline.length; i++) {
    if (G.pipeline[i].id === projectId) {
      G.pipeline[i].expiresIn += 2;
      addLog('Called ' + G.pipeline[i].client + ' — lead extended by 2 days.', 'good');
      found = true;
      break;
    }
  }
  if (!found) return;

  spendAP(1);
  spendEnergy(ENERGY_COSTS.client_call);
  UI.renderAll();
}

// --- Action: Post a job ---

function actionPostJob() {
  if (!canAct()) return;
  if (G.jobPosted) {
    addLog('You already have a job posting active.', 'warn');
    return;
  }

  G.jobPosted = true;
  spendAP(1);
  spendEnergy(ENERGY_COSTS.post_job);
  addLog('Job listing posted. Candidates will apply by tomorrow.', 'info');
  UI.renderAll();
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
  UI.renderAll();
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

  // Client calls for pipeline leads about to expire
  for (var k = 0; k < G.pipeline.length; k++) {
    if (G.pipeline[k].expiresIn <= 2) {
      var cl = G.pipeline[k];
      actions.push({
        id: 'call_' + cl.id,
        name: 'Client Call: ' + cl.client,
        desc: 'Extend lead by 2 days',
        cost: '1 AP',
        enabled: canAct(),
        action: (function(pid) {
          return function() { actionClientCall(pid); };
        })(cl.id)
      });
    }
  }

  // Post job
  if (!G.jobPosted) {
    actions.push({
      id: 'post_job',
      name: 'Post Job Listing',
      desc: 'Candidates arrive next day',
      cost: '1 AP',
      enabled: canAct(),
      action: actionPostJob,
    });
  }

  // Food ordering
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
