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
      { text: 'Accept upsell (+25% payout, -15% progress)', effect: function(project) {
        if (!project) project = randomChoice(G.activeProjects);
        var upsellAmount = Math.max(200, Math.min(5000, Math.round(project.payout * 0.25)));
        project.payout += upsellAmount;
        project.progress = Math.max(0, project.progress - 15);
        addLog('Upsold ' + project.client + ' on ' + project.name + '. +$' + upsellAmount + ' but scope expanded.', 'good');
        return 'Upsold ' + project.client + ' on ' + project.name + '. +$' + upsellAmount + ' but -15% progress.';
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
      var stageMults = { freelancer: 1, home_office: 2.5, startup: 5, seed_stage: 10, series_a: 20, growth: 40, enterprise: 60, leader: 80 };
      var mult = stageMults[G.stage] || 1;
      var large = Math.round(randomInt(100, 250) * mult / 50) * 50;
      var small = Math.round(randomInt(30, 80) * mult / 50) * 50;
      return { large: large, small: small };
    },
    choices: [
      { text: 'Large donation (+3 rep)', getCost: function() {
        var stageMults = { freelancer: 1, home_office: 2.5, startup: 5, seed_stage: 10, series_a: 20, growth: 40, enterprise: 60, leader: 80 };
        var mult = stageMults[G.stage] || 1;
        return Math.round(randomInt(100, 250) * mult / 50) * 50;
      }, effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 2.5, startup: 5, seed_stage: 10, series_a: 20, growth: 40, enterprise: 60, leader: 80 };
          var mult = stageMults[G.stage] || 1;
          cost = Math.round(randomInt(100, 250) * mult / 50) * 50;
        }
        G.cash -= cost;
        G.reputation += 3;
        addLog('Donated $' + cost.toLocaleString() + ' to local tech community. +3 rep.', 'good');
        return 'Donated $' + cost.toLocaleString() + ' to local tech community. +3 rep.';
      }, requires: function() { return G.cash >= 100; } },
      { text: 'Small contribution (+1 rep)', getCost: function() {
        var stageMults = { freelancer: 1, home_office: 2.5, startup: 5, seed_stage: 10, series_a: 20, growth: 40, enterprise: 60, leader: 80 };
        var mult = stageMults[G.stage] || 1;
        return Math.round(randomInt(30, 80) * mult / 50) * 50;
      }, effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 2.5, startup: 5, seed_stage: 10, series_a: 20, growth: 40, enterprise: 60, leader: 80 };
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
    condition: function() {
      if (G.cash < 500) return false;
      var daysUntilPayroll = G.nextPayrollDay - G.day;
      return daysUntilPayroll > 1;
    },
    weight: 2,
    getBillAmount: function() {
      var stageMults = { freelancer: 1, home_office: 1.5, startup: 3, seed_stage: 5, series_a: 8, growth: 15, enterprise: 22, leader: 30 };
      var mult = stageMults[G.stage] || 1;
      return Math.round(randomInt(200, 600) * mult / 50) * 50;
    },
    choices: [
      { text: 'Pay it (no drama)', getCost: function() {
        var stageMults = { freelancer: 1, home_office: 1.5, startup: 3, seed_stage: 5, series_a: 8, growth: 15, enterprise: 22, leader: 30 };
        var mult = stageMults[G.stage] || 1;
        return Math.round(randomInt(200, 600) * mult / 50) * 50;
      }, effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 1.5, startup: 3, seed_stage: 5, series_a: 8, growth: 15, enterprise: 22, leader: 30 };
          var mult = stageMults[G.stage] || 1;
          cost = Math.round(randomInt(200, 600) * mult / 50) * 50;
        }
        G.cash -= cost;
        addLog('Paid the unexpected bill. -$' + cost.toLocaleString() + '.', 'warn');
        return 'Paid the bill. -$' + cost.toLocaleString() + '. Business as usual.';
      }, requires: function() { return G.cash >= 200; } },
      { text: 'Contest it (30% chance to avoid, else pay + $200 penalty)', effect: function(project, cost) {
        if (!cost) {
          var stageMults = { freelancer: 1, home_office: 1.5, startup: 3, seed_stage: 5, series_a: 8, growth: 15, enterprise: 22, leader: 30 };
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
  // --- v0.09 additions ---
  {
    id: 'tech_conference',
    name: 'Tech Conference Invite',
    desc: 'You\'ve been invited to speak at a local tech conference. Great networking opportunity.',
    condition: function() { return G.reputation >= 10 && G.day >= 5; },
    weight: 2,
    choices: [
      { text: 'Attend & speak (1 AP, +5 rep, +1 lead)', effect: function() {
        if (canAct()) {
          spendAP(1);
          G.reputation += 5;
          if (G.pipeline.length < 5) G.pipeline.push(generateProject());
          addLog('Great conference talk! +5 rep, new lead.', 'good');
          return 'Conference was a hit! +5 rep and a new lead from the audience.';
        }
        return 'No AP for the conference.';
      }, requires: function() { return canAct(); } },
      { text: 'Skip it — too busy', effect: function() {
        addLog('Skipped the conference.', 'info');
        return 'Skipped the conference. Back to work.';
      } },
    ]
  },
  {
    id: 'office_break_in',
    name: 'Office Break-In',
    desc: 'Someone broke into your workspace overnight. Equipment is missing.',
    condition: function() { return G.cash >= 500 && G.day >= 8; },
    weight: 1,
    choices: [
      { text: 'Replace equipment (-$500)', effect: function() {
        G.cash -= 500;
        addLog('Replaced stolen equipment. -$500.', 'bad');
        return 'Replaced the stolen equipment. -$500. Time to get better locks.';
      }, requires: function() { return G.cash >= 500; } },
      { text: 'File insurance claim (30% chance full recovery)', effect: function() {
        if (Math.random() < 0.3) {
          addLog('Insurance claim approved! No loss.', 'good');
          return 'Insurance covered everything! No out-of-pocket cost.';
        } else {
          G.cash -= 500;
          addLog('Insurance denied. Had to pay out of pocket. -$500.', 'bad');
          return 'Insurance denied the claim. Had to replace equipment anyway. -$500.';
        }
      } },
    ]
  },
  {
    id: 'client_referral',
    name: 'Client Referral',
    desc: 'A satisfied past client is recommending you to their network.',
    condition: function() { return G.completedProjects.length > 2; },
    weight: 2,
    choices: [
      { text: 'Accept referrals (+3 rep, +2 leads)', effect: function() {
        G.reputation += 3;
        for (var i = 0; i < 2; i++) { if (G.pipeline.length < 5) G.pipeline.push(generateProject()); }
        addLog('Client referral brought in new leads! +3 rep.', 'good');
        return 'Word of mouth is powerful! +3 rep and 2 new leads.';
      } },
      { text: 'Send a thank-you note (+1 rep)', effect: function() {
        G.reputation += 1;
        addLog('Sent a thank-you note. +1 rep.', 'info');
        return 'Appreciated the referral. +1 rep.';
      } },
    ]
  },
  {
    id: 'team_hackathon',
    name: 'Team Hackathon Proposal',
    desc: 'Your team wants to do an internal hackathon. It would boost skills but take the whole day.',
    condition: function() { return G.team.length >= 2; },
    weight: 2,
    choices: [
      { text: 'Run the hackathon (2 AP, all team +1 TEC)', effect: function() {
        if (canAct(2)) {
          spendAP(2);
          for (var i = 0; i < G.team.length; i++) {
            G.team[i].technical = Math.min(10, G.team[i].technical + 1);
          }
          addLog('Hackathon was a blast! All team members +1 TEC.', 'good');
          return 'Hackathon complete! Everyone learned something new. All team +1 Technical.';
        }
        return 'Not enough AP for the hackathon.';
      }, requires: function() { return canAct(2); } },
      { text: 'Not today — too much work', effect: function() {
        for (var i = 0; i < G.team.length; i++) {
          G.team[i].loyalty = Math.max(0, G.team[i].loyalty - 3);
        }
        addLog('Team is disappointed about the cancelled hackathon. -3 loyalty.', 'warn');
        return 'Team was looking forward to it. Slight morale hit. -3 loyalty all.';
      } },
    ]
  },
  {
    id: 'influencer_collab',
    name: 'Influencer Collaboration',
    desc: 'A tech influencer offers to feature your company in their next video.',
    condition: function() { return G.cash >= 300 && G.reputation >= 5; },
    weight: 2,
    choices: [
      { text: 'Sponsor the video (-$300, +8 rep)', effect: function() {
        G.cash -= 300;
        G.reputation += 8;
        addLog('Influencer collaboration! -$300, +8 rep.', 'good');
        return 'Great exposure from the influencer video. -$300, +8 rep.';
      }, requires: function() { return G.cash >= 300; } },
      { text: 'Decline — too expensive', effect: function() {
        addLog('Declined the influencer collab.', 'info');
        return 'Passed on the influencer deal. Maybe next time.';
      } },
    ]
  },
  {
    id: 'government_grant',
    name: 'Government Tech Grant',
    desc: 'A government technology innovation grant is accepting applications.',
    condition: function() { return G.day >= 10 && G.reputation >= 15; },
    weight: 1,
    choices: [
      { text: 'Apply for the grant (1 AP, 40% chance +$2000)', effect: function() {
        if (canAct()) {
          spendAP(1);
          if (Math.random() < 0.4) {
            G.cash += 2000;
            addLog('Grant approved! +$2,000 funding.', 'good');
            return 'Your application was successful! +$2,000 in grant funding.';
          } else {
            addLog('Grant application rejected. Better luck next time.', 'info');
            return 'Application rejected. The competition was stiff.';
          }
        }
        return 'No AP to fill out the application.';
      }, requires: function() { return canAct(); } },
      { text: 'Skip — not worth the hassle', effect: function() {
        addLog('Skipped the grant application.', 'info');
        return 'Passed on the grant. Too much paperwork.';
      } },
    ]
  },
  {
    id: 'competitor_talent',
    name: 'Competitor Talent Available',
    desc: 'A competitor just laid off staff. Their former employees are looking for work.',
    condition: function() {
      return G.competitors && G.competitors.some(function(c) { return !c.alive; }) && G.stage !== 'freelancer';
    },
    weight: 1,
    choices: [
      { text: 'Fast-track a hire (1 AP, discounted candidate)', effect: function() {
        if (canAct()) {
          spendAP(1);
          var c = generateCandidate();
          c.askingSalary = Math.round(c.askingSalary * 0.75 / 25) * 25;
          c.salary = c.askingSalary;
          c.skillsRevealed = 1;
          G.candidates.push(c);
          addLog('Scooped up ' + c.name + ' from a failed competitor! They\'re asking 25% less.', 'good');
          return c.name + ' joined the candidate pool at a 25% salary discount!';
        }
        return 'No AP to recruit.';
      }, requires: function() { return canAct(); } },
      { text: 'Pass', effect: function() {
        addLog('Let the opportunity pass.', 'info');
        return 'Decided not to pursue competitor talent.';
      } },
    ]
  },
  {
    id: 'product_idea',
    name: 'Flash of Inspiration',
    desc: 'A brilliant product idea strikes you in the middle of the night!',
    condition: function() {
      var productStages = ['startup', 'seed_stage', 'series_a', 'growth', 'enterprise', 'leader'];
      if (productStages.indexOf(G.stage) === -1) return false;
      return G.ownedProducts && G.ownedProducts.some(function(p) { return p.status === 'greenlight'; });
    },
    weight: 1,
    choices: [
      { text: 'Channel the inspiration (+3 AP toward greenlight)', effect: function() {
        var glProduct = null;
        for (var i = 0; i < G.ownedProducts.length; i++) {
          if (G.ownedProducts[i].status === 'greenlight') { glProduct = G.ownedProducts[i]; break; }
        }
        if (glProduct) {
          glProduct.apInvested = Math.min(glProduct.apRequired, (glProduct.apInvested || 0) + 3);
          if (glProduct.apInvested >= glProduct.apRequired) {
            glProduct.status = 'building';
            addLog('Inspiration greenlighted "' + glProduct.name + '"! Development begins.', 'good');
            return 'Your inspiration pushed "' + glProduct.name + '" through greenlight! Development can begin.';
          }
          addLog('Inspiration advanced "' + glProduct.name + '" greenlight by +3 AP.', 'good');
          return 'Channeled your inspiration into "' + glProduct.name + '". +3 AP toward greenlight.';
        }
        return 'The idea faded before you could act on it.';
      } },
      { text: 'Write it down for later', effect: function() {
        addLog('Wrote down the idea for later.', 'info');
        return 'Noted the idea. Maybe you\'ll revisit it.';
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
        // Store poach notification for morning popup
        G._poachNotification = {
          name: victim.name,
          role: victim.role.name,
          technical: victim.technical,
          communication: victim.communication,
          reliability: victim.reliability,
          loyalty: Math.round(victim.loyalty),
          salary: victim.salary,
        };
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
  // --- v0.09 additions ---
  {
    id: 'stock_market_bump',
    name: 'Market Tailwind',
    condition: function() { return G.day >= 7; },
    weight: 2,
    effect: function() {
      var bonus = randomInt(100, 400);
      G.cash += bonus;
      return 'Strong market conditions boosted client spending. +$' + bonus + '.';
    }
  },
  {
    id: 'open_source_mention',
    name: 'Open Source Shoutout',
    condition: function() { return G.reputation >= 10; },
    weight: 2,
    effect: function() {
      var rep = randomInt(2, 5);
      G.reputation += rep;
      if (G.pipeline.length < 5) G.pipeline.push(generateProject());
      return 'Your open source work got a shoutout on social media! +' + rep + ' rep, +1 lead.';
    }
  },
  {
    id: 'infrastructure_cost',
    name: 'Infrastructure Bill',
    condition: function() { return G.activeProjects.length > 0 && G.cash >= 200; },
    weight: 2,
    effect: function() {
      var cost = randomInt(100, 300) + (G.activeProjects.length * 50);
      G.cash -= cost;
      return 'Server and tooling costs came due. -$' + cost + '.';
    }
  },
  {
    id: 'team_achievement',
    name: 'Team Achievement',
    condition: function() { return G.team.length >= 2; },
    weight: 2,
    effect: function() {
      var emp = randomChoice(G.team);
      emp.technical = Math.min(10, emp.technical + 1);
      emp.loyalty = Math.min(100, emp.loyalty + 5);
      return emp.name + ' completed an online course overnight! +1 TEC, +5 loyalty.';
    }
  },
  {
    id: 'industry_trend',
    name: 'Industry Trend',
    condition: function() { return G.day >= 14; },
    weight: 2,
    effect: function() {
      var trends = [
        'AI-powered tools are in high demand.',
        'Remote work is driving cloud services growth.',
        'Cybersecurity spending is surging.',
        'No-code platforms are disrupting the market.',
        'Enterprise clients are consolidating vendors.',
        'Startups are pivoting to subscription models.',
      ];
      var trend = randomChoice(trends);
      G.reputation += 1;
      return 'Industry trend: ' + trend + ' +1 rep for staying relevant.';
    }
  },
  {
    id: 'client_testimonial',
    name: 'Client Testimonial',
    condition: function() { return G.completedProjects.length >= 3; },
    weight: 2,
    effect: function() {
      var rep = randomInt(3, 6);
      G.reputation += rep;
      var past = G.completedProjects[Math.floor(Math.random() * G.completedProjects.length)];
      return (past ? past.client : 'A past client') + ' published a glowing testimonial. +' + rep + ' rep.';
    }
  },
  // v0.16: Late night gaming
  {
    id: 'late_night_gaming',
    name: 'Late Night Gaming',
    condition: function() { return G.day >= 5; },
    weight: 1,
    effect: function() {
      G._lateNightGaming = true;
      return 'You stayed up way too late gaming. Energy recovery will be reduced tomorrow.';
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
