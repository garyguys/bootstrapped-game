/* ============================================
   team.js — Hiring, Candidates, Team Management
   ============================================ */

var ROLES = [
  { id: 'developer',  name: 'Developer',  icon: '>' },
  { id: 'designer',   name: 'Designer',   icon: '*' },
  { id: 'marketer',   name: 'Marketer',   icon: '#' },
  { id: 'sales',      name: 'Sales Rep',  icon: '$' },
  { id: 'devops',     name: 'DevOps',     icon: '&' },
  { id: 'pm',         name: 'PM',         icon: '@' },
];

var CANDIDATE_FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Sam', 'Charlie', 'Dakota', 'Harper', 'Kai', 'Reese', 'Finley', 'Rowan',
  'Phoenix', 'Sage', 'Blake', 'Drew', 'Emery', 'Lane', 'Noel', 'Tatum',
  'Arin', 'Jules', 'Mika', 'Remy', 'Skyler', 'Zion',
];

var CANDIDATE_LAST_NAMES = [
  'Chen', 'Patel', 'Kim', 'Singh', 'Nakamura', 'Garcia', 'Okafor', 'Muller',
  'Santos', 'Johansson', 'Park', 'Nguyen', 'Ali', 'Schmidt', 'Cohen', 'Tanaka',
  'Rivera', 'Volkov', 'Dubois', 'Ibrahim', 'Larsson', 'Torres', 'Yamamoto', 'Shah',
];

// Perks candidates might have — roguelike flavor
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

// Flaws that make bad hires risky — roguelike downside
var CANDIDATE_FLAWS = [
  { id: 'flaky',          name: 'Flaky',           desc: '25% chance of no-show each day', effect: 'unreliable', value: 0.25 },
  { id: 'prima_donna',    name: 'Prima Donna',     desc: 'Quits if not on the biggest project', effect: 'demanding', value: 0 },
  { id: 'slow_starter',   name: 'Slow Starter',    desc: 'First 5 days: 50% effectiveness', effect: 'ramp_up', value: 5 },
  { id: 'job_hopper',     name: 'Job Hopper',      desc: 'Loyalty decays 2x faster', effect: 'low_loyalty', value: 2 },
  { id: 'overqualified',  name: 'Overqualified',   desc: 'Great skills but leaves after 20 days', effect: 'temp', value: 20 },
  { id: 'secret_slacker', name: '???',             desc: 'Hidden: does 50% less work than stats suggest', effect: 'slacker', value: 0.5 },
];

var _nextCandidateId = 1;

function generateCandidate() {
  var role = randomChoice(ROLES);
  var level = randomInt(1, 3); // 1=junior, 2=mid, 3=senior
  var levelNames = ['Junior', 'Mid-Level', 'Senior'];

  // Skills rated 1-5, influenced by level
  var baseMin = level;
  var baseMax = level + 2;
  var technical = Math.min(5, randomInt(baseMin, baseMax));
  var communication = Math.min(5, randomInt(Math.max(1, baseMin - 1), baseMax));
  var reliability = Math.min(5, randomInt(baseMin, baseMax));

  // Role-based skill skew
  if (role.id === 'developer' || role.id === 'devops') {
    technical = Math.min(5, technical + 1);
  } else if (role.id === 'sales' || role.id === 'marketer') {
    communication = Math.min(5, communication + 1);
  } else if (role.id === 'pm') {
    reliability = Math.min(5, reliability + 1);
  }

  // Salary based on level
  var salaryBase = [400, 800, 1400];
  var salary = salaryBase[level - 1] + randomInt(-100, 200);
  salary = Math.round(salary / 50) * 50; // round to 50

  // Perk (60% chance) and flaw (30% chance, hidden until hired)
  var perk = null;
  if (Math.random() < 0.6) {
    perk = randomChoice(CANDIDATE_PERKS);
  }

  var flaw = null;
  if (Math.random() < 0.30) {
    flaw = randomChoice(CANDIDATE_FLAWS);
  }

  // Interview reveals
  var skillsRevealed = 0; // 0=none, 1=one skill, 2=all three + perk

  return {
    id: _nextCandidateId++,
    name: randomChoice(CANDIDATE_FIRST_NAMES) + ' ' + randomChoice(CANDIDATE_LAST_NAMES),
    role: role,
    level: level,
    levelName: levelNames[level - 1],
    technical: technical,
    communication: communication,
    reliability: reliability,
    salary: salary, // biweekly
    perk: perk,
    flaw: flaw,           // hidden until after hiring
    flawRevealed: false,
    skillsRevealed: skillsRevealed,
    loyalty: 70 + randomInt(-10, 10),
    daysEmployed: 0,
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
    addLog('Interviewed ' + c.name + ': ' + c.role.name + ' (' + c.levelName + '). Technical: ' + c.technical + '/5.', 'info');
  } else {
    var perkText = c.perk ? ' Perk: ' + c.perk.name + '.' : '';
    addLog('Deep interview with ' + c.name + ': Comm ' + c.communication + '/5, Reliability ' + c.reliability + '/5.' + perkText, 'info');
  }
  return true;
}

function hireCandidate(candidateId) {
  var c = findCandidate(candidateId);
  if (!c) return false;

  // Remove from candidates
  G.candidates = G.candidates.filter(function(x) { return x.id !== candidateId; });

  // Add to team
  c.daysEmployed = 0;
  G.team.push(c);

  // Prestige perk
  if (c.perk && c.perk.id === 'ex_faang') {
    G.reputation += c.perk.value;
    addLog(c.name + '\'s FAANG background impressed clients. +' + c.perk.value + ' rep.', 'good');
  }

  // Reveal flaw after hiring (roguelike surprise)
  if (c.flaw && Math.random() < 0.5) {
    c.flawRevealed = true;
    addLog('Uh oh... ' + c.name + ' turns out to be: ' + c.flaw.name + ' — ' + c.flaw.desc, 'bad');
  }

  addLog('Hired ' + c.name + ' as ' + c.levelName + ' ' + c.role.name + '. Salary: $' + c.salary + '/2wk.', 'good');
  return true;
}

function fireEmployee(employeeId) {
  var idx = -1;
  for (var i = 0; i < G.team.length; i++) {
    if (G.team[i].id === employeeId) { idx = i; break; }
  }
  if (idx === -1) return false;

  var emp = G.team.splice(idx, 1)[0];
  addLog('Fired ' + emp.name + '. They did not take it well.', 'bad');

  // Morale hit for remaining team
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

// Team daily tick — called from advanceProjects
function tickTeam() {
  var quitters = [];

  for (var i = 0; i < G.team.length; i++) {
    var emp = G.team[i];
    emp.daysEmployed += 1;

    // Loyalty decay
    var decayRate = 1;
    if (emp.flaw && emp.flaw.id === 'job_hopper') decayRate = 2;
    emp.loyalty = Math.max(0, emp.loyalty - decayRate);

    // Overqualified flaw: leaves after X days
    if (emp.flaw && emp.flaw.id === 'overqualified' && emp.daysEmployed >= emp.flaw.value) {
      quitters.push(emp);
      continue;
    }

    // Quick learner perk
    if (emp.perk && emp.perk.id === 'quick_learner' && emp.daysEmployed === 7) {
      emp.technical = Math.min(5, emp.technical + 1);
      emp.communication = Math.min(5, emp.communication + 1);
      emp.reliability = Math.min(5, emp.reliability + 1);
      addLog(emp.name + ' has gotten up to speed. All skills +1.', 'good');
    }

    // Open source contributor perk
    if (emp.perk && emp.perk.id === 'open_source' && emp.daysEmployed % 10 === 0 && emp.daysEmployed > 0) {
      emp.technical = Math.min(5, emp.technical + 1);
      addLog(emp.name + '\'s open source work pays off. Technical +1.', 'good');
    }

    // Quit if loyalty bottoms out
    if (emp.loyalty <= 10) {
      quitters.push(emp);
    }
  }

  // Process quitters
  for (var j = 0; j < quitters.length; j++) {
    var q = quitters[j];
    G.team = G.team.filter(function(e) { return e.id !== q.id; });
    addLog(q.name + ' quit! ' + (q.flaw && q.flaw.id === 'overqualified' ? 'They were overqualified all along.' : 'Morale was too low.'), 'bad');
    G.overnightEvents.push(q.name + ' quit the company.');
  }
}

// Calculate team contribution to project progress per day
function getTeamProjectBonus(project) {
  var bonus = 0;
  for (var i = 0; i < G.team.length; i++) {
    var emp = G.team[i];

    // Only devs/designers/devops contribute to project progress
    if (emp.role.id !== 'developer' && emp.role.id !== 'designer' && emp.role.id !== 'devops') continue;

    // Flaky check
    if (emp.flaw && emp.flaw.id === 'flaky' && Math.random() < emp.flaw.value) continue;

    // Slow starter
    var effectiveness = 1.0;
    if (emp.flaw && emp.flaw.id === 'slow_starter' && emp.daysEmployed < emp.flaw.value) {
      effectiveness = 0.5;
    }

    // Secret slacker
    if (emp.flaw && emp.flaw.id === 'secret_slacker') {
      effectiveness *= emp.flaw.value;
    }

    // Base contribution: technical skill * 3% per day
    var contrib = emp.technical * 3 * effectiveness;

    // Night owl perk
    if (emp.perk && emp.perk.id === 'night_owl') {
      contrib += emp.perk.value;
    }

    // Perfectionist perk: slower but more rep
    if (emp.perk && emp.perk.id === 'perfectionist') {
      contrib *= 0.9;
    }

    bonus += contrib;
  }
  return bonus;
}

// Get total biweekly payroll
function getPayrollAmount() {
  var total = 0;
  for (var i = 0; i < G.team.length; i++) {
    var emp = G.team[i];
    var salary = emp.salary;
    if (emp.perk && emp.perk.id === 'penny_pincher') {
      salary *= (1 - emp.perk.value);
    }
    if (emp.perk && emp.perk.id === 'remote_only') {
      salary *= (1 - emp.perk.value);
    }
    total += salary;
  }
  return Math.round(total);
}
