/* ============================================
   main.js — Game Init, Screen Management
   ============================================ */

(function() {

  // --- Screen Management ---

  function showScreen(screenId) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    var target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  // --- New Game ---

  function newGame() {
    G = createDefaultState();
    deleteSave();

    // Generate initial pipeline leads
    generatePipelineLeads();

    // Opening log
    addLog('Day 1 (MON) — You quit your job. $500 in the bank. Let\'s build something.', 'info');

    saveGame();
    showScreen('screen-game');
    UI.renderAll();
  }

  // --- Continue Game ---

  function continueGame() {
    if (!loadGame()) return;
    showScreen('screen-game');
    UI.renderAll();
  }

  // --- Init ---

  function init() {
    // Title screen buttons
    document.getElementById('btn-new-game').addEventListener('click', newGame);
    document.getElementById('btn-continue').addEventListener('click', continueGame);

    // Show continue button if save exists
    if (hasSave()) {
      document.getElementById('btn-continue').style.display = '';
    }

    // Tab switching
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function() {
        UI.switchTab(this.getAttribute('data-tab'));
      });
    }

    // End day button
    document.getElementById('btn-end-day').addEventListener('click', function() {
      if (G.gameOver) return;
      // If already pushed through tonight, just end the day
      if (G.pushedThroughTonight) {
        G.pushedThroughTonight = false;
        endDay(true);
      } else {
        showNightPushPrompt();
      }
    });
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
