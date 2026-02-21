/* ============================================
   engine.js — Core Game Loop, Day/Night Cycle
   Energy scales with active projects.
   Deadline penalties. Player skills.
   ============================================ */

function spendAP(amount) {
  amount = amount || 1;
  if (G.apCurrent < amount) return false;
  G.apCurrent -= amount;
  G.apUsedToday += amount;
  G.timeSlot += amount;
  return true;
}

function spendEnergy(amount) {
  var overhead = Math.floor(G.team.length * 0.5);
  G.energy = Math.max(0, G.energy - (amount + overhead));
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
  var base = 100;
  var projectPenalty = G.activeProjects.length * 8;
  return Math.max(40, base - projectPenalty);
}

function getPushEnergyRecovery() {
  var base = 40;
  var projectPenalty = G.activeProjects.length * 5;
  return Math.max(15, base - projectPenalty);
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

function startNewDay() {
  G.day += 1;
  G.dayOfWeek = (G.dayOfWeek + 1) % 7;
  G.timeSlot = 0;
  G.apUsedToday = 0;
  G.pushedThroughTonight = false;
  G.dayEventFired = false;

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

  // Coffee machine bonus
  if (G.upgrades.indexOf('coffee_machine') !== -1) {
    G.energy = Math.min(G.energyMax, G.energy + 10);
  }

  // Ping pong table bonus
  if (G.upgrades.indexOf('ping_pong') !== -1) {
    G.energy = Math.min(G.energyMax, G.energy + 5);
  }

  // Weekend rest bonus
  if (G.dayOfWeek >= 5) {
    G.energy = Math.min(G.energyMax, G.energy + 10);
  }

  // Generate pipeline if needed
  if (G.pipeline.length < 2) {
    generatePipelineLeads(false);
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

  // Age pipeline leads
  agePipelineLeads();

  // Age candidates (withdrawal after 3-5 days)
  ageCandidates();

  // Generate candidates if job was posted
  if (G.jobPosted) {
    G.jobPosted = false;
    generateCandidatesForPosting();
    addLog('Candidates have applied for your job posting!', 'info');
  }

  // Add morning log
  var dayName = DAYS_OF_WEEK[G.dayOfWeek];
  addLog('Day ' + G.day + ' (' + dayName + ') — Good morning.', 'info');

  if (G.pushedLastNight) {
    addLog('Feeling rough after pulling an all-nighter. AP reduced.', 'warn');
  }

  // Check stage progression
  checkStageProgression();

  saveGame();
  UI.renderAll();

  // Show project delivery popups
  if (G.deliveryQueue && G.deliveryQueue.length > 0) {
    showNextDeliveryPopup();
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

    // Immediate walkouts: each team member has 60% chance to leave
    var walkers = [];
    for (var i = 0; i < G.team.length; i++) {
      G.team[i].loyalty = Math.max(0, G.team[i].loyalty - 40);
      if (Math.random() < 0.6) walkers.push(G.team[i]);
    }
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
  var prev = G.stage;

  if (G.stage === 'freelancer' && G.day >= 7 && G.cash >= 1000) {
    G.stage = 'home_office';
  } else if (G.stage === 'home_office' && G.team.length >= 3 && G.cash >= 5000 && G.reputation >= 30) {
    G.stage = 'micro';
  } else if (G.stage === 'micro' && G.totalRevenue >= 25000 && G.reputation >= 70) {
    G.stage = 'boutique';
  } else if (G.stage === 'boutique' && G.team.length >= 8 && G.reputation >= 130 && G.totalRevenue >= 75000) {
    G.stage = 'scaleup';
  } else if (G.stage === 'scaleup' && G.reputation >= 200) {
    G.stage = 'leader';
    G.gameWon = true;
  }

  if (G.stage !== prev) {
    addLog('STAGE UP! You are now a ' + getStageName() + '!', 'good');
    G.overnightEvents.push('Milestone reached: ' + getStageName());
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

  choices.appendChild(btnSleep);
  choices.appendChild(btnPush);

  modal.style.display = 'flex';
}
