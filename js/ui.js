/* ============================================
   ui.js — All DOM Updates & Rendering
   ============================================ */

var UI = {

  // --- Render Everything ---
  renderAll: function() {
    this.renderHeader();
    this.renderDashboard();
    this.renderProjects();
    this.renderTeam();
    this.renderMarket();
    this.renderShop();
    this.renderFooter();
    this.updateTimeOfDay();
  },

  // --- Header ---
  renderHeader: function() {
    document.getElementById('header-day').textContent = 'DAY ' + G.day;
    document.getElementById('header-clock').textContent = getTimeString();

    var cashEl = document.getElementById('header-cash');
    cashEl.textContent = '$' + G.cash.toLocaleString();
    if (G.cash < 100) {
      cashEl.classList.add('danger');
    } else {
      cashEl.classList.remove('danger');
    }

    // AP pips
    var apEl = document.getElementById('header-ap');
    var pips = '';
    for (var i = 0; i < G.apMax; i++) {
      pips += i < G.apCurrent ? '\u25CF' : '\u25CB';
    }
    apEl.textContent = pips;

    // Energy bar
    var pct = Math.round((G.energy / G.energyMax) * 100);
    var bar = document.getElementById('header-energy-bar');
    bar.style.width = pct + '%';
    bar.classList.remove('low', 'critical');
    if (pct < 25) {
      bar.classList.add('critical');
    } else if (pct < 50) {
      bar.classList.add('low');
    }
    document.getElementById('header-energy-text').textContent = G.energy;
  },

  // --- Dashboard Tab ---
  renderDashboard: function() {
    document.getElementById('status-stage').textContent = getStageName();
    document.getElementById('status-rep').textContent = G.reputation;
    document.getElementById('status-revenue').textContent = '$' + G.totalRevenue.toLocaleString();
    document.getElementById('status-team').textContent = G.team.length;

    // Active perks
    var perksEl = document.getElementById('status-perks');
    if (perksEl) {
      if (G.perks.length === 0) {
        perksEl.textContent = 'None';
      } else {
        perksEl.textContent = G.perks.map(function(p) {
          return p.name + (p.daysLeft ? ' (' + p.daysLeft + 'd)' : '');
        }).join(', ');
      }
    }

    // Actions
    var actionsContainer = document.getElementById('dashboard-actions');
    var actions = getDashboardActions();
    actionsContainer.innerHTML = '';

    if (actions.length === 0) {
      actionsContainer.innerHTML = '<div class="empty-state">No actions available. End the day to continue.</div>';
    }

    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      var btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.disabled = !a.enabled;
      btn.innerHTML =
        '<div>' +
          '<span class="action-name">' + escHtml(a.name) + '</span>' +
          '<span class="action-desc">' + escHtml(a.desc) + '</span>' +
        '</div>' +
        '<span class="action-cost">' + escHtml(a.cost) + '</span>';
      btn.onclick = a.action;
      actionsContainer.appendChild(btn);
    }

    this.renderLog();
    this.renderOvernightEvents();
  },

  // --- Log ---
  renderLog: function() {
    var container = document.getElementById('log-entries');
    container.innerHTML = '';
    var count = Math.min(G.log.length, 25);
    for (var i = 0; i < count; i++) {
      var entry = G.log[i];
      var div = document.createElement('div');
      div.className = 'log-entry log-' + entry.type;
      div.innerHTML = '<span class="log-time">' + escHtml(entry.time) + '</span>' + escHtml(entry.text);
      container.appendChild(div);
    }
  },

  // --- Overnight Events ---
  renderOvernightEvents: function() {
    var panel = document.getElementById('overnight-events');
    if (G.overnightEvents.length === 0) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    var html = '<h3>OVERNIGHT</h3>';
    for (var i = 0; i < G.overnightEvents.length; i++) {
      html += '<div class="event-item">' + escHtml(G.overnightEvents[i]) + '</div>';
    }
    panel.innerHTML = html;
  },

  // --- Projects Tab ---
  renderProjects: function() {
    var pipelineEl = document.getElementById('project-pipeline');
    var activeEl = document.getElementById('project-active');
    var completedEl = document.getElementById('project-completed');

    // Pipeline
    if (G.pipeline.length === 0) {
      pipelineEl.innerHTML = '<div class="empty-state">No leads in pipeline. Check back tomorrow.</div>';
    } else {
      pipelineEl.innerHTML = '';
      for (var i = 0; i < G.pipeline.length; i++) {
        pipelineEl.appendChild(this.createPipelineCard(G.pipeline[i]));
      }
    }

    // Active
    if (G.activeProjects.length === 0) {
      activeEl.innerHTML = '<div class="empty-state">No active projects. Accept a lead to start working.</div>';
    } else {
      activeEl.innerHTML = '';
      for (var j = 0; j < G.activeProjects.length; j++) {
        activeEl.appendChild(this.createActiveProjectCard(G.activeProjects[j]));
      }
    }

    // Completed
    if (G.completedProjects.length === 0) {
      completedEl.innerHTML = '<div class="empty-state">No completed projects yet.</div>';
    } else {
      completedEl.innerHTML = '';
      var showCount = Math.min(G.completedProjects.length, 5);
      for (var k = G.completedProjects.length - 1; k >= G.completedProjects.length - showCount; k--) {
        var cp = G.completedProjects[k];
        var div = document.createElement('div');
        div.className = 'project-card';
        div.innerHTML =
          '<div class="project-card-header">' +
            '<span class="project-name">' + escHtml(cp.name) + '</span>' +
            '<span class="project-payout">$' + cp.payout.toLocaleString() + '</span>' +
          '</div>' +
          '<div class="project-meta">' + escHtml(cp.client) + ' &mdash; Delivered</div>';
        completedEl.appendChild(div);
      }
    }
  },

  createPipelineCard: function(project) {
    var card = document.createElement('div');
    card.className = 'project-card';
    var complexLabel = project.complexity <= 1.5 ? 'Solo-able' : 'Needs team';

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(project.name) + '</span>' +
        '<span class="project-payout">$' + project.payout.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="project-meta">' +
        escHtml(project.client) + ' &mdash; ' +
        project.daysToComplete + ' days &mdash; ' + complexLabel +
      '</div>' +
      '<div class="project-expires">Expires in ' + project.expiresIn + ' day' + (project.expiresIn !== 1 ? 's' : '') + '</div>' +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');
    var btnAccept = document.createElement('button');
    btnAccept.className = 'btn btn-primary btn-small';
    btnAccept.textContent = 'ACCEPT (1 AP)';
    btnAccept.disabled = !canAct();
    btnAccept.onclick = function() { actionAcceptProject(project.id); };
    actionsDiv.appendChild(btnAccept);

    return card;
  },

  createActiveProjectCard: function(project) {
    var card = document.createElement('div');
    card.className = 'project-card';
    var canWork = project.complexity <= 1.5 && project.progress < 100;
    var daysLeft = project.daysToComplete - project.daysActive;
    var overdueClass = daysLeft <= 0 ? ' text-red' : '';

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(project.name) + '</span>' +
        '<span class="project-payout">$' + project.payout.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(project.client) +
        ' &mdash; <span class="' + overdueClass + '">Day ' + project.daysActive + '/' + project.daysToComplete + '</span></div>' +
      '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(project.progress) + '%"></div></div>' +
      '<div class="project-meta">' + Math.round(project.progress) + '% complete</div>' +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');

    if (canWork) {
      var btnWork = document.createElement('button');
      btnWork.className = 'btn btn-primary btn-small';
      btnWork.textContent = 'WORK (1 AP)';
      btnWork.disabled = !canAct();
      btnWork.onclick = function() { actionWorkProject(project.id); };
      actionsDiv.appendChild(btnWork);
    }

    // Client call for deadline extension (only if approaching/past deadline)
    if (daysLeft <= 2 && project.progress < 100) {
      var btnCall = document.createElement('button');
      btnCall.className = 'btn btn-secondary btn-small';
      btnCall.textContent = 'CALL (+2 DAYS)';
      btnCall.disabled = !canAct();
      btnCall.onclick = function() { actionClientCall(project.id); };
      actionsDiv.appendChild(btnCall);
    }

    return card;
  },

  // --- Team Tab ---
  renderTeam: function() {
    var rosterEl = document.getElementById('team-roster');
    var candidatesEl = document.getElementById('team-candidates');

    // Payroll info
    var payrollEl = document.getElementById('team-payroll-info');
    if (payrollEl) {
      if (G.team.length > 0) {
        var amount = getPayrollAmount();
        var daysUntil = G.nextPayrollDay - G.day;
        payrollEl.innerHTML = '<span class="payroll-label">Next payroll:</span> $' + amount.toLocaleString() +
          ' in ' + Math.max(0, daysUntil) + ' day(s)';
        payrollEl.style.display = 'block';
      } else {
        payrollEl.style.display = 'none';
      }
    }

    // Roster
    if (G.team.length === 0) {
      rosterEl.innerHTML = '<div class="empty-state">No employees yet. Post a job listing to start hiring.</div>';
    } else {
      rosterEl.innerHTML = '';
      for (var i = 0; i < G.team.length; i++) {
        rosterEl.appendChild(this.createEmployeeCard(G.team[i]));
      }
    }

    // Candidates
    if (G.candidates.length === 0) {
      var hint = G.jobPosted
        ? '<div class="empty-state">Job posted — candidates will apply tomorrow.</div>'
        : '<div class="empty-state">Post a job listing to attract candidates.' +
          (canPostJob() ? '' : ' (Cooldown: ' + daysUntilCanPost() + 'd)') + '</div>';
      candidatesEl.innerHTML = hint;
    } else {
      candidatesEl.innerHTML = '';
      for (var j = 0; j < G.candidates.length; j++) {
        candidatesEl.appendChild(this.createCandidateCard(G.candidates[j]));
      }
    }
  },

  createEmployeeCard: function(emp) {
    var card = document.createElement('div');
    card.className = 'project-card';

    var loyaltyColor = emp.loyalty > 50 ? 'text-green' : emp.loyalty > 25 ? 'text-amber' : 'text-red';
    var perkText = emp.perk ? '<div class="candidate-perk">' + escHtml(emp.perk.name) + ': ' + escHtml(emp.perk.desc) + '</div>' : '';
    var flawText = emp.flawRevealed && emp.flaw ? '<div class="candidate-flaw">' + escHtml(emp.flaw.name) + ': ' + escHtml(emp.flaw.desc) + '</div>' : '';

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(emp.name) + '</span>' +
        '<span class="candidate-role">' + escHtml(emp.levelName + ' ' + emp.role.name) + '</span>' +
      '</div>' +
      '<div class="skill-bars">' +
        this.skillBar('TEC', emp.technical, 5) +
        this.skillBar('COM', emp.communication, 5) +
        this.skillBar('REL', emp.reliability, 5) +
      '</div>' +
      '<div class="project-meta">Salary: $' + emp.salary + '/2wk &mdash; Loyalty: <span class="' + loyaltyColor + '">' + emp.loyalty + '</span> &mdash; ' + emp.daysEmployed + ' days</div>' +
      perkText + flawText +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');
    var btnFire = document.createElement('button');
    btnFire.className = 'btn btn-danger btn-small';
    btnFire.textContent = 'FIRE';
    btnFire.onclick = (function(id) { return function() { actionFire(id); UI.renderAll(); }; })(emp.id);
    actionsDiv.appendChild(btnFire);

    return card;
  },

  createCandidateCard: function(c) {
    var card = document.createElement('div');
    card.className = 'project-card';

    var skillsHtml = '';
    if (c.skillsRevealed === 0) {
      skillsHtml = '<div class="project-meta">Skills unknown — interview to reveal.</div>';
    } else if (c.skillsRevealed === 1) {
      skillsHtml = '<div class="skill-bars">' +
        this.skillBar('TEC', c.technical, 5) +
        this.skillBar('COM', '?', 5) +
        this.skillBar('REL', '?', 5) +
      '</div>';
    } else {
      skillsHtml = '<div class="skill-bars">' +
        this.skillBar('TEC', c.technical, 5) +
        this.skillBar('COM', c.communication, 5) +
        this.skillBar('REL', c.reliability, 5) +
      '</div>';
    }

    var perkHtml = '';
    if (c.skillsRevealed >= 2 && c.perk) {
      perkHtml = '<div class="candidate-perk">' + escHtml(c.perk.name) + ': ' + escHtml(c.perk.desc) + '</div>';
    } else if (c.skillsRevealed >= 2 && !c.perk) {
      perkHtml = '<div class="project-meta" style="color:var(--grey)">No special perks.</div>';
    }

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(c.name) + '</span>' +
        '<span class="candidate-role">' + escHtml(c.levelName + ' ' + c.role.name) + '</span>' +
      '</div>' +
      '<div class="project-meta">Asking: $' + c.salary + '/2wk</div>' +
      skillsHtml + perkHtml +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');

    if (c.skillsRevealed < 2) {
      var btnInt = document.createElement('button');
      btnInt.className = 'btn btn-secondary btn-small';
      btnInt.textContent = c.skillsRevealed === 0 ? 'INTERVIEW (1 AP)' : 'DEEP INTERVIEW (1 AP)';
      btnInt.disabled = !canAct();
      btnInt.onclick = (function(id) { return function() { actionInterview(id); }; })(c.id);
      actionsDiv.appendChild(btnInt);
    }

    var btnHire = document.createElement('button');
    btnHire.className = 'btn btn-primary btn-small';
    btnHire.textContent = 'HIRE (1 AP)';
    btnHire.disabled = !canAct();
    btnHire.onclick = (function(id) { return function() { actionHire(id); }; })(c.id);
    actionsDiv.appendChild(btnHire);

    return card;
  },

  skillBar: function(label, value, max) {
    if (value === '?') {
      return '<div class="skill-row"><span class="skill-label">' + label + '</span><span class="skill-dots">?????</span></div>';
    }
    var filled = '';
    for (var i = 0; i < max; i++) {
      filled += i < value ? '\u25A0' : '\u25A1';
    }
    return '<div class="skill-row"><span class="skill-label">' + label + '</span><span class="skill-dots">' + filled + '</span></div>';
  },

  // --- Market Tab ---
  renderMarket: function() {
    var chartEl = document.getElementById('market-chart');
    var newsEl = document.getElementById('market-news');
    var acqEl = document.getElementById('market-acquisitions');

    if (!G.competitors || G.competitors.length === 0) {
      chartEl.innerHTML = '<div class="empty-state">Market data not yet available.</div>';
      return;
    }

    var shares = getPlayerMarketShare();
    var total = shares.total;
    chartEl.innerHTML = '';

    // Player bar
    chartEl.appendChild(this.createMarketBar('You', shares.player, total, 'var(--green)', ''));

    // Competitor bars
    var alive = G.competitors.filter(function(c) { return c.alive; });
    alive.sort(function(a, b) { return b.share - a.share; });

    var barColors = {
      megacorp: 'var(--red)',
      vc_funded: 'var(--amber)',
      budget: 'var(--grey-light)',
      niche: 'var(--cyan)',
    };

    for (var i = 0; i < alive.length; i++) {
      var c = alive[i];
      chartEl.appendChild(this.createMarketBar(c.name, c.share, total, barColors[c.style] || 'var(--grey-light)', c.focus));
    }

    // Acquirable startups
    if (acqEl) {
      var acquirable = getAcquirableStartups();
      if (acquirable.length === 0) {
        acqEl.innerHTML = '<div class="empty-state">No startups available for acquisition.</div>';
      } else {
        acqEl.innerHTML = '';
        for (var j = 0; j < acquirable.length; j++) {
          acqEl.appendChild(this.createAcquisitionCard(acquirable[j]));
        }
      }
    }

    // Market news
    if (newsEl) {
      if (G.marketEvents.length === 0) {
        newsEl.innerHTML = '<div class="empty-state">No market news yet.</div>';
      } else {
        newsEl.innerHTML = '';
        var showCount = Math.min(G.marketEvents.length, 8);
        for (var k = G.marketEvents.length - 1; k >= G.marketEvents.length - showCount; k--) {
          var ev = G.marketEvents[k];
          var div = document.createElement('div');
          div.className = 'event-item';
          div.innerHTML = '<span class="log-time">Day ' + ev.day + '</span> ' + escHtml(ev.text);
          newsEl.appendChild(div);
        }
      }
    }
  },

  createMarketBar: function(name, share, total, color, subtitle) {
    var pct = Math.round((share / total) * 100);
    var div = document.createElement('div');
    div.className = 'market-bar-row';
    div.innerHTML =
      '<div class="market-bar-label">' +
        '<span class="market-bar-name">' + escHtml(name) + '</span>' +
        (subtitle ? '<span class="market-bar-focus">' + escHtml(subtitle) + '</span>' : '') +
        '<span class="market-bar-pct">' + pct + '%</span>' +
      '</div>' +
      '<div class="market-bar-track">' +
        '<div class="market-bar-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
      '</div>';
    return div;
  },

  createAcquisitionCard: function(comp) {
    var cost = getAcquisitionCost(comp);
    var card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(comp.name) + '</span>' +
        '<span class="project-payout">$' + cost.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(comp.desc) + '</div>' +
      '<div class="project-meta">Focus: ' + escHtml(comp.focus) + ' &mdash; Market share: ' + comp.share + '</div>' +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');
    var btnAcq = document.createElement('button');
    btnAcq.className = 'btn btn-primary btn-small';
    btnAcq.textContent = 'ACQUIRE (1 AP, $' + cost.toLocaleString() + ')';
    btnAcq.disabled = !canAct() || G.cash < cost;
    btnAcq.onclick = (function(id) { return function() { actionAcquire(id); }; })(comp.id);
    actionsDiv.appendChild(btnAcq);

    return card;
  },

  // --- Shop Tab ---
  renderShop: function() {
    var foodEl = document.getElementById('shop-food');
    foodEl.innerHTML = '';

    for (var i = 0; i < FOOD_ITEMS.length; i++) {
      var item = FOOD_ITEMS[i];
      var btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.disabled = !canAct() || G.cash < item.cost;
      btn.innerHTML =
        '<div>' +
          '<span class="action-name">' + escHtml(item.name) + '</span>' +
          '<span class="action-desc">' + escHtml(item.desc) + '</span>' +
        '</div>' +
        '<span class="action-cost">$' + item.cost + ' &middot; 1 AP</span>';
      btn.onclick = (function(id) {
        return function() { actionOrderFood(id); };
      })(item.id);
      foodEl.appendChild(btn);
    }

    // Upgrades
    var upgradesEl = document.getElementById('shop-upgrades');
    upgradesEl.innerHTML = '';

    var UPGRADES = [
      { id: 'coffee_machine', name: 'Coffee Machine',   cost: 200,  desc: '+10 energy every morning', oneTime: true },
      { id: 'standing_desk',  name: 'Standing Desk',    cost: 400,  desc: '+1 AP per day (5 total)',  oneTime: true },
      { id: 'second_monitor', name: 'Second Monitor',   cost: 350,  desc: 'Founder work is 20% faster', oneTime: true },
      { id: 'office_perks',   name: 'Office Perks',     cost: 600,  desc: '+15 loyalty for all staff', oneTime: true },
    ];

    for (var j = 0; j < UPGRADES.length; j++) {
      var u = UPGRADES[j];
      var owned = G.upgrades.indexOf(u.id) !== -1;
      var btn2 = document.createElement('button');
      btn2.className = 'action-btn';
      btn2.disabled = owned || G.cash < u.cost;
      btn2.innerHTML =
        '<div>' +
          '<span class="action-name">' + escHtml(u.name) + (owned ? ' [OWNED]' : '') + '</span>' +
          '<span class="action-desc">' + escHtml(u.desc) + '</span>' +
        '</div>' +
        '<span class="action-cost">$' + u.cost + '</span>';

      if (!owned) {
        btn2.onclick = (function(upgrade) {
          return function() {
            if (G.cash < upgrade.cost) return;
            G.cash -= upgrade.cost;
            G.upgrades.push(upgrade.id);
            addLog('Purchased: ' + upgrade.name + '!', 'good');
            // Apply immediate effects
            if (upgrade.id === 'office_perks') {
              for (var k = 0; k < G.team.length; k++) {
                G.team[k].loyalty = Math.min(100, G.team[k].loyalty + 15);
              }
            }
            UI.renderAll();
          };
        })(u);
      }
      upgradesEl.appendChild(btn2);
    }
  },

  // --- Time of Day Background ---
  updateTimeOfDay: function() {
    var tod = getTimeOfDay();
    document.body.className = 'time-' + tod;
  },

  // --- End Day Button ---
  renderFooter: function() {
    var btn = document.getElementById('btn-end-day');
    if (G.pushedThroughTonight) {
      btn.textContent = 'CRASH OUT & END DAY';
      btn.classList.add('pushed');
    } else {
      btn.textContent = 'SLEEP & END DAY';
      btn.classList.remove('pushed');
    }
  },

  // --- Tab Switching ---
  switchTab: function(tabName) {
    var tabs = document.querySelectorAll('.tab');
    var contents = document.querySelectorAll('.tab-content');

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
      if (tabs[i].getAttribute('data-tab') === tabName) {
        tabs[i].classList.add('active');
      }
    }

    for (var j = 0; j < contents.length; j++) {
      contents[j].classList.remove('active');
    }
    var target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');
  },
};

// --- HTML Escaping ---
function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
