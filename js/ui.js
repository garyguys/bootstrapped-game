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
    this.renderShop();
    this.renderFooter();
    this.updateTimeOfDay();
  },

  // --- Header ---
  renderHeader: function() {
    document.getElementById('header-day').textContent = 'DAY ' + G.day;
    document.getElementById('header-clock').textContent = getTimeString();

    // Cash
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
    // Status
    document.getElementById('status-stage').textContent = getStageName();
    document.getElementById('status-rep').textContent = G.reputation;
    document.getElementById('status-revenue').textContent = '$' + G.totalRevenue.toLocaleString();
    document.getElementById('status-team').textContent = G.team.length;

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

    // Log
    this.renderLog();

    // Overnight events
    this.renderOvernightEvents();
  },

  // --- Log ---
  renderLog: function() {
    var container = document.getElementById('log-entries');
    container.innerHTML = '';
    var count = Math.min(G.log.length, 20);
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
        project.daysToComplete + ' days &mdash; ' +
        complexLabel +
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

    if (project.expiresIn <= 2) {
      var btnCall = document.createElement('button');
      btnCall.className = 'btn btn-secondary btn-small';
      btnCall.textContent = 'CALL (+2 DAYS)';
      btnCall.disabled = !canAct();
      btnCall.onclick = function() { actionClientCall(project.id); };
      actionsDiv.appendChild(btnCall);
    }

    return card;
  },

  createActiveProjectCard: function(project) {
    var card = document.createElement('div');
    card.className = 'project-card';

    var canWork = project.complexity <= 1.5 && project.progress < 100;

    card.innerHTML =
      '<div class="project-card-header">' +
        '<span class="project-name">' + escHtml(project.name) + '</span>' +
        '<span class="project-payout">$' + project.payout.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="project-meta">' + escHtml(project.client) + ' &mdash; Day ' + project.daysActive + '/' + project.daysToComplete + '</div>' +
      '<div class="project-progress-bar"><div class="project-progress-fill" style="width:' + Math.round(project.progress) + '%"></div></div>' +
      '<div class="project-meta">' + Math.round(project.progress) + '% complete</div>' +
      '<div class="project-actions"></div>';

    if (canWork) {
      var actionsDiv = card.querySelector('.project-actions');
      var btnWork = document.createElement('button');
      btnWork.className = 'btn btn-primary btn-small';
      btnWork.textContent = 'WORK ON IT (1 AP)';
      btnWork.disabled = !canAct();
      btnWork.onclick = function() { actionWorkProject(project.id); };
      actionsDiv.appendChild(btnWork);
    }

    return card;
  },

  // --- Team Tab ---
  renderTeam: function() {
    var rosterEl = document.getElementById('team-roster');
    var candidatesEl = document.getElementById('team-candidates');

    if (G.team.length === 0) {
      rosterEl.innerHTML = '<div class="empty-state">No employees yet. Post a job listing to start hiring.</div>';
    } else {
      rosterEl.innerHTML = '';
      // Team rendering will be expanded when team system is built
    }

    if (G.candidates.length === 0) {
      var hint = G.jobPosted
        ? '<div class="empty-state">Job posted — candidates will apply tomorrow.</div>'
        : '<div class="empty-state">Post a job listing to attract candidates.</div>';
      candidatesEl.innerHTML = hint;
    } else {
      candidatesEl.innerHTML = '';
      // Candidate cards will be expanded when hiring system is built
    }
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

    // Upgrades placeholder
    var upgradesEl = document.getElementById('shop-upgrades');
    upgradesEl.innerHTML = '<div class="empty-state">Upgrades coming soon.</div>';
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
