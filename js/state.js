/* ============================================
   state.js — Game State Object + Save/Load
   ============================================ */

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const STAGES = [
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
    timeSlot: 0,        // 0=09:00, each action +1 slot (~90min each)
    dayOfWeek: 0,       // 0=MON

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
    lastJobPostDay: -99,  // Day of last job posting (cooldown: once per 7 days)
    nextPayrollDay: 14,   // First payroll on day 14

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
  };
}

// Global game state
let G = createDefaultState();

// --- Save / Load ---

const SAVE_KEY = 'bootstrapped_v2_save';

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
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
  const hours = 9 + Math.floor(G.timeSlot * 1.5);
  const minutes = (G.timeSlot * 1.5 % 1) * 60;
  const hh = String(Math.min(hours, 23)).padStart(2, '0');
  const mm = String(Math.round(minutes)).padStart(2, '0');
  return `${DAYS_OF_WEEK[G.dayOfWeek]} ${hh}:${mm}`;
}

function getTimeOfDay() {
  const hour = 9 + Math.floor(G.timeSlot * 1.5);
  if (hour < 7)  return 'night';
  if (hour < 9)  return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'dusk';
  return 'night';
}

function addLog(text, type) {
  type = type || 'info';
  G.log.unshift({ time: getTimeString(), text: text, type: type });
  if (G.log.length > 80) G.log.length = 80;
}

function getStageName() {
  const s = STAGES.find(function(st) { return st.id === G.stage; });
  return s ? s.name : G.stage;
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
