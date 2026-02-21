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
  if (G.energy <= 0) return false; // No energy = no actions
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

// Track which project dropdown should stay open after a work action
var _keepDropdownOpen = null;

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

  // Keep dropdown open after working — no confirmation popup needed
  _keepDropdownOpen = projectId;
  afterAction();
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

  var wasPoached = !!c.isBeingPoached;

  if (negotiatedSalary !== undefined) c.salary = negotiatedSalary;

  var success = hireCandidate(candidateId);
  if (!success) return;

  // Poached hires already paid AP for the poach action — don't double-charge
  if (!wasPoached) {
    spendAP(AP_COSTS.hire);
    spendEnergy(ENERGY_COSTS.hire);
  } else {
    spendEnergy(4); // Small energy cost for onboarding
  }
  confirmThenAfterAction('Hired ' + c.name + ' at $' + c.salary.toLocaleString() + '/wk!', 'good');
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

  if (result.success && result.candidate) {
    // Immediately open negotiation with the poached candidate
    UI.renderAll();
    showNegotiationModal(result.candidate);
  } else {
    confirmThenAfterAction(result.message, 'bad');
  }
}

// --- Action: Create Own Product ---

function actionCreateProduct(typeId, scopeId, productName) {
  var scope = OWN_PRODUCT_SCOPES.find(function(s) { return s.id === scopeId; });
  if (!scope) return;
  if (G.cash < scope.investment) {
    addLog('Need $' + scope.investment.toLocaleString() + ' to start development.', 'bad');
    return;
  }
  var product = createOwnProduct(typeId, scopeId, productName);
  if (!product) return;
  confirmThenAfterAction('Started developing "' + product.name + '"! Investment: $' + scope.investment.toLocaleString() + '.', 'good');
}

// --- Action: Work on own product (1 AP) ---

function actionWorkOnProduct(productId) {
  if (!canAct(AP_COSTS.work_project)) return;
  var success = workOnOwnProduct(productId);
  if (!success) return;
  spendAP(AP_COSTS.work_project);
  spendEnergy(ENERGY_COSTS.work_project);
  var product = G.ownedProducts.find(function(p) { return p.id === productId; });
  var msg = product ? '"' + product.name + '" — ' + Math.round(product.progress) + '% developed' : 'Worked on product.';
  confirmThenAfterAction(msg, 'good');
}

// --- Action: Update/patch own product (restore quality) ---

function actionUpdateProduct(productId) {
  if (!canAct(1)) return;
  var product = G.ownedProducts.find(function(p) { return p.id === productId; });
  if (!product) return;
  var cost = Math.round(product.investment * 0.2);
  if (G.cash < cost) {
    addLog('Need $' + cost.toLocaleString() + ' to update "' + product.name + '".', 'bad');
    return;
  }
  var success = updateOwnProduct(productId);
  if (!success) return;
  spendAP(1);
  spendEnergy(8);
  confirmThenAfterAction('Updated "' + product.name + '"! Quality restored. -$' + cost.toLocaleString() + '.', 'good');
}

// --- Action: Assign team to own product ---

function actionAssignToProduct(employeeId, productId) {
  assignToProduct(employeeId, productId);
  UI.renderAll();
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
  // Exponential scaling: each level costs significantly more
  // Level 1→2: $1,000 | 2→3: $2,500 | 3→4: $5,500 | 4→5: $11,000
  // 5→6: $22,000 | 6→7: $40,000 | 7→8: $70,000 | 8→9: $120,000 | 9→10: $200,000
  var costs = [0, 1000, 2500, 5500, 11000, 22000, 40000, 70000, 120000, 200000];
  return costs[currentLevel] || 200000;
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

  // Press Release
  var pressCD = 14;
  var pressAvail = (G.day - (G.lastPressReleaseDay || -99)) >= pressCD;
  var pressStageCosts = { freelancer: 500, home_office: 800, micro: 1500, boutique: 4000, scaleup: 10000, leader: 25000 };
  var pressCost = pressStageCosts[G.stage] || 500;
  var pressRepGain = G.stage === 'freelancer' ? 5 : G.stage === 'home_office' ? 7 : G.stage === 'micro' ? 9 : G.stage === 'boutique' ? 11 : 15;
  if (pressAvail) {
    actions.push({
      id: 'press_release',
      name: 'Issue Press Release',
      desc: '+' + pressRepGain + ' rep, good for brand visibility ($' + pressCost.toLocaleString() + ')',
      cost: '1 AP',
      enabled: canAct(1) && G.cash >= pressCost,
      action: actionPressRelease,
    });
  } else {
    actions.push({
      id: 'press_release_cd',
      name: 'Issue Press Release',
      desc: 'Cooldown: ' + Math.max(0, pressCD - (G.day - (G.lastPressReleaseDay || -99))) + ' day(s)',
      cost: '1 AP',
      enabled: false,
      action: function() {},
    });
  }

  // Team Training Day
  if (G.team.length > 0) {
    var trainingCD = 21;
    var trainingAvail = (G.day - (G.lastTrainingDay || -99)) >= trainingCD;
    var trainingCost = 200 * G.team.length;
    if (trainingAvail) {
      actions.push({
        id: 'team_training',
        name: 'Team Training Day',
        desc: 'Boost all employees skills +1 (random), +10 loyalty ($' + trainingCost.toLocaleString() + ')',
        cost: '2 AP',
        enabled: canAct(2) && G.cash >= trainingCost,
        action: actionTeamTrainingDay,
      });
    } else {
      actions.push({
        id: 'team_training_cd',
        name: 'Team Training Day',
        desc: 'Cooldown: ' + Math.max(0, trainingCD - (G.day - (G.lastTrainingDay || -99))) + ' day(s)',
        cost: '2 AP',
        enabled: false,
        action: function() {},
      });
    }
  }

  // Open Source Contribution
  var osCD = 7;
  var osAvail = (G.day - (G.lastOpenSourceDay || -99)) >= osCD;
  if (osAvail) {
    actions.push({
      id: 'open_source',
      name: 'Open Source Contribution',
      desc: '+3 rep, extra lead tomorrow (no cost)',
      cost: '1 AP',
      enabled: canAct(1),
      action: actionOpenSource,
    });
  } else {
    actions.push({
      id: 'open_source_cd',
      name: 'Open Source Contribution',
      desc: 'Cooldown: ' + Math.max(0, osCD - (G.day - (G.lastOpenSourceDay || -99))) + ' day(s)',
      cost: '1 AP',
      enabled: false,
      action: function() {},
    });
  }

  // Take Vacation (requires team)
  if (G.team.length >= 1) {
    actions.push({
      id: 'vacation',
      name: 'Take a Vacation',
      desc: 'Step away for 1-7 days. Team & bills continue. Refreshed on return.',
      cost: 'No AP',
      enabled: true,
      action: function() { UI.showVacationModal(); },
    });
  }

  return actions;
}

// --- Action: Press Release ---
function actionPressRelease() {
  if (!canAct(1)) return;
  var pressStageCosts = { freelancer: 500, home_office: 800, micro: 1500, boutique: 4000, scaleup: 10000, leader: 25000 };
  var cost = pressStageCosts[G.stage] || 500;
  if (G.cash < cost) {
    addLog('Can\'t afford a press release. Need $' + cost.toLocaleString() + '.', 'bad');
    return;
  }
  var repGain = G.stage === 'freelancer' ? 5 : G.stage === 'home_office' ? 7 : G.stage === 'micro' ? 9 : G.stage === 'boutique' ? 11 : 15;
  G.cash -= cost;
  G.reputation += repGain;
  G.lastPressReleaseDay = G.day;
  spendAP(1);
  addLog('Press release issued! +' + repGain + ' rep. -$' + cost.toLocaleString() + '.', 'good');
  confirmThenAfterAction('Press release out! +' + repGain + ' rep.', 'good');
}

// --- Action: Team Training Day ---
function actionTeamTrainingDay() {
  if (!canAct(2)) return;
  var cost = 200 * G.team.length;
  if (G.cash < cost) {
    addLog('Can\'t afford team training. Need $' + cost.toLocaleString() + '.', 'bad');
    return;
  }
  G.cash -= cost;
  G.lastTrainingDay = G.day;
  spendAP(2);
  var skills = ['technical', 'communication', 'reliability'];
  for (var i = 0; i < G.team.length; i++) {
    var sk = randomChoice(skills);
    G.team[i][sk] = Math.min(10, G.team[i][sk] + 1);
    G.team[i].loyalty = Math.min(100, G.team[i].loyalty + 10);
  }
  addLog('Team training day complete! All employees gained +1 to a skill and +10 loyalty. -$' + cost.toLocaleString() + '.', 'good');
  confirmThenAfterAction('Team training done! +1 skill, +10 loyalty for everyone.', 'good');
}

// --- Action: Open Source Contribution ---
function actionOpenSource() {
  if (!canAct(1)) return;
  G.reputation += 3;
  G.lastOpenSourceDay = G.day;
  spendAP(1);
  // Flag to add an extra lead next day
  G._openSourcePendingLead = true;
  addLog('Published an open source contribution. +3 rep. Extra lead incoming tomorrow.', 'good');
  confirmThenAfterAction('Open source published! +3 rep. New lead arrives tomorrow.', 'good');
}

// --- Action: Clear Completed Projects ---
function actionClearCompletedProjects() {
  var count = G.completedProjects.length;
  G.completedProjects = [];
  addLog('Archived ' + count + ' completed project(s).', 'info');
  UI.renderAll();
}
