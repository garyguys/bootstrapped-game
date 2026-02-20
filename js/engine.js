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
  G.energy = Math.max(0, G.energy - amount);
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

// --- End Day / Sleep ---

function endDay(pushThrough) {
  // Advance active projects (team auto-work happens here)
  advanceProjects();

  // Check for completed projects
  checkProjectDeliveries();

  if (pushThrough) {
    // Push through the night
    G.pushedLastNight = true;
    addLog('Pushed through the night... exhausted.', 'warn');
  } else {
    G.pushedLastNight = false;
  }

  // Save before transition
  saveGame();

  // Show transition, then start new day
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

  // AP reset
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

  // Generate pipeline if needed
  if (G.pipeline.length < 2) {
    generatePipelineLeads();
  }

  // Age pipeline leads
  agePipelineLeads();

  // Generate candidates if job was posted
  if (G.jobPosted) {
    G.jobPosted = false;
    addLog('Candidates have applied for your job posting.', 'info');
  }

  // Clear overnight events
  G.overnightEvents = [];

  // Add morning log
  var dayName = DAYS_OF_WEEK[G.dayOfWeek];
  addLog('Day ' + G.day + ' (' + dayName + ') — Good morning.', 'info');

  if (G.pushedLastNight) {
    addLog('Feeling rough after pulling an all-nighter. AP reduced.', 'warn');
  }

  // Save new day
  saveGame();

  // Update UI
  UI.renderAll();
}

function getBaseAPMax() {
  var base = 4;
  // Freelancer stage starts with 3 AP according to milestones,
  // but design says 4 AP default. Using 4 as the doc says in AP section.
  if (G.upgrades.indexOf('standing_desk') !== -1) {
    base += 1;
  }
  return base;
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
    // Mark that we're pushing through tonight
    G.pushedThroughTonight = true;
    // Grant 1 bonus AP
    G.apCurrent += 1;
    G.timeSlot = 7; // ~03:47 equivalent (late night)
    G.energy = Math.max(0, G.energy - 20);
    addLog('Pushing through the night... one more action.', 'warn');
    document.body.className = 'time-night';
    UI.renderAll();
  };

  choices.appendChild(btnSleep);
  choices.appendChild(btnPush);

  modal.style.display = 'flex';
}
