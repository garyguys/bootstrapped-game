/* ============================================
   ui.js — All DOM Updates & Rendering
   People cards, pixel art avatars, fog of war,
   team assignment, patience bar, management dash.
   ============================================ */

var UI = {

  renderAll: function() {
    this.renderHeader();
    this.renderDashboard();
    this.renderProjects();
    this.renderTeam();
    this.renderMarket();
    this.renderShop();
    this.renderHelp();
    this.renderFooter();
    this.updateTimeOfDay();
  },

  // --- Header ---
  renderHeader: function() {
    document.getElementById('header-day').textContent = 'DAY ' + G.day;
    document.getElementById('header-clock').textContent = getTimeString();

    // Company name
    var compEl = document.getElementById('header-company');
    if (compEl && G.player) compEl.textContent = G.player.companyName;

    var cashEl = document.getElementById('header-cash');
    cashEl.textContent = '$' + G.cash.toLocaleString();
    if (G.cash < 100) cashEl.classList.add('danger');
    else cashEl.classList.remove('danger');

    var apEl = document.getElementById('header-ap');
    var pips = '';
    for (var i = 0; i < G.apMax; i++) {
      pips += i < G.apCurrent ? '\u25CF' : '\u25CB';
    }
    apEl.textContent = pips;

    var pct = Math.round((G.energy / G.energyMax) * 100);
    var bar = document.getElementById('header-energy-bar');
    bar.style.width = pct + '%';
    bar.classList.remove('low', 'critical');
    if (pct < 25) bar.classList.add('critical');
    else if (pct < 50) bar.classList.add('low');
    document.getElementById('header-energy-text').textContent = G.energy;
  },

  // --- Dashboard Tab ---
  renderDashboard: function() {
    document.getElementById('status-stage').textContent = getStageName();
    document.getElementById('status-rep').textContent = G.reputation;
    document.getElementById('status-revenue').textContent = '$' + G.totalRevenue.toLocaleString();
    document.getElementById('status-team').textContent = G.team.length;

    // Player skills
    var playerSkillsEl = document.getElementById('status-player-skills');
    if (playerSkillsEl && G.player) {
      playerSkillsEl.innerHTML =
        this.skillBar('TEC', G.player.technical, 10) +
        this.skillBar('COM', G.player.communication, 10) +
        this.skillBar('REL', G.player.reliability, 10);
    }

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

    var energyStatusEl = document.getElementById('status-energy');
    if (energyStatusEl) {
      var status = getEnergyStatus();
      var statusLabels = { fresh: 'Fresh', ok: 'OK', tired: 'Tired', exhausted: 'Exhausted' };
      var statusColors = { fresh: 'text-green', ok: 'text-cyan', tired: 'text-amber', exhausted: 'text-red' };
      energyStatusEl.textContent = statusLabels[status];
      energyStatusEl.className = 'status-value ' + statusColors[status];
    }

    var opsBonus = Math.min(2, Math.floor(getOpsTeamCount() / 2));
    var opsEl = document.getElementById('status-ops-bonus');
    if (opsEl) {
      opsEl.textContent = opsBonus > 0 ? '+' + opsBonus + ' AP from ops team' : 'Hire PM/Sales/Marketing for +AP';
    }

    // Actions (management focused)
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

  // --- Log with Day Separators ---
  renderLog: function() {
    var container = document.getElementById('log-entries');
    container.innerHTML = '';
    var count = Math.min(G.log.length, 30);
    var lastDay = -1;

    for (var i = 0; i < count; i++) {
      var entry = G.log[i];

      if (entry.day !== lastDay) {
        var separator = document.createElement('div');
        separator.className = 'log-day-separator';
        separator.textContent = '\u2014 Day ' + entry.day + ' \u2014';
        container.appendChild(separator);
        lastDay = entry.day;
      }

      var div = document.createElement('div');
      div.className = 'log-entry log-' + entry.type;
      div.innerHTML = '<span class="log-time">' + escHtml(entry.time) + '</span>' + escHtml(entry.text);
      container.appendChild(div);
    }
  },

  // --- Overnight Events (only from last night) ---
  renderOvernightEvents: function() {
    var panel = document.getElementById('overnight-events');
    if (G.overnightEvents.length === 0) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    var html = '<h3>OVERNIGHT \u2014 Day ' + (G.day - 1) + ' to Day ' + G.day + '</h3>';
    for (var i = 0; i < G.overnightEvents.length; i++) {
      html += '<div class="event-item">' + escHtml(G.overnightEvents[i]) + '</div>';
    }
    html += '<button class="btn btn-small btn-secondary overnight-dismiss" onclick="G.overnightEvents=[];UI.renderOvernightEvents();">DISMISS</button>';
    panel.innerHTML = html;
  },

  // --- Projects Tab ---
  renderProjects: function() {
    var pipelineEl = document.getElementById('project-pipeline');
    var activeEl = document.getElementById('project-active');
    var completedEl = document.getElementById('project-completed');
    this.renderOwnProducts();

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
      activeEl.innerHTML = '<div class="empty-state">No active projects.</div>';
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

    var reqParts = [];
    if (project.minTeam > 0) reqParts.push(project.minTeam + '+ team');
    if (project.requiredRole) {
      var roleName = project.requiredRole.charAt(0).toUpperCase() + project.requiredRole.slice(1);
      reqParts.push('Needs ' + roleName);
    }
    var reqText = reqParts.length > 0 ? '<div class="project-requirements">' + reqParts.join(' | ') + '</div>' : '';

    var check = canAcceptProject(project);

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(project.name) + '</span>' +
        '<span class="project-payout">$' + project.payout.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(project.client) + ' &mdash; ' + project.daysToComplete + ' days &mdash; ' + complexLabel + '</div>' +
      reqText +
      '<div class="project-expires">Expires in ' + project.expiresIn + ' day' + (project.expiresIn !== 1 ? 's' : '') + '</div>' +
      (check.ok ? '' : '<div class="project-lock-reason">' + escHtml(check.reason) + '</div>') +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');
    var btnAccept = document.createElement('button');
    btnAccept.className = 'btn btn-primary btn-small';
    btnAccept.textContent = 'ACCEPT (' + AP_COSTS.accept_project + ' AP)';
    btnAccept.disabled = !canAct(AP_COSTS.accept_project) || !check.ok;
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

    var reqInfo = '';
    if (project.requiredRole) {
      var roleName = project.requiredRole.charAt(0).toUpperCase() + project.requiredRole.slice(1);
      reqInfo = '<div class="project-requirements">Spec: ' + roleName + '</div>';
    }

    // Show assigned team members
    var assignedHtml = '';
    if (project.assignedTeam && project.assignedTeam.length > 0) {
      var assignedNames = [];
      for (var t = 0; t < project.assignedTeam.length; t++) {
        var emp = findEmployee(project.assignedTeam[t]);
        if (emp) assignedNames.push(emp.name);
      }
      if (assignedNames.length > 0) {
        assignedHtml = '<div class="project-assigned">Team: ' + escHtml(assignedNames.join(', ')) + '</div>';
      }
    }

    // Deadline extension warning
    var extWarning = '';
    if (project.deadlineExtensions && project.deadlineExtensions > 0) {
      extWarning = '<div class="project-ext-warn">Extended ' + project.deadlineExtensions + 'x (-rep)</div>';
    }

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(project.name) + '</span>' +
        '<span class="project-payout">$' + project.payout.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(project.client) +
        ' &mdash; <span class="' + overdueClass + '">Day ' + project.daysActive + '/' + project.daysToComplete + '</span></div>' +
      reqInfo + assignedHtml + extWarning +
      '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(project.progress) + '%"></div></div>' +
      '<div class="project-meta">' + Math.round(project.progress) + '% complete</div>' +
      '<div class="project-actions-row"></div>' +
      '<div class="project-actions-dropdown" style="display:none;"></div>';

    var actionsRow = card.querySelector('.project-actions-row');
    var actionsDropdown = card.querySelector('.project-actions-dropdown');

    // Build action list
    var hasActions = false;

    if (canWork) hasActions = true;
    if (daysLeft <= 2 && project.progress < 100) hasActions = true;
    if (G.team.length > 0) hasActions = true;

    if (hasActions) {
      var btnActions = document.createElement('button');
      btnActions.className = 'btn btn-secondary btn-small';
      btnActions.textContent = '> ACTIONS';
      btnActions.onclick = function(e) {
        e.stopPropagation();
        var dd = card.querySelector('.project-actions-dropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
      };
      actionsRow.appendChild(btnActions);
    }

    // Populate dropdown items
    if (canWork) {
      var btnWork = document.createElement('button');
      btnWork.className = 'btn btn-primary btn-small';
      btnWork.textContent = 'WORK MYSELF (' + AP_COSTS.work_project + ' AP)';
      btnWork.disabled = !canAct(AP_COSTS.work_project);
      btnWork.onclick = function(e) { e.stopPropagation(); actionWorkProject(project.id); };
      actionsDropdown.appendChild(btnWork);
    }

    if (daysLeft <= 2 && project.progress < 100) {
      var repCost = Math.min(5, ((project.deadlineExtensions || 0) + 1) * 2);
      var btnCall = document.createElement('button');
      btnCall.className = 'btn btn-secondary btn-small';
      btnCall.textContent = 'EXTEND DEADLINE (+2d, -' + repCost + ' rep)';
      btnCall.disabled = !canAct(AP_COSTS.client_call);
      btnCall.onclick = function(e) { e.stopPropagation(); actionClientCall(project.id); };
      actionsDropdown.appendChild(btnCall);
    }

    if (G.team.length > 0) {
      var btnAssign = document.createElement('button');
      btnAssign.className = 'btn btn-secondary btn-small';
      btnAssign.textContent = 'ASSIGN TEAM MEMBERS';
      btnAssign.onclick = (function(proj) {
        return function(e) { e.stopPropagation(); UI.showAssignModal(proj); };
      })(project);
      actionsDropdown.appendChild(btnAssign);
    }

    return card;
  },

  // --- Team Assignment Modal ---
  showAssignModal: function(project) {
    var modal = document.getElementById('event-modal');
    var title = document.getElementById('event-modal-title');
    var desc = document.getElementById('event-modal-desc');
    var choices = document.getElementById('event-modal-choices');

    title.textContent = 'ASSIGN TEAM TO ' + project.name;
    desc.textContent = 'Select team members to work on this project. Only developers, designers, and devops contribute to progress.';
    choices.innerHTML = '';

    var devRoles = ['developer', 'designer', 'devops'];

    for (var i = 0; i < G.team.length; i++) {
      var emp = G.team[i];
      if (devRoles.indexOf(emp.role.id) === -1) continue;

      var isAssigned = project.assignedTeam && project.assignedTeam.indexOf(emp.id) !== -1;
      var btn = document.createElement('button');
      btn.className = 'btn btn-small ' + (isAssigned ? 'btn-primary' : 'btn-secondary');
      btn.textContent = (isAssigned ? '[X] ' : '[ ] ') + emp.name + ' (TEC:' + emp.technical + ')';
      btn.onclick = (function(empId, projId, assigned) {
        return function() {
          if (assigned) {
            unassignFromProject(empId);
          } else {
            assignToProject(empId, projId);
          }
          UI.showAssignModal(project); // Refresh
        };
      })(emp.id, project.id, isAssigned);
      choices.appendChild(btn);
    }

    var btnDone = document.createElement('button');
    btnDone.className = 'btn btn-small btn-danger';
    btnDone.textContent = 'DONE';
    btnDone.onclick = function() {
      modal.style.display = 'none';
      UI.renderAll();
    };
    choices.appendChild(btnDone);

    modal.style.display = 'flex';
  },

  // --- Team Tab ---
  renderTeam: function() {
    var rosterEl = document.getElementById('team-roster');
    var candidatesEl = document.getElementById('team-candidates');

    var payrollEl = document.getElementById('team-payroll-info');
    if (payrollEl) {
      if (G.team.length > 0) {
        var amount = getPayrollAmount();
        var daysUntil = G.nextPayrollDay - G.day;
        payrollEl.innerHTML = '<span class="payroll-label">Weekly payroll:</span> $' + amount.toLocaleString() +
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

    // Candidates (filter out poached candidates being negotiated directly)
    var visibleCandidates = G.candidates.filter(function(c) { return !c.isBeingPoached; });
    if (visibleCandidates.length === 0) {
      var hint = G.jobPosted
        ? '<div class="empty-state">Job posted \u2014 candidates will apply tomorrow.</div>'
        : '<div class="empty-state">Post a job listing to attract candidates.' +
          (canPostJob() ? '' : ' (Cooldown: ' + daysUntilCanPost() + 'd)') + '</div>';
      candidatesEl.innerHTML = hint;
    } else {
      candidatesEl.innerHTML = '';
      for (var j = 0; j < visibleCandidates.length; j++) {
        candidatesEl.appendChild(this.createCandidateCard(visibleCandidates[j]));
      }
    }
  },

  createEmployeeCard: function(emp) {
    var card = document.createElement('div');
    card.className = 'project-card person-card';
    card.style.cursor = 'pointer';

    var loyaltyColor = emp.loyalty > 50 ? 'text-green' : emp.loyalty > 25 ? 'text-amber' : 'text-red';
    var perkText = emp.perk ? '<div class="candidate-perk">' + escHtml(emp.perk.name) + ': ' + escHtml(emp.perk.desc) + '</div>' : '';
    var flawText = emp.flawRevealed && emp.flaw ? '<div class="candidate-flaw">' + escHtml(emp.flaw.name) + ': ' + escHtml(emp.flaw.desc) + '</div>' : '';

    // Assignment info
    var assignInfo = '';
    if (emp.assignedProjectId) {
      for (var p = 0; p < G.activeProjects.length; p++) {
        if (G.activeProjects[p].id === emp.assignedProjectId) {
          assignInfo = '<div class="project-requirements">Working on: ' + escHtml(G.activeProjects[p].name) + '</div>';
          break;
        }
      }
    }

    // Summary view (collapsed)
    var summaryHtml =
      '<div class="person-summary">' +
        '<div class="person-avatar-slot" data-person-id="' + emp.id + '"></div>' +
        '<div class="person-info">' +
          '<div class="project-card-header">' +
            '<span class="project-name">' + escHtml(emp.name) + '</span>' +
            '<span class="candidate-role">' + escHtml(emp.levelName + ' ' + emp.role.name) + '</span>' +
          '</div>' +
          '<div class="skill-bars">' +
            this.skillBar('TEC', emp.technical, 10) +
            this.skillBar('COM', emp.communication, 10) +
            this.skillBar('REL', emp.reliability, 10) +
          '</div>' +
          '<div class="project-meta">$' + emp.salary + '/wk &mdash; Loyalty: <span class="' + loyaltyColor + '">' + Math.round(emp.loyalty) + '</span> &mdash; ' + emp.daysEmployed + 'd</div>' +
        '</div>' +
      '</div>';

    // Detail view (expanded)
    var detailHtml =
      '<div class="person-detail hidden">' +
        perkText + flawText + assignInfo +
        this.renderWorkHistory(emp) +
        '<div class="project-actions"></div>' +
      '</div>';

    card.innerHTML = summaryHtml + detailHtml;

    // Toggle expand on click
    card.onclick = function(e) {
      if (e.target.tagName === 'BUTTON') return;
      var detail = card.querySelector('.person-detail');
      detail.classList.toggle('hidden');
    };

    // Add avatar
    setTimeout(function() {
      var slot = card.querySelector('.person-avatar-slot');
      if (slot && typeof AvatarGen !== 'undefined') {
        var canvas = AvatarGen.generate(emp, 3);
        slot.appendChild(canvas);
      }
    }, 0);

    var actionsDiv = card.querySelector('.project-actions');
    var btnFire = document.createElement('button');
    btnFire.className = 'btn btn-danger btn-small';
    btnFire.textContent = 'FIRE';
    btnFire.onclick = function(e) {
      e.stopPropagation();
      actionFire(emp.id);
      UI.renderAll();
    };
    actionsDiv.appendChild(btnFire);

    return card;
  },

  createCandidateCard: function(c) {
    var card = document.createElement('div');
    card.className = 'project-card person-card';
    card.style.cursor = 'pointer';

    var daysWaiting = G.day - (c.arrivedDay || G.day);

    // Skills with fog of war
    var skillsHtml = '';
    if (c.skillsRevealed === 0) {
      skillsHtml = '<div class="skill-bars">' +
        this.skillBar('TEC', '?', 10) +
        this.skillBar('COM', '?', 10) +
        this.skillBar('REL', '?', 10) +
      '</div>';
    } else if (c.skillsRevealed === 1) {
      skillsHtml = '<div class="skill-bars">' +
        this.skillBar('TEC', c.technical, 10) +
        this.skillBar('COM', '?', 10) +
        this.skillBar('REL', '?', 10) +
      '</div>';
    } else {
      skillsHtml = '<div class="skill-bars">' +
        this.skillBar('TEC', c.technical, 10) +
        this.skillBar('COM', c.communication, 10) +
        this.skillBar('REL', c.reliability, 10) +
      '</div>';
    }

    var perkHtml = '';
    if (c.skillsRevealed >= 2 && c.perk) {
      perkHtml = '<div class="candidate-perk">' + escHtml(c.perk.name) + ': ' + escHtml(c.perk.desc) + '</div>';
    } else if (c.skillsRevealed >= 2 && !c.perk) {
      perkHtml = '<div class="project-meta" style="color:var(--grey)">No special perks.</div>';
    }

    var marketMod = getMarketSalaryModifier();
    var marketLabel = '';
    if (marketMod > 1.15) marketLabel = ' (market: high)';
    else if (marketMod < 0.9) marketLabel = ' (market: low)';

    var waitLabel = daysWaiting > 0 ? ' <span style="color:var(--amber)">(waiting ' + daysWaiting + 'd)</span>' : '';

    var summaryHtml =
      '<div class="person-summary">' +
        '<div class="person-avatar-slot" data-person-id="c' + c.id + '"></div>' +
        '<div class="person-info">' +
          '<div class="project-card-header">' +
            '<span class="project-name">' + escHtml(c.name) + '</span>' +
            '<span class="candidate-role">' + escHtml(c.levelName + ' ' + c.role.name) + '</span>' +
          '</div>' +
          '<div class="project-meta">Asking: $' + c.salary + '/wk' + marketLabel + waitLabel + '</div>' +
          skillsHtml +
        '</div>' +
      '</div>';

    var detailHtml =
      '<div class="person-detail hidden">' +
        perkHtml +
        this.renderWorkHistory(c) +
        '<div class="project-actions"></div>' +
      '</div>';

    card.innerHTML = summaryHtml + detailHtml;

    card.onclick = function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      var detail = card.querySelector('.person-detail');
      detail.classList.toggle('hidden');
    };

    // Add avatar
    setTimeout(function() {
      var slot = card.querySelector('.person-avatar-slot');
      if (slot && typeof AvatarGen !== 'undefined') {
        var canvas = AvatarGen.generate(c, 3);
        slot.appendChild(canvas);
      }
    }, 0);

    var actionsDiv = card.querySelector('.project-actions');

    if (c.skillsRevealed < 2) {
      var btnInt = document.createElement('button');
      btnInt.className = 'btn btn-secondary btn-small';
      btnInt.textContent = c.skillsRevealed === 0 ? 'INTERVIEW (' + AP_COSTS.interview + ' AP)' : 'DEEP INTERVIEW (' + AP_COSTS.interview + ' AP)';
      btnInt.disabled = !canAct(AP_COSTS.interview);
      btnInt.onclick = function(e) { e.stopPropagation(); actionInterview(c.id); };
      actionsDiv.appendChild(btnInt);
    }

    var btnHire = document.createElement('button');
    btnHire.className = 'btn btn-primary btn-small';
    btnHire.textContent = 'NEGOTIATE & HIRE (' + AP_COSTS.hire + ' AP)';
    btnHire.disabled = !canAct(AP_COSTS.hire);
    btnHire.onclick = function(e) { e.stopPropagation(); actionHire(c.id); };
    actionsDiv.appendChild(btnHire);

    return card;
  },

  renderWorkHistory: function(person) {
    if (!person.workHistory || person.workHistory.length === 0) {
      return '<div class="work-history"><span class="comp-label">Work History:</span> <span style="color:var(--grey)">No prior experience</span></div>';
    }
    var html = '<div class="work-history"><span class="comp-label">Work History:</span>';
    for (var i = 0; i < person.workHistory.length; i++) {
      var wh = person.workHistory[i];
      html += '<div class="work-history-item">' + escHtml(wh.company) + ' (' + wh.years + 'yr)</div>';
    }
    html += '</div>';
    return html;
  },

  skillBar: function(label, value, max) {
    max = max || 10;
    if (value === '?') {
      var fog = '';
      for (var k = 0; k < max; k++) fog += '?';
      return '<div class="skill-row"><span class="skill-label">' + label + '</span><span class="skill-dots skill-fog">' + fog + '</span></div>';
    }
    // Color coding: 1-3 red, 4-7 yellow/amber, 8-9 green, 10 cyan
    var colorClass = '';
    if (value >= 10) colorClass = 'skill-perfect';
    else if (value >= 8) colorClass = 'skill-great';
    else if (value >= 4) colorClass = 'skill-ok';
    else colorClass = 'skill-low';

    var filled = '';
    for (var i = 0; i < max; i++) {
      filled += i < value ? '\u25A0' : '\u25A1';
    }
    return '<div class="skill-row"><span class="skill-label">' + label + '</span><span class="skill-dots ' + colorClass + '">' + filled + '</span></div>';
  },

  // --- Market Tab ---
  renderMarket: function() {
    var chartEl = document.getElementById('market-chart');
    var newsEl = document.getElementById('market-news');
    var acqEl = document.getElementById('market-acquisitions');
    var compDetailsEl = document.getElementById('competitor-details');

    if (!G.competitors || G.competitors.length === 0) {
      chartEl.innerHTML = '<div class="empty-state">Market data not yet available.</div>';
      return;
    }

    var shares = getPlayerMarketShare();
    var total = shares.total;
    chartEl.innerHTML = '';

    chartEl.appendChild(this.createMarketBar('You', shares.player, total, 'var(--green)', ''));

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

    if (compDetailsEl) {
      compDetailsEl.innerHTML = '';
      for (var d = 0; d < alive.length; d++) {
        compDetailsEl.appendChild(this.createCompetitorDetailCard(alive[d]));
      }
    }

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

  createCompetitorDetailCard: function(comp) {
    var card = document.createElement('div');
    card.className = 'project-card competitor-detail';

    var styleLabel = { megacorp: 'MEGACORP', vc_funded: 'VC-FUNDED', budget: 'BUDGET', niche: 'NICHE' };
    var styleClass = { megacorp: 'text-red', vc_funded: 'text-amber', budget: 'text-cyan', niche: 'text-green' };

    // Scout/Poach section with progressive reveal
    var scoutHtml = '';
    if (comp.scouted && comp.scoutedTeam && comp.scoutedTeam.length > 0) {
      scoutHtml = '<div class="comp-team-list"><span class="comp-label">Known team members:</span>';
      for (var k = 0; k < comp.scoutedTeam.length; k++) {
        var t = comp.scoutedTeam[k];
        var memberInfo = escHtml(t.name) + ' \u2014 ' + escHtml(t.levelName + ' ' + t.role.name);

        // Progressive reveal based on scout level
        if ((comp.scoutLevel || 1) >= 2) {
          memberInfo += ' (TEC:' + t.technical + ') $' + t.salary + '/wk';
        }
        if ((comp.scoutLevel || 1) >= 3) {
          var willingness = t.willingToLeave ? '<span class="text-green">Open to offers</span>' : '<span class="text-red">Not interested</span>';
          memberInfo += ' \u2014 ' + willingness;
        }

        var poachBtn = '';
        if (t.willingToLeave !== false || (comp.scoutLevel || 1) < 3) {
          poachBtn = ' <button class="btn btn-small btn-secondary poach-btn" onclick="event.stopPropagation();actionPoach(' + comp.id + ',' + t.id + ')">POACH (' + AP_COSTS.poach + ' AP)</button>';
        }

        scoutHtml += '<div class="comp-team-member">' + memberInfo + poachBtn + '</div>';
      }
      scoutHtml += '</div>';
    }

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(comp.name) + '</span>' +
        '<span class="' + (styleClass[comp.style] || '') + '" style="font-size:0.65rem;">' + (styleLabel[comp.style] || comp.style) + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(comp.desc) + '</div>' +
      '<div class="project-meta">Focus: ' + escHtml(comp.focus) + ' &mdash; Share: ' + Math.round(comp.share) + '</div>' +
      scoutHtml +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');

    // Scout button (multi-level with progress)
    var scoutLevel = comp.scoutLevel || 0;
    if (scoutLevel < 3) {
      var apNeeded = typeof getScoutingAPNeeded === 'function' ? getScoutingAPNeeded(comp) : 1;
      var scoutLabel = scoutLevel === 0 ? 'BEGIN SCOUTING' : scoutLevel === 1 ? 'DEEPER INTEL' : 'FULL INTEL';
      var scoutProgress = comp.scoutProgress || 0;
      var styleThr = (typeof SCOUT_THRESHOLDS !== 'undefined' && SCOUT_THRESHOLDS[comp.style]) ? SCOUT_THRESHOLDS[comp.style] : [0, 1, 2, 3];
      var progressNeeded = styleThr[scoutLevel + 1] || 1;
      var progressText = scoutProgress > 0 ? ' (' + scoutProgress + '/' + progressNeeded + ' AP)' : '';
      var btnScout = document.createElement('button');
      btnScout.className = 'btn btn-secondary btn-small';
      btnScout.textContent = scoutLabel + progressText + ' — 1 AP';
      btnScout.disabled = !canAct(AP_COSTS.scout);
      btnScout.onclick = (function(id) { return function() { actionScout(id); }; })(comp.id);
      actionsDiv.appendChild(btnScout);
    }

    return card;
  },

  createAcquisitionCard: function(comp) {
    var cost = getAcquisitionCost(comp);
    var card = document.createElement('div');
    card.className = 'project-card';

    var perksHtml = '';
    if (comp.acqPerks && comp.acqPerks.length > 0) {
      perksHtml = '<div class="comp-acq-info">';
      for (var i = 0; i < comp.acqPerks.length; i++) {
        perksHtml += '<div class="comp-perk-item">+ ' + escHtml(comp.acqPerks[i]) + '</div>';
      }
      perksHtml += '</div>';
    }
    var risksHtml = '';
    if (comp.acqRisks && comp.acqRisks.length > 0) {
      risksHtml = '<div class="comp-acq-info">';
      for (var j = 0; j < comp.acqRisks.length; j++) {
        risksHtml += '<div class="comp-risk-item">- ' + escHtml(comp.acqRisks[j]) + '</div>';
      }
      risksHtml += '</div>';
    }

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(comp.name) + '</span>' +
        '<span class="project-payout">$' + cost.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(comp.desc) + '</div>' +
      '<div class="project-meta">Focus: ' + escHtml(comp.focus) + ' &mdash; Share: ' + Math.round(comp.share) + '</div>' +
      perksHtml + risksHtml +
      '<div class="project-actions"></div>';

    var actionsDiv = card.querySelector('.project-actions');
    var btnAcq = document.createElement('button');
    btnAcq.className = 'btn btn-primary btn-small';
    btnAcq.textContent = 'ACQUIRE (' + AP_COSTS.acquire + ' AP, $' + cost.toLocaleString() + ')';
    btnAcq.disabled = !canAct(AP_COSTS.acquire) || G.cash < cost;
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
      var cost = getFoodCost(item);
      var btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.disabled = G.cash < cost;
      btn.innerHTML =
        '<div>' +
          '<span class="action-name">' + escHtml(item.name) + '</span>' +
          '<span class="action-desc">' + escHtml(item.desc) + '</span>' +
        '</div>' +
        '<span class="action-cost">$' + cost + '</span>';
      btn.onclick = (function(id) {
        return function() { actionOrderFood(id); };
      })(item.id);
      foodEl.appendChild(btn);
    }

    // Upgrades (now cost AP and are pricier)
    var upgradesEl = document.getElementById('shop-upgrades');
    upgradesEl.innerHTML = '';

    var UPGRADES = [
      { id: 'coffee_machine',   name: 'Coffee Machine',    cost: 2500,  apCost: 1, desc: '+10 energy every morning', oneTime: true },
      { id: 'ping_pong',        name: 'Ping Pong Table',   cost: 3500,  apCost: 1, desc: '+5 energy recovery when sleeping', oneTime: true },
      { id: 'second_monitor',   name: 'Second Monitor',    cost: 4000,  apCost: 1, desc: 'Founder work 20% faster',  oneTime: true },
      { id: 'premium_software', name: 'Premium Software',  cost: 5500,  apCost: 1, desc: '+5% project progress for all', oneTime: true },
      { id: 'office_perks',     name: 'Office Perks',      cost: 8000,  apCost: 2, desc: '+15 loyalty for all staff', oneTime: true },
      { id: 'standing_desk',    name: 'Standing Desk',     cost: 12000, apCost: 1, desc: '+1 AP per day',            oneTime: true },
    ];

    for (var j = 0; j < UPGRADES.length; j++) {
      var u = UPGRADES[j];
      var owned = G.upgrades.indexOf(u.id) !== -1;
      var btn2 = document.createElement('button');
      btn2.className = 'action-btn';
      btn2.disabled = owned || G.cash < u.cost || !canAct(u.apCost);
      btn2.innerHTML =
        '<div>' +
          '<span class="action-name">' + escHtml(u.name) + (owned ? ' [OWNED]' : '') + '</span>' +
          '<span class="action-desc">' + escHtml(u.desc) + '</span>' +
        '</div>' +
        '<span class="action-cost">$' + u.cost + ' &middot; ' + u.apCost + ' AP</span>';

      if (!owned) {
        btn2.onclick = (function(upgrade) {
          return function() {
            if (G.cash < upgrade.cost || !canAct(upgrade.apCost)) return;
            G.cash -= upgrade.cost;
            spendAP(upgrade.apCost);
            G.upgrades.push(upgrade.id);
            addLog('Purchased: ' + upgrade.name + '!', 'good');
            if (upgrade.id === 'office_perks') {
              for (var k = 0; k < G.team.length; k++) {
                G.team[k].loyalty = Math.min(100, G.team[k].loyalty + 15);
              }
            }
            showActionConfirmation('Purchased ' + upgrade.name + '!', 'good', function() {
              UI.renderAll();
            });
          };
        })(u);
      }
      upgradesEl.appendChild(btn2);
    }

    // Training section
    var trainingEl = document.getElementById('shop-training');
    if (trainingEl && G.player) {
      trainingEl.innerHTML = '';
      var skills = [
        { key: 'technical', label: 'Technical', desc: 'Improve solo work speed' },
        { key: 'communication', label: 'Communication', desc: 'Reduce negative team events' },
        { key: 'reliability', label: 'Reliability', desc: 'Improve energy efficiency' },
      ];
      for (var s = 0; s < skills.length; s++) {
        var sk = skills[s];
        var currentLvl = G.player[sk.key];
        var trainCost = getTrainingCost(currentLvl);
        var maxed = currentLvl >= 10;
        var btn3 = document.createElement('button');
        btn3.className = 'action-btn';
        btn3.disabled = maxed || G.cash < trainCost || !canAct(AP_COSTS.train_skill);
        btn3.innerHTML =
          '<div>' +
            '<span class="action-name">Train ' + sk.label + (maxed ? ' [MAX]' : ' (' + currentLvl + '/10)') + '</span>' +
            '<span class="action-desc">' + escHtml(sk.desc) + '</span>' +
          '</div>' +
          '<span class="action-cost">' + (maxed ? 'MAX' : '$' + trainCost + ' &middot; 1 AP') + '</span>';
        if (!maxed) {
          btn3.onclick = (function(key) {
            return function() { actionTrainSkill(key); };
          })(sk.key);
        }
        trainingEl.appendChild(btn3);
      }
    }
  },

  // --- Own Products ---
  renderOwnProducts: function() {
    var el = document.getElementById('project-owned-products');
    if (!el) return;
    el.innerHTML = '';

    // Develop new product button
    var btnDev = document.createElement('button');
    btnDev.className = 'btn btn-primary btn-small';
    btnDev.textContent = '+ DEVELOP NEW PRODUCT';
    btnDev.onclick = function() { UI.showProductCreateModal(); };
    el.appendChild(btnDev);

    if (!G.ownedProducts || G.ownedProducts.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No products yet. Develop your own software or platform to generate passive revenue.';
      el.appendChild(empty);
      return;
    }

    for (var i = 0; i < G.ownedProducts.length; i++) {
      el.appendChild(this.createProductCard(G.ownedProducts[i]));
    }
  },

  createProductCard: function(product) {
    var card = document.createElement('div');
    card.className = 'project-card';

    var statusColor = { developing: 'var(--amber)', live: 'var(--green)', dead: 'var(--red)' };
    var statusLabel = { developing: 'DEVELOPING', live: 'LIVE', dead: 'DEAD' };

    var assignedNames = [];
    if (product.assignedTeam) {
      for (var t = 0; t < product.assignedTeam.length; t++) {
        var emp = findEmployee(product.assignedTeam[t]);
        if (emp) assignedNames.push(emp.name);
      }
    }

    var teamHtml = assignedNames.length > 0
      ? '<div class="project-assigned">Team: ' + escHtml(assignedNames.join(', ')) + '</div>'
      : '<div class="project-assigned" style="color:var(--amber)">No team assigned — quality decaying!</div>';

    var progressHtml = product.status === 'developing'
      ? '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(product.progress) + '%"></div></div>' +
        '<div class="project-meta">' + Math.round(product.progress) + '% developed</div>'
      : '';

    var qualityHtml = product.status === 'live'
      ? '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(product.quality) + '%;background:' + (product.quality > 60 ? 'var(--green)' : product.quality > 30 ? 'var(--amber)' : 'var(--red)') + '"></div></div>' +
        '<div class="project-meta">Quality: ' + Math.round(product.quality) + '% &mdash; Interest: ' + Math.round(product.marketInterest) + '% &mdash; $' + Math.round((product.quality / 100) * (product.marketInterest / 100) * product.maxRevenue).toLocaleString() + '/day</div>'
      : '';

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(product.name) + '</span>' +
        '<span style="color:' + (statusColor[product.status] || 'var(--grey)') + ';font-size:0.65rem;">' + (statusLabel[product.status] || product.status) + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(product.typeName) + ' &mdash; ' + escHtml(product.scopeName) + ' scale &mdash; Invested: $' + product.investment.toLocaleString() + '</div>' +
      (product.status !== 'dead' ? teamHtml : '') +
      progressHtml + qualityHtml +
      (product.status !== 'dead' ? '<div class="project-actions-row"></div><div class="project-actions-dropdown" style="display:none;"></div>' : '');

    if (product.status !== 'dead') {
      var actionsRow = card.querySelector('.project-actions-row');
      var actionsDropdown = card.querySelector('.project-actions-dropdown');

      var btnA = document.createElement('button');
      btnA.className = 'btn btn-secondary btn-small';
      btnA.textContent = '> ACTIONS';
      btnA.onclick = function(e) {
        e.stopPropagation();
        var dd = card.querySelector('.project-actions-dropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
      };
      actionsRow.appendChild(btnA);

      if (product.status === 'developing') {
        var btnWork = document.createElement('button');
        btnWork.className = 'btn btn-primary btn-small';
        btnWork.textContent = 'WORK MYSELF (1 AP)';
        btnWork.disabled = !canAct(1);
        btnWork.onclick = (function(id) { return function(e) { e.stopPropagation(); actionWorkOnProduct(id); }; })(product.id);
        actionsDropdown.appendChild(btnWork);
      }

      if (product.status === 'live') {
        var updateCost = Math.round(product.investment * 0.2);
        var btnUpdate = document.createElement('button');
        btnUpdate.className = 'btn btn-secondary btn-small';
        btnUpdate.textContent = 'UPDATE PRODUCT (1 AP, $' + updateCost.toLocaleString() + ')';
        btnUpdate.disabled = !canAct(1) || G.cash < updateCost;
        btnUpdate.onclick = (function(id) { return function(e) { e.stopPropagation(); actionUpdateProduct(id); }; })(product.id);
        actionsDropdown.appendChild(btnUpdate);
      }

      if (G.team.length > 0) {
        var btnAssign = document.createElement('button');
        btnAssign.className = 'btn btn-secondary btn-small';
        btnAssign.textContent = 'ASSIGN TEAM MEMBERS';
        btnAssign.onclick = (function(prod) {
          return function(e) { e.stopPropagation(); UI.showProductAssignModal(prod); };
        })(product);
        actionsDropdown.appendChild(btnAssign);
      }
    }

    return card;
  },

  showProductCreateModal: function() {
    var modal = document.getElementById('event-modal');
    var title = document.getElementById('event-modal-title');
    var desc = document.getElementById('event-modal-desc');
    var choices = document.getElementById('event-modal-choices');

    title.textContent = 'DEVELOP OWN PRODUCT';
    desc.innerHTML =
      '<div style="margin-bottom:0.5rem;">' +
      '<label style="color:var(--grey-light);font-size:0.75rem;">PRODUCT NAME</label><br>' +
      '<input type="text" id="product-name-input" class="create-input" placeholder="My SaaS Tool" maxlength="30" style="width:100%;margin-top:0.25rem;">' +
      '</div>' +
      '<div style="margin-bottom:0.5rem;">' +
      '<label style="color:var(--grey-light);font-size:0.75rem;">TYPE</label><br>' +
      '<select id="product-type-select" class="create-input" style="width:100%;margin-top:0.25rem;">' +
        OWN_PRODUCT_TYPES.map(function(t) { return '<option value="' + t.id + '">' + t.name + ' — ' + t.desc + '</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '<div>' +
      '<label style="color:var(--grey-light);font-size:0.75rem;">SCOPE & INVESTMENT</label><br>' +
      '<select id="product-scope-select" class="create-input" style="width:100%;margin-top:0.25rem;">' +
        OWN_PRODUCT_SCOPES.map(function(s) {
          return '<option value="' + s.id + '">' + s.name + ' — $' + s.investment.toLocaleString() + ' | $' + s.revenueMin + '-' + s.revenueMax.toLocaleString() + '/day potential | ' + s.devDaysMin + '-' + s.devDaysMax + ' dev days</option>';
        }).join('') +
      '</select>' +
      '</div>';

    choices.innerHTML = '';

    var btnStart = document.createElement('button');
    btnStart.className = 'btn btn-primary btn-small';
    btnStart.textContent = 'START DEVELOPMENT';
    btnStart.onclick = function() {
      var nameInput = document.getElementById('product-name-input');
      var typeSelect = document.getElementById('product-type-select');
      var scopeSelect = document.getElementById('product-scope-select');
      var name = nameInput ? nameInput.value.trim() : '';
      var typeId = typeSelect ? typeSelect.value : 'saas_tool';
      var scopeId = scopeSelect ? scopeSelect.value : 'small';
      modal.style.display = 'none';
      actionCreateProduct(typeId, scopeId, name);
    };
    choices.appendChild(btnStart);

    var btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-secondary btn-small';
    btnCancel.textContent = 'CANCEL';
    btnCancel.onclick = function() { modal.style.display = 'none'; };
    choices.appendChild(btnCancel);

    modal.style.display = 'flex';
  },

  showProductAssignModal: function(product) {
    var modal = document.getElementById('event-modal');
    var title = document.getElementById('event-modal-title');
    var desc = document.getElementById('event-modal-desc');
    var choices = document.getElementById('event-modal-choices');

    title.textContent = 'ASSIGN TEAM — ' + product.name;
    desc.textContent = 'Assign team members to maintain/develop this product. Developers, designers, and devops contribute.';
    choices.innerHTML = '';

    var devRoles = ['developer', 'designer', 'devops'];
    for (var i = 0; i < G.team.length; i++) {
      var emp = G.team[i];
      if (devRoles.indexOf(emp.role.id) === -1) continue;
      var isAssigned = product.assignedTeam && product.assignedTeam.indexOf(emp.id) !== -1;
      var btn = document.createElement('button');
      btn.className = 'btn btn-small ' + (isAssigned ? 'btn-primary' : 'btn-secondary');
      btn.textContent = (isAssigned ? '[X] ' : '[ ] ') + emp.name + ' (TEC:' + emp.technical + ')';
      btn.onclick = (function(empId, prodId, assigned) {
        return function() {
          if (assigned) unassignFromProduct(empId);
          else assignToProduct(empId, prodId);
          UI.showProductAssignModal(product);
        };
      })(emp.id, product.id, isAssigned);
      choices.appendChild(btn);
    }

    var btnDone = document.createElement('button');
    btnDone.className = 'btn btn-danger btn-small';
    btnDone.textContent = 'DONE';
    btnDone.onclick = function() { modal.style.display = 'none'; UI.renderAll(); };
    choices.appendChild(btnDone);

    modal.style.display = 'flex';
  },

  // --- Help Tab ---
  renderHelp: function() {
    var el = document.getElementById('tab-help');
    if (!el) return;
    // Only render once (static content)
    if (el.dataset.rendered) return;
    el.dataset.rendered = '1';
    el.innerHTML =
      '<div class="dashboard-section">' +
        '<h2 class="section-title">HOW TO PLAY</h2>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Core Stats</h3>' +
          '<div class="help-item"><span class="help-term">AP</span> Action Points — your daily actions (default 4/day). Spend wisely.</div>' +
          '<div class="help-item"><span class="help-term">NRG</span> Energy — your stamina. Hitting 0 stops all AP usage for the day and hurts your team.</div>' +
          '<div class="help-item"><span class="help-term">TEC</span> Technical — solo work speed, product development progress.</div>' +
          '<div class="help-item"><span class="help-term">COM</span> Communication — reduces team conflict events.</div>' +
          '<div class="help-item"><span class="help-term">REL</span> Reliability — slows loyalty decay. Your team trusts steady founders.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Projects</h3>' +
          '<div class="help-item"><span class="help-term">Pipeline</span> Available leads. Accept them (1 AP) before they expire in 3 days.</div>' +
          '<div class="help-item"><span class="help-term">Complexity</span> Solo-able (≤1.5) can be worked by you directly. Higher needs team members.</div>' +
          '<div class="help-item"><span class="help-term">Work Myself</span> Spend 1 AP to personally advance a solo project.</div>' +
          '<div class="help-item"><span class="help-term">Assign Team</span> Assign devs/designers/devops to auto-advance projects daily.</div>' +
          '<div class="help-item"><span class="help-term">Deadline</span> Extend for -rep. 3+ days overdue risks client cancellation.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Your Products</h3>' +
          '<div class="help-item">Develop your own software to sell on the free market for passive daily income.</div>' +
          '<div class="help-item"><span class="help-term">Quality</span> Decays over time without a team assigned. Below 0 = product dies.</div>' +
          '<div class="help-item"><span class="help-term">Market Interest</span> How hot your product is. Maintained by keeping quality high.</div>' +
          '<div class="help-item"><span class="help-term">Update</span> Costs 20% of original investment to restore quality and interest.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Team & Hiring</h3>' +
          '<div class="help-item"><span class="help-term">Loyalty</span> Decays daily. Falls to 0 = they quit. Keep it up with parties, good management.</div>' +
          '<div class="help-item"><span class="help-term">Payroll</span> Weekly (every 7 days). Miss it and employees walk out + you lose rep.</div>' +
          '<div class="help-item"><span class="help-term">Interview</span> 1st interview reveals Technical skill. 2nd reveals all skills + perk.</div>' +
          '<div class="help-item"><span class="help-term">Negotiate</span> The patience bar shows how many counteroffers remain before they walk.</div>' +
          '<div class="help-item"><span class="help-term">Poach</span> Steal a scouted employee. If successful, negotiate salary immediately.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Market & Scouting</h3>' +
          '<div class="help-item">Scout competitors to reveal their teams. Large companies need many AP spends over days.</div>' +
          '<div class="help-item"><span class="help-term">SCOUT</span> Small/niche: 1-3 AP total. VC-funded: 5-15 AP. Megacorps: 8-24 AP per intel level.</div>' +
          '<div class="help-item"><span class="help-term">Acquire</span> Buy niche startups (5 AP + $50k+) for rep, team, and strategic perks.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Stage Progression</h3>' +
          '<div class="help-item"><span class="help-term">Freelancer</span> Day 1 start. Solo projects only.</div>' +
          '<div class="help-item"><span class="help-term">Home Office</span> Day 7 + $1,000. Can hire first employee.</div>' +
          '<div class="help-item"><span class="help-term">Micro Agency</span> 3 staff + $5k + 30 rep.</div>' +
          '<div class="help-item"><span class="help-term">Boutique Studio</span> $25k revenue + 70 rep. Larger projects unlock.</div>' +
          '<div class="help-item"><span class="help-term">Scale-Up</span> 8+ staff + 130 rep + $75k revenue.</div>' +
          '<div class="help-item"><span class="help-term">Market Leader</span> 200 rep = WIN.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Skill Colors</h3>' +
          '<div class="help-item"><span class="skill-dots skill-low">\u25A0\u25A0\u25A0</span> 1–3: Needs work</div>' +
          '<div class="help-item"><span class="skill-dots skill-ok">\u25A0\u25A0\u25A0\u25A0</span> 4–7: Capable</div>' +
          '<div class="help-item"><span class="skill-dots skill-great">\u25A0\u25A0</span> 8–9: Expert</div>' +
          '<div class="help-item"><span class="skill-dots skill-perfect">\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0</span> 10: Perfect</div>' +
        '</div>' +
      '</div>';
  },

  // --- Time of Day ---
  updateTimeOfDay: function() {
    var tod = getTimeOfDay();
    document.body.className = 'time-' + tod;
  },

  // --- Footer ---
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
      if (tabs[i].getAttribute('data-tab') === tabName) tabs[i].classList.add('active');
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
