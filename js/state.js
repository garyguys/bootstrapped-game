/* ============================================
   state.js — Game State Object + Save/Load
   ============================================ */

var DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

var STAGES = [
  { id: 'freelancer',  name: 'Freelancer',      icon: '' },
  { id: 'home_office', name: 'Home Office',      icon: '' },
  { id: 'micro',       name: 'Micro Agency',     icon: '' },
  { id: 'boutique',    name: 'Boutique Studio',  icon: '' },
  { id: 'scaleup',     name: 'Scale-Up',         icon: '' },
  { id: 'leader',      name: 'Market Leader',    icon: '' },
];

function createDefaultState() {
  return {
    // Meta
    day: 1,
    timeSlot: 0,
    dayOfWeek: 0,

    // Player character
    player: {
      name: 'Founder',
      companyName: 'My Startup',
      gender: 'male',
      technical: 2,
      communication: 2,
      reliability: 2,
    },

    // Resources
    cash: 500,
    reputation: 0,
    totalRevenue: 0,

    // AP
    apMax: 4,
    apCurrent: 4,
    apUsedToday: 0,

    // Energy
    energy: 100,
    energyMax: 100,
    pushedLastNight: false,
    pushedThroughTonight: false,

    // Stage
    stage: 'freelancer',

    // Projects
    pipeline: [],
    activeProjects: [],
    completedProjects: [],
    nextProjectId: 1,

    // Team
    team: [],
    candidates: [],
    jobPosted: false,
    lastJobPostDay: -99,
    nextPayrollDay: 7,
    lastPartyDay: -99,

    // Competitors / Market
    competitors: [],
    acquiredStartups: [],
    marketEvents: [],

    // Debt
    debt: 0,

    // Upgrades purchased
    upgrades: [],

    // Roguelike perks (temporary and permanent)
    perks: [],

    // Log
    log: [],

    // Overnight events
    overnightEvents: [],

    // Event flags
    dayEventFired: false,

    // Flags
    gameOver: false,
    gameWon: false,

    // Player-developed products
    ownedProducts: [],
    nextProductId: 1,

    // Project delivery queue (for morning popups)
    deliveryQueue: [],

    // Client tracking (lifetime value)
    clients: {},

    // Management action cooldowns
    lastPressReleaseDay: -99,
    lastTrainingDay: -99,
    lastOpenSourceDay: -99,
  };
}

// Global game state
var G = createDefaultState();

// --- Save / Load ---

var SAVE_KEY = 'bootstrapped_v3_save';

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    var saved = JSON.parse(raw);
    G = Object.assign(createDefaultState(), saved);
    return true;
  } catch (e) {
    console.warn('Load failed:', e);
    return false;
  }
}

function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

// --- Helpers ---

function getTimeString() {
  var hours = 9 + Math.floor(G.timeSlot * 1.5);
  var minutes = (G.timeSlot * 1.5 % 1) * 60;
  var hh = String(Math.min(hours, 23)).padStart(2, '0');
  var mm = String(Math.round(minutes)).padStart(2, '0');
  return DAYS_OF_WEEK[G.dayOfWeek] + ' ' + hh + ':' + mm;
}

function getTimeOfDay() {
  var hour = 9 + Math.floor(G.timeSlot * 1.5);
  if (hour < 7)  return 'night';
  if (hour < 9)  return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'dusk';
  return 'night';
}

function addLog(text, type) {
  type = type || 'info';
  G.log.unshift({ day: G.day, time: getTimeString(), text: text, type: type });
  if (G.log.length > 100) G.log.length = 100;
}

function getStageName() {
  var s = STAGES.find(function(st) { return st.id === G.stage; });
  return s ? s.name : G.stage;
}

function getStageIndex() {
  for (var i = 0; i < STAGES.length; i++) {
    if (STAGES[i].id === G.stage) return i;
  }
  return 0;
}

function canPostJob() {
  return (G.day - G.lastJobPostDay) >= 7;
}

function daysSinceLastPost() {
  return G.day - G.lastJobPostDay;
}

function daysUntilCanPost() {
  var d = 7 - (G.day - G.lastJobPostDay);
  return d > 0 ? d : 0;
}

function canThrowParty() {
  return (G.day - G.lastPartyDay) >= 7 && G.team.length > 0;
}

// --- Confirmation Modal System ---
var _pendingAfterConfirmation = null;

function showActionConfirmation(message, type, callback) {
  var modal = document.getElementById('confirmation-modal');
  var text = document.getElementById('confirmation-text');
  var icon = document.getElementById('confirmation-icon');

  var icons = { good: '+', bad: '!', warn: '~', info: '>' };
  icon.textContent = icons[type] || '>';
  icon.className = 'confirmation-icon confirmation-' + (type || 'info');
  text.textContent = message;
  text.className = 'confirmation-text confirmation-' + (type || 'info');
  modal.style.display = 'flex';

  _pendingAfterConfirmation = callback || null;

  document.getElementById('confirmation-ok').onclick = function() {
    modal.style.display = 'none';
    if (_pendingAfterConfirmation) {
      var cb = _pendingAfterConfirmation;
      _pendingAfterConfirmation = null;
      cb();
    }
  };
}
