/* ============================================
   engine.js — Core Game Loop, Day/Night Cycle
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
  // Management overhead: +2 energy per team member for management actions
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
  if (G.energy < 25 && Math.random() < 0.20) {
    return true;
  }
  return false;
}

// --- Energy Exhaustion: Project Failures ---

function checkEnergyProjectFailures() {
  if (G.energy > 0) return;
  if (G.activeProjects.length === 0) return;

  var failCount = Math.random() < 0.4 ? 2 : 1;
  failCount = Math.min(failCount, G.activeProjects.length);

  var shuffled = G.activeProjects.slice().sort(function() { return Math.random() - 0.5; });

  for (var i = 0; i < failCount; i++) {
    var p = shuffled[i];
    var loss = randomInt(15, 30);
    p.progress = Math.max(0, p.progress - loss);
    addLog('Exhaustion caused a disaster on ' + p.name + '! -' + loss + '% progress.', 'bad');

    if (p.daysActive >= p.daysToComplete && p.progress < 30) {
      G.activeProjects = G.activeProjects.filter(function(x) { return x.id !== p.id; });
      G.reputation = Math.max(0, G.reputation - p.repGain);
      addLog(p.client + ' cancelled the project due to repeated failures! -' + p.repGain + ' rep.', 'bad');
    }
  }
}

// --- End Day / Sleep ---

function endDay(pushThrough) {
  advanceProjects();
  tickTeam();
  checkProjectDeliveries();

  if (G.competitors && G.competitors.length > 0) {
    tickMarket();
  }

  tickPerks();
  rollOvernightEvents();
  checkPayroll();

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

  // Energy reset
  if (G.pushedLastNight) {
    G.energy = 40;
  } else {
    G.energy = 100;
  }

  // Coffee machine bonus
  if (G.upgrades.indexOf('coffee_machine') !== -1) {
    G.energy = Math.min(G.energyMax, G.energy + 10);
  }

  // Weekend rest bonus
  if (G.dayOfWeek >= 5) { // SAT or SUN
    G.energy = Math.min(G.energyMax, G.energy + 10);
  }

  // Generate pipeline if needed
  if (G.pipeline.length < 2) {
    generatePipelineLeads();
  }

  // Referral partner perk: extra lead
  var refPerk = G.perks.find(function(p) { return p.id === 'referral_partner'; });
  if (refPerk && G.pipeline.length < 5) {
    G.pipeline.push(generateProject());
  }

  // Hustler perk from team: extra lead per week
  var hustlerInTeam = G.team.some(function(e) { return e.perk && e.perk.id === 'hustler'; });
  if (hustlerInTeam && G.dayOfWeek === 0 && G.pipeline.length < 5) {
    G.pipeline.push(generateProject());
    addLog('Your hustler brought in an extra lead.', 'good');
  }

  // Networker perk: passive rep every 14 days
  for (var i = 0; i < G.team.length; i++) {
    var emp = G.team[i];
    if (emp.perk && emp.perk.id === 'networker' && emp.daysEmployed % 14 === 0 && emp.daysEmployed > 0) {
      G.reputation += emp.perk.value;
      addLog(emp.name + '\'s network brought in +' + emp.perk.value + ' rep.', 'good');
    }
  }

  // Age pipeline leads
  agePipelineLeads();

  // Generate candidates if job was posted
  if (G.jobPosted) {
    G.jobPosted = false;
    generateCandidatesForPosting();
    addLog('Candidates have applied for your job posting!', 'info');
  }

  // Coffee machine passive effect: +3 energy per action during the day
  // (tracked separately via upgrade check in spendEnergy)

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
}

function getBaseAPMax() {
  var base = 4;
  if (G.upgrades.indexOf('standing_desk') !== -1) {
    base += 1;
  }
  // Operations team bonus: +1 AP for every 2 ops team members (max +2)
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

  G.nextPayrollDay = G.day + 7; // Weekly payroll

  if (G.cash >= amount) {
    G.cash -= amount;
    addLog('Payroll: -$' + amount.toLocaleString() + ' for ' + G.team.length + ' employee(s).', 'warn');
    G.overnightEvents.push('Weekly payroll processed: -$' + amount.toLocaleString());
  } else {
    var shortfall = amount - G.cash;
    G.cash = 0;
    G.debt += shortfall;
    addLog('Couldn\'t cover payroll! $' + shortfall + ' added to debt. Team morale tanked.', 'bad');
    G.overnightEvents.push('MISSED PAYROLL! Team morale is plummeting.');

    for (var i = 0; i < G.team.length; i++) {
      G.team[i].loyalty = Math.max(0, G.team[i].loyalty - 30);
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

// --- Night Push ---

function showNightPushPrompt() {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = 'END OF DAY';
  desc.textContent = 'It\'s getting late. You can sleep and start fresh tomorrow, or push through the night for 1 bonus action — but you\'ll feel it tomorrow.';

  choices.innerHTML = '';

  var btnSleep = document.createElement('button');
  btnSleep.className = 'btn btn-primary btn-small';
  btnSleep.textContent = 'SLEEP & REST';
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
