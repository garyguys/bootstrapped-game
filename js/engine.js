/* ============================================
   engine.js — Core Game Loop, Day/Night Cycle
   Energy scales with active projects.
   Deadline penalties. Player skills.
   ============================================ */

// --- Transaction Ledger ---
function recordTransaction(type, category, amount, description) {
  if (!G.transactions) G.transactions = [];
  G.transactions.push({ day: G.day, type: type, category: category, amount: amount, description: description });
}

// --- Stage Helpers ---
function getStageNameById(id) {
  for (var i = 0; i < STAGES.length; i++) {
    if (STAGES[i].id === id) return STAGES[i].name;
  }
  return id;
}

var STAGE_UNLOCKS = {
  home_office:  ['Hire employees & post job listings', 'Press releases available'],
  startup:      ['Develop your own products', 'Projects up to complexity 2.5'],
  seed_stage:   ['Projects up to complexity 3', 'Higher-value contracts'],
  series_a:     ['Projects up to complexity 4', 'Premium enterprise clients'],
  growth:       ['Max complexity projects (5)'],
  enterprise:   ['One stage from victory \u2014 keep pushing!'],
  leader:       ['You\'ve won! Congratulations.'],
};

function showStageUpgradeModal(from, to) {
  var modal = document.getElementById('event-modal');
  document.getElementById('event-modal-title').textContent = 'STAGE UP!';
  var unlocks = STAGE_UNLOCKS[to] || [];
  document.getElementById('event-modal-desc').innerHTML =
    '<strong>' + getStageNameById(from) + '</strong> &rarr; <strong>' + getStageNameById(to) + '</strong>' +
    (unlocks.length ? '<br><br>Unlocks:<br>' + unlocks.map(function(u) { return '&bull; ' + u; }).join('<br>') : '');
  var choices = document.getElementById('event-modal-choices');
  choices.innerHTML = '';
  var btn = document.createElement('button');
  btn.className = 'btn btn-primary btn-small';
  btn.textContent = "LET'S GO!";
  btn.onclick = function() { modal.style.display = 'none'; };
  choices.appendChild(btn);
  modal.style.display = 'flex';
}

function spendAP(amount) {
  amount = amount || 1;
  if (G._devUnlimitedAP) { G.timeSlot += amount; return true; }
  if (G.apCurrent < amount) return false;
  G.apCurrent -= amount;
  G.apUsedToday += amount;
  G.timeSlot += amount;
  return true;
}

function spendEnergy(amount) {
  var overhead = Math.floor(G.team.length * 0.5);
  // Employee gym: reduce team overhead by 1
  if (G.upgrades.indexOf('employee_gym') !== -1) overhead = Math.max(0, overhead - 1);
  // Meal prep: 25% energy discount
  if (G.mealPrepCharges && G.mealPrepCharges > 0) {
    amount = Math.round(amount * 0.75);
    G.mealPrepCharges -= 1;
    if (G.mealPrepCharges <= 0) addLog('Meal prep charges used up.', 'info');
  }
  if (G._devUnlimitedEnergy) return;
  G.energy = Math.max(0, G.energy - (amount + overhead));
  // Low energy warning (one-shot per day)
  var threshold = Math.floor(G.energyMax * 0.15);
  if (G.energy > 0 && G.energy <= threshold && !G.lowEnergyWarned) {
    G.lowEnergyWarned = true;
    showActionConfirmation('WARNING: Energy critically low (' + G.energy + '/' + G.energyMax + ')! Consider resting or eating.', 'warn');
  }
}

function getEnergyStatus() {
  if (G.energy >= 80) return 'fresh';
  if (G.energy >= 50) return 'ok';
  if (G.energy >= 25) return 'tired';
  return 'exhausted';
}

function checkExhaustedMistake() {
  if (G.energy < 25 && Math.random() < 0.20) return true;
  return false;
}

// Calculate energy recovery for sleeping based on active projects
function getSleepEnergyRecovery() {
  var base = 75;
  if (G.upgrades.indexOf('employee_gym') !== -1) base += 10;
  var projectPenalty = G.activeProjects.length * 10;
  var teamOverhead = Math.floor(G.team.length * 2);
  return Math.max(30, base - projectPenalty - teamOverhead);
}

function getPushEnergyRecovery() {
  var base = 30;
  var projectPenalty = G.activeProjects.length * 6;
  return Math.max(10, base - projectPenalty);
}

// --- Energy Exhaustion: Project Failures + Team Conflict ---

function checkEnergyProjectFailures() {
  if (G.energy > 0) return;

  // Energy = 0 blocks all future actions (canAct checks energy)
  // Also trigger negative effects
  addLog('ENERGY DEPLETED — No more actions possible today!', 'bad');

  // Project progress loss
  if (G.activeProjects.length > 0) {
    var failCount = Math.random() < 0.4 ? 2 : 1;
    failCount = Math.min(failCount, G.activeProjects.length);
    var shuffled = G.activeProjects.slice().sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < failCount; i++) {
      var p = shuffled[i];
      var loss = randomInt(10, 20);
      p.progress = Math.max(0, p.progress - loss);
      addLog('Exhaustion set back ' + p.name + ' by -' + loss + '% progress.', 'bad');
      if (p.daysActive >= p.daysToComplete && p.progress < 30) {
        G.activeProjects = G.activeProjects.filter(function(x) { return x.id !== p.id; });
        G.reputation = Math.max(0, G.reputation - p.repGain);
        addLog(p.client + ' cancelled the project due to repeated failures! -' + p.repGain + ' rep.', 'bad');
      }
    }
  }

  // Increased team conflict chance (60% when energy = 0)
  if (G.team.length >= 2 && Math.random() < 0.6) {
    for (var j = 0; j < G.team.length; j++) {
      G.team[j].loyalty = Math.max(0, G.team[j].loyalty - 8);
    }
    addLog('Your burnout is spreading to the team. Loyalty -8 for everyone.', 'bad');
  }
}

// --- End Day / Sleep ---

function endDay(pushThrough) {
  advanceProjects();
  tickTeam();
  checkProjectDeliveries();
  checkMissedDeadlines();

  if (G.competitors && G.competitors.length > 0) {
    tickMarket();
  }

  tickPerks();
  rollOvernightEvents();
  checkPayroll();
  tickProducts();

  if (pushThrough) {
    G.pushedLastNight = true;
    addLog('Pushed through the night... exhausted.', 'warn');
  } else {
    G.pushedLastNight = false;
  }

  saveGame();

  showDayTransition(function() {
    startNewDay();
  });
}

// Silent day advance for vacation (no animation, no player actions)
function endDaySilent() {
  advanceProjects();
  tickTeam();
  checkProjectDeliveries();
  checkMissedDeadlines();
  if (G.competitors && G.competitors.length > 0) tickMarket();
  tickPerks();
  rollOvernightEvents();
  checkPayroll();
  tickProducts();

  G.day += 1;
  G.dayOfWeek = (G.dayOfWeek + 1) % 7;
  G.timeSlot = 0;
  G.apUsedToday = 0;
  G.pushedThroughTonight = false;
  G.dayEventFired = false;
  G.pushedLastNight = false;
  G.lowEnergyWarned = false;
  G.energyDepletedHandled = false;
  G.foodPurchasedToday = {};

  G.apMax = getBaseAPMax();
  G.apCurrent = G.apMax;
  G.energy = getSleepEnergyRecovery();
  if (G.upgrades.indexOf('coffee_machine') !== -1) G.energy = Math.min(G.energyMax, G.energy + 10);
  if (G.upgrades.indexOf('ping_pong') !== -1) G.energy = Math.min(G.energyMax, G.energy + 5);
  if (G.upgrades.indexOf('rooftop_terrace') !== -1) G.energy = Math.min(G.energyMax, G.energy + 20);
  if (G.dayOfWeek >= 5) G.energy = Math.min(G.energyMax, G.energy + 10);

  if (G._openSourcePendingLead) {
    G._openSourcePendingLead = false;
    if (G.pipeline.length < 5) G.pipeline.push(generateProject());
  }
  if (G.pipeline.length < 2) generatePipelineLeads(G.day <= 7);
  agePipelineLeads();
  ageCandidates();
  checkStageProgression();
  checkBankruptcy();
}

// --- Monthly Recap (every 4 weeks) ---
function showMonthlyRecap() {
  var monthNum = Math.floor((G.day - 1) / 28);
  var startDay = (monthNum - 1) * 28 + 1;
  var endDay = monthNum * 28;

  var monthIncome = 0, monthExpenses = 0;
  var monthProjectsCompleted = 0;
  var monthClients = {};
  for (var i = 0; i < (G.transactions || []).length; i++) {
    var tx = G.transactions[i];
    if (tx.day >= startDay && tx.day <= endDay) {
      if (tx.type === 'income') monthIncome += tx.amount;
      else monthExpenses += tx.amount;
    }
  }
  for (var j = 0; j < G.completedProjects.length; j++) {
    var cp = G.completedProjects[j];
    if (cp.day >= startDay && cp.day <= endDay) {
      monthProjectsCompleted++;
      if (!monthClients[cp.client]) monthClients[cp.client] = 0;
      monthClients[cp.client] += cp.payout;
    }
  }
  var bestClient = 'None';
  var bestVal = 0;
  for (var cn in monthClients) {
    if (Object.prototype.hasOwnProperty.call(monthClients, cn)) {
      if (monthClients[cn] > bestVal) { bestVal = monthClients[cn]; bestClient = cn; }
    }
  }
  var shares = getPlayerMarketShare();
  var marketPct = Math.round((shares.player / shares.total) * 100);
  var netPL = monthIncome - monthExpenses;

  var modal = document.getElementById('event-modal');
  document.getElementById('event-modal-title').textContent = 'MONTHLY RECAP — Month ' + monthNum;
  document.getElementById('event-modal-desc').innerHTML =
    '<div class="negotiation-row"><span>Revenue</span><span style="color:var(--green)">$' + monthIncome.toLocaleString() + '</span></div>' +
    '<div class="negotiation-row"><span>Expenses</span><span style="color:var(--red)">-$' + monthExpenses.toLocaleString() + '</span></div>' +
    '<div class="negotiation-row" style="border-top:1px solid var(--border);padding-top:0.25rem;"><span>Net P&L</span><span style="color:' + (netPL >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (netPL >= 0 ? '+' : '') + '$' + netPL.toLocaleString() + '</span></div>' +
    '<br>' +
    '<div class="negotiation-row"><span>Market Share</span><span>' + marketPct + '%</span></div>' +
    '<div class="negotiation-row"><span>Projects Completed</span><span>' + monthProjectsCompleted + '</span></div>' +
    '<div class="negotiation-row"><span>Best Customer</span><span>' + escHtml(bestClient) + (bestVal > 0 ? ' ($' + bestVal.toLocaleString() + ')' : '') + '</span></div>' +
    '<div class="negotiation-row"><span>Team Size</span><span>' + G.team.length + '</span></div>' +
    '<div class="negotiation-row"><span>Cash on Hand</span><span style="color:var(--green)">$' + G.cash.toLocaleString() + '</span></div>';

  var choices = document.getElementById('event-modal-choices');
  choices.innerHTML = '';
  var btn = document.createElement('button');
  btn.className = 'btn btn-primary btn-small';
  btn.textContent = 'ONWARD!';
  btn.onclick = function() { modal.style.display = 'none'; };
  choices.appendChild(btn);
  modal.style.display = 'flex';
}

// --- Weekly Recap (every 7 days, skip when monthly fires) ---
function showWeeklyRecap() {
  var weekNum = Math.floor((G.day - 1) / 7);
  var wStart = (weekNum - 1) * 7 + 1;
  var wEnd = weekNum * 7;
  var weekIncome = 0, weekExpenses = 0, weekProjects = 0;
  for (var i = 0; i < (G.transactions || []).length; i++) {
    var tx = G.transactions[i];
    if (tx.day >= wStart && tx.day <= wEnd) {
      if (tx.type === 'income') weekIncome += tx.amount;
      else weekExpenses += tx.amount;
    }
  }
  for (var j = 0; j < G.completedProjects.length; j++) {
    if (G.completedProjects[j].day >= wStart && G.completedProjects[j].day <= wEnd) weekProjects++;
  }
  var netPL = weekIncome - weekExpenses;
  var modal = document.getElementById('event-modal');
  document.getElementById('event-modal-title').textContent = 'WEEKLY RECAP \u2014 Week ' + weekNum;
  document.getElementById('event-modal-desc').innerHTML =
    '<div class="negotiation-row"><span>Revenue</span><span style="color:var(--green)">$' + weekIncome.toLocaleString() + '</span></div>' +
    '<div class="negotiation-row"><span>Expenses</span><span style="color:var(--red)">-$' + weekExpenses.toLocaleString() + '</span></div>' +
    '<div class="negotiation-row" style="border-top:1px solid var(--panel-border);padding-top:0.25rem;"><span>Net P&L</span><span style="color:' + (netPL >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (netPL >= 0 ? '+' : '') + '$' + netPL.toLocaleString() + '</span></div>' +
    '<br>' +
    '<div class="negotiation-row"><span>Projects Completed</span><span>' + weekProjects + '</span></div>' +
    '<div class="negotiation-row"><span>Team Size</span><span>' + G.team.length + '</span></div>' +
    '<div class="negotiation-row"><span>Cash on Hand</span><span style="color:var(--green)">$' + G.cash.toLocaleString() + '</span></div>';
  var choices = document.getElementById('event-modal-choices');
  choices.innerHTML = '';
  var btn = document.createElement('button');
  btn.className = 'btn btn-primary btn-small';
  btn.textContent = 'ONWARD!';
  btn.onclick = function() { modal.style.display = 'none'; };
  choices.appendChild(btn);
  modal.style.display = 'flex';
}

// v0.16: Product launch modal
function showProductLaunchModal(data) {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = '"' + data.name + '" IS NOW LIVE!';

  var grade = 'C';
  var score = (data.quality + data.interest) / 2;
  if (score >= 85) grade = 'S';
  else if (score >= 75) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else grade = 'D';

  var gradeColor = { S: 'var(--amber)', A: 'var(--green)', B: 'var(--cyan)', C: 'var(--grey)', D: 'var(--red)' };

  var dailyIncome = Math.round((data.quality / 100) * (data.interest / 100) * data.maxRevenue);

  var html = '<div style="text-align:center;margin-bottom:12px;">' +
    '<span style="font-size:1.8rem;color:' + (gradeColor[grade] || 'var(--green)') + ';">' + grade + '</span>' +
    '<div style="color:var(--grey);font-size:0.7rem;">LAUNCH GRADE</div></div>' +
    '<div class="negotiation-row"><span>Product Quality</span><span style="color:var(--green)">' + data.quality + '%</span></div>' +
    '<div class="negotiation-row"><span>Market Interest</span><span style="color:var(--cyan)">' + data.interest + '%</span></div>' +
    '<div class="negotiation-row"><span>Max Revenue</span><span style="color:var(--amber)">$' + data.maxRevenue.toLocaleString() + '/day</span></div>' +
    '<div class="negotiation-row"><span>Projected Income</span><span style="color:var(--green)">$' + dailyIncome.toLocaleString() + '/day</span></div>';

  if (data.teamNames && data.teamNames.length > 0) {
    html += '<div class="negotiation-row"><span>Team</span><span>' + data.teamNames.join(', ') + '</span></div>' +
      '<div class="negotiation-row"><span>Avg Team Skill</span><span>' + data.avgSkill.toFixed(1) + '/10</span></div>';
  } else {
    html += '<div class="negotiation-row"><span>Built by</span><span>You (solo)</span></div>';
  }

  desc.innerHTML = html;
  choices.innerHTML = '';

  var btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = 'LAUNCH!';
  btn.onclick = function() { modal.style.display = 'none'; };
  choices.appendChild(btn);
  modal.style.display = 'flex';
}

function startNewDay() {
  G.day += 1;
  G.dayOfWeek = (G.dayOfWeek + 1) % 7;
  G.timeSlot = 0;
  G.apUsedToday = 0;
  G.pushedThroughTonight = false;
  G.dayEventFired = false;
  G.lowEnergyWarned = false;
  G.energyDepletedHandled = false;
  G.foodPurchasedToday = {};

  // AP reset (includes ops team bonus)
  if (G.pushedLastNight) {
    G.apMax = getBaseAPMax() - 1;
    G.apCurrent = G.apMax;
  } else {
    G.apMax = getBaseAPMax();
    G.apCurrent = G.apMax;
  }

  // Energy reset — scales with active projects
  if (G.pushedLastNight) {
    G.energy = getPushEnergyRecovery();
  } else {
    G.energy = getSleepEnergyRecovery();
  }

  // v0.16: Late night gaming reduces energy to 3/4
  if (G._lateNightGaming) {
    G.energy = Math.round(G.energy * 0.75);
    G._lateNightGaming = false;
    addLog('Feeling groggy after last night\'s gaming session...', 'warn');
  }

  // Coffee machine bonus
  if (G.upgrades.indexOf('coffee_machine') !== -1) {
    G.energy = Math.min(G.energyMax, G.energy + 10);
  }

  // Ping pong table bonus
  if (G.upgrades.indexOf('ping_pong') !== -1) {
    G.energy = Math.min(G.energyMax, G.energy + 5);
  }

  // Rooftop terrace bonus
  if (G.upgrades.indexOf('rooftop_terrace') !== -1) {
    G.energy = Math.min(G.energyMax, G.energy + 20);
  }

  // Weekend rest bonus
  if (G.dayOfWeek >= 5) {
    G.energy = Math.min(G.energyMax, G.energy + 10);
  }

  // v0.16: Partnership expiry check (14 days)
  if (G.competitors) {
    for (var pi = 0; pi < G.competitors.length; pi++) {
      var pc = G.competitors[pi];
      if (pc.isPartner && pc.partnerDay && G.day - pc.partnerDay >= 14) {
        pc.isPartner = false;
        pc.partnerExpiredDay = G.day;
        addLog('Partnership with ' + pc.name + ' has expired.', 'warn');
        G.overnightEvents.push('Partnership with ' + pc.name + ' expired after 14 days.');
      }
    }
  }

  // v0.16: Product launch screen
  if (G._productLaunchData) {
    var pld = G._productLaunchData;
    G._productLaunchData = null;
    showProductLaunchModal(pld);
  }

  // Generate pipeline if needed (guarantee solo-able project first 7 days)
  if (G.pipeline.length < 2) {
    generatePipelineLeads(G.day <= 7);
  }

  // Referral partner perk: extra lead
  var refPerk = G.perks.find(function(p) { return p.id === 'referral_partner'; });
  if (refPerk && G.pipeline.length < 5) {
    G.pipeline.push(generateProject());
  }

  // Hustler perk
  var hustlerInTeam = G.team.some(function(e) { return e.perk && e.perk.id === 'hustler'; });
  if (hustlerInTeam && G.dayOfWeek === 0 && G.pipeline.length < 5) {
    G.pipeline.push(generateProject());
    addLog('Your hustler brought in an extra lead.', 'good');
  }

  // Networker perk
  for (var i = 0; i < G.team.length; i++) {
    var emp = G.team[i];
    if (emp.perk && emp.perk.id === 'networker' && emp.daysEmployed % 14 === 0 && emp.daysEmployed > 0) {
      G.reputation += emp.perk.value;
      addLog(emp.name + '\'s network brought in +' + emp.perk.value + ' rep.', 'good');
    }
  }

  // Open source contribution lead (from previous day's action)
  if (G._openSourcePendingLead) {
    G._openSourcePendingLead = false;
    if (G.pipeline.length < 5) {
      G.pipeline.push(generateProject());
      addLog('Your open source work attracted a new lead!', 'good');
    }
  }

  // Age pipeline leads
  agePipelineLeads();

  // Age candidates (withdrawal after 3-5 days)
  ageCandidates();

  // Generate candidates if job was posted
  if (G.jobPosted) {
    G.jobPosted = false;
    var newHires = generateCandidatesForPosting();
    addLog('NEW CANDIDATES: Applicants have arrived for your job posting! Check the Team tab.', 'good');
    G.overnightEvents.push('Job applicants have arrived! Check the Candidates section.');
    G._newCandidateNotification = newHires;
  }

  // Add morning log
  var dayName = DAYS_OF_WEEK[G.dayOfWeek];
  addLog('Day ' + G.day + ' (' + dayName + ') — Good morning.', 'info');

  if (G.pushedLastNight) {
    addLog('Feeling rough after pulling an all-nighter. AP reduced.', 'warn');
  }

  // Payroll warnings (3/2/1 day)
  if (G.team.length > 0) {
    var daysUntilPayroll = G.nextPayrollDay - G.day;
    var payrollAmount = getPayrollAmount();
    if (daysUntilPayroll === 3) {
      addLog('Payroll reminder: $' + payrollAmount.toLocaleString() + ' due in 3 days.', 'warn');
    } else if (daysUntilPayroll === 2) {
      addLog('Payroll warning: $' + payrollAmount.toLocaleString() + ' due in 2 days!', 'warn');
    } else if (daysUntilPayroll === 1) {
      addLog('PAYROLL TOMORROW! Need $' + payrollAmount.toLocaleString() + ' or team may quit.', 'bad');
    }
  }

  // Check stage progression and bankruptcy
  checkStageProgression();
  checkBankruptcy();

  saveGame();
  UI.renderAll();
  UI.switchTab('dashboard');

  // Weekly recap (every 7 days, skip when monthly fires)
  if (G.day > 1 && (G.day - 1) % 7 === 0 && (G.day - 1) % 28 !== 0) {
    showWeeklyRecap();
  }

  // Monthly recap (every 4 weeks)
  if (G.day > 1 && (G.day - 1) % 28 === 0) {
    showMonthlyRecap();
  }

  // Show project delivery popups
  if (G.deliveryQueue && G.deliveryQueue.length > 0) {
    showNextDeliveryPopup();
  }

  // Poach notification popup
  if (G._poachNotification) {
    var pn = G._poachNotification;
    var pModal = document.getElementById('event-modal');
    document.getElementById('event-modal-title').textContent = 'EMPLOYEE POACHED!';
    document.getElementById('event-modal-desc').innerHTML =
      '<span style="color:var(--red)">' + escHtml(pn.name) + ' was poached by a competitor!</span><br><br>' +
      '<div class="negotiation-row"><span>Role</span><span>' + escHtml(pn.role) + '</span></div>' +
      '<div class="negotiation-row"><span>Technical</span><span>' + pn.technical + '</span></div>' +
      '<div class="negotiation-row"><span>Communication</span><span>' + pn.communication + '</span></div>' +
      '<div class="negotiation-row"><span>Reliability</span><span>' + pn.reliability + '</span></div>' +
      '<div class="negotiation-row"><span>Loyalty</span><span>' + pn.loyalty + '</span></div>' +
      '<div class="negotiation-row"><span>Salary</span><span>$' + pn.salary.toLocaleString() + '/wk</span></div>';
    var pChoices = document.getElementById('event-modal-choices');
    pChoices.innerHTML = '';
    var pBtn = document.createElement('button');
    pBtn.className = 'btn btn-primary btn-small';
    pBtn.textContent = 'NOTED';
    pBtn.onclick = function() { pModal.style.display = 'none'; };
    pChoices.appendChild(pBtn);
    pModal.style.display = 'flex';
    G._poachNotification = null;
  }

  // New candidates notification popup
  if (G._newCandidateNotification && G._newCandidateNotification.length > 0) {
    var cands = G._newCandidateNotification;
    var cModal = document.getElementById('event-modal');
    document.getElementById('event-modal-title').textContent = 'NEW CANDIDATES!';
    var cHtml = '<span style="color:var(--green)">' + cands.length + ' applicants have responded to your job posting:</span><br><br>';
    for (var ci = 0; ci < cands.length; ci++) {
      var cd = cands[ci];
      cHtml += '<div class="negotiation-row"><span>' + escHtml(cd.name) + '</span><span>' + escHtml(cd.levelName + ' ' + cd.role.name) + '</span></div>';
    }
    cHtml += '<br><span style="color:var(--grey-light)">Interview them in the Team tab to learn more.</span>';
    document.getElementById('event-modal-desc').innerHTML = cHtml;
    var cChoices = document.getElementById('event-modal-choices');
    cChoices.innerHTML = '';
    var cBtn = document.createElement('button');
    cBtn.className = 'btn btn-primary btn-small';
    cBtn.textContent = 'VIEW CANDIDATES';
    cBtn.onclick = function() { cModal.style.display = 'none'; UI.switchTab('team'); };
    cChoices.appendChild(cBtn);
    var cBtn2 = document.createElement('button');
    cBtn2.className = 'btn btn-secondary btn-small';
    cBtn2.textContent = 'LATER';
    cBtn2.onclick = function() { cModal.style.display = 'none'; };
    cChoices.appendChild(cBtn2);
    cModal.style.display = 'flex';
    G._newCandidateNotification = null;
  }
}

function showNextDeliveryPopup() {
  if (!G.deliveryQueue || G.deliveryQueue.length === 0) return;
  var delivery = G.deliveryQueue.shift();

  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  var happinessIcon = { Delighted: '★', Satisfied: '✓', Neutral: '~', Disappointed: '✗' };
  var happinessColor = { Delighted: 'var(--green)', Satisfied: 'var(--cyan)', Neutral: 'var(--amber)', Disappointed: 'var(--red)' };
  var icon = happinessIcon[delivery.happiness] || '?';
  var color = happinessColor[delivery.happiness] || 'var(--grey-light)';

  title.textContent = 'PROJECT DELIVERED';
  var workerText = delivery.workers && delivery.workers.length > 0
    ? delivery.workers.join(', ')
    : 'Unassigned';
  var outcomeHtml = delivery.outcomeEvent
    ? '<br><br><span style="color:var(--amber)">Outcome: ' + escHtml(delivery.outcomeEvent) + '</span>'
    : '';

  desc.innerHTML =
    '<strong>' + escHtml(delivery.name) + '</strong> delivered to <strong>' + escHtml(delivery.client) + '</strong>' +
    '<br><br>' +
    'Client Happiness: <span style="color:' + color + '">' + icon + ' ' + escHtml(delivery.happiness) + '</span>' +
    '<br>Revenue: <span style="color:var(--green)">+$' + delivery.payout.toLocaleString() + '</span>' +
    '<br>Reputation: <span style="color:var(--cyan)">+' + delivery.repGain + ' rep</span>' +
    '<br>Worked by: ' + escHtml(workerText) +
    outcomeHtml;

  choices.innerHTML = '';
  var btnOk = document.createElement('button');
  btnOk.className = 'btn btn-primary btn-small';
  btnOk.textContent = G.deliveryQueue.length > 0 ? 'NEXT DELIVERY' : 'GREAT!';
  btnOk.onclick = function() {
    modal.style.display = 'none';
    if (G.deliveryQueue && G.deliveryQueue.length > 0) {
      showNextDeliveryPopup();
    }
  };
  choices.appendChild(btnOk);
  modal.style.display = 'flex';
}

function getBaseAPMax() {
  var base = 4;
  if (G.upgrades.indexOf('standing_desk') !== -1) base += 1;
  if (G.upgrades.indexOf('executive_suite') !== -1) base += 2;
  var opsCount = getOpsTeamCount();
  var opsBonus = Math.min(2, Math.floor(opsCount / 2));
  base += opsBonus;
  return base;
}

function tickPerks() {
  var remaining = [];
  for (var i = 0; i < G.perks.length; i++) {
    var p = G.perks[i];
    if (p.daysLeft !== undefined) {
      p.daysLeft -= 1;
      if (p.daysLeft > 0) {
        remaining.push(p);
      } else {
        addLog('Perk expired: ' + p.name, 'info');
      }
    } else {
      remaining.push(p);
    }
  }
  G.perks = remaining;
}

function checkPayroll() {
  if (G.team.length === 0) return;
  if (G.day < G.nextPayrollDay) return;

  var amount = getPayrollAmount();
  if (amount <= 0) return;

  G.nextPayrollDay = G.day + 7;

  if (G.cash >= amount) {
    G.cash -= amount;
    recordTransaction('expense', 'payroll', amount, 'Weekly payroll (' + G.team.length + ' employees)');
    addLog('Payroll: -$' + amount.toLocaleString() + ' for ' + G.team.length + ' employee(s).', 'warn');
    G.overnightEvents.push('Weekly payroll processed: -$' + amount.toLocaleString());
  } else {
    var shortfall = amount - G.cash;
    G.cash = 0;
    G.debt += shortfall;
    addLog('MISSED PAYROLL! Couldn\'t cover $' + amount.toLocaleString() + '. Debt: $' + G.debt.toLocaleString() + '.', 'bad');
    G.overnightEvents.push('MISSED PAYROLL! Team members leaving. Reputation hit.');

    // Reputation loss
    var repLoss = Math.min(15, Math.ceil(G.team.length * 1.5));
    G.reputation = Math.max(0, G.reputation - repLoss);
    addLog('Company reputation tanked. -' + repLoss + ' rep.', 'bad');

    // Loyalty-based walkout: high loyalty = more likely to stay, low loyalty = quit
    var stayers = [];
    var walkers = [];
    for (var i = 0; i < G.team.length; i++) {
      G.team[i].loyalty = Math.max(0, G.team[i].loyalty - 30);
      var stayChance = G.team[i].loyalty / 100;
      if (G.team[i].perk && G.team[i].perk.id === 'penny_pincher') stayChance += 0.2;
      if (G.team[i].flaw && G.team[i].flaw.id === 'job_hopper') stayChance -= 0.3;
      stayChance = Math.max(0.05, Math.min(0.95, stayChance));
      if (Math.random() < stayChance) {
        stayers.push(G.team[i]);
      } else {
        walkers.push(G.team[i]);
      }
    }
    // Stayers take additional morale hit
    for (var s = 0; s < stayers.length; s++) {
      stayers[s].loyalty = Math.max(5, stayers[s].loyalty - 15);
      addLog(stayers[s].name + ' is staying despite missed payroll, but morale is very low.', 'warn');
    }
    // Walkers quit
    for (var j = 0; j < walkers.length; j++) {
      var q = walkers[j];
      G.team = G.team.filter(function(e) { return e.id !== q.id; });
      // Unassign from projects
      for (var p = 0; p < G.activeProjects.length; p++) {
        if (G.activeProjects[p].assignedTeam) {
          G.activeProjects[p].assignedTeam = G.activeProjects[p].assignedTeam.filter(function(id) { return id !== q.id; });
        }
      }
      addLog(q.name + ' walked out after missed payroll!', 'bad');
      G.overnightEvents.push(q.name + ' quit — unpaid salary.');
    }
  }
}

function checkStageProgression() {
  if (G.gameOver || G.gameWon) return;
  var prev = G.stage;

  if (G.stage === 'freelancer' && G.reputation >= 25) {
    G.stage = 'home_office';
  } else if (G.stage === 'home_office' && G.reputation >= 75) {
    G.stage = 'startup';
  } else if (G.stage === 'startup' && G.reputation >= 150) {
    G.stage = 'seed_stage';
  } else if (G.stage === 'seed_stage' && G.reputation >= 300) {
    G.stage = 'series_a';
  } else if (G.stage === 'series_a' && G.reputation >= 550) {
    G.stage = 'growth';
  } else if (G.stage === 'growth' && G.reputation >= 1000) {
    G.stage = 'enterprise';
  } else if (G.stage === 'enterprise' && G.reputation >= 2000) {
    G.stage = 'leader';
    G.gameWon = true;
  }

  if (G.stage !== prev) {
    showStageUpgradeModal(prev, G.stage);
    addLog('STAGE UP! You are now a ' + getStageName() + '!', 'good');
    G.overnightEvents.push('Milestone reached: ' + getStageName());
    if (G.gameWon) {
      saveGame();
      showWinScreen();
    }
  }
}

// --- Win / Game-Over Screens ---

function showWinScreen() {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = 'YOU WIN — MARKET LEADER';
  desc.innerHTML =
    '<strong>' + escHtml(G.player ? G.player.companyName : 'Your Company') + '</strong> has become a Market Leader!<br><br>' +
    'Days played: <span style="color:var(--cyan)">' + G.day + '</span><br>' +
    'Total revenue: <span style="color:var(--green)">$' + G.totalRevenue.toLocaleString() + '</span><br>' +
    'Final reputation: <span style="color:var(--cyan)">' + G.reputation + ' rep</span><br>' +
    'Team size: <span style="color:var(--cyan)">' + G.team.length + ' employee(s)</span><br>' +
    'Projects completed: <span style="color:var(--cyan)">' + G.completedProjects.length + '</span><br><br>' +
    '<span style="color:var(--amber)">You bootstrapped from $500 to a market-dominating company. Impressive.</span>';

  choices.innerHTML = '';
  var btnNew = document.createElement('button');
  btnNew.className = 'btn btn-primary btn-small';
  btnNew.textContent = 'NEW GAME';
  btnNew.onclick = function() {
    modal.style.display = 'none';
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    document.getElementById('screen-title').classList.add('active');
  };
  choices.appendChild(btnNew);
  modal.style.display = 'flex';
}

function showGameOverScreen(reason) {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = 'GAME OVER — BANKRUPT';
  desc.innerHTML =
    '<span style="color:var(--red)">' + escHtml(reason || 'Your company has gone bankrupt.') + '</span><br><br>' +
    'Days survived: <span style="color:var(--cyan)">' + G.day + '</span><br>' +
    'Total revenue: <span style="color:var(--green)">$' + G.totalRevenue.toLocaleString() + '</span><br>' +
    'Final reputation: <span style="color:var(--cyan)">' + G.reputation + ' rep</span><br>' +
    'Projects completed: <span style="color:var(--cyan)">' + G.completedProjects.length + '</span><br><br>' +
    '<span style="color:var(--grey-light)">Bootstrap harder next time.</span>';

  choices.innerHTML = '';
  var btnNew = document.createElement('button');
  btnNew.className = 'btn btn-primary btn-small';
  btnNew.textContent = 'TRY AGAIN';
  btnNew.onclick = function() {
    modal.style.display = 'none';
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    document.getElementById('screen-title').classList.add('active');
  };
  choices.appendChild(btnNew);
  modal.style.display = 'flex';
}

function checkBankruptcy() {
  if (G.gameOver || G.gameWon) return;
  if (G.debt >= 5000) {
    G.gameOver = true;
    saveGame();
    showGameOverScreen('Accumulated $' + G.debt.toLocaleString() + ' in unpaid debt after missing payroll.');
  }
}

// --- Day Transition Animation ---

function showDayTransition(callback) {
  var overlay = document.getElementById('day-transition');
  var text = document.getElementById('transition-text');
  var dayText = document.getElementById('transition-day');

  text.textContent = G.pushedLastNight ? 'Pulling an all-nighter...' : 'Sleeping...';
  dayText.textContent = 'DAY ' + (G.day + 1);

  overlay.classList.add('active');

  setTimeout(function() {
    overlay.classList.remove('active');
    if (callback) callback();
  }, 2000);
}

// --- Night Push with Energy Preview ---

function showNightPushPrompt() {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  var sleepEnergy = getSleepEnergyRecovery();
  var pushEnergy = getPushEnergyRecovery();

  title.textContent = 'END OF DAY';
  desc.innerHTML = 'It\'s getting late. You can sleep and start fresh tomorrow, or push through for 1 bonus action.' +
    '<br><br><span style="color:var(--cyan)">Sleep: Energy restores to ' + sleepEnergy + '</span>' +
    '<br><span style="color:var(--amber)">Push through: Energy drops to ' + Math.max(0, G.energy - 20) + ' now, starts at ' + pushEnergy + ' tomorrow (AP -1)</span>' +
    (G.activeProjects.length > 0 ? '<br><span style="color:var(--grey-light)">(' + G.activeProjects.length + ' active project(s) affecting rest quality)</span>' : '');

  choices.innerHTML = '';

  var btnSleep = document.createElement('button');
  btnSleep.className = 'btn btn-primary btn-small';
  btnSleep.textContent = 'SLEEP & REST (Energy \u2192 ' + sleepEnergy + ')';
  btnSleep.onclick = function() {
    modal.style.display = 'none';
    endDay(false);
  };

  var btnPush = document.createElement('button');
  btnPush.className = 'btn btn-danger btn-small';
  btnPush.textContent = 'PUSH THROUGH (+1 AP NOW)';
  btnPush.onclick = function() {
    modal.style.display = 'none';
    G.pushedThroughTonight = true;
    G.apCurrent += 1;
    G.timeSlot = 7;
    G.energy = Math.max(0, G.energy - 20);
    addLog('Pushing through the night... one more action.', 'warn');
    document.body.className = 'time-night';
    UI.renderAll();
  };

  var btnCancel = document.createElement('button');
  btnCancel.className = 'btn btn-small';
  btnCancel.style.opacity = '0.7';
  btnCancel.textContent = 'CANCEL';
  btnCancel.onclick = function() {
    modal.style.display = 'none';
  };

  choices.appendChild(btnSleep);
  choices.appendChild(btnPush);
  choices.appendChild(btnCancel);

  modal.style.display = 'flex';
}
