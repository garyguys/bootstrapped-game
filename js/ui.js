/* ============================================
   ui.js — All DOM Updates & Rendering
   People cards, pixel art avatars, fog of war,
   team assignment, patience bar, management dash.
   ============================================ */

// --- Upgrade Definitions (global scope for shop + company info) ---
var UPGRADES = [
  // Tier 1 (Freelancer+)
  { id: 'coffee_machine',   name: 'Coffee Machine',        cost: 2500,  apCost: 1, desc: '+10 energy every morning',                         tier: 1, stage: 'freelancer' },
  { id: 'ping_pong',        name: 'Ping Pong Table',        cost: 3500,  apCost: 1, desc: '+5 energy recovery when sleeping',                 tier: 1, stage: 'freelancer' },
  { id: 'second_monitor',   name: 'Second Monitor',         cost: 4000,  apCost: 1, desc: 'Founder works 20% faster',                         tier: 1, stage: 'freelancer' },
  { id: 'premium_software', name: 'Premium Software',       cost: 5500,  apCost: 1, desc: '+5% project progress for all',                     tier: 1, stage: 'freelancer' },
  { id: 'office_perks',     name: 'Office Perks',           cost: 8000,  apCost: 2, desc: '+15 loyalty for all staff',                        tier: 1, stage: 'freelancer' },
  { id: 'standing_desk',    name: 'Standing Desk',          cost: 12000, apCost: 1, desc: '+1 AP per day',                                    tier: 1, stage: 'freelancer' },
  // Tier 2 (Startup+)
  { id: 'rooftop_terrace',  name: 'Rooftop Terrace',        cost: 22000, apCost: 2, desc: '+20 energy daily, +10 loyalty/week all staff',     tier: 2, stage: 'startup' },
  { id: 'server_farm',      name: 'Dedicated Server Farm',  cost: 30000, apCost: 2, desc: 'Products generate 25% more revenue',               tier: 2, stage: 'startup' },
  { id: 'executive_suite',  name: 'Executive Suite',        cost: 45000, apCost: 2, desc: '+2 AP per day',                                    tier: 2, stage: 'startup' },
  { id: 'automation_tools', name: 'Automation Tools',       cost: 38000, apCost: 2, desc: 'A random active project gains +5% progress/day',   tier: 2, stage: 'startup' },
  { id: 'recording_studio', name: 'Recording Studio',       cost: 20000, apCost: 2, desc: 'Press releases cost 0 AP',                         tier: 2, stage: 'startup' },
  // Tier 3 (Series A+)
  { id: 'ai_copilot',       name: 'AI Copilot',             cost: 60000,  apCost: 3, desc: '+25% solo work speed (stacks with Second Monitor)', tier: 3, stage: 'series_a' },
  { id: 'employee_gym',     name: 'Employee Gym',           cost: 50000,  apCost: 2, desc: '+10 sleep energy, -1 team energy overhead',        tier: 3, stage: 'series_a' },
  { id: 'innovation_lab',   name: 'Innovation Lab',         cost: 75000,  apCost: 3, desc: 'Products greenlight in 6 AP instead of 12',        tier: 3, stage: 'series_a' },
  { id: 'cloud_infra',      name: 'Cloud Infrastructure',   cost: 80000,  apCost: 3, desc: 'All products +50% max revenue',                    tier: 3, stage: 'series_a' },
  { id: 'private_chef',     name: 'Private Chef',           cost: 40000,  apCost: 2, desc: 'Food costs 50% less, food energy +20%',            tier: 3, stage: 'series_a' },
];

var _assignInProgress = false;

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
    var week = Math.ceil(G.day / 7);
    var dayInWeek = ((G.day - 1) % 7) + 1;
    document.getElementById('header-day').innerHTML =
      'Week ' + week + ' | Day ' + dayInWeek + ' <span class="day-name">' + DAYS_OF_WEEK[G.dayOfWeek] + '</span>';
    var dayTotalEl = document.getElementById('header-day-total');
    if (dayTotalEl) dayTotalEl.textContent = 'Day ' + G.day + ' total';
    // Show only the time portion (day name is already in header-day)
    var fullTime = getTimeString();
    var timeOnly = fullTime.indexOf(' ') !== -1 ? fullTime.substring(fullTime.indexOf(' ') + 1) : fullTime;
    document.getElementById('header-clock').textContent = timeOnly;

    // Company name — clickable to open company modal (v0.09: dotted underline + info icon)
    var compEl = document.getElementById('header-company');
    if (compEl && G.player) {
      compEl.innerHTML = escHtml(G.player.companyName) + ' <span class="company-info-icon">i</span>';
      compEl.className = 'header-company header-company-clickable';
      compEl.title = 'Click to view company profile';
      compEl.onclick = showCompanyModal;
    }

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

    // P&L section
    var plEl = document.getElementById('dashboard-pl');
    if (plEl && G.transactions && G.transactions.length > 0) {
      var cats = { income: 0, payroll: 0, food: 0, upgrade: 0, training: 0, ops: 0, product: 0, other: 0 };
      for (var ti = 0; ti < G.transactions.length; ti++) {
        var tx = G.transactions[ti];
        if (tx.type === 'income') cats.income += tx.amount;
        else if (tx.category === 'payroll')    cats.payroll  += tx.amount;
        else if (tx.category === 'food')       cats.food     += tx.amount;
        else if (tx.category === 'upgrade')    cats.upgrade  += tx.amount;
        else if (tx.category === 'training')   cats.training += tx.amount;
        else if (tx.category === 'operations') cats.ops      += tx.amount;
        else if (tx.category === 'product')    cats.product  += tx.amount;
        else cats.other += tx.amount;
      }
      var totalExpenses = cats.payroll + cats.food + cats.upgrade + cats.training + cats.ops + cats.product + cats.other;
      var net = cats.income - totalExpenses;
      plEl.innerHTML =
        '<h3 class="section-title">PROFIT & LOSS</h3>' +
        '<div class="negotiation-row"><span>Revenue</span><span style="color:var(--green)">$' + cats.income.toLocaleString() + '</span></div>' +
        (cats.payroll  ? '<div class="negotiation-row"><span>Payroll</span><span style="color:var(--red)">-$' + cats.payroll.toLocaleString() + '</span></div>' : '') +
        (cats.food     ? '<div class="negotiation-row"><span>Food</span><span style="color:var(--amber)">-$' + cats.food.toLocaleString() + '</span></div>' : '') +
        (cats.upgrade  ? '<div class="negotiation-row"><span>Upgrades</span><span style="color:var(--amber)">-$' + cats.upgrade.toLocaleString() + '</span></div>' : '') +
        (cats.training ? '<div class="negotiation-row"><span>Training</span><span style="color:var(--amber)">-$' + cats.training.toLocaleString() + '</span></div>' : '') +
        (cats.ops      ? '<div class="negotiation-row"><span>Operations</span><span style="color:var(--amber)">-$' + cats.ops.toLocaleString() + '</span></div>' : '') +
        (cats.product  ? '<div class="negotiation-row"><span>Product</span><span style="color:var(--amber)">-$' + cats.product.toLocaleString() + '</span></div>' : '') +
        (cats.other    ? '<div class="negotiation-row"><span>Other</span><span style="color:var(--amber)">-$' + cats.other.toLocaleString() + '</span></div>' : '') +
        '<div class="negotiation-row" style="border-top:1px solid var(--border);margin-top:0.25rem;padding-top:0.25rem;">' +
          '<span>Net</span><span style="color:' + (net >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (net >= 0 ? '+' : '') + '$' + net.toLocaleString() + '</span>' +
        '</div>';
      plEl.style.display = 'block';
    } else if (plEl) {
      plEl.style.display = 'none';
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
      var clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-small btn-secondary';
      clearBtn.style.marginBottom = '0.5rem';
      clearBtn.textContent = 'CLEAR HISTORY (' + G.completedProjects.length + ')';
      clearBtn.onclick = function() { actionClearCompletedProjects(); };
      completedEl.appendChild(clearBtn);
      for (var k = G.completedProjects.length - 1; k >= 0; k--) {
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
      '<div class="project-meta">' + escHtml(project.client) +
        (G.clientRapport && G.clientRapport[project.client] ? ' <span class="rapport-badge">[Repeat Client]</span>' : '') +
        ' &mdash; ' + project.daysToComplete + ' days &mdash; ' + complexLabel + '</div>' +
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

    var btnDecline = document.createElement('button');
    btnDecline.className = 'btn btn-secondary btn-small';
    btnDecline.textContent = 'DECLINE';
    btnDecline.onclick = function() { actionDeclineLead(project.id); };
    actionsDiv.appendChild(btnDecline);

    return card;
  },

  createActiveProjectCard: function(project) {
    var card = document.createElement('div');
    card.className = 'project-card';
    var canWork = project.progress < 100;
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

    var ddOpen = (typeof _keepDropdownOpen !== 'undefined' && _keepDropdownOpen === project.id);
    if (ddOpen) _keepDropdownOpen = null;

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
      '<div class="project-actions-dropdown" style="display:' + (ddOpen ? 'block' : 'none') + ';"></div>';

    var actionsRow = card.querySelector('.project-actions-row');
    var actionsDropdown = card.querySelector('.project-actions-dropdown');

    // Build action list
    var hasActions = false;

    if (canWork) hasActions = true;
    if (project.progress < 100) hasActions = true; // extend always available
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

    if (project.progress < 100) {
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
    desc.textContent = 'Any team member can contribute. Devs/Designers lead progress. Sales boosts payout. Marketing boosts rep on delivery.';
    choices.innerHTML = '';

    var roleLabels = { developer: 'DEV', designer: 'DES', devops: 'OPS', pm: 'PM', sales: 'SAL', marketer: 'MKT' };
    var assignedTeam = project.assignedTeam || [];

    // Sort: assigned-here first, then unassigned, then assigned-elsewhere
    var sortedTeam = G.team.slice().sort(function(a, b) {
      var aHere = (assignedTeam.indexOf(a.id) !== -1) ? 0 : 1;
      var bHere = (assignedTeam.indexOf(b.id) !== -1) ? 0 : 1;
      if (aHere !== bHere) return aHere - bHere;
      var aElse = (a.assignedProjectId || a.assignedProductId) ? 1 : 0;
      var bElse = (b.assignedProjectId || b.assignedProductId) ? 1 : 0;
      return aElse - bElse;
    });

    for (var i = 0; i < sortedTeam.length; i++) {
      var emp = sortedTeam[i];

      var isAssigned = assignedTeam.indexOf(emp.id) !== -1;
      var roleLabel = roleLabels[emp.role.id] || emp.role.id.toUpperCase().slice(0, 3);

      // v0.09: Show current assignment status
      var assignStatus = '';
      if (!isAssigned && emp.assignedProjectId) {
        var onProj = G.activeProjects.find(function(p) { return p.id === emp.assignedProjectId; });
        if (onProj) assignStatus = ' (on ' + onProj.name + ')';
      }
      if (!isAssigned && emp.assignedProductId) {
        var onProd = G.ownedProducts ? G.ownedProducts.find(function(p) { return p.id === emp.assignedProductId; }) : null;
        if (onProd) assignStatus = ' (on ' + onProd.name + ')';
      }

      var btn = document.createElement('button');
      btn.className = 'btn btn-small ' + (isAssigned ? 'btn-primary' : 'btn-secondary');
      btn.textContent = (isAssigned ? '[X] ' : '[ ] ') + emp.name + ' [' + roleLabel + '] TEC:' + emp.technical + assignStatus;
      btn.onclick = (function(empId, projId, assigned) {
        return function(e) {
          e.stopPropagation();
          if (_assignInProgress) return;
          _assignInProgress = true;
          setTimeout(function() { _assignInProgress = false; }, 200);
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
      '<div class="project-meta">Focus: ' + escHtml(comp.focus) + ' &mdash; Share: ' + Math.round(comp.share) + ' &mdash; Rep: ' + (comp.reputation || 0) + '</div>' +
      ((comp.scoutLevel || 0) >= 2 && comp.products && comp.products.length > 0
        ? '<div class="project-meta" style="color:var(--cyan)">Products: ' + comp.products.map(function(p) { return escHtml(p.name) + ' (' + p.scope + ', Q:' + (p.quality || 0) + ')'; }).join(', ') + '</div>'
        : '') +
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

    var foodSpeedPerk = G.perks.find(function(p) { return p.id === 'food_speed'; });
    if (!G.foodPurchasedToday) G.foodPurchasedToday = {};

    for (var i = 0; i < FOOD_ITEMS.length; i++) {
      (function(item) {
        var cost = getFoodCost(item);
        var buffActive = !!(item.buff && foodSpeedPerk);
        var itemOrderedToday = !item.multiUse && G.foodPurchasedToday[item.id] >= G.day;
        var retreatCD = item.retreatBonus && (G.day - (G.lastRetreatDay || -99)) < 14;
        var retreatDaysLeft = retreatCD ? (14 - (G.day - (G.lastRetreatDay || -99))) : 0;
        var disabledReason = itemOrderedToday ? 'Already had ' + item.name + ' today'
          : buffActive ? 'Buff active (' + foodSpeedPerk.daysLeft + 'd left)'
          : retreatCD ? 'Cooldown: ' + retreatDaysLeft + ' day(s)'
          : '';
        var btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.disabled = G.cash < cost || itemOrderedToday || buffActive || retreatCD;
        btn.innerHTML =
          '<div>' +
            '<span class="action-name">' + escHtml(item.name) + '</span>' +
            '<span class="action-desc">' + escHtml(disabledReason || item.desc) + '</span>' +
          '</div>' +
          '<span class="action-cost">$' + cost + '</span>';
        btn.onclick = function() { actionOrderFood(item.id); };
        foodEl.appendChild(btn);
      })(FOOD_ITEMS[i]);
    }

    // Upgrades (now cost AP and are pricier)
    var upgradesEl = document.getElementById('shop-upgrades');
    upgradesEl.innerHTML = '';

    // UPGRADES is defined at global scope (above UI object)

    function renderUpgradeBtn(u) {
      var btn2 = document.createElement('button');
      btn2.className = 'action-btn';
      btn2.disabled = G.cash < u.cost || !canAct(u.apCost);
      btn2.innerHTML =
        '<div>' +
          '<span class="action-name">' + escHtml(u.name) + '</span>' +
          '<span class="action-desc">' + escHtml(u.desc) + '</span>' +
        '</div>' +
        '<span class="action-cost">$' + u.cost.toLocaleString() + ' &middot; ' + u.apCost + ' AP</span>';
      btn2.onclick = (function(upgrade) {
        return function() {
          if (G.cash < upgrade.cost || !canAct(upgrade.apCost)) return;
          G.cash -= upgrade.cost;
          spendAP(upgrade.apCost);
          G.upgrades.push(upgrade.id);
          recordTransaction('expense', 'upgrade', upgrade.cost, 'Upgrade: ' + upgrade.name);
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
      return btn2;
    }

    // Render upgrades by tier, gated by stage progression (skip owned)
    var tierConfigs = [
      { tier: 1, label: 'OFFICE UPGRADES', stage: 'freelancer' },
      { tier: 2, label: 'TIER 2 UPGRADES (Startup+)', stage: 'startup' },
      { tier: 3, label: 'TIER 3 UPGRADES (Series A+)', stage: 'series_a' },
    ];
    for (var tc = 0; tc < tierConfigs.length; tc++) {
      var cfg = tierConfigs[tc];
      if (!hasReachedStage(cfg.stage)) continue;
      // Collect unowned upgrades for this tier
      var tierUpgrades = UPGRADES.filter(function(u) {
        return u.tier === cfg.tier && G.upgrades.indexOf(u.id) === -1;
      });
      if (tierUpgrades.length === 0) continue;
      var tHeader = document.createElement('div');
      tHeader.className = 'shop-tier-header';
      if (tc > 0) tHeader.style.marginTop = '14px';
      tHeader.textContent = cfg.label;
      upgradesEl.appendChild(tHeader);
      for (var tu = 0; tu < tierUpgrades.length; tu++) {
        upgradesEl.appendChild(renderUpgradeBtn(tierUpgrades[tu]));
      }
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

    var productStages = ['startup', 'seed_stage', 'series_a', 'growth', 'enterprise', 'leader'];
    var productsUnlocked = productStages.indexOf(G.stage) !== -1;

    if (!productsUnlocked) {
      var lockedMsg = document.createElement('div');
      lockedMsg.className = 'empty-state';
      lockedMsg.style.color = 'var(--grey)';
      lockedMsg.textContent = 'PRODUCTS UNLOCKED AT STARTUP STAGE (75 rep) — grow your company first.';
      el.appendChild(lockedMsg);
      return;
    }

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

    var statusColor = { greenlight: 'var(--amber)', building: 'var(--cyan)', live: 'var(--green)', dead: 'var(--red)' };
    var statusLabel = { greenlight: 'GREENLIGHT', building: 'BUILDING', live: 'LIVE', dead: 'DEAD' };

    var assignedNames = [];
    if (product.assignedTeam) {
      for (var t = 0; t < product.assignedTeam.length; t++) {
        var emp = findEmployee(product.assignedTeam[t]);
        if (emp) assignedNames.push(emp.name);
      }
    }

    var teamHtml = '';
    if (assignedNames.length > 0) {
      teamHtml = '<div class="project-assigned">Team: ' + escHtml(assignedNames.join(', ')) + '</div>';
    } else if (product.status === 'live') {
      teamHtml = '<div class="project-assigned" style="color:var(--amber)">No team assigned — quality decaying!</div>';
    } else {
      teamHtml = '<div class="project-assigned" style="color:var(--grey)">No team assigned yet</div>';
    }

    var progressHtml = '';
    if (product.status === 'greenlight') {
      var glPct = Math.round(((product.apInvested || 0) / (product.apRequired || 12)) * 100);
      progressHtml =
        '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + glPct + '%;background:var(--amber)"></div></div>' +
        '<div class="project-meta">Greenlight: ' + (product.apInvested || 0) + ' / ' + (product.apRequired || 12) + ' AP</div>';
    } else if (product.status === 'building') {
      var bldPct = Math.round(((product.devDaysWorked || 0) / (product.devDaysRequired || 1)) * 100);
      progressHtml =
        '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + bldPct + '%;background:var(--cyan)"></div></div>' +
        '<div class="project-meta">Building: ' + (product.devDaysWorked || 0) + ' / ' + (product.devDaysRequired || 1) + ' dev days</div>';
    }

    var qualityHtml = product.status === 'live'
      ? '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(product.quality) + '%;background:' + (product.quality > 60 ? 'var(--green)' : product.quality > 30 ? 'var(--amber)' : 'var(--red)') + '"></div></div>' +
        '<div class="project-meta">Quality: ' + Math.round(product.quality) + '% &mdash; Interest: ' + Math.round(product.marketInterest) + '% &mdash; $' + Math.round((product.quality / 100) * (product.marketInterest / 100) * product.maxRevenue).toLocaleString() + '/day</div>'
      : '';

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(product.name) + '</span>' +
        '<span style="color:' + (statusColor[product.status] || 'var(--grey)') + ';font-size:0.65rem;">' + (statusLabel[product.status] || product.status) + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(product.typeName) + ' &mdash; ' + escHtml(product.scopeName) + ' scale &mdash; Invested: $' + product.investment.toLocaleString() +
        ((product.status === 'live' || product.status === 'dead') ? ' | Lifetime: $' + (product.totalRevenue || 0).toLocaleString() + ' | <span style="color:' + ((product.totalRevenue || 0) - product.investment >= 0 ? 'var(--green)' : 'var(--red)') + '">Net: $' + ((product.totalRevenue || 0) - product.investment).toLocaleString() + '</span>' : '') +
      '</div>' +
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

      if (product.status === 'greenlight') {
        var btnInvest = document.createElement('button');
        btnInvest.className = 'btn btn-primary btn-small';
        btnInvest.textContent = 'INVEST AP (1 AP) — ' + (product.apInvested || 0) + '/' + (product.apRequired || 12);
        btnInvest.disabled = !canAct(1);
        btnInvest.onclick = (function(id) { return function(e) { e.stopPropagation(); actionInvestInProduct(id); }; })(product.id);
        actionsDropdown.appendChild(btnInvest);
      }

      if (product.status === 'building') {
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

        // v0.09: Upgrade to higher scale
        var scopes = ['small', 'medium', 'large', 'enterprise'];
        var scopeIdx = scopes.indexOf(product.scope);
        if (scopeIdx >= 0 && scopeIdx < scopes.length - 1) {
          var nextScope = scopes[scopeIdx + 1];
          var nextScopeData = OWN_PRODUCT_SCOPES.find(function(s) { return s.id === nextScope; });
          var upgradeCost = nextScopeData ? Math.round(nextScopeData.investment * 0.6) : 0;
          var btnUpgrade = document.createElement('button');
          btnUpgrade.className = 'btn btn-primary btn-small';
          btnUpgrade.textContent = 'UPGRADE TO ' + nextScope.toUpperCase() + ' (2 AP, $' + upgradeCost.toLocaleString() + ')';
          btnUpgrade.disabled = !canAct(2) || G.cash < upgradeCost;
          btnUpgrade.onclick = (function(id) { return function(e) { e.stopPropagation(); actionUpgradeProduct(id); }; })(product.id);
          actionsDropdown.appendChild(btnUpgrade);
        }
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
    var prodAssignedTeam = product.assignedTeam || [];
    var devTeam = G.team.filter(function(e) { return devRoles.indexOf(e.role.id) !== -1; });

    // Sort: assigned-here first, then unassigned, then assigned-elsewhere
    devTeam.sort(function(a, b) {
      var aHere = (prodAssignedTeam.indexOf(a.id) !== -1) ? 0 : 1;
      var bHere = (prodAssignedTeam.indexOf(b.id) !== -1) ? 0 : 1;
      if (aHere !== bHere) return aHere - bHere;
      var aElse = (a.assignedProjectId || a.assignedProductId) ? 1 : 0;
      var bElse = (b.assignedProjectId || b.assignedProductId) ? 1 : 0;
      return aElse - bElse;
    });

    for (var i = 0; i < devTeam.length; i++) {
      var emp = devTeam[i];
      var isAssigned = prodAssignedTeam.indexOf(emp.id) !== -1;

      // v0.09: Show current assignment status
      var prodAssignStatus = '';
      if (!isAssigned && emp.assignedProjectId) {
        var onProj2 = G.activeProjects.find(function(p) { return p.id === emp.assignedProjectId; });
        if (onProj2) prodAssignStatus = ' (on ' + onProj2.name + ')';
      }
      if (!isAssigned && emp.assignedProductId) {
        var onProd2 = G.ownedProducts ? G.ownedProducts.find(function(p) { return p.id === emp.assignedProductId; }) : null;
        if (onProd2) prodAssignStatus = ' (on ' + onProd2.name + ')';
      }

      var btn = document.createElement('button');
      btn.className = 'btn btn-small ' + (isAssigned ? 'btn-primary' : 'btn-secondary');
      btn.textContent = (isAssigned ? '[X] ' : '[ ] ') + emp.name + ' (TEC:' + emp.technical + ')' + prodAssignStatus;
      btn.onclick = (function(empId, prodId, assigned) {
        return function(e) {
          e.stopPropagation();
          if (_assignInProgress) return;
          _assignInProgress = true;
          setTimeout(function() { _assignInProgress = false; }, 200);
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

  // --- Help Tab (v0.09: rewritten, no caching) ---
  renderHelp: function() {
    var el = document.getElementById('tab-help');
    if (!el) return;
    el.innerHTML =
      '<div class="dashboard-section">' +
        '<h2 class="section-title">HOW TO PLAY</h2>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Core Stats</h3>' +
          '<div class="help-item"><span class="help-term">AP</span> Action Points — your daily actions (default 4/day). Spend wisely.</div>' +
          '<div class="help-item"><span class="help-term">NRG</span> Energy — your stamina. Hitting 0 stops all AP usage. Sleep restores ~75 base (less with active projects/team).</div>' +
          '<div class="help-item"><span class="help-term">TEC</span> Technical — solo work speed, product development progress.</div>' +
          '<div class="help-item"><span class="help-term">COM</span> Communication — reduces team conflict events.</div>' +
          '<div class="help-item"><span class="help-term">REL</span> Reliability — slows loyalty decay. Your team trusts steady founders.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Food & Energy</h3>' +
          '<div class="help-item">Buy food from the Shop tab to restore energy. Each food item can be purchased once per day.</div>' +
          '<div class="help-item"><span class="help-term">Buffs</span> Expensive foods grant temporary speed buffs (1-3 days). Only one buff active at a time.</div>' +
          '<div class="help-item"><span class="help-term">Team Dinner</span> Also boosts team loyalty (+5 for all).</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Projects & Clients</h3>' +
          '<div class="help-item"><span class="help-term">Pipeline</span> Available leads. Accept them (1 AP) before they expire in 3 days.</div>' +
          '<div class="help-item"><span class="help-term">Complexity</span> Higher complexity projects advance slower solo. Assign team to speed things up.</div>' +
          '<div class="help-item"><span class="help-term">Skill Matching</span> High-skill devs on easy projects = 1.5x speed. Low-skill on hard projects = 0.4x.</div>' +
          '<div class="help-item"><span class="help-term">Client Rapport</span> Delivering projects builds rapport. Repeat clients appear with a badge and are more forgiving on deadlines.</div>' +
          '<div class="help-item"><span class="help-term">Deadline</span> Extend for -rep. 3+ days overdue risks cancellation (rapport reduces this risk).</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Your Products</h3>' +
          '<div class="help-item"><span class="help-term">Greenlight</span> Invest AP to validate your idea. Once approved, development begins.</div>' +
          '<div class="help-item"><span class="help-term">Building</span> Work on it yourself or assign team. Requires dev days to complete.</div>' +
          '<div class="help-item"><span class="help-term">Live</span> Generates daily passive revenue. Quality decays without assigned team.</div>' +
          '<div class="help-item"><span class="help-term">Update</span> Costs 20% of investment to restore quality and interest.</div>' +
          '<div class="help-item"><span class="help-term">Upgrade</span> Scale up live products (small > medium > large > enterprise) for more revenue potential.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Team & Hiring</h3>' +
          '<div class="help-item"><span class="help-term">Loyalty</span> Decays daily. Falls to 0 = they quit. Keep it up with parties, food, good management.</div>' +
          '<div class="help-item"><span class="help-term">Payroll</span> Weekly (every 7 days). Warnings at 3/2/1 days before. Missed payroll: loyal staff may stay, disloyal will leave.</div>' +
          '<div class="help-item"><span class="help-term">Exclusivity</span> Each team member can only be assigned to ONE thing — a project OR a product. Assigning to one removes them from the other.</div>' +
          '<div class="help-item"><span class="help-term">Interview</span> 1st interview reveals Technical skill. 2nd reveals all skills + perk.</div>' +
          '<div class="help-item"><span class="help-term">Negotiate</span> The patience bar shows how many counteroffers remain before they walk.</div>' +
          '<div class="help-item"><span class="help-term">Poach</span> Steal a scouted employee. If successful, negotiate salary immediately.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Monthly Recap</h3>' +
          '<div class="help-item">Every 28 days, a monthly recap shows your P&L summary, projects completed, team size, and market position.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Market & Scouting</h3>' +
          '<div class="help-item">Scout competitors to reveal their teams. Large companies need many AP spends over days.</div>' +
          '<div class="help-item"><span class="help-term">SCOUT</span> Small/niche: 1-3 AP total. VC-funded: 5-15 AP. Megacorps: 8-24 AP per intel level.</div>' +
          '<div class="help-item"><span class="help-term">Acquire</span> Buy niche startups (5 AP + $50k+) for rep, team, and strategic perks.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Stage Progression</h3>' +
          '<div class="help-item"><span class="help-term">Freelancer</span> Day 1 start. Solo projects only. Cannot post job listings.</div>' +
          '<div class="help-item"><span class="help-term">Home Office</span> 25 rep. Can hire first employee. Post job listings.</div>' +
          '<div class="help-item"><span class="help-term">Startup</span> 75 rep. Larger team projects. Products unlocked.</div>' +
          '<div class="help-item"><span class="help-term">Seed Stage</span> 150 rep. Complex projects (complexity 3+) available.</div>' +
          '<div class="help-item"><span class="help-term">Series A</span> 300 rep. High-value enterprise contracts appear.</div>' +
          '<div class="help-item"><span class="help-term">Growth Company</span> 550 rep. Max complexity projects unlock.</div>' +
          '<div class="help-item"><span class="help-term">Enterprise</span> 1000 rep. Final stretch — one stage from winning.</div>' +
          '<div class="help-item"><span class="help-term">Market Leader</span> 2000 rep = WIN.</div>' +
        '</div>' +
        '<div class="help-block">' +
          '<h3 class="help-heading">Skill Colors</h3>' +
          '<div class="help-item"><span class="skill-dots skill-low">\u25A0\u25A0\u25A0</span> 1\u20133: Needs work</div>' +
          '<div class="help-item"><span class="skill-dots skill-ok">\u25A0\u25A0\u25A0\u25A0</span> 4\u20137: Capable</div>' +
          '<div class="help-item"><span class="skill-dots skill-great">\u25A0\u25A0</span> 8\u20139: Expert</div>' +
          '<div class="help-item"><span class="skill-dots skill-perfect">\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0\u25A0</span> 10: Perfect</div>' +
        '</div>' +
      '</div>';
  },

  // --- Vacation Modal ---
  showVacationModal: function() {
    var modal = document.getElementById('event-modal');
    var title = document.getElementById('event-modal-title');
    var desc = document.getElementById('event-modal-desc');
    var choices = document.getElementById('event-modal-choices');

    title.textContent = 'TAKE A VACATION';

    // Warn about projects that might miss deadlines
    var riskProjects = G.activeProjects.filter(function(p) {
      var daysLeft = p.daysToComplete - p.daysActive;
      return p.progress < 100 && daysLeft <= 7;
    });
    var warningHtml = riskProjects.length > 0
      ? '<br><span style="color:var(--red)">Warning: ' + riskProjects.length + ' project(s) may miss their deadline while you\'re away.</span>'
      : '';

    desc.innerHTML =
      'Step away from work for a few days. Your team keeps working, bills are processed, and competitors keep competing.' +
      '<br><br>Select duration:' + warningHtml;

    choices.innerHTML = '';

    var durations = [1, 2, 3, 5, 7];
    for (var i = 0; i < durations.length; i++) {
      var days = durations[i];
      var btn = document.createElement('button');
      btn.className = 'btn btn-small btn-secondary';
      btn.textContent = days + ' day' + (days > 1 ? 's' : '') + ' away';
      btn.onclick = (function(d) {
        return function() {
          modal.style.display = 'none';
          processVacation(d);
        };
      })(days);
      choices.appendChild(btn);
    }

    var btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-small btn-danger';
    btnCancel.textContent = 'CANCEL';
    btnCancel.onclick = function() { modal.style.display = 'none'; };
    choices.appendChild(btnCancel);

    modal.style.display = 'flex';
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

// --- Company Profile Modal ---
function showCompanyModal() {
  var modal = document.getElementById('company-modal');
  if (!modal) return;
  var content = modal.querySelector('.company-modal-content');
  if (!content) return;

  var dayFounded = 1;
  var daysInBusiness = G.day - dayFounded;

  // Best clients — sorted by lifetime value
  var clientEntries = [];
  if (G.clients) {
    for (var cname in G.clients) {
      if (Object.prototype.hasOwnProperty.call(G.clients, cname)) {
        clientEntries.push({ name: cname, totalSpent: G.clients[cname].totalSpent, projectCount: G.clients[cname].projectCount });
      }
    }
    clientEntries.sort(function(a, b) { return b.totalSpent - a.totalSpent; });
  }

  var bestClientsHtml = '';
  if (clientEntries.length === 0) {
    bestClientsHtml = '<div class="empty-state" style="font-size:0.75rem;">No client history yet.</div>';
  } else {
    var topClients = clientEntries.slice(0, 5);
    for (var ci = 0; ci < topClients.length; ci++) {
      var cl = topClients[ci];
      bestClientsHtml +=
        '<div class="negotiation-row">' +
          '<span>' + escHtml(cl.name) + ' (' + cl.projectCount + ' project' + (cl.projectCount > 1 ? 's' : '') + ')</span>' +
          '<span style="color:var(--green)">$' + cl.totalSpent.toLocaleString() + '</span>' +
        '</div>';
    }
  }

  // Team list
  var teamHtml = '';
  if (G.team.length === 0) {
    teamHtml = '<div class="empty-state" style="font-size:0.75rem;">No employees yet.</div>';
  } else {
    for (var ti = 0; ti < G.team.length; ti++) {
      var emp = G.team[ti];
      var hireDay = G.day - emp.daysEmployed;
      var loyaltyColor = emp.loyalty > 50 ? 'var(--green)' : emp.loyalty > 25 ? 'var(--amber)' : 'var(--red)';
      teamHtml +=
        '<div class="negotiation-row">' +
          '<span>' + escHtml(emp.name) + ' &mdash; ' + escHtml(emp.levelName + ' ' + emp.role.name) + '</span>' +
          '<span style="font-size:0.7rem;color:var(--grey-light)">Day ' + hireDay + ' | $' + emp.salary.toLocaleString() + '/wk | <span style="color:' + loyaltyColor + '">' + Math.round(emp.loyalty) + '</span></span>' +
        '</div>';
    }
  }

  // Project history (last 15) — clickable to expand details
  var projHistoryHtml = '';
  if (G.completedProjects.length === 0) {
    projHistoryHtml = '<div class="empty-state" style="font-size:0.75rem;">No projects completed yet.</div>';
  } else {
    var showProjs = G.completedProjects.slice().reverse().slice(0, 15);
    for (var pi = 0; pi < showProjs.length; pi++) {
      var pr = showProjs[pi];
      var teamStr = pr.workerNames && pr.workerNames.length ? pr.workerNames.join(', ') : 'Solo';
      projHistoryHtml +=
        '<div class="company-project-row" style="cursor:pointer;" onclick="this.querySelector(\'.company-project-detail\').style.display=this.querySelector(\'.company-project-detail\').style.display===\'none\'?\'block\':\'none\'">' +
          '<div style="display:flex;justify-content:space-between;">' +
            '<span>' + escHtml(pr.client) + ' \u2014 ' + escHtml(pr.name) + '</span>' +
            '<span style="color:var(--green)">$' + pr.payout.toLocaleString() + '</span>' +
          '</div>' +
          '<div class="company-project-detail" style="display:none;font-size:0.7rem;color:var(--grey-light);margin-top:0.3rem;">' +
            'Rep: +' + (pr.repGained || pr.repGain || '?') + ' | Outcome: ' + escHtml(pr.happinessLabel || 'Delivered') +
            '<br>Team: ' + escHtml(teamStr) + ' | Extensions: ' + (pr.deadlineExtensions || 0) +
          '</div>' +
        '</div>';
    }
  }

  content.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">' +
      '<h3 style="margin:0;font-family:var(--font-display);">' + escHtml(G.player.companyName) + '</h3>' +
      '<button class="btn btn-small btn-danger" onclick="document.getElementById(\'company-modal\').style.display=\'none\'">CLOSE</button>' +
    '</div>' +

    '<div class="help-block">' +
      '<h4 class="help-heading">COMPANY OVERVIEW</h4>' +
      '<div class="negotiation-row"><span>Stage</span><span style="color:var(--cyan)">' + escHtml(getStageName()) + '</span></div>' +
      '<div class="negotiation-row"><span>Founded</span><span>Day 1</span></div>' +
      '<div class="negotiation-row"><span>Days in business</span><span>' + daysInBusiness + '</span></div>' +
      '<div class="negotiation-row"><span>Total Revenue</span><span style="color:var(--green)">$' + G.totalRevenue.toLocaleString() + '</span></div>' +
      '<div class="negotiation-row"><span>Reputation</span><span style="color:var(--cyan)">' + G.reputation + '</span></div>' +
    '</div>' +

    '<div class="help-block">' +
      '<h4 class="help-heading">FOUNDER</h4>' +
      '<div class="negotiation-row"><span>' + escHtml(G.player.name) + '</span><span style="color:var(--grey-light)">Founder & CEO</span></div>' +
      '<div style="margin-top:0.4rem;">' + UI.skillBar('TEC', G.player.technical, 10) + UI.skillBar('COM', G.player.communication, 10) + UI.skillBar('REL', G.player.reliability, 10) + '</div>' +
    '</div>' +

    (G.upgrades.length > 0 ? '<div class="help-block">' +
      '<h4 class="help-heading">OWNED UPGRADES (' + G.upgrades.length + ')</h4>' +
      G.upgrades.map(function(uid) {
        var uData = UPGRADES.find(function(u) { return u.id === uid; });
        return uData ? '<div class="negotiation-row"><span>' + escHtml(uData.name) + '</span><span style="color:var(--grey-light);font-size:0.7rem">' + escHtml(uData.desc) + '</span></div>' : '';
      }).join('') +
    '</div>' : '') +

    '<div class="help-block">' +
      '<h4 class="help-heading">TEAM (' + G.team.length + ')</h4>' +
      teamHtml +
    '</div>' +

    '<div class="help-block">' +
      '<h4 class="help-heading">TOP CLIENTS</h4>' +
      bestClientsHtml +
    '</div>' +

    '<div class="help-block">' +
      '<h4 class="help-heading">PROJECT HISTORY (' + G.completedProjects.length + ' total)</h4>' +
      projHistoryHtml +
    '</div>';

  modal.style.display = 'flex';
}

// --- Vacation Processing ---
function processVacation(days) {
  addLog('Taking a ' + days + '-day vacation...', 'info');
  // Give morale boost for taking vacation
  for (var i = 0; i < G.team.length; i++) {
    G.team[i].loyalty = Math.min(100, G.team[i].loyalty + 10);
  }
  for (var d = 0; d < days; d++) {
    endDaySilent();
  }
  G.energy = Math.min(G.energyMax, getSleepEnergyRecovery() + 20);
  addLog('Returned from ' + days + '-day vacation. Refreshed! Team loyalty +10. Energy restored.', 'good');
  saveGame();
  showDayTransition(function() {
    UI.renderAll();
  });
}

// --- HTML Escaping ---
function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
