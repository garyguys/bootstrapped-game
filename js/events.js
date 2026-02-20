/* ============================================
   events.js — Random Events (Day + Overnight)
   ============================================ */

// --- Day Events (appear between actions, require player choice) ---

var DAY_EVENTS = [
  {
    id: 'critical_bug',
    name: 'Critical Bug Found',
    desc: 'A critical bug was discovered in your latest delivery. The client is furious.',
    condition: function() { return G.completedProjects.length > 0; },
    weight: 3,
    choices: [
      { text: 'Fix it now (-$200, 1 AP)', effect: function() {
        G.cash -= 200;
        spendAP(1);
        addLog('Spent $200 and an action fixing a critical bug.', 'warn');
      }, requires: function() { return G.cash >= 200 && canAct(); } },
      { text: 'Ignore it (-5 rep)', effect: function() {
        G.reputation = Math.max(0, G.reputation - 5);
        addLog('Ignored the bug. Client left a bad review. -5 rep.', 'bad');
      } },
    ]
  },
  {
    id: 'staff_poached',
    name: 'Staff Poaching Attempt',
    desc: 'A competitor is trying to poach one of your employees with a better offer.',
    condition: function() { return G.team.length > 0; },
    weight: 3,
    choices: [
      { text: 'Counter-offer (+$300 to salary)', effect: function() {
        var emp = randomChoice(G.team);
        emp.salary += 300;
        emp.loyalty = Math.min(100, emp.loyalty + 30);
        addLog('Counter-offered ' + emp.name + '. They stayed, but expect $' + emp.salary + '/wk now.', 'warn');
      } },
      { text: 'Let them go', effect: function() {
        if (G.team.length > 0) {
          var emp = randomChoice(G.team);
          G.team = G.team.filter(function(e) { return e.id !== emp.id; });
          addLog(emp.name + ' was poached by a competitor. They\'re gone.', 'bad');
        }
      } },
      { text: 'Motivational speech (free, 50% chance)', effect: function() {
        var emp = randomChoice(G.team);
        if (Math.random() < 0.5) {
          emp.loyalty = Math.min(100, emp.loyalty + 15);
          addLog('Your speech worked! ' + emp.name + ' is staying. Loyalty up.', 'good');
        } else {
          G.team = G.team.filter(function(e) { return e.id !== emp.id; });
          addLog(emp.name + ' wasn\'t convinced and left anyway.', 'bad');
        }
      } },
    ]
  },
  {
    id: 'client_upsell',
    name: 'Client Call — Upsell Opportunity',
    desc: 'A happy client wants to discuss expanding scope on their project.',
    condition: function() { return G.activeProjects.length > 0; },
    weight: 2,
    choices: [
      { text: 'Accept upsell (+$500, +15% scope)', effect: function() {
        var p = randomChoice(G.activeProjects);
        p.payout += 500;
        p.progress = Math.max(0, p.progress - 15);
        addLog('Upsold ' + p.client + '. +$500 but scope expanded.', 'good');
      } },
      { text: 'Decline politely (+2 rep)', effect: function() {
        G.reputation += 2;
        addLog('Politely declined scope creep. Client respects your boundaries. +2 rep.', 'good');
      } },
    ]
  },
  {
    id: 'partnership_offer',
    name: 'Partnership Offer',
    desc: 'A referral partner wants to send you leads — for a 15% cut of project revenue.',
    condition: function() { return G.day >= 5; },
    weight: 2,
    choices: [
      { text: 'Accept (extra leads, -15% on referred)', effect: function() {
        G.perks.push({ id: 'referral_partner', name: 'Referral Partner', desc: '+1 lead/day, -15% rev on referred projects', duration: 14, daysLeft: 14 });
        addLog('Referral partnership active for 2 weeks. More leads incoming.', 'good');
      } },
      { text: 'Decline', effect: function() {
        addLog('Declined the partnership. Staying independent.', 'info');
      } },
    ]
  },
  {
    id: 'investor_coffee',
    name: 'Coffee with an Investor',
    desc: 'An angel investor wants to meet for coffee. Could lead somewhere.',
    condition: function() { return G.reputation >= 10 && G.day >= 7; },
    weight: 2,
    choices: [
      { text: 'Take the meeting (1 AP, +rep, +$$)', effect: function() {
        if (canAct()) {
          spendAP(1);
          G.reputation += 3;
          G.cash += randomInt(200, 500);
          addLog('Great coffee chat. Investor impressed. +3 rep, +$ bonus.', 'good');
        } else {
          addLog('No AP to take the meeting. Opportunity missed.', 'bad');
        }
      }, requires: function() { return canAct(); } },
      { text: 'Skip it — too busy', effect: function() {
        addLog('Skipped investor meeting. Focus on the grind.', 'info');
      } },
    ]
  },
  {
    id: 'tax_audit',
    name: 'Tax Audit Notice',
    desc: 'The IRS wants to look at your books. This will cost time and money.',
    condition: function() { return G.totalRevenue >= 3000; },
    weight: 1,
    choices: [
      { text: 'Hire an accountant (-$500)', effect: function() {
        G.cash -= 500;
        addLog('Hired an accountant. Audit resolved. -$500.', 'warn');
      }, requires: function() { return G.cash >= 500; } },
      { text: 'Handle it yourself (1 AP, risky)', effect: function() {
        if (canAct()) {
          spendAP(1);
          if (Math.random() < 0.6) {
            addLog('Handled the audit yourself. Close call, but you\'re clear.', 'good');
          } else {
            var fine = randomInt(300, 800);
            G.cash -= fine;
            addLog('Audit found discrepancies. Fined $' + fine + '.', 'bad');
          }
        }
      }, requires: function() { return canAct(); } },
    ]
  },
  {
    id: 'viral_tweet',
    name: 'Your Tweet Went Viral',
    desc: 'A tweet about your startup journey is blowing up. How do you capitalize?',
    condition: function() { return G.day >= 3; },
    weight: 2,
    choices: [
      { text: 'Ride the wave (+5 rep, +2 leads)', effect: function() {
        G.reputation += 5;
        generatePipelineLeads();
        addLog('Viral moment! +5 rep and new leads are flooding in.', 'good');
      } },
      { text: 'Pitch your services (+rep, 50% chance of big client)', effect: function() {
        G.reputation += 2;
        if (Math.random() < 0.5) {
          var bonus = randomInt(500, 1500);
          G.cash += bonus;
          addLog('Viral pitch landed a client! +$' + bonus + ' direct deal.', 'good');
        } else {
          addLog('Pitch fell flat. At least you got some visibility. +2 rep.', 'info');
        }
      } },
    ]
  },
  {
    id: 'scope_creep',
    name: 'Feature Creep',
    desc: 'A client is demanding extra features that weren\'t in the original spec.',
    condition: function() { return G.activeProjects.length > 0; },
    weight: 3,
    choices: [
      { text: 'Push back (keep scope, -client satisfaction)', effect: function() {
        addLog('Held firm on scope. Client grumbled but accepted.', 'info');
      } },
      { text: 'Accept (+$300 but -20% progress)', effect: function() {
        var p = randomChoice(G.activeProjects);
        p.payout += 300;
        p.progress = Math.max(0, p.progress - 20);
        addLog('Accepted extra scope on ' + p.name + '. More work ahead.', 'warn');
      } },
    ]
  },
];

// --- Overnight Events (surface as notifications on wake) ---

var OVERNIGHT_EVENTS = [
  {
    id: 'press_coverage',
    name: 'Press Coverage',
    condition: function() { return G.reputation >= 15; },
    weight: 2,
    effect: function() {
      var rep = randomInt(3, 8);
      G.reputation += rep;
      return 'A tech blog featured your company! +' + rep + ' rep.';
    }
  },
  {
    id: 'client_review_good',
    name: 'Positive Client Review',
    condition: function() { return G.completedProjects.length > 0; },
    weight: 3,
    effect: function() {
      var rep = randomInt(2, 5);
      G.reputation += rep;
      return 'A past client left a glowing review. +' + rep + ' rep.';
    }
  },
  {
    id: 'client_review_bad',
    name: 'Negative Client Review',
    condition: function() { return G.completedProjects.length > 2; },
    weight: 2,
    effect: function() {
      var rep = randomInt(2, 4);
      G.reputation = Math.max(0, G.reputation - rep);
      return 'A client left a harsh review. -' + rep + ' rep.';
    }
  },
  {
    id: 'market_slowdown',
    name: 'Market Slowdown',
    condition: function() { return G.day >= 10; },
    weight: 1,
    effect: function() {
      if (G.pipeline.length > 1) {
        G.pipeline.pop();
      }
      return 'Economic headwinds. Pipeline is thinning out for a few days.';
    }
  },
  {
    id: 'server_outage',
    name: 'Server Outage',
    condition: function() { return G.activeProjects.length > 0; },
    weight: 2,
    effect: function() {
      if (G.activeProjects.length > 0) {
        var p = randomChoice(G.activeProjects);
        p.progress = Math.max(0, p.progress - 10);
        return 'Server outage overnight! ' + p.name + ' lost 10% progress.';
      }
      return 'Servers had issues overnight, but nothing was affected.';
    }
  },
  {
    id: 'late_night_idea',
    name: 'Late Night Idea',
    condition: function() { return true; },
    weight: 2,
    effect: function() {
      if (G.pipeline.length < 5) {
        G.pipeline.push(generateProject());
        return 'A midnight idea turned into a new lead. Check your pipeline!';
      }
      return 'Had a great midnight idea... but the pipeline is already full.';
    }
  },
  {
    id: 'team_bonding',
    name: 'Team Bonding Moment',
    condition: function() { return G.team.length >= 2; },
    weight: 2,
    effect: function() {
      for (var i = 0; i < G.team.length; i++) {
        G.team[i].loyalty = Math.min(100, G.team[i].loyalty + 5);
      }
      return 'Your team had a great bonding session. Everyone\'s loyalty +5.';
    }
  },
  {
    id: 'competitor_intel',
    name: 'Competitor Intel',
    condition: function() { return G.competitors && G.competitors.length > 0; },
    weight: 2,
    effect: function() {
      var alive = G.competitors.filter(function(c) { return c.alive; });
      if (alive.length > 0) {
        var c = randomChoice(alive);
        return 'Industry rumor: ' + c.name + ' is ' +
          randomChoice(['hiring aggressively', 'losing key staff', 'pivoting strategy', 'running low on cash', 'launching a new product', 'in acquisition talks']) + '.';
      }
      return 'Quiet night in the industry.';
    }
  },
  {
    id: 'donation_request',
    name: 'Donation Request',
    condition: function() { return G.cash >= 500; },
    weight: 1,
    effect: function() {
      var cost = randomInt(50, 200);
      G.cash -= cost;
      G.reputation += 2;
      return 'Donated $' + cost + ' to a local tech meetup. +2 rep from the community.';
    }
  },
  {
    id: 'passive_income',
    name: 'Residual Payment',
    condition: function() { return G.completedProjects.length >= 3; },
    weight: 2,
    effect: function() {
      var amount = randomInt(50, 300);
      G.cash += amount;
      return 'A past client sent a referral bonus! +$' + amount + '.';
    }
  },
];

// --- Event System ---

var _recentEventIds = [];

function rollDayEvent() {
  if (Math.random() > 0.30) return null;

  var eligible = DAY_EVENTS.filter(function(e) {
    return e.condition() && _recentEventIds.indexOf(e.id) === -1;
  });
  if (eligible.length === 0) return null;

  var totalWeight = 0;
  for (var i = 0; i < eligible.length; i++) totalWeight += eligible[i].weight;
  var roll = Math.random() * totalWeight;
  var sum = 0;
  for (var j = 0; j < eligible.length; j++) {
    sum += eligible[j].weight;
    if (roll <= sum) {
      _recentEventIds.push(eligible[j].id);
      if (_recentEventIds.length > 5) _recentEventIds.shift();
      return eligible[j];
    }
  }
  return null;
}

function rollOvernightEvents() {
  var count = Math.random() < 0.4 ? 2 : 1;
  var fired = [];

  for (var n = 0; n < count; n++) {
    var eligible = OVERNIGHT_EVENTS.filter(function(e) {
      return e.condition() && fired.indexOf(e.id) === -1;
    });
    if (eligible.length === 0) continue;

    var totalWeight = 0;
    for (var i = 0; i < eligible.length; i++) totalWeight += eligible[i].weight;
    var roll = Math.random() * totalWeight;
    var sum = 0;
    for (var j = 0; j < eligible.length; j++) {
      sum += eligible[j].weight;
      if (roll <= sum) {
        var msg = eligible[j].effect();
        G.overnightEvents.push(msg);
        addLog('[Overnight] ' + msg, eligible[j].id.indexOf('bad') !== -1 || eligible[j].id === 'server_outage' || eligible[j].id === 'market_slowdown' ? 'bad' : 'info');
        fired.push(eligible[j].id);
        break;
      }
    }
  }
}

function showDayEventModal(event) {
  var modal = document.getElementById('event-modal');
  var title = document.getElementById('event-modal-title');
  var desc = document.getElementById('event-modal-desc');
  var choices = document.getElementById('event-modal-choices');

  title.textContent = event.name;
  desc.textContent = event.desc;
  choices.innerHTML = '';

  for (var i = 0; i < event.choices.length; i++) {
    var choice = event.choices[i];
    var btn = document.createElement('button');
    btn.className = 'btn btn-small';
    btn.textContent = choice.text;

    if (choice.requires && !choice.requires()) {
      btn.disabled = true;
      btn.classList.add('btn-secondary');
    } else {
      btn.classList.add(i === 0 ? 'btn-primary' : 'btn-secondary');
    }

    btn.onclick = (function(c) {
      return function() {
        modal.style.display = 'none';
        c.effect();
        UI.renderAll();
      };
    })(choice);

    choices.appendChild(btn);
  }

  modal.style.display = 'flex';
}

// Called after each player action (via afterAction -> confirmThenAfterAction)
function checkForDayEvent() {
  if (G.dayEventFired) return;

  var event = rollDayEvent();
  if (event) {
    G.dayEventFired = true;
    showDayEventModal(event);
  }
}
