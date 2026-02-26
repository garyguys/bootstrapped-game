/* ============================================
   state.js — Game State Object + Save/Load
   ============================================ */

var DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

var STAGES = [
  { id: 'freelancer',  name: 'Freelancer',      icon: '' },
  { id: 'home_office', name: 'Home Office',      icon: '' },
  { id: 'startup',     name: 'Startup',          icon: '' },
  { id: 'seed_stage',  name: 'Seed Stage',       icon: '' },
  { id: 'series_a',    name: 'Series A',         icon: '' },
  { id: 'growth',      name: 'Growth Company',   icon: '' },
  { id: 'enterprise',  name: 'Enterprise',       icon: '' },
  { id: 'leader',      name: 'Market Leader',    icon: '' },
];

function createDefaultState() {
  return {
    // Meta
    day: 1,
    timeSlot: 0,
    dayOfWeek: 0,

    // Player character (48px sprite system)
    player: {
      name: 'Founder',
      companyName: 'My Startup',
      gender: 'male',
      skinTone: 0,
      hairStyle: 'short',
      hairColorIdx: 0,
      shirtStyle: 'tee',
      shirtColorIdx: 2,       // Blue
      pantsStyle: 'jeans',
      pantsColorIdx: 0,       // Denim
      shoeColorIdx: 0,        // Black
      accessory: 'none',
      technical: 0,
      communication: 0,
      reliability: 0,
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

    // Food cooldown (per-item: keyed by food id -> day number)
    foodPurchasedToday: {},

    // Client rapport (keyed by client name -> {rapport, projectsCompleted})
    clientRapport: {},

    // Transaction ledger
    transactions: [],  // { day, type: 'income'|'expense', category, amount, description }

    // v0.10: Energy warning flags
    lowEnergyWarned: false,
    energyDepletedHandled: false,

    // v0.10: Player skill XP from working
    workXPTechnical: 0,
    workXPCommunication: 0,

    // v0.10: Food cooldowns
    lastRetreatDay: -99,
    mealPrepCharges: 0,

    // Tutorial
    tutorialEnabled: false,
    tutorialStep: 0,
    tutorialComplete: false,
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
    // Migrate v0.08 food cooldown to per-item system
    if (G.lastFoodOrderDay !== undefined) {
      G.foodPurchasedToday = {};
      delete G.lastFoodOrderDay;
    }
    if (!G.foodPurchasedToday) G.foodPurchasedToday = {};
    if (!G.clientRapport) G.clientRapport = {};
    // Migrate old 'developing' products to new greenlight/building system
    if (G.ownedProducts) {
      G.ownedProducts.forEach(function(p) {
        if (p.status === 'developing') {
          p.status = 'building';
          p.devDaysRequired = p.devDaysNeeded || p.devDaysRequired || 20;
          p.devDaysWorked = Math.round((p.progress || 0) / 100 * p.devDaysRequired);
          p.apInvested = 12; p.apRequired = 12;
        }
        if (!p.transactions) p.transactions = undefined; // clean up if somehow nested
        if (p.totalRevenue === undefined) p.totalRevenue = 0;
      });
    }
    // v0.10 migrations
    if (!G.lowEnergyWarned) G.lowEnergyWarned = false;
    if (!G.energyDepletedHandled) G.energyDepletedHandled = false;
    if (!G.workXPTechnical) G.workXPTechnical = 0;
    if (!G.workXPCommunication) G.workXPCommunication = 0;
    if (G.lastRetreatDay === undefined) G.lastRetreatDay = -99;
    if (G.mealPrepCharges === undefined) G.mealPrepCharges = 0;
    // Migrate competitors: add products and reputation
    if (G.competitors) {
      G.competitors.forEach(function(c) {
        if (!c.products) c.products = [];
        if (c.reputation === undefined) c.reputation = Math.round(c.share * 4);
      });
    }
    // v0.14: Add skillXP and isDiamond to existing team members
    if (G.team) {
      G.team.forEach(function(emp) {
        if (!emp.skillXP) emp.skillXP = { technical: 0, communication: 0, reliability: 0 };
        if (emp.isDiamond === undefined) emp.isDiamond = false;
      });
    }
    if (G.candidates) {
      G.candidates.forEach(function(c) {
        if (!c.skillXP) c.skillXP = { technical: 0, communication: 0, reliability: 0 };
        if (c.isDiamond === undefined) c.isDiamond = false;
      });
    }
    // v0.16: Add partnerExpiredDay to competitors
    if (G.competitors) {
      G.competitors.forEach(function(c) {
        if (c.partnerExpiredDay === undefined) c.partnerExpiredDay = 0;
      });
    }
    // v0.16.2: Migrate player from old hex-color sprite system to new 48px index-based system
    if (G.player && G.player.spriteStyle !== undefined) {
      // Old system had spriteStyle 'a','b','c','d' — map 'b' to female
      G.player.gender = (G.player.spriteStyle === 'b') ? 'female' : 'male';
      G.player.skinTone = G.player.skinTone !== undefined ? G.player.skinTone : 0;
      G.player.hairStyle = G.player.hairStyle !== undefined && typeof G.player.hairStyle === 'string' ? G.player.hairStyle : 'short';
      G.player.hairColorIdx = G.player.hairColorIdx !== undefined ? G.player.hairColorIdx : 0;
      G.player.shirtStyle = G.player.shirtStyle || 'tee';
      G.player.shirtColorIdx = G.player.shirtColorIdx !== undefined ? G.player.shirtColorIdx : 2;
      G.player.pantsStyle = G.player.pantsStyle || 'jeans';
      G.player.pantsColorIdx = G.player.pantsColorIdx !== undefined ? G.player.pantsColorIdx : 0;
      G.player.shoeColorIdx = G.player.shoeColorIdx !== undefined ? G.player.shoeColorIdx : 0;
      G.player.accessory = G.player.accessory || 'none';
      // Clean up old properties
      delete G.player.spriteStyle;
      delete G.player.hairColor;
      delete G.player.skinColor;
      delete G.player.shirtColor;
      delete G.player.pantsColor;
      delete G.player.eyeColor;
      delete G.player.shoeColor;
    }
    // v0.16.2: Ensure team/candidates have new appearance properties (hash-based fallback in avatars.js handles missing props)
    // v0.17: Tutorial system
    if (G.tutorialEnabled === undefined) G.tutorialEnabled = false;
    if (G.tutorialStep === undefined) G.tutorialStep = 0;
    if (G.tutorialComplete === undefined) G.tutorialComplete = false;
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

function hasReachedStage(requiredStageId) {
  var stageOrder = ['freelancer', 'home_office', 'startup', 'seed_stage', 'series_a', 'growth', 'enterprise', 'leader'];
  var playerIdx = stageOrder.indexOf(G.stage);
  var reqIdx = stageOrder.indexOf(requiredStageId);
  return playerIdx >= reqIdx;
}

var _uidCounter = 0;
function uid(prefix) {
  _uidCounter++;
  return (prefix || 'id') + '_' + Date.now() + '_' + _uidCounter;
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
