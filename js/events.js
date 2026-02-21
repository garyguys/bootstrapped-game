/* ============================================
   events.js — Random Events (Day + Overnight)
   Events now specify which project + show progress.
   Donation is optional. Event result confirmations.
   COM skill reduces negative team events.
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
        return 'Fixed the bug. -$200 and 1 AP spent.';
      }, requires: function() { return G.cash >= 200 && canAct(); } },
      { text: 'Ignore it (-5 rep)', effect: function() {
        G.reputation = Math.max(0, G.reputation - 5);
        addLog('Ignored the bug. Client left a bad review. -5 rep.', 'bad');
        return 'Ignored the bug. Client left a bad review. -5 rep.';
      } },
    ]
  },
  {
    id: 'staff_poached',
    name: 'Staff Poaching Attempt',
    desc: 'A competitor is trying to poach one of your employees with a better offer.',
    condition: function() {
      if (G.team.length === 0) return false;
      // COM skill reduces chance of this event
      var avgCom = 0;
      for (var i = 0; i < G.team.length; i++) avgCom += G.team[i].communication;
      avgCom = avgCom / G.team.length;
      return Math.random() > (avgCom / 20); // Higher COM = less likely
    },
    weight: 3,
    choices: [
      { text: 'Counter-offer (+$300 to salary)', effect: function() {
        var emp = randomChoice(G.team);
        emp.salary += 300;
        emp.loyalty = Math.min(100, emp.loyalty + 30);
        addLog('Counter-offered ' + emp.name + '. They stayed at $' + emp.salary + '/wk.', 'warn');
        return 'Counter-offered ' + emp.name + '. They stayed, but salary is now $' + emp.salary + '/wk.';
      } },
      { text: 'Let them go', effect: function() {
        if (G.team.length > 0) {
          var emp = randomChoice(G.team);
          G.team = G.team.filter(function(e) { return e.id !== emp.id; });
          addLog(emp.name + ' was poached by a competitor.', 'bad');
          return emp.name + ' was poached by a competitor. They\'re gone.';
        }
        return 'Nobody was poached.';
      } },
      { text: 'Motivational speech (free, 50% chance)', effect: function() {
        var emp = randomChoice(G.team);
        if (Math.random() < 0.5) {
          emp.loyalty = Math.min(100, emp.loyalty + 15);
          addLog('Your speech worked! ' + emp.name + ' is staying.', 'good');
          return 'Your speech worked! ' + emp.name + ' is staying. Loyalty up.';
        } else {
          G.team = G.team.filter(function(e) { return e.id !== emp.id; });
          addLog(emp.name + ' wasn\'t convinced and left anyway.', 'bad');
          return emp.name + ' wasn\'t convinced and left anyway.';
        }
      } },
    ]
  },
  {
    id: 'client_upsell',
    name: 'Client Call — Upsell Opportunity',
    desc: '', // Set dynamically to include project name
    condition: function() { return G.activeProjects.length > 0; },
    weight: 2,
    getProject: function() { return randomChoice(G.activeProjects); },
    choices: [
      { text: 'Accept upsell (+$500, +15% scope)', effect: function(project) {
        if (!project) project = randomChoice(G.activeProjects);
        project.payout += 500;
        project.progress = Math.max(0, project.progress - 15);
        addLog('Upsold ' + project.client + ' on ' + project.name + '. +$500 but scope expanded.', 'good');
        return 'Upsold ' + project.client + ' on ' + project.name + '. +$500 but -15% progress.';
      } },
      { text: 'Decline politely (+2 rep)', effect: function() {
        G.reputation += 2;
        addLog('Politely declined scope creep. +2 rep.', 'good');
        return 'Declined scope creep. Client respects your boundaries. +2 rep.';
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
        addLog('Referral partnership active for 2 weeks.', 'good');
        return 'Referral partnership active for 2 weeks. More leads incoming.';
      } },
      { text: 'Decline', effect: function() {
        addLog('Declined the partnership.', 'info');
        return 'Declined the partnership. Staying independent.';
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
          var bonus = randomInt(200, 500);
          G.cash += bonus;
          addLog('Great coffee chat. +3 rep, +$' + bonus + '.', 'good');
          return 'Great coffee chat. +3 rep, +$' + bonus + ' bonus.';
        } else {
          addLog('No AP for the meeting. Missed.', 'bad');
          return 'No AP available. Opportunity missed.';
        }
      }, requires: function() { return canAct(); } },
      { text: 'Skip it — too busy', effect: function() {
        addLog('Skipped investor meeting.', 'info');
        return 'Skipped the meeting. Focus on the grind.';
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
        return 'Hired an accountant. Audit resolved cleanly. -$500.';
      }, requires: function() { return G.cash >= 500; } },
      { text: 'Handle it yourself (1 AP, risky)', effect: function() {
        if (canAct()) {
          spendAP(1);
          if (Math.random() < 0.6) {
            addLog('Handled the audit yourself. You\'re clear.', 'good');
            return 'Handled the audit yourself. Close call, but you\'re clear.';
          } else {
            var fine = randomInt(300, 800);
            G.cash -= fine;
            addLog('Audit found discrepancies. Fined $' + fine + '.', 'bad');
            return 'Audit found discrepancies. Fined $' + fine + '.';
          }
        }
        return 'No AP available.';
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
        addLog('Viral moment! +5 rep and new leads.', 'good');
        return 'Viral moment! +5 rep and new leads are flooding in.';
      } },
      { text: 'Pitch your services (+rep, 50% chance big client)', effect: function() {
        G.reputation += 2;
        if (Math.random() < 0.5) {
          var bonus = randomInt(500, 1500);
          G.cash += bonus;
          addLog('Viral pitch landed a client! +$' + bonus + '.', 'good');
          return 'Viral pitch landed a client! +$' + bonus + ' direct deal. +2 rep.';
        } else {
          addLog('Pitch fell flat. +2 rep though.', 'info');
          return 'Pitch fell flat. At least you got some visibility. +2 rep.';
        }
      } },
    ]
  },
  {
    id: 'scope_creep',
    name: 'Feature Creep',
    desc: '', // Set dynamically with project
    condition: function() { return G.activeProjects.length > 0; },
    weight: 3,
    getProject: function() { return randomChoice(G.activeProjects); },
    choices: [
      { text: 'Push back (keep scope)', effect: function() {
        addLog('Held firm on scope. Client accepted.', 'info');
        return 'Held firm on scope. Client grumbled but accepted.';
      } },
      { text: 'Accept (+$300 but -20% progress)', effect: function(project) {
        if (!project) project = randomChoice(G.activeProjects);
        project.payout += 300;
        project.progress = Math.max(0, project.progress - 20);
        addLog('Accepted extra scope on ' + project.name + '.', 'warn');
        return 'Accepted extra scope on ' + project.name + '. +$300 but -20% progress.';
      } },
    ]
  },
  {
    id: 'donation_request',
    name: 'Local Tech Community Fundraiser',
    desc: 'A local tech startup community is raising funds. Donating would boost your reputation.',
    condition: function() {
      var minCash = G.stage === 'freelancer' ? 300 : G.stage === 'home_office' ? 500 : 1000;
      return G.cash >= minCash;
    },
    weight: 2,
    getDonationCosts: function() {
      // Scale with stage
      var stageMults = { freelancer: 1, home_office: 2.5, micro: 6, boutique: 15, scaleup: 35, leader: 80 };
      var mult = stageMults[G.stage] || 1;
      var large = Math.round(randomInt(100, 250) * mult / 50) * 50;
      var small = Math.round(randomInt(30, 80) * mult / 50) * 50;
      return { large: large, small: small };
    },
    choices: [
      { text: 'Large donation (+3 rep)', getCost: function() {
        var stageMults = { freelancer: 1, home_office: 2.5, micro: 6, boutique: 15, scaleup: 35, leader: 80 };
        var mult = stageMults[G.stage] || 1;
        return Math.round(randomInt(100, 250) * mult / 50) * 50;
      }, effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 2.5, micro: 6, boutique: 15, scaleup: 35, leader: 80 };
          var mult = stageMults[G.stage] || 1;
          cost = Math.round(randomInt(100, 250) * mult / 50) * 50;
        }
        G.cash -= cost;
        G.reputation += 3;
        addLog('Donated $' + cost.toLocaleString() + ' to local tech community. +3 rep.', 'good');
        return 'Donated $' + cost.toLocaleString() + ' to local tech community. +3 rep.';
      }, requires: function() { return G.cash >= 100; } },
      { text: 'Small contribution (+1 rep)', getCost: function() {
        var stageMults = { freelancer: 1, home_office: 2.5, micro: 6, boutique: 15, scaleup: 35, leader: 80 };
        var mult = stageMults[G.stage] || 1;
        return Math.round(randomInt(30, 80) * mult / 50) * 50;
      }, effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 2.5, micro: 6, boutique: 15, scaleup: 35, leader: 80 };
          var mult = stageMults[G.stage] || 1;
          cost = Math.round(randomInt(30, 80) * mult / 50) * 50;
        }
        G.cash -= cost;
        G.reputation += 1;
        addLog('Small donation of $' + cost.toLocaleString() + '. +1 rep.', 'info');
        return 'Contributed $' + cost.toLocaleString() + '. A small gesture. +1 rep.';
      } },
      { text: 'Decline', effect: function() {
        addLog('Declined the donation request.', 'info');
        return 'Declined the donation request. Need to watch cash flow.';
      } },
    ]
  },
  {
    id: 'big_client_opportunity',
    name: 'Big Client Opportunity',
    desc: 'A major company is looking for a partner. This could be huge if you land it.',
    condition: function() { return G.reputation >= 20 && G.day >= 10; },
    weight: 1,
    choices: [
      { text: 'Pitch aggressively (1 AP, 40% chance)', effect: function() {
        if (canAct()) {
          spendAP(1);
          if (Math.random() < 0.4) {
            var bonus = randomInt(2000, 5000);
            G.cash += bonus;
            G.reputation += 5;
            addLog('Landed a big client! +$' + bonus + ', +5 rep.', 'good');
            return 'You nailed the pitch! Landed a big client. +$' + bonus + ', +5 rep.';
          } else {
            addLog('Pitch didn\'t land. Maybe next time.', 'info');
            return 'Pitch didn\'t land. The client went with a competitor. Maybe next time.';
          }
        }
        return 'No AP to pitch.';
      }, requires: function() { return canAct(); } },
      { text: 'Pass — not ready yet', effect: function() {
        addLog('Passed on the big client opportunity.', 'info');
        return 'Passed on the opportunity. Better to be ready than to overextend.';
      } },
    ]
  },
  {
    id: 'key_employee_quits',
    name: 'Key Employee Wants to Resign',
    desc: 'One of your team members has come to you with a resignation letter. Low morale is taking its toll.',
    condition: function() {
      if (G.team.length === 0) return false;
      return G.team.some(function(e) { return e.loyalty < 50; });
    },
    weight: 2,
    choices: [
      { text: 'Counter-offer (+$300/wk salary)', effect: function() {
        var unhappy = G.team.filter(function(e) { return e.loyalty < 50; });
        var emp = randomChoice(unhappy.length > 0 ? unhappy : G.team);
        emp.salary += 300;
        emp.loyalty = Math.min(100, emp.loyalty + 30);
        addLog(emp.name + ' agreed to stay with a raise. Salary now $' + emp.salary + '/wk.', 'warn');
        return emp.name + ' agreed to stay. Salary bumped to $' + emp.salary.toLocaleString() + '/wk.';
      } },
      { text: 'Accept the resignation (-5 rep)', effect: function() {
        var unhappy = G.team.filter(function(e) { return e.loyalty < 50; });
        var emp = randomChoice(unhappy.length > 0 ? unhappy : G.team);
        G.team = G.team.filter(function(e) { return e.id !== emp.id; });
        for (var p = 0; p < G.activeProjects.length; p++) {
          if (G.activeProjects[p].assignedTeam) {
            G.activeProjects[p].assignedTeam = G.activeProjects[p].assignedTeam.filter(function(id) { return id !== emp.id; });
          }
        }
        G.reputation = Math.max(0, G.reputation - 5);
        addLog(emp.name + ' resigned. -5 rep.', 'bad');
        return emp.name + ' has left the company. -5 rep.';
      } },
    ]
  },
  {
    id: 'client_emergency',
    name: 'Client Emergency',
    desc: 'A client is demanding immediate attention on an active project.',
    condition: function() { return G.activeProjects.length > 0; },
    weight: 2,
    getProject: function() { return randomChoice(G.activeProjects); },
    choices: [
      { text: 'Drop everything and help (1 AP, +10% progress, +3 rep)', effect: function(project) {
        if (!project) project = randomChoice(G.activeProjects);
        if (canAct()) {
          spendAP(1);
          project.progress = Math.min(100, project.progress + 10);
          G.reputation += 3;
          addLog('Jumped on ' + project.client + '\'s emergency. +10% progress, +3 rep.', 'good');
          return 'Handled ' + project.client + '\'s emergency personally. +10% on ' + project.name + ', +3 rep.';
        }
        return 'No AP to respond!';
      }, requires: function() { return canAct(); } },
      { text: 'Delegate to team (-8 loyalty all)', effect: function() {
        for (var i = 0; i < G.team.length; i++) {
          G.team[i].loyalty = Math.max(0, G.team[i].loyalty - 8);
        }
        addLog('Delegated the crisis. Team is stressed. -8 loyalty everyone.', 'warn');
        return 'Delegated the crisis to your team. They handled it, but morale took a hit. -8 loyalty.';
      } },
    ]
  },
  {
    id: 'industry_award',
    name: 'Industry Award Nomination',
    desc: 'Your company has been nominated for a regional tech industry award. This is a great PR opportunity.',
    condition: function() { return G.reputation >= 25; },
    weight: 1,
    choices: [
      { text: 'Attend the ceremony (1 AP, +8 rep)', effect: function() {
        if (canAct()) {
          spendAP(1);
          G.reputation += 8;
          addLog('Attended the awards ceremony. Great PR! +8 rep.', 'good');
          return 'Attended the ceremony. Excellent networking. +8 rep.';
        }
        return 'No AP available for the ceremony.';
      }, requires: function() { return canAct(); } },
      { text: 'Skip it — send a thank-you note (+2 rep)', effect: function() {
        G.reputation += 2;
        addLog('Sent a thank-you note for the nomination. +2 rep.', 'info');
        return 'Skipped the ceremony but acknowledged the nomination. +2 rep.';
      } },
    ]
  },
  {
    id: 'surprise_expense',
    name: 'Unexpected Bill Arrives',
    desc: 'An unexpected invoice landed in your inbox — equipment warranty, software license renewal, or a legal notice.',
    condition: function() { return G.cash >= 500; },
    weight: 2,
    getBillAmount: function() {
      var stageMults = { freelancer: 1, home_office: 1.5, micro: 3, boutique: 7, scaleup: 15, leader: 30 };
      var mult = stageMults[G.stage] || 1;
      return Math.round(randomInt(200, 600) * mult / 50) * 50;
    },
    choices: [
      { text: 'Pay it (no drama)', getCost: function() {
        var stageMults = { freelancer: 1, home_office: 1.5, micro: 3, boutique: 7, scaleup: 15, leader: 30 };
        var mult = stageMults[G.stage] || 1;
        return Math.round(randomInt(200, 600) * mult / 50) * 50;
      }, effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 1.5, micro: 3, boutique: 7, scaleup: 15, leader: 30 };
          var mult = stageMults[G.stage] || 1;
          cost = Math.round(randomInt(200, 600) * mult / 50) * 50;
        }
        G.cash -= cost;
        addLog('Paid the unexpected bill. -$' + cost.toLocaleString() + '.', 'warn');
        return 'Paid the bill. -$' + cost.toLocaleString() + '. Business as usual.';
      }, requires: function() { return G.cash >= 200; } },
      { text: 'Contest it (30% chance to avoid, else pay + $200 penalty)', effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 1.5, micro: 3, boutique: 7, scaleup: 15, leader: 30 };
          var mult = stageMults[G.stage] || 1;
          cost = Math.round(randomInt(200, 600) * mult / 50) * 50;
        }
        if (Math.random() < 0.30) {
          addLog('Successfully contested the bill! Saved $' + cost.toLocaleString() + '.', 'good');
          return 'Contested the bill and won! Saved $' + cost.toLocaleString() + '.';
        } else {
          var total = cost + 200;
          G.cash -= total;
          addLog('Contest failed. Paid $' + total.toLocaleString() + ' including penalty.', 'bad');
          return 'Contest failed. Paid $' + total.toLocaleString() + ' including a $200 penalty.';
        }
      } },
    ]
  },
  {
    id: 'media_feature',
    name: 'Journalist Feature Request',
    desc: 'A tech journalist wants to feature your startup in an upcoming article.',
    condition: function() { return G.day >= 10 && G.reputation >= 15; },
    weight: 1,
    choices: [
      { text: 'Do a quick quote (free, +4 rep)', effect: function() {
        G.reputation += 4;
        addLog('Quick press quote. Nice exposure! +4 rep.', 'good');
        return 'Gave a quick quote for the article. Good exposure. +4 rep.';
      } },
      { text: 'Full feature interview (1 AP, +10 rep, +$300 consulting bump)', effect: function() {
        if (canAct()) {
          spendAP(1);
          G.reputation += 10;
          G.cash += 300;
          addLog('Full feature interview. Great publicity! +10 rep, +$300.', 'good');
          return 'Full feature published. Excellent publicity! +10 rep, +$300 from new inquiries.';
        }
        return 'No AP for the full interview.';
      }, requires: function() { return canAct(); } },
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
      if (G.pipeline.length > 1) G.pipeline.pop();
      return 'Economic headwinds. Pipeline thinning out.';
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
        return 'Server outage! ' + p.name + ' lost 10% progress.';
      }
      return 'Servers had issues, but nothing affected.';
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
        return 'A midnight idea turned into a new lead!';
      }
      return 'Had a great midnight idea... but pipeline is full.';
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
      return 'Team had a great bonding moment. Everyone\'s loyalty +5.';
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
  {
    id: 'team_conflict',
    name: 'Team Conflict',
    condition: function() {
      if (G.team.length < 2) return false;
      // COM skill reduces chance
      var avgCom = 0;
      for (var i = 0; i < G.team.length; i++) avgCom += G.team[i].communication;
      avgCom = avgCom / G.team.length;
      return Math.random() > (avgCom / 15);
    },
    weight: 2,
    effect: function() {
      for (var i = 0; i < G.team.length; i++) {
        G.team[i].loyalty = Math.max(0, G.team[i].loyalty - 5);
      }
      return 'Internal conflict among team members. Everyone\'s loyalty -5.';
    }
  },
  {
    id: 'employee_burnout',
    name: 'Employee Burnout Warning',
    condition: function() {
      return G.team.some(function(e) { return e.loyalty < 30; });
    },
    weight: 2,
    effect: function() {
      var atRisk = G.team.filter(function(e) { return e.loyalty < 30; });
      if (atRisk.length === 0) return 'Quiet night.';
      var emp = randomChoice(atRisk);
      emp.loyalty = Math.max(0, emp.loyalty - 15);
      return emp.name + ' is burning out. Loyalty fell to ' + Math.round(emp.loyalty) + '. Take action before they quit.';
    }
  },
  {
    id: 'competitor_poach_overnight',
    name: 'Competitor Poached Staff',
    condition: function() { return G.team.length >= 2 && G.day >= 14; },
    weight: 1,
    effect: function() {
      // 25% chance a random employee actually leaves
      if (Math.random() < 0.25) {
        var victim = randomChoice(G.team);
        G.team = G.team.filter(function(e) { return e.id !== victim.id; });
        for (var p = 0; p < G.activeProjects.length; p++) {
          if (G.activeProjects[p].assignedTeam) {
            G.activeProjects[p].assignedTeam = G.activeProjects[p].assignedTeam.filter(function(id) { return id !== victim.id; });
          }
        }
        addLog(victim.name + ' was poached overnight by a competitor!', 'bad');
        return victim.name + ' was recruited away by a competitor last night.';
      }
      return 'A competitor sent recruiters, but your team held firm.';
    }
  },
  {
    id: 'glassdoor_review',
    name: 'Positive Glassdoor Review',
    condition: function() {
      if (G.team.length === 0) return false;
      var avg = 0;
      for (var i = 0; i < G.team.length; i++) avg += G.team[i].loyalty;
      avg = avg / G.team.length;
      return avg > 60;
    },
    weight: 2,
    effect: function() {
      G.reputation += 3;
      return 'A team member left a glowing Glassdoor review. Great culture score! +3 rep.';
    }
  },
  {
    id: 'late_payment',
    name: 'Late Client Payment',
    condition: function() { return G.completedProjects.length > 0; },
    weight: 2,
    effect: function() {
      var amount = randomInt(200, 600);
      G.cash += amount;
      var past = G.completedProjects[Math.floor(Math.random() * G.completedProjects.length)];
      return (past ? past.client : 'A past client') + ' sent a late payment. +$' + amount + '.';
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
  G.overnightEvents = []; // Clear previous overnight events
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
        addLog('[Overnight] ' + msg, eligible[j].id.indexOf('bad') !== -1 || eligible[j].id === 'server_outage' || eligible[j].id === 'market_slowdown' || eligible[j].id === 'team_conflict' ? 'bad' : 'info');
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

  // If event references a project, update description with project info
  var eventProject = null;
  if (event.getProject) {
    eventProject = event.getProject();
  }

  title.textContent = event.name;

  if (eventProject && (event.id === 'client_upsell' || event.id === 'scope_creep')) {
    var projInfo = eventProject.client + ' wants to discuss ' + eventProject.name + ' (' + Math.round(eventProject.progress) + '% complete).';
    if (event.id === 'client_upsell') {
      desc.innerHTML = escHtml(projInfo) + '<br><br>They want to expand scope on this project.' +
        '<div class="event-project-bar"><div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(eventProject.progress) + '%"></div></div>' +
        '<div style="font-size:0.7rem;color:var(--grey-light);margin-top:0.2rem;">' + escHtml(eventProject.name) + ' — ' + Math.round(eventProject.progress) + '%</div></div>';
    } else {
      desc.innerHTML = escHtml(eventProject.client + ' is demanding extra features on ' + eventProject.name + '.') +
        '<div class="event-project-bar"><div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(eventProject.progress) + '%"></div></div>' +
        '<div style="font-size:0.7rem;color:var(--grey-light);margin-top:0.2rem;">' + escHtml(eventProject.name) + ' — ' + Math.round(eventProject.progress) + '%</div></div>';
    }
  } else {
    desc.textContent = event.desc;
  }

  choices.innerHTML = '';

  for (var i = 0; i < event.choices.length; i++) {
    var choice = event.choices[i];
    var btn = document.createElement('button');
    btn.className = 'btn btn-small';

    // Pre-calculate cost if this choice has a getCost function (e.g. donation)
    var choiceCost = null;
    if (choice.getCost) choiceCost = choice.getCost();

    var btnLabel = choice.text;
    if (choiceCost !== null) btnLabel += ' — $' + choiceCost.toLocaleString();
    btn.textContent = btnLabel;

    if (choice.requires && !choice.requires()) {
      btn.disabled = true;
      btn.classList.add('btn-secondary');
    } else {
      btn.classList.add(i === 0 ? 'btn-primary' : 'btn-secondary');
    }

    btn.onclick = (function(c, proj, preCalcCost) {
      return function() {
        modal.style.display = 'none';
        var resultMsg = c.effect(proj, preCalcCost);
        // Show confirmation of what happened
        if (resultMsg) {
          showActionConfirmation(resultMsg, 'info', function() {
            UI.renderAll();
          });
        } else {
          UI.renderAll();
        }
      };
    })(choice, eventProject, choiceCost);

    choices.appendChild(btn);
  }

  modal.style.display = 'flex';
}

function checkForDayEvent() {
  if (G.dayEventFired) return;

  var event = rollDayEvent();
  if (event) {
    G.dayEventFired = true;
    showDayEventModal(event);
  }
}
