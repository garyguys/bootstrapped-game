/* ============================================
   team.js — Hiring, Candidates, Team Management
   Skills now 1-10. Gender + ethnicity for avatars.
   Patience system for negotiation.
   Candidate withdrawal after 3-5 days.
   ============================================ */

var ROLES = [
  { id: 'developer',  name: 'Developer',  icon: '>' },
  { id: 'designer',   name: 'Designer',   icon: '*' },
  { id: 'marketer',   name: 'Marketer',   icon: '#' },
  { id: 'sales',      name: 'Sales Rep',  icon: '$' },
  { id: 'devops',     name: 'DevOps',     icon: '&' },
  { id: 'pm',         name: 'PM',         icon: '@' },
];

var OPS_ROLES = ['pm', 'sales', 'marketer'];

var MALE_FIRST_NAMES = [
  'James', 'Marcus', 'David', 'Ryan', 'Carlos', 'Wei', 'Kenji', 'Amir',
  'Erik', 'Ivan', 'Leo', 'Omar', 'Raj', 'Andre', 'Daniel', 'Ethan',
  'Felix', 'Grant', 'Hugo', 'Jack', 'Kyle', 'Liam', 'Noah', 'Oscar',
  'Alex', 'Jordan', 'Sam', 'Blake', 'Drew', 'Noel',
  'Victor', 'Mateo', 'Hiroshi', 'Theo', 'Ravi', 'Soren', 'Dmitri', 'Kai',
  'Luca', 'Niko', 'Rohan', 'Sebastian', 'Tariq', 'Zane', 'Axel',
];

var FEMALE_FIRST_NAMES = [
  'Sarah', 'Emily', 'Maya', 'Priya', 'Yuki', 'Fatima', 'Sofia', 'Elena',
  'Anya', 'Nina', 'Lina', 'Zara', 'Mei', 'Luna', 'Clara', 'Diana',
  'Eva', 'Grace', 'Hannah', 'Iris', 'Julia', 'Kate', 'Lily', 'Mia',
  'Taylor', 'Riley', 'Quinn', 'Avery', 'Harper', 'Sage',
  'Aria', 'Camila', 'Daphne', 'Elara', 'Freya', 'Gemma', 'Ivy', 'Kira',
  'Leila', 'Nadia', 'Petra', 'Rosa', 'Suki', 'Uma', 'Vera',
];

var CANDIDATE_LAST_NAMES = [
  'Chen', 'Patel', 'Kim', 'Singh', 'Nakamura', 'Garcia', 'Okafor', 'Muller',
  'Santos', 'Johansson', 'Park', 'Nguyen', 'Ali', 'Schmidt', 'Cohen', 'Tanaka',
  'Rivera', 'Volkov', 'Dubois', 'Ibrahim', 'Larsson', 'Torres', 'Yamamoto', 'Shah',
  'Lee', 'Wang', 'Reyes', 'Lopez', 'Brown', 'Davis', 'Wilson', 'Zhang',
  'Okonkwo', 'Petrov', 'Andersson', 'Khatri', 'Moreno', 'Fujita', 'Bianchi', 'Nkosi', 'Vasquez', 'Lam',
];

// Work history company names for background generation
var WORK_HISTORY_COMPANIES = [
  'CloudBase Inc', 'Vertex Labs', 'DataPoint', 'SparkTech', 'BlueStar Digital',
  'SilverStack', 'NorthCode', 'QuantumBit', 'RapidScale', 'IronPeak Systems',
  'Fusion Works', 'CoreNode', 'ByteShift', 'TerraLogic', 'PulseWave',
  'ClearMind AI', 'DeepRoute', 'StackHive', 'Pluto Systems', 'GreenThread',
];

// Perks — now with 1-10 skill scale considerations
var CANDIDATE_PERKS = [
  { id: 'night_owl',      name: 'Night Owl',      desc: 'Works overtime: +5% daily project progress', effect: 'bonus_progress', value: 5 },
  { id: 'mentor',         name: 'Mentor',          desc: 'Boosts nearby team skills by +1 over time', effect: 'team_boost', value: 1 },
  { id: 'hustler',        name: 'Hustler',         desc: 'Brings in 1 extra pipeline lead per week', effect: 'extra_lead', value: 1 },
  { id: 'penny_pincher',  name: 'Penny Pincher',   desc: 'Accepts 15% lower salary', effect: 'salary_discount', value: 0.15 },
  { id: 'perfectionist',  name: 'Perfectionist',   desc: '+2 rep on delivered projects, but 10% slower', effect: 'rep_bonus', value: 2 },
  { id: 'networker',      name: 'Networker',       desc: '+5 rep every 2 weeks from connections', effect: 'passive_rep', value: 5 },
  { id: 'caffeinated',    name: 'Caffeinated',     desc: 'Never misses a day, 100% reliability floor', effect: 'reliable', value: 100 },
  { id: 'open_source',    name: 'Open Source Contributor', desc: 'Technical skill grows +1 every 10 days', effect: 'skill_growth', value: 1 },
  { id: 'drama_magnet',   name: 'Drama Magnet',    desc: '-10 morale to team but +2 Technical', effect: 'drama', value: -10 },
  { id: 'remote_only',    name: 'Remote Only',     desc: 'Quits if you get an office (but costs 20% less)', effect: 'remote_only', value: 0.2 },
  { id: 'ex_faang',       name: 'Ex-FAANG',        desc: '+3 rep on hire, expects top salary', effect: 'prestige', value: 3 },
  { id: 'quick_learner',  name: 'Quick Learner',   desc: 'All skills improve by +1 after 7 days', effect: 'growth', value: 1 },
];

var CANDIDATE_FLAWS = [
  { id: 'flaky',          name: 'Flaky',           desc: '25% chance of no-show each day', effect: 'unreliable', value: 0.25 },
  { id: 'prima_donna',    name: 'Prima Donna',     desc: 'Quits if not on the biggest project', effect: 'demanding', value: 0 },
  { id: 'slow_starter',   name: 'Slow Starter',    desc: 'First 5 days: 50% effectiveness', effect: 'ramp_up', value: 5 },
  { id: 'job_hopper',     name: 'Job Hopper',      desc: 'Loyalty decays 2x faster', effect: 'low_loyalty', value: 2 },
  { id: 'overqualified',  name: 'Overqualified',   desc: 'Great skills but leaves after 20 days', effect: 'temp', value: 20 },
  { id: 'secret_slacker', name: '???',             desc: 'Hidden: does 50% less work than stats suggest', effect: 'slacker', value: 0.5 },
];

// Legacy counter removed — now using uid() from state.js

// Market salary modifier from competitor ecosystem
function getMarketSalaryModifier() {
  if (!G.competitors || G.competitors.length === 0) return 1.0;
  var aliveComps = G.competitors.filter(function(c) { return c.alive; });
  if (aliveComps.length === 0) return 1.0;

  var modifier = 1.0;
  for (var i = 0; i < aliveComps.length; i++) {
    var c = aliveComps[i];
    if (c.style === 'megacorp') modifier += 0.08;
    else if (c.style === 'vc_funded') modifier += c.share > 10 ? 0.06 : 0.03;
    else if (c.style === 'budget') modifier -= 0.02;
  }
  return Math.max(0.8, Math.min(1.5, modifier));
}

// Generate work history for a person
function generateWorkHistory(level, roleId) {
  var history = [];
  var count = Math.min(level, randomInt(0, level));
  for (var i = 0; i < count; i++) {
    // Mix competitor names and generic companies
    var companyPool = WORK_HISTORY_COMPANIES.slice();
    if (G.competitors) {
      for (var j = 0; j < G.competitors.length; j++) {
        companyPool.push(G.competitors[j].name);
      }
    }
    var company = randomChoice(companyPool);
    // Avoid duplicates
    if (history.some(function(h) { return h.company === company; })) continue;
    history.push({
      company: company,
      role: roleId,
      years: randomInt(1, 4),
    });
  }
  return history;
}

function getCandidateLevelWeighted() {
  // Weight candidate level based on player market share percentage
  var shares = typeof getPlayerMarketShare === 'function' ? getPlayerMarketShare() : { player: 1, total: 100 };
  var playerPct = (shares.player / Math.max(1, shares.total)) * 100;

  var r = Math.random() * 100;
  if (playerPct < 5) {
    // Very low share: 70% Junior, 25% Mid, 5% Senior
    if (r < 70) return 1;
    if (r < 95) return 2;
    return 3;
  } else if (playerPct < 15) {
    // Small share: 40% Junior, 40% Mid, 20% Senior
    if (r < 40) return 1;
    if (r < 80) return 2;
    return 3;
  } else if (playerPct < 30) {
    // Medium share: 20% Junior, 40% Mid, 40% Senior
    if (r < 20) return 1;
    if (r < 60) return 2;
    return 3;
  } else {
    // High share: 10% Junior, 30% Mid, 60% Senior
    if (r < 10) return 1;
    if (r < 40) return 2;
    return 3;
  }
}

function generateCandidate() {
  var role = randomChoice(ROLES);
  var level = getCandidateLevelWeighted(); // weighted by market share
  var levelNames = ['Junior', 'Mid-Level', 'Senior'];
  var gender = Math.random() < 0.5 ? 'male' : 'female';

  var firstName = gender === 'female' ? randomChoice(FEMALE_FIRST_NAMES) : randomChoice(MALE_FIRST_NAMES);
  var lastName = randomChoice(CANDIDATE_LAST_NAMES);

  // Skills rated 1-10, influenced by level (wider overlap — level = experience, not skill ceiling)
  // Junior: 1-6, Mid: 2-8, Senior: 3-10
  var skillRanges = [[1, 6], [2, 8], [3, 10]];
  var baseMin = skillRanges[level - 1][0];
  var baseMax = skillRanges[level - 1][1];
  var technical = Math.min(10, randomInt(baseMin, baseMax));
  var communication = Math.min(10, randomInt(Math.max(1, baseMin - 1), baseMax));
  var reliability = Math.min(10, randomInt(baseMin, baseMax));

  // Role-based skill skew
  if (role.id === 'developer' || role.id === 'devops') {
    technical = Math.min(10, technical + 1);
  } else if (role.id === 'sales' || role.id === 'marketer') {
    communication = Math.min(10, communication + 1);
  } else if (role.id === 'pm') {
    reliability = Math.min(10, reliability + 1);
  }

  // Diamond in the rough: 8% chance for junior/mid candidates to have one exceptional skill (8-9)
  var isDiamond = false;
  if (level <= 2 && Math.random() < 0.08) {
    isDiamond = true;
    var diamondSkill = randomChoice(['technical', 'communication', 'reliability']);
    var diamondVal = randomInt(8, 9);
    if (diamondSkill === 'technical') technical = diamondVal;
    else if (diamondSkill === 'communication') communication = diamondVal;
    else reliability = diamondVal;
  }

  // Base weekly salary
  var salaryBase = [200, 400, 700];
  var salary = salaryBase[level - 1] + randomInt(-50, 100);
  salary = Math.round(salary / 25) * 25;

  // Diamond candidates are slightly cheaper (they don't know their worth yet)
  if (isDiamond) salary = Math.round(salary * 0.85 / 25) * 25;

  // Market modifier
  var marketMod = getMarketSalaryModifier();
  salary = Math.round(salary * marketMod / 25) * 25;

  // Perk and flaw
  var perk = null;
  if (Math.random() < 0.6) perk = randomChoice(CANDIDATE_PERKS);
  var flaw = null;
  if (Math.random() < 0.30) flaw = randomChoice(CANDIDATE_FLAWS);

  if (perk && perk.id === 'ex_faang') {
    salary = Math.round(salary * 1.4 / 25) * 25;
  }

  // Perfect-10 skill — top tier but capped at $20k/wk
  if (technical === 10 || communication === 10 || reliability === 10) {
    salary = randomInt(8000, 20000);
    salary = Math.round(salary / 500) * 500;
  }
  // High skills (8-9) non-diamond command premium salaries
  else if (!isDiamond && (technical >= 8 || communication >= 8 || reliability >= 8)) {
    salary = Math.max(salary, randomInt(13000, 18000));
    salary = Math.round(salary / 500) * 500;
  }

  // Hidden patience for negotiation (1-5, higher = more patient)
  var patience = randomInt(1, 5);

  return {
    id: uid('emp'),
    name: firstName + ' ' + lastName,
    gender: gender,
    role: role,
    level: level,
    levelName: levelNames[level - 1],
    technical: technical,
    communication: communication,
    reliability: reliability,
    salary: salary,
    askingSalary: salary,
    perk: perk,
    flaw: flaw,
    flawRevealed: false,
    skillsRevealed: 0,
    loyalty: 70 + randomInt(-10, 10),
    daysEmployed: 0,
    patience: patience,
    patienceUsed: 0, // Tracks negotiation attempts
    arrivedDay: G.day, // For withdrawal timer
    workHistory: generateWorkHistory(level, role.id),
    assignedProjectId: null, // Which project they're assigned to
    isDiamond: isDiamond, // Diamond in the rough — exceptional skill at low salary
    skillXP: { technical: 0, communication: 0, reliability: 0 }, // Hidden XP for skill growth
  };
}

function generateCandidatesForPosting() {
  var count = randomInt(2, 4);
  var newCandidates = [];
  for (var i = 0; i < count; i++) {
    newCandidates.push(generateCandidate());
  }
  G.candidates = G.candidates.concat(newCandidates);
  return newCandidates;
}

// Interview: 1 AP reveals 1 skill, 2nd AP reveals rest + perk
function interviewCandidate(candidateId) {
  var c = findCandidate(candidateId);
  if (!c) return false;

  if (c.skillsRevealed >= 2) {
    addLog(c.name + ' is already fully interviewed.', 'warn');
    return false;
  }

  c.skillsRevealed += 1;
  if (c.skillsRevealed === 1) {
    addLog('Interviewed ' + c.name + ': ' + c.role.name + ' (' + c.levelName + '). Technical: ' + c.technical + '/10.', 'info');
  } else {
    var perkText = c.perk ? ' Perk: ' + c.perk.name + '.' : '';
    addLog('Deep interview with ' + c.name + ': Comm ' + c.communication + '/10, Reliability ' + c.reliability + '/10.' + perkText, 'info');
  }
  return true;
}

// Salary negotiation with patience system
function negotiateSalary(candidateId, offeredSalary) {
  var c = findCandidate(candidateId);
  if (!c) return { accepted: false, message: 'Candidate not found.', withdrawn: false };

  var askingSalary = c.askingSalary;
  var ratio = offeredSalary / askingSalary;

  // Track negotiation attempt
  c.patienceUsed += 1;

  // Check if patience exhausted
  if (c.patienceUsed > c.patience && ratio < 1.0) {
    // Candidate withdraws
    G.candidates = G.candidates.filter(function(x) { return x.id !== candidateId; });
    addLog(c.name + ' lost patience and withdrew their application!', 'bad');
    return { accepted: false, message: c.name + ' is fed up with negotiations and has withdrawn!', withdrawn: true };
  }

  if (ratio >= 1.0) {
    c.salary = offeredSalary;
    var bonusLoyalty = Math.min(20, Math.round((ratio - 1.0) * 100));
    c.loyalty = Math.min(100, c.loyalty + bonusLoyalty);
    return { accepted: true, message: c.name + ' happily accepts $' + offeredSalary + '/wk!', withdrawn: false };
  } else if (ratio >= 0.85) {
    var chance = 0.5 + (ratio - 0.85) * 3.3;
    if (Math.random() < chance) {
      c.salary = offeredSalary;
      return { accepted: true, message: c.name + ' agrees to $' + offeredSalary + '/wk after some thought.', withdrawn: false };
    } else {
      return { accepted: false, message: c.name + ' declines. They want at least $' + askingSalary.toLocaleString() + '/wk.', withdrawn: false };
    }
  } else if (ratio >= 0.70) {
    var lowChance = (ratio - 0.70) * 3.5;
    if (Math.random() < lowChance) {
      c.salary = offeredSalary;
      c.loyalty = Math.max(30, c.loyalty - 10);
      return { accepted: true, message: c.name + ' reluctantly accepts $' + offeredSalary + '/wk.', withdrawn: false };
    } else {
      return { accepted: false, message: c.name + ' is insulted by the lowball offer.', withdrawn: false };
    }
  } else {
    // Below 70%: auto-reject, costs extra patience
    c.patienceUsed += 1;
    if (c.patienceUsed >= c.patience) {
      G.candidates = G.candidates.filter(function(x) { return x.id !== candidateId; });
      addLog(c.name + ' laughed at your offer and left!', 'bad');
      return { accepted: false, message: c.name + ' laughed at your insulting offer and withdrew!', withdrawn: true };
    }
    return { accepted: false, message: c.name + ' laughs at your offer. Not even close to $' + askingSalary.toLocaleString() + '/wk.', withdrawn: false };
  }
}

function hireCandidate(candidateId) {
  var c = findCandidate(candidateId);
  if (!c) return false;

  G.candidates = G.candidates.filter(function(x) { return x.id !== candidateId; });
  c.isBeingPoached = false; // Clear poach flag
  c.daysEmployed = 0;
  G.team.push(c);

  if (c.perk && c.perk.id === 'ex_faang') {
    G.reputation += c.perk.value;
    addLog(c.name + '\'s FAANG background impressed clients. +' + c.perk.value + ' rep.', 'good');
  }

  if (c.flaw && Math.random() < 0.5) {
    c.flawRevealed = true;
    addLog('Uh oh... ' + c.name + ' turns out to be: ' + c.flaw.name + ' — ' + c.flaw.desc, 'bad');
  }

  addLog('Hired ' + c.name + ' as ' + c.levelName + ' ' + c.role.name + '. Salary: $' + c.salary + '/wk.', 'good');
  return true;
}

function fireEmployee(employeeId) {
  var idx = -1;
  for (var i = 0; i < G.team.length; i++) {
    if (G.team[i].id === employeeId) { idx = i; break; }
  }
  if (idx === -1) return false;

  var emp = G.team.splice(idx, 1)[0];
  // Unassign from projects
  for (var p = 0; p < G.activeProjects.length; p++) {
    var proj = G.activeProjects[p];
    if (proj.assignedTeam) {
      proj.assignedTeam = proj.assignedTeam.filter(function(id) { return id !== emp.id; });
    }
  }
  addLog('Fired ' + emp.name + '. They did not take it well.', 'bad');

  for (var j = 0; j < G.team.length; j++) {
    G.team[j].loyalty = Math.max(0, G.team[j].loyalty - 10);
  }
  return true;
}

function findCandidate(id) {
  for (var i = 0; i < G.candidates.length; i++) {
    if (G.candidates[i].id === id) return G.candidates[i];
  }
  return null;
}

function findEmployee(id) {
  for (var i = 0; i < G.team.length; i++) {
    if (G.team[i].id === id) return G.team[i];
  }
  return null;
}

// Candidate withdrawal check — called at start of each day
function ageCandidates() {
  var remaining = [];
  for (var i = 0; i < G.candidates.length; i++) {
    var c = G.candidates[i];
    var daysWaiting = G.day - c.arrivedDay;
    var withdrawDays = randomInt(3, 5);
    if (daysWaiting >= withdrawDays) {
      addLog(c.name + ' got tired of waiting and withdrew their application.', 'warn');
    } else {
      remaining.push(c);
    }
  }
  G.candidates = remaining;
}

// Team daily tick
function tickTeam() {
  var quitters = [];

  for (var i = 0; i < G.team.length; i++) {
    var emp = G.team[i];
    emp.daysEmployed += 1;

    // Loyalty decay — REL (reliability) slows decay
    var decayRate = Math.max(0.5, 1.5 - (emp.reliability * 0.1));
    if (emp.flaw && emp.flaw.id === 'job_hopper') decayRate *= 2;
    emp.loyalty = Math.max(0, emp.loyalty - decayRate);

    // Overqualified flaw: leaves after X days
    if (emp.flaw && emp.flaw.id === 'overqualified' && emp.daysEmployed >= emp.flaw.value) {
      quitters.push(emp);
      continue;
    }

    // Quick learner perk (skills capped at 10)
    if (emp.perk && emp.perk.id === 'quick_learner' && emp.daysEmployed === 7) {
      emp.technical = Math.min(10, emp.technical + 1);
      emp.communication = Math.min(10, emp.communication + 1);
      emp.reliability = Math.min(10, emp.reliability + 1);
      addLog(emp.name + ' has gotten up to speed. All skills +1.', 'good');
    }

    // Open source contributor perk
    if (emp.perk && emp.perk.id === 'open_source' && emp.daysEmployed % 10 === 0 && emp.daysEmployed > 0) {
      emp.technical = Math.min(10, emp.technical + 1);
      addLog(emp.name + '\'s open source work pays off. Technical +1.', 'good');
    }

    // Mentor perk: boost random teammate skill
    if (emp.perk && emp.perk.id === 'mentor' && emp.daysEmployed % 14 === 0 && emp.daysEmployed > 0) {
      var teammates = G.team.filter(function(e) { return e.id !== emp.id; });
      if (teammates.length > 0) {
        var target = randomChoice(teammates);
        var skillChoice = Math.random();
        if (skillChoice < 0.33) target.technical = Math.min(10, target.technical + 1);
        else if (skillChoice < 0.66) target.communication = Math.min(10, target.communication + 1);
        else target.reliability = Math.min(10, target.reliability + 1);
        addLog(emp.name + ' mentored ' + target.name + '. A skill improved!', 'good');
      }
    }

    if (emp.loyalty <= 10) {
      quitters.push(emp);
    }
  }

  // Rooftop terrace: +10 loyalty for all staff every 7 days
  if (G.upgrades && G.upgrades.indexOf('rooftop_terrace') !== -1 && G.day % 7 === 0) {
    for (var rt = 0; rt < G.team.length; rt++) {
      G.team[rt].loyalty = Math.min(100, G.team[rt].loyalty + 10);
    }
  }

  for (var j = 0; j < quitters.length; j++) {
    var q = quitters[j];
    G.team = G.team.filter(function(e) { return e.id !== q.id; });
    // Unassign from projects
    for (var p = 0; p < G.activeProjects.length; p++) {
      var proj = G.activeProjects[p];
      if (proj.assignedTeam) {
        proj.assignedTeam = proj.assignedTeam.filter(function(id) { return id !== q.id; });
      }
    }
    addLog(q.name + ' quit! ' + (q.flaw && q.flaw.id === 'overqualified' ? 'They were overqualified all along.' : 'Morale was too low.'), 'bad');
    G.overnightEvents.push(q.name + ' quit the company.');
  }
}

// Calculate team contribution to a specific project per day
// Now uses assignment system — only assigned team members contribute
// Role-based contribution multipliers — all roles can be assigned
var ROLE_PROJECT_CONTRIB = {
  developer: 2.5,   // primary technical contributor
  designer:  2.0,   // strong contributor
  devops:    2.0,   // strong contributor
  pm:        0.5,   // manages process, minor direct contribution
  sales:     0.5,   // minor contribution
  marketer:  0.5,   // minor contribution
};

// --- Employee Skill Growth from Work ---
function grantWorkXP(emp) {
  if (!emp.skillXP) emp.skillXP = { technical: 0, communication: 0, reliability: 0 };

  // Primary skill based on role
  var primarySkill = 'technical';
  if (emp.role.id === 'sales' || emp.role.id === 'marketer') primarySkill = 'communication';
  else if (emp.role.id === 'pm') primarySkill = 'reliability';

  // Grant XP (diamonds learn 2x faster)
  var xpGain = emp.isDiamond ? 2 : 1;
  emp.skillXP[primarySkill] += xpGain;

  // XP threshold: 12 per skill point (takes ~12 work days per +1)
  var threshold = 12;
  if (emp.skillXP[primarySkill] >= threshold && emp[primarySkill] < 10) {
    emp.skillXP[primarySkill] = 0;
    emp[primarySkill] += 1;
    addLog(emp.name + '\'s ' + primarySkill + ' improved to ' + emp[primarySkill] + '/10 from work experience!', 'good');
    G.overnightEvents.push(emp.name + ': ' + primarySkill + ' ' + (emp[primarySkill] - 1) + ' \u2192 ' + emp[primarySkill]);
  }
}

function getTeamProjectBonus(project) {
  var bonus = 0;
  var hasPM = false;

  // Get assigned members only — no auto-advance without assignment
  var workers;
  if (project.assignedTeam && project.assignedTeam.length > 0) {
    workers = G.team.filter(function(emp) {
      return project.assignedTeam.indexOf(emp.id) !== -1;
    });
  } else {
    workers = [];
  }

  // Track delivery flags for sales/marketer bonus at delivery time
  var hasSales = false;
  var hasMarketer = false;

  for (var i = 0; i < workers.length; i++) {
    var emp = workers[i];
    var roleMultiplier = ROLE_PROJECT_CONTRIB[emp.role.id] || 1.0;

    if (emp.role.id === 'pm') hasPM = true;
    if (emp.role.id === 'sales') hasSales = true;
    if (emp.role.id === 'marketer') hasMarketer = true;

    // Flaky check
    if (emp.flaw && emp.flaw.id === 'flaky' && Math.random() < emp.flaw.value) continue;

    var effectiveness = 1.0;
    if (emp.flaw && emp.flaw.id === 'slow_starter' && emp.daysEmployed < emp.flaw.value) effectiveness = 0.5;
    if (emp.flaw && emp.flaw.id === 'secret_slacker') effectiveness *= emp.flaw.value;

    // Skill-based contribution: scale with project complexity
    var techRatio = emp.technical / Math.max(1, project.complexity * 2);
    var complexityMultiplier = techRatio >= 2.0 ? 1.5 : techRatio >= 1.0 ? 1.0 : techRatio >= 0.5 ? 0.7 : 0.4;
    var contrib = emp.technical * roleMultiplier * effectiveness * complexityMultiplier;

    if (emp.perk && emp.perk.id === 'night_owl') contrib += emp.perk.value;
    if (emp.perk && emp.perk.id === 'perfectionist') contrib *= 0.9;

    bonus += contrib;
  }

  // PM coordination bonus: +10% to all other workers' output
  if (hasPM && workers.length > 1) bonus *= 1.10;

  // Team size bonus (all assigned workers count)
  if (workers.length >= 3) bonus *= 1.1;
  if (workers.length >= 5) bonus *= 1.05;

  // Store delivery flags on project for checkProjectDeliveries to use
  project._hasSalesAssigned = hasSales;
  project._hasMarketerAssigned = hasMarketer;

  return bonus;
}

function getPayrollAmount() {
  var total = 0;
  for (var i = 0; i < G.team.length; i++) {
    var emp = G.team[i];
    var salary = emp.salary;
    if (emp.perk && emp.perk.id === 'penny_pincher') salary *= (1 - emp.perk.value);
    if (emp.perk && emp.perk.id === 'remote_only') salary *= (1 - emp.perk.value);
    total += salary;
  }
  return Math.round(total);
}

function getOpsTeamCount() {
  var count = 0;
  for (var i = 0; i < G.team.length; i++) {
    if (OPS_ROLES.indexOf(G.team[i].role.id) !== -1) count++;
  }
  return count;
}

// Assign a team member to a project
function assignToProject(employeeId, projectId) {
  var emp = findEmployee(employeeId);
  if (!emp) return false;

  var proj = null;
  for (var i = 0; i < G.activeProjects.length; i++) {
    if (G.activeProjects[i].id === projectId) { proj = G.activeProjects[i]; break; }
  }
  if (!proj) return false;

  if (!proj.assignedTeam) proj.assignedTeam = [];

  // Remove from any other project first
  for (var j = 0; j < G.activeProjects.length; j++) {
    var p = G.activeProjects[j];
    if (p.assignedTeam) {
      p.assignedTeam = p.assignedTeam.filter(function(id) { return id !== employeeId; });
    }
  }

  // Remove from any product assignment (exclusivity: project OR product)
  if (G.ownedProducts) {
    for (var jp = 0; jp < G.ownedProducts.length; jp++) {
      if (G.ownedProducts[jp].assignedTeam) {
        G.ownedProducts[jp].assignedTeam = G.ownedProducts[jp].assignedTeam.filter(function(id) { return id !== employeeId; });
      }
    }
  }
  emp.assignedProductId = null;

  proj.assignedTeam.push(employeeId);
  emp.assignedProjectId = projectId;
  addLog(emp.name + ' assigned to ' + proj.name + '.', 'info');
  return true;
}

function unassignFromProject(employeeId) {
  var emp = findEmployee(employeeId);
  if (!emp) return;
  for (var j = 0; j < G.activeProjects.length; j++) {
    var p = G.activeProjects[j];
    if (p.assignedTeam) {
      p.assignedTeam = p.assignedTeam.filter(function(id) { return id !== employeeId; });
    }
  }
  emp.assignedProjectId = null;
}

// --- Auto-Assign Team ---
// Smart auto-assign: only touches UNASSIGNED team members
function autoAssignTeam() {
  var assignments = [];
  var unassigned = G.team.filter(function(e) {
    return !e.assignedProjectId && !e.assignedProductId;
  });
  if (unassigned.length === 0) return assignments;

  // 1. Sort active projects by deadline urgency (closest deadline first)
  var needyProjects = G.activeProjects.filter(function(p) {
    return p.progress < 100;
  }).sort(function(a, b) {
    return (a.daysToComplete - a.daysActive) - (b.daysToComplete - b.daysActive);
  });

  // Assign to projects
  for (var i = 0; i < needyProjects.length; i++) {
    if (unassigned.length === 0) break;
    var proj = needyProjects[i];
    // Skip if project already has team assigned
    if (proj.assignedTeam && proj.assignedTeam.length > 0) continue;

    // Find best available member by technical * roleMultiplier, bonus for role match
    var bestIdx = -1;
    var bestScore = -1;
    for (var j = 0; j < unassigned.length; j++) {
      var emp = unassigned[j];
      var roleMult = ROLE_PROJECT_CONTRIB[emp.role.id] || 1.0;
      var score = emp.technical * roleMult;
      if (proj.requiredRole && emp.role.id === proj.requiredRole) score += 5;
      if (score > bestScore) { bestScore = score; bestIdx = j; }
    }
    if (bestIdx >= 0) {
      var chosen = unassigned[bestIdx];
      assignToProject(chosen.id, proj.id);
      assignments.push(chosen.name + ' -> ' + proj.name);
      unassigned.splice(bestIdx, 1);
    }
  }

  // 2. Sort live/building products by quality (lowest first)
  var needyProducts = (G.ownedProducts || []).filter(function(p) {
    return (p.status === 'live' || p.status === 'building') &&
           (!p.assignedTeam || p.assignedTeam.length === 0);
  }).sort(function(a, b) {
    return (a.quality || 0) - (b.quality || 0);
  });

  // Assign remaining unassigned dev-role members to products
  for (var k = 0; k < needyProducts.length; k++) {
    if (unassigned.length === 0) break;
    var product = needyProducts[k];
    var devIdx = -1;
    var devScore = -1;
    for (var m = 0; m < unassigned.length; m++) {
      var devEmp = unassigned[m];
      var devRoleMult = ROLE_PROJECT_CONTRIB[devEmp.role.id] || 1.0;
      if (devRoleMult >= 1.5) { // prefer dev-oriented roles
        var s = devEmp.technical * devRoleMult;
        if (s > devScore) { devScore = s; devIdx = m; }
      }
    }
    if (devIdx >= 0) {
      var devChosen = unassigned[devIdx];
      assignToProduct(devChosen.id, product.id);
      assignments.push(devChosen.name + ' -> "' + product.name + '"');
      unassigned.splice(devIdx, 1);
    }
  }

  return assignments;
}

// Scouting AP thresholds by company style (AP spends required per scout level)
var SCOUT_THRESHOLDS = {
  megacorp:  [0, 8, 16, 24], // 8 AP per level
  vc_funded: [0, 5, 10, 15], // 5 AP per level
  budget:    [0, 2, 4,  6],  // 2 AP per level
  niche:     [0, 1, 2,  3],  // 1 AP per level
};

// Returns AP needed for next scout level, or 0 if complete
function getScoutingAPNeeded(comp) {
  var style = comp.style || 'niche';
  var thresholds = SCOUT_THRESHOLDS[style] || SCOUT_THRESHOLDS.niche;
  var currentLevel = comp.scoutLevel || 0;
  if (currentLevel >= 3) return 0;
  return thresholds[currentLevel + 1] - (comp.scoutProgress || 0);
}

// Scout a competitor to see their team info — multi-day mechanic
function scoutCompetitor(competitorId) {
  var comp = null;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].id === competitorId) { comp = G.competitors[i]; break; }
  }
  if (!comp || !comp.alive) return false;

  var style = comp.style || 'niche';
  var thresholds = SCOUT_THRESHOLDS[style] || SCOUT_THRESHOLDS.niche;
  var currentLevel = comp.scoutLevel || 0;
  if (currentLevel >= 3) {
    addLog(comp.name + ' is fully scouted.', 'warn');
    return false;
  }

  comp.scoutProgress = (comp.scoutProgress || 0) + 1;
  var needed = thresholds[currentLevel + 1];

  if (!comp.scoutedTeam) {
    // First scout: generate team immediately so progress is visible
    comp.scoutedTeam = [];
    var teamSize = Math.max(2, Math.floor(comp.share / 2.5));
    for (var j = 0; j < teamSize; j++) {
      var member = generateCandidate();
      if (comp.style === 'megacorp') {
        member.technical = Math.min(10, member.technical + 3);
        member.communication = Math.min(10, member.communication + 2);
        // Megacorp salaries (capped at $20k/wk)
        var megaSalary;
        if (member.technical >= 8) {
          megaSalary = randomInt(13000, 20000);
        } else if (member.technical >= 6) {
          megaSalary = randomInt(5000, 13000);
        } else {
          megaSalary = randomInt(1000, 5000);
        }
        member.salary = Math.round(megaSalary / 100) * 100;
        member.askingSalary = member.salary;
      } else if (comp.style === 'vc_funded') {
        member.technical = Math.min(10, member.technical + 1);
        // VC-funded: $1k–$4k/wk
        var vcSalary = randomInt(1000, 4000);
        member.salary = Math.round(vcSalary / 100) * 100;
        member.askingSalary = member.salary;
      }
      member.willingToLeave = Math.random() < (comp.style === 'megacorp' ? 0.3 : comp.style === 'vc_funded' ? 0.5 : 0.7);
      member.scoutLevel = 0;
      comp.scoutedTeam.push(member);
    }
  }

  if (comp.scoutProgress >= needed) {
    // Level up
    comp.scoutLevel = currentLevel + 1;
    comp.scouted = true;
    for (var k = 0; k < comp.scoutedTeam.length; k++) {
      comp.scoutedTeam[k].scoutLevel = Math.min(2, comp.scoutedTeam[k].scoutLevel + 1);
    }
    var levelText = comp.scoutLevel === 1 ? 'names and roles' : comp.scoutLevel === 2 ? 'skills and salaries' : 'loyalty and willingness';
    addLog('Intel gathered on ' + comp.name + ' — now know their ' + levelText + '.', 'good');
  } else {
    var remaining = needed - comp.scoutProgress;
    addLog('Scouting ' + comp.name + '... ' + remaining + ' more AP needed for intel breakthrough.', 'info');
  }
  return true;
}

// Attempt to poach a team member from a competitor
function poachEmployee(competitorId, candidateId) {
  var comp = null;
  for (var i = 0; i < G.competitors.length; i++) {
    if (G.competitors[i].id === competitorId) { comp = G.competitors[i]; break; }
  }
  if (!comp || !comp.alive || !comp.scoutedTeam) return { success: false, message: 'Invalid target.' };

  var targetIdx = -1;
  for (var j = 0; j < comp.scoutedTeam.length; j++) {
    if (comp.scoutedTeam[j].id === candidateId) { targetIdx = j; break; }
  }
  if (targetIdx === -1) return { success: false, message: 'Target not found.' };

  var target = comp.scoutedTeam[targetIdx];

  // Check willingness
  if (target.willingToLeave === false) {
    addLog(target.name + ' at ' + comp.name + ' is not interested in leaving.', 'warn');
    return { success: false, message: target.name + ' is simply not interested in being poached.' };
  }

  var baseChance = 0.4;
  if (comp.style === 'megacorp') baseChance = 0.15;
  else if (comp.style === 'vc_funded') baseChance = 0.25;
  else if (comp.style === 'budget') baseChance = 0.55;

  var repBonus = Math.min(0.3, G.reputation * 0.002);
  var finalChance = Math.min(0.85, baseChance + repBonus);

  if (Math.random() < finalChance) {
    comp.scoutedTeam.splice(targetIdx, 1);
    // Poached employees want higher salary from bigger companies
    var salaryMult = comp.style === 'megacorp' ? 1.4 : comp.style === 'vc_funded' ? 1.3 : 1.2;
    target.salary = Math.round(target.salary * salaryMult / 100) * 100;
    target.askingSalary = target.salary;
    target.skillsRevealed = 2;

    // Ensure work history reflects the company they were poached from
    target.workHistory = target.workHistory || [];
    var alreadyHasComp = target.workHistory.some(function(h) { return h.company === comp.name; });
    if (!alreadyHasComp) {
      target.workHistory.unshift({ company: comp.name, role: target.role.id, years: randomInt(1, 4) });
    }

    // Mark as being-poached for immediate negotiation (not shown in candidates list)
    target.isBeingPoached = true;
    target.patienceUsed = 0;
    target.patience = randomInt(2, 4);
    G.candidates.push(target);

    addLog('Poached ' + target.name + ' from ' + comp.name + '! Negotiate salary now.', 'good');
    return { success: true, message: 'Poached ' + target.name + '!', candidate: target };
  } else {
    G.reputation = Math.max(0, G.reputation - 2);
    addLog('Failed to poach from ' + comp.name + '. Word got out. -2 rep.', 'bad');
    return { success: false, message: 'Poaching attempt failed. -2 rep.', candidate: null };
  }
}
